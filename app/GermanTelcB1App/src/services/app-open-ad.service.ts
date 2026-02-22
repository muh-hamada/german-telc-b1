/**
 * App Open Ad Service
 * 
 * Manages AdMob App Open Ads that appear when users return to the app.
 * These ads are designed to monetize app launch and resume events.
 * 
 * Key Features:
 * - Loads and caches an App Open Ad
 * - Shows ad when appropriate (e.g., when reaching main screen)
 * - Respects premium status (no ads for premium users)
 * - Prevents ad spam with cooldown period
 * - Handles ad lifecycle events and errors
 * 
 * Usage:
 * 1. Call loadAd() to preload an ad in the background
 * 2. Call showAdIfAvailable() when user reaches main screen
 * 3. Service will automatically reload ads after they're shown
 */

import { Platform } from 'react-native';
import { AppOpenAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { activeExamConfig } from '../config/active-exam.config';
import { AnalyticsEvents, logEvent } from './analytics.events';
import consentService from './consent.service';

const __DEV__ = process.env.NODE_ENV === 'development';

// Ad unit IDs from active exam config
const APP_OPEN_AD_UNIT_ID = __DEV__
  ? TestIds.APP_OPEN
  : Platform.select({
      ios: activeExamConfig.ads.appOpen.ios,
      android: activeExamConfig.ads.appOpen.android,
    })!;

class AppOpenAdService {
  private appOpenAd: AppOpenAd | null = null;
  private isLoadingAd = false;
  private isShowingAd = false;
  private lastAdShownTime = 0;
  private readonly AD_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours between ads
  private loadPromise: Promise<void> | null = null; // Track loading promise

  constructor() {
    console.log('[AppOpenAd] Service initialized with unit ID:', APP_OPEN_AD_UNIT_ID);
  }

  /**
   * Load an App Open Ad
   * This should be called in the background to have an ad ready
   * Returns a promise that resolves when the ad is loaded or fails
   */
  async loadAd(): Promise<void> {
    // If already loading, return the existing promise
    if (this.loadPromise) {
      console.log('[AppOpenAd] Ad is already loading, waiting for it...');
      return this.loadPromise;
    }

    // Don't load if showing
    if (this.isShowingAd) {
      console.log('[AppOpenAd] Ad is showing, skipping load');
      return;
    }

    // Don't load if we already have a loaded ad
    if (this.appOpenAd?.loaded) {
      console.log('[AppOpenAd] Ad already loaded and ready');
      return;
    }

    // Create a promise that resolves when ad loads or fails
    this.loadPromise = new Promise<void>((resolve, reject) => {
      try {
        this.isLoadingAd = true;
        console.log('[AppOpenAd] Starting to load ad...');

        // Create new AppOpenAd instance
        this.appOpenAd = AppOpenAd.createForAdRequest(APP_OPEN_AD_UNIT_ID, {
          requestNonPersonalizedAdsOnly: !consentService.canShowPersonalizedAds(),
        });

        // Set up event listeners
        this.appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
          console.log('[AppOpenAd] Ad loaded successfully');
          this.isLoadingAd = false;
          this.loadPromise = null;
          
          logEvent(AnalyticsEvents.APP_OPEN_AD_LOADED);
          resolve(); // Resolve the promise when ad is loaded
        });

        this.appOpenAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
          console.error('[AppOpenAd] Ad failed to load:', error);
          this.isLoadingAd = false;
          this.appOpenAd = null;
          this.loadPromise = null;
          
          logEvent(AnalyticsEvents.APP_OPEN_AD_FAILED_TO_LOAD, {
            error_code: error?.code || 'unknown',
            error_message: error?.message || String(error),
          });
          resolve(); // Resolve anyway (don't block the app)
        });

        // Ad opened (shown to user)
        this.appOpenAd.addAdEventListener(AdEventType.OPENED, () => {
          console.log('[AppOpenAd] Ad opened');
        });

        // Ad closed by user
        this.appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
          console.log('[AppOpenAd] Ad closed');
          this.isShowingAd = false;
          
          logEvent(AnalyticsEvents.APP_OPEN_AD_CLOSED);
        });

        // Load the ad
        this.appOpenAd.load();
        
        logEvent(AnalyticsEvents.APP_OPEN_AD_REQUESTED, {
          ad_unit_id: APP_OPEN_AD_UNIT_ID,
        });
      } catch (error) {
        console.error('[AppOpenAd] Error loading ad:', error);
        this.isLoadingAd = false;
        this.appOpenAd = null;
        this.loadPromise = null;
        
        logEvent(AnalyticsEvents.APP_OPEN_AD_ERROR, {
          error: String(error),
        });
        resolve(); // Resolve anyway (don't block the app)
      }
    });

    return this.loadPromise;
  }

  /**
   * Show the App Open Ad if available and conditions are met
   * @param isAdFree - Whether the user has any ad-free status (premium, gift, or streak)
   * @returns Promise<boolean> - True if ad was shown, false otherwise
   */
  async showAdIfAvailable(isAdFree: boolean): Promise<boolean> {
    // Don't show ads to users with ad-free status
    if (isAdFree) {
      console.log('[AppOpenAd] User has ad-free status, not showing ad');
      return false;
    }

    // Check if ad is already showing
    if (this.isShowingAd) {
      console.log('[AppOpenAd] Ad is already showing');
      return false;
    }

    // Check cooldown period
    const now = Date.now();
    const timeSinceLastAd = now - this.lastAdShownTime;
    if (timeSinceLastAd < this.AD_COOLDOWN_MS) {
      const remainingMinutes = Math.ceil((this.AD_COOLDOWN_MS - timeSinceLastAd) / 60000);
      console.log(`[AppOpenAd] Ad cooldown active, ${remainingMinutes} minutes remaining`);
      return false;
    }

    // Check if ad is loaded and ready
    if (!this.appOpenAd || !this.appOpenAd.loaded) {
      console.log('[AppOpenAd] No ad loaded or not ready');
      this.loadAd(); // Load for next time
      return false;
    }

    try {
      this.isShowingAd = true;
      console.log('[AppOpenAd] Showing app open ad...');
      
      logEvent(AnalyticsEvents.APP_OPEN_AD_SHOWN);
      
      // Show the ad
      await this.appOpenAd.show();
      
      // Update last shown time
      this.lastAdShownTime = Date.now();
      
      // Clean up - ad can only be shown once
      this.appOpenAd = null;
      this.isShowingAd = false;
      
      // Load next ad
      this.loadAd();
      
      return true;
    } catch (error) {
      console.error('[AppOpenAd] Error showing ad:', error);
      this.isShowingAd = false;
      this.appOpenAd = null;
      
      logEvent(AnalyticsEvents.APP_OPEN_AD_ERROR, {
        error: String(error),
      });
      
      return false;
    }
  }

  /**
   * Check if an ad is currently loaded and ready to show
   */
  isAdLoaded(): boolean {
    return this.appOpenAd?.loaded ?? false;
  }

  /**
   * Reset the cooldown timer (useful for testing)
   */
  resetCooldown(): void {
    this.lastAdShownTime = 0;
    console.log('[AppOpenAd] Cooldown reset');
  }
}

// Export singleton instance
export default new AppOpenAdService();
