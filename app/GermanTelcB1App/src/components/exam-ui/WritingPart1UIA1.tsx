import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { spacing, typography, type ThemeColors } from '../../theme';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useAppTheme } from '../../contexts/ThemeContext';
import { UserAnswer } from '../../types/exam.types';
import WritingPart1ResultsModalA1 from './WritingPart1ResultsModalA1';

interface WritingPart1UIA1Props {
  exam: any;
  onComplete: (score: number, answers: UserAnswer[]) => void;
  isMockExam?: boolean;
}

const WritingPart1UIA1: React.FC<WritingPart1UIA1Props> = ({ exam, onComplete, isMockExam = false }) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResultsModal, setShowResultsModal] = useState(false);

  const handleInputChange = (fieldId: string, value: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const checkAnswer = (field: any): boolean => {
    const userValue = userAnswers[field.id]?.trim().toLowerCase() || '';

    if (!userValue) return false;

    if (field.validation) {
      const { correct_value, acceptable_values } = field.validation;
      const acceptableValues = acceptable_values || [correct_value];

      return acceptableValues.some((acceptableValue: string) =>
        acceptableValue.toLowerCase() === userValue
      );
    }

    // For composite fields
    if (field.type === 'composite_text' && field.parts) {
      const editablePart = field.parts.find((p: any) => p.is_editable);
      if (editablePart?.validation) {
        const { correct_value, acceptable_values } = editablePart.validation;
        const acceptableValues = acceptable_values || [correct_value];

        return acceptableValues.some((acceptableValue: string) =>
          acceptableValue.toLowerCase() === userValue
        );
      }
    }

    return false;
  };

  const handleSubmit = () => {
    if (!exam) return;
    if (!exam.form_fields) return;

    // Get all editable fields
    const editableFields = exam.form_fields.filter((field: any) =>
      field.is_editable ||
      (field.type === 'composite_text' && field.parts?.some((p: any) => p.is_editable))
    );

    // Check if all fields are answered
    const unansweredCount = editableFields.filter((field: any) => {
      const answer = userAnswers[field.id];
      return !answer || answer.trim() === '';
    }).length;

    if (unansweredCount > 0) {
      Alert.alert(
        t('exam.incomplete'),
        t('exam.incompleteMessage'),
        [{ text: 'OK' }]
      );
      return;
    }

    // Calculate score
    let correctCount = 0;
    editableFields.forEach((field: any) => {
      if (checkAnswer(field)) {
        correctCount++;
      }
    });

    const totalQuestions = editableFields.length;
    const calculatedScore = correctCount;

    setScore(calculatedScore);
    if (!isMockExam) {
      // If not a mock exam, show the results modal
      // In the mock exam, the results is shown at the end of the exam
      setShowResultsModal(true);

      // Don't set isSubmitted to true in mock exam to avoid highlighting the fields
      setIsSubmitted(true);
    }

    // Update progress
    const answers: UserAnswer[] = editableFields.map((field: any) => ({
      questionId: field.question_number || 0,
      answer: userAnswers[field.id] || '',
      correctAnswer: getCorrectAnswer(field),
      isCorrect: checkAnswer(field),
      timestamp: Date.now(),
      explanation: field.explanation || '',
      assessment: buildResults()
    }));

    onComplete(calculatedScore, answers);
  };

  const handleRetry = () => {
    setUserAnswers({});
    setIsSubmitted(false);
    setScore(0);
    setShowResultsModal(false);
  };

  const getCorrectAnswer = (field: any): string => {
    if (field.validation) {
      return field.validation.correct_value || '';
    }

    if (field.type === 'composite_text' && field.parts) {
      const editablePart = field.parts.find((p: any) => p.is_editable);
      if (editablePart?.validation) {
        return editablePart.validation.correct_value || '';
      }
    }

    return '';
  };

  const renderField = (field: any, index: number) => {
    const isEditable = field.is_editable;
    const userAnswer = userAnswers[field.id] || '';
    const isCorrect = isSubmitted && isEditable ? checkAnswer(field) : undefined;

    // Label/Info text
    if (field.type === 'label') {
      return (
        <View key={field.id} style={styles.labelField}>
          <Text style={[
            styles.labelText,
            field.style === 'caption' && styles.captionText
          ]}>
            {field.value}
          </Text>
        </View>
      );
    }

    // Composite text (e.g., PLZ + City)
    if (field.type === 'composite_text') {
      return (
        <View key={field.id} style={styles.formRow}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <View style={styles.compositeFieldContainer}>
            {field.parts.map((part: any, partIndex: number) => (
              <View
                key={partIndex}
                style={[
                  styles.compositeFieldPart,
                  { flex: part.width_weight || 1 }
                ]}
              >
                {part.is_editable ? (
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[
                        styles.textInput,
                        isSubmitted && (isCorrect ? styles.correctInput : styles.incorrectInput)
                      ]}
                      value={userAnswer}
                      onChangeText={(value) => handleInputChange(field.id, value)}
                      placeholder={part.placeholder || ''}
                      placeholderTextColor={colors.text.secondary}
                      editable={!isSubmitted}
                    />
                    {isSubmitted && (
                      <Icon
                        name={isCorrect ? 'check-circle' : 'times-circle'}
                        size={20}
                        color={isCorrect ? colors.success[500] : colors.error[500]}
                        style={styles.feedbackIcon}
                      />
                    )}
                    {field.question_number !== undefined && (
                      <View style={styles.questionNumber}>
                        <Text style={styles.questionNumberText}>{field.question_number}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={styles.staticText}>{part.value}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      );
    }

    // Single choice (radio buttons)
    if (field.type === 'single_choice') {
      return (
        <View key={field.id} style={styles.formRow}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <View style={styles.radioGroup}>
            {field.options.map((option: any) => {
              let isSelected

              if(option.isEditable){ 
                isSelected= userAnswer === option.value;
              } else {
                // We select it as it is not editable
                isSelected = option.value === field.validation.correct_value;
              }

              return (
                <TouchableOpacity
                  key={option.value}
                  style={styles.radioOption}
                  onPress={() => !isSubmitted && handleInputChange(field.id, option.value)}
                  disabled={isSubmitted || !option.isEditable}
                >
                  <View style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleSelected,
                    isSubmitted && isSelected && (isCorrect ? styles.correctRadio : styles.incorrectRadio),
                    !option.isEditable && styles.radioCircleDisabled
                  ]}>
                    {isSelected && <View style={[styles.radioInner, !option.isEditable && styles.radioInnerDisabled] } />}
                  </View>
                  <Text style={styles.radioLabel}>{option.label}</Text>
                  {isSubmitted && isSelected && (
                    <Icon
                      name={isCorrect ? 'check-circle' : 'times-circle'}
                      size={18}
                      color={isCorrect ? colors.success[500] : colors.error[500]}
                      style={{ marginLeft: spacing.margin.sm }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {field.question_number !== undefined && (
            <View style={styles.questionNumber}>
              <Text style={styles.questionNumberText}>{field.question_number}</Text>
            </View>
          )}
        </View>
      );
    }

    // Regular text/number field
    return (
      <View key={field.id} style={styles.formRow}>
        <Text style={styles.fieldLabel}>{field.label}</Text>
        {isEditable ? (
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.textInput,
                field.type === 'number' && styles.numberInput,
                isSubmitted && (isCorrect ? styles.correctInput : styles.incorrectInput)
              ]}
              value={userAnswer}
              onChangeText={(value) => handleInputChange(field.id, value)}
              placeholder=""
              placeholderTextColor={colors.text.secondary}
              keyboardType={field.type === 'number' ? 'numeric' : 'default'}
              editable={!isSubmitted}
            />
            {isSubmitted && (
              <Icon
                name={isCorrect ? 'check-circle' : 'times-circle'}
                size={20}
                color={isCorrect ? colors.success[500] : colors.error[500]}
                style={styles.feedbackIcon}
              />
            )}
            {field.question_number !== undefined && (
              <View style={styles.questionNumber}>
                <Text style={styles.questionNumberText}>{field.question_number}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.staticFieldValue}>
            <Text style={[
              styles.staticText,
              field.style === 'handwritten' && styles.handwrittenText
            ]}>
              {field.value}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const buildResults: () => { results: any; score: number; totalQuestions: number } | null = () => {
    if (!exam) return null;
    if (!exam.form_fields) return null;

    const editableFields = exam.form_fields.filter((field: any) =>
      field.is_editable ||
      (field.type === 'composite_text' && field.parts?.some((p: any) => p.is_editable))
    );
    const totalQuestions = editableFields.length;

    const results = editableFields.map((field: any, index: number) => {
      const isCorrect = checkAnswer(field);
      const userAnswer = userAnswers[field.id] || '';
      const correctAnswer = getCorrectAnswer(field);
      const questionNum = field.question_number !== undefined ? field.question_number : index + 1;

      return {
        questionNumber: questionNum,
        fieldLabel: field.label,
        userAnswer,
        correctAnswer,
        isCorrect,
      };
    });

    return {results, score, totalQuestions}; 
  }

  const renderResultsModal = () => {
    const resultData = buildResults();
    if(!resultData) return null;

    console.log('resultData', resultData);
    const { results, score, totalQuestions } = resultData;

    return (
      <WritingPart1ResultsModalA1 
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        onRetry={handleRetry}
        score={score}
        totalQuestions={totalQuestions}
        results={results}
      />
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Title */}
      <Text style={styles.examTitle}>{exam.title}</Text>

      {/* Scenario */}
      {/* A2 TODO: display "information" for A2 */}
      {exam.scenario_text && (
        <View style={styles.scenarioCard}>
          <Text style={styles.scenarioText}>{exam.scenario_text}</Text>
        </View>
      )}

      {/* Instruction */}
      {exam.instruction && (
        <View style={styles.instructionCard}>
          <Text style={styles.instructionText}>{exam.instruction}</Text>
        </View>
      )}

      {/* Form */}
      {exam.form_fields && <View style={styles.formCard}>
        {exam.form_fields.map((field: any, index: number) =>
          renderField(field, index)
        )}
      </View>}

      {/* Submit Button */}
      {!isSubmitted && (
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>{t('exam.submit')}</Text>
        </TouchableOpacity>
      )}

      {renderResultsModal()}
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
    paddingBottom: spacing.padding.xl * 2,
  },
  examTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    textAlign: 'center',
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.md,
  },
  scenarioCard: {
    backgroundColor: colors.primary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    direction: 'ltr',
  },
  scenarioText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
    textAlign: 'left',
  },
  instructionCard: {
    backgroundColor: colors.warning[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning[500],
    direction: 'ltr',
  },
  instructionText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'left',
  },
  formCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.dark,
    marginBottom: spacing.margin.lg,
    direction: 'ltr',
  },
  formRow: {
    marginBottom: spacing.margin.md,
    position: 'relative',
  },
  fieldLabel: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.margin.xs,
    textAlign: 'left',
  },
  labelField: {
    marginVertical: spacing.margin.sm,
  },
  labelText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    textAlign: 'left',
  },
  captionText: {
    ...typography.textStyles.bodySmall,
    fontStyle: 'italic',
    color: colors.text.secondary,
  },
  inputWrapper: {
    position: 'relative',
  },
  textInput: {
    ...typography.textStyles.body,
    lineHeight: 16,
    backgroundColor: colors.background.primary,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderRadius: spacing.borderRadius.sm,
    padding: spacing.padding.sm,
    paddingRight: spacing.padding.xl + 10,
    color: colors.text.primary,
    minHeight: 44,
    textAlign: 'left',
  },
  numberInput: {
    maxWidth: 100,
  },
  correctInput: {
    borderColor: colors.success[500],
    backgroundColor: colors.success[50],
  },
  incorrectInput: {
    borderColor: colors.error[500],
    backgroundColor: colors.error[50],
  },
  feedbackIcon: {
    position: 'absolute',
    right: spacing.padding.sm,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  questionNumber: {
    position: 'absolute',
    right: -30,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionNumberText: {
    ...typography.textStyles.bodySmall,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  staticFieldValue: {
    backgroundColor: colors.background.tertiary,
    padding: spacing.padding.sm,
    borderRadius: spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  staticText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    textAlign: 'left',
  },
  handwrittenText: {
    fontStyle: 'italic',
    fontWeight: typography.fontWeight.semibold,
  },
  compositeFieldContainer: {
    flexDirection: 'row',
    gap: spacing.margin.sm,
  },
  compositeFieldPart: {
    justifyContent: 'center',
  },
  radioGroup: {
    gap: spacing.margin.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.padding.xs,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.dark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.margin.sm,
  },
  radioCircleSelected: {
    borderColor: colors.primary[500],
  },
  correctRadio: {
    borderColor: colors.success[500],
    backgroundColor: colors.success[50],
  },
  incorrectRadio: {
    borderColor: colors.error[500],
    backgroundColor: colors.error[50],
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[500],
  },
  radioLabel: {
    ...typography.textStyles.body,
    color: colors.text.primary,
  },
  radioCircleDisabled: {
    borderColor: colors.border.dark,
  },
  radioInnerDisabled: {
    backgroundColor: colors.border.dark,
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    marginTop: spacing.margin.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonText: {
    ...typography.textStyles.h5,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
});

export default WritingPart1UIA1;

