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
import { DeleReadingPart3Exam, UserAnswer } from '../../types/exam.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';

interface DeleReadingPart3UIProps {
  exam: DeleReadingPart3Exam;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const DeleReadingPart3UI: React.FC<DeleReadingPart3UIProps> = ({ exam, onComplete }) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: number]: string }>({});

  const textKeys = useMemo(() => Object.keys(exam.texts).sort((a, b) => a.localeCompare(b)), [exam.texts]);

  const handleAnswerSelect = (questionId: number, textKey: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: textKey,
    }));
    logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
      section: 'dele-reading',
      part: 3,
      exam_id: exam.id,
      question_id: questionId,
    });
  };

  const handleSubmit = () => {
    const unansweredQuestions = exam.questions.filter(
      q => !userAnswers[q.id]
    );

    if (unansweredQuestions.length > 0) {
      Alert.alert(
        t('reading.part3.incomplete'),
        t('reading.part3.incompleteMessage', { count: unansweredQuestions.length }),
        [{ text: 'OK' }]
      );
      return;
    }

    let correctCount = 0;
    const answers: UserAnswer[] = [];
    exam.questions.forEach(question => {
      const userAnswer = userAnswers[question.id];
      const correctAnswer = question.answer;
      const isCorrect = userAnswer?.toLowerCase() === correctAnswer.toLowerCase();
      if (isCorrect) {
        correctCount++;
      }
      answers.push({
        questionId: question.id,
        answer: userAnswer,
        isCorrect,
        timestamp: Date.now(),
        correctAnswer: correctAnswer,
        explanation: question.explanation,
      });
      logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
        section: 'dele-reading',
        part: 3,
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
        <Text style={styles.instructionsTitle}>{t('reading.part3.taskTitle')}</Text>
        <Text style={styles.instructionsText}>
          {t('reading.part3.deleTaskDescription')}
        </Text>
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.examTitle}>{exam.title}</Text>
      </View>

      {/* Texts */}
      <View style={styles.textsSection}>
        <Text style={styles.sectionTitle}>{t('reading.part3.texts')}</Text>
        {textKeys.map((key) => {
          const textData = exam.texts[key];
          return (
            <View key={key} style={styles.textItem}>
              <View style={styles.textHeader}>
                <Text style={styles.textLetter}>{key.toUpperCase()}</Text>
                <Text style={styles.personName}>{textData.person}</Text>
              </View>
              <Text style={styles.textContent}>{textData.text}</Text>
            </View>
          );
        })}
      </View>

      {/* Questions */}
      <View style={styles.questionsSection}>
        <Text style={styles.sectionTitle}>
          {t('reading.part3.questions', { count: exam.questions.length })}
        </Text>
        {exam.questions.map((question) => (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionNumber}>
              {t('reading.part3.question')} {question.id}
            </Text>
            <Text style={styles.questionText}>{question.question}</Text>

            {/* Answer Selection */}
            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>{t('reading.part3.selectText')}</Text>
              <View style={styles.answerButtons}>
                {textKeys.map((key) => {
                  const isSelected = userAnswers[question.id] === key;

                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.answerButton,
                        isSelected && styles.answerButtonSelected
                      ]}
                      onPress={() => handleAnswerSelect(question.id, key)}
                    >
                      <Text style={[
                        styles.answerButtonText,
                        isSelected && styles.answerButtonTextSelected
                      ]}>
                        {key.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
  titleSection: {
    marginBottom: spacing.margin.lg,
  },
  examTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  textsSection: {
    marginBottom: spacing.margin.xl,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
    textAlign: 'left',
  },
  textItem: {
    padding: spacing.padding.md,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.margin.md,
    borderRadius: spacing.borderRadius.sm,
    direction: 'ltr',
  },
  textHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.margin.sm,
  },
  textLetter: {
    ...typography.textStyles.h4,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    marginRight: spacing.margin.sm,
  },
  personName: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  textContent: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  questionsSection: {
    marginBottom: spacing.margin.lg,
  },
  questionCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  questionNumber: {
    ...typography.textStyles.h4,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.sm,
  },
  questionText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: spacing.margin.md,
    direction: 'ltr',
  },
  answerSection: {
    borderTopWidth: 1,
    borderTopColor: colors.secondary[200],
    paddingTop: spacing.padding.md,
  },
  answerLabel: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.margin.sm,
  },
  answerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  answerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary[100],
    justifyContent: 'center',
    alignItems: 'center',
    margin: spacing.margin.xs,
    borderWidth: 2,
    borderColor: colors.secondary[300],
  },
  answerButtonSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[600],
  },
  answerButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  answerButtonTextSelected: {
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

export default DeleReadingPart3UI;
