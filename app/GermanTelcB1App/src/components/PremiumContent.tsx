import React, { useMemo, useState } from 'react';
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
import { spacing, type ThemeColors } from '../theme';
import { usePremium } from '../contexts/PremiumContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FeatureColorScheme = { bg: string; icon: string };
type PremiumStyles = ReturnType<typeof createStyles>;

interface PremiumContentProps {
  onPurchase: () => void;
  onClose?: () => void;
  onRestore?: () => void;
  isPurchasing?: boolean;
  isRestoring?: boolean;
  showCloseButton?: boolean;
  showRestoreButton?: boolean;
  showPurchaseButton?: boolean;
  isModal?: boolean;
  isPremium?: boolean;
}

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
  colorScheme: { bg: string; icon: string };
  styles: PremiumStyles;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description, colorScheme, styles }) => (
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
const Sparkles: React.FC<{ styles: PremiumStyles }> = ({ styles }) => (
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
  isModal = false,
  isPremium = false,
}) => {
  const { t } = useCustomTranslation();
  const { user } = useAuth();
  const { productPrice, isProductAvailable, isLoadingProduct } = usePremium();
  const { colors, mode } = useAppTheme();
  const isDarkMode = mode === 'dark';
  const price = productPrice || '...';

  // Internal state for login modal
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Disable purchase if product is loading or not available
  const isPurchaseDisabled = isPurchasing || isRestoring || isLoadingProduct || !isProductAvailable;
  const featureColors = useMemo(() => getFeatureColors(isDarkMode, colors), [colors, isDarkMode]);
  const styles = useMemo(() => createStyles(colors, isDarkMode), [colors, isDarkMode]);

  // Handle purchase with authentication check
  const handlePurchaseClick = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    onPurchase();
  };

  // Handle restore with authentication check
  const handleRestoreClick = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (onRestore) {
      onRestore();
    }
  };

  return (
    <View style={styles.container}>
      {/* Background decorative shapes */}
      <View style={styles.bgShapeTop} />
      <View style={styles.bgShapeBottom} />

      <Sparkles styles={styles} />

      {showCloseButton && onClose && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="times" size={18} color={colors.text.primary} />
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{
            isPremium ? t('premium.screen.yourBenefits') : t('premium.screen.whyPremium')
          }</Text>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{
          isPremium ? t('premium.screen.fullPotential') : t('premium.screen.oneTimePurchase')
        }</Text>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <FeatureItem
            icon="ban"
            title={t('premium.features.adFree.title')}
            description={t('premium.features.adFree.description')}
            colorScheme={featureColors.adFree}
            styles={styles}
          />
          <FeatureItem
            icon="magic"
            title={t('premium.features.aiSpeaking.title')}
            description={t('premium.features.aiSpeaking.description')}
            colorScheme={featureColors.aiSpeaking}
            styles={styles}
          />
          <FeatureItem
            icon="download"
            title={t('premium.features.offline.title')}
            description={t('premium.features.offline.description')}
            colorScheme={featureColors.offline}
            styles={styles}
          />
          <FeatureItem
            icon="snowflake-o"
            title={t('premium.features.streakFreeze.title')}
            description={t('premium.features.streakFreeze.description')}
            colorScheme={featureColors.streakFreeze}
            styles={styles}
          />
          <FeatureItem
            icon="heart"
            title={t('premium.features.support.title')}
            description={t('premium.features.support.description')}
            colorScheme={featureColors.support}
            styles={styles}
          />
          <FeatureItem
            icon="moon-o"
            title={t('premium.features.darkTheme.title')}
            description={t('premium.features.darkTheme.description')}
            colorScheme={featureColors.darkTheme}
            styles={styles}
          />
        </View>
      </ScrollView>

      {/* Fixed CTA Section at Bottom */}
      {!isPremium && <View style={[styles.ctaSection, { paddingBottom: isModal ? spacing.padding.sm : spacing.padding.lg }]}>
        <TouchableOpacity
          style={[styles.purchaseButton, isPurchaseDisabled && styles.purchaseButtonDisabled]}
          onPress={handlePurchaseClick}
          disabled={isPurchaseDisabled}
          activeOpacity={0.85}
        >
          {isPurchasing || isLoadingProduct ? (
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
            onPress={handleRestoreClick}
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
      </View>}

      {/* Login Modal */}
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
      />
    </View>
  );
};

const getFeatureColors = (isDarkMode: boolean, colors: ThemeColors): Record<string, FeatureColorScheme> => ({
  adFree: {
    bg: isDarkMode ? colors.secondary[300] : '#d6e8ff',
    icon: colors.primary[600],
  },
  aiSpeaking: {
    bg: isDarkMode ? colors.secondary[300] : '#d5f0d7',
    icon: colors.success[700],
  },
  offline: {
    bg: isDarkMode ? colors.primary[200] : '#F3E8FF',
    icon: colors.primary[700],
  },
  streakFreeze: {
    bg: isDarkMode ? colors.secondary[200] : '#c8f7ff',
    icon: colors.success[600],
  },
  support: {
    bg: isDarkMode ? colors.secondary[300] : '#FCE7F3',
    icon: colors.error[600],
  },
  darkTheme: {
    bg: isDarkMode ? colors.secondary[200] : '#1e293b',
    icon: isDarkMode ? colors.warning[600] : '#fbbf24',
  },
});

const createStyles = (colors: ThemeColors, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.padding.lg,
      paddingTop: spacing.padding.xl,
      paddingBottom: spacing.padding.md,
    },

    // Background shapes
    bgShapeTop: {
      position: 'absolute',
      top: -50,
      right: -30,
      width: SCREEN_WIDTH * 0.55,
      height: SCREEN_WIDTH * 0.55,
      borderRadius: SCREEN_WIDTH * 0.275,
      backgroundColor: isDarkMode ? colors.primary[300] : colors.primary[100],
      opacity: isDarkMode ? 0.35 : 0.45,
    },
    bgShapeBottom: {
      position: 'absolute',
      bottom: -80,
      left: -60,
      width: SCREEN_WIDTH * 0.8,
      height: SCREEN_WIDTH * 0.8,
      borderRadius: SCREEN_WIDTH * 0.4,
      backgroundColor: isDarkMode ? colors.secondary[300] : colors.primary[50],
      opacity: isDarkMode ? 0.25 : 0.35,
    },

    // Close button (back arrow)
    closeButton: {
      position: 'absolute',
      top: 20,
      right: 16,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
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
      color: colors.primary[500],
    },
    sparkle2: {
      fontSize: 18,
      top: '65%',
      left: '35%',
      color: colors.primary[700],
    },
    sparkle3: {
      fontSize: 8,
      top: '82%',
      right: '70%',
      color: colors.warning[600],
    },
    // Row 2 - Upper middle (25-45%)
    sparkle4: {
      fontSize: 24,
      top: '38%',
      right: '10%',
      color: colors.primary[600],
    },
    sparkle5: {
      fontSize: 12,
      top: '42%',
      left: '55%',
      color: colors.secondary[700],
    },
    sparkle6: {
      fontSize: 22,
      top: '80%',
      right: '38%',
      color: colors.error[600],
    },
    // Row 3 - Middle (45-65%)
    sparkle7: {
      fontSize: 14,
      top: '60%',
      left: '25%',
      color: colors.secondary[700],
    },
    sparkle8: {
      fontSize: 17,
      top: '65%',
      right: '25%',
      color: colors.warning[600],
    },
    sparkle9: {
      fontSize: 9,
      top: '70%',
      left: '60%',
      color: colors.primary[400],
    },
    // Row 4 - Lower (65-85%)
    sparkle10: {
      fontSize: 16,
      bottom: '0%',
      left: '45%',
      color: colors.success[600],
    },
    sparkle11: {
      fontSize: 13,
      top: '85%',
      left: '40%',
      color: colors.error[700],
    },
    sparkle12: {
      fontSize: 10,
      top: '90%',
      right: '15%',
      color: colors.secondary[600],
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

    // CTA section - fixed at bottom
    ctaSection: {
      paddingHorizontal: spacing.padding.lg,
      paddingTop: spacing.padding.lg,
      paddingBottom: spacing.padding.lg,
      backgroundColor: colors.background.secondary,
      borderTopRightRadius: spacing.borderRadius['2xl'],
      borderTopLeftRadius: spacing.borderRadius['2xl'],
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    purchaseButton: {
      backgroundColor: colors.success[500],
      borderRadius: 28,
      paddingVertical: 18,
      paddingHorizontal: spacing.padding.xl,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.margin.sm,
      shadowColor: colors.success[500],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
    purchaseButtonDisabled: {
      opacity: 0.7,
    },
    purchaseButtonText: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text.inverse,
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
