import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../../theme';
import { useAppTheme } from '../../contexts/ThemeContext';
import { DeleGrammarPart2Exam, UserAnswer } from '../../types/exam.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import MultiChoiceSelectionModal from './MultiChoiceSelectionModal';

interface DeleGrammarPart2UIProps {
  exam: DeleGrammarPart2Exam;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const DeleGrammarPart2UI: React.FC<DeleGrammarPart2UIProps> = ({ exam, onComplete }) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: number]: number }>({});
  const [showModal, setShowModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex,
    }));
    setShowModal(false);
    setSelectedQuestion(null);
    logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
      section: 'dele-grammar',
      part: 2,
      exam_id: exam.id,
      question_id: questionId,
    });
  };

  const getSelectedAnswerText = (questionId: number): string => {
    const answerIndex = userAnswers[questionId];
    if (answerIndex === undefined) return t('grammar.part2.select');
    const question = exam.questions.find(q => q.id === questionId);
    return question?.options[answerIndex]?.text || t('grammar.part2.select');
  };

  const renderTextWithGaps = () => {
    if (!exam.text) {
      return null;
    }
    const parts = exam.text.split(/(\[\d{2}\])/g);
    const gapRegex = /\[(\d{2})\]/;
    
    return (
      <View style={styles.textContainer}>
        <Text style={styles.textContent}>
          {parts.map((part, index) => {
            const gapMatch = gapRegex.exec(part);
            if (gapMatch) {
              const gapId = Number.parseInt(gapMatch[1], 10);
              return (
                <Text
                  key={`gap-${gapId}`}
                  style={styles.gapButton}
                  onPress={() => {
                    setSelectedQuestion(gapId);
                    setShowModal(true);
                  }}
                >
                  {getSelectedAnswerText(gapId)}
                </Text>
              );
            }
            return <Text key={`text-part-${part.slice(0, 10)}-${index}`}>{part}</Text>;
          })}
        </Text>
      </View>
    );
  };

  const handleSubmit = () => {
    const unansweredQuestions = exam.questions.filter(
      q => userAnswers[q.id] === undefined
    );

    if (unansweredQuestions.length > 0) {
      Alert.alert(
        t('grammar.part2.incomplete'),
        t('grammar.part2.incompleteMessage', { count: unansweredQuestions.length }),
        [{ text: 'OK' }]
      );
      return;
    }

    let correctCount = 0;
    const answers: UserAnswer[] = [];
    exam.questions.forEach(question => {
      const userAnswerIndex = userAnswers[question.id];
      const correctAnswerIndex = question.options.findIndex(a => a.correct === true);
      const isCorrect = userAnswerIndex === correctAnswerIndex;
      if (isCorrect) {
        correctCount++;
      }
      answers.push({
        questionId: question.id,
        answer: question.options[userAnswerIndex]?.text || '',
        isCorrect,
        timestamp: Date.now(),
        correctAnswer: correctAnswerIndex === -1 ? undefined : question.options[correctAnswerIndex]?.text,
        explanation: question.explanation,
      });
      logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
        section: 'dele-grammar',
        part: 2,
        exam_id: exam.id,
        question_id: question.id,
        is_correct: !!isCorrect,
      });
    });

    const score = correctCount;
    onComplete(score, answers);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>{t('grammar.part2.taskTitle')}</Text>
        <Text style={styles.instructionsText}>
          {t('grammar.part2.deleTaskDescription')}
        </Text>
      </View>

      {/* Text with gaps */}
      <View style={styles.textSection}>
        <Text style={styles.sectionTitle}>{exam.title}</Text>
        {renderTextWithGaps()}
      </View>

      {/* Answer Selection Modal */}
      <MultiChoiceSelectionModal
        visible={showModal}
        selectedGap={selectedQuestion}
        options={
          selectedQuestion !== null && exam.questions.find(q => q.id === selectedQuestion)?.options.map((option, index) => ({
            key: index,
            text: option.text,
            isSelected: userAnswers[selectedQuestion] === index,
          })) || []
        }
        onSelect={(key) => selectedQuestion !== null && handleAnswerSelect(selectedQuestion, key as number)}
        onClose={() => {
          setShowModal(false);
          setSelectedQuestion(null);
        }}
        modalTitle={selectedQuestion !== null ? `${t('grammar.part2.selectAnswer')} [${selectedQuestion}]` : ''}
      />

      {/* Submit Button */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>
          {t('grammar.part2.submitAnswers', { 
            answered: Object.keys(userAnswers).length, 
            total: exam.questions.length 
          })}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    padding: spacing.padding.lg,
  },
  instructionsCard: {
    backgroundColor: colors.secondary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  instructionsTitle: {
    ...typography.textStyles.h4,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.sm,
    textAlign: 'left',
  },
  instructionsText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
    textAlign: 'left',
  },
  textSection: {
    marginBottom: spacing.margin.lg,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.md,
    textAlign: 'left',
  },
  textContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textContent: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 26,
    direction: 'ltr',
  },
  gapButton: {
    ...typography.textStyles.body,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.padding.xs,
    paddingVertical: 2,
    borderRadius: spacing.borderRadius.sm,
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.secondary,
  },
});

export default DeleGrammarPart2UI;
