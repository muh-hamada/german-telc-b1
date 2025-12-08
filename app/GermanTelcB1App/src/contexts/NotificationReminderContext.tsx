import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert, Platform, Linking, PermissionsAndroid } from 'react-native';
import notificationReminderService, { TriggerType } from '../services/notification-reminder.service';
import FirestoreService from '../services/firestore.service';
import FCMService from '../services/fcm.service';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import { useAuth } from './AuthContext';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { useModalQueue } from './ModalQueueContext';

interface NotificationReminderContextType {
  // Actions
  checkAndShowReminder: (triggerType: TriggerType) => Promise<void>;
  dismissReminder: () => void;
  startEnableFlow: () => Promise<void>;
  closeReminderModal: () => void;
  handleHourSelect: (hour: number) => Promise<void>;
  closeHourPicker: () => void;
}

const NotificationReminderContext = createContext<NotificationReminderContextType | undefined>(undefined);

interface NotificationReminderProviderProps {
  children: ReactNode;
}

export const NotificationReminderProvider: React.FC<NotificationReminderProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { t } = useCustomTranslation();
  const { enqueue } = useModalQueue();

  // Record first launch on mount
  useEffect(() => {
    notificationReminderService.recordFirstLaunch();
  }, []);

  /**
   * Check if we should show the reminder and display it if appropriate
   */
  const checkAndShowReminder = async (triggerType: TriggerType): Promise<void> => {
    try {
      console.log('[NotificationReminderContext] Checking reminder for trigger:', triggerType);
      
      // Don't show if user is not logged in (notifications require auth)
      if (!user?.uid) {
        console.log('[NotificationReminderContext] User not logged in, skipping reminder');
        return;
      }

      // Check if we should show the prompt
      const { shouldShow, reason } = await notificationReminderService.shouldShowReminder(triggerType);
      console.log('shouldShow', shouldShow, 'reason', reason);
      
      if (shouldShow) {
        console.log('[NotificationReminderContext] Showing notification reminder');
        
        // Enqueue the notification reminder modal
        enqueue('notification-reminder');
        
        // Update last prompt date
        await notificationReminderService.updateLastPromptDate();
        
        // Mark onboarding prompt as shown if this is onboarding trigger
        if (triggerType === 'onboarding') {
          await notificationReminderService.recordOnboardingPromptShown();
        }
        
        // Log analytics event
        logEvent(AnalyticsEvents.NOTIFICATION_REMINDER_SHOWN, {
          trigger: triggerType,
        });
      } else {
        console.log('[NotificationReminderContext] Not showing reminder:', reason);
      }
    } catch (error) {
      console.error('[NotificationReminderContext] Error checking reminder:', error);
    }
  };

  /**
   * User clicked "Maybe Later"
   */
  const dismissReminder = async (): Promise<void> => {
    try {
      await notificationReminderService.recordMaybeLater();
      
      // Log analytics event
      logEvent(AnalyticsEvents.NOTIFICATION_REMINDER_MAYBE_LATER, {});
      
      console.log('[NotificationReminderContext] Reminder dismissed');
    } catch (error) {
      console.error('[NotificationReminderContext] Error dismissing reminder:', error);
    }
  };

  /**
   * Request notification permission
   */
  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'ios') {
        // For iOS, FCM service handles permission request
        const token = await FCMService.requestPermissionAndGetToken();
        return token !== null;
      } else {
        // Android 13+ (API level 33) requires POST_NOTIFICATIONS permission
        if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: t('settings.notificationPermission'),
              message: t('settings.notificationPermissionMessage'),
              buttonNeutral: t('common.cancel'),
              buttonNegative: t('common.cancel'),
              buttonPositive: t('common.ok'),
            }
          );
          
          const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
          
          if (!isGranted) {
            // Show alert to open settings
            Alert.alert(
              t('settings.permissionDenied'),
              t('settings.permissionDeniedMessage'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                { 
                  text: t('settings.openSettings'),
                  onPress: () => Linking.openSettings()
                }
              ]
            );
            
            logEvent(AnalyticsEvents.NOTIFICATION_REMINDER_PERMISSION_DENIED, {
              platform: 'android'
            });
          }
          
          return isGranted;
        } else {
          // Android < 13 doesn't need explicit permission
          return true;
        }
      }
    } catch (error) {
      console.error('[NotificationReminderContext] Error requesting permission:', error);
      Alert.alert(t('common.error'), t('settings.permissionError'));
      return false;
    }
  };

  /**
   * User chose to enable notifications - start the flow
   */
  const startEnableFlow = async (): Promise<void> => {
    try {
      if (!user?.uid) {
        Alert.alert(t('common.error'), t('settings.signInToSaveSettings'));
        return;
      }

      // Request permission first
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        return;
      }

      // Enqueue hour picker modal
      enqueue('hour-picker', { selectedHour: 9 });
      
      console.log('[NotificationReminderContext] Starting enable flow');
    } catch (error) {
      console.error('[NotificationReminderContext] Error starting enable flow:', error);
    }
  };

  /**
   * User selected notification hour
   */
  const handleHourSelect = async (hour: number): Promise<void> => {
    try {
      if (!user?.uid) {
        console.error('[NotificationReminderContext] No user UID');
        return;
      }

      // Save notification settings to Firebase
      const notificationSettings = {
        enabled: true,
        hour: hour,
        updatedAt: new Date().toISOString(),
      };
      
      await FirestoreService.updateUserSettings(user.uid, {
        notificationSettings,
      });

      // Register FCM token
      try {
        await FCMService.initialize(user.uid);
        console.log('[NotificationReminderContext] FCM token registered successfully');
      } catch (error) {
        console.error('[NotificationReminderContext] Error registering FCM token:', error);
        Alert.alert(
          t('common.error'),
          'Failed to register device for notifications. Please try again.'
        );
        return;
      }

      // Record completion
      await notificationReminderService.recordCompleted();
      
      // Log analytics event
      logEvent(AnalyticsEvents.NOTIFICATION_REMINDER_ENABLED, {
        hour,
      });
      
      // Show success message
      Alert.alert(
        t('common.success'),
        t('notificationReminder.enabledSuccessMessage')
      );

      console.log('[NotificationReminderContext] Notifications enabled successfully');
    } catch (error) {
      console.error('[NotificationReminderContext] Error handling hour select:', error);
      Alert.alert(t('common.error'), t('settings.saveSettingsError'));
    }
  };

  /**
   * Close the reminder modal without action
   */
  const closeReminderModal = (): void => {
    // No-op since modal visibility is controlled by ModalQueueContext
  };

  /**
   * Close hour picker without saving
   */
  const closeHourPicker = (): void => {
    // No-op since modal visibility is controlled by ModalQueueContext
  };

  const value: NotificationReminderContextType = {
    checkAndShowReminder,
    dismissReminder,
    startEnableFlow,
    closeReminderModal,
    handleHourSelect,
    closeHourPicker,
  };

  return (
    <NotificationReminderContext.Provider value={value}>
      {children}
    </NotificationReminderContext.Provider>
  );
};

// Hook to use the context
export const useNotificationReminder = (): NotificationReminderContextType => {
  const context = useContext(NotificationReminderContext);
  if (context === undefined) {
    throw new Error('useNotificationReminder must be used within a NotificationReminderProvider');
  }
  return context;
};
