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

interface Question {
  id: number;
  question: string;
  answer: string;
  explanation?: Record<string, string>;
}

interface Exam {
  id: string;
  title: string;
  audio_url: string;
  audio_transcription: string;
  options: Record<string, string>;
  questions: Question[];
}

interface ListeningPart3A2UIProps {
  exam: Exam;
  sectionDetails: any;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const ListeningPart3A2UI: React.FC<ListeningPart3A2UIProps> = ({ exam, sectionDetails, onComplete }) => {
  const { i18n, t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const optionKeys = useMemo(() => {
    return Object.keys(exam.options).sort((a, b) => a.localeCompare(b));
  }, [exam.options]);

  useEffect(() => {
    return () => {
      Sound.stopPlayer();
      Sound.removePlayBackListener();
    };
  }, []);

  const getInstructions = () => {
    const lang = i18n.language;
    switch (lang) {
      case 'de': return sectionDetails.instructions_de;
      case 'ar': return sectionDetails.instructions_ar;
      case 'ru': return sectionDetails.instructions_ru;
      case 'fr': return sectionDetails.instructions_fr;
      case 'es': return sectionDetails.instructions_es;
      default: return sectionDetails.instructions_en;
    }
  };

  const handleAnswerSelect = (questionId: number, optionKey: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: optionKey }));
    logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
      section: 'listening',
      part: 3,
      exam_id: exam.id,
      question_id: questionId,
    });
  };

  const handlePlayAudio = async () => {
    setHasStarted(true);
    setIsPlaying(true);
    const startTs = Date.now();
    logEvent(AnalyticsEvents.AUDIO_PLAY_PRESSED, { exam_id: exam.id });

    try {
      const audioPath = await offlineService.getLocalAudioPath(exam.audio_url);
      console.log('[ListeningPart3A2] Playing audio from:', audioPath);

      Sound.addPlayBackListener((e: any) => {
        if (e.currentPosition !== undefined && e.duration !== undefined) {
          setCurrentTime(e.currentPosition / 1000);
          setDuration(e.duration / 1000);
        }
      });

      Sound.addPlaybackEndListener(() => {
        console.log('Audio playback completed');
        setIsPlaying(false);
        logEvent(AnalyticsEvents.AUDIO_COMPLETED, { exam_id: exam.id, duration_ms: Date.now() - startTs });
      });

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
    const unansweredCount = exam.questions.length - Object.keys(userAnswers).length;
    if (unansweredCount > 0) {
      Alert.alert(
        t('listening.part3.a2.incomplete'),
        t('listening.part3.a2.incompleteMessage', { count: unansweredCount }),
        [{ text: 'OK' }]
      );
      return;
    }

    let correctCount = 0;
    const answers: UserAnswer[] = [];

    exam.questions.forEach(question => {
      const userAnswer = userAnswers[question.id];
      const isCorrect = userAnswer === question.answer;

      if (isCorrect) {
        correctCount++;
      }

      answers.push({
        questionId: question.id,
        answer: userAnswer || '',
        isCorrect,
        timestamp: Date.now(),
        correctAnswer: question.answer,
        explanation: question.explanation,
        transcript: exam.audio_transcription,
      });

      logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
        section: 'listening',
        part: 3,
        exam_id: exam.id,
        question_id: question.id,
        is_correct: isCorrect,
      });
    });

    onComplete(correctCount, answers);
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
            📝 {exam.questions.length} {t('listening.part3.tasks')}
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
              <Text style={styles.audioTitle}>{t('listening.part3.audioFile')}</Text>
              <Text style={styles.audioStatus}>
                {!hasStarted ? t('listening.part3.readyToPlay') : isPlaying ? t('listening.part3.playing') : t('listening.part3.completed')}
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

      {/* Available Options */}
      <View style={styles.optionsOverview}>
        <Text style={styles.sectionTitle}>{t('listening.part3.a2.locations')}</Text>
        {optionKeys.map(key => (
          <View key={key} style={styles.optionRow}>
            <Text style={styles.optionKey}>{key})</Text>
            <Text style={styles.optionValue}>{exam.options[key]}</Text>
          </View>
        ))}
      </View>

      {/* Questions */}
      <View style={styles.questionsSection}>
        <Text style={styles.sectionTitle}>{t('listening.part3.a2.matchPeople')}</Text>

        {exam.questions.map((question) => (
          <View key={question.id} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionNumber}>{question.id}.</Text>
              <Text style={styles.questionText}>{question.question}</Text>
            </View>

            <View style={styles.answerGrid}>
              {optionKeys.map((key) => {
                const isSelected = userAnswers[question.id] === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.answerChip,
                      isSelected && styles.answerChipSelected
                    ]}
                    onPress={() => handleAnswerSelect(question.id, key)}
                  >
                    <Text style={[
                      styles.answerChipText,
                      isSelected && styles.answerChipTextSelected
                    ]}>
                      {key}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>
          {t('listening.part3.submitAnswers', {
            answered: Object.keys(userAnswers).length,
            total: exam.questions.length
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
  optionsOverview: {
    marginBottom: spacing.margin.xl,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
    textAlign: 'left',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.padding.xs,
    direction: 'ltr',
  },
  optionKey: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    minWidth: 28,
  },
  optionValue: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  questionsSection: {
    marginBottom: spacing.margin.lg,
  },
  questionCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    direction: 'ltr',
  },
  questionHeader: {
    flexDirection: 'row',
    marginBottom: spacing.margin.md,
    gap: spacing.margin.sm,
  },
  questionNumber: {
    ...typography.textStyles.h4,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  questionText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
    flex: 1,
    fontWeight: typography.fontWeight.semibold,
  },
  answerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.margin.sm,
  },
  answerChip: {
    paddingVertical: spacing.padding.sm,
    paddingHorizontal: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    backgroundColor: colors.secondary[100],
    borderWidth: 2,
    borderColor: colors.secondary[300],
    minWidth: 48,
    alignItems: 'center',
  },
  answerChipSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[600],
  },
  answerChipText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  answerChipTextSelected: {
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
  submitButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.secondary,
  },
});

export default ListeningPart3A2UI;
