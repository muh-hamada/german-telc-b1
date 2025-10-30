/**
 * App Rating Utility
 * 
 * Handles opening the native app store for rating
 */

import { Platform, Linking, Alert } from 'react-native';

// Replace these with your actual app IDs
const APP_STORE_ID = '6754566955';
const PLAY_STORE_ID = 'com.mhamada.telcb1german';

export const openAppRating = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      // iOS App Store URL
      const url = `itms-apps://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`;
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      } else {
        console.warn('[AppRating] Cannot open App Store URL');
        return false;
      }
    } else if (Platform.OS === 'android') {
      // Google Play Store URL
      const url = `market://details?id=${PLAY_STORE_ID}`;
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      } else {
        // Fallback to browser if Play Store app is not installed
        const browserUrl = `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`;
        await Linking.openURL(browserUrl);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('[AppRating] Error opening app rating:', error);
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

