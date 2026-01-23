import React, { useState, useMemo } from 'react';
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
import { spacing, typography, type ThemeColors } from '../../theme';
import { useAppTheme } from '../../contexts/ThemeContext';
import { DeleGrammarPart1Exam, UserAnswer } from '../../types/exam.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';

interface DeleGrammarPart1UIProps {
  exam: DeleGrammarPart1Exam;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const DeleGrammarPart1UI: React.FC<DeleGrammarPart1UIProps> = ({ exam, onComplete }) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [userAnswers, setUserAnswers] = useState<{ [gapId: string]: string }>({});
  const [showModal, setShowModal] = useState(false);
  const [selectedGap, setSelectedGap] = useState<string | null>(null);

  const fragmentKeys = useMemo(() => Object.keys(exam.fragments).sort((a, b) => a.localeCompare(b)), [exam.fragments]);
  const gapIds = useMemo(() => Object.keys(exam.answers).sort((a, b) => a.localeCompare(b)), [exam.answers]);

  const handleAnswerSelect = (gapId: string, fragmentKey: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [gapId]: fragmentKey,
    }));
    setShowModal(false);
    setSelectedGap(null);
    logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
      section: 'dele-grammar',
      part: 1,
      exam_id: exam.id,
      question_id: gapId,
    });
  };

  const getSelectedFragmentText = (gapId: string): string => {
    const fragmentKey = userAnswers[gapId];
    if (!fragmentKey) return t('grammar.part1.select');
    return fragmentKey.toUpperCase();
  };

  const renderTextWithGaps = () => {
    const parts = exam.text.split(/(\[\d{2}\])/g);
    const gapRegex = /\[(\d{2})\]/;
    
    return (
      <View style={styles.textContainer}>
        <Text style={styles.textContent}>
          {parts.map((part, index) => {
            const gapMatch = gapRegex.exec(part);
            if (gapMatch) {
              const gapId = gapMatch[1];
              return (
                <Text
                  key={`gap-${gapId}`}
                  style={styles.gapButton}
                  onPress={() => {
                    setSelectedGap(gapId);
                    setShowModal(true);
                  }}
                >
                  {getSelectedFragmentText(gapId)}
                </Text>
              );
            }
            return <Text key={`text-part-${part.slice(0, 10)}-${index}`}>{part}</Text>;
          })}
        </Text>
      </View>
    );
  };

  const handleSubmit = () => {
    const unansweredGaps = gapIds.filter(
      gapId => !userAnswers[gapId]
    );

    if (unansweredGaps.length > 0) {
      Alert.alert(
        t('grammar.part1.incomplete'),
        t('grammar.part1.incompleteMessage', { count: unansweredGaps.length }),
        [{ text: 'OK' }]
      );
      return;
    }

    let correctCount = 0;
    const answers: UserAnswer[] = [];
    gapIds.forEach(gapId => {
      const userAnswer = userAnswers[gapId];
      const correctAnswer = exam.answers[gapId];
      const isCorrect = userAnswer?.toLowerCase() === correctAnswer?.toLowerCase();
      if (isCorrect) {
        correctCount++;
      }
      answers.push({
        questionId: Number.parseInt(gapId, 10),
        answer: userAnswer || '',
        isCorrect,
        timestamp: Date.now(),
        correctAnswer: correctAnswer,
        explanation: exam.explanation?.[gapId],
      });
      logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
        section: 'dele-grammar',
        part: 1,
        exam_id: exam.id,
        question_id: gapId,
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
          {t('grammar.part1.deleTaskDescription')}
        </Text>
      </View>

      {/* Fragments */}
      <View style={styles.fragmentsSection}>
        <Text style={styles.sectionTitle}>{t('grammar.part1.fragments')}</Text>
        {fragmentKeys.map((key) => (
          <View key={key} style={styles.fragmentItem}>
            <Text style={styles.fragmentLetter}>{key.toUpperCase()}</Text>
            <Text style={styles.fragmentText}>{exam.fragments[key]}</Text>
          </View>
        ))}
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {t('grammar.part1.selectFragment')} [{selectedGap}]
            </Text>
            <ScrollView style={styles.modalScrollView}>
              {fragmentKeys.map((key) => {
                const isSelected = selectedGap && userAnswers[selectedGap] === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.modalOption,
                      isSelected && styles.modalOptionSelected
                    ]}
                    onPress={() => selectedGap && handleAnswerSelect(selectedGap, key)}
                  >
                    <Text style={styles.modalOptionLetter}>{key.toUpperCase()}</Text>
                    <Text style={[
                      styles.modalOptionText,
                      isSelected && styles.modalOptionTextSelected
                    ]}>
                      {exam.fragments[key]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowModal(false);
                setSelectedGap(null);
              }}
            >
              <Text style={styles.modalCloseButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          Object.keys(userAnswers).length < gapIds.length && styles.submitButtonDisabled
        ]}
        disabled={Object.keys(userAnswers).length < gapIds.length}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>
          {t('grammar.part1.submitAnswers', { 
            answered: Object.keys(userAnswers).length, 
            total: gapIds.length 
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
  fragmentsSection: {
    marginBottom: spacing.margin.xl,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
    textAlign: 'left',
  },
  fragmentItem: {
    flexDirection: 'row',
    padding: spacing.padding.sm,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.margin.xs,
    borderRadius: spacing.borderRadius.sm,
    direction: 'ltr',
  },
  fragmentLetter: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    width: 30,
  },
  fragmentText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 22,
  },
  textSection: {
    marginBottom: spacing.margin.lg,
  },
  textContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textContent: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 26,
    direction: 'ltr',
  },
  gapButton: {
    ...typography.textStyles.body,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.padding.xs,
    paddingVertical: 2,
    borderRadius: spacing.borderRadius.sm,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.padding.lg,
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: spacing.borderRadius.lg,
    width: '100%',
    maxHeight: '80%',
    padding: spacing.padding.lg,
  },
  modalTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.md,
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    padding: spacing.padding.md,
    backgroundColor: colors.secondary[50],
    marginBottom: spacing.margin.xs,
    borderRadius: spacing.borderRadius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modalOptionSelected: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[500],
  },
  modalOptionLetter: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    width: 30,
  },
  modalOptionText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  modalOptionTextSelected: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
  },
  modalCloseButton: {
    backgroundColor: colors.secondary[400],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.margin.md,
  },
  modalCloseButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
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

export default DeleGrammarPart1UI;
