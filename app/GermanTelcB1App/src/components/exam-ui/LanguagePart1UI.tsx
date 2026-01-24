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
import { GrammarPart1Exam, UserAnswer } from '../../types/exam.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import MultiChoiceSelectionModal from './MultiChoiceSelectionModal';

interface LanguagePart1UIProps {
  exam: GrammarPart1Exam;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const LanguagePart1UI: React.FC<LanguagePart1UIProps> = ({ exam, onComplete }) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: number]: number }>({});
  const [showModal, setShowModal] = useState(false);
  const [selectedGap, setSelectedGap] = useState<number | null>(null);

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex,
    }));
    setShowModal(false);
    setSelectedGap(null);
    logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
      section: 'grammar',
      part: 1,
      exam_id: exam.id,
      question_id: questionId,
    });
  };

  const getSelectedAnswerText = (gapId: number): string => {
    const answerIndex = userAnswers[gapId];
    if (answerIndex === undefined) return t('grammar.part1.select');
    const question = exam.questions.find(q => q.id === gapId);
    return question?.answers[answerIndex]?.text || t('grammar.part1.select');
  };

  const renderTextWithGaps = () => {
    const parts = exam.text.split(/(\[\d{2}\])/g);
    
    return (
      <View style={styles.textContainer}>
        <Text style={styles.textContent}>
          {parts.map((part, index) => {
            const gapMatch = part.match(/\[(\d{2})\]/);
            if (gapMatch) {
              const gapId = parseInt(gapMatch[1]);
              return (
                <Text
                  key={index}
                  style={styles.gapButton}
                  onPress={() => {
                    setSelectedGap(gapId);
                    setShowModal(true);
                  }}
                >
                  {getSelectedAnswerText(gapId)}
                </Text>
              );
            }
            return <Text key={index}>{part}</Text>;
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
        t('grammar.part1.incomplete'),
        t('grammar.part1.incompleteMessage', { count: unansweredQuestions.length }),
        [{ text: 'OK' }]
      );
      return;
    }

    let correctCount = 0;
    const answers: UserAnswer[] = [];
    exam.questions.forEach(question => {
      const userAnswerIndex = userAnswers[question.id];
      const correctAnswerIndex = question.answers.findIndex(a => a.correct === true);
      const isCorrect = userAnswerIndex === correctAnswerIndex;
      if (isCorrect) {
        correctCount++;
      }
      answers.push({
        questionId: question.id,
        answer: question.answers[userAnswerIndex]?.text || '',
        isCorrect,
        timestamp: Date.now(),
        correctAnswer: correctAnswerIndex !== -1 ? question.answers[correctAnswerIndex]?.text : undefined,
        explanation: question.explanation,
      });
      logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
        section: 'grammar',
        part: 1,
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
        <Text style={styles.instructionsTitle}>{t('grammar.part1.taskTitle')}</Text>
        <Text style={styles.instructionsText}>
          {t('grammar.part1.taskDescription')}
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
        selectedGap={selectedGap}
        options={
          selectedGap !== null && exam.questions.find(q => q.id === selectedGap)?.answers.map((answer, index) => ({
            key: index,
            text: answer.text,
            isSelected: userAnswers[selectedGap] === index,
          })) || []
        }
        onSelect={(key) => selectedGap !== null && handleAnswerSelect(selectedGap, key as number)}
        onClose={() => {
          setShowModal(false);
          setSelectedGap(null);
        }}
      />

      {/* Submit Button */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>
          {t('grammar.part1.submitAnswers', { 
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
    marginBottom: spacing.margin.xl,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
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
    direction: 'ltr',
  },
  gapButton: {
    ...typography.textStyles.bodySmall,
    backgroundColor: colors.primary[100],
    color: colors.primary[700],
    fontWeight: typography.fontWeight.medium,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.primary[300],
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

export default LanguagePart1UI;

