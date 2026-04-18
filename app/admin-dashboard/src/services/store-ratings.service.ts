import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  limit,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseService } from './firebase.service';

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

/** All app IDs managed by the dashboard */
export const ALL_APP_IDS = [
  'german-a1',
  'german-a2',
  'german-b1',
  'german-b2',
  'english-b1',
  'english-b2',
  'goethe-german-a1',
  'dele-spanish-b1',
] as const;

export type AppId = typeof ALL_APP_IDS[number];

class StoreRatingsService {
  private readonly snapshotCache: Map<string, { data: DailySnapshot[]; ts: number }> = new Map();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  private get db() {
    return firebaseService.getFirestore();
  }

  private get functions() {
    return getFunctions(firebaseService.getApp());
  }

  /**
   * Fetch snapshot history for one app (or null = all apps aggregated).
   */
  async getSnapshots(appId: AppId | null, days: number): Promise<DailySnapshot[]> {
    const cacheKey = `${appId ?? 'all'}-${days}`;
    const cached = this.snapshotCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < this.CACHE_TTL) return cached.data;

    if (appId) {
      const snapshots = await this.fetchAppSnapshots(appId, days);
      this.snapshotCache.set(cacheKey, { data: snapshots, ts: Date.now() });
      return snapshots;
    }

    // Aggregate all apps
    const allResults = await Promise.all(
      ALL_APP_IDS.map(id => this.fetchAppSnapshots(id, days))
    );

    // Build a date-keyed map and sum/average across apps
    const byDate = new Map<string, { iosScoreSum: number; iosCount: number; iosRatings: number; androidScoreSum: number; androidCount: number; androidRatings: number }>();

    for (const appSnapshots of allResults) {
      for (const snap of appSnapshots) {
        const existing = byDate.get(snap.date) ?? {
          iosScoreSum: 0, iosCount: 0, iosRatings: 0,
          androidScoreSum: 0, androidCount: 0, androidRatings: 0,
        };
        if (snap.ios) {
          existing.iosScoreSum += snap.ios.score;
          existing.iosCount += 1;
          existing.iosRatings += snap.ios.ratingsCount;
        }
        if (snap.android) {
          existing.androidScoreSum += snap.android.score;
          existing.androidCount += 1;
          existing.androidRatings += snap.android.ratingsCount;
        }
        byDate.set(snap.date, existing);
      }
    }

    const aggregated: DailySnapshot[] = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        ios: v.iosCount > 0 ? {
          score: v.iosScoreSum / v.iosCount,
          ratingsCount: v.iosRatings,
        } : null,
        android: v.androidCount > 0 ? {
          score: v.androidScoreSum / v.androidCount,
          ratingsCount: v.androidRatings,
          histogram: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        } : null,
      }));

    this.snapshotCache.set(cacheKey, { data: aggregated, ts: Date.now() });
    return aggregated;
  }

  private async fetchAppSnapshots(appId: AppId, days: number): Promise<DailySnapshot[]> {
    const snapshotsRef = collection(
      doc(this.db, 'store_ratings', appId),
      'snapshots'
    );
    const q = query(snapshotsRef, orderBy('date', 'desc'), limit(days));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => d.data() as DailySnapshot)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Fetch reviews via the Firebase Callable Function.
   */
  async fetchReviews(
    appId: AppId,
    platform: 'ios' | 'android',
    pageToken?: string
  ): Promise<ReviewsResult> {
    const fn = httpsCallable<
      { appId: string; platform: string; pageToken?: string },
      ReviewsResult
    >(this.functions, 'fetchAppStoreReviews');
    const result = await fn({ appId, platform, pageToken });
    return result.data;
  }

  /**
   * Manually trigger a snapshot (for testing). Requires admin auth.
   */
  async triggerSnapshot(): Promise<void> {
    const fn = httpsCallable(this.functions, 'triggerStoreRatingsSnapshot');
    await fn({});
  }

  clearCache(): void {
    this.snapshotCache.clear();
  }
}

export const storeRatingsService = new StoreRatingsService();
