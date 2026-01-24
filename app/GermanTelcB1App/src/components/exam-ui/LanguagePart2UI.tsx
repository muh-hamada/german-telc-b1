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
import { GrammarPart2Exam, UserAnswer } from '../../types/exam.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import MultiChoiceSelectionModal from './MultiChoiceSelectionModal';

interface LanguagePart2UIProps {
  exam: GrammarPart2Exam;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const LanguagePart2UI: React.FC<LanguagePart2UIProps> = ({ exam, onComplete }) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [userAnswers, setUserAnswers] = useState<{ [gapId: number]: string }>({});
  const [showWordBank, setShowWordBank] = useState(false);
  const [selectedGap, setSelectedGap] = useState<number | null>(null);

  const handleSelectWord = (gapId: number, wordKey: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [gapId]: wordKey,
    }));
    setSelectedGap(null);
    setShowWordBank(false);
    logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
      section: 'grammar',
      part: 2,
      exam_id: exam.id,
      question_id: gapId,
    });
  };

  const getSelectedWordText = (gapId: number): string => {
    const selectedKey = userAnswers[gapId];
    if (!selectedKey) return t('grammar.part2.select');
    const wordItem = exam.words.find(w => w.key === selectedKey);
    return wordItem ? wordItem.word : selectedKey;
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
                    setShowWordBank(true);
                  }}
                >
                  {getSelectedWordText(gapId)}
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
    const gapIds = Object.keys(exam.answers).map(Number);
    const unansweredGaps = gapIds.filter(id => !userAnswers[id]);

    if (unansweredGaps.length > 0) {
      Alert.alert(
        t('grammar.part2.incomplete'),
        t('grammar.part2.incompleteMessage', { count: unansweredGaps.length }),
        [{ text: 'OK' }]
      );
      return;
    }

    let correctCount = 0;
    const answers: UserAnswer[] = [];
    gapIds.forEach(gapId => {
      const userAnswer = userAnswers[gapId] || '';
      const correctAnswer = exam.answers[gapId.toString()];
      const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
      if (isCorrect) {
        correctCount++;
      }
      answers.push({
        questionId: gapId,
        answer: userAnswer,
        isCorrect,
        timestamp: Date.now(),
        correctAnswer: correctAnswer + ': ' + exam.words.find(w => w.key === correctAnswer)?.word,
        explanation: exam.explanation?.[gapId.toString()],
      });
      logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
        section: 'grammar',
        part: 2,
        exam_id: exam.id,
        question_id: gapId,
        is_correct: isCorrect,
      });
    });

    const score = correctCount;
    onComplete(score, answers);
  };

  const gapIds = Object.keys(exam.answers).map(Number);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>{t('grammar.part2.taskTitle')}</Text>
        <Text style={styles.instructionsText}>
          {t('grammar.part2.taskDescription')}
        </Text>
      </View>

      {/* Word Bank */}
      <View style={styles.wordBankSection}>
        <Text style={styles.sectionTitle}>{t('grammar.part2.wordBank')}</Text>
        <View style={styles.wordBankGrid}>
          {exam.words.map((word) => (
            <View key={word.key} style={styles.wordItem}>
              <Text style={styles.wordKey}>{word.key}:</Text>
              <Text style={styles.wordText}>{word.word}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Text with gaps */}
      <View style={styles.textSection}>
        <Text style={styles.sectionTitle}>{exam.title}</Text>
        {renderTextWithGaps()}
      </View>

      {/* Word Selection Modal */}
      <MultiChoiceSelectionModal
        visible={showWordBank}
        selectedGap={selectedGap}
        options={exam.words.map((word) => ({
          key: word.key,
          text: word.word,
          label: `${word.key}:`,
          isSelected: selectedGap !== null && userAnswers[selectedGap] === word.key,
        }))}
        onSelect={(key) => selectedGap !== null && handleSelectWord(selectedGap, key as string)}
        onClose={() => {
          setShowWordBank(false);
          setSelectedGap(null);
        }}
        modalTitle={selectedGap !== null ? t('grammar.part2.selectWord', { gap: selectedGap }) : ''}
      />

      {/* Submit Button */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>
          {t('grammar.part2.submitAnswers', {
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
  wordBankSection: {
    marginBottom: spacing.margin.xl,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
    textAlign: 'left',
  },
  wordBankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.sm,
    borderRadius: spacing.borderRadius.md,
    direction: 'ltr',
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.padding.xs,
    margin: spacing.margin.xs,
    backgroundColor: colors.primary[50],
    borderRadius: spacing.borderRadius.sm,
  },
  wordKey: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    marginRight: 4,
  },
  wordText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
  },
  textSection: {
    marginBottom: spacing.margin.lg,
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
    direction: 'ltr',
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

export default LanguagePart2UI;

