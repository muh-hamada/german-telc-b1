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
import Markdown from 'react-native-markdown-display';
import { colors, spacing, typography } from '../../theme';
import { dataService } from '../../services/data.service';
import { useProgress } from '../../contexts/ProgressContext';
import ResultsModal from '../../components/ResultsModal';
import { ReadingPart3Exam, UserAnswer, ExamResult } from '../../types/exam.types';

const ReadingPart3Screen: React.FC = () => {
  const { t } = useTranslation();
  const { updateExamProgress } = useProgress();
  
  const [currentExamId, setCurrentExamId] = useState(0);
  const [currentExam, setCurrentExam] = useState<ReadingPart3Exam | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [situationId: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedSituationId, setSelectedSituationId] = useState<number | null>(null);

  // Load exam data
  useEffect(() => {
    loadExam(currentExamId);
  }, [currentExamId]);

  const loadExam = async (examId: number) => {
    try {
      setIsLoading(true);
      const exam = dataService.getReadingPart3Exam(examId);
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

  const openAnswerModal = (situationId: number) => {
    setSelectedSituationId(situationId);
    setShowAnswerModal(true);
  };

  const selectAnswer = (answer: string) => {
    if (selectedSituationId !== null) {
      setUserAnswers(prev => ({
        ...prev,
        [selectedSituationId]: answer,
      }));
    }
    setShowAnswerModal(false);
    setSelectedSituationId(null);
  };

  const getSelectedAnswerText = (situationId: number) => {
    const answer = userAnswers[situationId];
    if (!answer) return 'Select';
    return answer.toUpperCase();
  };

  const checkAnswers = () => {
    if (!currentExam) return;

    // Check if all situations are answered
    const unansweredSituations = currentExam.situations.filter(
      s => !userAnswers[s.id]
    );

    if (unansweredSituations.length > 0) {
      Alert.alert(
        'Incomplete',
        `Please answer all situations before checking. ${unansweredSituations.length} situation(s) remaining.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Calculate score
    let correctCount = 0;

    currentExam.situations.forEach(situation => {
      const userAnswer = userAnswers[situation.id];
      const isCorrect = userAnswer?.toLowerCase() === situation.answer.toLowerCase();
      
      if (isCorrect) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / currentExam.situations.length) * 100);
    
    const result: ExamResult = {
      examId: currentExamId,
      score: correctCount,
      maxScore: currentExam.situations.length,
      percentage,
      correctAnswers: correctCount,
      totalQuestions: currentExam.situations.length,
      answers: currentExam.situations.map(situation => {
        const userAnswerKey = userAnswers[situation.id] || '';
        const correctAnswerKey = situation.answer;
        const userAnswerText = userAnswerKey 
          ? (currentExam.advertisements[userAnswerKey] || userAnswerKey.toUpperCase())
          : 'Not answered';
        const correctAnswerText = currentExam.advertisements[correctAnswerKey] || correctAnswerKey.toUpperCase();
        
        return {
          questionId: situation.id,
          userAnswer: `${userAnswerKey.toUpperCase()}: ${userAnswerText}`,
          correctAnswer: `${correctAnswerKey.toUpperCase()}: ${correctAnswerText}`,
          isCorrect: userAnswerKey?.toLowerCase() === correctAnswerKey.toLowerCase(),
        };
      }),
      timestamp: Date.now(),
    };

    setExamResult(result);
    setShowResults(true);

    // Save progress
    const userAnswersArray: UserAnswer[] = currentExam.situations.map(situation => {
      const userAnswer = userAnswers[situation.id] || '';
      const isCorrect = userAnswer?.toLowerCase() === situation.answer.toLowerCase();
      
      return {
        questionId: situation.id,
        answer: userAnswer,
        isCorrect,
        timestamp: Date.now(),
      };
    });

    updateExamProgress('reading-part3', currentExamId, userAnswersArray, correctCount, currentExam.situations.length);
  };

  const renderExamTabs = () => {
    const exams = dataService.getReadingPart3Exams();
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

  const renderAdvertisements = () => {
    if (!currentExam) return null;

    // Filter out 'x' as it's a special case
    const adKeys = Object.keys(currentExam.advertisements).filter(key => key !== 'x').sort();

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Die Anzeigen (a - l)</Text>
        <View style={styles.advertisementsGrid}>
          {adKeys.map((key) => (
            <View key={key} style={styles.advertisementCard}>
              <Text style={styles.advertisementKey}>{key.toUpperCase()}</Text>
              <Markdown style={markdownStylesAd}>
                {currentExam.advertisements[key]}
              </Markdown>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderSituations = () => {
    if (!currentExam) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Die Situationen (11 - 20)</Text>
        {currentExam.situations.map((situation) => (
          <View key={situation.id} style={styles.situationContainer}>
            <View style={styles.situationHeader}>
              <Text style={styles.situationNumber}>{situation.id}.</Text>
              <Markdown style={markdownStylesSituation}>
                {situation.text}
              </Markdown>
            </View>
            
            <TouchableOpacity
              style={styles.answerSelector}
              onPress={() => openAnswerModal(situation.id)}
            >
              <Text style={styles.answerLabel}>Answer:</Text>
              <View style={styles.answerButton}>
                <Text style={[
                  styles.answerButtonText,
                  !userAnswers[situation.id] && styles.placeholderText
                ]}>
                  {getSelectedAnswerText(situation.id)}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </View>
            </TouchableOpacity>
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
          <Text style={styles.title}>Reading Part 3</Text>
          <Text style={styles.subtitle}>Match situations to advertisements</Text>
        </View>

        {renderExamTabs()}
        
        <View style={styles.instructionsContainer}>
          <Markdown style={markdownStylesInstructions}>
            {`Lesen Sie die Situationen (11-20) und die Anzeigen (a-l). Finden Sie für jede Situation die passende Anzeige. Sie können jede Anzeige nur einmal benutzen. Wenn Sie keine Anzeige finden, markieren Sie **x**.`}
          </Markdown>
        </View>

        {renderAdvertisements()}
        {renderSituations()}

        <TouchableOpacity style={styles.checkButton} onPress={checkAnswers}>
          <Text style={styles.checkButtonText}>Check Answers</Text>
        </TouchableOpacity>
      </ScrollView>

      <ResultsModal
        visible={showResults}
        onClose={() => setShowResults(false)}
        examTitle={`Reading Part 3 - Test ${currentExamId + 1}`}
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
            
            <ScrollView contentContainerStyle={styles.modalContentContainer}>
              {currentExam && Object.keys(currentExam.advertisements).sort().map((key) => {
                const isSelected = selectedSituationId !== null && userAnswers[selectedSituationId] === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.answerOption,
                      isSelected && styles.selectedAnswerOption,
                    ]}
                    onPress={() => selectAnswer(key)}
                  >
                    <Text style={styles.answerOptionLetter}>{key.toUpperCase()}</Text>
                    <Markdown style={isSelected ? markdownStylesModalSelected : markdownStylesModal}>
                      {currentExam.advertisements[key]}
                    </Markdown>
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
  advertisementsGrid: {
    gap: spacing.margin.sm,
  },
  advertisementCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    marginBottom: spacing.margin.sm,
  },
  advertisementKey: {
    ...typography.textStyles.h4,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
    marginBottom: spacing.margin.xs,
  },
  advertisementText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    lineHeight: 20,
  },
  situationContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  situationHeader: {
    flexDirection: 'row',
    marginBottom: spacing.margin.sm,
  },
  situationNumber: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
    marginRight: spacing.margin.sm,
    minWidth: 30,
  },
  situationText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 22,
  },
  answerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.margin.sm,
  },
  answerLabel: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    marginRight: spacing.margin.sm,
    fontWeight: typography.fontWeight.medium,
  },
  answerButton: {
    minWidth: 80,
    paddingHorizontal: spacing.padding.sm,
    paddingVertical: spacing.padding.xs,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: spacing.borderRadius.md,
  },
  answerButtonText: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginRight: spacing.margin.xs,
  },
  placeholderText: {
    color: colors.text.tertiary,
    fontStyle: 'italic',
    ...typography.textStyles.body,
  },
  dropdownArrow: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    marginLeft: spacing.margin.xs,
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
    padding: spacing.padding.sm,
  },
  modalContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: spacing.borderRadius.lg,
    maxHeight: '80%',
    width: '92%',
    maxWidth: 400,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  modalContentContainer: {
    paddingVertical: spacing.padding.xs,
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.padding.md,
    paddingVertical: spacing.padding.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  selectedAnswerOption: {
    backgroundColor: colors.primary[50],
  },
  answerOptionLetter: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
    marginRight: spacing.margin.sm,
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

const markdownStylesAd = {
  body: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    lineHeight: 20,
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

const markdownStylesSituation = {
  body: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
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

const markdownStylesModal = {
  body: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 18,
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

const markdownStylesModalSelected = {
  body: {
    ...typography.textStyles.bodySmall,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.medium as '500',
    flex: 1,
    lineHeight: 18,
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

export default ReadingPart3Screen;
