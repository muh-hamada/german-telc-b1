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

export const SpeakingAssessmentScreen: React.FC = () => {
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
  const partNumber = 1; // Start with Part 1 (Personal Introduction)

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
        partNumber,
      });

      // Generate new dialogue
      console.log('[SpeakingAssessmentScreen] Generating dialogue...');
      const newDialogue = await speakingService.generateDialogue(level, partNumber);

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

      // Evaluate the user's response
      const evaluation = await speakingService.evaluateResponse(
        audioPath,
        currentTurn.text,
        level,
        user.uid,
        dialogue.dialogueId,
        turnIndex
      );

      console.log('[SpeakingAssessmentScreen] Turn evaluated:', evaluation);

      // Update dialogue state
      const updatedDialogue = {
        ...dialogue,
        currentTurn: turnIndex + 1,
        turns: dialogue.turns.map((turn, idx) =>
          idx === turnIndex
            ? { ...turn, userTranscription: evaluation.transcription }
            : turn
        ),
      };

      setDialogue(updatedDialogue);

      // Save progress
      await speakingService.saveDialogueProgress(user.uid, updatedDialogue);

      logEvent(AnalyticsEvents.PREP_PLAN_SPEAKING_TURN_COMPLETED, {
        turnIndex,
        score: evaluation.totalScore,
      });

    } catch (error: any) {
      console.error('[SpeakingAssessmentScreen] Error processing turn:', error);
      Alert.alert(
        t('speaking.error'),
        error.message || t('speaking.processingError')
      );
    }
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
      Alert.alert(
        t('speaking.error'),
        error.message || t('speaking.completionError')
      );
      setIsEvaluating(false);
    }
  };

  const showFinalResults = (evaluation: SpeakingEvaluation) => {
    Alert.alert(
      t('speaking.complete'),
      t('speaking.finalScoreMessage', { score: evaluation.totalScore, feedback: evaluation.feedback }),
      [
        {
          text: t('speaking.viewDetails'),
          onPress: () => {
            // Navigate to detailed results screen or show in modal
            navigation.goBack();
          },
        },
        {
          text: t('common.done'),
          onPress: () => navigation.goBack(),
        },
      ]
    );
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

  if (isEvaluating || finalEvaluation) {
    return (
      <View style={styles.evaluatingContainer}>
        <Icon name="check-circle" size={80} color="#4CAF50" />
        <Text style={styles.evaluatingTitle}>{t('speaking.complete')}</Text>
        {isEvaluating && (
          <>
            <ActivityIndicator size="large" color="#667eea" style={styles.loader} />
            <Text style={styles.evaluatingText}>{t('speaking.evaluating')}</Text>
          </>
        )}
        {finalEvaluation && (
          <View style={styles.resultsContainer}>
            <Text style={styles.scoreText}>
              {t('speaking.scoreOutOf100', { score: finalEvaluation.totalScore })}
            </Text>
            <View style={styles.scoresBreakdown}>
              <ScoreItem
                label={t('speaking.pronunciation')}
                score={finalEvaluation.scores.pronunciation}
                maxScore={20}
                t={t}
              />
              <ScoreItem
                label={t('speaking.fluency')}
                score={finalEvaluation.scores.fluency}
                maxScore={20}
                t={t}
              />
              <ScoreItem
                label={t('speaking.grammar')}
                score={finalEvaluation.scores.grammarAccuracy}
                maxScore={20}
                t={t}
              />
              <ScoreItem
                label={t('speaking.vocabulary')}
                score={finalEvaluation.scores.vocabularyRange}
                maxScore={20}
                t={t}
              />
              <ScoreItem
                label={t('speaking.content')}
                score={finalEvaluation.scores.contentRelevance}
                maxScore={20}
                t={t}
              />
            </View>
            <Text style={styles.feedbackTitle}>{t('speaking.feedback')}</Text>
            <Text style={styles.feedbackText}>{finalEvaluation.feedback}</Text>

            {finalEvaluation.strengths.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>{t('speaking.strengths')}</Text>
                {finalEvaluation.strengths.map((strength, idx) => (
                  <Text key={idx} style={styles.bulletPoint}>
                    • {strength}
                  </Text>
                ))}
              </>
            )}

            {finalEvaluation.areasToImprove.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>{t('speaking.areasToImprove')}</Text>
                {finalEvaluation.areasToImprove.map((area, idx) => (
                  <Text key={idx} style={styles.bulletPoint}>
                    • {area}
                  </Text>
                ))}
              </>
            )}

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.doneButtonText}>{t('common.done')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t('speaking.part')} {partNumber}
        </Text>
        <Text style={styles.headerSubtitle}>
          {t('speaking.personalIntroduction')}
        </Text>
      </View>

      {/* Dialogue Component */}
      <SpeakingDialogueComponent
        dialogue={dialogue.turns}
        onComplete={handleDialogueComplete}
        onTurnComplete={handleTurnComplete}
        level={level}
      />
    </View>
  );
};

// Helper Component for Score Display
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
