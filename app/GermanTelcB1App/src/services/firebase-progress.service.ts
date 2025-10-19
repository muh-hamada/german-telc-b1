import { UserProgress, ExamResult, ExamType, ExamProgress } from '../types/exam.types';
import storageService from './storage.service';
import FirestoreService from './firestore.service';

class FirebaseProgressService {
  // Sync local progress to Firebase when user is authenticated
  async syncProgressToFirebase(userId?: string): Promise<boolean> {
    try {
      if (!userId) {
        console.log('No authenticated user, skipping Firebase sync');
        return false;
      }

      // Get local progress
      const localProgress = await storageService.getUserProgress() || {};
      if (!localProgress) {
        console.log('No local progress to sync');
        return true;
      }

      // Sync to Firebase
      await FirestoreService.saveUserProgress(userId, localProgress as UserProgress);
      console.log('Progress synced to Firebase successfully');
      return true;
    } catch (error) {
      console.error('Error syncing progress to Firebase:', error);
      return false;
    }
  }

  // Load progress from Firebase when user signs in
  async loadProgressFromFirebase(userId?: string): Promise<UserProgress | null> {
    try {
      if (!userId) {
        return null;
      }

      const firebaseProgress = await FirestoreService.getUserProgress(userId);
      if (firebaseProgress) {
        // Save to local storage as well
        await storageService.saveUserProgress(firebaseProgress);
        return firebaseProgress;
      }
      return null;
    } catch (error) {
      console.error('Error loading progress from Firebase:', error);
      return null;
    }
  }

  // Save exam result to both local storage and Firebase
  async saveExamResult(
    examType: ExamType,
    examId: number,
    result: ExamResult,
    userId?: string
  ): Promise<boolean> {
    try {
      // Save to local storage first
      const localSuccess = await this.saveToLocalStorage(examType, examId, result);
      
      // Try to save to Firebase if user is authenticated
      if (userId) {
        try {
          // Convert ExamResult answers to UserAnswer format
          const userAnswers = result.answers.map(ans => ({
            questionId: ans.questionId,
            answer: ans.userAnswer,
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
        } catch (firebaseError) {
          console.warn('Failed to save to Firebase, but local save succeeded:', firebaseError);
        }
      }

      return localSuccess;
    } catch (error) {
      console.error('Error saving exam result:', error);
      return false;
    }
  }

  // Save to local storage
  private async saveToLocalStorage(
    examType: ExamType,
    examId: number,
    result: ExamResult
  ): Promise<boolean> {
    try {
      let currentProgress = await storageService.loadUserProgress();
      
      if (!currentProgress) {
        currentProgress = {
          exams: [],
          totalScore: 0,
          totalMaxScore: 0,
          lastUpdated: Date.now(),
        };
      }
      
      // Find existing exam progress or create new
      const existingIndex = currentProgress.exams.findIndex(
        e => e.examId === examId && e.examType === examType
      );
      
      const examProgress: ExamProgress = {
        examId,
        examType,
        answers: result.answers.map(ans => ({
          questionId: ans.questionId,
          answer: ans.userAnswer,
          isCorrect: ans.isCorrect,
          timestamp: result.timestamp,
        })),
        completed: true,
        score: result.score,
        maxScore: result.maxScore,
        lastAttempt: result.timestamp,
      };
      
      if (existingIndex === -1) {
        currentProgress.exams.push(examProgress);
      } else {
        currentProgress.exams[existingIndex] = examProgress;
      }
      
      // Recalculate totals
      currentProgress.totalScore = currentProgress.exams.reduce((sum, exam) => sum + (exam.score || 0), 0);
      currentProgress.totalMaxScore = currentProgress.exams.reduce((sum, exam) => sum + (exam.maxScore || 0), 0);
      currentProgress.lastUpdated = Date.now();
      
      return await storageService.saveUserProgress(currentProgress);
    } catch (error) {
      console.error('Error saving to local storage:', error);
      return false;
    }
  }

  // Merge local and Firebase progress
  async mergeProgress(userId?: string): Promise<UserProgress | null> {
    try {
      if (!userId) {
        // No user, just return local progress
        const localProgress = await storageService.getUserProgress();
        return localProgress;
      }

      const localProgress = await storageService.getUserProgress();
      const firebaseProgress = await FirestoreService.getUserProgress(userId);

      if (!firebaseProgress) {
        // No Firebase progress, save local to Firebase if it exists
        if (localProgress) {
          await FirestoreService.saveUserProgress(userId, localProgress);
        }
        return localProgress;
      }

      if (!localProgress) {
        // No local progress, just return Firebase progress
        await storageService.saveUserProgress(firebaseProgress);
        return firebaseProgress;
      }

      // Merge progress (Firebase takes precedence for conflicts)
      const mergedProgress = this.mergeProgressData(localProgress, firebaseProgress);
      
      // Save merged progress to both local and Firebase
      await storageService.saveUserProgress(mergedProgress);
      await FirestoreService.saveUserProgress(userId, mergedProgress);
      
      return mergedProgress;
    } catch (error) {
      console.error('Error merging progress:', error);
      // Return local progress as fallback
      try {
        return await storageService.getUserProgress();
      } catch (storageError) {
        console.error('Error getting local progress as fallback:', storageError);
        return null;
      }
    }
  }

  // Merge local and Firebase progress data
  private mergeProgressData(local: UserProgress, firebase: UserProgress): UserProgress {
    // Start with Firebase progress as base
    const merged: UserProgress = {
      ...firebase,
      exams: [...firebase.exams],
    };

    // Add or merge local exams
    local.exams.forEach(localExam => {
      const existingIndex = merged.exams.findIndex(
        e => e.examId === localExam.examId && e.examType === localExam.examType
      );

      if (existingIndex === -1) {
        // Exam doesn't exist in Firebase, add it
        merged.exams.push(localExam);
      } else {
        // Exam exists, keep the one with the latest attempt
        const firebaseExam = merged.exams[existingIndex];
        if (localExam.lastAttempt > firebaseExam.lastAttempt) {
          merged.exams[existingIndex] = localExam;
        }
      }
    });

    // Recalculate totals
    merged.totalScore = merged.exams.reduce((sum, exam) => sum + (exam.score || 0), 0);
    merged.totalMaxScore = merged.exams.reduce((sum, exam) => sum + (exam.maxScore || 0), 0);
    merged.lastUpdated = Math.max(local.lastUpdated, firebase.lastUpdated);

    return merged;
  }

  // Clear all progress (local and Firebase)
  async clearAllProgress(userId?: string): Promise<boolean> {
    try {
      // Clear local progress
      const localSuccess = await storageService.clearUserProgress();
      
      // Clear Firebase progress if user is authenticated
      if (userId) {
        try {
          await FirestoreService.deleteUserData(userId);
          console.log('Firebase progress cleared');
        } catch (firebaseError) {
          console.warn('Failed to clear Firebase progress:', firebaseError);
        }
      }

      return localSuccess;
    } catch (error) {
      console.error('Error clearing progress:', error);
      return false;
    }
  }

  // Check if user has unsynced progress
  async hasUnsyncedProgress(userId?: string): Promise<boolean> {
    try {
      if (!userId) {
        return false; // No user, no sync needed
      }

      const localProgress = await storageService.getUserProgress();
      if (!localProgress) {
        return false; // No local progress
      }

      const firebaseProgress = await FirestoreService.getUserProgress(userId);
      if (!firebaseProgress) {
        return true; // Has local progress but no Firebase progress
      }

      // Check if local progress is newer than Firebase
      const localLastUpdated = localProgress.lastUpdated || 0;
      const firebaseLastUpdated = firebaseProgress.lastUpdated || 0;

      return localLastUpdated > firebaseLastUpdated;
    } catch (error) {
      console.error('Error checking unsynced progress:', error);
      return false;
    }
  }
}

export default new FirebaseProgressService();
