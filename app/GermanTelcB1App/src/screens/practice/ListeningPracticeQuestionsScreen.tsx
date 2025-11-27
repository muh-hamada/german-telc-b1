import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../../theme';
import { HomeStackParamList } from '../../types/navigation.types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import ListeningCompletionModal from '../../components/ListeningCompletionModal';
import { useProgress } from '../../contexts/ProgressContext';
import { UserAnswer } from '../../types/exam.types';

type ScreenRouteProp = RouteProp<HomeStackParamList, 'ListeningPracticeQuestions'>;

const ListeningPracticeQuestionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ScreenRouteProp>();
  const { interview, id } = route.params;
  const { t } = useCustomTranslation();
  const { updateExamProgress } = useProgress();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);

  const currentQuestion = interview.questions[currentQuestionIndex];
  const totalQuestions = interview.questions.length;

  const handleAnswerSelect = (answer: boolean) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentQuestion.correct;
    if (isCorrect) {
        setScore(prev => prev + 1);
    }

    const userAnswer: UserAnswer = {
        questionId: currentQuestionIndex,
        answer: answer ? 'true' : 'false',
        isCorrect: isCorrect,
        timestamp: Date.now(),
        correctAnswer: currentQuestion.correct ? 'true' : 'false'
    };
    
    setUserAnswers(prev => [...prev, userAnswer]);

    logEvent(AnalyticsEvents.LISTENING_PRACTICE_QUESTION_ANSWERED, {
        question_id: currentQuestionIndex,
        question_text: currentQuestion.question,
        is_correct: isCorrect,
        exam_id: id
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      const percentage = Math.round((score / totalQuestions) * 100);

      logEvent(AnalyticsEvents.LISTENING_PRACTICE_ASSESSMENT_COMPLETED, {
          exam_id: id,
          score: score,
          total_questions: totalQuestions,
          percentage: percentage
      });
      if (percentage >= 80) {
          updateExamProgress('listening-practice', id, userAnswers, score, totalQuestions);
      }
      setShowCompletionModal(true);
    }
  };

  const handleListenAgain = () => {
      logEvent(AnalyticsEvents.LISTENING_PRACTICE_LISTEN_AGAIN, {
          exam_id: id
      });
      setShowCompletionModal(false);
      navigation.goBack();
  };

  const handleBackToHome = () => {
      logEvent(AnalyticsEvents.LISTENING_PRACTICE_BACK_TO_HOME, {
          exam_id: id
      });
      setShowCompletionModal(false);
      navigation.navigate('ListeningPracticeList');
  };

  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
            </View>
          </View>
          <Text style={styles.progressText}>
            {t('practice.grammar.study.progress', {
              current: currentQuestionIndex + 1,
              total: totalQuestions
            })}
          </Text>
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
            <TouchableOpacity
                style={[
                    styles.optionButton,
                    showResult && selectedAnswer === true && (currentQuestion.correct === true ? styles.correctOption : styles.wrongOption),
                    showResult && selectedAnswer !== true && currentQuestion.correct === true && styles.correctOptionUnselected
                ]}
                onPress={() => handleAnswerSelect(true)}
                disabled={showResult}
            >
                <Text style={[
                    styles.optionText,
                    showResult && selectedAnswer === true && (currentQuestion.correct === true ? styles.whiteText : styles.whiteText)
                ]}>{t('common.correct')}</Text>
                {showResult && currentQuestion.correct === true && <Icon name="check" size={20} color={selectedAnswer === true ? colors.white : colors.success[500]} />}
                {showResult && selectedAnswer === true && currentQuestion.correct === false && <Icon name="close" size={20} color={colors.white} />}
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.optionButton,
                    showResult && selectedAnswer === false && (currentQuestion.correct === false ? styles.correctOption : styles.wrongOption),
                    showResult && selectedAnswer !== false && currentQuestion.correct === false && styles.correctOptionUnselected
                ]}
                onPress={() => handleAnswerSelect(false)}
                disabled={showResult}
            >
                <Text style={[
                    styles.optionText,
                    showResult && selectedAnswer === false && (currentQuestion.correct === false ? styles.whiteText : styles.whiteText)
                ]}>{t('common.wrong')}</Text>
                {showResult && currentQuestion.correct === false && <Icon name="check" size={20} color={selectedAnswer === false ? colors.white : colors.success[500]} />}
                {showResult && selectedAnswer === false && currentQuestion.correct === true && <Icon name="close" size={20} color={colors.white} />}
            </TouchableOpacity>
        </View>

        {/* Result and Explanation */}
        {showResult && (
            <View style={styles.resultContainer}>
                {selectedAnswer === currentQuestion.correct ? (
                    <View style={[styles.feedbackBox, styles.successFeedback]}>
                        <Text style={[styles.feedbackTitle, { color: colors.success[700] }]}>{t('practice.listening.practice.goodJob')}</Text>
                    </View>
                ) : (
                    <View style={[styles.feedbackBox, styles.errorFeedback]}>
                         <Text style={[styles.feedbackTitle, { color: colors.error[700] }]}>{t('practice.listening.practice.explanation')}:</Text>
                         <Text style={[styles.feedbackText, { color: colors.text.primary }]}>{currentQuestion.explanation}</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>
                        {currentQuestionIndex < totalQuestions - 1 ? t('common.next') : t('practice.listening.practice.finish')}
                    </Text>
                </TouchableOpacity>
            </View>
        )}

      </ScrollView>

      <ListeningCompletionModal
        visible={showCompletionModal}
        score={score}
        totalQuestions={totalQuestions}
        onListenAgain={handleListenAgain}
        onBackToHome={handleBackToHome}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.padding.lg,
  },
  progressContainer: {
    marginBottom: spacing.margin.lg,
  },
  progressBarContainer: {
    alignItems: 'center',
    marginBottom: spacing.margin.sm,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  progressText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'left',
  },
  questionCard: {
    marginBottom: spacing.margin.xl,
  },
  questionText: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    direction: 'ltr',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.margin.md,
    marginBottom: spacing.margin.md,
  },
  optionButton: {
    padding: spacing.padding.md,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  correctOption: {
    backgroundColor: colors.success[500],
    borderColor: colors.success[600],
  },
  wrongOption: {
    backgroundColor: colors.error[500],
    borderColor: colors.error[600],
  },
  correctOptionUnselected: {
      borderColor: colors.success[500],
      borderWidth: 2,
  },
  optionText: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
  },
  whiteText: {
      color: colors.white,
  },
  resultContainer: {
      gap: spacing.margin.lg,
  },
  feedbackBox: {
      padding: spacing.padding.md,
      borderRadius: spacing.borderRadius.md,
      borderWidth: 1,
  },
  successFeedback: {
      backgroundColor: colors.success[50],
      borderColor: colors.success[200],
  },
  errorFeedback: {
      backgroundColor: colors.error[50],
      borderColor: colors.error[200],
  },
  feedbackTitle: {
      ...typography.textStyles.h4,
      fontWeight: 'bold',
      textAlign: 'left',
  },
  feedbackText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
    marginTop: spacing.margin.sm,
    direction: 'ltr',
  },
  nextButton: {
      backgroundColor: colors.primary[500],
      paddingVertical: spacing.padding.lg,
      borderRadius: spacing.borderRadius.md,
      alignItems: 'center',
  },
  nextButtonText: {
      ...typography.textStyles.h4,
      color: colors.white,
      fontWeight: 'bold',
  }
});

export default ListeningPracticeQuestionsScreen;
