/**
 * Cross-App Promotion Button
 * 
 * Reusable button/card to promote other apps from the developer.
 * Shows only when hero app is configured. When clicked, opens the cross-app promotion modal.
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, I18nManager, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAppTheme } from '../contexts/ThemeContext';
import { useCrossAppPromotion } from '../contexts/CrossAppPromotionContext';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../theme';

interface CrossAppPromotionButtonProps {
  /** Screen/location identifier for analytics (e.g., 'profile', 'home', 'settings') */
  placement: string;
  /** Optional custom style for the container */
  style?: ViewStyle;
  /** Optional variant - 'card' (default) or 'inline' */
  variant?: 'card' | 'inline';
}

const CrossAppPromotionButton: React.FC<CrossAppPromotionButtonProps> = ({ 
  placement,
  style, 
  variant = 'card' 
}) => {
  const { colors } = useAppTheme();
  const { t } = useCustomTranslation();
  const { heroApp, showPromoModal } = useCrossAppPromotion();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Don't render if no hero app configured
  if (!heroApp) {
    return null;
  }

  const containerStyle = variant === 'card' ? styles.cardContainer : styles.inlineContainer;

  return (
    <TouchableOpacity
      style={[containerStyle, style]}
      onPress={() => showPromoModal(placement)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons name="apps" size={20} color={colors.primary[500]} />
      </View>
      <Text style={styles.text}>{t('profile.checkOutOtherApps')}</Text>
      <Icon 
        name={I18nManager.isRTL ? "chevron-left" : "chevron-right"} 
        size={20} 
        color={colors.text.tertiary} 
      />
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    cardContainer: {
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.lg,
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.margin.md,
      ...spacing.shadow.sm,
    },
    inlineContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
      backgroundColor: colors.background.secondary,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.background.tertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.margin.md,
    },
    text: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      flex: 1,
      textAlign: 'left',
    },
  });

export default CrossAppPromotionButton;
