import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DeviceInfo from 'react-native-device-info';
import { colors, spacing, typography } from '../theme';
import Button from '../components/Button';
import LoginModal from '../components/LoginModal';
import DailyStreaksCard from '../components/DailyStreaksCard';
import CompletionStatsCard from '../components/CompletionStatsCard';
import ProfileStatsGrid from '../components/ProfileStatsGrid';
import { useAuth } from '../contexts/AuthContext';
import { useCompletion } from '../contexts/CompletionContext';
import { useStreak } from '../contexts/StreakContext';
import { useRemoteConfig } from '../contexts/RemoteConfigContext';
import { ProfileStackParamList } from '../types/navigation.types';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import { openAppRating } from '../utils/appRating';
import { DEMO_MODE, DEMO_COMPLETION_STATS } from '../config/development.config';
import { calculateRewardDays } from '../constants/streak.constants';

// Helper function to format time remaining
const formatTimeRemaining = (expiresAt: number | null): string => {
  if (!expiresAt) return '';
  
  const now = Date.now();
  const remaining = expiresAt - now;
  
  if (remaining <= 0) return 'Expired';
  
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

const ProfileScreen: React.FC = () => {
  const { t } = useCustomTranslation();
  const route = useRoute<RouteProp<ProfileStackParamList, 'Profile'>>();
  const navigation = useNavigation<StackNavigationProp<ProfileStackParamList>>();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { allStats, isLoading: statsLoading } = useCompletion();
  const { adFreeStatus, streakData } = useStreak();
  const { isStreaksEnabledForUser } = useRemoteConfig();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Use demo stats if demo mode is enabled
  const displayCompletionStats = DEMO_MODE ? DEMO_COMPLETION_STATS : allStats;
  
  // Calculate ad-free reward days
  const adFreeRewardDays = streakData ? calculateRewardDays(streakData.currentStreak) : 1;

  const handleRateApp = async () => {
    openAppRating('profile_screen');
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

  const handleNavigateBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleNavigateBack} style={styles.headerButton}>
            <Icon name={I18nManager.isRTL ? "chevron-right" : "chevron-left"} size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        </View>
        <TouchableOpacity onPress={handleNavigateToSettings} style={styles.headerButton}>
          <Icon name="cog" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Login Prompt for Logged Out Users */}
        {!user && (
          <View style={styles.loginPromptCard}>
            <Icon name="user-circle" size={60} color={colors.primary[500]} />
            <Text style={styles.loginPromptTitle}>{t('profile.loginPrompt.title')}</Text>
            <Text style={styles.loginPromptMessage}>{t('profile.loginPrompt.message')}</Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Icon name="check-circle" size={16} color={colors.success[500]} />
                <Text style={styles.benefitText}>{t('profile.loginPrompt.benefit1')}</Text>
              </View>
              <View style={styles.benefitItem}>
                <Icon name="check-circle" size={16} color={colors.success[500]} />
                <Text style={styles.benefitText}>{t('profile.loginPrompt.benefit2')}</Text>
              </View>
              <View style={styles.benefitItem}>
                <Icon name="check-circle" size={16} color={colors.success[500]} />
                <Text style={styles.benefitText}>{t('profile.loginPrompt.benefit3')}</Text>
              </View>
            </View>
            <Button
              title={t('profile.signIn')}
              onPress={() => setShowLoginModal(true)}
              variant="primary"
              style={styles.loginPromptButton}
            />
          </View>
        )}

        {/* User Profile Card */}
        {user && (
          <View style={styles.userCard}>
            {user.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Icon name="user" size={40} color={colors.text.tertiary} />
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                {user.displayName || t('common.user')}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1} ellipsizeMode="tail">
                {user.email}
              </Text>
            </View>
          </View>
        )}

        {/* Stats Grid */}
        <ProfileStatsGrid variant="card" marginBottom={spacing.margin.lg} backgroundColor={colors.background.secondary} />

        {/* Ad-Free Badge - ABOVE Streaks Card */}
        {isStreaksEnabledForUser(user?.uid) && user && adFreeStatus.isActive && (
          <View style={styles.adFreeBadge}>
            <Text style={styles.adFreeIcon}>🎉</Text>
            <View style={styles.adFreeContent}>
              <Text style={styles.adFreeTitle}>
                {t('streaks.reward.activated', { days: adFreeRewardDays })}
              </Text>
              <Text style={styles.adFreeExpiry}>
                {t('streaks.reward.expires', { 
                  time: formatTimeRemaining(adFreeStatus.expiresAt) 
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Daily Streaks Card */}
        {isStreaksEnabledForUser(user?.uid) && user && <DailyStreaksCard />}

        {/* Completion Statistics Section */}
        <View style={styles.section}>
          <CompletionStatsCard 
            stats={displayCompletionStats} 
            isLoading={statsLoading} 
            showLoggedOutMessage={!user}
            showOnlyTop={true}
            onSeeAllStats={handleNavigateToStats}
          />
        </View>

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          {user && (
            <Button
              title={t('profile.signOut')}
              onPress={handleSignOut}
              variant="outline"
              style={styles.actionButton}
              disabled={authLoading}
            />
          )}
          <Button
            title={t('profile.rateApp')}
            onPress={handleRateApp}
            variant="primary"
            style={styles.actionButton}
          />
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.aboutText}>{t('profile.appName')}</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.padding.lg,
    paddingVertical: spacing.padding.md,
    backgroundColor: colors.background.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: spacing.borderRadius.full,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...spacing.shadow.sm,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.padding.lg,
    paddingTop: 0,
  },
  loginPromptCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.padding.xl,
    alignItems: 'center',
    marginBottom: spacing.margin.lg,
    ...spacing.shadow.sm,
  },
  loginPromptTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginTop: spacing.margin.md,
    marginBottom: spacing.margin.sm,
    textAlign: 'center',
  },
  loginPromptMessage: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.margin.lg,
    lineHeight: 22,
  },
  benefitsList: {
    width: '100%',
    marginBottom: spacing.margin.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.margin.sm,
    paddingHorizontal: spacing.padding.sm,
  },
  benefitText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    marginLeft: spacing.margin.sm,
    flex: 1,
  },
  loginPromptButton: {
    width: '100%',
  },
  userCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.padding.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.margin.lg,
    ...spacing.shadow.sm,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.margin.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.secondary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
    flexShrink: 1,
    justifyContent: 'center',
  },
  userName: {
    ...typography.textStyles.bodyLarge,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  userEmail: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.margin.sm,
  },
  actionsSection: {
    marginTop: spacing.margin.lg,
  },
  actionButton: {
    marginBottom: spacing.margin.sm,
  },
  aboutSection: {
    alignItems: 'center',
    paddingTop: spacing.padding.lg,
    paddingBottom: spacing.padding.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    marginTop: spacing.margin.lg,
  },
  aboutText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.margin.xs,
  },
  versionText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.tertiary,
  },
  adFreeBadge: {
    backgroundColor: colors.success[50],
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.padding.lg,
    marginBottom: spacing.margin.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.success[100],
    ...spacing.shadow.sm,
  },
  adFreeIcon: {
    fontSize: 40,
    marginRight: spacing.margin.md,
  },
  adFreeContent: {
    flex: 1,
  },
  adFreeTitle: {
    ...typography.textStyles.h4,
    color: colors.success[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.xs,
  },
  adFreeExpiry: {
    ...typography.textStyles.bodySmall,
    color: colors.success[600],
  },
});

export default ProfileScreen;
