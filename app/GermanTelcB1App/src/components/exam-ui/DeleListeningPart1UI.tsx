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
import { DeleListeningExam, DeleListeningSectionDetails, UserAnswer } from '../../types/exam.types';
import AudioDuration from '../AudioDuration';
import offlineService from '../../services/offline.service';

interface DeleListeningPart1UIProps {
  exam: DeleListeningExam;
  sectionDetails: DeleListeningSectionDetails;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const DeleListeningPart1UI: React.FC<DeleListeningPart1UIProps> = ({ exam, sectionDetails, onComplete }) => {
  const { i18n, t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: number]: number }>({});
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
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex,
    }));
    logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
      section: 'dele-listening',
      part: 1,
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
      // Use offline file if available
      const audioUrl = `listening-part1/${exam.id}.mp3`;
      const audioPath = await offlineService.getLocalAudioPath(audioUrl);
      console.log('[DeleListeningPart1] Playing audio from:', audioPath);

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

  const handlePauseAudio = () => {
    Sound.pausePlayer();
    setIsPlaying(false);
    logEvent(AnalyticsEvents.AUDIO_PLAY_PRESSED, { exam_id: exam.id, action: 'pause' });
  };

  const handleSubmit = () => {
    const unansweredQuestions = exam.questions.filter(
      q => userAnswers[q.id] === undefined
    );

    if (unansweredQuestions.length > 0) {
      Alert.alert(
        t('listening.part1.incomplete'),
        t('listening.part1.incompleteMessage', { count: unansweredQuestions.length }),
        [{ text: 'OK' }]
      );
      return;
    }

    let correctCount = 0;
    const answers: UserAnswer[] = [];
    
    exam.questions.forEach(question => {
      const userAnswerIndex = userAnswers[question.id];
      const correctAnswerIndex = question.options.findIndex(opt => opt.is_correct === true);
      const isCorrect = userAnswerIndex === correctAnswerIndex;
      
      if (isCorrect) {
        correctCount++;
      }

      const selectedOption = question.options[userAnswerIndex];
      const correctOption = question.options[correctAnswerIndex];
      
      answers.push({
        questionId: question.id,
        answer: selectedOption?.text || selectedOption?.option || '',
        isCorrect,
        timestamp: Date.now(),
        correctAnswer: correctOption?.text || correctOption?.option || '',
        explanation: question.explanation,
        transcript: question.audio_transcription,
      });

      logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
        section: 'dele-listening',
        part: 1,
        exam_id: exam.id,
        question_id: question.id,
        is_correct: !!isCorrect,
      });
    });

    const score = correctCount;
    onComplete(score, answers);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>{sectionDetails.title}</Text>
        <Text style={styles.instructionsText}>
          {getInstructions()}
        </Text>
        {sectionDetails.prep_time_seconds && (
          <Text style={styles.prepTime}>
            {t('listening.prepTime', { seconds: sectionDetails.prep_time_seconds })}
          </Text>
        )}
      </View>

      {/* Audio Player */}
      <View style={styles.audioSection}>
        <Text style={styles.sectionTitle}>{exam.title}</Text>
        <View style={styles.audioPlayer}>
          <AudioDuration currentTime={currentTime} duration={duration} />
          <View style={styles.audioControls}>
            {isPlaying ? (
              <TouchableOpacity
                style={styles.pauseButton}
                onPress={handlePauseAudio}
              >
                <Text style={styles.pauseButtonText}>
                  {t('listening.part1.pause')}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.playButton}
                onPress={handlePlayAudio}
              >
                <Text style={styles.playButtonText}>
                  {hasStarted ? t('listening.part1.resume') : t('listening.part1.play')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Questions */}
      <View style={styles.questionsSection}>
        <Text style={styles.sectionTitle}>
          {t('listening.part1.questions', { count: exam.questions.length })}
        </Text>
        {exam.questions.map((question) => (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionNumber}>{question.id}.</Text>
            <Text style={styles.questionText}>{question.question}</Text>
            
            {question.options.map((option, index) => {
              const isSelected = userAnswers[question.id] === index;
              const displayText = option.text || option.option || '';
              return (
                <TouchableOpacity
                  key={`${question.id}-opt-${index}`}
                  style={[
                    styles.answerOption,
                    isSelected && styles.answerOptionSelected
                  ]}
                  onPress={() => handleAnswerSelect(question.id, index)}
                >
                  <View style={[
                    styles.radioButton,
                    isSelected && styles.radioButtonSelected
                  ]}>
                    {isSelected && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={[
                    styles.answerText,
                    isSelected && styles.answerTextSelected
                  ]}>
                    {displayText}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>
          {t('listening.part1.submitAnswers', { 
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
    textAlign: 'left',
  },
  instructionsText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
    textAlign: 'left',
  },
  prepTime: {
    ...typography.textStyles.bodySmall,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.margin.sm,
  },
  audioSection: {
    marginBottom: spacing.margin.xl,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.md,
    textAlign: 'left',
  },
  audioPlayer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  audioControls: {
    marginTop: spacing.margin.md,
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
  pauseButton: {
    backgroundColor: colors.secondary[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
  },
  pauseButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.secondary,
  },
  questionsSection: {
    marginBottom: spacing.margin.lg,
  },
  questionCard: {
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
  questionNumber: {
    ...typography.textStyles.h4,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.xs,
  },
  questionText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
    lineHeight: 22,
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.padding.sm,
    borderRadius: spacing.borderRadius.sm,
    marginBottom: spacing.margin.xs,
    backgroundColor: colors.secondary[50],
  },
  answerOptionSelected: {
    backgroundColor: colors.primary[100],
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
  answerText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  answerTextSelected: {
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

export default DeleListeningPart1UI;
