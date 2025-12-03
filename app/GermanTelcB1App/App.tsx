import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppUpdateModalContainer from './src/components/AppUpdateModalContainer';
import NotificationReminderModalContainer from './src/components/NotificationReminderModalContainer';
import ReviewModalContainer from './src/components/ReviewModalContainer';
import StreakModalContainer from './src/components/StreakModalContainer';
import { AppUpdateProvider } from './src/contexts/AppUpdateContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { CompletionProvider } from './src/contexts/CompletionContext';
import { NotificationReminderProvider } from './src/contexts/NotificationReminderContext';
import { ProgressProvider } from './src/contexts/ProgressContext';
import { RemoteConfigProvider } from './src/contexts/RemoteConfigContext';
import { ReviewProvider } from './src/contexts/ReviewContext';
import { StreakProvider } from './src/contexts/StreakContext';
import { VocabularyProvider } from './src/contexts/VocabularyContext';
import RootNavigator from './src/navigation/RootNavigator';
import './src/utils/i18n';
import { applyRTLLayout } from './src/utils/i18n';

const App: React.FC = () => {
  useEffect(() => {
    // Apply RTL layout based on saved language
    applyRTLLayout();
  }, []);

  return (
    <SafeAreaProvider>
      <RemoteConfigProvider>
        <AppUpdateProvider>
          <ReviewProvider>
            <AuthProvider>
              <VocabularyProvider>
                <StreakProvider>
                  <NotificationReminderProvider>
                    <ProgressProvider>
                      <CompletionProvider>
                        <StatusBar barStyle="dark-content" backgroundColor="#000000" translucent={false} />
                        <RootNavigator />
                        <AppUpdateModalContainer />
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
        </AppUpdateProvider>
      </RemoteConfigProvider>
    </SafeAreaProvider>
  );
};

export default App;