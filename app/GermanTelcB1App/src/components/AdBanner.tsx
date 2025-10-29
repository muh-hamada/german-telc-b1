import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

// Test Ad Unit IDs - Replace these with your real Ad Unit IDs in production
const adUnitId = __DEV__
  ? TestIds.ADAPTIVE_BANNER // Use test ads in development
  : Platform.select({
      ios: 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy', // Replace with your iOS Ad Unit ID
      android: 'ca-app-pub-5101905792101482/4385105786',
    }) || TestIds.ADAPTIVE_BANNER;

interface AdBannerProps {
  /**
   * Optional style to apply to the container
   */
  style?: any;
  /** Optional screen identifier to attach to analytics */
  screen?: string;
}

/**
 * AdBanner Component
 * Displays a Google AdMob banner ad
 * Uses test ads in development and should use real ads in production
 */
const AdBanner: React.FC<AdBannerProps> = ({ style, screen }) => {
  // Hide ads in ios until the final version is released
  if (Platform.OS === 'ios') {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
          networkExtras: {
            collapsible: 'bottom',
          },
        }}
        onAdLoaded={() => {
          console.log('Banner ad loaded');
          logEvent(AnalyticsEvents.BANNER_AD_LOADED, { screen });
        }}
        onAdFailedToLoad={(error) => {
          console.error('Banner ad failed to load:', error);
          logEvent(AnalyticsEvents.BANNER_AD_FAILED, { screen, error_code: String((error as any)?.code || 'unknown') });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});

export default AdBanner;

