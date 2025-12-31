/**
 * Speaking Service
 * 
 * Handles speaking practice and assessment for the prep plan.
 * Integrates with Cloud Functions for dialogue generation and evaluation.
 */

import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import axios from 'axios';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import {
  SpeakingAssessmentDialogue,
  SpeakingDialogueTurn,
  SpeakingEvaluation,
} from '../types/prep-plan.types';
import { getActiveExamConfig } from '../config/active-exam.config';
import { ExamLanguage, ExamLevel } from '../config/exam-config.types';

const IS_DEV = __DEV__;
const testPath = (Platform.OS === 'android' ? 'http://10.0.2.2' : 'http://localhost') + ':5001/telc-b1-german/us-central1';
const CLOUD_FUNCTIONS_BASE_URL = IS_DEV ? testPath : 'https://us-central1-telc-b1-german.cloudfunctions.net';

class SpeakingService {
  /**
   * Get the user's speaking dialogues path based on the active exam config
   */
  private getSpeakingDialoguesPath(userId: string): string {
    const activeExamConfig = getActiveExamConfig();
    return activeExamConfig.firebaseCollections.speakingDialogues.replace('{uid}', userId);
  }

  /**
   * Generate a speaking dialogue for assessment or practice
   * Calls Cloud Function to generate AI-powered dialogue
   * 
   * @param level - Exam level
   * @param isTesting - If true, generates a short 2-turn dialogue for testing
   * @returns Speaking dialogue structure
   */
  async generateDialogue(
    level: ExamLevel
  ): Promise<SpeakingAssessmentDialogue> {
    try {
      const activeExamConfig = getActiveExamConfig();
      const language: ExamLanguage = activeExamConfig.language;

      console.log('[SpeakingService] Generating dialogue...', { level, language });

      // Call Cloud Function using axios
      const response = await axios.post(`${CLOUD_FUNCTIONS_BASE_URL}/generateSpeakingDialogue`, {
        level,
        language,
      });

      console.log('[SpeakingService] Cloud Function returned, processing response...');

      const { dialogueId, dialogue, estimatedMinutes } = response.data as {
        dialogueId: string;
        dialogue: any[];
        estimatedMinutes: number;
      };

      // Structure dialogue for app use
      const speakingDialogue: SpeakingAssessmentDialogue = {
        dialogueId,
        partNumber: 1, // Fixed for unified dialogue
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
      const errorMessage = error.response?.data?.error || error.message;
      throw new Error(`Failed to generate dialogue: ${errorMessage}`);
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
    level: ExamLevel,
    userId: string,
    dialogueId: string,
    turnNumber: number
  ): Promise<SpeakingEvaluation> {
    try {
      const activeExamConfig = getActiveExamConfig();
      const language: ExamLanguage = activeExamConfig.language;

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

      // Step 2: Call Cloud Function to evaluate using axios
      console.log('[SpeakingService] Calling evaluation function with audio:', audioUrl);
      console.log('--------------------------------------------------');
      console.log('DEBUG: Listen to your recording here:');
      console.log(audioUrl);
      console.log('--------------------------------------------------');

      const response = await axios.post(`${CLOUD_FUNCTIONS_BASE_URL}/evaluateSpeaking`, {
        audioUrl,
        expectedContext,
        level,
        language,
        dialogueId,
        turnNumber,
        userId,
      });

      const evaluation = response.data;

      // Map to our type structure
      const evaluationResult: SpeakingEvaluation = {
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

      console.log('[SpeakingService] Evaluation saved to Firestore (server-side)');

      // Update local dialogue state in Firestore for consolidated storage
      await firestore()
        .collection(this.getSpeakingDialoguesPath(userId))
        .doc(dialogueId)
        .get()
        .then(async (doc) => {
          if (doc.exists()) {
            const dialogue = doc.data() as SpeakingAssessmentDialogue;
            const updatedTurns = [...dialogue.turns];
            if (updatedTurns[turnNumber]) {
              updatedTurns[turnNumber] = {
                ...updatedTurns[turnNumber],
                transcription: evaluationResult.transcription,
                evaluation: evaluationResult,
                completed: true,
              };
              await doc.ref.update({ turns: updatedTurns });
            }
          }
        });

      return evaluationResult;
    } catch (error: any) {
      console.error('[SpeakingService] Error evaluating response:', error);
      const errorMessage = error.response?.data?.error || error.message;
      throw new Error(`Failed to evaluate response: ${errorMessage}`);
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
    const MAX_RETRIES = 3;
    const MAX_FILE_SIZE_MB = 10; // 10MB limit for audio files
    
    try {
      const filename = `turn-${turnNumber}.m4a`;
      const path = `users/${userId}/speaking-practice/${dialogueId}/${filename}`;

      console.log('[SpeakingService] Uploading audio...', { audioUri, path });

      // Check file size for debugging
      try {
        const cleanPath = audioUri.replace('file://', '');
        const fileInfo = await RNFS.stat(cleanPath);
        console.log(`[SpeakingService] Audio file size: ${fileInfo.size} bytes`);
        
        if (fileInfo.size < 5000) { // Less than 5KB is very suspicious for a recording
          console.warn('[SpeakingService] Audio file is extremely small, transcription may fail');
        }
      } catch (err) {
        console.warn('[SpeakingService] Could not check file size:', err);
      }

      // Validate file exists and size (optional, but good practice)
      // Note: react-native-nitro-sound doesn't provide file size info directly
      // We'll rely on Firebase Storage to handle this

      // Upload to Firebase Storage with retry logic
      const reference = storage().ref(path);
      
      // Set metadata with longer timeout
      const metadata = {
        contentType: 'audio/m4a',
        cacheControl: 'public, max-age=31536000', // 1 year
      };

      let lastError: any;
      
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`[SpeakingService] Upload attempt ${attempt}/${MAX_RETRIES}`);
          
          // Use putFile with metadata
          const uploadTask = reference.putFile(audioUri, metadata);
          
          // Monitor upload progress (optional, but helpful for debugging)
          uploadTask.on('state_changed', (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`[SpeakingService] Upload progress: ${progress.toFixed(1)}%`);
          });

          // Wait for upload to complete
          await uploadTask;
          
          console.log('[SpeakingService] Upload completed successfully');
          
          // Get download URL
          const downloadUrl = await reference.getDownloadURL();
          console.log('[SpeakingService] Download URL obtained:', downloadUrl);

          return downloadUrl;
          
        } catch (error: any) {
          lastError = error;
          console.error(`[SpeakingService] Upload attempt ${attempt} failed:`, error);
          
          // Check if it's a retry-limit error or network error
          if (error.code === 'storage/retry-limit-exceeded' || 
              error.code === 'storage/timeout' ||
              error.message?.includes('timeout') ||
              error.message?.includes('network')) {
            
            if (attempt < MAX_RETRIES) {
              // Exponential backoff: wait 2^attempt seconds
              const waitTime = Math.pow(2, attempt) * 1000;
              console.log(`[SpeakingService] Waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          }
          
          // For other errors, don't retry
          throw error;
        }
      }

      // If we get here, all retries failed
      throw lastError;

    } catch (error: any) {
      console.error('[SpeakingService] Error uploading audio:', error);
      
      // Provide more specific error messages
      if (error.code === 'storage/retry-limit-exceeded' || error.message?.includes('retry-limit')) {
        throw new Error('Upload timeout: Please check your internet connection and try again');
      } else if (error.code === 'storage/unauthorized') {
        throw new Error('Upload failed: Permission denied. Please check your login status');
      } else if (error.code === 'storage/canceled') {
        throw new Error('Upload was canceled');
      } else if (error.code === 'storage/unknown' || error.message?.includes('network')) {
        throw new Error('Upload failed: Network error. Please check your connection');
      }
      
      throw new Error(`Failed to upload audio: ${error.message}`);
    }
  }

  /**
   * Generate AI audio response (Text-to-Speech)
   * Uses Google Cloud TTS via Cloud Function (more reliable than client-side)
   * 
   * @param text - Text to convert to speech
   * @param level - Exam level (affects speaking speed)
   * @param language - Language name ('german', 'english', etc.)
   * @returns URL to generated audio
   */
  async generateAIAudio(
    text: string,
    level: ExamLevel,
    language: ExamLanguage
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

      const path = this.getSpeakingDialoguesPath(userId);
      await firestore()
        .collection(path)
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

      const path = this.getSpeakingDialoguesPath(userId);
      const doc = await firestore()
        .collection(path)
        .doc(dialogueId)
        .get();

      if (!doc.exists()) {
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

      // Get the dialogue document which now contains all turn evaluations
      const doc = await firestore()
        .collection(this.getSpeakingDialoguesPath(userId))
        .doc(dialogueId)
        .get();

      if (!doc.exists()) {
        throw new Error('Dialogue not found');
      }

      const dialogue = doc.data() as SpeakingAssessmentDialogue;
      const turns = dialogue.turns.filter(t => t.completed && t.evaluation);

      if (turns.length === 0) {
        throw new Error('No completed evaluations found for this dialogue');
      }

      const evaluations = turns.map(t => t.evaluation!);

      // Calculate averages
      const numEvaluations = evaluations.length;
      const avgScores = {
        pronunciation: 0,
        fluency: 0,
        grammarAccuracy: 0,
        vocabularyRange: 0,
        contentRelevance: 0,
      };

      evaluations.forEach((evaluation: SpeakingEvaluation) => {
        const scores = evaluation.scores;
        
        avgScores.pronunciation += Number(scores.pronunciation) || 0;
        avgScores.fluency += Number(scores.fluency) || 0;
        avgScores.grammarAccuracy += Number(scores.grammarAccuracy) || 0;
        avgScores.vocabularyRange += Number(scores.vocabularyRange) || 0;
        avgScores.contentRelevance += Number(scores.contentRelevance) || 0;
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

      evaluations.forEach((evaluation: SpeakingEvaluation) => {
        (evaluation.strengths || []).forEach((s: string) => {
          if (s && s.length > 5) {
            allStrengths.add(s.trim());
          }
        });
        (evaluation.areasToImprove || []).forEach((a: string) => {
          if (a && a.length > 5) {
            allAreasToImprove.add(a.trim());
          }
        });
      });

      // Simple fuzzy deduplication: if a sentence is a substring of another, keep only the longer one
      const deduplicate = (list: string[]) => {
        const sorted = [...list].sort((a, b) => b.length - a.length);
        const result: string[] = [];
        for (const item of sorted) {
          if (!result.some(r => r.toLowerCase().includes(item.toLowerCase()) || item.toLowerCase().includes(r.toLowerCase()))) {
            result.push(item);
          }
        }
        return result.slice(0, 5); // Limit to top 5 unique points
      };

      const overallEvaluation: SpeakingEvaluation = {
        transcription: 'Overall dialogue evaluation',
        scores: avgScores,
        totalScore: Math.round(totalScore * 10) / 10,
        feedback: `You completed ${numEvaluations} speaking exchanges. Your overall performance shows good progress!`,
        strengths: deduplicate(Array.from(allStrengths)),
        areasToImprove: deduplicate(Array.from(allAreasToImprove)),
      };

      // Mark dialogue as complete
      await doc.ref.update({
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

  /**
   * Get in-progress dialogue for a user
   */
  async getInProgressDialogue(userId: string): Promise<SpeakingAssessmentDialogue | null> {
    try {
      const path = this.getSpeakingDialoguesPath(userId);
      const snapshot = await firestore()
        .collection(path)
        .where('isComplete', '==', false)
        .orderBy('lastUpdated', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      return snapshot.docs[0].data() as SpeakingAssessmentDialogue;
    } catch (error: any) {
      console.error('[SpeakingService] Error getting in-progress dialogue:', error);
      return null;
    }
  }

  /**
   * List all dialogues for a user
   */
  async listDialogues(userId: string): Promise<SpeakingAssessmentDialogue[]> {
    try {
      const path = this.getSpeakingDialoguesPath(userId);
      const snapshot = await firestore()
        .collection(path)
        .orderBy('lastUpdated', 'desc')
        .get();

      return snapshot.docs.map(doc => doc.data() as SpeakingAssessmentDialogue);
    } catch (error: any) {
      console.error('[SpeakingService] Error listing dialogues:', error);
      return [];
    }
  }

  /**
   * Delete a dialogue and its associated audio files
   */
  async deleteDialogue(userId: string, dialogueId: string): Promise<void> {
    try {
      console.log('[SpeakingService] Deleting dialogue...', { userId, dialogueId });
      
      // 1. Delete Firestore document
      const path = this.getSpeakingDialoguesPath(userId);
      await firestore()
        .collection(path)
        .doc(dialogueId)
        .delete();

      // 2. Delete audio files from Storage
      const storagePath = `users/${userId}/speaking-practice/${dialogueId}`;
      const reference = storage().ref(storagePath);
      
      try {
        const listResult = await reference.listAll();
        await Promise.all(listResult.items.map(item => item.delete()));
      } catch (storageError) {
        console.warn('[SpeakingService] Error deleting audio files (they might not exist):', storageError);
      }

      console.log('[SpeakingService] Dialogue deleted successfully');
    } catch (error: any) {
      console.error('[SpeakingService] Error deleting dialogue:', error);
      throw new Error(`Failed to delete dialogue: ${error.message}`);
    }
  }
}

export const speakingService = new SpeakingService();
