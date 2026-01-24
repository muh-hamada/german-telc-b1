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
import { ReadingPart2A1Exam, UserAnswer } from '../../types/exam.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { formatText } from '../../utils/text-formatter';

interface ReadingPart2A1UIProps {
  exam: ReadingPart2A1Exam;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const ReadingPart2A1UI: React.FC<ReadingPart2A1UIProps> = ({ exam, onComplete }) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});

  const handleAnswerSelect = (questionId: number, optionId: number) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: optionId }));
    logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
      section: 'reading',
      part: 2,
      exam_id: exam.id,
      question_id: questionId,
      // is_correct not known until submit
    });
  };

  const handleSubmit = () => {
    if (Object.keys(userAnswers).length < exam.questions.length) {
      Alert.alert(
        t('reading.part2.incomplete'),
        t('reading.part2.incompleteMessage', { count: exam.questions.length - Object.keys(userAnswers).length }),
        [{ text: 'OK' }]
      );
      return;
    }

    let correctCount = 0;
    const answers: UserAnswer[] = [];
    
    exam.questions.forEach(question => {
      const selectedOptionId = userAnswers[question.id];
      const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
      const isCorrect = selectedOption?.is_correct || false;
      
      if (isCorrect) {
        correctCount++;
      }

      answers.push({
        questionId: question.id,
        answer: selectedOptionId?.toString() || '',
        isCorrect,
        timestamp: Date.now(),
        correctAnswer: question.options.find(opt => opt.is_correct)?.id.toString() || '',
        explanation: question.explanation,
      });

      logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
        section: 'reading',
        part: 2,
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
        <Text style={styles.instructionsTitle}>{t('reading.part2.taskTitle')}</Text>
        <Text style={styles.instructionsText}>
          {t('reading.part2.a1TaskDescription')}
        </Text>
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.titleText}>{exam.title}</Text>
      </View>

      {/* Questions */}
      <View style={styles.questionsSection}>
        {exam.questions.map((question) => (
          <View key={question.id} style={styles.questionCard}>
            {/* Question Number and Situation */}
            <View style={styles.questionHeader}>
              <Text style={styles.questionNumber}>{question.id}.</Text>
              <Text style={styles.situationText}>{question.situation}</Text>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {question.options.map((option) => {
                const isSelected = userAnswers[question.id] === option.id;
                const optionText = option.text || option.option || '';
                
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionCard,
                      isSelected && styles.optionCardSelected
                    ]}
                    onPress={() => handleAnswerSelect(question.id, option.id)}
                  >
                    <View style={styles.optionHeader}>
                      <View style={[
                        styles.optionRadio,
                        isSelected && styles.optionRadioSelected
                      ]}>
                        {isSelected && <View style={styles.optionRadioInner} />}
                      </View>
                      <Text style={styles.optionLabel}>
                        {t('reading.part2.option')} {option.id}
                      </Text>
                    </View>
                    <Text style={styles.optionText}>
                      {formatText(optionText, {
                        boldStyle: styles.boldText,
                        underlineStyle: styles.underlineText,
                      })}
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
          {t('reading.part2.submitAnswers', { 
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
  titleText: {
    ...typography.textStyles.h3,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
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
  situationText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
    flex: 1,
    fontWeight: typography.fontWeight.semibold,
  },
  optionsContainer: {
    gap: spacing.margin.md,
  },
  optionCard: {
    backgroundColor: colors.background.primary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 2,
    borderColor: colors.secondary[300],
  },
  optionCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.margin.sm,
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.secondary[400],
    marginRight: spacing.margin.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioSelected: {
    borderColor: colors.primary[500],
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[500],
  },
  optionLabel: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold,
  },
  optionText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: typography.fontWeight.bold,
  },
  underlineText: {
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

export default ReadingPart2A1UI;

