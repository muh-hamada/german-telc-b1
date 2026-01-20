import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import { ExamResult } from '../types/exam.types';
import Button from './Button';
import SupportAdButton from './SupportAdButton';
import MarkdownText from './MarkdownText';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
  const { t, i18n } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const hasLoggedButtonShown = useRef<boolean>(false);
  const hasLoggedModalShown = useRef<boolean>(false);

  // View mode state: 'results' or 'explanation'
  const [viewMode, setViewMode] = useState<'results' | 'explanation'>('results');
  const [selectedExplanation, setSelectedExplanation] = useState<{
    explanation: Record<string, string> | undefined;
    transcript?: string;
    correctAnswer?: string;
  } | null>(null);

  const currentLang = i18n.language;

  // Reset view mode when modal closes
  useEffect(() => {
    if (!visible) {
      setViewMode('results');
      setSelectedExplanation(null);
    }
  }, [visible]);

  // Track when result modal is shown with explanation count
  useEffect(() => {
    if (visible && result && !hasLoggedModalShown.current) {
      const answersWithExplanations = result.answers.filter(
        answer => !answer.isCorrect && answer.explanation
      ).length;

      hasLoggedModalShown.current = true;
      logEvent(AnalyticsEvents.RESULTS_MODAL_SHOWN, {
        score: result.score,
        max_score: result.maxScore,
        percentage: result.percentage,
        total_questions: result.answers.length,
        correct_answers: result.answers.filter(a => a.isCorrect).length,
        answers_with_explanations: answersWithExplanations,
        exam_title: examTitle,
      });
    }

    // Reset the flag when modal is closed
    if (!visible) {
      hasLoggedModalShown.current = false;
    }
  }, [visible, result, examTitle]);

  // Track when support ad button is shown
  useEffect(() => {
    if (visible && result && !hasLoggedButtonShown.current) {
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

  const handleShowExplanation = (
    questionId: number,
    explanation: Record<string, string> | undefined,
    transcript?: string,
    correctAnswer?: string
  ) => {
    setSelectedExplanation({
      explanation,
      transcript,
      correctAnswer,
    });

    // Animate the height change (works on both iOS and Android with new architecture)
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setViewMode('explanation');

    logEvent(AnalyticsEvents.RESULTS_EXPLANATION_OPENED, {
      question_id: questionId,
      has_transcript: !!transcript,
      exam_title: examTitle,
      score_percentage: result.percentage, // result is guaranteed to be non-null here
    });
  };

  const handleCloseExplanation = () => {
    logEvent(AnalyticsEvents.RESULTS_EXPLANATION_CLOSED, {
      exam_title: examTitle,
    });

    // Animate the height change (works on both iOS and Android with new architecture)
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setViewMode('results');
    setSelectedExplanation(null);
  };

  // Get localized explanation
  const getLocalizedExplanation = () => {
    if (!selectedExplanation?.explanation) return '';
    const explanation = selectedExplanation.explanation;
    return explanation[currentLang] || explanation['en'] || explanation['de'] || Object.values(explanation)[0];
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              {viewMode === 'explanation' && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleCloseExplanation}
                >
                  <Icon name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              )}
              <Text style={styles.title}>
                {viewMode === 'results' ? t('results.title') : t('results.explanationTitle')}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Icon name="close" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >

              {/* Results View */}
              <View style={viewMode === 'results' ? styles.visible : styles.hidden}>
                {/* Score Summary */}
                <View style={styles.scoreContainer}>
                  <View style={styles.scoreContainerInner}>
                    <Text style={styles.emoji}>{getScoreEmoji(result.percentage)}</Text>
                  </View>
                  <View style={styles.scoreContainerInner}>
                    <Text style={[styles.score, { color: getScoreColor(result.percentage) }]}>
                      {result.percentage}%
                    </Text>
                    <Text style={styles.scoreText}>{getScoreText(result.percentage)}</Text>
                    <Text style={styles.scoreDetails}>
                      {result.score} {t('results.outOf')} {result.maxScore} {t('results.points')}
                    </Text>
                  </View>
                </View>

                {/* Detailed Results */}
                {result.answers.length > 0 && (
                  <View style={styles.detailsContainer}>
                    <Text style={styles.detailsTitle}>{t('results.detailedResults')}</Text>

                    {result.answers.map((answer, index) => (
                      <View
                        key={answer.questionId || `answer-${index}`}
                        style={[
                          styles.answerRow,
                          answer.isCorrect ? styles.correctAnswer : styles.incorrectAnswer,
                        ]}
                      >
                        <View style={styles.answerHeader}>
                          <View style={styles.questionNumberContainer}>
                            <Text style={styles.questionNumber}>{t('results.question')} {answer.questionId}</Text>
                            {!answer.isCorrect && answer.explanation && (
                              <TouchableOpacity
                                style={styles.explainButton}
                                onPress={() => handleShowExplanation(
                                  answer.questionId,
                                  answer.explanation,
                                  answer.transcript,
                                  answer.correctAnswer
                                )}
                              >
                                <Icon name="info-outline" size={16} color={colors.primary[500]} />
                                <Text style={styles.explainButtonText}>{t('results.explain')}</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          <View style={styles.statusContainer}>
                            <Text style={[
                              styles.status,
                              answer.isCorrect ? styles.correctStatus : styles.incorrectStatus,
                            ]}>
                              {answer.isCorrect ? `✓ ${t('questions.correct')}` : `✗ ${t('questions.incorrect')}`}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                <SupportAdButton screen="results_modal" style={styles.supportAdButton} />

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
              </View>

              {/* Explanation View */}
              {viewMode === 'explanation' && (
                <View style={styles.explanationContainer}>
                  {/* Correct Answer Section */}
                  {selectedExplanation?.correctAnswer && (
                    <View style={styles.correctAnswerSection}>
                      <Text style={styles.answerLabel}>{t('results.correctAnswer')}</Text>
                      <Text style={styles.answerText}>{selectedExplanation.correctAnswer}</Text>
                    </View>
                  )}

                  {/* Explanation Section */}
                  {getLocalizedExplanation() && (
                    <View style={styles.section}>
                      <Text style={styles.explanationText}>{getLocalizedExplanation()}</Text>
                    </View>
                  )}

                  {/* Transcript Section */}
                  {selectedExplanation?.transcript && (
                    <View style={[styles.section, styles.transcriptSection]}>
                      <Text style={styles.sectionTitle}>{t('results.transcript')}</Text>
                      <MarkdownText
                        baseStyle={styles.transcriptText}
                        text={selectedExplanation.transcript}
                      />
                    </View>
                  )}

                  {!getLocalizedExplanation() && !selectedExplanation?.transcript && !selectedExplanation?.correctAnswer && (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>{t('results.noExplanationAvailable')}</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    visible: {
      display: 'flex',
    },
    hidden: {
      display: 'none',
    },
    scrollView: {
      flexGrow: 0,
    },
    contentContainer: {
      paddingBottom: spacing.padding.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.padding.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
      backgroundColor: colors.background.secondary,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: -spacing.margin.xs,
    },
    title: {
      ...typography.textStyles.h4,
      color: colors.text.primary,
      flex: 1,
      marginLeft: spacing.margin.xs,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.secondary[100],
      justifyContent: 'center',
      alignItems: 'center',
    },
    scoreContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.padding.lg,
      paddingHorizontal: spacing.padding.md,
      backgroundColor: colors.background.primary,
      gap: spacing.margin.md,
    },
    scoreContainerInner: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    emoji: {
      fontSize: 60,
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
      alignItems: 'flex-start',
    },
    questionNumberContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.margin.sm,
    },
    statusContainer: {
      flexDirection: 'column',
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
    explainButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.margin.xs,
    },
    explainButtonText: {
      ...typography.textStyles.bodySmall,
      color: colors.primary[500],
      fontWeight: typography.fontWeight.semibold,
    },
    // Explanation View Styles
    explanationContainer: {
      padding: spacing.padding.lg,
    },
    correctAnswerSection: {
      backgroundColor: colors.success[50],
      padding: spacing.padding.md,
      borderRadius: spacing.borderRadius.md,
      marginBottom: spacing.margin.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.success[500],
    },
    answerLabel: {
      ...typography.textStyles.bodySmall,
      color: colors.success[700],
      fontWeight: typography.fontWeight.bold,
      marginBottom: 2,
    },
    answerText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.semibold,
    },
    section: {
      marginBottom: spacing.margin.md,
    },
    sectionTitle: {
      ...typography.textStyles.h4,
      color: colors.text.primary,
      marginBottom: spacing.margin.sm,
    },
    explanationText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      lineHeight: 24,
    },
    transcriptSection: {
      marginTop: spacing.margin.md,
      paddingTop: spacing.padding.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    transcriptText: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      fontStyle: 'italic',
      lineHeight: 22,
    },
    emptyState: {
      padding: spacing.padding.xl,
      alignItems: 'center',
    },
    emptyText: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
    },
  });

export default ResultsModal;
