import * as functions from 'firebase-functions';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const gplay = require('google-play-scraper').default;

/**
 * Extract the numeric iOS app ID from an App Store URL.
 * E.g. "https://apps.apple.com/us/app/some-app/id123456789" → "123456789"
 */
function extractIosNumericId(url: string): string {
  const match = url.match(/\/id(\d+)/);
  return match ? match[1] : '';
}

/**
 * Extract the Android package name from a Google Play URL.
 * E.g. "https://play.google.com/store/apps/details?id=com.example.app" → "com.example.app"
 */
function extractAndroidPackageName(url: string): string {
  const match = url.match(/[?&]id=([^&]+)/);
  return match ? match[1] : '';
}

/**
 * HTTP Cloud Function to fetch app metadata from iOS App Store or Google Play Store.
 * Called by the admin dashboard when adding apps to the cross-app promotion list.
 *
 * Query params:
 *   - platform: 'ios' | 'android'
 *   - storeUrl: full store URL
 */
export const fetchAppStoreInfo = functions.https.onRequest(
  async (req: functions.https.Request, res: functions.Response) => {
    // Handle CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    const platform = req.query.platform as string;
    const storeUrl = req.query.storeUrl as string;

    if (!platform || !storeUrl) {
      res.status(400).json({
        success: false,
        error: 'Both platform and storeUrl query params are required.',
      });
      return;
    }

    try {
      if (platform === 'ios') {
        const numericId = extractIosNumericId(storeUrl);
        if (!numericId) {
          res.status(400).json({
            success: false,
            error: 'Could not extract app ID from the iOS URL.',
          });
          return;
        }

        const response = await fetch(
          `https://itunes.apple.com/lookup?id=${numericId}`
        );
        if (!response.ok) {
          throw new Error('iTunes API request failed');
        }

        const json = await response.json();
        if (!json.results || json.results.length === 0) {
          res.json({
            success: false,
            error: 'App not found on the App Store',
          });
          return;
        }

        const app = json.results[0];
        res.json({
          success: true,
          title: app.trackName || '',
          subtitle: app.description?.substring(0, 100) || '',
          iconUrl: app.artworkUrl512 || app.artworkUrl100 || '',
        });
      } else if (platform === 'android') {
        const appId = extractAndroidPackageName(storeUrl);
        if (!appId) {
          res.status(400).json({
            success: false,
            error: 'Could not extract package name from the Google Play URL.',
          });
          return;
        }

        const app = await gplay.app({ appId, lang: 'en', country: 'us' });
        res.json({
          success: true,
          title: app.title || '',
          subtitle: app.summary || '',
          iconUrl: app.icon || '',
        });
      } else {
        res.status(400).json({
          success: false,
          error: `Unsupported platform: ${platform}`,
        });
      }
    } catch (error: any) {
      console.error('Error fetching app store info:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch app information',
      });
    }
  }
);
