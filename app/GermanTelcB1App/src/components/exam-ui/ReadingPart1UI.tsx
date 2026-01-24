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
import { ReadingPart1Exam, UserAnswer } from '../../types/exam.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';

interface ReadingPart1UIProps {
  exam: ReadingPart1Exam;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const ReadingPart1UI: React.FC<ReadingPart1UIProps> = ({ exam, onComplete }) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});

  const handleAnswerSelect = (textId: number, headingIndex: number) => {
    const letter = String.fromCharCode(97 + headingIndex);
    setUserAnswers(prev => ({ ...prev, [textId]: letter }));
    logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
      section: 'reading',
      part: 1,
      exam_id: exam.id,
      question_id: textId,
      // is_correct not known until submit in this UI
    });
  };

  const handleSubmit = () => {
    if (Object.keys(userAnswers).length < exam.texts.length) {
      Alert.alert(
        t('reading.part1.incomplete'),
        t('reading.part1.incompleteMessage'),
        [{ text: 'OK' }]
      );
      return;
    }

    // Check for duplicate answers
    const usedAnswers = new Set<string>();
    let hasDuplicates = false;
    Object.values(userAnswers).forEach(answer => {
      if (answer && usedAnswers.has(answer)) {
        hasDuplicates = true;
      }
      if (answer) {
        usedAnswers.add(answer);
      }
    });

    if (hasDuplicates) {
      Alert.alert(
        t('reading.part1.duplicateAnswers'),
        t('reading.part1.duplicateAnswersMessage'),
        [{ text: 'OK' }]
      );
      return;
    }

    let correctCount = 0;
    exam.texts.forEach(text => {
      if (userAnswers[text.id] === text.correct && text.correct) {
        correctCount++;
      }
    });

    const score = correctCount;
    const answers: UserAnswer[] = [];
    // Log per-question correctness on submit
    exam.texts.forEach(text => {
      const selected = userAnswers[text.id];
      const isCorrect = selected === text.correct;

      answers.push({
        questionId: text.id,
        answer: selected || '',
        isCorrect,
        timestamp: Date.now(),
        correctAnswer: text.correct,
        explanation: text.explanation,
      });

      logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
        section: 'reading',
        part: 1,
        exam_id: exam.id,
        question_id: text.id,
        is_correct: !!isCorrect,
      });
    });
    onComplete(score, answers);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>{t('reading.part1.taskTitle')}</Text>
        <Text style={styles.instructionsText}>
          {t('reading.part1.taskDescription')}
        </Text>
      </View>

      {/* Headings */}
      <View style={styles.headingsSection}>
        <Text style={styles.sectionTitle}>{t('reading.part1.headings')}</Text>
        {exam.headings.map((heading, index) => (
          <View key={index} style={styles.headingItem}>
            <Text style={styles.headingLetter}>{String.fromCharCode(97 + index)}</Text>
            <Text style={styles.headingText}>{heading}</Text>
          </View>
        ))}
      </View>

      {/* Texts */}
      <View style={styles.textsSection}>
        <Text style={styles.sectionTitle}>{t('reading.part1.texts', { count: exam.texts.length })}</Text>
        {exam.texts.map((text) => (
          <View key={text.id} style={styles.textCard}>
            <Text style={styles.textNumber}>{t('reading.part1.text')} {text.id}</Text>
            <Text style={styles.textContent}>{text.text}</Text>
            
            {/* Answer Selection */}
            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>{t('reading.part1.selectHeading')}</Text>
              <View style={styles.answerButtons}>
                {exam.headings.map((_, headingIndex) => {
                  const letter = String.fromCharCode(97 + headingIndex);
                  const isSelected = userAnswers[text.id] === letter;
                  
                  return (
                    <TouchableOpacity
                      key={headingIndex}
                      style={[
                        styles.answerButton,
                        isSelected && styles.answerButtonSelected
                      ]}
                      onPress={() => handleAnswerSelect(text.id, headingIndex)}
                    >
                      <Text style={[
                        styles.answerButtonText,
                        isSelected && styles.answerButtonTextSelected
                      ]}>
                        {letter}
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
          {t('reading.part1.submitAnswers', { 
            answered: Object.keys(userAnswers).length, 
            total: exam.texts.length 
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
  headingsSection: {
    marginBottom: spacing.margin.xl,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
    textAlign: 'left',
  },
  headingItem: {
    flexDirection: 'row',
    padding: spacing.padding.sm,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.margin.xs,
    borderRadius: spacing.borderRadius.sm,
    direction: 'ltr',
  },
  headingLetter: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    width: 30,
  },
  headingText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  textsSection: {
    marginBottom: spacing.margin.lg,
  },
  textCard: {
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
  textNumber: {
    ...typography.textStyles.h4,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.sm,
  },
  textContent: {
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

export default ReadingPart1UI;

