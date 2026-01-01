import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SpeakingDialogueComponent } from '../../components/speaking/SpeakingDialogueComponent';
import { getActiveExamConfig } from '../../config/active-exam.config';
import { ExamLevel } from '../../config/exam-config.types';
import { useAuth } from '../../contexts/AuthContext';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { speakingService } from '../../services/speaking.service';
import { spacing, typography, type ThemeColors } from '../../theme';
import { HomeStackNavigationProp, HomeStackParamList } from '../../types/navigation.types';
import { SpeakingAssessmentDialogue } from '../../types/prep-plan.types';
import { LanguageNameToLanguageCodes } from '../../utils/i18n';
import i18n from '../../utils/i18n';
import { useAppTheme } from '../../contexts/ThemeContext';
import { I18nManager } from 'react-native';
import { getScoreBadgeColors } from '../../utils/score-colors';

type Props = StackScreenProps<HomeStackParamList, 'SpeakingAssessment'>;

export const SpeakingAssessmentScreen: React.FC<Props> = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { user } = useAuth();
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [isLoading, setIsLoading] = useState(true);
  const [dialogue, setDialogue] = useState<SpeakingAssessmentDialogue | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [history, setHistory] = useState<SpeakingAssessmentDialogue[]>([]);
  const [inProgressDialogue, setInProgressDialogue] = useState<SpeakingAssessmentDialogue | null>(null);

  const activeExamConfig = getActiveExamConfig();
  const level: ExamLevel = activeExamConfig.level;

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const [dialogueHistory, currentInProgress] = await Promise.all([
        speakingService.listDialogues(user.uid),
        speakingService.getInProgressDialogue(user.uid)
      ]);

      setHistory(dialogueHistory);
      setInProgressDialogue(currentInProgress);
      setIsLoading(false);
    } catch (error) {
      console.error('[SpeakingAssessmentScreen] Error loading data:', error);
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRestart = async (oldPracticeId: string) => {
    if (!user) return;
    try {
      await speakingService.deleteDialogue(user.uid, oldPracticeId);
      setInProgressDialogue(null);
      // Reload history to exclude the deleted dialogue before generating a new one
      await loadData();
      await loadOrGenerateDialogue();
    } catch (error) {
      console.error('[SpeakingAssessmentScreen] Error restarting:', error);
    }
  };

  const handleStartAssessment = () => {
    // Check if there's an in-progress dialogue
    if (inProgressDialogue) {
      Alert.alert(
        t('speaking.resume.title'),
        t('speaking.resume.message'),
        [
          {
            text: t('speaking.resume.restart'),
            style: 'destructive',
            onPress: () => {
              handleRestart(inProgressDialogue.practiceId);
            },
          },
          {
            text: t('speaking.resume.continue'),
            onPress: () => {
              handleContinue(inProgressDialogue);
            },
          },
        ]
      );
    } else {
      // No in-progress dialogue, start new one
      loadOrGenerateDialogue();
    }
  };

  const handleContinue = (dialogueToContinue: SpeakingAssessmentDialogue) => {
    setDialogue(dialogueToContinue);
  };

  const loadOrGenerateDialogue = async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('common.loginRequired'));
      navigation.goBack();
      return;
    }

    try {
      logEvent(AnalyticsEvents.SPEAKING_ASSESSMENT_STARTED, {
        level,
      });

      // Extract practiced dialogue IDs in chronological order (oldest to newest)
      const practicedDialogueIds = history
        .sort((a, b) => {
          const timeA = a.lastUpdated instanceof Date 
            ? a.lastUpdated.getTime() 
            : a.lastUpdated?.toMillis?.() || 0;
          const timeB = b.lastUpdated instanceof Date 
            ? b.lastUpdated.getTime() 
            : b.lastUpdated?.toMillis?.() || 0;
          return timeA - timeB;
        })
        .map(d => d.dialogueId)
        .filter(id => id); // Filter out any undefined/null values

      console.log('[SpeakingAssessmentScreen] Practiced dialogue IDs:', practicedDialogueIds);

      // Generate new dialogue with rotation logic
      console.log('[SpeakingAssessmentScreen] Generating dialogue...');
      const newDialogue = await speakingService.generateDialogue(level, practicedDialogueIds);

      console.log('[SpeakingAssessmentScreen] Dialogue generated:', {
        practiceId: newDialogue.practiceId,
        dialogueId: newDialogue.dialogueId,
        totalTurns: newDialogue.totalTurns,
        currentTurn: newDialogue.currentTurn,
        turnsLength: newDialogue.turns.length,
      });

      setDialogue(newDialogue);

      // Save initial state
      await speakingService.saveDialogueProgress(user.uid, newDialogue);

    } catch (error: any) {
      console.error('[SpeakingAssessmentScreen] Error loading dialogue:', error);
      Alert.alert(
        t('speaking.error'),
        error.message || t('speaking.loadError')
      );
    }
  };

  const handleTurnComplete = async (
    turnIndex: number,
    audioPath: string
  ) => {
    if (!user || !dialogue) return;

    try {
      console.log('[SpeakingAssessmentScreen] Processing turn...', { turnIndex });

      const currentTurn = dialogue.turns[turnIndex];
      const previousAITurn = turnIndex > 0 ? dialogue.turns[turnIndex - 1] : null;

      // Map exam language to instruction key
      const examLangCode = LanguageNameToLanguageCodes[activeExamConfig.language] || 'de';

      // Use the instruction in the exam language as context for evaluation
      const context = (currentTurn.instruction && currentTurn.instruction[examLangCode as keyof typeof currentTurn.instruction]) ||
        currentTurn.text ||
        previousAITurn?.text ||
        'Speaking practice';

      // Evaluate the user's response
      const evaluation = await speakingService.evaluateResponse(
        audioPath,
        context,
        level,
        user.uid,
        dialogue.practiceId,
        turnIndex,
        i18n.language // Pass interface language as feedback language
      );

      console.log('[SpeakingAssessmentScreen] Turn evaluated:', evaluation);

      // Check if no speech was detected (handled by backend returning empty transcription)
      if (!evaluation.transcription || evaluation.transcription.trim() === '') {
        Alert.alert(
          t('speaking.noSpeechDetected'),
          t('speaking.noSpeechDetectedMessage')
        );
        return; // Don't proceed to next turn, user must try again
      }

      // Update dialogue state with evaluation and transcription
      const updatedDialogue = {
        ...dialogue,
        currentTurn: turnIndex + 1,
        turns: dialogue.turns.map((turn, idx) =>
          idx === turnIndex
            ? { ...turn, transcription: evaluation.transcription, evaluation, completed: true }
            : turn
        ),
      };

      console.log('[SpeakingAssessmentScreen] Updated turn:', updatedDialogue.turns[turnIndex]);
      console.log('[SpeakingAssessmentScreen] Updated dialogue currentTurn:', updatedDialogue.currentTurn);

      setDialogue(updatedDialogue);

      // Save progress
      await speakingService.saveDialogueProgress(user.uid, updatedDialogue);

      logEvent(AnalyticsEvents.PREP_PLAN_SPEAKING_TURN_COMPLETED, {
        turnIndex,
        score: evaluation.totalScore,
      });

      // Move to next turn after successful update
      handleNextTurn();
    } catch (error: any) {
      console.error('[SpeakingAssessmentScreen] Error processing turn:', error);

      // Extract a user-friendly message from technical errors
      let userMessage = t('speaking.processingError');

      // Detect specific error types and provide appropriate messages
      if (error.message?.includes('timeout') || error.message?.includes('retry-limit')) {
        userMessage = t('speaking.uploadTimeout');
      } else if (error.code === 'network-request-failed' || error.message?.includes('network')) {
        userMessage = t('speaking.networkError');
      } else if (error.message?.includes('audio') || error.message?.includes('recording')) {
        userMessage = t('speaking.audioError');
      } else if (error.message?.includes('Permission denied')) {
        userMessage = t('speaking.permissionError');
      } else if (error.code === 'functions/internal' || error.code === 'unavailable' || error.message?.includes('Failed to evaluate')) {
        userMessage = t('speaking.apiError');
      }

      Alert.alert(
        t('speaking.error'),
        userMessage,
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('speaking.retryButton'),
            onPress: () => handleTurnComplete(turnIndex, audioPath)
          },
        ]
      );
    }
  };

  const handleNextTurn = () => {
    if (!dialogue) return;

    console.log('[SpeakingAssessmentScreen] Moving to next turn from:', dialogue.currentTurn);

    const newTurn = dialogue.currentTurn + 1;

    setDialogue(prev => {
      if (!prev) return prev;
      const newDialogue = {
        ...prev,
        currentTurn: newTurn,
      };
      console.log('[SpeakingAssessmentScreen] New currentTurn:', newDialogue.currentTurn);
      return newDialogue;
    });

    // Check if this is the last turn
    if (newTurn >= dialogue.totalTurns) {
      handleDialogueComplete();
    }
  };

  const handleDialogueComplete = async () => {
    if (!user || !dialogue) return;

    try {
      setIsEvaluating(true);

      console.log('[SpeakingAssessmentScreen] Completing dialogue...');

      // Get comprehensive evaluation
      const overallEvaluation = await speakingService.completeDialogue(
        user.uid,
        dialogue.practiceId
      );

      logEvent(AnalyticsEvents.PREP_PLAN_SPEAKING_COMPLETED, {
        practiceId: dialogue.practiceId,
        dialogueId: dialogue.dialogueId,
        totalScore: overallEvaluation.totalScore,
        level,
      });

      setIsEvaluating(false);

      // Show results
      showFinalResults();
    } catch (error: any) {
      console.error('[SpeakingAssessmentScreen] Error completing dialogue:', error);
      setIsEvaluating(false);

      // Extract a user-friendly message from technical errors
      let userMessage = t('speaking.completionError');

      if (error.code === 'network-request-failed' || error.message?.includes('network')) {
        userMessage = t('speaking.networkError');
      } else if (error.code === 'functions/internal' || error.code === 'unavailable' || error.message?.includes('Failed to')) {
        userMessage = t('speaking.apiError');
      }

      Alert.alert(
        t('speaking.error'),
        userMessage,
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('speaking.retryButton'), onPress: () => handleDialogueComplete() },
        ]
      );
    }
  };

  const showFinalResults = () => {
    if (!dialogue) return;

    // Clear dialogue state so when user presses back, they see the intro screen
    setDialogue(null);

    // Navigate to results screen
    navigation.navigate('AssessmentResults', { dialogueId: dialogue.practiceId });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>{t('speaking.loading')}</Text>
      </View>
    );
  }

  if (isEvaluating) {
    return (
      <View style={styles.evaluatingContainer}>
        <Icon name="check-circle" size={80} color={colors.success[500]} />
        <Text style={styles.evaluatingTitle}>{t('speaking.complete')}</Text>
        <ActivityIndicator size="large" color={colors.primary[500]} style={styles.loader} />
        <Text style={styles.evaluatingText}>{t('speaking.evaluating')}</Text>
      </View>
    );
  }

  // Show dialogue component when dialogue is set
  if (dialogue) {
    return (
      <View style={[styles.container, styles.dialogueContainer]}>
        <SpeakingDialogueComponent
          dialogue={dialogue.turns}
          currentTurnIndex={dialogue.currentTurn}
          onComplete={handleDialogueComplete}
          onTurnComplete={handleTurnComplete}
          onNextTurn={handleNextTurn}
        />
      </View>
    );
  }

  // Default: show intro with history
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.introContent}>
        <Text style={styles.introSubtitle}>{t('speaking.intro.subtitle')}</Text>

        <View style={styles.stepContainer}>
          <View style={[styles.stepIconContainer, { backgroundColor: colors.primary[50] }]}>
            <Icon name="forum" size={24} color={colors.primary[600]} />
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>{t('speaking.intro.step1Title')}</Text>
            <Text style={styles.stepDescription}>{t('speaking.intro.step1Desc')}</Text>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <View style={[styles.stepIconContainer, { backgroundColor: colors.secondary[100] }]}>
            <Icon name="mic" size={24} color={colors.secondary[700]} />
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>{t('speaking.intro.step2Title')}</Text>
            <Text style={styles.stepDescription}>{t('speaking.intro.step2Desc')}</Text>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <View style={[styles.stepIconContainer, { backgroundColor: colors.success[50] }]}>
            <Icon name="psychology" size={24} color={colors.success[700]} />
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>{t('speaking.intro.step3Title')}</Text>
            <Text style={styles.stepDescription}>{t('speaking.intro.step3Desc')}</Text>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <View style={[styles.stepIconContainer, { backgroundColor: colors.warning[50] }]}>
            <Icon name="assignment" size={24} color={colors.warning[700]} />
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>{t('speaking.intro.step4Title')}</Text>
            <Text style={styles.stepDescription}>{t('speaking.intro.step4Desc')}</Text>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <View style={[styles.stepIconContainer, { backgroundColor: colors.error[50] }]}>
            <Icon name="trending-up" size={24} color={colors.error[600]} />
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>{t('speaking.intro.step5Title')}</Text>
            <Text style={styles.stepDescription}>{t('speaking.intro.step5Desc')}</Text>
          </View>
        </View>

        {history.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>{t('speaking.history.title')}</Text>
            {history.map((item) => (
              <TouchableOpacity
                key={item.practiceId}
                style={styles.historyItem}
                onPress={() => {
                  if (item.isComplete) {
                    navigation.navigate('AssessmentResults', { dialogueId: item.practiceId });
                  } else {
                    handleContinue(item);
                  }
                }}
              >
                <View style={styles.historyItemMain}>
                  <Text style={styles.historyItemDate}>
                    {(() => {
                      const timestamp = item.lastUpdated;
                      if (!timestamp) return new Date().toLocaleString(undefined, {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      // Handle Firestore Timestamp
                      const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
                      return date.toLocaleString(undefined, {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                    })()}
                  </Text>
                </View>
                <View style={styles.historyItemStatus}>
                  {item.isComplete ? (
                    (() => {
                      const score = Math.round(item.overallEvaluation?.totalScore || 0);
                      const badgeColors = getScoreBadgeColors(score, 100, colors);
                      return (
                        <View style={[
                          styles.scoreBadge,
                          {
                            backgroundColor: badgeColors.backgroundColor,
                            borderWidth: 1,
                            borderColor: badgeColors.borderColor,
                          }
                        ]}>
                          <Text style={[styles.scoreBadgeText, { color: badgeColors.textColor }]}>
                            {score}/100
                          </Text>
                        </View>
                      );
                    })()
                  ) : (
                    <Text style={styles.inProgressText}>{t('speaking.history.inProgress')}</Text>
                  )}
                  <Icon name={I18nManager.isRTL ? "chevron-left" : "chevron-right"} size={20} color={colors.text.tertiary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartAssessment}
        >
          <Text style={styles.startButtonText}>{t('speaking.intro.startButton')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  dialogueContainer: {
    paddingTop: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: colors.primary[500],
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: colors.background.secondary,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
  },
  introContent: {
    padding: 24,
  },
  introSubtitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: 24,
    textAlign: 'left',
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
    textAlign: 'left',
  },
  stepDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    textAlign: 'left',
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  startButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: '700',
  },
  evaluatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: 24,
  },
  evaluatingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 24,
  },
  evaluatingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 12,
  },
  loader: {
    marginTop: 24,
  },
  resultsContainer: {
    width: '100%',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  scoreLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  scoreBarContainer: {
    height: 8,
    backgroundColor: colors.border.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  scoreValue: {
    fontSize: 12,
    color: colors.text.primary,
    marginTop: 4,
    textAlign: 'right',
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  doneButton: {
    backgroundColor: colors.primary[500],
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    alignItems: 'center',
  },
  doneButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  historyContainer: {
    marginTop: 32,
    marginBottom: 24,
  },
  historyTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'left',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderBottomColor: colors.border.light,
    borderColor: colors.border.light,
  },
  historyItemMain: {
    flex: 1,
  },
  historyItemDate: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'left',
  },
  historyItemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBadge: {
    // Background color is applied dynamically based on score
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginRight: 8,
  },
  scoreBadgeText: {
    // Text color is applied dynamically based on score
    ...typography.textStyles.body,
  },
  inProgressText: {
    color: colors.warning[600],
    ...typography.textStyles.body,
    marginRight: 8,
  },
});

export default SpeakingAssessmentScreen;
