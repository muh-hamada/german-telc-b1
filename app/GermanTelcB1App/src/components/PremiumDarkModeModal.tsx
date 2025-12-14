import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import { usePremium } from '../contexts/PremiumContext';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';

interface PremiumDarkModeModalProps {
  visible: boolean;
  onClose: () => void;
  onViewBenefits: () => void;
}

const PremiumDarkModeModal: React.FC<PremiumDarkModeModalProps> = ({
  visible,
  onClose,
  onViewBenefits,
}) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const { purchasePremium, isPurchasing, productPrice, isLoadingProduct } = usePremium();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handlePurchase = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    await purchasePremium();
    onClose();
  };

  const isPurchaseDisabled = isPurchasing || isLoadingProduct;
  const price = productPrice || '...';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Icon name="moon-o" size={40} color={colors.primary[500]} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {t('premium.darkModeModal.title')}
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            {t('premium.darkModeModal.description')}
          </Text>

          {/* Purchase Button - Full Width CTA */}
          <TouchableOpacity
            style={[styles.purchaseButton, isPurchaseDisabled && styles.buttonDisabled]}
            onPress={handlePurchase}
            disabled={isPurchaseDisabled}
            activeOpacity={0.85}
          >
            {isPurchasing || isLoadingProduct ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.purchaseButtonText}>
                {t('premium.darkModeModal.buyNow')} • {price}
              </Text>
            )}
          </TouchableOpacity>

          {/* View Benefits Button - Full Width */}
          <TouchableOpacity
            style={styles.benefitsButton}
            onPress={onViewBenefits}
            disabled={isPurchasing}
          >
            <Text style={styles.benefitsButtonText}>
              {t('premium.darkModeModal.viewBenefits')}
            </Text>
            <Icon name="chevron-right" size={12} color={colors.primary[500]} style={styles.chevronIcon} />
          </TouchableOpacity>

          {/* Maybe Later Button */}
          <TouchableOpacity
            style={styles.laterButton}
            onPress={onClose}
            disabled={isPurchasing}
          >
            <Text style={styles.laterButtonText}>
              {t('premium.darkModeModal.maybeLater')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Login Modal */}
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
      />
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.padding.lg,
    },
    modalContainer: {
      backgroundColor: colors.background.primary,
      borderRadius: spacing.borderRadius.xl,
      width: '100%',
      maxWidth: 400,
      padding: spacing.padding.xl,
      alignItems: 'center',
      ...spacing.shadow.lg,
    },
    iconContainer: {
      marginBottom: spacing.margin.lg,
    },
    iconBackground: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary[100],
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      ...typography.textStyles.h3,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.margin.sm,
      textAlign: 'center',
    },
    description: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing.margin.xl,
      lineHeight: 22,
      paddingHorizontal: spacing.padding.sm,
    },
    purchaseButton: {
      backgroundColor: colors.success[500],
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.xl,
      borderRadius: spacing.borderRadius.lg,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.margin.sm,
      shadowColor: colors.success[500],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    purchaseButtonText: {
      ...typography.textStyles.body,
      color: colors.text.inverse,
      fontWeight: typography.fontWeight.bold,
      fontSize: 16,
    },
    benefitsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.xl,
      borderRadius: spacing.borderRadius.lg,
      width: '100%',
      backgroundColor: colors.primary[100],
      marginBottom: spacing.margin.sm,
    },
    benefitsButtonText: {
      ...typography.textStyles.body,
      color: colors.primary[600],
      fontWeight: typography.fontWeight.semibold,
      fontSize: 15,
    },
    chevronIcon: {
      marginLeft: spacing.margin.xs,
    },
    laterButton: {
      paddingVertical: spacing.padding.sm,
      paddingHorizontal: spacing.padding.md,
    },
    laterButtonText: {
      ...typography.textStyles.body,
      color: colors.text.tertiary,
      fontSize: 14,
    },
  });

export default PremiumDarkModeModal;

