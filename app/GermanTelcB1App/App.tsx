import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import mobileAds from 'react-native-google-mobile-ads';
import RootNavigator from './src/navigation/RootNavigator';
import { ProgressProvider } from './src/contexts/ProgressContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { CompletionProvider } from './src/contexts/CompletionContext';
import { ReviewProvider } from './src/contexts/ReviewContext';
import { NotificationReminderProvider } from './src/contexts/NotificationReminderContext';
import { StreakProvider } from './src/contexts/StreakContext';
import { RemoteConfigProvider } from './src/contexts/RemoteConfigContext';
import { VocabularyProvider } from './src/contexts/VocabularyContext';
import ReviewModalContainer from './src/components/ReviewModalContainer';
import NotificationReminderModalContainer from './src/components/NotificationReminderModalContainer';
import StreakModalContainer from './src/components/StreakModalContainer';
import './src/utils/i18n';
import { applyRTLLayout } from './src/utils/i18n';
import { colors } from './src/theme/colors';
import consentService from './src/services/consent.service';
import attService from './src/services/app-tracking-transparency.service';

const App: React.FC = () => {
  useEffect(() => {
    // Apply RTL layout based on saved language
    applyRTLLayout();
    
    // Initialize ads with consent flow
    initializeAdsWithConsent();
  }, []);

  /**
   * Initialize Google Mobile Ads with ATT and UMP consent flow
   * 
   * Order of operations (CRITICAL for Apple compliance):
   * 1. Request App Tracking Transparency (ATT) permission (iOS only)
   * 2. Request GDPR/CCPA consent (UMP)
   * 3. Initialize ads SDK
   */
  const initializeAdsWithConsent = async () => {
    try {
      // Step 1: Request App Tracking Transparency (ATT) permission first (iOS 14+)
      // This MUST be requested before any tracking or data collection
      console.log('[App] Requesting App Tracking Transparency permission...');
      const attStatus = await attService.requestPermission();
      console.log('[App] ATT permission status:', attStatus);

      // Step 2: Request and handle user consent (GDPR/US Privacy)
      console.log('[App] Starting UMP consent flow...');
      
      // Optional: Add test device IDs for development/testing
      // Get your test device ID from console logs on first run
      // Example: await consentService.requestConsent(['YOUR_TEST_DEVICE_ID']);
      const consentStatus = await consentService.requestConsent();
      
      console.log('[App] UMP consent flow completed with status:', consentStatus);
      
      // Step 3: Initialize Google Mobile Ads SDK after all consents
      console.log('[App] Initializing Google Mobile Ads...');
      const adapterStatuses = await mobileAds().initialize();
      console.log('[App] Mobile Ads initialized:', adapterStatuses);
      
      // Log tracking and personalization status
      console.log('[App] === Privacy Status Summary ===');
      console.log(`[App] ATT Status: ${attStatus}`);
      console.log(`[App] UMP Status: ${consentStatus}`);
      
      if (consentService.canShowPersonalizedAds() && attStatus === 'authorized') {
        console.log('[App] ✓ Full tracking enabled - personalized ads allowed');
      } else if (consentService.canShowPersonalizedAds() && attStatus !== 'authorized') {
        console.log('[App] ⚠ Partial tracking - UMP consented but ATT not authorized');
      } else if (attStatus === 'authorized' && !consentService.canShowPersonalizedAds()) {
        console.log('[App] ⚠ Partial tracking - ATT authorized but UMP not consented');
      } else {
        console.log('[App] ⚠ Non-personalized ads only - no tracking consent');
      }
      console.log('[App] ================================');
    } catch (error) {
      console.error('[App] Error during ads initialization:', error);
      // Even if consent fails, try to initialize ads (will use non-personalized)
      try {
        await mobileAds().initialize();
        console.log('[App] Mobile Ads initialized without consent');
      } catch (adsError) {
        console.error('[App] Failed to initialize Mobile Ads:', adsError);
      }
    }
  };

  return (
    <SafeAreaProvider>
      <RemoteConfigProvider>
        <ReviewProvider>
          <AuthProvider>
            <VocabularyProvider>
              <StreakProvider>
                <NotificationReminderProvider>
                  <ProgressProvider>
                    <CompletionProvider>
                      <StatusBar barStyle="dark-content" backgroundColor="#000000" translucent={false} />
                      <RootNavigator />
                      <ReviewModalContainer />
                      <NotificationReminderModalContainer />
                      <StreakModalContainer />
                    </CompletionProvider>
                  </ProgressProvider>
                </NotificationReminderProvider>
              </StreakProvider>
            </VocabularyProvider>
          </AuthProvider>
        </ReviewProvider>
      </RemoteConfigProvider>
    </SafeAreaProvider>
  );
};

export default App;