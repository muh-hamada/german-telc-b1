import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import { GrammarPart1Exam } from '../../types/exam.types';

interface LanguagePart1UIProps {
  exam: GrammarPart1Exam;
  onComplete: (score: number) => void;
}

const LanguagePart1UI: React.FC<LanguagePart1UIProps> = ({ exam, onComplete }) => {
  const { t } = useTranslation();
  const [userAnswers, setUserAnswers] = useState<{ [questionId: number]: number }>({});

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const renderTextWithGaps = () => {
    const parts = exam.text.split(/(\[\d{2}\])/g);
    
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
    exam.questions.forEach(question => {
      const userAnswerIndex = userAnswers[question.id];
      const isCorrect = question.answers[userAnswerIndex]?.correct === true;
      if (isCorrect) {
        correctCount++;
      }
    });

    const score = (correctCount / exam.questions.length) * 15;
    onComplete(Math.round(score));
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

      {/* Questions */}
      <View style={styles.questionsSection}>
        <Text style={styles.sectionTitle}>{t('grammar.part1.questions')}</Text>
        {exam.questions.map((question) => (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionNumber}>[{question.id}]</Text>
            
            {question.answers.map((answer, index) => {
              const isSelected = userAnswers[question.id] === index;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.answerOption,
                    isSelected && styles.answerOptionSelected
                  ]}
                  onPress={() => handleAnswerSelect(question.id, index)}
                >
                  <View style={[
                    styles.radioButton,
                    isSelected && styles.radioButtonSelected
                  ]}>
                    {isSelected && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={[
                    styles.answerText,
                    isSelected && styles.answerTextSelected
                  ]}>
                    {answer.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          Object.keys(userAnswers).length < exam.questions.length && styles.submitButtonDisabled
        ]}
        disabled={Object.keys(userAnswers).length < exam.questions.length}
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

const styles = StyleSheet.create({
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
  },
  instructionsText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
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
  },
  gapIndicator: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    backgroundColor: colors.primary[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
  answerOption: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    paddingVertical: spacing.padding.sm,
    paddingHorizontal: spacing.padding.sm,
    marginTop: spacing.margin.xs,
    borderRadius: spacing.borderRadius.sm,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  answerOptionSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.secondary[400],
    marginRight: spacing.margin.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary[500],
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[500],
  },
  answerText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  answerTextSelected: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.medium,
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
  submitButtonDisabled: {
    backgroundColor: colors.secondary[400],
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.secondary,
  },
});

export default LanguagePart1UI;

