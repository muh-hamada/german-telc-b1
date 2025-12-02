import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { RewardedAd, RewardedAdEventType, TestIds, AdEventType } from 'react-native-google-mobile-ads';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';
import { activeExamConfig } from '../config/active-exam.config';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import SupportThankYouModal from './SupportThankYouModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Ad Unit ID for user support rewarded ad
const USER_SUPPORT_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.select({
      ios: activeExamConfig.ads.userSupport.ios,
      android: activeExamConfig.ads.userSupport.android,
    })!;

interface SupportAdScreenProps {
  /**
   * Called when user watches the ad or skips
   */
  onContinue: () => void;
  /**
   * Screen identifier for analytics
   */
  screen?: string;
}

/**
 * SupportAdScreen Component
 * 
 * An inline screen asking users to support the app by watching an ad.
 * Rendered between grammar questions every N questions.
 */
const SupportAdScreen: React.FC<SupportAdScreenProps> = ({
  onContinue,
  screen = 'unknown',
}) => {
  const { t } = useCustomTranslation();
  const [rewardedAd, setRewardedAd] = useState<RewardedAd | null>(null);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(true);
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const adEarnedRewardRef = useRef<boolean>(false);

  // Initialize and load rewarded ad
  useEffect(() => {
    const ad = RewardedAd.createForAdRequest(USER_SUPPORT_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });

    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('[SupportAdScreen] ✅ Rewarded ad loaded successfully');
      setIsAdLoaded(true);
      setIsAdLoading(false);
    });

    const unsubscribeEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        console.log('[SupportAdScreen] 🎁 User earned reward:', reward);
        adEarnedRewardRef.current = true;
        logEvent(AnalyticsEvents.USER_SUPPORT_AD_EARNED_REWARD, { 
          screen,
          ad_unit_id: USER_SUPPORT_AD_UNIT_ID,
        });
      }
    );

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('[SupportAdScreen] ❌ Rewarded ad closed', {
        earnedReward: adEarnedRewardRef.current,
      });
      logEvent(AnalyticsEvents.USER_SUPPORT_AD_CLOSED, { 
        screen,
        earned_reward: adEarnedRewardRef.current,
      });

      setIsShowingAd(false);

      // Show thank you modal if user earned reward
      if (adEarnedRewardRef.current) {
        setShowThankYouModal(true);
      } else {
        // If user didn't earn reward, just continue
        onContinue();
      }

      // Reset the flag for next time
      adEarnedRewardRef.current = false;
    });

    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, error => {
      console.error('[SupportAdScreen] 💥 Rewarded ad error:', error);
      logEvent(AnalyticsEvents.USER_SUPPORT_AD_ERROR, { 
        screen,
        error_code: String((error as any)?.code || 'unknown'),
      });

      setIsAdLoaded(false);
      setIsAdLoading(false);
      setIsShowingAd(false);
      adEarnedRewardRef.current = false;
    });

    // Load the ad
    console.log('[SupportAdScreen] 📱 Initializing rewarded ad');
    setIsAdLoading(true);
    ad.load();
    setRewardedAd(ad);

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [screen, onContinue]);

  const handleWatchAd = useCallback(async () => {
    if (!rewardedAd || !isAdLoaded) {
      console.log('[SupportAdScreen] ⚠️ Ad not ready yet');
      return;
    }

    logEvent(AnalyticsEvents.USER_SUPPORT_AD_CLICKED, { screen });

    try {
      setIsShowingAd(true);
      console.log('[SupportAdScreen] 📺 Showing rewarded ad');
      await rewardedAd.show();
      logEvent(AnalyticsEvents.USER_SUPPORT_AD_SHOWN, { screen });
    } catch (error) {
      console.error('[SupportAdScreen] Failed to show ad:', error);
      setIsShowingAd(false);
      logEvent(AnalyticsEvents.USER_SUPPORT_AD_SHOW_FAILED, { 
        screen,
        error: String(error),
      });
    }
  }, [rewardedAd, isAdLoaded, screen]);

  const handleSkip = useCallback(() => {
    logEvent(AnalyticsEvents.USER_SUPPORT_AD_CLOSED, { 
      screen,
      skipped: true,
    });
    onContinue();
  }, [screen, onContinue]);

  const handleCloseThankYouModal = useCallback(() => {
    setShowThankYouModal(false);
    onContinue();
  }, [onContinue]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Image */}
        <Image
          source={require('../../assets/images/support_us_watch_ads.png')}
          style={styles.image}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={styles.title}>{t('supportAdModal.title')}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{t('supportAdModal.subtitle')}</Text>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Watch Ad Button */}
          <TouchableOpacity
            style={[
              styles.watchAdButton,
              (!isAdLoaded || isShowingAd) && styles.buttonDisabled,
            ]}
            onPress={handleWatchAd}
            disabled={!isAdLoaded || isShowingAd}
            activeOpacity={0.8}
          >
            {isAdLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.watchAdButtonText}>
                {t('supportAdModal.watchAd')}
              </Text>
            )}
          </TouchableOpacity>

          {/* Skip Button */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.8}
          >
            <Text style={styles.skipButtonText}>
              {t('supportAdModal.skip')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <SupportThankYouModal
        visible={showThankYouModal}
        onClose={handleCloseThankYouModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.padding.lg,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  image: {
    width: SCREEN_WIDTH * 0.65,
    height: SCREEN_WIDTH * 0.65,
    marginBottom: spacing.margin.xl,
  },
  title: {
    ...typography.textStyles.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.margin.sm,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.margin.xl,
    lineHeight: 24,
    paddingHorizontal: spacing.padding.md,
  },
  buttonsContainer: {
    width: '100%',
    gap: spacing.margin.md,
  },
  watchAdButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.lg,
    paddingHorizontal: spacing.padding.xl,
    borderRadius: spacing.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...spacing.shadow.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  watchAdButtonText: {
    ...typography.textStyles.body,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
    fontSize: 16,
  },
  skipButton: {
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    ...typography.textStyles.body,
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.medium,
  },
});

export default SupportAdScreen;

