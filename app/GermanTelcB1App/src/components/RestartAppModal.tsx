/**
 * RestartAppModal Component
 * 
 * Modal that appears when the app needs to be closed and reopened for RTL/LTR layout changes
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography } from '../theme';

interface RestartAppModalProps {
  visible: boolean;
  isGoingToRTL: boolean;
  onClose: () => void;
}

const RestartAppModal: React.FC<RestartAppModalProps> = ({
  visible,
  isGoingToRTL,
  onClose,
}) => {

  const message = isGoingToRTL ?
    ['يرجى إغلاق التطبيق وإعادة فتحه لتطبيق التخطيط من اليمين إلى اليسار.',
      'Please close and reopen the app to apply the right-to-left layout.']
    : ['Please close and reopen the app to apply the left-to-right layout.',
      'يرجى إغلاق التطبيق وإعادة فتحه لتطبيق التخطيط من اليسار إلى اليمين.',
    ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.message}>{message.join('\n\n')}</Text>
          </View>

          {/* Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.okButton]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.okButtonText}>
                OK / حسناً
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
  content: {
    padding: spacing.padding.xl,
    alignItems: 'center',
  },
  message: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    padding: spacing.padding.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  button: {
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okButton: {
    backgroundColor: colors.primary[500],
  },
  okButtonText: {
    ...typography.textStyles.button,
    color: colors.white,
    fontSize: 16,
  },
});

export default RestartAppModal;

