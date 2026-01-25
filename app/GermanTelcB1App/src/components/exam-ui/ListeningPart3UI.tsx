import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import Sound from 'react-native-nitro-sound';
import { spacing, typography, type ThemeColors } from '../../theme';
import { useAppTheme } from '../../contexts/ThemeContext';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { UserAnswer } from '../../types/exam.types';
import AudioDuration from '../AudioDuration';
import offlineService from '../../services/offline.service';

interface Statement {
  id: number;
  statement: string;
  is_correct: boolean;
  explanation?: Record<string, string>;
  audio_transcript?: string;
}

interface Exam {
  id: string;
  audio_url: string;
  statements: Statement[];
}

interface ListeningPart3UIProps {
  exam: Exam;
  sectionDetails: any;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const ListeningPart3UI: React.FC<ListeningPart3UIProps> = ({ exam, sectionDetails, onComplete }) => {
  const { i18n, t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    return () => {
      Sound.stopPlayer();
      Sound.removePlayBackListener();
    };
  }, []);

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
      part: 3,
      exam_id: exam.id,
      question_id: statementId,
    });
  };

  const getUserAnswer = (statementId: number): boolean | null => {
    const answer = userAnswers.find(a => a.questionId === statementId);
    return answer ? answer.answer === 'true' : null;
  };

  const handlePlayAudio = async () => {
    setHasStarted(true);
    setIsPlaying(true);
    const startTs = Date.now();
    logEvent(AnalyticsEvents.AUDIO_PLAY_PRESSED, { exam_id: exam.id });

    try {
      // Use offline file if available
      const audioPath = await offlineService.getLocalAudioPath(exam.audio_url);
      console.log('[ListeningPart3] Playing audio from:', audioPath);

      // Add playback listener for progress tracking
      Sound.addPlayBackListener((e: any) => {
        if (e.currentPosition !== undefined && e.duration !== undefined) {
          setCurrentTime(e.currentPosition / 1000);
          setDuration(e.duration / 1000);
        }
      });

      // Add listener for playback completion
      Sound.addPlaybackEndListener(() => {
        console.log('Audio playback completed');
        setIsPlaying(false);
        logEvent(AnalyticsEvents.AUDIO_COMPLETED, { exam_id: exam.id, duration_ms: Date.now() - startTs });
      });

      // Start playback
      await Sound.startPlayer(audioPath);

    } catch (error) {
      console.error('Failed to load the sound', error);
      Alert.alert(
        t('listening.part3.audioError'),
        t('listening.part3.audioErrorMessage'),
        [{ text: 'OK' }]
      );
      setIsPlaying(false);
    }
  };

  const handleSubmit = () => {
    const unansweredStatements = exam.statements.filter(
      s => !userAnswers.find(a => a.questionId === s.id && a.answer !== null)
    );

    if (unansweredStatements.length > 0) {
      Alert.alert(
        t('listening.part3.incomplete'),
        t('listening.part3.incompleteMessage', { count: unansweredStatements.length }),
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
        correctAnswer: statement.is_correct ? 'true' : 'false',
        explanation: statement.explanation,
        transcript: statement.audio_transcript,
      });
      logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
        section: 'listening',
        part: 3,
        exam_id: exam.id,
        question_id: statement.id,
        is_correct: isCorrect,
      });
    });

    const score = correctCount;
    onComplete(Math.round(score), answers);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{sectionDetails.title}</Text>
        <View style={styles.metaInfo}>
          <Text style={styles.metaText}>
            ⏱️ {sectionDetails.duration_minutes} {t('listening.part3.minutes')}
          </Text>
          <Text style={styles.metaText}>
            📝 {exam.statements.length} {t('listening.part3.tasks')}
          </Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>{t('listening.part3.instructions')}</Text>
        <Text style={styles.instructionsText}>{getInstructions()}</Text>
      </View>

      {/* Audio Player */}
      <View style={styles.audioSection}>
        <View style={styles.examWarning}>
          <Text style={styles.examWarningText}>
            {t('listening.part3.examWarning')}
          </Text>
        </View>

        <View style={styles.audioPlayer}>
          <View style={styles.audioInfo}>
            <View>
              <Text style={styles.audioTitle}>{t('listening.part2.audioFile')}</Text>
              <Text style={styles.audioStatus}>
                {!hasStarted ? t('listening.part2.readyToPlay') : isPlaying ? t('listening.part2.playing') : t('listening.part2.completed')}
              </Text>
            </View>
            <View>
              <Text style={styles.audioTime}>
                {hasStarted && <AudioDuration currentTime={currentTime} duration={duration} />}
              </Text>
            </View>
          </View>
          
          {!hasStarted && (
            <TouchableOpacity style={styles.playButton} onPress={handlePlayAudio}>
              <Text style={styles.playButtonText}>{t('listening.part3.playAudio')}</Text>
            </TouchableOpacity>
          )}

          {isPlaying && (
            <View style={styles.playingIndicator}>
              <Text style={styles.playingText}>{t('listening.part3.audioPlaying')}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Statements Table */}
      <View style={styles.statementsSection}>
        <Text style={styles.sectionTitle}>{t('listening.part3.statements')}</Text>
        
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.tableCell, styles.statementCell]}>
              <Text style={styles.tableHeaderText}>{t('listening.part3.statement')}</Text>
            </View>
            <View style={[styles.tableCell, styles.answerCell]}>
              <Text style={styles.tableHeaderText}>{t('listening.part3.correct')}</Text>
            </View>
            <View style={[styles.tableCell, styles.answerCell]}>
              <Text style={styles.tableHeaderText}>{t('listening.part3.incorrect')}</Text>
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
          {t('listening.part3.submitAnswers', { 
            answered: userAnswers.filter(a => a.answer !== null).length, 
            total: exam.statements.length 
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  audioTime: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
  audioCurrentTime: {
    ...typography.textStyles.bodySmall,
    color: colors.primary[600],
  },
  audioDuration: {
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
    direction: 'ltr',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.secondary,
    direction: 'ltr',
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

export default ListeningPart3UI;

