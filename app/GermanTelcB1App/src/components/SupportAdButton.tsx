import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AdEventType, RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import Icon from 'react-native-vector-icons/FontAwesome';
import { activeExamConfig } from '../config/active-exam.config';
import { usePremium } from '../contexts/PremiumContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import { spacing, ThemeColors, typography } from '../theme';
import SupportThankYouModal from './SupportThankYouModal';

// Ad Unit ID for user support rewarded ad
const USER_SUPPORT_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.select({
      ios: activeExamConfig.ads.userSupport.ios,
      android: activeExamConfig.ads.userSupport.android,
    })!;

interface SupportAdButtonProps {
  /**
   * Screen identifier for analytics tracking
   */
  screen?: string;
  /**
   * Optional style to apply to the container
   */
  style?: any;
  /**
   * Optional callback when ad is successfully watched
   */
  onAdWatched?: () => void;
}

/**
 * SupportAdButton Component
 * 
 * A reusable button that allows users to support the app by watching a rewarded ad.
 * Can be placed on multiple screens throughout the app.
 */
const SupportAdButton: React.FC<SupportAdButtonProps> = ({ 
  screen = 'unknown',
  style,
  onAdWatched,
}) => {
  const { t } = useCustomTranslation();
  const { isPremium, isLoading: isPremiumLoading } = usePremium();
  const [rewardedAd, setRewardedAd] = useState<RewardedAd | null>(null);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(true);
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const adEarnedRewardRef = useRef<boolean>(false);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Initialize and load rewarded ad (must be before any conditional returns)
  useEffect(() => {
    // Skip ad loading for premium users
    if (isPremium) {
      setIsAdLoading(false);
      return;
    }

    const ad = RewardedAd.createForAdRequest(USER_SUPPORT_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });

    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('[SupportAdButton] ✅ Rewarded ad loaded successfully');
      setIsAdLoaded(true);
      setIsAdLoading(false);
    });

    const unsubscribeEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        console.log('[SupportAdButton] 🎁 User earned reward:', reward);
        adEarnedRewardRef.current = true;
        logEvent(AnalyticsEvents.USER_SUPPORT_AD_EARNED_REWARD, { 
          screen,
          ad_unit_id: USER_SUPPORT_AD_UNIT_ID,
        });
      }
    );

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('[SupportAdButton] ❌ Rewarded ad closed', {
        earnedReward: adEarnedRewardRef.current,
      });
      logEvent(AnalyticsEvents.USER_SUPPORT_AD_CLOSED, { 
        screen,
        earned_reward: adEarnedRewardRef.current,
      });

      setIsShowingAd(false);

      // Show thank you modal and call callback if user earned reward
      if (adEarnedRewardRef.current) {
        setShowThankYouModal(true);
        if (onAdWatched) {
          onAdWatched();
        }
      }

      // Reset the flag for next time
      adEarnedRewardRef.current = false;

      // Reload ad for next time
      setIsAdLoaded(false);
      setIsAdLoading(true);
      console.log('[SupportAdButton] 🔄 Reloading ad for next time');
      ad.load();
    });

    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, error => {
      console.error('[SupportAdButton] 💥 Rewarded ad error:', error);
      logEvent(AnalyticsEvents.USER_SUPPORT_AD_ERROR, { 
        screen,
        error_code: String((error as any)?.code || 'unknown'),
      });

      setIsAdLoaded(false);
      setIsAdLoading(false);
      setIsShowingAd(false);
      adEarnedRewardRef.current = false;

      // Retry loading after a delay
      setTimeout(() => {
        console.log('[SupportAdButton] 🔄 Retrying ad load after error');
        setIsAdLoading(true);
        ad.load();
      }, 5000);
    });

    // Load the ad
    console.log('[SupportAdButton] 📱 Initializing rewarded ad');
    ad.load();
    setRewardedAd(ad);

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [screen, onAdWatched, isPremium]);

  const handlePress = useCallback(async () => {
    if (!rewardedAd || !isAdLoaded) {
      console.log('[SupportAdButton] ⚠️ Ad not ready yet');
      return;
    }

    logEvent(AnalyticsEvents.USER_SUPPORT_AD_CLICKED, { screen });

    try {
      setIsShowingAd(true);
      console.log('[SupportAdButton] 📺 Showing rewarded ad');
      await rewardedAd.show();
      logEvent(AnalyticsEvents.USER_SUPPORT_AD_SHOWN, { screen });
    } catch (error) {
      console.error('[SupportAdButton] Failed to show ad:', error);
      setIsShowingAd(false);
      logEvent(AnalyticsEvents.USER_SUPPORT_AD_SHOW_FAILED, { 
        screen,
        error: String(error),
      });
    }
  }, [rewardedAd, isAdLoaded, screen]);

  const handleCloseThankYouModal = useCallback(() => {
    setShowThankYouModal(false);
  }, []);

  // Don't render for premium users (after all hooks)
  // Also hide while loading premium status to avoid flicker
  if (isPremium || isPremiumLoading) {
    return null;
  }

  const isDisabled = !isAdLoaded || isShowingAd;

  return (
    <>
    <TouchableOpacity
      style={[
        styles.container,
        isDisabled && styles.containerDisabled,
        style,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        {isAdLoading ? (
          <ActivityIndicator size="small" color={colors.primary[500]} />
        ) : (
          <Icon 
            name="play-circle" 
            size={24} 
            color={isDisabled ? colors.text.tertiary : colors.primary[500]} 
          />
        )}
      </View>
      <View style={styles.textContainer}>
        <Text 
          style={[styles.title, isDisabled && styles.titleDisabled]}
          numberOfLines={1}
        >
          {t('supportAd.title')}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {isAdLoading 
            ? t('supportAd.loading') 
            : isAdLoaded 
              ? t('supportAd.subtitle')
              : t('supportAd.unavailable')
          }
        </Text>
      </View>
      <Icon 
        name="heart" 
        size={16} 
        color={isDisabled ? colors.text.tertiary : colors.error[500]} 
        style={styles.heartIcon}
      />
    </TouchableOpacity>

    <SupportThankYouModal
      visible={showThankYouModal}
      onClose={handleCloseThankYouModal}
    />
    </>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.padding.md,
    borderWidth: 1,
    borderColor: colors.primary[100],
    ...spacing.shadow.sm,
  },
  containerDisabled: {
    opacity: 0.7,
    borderColor: colors.border.light,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.margin.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.margin.xs,
    textAlign: 'left'
  },
  titleDisabled: {
    color: colors.text.secondary,
  },
  subtitle: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'left'
  },
  heartIcon: {
    marginLeft: spacing.margin.sm,
  },
});

export default SupportAdButton;

