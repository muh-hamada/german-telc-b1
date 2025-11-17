import React, { useMemo } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import { activeExamConfig } from '../config/active-exam.config';
import DeviceInfo from 'react-native-device-info';
import consentService from '../services/consent.service';
import { HIDE_ADS } from '../config/development.config';
import { useStreak } from '../contexts/StreakContext';
import { useRemoteConfig } from '../contexts/RemoteConfigContext';

// Test Ad Unit IDs - Replace these with your real Ad Unit IDs in production
const adUnitId = __DEV__
  ? TestIds.ADAPTIVE_BANNER // Use test ads in development
  : Platform.select({
      ios: activeExamConfig.ads.banner.ios,
      android: activeExamConfig.ads.banner.android,
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
 * 
 * Optimized with React.memo and useMemo to prevent unnecessary re-renders
 * and reduce excessive ad requests that can cause "no-fill" errors.
 */
const AdBanner: React.FC<AdBannerProps> = ({ style, screen }) => {
  const { adFreeStatus } = useStreak();
  const { config } = useRemoteConfig();
  
  // Check if ads should be hidden
  if (HIDE_ADS) {
    return null;
  }
  
  // Check if user has active ad-free period from streaks
  if (config?.enableStreaks && adFreeStatus.isActive) {
    console.log('[AdBanner] Ad-free period active, hiding ad');
    return null;
  }

  // Memoize app version to prevent recalculation on every render
  const appVersion = useMemo(() => DeviceInfo.getVersion(), []);

  // Determine if we should request non-personalized ads based on consent
  const requestNonPersonalizedAdsOnly = useMemo(() => {
    const shouldRequestNonPersonalized = consentService.shouldRequestNonPersonalizedAds();
    console.log(`[AdBanner] Requesting ${shouldRequestNonPersonalized ? 'NON-PERSONALIZED' : 'PERSONALIZED'} ads for screen: ${screen || 'default'}`);
    return shouldRequestNonPersonalized;
  }, [screen]);

  // Memoize callbacks to prevent BannerAd from re-rendering unnecessarily
  const handleAdLoaded = useMemo(() => {
    return () => {
      console.log('Banner ad loaded');
      logEvent(AnalyticsEvents.BANNER_AD_LOADED, { 
        screen, 
        version: appVersion,
        personalized: !requestNonPersonalizedAdsOnly 
      });
    };
  }, [screen, appVersion, requestNonPersonalizedAdsOnly]);

  const handleAdFailedToLoad = useMemo(() => {
    return (error: any) => {
      console.error('Banner ad failed to load:', error);
      logEvent(AnalyticsEvents.BANNER_AD_FAILED, { 
        screen, 
        version: appVersion, 
        error_code: String(error?.code || 'unknown'),
        personalized: !requestNonPersonalizedAdsOnly
      });
    };
  }, [screen, appVersion, requestNonPersonalizedAdsOnly]);

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        key={`banner-${screen || 'default'}`}
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: requestNonPersonalizedAdsOnly,
          // TODO: enabled collapsible again but in specific screens only
          // Today it's disabled globally because it's very annoying in some screens
          networkExtras: {},
        }}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
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

// Wrap with React.memo to prevent re-renders when props haven't changed
export default React.memo(AdBanner);

