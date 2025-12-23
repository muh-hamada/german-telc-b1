import * as admin from 'firebase-admin';
import { ProcessedQuestion } from '../types';

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
  const questionKey = `reading-part2-exam${examId}-index${questionIndex}`;

  try {
    const docRef = db.collection('video_generation_data').doc(appId);
    
    await docRef.set({
      processed_questions: {
        [questionKey]: {
          processed_at: admin.firestore.FieldValue.serverTimestamp(),
          ...metadata,
        },
      },
      last_processed: admin.firestore.FieldValue.serverTimestamp(),
      total_videos: admin.firestore.FieldValue.increment(1),
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
    const docSnap = await db.collection('video_generation_data').doc(appId).get();
    
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

