/**
 * SplashBootScreen
 *
 * A full-screen loading overlay that runs the complete app boot sequence
 * BEFORE the user sees any interactive content. This ensures the App Open Ad
 * appears as a splash-to-content transition, which is required by AdMob policy.
 *
 * Boot sequence:
 *  1. Wait for ad-free status to be determined
 *  2. Run GDPR/UMP consent flow (if not already obtained)
 *  3. Request App Tracking Transparency permission (iOS only, if appropriate)
 *  4. Initialize the Google Mobile Ads SDK
 *  5. Load the App Open Ad
 *  6. Show the App Open Ad (splash → ad → app content)
 *  7. Signal boot complete so the app UI becomes reachable
 *
 * A hard timeout (BOOT_TIMEOUT_MS) prevents the splash from blocking forever
 * in case of network errors or slow ad server responses.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileAds from 'react-native-google-mobile-ads';
import { useAppTheme } from '../contexts/ThemeContext';
import { useAdFreeStatus } from '../hooks/useAdFreeStatus';
import { HIDE_ADS } from '../config/development.config';
import attService from '../services/app-tracking-transparency.service';
import appOpenAdService from '../services/app-open-ad.service';
import consentService, { AdsConsentStatus } from '../services/consent.service';

/** Maximum time (ms) to allow the boot sequence before forcing the app open. */
const BOOT_TIMEOUT_MS = 8000;

interface Props {
  onBootComplete: () => void;
}

const SplashBootScreen: React.FC<Props> = ({ onBootComplete }) => {
  const { isAdFree, isLoading: isAdFreeLoading } = useAdFreeStatus();
  const { colors } = useAppTheme();

  // Guards to ensure the sequence runs exactly once and can be cancelled by timeout
  const hasCompletedRef = useRef(false);
  const isBootActiveRef = useRef(true);
  const hasStartedRef = useRef(false);

  const complete = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    isBootActiveRef.current = false;
    onBootComplete();
  }, [onBootComplete]);

  const runBootSequence = useCallback(async (adFree: boolean) => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    try {
      // Step 1: GDPR/UMP consent flow — only runs if consent is not yet known
      const currentConsent = consentService.getConsentStatus();
      if (
        currentConsent !== AdsConsentStatus.OBTAINED &&
        currentConsent !== AdsConsentStatus.NOT_REQUIRED
      ) {
        const consentStatus = await consentService.requestConsent();

        // Step 2: App Tracking Transparency (iOS only)
        // Only request if the user has consented to personalised ads (or is in a
        // non-GDPR region) and has not already responded to the ATT prompt.
        const currentAttStatus = await attService.getStatus();
        const canRequestAtt =
          !consentService.hasUserDeclinedConsent() &&
          (consentService.canShowPersonalizedAds() ||
            consentStatus === AdsConsentStatus.NOT_REQUIRED) &&
          currentAttStatus === 'not-determined';

        if (canRequestAtt) {
          // Brief pause so the UMP dialog is fully dismissed before ATT appears
          await new Promise<void>(resolve => setTimeout(resolve, 500));
          await attService.requestPermission();
        }
      }

      // Step 3: Initialise the Google Mobile Ads SDK
      if (!isBootActiveRef.current) {
        complete();
        return;
      }
      await mobileAds().initialize();

      // Step 4: If ads are disabled, the user is ad-free, or this is the first
      // launch (onboarding), skip the App Open Ad. Showing a full-screen ad to
      // a user who just installed the app is poor UX and not a valid "return to
      // app" trigger per AdMob policy.
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      const isFirstLaunch = hasLaunched === null;
      if (HIDE_ADS || adFree || isFirstLaunch || !isBootActiveRef.current) {
        complete();
        return;
      }

      // Step 5: Load the App Open Ad in the background
      await appOpenAdService.loadAd();

      if (!isBootActiveRef.current) {
        complete();
        return;
      }

      // Step 6: Show the App Open Ad.
      // This is the policy-compliant moment: the ad covers the splash screen and
      // acts as the final loading-to-content transition. The user has not yet seen
      // any interactive app content.
      await appOpenAdService.showAdIfAvailable(adFree);
    } catch (error) {
      console.error('[SplashBootScreen] Boot sequence error:', error);
    } finally {
      complete();
    }
  }, [complete]);

  // Hard timeout — if something goes wrong (no network, slow ad server, etc.)
  // we must not block the user from using the app.
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('[SplashBootScreen] Boot timeout reached, forcing completion');
      complete();
    }, BOOT_TIMEOUT_MS);

    return () => {
      clearTimeout(timeout);
      isBootActiveRef.current = false;
    };
  }, [complete]);

  // Start the boot sequence once the ad-free status has been determined.
  // The dependency on `isAdFree` ensures we capture the correct value even when
  // it resolves asynchronously (e.g. after Firebase Auth loads).
  useEffect(() => {
    if (!isAdFreeLoading) {
      runBootSequence(isAdFree);
    }
  }, [isAdFreeLoading, isAdFree, runBootSequence]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ActivityIndicator size="large" color={colors.primary[500]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SplashBootScreen;
