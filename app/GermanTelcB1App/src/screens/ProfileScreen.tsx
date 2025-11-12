import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  I18nManager,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DeviceInfo from 'react-native-device-info';
import { colors, spacing, typography } from '../theme';
import Button from '../components/Button';
import ProgressCard from '../components/ProgressCard';
import CompletionStatsCard from '../components/CompletionStatsCard';
import LoginModal from '../components/LoginModal';
import DeleteAccountModal from '../components/DeleteAccountModal';
import AccountDeletionInProgressModal from '../components/AccountDeletionInProgressModal';
import { useAuth } from '../contexts/AuthContext';
import { useCompletion } from '../contexts/CompletionContext';
import { ProfileStackParamList } from '../types/navigation.types';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import FirestoreService from '../services/firestore.service';
import { activeExamConfig } from '../config/active-exam.config';

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<ProfileStackParamList, 'Profile'>>();
  const navigation = useNavigation<StackNavigationProp<ProfileStackParamList>>();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { allStats, isLoading: statsLoading } = useCompletion();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showDeletionInProgressModal, setShowDeletionInProgressModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleRateApp = async () => {
    if (Platform.OS === 'android') {
      const url = 'https://play.google.com/store/apps/details?id=com.mhamada.telcb1german';
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert(t('common.error'), t('profile.alerts.couldNotOpenStore'));
        }
      } catch (e) {
        Alert.alert(t('common.error'), t('profile.alerts.couldNotOpenStore'));
      }
    } else if (Platform.OS === 'ios') {
      Alert.alert(t('common.success'), t('profile.alerts.iosRatingComingSoon'));
    }
  };

  // Auto-open login modal if parameter is passed
  useEffect(() => {
    if (route.params?.openLoginModal && !user) {
      setShowLoginModal(true);
      logEvent(AnalyticsEvents.PROFILE_LOGIN_MODAL_OPENED);
    }
  }, [route.params?.openLoginModal, user]);

  const handleNavigateToSettings = () => {
    navigation.navigate('Settings');
  };

  const handleNavigateToStats = () => {
    navigation.navigate('CompletionStats');
  };

  const handleSignOut = () => {
    logEvent(AnalyticsEvents.PROFILE_SIGN_OUT_PROMPT_SHOWN);
    Alert.alert(
      t('profile.alerts.signOutTitle'),
      t('profile.alerts.signOutMessage'),
      [
        { text: t('common.cancel'), style: 'cancel', onPress: () => logEvent(AnalyticsEvents.PROFILE_SIGN_OUT_CANCELLED) },
        {
          text: t('profile.signOut'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              logEvent(AnalyticsEvents.PROFILE_SIGN_OUT_CONFIRMED);
              Alert.alert(t('common.success'), t('profile.alerts.signedOut'));
            } catch (error) {
              Alert.alert(t('common.error'), t('profile.alerts.signOutFailed'));
            }
          },
        },
      ]
    );
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    logEvent(AnalyticsEvents.PROFILE_LOGIN_SUCCESS);
    Alert.alert(t('common.success'), t('profile.alerts.signedInSuccess'));
  };

  const handleLoginFailure = () => {
    logEvent(AnalyticsEvents.PROFILE_LOGIN_FAILED);
    Alert.alert(t('common.error'), t('profile.alerts.signInFailed'));
  };

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
      await FirestoreService.createDeletionRequest(user.uid, user.email || '', appId, appName);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t('profile.title')}</Text>

        {/* User Info Section */}
        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
            <View style={styles.userInfo}>
              {user.photoURL && (
                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
              )}
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user.displayName || t('common.user')}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userProvider}>
                  {t('profile.signedInWith')} {user.provider.charAt(0).toUpperCase() + user.provider.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Progress Section */}
        <View style={styles.section}>
          <ProgressCard showDetails={true} />
        </View>

        {/* Completion Statistics Section */}
        <View style={styles.section}>
          <CompletionStatsCard 
            stats={allStats} 
            isLoading={statsLoading} 
            showLoggedOutMessage={!user}
            showOnlyTop={true}
            onSeeAllStats={handleNavigateToStats}
          />
        </View>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.quickActions')}</Text>

          <Button
            title={t('settings.title')}
            onPress={handleNavigateToSettings}
            variant="outline"
            style={styles.settingButton}
          />
        </View>

        {/* Authentication Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.account')}</Text>

          {user ? (
            <>
              <Button
                title={t('profile.signOut')}
                onPress={handleSignOut}
                variant="outline"
                style={{ ...styles.settingButton, ...styles.dangerButton }}
                disabled={authLoading}
              />
              <Button
                title={t('profile.deleteAccount')}
                onPress={handleDeleteAccount}
                variant="outline"
                style={{ ...styles.settingButton, ...styles.deleteAccountButton }}
                disabled={authLoading}
              />
            </>
          ) : (
            <Button
              title={t('profile.signIn')}
              onPress={() => setShowLoginModal(true)}
              variant="outline"
              style={styles.settingButton}
            />
          )}
        </View>

        <View style={styles.rateAppSection}>
          <Button
            title={t('profile.rateApp')}
            onPress={handleRateApp}
            variant="primary"
            style={styles.rateAppButton}
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.about')}</Text>
          <Text style={styles.aboutText}>
            {t('profile.appName')}
          </Text>
          <Text style={styles.versionText}>
            {t('profile.version')} {DeviceInfo.getVersion()}
          </Text>
        </View>
      </ScrollView>

      {/* Login Modal */}
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
        onFailure={handleLoginFailure}
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
  title: {
    ...typography.textStyles.h2,
    color: colors.text.primary,
    marginBottom: spacing.margin.lg,
  },
  section: {
    marginBottom: spacing.margin.sm,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  settingButton: {
    marginBottom: spacing.margin.sm,
  },
  rateAppSection: {
    paddingTop: spacing.padding.lg,
    marginTop: spacing.margin.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  rateAppButton: {
    marginBottom: spacing.margin.lg,
  },
  dangerButton: {
    borderColor: colors.error[500],
  },
  deleteAccountButton: {
    borderColor: colors.error[500],
    marginTop: spacing.margin.xs,
  },
  aboutText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.margin.xs,
  },
  versionText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.tertiary,
  },
  userInfo: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    ...spacing.shadow.sm,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.margin.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  userEmail: {
    ...typography.textStyles.body,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.margin.xs,
  },
  userProvider: {
    ...typography.textStyles.bodySmall,
    color: colors.text.tertiary,
  },
});

export default ProfileScreen;
