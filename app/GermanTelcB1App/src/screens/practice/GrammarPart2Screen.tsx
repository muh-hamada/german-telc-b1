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
import { GrammarPart2Exam, UserAnswer, ExamResult } from '../../types/exam.types';

const GrammarPart2Screen: React.FC = () => {
  const { t } = useTranslation();
  const { updateExamProgress } = useProgress();
  
  const [currentExamId, setCurrentExamId] = useState(0);
  const [currentExam, setCurrentExam] = useState<GrammarPart2Exam | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [gapId: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedGapId, setSelectedGapId] = useState<number | null>(null);

  useEffect(() => {
    loadExam(currentExamId);
  }, [currentExamId]);

  const loadExam = async (examId: number) => {
    try {
      setIsLoading(true);
      const exam = dataService.getGrammarPart2Exam(examId);
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

  const openAnswerModal = (gapId: number) => {
    setSelectedGapId(gapId);
    setShowAnswerModal(true);
  };

  const selectAnswer = (wordKey: string) => {
    if (selectedGapId !== null) {
      setUserAnswers(prev => ({
        ...prev,
        [selectedGapId]: wordKey,
      }));
      setShowAnswerModal(false);
      setSelectedGapId(null);
    }
  };

  const getSelectedAnswerText = (gapId: number): string => {
    const selectedKey = userAnswers[gapId];
    if (!selectedKey || !currentExam) return 'Select';
    const wordItem = currentExam.words.find(w => w.key === selectedKey);
    return wordItem ? wordItem.word : selectedKey;
  };

  const renderTextWithGaps = () => {
    if (!currentExam) return null;

    // Split the text by [number] pattern and render with gap selectors
    const parts = currentExam.text.split(/(\[\d{2}\])/g);
    
    return (
      <View style={styles.textContainer}>
        <Text style={styles.textContent}>
          {parts.map((part, index) => {
            const gapMatch = part.match(/\[(\d{2})\]/);
            if (gapMatch) {
              const gapId = parseInt(gapMatch[1]);
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.gapSelector}
                  onPress={() => openAnswerModal(gapId)}
                >
                  <Text style={styles.gapSelectorText}>
                    {getSelectedAnswerText(gapId)}
                  </Text>
                </TouchableOpacity>
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

    const gapIds = Object.keys(currentExam.answers).map(Number);
    const unansweredGaps = gapIds.filter(
      id => !userAnswers[id]
    );

    if (unansweredGaps.length > 0) {
      Alert.alert(
        'Incomplete',
        `Please answer all questions before checking. ${unansweredGaps.length} gap(s) remaining.`,
        [{ text: 'OK' }]
      );
      return;
    }

    let correctCount = 0;
    const answers = gapIds.map(gapId => {
      const userAnswer = userAnswers[gapId] || '';
      const correctAnswer = currentExam.answers[gapId.toString()];
      const isCorrect = userAnswer === correctAnswer;
      
      if (isCorrect) {
        correctCount++;
      }

      return {
        questionId: gapId,
        userAnswer,
        correctAnswer,
        isCorrect,
      };
    });

    const percentage = Math.round((correctCount / gapIds.length) * 100);
    
    const result: ExamResult = {
      examId: currentExamId,
      score: correctCount,
      maxScore: gapIds.length,
      percentage,
      correctAnswers: correctCount,
      totalQuestions: gapIds.length,
      answers,
      timestamp: Date.now(),
    };

    setExamResult(result);
    setShowResults(true);

    const userAnswersArray: UserAnswer[] = gapIds.map(gapId => {
      const userAnswer = userAnswers[gapId] || '';
      const correctAnswer = currentExam.answers[gapId.toString()];
      const isCorrect = userAnswer === correctAnswer;
      
      return {
        questionId: gapId,
        answer: userAnswer,
        isCorrect,
        timestamp: Date.now(),
      };
    });

    updateExamProgress('grammar-part2', currentExamId, userAnswersArray, correctCount, gapIds.length);
  };

  const renderExamTabs = () => {
    const exams = dataService.getGrammarPart2Exams();
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

  const renderWordList = () => {
    if (!currentExam) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wortliste (A-O)</Text>
        <View style={styles.wordListContainer}>
          {currentExam.words.map((wordItem) => (
            <View key={wordItem.key} style={styles.wordItem}>
              <Text style={styles.wordKey}>{wordItem.key}.</Text>
              <Text style={styles.wordText}>{wordItem.word}</Text>
            </View>
          ))}
        </View>
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
          <Text style={styles.title}>Grammar Part 2</Text>
          <Text style={styles.subtitle}>Sprachbausteine - Word list gap fill</Text>
        </View>

        {renderExamTabs()}
        
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Lesen Sie den Text und schließen Sie die Lücken <Text style={styles.boldText}>31-40</Text>. 
            Benutzen Sie die Wörter aus der Liste <Text style={styles.boldText}>(A-O)</Text>. 
            Jedes Wort passt nur einmal.
          </Text>
        </View>

        {renderWordList()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text mit Lücken</Text>
          {renderTextWithGaps()}
        </View>

        <TouchableOpacity style={styles.checkButton} onPress={checkAnswers}>
          <Text style={styles.checkButtonText}>Check Answers</Text>
        </TouchableOpacity>
      </ScrollView>

      <ResultsModal
        visible={showResults}
        onClose={() => setShowResults(false)}
        examTitle={`Grammar Part 2 - Test ${currentExamId + 1}`}
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
              <Text style={styles.modalTitle}>Select Word</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAnswerModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.modalContentContainer}>
              {currentExam && currentExam.words.map((wordItem) => {
                const isSelected = selectedGapId !== null && userAnswers[selectedGapId] === wordItem.key;
                return (
                  <TouchableOpacity
                    key={wordItem.key}
                    style={[
                      styles.answerOption,
                      isSelected && styles.selectedAnswerOption,
                    ]}
                    onPress={() => selectAnswer(wordItem.key)}
                  >
                    <Text style={styles.answerOptionLetter}>{wordItem.key}</Text>
                    <Text style={[
                      styles.answerOptionText,
                      isSelected && styles.selectedAnswerOptionText,
                    ]}>
                      {wordItem.word}
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
  instructionsContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    marginHorizontal: spacing.margin.lg,
    marginVertical: spacing.margin.md,
    borderRadius: spacing.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  instructionsText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: typography.fontWeight.bold,
  },
  section: {
    padding: spacing.padding.lg,
  },
  sectionTitle: {
    ...typography.textStyles.h3,
    color: colors.primary[500],
    marginBottom: spacing.margin.md,
  },
  wordListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    gap: spacing.margin.md,
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '30%',
  },
  wordKey: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
    marginRight: spacing.margin.xs,
  },
  wordText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
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
    lineHeight: 26,
  },
  gapSelector: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[500],
    borderRadius: spacing.borderRadius.sm,
    paddingHorizontal: spacing.padding.xs,
    paddingVertical: 2,
    marginHorizontal: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  gapSelectorText: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
    textAlign: 'center',
    fontSize: 11,
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
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.borderRadius.xl,
    borderTopRightRadius: spacing.borderRadius.xl,
    maxHeight: '70%',
    paddingBottom: spacing.padding.lg,
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
    ...typography.textStyles.h3,
    color: colors.primary[500],
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
    ...typography.textStyles.h3,
    color: colors.text.secondary,
  },
  modalContentContainer: {
    padding: spacing.padding.md,
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.padding.sm,
    marginBottom: spacing.margin.xs,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  selectedAnswerOption: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  answerOptionLetter: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
    marginRight: spacing.margin.sm,
    minWidth: 24,
  },
  answerOptionText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  selectedAnswerOptionText: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.medium,
  },
  checkmark: {
    ...typography.textStyles.h4,
    color: colors.primary[500],
    marginLeft: spacing.margin.sm,
  },
});

export default GrammarPart2Screen;
