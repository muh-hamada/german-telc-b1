/**
 * RestartAppModal Component
 * 
 * Modal that appears when the app needs to restart for RTL/LTR layout changes
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { useCustomTranslation } from '../hooks/useCustomTranslation';

interface RestartAppModalProps {
  visible: boolean;
  isGoingToRTL: boolean;
  onRestart: () => void;
  onCancel: () => void;
}

const RestartAppModal: React.FC<RestartAppModalProps> = ({
  visible,
  isGoingToRTL,
  onRestart,
  onCancel,
}) => {
  const { t } = useCustomTranslation();

  const message = isGoingToRTL
    ? 'اللغة تم تغييرها بنجاح. سيتم إعادة تشغيل التطبيق الآن لتطبيق اتجاه النص من اليمين إلى اليسار.\n\nLanguage changed successfully. The app will restart now to apply right-to-left layout.'
    : 'Language changed successfully. The app will restart now to apply left-to-right layout.\n\nتم تغيير اللغة بنجاح. سيتم إعادة تشغيل التطبيق الآن لتطبيق اتجاه النص.';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.restartButton]}
              onPress={onRestart}
              activeOpacity={0.7}
            >
              <Text style={styles.restartButtonText}>
                Restart / إعادة التشغيل
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.padding.lg,
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.lg,
    width: '100%',
    maxWidth: 400,
    ...spacing.shadow.lg,
  },
  header: {
    padding: spacing.padding.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  content: {
    padding: spacing.padding.xl,
    
  },
  message: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: spacing.padding.md,
    gap: spacing.margin.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background.secondary,
  },
  cancelButtonText: {
    ...typography.textStyles.button,
    color: colors.text.secondary,
    flex: 1,
  },
  restartButton: {
    backgroundColor: colors.primary[500],
    flex: 3,
  },
  restartButtonText: {
    ...typography.textStyles.button,
    color: colors.white,
  },
});

export default RestartAppModal;

