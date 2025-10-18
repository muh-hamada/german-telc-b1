import { UserProgress, ExamResult, ExamType } from '../types/exam.types';
import { storageService } from './storage.service';
import FirestoreService from './firestore.service';
import { useAuth } from '../contexts/AuthContext';

class FirebaseProgressService {
  // Sync local progress to Firebase when user is authenticated
  async syncProgressToFirebase(): Promise<boolean> {
    try {
      // Get current user from auth context
      const { user } = useAuth();
      if (!user) {
        console.log('No authenticated user, skipping Firebase sync');
        return false;
      }

      // Get local progress
      const localProgress = await storageService.loadUserProgress();
      if (!localProgress) {
        console.log('No local progress to sync');
        return true;
      }

      // Sync to Firebase
      await FirestoreService.saveUserProgress(user.uid, localProgress);
      console.log('Progress synced to Firebase successfully');
      return true;
    } catch (error) {
      console.error('Error syncing progress to Firebase:', error);
      return false;
    }
  }

  // Load progress from Firebase when user signs in
  async loadProgressFromFirebase(): Promise<UserProgress | null> {
    try {
      const { user } = useAuth();
      if (!user) {
        return null;
      }

      const firebaseProgress = await FirestoreService.getUserProgress(user.uid);
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
    result: ExamResult
  ): Promise<boolean> {
    try {
      // Save to local storage first
      const localSuccess = await this.saveToLocalStorage(examType, examId, result);
      
      // Try to save to Firebase if user is authenticated
      const { user } = useAuth();
      if (user) {
        try {
          await FirestoreService.updateExamProgress(
            user.uid,
            examType,
            examId,
            result.userAnswers,
            result.score,
            result.total
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
      const currentProgress = await storageService.loadUserProgress() || {};
      
      if (!currentProgress[examType]) {
        currentProgress[examType] = {};
      }
      if (!currentProgress[examType][examId]) {
        currentProgress[examType][examId] = [];
      }
      
      currentProgress[examType][examId].push(result);
      
      return await storageService.saveUserProgress(currentProgress);
    } catch (error) {
      console.error('Error saving to local storage:', error);
      return false;
    }
  }

  // Merge local and Firebase progress
  async mergeProgress(): Promise<UserProgress | null> {
    try {
      const { user } = useAuth();
      if (!user) {
        // No user, just return local progress
        return await storageService.loadUserProgress();
      }

      const localProgress = await storageService.loadUserProgress() || {};
      const firebaseProgress = await FirestoreService.getUserProgress(user.uid);

      if (!firebaseProgress) {
        // No Firebase progress, save local to Firebase
        await FirestoreService.saveUserProgress(user.uid, localProgress);
        return localProgress;
      }

      // Merge progress (Firebase takes precedence for conflicts)
      const mergedProgress = this.mergeProgressData(localProgress, firebaseProgress);
      
      // Save merged progress to both local and Firebase
      await storageService.saveUserProgress(mergedProgress);
      await FirestoreService.saveUserProgress(user.uid, mergedProgress);
      
      return mergedProgress;
    } catch (error) {
      console.error('Error merging progress:', error);
      return null;
    }
  }

  // Merge local and Firebase progress data
  private mergeProgressData(local: UserProgress, firebase: UserProgress): UserProgress {
    const merged: UserProgress = { ...firebase };

    // Add any local progress that doesn't exist in Firebase
    Object.keys(local).forEach(examType => {
      if (!merged[examType]) {
        merged[examType] = local[examType];
      } else {
        Object.keys(local[examType]).forEach(examId => {
          const examIdNum = parseInt(examId);
          if (!merged[examType][examIdNum]) {
            merged[examType][examIdNum] = local[examType][examIdNum];
          } else {
            // Merge results, keeping the latest attempts
            const localResults = local[examType][examIdNum];
            const firebaseResults = merged[examType][examIdNum];
            
            // Combine and sort by completion time
            const allResults = [...localResults, ...firebaseResults];
            allResults.sort((a, b) => b.completedAt - a.completedAt);
            
            // Remove duplicates based on completion time
            const uniqueResults = allResults.filter((result, index, self) => 
              index === self.findIndex(r => r.completedAt === result.completedAt)
            );
            
            merged[examType][examIdNum] = uniqueResults;
          }
        });
      }
    });

    return merged;
  }

  // Clear all progress (local and Firebase)
  async clearAllProgress(): Promise<boolean> {
    try {
      // Clear local progress
      const localSuccess = await storageService.clearUserProgress();
      
      // Clear Firebase progress if user is authenticated
      const { user } = useAuth();
      if (user) {
        try {
          await FirestoreService.deleteUserData(user.uid);
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
  async hasUnsyncedProgress(): Promise<boolean> {
    try {
      const { user } = useAuth();
      if (!user) {
        return false; // No user, no sync needed
      }

      const localProgress = await storageService.loadUserProgress();
      const firebaseProgress = await FirestoreService.getUserProgress(user.uid);

      if (!localProgress) {
        return false; // No local progress
      }

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
