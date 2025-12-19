import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { spacing, typography, type ThemeColors } from '../../theme';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useAppTheme } from '../../contexts/ThemeContext';
import { UserAnswer } from '../../types/exam.types';
import SupportAdButton from '../SupportAdButton';

interface WritingPart1UIA1Props {
  exam: any;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const WritingPart1UIA1: React.FC<WritingPart1UIA1Props> = ({ exam, onComplete }) => {
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
      (field.type === 'composite_text' && field.parts?.some((p: any) => p.is_editable)) ||
      field.type === 'single_choice'
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
    setIsSubmitted(true);
    setShowResultsModal(true);

    // Update progress
    const answers: UserAnswer[] = editableFields.map((field: any) => ({
      questionId: field.question_number || 0,
      userAnswer: userAnswers[field.id] || '',
      correctAnswer: getCorrectAnswer(field),
      isCorrect: checkAnswer(field),
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
    const isEditable = field.is_editable || field.type === 'single_choice';
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
              const isSelected = userAnswer === option.value;
              const isCorrectOption = option.value === field.validation.correct_value;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={styles.radioOption}
                  onPress={() => !isSubmitted && handleInputChange(field.id, option.value)}
                  disabled={isSubmitted}
                >
                  <View style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleSelected,
                    isSubmitted && isSelected && (isCorrect ? styles.correctRadio : styles.incorrectRadio)
                  ]}>
                    {isSelected && <View style={styles.radioInner} />}
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

  const renderResultsModal = () => {
    if (!exam) return null;
    if (!exam.form_fields) return null;

    const editableFields = exam.form_fields.filter((field: any) =>
      field.is_editable ||
      (field.type === 'composite_text' && field.parts?.some((p: any) => p.is_editable)) ||
      field.type === 'single_choice'
    );
    const totalQuestions = editableFields.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    return (
      <Modal
        visible={showResultsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResultsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.modalContent}>
              {/* Header with Score */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTop}>
                  <Icon
                    name={percentage >= 60 ? 'check-circle' : 'times-circle'}
                    size={36}
                    color={percentage >= 60 ? colors.success[500] : colors.error[500]}
                  />
                  <View style={styles.modalHeaderTextContainer}>
                    <Text style={styles.modalTitle}>
                      {percentage >= 60 ? t('exam.congratulations') : t('exam.keepPracticing')}
                    </Text>
                    <View style={styles.scoreRow}>
                      <Text style={styles.scoreText}>
                        {score}/{totalQuestions}
                      </Text>
                      <Text style={styles.percentageText}>{percentage}%</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Detailed Results */}
              <View style={styles.detailedResultsContainer}>
                <Text style={styles.detailedResultsTitle}>
                  {t('exam.detailedResults')}
                </Text>
                {editableFields.map((field: any, index: number) => {
                  const isCorrect = checkAnswer(field);
                  const userAnswer = userAnswers[field.id] || '';
                  const correctAnswer = getCorrectAnswer(field);
                  const questionNum = field.question_number !== undefined ? field.question_number : index + 1;

                  return (
                    <View key={field.id} style={styles.resultItem}>
                      <View style={styles.resultItemHeader}>
                        <View style={[
                          styles.resultQuestionNumber,
                          isCorrect ? styles.resultQuestionNumberCorrect : styles.resultQuestionNumberIncorrect
                        ]}>
                          <Text style={styles.resultQuestionNumberText}>{questionNum}</Text>
                        </View>
                        <Text style={styles.resultFieldLabel} numberOfLines={1}>
                          {field.label}
                        </Text>
                        <Icon
                          name={isCorrect ? 'check-circle' : 'times-circle'}
                          size={18}
                          color={isCorrect ? colors.success[500] : colors.error[500]}
                        />
                      </View>

                      <View style={styles.resultAnswersContainer}>
                        <Text style={styles.resultAnswerInline}>
                          <Text style={styles.resultAnswerLabel}>{t('exam.yourAnswer')}: </Text>
                          <Text style={[
                            styles.resultAnswerValue,
                            !isCorrect && styles.resultAnswerTextIncorrect
                          ]}>
                            {userAnswer || t('exam.noAnswer')}
                          </Text>
                        </Text>

                        {!isCorrect && (
                          <Text style={styles.resultAnswerInline}>
                            <Text style={styles.resultAnswerLabel}>{t('exam.correctAnswer')}: </Text>
                            <Text style={[styles.resultAnswerValue, styles.resultAnswerTextCorrect]}>
                              {correctAnswer}
                            </Text>
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Support Ad Button */}
              <SupportAdButton
                screen="WritingPart1Results"
                style={styles.supportAdButton}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.retryButton]}
                  onPress={handleRetry}
                >
                  <Icon name="refresh" size={16} color={colors.white} />
                  <Text style={styles.modalButtonText}>{t('exam.retry')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.closeButton]}
                  onPress={() => setShowResultsModal(false)}
                >
                  <Text style={styles.modalButtonText}>{t('common.close')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Title */}
      <Text style={styles.examTitle}>{exam.title}</Text>

      {/* Scenario */}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.padding.lg,
  },
  modalScrollView: {
    width: '100%',
    maxHeight: '90%',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.padding.md,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginVertical: spacing.margin.lg,
  },
  modalHeader: {
    marginBottom: spacing.margin.md,
    paddingBottom: spacing.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalHeaderTextContainer: {
    flex: 1,
    marginLeft: spacing.margin.md,
  },
  modalTitle: {
    ...typography.textStyles.h5,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
    textAlign: 'left',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.margin.sm,
  },
  scoreText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold,
  },
  percentageText: {
    ...typography.textStyles.h5,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.bold,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.margin.sm,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.padding.sm,
    paddingHorizontal: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    gap: spacing.margin.xs,
  },
  retryButton: {
    backgroundColor: colors.primary[500],
  },
  closeButton: {
    backgroundColor: colors.text.secondary,
  },
  modalButtonText: {
    ...typography.textStyles.bodySmall,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  detailedResultsContainer: {
    marginBottom: spacing.margin.sm,
    width: '100%',
  },
  detailedResultsTitle: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.sm,
    textAlign: 'left',
  },
  resultItem: {
    backgroundColor: colors.background.primary,
    padding: spacing.padding.sm,
    borderRadius: spacing.borderRadius.sm,
    marginBottom: spacing.margin.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  resultItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.margin.xs,
    gap: spacing.margin.xs,
  },
  resultQuestionNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultQuestionNumberCorrect: {
    backgroundColor: colors.success[500],
  },
  resultQuestionNumberIncorrect: {
    backgroundColor: colors.error[500],
  },
  resultQuestionNumberText: {
    ...typography.textStyles.bodySmall,
    fontSize: 11,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  resultFieldLabel: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
    textAlign: 'left',
  },
  resultAnswersContainer: {
    gap: spacing.margin.xs,
  },
  resultAnswerInline: {
    ...typography.textStyles.bodySmall,
    textAlign: 'left',
  },
  resultAnswerLabel: {
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold,
  },
  resultAnswerValue: {
    color: colors.text.primary,
  },
  resultAnswerTextCorrect: {
    color: colors.success[600],
    fontWeight: typography.fontWeight.semibold,
  },
  resultAnswerTextIncorrect: {
    color: colors.error[600],
    textDecorationLine: 'line-through',
  },
  supportAdButton: {
    marginBottom: spacing.margin.md,
  },
});

export default WritingPart1UIA1;

