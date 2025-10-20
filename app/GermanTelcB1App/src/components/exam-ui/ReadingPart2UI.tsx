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
import { colors, spacing, typography } from '../../theme';
import { ReadingPart2Exam } from '../../types/exam.types';

interface ReadingPart2UIProps {
  exam: ReadingPart2Exam;
  onComplete: (score: number) => void;
}

const ReadingPart2UI: React.FC<ReadingPart2UIProps> = ({ exam, onComplete }) => {
  const [userAnswers, setUserAnswers] = useState<{ [questionId: number]: number }>({});

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleSubmit = () => {
    const unansweredQuestions = exam.questions.filter(
      q => userAnswers[q.id] === undefined
    );

    if (unansweredQuestions.length > 0) {
      Alert.alert(
        'Incomplete',
        `Please answer all questions before submitting. ${unansweredQuestions.length} question(s) remaining.`,
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

    const score = (correctCount / exam.questions.length) * 25;
    onComplete(Math.round(score));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>Aufgabenstellung:</Text>
        <Text style={styles.instructionsText}>
          Lesen Sie den folgenden Text und beantworten Sie die Fragen, indem Sie die richtige Antwort auswählen.
        </Text>
      </View>

      {/* Text */}
      <View style={styles.textSection}>
        <Text style={styles.sectionTitle}>{exam.title}</Text>
        <View style={styles.textCard}>
          <Text style={styles.textContent}>{exam.text}</Text>
        </View>
      </View>

      {/* Questions */}
      <View style={styles.questionsSection}>
        <Text style={styles.sectionTitle}>Fragen ({exam.questions[0]?.id}-{exam.questions[exam.questions.length - 1]?.id}):</Text>
        {exam.questions.map((question) => (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionNumber}>{question.id}.</Text>
            <Text style={styles.questionText}>{question.question}</Text>
            
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
          Antworten einreichen ({Object.keys(userAnswers).length}/{exam.questions.length})
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
  textCard: {
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
    marginBottom: spacing.margin.xs,
  },
  questionText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
    lineHeight: 22,
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
    lineHeight: 20,
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
    marginTop: spacing.margin.lg,
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

export default ReadingPart2UI;

