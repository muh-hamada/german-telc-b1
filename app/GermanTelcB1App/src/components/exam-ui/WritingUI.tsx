import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  I18nManager,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { WritingExam } from '../../types/exam.types';
import {
  evaluateWriting,
  getMockAssessment,
  isOpenAIConfigured,
} from '../../services/openai.service';

interface WritingAssessment {
  overallScore: number;
  maxScore: number;
  criteria: {
    taskCompletion: {
      grade: 'A' | 'B' | 'C' | 'D';
      feedback: string;
    };
    communicativeDesign: {
      grade: 'A' | 'B' | 'C' | 'D';
      feedback: string;
    };
    formalCorrectness: {
      grade: 'A' | 'B' | 'C' | 'D';
      feedback: string;
    };
  };
  improvementTip: string;
}

interface WritingUIProps {
  exam: WritingExam;
  onComplete: (score: number) => void;
}

const WritingUI: React.FC<WritingUIProps> = ({ exam, onComplete }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [assessment, setAssessment] = useState<WritingAssessment | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [lastEvaluatedAnswer, setLastEvaluatedAnswer] = useState('');

  const handleAnswerChange = (text: string) => {
    setUserAnswer(text);
    if (showWarning && text.trim().length >= 50) {
      setShowWarning(false);
    }
  };

  const handleEvaluate = async () => {
    if (userAnswer.trim().length < 50) {
      setShowWarning(true);
      return;
    }
    setShowWarning(false);

    // Check if answer hasn't changed since last evaluation
    if (userAnswer === lastEvaluatedAnswer && assessment) {
      console.log('Answer unchanged, using cached assessment');
      setIsResultsModalOpen(true);
      return;
    }

    setIsEvaluating(true);

    try {
      let result: WritingAssessment;

      if (isOpenAIConfigured()) {
        result = await evaluateWriting({
          userAnswer: userAnswer,
          incomingEmail: exam.incomingEmail,
          writingPoints: exam.writingPoints,
          examTitle: exam.title,
        });
      } else {
        console.log('OpenAI API key not configured. Using mock assessment.');
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
        result = getMockAssessment();
      }

      setLastEvaluatedAnswer(userAnswer);
      setAssessment(result);
      setIsResultsModalOpen(true);
    } catch (error) {
      console.error('Evaluation error:', error);
      Alert.alert(
        'Fehler bei der Bewertung',
        error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten.',
        [
          {
            text: 'Mock-Daten verwenden',
            onPress: () => {
              const mockResult = getMockAssessment();
              setLastEvaluatedAnswer(userAnswer);
              setAssessment(mockResult);
              setIsResultsModalOpen(true);
            },
          },
          { text: 'Abbrechen', style: 'cancel' },
        ]
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSubmit = () => {
    if (!assessment) {
      Alert.alert(
        'Keine Bewertung',
        'Bitte evaluieren Sie Ihre Antwort, bevor Sie fortfahren.',
        [{ text: 'OK' }]
      );
      return;
    }

    onComplete(assessment.overallScore);
  };

  const getGradeStyle = (grade: 'A' | 'B' | 'C' | 'D') => {
    switch (grade) {
      case 'A':
        return styles.criterionGreen;
      case 'B':
        return styles.criterionYellow;
      case 'C':
      case 'D':
        return styles.criterionRed;
      default:
        return styles.criterionYellow;
    }
  };

  const renderResultsModal = () => {
    if (!assessment) return null;

    const isUsingMock = !isOpenAIConfigured();
    const isUsingCache = userAnswer === lastEvaluatedAnswer && assessment !== null;

    return (
      <Modal
        visible={isResultsModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsResultsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.resultsModalContent]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.resultsTitle}>
                Ihre Bewertung (Schriftlicher Ausdruck)
              </Text>

              {isUsingMock && (
                <View style={styles.mockWarning}>
                  <Text style={styles.mockWarningText}>
                    ⚠️ Mock-Daten: API-Schlüssel nicht konfiguriert
                  </Text>
                </View>
              )}

              {isUsingCache && (
                <View style={styles.cacheInfo}>
                  <Text style={styles.cacheInfoText}>
                    ℹ️ Gecachtes Ergebnis (Antwort unverändert)
                  </Text>
                </View>
              )}

              <View style={styles.scoreSection}>
                <Text style={styles.scoreLabel}>Gesamtpunktzahl:</Text>
                <Text style={styles.scoreValue}>
                  {assessment.overallScore} / {assessment.maxScore}
                </Text>
              </View>

              <View style={styles.criteriaSection}>
                <Text style={styles.criteriaTitle}>Bewertungskriterien:</Text>

                <View style={[styles.criterionCard, getGradeStyle(assessment.criteria.taskCompletion.grade)]}>
                  <View style={styles.criterionHeader}>
                    <Text style={styles.criterionName}>1. Aufgabenerfüllung</Text>
                    <Text style={styles.criterionGrade}>Note: {assessment.criteria.taskCompletion.grade}</Text>
                  </View>
                  <Text style={styles.criterionFeedback}>{assessment.criteria.taskCompletion.feedback}</Text>
                </View>

                <View style={[styles.criterionCard, getGradeStyle(assessment.criteria.communicativeDesign.grade)]}>
                  <View style={styles.criterionHeader}>
                    <Text style={styles.criterionName}>2. Kommunikative Gestaltung</Text>
                    <Text style={styles.criterionGrade}>Note: {assessment.criteria.communicativeDesign.grade}</Text>
                  </View>
                  <Text style={styles.criterionFeedback}>{assessment.criteria.communicativeDesign.feedback}</Text>
                </View>

                <View style={[styles.criterionCard, getGradeStyle(assessment.criteria.formalCorrectness.grade)]}>
                  <View style={styles.criterionHeader}>
                    <Text style={styles.criterionName}>3. Formale Korrektheit</Text>
                    <Text style={styles.criterionGrade}>Note: {assessment.criteria.formalCorrectness.grade}</Text>
                  </View>
                  <Text style={styles.criterionFeedback}>{assessment.criteria.formalCorrectness.feedback}</Text>
                </View>
              </View>

              <View style={styles.improvementSection}>
                <Text style={styles.improvementTitle}>💡 Verbesserungstipp:</Text>
                <Text style={styles.improvementText}>{assessment.improvementTip}</Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setIsResultsModalOpen(false)}
            >
              <Text style={styles.closeModalButtonText}>Schließen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>Aufgabenstellung:</Text>
        <Text style={styles.instructionsText}>
          Lesen Sie die eingehende E-Mail und beantworten Sie diese. Berücksichtigen Sie dabei die angegebenen Schreibpunkte.
        </Text>
      </View>

      {/* Incoming Email */}
      <View style={styles.emailSection}>
        <Text style={styles.sectionTitle}>Eingehende E-Mail:</Text>
        <View style={styles.emailCard}>
          <Text style={styles.emailText}>{exam.incomingEmail}</Text>
        </View>
      </View>

      {/* Writing Points */}
      <View style={styles.pointsSection}>
        <Text style={styles.sectionTitle}>Schreibpunkte:</Text>
        {exam.writingPoints.map((point, index) => (
          <View key={index} style={styles.pointItem}>
            <Text style={styles.pointBullet}>•</Text>
            <Text style={styles.pointText}>{point}</Text>
          </View>
        ))}
      </View>

      {/* Answer Input */}
      <View style={styles.answerSection}>
        <Text style={styles.sectionTitle}>Ihre Antwort:</Text>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="Schreiben Sie hier Ihre E-Mail..."
          value={userAnswer}
          onChangeText={handleAnswerChange}
          textAlignVertical="top"
        />
        {showWarning && (
          <Text style={styles.warningText}>
            ⚠️ Bitte schreiben Sie mindestens 50 Zeichen.
          </Text>
        )}
        <Text style={styles.characterCount}>
          {userAnswer.length} Zeichen
        </Text>
      </View>

      {/* Evaluate Button */}
      <TouchableOpacity
        style={[styles.evaluateButton, isEvaluating && styles.evaluateButtonDisabled]}
        onPress={handleEvaluate}
        disabled={isEvaluating}
      >
        {isEvaluating ? (
          <ActivityIndicator color={colors.background.secondary} />
        ) : (
          <Text style={styles.evaluateButtonText}>Antwort bewerten</Text>
        )}
      </TouchableOpacity>

      {/* Submit Button (only visible after evaluation) */}
      {assessment && (
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Weiter zum nächsten Teil</Text>
        </TouchableOpacity>
      )}

      {renderResultsModal()}
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
  emailSection: {
    marginBottom: spacing.margin.xl,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
  },
  emailCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  emailText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
  },
  pointsSection: {
    marginBottom: spacing.margin.xl,
  },
  pointItem: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    marginBottom: spacing.margin.sm,
    paddingLeft: spacing.padding.sm,
  },
  pointBullet: {
    ...typography.textStyles.body,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
    marginRight: spacing.margin.sm,
  },
  pointText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 22,
  },
  answerSection: {
    marginBottom: spacing.margin.lg,
  },
  textInput: {
    ...typography.textStyles.body,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.padding.md,
    minHeight: 200,
    borderWidth: 1,
    borderColor: colors.border.light,
    color: colors.text.primary,
  },
  warningText: {
    ...typography.textStyles.bodySmall,
    color: colors.error[600],
    marginTop: spacing.margin.sm,
  },
  characterCount: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.margin.xs,
    textAlign: 'right',
  },
  evaluateButton: {
    backgroundColor: colors.secondary[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.margin.md,
  },
  evaluateButtonDisabled: {
    opacity: 0.6,
  },
  evaluateButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.secondary,
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
  },
  submitButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.secondary,
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
    padding: spacing.padding.lg,
    maxHeight: '80%',
    width: '92%',
  },
  resultsModalContent: {
    maxHeight: '90%',
  },
  resultsTitle: {
    ...typography.textStyles.h3,
    color: colors.primary[600],
    textAlign: 'center',
    marginBottom: spacing.margin.lg,
  },
  mockWarning: {
    backgroundColor: colors.warning[50],
    padding: spacing.padding.sm,
    borderRadius: spacing.borderRadius.sm,
    marginBottom: spacing.margin.md,
    borderWidth: 1,
    borderColor: colors.warning[500],
  },
  mockWarningText: {
    ...typography.textStyles.bodySmall,
    color: colors.warning[700],
    textAlign: 'center',
  },
  cacheInfo: {
    backgroundColor: colors.primary[50],
    padding: spacing.padding.sm,
    borderRadius: spacing.borderRadius.sm,
    marginBottom: spacing.margin.md,
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  cacheInfoText: {
    ...typography.textStyles.bodySmall,
    color: colors.primary[700],
    textAlign: 'center',
  },
  scoreSection: {
    backgroundColor: colors.primary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.lg,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
  },
  scoreValue: {
    ...typography.textStyles.h2,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },
  criteriaSection: {
    marginBottom: spacing.margin.lg,
  },
  criteriaTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
  },
  criterionCard: {
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    borderLeftWidth: 4,
  },
  criterionGreen: {
    backgroundColor: colors.success[50],
    borderLeftColor: colors.success[500],
  },
  criterionYellow: {
    backgroundColor: colors.warning[50],
    borderLeftColor: colors.warning[500],
  },
  criterionRed: {
    backgroundColor: colors.error[50],
    borderLeftColor: colors.error[500],
  },
  criterionHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.margin.sm,
  },
  criterionName: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  criterionGrade: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  criterionFeedback: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  improvementSection: {
    backgroundColor: colors.secondary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
  },
  improvementTitle: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  improvementText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  closeModalButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.margin.md,
  },
  closeModalButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.secondary,
  },
});

export default WritingUI;

