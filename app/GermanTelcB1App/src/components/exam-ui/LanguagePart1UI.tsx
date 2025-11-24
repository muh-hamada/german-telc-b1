import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';

import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../../theme';
import { GrammarPart1Exam, UserAnswer } from '../../types/exam.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';

interface LanguagePart1UIProps {
  exam: GrammarPart1Exam;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const LanguagePart1UI: React.FC<LanguagePart1UIProps> = ({ exam, onComplete }) => {
  const { t } = useCustomTranslation();
  const [userAnswers, setUserAnswers] = useState<{ [questionId: number]: number }>({});
  const [showModal, setShowModal] = useState(false);
  const [selectedGap, setSelectedGap] = useState<number | null>(null);

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex,
    }));
    setShowModal(false);
    setSelectedGap(null);
    logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
      section: 'grammar',
      part: 1,
      exam_id: exam.id,
      question_id: questionId,
    });
  };

  const getSelectedAnswerText = (gapId: number): string => {
    const answerIndex = userAnswers[gapId];
    if (answerIndex === undefined) return t('grammar.part1.select');
    const question = exam.questions.find(q => q.id === gapId);
    return question?.answers[answerIndex]?.text || t('grammar.part1.select');
  };

  const renderTextWithGaps = () => {
    const parts = exam.text.split(/(\[\d{2}\])/g);
    
    return (
      <View style={styles.textContainer}>
        <Text style={styles.textContent}>
          {parts.map((part, index) => {
            const gapMatch = part.match(/\[(\d{2})\]/);
            if (gapMatch) {
              const gapId = parseInt(gapMatch[1]);
              return (
                <Text
                  key={index}
                  style={styles.gapButton}
                  onPress={() => {
                    setSelectedGap(gapId);
                    setShowModal(true);
                  }}
                >
                  {getSelectedAnswerText(gapId)}
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
    const answers: UserAnswer[] = [];
    exam.questions.forEach(question => {
      const userAnswerIndex = userAnswers[question.id];
      const correctAnswerIndex = question.answers.findIndex(a => a.correct === true);
      const isCorrect = userAnswerIndex === correctAnswerIndex;
      if (isCorrect) {
        correctCount++;
      }
      answers.push({
        questionId: question.id,
        answer: question.answers[userAnswerIndex]?.text || '',
        isCorrect,
        timestamp: Date.now(),
        correctAnswer: correctAnswerIndex !== -1 ? question.answers[correctAnswerIndex]?.text : undefined,
      });
      logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
        section: 'grammar',
        part: 1,
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

      {/* Answer Selection Modal */}
      <Modal
        visible={showModal && selectedGap !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowModal(false);
          setSelectedGap(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedGap !== null && t('grammar.part1.selectAnswer', { gap: selectedGap })}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowModal(false);
                  setSelectedGap(null);
                }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {selectedGap !== null && exam.questions.find(q => q.id === selectedGap)?.answers.map((answer, index) => {
                const isSelected = userAnswers[selectedGap] === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.answerOption,
                      isSelected && styles.answerOptionSelected
                    ]}
                    onPress={() => handleAnswerSelect(selectedGap, index)}
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
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
    textAlign: 'left',
  },
  instructionsText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
    textAlign: 'left',
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
  gapButton: {
    ...typography.textStyles.bodySmall,
    backgroundColor: colors.primary[100],
    color: colors.primary[700],
    fontWeight: typography.fontWeight.medium,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.padding.lg,
  },
  modalContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: spacing.borderRadius.lg,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  modalContent: {
    maxHeight: 400,
    padding: spacing.padding.md,
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.padding.sm,
    paddingHorizontal: spacing.padding.md,
    marginBottom: spacing.margin.xs,
    borderRadius: spacing.borderRadius.sm,
    backgroundColor: colors.background.secondary,
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
  checkmark: {
    ...typography.textStyles.body,
    color: colors.success[500],
    fontWeight: typography.fontWeight.bold,
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

