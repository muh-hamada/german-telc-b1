import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Sound from 'react-native-sound';
import { colors, spacing, typography } from '../../theme';
import listeningPart2Data from '../../data/listening-part2.json';

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

interface UserAnswer {
  statementId: number;
  selectedAnswer: boolean | null;
}

const ListeningPart2Screen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [sound, setSound] = useState<Sound | null>(null);

  const sectionDetails = (listeningPart2Data as any).section_details;
  const exams = (listeningPart2Data as any).exams as Exam[];
  const currentExam = exams[0];

  // Cleanup sound on unmount
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
      currentExam.audio_url,
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
          }
          setIsPlaying(false);
          audioSound.release();
        });

        setSound(audioSound);
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{sectionDetails.title}</Text>
          <View style={styles.metaInfo}>
            <Text style={styles.metaText}>
              ⏱️ {sectionDetails.duration_minutes} Minuten
            </Text>
            <Text style={styles.metaText}>
              📝 {currentExam.statements.length} Aufgaben
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Anweisungen:</Text>
          <Text style={styles.instructionsText}>{getInstructions()}</Text>
        </View>

        {/* Audio Player Section */}
        <View style={styles.audioSection}>
          <View style={styles.examWarning}>
            <Text style={styles.examWarningText}>
              ⚠️ Hinweis: Im echten Examen können Sie die Audiodatei nicht pausieren oder stoppen. 
              Sie hören jeden Text nur einmal. Das Audio enthält das Gespräch zweimal und eine Vorbereitungszeit.
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
            {currentExam.statements.map((statement) => {
              const userAnswer = getUserAnswer(statement.id);
              
              return (
                <View key={statement.id} style={styles.tableRow}>
                  <View style={[styles.tableCell, styles.statementCell]}>
                    <Text style={styles.statementNumber}>{statement.id}.</Text>
                    <Text style={styles.statementText}>{statement.statement}</Text>
                  </View>
                  
                  <View style={[styles.tableCell, styles.answerCell]}>
                    <TouchableOpacity
                      style={styles.radioButton}
                      onPress={() => handleAnswerSelect(statement.id, true)}
                    >
                      <View style={[
                        styles.radioOuter,
                        userAnswer === true && styles.radioOuterSelected
                      ]}>
                        {userAnswer === true && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={[styles.tableCell, styles.answerCell]}>
                    <TouchableOpacity
                      style={styles.radioButton}
                      onPress={() => handleAnswerSelect(statement.id, false)}
                    >
                      <View style={[
                        styles.radioOuter,
                        userAnswer === false && styles.radioOuterSelected
                      ]}>
                        {userAnswer === false && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              userAnswers.length < currentExam.statements.length && styles.submitButtonDisabled
            ]}
            disabled={userAnswers.length < currentExam.statements.length}
          >
            <Text style={styles.submitButtonText}>
              Antworten überprüfen ({userAnswers.length}/{currentExam.statements.length})
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.padding.lg,
  },
  header: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.lg,
    marginBottom: spacing.margin.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    ...typography.textStyles.h4,
    color: colors.primary[600],
    marginBottom: spacing.margin.md,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: spacing.margin.md,
    flexWrap: 'wrap',
  },
  metaText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
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
    padding: spacing.padding.sm,
    borderRadius: spacing.borderRadius.sm,
    marginBottom: spacing.margin.md,
    borderWidth: 1,
    borderColor: colors.error[500],
  },
  examWarningText: {
    ...typography.textStyles.bodySmall,
    color: colors.error[700],
    textAlign: 'center',
    lineHeight: 20,
  },
  audioPlayer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  audioInfo: {
    marginBottom: spacing.margin.md,
  },
  audioTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  audioStatus: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  playButton: {
    backgroundColor: colors.success[500],
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
  playButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.secondary,
  },
  playingIndicator: {
    backgroundColor: colors.primary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
  },
  playingText: {
    ...typography.textStyles.body,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
  },
  statementsSection: {
    marginBottom: spacing.margin.xl,
  },
  sectionTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
  },
  table: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.secondary[200],
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.sm,
  },
  tableHeaderText: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.secondary,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
    minHeight: 60,
  },
  tableCell: {
    padding: spacing.padding.sm,
    justifyContent: 'center',
  },
  statementCell: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: spacing.padding.md,
  },
  answerCell: {
    flex: 1,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.secondary[200],
  },
  statementNumber: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    marginRight: spacing.margin.xs,
  },
  statementText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 20,
  },
  radioButton: {
    padding: spacing.padding.xs,
  },
  radioOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.secondary[400],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  radioOuterSelected: {
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  radioInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary[500],
  },
  submitSection: {
    marginTop: spacing.margin.lg,
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

export default ListeningPart2Screen;
