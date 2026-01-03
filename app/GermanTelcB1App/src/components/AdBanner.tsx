import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Platform, StyleSheet, View, AppState } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { activeExamConfig } from '../config/active-exam.config';
import { HIDE_ADS } from '../config/development.config';
import { useAuth } from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';
import { useRemoteConfig } from '../contexts/RemoteConfigContext';
import { useStreak } from '../contexts/StreakContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import consentService from '../services/consent.service';
import memoryMonitorService from '../services/memory-monitor.service';
import { ThemeColors } from '../theme';

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
 * 
 * Memory Management:
 * - Uses key prop to force new ad instance only when screen changes
 * - Properly unmounts ad when component is destroyed
 * - Monitors app state and recreates ad on foreground to prevent stale ads
 * - Prevents multiple banner ad instances from accumulating in memory
 */
const AdBanner: React.FC<AdBannerProps> = ({ style, screen }) => {
  const { user } = useAuth();
  const { adFreeStatus } = useStreak();
  const { isStreaksEnabledForUser } = useRemoteConfig();
  const { isPremium } = usePremium();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  // Track if component is mounted to prevent memory leaks
  const isMountedRef = useRef(true);
  // Use screen name as stable key - only changes when screen changes
  const adKeyRef = useRef(`banner-${screen || 'default'}`);
  // Track app state for background/foreground handling
  const [appState, setAppState] = useState(AppState.currentState);
  // Force ad refresh on app state change
  const [adRefreshKey, setAdRefreshKey] = useState(0);

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

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    isMountedRef.current = true;
    console.log(`[AdBanner] Mounted for screen: ${screen || 'default'}`);

    return () => {
      isMountedRef.current = false;
      console.log(`[AdBanner] Unmounting for screen: ${screen || 'default'} - cleaning up ad resources`);
      // The BannerAd component will handle its own cleanup when unmounted via key change
      // This ensures we don't try to update state after unmount
    };
  }, [screen]);

  // Monitor app state changes - refresh ad when coming back from background
  // This prevents stale ads and clears memory from old ad instances
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[AdBanner] App came to foreground - refreshing ad to clear memory');
        // Force ad refresh by changing key - old ad will be garbage collected
        setAdRefreshKey(prev => prev + 1);
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [appState]);

  // Listen for low memory warnings and refresh ad to free up memory
  useEffect(() => {
    const unsubscribe = memoryMonitorService.addMemoryWarningListener(() => {
      console.log('[AdBanner] Low memory warning - refreshing ad to free memory');
      logEvent(AnalyticsEvents.BANNER_AD_FAILED, {
        screen,
        version: appVersion,
        error_code: 'low_memory_refresh',
        personalized: !requestNonPersonalizedAdsOnly,
      });
      // Force ad refresh - old ad will be destroyed and memory freed
      setAdRefreshKey(prev => prev + 1);
    });

    return unsubscribe;
  }, [screen, appVersion, requestNonPersonalizedAdsOnly]);

  // Check if ads should be hidden
  if (HIDE_ADS) {
    return null;
  }
  
  // Check if user has premium subscription
  if (isPremium) {
    console.log('[AdBanner] Premium user, hiding ad');
    return null;
  }
  
  // Check if user has active ad-free period from streaks
  if (isStreaksEnabledForUser(user?.uid) && adFreeStatus.isActive) {
    console.log('[AdBanner] Ad-free period active, hiding ad');
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        key={`${adKeyRef.current}-${adRefreshKey}`}
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center', 
    backgroundColor: colors.background.secondary,
  },
});

// Wrap with React.memo to prevent re-renders when props haven't changed
export default React.memo(AdBanner);

