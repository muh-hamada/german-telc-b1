import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Sound from 'react-native-sound';
import { colors, spacing, typography } from '../../theme';

interface Statement {
  id: number;
  statement: string;
  is_correct: boolean;
}

interface Exam {
  id: number;
  audio_url: string;
  statements: Statement[];
}

interface ListeningPart1UIProps {
  exam: Exam;
  sectionDetails: any;
  onComplete: (score: number) => void;
}

interface UserAnswer {
  statementId: number;
  selectedAnswer: boolean | null;
}

const ListeningPart1UI: React.FC<ListeningPart1UIProps> = ({ exam, sectionDetails, onComplete }) => {
  const { i18n } = useTranslation();
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [sound, setSound] = useState<Sound | null>(null);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.release();
      }
    };
  }, [sound]);

  const getInstructions = () => {
    const lang = i18n.language;
    switch (lang) {
      case 'de':
        return sectionDetails.instructions_de;
      case 'ar':
        return sectionDetails.instructions_ar;
      case 'ru':
        return sectionDetails.instructions_ru;
      case 'fr':
        return sectionDetails.instructions_fr;
      case 'es':
        return sectionDetails.instructions_es;
      default:
        return sectionDetails.instructions_en;
    }
  };

  const handleAnswerSelect = (statementId: number, answer: boolean) => {
    setUserAnswers(prev => {
      const existing = prev.find(a => a.statementId === statementId);
      if (existing) {
        return prev.map(a =>
          a.statementId === statementId ? { ...a, selectedAnswer: answer } : a
        );
      }
      return [...prev, { statementId, selectedAnswer: answer }];
    });
  };

  const getUserAnswer = (statementId: number): boolean | null => {
    const answer = userAnswers.find(a => a.statementId === statementId);
    return answer ? answer.selectedAnswer : null;
  };

  const handlePlayAudio = () => {
    Sound.setCategory('Playback');
    setHasStarted(true);
    setIsPlaying(true);

    const audioSound = new Sound(
      exam.audio_url,
      '',
      (error: any) => {
        if (error) {
          console.error('Failed to load the sound', error);
          Alert.alert(
            'Audio Fehler',
            'Die Audiodatei konnte nicht geladen werden.',
            [{ text: 'OK' }]
          );
          setIsPlaying(false);
          return;
        }

        audioSound.play((success: boolean) => {
          if (success) {
            console.log('Audio playback finished successfully');
          } else {
            console.log('Audio playback failed');
          }
          setIsPlaying(false);
          audioSound.release();
        });

        setSound(audioSound);
      }
    );
  };

  const handleSubmit = () => {
    const unansweredStatements = exam.statements.filter(
      s => !userAnswers.find(a => a.statementId === s.id && a.selectedAnswer !== null)
    );

    if (unansweredStatements.length > 0) {
      Alert.alert(
        'Incomplete',
        `Please answer all statements before submitting. ${unansweredStatements.length} statement(s) remaining.`,
        [{ text: 'OK' }]
      );
      return;
    }

    let correctCount = 0;
    exam.statements.forEach(statement => {
      const userAnswer = userAnswers.find(a => a.statementId === statement.id);
      if (userAnswer && userAnswer.selectedAnswer === statement.is_correct) {
        correctCount++;
      }
    });

    const score = (correctCount / exam.statements.length) * 25;
    onComplete(Math.round(score));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{sectionDetails.title}</Text>
        <View style={styles.metaInfo}>
          <Text style={styles.metaText}>
            ⏱️ {sectionDetails.duration_minutes} Minuten
          </Text>
          <Text style={styles.metaText}>
            📝 {exam.statements.length} Aufgaben
          </Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>Anweisungen:</Text>
        <Text style={styles.instructionsText}>{getInstructions()}</Text>
      </View>

      {/* Audio Player */}
      <View style={styles.audioSection}>
        <View style={styles.examWarning}>
          <Text style={styles.examWarningText}>
            ⚠️ Hinweis: Im echten Examen können Sie die Audiodatei nicht pausieren oder stoppen. 
            Sie hören jeden Text nur einmal.
          </Text>
        </View>

        <View style={styles.audioPlayer}>
          <View style={styles.audioInfo}>
            <Text style={styles.audioTitle}>🎧 Audio-Datei</Text>
            <Text style={styles.audioStatus}>
              {!hasStarted ? 'Bereit zum Abspielen' : isPlaying ? '▶️ Wird abgespielt...' : '✓ Abgeschlossen'}
            </Text>
          </View>
          
          {!hasStarted && (
            <TouchableOpacity style={styles.playButton} onPress={handlePlayAudio}>
              <Text style={styles.playButtonText}>▶️ Audio abspielen</Text>
            </TouchableOpacity>
          )}

          {isPlaying && (
            <View style={styles.playingIndicator}>
              <Text style={styles.playingText}>Audio läuft... (kann nicht gestoppt werden)</Text>
            </View>
          )}
        </View>
      </View>

      {/* Statements Table */}
      <View style={styles.statementsSection}>
        <Text style={styles.sectionTitle}>Aussagen (Statements):</Text>
        
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.tableCell, styles.statementCell]}>
              <Text style={styles.tableHeaderText}>Aussage</Text>
            </View>
            <View style={[styles.tableCell, styles.answerCell]}>
              <Text style={styles.tableHeaderText}>Richtig</Text>
            </View>
            <View style={[styles.tableCell, styles.answerCell]}>
              <Text style={styles.tableHeaderText}>Falsch</Text>
            </View>
          </View>

          {/* Table Rows */}
          {exam.statements.map((statement) => {
            const userAnswer = getUserAnswer(statement.id);
            return (
              <View key={statement.id} style={styles.tableRow}>
                <View style={[styles.tableCell, styles.statementCell]}>
                  <Text style={styles.statementNumber}>{statement.id}.</Text>
                  <Text style={styles.statementText}>{statement.statement}</Text>
                </View>
                <View style={[styles.tableCell, styles.answerCell]}>
                  <TouchableOpacity
                    style={[
                      styles.radioButton,
                      userAnswer === true && styles.radioButtonSelected
                    ]}
                    onPress={() => handleAnswerSelect(statement.id, true)}
                  >
                    {userAnswer === true && <View style={styles.radioButtonInner} />}
                  </TouchableOpacity>
                </View>
                <View style={[styles.tableCell, styles.answerCell]}>
                  <TouchableOpacity
                    style={[
                      styles.radioButton,
                      userAnswer === false && styles.radioButtonSelected
                    ]}
                    onPress={() => handleAnswerSelect(statement.id, false)}
                  >
                    {userAnswer === false && <View style={styles.radioButtonInner} />}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          userAnswers.filter(a => a.selectedAnswer !== null).length < exam.statements.length && styles.submitButtonDisabled
        ]}
        disabled={userAnswers.filter(a => a.selectedAnswer !== null).length < exam.statements.length}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>
          Antworten einreichen ({userAnswers.filter(a => a.selectedAnswer !== null).length}/{exam.statements.length})
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
  header: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.lg,
    marginBottom: spacing.margin.lg,
  },
  headerTitle: {
    ...typography.textStyles.h3,
    color: colors.primary[600],
    marginBottom: spacing.margin.sm,
  },
  metaInfo: {
    flexDirection: 'row',
  },
  metaText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    marginRight: spacing.margin.md,
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
  audioSection: {
    marginBottom: spacing.margin.xl,
  },
  examWarning: {
    backgroundColor: colors.error[50],
    borderColor: colors.error[500],
    borderWidth: 1,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.padding.md,
    marginBottom: spacing.margin.md,
  },
  examWarningText: {
    ...typography.textStyles.bodySmall,
    color: colors.error[700],
    lineHeight: 20,
  },
  audioPlayer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  audioInfo: {
    marginBottom: spacing.margin.md,
  },
  audioTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  audioStatus: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
  playButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
  },
  playButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.secondary,
  },
  playingIndicator: {
    padding: spacing.padding.md,
    backgroundColor: colors.primary[50],
    borderRadius: spacing.borderRadius.sm,
    alignItems: 'center',
  },
  playingText: {
    ...typography.textStyles.body,
    color: colors.primary[700],
  },
  statementsSection: {
    marginBottom: spacing.margin.lg,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: spacing.borderRadius.md,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary[100],
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[500],
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.secondary,
  },
  tableCell: {
    padding: spacing.padding.sm,
    justifyContent: 'center',
  },
  statementCell: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  answerCell: {
    flex: 1,
    alignItems: 'center',
  },
  tableHeaderText: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
    textAlign: 'center',
  },
  statementNumber: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    marginRight: spacing.margin.xs,
    minWidth: 30,
  },
  statementText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 20,
  },
  radioButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.secondary[400],
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary[500],
  },
  radioButtonInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary[500],
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

export default ListeningPart1UI;

