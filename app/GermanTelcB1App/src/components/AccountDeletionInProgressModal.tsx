import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';
import Button from './Button';

interface AccountDeletionInProgressModalProps {
  visible: boolean;
  onClose: () => void;
}

const AccountDeletionInProgressModal: React.FC<AccountDeletionInProgressModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useCustomTranslation();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {t('profile.deleteAccountModal.inProgressTitle')}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.infoContainer}>
              <Text style={styles.infoIcon}>⏳</Text>
              <Text style={styles.infoText}>
                {t('profile.deleteAccountModal.inProgressMessage')}
              </Text>
            </View>

            <Button
              title={t('common.close')}
              onPress={onClose}
              variant="primary"
              style={styles.closeButtonBottom}
            />
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
    flexDirection: 'row',
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
  infoContainer: {
    backgroundColor: colors.warning[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning[500],
    marginBottom: spacing.margin.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: spacing.margin.sm,
    marginLeft: 0,
  },
  infoText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 22,
  },
  closeButtonBottom: {
    width: '100%',
  },
});

export default AccountDeletionInProgressModal;

