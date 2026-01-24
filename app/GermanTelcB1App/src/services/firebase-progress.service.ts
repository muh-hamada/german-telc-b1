import { UserProgress, ExamResult, ExamType, UserAnswer } from '../types/exam.types';
import FirestoreService from './firestore.service';
import { activeExamConfig } from '../config/active-exam.config';

class FirebaseProgressService {
  // Lazy-loaded to avoid initialization order issues
  private get examId(): string {
    return activeExamConfig.id;
  }
  
  // Sync progress to Firebase (no-op since we save directly to Firebase now)
  async syncProgressToFirebase(userId?: string): Promise<boolean> {
    // Progress is now saved directly to Firebase when exams are completed
    // This method is kept for backward compatibility but does nothing
    if (!userId) {
      console.log('No authenticated user for sync');
      return false;
    }
    console.log('Progress is already synced to Firebase');
    return true;
  }

  // Load progress from Firebase when user signs in
  async loadProgressFromFirebase(userId?: string): Promise<UserProgress | null> {
    try {
      if (!userId) {
        return null;
      }

      const firebaseProgress = await FirestoreService.getUserProgress(userId);
      return firebaseProgress;
    } catch (error) {
      console.error('Error loading progress from Firebase:', error);
      return null;
    }
  }

  // Migrate local progress to Firebase (for first-time sign-in)
  async migrateLocalProgress(userId: string, localProgress: UserProgress): Promise<boolean> {
    try {
      console.log('[FirebaseProgressService] Migrating local progress to Firebase for user:', userId);
      
      // Save the local progress directly to Firebase
      await FirestoreService.saveUserProgress(userId, localProgress);
      
      console.log('[FirebaseProgressService] Successfully migrated local progress to Firebase');
      return true;
    } catch (error) {
      console.error('[FirebaseProgressService] Error migrating local progress:', error);
      return false;
    }
  }

  // Merge local and Firebase progress, then save to Firebase
  async mergeAndSaveProgress(
    userId: string,
    localProgress: UserProgress,
    firebaseProgress: UserProgress
  ): Promise<UserProgress> {
    try {
      console.log('[FirebaseProgressService] Merging local and Firebase progress');
      
      // Use Firestore's merge logic to combine both progress objects
      const mergedProgress = this.mergeProgress(localProgress, firebaseProgress);
      
      // Save merged progress to Firebase
      await FirestoreService.saveUserProgress(userId, mergedProgress);
      
      console.log('[FirebaseProgressService] Successfully merged and saved progress');
      return mergedProgress;
    } catch (error) {
      console.error('[FirebaseProgressService] Error merging progress:', error);
      // Return Firebase progress as fallback
      return firebaseProgress;
    }
  }

  // Merge two progress objects (prioritize newer attempts)
  private mergeProgress(local: UserProgress, cloud: UserProgress): UserProgress {
    const mergedExams = [...cloud.exams];

    // Add or update local exams
    local.exams.forEach(localExam => {
      const existingIndex = mergedExams.findIndex(
        exam => exam.examId === localExam.examId && exam.examType === localExam.examType
      );

      if (existingIndex >= 0) {
        // Update existing exam if local is newer
        const localAttempt = localExam.lastAttempt ?? 0;
        const cloudAttempt = mergedExams[existingIndex].lastAttempt ?? 0;
        
        // Merge historical results from both sources
        const mergedHistoricalResults = this.mergeHistoricalResults(
          mergedExams[existingIndex].historicalResults,
          localExam.historicalResults
        );
        
        if (localAttempt > cloudAttempt) {
          mergedExams[existingIndex] = {
            ...localExam,
            historicalResults: mergedHistoricalResults,
          };
        } else {
          // Keep cloud exam but merge historical results
          mergedExams[existingIndex] = {
            ...mergedExams[existingIndex],
            historicalResults: mergedHistoricalResults,
          };
        }
      } else {
        // Add new exam
        mergedExams.push(localExam);
      }
    });

    // Recalculate totals
    const totalScore = mergedExams.reduce((sum, exam) => sum + (exam.score || 0), 0);
    const totalMaxScore = mergedExams.reduce((sum, exam) => sum + (exam.maxScore || 0), 0);

    // Merge historical total scores
    const mergedHistoricalTotalScores = this.mergeHistoricalTotalScores(
      cloud.historicalTotalScores,
      local.historicalTotalScores
    );

    return {
      exams: mergedExams,
      totalScore,
      totalMaxScore,
      lastUpdated: Math.max(local.lastUpdated, cloud.lastUpdated),
      historicalTotalScores: mergedHistoricalTotalScores,
    };
  }

  // Merge historical results from two sources, removing duplicates by timestamp
  private mergeHistoricalResults(
    arr1?: { timestamp: number; score: number; maxScore: number }[],
    arr2?: { timestamp: number; score: number; maxScore: number }[]
  ): { timestamp: number; score: number; maxScore: number }[] | undefined {
    if (!arr1 && !arr2) return undefined;
    const combined = [...(arr1 || []), ...(arr2 || [])];
    // Remove duplicates by timestamp and sort by timestamp
    const uniqueByTimestamp = Array.from(
      new Map(combined.map(item => [item.timestamp, item])).values()
    );
    return uniqueByTimestamp.sort((a, b) => a.timestamp - b.timestamp);
  }

  // Merge historical total scores from two sources, removing duplicates by timestamp
  private mergeHistoricalTotalScores(
    arr1?: { timestamp: number; totalScore: number; totalMaxScore: number }[],
    arr2?: { timestamp: number; totalScore: number; totalMaxScore: number }[]
  ): { timestamp: number; totalScore: number; totalMaxScore: number }[] | undefined {
    if (!arr1 && !arr2) return undefined;
    const combined = [...(arr1 || []), ...(arr2 || [])];
    // Remove duplicates by timestamp and sort by timestamp
    const uniqueByTimestamp = Array.from(
      new Map(combined.map(item => [item.timestamp, item])).values()
    );
    return uniqueByTimestamp.sort((a, b) => a.timestamp - b.timestamp);
  }

  // Save exam result to Firebase only
  async saveExamResult(
    examType: ExamType,
    examId: string,
    result: ExamResult,
    userId?: string
  ): Promise<boolean> {
    try {
      if (!userId) {
        console.error('Cannot save exam result: User not authenticated');
        return false;
      }

      // Convert ExamResult answers to UserAnswer format
      const userAnswers = result.answers.map(ans => ({
        questionId: ans.questionId,
        answer: ans.answer,
        isCorrect: ans.isCorrect,
        timestamp: result.timestamp,
      }));
      
      await FirestoreService.updateExamProgress(
        userId,
        examType,
        examId,
        userAnswers,
        result.score,
        result.maxScore
      );
      console.log('Exam result saved to Firebase');
      return true;
    } catch (error) {
      console.error('Error saving exam result to Firebase:', error);
      return false;
    }
  }

  async updateExamProgress(
    userId: string,
    examType: string,
    examId: string,
    answers: UserAnswer[],
    score?: number,
    maxScore?: number,
    completed: boolean = true
  ): Promise<boolean> {
    try {
        await FirestoreService.updateExamProgress(
            userId,
            examType,
            examId,
            answers,
            score,
            maxScore,
            completed
        );
        return true;
    } catch (error) {
        console.error('Error updating exam progress in Firebase:', error);
        return false;
    }
  }

  // Clear all progress from Firebase only
  async clearAllProgress(userId?: string): Promise<boolean> {
    try {
      if (!userId) {
        console.error('Cannot clear progress: User not authenticated');
        return false;
      }

      await FirestoreService.deleteUserData(userId);
      console.log('Firebase progress cleared');
      return true;
    } catch (error) {
      console.error('Error clearing Firebase progress:', error);
      return false;
    }
  }

}

export default new FirebaseProgressService();
