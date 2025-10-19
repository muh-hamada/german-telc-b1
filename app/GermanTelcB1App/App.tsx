import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import mobileAds from 'react-native-google-mobile-ads';
import RootNavigator from './src/navigation/RootNavigator';
import { ProgressProvider } from './src/contexts/ProgressContext';
import { AuthProvider } from './src/contexts/AuthContext';
import './src/utils/i18n';

const App: React.FC = () => {
  useEffect(() => {
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
          <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
          <RootNavigator />
        </ProgressProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;