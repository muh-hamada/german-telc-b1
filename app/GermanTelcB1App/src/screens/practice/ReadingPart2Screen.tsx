import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import { dataService } from '../../services/data.service';
import { useProgress } from '../../contexts/ProgressContext';
import ResultsModal from '../../components/ResultsModal';
import { ReadingPart2Exam, UserAnswer, ExamResult } from '../../types/exam.types';

const ReadingPart2Screen: React.FC = () => {
  const { t } = useTranslation();
  const { updateExamProgress } = useProgress();
  
  const [currentExamId, setCurrentExamId] = useState(0);
  const [currentExam, setCurrentExam] = useState<ReadingPart2Exam | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: number]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load exam data
  useEffect(() => {
    loadExam(currentExamId);
  }, [currentExamId]);

  const loadExam = async (examId: number) => {
    try {
      setIsLoading(true);
      const exam = dataService.getReadingPart2Exam(examId);
      if (exam) {
        setCurrentExam(exam);
        setUserAnswers({});
        setShowResults(false);
        setExamResult(null);
      }
    } catch (error) {
      console.error('Error loading exam:', error);
      Alert.alert('Error', 'Failed to load exam data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const checkAnswers = () => {
    if (!currentExam) return;

    // Check if all questions are answered
    const unansweredQuestions = currentExam.questions.filter(
      q => userAnswers[q.id] === undefined
    );

    if (unansweredQuestions.length > 0) {
      Alert.alert(
        'Incomplete',
        `Please answer all questions before checking. ${unansweredQuestions.length} question(s) remaining.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Calculate score
    let correctCount = 0;

    currentExam.questions.forEach(question => {
      const userAnswerIndex = userAnswers[question.id];
      const isCorrect = question.answers[userAnswerIndex]?.correct === true;
      
      if (isCorrect) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / currentExam.questions.length) * 100);
    
    const result: ExamResult = {
      examId: currentExamId,
      score: correctCount,
      maxScore: currentExam.questions.length,
      percentage,
      correctAnswers: correctCount,
      totalQuestions: currentExam.questions.length,
      answers: currentExam.questions.map(question => {
        const userAnswerIndex = userAnswers[question.id];
        const correctAnswerIndex = question.answers.findIndex(a => a.correct);
        const userAnswerText = userAnswerIndex !== undefined 
          ? question.answers[userAnswerIndex]?.text || ''
          : 'Not answered';
        const correctAnswerText = correctAnswerIndex >= 0 
          ? question.answers[correctAnswerIndex].text 
          : '';
        
        return {
          questionId: question.id,
          userAnswer: userAnswerText,
          correctAnswer: correctAnswerText,
          isCorrect: userAnswerIndex !== undefined && question.answers[userAnswerIndex]?.correct === true,
        };
      }),
      timestamp: Date.now(),
    };

    setExamResult(result);
    setShowResults(true);

    // Save progress
    const userAnswersArray: UserAnswer[] = currentExam.questions.map(question => {
      const userAnswerIndex = userAnswers[question.id];
      const isCorrect = userAnswerIndex !== undefined && question.answers[userAnswerIndex]?.correct === true;
      
      return {
        questionId: question.id,
        answer: userAnswerIndex !== undefined ? question.answers[userAnswerIndex]?.text || '' : '',
        isCorrect,
        timestamp: Date.now(),
      };
    });

    updateExamProgress('reading-part2', currentExamId, userAnswersArray, correctCount, currentExam.questions.length);
  };

  const renderExamTabs = () => {
    const exams = dataService.getReadingPart2Exams();
    return (
      <View style={styles.tabsContainer}>
        <Text style={styles.tabsTitle}>Select Exam:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {exams.map((exam, index) => (
            <TouchableOpacity
              key={exam.id}
              style={[
                styles.tab,
                currentExamId === exam.id && styles.activeTab,
              ]}
              onPress={() => setCurrentExamId(exam.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  currentExamId === exam.id && styles.activeTabText,
                ]}
              >
                Test {exam.id + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderReadingText = () => {
    if (!currentExam) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{currentExam.title}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.textContent}>{currentExam.text}</Text>
        </View>
      </View>
    );
  };

  const renderQuestions = () => {
    if (!currentExam) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aufgaben 6-10</Text>
        {currentExam.questions.map((question) => (
          <View key={question.id} style={styles.questionContainer}>
            <Text style={styles.questionText}>
              {question.id}. {question.question}
            </Text>
            
            <View style={styles.answersContainer}>
              {question.answers.map((answer, index) => {
                const isSelected = userAnswers[question.id] === index;
                const optionLetter = String.fromCharCode(97 + index).toUpperCase(); // A, B, C...
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.answerOption,
                      isSelected && styles.selectedAnswerOption,
                    ]}
                    onPress={() => handleAnswerSelect(question.id, index)}
                  >
                    <View style={[
                      styles.radioButton,
                      isSelected && styles.radioButtonSelected,
                    ]}>
                      {isSelected && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={styles.optionLetter}>{optionLetter}.</Text>
                    <Text style={[
                      styles.answerText,
                      isSelected && styles.selectedAnswerText,
                    ]}>
                      {answer.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading exam...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentExam) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load exam data</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Reading Part 2</Text>
          <Text style={styles.subtitle}>Multiple choice comprehension</Text>
        </View>

        {renderExamTabs()}
        {renderReadingText()}
        {renderQuestions()}

        <TouchableOpacity style={styles.checkButton} onPress={checkAnswers}>
          <Text style={styles.checkButtonText}>Check Answers</Text>
        </TouchableOpacity>
      </ScrollView>

      <ResultsModal
        visible={showResults}
        onClose={() => setShowResults(false)}
        examTitle={`Reading Part 2 - Test ${currentExamId + 1}`}
        result={examResult}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.textStyles.body,
    color: colors.error[500],
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.primary[500],
    padding: spacing.padding.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.textStyles.h2,
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.textStyles.body,
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing.margin.xs,
    opacity: 0.9,
  },
  tabsContainer: {
    padding: spacing.padding.lg,
    backgroundColor: colors.background.secondary,
  },
  tabsTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  tabsScroll: {
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: spacing.padding.md,
    paddingVertical: spacing.padding.sm,
    marginRight: spacing.margin.sm,
    backgroundColor: colors.background.primary,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  activeTab: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  tabText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  activeTabText: {
    color: colors.white,
  },
  section: {
    padding: spacing.padding.lg,
  },
  sectionTitle: {
    ...typography.textStyles.h3,
    color: colors.primary[500],
    marginBottom: spacing.margin.md,
  },
  textContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  textContent: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
  },
  questionContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  questionText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
    marginBottom: spacing.margin.md,
  },
  answersContainer: {
    gap: spacing.margin.sm,
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.padding.sm,
    backgroundColor: colors.background.primary,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  selectedAnswerOption: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.margin.sm,
  },
  radioButtonSelected: {
    borderColor: colors.primary[500],
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary[500],
  },
  optionLetter: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
    marginRight: spacing.margin.sm,
    minWidth: 20,
  },
  answerText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  selectedAnswerText: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.medium,
  },
  checkButton: {
    backgroundColor: colors.primary[500],
    margin: spacing.margin.lg,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.lg,
    alignItems: 'center',
  },
  checkButtonText: {
    ...typography.textStyles.h4,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default ReadingPart2Screen;
