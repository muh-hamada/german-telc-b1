import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../../theme';
import { useAppTheme } from '../../contexts/ThemeContext';
import SupportAdButton from '../SupportAdButton';

interface WritingPart1ResultsModalA1Props {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  score: number;
  totalQuestions: number;
  results: Array<{
    questionNumber: number;
    fieldLabel: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
  modalAnswer?: string;
}

const WritingPart1ResultsModalA1: React.FC<WritingPart1ResultsModalA1Props> = ({
  isOpen,
  onClose,
  onRetry,
  score,
  totalQuestions,
  results,
}) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerIconContainer}>
                <Icon
                  name={percentage >= 60 ? 'check-circle' : 'times-circle'}
                  size={28}
                  color={percentage >= 60 ? colors.success[500] : colors.error[500]}
                />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>
                  {percentage >= 60 ? t('exam.congratulations') : t('exam.keepPracticing')}
                </Text>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreText}>
                    {score}/{totalQuestions}
                  </Text>
                  <Text style={styles.percentageText}>{percentage}%</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Icon name="close" size={16} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.detailedResultsContainer}>
                <Text style={styles.detailedResultsTitle}>
                  {t('exam.detailedResults')}
                </Text>
                {results.map((result, index) => (
                  <View key={index} style={styles.resultItem}>
                    <View style={styles.resultItemHeader}>
                      <View style={[
                        styles.resultQuestionNumber,
                        result.isCorrect ? styles.resultQuestionNumberCorrect : styles.resultQuestionNumberIncorrect
                      ]}>
                        <Text style={styles.resultQuestionNumberText}>{result.questionNumber}</Text>
                      </View>
                      <Text style={styles.resultFieldLabel} numberOfLines={1}>
                        {result.fieldLabel}
                      </Text>
                      <Icon
                        name={result.isCorrect ? 'check-circle' : 'times-circle'}
                        size={18}
                        color={result.isCorrect ? colors.success[500] : colors.error[500]}
                      />
                    </View>

                    <View style={styles.resultAnswersContainer}>
                      <Text style={styles.resultAnswerInline}>
                        <Text style={styles.resultAnswerLabel}>{t('exam.yourAnswer')}: </Text>
                        <Text style={[
                          styles.resultAnswerValue,
                          !result.isCorrect && styles.resultAnswerTextIncorrect
                        ]}>
                          {result.userAnswer || t('exam.noAnswer')}
                        </Text>
                      </Text>

                      {!result.isCorrect && (
                        <Text style={styles.resultAnswerInline}>
                          <Text style={styles.resultAnswerLabel}>{t('exam.correctAnswer')}: </Text>
                          <Text style={[styles.resultAnswerValue, styles.resultAnswerTextCorrect]}>
                            {result.correctAnswer}
                          </Text>
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Support Ad Button */}
              <SupportAdButton
                screen="WritingPart1Results"
                style={styles.supportAdButton}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.retryButton]}
                  onPress={onRetry}
                >
                  <Icon name="refresh" size={16} color={colors.white} />
                  <Text style={styles.modalButtonText}>{t('exam.retry')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.closeButtonBottom]}
                  onPress={onClose}
                >
                  <Text style={styles.modalButtonText}>{t('common.close')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: spacing.borderRadius.xl,
    borderTopRightRadius: spacing.borderRadius.xl,
    maxHeight: '85%',
    width: '100%',
    overflow: 'hidden',
  },
  scrollView: {
    flexGrow: 0,
  },
  contentContainer: {
    paddingBottom: spacing.padding.md,
    paddingHorizontal: spacing.padding.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.secondary,
  },
  headerIconContainer: {
    marginRight: spacing.margin.sm,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    ...typography.textStyles.h5,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.margin.sm,
  },
  scoreText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold,
  },
  percentageText: {
    ...typography.textStyles.h5,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.bold,
  },
  detailedResultsContainer: {
    marginTop: spacing.margin.md,
    marginBottom: spacing.margin.sm,
    width: '100%',
  },
  detailedResultsTitle: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.sm,
    textAlign: 'left',
  },
  resultItem: {
    backgroundColor: colors.background.primary,
    padding: spacing.padding.sm,
    borderRadius: spacing.borderRadius.sm,
    marginBottom: spacing.margin.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  resultItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.margin.xs,
    gap: spacing.margin.xs,
  },
  resultQuestionNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultQuestionNumberCorrect: {
    backgroundColor: colors.success[500],
  },
  resultQuestionNumberIncorrect: {
    backgroundColor: colors.error[500],
  },
  resultQuestionNumberText: {
    ...typography.textStyles.bodySmall,
    fontSize: 11,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  resultFieldLabel: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
    textAlign: 'left',
  },
  resultAnswersContainer: {
    gap: spacing.margin.xs,
  },
  resultAnswerInline: {
    ...typography.textStyles.bodySmall,
    textAlign: 'left',
  },
  resultAnswerLabel: {
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold,
  },
  resultAnswerValue: {
    color: colors.text.primary,
  },
  resultAnswerTextCorrect: {
    color: colors.success[600],
    fontWeight: typography.fontWeight.semibold,
  },
  resultAnswerTextIncorrect: {
    color: colors.error[600],
    textDecorationLine: 'line-through',
  },
  supportAdButton: {
    marginBottom: spacing.margin.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.margin.sm,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.padding.sm,
    paddingHorizontal: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    gap: spacing.margin.xs,
  },
  retryButton: {
    backgroundColor: colors.primary[500],
  },
  closeButtonBottom: {
    backgroundColor: colors.text.secondary,
  },
  modalButtonText: {
    ...typography.textStyles.bodySmall,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default WritingPart1ResultsModalA1;
