import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import { ExamResult } from '../types/exam.types';
import Button from './Button';
import SupportAdButton from './SupportAdButton';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

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
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const hasLoggedButtonShown = useRef<boolean>(false);

  // Track when support ad button is shown (only for scores > 60%)
  useEffect(() => {
    if (visible && result && result.percentage > 60 && !hasLoggedButtonShown.current) {
      hasLoggedButtonShown.current = true;
      logEvent(AnalyticsEvents.USER_SUPPORT_AD_BUTTON_SHOWN, { 
        screen: 'results_modal',
        score_percentage: result.percentage,
      });
    }
    
    // Reset the flag when modal is closed
    if (!visible) {
      hasLoggedButtonShown.current = false;
    }
  }, [visible, result]);

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
              <Text style={styles.title}>{t('results.title')}</Text>
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

            {/* Support Ad Button - Only show for scores > 60% */}
            {result.percentage > 60 && (
              <SupportAdButton screen="results_modal" style={styles.supportAdButton} />
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.padding.md,
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
      paddingBottom: spacing.padding.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.padding.md,
      paddingVertical: spacing.padding.sm,
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
      backgroundColor: colors.secondary[100],
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: 18,
      color: colors.text.secondary,
    },
    scoreContainer: {
      alignItems: 'center',
      paddingVertical: spacing.padding.lg,
      paddingHorizontal: spacing.padding.md,
      backgroundColor: colors.background.primary,
    },
    emoji: {
      fontSize: 40,
      marginBottom: spacing.margin.xs,
    },
    score: {
      ...typography.textStyles.h2,
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.margin.xs,
    },
    scoreText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      marginBottom: spacing.margin.xs,
    },
    scoreDetails: {
      ...typography.textStyles.bodySmall,
      color: colors.text.secondary,
    },
    detailsContainer: {
      paddingHorizontal: spacing.padding.md,
      paddingVertical: spacing.padding.sm,
    },
    detailsTitle: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      marginBottom: spacing.margin.sm,
    },
    answerRow: {
      paddingVertical: spacing.padding.sm,
      paddingHorizontal: spacing.padding.md,
      borderRadius: spacing.borderRadius.md,
      marginBottom: spacing.margin.xs,
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
      flexDirection: 'row',
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
    answerDetails: {},
    answerLabel: {
      ...typography.textStyles.bodySmall,
      color: colors.text.secondary,
    },
    answerText: {
      ...typography.textStyles.bodySmall,
      color: colors.text.primary,
    },
    supportAdButton: {
      marginHorizontal: spacing.margin.md,
      marginBottom: spacing.margin.sm,
    },
    buttonContainer: {
      flexDirection: 'row',
      paddingHorizontal: spacing.padding.md,
      paddingVertical: spacing.padding.sm,
      gap: spacing.margin.md,
    },
    retryButton: {
      flex: 1,
    },
    continueButton: {
      flex: 1,
    },
  });

export default ResultsModal;
