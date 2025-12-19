import React, { useState, useEffect, useMemo } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { useLanguageChange } from '../hooks/useLanguageChange';
// import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { spacing, typography, type ThemeColors } from '../theme';
import Button from '../components/Button';
import LanguageSelectorModal from '../components/LanguageSelectorModal';
import RestartAppModal from '../components/RestartAppModal';
import HourPickerModal from '../components/HourPickerModal';
import DeleteAccountModal from '../components/DeleteAccountModal';
import AccountDeletionInProgressModal from '../components/AccountDeletionInProgressModal';
import PremiumDarkModeModal from '../components/PremiumDarkModeModal';
import { useProgress } from '../contexts/ProgressContext';
import { useAuth } from '../contexts/AuthContext';
import { checkRTLChange } from '../utils/i18n';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import FirestoreService, { DEFAULT_NOTIFICATION_HOUR } from '../services/firestore.service';
import FCMService from '../services/fcm.service';
import consentService, { AdsConsentStatus } from '../services/consent.service';
import attService, { TrackingStatus } from '../services/app-tracking-transparency.service';
import { activeExamConfig } from '../config/active-exam.config';
import { usePremium } from '../contexts/PremiumContext';
import { useRemoteConfig } from '../contexts/RemoteConfigContext';
import OfflineDownloadSection from '../components/OfflineDownloadSection';
import { useAppTheme } from '../contexts/ThemeContext';

const SettingsScreen: React.FC = () => {
  const { t, i18n } = useCustomTranslation();
  const navigation = useNavigation();
  const { clearUserProgress, isLoading } = useProgress();
  const { user, isLoading: authLoading } = useAuth();
  const { isPremium } = usePremium();
  const { isPremiumFeaturesEnabled } = useRemoteConfig();
  const { colors, mode: themeMode, setTheme, isLoading: isThemeLoading } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDarkMode = themeMode === 'dark';
  const {
    isRestartModalVisible,
    isGoingToRTL,
    handleLanguageChange: handleLanguageChangeWithRestart,
    handleCloseModal,
  } = useLanguageChange();
  const [isClearing, setIsClearing] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationHour, setNotificationHour] = useState<number>(DEFAULT_NOTIFICATION_HOUR);
  const [showHourPicker, setShowHourPicker] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('');
  const [consentStatus, setConsentStatus] = useState<AdsConsentStatus>(AdsConsentStatus.UNKNOWN);
  const [isLoadingConsent, setIsLoadingConsent] = useState(false);
  const [attStatus, setAttStatus] = useState<TrackingStatus>('unavailable');
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showDeletionInProgressModal, setShowDeletionInProgressModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showPremiumDarkModeModal, setShowPremiumDarkModeModal] = useState(false);

  // Load settings and check permissions when component mounts
  useEffect(() => {
    loadNotificationSettings();
    checkNotificationPermission();
    loadConsentStatus();
    loadAttStatus();
  }, [user]);

  // Load current consent status
  const loadConsentStatus = () => {
    const status = consentService.getConsentStatus();
    setConsentStatus(status);
  };

  // Load ATT status
  const loadAttStatus = async () => {
    try {
      const status = await attService.getStatus();
      setAttStatus(status);
    } catch (error) {
      console.error('Error loading ATT status:', error);
    }
  };

  // Load notification settings from Firebase
  const loadNotificationSettings = async () => {
    if (!user?.uid) return;
    
    try {
      setIsLoadingSettings(true);
      const userSettings = await FirestoreService.getUserSettings(user.uid);
      
      if (userSettings?.notificationSettings) {
        setNotificationsEnabled(userSettings.notificationSettings.enabled || false);
        setNotificationHour(userSettings.notificationSettings.hour || DEFAULT_NOTIFICATION_HOUR);
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
        // Temporarily disabled - PushNotificationIOS causing NativeEventEmitter error
        // PushNotificationIOS.checkPermissions((permissions) => {
        //   setPermissionStatus(permissions.alert ? 'granted' : 'denied');
        // });
        setPermissionStatus('granted'); // Temporary fallback
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
        // Temporarily disabled - PushNotificationIOS causing NativeEventEmitter error
        // return new Promise((resolve) => {
        //   PushNotificationIOS.requestPermissions({
        //     alert: true,
        //     badge: true,
        //     sound: true,
        //   }).then(
        //     (permissions) => {
        //       const granted = permissions.alert || false;
        //       setPermissionStatus(granted ? 'granted' : 'denied');
        //       
        //       if (!granted) {
        //         Alert.alert(
        //           t('settings.permissionDenied'),
        //           t('settings.permissionDeniedMessage'),
        //           [
        //             { text: t('common.cancel'), style: 'cancel' },
        //             { 
        //               text: t('settings.openSettings'),
        //               onPress: () => Linking.openURL('app-settings:')
        //             }
        //           ]
        //         );
        //       }
        //       
        //       resolve(granted);
        //     }
        //   );
        // });
        
        // Temporary fallback
        setPermissionStatus('granted');
        return true;
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
    logEvent(AnalyticsEvents.LANGUAGE_CHANGED, { to: languageCode });
    await handleLanguageChangeWithRestart(languageCode);
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (!user?.uid) {
      Alert.alert(t('common.error'), t('settings.signInToSaveSettings'));
      return;
    }

    if (value) {
      // Request permission first
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        return; // Don't enable if permission denied
      }

      // Register FCM token
      try {
        await FCMService.initialize(user.uid);
        console.log('FCM token registered successfully');
      } catch (error) {
        console.error('Error registering FCM token:', error);
        Alert.alert(
          t('common.error'),
          'Failed to register device for notifications. Please try again.'
        );
        return;
      }
    } else {
      // Unregister FCM token
      try {
        await FCMService.unregisterToken(user.uid);
        console.log('FCM token unregistered successfully');
      } catch (error) {
        console.error('Error unregistering FCM token:', error);
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

  const handleThemeToggle = async (value: boolean) => {
    // Only allow enabling dark mode for premium users
    if (value && !isPremium) {
      logEvent(AnalyticsEvents.SETTINGS_PREMIUM_DARK_MODE_MODAL_SHOWN);
      setShowPremiumDarkModeModal(true);
      return;
    }
    await setTheme(value ? 'dark' : 'light');
    if (value) {
      logEvent(AnalyticsEvents.SETTINGS_THEME_ENABLED);
    } else {
      logEvent(AnalyticsEvents.SETTINGS_THEME_DISABLED);
    }
  };

  const handleViewPremiumBenefits = () => {
    logEvent(AnalyticsEvents.SETTINGS_PREMIUM_BENEFITS_VIEWED);
    setShowPremiumDarkModeModal(false);
    navigation.navigate('Premium' as never);
  };

  // Handle ad consent settings
  const handleManageAdConsent = async () => {
    try {
      setIsLoadingConsent(true);
      logEvent(AnalyticsEvents.SETTINGS_AD_CONSENT_OPENED);
      
      Alert.alert(
        t('settings.adConsent'),
        t('settings.adConsentDescription'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
            onPress: () => setIsLoadingConsent(false),
          },
          {
            text: t('settings.reviewChoices'),
            onPress: async () => {
              try {
                const newStatus = await consentService.showConsentForm();
                setConsentStatus(newStatus);
                logEvent(AnalyticsEvents.SETTINGS_AD_CONSENT_UPDATED, { 
                  status: newStatus 
                });
                
                // Show result to user
                if (newStatus === AdsConsentStatus.OBTAINED) {
                  Alert.alert(
                    t('common.success'),
                    t('settings.personalizedAdsEnabled')
                  );
                } else {
                  Alert.alert(
                    t('common.success'),
                    t('settings.adPreferencesUpdated')
                  );
                }
              } catch (error) {
                console.error('Error showing consent form:', error);
                Alert.alert(
                  t('common.error'),
                  t('settings.adConsentError')
                );
              } finally {
                setIsLoadingConsent(false);
              }
            },
          },
        ]
      );
      
      // If user cancels the first alert, reset loading state
      setTimeout(() => {
        if (isLoadingConsent) {
          setIsLoadingConsent(false);
        }
      }, 100);
    } catch (error) {
      console.error('Error managing ad consent:', error);
      setIsLoadingConsent(false);
    }
  };

  // Get consent status text
  const getConsentStatusText = (): string => {
    switch (consentStatus) {
      case AdsConsentStatus.OBTAINED:
        return t('settings.consentStatusObtained');
      case AdsConsentStatus.NOT_REQUIRED:
        return t('settings.consentStatusNotRequired');
      case AdsConsentStatus.REQUIRED:
        return t('settings.consentStatusRequired');
      case AdsConsentStatus.UNKNOWN:
      default:
        return t('settings.consentStatusUnknown');
    }
  };

  // Get ATT status text
  const getAttStatusText = (): string => {
    if (Platform.OS !== 'ios') {
      return t('settings.attNotAvailable');
    }
    
    return t(`settings.trackingStatus.${attStatus}`);
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (!user) return;

    logEvent(AnalyticsEvents.PROFILE_DELETE_ACCOUNT_CLICKED);

    try {
      // Check if a deletion request already exists
      const requestExists = await FirestoreService.checkDeletionRequestExists(user.uid);

      if (requestExists) {
        // Show in-progress modal
        setShowDeletionInProgressModal(true);
      } else {
        // Show confirmation modal
        setShowDeleteAccountModal(true);
      }
    } catch (error) {
      console.error('Error checking deletion request:', error);
      Alert.alert(t('common.error'), t('profile.deleteAccountModal.error'));
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (!user) return;

    const appId = activeExamConfig.id;
    const appName = activeExamConfig.appName;

    setIsDeletingAccount(true);
    try {
      await FirestoreService.createDeletionRequest(user.uid, user.email || '', appId, appName, Platform.OS);
      logEvent(AnalyticsEvents.PROFILE_DELETE_ACCOUNT_CONFIRMED);
      // Modal will show success step automatically
    } catch (error) {
      console.error('Error creating deletion request:', error);
      logEvent(AnalyticsEvents.PROFILE_DELETE_ACCOUNT_CANCELLED);
      Alert.alert(t('common.error'), t('profile.deleteAccountModal.error'));
      setShowDeleteAccountModal(false);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (!isDeletingAccount) {
      setShowDeleteAccountModal(false);
      logEvent(AnalyticsEvents.PROFILE_DELETE_ACCOUNT_CANCELLED);
    }
  };

  // Handle ATT permission management
  const handleManageAttPermission = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert(
        t('settings.attTitle'),
        t('settings.attNotAvailableMessage')
      );
      return;
    }

    try {
      setIsLoadingConsent(true);
      logEvent(AnalyticsEvents.SETTINGS_ATT_OPENED);

      // Check if we can request permission
      const canRequest = await attService.canRequestPermission();
      
      if (!canRequest) {
        // Permission already determined, show info and link to settings
        Alert.alert(
          t('settings.attTitle'),
          t('settings.attAlreadyDetermined', { status: getAttStatusText() }),
          [
            {
              text: t('common.cancel'),
              style: 'cancel',
            },
            {
              text: t('settings.openSettings'),
              onPress: () => {
                Linking.openURL('app-settings:');
              },
            },
          ]
        );
        return;
      }

      // Request permission
      Alert.alert(
        t('settings.attTitle'),
        t('settings.attDescription'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('settings.requestPermission'),
            onPress: async () => {
              try {
                const newStatus = await attService.requestPermission();
                setAttStatus(newStatus);
                logEvent(AnalyticsEvents.SETTINGS_ATT_UPDATED, { 
                  status: newStatus 
                });
                
                // Show result to user
                if (newStatus === 'authorized') {
                  Alert.alert(
                    t('common.success'),
                    t('settings.attAuthorized')
                  );
                } else {
                  Alert.alert(
                    t('common.info'),
                    t('settings.attDenied')
                  );
                }
              } catch (error) {
                console.error('Error requesting ATT permission:', error);
                Alert.alert(
                  t('common.error'),
                  t('settings.attError')
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error managing ATT permission:', error);
      Alert.alert(
        t('common.error'),
        t('settings.attError')
      );
    } finally {
      setIsLoadingConsent(false);
    }
  };

  return (
    <View style={styles.container}>
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

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
          <View style={styles.notificationsContainer}>
            <View style={styles.notificationsRow}>
              <Text style={styles.settingLabel}>{t('settings.darkMode')}</Text>
              <Switch
                value={isDarkMode}
                onValueChange={handleThemeToggle}
                trackColor={{ false: colors.secondary[200], true: colors.primary[200] }}
                thumbColor={isDarkMode ? colors.primary[500] : colors.secondary[400]}
                disabled={isThemeLoading}
              />
            </View>
            <Text style={styles.helperText}>
              {isDarkMode
                ? t('settings.darkModeOn')
                : t('settings.darkModeOff')}
            </Text>
          </View>
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
            <View style={styles.notificationsContainer}>
              <View style={styles.notificationsRow}>
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
                <View style={[styles.notificationsRow, styles.timeSection]}> 
                  <Text style={styles.settingLabel}>{t('settings.notificationTime')}</Text>
                  <Button
                    title={formatHour(notificationHour)}
                    onPress={() => setShowHourPicker(true)}
                    variant="outline"
                    size='small'
                    style={styles.timeButton}
                    disabled={isLoadingSettings}
                  />
                </View>
              )}
            </View>
          )}

          {/* Custom Hour Picker Modal */}
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.privacy')}</Text>
          
          {/* App Tracking Transparency (ATT) - iOS only */}
          {Platform.OS === 'ios' && (
            <View style={styles.consentContainer}>
              <View style={styles.consentHeader}>
                <Text style={styles.consentTitle}>{t('settings.attTitle')}</Text>
                <Text style={styles.consentStatus}>{getAttStatusText()}</Text>
              </View>
              <Text style={styles.consentDescription}>
                {t('settings.attInfo')}
              </Text>
              <Button
                title={t('settings.manageAttPermission')}
                onPress={handleManageAttPermission}
                variant="outline"
                style={styles.settingButton}
                disabled={isLoadingConsent}
              />
            </View>
          )}
          
          {/* Ad Consent (GDPR/CCPA) */}
          <View style={styles.consentContainer}>
            <View style={styles.consentHeader}>
              <Text style={styles.consentTitle}>{t('settings.adConsent')}</Text>
              <Text style={styles.consentStatus}>{getConsentStatusText()}</Text>
            </View>
            <Text style={styles.consentDescription}>
              {t('settings.adConsentInfo')}
            </Text>
            <Button
              title={t('settings.manageAdConsent')}
              onPress={handleManageAdConsent}
              variant="outline"
              style={styles.settingButton}
              disabled={isLoadingConsent}
            />
          </View>
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

        {/* Offline Mode Section (Premium Only) */}
        {isPremiumFeaturesEnabled() && isPremium && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('offline.title')}</Text>
            <OfflineDownloadSection />
          </View>
        )}

        {/* Account Management Section */}
        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.accountManagement')}</Text>
            <Button
              title={t('profile.deleteAccount')}
              onPress={handleDeleteAccount}
              variant="outline"
              style={{ ...styles.settingButton, ...styles.deleteAccountButton }}
              disabled={authLoading}
            />
          </View>
        )}
      </ScrollView>

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        onLanguageSelect={handleLanguageSelect}
      />

      <RestartAppModal
        visible={isRestartModalVisible}
        isGoingToRTL={isGoingToRTL}
        onClose={handleCloseModal}
      />

      {/* Hour Picker Modal */}
      <HourPickerModal
        visible={showHourPicker}
        selectedHour={notificationHour}
        onClose={() => setShowHourPicker(false)}
        onHourSelect={handleHourSelect}
      />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        visible={showDeleteAccountModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDeleteAccount}
        isLoading={isDeletingAccount}
      />

      {/* Account Deletion In Progress Modal */}
      <AccountDeletionInProgressModal
        visible={showDeletionInProgressModal}
        onClose={() => setShowDeletionInProgressModal(false)}
      />

      {/* Premium Dark Mode Modal */}
      <PremiumDarkModeModal
        visible={showPremiumDarkModeModal}
        onClose={() => setShowPremiumDarkModeModal(false)}
        onViewBenefits={handleViewPremiumBenefits}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      textAlign: 'left',
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
      textAlign: 'left',
    },
    timeSection: {
      marginTop: spacing.margin.md,
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
    helperText: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      marginTop: spacing.margin.sm,
      textAlign: 'left',
    },
    dangerButton: {
      borderColor: colors.error[500],
    },
    deleteAccountButton: {
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
    consentContainer: {
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.md,
      padding: spacing.padding.md,
      marginBottom: spacing.margin.sm,
    },
    consentHeader: {
      marginBottom: spacing.margin.xs,
    },
    consentTitle: {
      ...typography.textStyles.body,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: spacing.margin.xs,
      textAlign: 'left',
    },
    consentStatus: {
      ...typography.textStyles.caption,
      color: colors.text.secondary,
      fontStyle: 'italic',
      textAlign: 'left',
    },
    consentDescription: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      fontSize: 13,
      marginBottom: spacing.margin.md,
      lineHeight: 18,
      textAlign: 'left',
    },
    notificationsContainer: {
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.md,
      padding: spacing.padding.md,
      marginBottom: spacing.margin.sm,
    },
    notificationsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  });

export default SettingsScreen;