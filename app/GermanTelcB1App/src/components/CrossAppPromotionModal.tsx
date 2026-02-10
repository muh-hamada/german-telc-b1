/**
 * Cross-App Promotion Modal
 *
 * Slide-up modal that promotes other apps from the same developer.
 * Layout: 1 hero app (full width) + 4 apps in a 2x2 grid.
 * "Maybe later" text button at the bottom to dismiss.
 */

import React, { useMemo } from 'react';
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../theme';
import { CrossAppPromotionEntry } from '../types/remote-config.types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CrossAppPromotionModalProps {
  visible: boolean;
  heroApp: CrossAppPromotionEntry | null;
  additionalApps: CrossAppPromotionEntry[];
  onMaybeLater: () => void;
  onAppClick: (appId: string, isHero: boolean) => void;
  /** When true, "maybe later" does not track dismissals (manual trigger from profile) */
  isManualTrigger?: boolean;
}

const CrossAppPromotionModal: React.FC<CrossAppPromotionModalProps> = ({
  visible,
  heroApp,
  additionalApps,
  onMaybeLater,
  onAppClick,
  isManualTrigger = false,
}) => {
  const { colors } = useAppTheme();
  const { t } = useCustomTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleAppPress = async (app: CrossAppPromotionEntry, isHero: boolean) => {
    onAppClick(app.appId, isHero);
    try {
      await Linking.openURL(app.storeUrl);
    } catch (error) {
      console.error('[CrossAppPromoModal] Failed to open store URL:', error);
    }
  };

  if (!heroApp) return null;

  const row1Apps = additionalApps.slice(0, 2);
  const row2Apps = additionalApps.slice(2, 4);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onMaybeLater}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('crossAppPromotion.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('crossAppPromotion.subtitle')}</Text>
          </View>

          {/* Hero App - Full Width */}
          <TouchableOpacity
            style={styles.heroCard}
            onPress={() => handleAppPress(heroApp, true)}
            activeOpacity={0.7}
          >
            <Image source={{ uri: heroApp.iconUrl }} style={styles.heroIcon} />
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle} numberOfLines={1}>{heroApp.title}</Text>
              <Text style={styles.heroSubtitle} numberOfLines={2}>{heroApp.subtitle}</Text>
            </View>
            <View style={styles.getButton}>
              <Text style={styles.getButtonText}>{t('crossAppPromotion.get')}</Text>
            </View>
          </TouchableOpacity>

          {/* Row 1 - Two apps side by side */}
          {row1Apps.length > 0 && (
            <View style={styles.row}>
              {row1Apps.map((app) => (
                <TouchableOpacity
                  key={app.appId}
                  style={styles.smallCard}
                  onPress={() => handleAppPress(app, false)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: app.iconUrl }} style={styles.smallIcon} />
                  <Text style={styles.smallTitle} numberOfLines={2}>{app.title}</Text>
                  <View style={styles.smallGetButton}>
                    <Text style={styles.smallGetButtonText}>{t('crossAppPromotion.get')}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Row 2 - Two apps side by side */}
          {row2Apps.length > 0 && (
            <View style={styles.row}>
              {row2Apps.map((app) => (
                <TouchableOpacity
                  key={app.appId}
                  style={styles.smallCard}
                  onPress={() => handleAppPress(app, false)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: app.iconUrl }} style={styles.smallIcon} />
                  <Text style={styles.smallTitle} numberOfLines={2}>{app.title}</Text>
                  <View style={styles.smallGetButton}>
                    <Text style={styles.smallGetButtonText}>{t('crossAppPromotion.get')}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Maybe Later Button */}
          <TouchableOpacity
            style={styles.maybeLaterButton}
            onPress={onMaybeLater}
            activeOpacity={0.6}
          >
            <Text style={styles.maybeLaterText}>{t('crossAppPromotion.maybeLater')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: colors.background.primary,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: spacing.padding.lg,
      paddingTop: spacing.padding.lg,
      paddingBottom: spacing.padding.xl + 16,
      maxHeight: SCREEN_HEIGHT * 0.75,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 10,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.margin.lg,
    },
    headerTitle: {
      ...typography.textStyles.h3,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.bold,
      textAlign: 'center',
    },
    headerSubtitle: {
      ...typography.textStyles.bodySmall,
      color: colors.text.secondary,
      textAlign: 'center',
      marginTop: spacing.margin.xs,
    },
    heroCard: {
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.padding.md,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.margin.md,
      ...spacing.shadow.sm,
    },
    heroIcon: {
      width: 64,
      height: 64,
      borderRadius: 14,
      backgroundColor: colors.background.tertiary,
    },
    heroContent: {
      flex: 1,
      marginHorizontal: spacing.margin.md,
    },
    heroTitle: {
      ...typography.textStyles.body,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      textAlign: 'left',
    },
    heroSubtitle: {
      ...typography.textStyles.bodySmall,
      color: colors.text.secondary,
      marginTop: 2,
      textAlign: 'left',
    },
    getButton: {
      backgroundColor: colors.primary[500],
      borderRadius: spacing.borderRadius.full,
      paddingHorizontal: spacing.padding.md,
      paddingVertical: spacing.padding.xs,
    },
    getButtonText: {
      ...typography.textStyles.bodySmall,
      fontWeight: typography.fontWeight.bold,
      color: '#FFFFFF',
    },
    row: {
      flexDirection: 'row',
      gap: spacing.margin.md,
      marginBottom: spacing.margin.md,
    },
    smallCard: {
      flex: 1,
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.padding.md,
      alignItems: 'center',
      ...spacing.shadow.sm,
    },
    smallIcon: {
      width: 52,
      height: 52,
      borderRadius: 12,
      backgroundColor: colors.background.tertiary,
      marginBottom: spacing.margin.sm,
    },
    smallTitle: {
      ...typography.textStyles.bodySmall,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: spacing.margin.sm,
    },
    smallGetButton: {
      backgroundColor: colors.primary[500],
      borderRadius: spacing.borderRadius.full,
      paddingHorizontal: spacing.padding.md,
      paddingVertical: spacing.padding.xs,
    },
    smallGetButtonText: {
      ...typography.textStyles.caption,
      fontWeight: typography.fontWeight.bold,
      color: '#FFFFFF',
    },
    maybeLaterButton: {
      alignItems: 'center',
      paddingVertical: spacing.padding.md,
      marginTop: spacing.margin.sm,
    },
    maybeLaterText: {
      ...typography.textStyles.body,
      color: colors.text.tertiary,
    },
  });

export default CrossAppPromotionModal;
