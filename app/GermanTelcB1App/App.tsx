import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ModalQueueRenderer from './src/components/ModalQueueRenderer';
import OfflineBlockingModal from './src/components/OfflineBlockingModal';
import { AppUpdateProvider } from './src/contexts/AppUpdateContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { CompletionProvider } from './src/contexts/CompletionContext';
import { ModalQueueProvider } from './src/contexts/ModalQueueContext';
import { NotificationReminderProvider } from './src/contexts/NotificationReminderContext';
import { PremiumProvider } from './src/contexts/PremiumContext';
import { ProgressProvider } from './src/contexts/ProgressContext';
import { RemoteConfigProvider } from './src/contexts/RemoteConfigContext';
import { ReviewProvider } from './src/contexts/ReviewContext';
import { StreakProvider } from './src/contexts/StreakContext';
import { VocabularyProvider } from './src/contexts/VocabularyContext';
import { ThemeProvider, useAppTheme } from './src/contexts/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import './src/utils/i18n';
import { applyRTLLayout } from './src/utils/i18n';

const AppContent: React.FC = () => {
  const { colors, mode } = useAppTheme();

  return (
    <>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background.primary}
        translucent={false}
      />
      <RootNavigator />
      <ModalQueueRenderer />
      <OfflineBlockingModal />
    </>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    // Apply RTL layout based on saved language
    applyRTLLayout();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ModalQueueProvider>
          <RemoteConfigProvider>
            <AppUpdateProvider>
              <ReviewProvider>
                <AuthProvider>
                  <PremiumProvider>
                    <VocabularyProvider>
                      <StreakProvider>
                        <NotificationReminderProvider>
                          <ProgressProvider>
                            <CompletionProvider>
                              <AppContent />
                            </CompletionProvider>
                          </ProgressProvider>
                        </NotificationReminderProvider>
                      </StreakProvider>
                    </VocabularyProvider>
                  </PremiumProvider>
                </AuthProvider>
              </ReviewProvider>
            </AppUpdateProvider>
          </RemoteConfigProvider>
        </ModalQueueProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
