/**
 * Already Premium View
 * 
 * A reusable component that displays a success message when user already has premium.
 * Used in both PremiumScreen and PremiumUpsellModal.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';

interface AlreadyPremiumViewProps {
  onClose?: () => void;
  showCloseButton?: boolean;
}

const AlreadyPremiumView: React.FC<AlreadyPremiumViewProps> = ({
  onClose,
  showCloseButton = false,
}) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.bgShapeTop} />
      <View style={styles.bgShapeBottom} />
      
      {showCloseButton && onClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="times" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      )}

      <View style={styles.contentContainer}>
        <View style={styles.premiumBadge}>
          <Icon name="star" size={48} color="#F59E0B" />
        </View>
        <Text style={styles.title}>{t('premium.screen.alreadyPremium')}</Text>
        <Text style={styles.message}>{t('premium.screen.thankYou')}</Text>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  bgShapeTop: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary[200],
    opacity: 0.6,
  },
  bgShapeBottom: {
    position: 'absolute',
    bottom: -80,
    left: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primary[100],
    opacity: 0.5,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.padding.xl,
  },
  premiumBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.margin.lg,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.margin.sm,
  },
  message: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default AlreadyPremiumView;

