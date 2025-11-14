/**
 * App Rating Utility
 * 
 * Handles opening the native app store for rating
 */

import { Platform, Linking } from 'react-native';
import { activeExamConfig } from '../config/active-exam.config';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

// Replace these with your actual app IDs
const APP_STORE_ID = activeExamConfig.storeIds.ios;
const PLAY_STORE_ID = activeExamConfig.storeIds.android;

export const openAppRating = async (source: string): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      // iOS App Store URL
      const url = `itms-apps://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`;
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
        logEvent(AnalyticsEvents.APP_RATING_OPENED, { source });
        return true;
      } else {
        console.warn('[AppRating] Cannot open App Store URL');
        logEvent(AnalyticsEvents.APP_RATING_FAILED, { source, error: 'cannot_open_url' });
        return false;
      }
    } else if (Platform.OS === 'android') {
      // Google Play Store URL
      const url = `market://details?id=${PLAY_STORE_ID}`;
      console.log('[AppRating] Opening Google Play Store URL:', url);
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
        logEvent(AnalyticsEvents.APP_RATING_OPENED, { source });
        return true;
      } else {
        // Fallback to browser if Play Store app is not installed
        const browserUrl = `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`;
        await Linking.openURL(browserUrl);
        logEvent(AnalyticsEvents.APP_RATING_OPENED, { fallback: true, source });
        return true;
      }
    }
    
    logEvent(AnalyticsEvents.APP_RATING_FAILED, { source, error: 'unknown_error' });
    return false;
  } catch (error: any) {
    console.error('[AppRating] Error opening app rating:', error);
    logEvent(AnalyticsEvents.APP_RATING_FAILED, { source, error: error.message || error || 'unknown_error' });
    return false;
  }
};

/**
 * Get the app store URL for the current platform
 */
export const getAppStoreUrl = (): string => {
  if (Platform.OS === 'ios') {
    return `https://apps.apple.com/app/id${APP_STORE_ID}`;
  } else if (Platform.OS === 'android') {
    return `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`;
  }
  return '';
};

