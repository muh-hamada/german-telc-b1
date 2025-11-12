/**
 * App Review Modal Component
 * 
 * A beautiful and engaging modal that prompts users to review the app
 * after they have a positive experience.
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors } from '../theme';

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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
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
    marginBottom: 20,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  rateButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
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
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  laterButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  laterButtonText: {
    color: colors.gray[600],
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AppReviewModal;

