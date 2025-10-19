import { UserProgress, ExamResult, ExamType } from '../types/exam.types';
import FirestoreService from './firestore.service';

class FirebaseProgressService {
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

  // Save exam result to Firebase only
  async saveExamResult(
    examType: ExamType,
    examId: number,
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
      return true;
    } catch (error) {
      console.error('Error saving exam result to Firebase:', error);
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
