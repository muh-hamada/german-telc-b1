/**
 * App Review Modal Component
 * 
 * A beautiful and engaging modal that prompts users to review the app
 * after they have a positive experience.
 */

import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';

interface AppReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onRate: () => void;
  onDismiss: () => void;
}

const AppReviewModal: React.FC<AppReviewModalProps> = ({
  visible,
  onClose,
  onRate,
  onDismiss,
}) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleRate = () => {
    onRate();
    onClose();
  };

  const handleDismiss = () => {
    onDismiss();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>⭐</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {t('review.title')}
          </Text>

          {/* Message */}
          <Text style={styles.message}>
            {t('review.message')}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Rate Button */}
            <TouchableOpacity
              style={styles.rateButton}
              onPress={handleRate}
              activeOpacity={0.8}
            >
              <Text style={styles.rateButtonText}>
                {t('review.rateButton')}
              </Text>
            </TouchableOpacity>

            {/* Later Button */}
            <TouchableOpacity
              style={styles.laterButton}
              onPress={handleDismiss}
              activeOpacity={0.7}
            >
              <Text style={styles.laterButtonText}>
                {t('review.laterButton')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.xl,
      padding: spacing.padding.xl,
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary[50],
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.margin.lg,
    },
    icon: {
      fontSize: 48,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: spacing.margin.md,
    },
    message: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: spacing.margin.xl,
    },
    buttonContainer: {
      width: '100%',
      gap: spacing.margin.md,
    },
    rateButton: {
      backgroundColor: colors.primary[500],
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      borderRadius: spacing.borderRadius.lg,
      alignItems: 'center',
      shadowColor: colors.primary[500],
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    rateButtonText: {
      color: colors.text.primary,
      fontSize: 17,
      fontWeight: '600',
    },
    laterButton: {
      backgroundColor: 'transparent',
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      borderRadius: spacing.borderRadius.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    laterButtonText: {
      color: colors.text.secondary,
      fontSize: 16,
      fontWeight: '500',
    },
  });

export default AppReviewModal;

