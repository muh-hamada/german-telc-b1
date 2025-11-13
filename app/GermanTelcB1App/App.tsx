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
import ReviewModalContainer from './src/components/ReviewModalContainer';
import NotificationReminderModalContainer from './src/components/NotificationReminderModalContainer';
import './src/utils/i18n';
import { applyRTLLayout } from './src/utils/i18n';
import { colors } from './src/theme/colors';
import consentService from './src/services/consent.service';

const App: React.FC = () => {
  useEffect(() => {
    // Apply RTL layout based on saved language
    applyRTLLayout();
    
    // Initialize ads with consent flow
    initializeAdsWithConsent();
  }, []);

  /**
   * Initialize Google Mobile Ads with UMP consent flow
   * Consent must be obtained before initializing the ads SDK
   */
  const initializeAdsWithConsent = async () => {
    try {
      // Step 1: Request and handle user consent (GDPR/US Privacy)
      console.log('[App] Starting consent flow...');
      
      // Optional: Add test device IDs for development/testing
      // Get your test device ID from console logs on first run
      // Example: await consentService.requestConsent(['YOUR_TEST_DEVICE_ID']);
      const consentStatus = await consentService.requestConsent();
      
      console.log('[App] Consent flow completed with status:', consentStatus);
      
      // Step 2: Initialize Google Mobile Ads SDK after consent
      console.log('[App] Initializing Google Mobile Ads...');
      const adapterStatuses = await mobileAds().initialize();
      console.log('[App] Mobile Ads initialized:', adapterStatuses);
      
      // Log whether we can show personalized ads
      if (consentService.canShowPersonalizedAds()) {
        console.log('[App] ✓ Personalized ads enabled - user has given consent');
      } else {
        console.log('[App] ⚠ Non-personalized ads only - no consent obtained');
      }
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
      <ReviewProvider>
        <AuthProvider>
          <NotificationReminderProvider>
            <ProgressProvider>
              <CompletionProvider>
                <StatusBar barStyle="dark-content" backgroundColor="#000000" translucent={false} />
                <RootNavigator />
                <ReviewModalContainer />
                <NotificationReminderModalContainer />
              </CompletionProvider>
            </ProgressProvider>
          </NotificationReminderProvider>
        </AuthProvider>
      </ReviewProvider>
    </SafeAreaProvider>
  );
};

export default App;