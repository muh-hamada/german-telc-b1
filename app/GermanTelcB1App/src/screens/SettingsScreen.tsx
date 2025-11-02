import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Platform,
  Linking,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import RNRestart from 'react-native-restart';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { colors, spacing, typography } from '../theme';
import Button from '../components/Button';
import LanguageSelectorModal from '../components/LanguageSelectorModal';
import HourPickerModal from '../components/HourPickerModal';
import { useProgress } from '../contexts/ProgressContext';
import { useAuth } from '../contexts/AuthContext';
import { checkRTLChange } from '../utils/i18n';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import FirestoreService from '../services/firestore.service';

const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { clearUserProgress, isLoading } = useProgress();
  const { user } = useAuth();
  const [isClearing, setIsClearing] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationHour, setNotificationHour] = useState(9); // Default to 9 AM
  const [showHourPicker, setShowHourPicker] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('');

  // Load settings and check permissions when component mounts
  useEffect(() => {
    loadNotificationSettings();
    checkNotificationPermission();
  }, [user]);

  // Load notification settings from Firebase
  const loadNotificationSettings = async () => {
    if (!user?.uid) return;
    
    try {
      setIsLoadingSettings(true);
      const userSettings = await FirestoreService.getUserSettings(user.uid);
      
      if (userSettings?.notificationSettings) {
        setNotificationsEnabled(userSettings.notificationSettings.enabled || false);
        setNotificationHour(userSettings.notificationSettings.hour || 9);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Save notification settings to Firebase
  const saveNotificationSettings = async (enabled: boolean, hour?: number) => {
    if (!user?.uid) return;
    
    try {
      const notificationSettings = {
        enabled,
        hour: hour !== undefined ? hour : notificationHour,
        updatedAt: new Date().toISOString(),
      };
      
      await FirestoreService.updateUserSettings(user.uid, {
        notificationSettings,
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert(t('common.error'), t('settings.saveSettingsError'));
    }
  };

  // Check notification permission status
  const checkNotificationPermission = async () => {
    try {
      if (Platform.OS === 'ios') {
        PushNotificationIOS.checkPermissions((permissions) => {
          setPermissionStatus(permissions.alert ? 'granted' : 'denied');
        });
      } else {
        // Android 13+ requires POST_NOTIFICATIONS permission
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        setPermissionStatus(granted ? 'granted' : 'denied');
      }
    } catch (error) {
      console.error('Error checking notification permission:', error);
      setPermissionStatus('denied');
    }
  };

  // Request notification permission
  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'ios') {
        return new Promise((resolve) => {
          PushNotificationIOS.requestPermissions({
            alert: true,
            badge: true,
            sound: true,
          }).then(
            (permissions) => {
              const granted = permissions.alert || false;
              setPermissionStatus(granted ? 'granted' : 'denied');
              
              if (!granted) {
                Alert.alert(
                  t('settings.permissionDenied'),
                  t('settings.permissionDeniedMessage'),
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    { 
                      text: t('settings.openSettings'),
                      onPress: () => Linking.openURL('app-settings:')
                    }
                  ]
                );
              }
              
              resolve(granted);
            }
          );
        });
      } else {
        // Android 13+ (API level 33)
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
          setPermissionStatus(isGranted ? 'granted' : 'denied');
          
          if (!isGranted) {
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
          }
          
          return isGranted;
        } else {
          // Android < 13 doesn't need explicit permission
          setPermissionStatus('granted');
          return true;
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setPermissionStatus('denied');
      Alert.alert(t('common.error'), t('settings.permissionError'));
      return false;
    }
  };

  const handleClearProgress = () => {
    logEvent(AnalyticsEvents.PROFILE_CLEAR_PROGRESS_PROMPT_SHOWN);
    Alert.alert(
      t('profile.alerts.clearProgressTitle'),
      t('profile.alerts.clearProgressMessage'),
      [
        { text: t('common.cancel'), style: 'cancel', onPress: () => logEvent(AnalyticsEvents.PROFILE_CLEAR_PROGRESS_CANCELLED) },
        {
          text: t('profile.alerts.clear'),
          style: 'destructive',
          onPress: async () => {
            logEvent(AnalyticsEvents.PROFILE_CLEAR_PROGRESS_CONFIRMED);
            setIsClearing(true);
            const success = await clearUserProgress();
            setIsClearing(false);

            if (success) {
              Alert.alert(t('common.success'), t('profile.alerts.progressCleared'));
            } else {
              Alert.alert(t('common.error'), t('profile.alerts.clearFailed'));
            }
          },
        },
      ]
    );
  };

  const handleLanguageChange = () => {
    logEvent(AnalyticsEvents.LANGUAGE_CHANGE_OPENED);
    setShowLanguageModal(true);
  };

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      logEvent(AnalyticsEvents.LANGUAGE_CHANGED, { to: languageCode });
      const needsRestart = checkRTLChange(languageCode);
      await i18n.changeLanguage(languageCode);

      if (needsRestart) {
        // Switching between RTL and LTR requires app restart
        const isGoingToRTL = languageCode === 'ar';
        Alert.alert(
          t('common.success'),
          isGoingToRTL
            ? 'اللغة تم تغييرها بنجاح. سيتم إعادة تشغيل التطبيق الآن لتطبيق اتجاه النص من اليمين إلى اليسار.\n\nLanguage changed successfully. The app will restart now to apply right-to-left layout.'
            : 'Language changed successfully. The app will restart now to apply left-to-right layout.\n\nتم تغيير اللغة بنجاح. سيتم إعادة تشغيل التطبيق الآن لتطبيق اتجاه النص.',
          [
            {
              text: t('common.cancel'),
              style: 'cancel',
            },
            {
              text: 'Restart / إعادة التشغيل',
              style: 'default',
              onPress: () => {
                // Give a small delay to ensure language is saved
                setTimeout(() => {
                  RNRestart.restart();
                }, 100);
              },
            },
          ]
        );
      } else {
        Alert.alert(t('common.success'), t('profile.alerts.languageChanged'));
      }
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(t('common.error'), t('profile.alerts.languageChangeFailed'));
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      // Request permission first
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        return; // Don't enable if permission denied
      }
    }

    setNotificationsEnabled(value);
    
    if (value) {
      logEvent(AnalyticsEvents.SETTINGS_NOTIFICATIONS_ENABLED);
    } else {
      logEvent(AnalyticsEvents.SETTINGS_NOTIFICATIONS_DISABLED);
    }
    
    // Save to Firebase
    await saveNotificationSettings(value);
  };

  const handleHourSelect = async (hour: number) => {
    setNotificationHour(hour);
    logEvent(AnalyticsEvents.SETTINGS_NOTIFICATION_TIME_CHANGED, { 
      hour, 
      minute: 0 
    });
    
    // Save to Firebase
    await saveNotificationSettings(notificationsEnabled, hour);
  };

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12:00 am';
    if (hour === 12) return '12:00 pm';
    if (hour < 12) return `${hour}:00 am`;
    return `${hour - 12}:00 pm`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          <Button
            title={t('profile.changeLanguage')}
            onPress={handleLanguageChange}
            variant="outline"
            style={styles.settingButton}
          />
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
          
          {/* Show message for logged out users */}
          {!user ? (
            <Text style={styles.loggedOutMessage}>
              {t('settings.signInToSaveSettings')}
            </Text>
          ) : (
            <>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>{t('settings.dailyNotification')}</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ false: colors.secondary[200], true: colors.primary[200] }}
                  thumbColor={notificationsEnabled ? colors.primary[500] : colors.secondary[400]}
                  disabled={isLoadingSettings}
                />
              </View>

              {/* Permission Status Indicator */}
              {permissionStatus === 'denied' && notificationsEnabled && (
                <View style={styles.permissionWarning}>
                  <Text style={styles.permissionWarningText}>
                    ⚠️ {t('settings.permissionDeniedMessage')}
                  </Text>
                  <Button
                    title={t('settings.openSettings')}
                    onPress={() => {
                      if (Platform.OS === 'ios') {
                        Linking.openURL('app-settings:');
                      } else {
                        Linking.openSettings();
                      }
                    }}
                    variant="outline"
                    style={styles.openSettingsButton}
                  />
                </View>
              )}

              {notificationsEnabled && permissionStatus === 'granted' && (
                <View style={styles.timeSection}> 
                  <Text style={styles.timeLabel}>{t('settings.notificationTime')}</Text>
                  <Button
                    title={formatHour(notificationHour)}
                    onPress={() => setShowHourPicker(true)}
                    variant="outline"
                    style={styles.timeButton}
                    disabled={isLoadingSettings}
                  />
                </View>
              )}
            </>
          )}

          {/* Custom Hour Picker Modal */}
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.data')}</Text>
          <Button
            title={t('profile.clearProgress')}
            onPress={handleClearProgress}
            variant="outline"
            style={{ ...styles.settingButton, ...styles.dangerButton }}
            disabled={isClearing || isLoading}
          />
        </View>
      </ScrollView>

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        onLanguageSelect={handleLanguageSelect}
      />

      {/* Hour Picker Modal */}
      <HourPickerModal
        visible={showHourPicker}
        selectedHour={notificationHour}
        onClose={() => setShowHourPicker(false)}
        onHourSelect={handleHourSelect}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.padding.lg,
  },
  section: {
    marginBottom: spacing.margin.lg,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  settingButton: {
    marginBottom: spacing.margin.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.sm,
  },
  settingLabel: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  timeSection: {
    marginTop: spacing.margin.sm,
  },
  timeLabel: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.margin.xs,
  },
  timeButton: {
    alignSelf: 'flex-start',
    minWidth: 120,
  },
  loggedOutMessage: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.padding.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.md,
  },
  dangerButton: {
    borderColor: colors.error[500],
  },
  permissionWarning: {
    backgroundColor: colors.warning[100],
    borderRadius: spacing.borderRadius.md,
    padding: spacing.padding.md,
    marginTop: spacing.margin.sm,
    borderWidth: 1,
    borderColor: colors.warning[500],
  },
  permissionWarningText: {
    ...typography.textStyles.body,
    color: colors.warning[700],
    marginBottom: spacing.margin.xs,
  },
  openSettingsButton: {
    borderColor: colors.warning[500],
    marginTop: spacing.margin.xs,
  },
});

export default SettingsScreen;