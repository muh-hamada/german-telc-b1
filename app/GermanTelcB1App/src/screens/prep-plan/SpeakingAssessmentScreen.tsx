import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../../types/navigation.types';
import { useAuth } from '../../contexts/AuthContext';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { speakingService } from '../../services/speaking.service';
import { SpeakingDialogueComponent } from '../../components/speaking/SpeakingDialogueComponent';
import {
  SpeakingAssessmentDialogue,
  SpeakingEvaluation,
} from '../../types/prep-plan.types';
import { getActiveExamConfig } from '../../config/active-exam.config';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { logEvent, AnalyticsEvents } from '../../services/analytics.events';

type SpeakingAssessmentScreenRouteProp = RouteProp<HomeStackParamList, 'SpeakingAssessment'>;

type Props = StackScreenProps<HomeStackParamList, 'SpeakingAssessment'>;

export const SpeakingAssessmentScreen: React.FC<Props> = () => {
  const route = useRoute<SpeakingAssessmentScreenRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { t } = useCustomTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [dialogue, setDialogue] = useState<SpeakingAssessmentDialogue | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [finalEvaluation, setFinalEvaluation] = useState<SpeakingEvaluation | null>(null);

  const activeExamConfig = getActiveExamConfig();
  const level = activeExamConfig.level as 'A1' | 'B1' | 'B2';

  useEffect(() => {
    loadOrGenerateDialogue();
  }, []);

  const loadOrGenerateDialogue = async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('common.loginRequired'));
      navigation.goBack();
      return;
    }

    try {
      setIsLoading(true);

      logEvent(AnalyticsEvents.SPEAKING_ASSESSMENT_STARTED, {
        level,
      });

      // Generate new dialogue
      console.log('[SpeakingAssessmentScreen] Generating dialogue...');
      const newDialogue = await speakingService.generateDialogue(level);
      
      console.log('[SpeakingAssessmentScreen] Dialogue generated:', {
        dialogueId: newDialogue.dialogueId,
        totalTurns: newDialogue.totalTurns,
        currentTurn: newDialogue.currentTurn,
        turnsLength: newDialogue.turns.length,
      });

      setDialogue(newDialogue);

      // Save initial state
      await speakingService.saveDialogueProgress(user.uid, newDialogue);

      setIsLoading(false);
    } catch (error: any) {
      console.error('[SpeakingAssessmentScreen] Error loading dialogue:', error);
      Alert.alert(
        t('speaking.error'),
        error.message || t('speaking.loadError')
      );
      setIsLoading(false);
    }
  };

  const handleTurnComplete = async (
    turnIndex: number,
    audioPath: string,
    transcription: string
  ) => {
    if (!user || !dialogue) return;

    try {
      console.log('[SpeakingAssessmentScreen] Processing turn...', { turnIndex });

      const currentTurn = dialogue.turns[turnIndex];
      const previousAITurn = turnIndex > 0 ? dialogue.turns[turnIndex - 1] : null;
      
      // Map exam language to instruction key
      const examLangMap: Record<string, 'de' | 'en' | 'fr' | 'es'> = {
        'german': 'de',
        'english': 'en',
        'french': 'fr',
        'spanish': 'es'
      };
      const examLangCode = examLangMap[activeExamConfig.language] || 'de';
      
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
        dialogue.dialogueId,
        turnIndex
      );

      console.log('[SpeakingAssessmentScreen] Turn evaluated:', evaluation);

      // Check if no speech was detected
      if (!evaluation.transcription || evaluation.transcription.trim() === '') {
        Alert.alert(
          t('speaking.noSpeechDetected'),
          t('speaking.noSpeechDetectedMessage')
        );
        return; // Don't proceed to next turn, user must try again
      }

      // Update dialogue state with transcription
      const updatedDialogue = {
        ...dialogue,
        turns: dialogue.turns.map((turn, idx) =>
          idx === turnIndex
            ? { ...turn, transcription: evaluation.transcription, completed: true }
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

      // Detect specific error types
      if (error.message?.includes('timeout') || error.message?.includes('retry-limit')) {
        Alert.alert(
          t('speaking.error'),
          t('speaking.uploadTimeout'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('speaking.retryButton'), onPress: () => handleTurnComplete(turnIndex, audioPath, transcription) },
          ]
        );
      } else if (error.code === 'network-request-failed' || error.message?.includes('network')) {
        Alert.alert(
          t('speaking.error'),
          t('speaking.networkError'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('speaking.retryButton'), onPress: () => handleTurnComplete(turnIndex, audioPath, transcription) },
          ]
        );
      } else if (error.message?.includes('audio') || error.message?.includes('recording')) {
        Alert.alert(
          t('speaking.error'),
          t('speaking.audioError')
        );
      } else if (error.message?.includes('Permission denied')) {
        Alert.alert(
          t('speaking.error'),
          t('speaking.permissionError')
        );
      } else if (error.code === 'functions/internal' || error.code === 'unavailable') {
        Alert.alert(
          t('speaking.error'),
          t('speaking.apiError'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('speaking.retryButton'), onPress: () => handleTurnComplete(turnIndex, audioPath, transcription) },
          ]
        );
      } else {
        Alert.alert(
          t('speaking.error'),
          error.message || t('speaking.processingError')
        );
      }
    }
  };

  const handleNextTurn = () => {
    if (!dialogue) return;
    
    console.log('[SpeakingAssessmentScreen] Moving to next turn from:', dialogue.currentTurn);
    
    setDialogue(prev => {
      if (!prev) return prev;
      const newDialogue = {
        ...prev,
        currentTurn: prev.currentTurn + 1,
      };
      console.log('[SpeakingAssessmentScreen] New currentTurn:', newDialogue.currentTurn);
      return newDialogue;
    });
  };

  const handleDialogueComplete = async (evaluation: SpeakingEvaluation) => {
    if (!user || !dialogue) return;

    try {
      setIsEvaluating(true);

      console.log('[SpeakingAssessmentScreen] Completing dialogue...');

      // Get comprehensive evaluation
      const overallEvaluation = await speakingService.completeDialogue(
        user.uid,
        dialogue.dialogueId
      );

      setFinalEvaluation(overallEvaluation);

      logEvent(AnalyticsEvents.PREP_PLAN_SPEAKING_COMPLETED, {
        dialogueId: dialogue.dialogueId,
        totalScore: overallEvaluation.totalScore,
        level,
      });

      setIsEvaluating(false);

      // Show results
      showFinalResults(overallEvaluation);

    } catch (error: any) {
      console.error('[SpeakingAssessmentScreen] Error completing dialogue:', error);
      setIsEvaluating(false);

      // Detect specific error types
      if (error.code === 'network-request-failed' || error.message?.includes('network')) {
        Alert.alert(
          t('speaking.error'),
          t('speaking.networkError'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('speaking.retryButton'), onPress: () => handleDialogueComplete(evaluation) },
          ]
        );
      } else if (error.code === 'functions/internal' || error.code === 'unavailable') {
        Alert.alert(
          t('speaking.error'),
          t('speaking.apiError'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('speaking.retryButton'), onPress: () => handleDialogueComplete(evaluation) },
          ]
        );
      } else {
        Alert.alert(
          t('speaking.error'),
          error.message || t('speaking.completionError')
        );
      }
    }
  };

  const showFinalResults = (evaluation: SpeakingEvaluation) => {
    if (!dialogue) return;
    // Replace to prevent going back to this screen
    navigation.reset({
      index: 1, // Focus on the second route (AssessmentResults)
      routes: [
        { name: 'Home' as any },
        { 
          name: 'AssessmentResults' as any, 
          params: { dialogueId: dialogue.dialogueId } 
        },
      ] as any,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>{t('speaking.loading')}</Text>
      </View>
    );
  }

  if (!dialogue) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>{t('speaking.loadError')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOrGenerateDialogue}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isEvaluating) {
    return (
      <View style={styles.evaluatingContainer}>
        <Icon name="check-circle" size={80} color="#4CAF50" />
        <Text style={styles.evaluatingTitle}>{t('speaking.complete')}</Text>
        <ActivityIndicator size="large" color="#667eea" style={styles.loader} />
        <Text style={styles.evaluatingText}>{t('speaking.evaluating')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t('speaking.title')}
        </Text>
        <Text style={styles.headerSubtitle}>
          {t('speaking.unifiedDialogue')}
        </Text>
      </View>

      {/* Dialogue Component */}
      {dialogue && (
        <SpeakingDialogueComponent
          dialogue={dialogue.turns}
          currentTurnIndex={dialogue.currentTurn}
          onComplete={handleDialogueComplete}
          onTurnComplete={handleTurnComplete}
          onNextTurn={handleNextTurn}
          level={level}
        />
      )}
    </View>
  );
};

// Helper Component for Score Display (Keeping for potential reuse, though results now show on separate screen)
const ScoreItem: React.FC<{ label: string; score: number; maxScore: number, t: any }> = ({
  label,
  score,
  maxScore,
  t,
}) => {
  const percentage = (score / maxScore) * 100;
  return (
    <View style={styles.scoreItem}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.scoreBarContainer}>
        <View style={[styles.scoreBar, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.scoreValue}>
        {t(`speaking.scoreRatio.${label}`, { score, max: maxScore })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  evaluatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  evaluatingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 24,
  },
  evaluatingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  loader: {
    marginTop: 24,
  },
  resultsContainer: {
    width: '100%',
    backgroundColor: '#fff',
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
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  scoresBreakdown: {
    marginBottom: 24,
  },
  scoreItem: {
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scoreBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 4,
  },
  scoreValue: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
    textAlign: 'right',
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  doneButton: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SpeakingAssessmentScreen;
