import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { ProgressProvider } from './src/contexts/ProgressContext';
import { AuthProvider } from './src/contexts/AuthContext';
import './src/utils/i18n';

const App: React.FC = () => {
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