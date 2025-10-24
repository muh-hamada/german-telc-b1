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
import { ReadingPart1Exam } from '../../types/exam.types';

interface ReadingPart1UIProps {
  exam: ReadingPart1Exam;
  onComplete: (score: number) => void;
}

const ReadingPart1UI: React.FC<ReadingPart1UIProps> = ({ exam, onComplete }) => {
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});

  const handleAnswerSelect = (textId: number, headingIndex: number) => {
    const letter = String.fromCharCode(97 + headingIndex);
    setUserAnswers(prev => ({ ...prev, [textId]: letter }));
  };

  const handleSubmit = () => {
    if (Object.keys(userAnswers).length < exam.texts.length) {
      Alert.alert(
        'Unvollständig',
        'Bitte ordnen Sie allen Texten eine Überschrift zu, bevor Sie fortfahren.',
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
        'Duplicate Answers',
        'You have used the same heading for multiple texts. Please check your answers.',
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

    const score = (correctCount / exam.texts.length) * 25;
    onComplete(Math.round(score));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>Aufgabenstellung:</Text>
        <Text style={styles.instructionsText}>
          Lesen Sie die folgenden fünf Texte und ordnen Sie jedem Text eine passende 
          Überschrift zu. Es gibt mehr Überschriften als Texte. Jede Überschrift kann 
          nur einmal verwendet werden.
        </Text>
      </View>

      {/* Headings */}
      <View style={styles.headingsSection}>
        <Text style={styles.sectionTitle}>Überschriften (a-j):</Text>
        {exam.headings.map((heading, index) => (
          <View key={index} style={styles.headingItem}>
            <Text style={styles.headingLetter}>{String.fromCharCode(97 + index)}</Text>
            <Text style={styles.headingText}>{heading}</Text>
          </View>
        ))}
      </View>

      {/* Texts */}
      <View style={styles.textsSection}>
        <Text style={styles.sectionTitle}>Texte (1-{exam.texts.length}):</Text>
        {exam.texts.map((text) => (
          <View key={text.id} style={styles.textCard}>
            <Text style={styles.textNumber}>Text {text.id}</Text>
            <Text style={styles.textContent}>{text.text}</Text>
            
            {/* Answer Selection */}
            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>Überschrift wählen:</Text>
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
        style={[
          styles.submitButton,
          Object.keys(userAnswers).length < exam.texts.length && styles.submitButtonDisabled
        ]}
        disabled={Object.keys(userAnswers).length < exam.texts.length}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>
          Antworten einreichen ({Object.keys(userAnswers).length}/{exam.texts.length})
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
  headingsSection: {
    marginBottom: spacing.margin.xl,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
  },
  headingItem: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    padding: spacing.padding.sm,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.margin.xs,
    borderRadius: spacing.borderRadius.sm,
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

export default ReadingPart1UI;

