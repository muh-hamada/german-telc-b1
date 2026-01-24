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

interface ChoiceOption {
  key: string | number;
  text: string;
  label?: string; // Optional label prefix (e.g., "a:", "b:")
  isSelected: boolean;
}

interface AnswerListSelectionModalProps {
  visible: boolean;
  selectedGap: string | number | null;
  options: ChoiceOption[];
  onSelect: (optionKey: string | number) => void;
  onClose: () => void;
  modalTitle?: string;
}

const AnswerListSelectionModal: React.FC<AnswerListSelectionModalProps> = ({
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
    ? t('grammar.part2.selectWord', { gap: selectedGap })
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
          <ScrollView 
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
          >
            {options.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.choiceOption,
                  option.isSelected && styles.choiceOptionSelected
                ]}
                onPress={() => onSelect(option.key)}
              >
                {option.label && (
                  <Text style={styles.choiceOptionLabel}>{option.label}</Text>
                )}
                <Text style={[
                  styles.choiceOptionText,
                  option.isSelected && styles.choiceOptionTextSelected
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
    overflow: 'hidden',
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
    // flex: 1,
  },
  modalContentContainer: {
    padding: spacing.padding.md,
  },
  choiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.padding.sm,
    paddingHorizontal: spacing.padding.md,
    marginBottom: spacing.margin.xs,
    borderRadius: spacing.borderRadius.sm,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  choiceOptionSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  choiceOptionLabel: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    marginRight: spacing.margin.sm,
  },
  choiceOptionText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  choiceOptionTextSelected: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.medium,
  },
  checkmark: {
    ...typography.textStyles.body,
    color: colors.success[500],
    fontWeight: typography.fontWeight.bold,
  },
});

export default AnswerListSelectionModal;
