import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface VocabularyCompletionModalProps {
  visible: boolean;
  wordsCount: number;
  type: 'study' | 'review';
  onClose: () => void;
}

const VocabularyCompletionModal: React.FC<VocabularyCompletionModalProps> = ({
  visible,
  wordsCount,
  type,
  onClose,
}) => {
  const { t } = useCustomTranslation();

  const title = type === 'study' 
    ? t('vocabulary.completion.studyTitle') 
    : t('vocabulary.completion.reviewTitle');
  
  const message = type === 'study' 
    ? t('vocabulary.completion.studyMessage', { count: wordsCount })
    : t('vocabulary.completion.reviewMessage', { count: wordsCount });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Celebration Icon */}
          <View style={styles.iconContainer}>
            <Icon name="stars" size={64} color={colors.success[500]} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>


          {/* Done Button */}
          <TouchableOpacity
            style={styles.doneButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>{t('vocabulary.completion.doneButton')}</Text>
          </TouchableOpacity>
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
    padding: spacing.padding.lg,
  },
  modalContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 24,
    padding: spacing.padding.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...spacing.shadow.lg,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.success[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.margin.lg,
  },
  title: {
    ...typography.textStyles.h2,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
    textAlign: 'center',
  },
  message: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.margin.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    padding: spacing.padding.lg,
    backgroundColor: colors.success[50],
    borderRadius: 16,
    marginBottom: spacing.margin.xl,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...typography.textStyles.h1,
    color: colors.success[600],
    fontWeight: 'bold',
    marginBottom: spacing.margin.xs,
  },
  statLabel: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.secondary[200],
    marginHorizontal: spacing.margin.md,
  },
  doneButton: {
    backgroundColor: colors.success[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.xl,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  doneButtonText: {
    ...typography.textStyles.body,
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default VocabularyCompletionModal;

