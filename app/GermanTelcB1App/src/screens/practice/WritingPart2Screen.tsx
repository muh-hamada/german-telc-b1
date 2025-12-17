import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { spacing, typography, type ThemeColors } from '../../theme';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useExamCompletion } from '../../contexts/CompletionContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { HomeStackRouteProp } from '../../types/navigation.types';
import { dataService } from '../../services/data.service';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { useProgress } from '../../contexts/ProgressContext';
import { UserAnswer } from '../../types/exam.types';
import SupportAdButton from '../../components/SupportAdButton';

const WritingPart2Screen: React.FC = () => {
  const { t } = useCustomTranslation();
  const route = useRoute<HomeStackRouteProp<'WritingPart2'>>();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const examId = route.params?.examId ?? 0;
  const { updateExamProgress } = useProgress();

  const { isCompleted, toggleCompletion } = useExamCompletion('writing', 2, examId);

  const [currentExam, setCurrentExam] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userText, setUserText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [taskPointResults, setTaskPointResults] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      setIsLoading(true);
      const exam = await dataService.getWritingPart2Exam(examId);
      setCurrentExam(exam || null);
    } catch (error) {
      console.error('Error loading exam:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up header button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleToggleCompletion}
          style={styles.headerButton}
        >
          <Icon
            name={isCompleted ? 'check-circle' : 'circle-o'}
            size={24}
            color={colors.white}
          />
        </TouchableOpacity>
      ),
    });
  }, [isCompleted, navigation]);

  const handleToggleCompletion = async () => {
    try {
      const newStatus = await toggleCompletion(score);
      logEvent(AnalyticsEvents.PRACTICE_MARK_COMPLETED_TOGGLED, {
        section: 'writing',
        part: 2,
        exam_id: examId,
        completed: newStatus,
        score,
      });
    } catch (error: any) {
      if (error.message === 'auth/not-logged-in') {
        Alert.alert(t('common.error'), t('exam.loginToSaveProgress'));
      } else {
        Alert.alert(t('common.error'), t('exam.completionFailed'));
      }
    }
  };

  const checkTaskPoint = (taskPoint: any, text: string): boolean => {
    if (!text || !taskPoint.keywords_expected) return false;

    const normalizedText = text.toLowerCase();
    const keywords = taskPoint.keywords_expected;

    // Check if at least one keyword is present
    return keywords.some((keyword: string) =>
      normalizedText.includes(keyword.toLowerCase())
    );
  };

  const handleSubmit = () => {
    if (!currentExam) return;

    const minLength = 50; // Minimum character count
    if (userText.trim().length < minLength) {
      Alert.alert(
        t('exam.incomplete'),
        t('practice.writing.minCharactersRequired', { count: minLength }),
        [{ text: 'OK' }]
      );
      return;
    }

    // Check each task point
    const results: { [key: string]: boolean } = {};
    let correctCount = 0;

    currentExam.task_points.forEach((taskPoint: any) => {
      const isCorrect = checkTaskPoint(taskPoint, userText);
      results[taskPoint.id] = isCorrect;
      if (isCorrect) {
        correctCount++;
      }
    });

    const totalPoints = currentExam.task_points.length;
    setScore(correctCount);
    setTaskPointResults(results);
    setIsSubmitted(true);
    setShowResultsModal(true);

    // Log completion
    logEvent(AnalyticsEvents.PRACTICE_EXAM_COMPLETED, {
      section: 'writing',
      part: 2,
      exam_id: examId,
      score: correctCount,
      max_score: totalPoints,
      percentage: Math.round((correctCount / totalPoints) * 100),
      text_length: userText.length,
    });

    // Update progress
    const answers: UserAnswer[] = currentExam.task_points.map((taskPoint: any, index: number) => ({
      questionId: index + 1,
      userAnswer: results[taskPoint.id] ? 'addressed' : 'not_addressed',
      isCorrect: results[taskPoint.id],
      timestamp: Date.now(),
    }));

    updateExamProgress('writing-part2', examId, answers, correctCount, totalPoints);
  };

  const handleRetry = () => {
    setUserText('');
    setIsSubmitted(false);
    setScore(0);
    setTaskPointResults({});
    setShowResultsModal(false);
  };

  const getWordCount = () => {
    return userText.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const renderResultsModal = () => {
    if (!currentExam) return null;

    const totalPoints = currentExam.task_points.length;
    const percentage = Math.round((score / totalPoints) * 100);

    return (
      <Modal
        visible={showResultsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResultsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.modalContent}>
              {/* Header with Score */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTop}>
                  <Icon
                    name={percentage >= 60 ? 'check-circle' : 'times-circle'}
                    size={36}
                    color={percentage >= 60 ? colors.success[500] : colors.error[500]}
                  />
                  <View style={styles.modalHeaderTextContainer}>
                    <Text style={styles.modalTitle}>
                      {percentage >= 60 ? t('exam.congratulations') : t('exam.keepPracticing')}
                    </Text>
                    <View style={styles.scoreRow}>
                      <Text style={styles.scoreText}>
                        {score}/{totalPoints} {t('practice.writing.pointsAddressed')}
                      </Text>
                      <Text style={styles.percentageText}>{percentage}%</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Detailed Results */}
              <View style={styles.detailedResultsContainer}>
                <Text style={styles.detailedResultsTitle}>
                  {t('exam.detailedResults')}
                </Text>
                {currentExam.task_points.map((taskPoint: any, index: number) => {
                  const isCorrect = taskPointResults[taskPoint.id] || false;

                  return (
                    <View key={taskPoint.id} style={styles.resultItem}>
                      <View style={styles.resultItemHeader}>
                        <View style={[
                          styles.resultQuestionNumber,
                          isCorrect ? styles.resultQuestionNumberCorrect : styles.resultQuestionNumberIncorrect
                        ]}>
                          <Text style={styles.resultQuestionNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.resultTaskText} numberOfLines={2}>
                          {taskPoint.text}
                        </Text>
                        <Icon
                          name={isCorrect ? 'check-circle' : 'times-circle'}
                          size={18}
                          color={isCorrect ? colors.success[500] : colors.error[500]}
                        />
                      </View>
                      {!isCorrect && (
                        <Text style={styles.suggestedKeywords}>
                          {t('practice.writing.suggestedKeywords')}: {taskPoint.keywords_expected.slice(0, 3).join(', ')}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Support Ad Button */}
              <SupportAdButton
                screen="WritingPart2Results"
                style={styles.supportAdButton}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.retryButton]}
                  onPress={handleRetry}
                >
                  <Icon name="refresh" size={16} color={colors.white} />
                  <Text style={styles.modalButtonText}>{t('exam.retry')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.closeButton]}
                  onPress={() => setShowResultsModal(false)}
                >
                  <Text style={styles.modalButtonText}>{t('common.close')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('exam.loadingExam')}</Text>
        </View>
      </View>
    );
  }

  if (!currentExam) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('exam.failedToLoad')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={styles.examTitle}>{currentExam.title}</Text>

        {/* Instruction */}
        {currentExam.instruction_header && (
          <View style={styles.instructionCard}>
            <Text style={styles.instructionText}>{currentExam.instruction_header}</Text>
          </View>
        )}

        {/* Task Points */}
        <View style={styles.taskPointsCard}>
          <Text style={styles.taskPointsTitle}>{t('practice.writing.taskPoints')}</Text>
          {currentExam.task_points.map((point: any, index: number) => (
            <View key={point.id} style={styles.taskPointRow}>
              <View style={[
                styles.taskPointNumber,
                isSubmitted && (taskPointResults[point.id] ? styles.taskPointCorrect : styles.taskPointIncorrect)
              ]}>
                <Text style={styles.taskPointNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.taskPointText}>{point.text}</Text>
              {isSubmitted && (
                <Icon
                  name={taskPointResults[point.id] ? 'check-circle' : 'times-circle'}
                  size={18}
                  color={taskPointResults[point.id] ? colors.success[500] : colors.error[500]}
                  style={styles.taskPointIcon}
                />
              )}
            </View>
          ))}
        </View>

        {/* Constraints/Hints */}
        {currentExam.constraints && (
          <View style={styles.hintsCard}>
            {currentExam.constraints.text_length_hint && (
              <Text style={styles.hintText}>💡 {currentExam.constraints.text_length_hint}</Text>
            )}
            {currentExam.constraints.structure_hint && (
              <Text style={styles.hintText}>💡 {currentExam.constraints.structure_hint}</Text>
            )}
          </View>
        )}

        {/* Text Input */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>{t('practice.writing.yourText')}</Text>
          <TextInput
            style={styles.textInput}
            multiline
            placeholder={t('practice.writing.emailPlaceholder')}
            placeholderTextColor={colors.text.secondary}
            value={userText}
            onChangeText={setUserText}
            textAlignVertical="top"
            editable={!isSubmitted}
          />
          <View style={styles.countersRow}>
            <Text style={styles.counterText}>
              {t('practice.writing.characters')}: {userText.length}
            </Text>
            <Text style={styles.counterText}>
              {t('practice.writing.words')}: {getWordCount()}
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        {!isSubmitted && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>{t('exam.submit')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {renderResultsModal()}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.padding.lg,
      paddingBottom: spacing.padding.xl * 2,
    },
    headerButton: {
      marginRight: spacing.margin.md,
      padding: spacing.padding.sm,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.padding.lg,
    },
    errorText: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    examTitle: {
      ...typography.textStyles.h4,
      color: colors.text.primary,
      textAlign: 'center',
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.margin.md,
    },
    instructionCard: {
      backgroundColor: colors.primary[50],
      padding: spacing.padding.md,
      borderRadius: spacing.borderRadius.md,
      marginBottom: spacing.margin.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary[500],
    },
    instructionText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.semibold,
      textAlign: 'left',
    },
    taskPointsCard: {
      backgroundColor: colors.background.secondary,
      padding: spacing.padding.md,
      borderRadius: spacing.borderRadius.md,
      marginBottom: spacing.margin.md,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    taskPointsTitle: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.margin.sm,
      textAlign: 'left',
    },
    taskPointRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.margin.sm,
      gap: spacing.margin.xs,
    },
    taskPointNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.text.secondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    taskPointCorrect: {
      backgroundColor: colors.success[500],
    },
    taskPointIncorrect: {
      backgroundColor: colors.error[500],
    },
    taskPointNumberText: {
      ...typography.textStyles.bodySmall,
      fontSize: 12,
      color: colors.white,
      fontWeight: typography.fontWeight.bold,
    },
    taskPointText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      flex: 1,
      textAlign: 'left',
    },
    taskPointIcon: {
      marginLeft: spacing.margin.xs,
    },
    hintsCard: {
      backgroundColor: colors.warning[50],
      padding: spacing.padding.md,
      borderRadius: spacing.borderRadius.md,
      marginBottom: spacing.margin.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.warning[500],
      gap: spacing.margin.xs,
    },
    hintText: {
      ...typography.textStyles.bodySmall,
      color: colors.text.primary,
      textAlign: 'left',
      lineHeight: 20,
    },
    inputSection: {
      marginBottom: spacing.margin.lg,
    },
    sectionTitle: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.margin.sm,
      textAlign: 'left',
    },
    textInput: {
      ...typography.textStyles.body,
      backgroundColor: colors.background.secondary,
      borderWidth: 2,
      borderColor: colors.border.light,
      borderRadius: spacing.borderRadius.md,
      padding: spacing.padding.md,
      color: colors.text.primary,
      minHeight: 200,
      textAlign: 'left',
    },
    countersRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.margin.sm,
    },
    counterText: {
      ...typography.textStyles.bodySmall,
      color: colors.text.secondary,
    },
    submitButton: {
      backgroundColor: colors.primary[500],
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      borderRadius: spacing.borderRadius.md,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    submitButtonText: {
      ...typography.textStyles.h5,
      color: colors.white,
      fontWeight: typography.fontWeight.bold,
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.padding.lg,
    },
    modalScrollView: {
      width: '100%',
      maxHeight: '90%',
    },
    modalScrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.padding.md,
      width: '100%',
      maxWidth: 500,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
      marginVertical: spacing.margin.lg,
    },
    modalHeader: {
      marginBottom: spacing.margin.md,
      paddingBottom: spacing.padding.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    modalHeaderTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    modalHeaderTextContainer: {
      flex: 1,
      marginLeft: spacing.margin.md,
    },
    modalTitle: {
      ...typography.textStyles.h5,
      color: colors.text.primary,
      marginBottom: spacing.margin.xs,
      textAlign: 'left',
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.margin.sm,
    },
    scoreText: {
      ...typography.textStyles.bodySmall,
      color: colors.text.secondary,
      fontWeight: typography.fontWeight.semibold,
    },
    percentageText: {
      ...typography.textStyles.h5,
      color: colors.primary[500],
      fontWeight: typography.fontWeight.bold,
    },
    detailedResultsContainer: {
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
    resultTaskText: {
      ...typography.textStyles.bodySmall,
      color: colors.text.primary,
      flex: 1,
      textAlign: 'left',
    },
    suggestedKeywords: {
      ...typography.textStyles.bodySmall,
      color: colors.text.secondary,
      fontStyle: 'italic',
      marginTop: spacing.margin.xs,
      marginLeft: 30,
      textAlign: 'left',
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
    closeButton: {
      backgroundColor: colors.text.secondary,
    },
    modalButtonText: {
      ...typography.textStyles.bodySmall,
      color: colors.white,
      fontWeight: typography.fontWeight.semibold,
    },
  });

export default WritingPart2Screen;

