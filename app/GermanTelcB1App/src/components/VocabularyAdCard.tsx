/**
 * Vocabulary Ad Card Component
 *
 * Displays a native ad in the same style as VocabularyCard.
 * Uses react-native-google-mobile-ads native ad support (v16+).
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  NativeAd,
  NativeAdView,
  NativeMediaView,
  NativeAsset,
  NativeAssetType,
  NativeAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { spacing, ThemeColors, typography } from '../theme';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { activeExamConfig } from '../config/active-exam.config';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import { useAppTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.padding.lg * 2;

// Get ad unit ID based on environment and platform
const getAdUnitId = (): string => {
  if (__DEV__) {
    // Use test ad unit for native ads in development
    return Platform.select({
      ios: 'ca-app-pub-3940256099942544/3986624511',
      android: 'ca-app-pub-3940256099942544/2247696110',
    }) || 'ca-app-pub-3940256099942544/2247696110';
  }
  return Platform.select({
    ios: activeExamConfig.ads.vocabularyBuilder.ios,
    android: activeExamConfig.ads.vocabularyBuilder.android,
  }) || '';
};

interface VocabularyAdCardProps {
  /**
   * Called when the ad is loaded and ready to display
   */
  onAdLoaded?: () => void;
  /**
   * Called when the ad fails to load
   */
  onAdFailedToLoad?: (error: any) => void;
  /**
   * Called when the user clicks on the ad
   */
  onAdClicked?: () => void;
  /**
   * Called when an impression is recorded
   */
  onAdImpression?: () => void;
}

const VocabularyAdCard: React.FC<VocabularyAdCardProps> = ({
  onAdLoaded,
  onAdFailedToLoad,
  onAdClicked,
  onAdImpression,
}) => {
  const { t } = useCustomTranslation();
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  const adUnitId = getAdUnitId();

  const loadAd = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      logEvent(AnalyticsEvents.VOCABULARY_NATIVE_AD_REQUESTED, {
        ad_unit_id: adUnitId,
      });

      const ad = await NativeAd.createForAdRequest(adUnitId, {});
      setNativeAd(ad);
      setIsLoading(false);
      logEvent(AnalyticsEvents.VOCABULARY_NATIVE_AD_LOADED, {
        ad_unit_id: adUnitId,
      });
      onAdLoaded?.();

      // Wire up events
      ad.addAdEventListener(NativeAdEventType.IMPRESSION, () => {
        logEvent(AnalyticsEvents.VOCABULARY_NATIVE_AD_IMPRESSION, {
          ad_unit_id: adUnitId,
        });
        onAdImpression?.();
      });
      ad.addAdEventListener(NativeAdEventType.CLICKED, () => {
        logEvent(AnalyticsEvents.VOCABULARY_NATIVE_AD_CLICKED, {
          ad_unit_id: adUnitId,
        });
        onAdClicked?.();
      });
    } catch (error: any) {
      console.error('[VocabularyAdCard] Native ad failed to load:', error);
      setIsLoading(false);
      setHasError(true);
      logEvent(AnalyticsEvents.VOCABULARY_NATIVE_AD_FAILED, {
        ad_unit_id: adUnitId,
        error_code: error?.code || 'unknown',
        error_message: error?.message || 'Unknown error',
      });
      onAdFailedToLoad?.(error);
    }
  }, [adUnitId, onAdClicked, onAdFailedToLoad, onAdImpression, onAdLoaded]);

  // Load ad when component mounts
  useEffect(() => {
    loadAd();
  }, [loadAd]);

  // Cleanup native ad on unmount
  useEffect(() => {
    return () => {
      nativeAd?.destroy();
    };
  }, [nativeAd]);

  if (!adUnitId) {
    console.warn('[VocabularyAdCard] No ad unit ID configured');
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Loading state */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        )}

        {/* Error state */}
        {hasError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{t('errors.adLoadFailed')}</Text>
          </View>
        )}

        {/* Ad content */}
        {!isLoading && !hasError && nativeAd && (
          <NativeAdView nativeAd={nativeAd} style={styles.nativeAdView}>
            <View style={styles.cardContent}>
              <View style={styles.mediaContainer}>
                <NativeMediaView style={styles.mediaView} resizeMode="cover" />
              </View>

              <NativeAsset assetType={NativeAssetType.HEADLINE}>
                <Text style={styles.headline}>{nativeAd.headline}</Text>
              </NativeAsset>

              <NativeAsset assetType={NativeAssetType.BODY}>
                <Text style={styles.tagline} numberOfLines={2}>
                  {nativeAd.body}
                </Text>
              </NativeAsset>

              <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                <Text style={styles.advertiser}>{nativeAd.advertiser}</Text>
              </NativeAsset>

              <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
                <TouchableOpacity style={styles.callToAction} activeOpacity={0.9}>
                  <Text style={styles.callToActionText}>
                    {nativeAd.callToAction || t('common.continue')}
                  </Text>
                </TouchableOpacity>
              </NativeAsset>
            </View>
          </NativeAdView>
        )}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: 450,
    alignSelf: 'center',
  },
  nativeAdView: {
    width: '100%',
    height: '100%',
  },
  card: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: spacing.padding.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginTop: spacing.margin.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  cardContent: {
    flex: 1,
  },
  adBadgeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  adBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.padding.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adBadgeText: {
    ...typography.textStyles.caption,
    color: colors.primary[700],
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  mediaContainer: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.margin.md,
    backgroundColor: colors.background.tertiary,
  },
  mediaView: {
    width: '100%',
    height: '100%',
  },
  headline: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  tagline: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.margin.sm,
    lineHeight: 20,
  },
  advertiser: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
    marginBottom: spacing.margin.md,
  },
  callToAction: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  callToActionText: {
    ...typography.textStyles.body,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
});

export default VocabularyAdCard;

