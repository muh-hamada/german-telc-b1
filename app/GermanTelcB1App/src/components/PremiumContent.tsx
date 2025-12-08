import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing } from '../theme';
import { usePremium } from '../contexts/PremiumContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Feature colors
const FEATURE_COLORS = {
  adFree: { bg: '#d6e8ff', icon: '#3B82F6' },
  offline: { bg: '#F3E8FF', icon: '#8B5CF6' },
  streakFreeze: { bg: '#c8f7ff', icon: '#42bbd0' },
  support: { bg: '#FCE7F3', icon: '#EC4899' },
};

interface PremiumContentProps {
  onPurchase: () => void;
  onClose?: () => void;
  onRestore?: () => void;
  isPurchasing?: boolean;
  isRestoring?: boolean;
  showCloseButton?: boolean;
  showRestoreButton?: boolean;
}

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
  colorScheme: { bg: string; icon: string };
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description, colorScheme }) => (
  <View style={styles.featureItem}>
    <View style={[styles.featureIconContainer, { backgroundColor: colorScheme.bg }]}>
      <Icon name={icon} size={22} color={colorScheme.icon} />
    </View>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

// Decorative sparkles
const Sparkles: React.FC = () => (
  <View style={styles.sparklesContainer}>
    <View style={styles.sparklesInnerContainer}>
      {/* Large sparkles */}
      <Text style={[styles.sparkle, styles.sparkle1]}>✦</Text>
      <Text style={[styles.sparkle, styles.sparkle2]}>✦</Text>
      {/* Medium sparkles */}
      <Text style={[styles.sparkle, styles.sparkle3]}>✧</Text>
      <Text style={[styles.sparkle, styles.sparkle4]}>✦</Text>
      <Text style={[styles.sparkle, styles.sparkle5]}>✧</Text>
      {/* Small sparkles */}
      <Text style={[styles.sparkle, styles.sparkle6]}>✦</Text>
      <Text style={[styles.sparkle, styles.sparkle7]}>✧</Text>
      <Text style={[styles.sparkle, styles.sparkle8]}>✦</Text>
      {/* Tiny sparkles */}
      <Text style={[styles.sparkle, styles.sparkle9]}>✧</Text>
      <Text style={[styles.sparkle, styles.sparkle10]}>✦</Text>
      <Text style={[styles.sparkle, styles.sparkle11]}>✧</Text>
      <Text style={[styles.sparkle, styles.sparkle12]}>✦</Text>
    </View>
  </View>
);

const PremiumContent: React.FC<PremiumContentProps> = ({
  onPurchase,
  onClose,
  onRestore,
  isPurchasing = false,
  isRestoring = false,
  showCloseButton = false,
  showRestoreButton = false,
}) => {
  const { t } = useCustomTranslation();
  const { productPrice } = usePremium();
  const price = productPrice || '...';

  return (
    <View style={styles.container}>
      {/* Background decorative shapes */}
      <View style={styles.bgShapeTop} />
      <View style={styles.bgShapeBottom} />

      <Sparkles />

      {showCloseButton && onClose && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="times" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('premium.screen.whyPremium')}</Text>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{t('premium.screen.oneTimePurchase')}</Text>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <FeatureItem
            icon="ban"
            title={t('premium.features.adFree.title')}
            description={t('premium.features.adFree.description')}
            colorScheme={FEATURE_COLORS.adFree}
          />
          <FeatureItem
            icon="download"
            title={t('premium.features.offline.title')}
            description={t('premium.features.offline.description')}
            colorScheme={FEATURE_COLORS.offline}
          />
          <FeatureItem
            icon="snowflake-o"
            title={t('premium.features.streakFreeze.title')}
            description={t('premium.features.streakFreeze.description')}
            colorScheme={FEATURE_COLORS.streakFreeze}
          />
          <FeatureItem
            icon="heart"
            title={t('premium.features.support.title')}
            description={t('premium.features.support.description')}
            colorScheme={FEATURE_COLORS.support}
          />
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={[styles.purchaseButton, isPurchasing && styles.purchaseButtonDisabled]}
            onPress={onPurchase}
            disabled={isPurchasing || isRestoring}
            activeOpacity={0.85}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.purchaseButtonText}>
                {t('premium.screen.unlockNow')} • {price}
              </Text>
            )}
          </TouchableOpacity>

          {/* Restore or Later button */}
          {showRestoreButton && onRestore ? (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onRestore}
              disabled={isPurchasing || isRestoring}
            >
              {isRestoring ? (
                <ActivityIndicator color={colors.text.secondary} size="small" />
              ) : (
                <Text style={styles.restoreButtonText}>{t('premium.screen.restorePurchases')}</Text>
              )}
            </TouchableOpacity>
          ) : onClose && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onClose}
              disabled={isPurchasing}
            >
              <Text style={styles.laterButtonText}>{t('premium.upsell.maybeLater')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5fbff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.padding.lg,
    paddingTop: spacing.padding.xl,
    paddingBottom: spacing.padding.xl,
  },

  // Background shapes
  bgShapeTop: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: SCREEN_WIDTH * 0.55,
    height: SCREEN_WIDTH * 0.55,
    borderRadius: SCREEN_WIDTH * 0.275,
    backgroundColor: '#E9D5FF',
    opacity: 0.6,
  },
  bgShapeBottom: {
    position: 'absolute',
    bottom: -80,
    left: -60,
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
    backgroundColor: '#DBEAFE',
    opacity: 0.5,
  },

  // Close button
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.margin.sm,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text.primary,
    lineHeight: 44,
    flex: 1,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 18,
    color: colors.text.secondary,
    marginBottom: spacing.margin['2xl'],
    textAlign: 'left',
  },

  // Sparkles
  sparklesContainer: {
    top: -100,
    right: 0,
    width: SCREEN_WIDTH * 0.55,
    height: SCREEN_WIDTH * 0.55,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  sparklesInnerContainer: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    height: '100%',
  },
  sparkle: {
    position: 'absolute',
  },
  // Row 1 - Top (0-25%)
  sparkle1: {
    fontSize: 10,
    top: '100%',
    right: '25%',
    color: 'orange', // Light cyan
  },
  sparkle2: {
    fontSize: 18,
    top: '65%',
    left: '35%',
    color: '#8B5CF6', // Purple
  },
  sparkle3: {
    fontSize: 8,
    top: '82%',
    right: '70%',
    color: '#FBBF24', // Yellow
  },
  // Row 2 - Upper middle (25-45%)
  sparkle4: {
    fontSize: 24,
    top: '38%',
    left: '10%',
    color: '#6366F1', // Indigo
  },
  sparkle5: {
    fontSize: 12,
    top: '42%',
    left: '55%',
    color: '#818CF8', // Light indigo
  },
  sparkle6: {
    fontSize: 22,
    top: '80%',
    right: '38%',
    color: '#EC4899', // Pink
  },
  // Row 3 - Middle (45-65%)
  sparkle7: {
    fontSize: 14,
    top: '60%',
    left: '25%',
    color: '#A78BFA', // Light purple
  },
  sparkle8: {
    fontSize: 17,
    top: '65%',
    right: '25%',
    color: '#F59E0B', // Amber
  },
  sparkle9: {
    fontSize: 9,
    top: '70%',
    left: '60%',
    color: '#C084FC', // Lighter purple
  },
  // Row 4 - Lower (65-85%)
  sparkle10: {
    fontSize: 16,
    bottom: '0%',
    left: '45%',
    color: '#06B6D4', // Cyan
  },
  sparkle11: {
    fontSize: 13,
    top: '85%',
    left: '40%',
    color: '#F472B6', // Light pink
  },
  sparkle12: {
    fontSize: 10,
    top: '90%',
    right: '15%',
    color: '#34D399', // Emerald
  },

  // Features section
  featuresSection: {
    marginBottom: spacing.margin.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.margin.lg,
  },
  featureIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.margin.md,
  },
  featureContent: {
    flex: 1,
    paddingTop: 4,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
    textAlign: 'left',
  },
  featureDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    textAlign: 'left',
  },

  // CTA section
  ctaSection: {
    marginBottom: spacing.margin.lg,
  },
  purchaseButton: {
    backgroundColor: '#16A34A',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: spacing.padding.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.margin.md,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  purchaseButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    paddingVertical: spacing.padding.sm,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  restoreButtonText: {
    fontSize: 15,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
});

export default PremiumContent;
