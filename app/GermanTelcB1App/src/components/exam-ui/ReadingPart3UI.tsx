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
import { ReadingPart3Exam } from '../../types/exam.types';

interface ReadingPart3UIProps {
  exam: ReadingPart3Exam;
  onComplete: (score: number) => void;
}

const ReadingPart3UI: React.FC<ReadingPart3UIProps> = ({ exam, onComplete }) => {
  const [userAnswers, setUserAnswers] = useState<{ [situationId: number]: string }>({});

  const handleAnswerSelect = (situationId: number, adKey: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [situationId]: adKey,
    }));
  };

  const handleSubmit = () => {
    const unansweredSituations = exam.situations.filter(
      s => !userAnswers[s.id]
    );

    if (unansweredSituations.length > 0) {
      Alert.alert(
        'Incomplete',
        `Please answer all situations before submitting. ${unansweredSituations.length} situation(s) remaining.`,
        [{ text: 'OK' }]
      );
      return;
    }

    let correctCount = 0;
    exam.situations.forEach(situation => {
      const userAnswer = userAnswers[situation.id];
      const isCorrect = userAnswer?.toLowerCase() === situation.answer.toLowerCase();
      if (isCorrect) {
        correctCount++;
      }
    });

    const score = (correctCount / exam.situations.length) * 25;
    onComplete(Math.round(score));
  };

  const adKeys = Object.keys(exam.advertisements).sort();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>Aufgabenstellung:</Text>
        <Text style={styles.instructionsText}>
          Lesen Sie die Anzeigen und die Situationen. Welche Anzeige passt zu welcher Situation? Es gibt nicht für jede Situation eine passende Anzeige.
        </Text>
      </View>

      {/* Advertisements */}
      <View style={styles.adsSection}>
        <Text style={styles.sectionTitle}>Anzeigen:</Text>
        {adKeys.map((key) => (
          <View key={key} style={styles.adItem}>
            <Text style={styles.adLetter}>{key.toUpperCase()}</Text>
            <Text style={styles.adText}>{exam.advertisements[key]}</Text>
          </View>
        ))}
      </View>

      {/* Situations */}
      <View style={styles.situationsSection}>
        <Text style={styles.sectionTitle}>Situationen:</Text>
        {exam.situations.map((situation) => (
          <View key={situation.id} style={styles.situationCard}>
            <Text style={styles.situationNumber}>{situation.id}.</Text>
            <Text style={styles.situationText}>{situation.text}</Text>
            
            {/* Answer Selection */}
            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>Anzeige wählen:</Text>
              <View style={styles.answerButtons}>
                {adKeys.map((key) => {
                  const isSelected = userAnswers[situation.id] === key;
                  
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.answerButton,
                        isSelected && styles.answerButtonSelected
                      ]}
                      onPress={() => handleAnswerSelect(situation.id, key)}
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
          Object.keys(userAnswers).length < exam.situations.length && styles.submitButtonDisabled
        ]}
        disabled={Object.keys(userAnswers).length < exam.situations.length}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>
          Antworten einreichen ({Object.keys(userAnswers).length}/{exam.situations.length})
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
  adsSection: {
    marginBottom: spacing.margin.xl,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
  },
  adItem: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    padding: spacing.padding.sm,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.margin.xs,
    borderRadius: spacing.borderRadius.sm,
  },
  adLetter: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    width: 30,
  },
  adText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 18,
  },
  situationsSection: {
    marginBottom: spacing.margin.lg,
  },
  situationCard: {
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
  situationNumber: {
    ...typography.textStyles.h4,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.sm,
  },
  situationText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: spacing.margin.md,
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
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
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

export default ReadingPart3UI;

