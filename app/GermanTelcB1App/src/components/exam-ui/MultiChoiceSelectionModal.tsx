import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';

import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../../theme';
import { useAppTheme } from '../../contexts/ThemeContext';

interface AnswerOption {
  key: string | number;
  text: string;
  isSelected: boolean;
}

interface MultiChoiceSelectionModalProps {
  visible: boolean;
  selectedGap: string | number | null;
  options: AnswerOption[];
  onSelect: (optionKey: string | number) => void;
  onClose: () => void;
  modalTitle?: string;
}

const MultiChoiceSelectionModal: React.FC<MultiChoiceSelectionModalProps> = ({
  visible,
  selectedGap,
  options,
  onSelect,
  onClose,
  modalTitle,
}) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const defaultTitle = selectedGap !== null 
    ? t('grammar.part1.selectAnswer', { gap: selectedGap })
    : '';

  return (
    <Modal
      visible={visible && selectedGap !== null}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {modalTitle || defaultTitle}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.answerOption,
                  option.isSelected && styles.answerOptionSelected
                ]}
                onPress={() => onSelect(option.key)}
              >
                <View style={[
                  styles.radioButton,
                  option.isSelected && styles.radioButtonSelected
                ]}>
                  {option.isSelected && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={[
                  styles.answerText,
                  option.isSelected && styles.answerTextSelected
                ]}>
                  {option.text}
                </Text>
                {option.isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.padding.lg,
  },
  modalContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: spacing.borderRadius.lg,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  modalContent: {
    maxHeight: 400,
  },
  modalContentContainer: {
    padding: spacing.padding.md,
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.padding.sm,
    paddingHorizontal: spacing.padding.md,
    marginBottom: spacing.margin.sm,
    borderRadius: spacing.borderRadius.sm,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  answerOptionSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.secondary[400],
    marginRight: spacing.margin.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary[500],
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[500],
  },
  answerText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  answerTextSelected: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.medium,
  },
  checkmark: {
    ...typography.textStyles.body,
    color: colors.success[500],
    fontWeight: typography.fontWeight.bold,
  },
});

export default MultiChoiceSelectionModal;
