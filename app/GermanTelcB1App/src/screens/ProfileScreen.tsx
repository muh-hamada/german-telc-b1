import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  I18nManager,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DeviceInfo from 'react-native-device-info';
import { spacing, typography, type ThemeColors } from '../theme';
import Button from '../components/Button';
import LoginModal from '../components/LoginModal';
import DailyStreaksCard from '../components/DailyStreaksCard';
import CompletionStatsCard from '../components/CompletionStatsCard';
import ProfileStatsGrid from '../components/ProfileStatsGrid';
import SupportAdButton from '../components/SupportAdButton';
import AnimatedGradientBorder from '../components/AnimatedGradientBorder';
import { useAuth } from '../contexts/AuthContext';
import { useCompletion } from '../contexts/CompletionContext';
import { useStreak } from '../contexts/StreakContext';
import { useRemoteConfig } from '../contexts/RemoteConfigContext';
import { usePremium } from '../contexts/PremiumContext';
import { ProfileStackParamList } from '../types/navigation.types';
import { activeExamConfig } from '../config/active-exam.config';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import { openAppRating } from '../utils/appRating';
import { DEMO_MODE, DEMO_COMPLETION_STATS } from '../config/development.config';
import { calculateRewardDays } from '../constants/streak.constants';
import { useAppTheme } from '../contexts/ThemeContext';

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
  const { isStreaksEnabledForUser, isPremiumFeaturesEnabled } = useRemoteConfig();
  const { isPremium, purchasePremium, isPurchasing, productPrice } = usePremium();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Use demo stats if demo mode is enabled
  const displayCompletionStats = DEMO_MODE ? DEMO_COMPLETION_STATS : allStats;

  // Calculate ad-free reward days
  const adFreeRewardDays = streakData ? calculateRewardDays(streakData.currentStreak) : 1;

  const handleRateApp = async () => {
    openAppRating('profile_screen');
  };

  const handleShareApp = async () => {
    try {
      logEvent(AnalyticsEvents.PROFILE_SHARE_APP_CLICKED);
      
      // Get the share message with language and level
      const shareMessage = t('profile.shareMessage', {
        language: activeExamConfig.language.charAt(0).toUpperCase() + activeExamConfig.language.slice(1),
        level: activeExamConfig.level.toUpperCase(),
      });
      
      // Build the app store URLs
      const appStoreUrl = `https://apps.apple.com/app/id${activeExamConfig.storeIds.ios}`;
      const playStoreUrl = `https://play.google.com/store/apps/details?id=${activeExamConfig.storeIds.android}`;
      
      const url = Platform.OS === 'ios' ? appStoreUrl : playStoreUrl;
      const message = `${shareMessage}\n\n${url}`;
      
      const result = await Share.share(
        {
          message: message,
          url: Platform.OS === 'ios' ? url : undefined, // URL parameter only works on iOS
        },
        {
          dialogTitle: t('profile.shareApp'), // Android only
        }
      );

      if (result.action === Share.sharedAction) {
        // User shared the content
        logEvent(AnalyticsEvents.PROFILE_APP_SHARED, {
          platform: Platform.OS,
          sharedWith: result.activityType || 'unknown',
        });
      } else if (result.action === Share.dismissedAction) {
        // User dismissed the share dialog
        logEvent(AnalyticsEvents.PROFILE_SHARE_DISMISSED);
      }
    } catch (error) {
      console.error('Error sharing app:', error);
      logEvent(AnalyticsEvents.PROFILE_SHARE_DISMISSED, { error: String(error) });
      Alert.alert(t('common.error'), t('profile.alerts.shareFailed'));
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
    logEvent(AnalyticsEvents.PROFILE_SETTINGS_OPENED);
    navigation.navigate('Settings');
  };

  const handleNavigateToStats = () => {
    logEvent(AnalyticsEvents.PROFILE_STATS_OPENED);
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

  const handleNavigateToPremium = () => {
    logEvent(AnalyticsEvents.PROFILE_PREMIUM_CARD_CLICKED);
    navigation.navigate('Premium' as never);
  };

  const handleUpgradeToPremium = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    await purchasePremium();
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

        {/* Premium Upgrade Card - only show when premium features enabled and user is not premium */}
        {isPremiumFeaturesEnabled() && !isPremium && (
          <AnimatedGradientBorder
            borderWidth={2}
            borderRadius={16}
            colors={[...colors.gradients.premium]}
            duration={4000}
            style={styles.premiumUpgradeCardWrapper}
          >
            <TouchableOpacity
              style={styles.premiumUpgradeCard}
              onPress={handleNavigateToPremium}
              activeOpacity={0.8}
            >
              <View style={styles.premiumUpgradeIconContainer}>
                <Icon name="star" size={24} color="#F59E0B" />
              </View>
              <View style={styles.premiumUpgradeContent}>
                <Text style={styles.premiumUpgradeTitle}>{t('premium.profile.upgradeCard.title')}</Text>
                <Text style={styles.premiumUpgradeDescription}>{t('premium.profile.upgradeCard.description')}</Text>
              </View>
              <Image
                  source={require('../../assets/images/race.gif')}
                  style={styles.raceGif}
                  resizeMode="contain"

                />
            </TouchableOpacity>
          </AnimatedGradientBorder>
        )}

        {/* Support Ad Button */}
        <SupportAdButton screen="profile" style={styles.supportAdButton} />

        {/* Premium Badge - show when user is premium */}
        {isPremiumFeaturesEnabled() && isPremium && (
          <AnimatedGradientBorder
            borderWidth={2}
            borderRadius={16}
            colors={[...colors.gradients.premiumBadge]}
            duration={10000}
            style={styles.premiumBadgeWrapper}
          >
            <View style={styles.premiumBadge}>
              <Icon name="star" size={20} color="#fff" />
              <Text style={styles.premiumBadgeText}>{t('premium.profile.premiumBadge')}</Text>
            </View>
          </AnimatedGradientBorder>
        )}

        {/* Stats Grid */}
        <ProfileStatsGrid variant="card" marginBottom={spacing.margin.md} backgroundColor={colors.background.secondary} />

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
          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleRateApp}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Icon name="star" size={20} color={colors.primary[500]} />
            </View>
            <Text style={styles.actionItemText}>{t('profile.rateApp')}</Text>
            <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleShareApp}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Icon name="share-alt" size={20} color={colors.success[500]} />
            </View>
            <Text style={styles.actionItemText}>{t('profile.shareApp')}</Text>
            <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
          {user && (
            <TouchableOpacity
              style={[styles.actionItem, styles.lastActionItem]}
              onPress={handleSignOut}
              disabled={authLoading}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Icon name="sign-out" size={20} color={colors.error[500]} />
              </View>
              <Text style={styles.actionItemText}>{t('profile.signOut')}</Text>
              <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      marginBottom: spacing.margin.md,
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
      marginBottom: spacing.margin.md,
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
      textAlign: 'left',
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
      marginBottom: spacing.margin.md,
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
    supportAdButton: {
      marginBottom: spacing.margin.md,
    },
    section: {
      marginBottom: spacing.margin.sm,
    },
    actionsSection: {
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.lg,
      overflow: 'hidden',
      ...spacing.shadow.sm,
    },
    actionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
      backgroundColor: colors.background.secondary,
    },
    lastActionItem: {
      borderBottomWidth: 0,
    },
    actionIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.background.tertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.margin.md,
    },
    actionItemText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      flex: 1,
    },
    aboutSection: {
      alignItems: 'center',
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
    premiumUpgradeCardWrapper: {
      marginBottom: spacing.margin.md,
    },
    premiumUpgradeCard: {
      backgroundColor: colors.background.secondary,
      borderRadius: 14,
      padding: spacing.padding.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    premiumUpgradeIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#FEF3C7',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.margin.md,
    },
    premiumUpgradeContent: {
      flex: 1,
    },
    premiumUpgradeTitle: {
      ...typography.textStyles.body,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      textAlign: 'left',
    },
    premiumUpgradeDescription: {
      ...typography.textStyles.bodySmall,
      color: colors.text.secondary,
      textAlign: 'left',
    },
    premiumBadgeWrapper: {
      marginBottom: spacing.margin.lg,
    },
    premiumBadge: {
      // backgroundColor: colors.background.secondary,
      borderRadius: 14,
      padding: spacing.padding.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.margin.sm,
    },
    premiumBadgeText: {
      ...typography.textStyles.body,
      fontWeight: typography.fontWeight.semibold,
      color: '#fff',
    },
    raceGif: {
      width: 48,
      height: 48,
      borderRadius: 12,
      transform: [{ rotate: I18nManager.isRTL ? '180deg' : '0deg' }],
    },
  });

export default ProfileScreen;
