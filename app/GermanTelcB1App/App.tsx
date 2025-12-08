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
                            <StatusBar barStyle="dark-content" backgroundColor="#000000" translucent={false} />
                            <RootNavigator />
                            <ModalQueueRenderer />
                            <OfflineBlockingModal />
                          </CompletionProvider>
                        </ProgressProvider>>
                      </NotificationReminderProvider>
                    </StreakProvider>
                  </VocabularyProvider>
                </PremiumProvider>
              </AuthProvider>
            </ReviewProvider>
          </AppUpdateProvider>
        </RemoteConfigProvider>
      </ModalQueueProvider>
    </SafeAreaProvider>
  );
};

export default App;
