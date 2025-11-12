import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';
import Button from './Button';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const { t } = useCustomTranslation();
  const [step, setStep] = useState<'confirm' | 'success'>('confirm');

  const handleClose = () => {
    setStep('confirm');
    onClose();
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
      setStep('success');
    } catch (error) {
      // Error is handled by parent component
      console.error('Delete account error:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 'confirm'
                ? t('profile.deleteAccountModal.title')
                : t('profile.deleteAccountModal.successTitle')}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {step === 'confirm' ? (
              <>
                <View style={styles.warningContainer}>
                  <Text style={styles.warningIcon}>⚠️</Text>
                  <Text style={styles.warningText}>
                    {t('profile.deleteAccountModal.message')}
                  </Text>
                </View>

                <View style={styles.buttonContainer}>
                  <Button
                    title={t('common.cancel')}
                    onPress={handleClose}
                    variant="outline"
                    style={styles.button}
                    disabled={isLoading}
                  />
                  <Button
                    title={t('profile.deleteAccountModal.confirm')}
                    onPress={handleConfirm}
                    variant="primary"
                    style={[styles.button, styles.dangerButton]}
                    disabled={isLoading}
                  />
                </View>

                {isLoading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary[500]} />
                    <Text style={styles.loadingText}>{t('common.loading')}</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <View style={styles.successContainer}>
                  <Text style={styles.successIcon}>✓</Text>
                  <Text style={styles.successText}>
                    {t('profile.deleteAccountModal.successMessage')}
                  </Text>
                </View>

                <Button
                  title={t('common.done')}
                  onPress={handleClose}
                  variant="primary"
                  style={styles.doneButton}
                />
              </>
            )}
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
  modalContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.xl,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.padding.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  content: {
    padding: spacing.padding.lg,
  },
  warningContainer: {
    backgroundColor: colors.error[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.error[500],
    marginBottom: spacing.margin.lg,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'flex-start',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: I18nManager.isRTL ? 0 : spacing.margin.sm,
    marginLeft: I18nManager.isRTL ? spacing.margin.sm : 0,
  },
  warningText: {
    ...typography.textStyles.body,
    color: colors.error[700],
    flex: 1,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    gap: spacing.margin.sm,
  },
  button: {
    flex: 1,
  },
  dangerButton: {
    backgroundColor: colors.error[500],
  },
  loadingContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.margin.md,
    gap: spacing.margin.sm,
  },
  loadingText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing.padding.xl,
  },
  successIcon: {
    fontSize: 64,
    color: colors.success[500],
    marginBottom: spacing.margin.lg,
  },
  successText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.margin.xl,
  },
  doneButton: {
    width: '100%',
  },
});

export default DeleteAccountModal;

