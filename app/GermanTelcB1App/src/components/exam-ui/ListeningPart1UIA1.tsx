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

interface Option {
  is_correct: boolean;
  text: string;
}

interface Question {
  id: number;
  question: string;
  options: Option[];
}

interface Exam {
  id: number;
  title: string;
  audio_url: string;
  questions: Question[];
}

interface ListeningPart1UIA1Props {
  exam: Exam;
  sectionDetails: any;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const ListeningPart1UIA1: React.FC<ListeningPart1UIA1Props> = ({ exam, sectionDetails, onComplete }) => {
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

  const handleAnswerSelect = (questionId: number, optionIndex: number) => {
    setUserAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a =>
          a.questionId === questionId
            ? { ...a, answer: optionIndex.toString(), timestamp: Date.now() }
            : a
        );
      }
      return [...prev, {
        questionId,
        answer: optionIndex.toString(),
        isCorrect: false, // Will be calculated on submit
        timestamp: Date.now()
      }];
    });
    logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
      section: 'listening',
      part: 1,
      exam_id: exam.id,
      question_id: questionId,
    });
  };

  const getUserAnswer = (questionId: number): number | null => {
    const answer = userAnswers.find(a => a.questionId === questionId);
    return answer ? parseInt(answer.answer) : null;
  };

  const handlePlayAudio = async () => {
    setHasStarted(true);
    setIsPlaying(true);
    const startTs = Date.now();
    logEvent(AnalyticsEvents.AUDIO_PLAY_PRESSED, { exam_id: exam.id });

    try {
      // Use offline file if available
      const audioPath = await offlineService.getLocalAudioPath(exam.audio_url);
      console.log('[ListeningPart1A1] Playing audio from:', audioPath);

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
        t('listening.part1.audioError'),
        t('listening.part1.audioErrorMessage'),
        [{ text: 'OK' }]
      );
      setIsPlaying(false);
    }
  };

  const handleSubmit = () => {
    const unansweredQuestions = exam.questions.filter(
      q => !userAnswers.find(a => a.questionId === q.id && a.answer !== null)
    );

    if (unansweredQuestions.length > 0) {
      Alert.alert(
        t('listening.part1.a1.incomplete'),
        t('listening.part1.a1.incompleteMessage', { count: unansweredQuestions.length }),
        [{ text: 'OK' }]
      );
      return;
    }

    let correctCount = 0;
    const answers: UserAnswer[] = [];

    exam.questions.forEach(question => {
      const userAnswer = userAnswers.find(a => a.questionId === question.id);
      const selectedOptionIndex = userAnswer ? parseInt(userAnswer.answer) : -1;
      const isCorrect = selectedOptionIndex >= 0 && question.options[selectedOptionIndex]?.is_correct === true;

      if (isCorrect) {
        correctCount++;
      }

      answers.push({
        questionId: question.id,
        answer: userAnswer?.answer || '',
        isCorrect,
        timestamp: Date.now(),
      });

      logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
        section: 'listening',
        part: 1,
        exam_id: exam.id,
        question_id: question.id,
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
            ⏱️ {sectionDetails.duration_minutes} {t('listening.part1.minutes')}
          </Text>
          <Text style={styles.metaText}>
            📝 {exam.questions.length} {t('listening.part1.a1.questions')}
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

      {/* Questions */}
      <View style={styles.questionsSection}>
        <Text style={styles.sectionTitle}>{t('listening.part1.a1.questions')}</Text>

        {exam.questions.map((question, qIndex) => {
          const userAnswer = getUserAnswer(question.id);
          return (
            <View key={question.id} style={styles.questionCard}>
              <View style={styles.questionContent}>
                <Text style={styles.questionNumber}>
                  {question.id}.
                </Text>
                <Text style={styles.questionText}>
                  {question.question}
                </Text>
              </View>

              <View style={styles.optionsContainer}>
                {question.options.map((option, optionIndex) => {
                  const isSelected = userAnswer === optionIndex;
                  return (
                    <TouchableOpacity
                      key={optionIndex}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonSelected
                      ]}
                      onPress={() => handleAnswerSelect(question.id, optionIndex)}
                    >
                      <View style={[
                        styles.radioButton,
                        isSelected && styles.radioButtonSelected
                      ]}>
                        {isSelected && <View style={styles.radioButtonInner} />}
                      </View>
                      <Text style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected
                      ]}>
                        {option.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          userAnswers.filter(a => a.answer !== null).length < exam.questions.length && styles.submitButtonDisabled
        ]}
        disabled={userAnswers.filter(a => a.answer !== null).length < exam.questions.length}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>
          {t('listening.part1.submitAnswers', {
            answered: userAnswers.filter(a => a.answer !== null).length,
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
  },
  questionNumber: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  questionText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
    lineHeight: 22,
    direction: 'ltr',
  },
  optionsContainer: {
    gap: spacing.margin.sm,
    direction: 'ltr',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.padding.sm,
    borderRadius: spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  optionButtonSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.secondary[400],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.margin.sm,
  },
  radioButtonSelected: {
    borderColor: colors.primary[500],
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[500],
  },
  optionText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  optionTextSelected: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
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

export default ListeningPart1UIA1;

