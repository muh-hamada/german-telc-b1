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
import Markdown from 'react-native-markdown-display';
import { colors, spacing, typography } from '../../theme';
import { dataService } from '../../services/data.service';
import { useProgress } from '../../contexts/ProgressContext';
import ResultsModal from '../../components/ResultsModal';
import { GrammarPart1Exam, UserAnswer, ExamResult } from '../../types/exam.types';

const GrammarPart1Screen: React.FC = () => {
  const { t } = useTranslation();
  const { updateExamProgress } = useProgress();
  
  const [currentExamId, setCurrentExamId] = useState(0);
  const [currentExam, setCurrentExam] = useState<GrammarPart1Exam | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: number]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExam(currentExamId);
  }, [currentExamId]);

  const loadExam = async (examId: number) => {
    try {
      setIsLoading(true);
      const exam = dataService.getGrammarPart1Exam(examId);
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

  const renderTextWithGaps = () => {
    if (!currentExam) return null;

    // Split the text by [number] pattern and render with gap indicators
    const parts = currentExam.text.split(/(\[\d{2}\])/g);
    
    return (
      <View style={styles.textContainer}>
        <Text style={styles.textContent}>
          {parts.map((part, index) => {
            const gapMatch = part.match(/\[(\d{2})\]/);
            if (gapMatch) {
              const gapNumber = gapMatch[1];
              return (
                <Text key={index} style={styles.gapIndicator}>
                  {gapNumber}
                </Text>
              );
            }
            return <Text key={index}>{part}</Text>;
          })}
        </Text>
      </View>
    );
  };

  const checkAnswers = () => {
    if (!currentExam) return;

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

    updateExamProgress('grammar-part1', currentExamId, userAnswersArray, correctCount, currentExam.questions.length);
  };

  const renderExamTabs = () => {
    const exams = dataService.getGrammarPart1Exams();
    return (
      <View style={styles.tabsContainer}>
        <Text style={styles.tabsTitle}>Select Exam:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {exams.map((exam) => (
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

  const renderQuestions = () => {
    if (!currentExam) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wahlmöglichkeiten (a, b oder c)</Text>
        {currentExam.questions.map((question) => (
          <View key={question.id} style={styles.questionContainer}>
            <Text style={styles.questionNumber}>Aufgabe {question.id}:</Text>
            
            <View style={styles.answersContainer}>
              {question.answers.map((answer, index) => {
                const isSelected = userAnswers[question.id] === index;
                const optionLetter = String.fromCharCode(97 + index); // a, b, c
                
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
                    <Text style={styles.optionLetter}>({optionLetter})</Text>
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
          <Text style={styles.title}>Grammar Part 1</Text>
          <Text style={styles.subtitle}>Sprachbausteine - Gap fill exercise</Text>
        </View>

        {renderExamTabs()}
        
        <View style={styles.instructionsContainer}>
          <Markdown style={markdownStylesInstructions}>
            {`Lesen Sie den folgenden Text und wählen Sie für jede Lücke (21-30) die richtige Lösung **(a, b oder c)**.`}
          </Markdown>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text mit Lücken</Text>
          {renderTextWithGaps()}
        </View>

        {renderQuestions()}

        <TouchableOpacity style={styles.checkButton} onPress={checkAnswers}>
          <Text style={styles.checkButtonText}>Check Answers</Text>
        </TouchableOpacity>
      </ScrollView>

      <ResultsModal
        visible={showResults}
        onClose={() => setShowResults(false)}
        examTitle={`Grammar Part 1 - Test ${currentExamId + 1}`}
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
  instructionsContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    marginHorizontal: spacing.margin.lg,
    marginVertical: spacing.margin.md,
    borderRadius: spacing.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
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
    lineHeight: 28,
  },
  gapIndicator: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
    textDecorationLine: 'underline',
    textDecorationColor: colors.primary[500],
    paddingHorizontal: spacing.padding.xs,
  },
  questionContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  questionNumber: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
    marginBottom: spacing.margin.sm,
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
    color: colors.text.primary,
    marginRight: spacing.margin.sm,
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

const markdownStylesInstructions = {
  body: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 0,
  },
  strong: {
    fontWeight: typography.fontWeight.bold as '700',
  },
  em: {
    fontStyle: 'italic' as 'italic',
  },
};

export default GrammarPart1Screen;
