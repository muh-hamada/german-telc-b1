import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import Sound from 'react-native-nitro-sound';
import { spacing, typography, type ThemeColors } from '../../theme';
import { useAppTheme } from '../../contexts/ThemeContext';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { UserAnswer } from '../../types/exam.types';
import AudioDuration from '../AudioDuration';
import MarkdownText from '../MarkdownText';
import offlineService from '../../services/offline.service';

interface Question {
  id: number;
  question: string;
  answer: string;
  audio_transcription: string;
  explanation?: Record<string, string>;
}

interface Exam {
  id: string;
  title: string;
  audio_url: string;
  questions: Question[];
}

interface ListeningPart1A2UIProps {
  exam: Exam;
  sectionDetails: any;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const ListeningPart1A2UI: React.FC<ListeningPart1A2UIProps> = ({ exam, sectionDetails, onComplete }) => {
  const { i18n, t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
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
      case 'de': return sectionDetails.instructions_de;
      case 'ar': return sectionDetails.instructions_ar;
      case 'ru': return sectionDetails.instructions_ru;
      case 'fr': return sectionDetails.instructions_fr;
      case 'es': return sectionDetails.instructions_es;
      default: return sectionDetails.instructions_en;
    }
  };

  const handleAnswerChange = (questionId: number, text: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const handlePlayAudio = async () => {
    setHasStarted(true);
    setIsPlaying(true);
    const startTs = Date.now();
    logEvent(AnalyticsEvents.AUDIO_PLAY_PRESSED, { exam_id: exam.id });

    try {
      const audioPath = await offlineService.getLocalAudioPath(exam.audio_url);
      console.log('[ListeningPart1A2] Playing audio from:', audioPath);

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
        t('listening.part1.audioError'),
        t('listening.part1.audioErrorMessage'),
        [{ text: 'OK' }]
      );
      setIsPlaying(false);
    }
  };

  const handleSubmit = () => {
    const answeredCount = Object.keys(userAnswers).filter(k => userAnswers[parseInt(k)]?.trim()).length;
    if (answeredCount < exam.questions.length) {
      Alert.alert(
        t('listening.part1.a2.incomplete'),
        t('listening.part1.a2.incompleteMessage', { count: exam.questions.length - answeredCount }),
        [{ text: 'OK' }]
      );
      return;
    }

    let correctCount = 0;
    const answers: UserAnswer[] = [];

    exam.questions.forEach(question => {
      const userAnswer = (userAnswers[question.id] || '').trim();
      const isCorrect = userAnswer.toLowerCase() === question.answer.toLowerCase();

      if (isCorrect) {
        correctCount++;
      }

      answers.push({
        questionId: question.id,
        answer: userAnswer,
        isCorrect,
        timestamp: Date.now(),
        correctAnswer: question.answer,
        explanation: question.explanation,
        transcript: question.audio_transcription,
      });

      logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
        section: 'listening',
        part: 1,
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
            ⏱️ {sectionDetails.duration_minutes} {t('listening.part1.minutes')}
          </Text>
          <Text style={styles.metaText}>
            📝 {exam.questions.length} {t('listening.part1.questions')}
          </Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>{t('listening.part1.instructions')}</Text>
        <Text style={styles.instructionsText}>{getInstructions()}</Text>
      </View>

      {/* Audio Player */}
      <View style={styles.audioSection}>
        <View style={styles.examWarning}>
          <Text style={styles.examWarningText}>
            {t('listening.part1.examWarning')}
          </Text>
        </View>

        <View style={styles.audioPlayer}>
          <View style={styles.audioInfo}>
            <View>
              <Text style={styles.audioTitle}>{t('listening.part1.audioFile')}</Text>
              <Text style={styles.audioStatus}>
                {!hasStarted ? t('listening.part1.readyToPlay') : isPlaying ? t('listening.part1.playing') : t('listening.part1.completed')}
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
              <Text style={styles.playButtonText}>{t('listening.part1.playAudio')}</Text>
            </TouchableOpacity>
          )}

          {isPlaying && (
            <View style={styles.playingIndicator}>
              <Text style={styles.playingText}>{t('listening.part1.audioPlaying')}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Questions - Gap Fill */}
      <View style={styles.questionsSection}>
        <Text style={styles.sectionTitle}>{t('listening.part1.questions')}</Text>

        {exam.questions.map((question) => (
          <View key={question.id} style={styles.questionCard}>
            <View style={styles.questionContent}>
              <Text style={styles.questionNumber}>{question.id}.</Text>
              <View style={styles.questionTextContainer}>
                <Text style={styles.questionText}>
                  <MarkdownText
                    text={question.question.replace(/_____/g, '______')}
                    baseStyle={styles.questionText}
                  />
                </Text>
              </View>
            </View>

            <View style={styles.answerInputContainer}>
              <Text style={styles.answerLabel}>{t('listening.part1.a2.yourAnswer')}:</Text>
              <TextInput
                style={styles.answerInput}
                value={userAnswers[question.id] || ''}
                onChangeText={(text) => handleAnswerChange(question.id, text)}
                placeholder={t('listening.part1.a2.typePlaceholder')}
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>
          {t('listening.part1.submitAnswers', {
            answered: Object.keys(userAnswers).filter(k => userAnswers[parseInt(k)]?.trim()).length,
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
  questionsSection: {
    marginBottom: spacing.margin.lg,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
  },
  questionCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  questionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    direction: 'ltr',
    gap: spacing.margin.sm,
    marginBottom: spacing.margin.md,
  },
  questionNumber: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  questionTextContainer: {
    flex: 1,
  },
  questionText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
    direction: 'ltr',
  },
  answerInputContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.padding.sm,
  },
  answerLabel: {
    ...typography.textStyles.bodySmall,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.margin.xs,
  },
  answerInput: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.secondary[300],
    borderRadius: spacing.borderRadius.sm,
    paddingHorizontal: spacing.padding.md,
    paddingVertical: spacing.padding.sm,
    direction: 'ltr',
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

export default ListeningPart1A2UI;
