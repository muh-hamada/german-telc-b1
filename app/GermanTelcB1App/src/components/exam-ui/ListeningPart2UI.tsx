import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Sound from 'react-native-sound';
import { colors, spacing, typography } from '../../theme';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { UserAnswer } from '../../types/exam.types';

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

interface ListeningPart2UIProps {
  exam: Exam;
  sectionDetails: any;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const ListeningPart2UI: React.FC<ListeningPart2UIProps> = ({ exam, sectionDetails, onComplete }) => {
  const { i18n, t } = useTranslation();
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
      const existing = prev.find(a => a.questionId === statementId);
      if (existing) {
        return prev.map(a =>
          a.questionId === statementId ? { ...a, answer: answer ? 'true' : 'false', isCorrect: answer, timestamp: Date.now() } : a
        );
      }
      return [...prev, { questionId: statementId, answer: answer ? 'true' : 'false', isCorrect: answer, timestamp: Date.now() }];
    });
    logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
      section: 'listening',
      part: 2,
      exam_id: exam.id,
      question_id: statementId,
    });
  };

  const getUserAnswer = (statementId: number): boolean | null => {
    const answer = userAnswers.find(a => a.questionId === statementId);
    return answer ? answer.answer === 'true' : null;
  };

  const handlePlayAudio = () => {
    Sound.setCategory('Playback');
    setHasStarted(true);
    setIsPlaying(true);
    const startTs = Date.now();
    logEvent(AnalyticsEvents.AUDIO_PLAY_PRESSED, { exam_id: exam.id });

    const audioSound = new Sound(
      exam.audio_url,
      '',
      (error: any) => {
        if (error) {
          console.error('Failed to load the sound', error);
          Alert.alert(
            t('listening.part2.audioError'),
            t('listening.part2.audioErrorMessage'),
            [{ text: 'OK' }]
          );
          setIsPlaying(false);
          return;
        }

        audioSound.play((success: boolean) => {
          if (success) {
            logEvent(AnalyticsEvents.AUDIO_COMPLETED, { exam_id: exam.id, duration_ms: Date.now() - startTs });
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
      s => !userAnswers.find(a => a.questionId === s.id && a.answer !== null)
    );

    if (unansweredStatements.length > 0) {
      Alert.alert(
        t('listening.part2.incomplete'),
        t('listening.part2.incompleteMessage', { count: unansweredStatements.length }),
        [{ text: 'OK' }]
      );
      return;
    }

    let correctCount = 0;
    const answers: UserAnswer[] = [];
    exam.statements.forEach(statement => {
      const userAnswer = userAnswers.find(a => a.questionId === statement.id);
      const isCorrect = userAnswer?.answer === 'true' === statement.is_correct;
      if (isCorrect) {
        correctCount++;
      }
      answers.push({
        questionId: statement.id,
        answer: userAnswer?.answer || '',
        isCorrect,
        timestamp: Date.now(),
      });
      logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
        section: 'listening',
        part: 2,
        exam_id: exam.id,
        question_id: statement.id,
        is_correct: isCorrect,
      });
    });

    const score = correctCount;
    onComplete(score, answers);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{sectionDetails.title}</Text>
        <View style={styles.metaInfo}>
          <Text style={styles.metaText}>
            ⏱️ {sectionDetails.duration_minutes} {t('listening.part2.minutes')}
          </Text>
          <Text style={styles.metaText}>
            📝 {exam.statements.length} {t('listening.part2.tasks')}
          </Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>{t('listening.part2.instructions')}</Text>
        <Text style={styles.instructionsText}>{getInstructions()}</Text>
      </View>

      {/* Audio Player */}
      <View style={styles.audioSection}>
        <View style={styles.examWarning}>
          <Text style={styles.examWarningText}>
            {t('listening.part2.examWarning')}
          </Text>
        </View>

        <View style={styles.audioPlayer}>
          <View style={styles.audioInfo}>
            <Text style={styles.audioTitle}>{t('listening.part2.audioFile')}</Text>
            <Text style={styles.audioStatus}>
              {!hasStarted ? t('listening.part2.readyToPlay') : isPlaying ? t('listening.part2.playing') : t('listening.part2.completed')}
            </Text>
          </View>
          
          {!hasStarted && (
            <TouchableOpacity style={styles.playButton} onPress={handlePlayAudio}>
              <Text style={styles.playButtonText}>{t('listening.part2.playAudio')}</Text>
            </TouchableOpacity>
          )}

          {isPlaying && (
            <View style={styles.playingIndicator}>
              <Text style={styles.playingText}>{t('listening.part2.audioPlaying')}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Statements Table */}
      <View style={styles.statementsSection}>
        <Text style={styles.sectionTitle}>{t('listening.part2.statements')}</Text>
        
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.tableCell, styles.statementCell]}>
              <Text style={styles.tableHeaderText}>{t('listening.part2.statement')}</Text>
            </View>
            <View style={[styles.tableCell, styles.answerCell]}>
              <Text style={styles.tableHeaderText}>{t('listening.part2.correct')}</Text>
            </View>
            <View style={[styles.tableCell, styles.answerCell]}>
              <Text style={styles.tableHeaderText}>{t('listening.part2.incorrect')}</Text>
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
          userAnswers.filter(a => a.answer !== null).length < exam.statements.length && styles.submitButtonDisabled
        ]}
        disabled={userAnswers.filter(a => a.answer !== null).length < exam.statements.length}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>
          {t('listening.part2.submitAnswers', { 
            answered: userAnswers.filter(a => a.answer !== null).length, 
            total: exam.statements.length 
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
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
  },
  metaText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    ...(I18nManager.isRTL ? { marginLeft: spacing.margin.md } : { marginRight: spacing.margin.md }),
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
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    backgroundColor: colors.primary[100],
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[500],
  },
  tableRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
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
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
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
    ...(I18nManager.isRTL ? { marginLeft: spacing.margin.xs } : { marginRight: spacing.margin.xs }),
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

export default ListeningPart2UI;

