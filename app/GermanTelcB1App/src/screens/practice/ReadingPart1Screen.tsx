import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import { dataService } from '../../services/data.service';
import { useProgress } from '../../contexts/ProgressContext';
import ResultsModal from '../../components/ResultsModal';
import { ReadingPart1Exam, UserAnswer, ExamResult } from '../../types/exam.types';

const ReadingPart1Screen: React.FC = () => {
  const { t } = useTranslation();
  const { updateExamProgress } = useProgress();
  
  const [currentExamId, setCurrentExamId] = useState(0);
  const [currentExam, setCurrentExam] = useState<ReadingPart1Exam | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [textId: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedTextId, setSelectedTextId] = useState<number | null>(null);

  // Load exam data
  useEffect(() => {
    loadExam(currentExamId);
  }, [currentExamId]);

  const loadExam = async (examId: number) => {
    try {
      setIsLoading(true);
      const exam = dataService.getReadingPart1ExamById(examId);
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

  const handleAnswerChange = (textId: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [textId]: answer,
    }));
  };

  const openAnswerModal = (textId: number) => {
    setSelectedTextId(textId);
    setShowAnswerModal(true);
  };

  const selectAnswer = (answer: string) => {
    if (selectedTextId !== null) {
      handleAnswerChange(selectedTextId, answer);
    }
    setShowAnswerModal(false);
    setSelectedTextId(null);
  };

  const getSelectedAnswerText = (textId: number) => {
    const answer = userAnswers[textId];
    console.log('answer', answer);
    if (!answer) return 'Select answer';
    const letter = answer.toUpperCase();
    const index = answer.charCodeAt(0) - 97;
    // if (currentExam && currentExam.headings[index]) {
    //   return `${letter}. ${currentExam.headings[index]}`;
    // }
    return letter;
  };

  const checkAnswers = () => {
    if (!currentExam) return;

    // Check for duplicate answers
    const usedAnswers = new Set<string>();
    let hasDuplicates = false;

    Object.values(userAnswers).forEach(answer => {
      if (answer && usedAnswers.has(answer)) {
        hasDuplicates = true;
      }
      if (answer) {
        usedAnswers.add(answer);
      }
    });

    if (hasDuplicates) {
      Alert.alert(
        'Duplicate Answers',
        'You have used the same heading for multiple texts. Please check your answers.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Calculate score
    let correctCount = 0;
    const results: any[] = [];

    currentExam.texts.forEach(text => {
      const userAnswer = userAnswers[text.id];
      const correctAnswer = text.correct ?? '';
      const isCorrect = userAnswer === correctAnswer;
      
      if (isCorrect) {
        correctCount++;
      }

      const correctHeading = correctAnswer
        ? currentExam.headings[correctAnswer.charCodeAt(0) - 97]
        : '';
      const userHeading = userAnswer ? currentExam.headings[userAnswer.charCodeAt(0) - 97] : 'Not selected';

      results.push({
        textId: text.id,
        isCorrect,
        userAnswer: userAnswer || '',
        correctAnswer,
        correctHeading,
        userHeading,
        text: text.text,
      });
    });

    const percentage = Math.round((correctCount / currentExam.texts.length) * 100);
    
    const result: ExamResult = {
      examId: currentExamId,
      score: correctCount,
      maxScore: currentExam.texts.length,
      percentage,
      correctAnswers: correctCount,
      totalQuestions: currentExam.texts.length,
      answers: currentExam.texts.map(text => {
        const correctAnswer = text.correct ?? '';
        return ({
          questionId: text.id,
          userAnswer: userAnswers[text.id] || '',
          correctAnswer,
          isCorrect: userAnswers[text.id] === correctAnswer,
        });
      }),
      timestamp: Date.now(),
    };

    setExamResult(result);
    setShowResults(true);

    // Save progress
    const userAnswersArray: UserAnswer[] = currentExam.texts.map(text => ({
      questionId: text.id,
      answer: userAnswers[text.id] || '',
      isCorrect: userAnswers[text.id] === text.correct,
      timestamp: Date.now(),
    }));

    updateExamProgress('reading-part1', currentExamId, userAnswersArray, correctCount, currentExam.texts.length);
  };

  const renderExamTabs = () => {
    const exams = dataService.getReadingPart1Exams();
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

  const renderHeadings = () => {
    if (!currentExam) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Headings (a-j)</Text>
        <View style={styles.headingsContainer}>
          {currentExam.headings.map((heading, index) => {
            const letter = String.fromCharCode(97 + index); // a, b, c...
            return (
              <View key={index} style={styles.headingItem}>
                <Text style={styles.headingLetter}>{letter.toUpperCase()}.</Text>
                <Text style={styles.headingText}>{heading}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTexts = () => {
    if (!currentExam) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Texts (1-5)</Text>
        {currentExam.texts.map((text) => (
          <View key={text.id} style={styles.textContainer}>
            <View style={styles.textHeader}>
              <Text style={styles.textNumber}>{text.id}.</Text>
              <TouchableOpacity
                style={styles.answerSelector}
                onPress={() => openAnswerModal(text.id)}
              >
                <Text style={styles.answerLabel}>Answer:</Text>
                <View style={styles.answerButton}>
                  <Text style={[
                    styles.answerButtonText,
                    !userAnswers[text.id] && styles.placeholderText
                  ]}>
                    {getSelectedAnswerText(text.id)}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>
              </TouchableOpacity>
            </View>
            <Text style={styles.textContent}>{text.text}</Text>
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
          <Text style={styles.title}>Reading Part 1</Text>
          <Text style={styles.subtitle}>Match headings to texts</Text>
        </View>

        {renderExamTabs()}
        {renderHeadings()}
        {renderTexts()}

        <TouchableOpacity style={styles.checkButton} onPress={checkAnswers}>
          <Text style={styles.checkButtonText}>Check Answers</Text>
        </TouchableOpacity>
      </ScrollView>

      <ResultsModal
        visible={showResults}
        onClose={() => setShowResults(false)}
        examTitle={`Reading Part 1 - Test ${currentExamId + 1}`}
        result={examResult}
      />

      {/* Answer Selection Modal */}
      <Modal
        visible={showAnswerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAnswerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Answer</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAnswerModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
              {currentExam?.headings.map((heading, index) => {
                const letter = String.fromCharCode(97 + index);
                const isSelected = selectedTextId !== null && userAnswers[selectedTextId] === letter;
                return (
                  <TouchableOpacity
                    key={letter}
                    style={[
                      styles.answerOption,
                      isSelected && styles.selectedAnswerOption,
                    ]}
                    onPress={() => selectAnswer(letter)}
                  >
                    <Text style={styles.answerOptionLetter}>{letter.toUpperCase()}.</Text>
                    <Text style={[
                      styles.answerOptionText,
                      isSelected && styles.selectedAnswerOptionText,
                    ]}>
                      {heading}
                    </Text>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  headingsContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  headingItem: {
    flexDirection: 'row',
    marginBottom: spacing.margin.sm,
  },
  headingLetter: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
    marginRight: spacing.margin.sm,
    minWidth: 20,
  },
  headingText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  textContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  textHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.margin.sm,
  },
  textNumber: {
    ...typography.textStyles.h4,
    color: colors.primary[500],
    marginRight: spacing.margin.md,
    minWidth: 30,
  },
  answerSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerLabel: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    marginRight: spacing.margin.sm,
    fontWeight: typography.fontWeight.medium,
  },
  answerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: spacing.borderRadius.md,
    paddingHorizontal: spacing.padding.sm,
    paddingVertical: spacing.padding.xs,
    minHeight: 40,
  },
  answerButtonText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  placeholderText: {
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  dropdownArrow: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    marginLeft: spacing.margin.xs,
  },
  textContent: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
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
  // Modal styles
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
    width: '92%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.padding.md,
    paddingVertical: spacing.padding.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  modalContent: {
    maxHeight: 420,
  },
  modalContentContainer: {
    paddingHorizontal: spacing.padding.md,
    paddingVertical: spacing.padding.xs,
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.padding.xs,
    paddingHorizontal: spacing.padding.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  selectedAnswerOption: {
    backgroundColor: colors.primary[50],
  },
  answerOptionLetter: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
    marginRight: spacing.margin.xs,
    minWidth: 22,
  },
  answerOptionText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 18,
  },
  selectedAnswerOptionText: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.medium,
  },
  checkmark: {
    ...typography.textStyles.bodySmall,
    color: colors.success[500],
    fontWeight: typography.fontWeight.bold,
    marginLeft: spacing.margin.sm,
  },
});

export default ReadingPart1Screen;