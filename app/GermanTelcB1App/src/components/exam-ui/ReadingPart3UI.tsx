import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../../theme';
import { ReadingPart3Exam, UserAnswer } from '../../types/exam.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';

interface ReadingPart3UIProps {
  exam: ReadingPart3Exam;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const ReadingPart3UI: React.FC<ReadingPart3UIProps> = ({ exam, onComplete }) => {
  const { t } = useCustomTranslation();
  const [userAnswers, setUserAnswers] = useState<{ [situationId: number]: string }>({});

  const renderMarkdownText = (text: string, style: any) => {
    // Split text by newlines to preserve line breaks
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Parse markdown for bold (**text**)
      const parts: Array<{ text: string; bold: boolean }> = [];
      let currentPos = 0;
      const boldRegex = /\*\*(.+?)\*\*/g;
      let match;
      
      while ((match = boldRegex.exec(line)) !== null) {
        // Add text before the match
        if (match.index > currentPos) {
          parts.push({ text: line.slice(currentPos, match.index), bold: false });
        }
        // Add the bold text
        parts.push({ text: match[1], bold: true });
        currentPos = match.index + match[0].length;
      }
      
      // Add remaining text
      if (currentPos < line.length) {
        parts.push({ text: line.slice(currentPos), bold: false });
      }
      
      // If no markdown was found, just add the line as is
      if (parts.length === 0) {
        parts.push({ text: line, bold: false });
      }
      
      return (
        <Text key={lineIndex} style={style}>
          {parts.map((part, partIndex) => (
            <Text 
              key={partIndex} 
              style={part.bold ? styles.boldText : undefined}
            >
              {part.text}
            </Text>
          ))}
          {lineIndex < lines.length - 1 && '\n'}
        </Text>
      );
    });
  };

  const handleAnswerSelect = (situationId: number, adKey: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [situationId]: adKey,
    }));
    logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
      section: 'reading',
      part: 3,
      exam_id: exam.id,
      question_id: situationId,
    });
  };

  const handleSubmit = () => {
    const unansweredSituations = exam.situations.filter(
      s => !userAnswers[s.id]
    );

    if (unansweredSituations.length > 0) {
      Alert.alert(
        t('reading.part3.incomplete'),
        t('reading.part3.incompleteMessage', { count: unansweredSituations.length }),
        [{ text: 'OK' }]
      );
      return;
    }

    let correctCount = 0;
    const answers: UserAnswer[] = [];
    exam.situations.forEach(situation => {
      const userAnswer = userAnswers[situation.id];
      const correctAnswer = situation.answer;
      const isCorrect = userAnswer?.toLowerCase() === correctAnswer.toLowerCase();
      if (isCorrect) {
        correctCount++;
      }
      answers.push({
        questionId: situation.id,
        answer: userAnswer,
        isCorrect,
        timestamp: Date.now(),
        correctAnswer: correctAnswer,
      });
      logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
        section: 'reading',
        part: 3,
        exam_id: exam.id,
        question_id: situation.id,
        is_correct: !!isCorrect,
      });
    });

    const score = correctCount;
    onComplete(score, answers);
  };

  const adKeys = Object.keys(exam.advertisements).sort();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>{t('reading.part3.taskTitle')}</Text>
        <Text style={styles.instructionsText}>
          {t('reading.part3.taskDescription')}
        </Text>
      </View>

      {/* Advertisements */}
      <View style={styles.adsSection}>
        <Text style={styles.sectionTitle}>{t('reading.part3.advertisements')}</Text>
        {adKeys.map((key) => (
          <View key={key} style={styles.adItem}>
            <Text style={styles.adLetter}>{key.toUpperCase()}</Text>
            <View style={styles.adTextContainer}>
              {renderMarkdownText(exam.advertisements[key], styles.adText)}
            </View>
          </View>
        ))}
      </View>

      {/* Situations */}
      <View style={styles.situationsSection}>
        <Text style={styles.sectionTitle}>{t('reading.part3.situations')}</Text>
        {exam.situations.map((situation) => (
          <View key={situation.id} style={styles.situationCard}>
            <Text style={styles.situationNumber}>{situation.id}.</Text>
            <View style={styles.situationTextContainer}>
              {renderMarkdownText(situation.text, styles.situationText)}
            </View>
            
            {/* Answer Selection */}
            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>{t('reading.part3.selectAdvertisement')}</Text>
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
          {t('reading.part3.submitAnswers', { 
            answered: Object.keys(userAnswers).length, 
            total: exam.situations.length 
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
    flexDirection: 'row',
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
  adTextContainer: {
    flex: 1,
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
  situationTextContainer: {
    marginBottom: spacing.margin.md,
  },
  boldText: {
    fontWeight: typography.fontWeight.bold,
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

export default ReadingPart3UI;

