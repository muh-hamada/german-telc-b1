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
import { ReadingPart1A1Exam, UserAnswer } from '../../types/exam.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';

interface ReadingPart1A1UIProps {
  exam: ReadingPart1A1Exam;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const ReadingPart1A1UI: React.FC<ReadingPart1A1UIProps> = ({ exam, onComplete }) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: boolean }>({});

  const handleAnswerSelect = (questionId: number, answer: boolean) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
    logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
      section: 'reading',
      part: 1,
      exam_id: exam.id,
      question_id: questionId,
      // is_correct not known until submit
    });
  };

  const handleSubmit = () => {
    if (Object.keys(userAnswers).length < exam.questions.length) {
      Alert.alert(
        t('reading.part1.incomplete'),
        t('reading.part1.incompleteMessage'),
        [{ text: 'OK' }]
      );
      return;
    }

    let correctCount = 0;
    const answers: UserAnswer[] = [];
    
    exam.questions.forEach(question => {
      const userAnswer = userAnswers[question.id];
      const isCorrect = userAnswer === question.is_correct;
      
      if (isCorrect) {
        correctCount++;
      }

      answers.push({
        questionId: question.id,
        answer: userAnswer ? 'true' : 'false',
        isCorrect,
        timestamp: Date.now(),
        correctAnswer: question.is_correct ? 'true' : 'false',
        explanation: question.explanation,
      });

      logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
        section: 'reading',
        part: 1,
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
        <Text style={styles.instructionsTitle}>{t('reading.part1.taskTitle')}</Text>
        <Text style={styles.instructionsText}>
          {t('reading.part1.a1TaskDescription')}
        </Text>
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.titleText}>{exam.title}</Text>
      </View>

      {/* Text */}
      <View style={styles.textCard}>
        <Text style={styles.textContent}>{exam.text}</Text>
      </View>

      {/* Questions */}
      <View style={styles.questionsSection}>
        <Text style={styles.sectionTitle}>{t('reading.part1.questions')}</Text>
        {exam.questions.map((question) => (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionNumber}>{question.id}.</Text>
            <View style={styles.questionContent}>
              <Text style={styles.questionText}>{question.question}</Text>
              
              {/* Answer Selection: Richtig/Falsch */}
              <View style={styles.answerButtons}>
                <TouchableOpacity
                  style={[
                    styles.answerButton,
                    userAnswers[question.id] === true && styles.answerButtonSelected
                  ]}
                  onPress={() => handleAnswerSelect(question.id, true)}
                >
                  <Text style={[
                    styles.answerButtonText,
                    userAnswers[question.id] === true && styles.answerButtonTextSelected
                  ]}>
                    {t('reading.part1.richtig')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.answerButton,
                    userAnswers[question.id] === false && styles.answerButtonSelected
                  ]}
                  onPress={() => handleAnswerSelect(question.id, false)}
                >
                  <Text style={[
                    styles.answerButtonText,
                    userAnswers[question.id] === false && styles.answerButtonTextSelected
                  ]}>
                    {t('reading.part1.falsch')}
                  </Text>
                </TouchableOpacity>
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
          {t('reading.part1.submitAnswers', { 
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
    marginBottom: spacing.margin.md,
  },
  titleText: {
    ...typography.textStyles.h3,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  textCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textContent: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 26,
    fontSize: 16,
    direction: 'ltr',
  },
  questionsSection: {
    marginBottom: spacing.margin.lg,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
    textAlign: 'left',
  },
  questionCard: {
    flexDirection: 'row',
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
  questionNumber: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    marginRight: spacing.margin.sm,
    minWidth: 30,
  },
  questionContent: {
    flex: 1,
  },
  questionText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: spacing.margin.md,
  },
  answerButtons: {
    flexDirection: 'row',
    gap: spacing.margin.md,
  },
  answerButton: {
    flex: 1,
    paddingVertical: spacing.padding.sm,
    paddingHorizontal: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    backgroundColor: colors.secondary[100],
    borderWidth: 2,
    borderColor: colors.secondary[300],
    alignItems: 'center',
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

export default ReadingPart1A1UI;

