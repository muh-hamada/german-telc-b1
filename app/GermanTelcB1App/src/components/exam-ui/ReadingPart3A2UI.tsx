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
import { ReadingPart3A2Exam, UserAnswer } from '../../types/exam.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import MarkdownText from '../MarkdownText';

interface ReadingPart3A2UIProps {
  exam: ReadingPart3A2Exam;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const ReadingPart3A2UI: React.FC<ReadingPart3A2UIProps> = ({ exam, onComplete }) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});

  const advertisementKeys = useMemo(() => {
    return Object.keys(exam.advertisements).sort((a, b) => {
      if (a === 'x') return 1;
      if (b === 'x') return -1;
      return a.localeCompare(b);
    });
  }, [exam.advertisements]);

  const handleAnswerSelect = (questionId: number, adKey: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: adKey }));
    logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
      section: 'reading',
      part: 3,
      exam_id: exam.id,
      question_id: questionId,
    });
  };

  const handleSubmit = () => {
    const unansweredCount = exam.questions.length - Object.keys(userAnswers).length;
    if (unansweredCount > 0) {
      Alert.alert(
        t('reading.part3.incomplete'),
        t('reading.part3.incompleteMessage', { count: unansweredCount }),
        [{ text: 'OK' }]
      );
      return;
    }

    let correctCount = 0;
    const answers: UserAnswer[] = [];

    exam.questions.forEach(question => {
      const userAnswer = userAnswers[question.id];
      const isCorrect = userAnswer === question.answer;

      if (isCorrect) {
        correctCount++;
      }

      answers.push({
        questionId: question.id,
        answer: userAnswer || '',
        isCorrect,
        timestamp: Date.now(),
        correctAnswer: question.answer,
        explanation: question.explanation,
      });

      logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
        section: 'reading',
        part: 3,
        exam_id: exam.id,
        question_id: question.id,
        is_correct: isCorrect,
      });
    });

    onComplete(correctCount, answers);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>{t('reading.part3.taskTitle')}</Text>
        <Text style={styles.instructionsText}>
          {t('reading.part3.a2TaskDescription')}
        </Text>
      </View>

      {/* Advertisements */}
      <View style={styles.adsSection}>
        <Text style={styles.sectionTitle}>{t('reading.part3.advertisements')}</Text>
        {advertisementKeys.map((key) => (
          <View key={key} style={styles.adCard}>
            <View style={styles.adHeader}>
              <Text style={styles.adLabel}>
                {key === 'x' ? 'X' : key.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.adText}>
              <MarkdownText
                text={exam.advertisements[key]}
                baseStyle={styles.adText}
              />
            </Text>
          </View>
        ))}
      </View>

      {/* Questions */}
      <View style={styles.questionsSection}>
        <Text style={styles.sectionTitle}>{t('reading.part3.situations')}</Text>
        {exam.questions.map((question) => (
          <View key={question.id} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionNumber}>{question.id}.</Text>
              <Text style={styles.questionText}>{question.question}</Text>
            </View>

            {/* Answer Selection Grid */}
            <View style={styles.answerGrid}>
              {advertisementKeys.map((key) => {
                const isSelected = userAnswers[question.id] === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.answerChip,
                      isSelected && styles.answerChipSelected
                    ]}
                    onPress={() => handleAnswerSelect(question.id, key)}
                  >
                    <Text style={[
                      styles.answerChipText,
                      isSelected && styles.answerChipTextSelected
                    ]}>
                      {key === 'x' ? 'X' : key.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>
          {t('reading.part3.submitAnswers', {
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
  adsSection: {
    marginBottom: spacing.margin.xl,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
    textAlign: 'left',
  },
  adCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    direction: 'ltr',
  },
  adHeader: {
    marginBottom: spacing.margin.sm,
  },
  adLabel: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    fontSize: 16,
  },
  adText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    lineHeight: 22,
  },
  questionsSection: {
    marginBottom: spacing.margin.lg,
  },
  questionCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    direction: 'ltr',
  },
  questionHeader: {
    flexDirection: 'row',
    marginBottom: spacing.margin.lg,
    gap: spacing.margin.sm,
  },
  questionNumber: {
    ...typography.textStyles.h4,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  questionText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
    flex: 1,
    fontWeight: typography.fontWeight.semibold,
  },
  answerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.margin.sm,
  },
  answerChip: {
    paddingVertical: spacing.padding.sm,
    paddingHorizontal: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    backgroundColor: colors.secondary[100],
    borderWidth: 2,
    borderColor: colors.secondary[300],
    minWidth: 48,
    alignItems: 'center',
  },
  answerChipSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[600],
  },
  answerChipText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  answerChipTextSelected: {
    color: colors.background.secondary,
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

export default ReadingPart3A2UI;
