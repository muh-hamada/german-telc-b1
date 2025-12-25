/**
 * Speaking Service
 * 
 * Handles speaking practice and assessment for the prep plan.
 * Integrates with Cloud Functions for dialogue generation and evaluation.
 */

import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import functions from '@react-native-firebase/functions';
import {
  SpeakingAssessmentDialogue,
  SpeakingDialogueTurn,
  SpeakingEvaluation,
} from '../types/prep-plan.types';
import { getActiveExamConfig } from '../config/active-exam.config';

class SpeakingService {
  /**
   * Generate a speaking dialogue for assessment or practice
   * Calls Cloud Function to generate AI-powered dialogue
   * 
   * @param level - Exam level (A1, B1, B2)
   * @param partNumber - Speaking part (1, 2, or 3)
   * @returns Speaking dialogue structure
   */
  async generateDialogue(
    level: 'A1' | 'B1' | 'B2',
    partNumber: 1 | 2 | 3
  ): Promise<SpeakingAssessmentDialogue> {
    try {
      const activeExamConfig = getActiveExamConfig();
      const language = activeExamConfig.language; // 'de' or 'en'

      console.log('[SpeakingService] Generating dialogue...', { level, partNumber, language });

      // Call Cloud Function
      const generateDialogueFn = functions().httpsCallable('generateSpeakingDialogue');
      const result = await generateDialogueFn({
        level,
        partNumber,
        language,
      });

      const { dialogueId, dialogue, estimatedMinutes } = result.data;

      // Structure dialogue for app use
      const speakingDialogue: SpeakingAssessmentDialogue = {
        dialogueId,
        partNumber,
        level,
        turns: dialogue as SpeakingDialogueTurn[],
        totalTurns: dialogue.length,
        currentTurn: 0,
        isComplete: false,
        estimatedMinutes,
      };

      return speakingDialogue;
    } catch (error: any) {
      console.error('[SpeakingService] Error generating dialogue:', error);
      throw new Error(`Failed to generate dialogue: ${error.message}`);
    }
  }

  /**
   * Evaluate user's speaking response
   * Uploads audio, transcribes it, and gets AI evaluation
   * 
   * @param audioUri - Local audio file URI
   * @param expectedContext - Context for what should be said
   * @param level - Exam level
   * @param userId - User ID
   * @param dialogueId - Dialogue ID
   * @param turnNumber - Turn number
   * @returns Evaluation with scores and feedback
   */
  async evaluateResponse(
    audioUri: string,
    expectedContext: string,
    level: 'A1' | 'B1' | 'B2',
    userId: string,
    dialogueId: string,
    turnNumber: number
  ): Promise<SpeakingEvaluation> {
    try {
      const activeExamConfig = getActiveExamConfig();
      const language = activeExamConfig.language;

      console.log('[SpeakingService] Evaluating response...', {
        audioUri,
        expectedContext,
        level,
        userId,
        dialogueId,
        turnNumber,
      });

      // Step 1: Upload audio to Firebase Storage
      const audioUrl = await this.uploadAudio(audioUri, userId, dialogueId, turnNumber);

      // Step 2: Call Cloud Function to evaluate
      const evaluateSpeakingFn = functions().httpsCallable('evaluateSpeaking');
      const result = await evaluateSpeakingFn({
        audioUrl,
        expectedContext,
        level,
        language,
        dialogueId,
        turnNumber,
      });

      const evaluation = result.data as any;

      // Map to our type structure
      return {
        transcription: evaluation.transcription,
        scores: {
          pronunciation: evaluation.pronunciation,
          fluency: evaluation.fluency,
          grammarAccuracy: evaluation.grammar,
          vocabularyRange: evaluation.vocabulary,
          contentRelevance: evaluation.contentRelevance,
        },
        totalScore: evaluation.overallScore,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        areasToImprove: evaluation.areasToImprove,
      };
    } catch (error: any) {
      console.error('[SpeakingService] Error evaluating response:', error);
      throw new Error(`Failed to evaluate response: ${error.message}`);
    }
  }

  /**
   * Upload audio file to Firebase Storage
   * 
   * @param audioUri - Local audio file URI
   * @param userId - User ID
   * @param dialogueId - Dialogue ID
   * @param turnNumber - Turn number in dialogue
   * @returns URL to uploaded audio
   */
  async uploadAudio(
    audioUri: string,
    userId: string,
    dialogueId: string,
    turnNumber: number
  ): Promise<string> {
    try {
      const filename = `turn-${turnNumber}.m4a`;
      const path = `users/${userId}/speaking-practice/${dialogueId}/${filename}`;

      console.log('[SpeakingService] Uploading audio...', { audioUri, path });

      // Upload to Firebase Storage
      const reference = storage().ref(path);
      await reference.putFile(audioUri);

      // Get download URL
      const downloadUrl = await reference.getDownloadURL();

      console.log('[SpeakingService] Audio uploaded successfully:', downloadUrl);

      return downloadUrl;
    } catch (error: any) {
      console.error('[SpeakingService] Error uploading audio:', error);
      throw new Error(`Failed to upload audio: ${error.message}`);
    }
  }

  /**
   * Generate AI audio response (Text-to-Speech)
   * Uses Google Cloud TTS via Cloud Function (more reliable than client-side)
   * 
   * @param text - Text to convert to speech
   * @param level - Exam level (affects speaking speed)
   * @param language - Language code ('de' or 'en')
   * @returns URL to generated audio
   */
  async generateAIAudio(
    text: string,
    level: 'A1' | 'B1' | 'B2',
    language: 'de' | 'en'
  ): Promise<string> {
    try {
      // For now, return empty string - AI audio will be generated server-side
      // and embedded in the dialogue turns when they're created
      console.log('[SpeakingService] AI audio generation handled server-side');
      return '';
    } catch (error: any) {
      console.error('[SpeakingService] Error generating AI audio:', error);
      throw new Error(`Failed to generate AI audio: ${error.message}`);
    }
  }

  /**
   * Save dialogue progress to Firestore
   * Saves the current state of the dialogue including completed turns
   * 
   * @param userId - User ID
   * @param dialogue - Current dialogue state
   */
  async saveDialogueProgress(
    userId: string,
    dialogue: SpeakingAssessmentDialogue
  ): Promise<void> {
    try {
      console.log('[SpeakingService] Saving dialogue progress...', {
        userId,
        dialogueId: dialogue.dialogueId,
        currentTurn: dialogue.currentTurn,
      });

      await firestore()
        .collection('users')
        .doc(userId)
        .collection('speaking-dialogues')
        .doc(dialogue.dialogueId)
        .set(
          {
            ...dialogue,
            lastUpdated: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

      console.log('[SpeakingService] Dialogue progress saved successfully');
    } catch (error: any) {
      console.error('[SpeakingService] Error saving dialogue progress:', error);
      throw new Error(`Failed to save dialogue progress: ${error.message}`);
    }
  }

  /**
   * Load dialogue progress from Firestore
   * Retrieves a previously saved dialogue to allow resuming
   * 
   * @param userId - User ID
   * @param dialogueId - Dialogue ID
   * @returns Dialogue state or null if not found
   */
  async loadDialogueProgress(
    userId: string,
    dialogueId: string
  ): Promise<SpeakingAssessmentDialogue | null> {
    try {
      console.log('[SpeakingService] Loading dialogue progress...', {
        userId,
        dialogueId,
      });

      const doc = await firestore()
        .collection('users')
        .doc(userId)
        .collection('speaking-dialogues')
        .doc(dialogueId)
        .get();

      if (!doc.exists) {
        console.log('[SpeakingService] No saved dialogue found');
        return null;
      }

      const dialogue = doc.data() as SpeakingAssessmentDialogue;
      console.log('[SpeakingService] Dialogue progress loaded successfully');

      return dialogue;
    } catch (error: any) {
      console.error('[SpeakingService] Error loading dialogue progress:', error);
      throw new Error(`Failed to load dialogue progress: ${error.message}`);
    }
  }

  /**
   * Complete dialogue and calculate final evaluation
   * Combines all turn evaluations into a comprehensive assessment
   * 
   * @param userId - User ID
   * @param dialogueId - Dialogue ID
   * @returns Overall dialogue evaluation
   */
  async completeDialogue(
    userId: string,
    dialogueId: string
  ): Promise<SpeakingEvaluation> {
    try {
      console.log('[SpeakingService] Completing dialogue...', {
        userId,
        dialogueId,
      });

      // Get all turn evaluations for this dialogue
      const evaluationsSnapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('speaking-evaluations')
        .where('dialogueId', '==', dialogueId)
        .get();

      if (evaluationsSnapshot.empty) {
        throw new Error('No evaluations found for this dialogue');
      }

      const evaluations = evaluationsSnapshot.docs.map(doc => doc.data());

      // Calculate averages
      const numEvaluations = evaluations.length;
      const avgScores = {
        pronunciation: 0,
        fluency: 0,
        grammarAccuracy: 0,
        vocabularyRange: 0,
        contentRelevance: 0,
      };

      evaluations.forEach((evaluation: any) => {
        avgScores.pronunciation += evaluation.pronunciation || 0;
        avgScores.fluency += evaluation.fluency || 0;
        avgScores.grammarAccuracy += evaluation.grammar || 0;
        avgScores.vocabularyRange += evaluation.vocabulary || 0;
        avgScores.contentRelevance += evaluation.contentRelevance || 0;
      });

      Object.keys(avgScores).forEach((key) => {
        avgScores[key as keyof typeof avgScores] =
          Math.round((avgScores[key as keyof typeof avgScores] / numEvaluations) * 10) / 10;
      });

      const totalScore =
        avgScores.pronunciation +
        avgScores.fluency +
        avgScores.grammarAccuracy +
        avgScores.vocabularyRange +
        avgScores.contentRelevance;

      // Collect all strengths and areas to improve (deduplicated)
      const allStrengths = new Set<string>();
      const allAreasToImprove = new Set<string>();

      evaluations.forEach((evaluation: any) => {
        (evaluation.strengths || []).forEach((s: string) => allStrengths.add(s));
        (evaluation.areasToImprove || []).forEach((a: string) => allAreasToImprove.add(a));
      });

      const overallEvaluation: SpeakingEvaluation = {
        transcription: 'Overall dialogue evaluation',
        scores: avgScores,
        totalScore: Math.round(totalScore * 10) / 10,
        feedback: `You completed ${numEvaluations} speaking exchanges. Your overall performance shows good progress!`,
        strengths: Array.from(allStrengths),
        areasToImprove: Array.from(allAreasToImprove),
      };

      // Mark dialogue as complete
      await firestore()
        .collection('users')
        .doc(userId)
        .collection('speaking-dialogues')
        .doc(dialogueId)
        .update({
          isComplete: true,
          overallEvaluation,
          completedAt: firestore.FieldValue.serverTimestamp(),
        });

      console.log('[SpeakingService] Dialogue completed successfully');

      return overallEvaluation;
    } catch (error: any) {
      console.error('[SpeakingService] Error completing dialogue:', error);
      throw new Error(`Failed to complete dialogue: ${error.message}`);
    }
  }
}

export const speakingService = new SpeakingService();
