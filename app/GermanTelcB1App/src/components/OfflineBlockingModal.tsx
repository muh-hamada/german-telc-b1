import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, Image } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { usePremium } from '../contexts/PremiumContext';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import Icon from 'react-native-vector-icons/FontAwesome';

const OfflineBlockingModal: React.FC = () => {
  const { isPremium, isLoading: isPremiumLoading } = usePremium();
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // If state.isConnected is null, we assume connected until we know otherwise
      setIsConnected(state.isConnected ?? true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Only show if:
  // 1. We know connection status (isConnected !== null)
  // 2. Not connected
  // 3. Not premium (and premium status loaded)
  // 4. We are not loading premium status (to avoid flashing)
  const shouldShow = isConnected === false && !isPremium && !isPremiumLoading;

  return (
    <Modal
      visible={shouldShow}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon name="wifi" size={60} color={colors.text.tertiary} />
            <View style={styles.slashContainer}>
              <Icon name="slash" size={60} color={colors.error[500]} />
            </View>
          </View>
          
          <Text style={styles.title}>{t('offline.blocking.title')}</Text>
          
          <Text style={styles.description}>
            {t('offline.blocking.description')}
          </Text>

          <View style={styles.premiumHint}>
            <Icon name="star" size={20} color={colors.warning[500]} />
            <Text style={styles.premiumText}>
              {t('offline.blocking.premiumHint')}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.padding.xl,
    },
    content: {
      alignItems: 'center',
      maxWidth: 400,
    },
    iconContainer: {
      width: 120,
      height: 120,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.margin.xl,
      backgroundColor: colors.background.secondary,
      borderRadius: 60,
      ...spacing.shadow.md,
    },
    slashContainer: {
      position: 'absolute',
      transform: [{ rotate: '90deg' }],
      opacity: 0.8,
    },
    title: {
      ...typography.textStyles.h2,
      color: colors.text.primary,
      marginBottom: spacing.margin.md,
      textAlign: 'center',
    },
    description: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing.margin.xl,
      lineHeight: 24,
      paddingHorizontal: spacing.padding.lg,
    },
    premiumHint: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.warning[50],
      paddingHorizontal: spacing.padding.md,
      paddingVertical: spacing.padding.sm,
      borderRadius: spacing.borderRadius.full,
      gap: spacing.margin.sm,
      borderWidth: 1,
      borderColor: colors.warning[200],
    },
    premiumText: {
      ...typography.textStyles.bodySmall,
      color: colors.warning[800],
      fontWeight: typography.fontWeight.semibold,
    },
  });

export default OfflineBlockingModal;

