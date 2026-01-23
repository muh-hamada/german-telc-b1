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
import { DeleReadingPart1Exam, UserAnswer } from '../../types/exam.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';

interface DeleReadingPart1UIProps {
  exam: DeleReadingPart1Exam;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const DeleReadingPart1UI: React.FC<DeleReadingPart1UIProps> = ({ exam, onComplete }) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});

  const programKeys = useMemo(() => Object.keys(exam.programs).sort((a, b) => a.localeCompare(b)), [exam.programs]);

  const handleAnswerSelect = (questionId: number, programKey: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: programKey }));
    logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
      section: 'dele-reading',
      part: 1,
      exam_id: exam.id,
      question_id: questionId,
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
    exam.questions.forEach(question => {
      if (userAnswers[question.id] === question.answer) {
        correctCount++;
      }
    });

    const score = correctCount;
    const answers: UserAnswer[] = [];
    
    exam.questions.forEach(question => {
      const selected = userAnswers[question.id];
      const isCorrect = selected === question.answer;

      answers.push({
        questionId: question.id,
        answer: selected || '',
        isCorrect,
        timestamp: Date.now(),
        correctAnswer: question.answer,
        explanation: question.explanation,
      });

      logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
        section: 'dele-reading',
        part: 1,
        exam_id: exam.id,
        question_id: question.id,
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
          {t('reading.part1.deleTaskDescription')}
        </Text>
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.examTitle}>{exam.title}</Text>
      </View>

      {/* Programs */}
      <View style={styles.programsSection}>
        <Text style={styles.sectionTitle}>{t('reading.part1.programs')}</Text>
        {programKeys.map((key) => (
          <View key={key} style={styles.programItem}>
            <Text style={styles.programLetter}>{key.toUpperCase()}</Text>
            <Text style={styles.programText}>{exam.programs[key]}</Text>
          </View>
        ))}
      </View>

      {/* Questions */}
      <View style={styles.questionsSection}>
        <Text style={styles.sectionTitle}>
          {t('reading.part1.questions', { count: exam.questions.length })}
        </Text>
        {exam.questions.map((question) => (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionNumber}>
              {t('reading.part1.question')} {question.id}
            </Text>
            <Text style={styles.personaName}>{question.persona}</Text>
            <Text style={styles.statementText}>{question.statement}</Text>
            
            {/* Answer Selection */}
            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>{t('reading.part1.selectProgram')}</Text>
              <View style={styles.answerButtons}>
                {programKeys.map((key) => {
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
        style={[
          styles.submitButton,
          Object.keys(userAnswers).length < exam.questions.length && styles.submitButtonDisabled
        ]}
        disabled={Object.keys(userAnswers).length < exam.questions.length}
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
    marginBottom: spacing.margin.lg,
  },
  examTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  programsSection: {
    marginBottom: spacing.margin.xl,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
    textAlign: 'left',
  },
  programItem: {
    flexDirection: 'row',
    padding: spacing.padding.sm,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.margin.xs,
    borderRadius: spacing.borderRadius.sm,
    direction: 'ltr',
  },
  programLetter: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    width: 30,
  },
  programText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
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
  personaName: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  statementText: {
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

export default DeleReadingPart1UI;
