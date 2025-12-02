/**
 * App Update Modal
 * 
 * Displays update information and allows users to update now or dismiss
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { useCustomTranslation } from '../hooks/useCustomTranslation';

interface AppUpdateModalProps {
  visible: boolean;
  isForced: boolean;
  currentVersion: string;
  latestVersion: string;
  message?: string;
  onUpdateNow: () => void;
  onLater: () => void;
}

const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  visible,
  isForced,
  currentVersion,
  latestVersion,
  message,
  onUpdateNow,
  onLater,
}) => {
  const { t } = useCustomTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isForced ? undefined : onLater}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>🚀</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isForced
              ? t('appUpdate.requiredTitle')
              : t('appUpdate.availableTitle')}
          </Text>

          {/* Message */}
          <Text style={styles.message}>
            {message || 
              (isForced
                ? t('appUpdate.requiredMessage')
                : t('appUpdate.availableMessage')
              )
            }
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onUpdateNow}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {t('appUpdate.updateNow')}
              </Text>
            </TouchableOpacity>

            {!isForced && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onLater}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>
                  {t('appUpdate.later')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {isForced && (
            <Text style={styles.forcedNote}>
              {t('appUpdate.forcedNote')}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    ...typography.textStyles.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  versionContainer: {
    width: '100%',
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  versionLabel: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  versionValue: {
    ...typography.textStyles.bold,
    fontSize: 14,
    color: colors.text.primary,
  },
  newVersion: {
    color: colors.primary[500],
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary[500],
  },
  primaryButtonText: {
    ...typography.textStyles.button,
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: colors.background.secondary,
    paddingVertical: 0,
  },
  secondaryButtonText: {
    ...typography.textStyles.button,
    color: colors.text.primary,
  },
  forcedNote: {
    ...typography.textStyles.caption,
    color: colors.error[500],
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default AppUpdateModal;

