import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as jwt from 'jsonwebtoken';
import { google } from 'googleapis';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const gplay = require('google-play-scraper').default;

if (!admin.apps.length) {
  admin.initializeApp();
}

// ─── Store ID map ─────────────────────────────────────────────────────────────

const STORE_ID_MAP: Record<string, { iosNumericId: string; androidPackageName: string }> = {
  'german-a1':        { iosNumericId: '6756783649', androidPackageName: 'com.mhamada.telca1german' },
  'german-a2':        { iosNumericId: '6759285601', androidPackageName: 'com.mhamada.telca2german' },
  'german-b1':        { iosNumericId: '6754566955', androidPackageName: 'com.mhamada.telcb1german' },
  'german-b2':        { iosNumericId: '6755521000', androidPackageName: 'com.mhamada.telcb2german' },
  'english-b1':       { iosNumericId: '6755912773', androidPackageName: 'com.mhamada.telcb1english' },
  'english-b2':       { iosNumericId: '6756295159', androidPackageName: 'com.mhamada.telcb2english' },
  'goethe-german-a1': { iosNumericId: '6759726606', androidPackageName: 'com.mhamada.goethea1german' },
  'dele-spanish-b1':  { iosNumericId: '6758210099', androidPackageName: 'com.mhamada.deleb1spanish' },
};

// Non-sensitive App Store Connect identifiers
const APPSTORE_KEY_ID = 'W66Q88HFD5';
const APPSTORE_ISSUER_ID = '2b8c8cb3-108e-4e65-a2ca-aab0423cd839';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IosSnapshot {
  score: number;
  ratingsCount: number;
}

export interface AndroidSnapshot {
  score: number;
  ratingsCount: number;
  histogram: { '1': number; '2': number; '3': number; '4': number; '5': number };
}

export interface DailySnapshot {
  date: string;
  fetchedAt: admin.firestore.Timestamp;
  ios: IosSnapshot | null;
  android: AndroidSnapshot | null;
}

export interface StoreReview {
  id: string;
  author: string;
  rating: number;
  title?: string;
  body: string;
  date: string;
}

export interface ReviewsResult {
  reviews: StoreReview[];
  nextPageToken: string | null;
}

// ─── iOS helpers ──────────────────────────────────────────────────────────────

function buildAppStoreJwt(p8Key: string): string {
  return jwt.sign(
    { iss: APPSTORE_ISSUER_ID, aud: 'appstoreconnect-v1' },
    p8Key,
    {
      algorithm: 'ES256',
      expiresIn: '20m',
      header: { alg: 'ES256', kid: APPSTORE_KEY_ID, typ: 'JWT' },
    } as jwt.SignOptions
  );
}

async function fetchIosStats(numericId: string): Promise<IosSnapshot | null> {
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${numericId}&country=us`);
    const json = await res.json();
    const app = json?.results?.[0];
    if (!app) return null;
    return {
      score: app.averageUserRating ?? 0,
      ratingsCount: app.userRatingCount ?? 0,
    };
  } catch (err) {
    console.error(`[store-ratings] iOS stats error id=${numericId}:`, err);
    return null;
  }
}

async function fetchIosReviews(
  numericId: string,
  jwtToken: string,
  pageLink?: string
): Promise<ReviewsResult> {
  const url = pageLink
    ?? `https://api.appstoreconnect.apple.com/v1/apps/${numericId}/customerReviews?sort=-createdDate&limit=50&fields[customerReviews]=title,body,rating,createdDate,reviewerNickname`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${jwtToken}` } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`App Store Connect API ${res.status}: ${text}`);
  }
  const json = await res.json();
  return {
    reviews: (json.data ?? []).map((r: any) => ({
      id: r.id,
      author: r.attributes?.reviewerNickname ?? 'Anonymous',
      rating: r.attributes?.rating ?? 0,
      title: r.attributes?.title,
      body: r.attributes?.body ?? '',
      date: r.attributes?.createdDate ?? new Date().toISOString(),
    })),
    nextPageToken: json.links?.next ?? null,
  };
}

// ─── Android helpers ──────────────────────────────────────────────────────────

async function fetchAndroidStats(packageName: string): Promise<AndroidSnapshot | null> {
  try {
    const info = await gplay.app({ appId: packageName, country: 'us', lang: 'en' });
    return {
      score: info.score ?? 0,
      ratingsCount: info.ratings ?? 0,
      histogram: {
        '1': info.histogram?.[1] ?? 0,
        '2': info.histogram?.[2] ?? 0,
        '3': info.histogram?.[3] ?? 0,
        '4': info.histogram?.[4] ?? 0,
        '5': info.histogram?.[5] ?? 0,
      },
    };
  } catch (err) {
    console.error(`[store-ratings] Android stats error pkg=${packageName}:`, err);
    return null;
  }
}

async function fetchAndroidReviews(
  packageName: string,
  pageToken?: string
): Promise<ReviewsResult> {
  const serviceAccountJson = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    throw new functions.https.HttpsError('internal', 'GOOGLE_PLAY_SERVICE_ACCOUNT secret not configured');
  }
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(serviceAccountJson),
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  const androidpublisher = google.androidpublisher({ version: 'v3', auth });
  const res = await androidpublisher.reviews.list({
    packageName,
    maxResults: 50,
    ...(pageToken ? { token: pageToken } : {}),
  });
  const reviews = (res.data.reviews ?? []).map((r: any) => {
    const comment = r.comments?.[0]?.userComment;
    return {
      id: r.reviewId ?? String(Date.now() + Math.random()),
      author: r.authorName ?? 'Anonymous',
      rating: comment?.starRating ?? 0,
      title: undefined,
      body: comment?.text ?? '',
      date: comment?.lastModified?.seconds
        ? new Date(Number(comment.lastModified.seconds) * 1000).toISOString()
        : new Date().toISOString(),
    };
  });
  return {
    reviews,
    nextPageToken: res.data.tokenPagination?.nextPageToken ?? null,
  };
}

// ─── Core snapshot logic ──────────────────────────────────────────────────────

async function runSnapshot(): Promise<void> {
  const db = admin.firestore();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const appIds = Object.keys(STORE_ID_MAP);

  console.log(`[store-ratings] Starting snapshot for ${appIds.length} apps, date=${today}`);

  for (const appId of appIds) {
    const { iosNumericId, androidPackageName } = STORE_ID_MAP[appId];

    const [iosResult, androidResult] = await Promise.allSettled([
      fetchIosStats(iosNumericId),
      fetchAndroidStats(androidPackageName),
    ]);

    const snapshot: DailySnapshot = {
      date: today,
      fetchedAt: admin.firestore.Timestamp.now(),
      ios: iosResult.status === 'fulfilled' ? iosResult.value : null,
      android: androidResult.status === 'fulfilled' ? androidResult.value : null,
    };

    await db
      .collection('store_ratings')
      .doc(appId)
      .collection('snapshots')
      .doc(today)
      .set(snapshot, { merge: true });

    console.log(`[store-ratings] Saved ${appId}: ios=${snapshot.ios?.score ?? 'err'} android=${snapshot.android?.score ?? 'err'}`);

    // Avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 600));
  }

  console.log('[store-ratings] Snapshot complete');
}

// ─── Cloud Functions ──────────────────────────────────────────────────────────

/**
 * Daily scheduled snapshot — runs at 03:00 UTC every day.
 */
export const scheduledStoreRatingsSnapshot = functions
  .runWith({ timeoutSeconds: 300, memory: '256MB' })
  .pubsub.schedule('0 3 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    await runSnapshot();
  });

/**
 * Manually trigger a snapshot (for testing / backfill). Auth required.
 */
export const triggerStoreRatingsSnapshot = functions
  .runWith({ timeoutSeconds: 300, memory: '256MB' })
  .https.onCall(async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }
    await runSnapshot();
    return { success: true };
  });

/**
 * Fetch reviews for an app + platform. iOS requires APPSTORE_P8_KEY secret.
 * Params: { appId: string, platform: 'ios'|'android', pageToken?: string }
 */
export const fetchAppStoreReviews = functions
  .runWith({ secrets: ['APPSTORE_P8_KEY', 'GOOGLE_PLAY_SERVICE_ACCOUNT'], timeoutSeconds: 60, memory: '256MB' })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }

    const { appId, platform, pageToken } = data as {
      appId: string;
      platform: 'ios' | 'android';
      pageToken?: string;
    };

    const storeIds = STORE_ID_MAP[appId];
    if (!storeIds) {
      throw new functions.https.HttpsError('invalid-argument', `Unknown appId: ${appId}`);
    }

    if (platform === 'ios') {
      const rawKey = process.env.APPSTORE_P8_KEY;
      if (!rawKey) {
        throw new functions.https.HttpsError('internal', 'APPSTORE_P8_KEY secret not configured');
      }
      const p8Key = rawKey.replace(/\\n/g, '\n');
      const jwtToken = buildAppStoreJwt(p8Key);
      return fetchIosReviews(storeIds.iosNumericId, jwtToken, pageToken);
    } else {
      return fetchAndroidReviews(storeIds.androidPackageName, pageToken);
    }
  });
