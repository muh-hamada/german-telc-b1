import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { ProcessedQuestion, ProcessedVocabulary } from '../types';

// Configuration from environment variables
const EXAM_DOCUMENT = process.env.EXAM_DOCUMENT || 'reading-part2';
const TRACKING_COLLECTION = process.env.TRACKING_COLLECTION || 'video_generation_data';

/**
 * Mark a question as processed with metadata
 */
export async function markQuestionProcessed(
  appId: string,
  examId: number,
  questionIndex: number,
  metadata: Partial<ProcessedQuestion>
): Promise<void> {
  const db = admin.firestore();
  const questionKey = `${EXAM_DOCUMENT}-exam${examId}-index${questionIndex}`;

  try {
    const docRef = db.collection(TRACKING_COLLECTION).doc(appId);
    
    await docRef.set({
      processed_questions: {
        [questionKey]: {
          processed_at: FieldValue.serverTimestamp(),
          ...metadata,
        },
      },
      last_processed: FieldValue.serverTimestamp(),
      total_videos: FieldValue.increment(1),
    }, { merge: true });

    console.log(`Marked ${questionKey} as processed`);
  } catch (error) {
    console.error('Error marking question as processed:', error);
    throw error;
  }
}

/**
 * Mark a question as failed with error details
 */
export async function markQuestionFailed(
  appId: string,
  examId: number,
  questionIndex: number,
  error: string,
  processingTimeMs: number
): Promise<void> {
  await markQuestionProcessed(appId, examId, questionIndex, {
    error,
    processing_time_ms: processingTimeMs,
    duration_seconds: 0,
  });
}

/**
 * Get processing statistics for an app
 */
export async function getProcessingStats(appId: string): Promise<{
  total_videos: number;
  last_processed: Date | null;
  processed_count: number;
}> {
  const db = admin.firestore();
  
  try {
    const docSnap = await db.collection(TRACKING_COLLECTION).doc(appId).get();
    
    if (!docSnap.exists) {
      return {
        total_videos: 0,
        last_processed: null,
        processed_count: 0,
      };
    }

    const data = docSnap.data()!;
    const processedQuestions = data.processed_questions || {};
    
    return {
      total_videos: data.total_videos || 0,
      last_processed: data.last_processed?.toDate() || null,
      processed_count: Object.keys(processedQuestions).length,
    };
  } catch (error) {
    console.error('Error getting processing stats:', error);
    throw error;
  }
}

/**
 * Mark a vocabulary word as processed with metadata
 */
export async function markVocabularyProcessed(
  appId: string,
  wordId: string,
  word: string,
  metadata: Partial<ProcessedVocabulary>
): Promise<void> {
  const db = admin.firestore();

  try {
    const docRef = db.collection(TRACKING_COLLECTION).doc(appId);
    
    await docRef.set({
      processed_vocabulary: {
        [wordId]: {
          word,
          processed_at: FieldValue.serverTimestamp(),
          ...metadata,
        },
      },
      last_vocabulary_processed: FieldValue.serverTimestamp(),
      total_vocabulary_videos: FieldValue.increment(1),
    }, { merge: true });

    console.log(`Marked vocabulary word ${word} (${wordId}) as processed`);
  } catch (error) {
    console.error('Error marking vocabulary as processed:', error);
    throw error;
  }
}

/**
 * Mark a vocabulary word as failed with error details
 * NOTE: This does NOT add it to processed_vocabulary so it can be retried
 */
export async function markVocabularyFailed(
  appId: string,
  wordId: string,
  word: string,
  error: string,
  processingTimeMs: number
): Promise<void> {
  const db = admin.firestore();

  try {
    const docRef = db.collection(TRACKING_COLLECTION).doc(appId);
    
    // Store in a separate 'failed_vocabulary' field so it can be retried
    await docRef.set({
      failed_vocabulary: {
        [wordId]: {
          word,
          failed_at: FieldValue.serverTimestamp(),
          error,
          processing_time_ms: processingTimeMs,
          retry_count: FieldValue.increment(1),
        },
      },
    }, { merge: true });

    console.log(`Marked vocabulary word ${word} (${wordId}) as failed - will be retried`);
  } catch (trackingError) {
    console.error('Error marking vocabulary as failed:', trackingError);
    throw trackingError;
  }
}

/**
 * Get vocabulary processing statistics for an app
 */
export async function getVocabularyStats(appId: string): Promise<{
  total_vocabulary_videos: number;
  last_vocabulary_processed: Date | null;
  processed_vocabulary_count: number;
}> {
  const db = admin.firestore();
  
  try {
    const docSnap = await db.collection(TRACKING_COLLECTION).doc(appId).get();
    
    if (!docSnap.exists) {
      return {
        total_vocabulary_videos: 0,
        last_vocabulary_processed: null,
        processed_vocabulary_count: 0,
      };
    }

    const data = docSnap.data()!;
    const processedVocabulary = data.processed_vocabulary || {};
    
    return {
      total_vocabulary_videos: data.total_vocabulary_videos || 0,
      last_vocabulary_processed: data.last_vocabulary_processed?.toDate() || null,
      processed_vocabulary_count: Object.keys(processedVocabulary).length,
    };
  } catch (error) {
    console.error('Error getting vocabulary stats:', error);
    throw error;
  }
}

