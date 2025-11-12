import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  I18nManager,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';
import { ExamResult } from '../types/exam.types';
import Button from './Button';

interface ResultsModalProps {
  visible: boolean;
  result: ExamResult | null;
  onClose: () => void;
  onRetry?: () => void;
  examTitle?: string;
}

const ResultsModal: React.FC<ResultsModalProps> = ({
  visible,
  result,
  onClose,
  onRetry,
  examTitle,
}) => {
  const { t } = useCustomTranslation();
  if (!result) return null;

  console.log('-------------> result', result);

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 80) return colors.success[500];
    if (percentage >= 60) return colors.warning[500];
    return colors.error[500];
  };

  const getScoreText = (percentage: number): string => {
    if (percentage >= 80) return t('results.feedback.excellent');
    if (percentage >= 60) return t('results.feedback.goodJob');
    if (percentage >= 40) return t('results.feedback.keepPracticing');
    return t('results.feedback.tryAgain');
  };

  const getScoreEmoji = (percentage: number): string => {
    if (percentage >= 80) return '🎉';
    if (percentage >= 60) return '👍';
    if (percentage >= 40) return '📚';
    return '💪';
  };

  const handleRetry = () => {
    Alert.alert(
      t('common.alerts.retryExam'),
      t('common.alerts.retryExamConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.retry'), style: 'destructive', onPress: onRetry },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{examTitle || t('results.title')}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Score Summary */}
            <View style={styles.scoreContainer}>
              <Text style={styles.emoji}>{getScoreEmoji(result.percentage)}</Text>
              <Text style={[styles.score, { color: getScoreColor(result.percentage) }]}>
                {result.percentage}%
              </Text>
              <Text style={styles.scoreText}>{getScoreText(result.percentage)}</Text>
              <Text style={styles.scoreDetails}>
                {result.score} {t('results.outOf')} {result.maxScore} {t('results.points')}
              </Text>
            </View>

            {/* Detailed Results */}
            {result.answers.length > 0 && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>{t('results.detailedResults')}</Text>

                {result.answers.map((answer, index) => (
                  <View
                    key={index}
                    style={[
                      styles.answerRow,
                      answer.isCorrect ? styles.correctAnswer : styles.incorrectAnswer,
                    ]}
                  >
                    <View style={styles.answerHeader}>
                      <Text style={styles.questionNumber}>{t('results.question')} {answer.questionId}</Text>
                      <Text style={[
                        styles.status,
                        answer.isCorrect ? styles.correctStatus : styles.incorrectStatus,
                      ]}>
                        {answer.isCorrect ? `✓ ${t('questions.correct')}` : `✗ ${t('questions.incorrect')}`}
                      </Text>
                    </View>

                    {/* <View style={styles.answerDetails}>
                      <Text style={styles.answerLabel}>{t('results.yourAnswer')}
                        <Text style={styles.answerText}>{' ' + answer.answer}</Text>
                      </Text>

                    </View> */}

                    {!answer.isCorrect && answer.correctAnswer && (
                      <View style={styles.answerDetails}>
                        <Text style={styles.answerLabel}>{t('results.correctAnswer')}
                          <Text style={styles.answerText}>{' ' + answer.correctAnswer}</Text>
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {onRetry && (
                <Button
                  title={t('questions.tryAgain')}
                  onPress={handleRetry}
                  variant="outline"
                  style={styles.retryButton}
                />
              )}
              <Button
                title={t('common.continue')}
                onPress={onClose}
                style={styles.continueButton}
              />
            </View>
          </ScrollView>
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
    padding: spacing.md,
  },
  modalContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    maxHeight: '85%',
    width: '92%',
    alignSelf: 'center',
  },
  scrollView: {
    maxHeight: '100%',
  },
  contentContainer: {
    paddingBottom: spacing.md,
  },
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.tertiary,
  },
  emoji: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  score: {
    ...typography.textStyles.h2,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  scoreText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  scoreDetails: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
  detailsContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  detailsTitle: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  answerRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.xs,
    borderLeftWidth: 4,
  },
  correctAnswer: {
    backgroundColor: colors.success[50],
    borderLeftColor: colors.success[500],
  },
  incorrectAnswer: {
    backgroundColor: colors.error[50],
    borderLeftColor: colors.error[500],
  },
  answerHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionNumber: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  status: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.medium,
  },
  correctStatus: {
    color: colors.success[700],
  },
  incorrectStatus: {
    color: colors.error[700],
  },
  answerDetails: {
  },
  answerLabel: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
  answerText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
  },
  buttonContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  retryButton: {
    flex: 1,
  },
  continueButton: {
    flex: 1,
  },
});

export default ResultsModal;
