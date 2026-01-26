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

interface DeleListeningUIProps {
  exam: DeleListeningExam;
  sectionDetails: DeleListeningSectionDetails;
  part: number;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const DeleListeningUI: React.FC<DeleListeningUIProps> = ({ exam, sectionDetails, part, onComplete }) => {
  const { i18n, t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: number]: number | string }>({});
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

  const getAudioStatus = () => {
    if (hasStarted) {
      return isPlaying ? t('listening.part1.playing') : t('listening.part1.completed');
    }
    return t('listening.part1.readyToPlay');
  };

  const handleAnswerSelect = (questionId: number, optionIndex: number | string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex,
    }));
    logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
      section: 'dele-listening',
      part: part,
      exam_id: exam.id,
      question_id: questionId,
    });
  };

  const handlePlayAudio = async () => {
    setHasStarted(true);
    setIsPlaying(true);
    const startTs = Date.now();
    logEvent(AnalyticsEvents.AUDIO_PLAY_PRESSED, { exam_id: exam.id, part });

    try {
      // Use offline file if available
      // If exam has audio_url, use it; otherwise construct it from part and exam.id
      const audioUrl = exam.audio_url || `listening-part${part}/${exam.id}.mp3`;
      const audioPath = await offlineService.getLocalAudioPath(audioUrl);
      console.log(`[DeleListeningPart${part}] Playing audio from:`, audioPath);

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
        logEvent(AnalyticsEvents.AUDIO_COMPLETED, { exam_id: exam.id, part, duration_ms: Date.now() - startTs });
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
      const userAnswerValue = userAnswers[question.id];
      let isCorrect = false;
      let selectedOptionText = '';
      let correctAnswerText = '';

      if (part === 4) {
        // Part 4: answer is a letter key (a-j) from statements
        const correctAnswer = (question as any).answer;
        isCorrect = userAnswerValue === correctAnswer;
        selectedOptionText = userAnswerValue ? String(userAnswerValue).toUpperCase() : '';
        correctAnswerText = correctAnswer ? String(correctAnswer).toUpperCase() : '';
      } else if (part === 5) {
        // Part 5: answer is 'a', 'b', or 'c'
        const correctAnswer = (question as any).answer;
        isCorrect = userAnswerValue === correctAnswer;
        selectedOptionText = userAnswerValue ? String(userAnswerValue).toUpperCase() : '';
        correctAnswerText = correctAnswer ? String(correctAnswer).toUpperCase() : '';
      } else {
        // Parts 1, 2, 3: options array with is_correct
        const userAnswerIndex = userAnswerValue as number;
        const correctAnswerIndex = question.options.findIndex(opt => opt.is_correct === true);
        isCorrect = userAnswerIndex === correctAnswerIndex;
        
        const selectedOption = question.options[userAnswerIndex];
        const correctOption = question.options[correctAnswerIndex];
        selectedOptionText = selectedOption?.text || selectedOption?.option || '';
        correctAnswerText = correctOption?.text || correctOption?.option || '';
      }
      
      if (isCorrect) {
        correctCount++;
      }
      
      answers.push({
        questionId: question.id,
        answer: selectedOptionText,
        isCorrect,
        timestamp: Date.now(),
        correctAnswer: correctAnswerText,
        explanation: question.explanation,
        transcript: question.audio_transcription,
      });

      logEvent(AnalyticsEvents.QUESTION_ANSWERED, {
        section: 'dele-listening',
        part: part,
        exam_id: exam.id,
        question_id: question.id,
        is_correct: !!isCorrect,
      });
    });

    const score = correctCount;
    onComplete(score, answers);
  };

  const renderQuestions = () => {
    if (part === 4) {
      // Part 4: Statements matching
      return (
        <>
          {/* Display statements A-J */}
          <View style={styles.statementsCard}>
            <Text style={styles.statementsTitle}>{t('listening.statements')}</Text>
            {Object.entries((exam as any).statements || {}).sort((a, b) => a[0].localeCompare(b[0])).map(([key, value]) => (
              <View key={key} style={styles.statementItem}>
                <Text style={styles.statementLetter}>{key.toUpperCase()}.</Text>
                <Text style={styles.statementText}>{value as string}</Text>
              </View>
            ))}
          </View>
          
          {/* Questions for matching */}
          {exam.questions.map((question) => (
            <View key={question.id} style={styles.questionCard}>
              <Text style={styles.questionNumber}>{question.id}. {t('listening.person')} {(question as any).person}</Text>
              
              <View style={styles.optionsContainer}>
                {Object.keys((exam as any).statements || {}).sort((a, b) => a.localeCompare(b)).map((key) => {
                  const isOptionSelected = userAnswers[question.id] === key;
                  return (
                    <TouchableOpacity
                      key={`${question.id}-${key}`}
                      style={[
                        styles.answerOption,
                        isOptionSelected && styles.answerOptionSelected
                      ]}
                      onPress={() => handleAnswerSelect(question.id, key)}
                    >
                      <Text style={[
                        styles.answerText,
                        isOptionSelected && styles.answerTextSelected
                      ]}>
                        {key.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </>
      );
    }
    
    if (part === 5) {
      // Part 5: A/B/C selection (who said what)
      return (
        <>
          {exam.questions.map((question) => {
            const statement = (question as any).statement;
            return (
              <View key={question.id} style={styles.questionCard}>
                <Text style={styles.questionNumber}>{question.id}.</Text>
                <Text style={styles.questionText}>{statement}</Text>
                
                <View style={styles.optionsContainer}>
                  {['a', 'b', 'c'].map((option) => {
                    const isSelected = userAnswers[question.id] === option;
                    return (
                      <TouchableOpacity
                        key={`${question.id}-${option}`}
                        style={[
                          styles.answerOption,
                          isSelected && styles.answerOptionSelected
                        ]}
                        onPress={() => handleAnswerSelect(question.id, option)}
                      >
                        <Text style={[
                          styles.answerText,
                          isSelected && styles.answerTextSelected
                        ]}>
                          {option.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </>
      );
    }
    
    // Parts 1, 2, 3: Regular options
    return exam.questions.map((question) => (
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
                styles.radioAnswerOption,
                isSelected && styles.radioAnswerOptionSelected
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
                styles.radioAnswerText,
                isSelected && styles.radioAnswerTextSelected
              ]}>
                {displayText}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ));
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
            📝 {exam.questions.length} {t('listening.part1.tasks')}
          </Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>{t('listening.part1.instructions')}</Text>
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
                {getAudioStatus()}
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
        <Text style={styles.sectionTitle}>
          {t('listening.part1.questions')}
        </Text>
        {renderQuestions()}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          Object.keys(userAnswers).length < exam.questions.length && styles.submitButtonDisabled
        ]}
        disabled={Object.keys(userAnswers).length < exam.questions.length}
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
  prepTime: {
    ...typography.textStyles.bodySmall,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.margin.sm,
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
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.md,
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
  answerOptionSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[600],
  },
  radioAnswerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.padding.sm,
    borderRadius: spacing.borderRadius.sm,
    marginBottom: spacing.margin.xs,
    backgroundColor: colors.secondary[50],
  },
  radioAnswerOptionSelected: {
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
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  radioAnswerText: {
     ...typography.textStyles.body,
    color: colors.text.primary,
  },
  answerTextSelected: {
     color: colors.background.secondary,
  },
  radioAnswerTextSelected: {
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
  statementsCard: {
    backgroundColor: colors.secondary[100],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  statementsTitle: {
    ...typography.textStyles.h4,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.md,
  },
  statementItem: {
    flexDirection: 'row',
    marginBottom: spacing.margin.sm,
  },
  statementLetter: {
    ...typography.textStyles.body,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
    marginRight: spacing.margin.sm,
    minWidth: 24,
  },
  statementText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 22,
  },
  optionsContainer: {
    marginTop: spacing.margin.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default DeleListeningUI;
