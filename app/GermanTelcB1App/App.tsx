import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import mobileAds from 'react-native-google-mobile-ads';
import RootNavigator from './src/navigation/RootNavigator';
import { ProgressProvider } from './src/contexts/ProgressContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { CompletionProvider } from './src/contexts/CompletionContext';
import './src/utils/i18n';
import { applyRTLLayout } from './src/utils/i18n';
import { colors } from './src/theme/colors';

const App: React.FC = () => {
  useEffect(() => {
    // Apply RTL layout based on saved language
    applyRTLLayout();
    
    // Initialize Google Mobile Ads SDK
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('Mobile Ads initialized:', adapterStatuses);
      })
      .catch(error => {
        console.error('Failed to initialize Mobile Ads:', error);
      });
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProgressProvider>
          <CompletionProvider>
            {/* <StatusBar barStyle="light-content" backgroundColor={colors.primary[500]} /> */}
            <RootNavigator />
          </CompletionProvider>
        </ProgressProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;