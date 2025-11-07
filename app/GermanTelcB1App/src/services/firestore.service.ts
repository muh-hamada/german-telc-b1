import firestore, { Timestamp } from '@react-native-firebase/firestore';
import { UserProgress, ExamProgress, UserAnswer } from '../types/exam.types';
import { User } from './auth.service';
import { activeExamConfig } from '../config/active-exam.config';

class FirestoreService {
  private readonly COLLECTIONS = {
    USERS: 'users',
    PROGRESS: 'progress',
    EXAM_RESULTS: 'examResults',
    ACCOUNT_DELETION_REQUESTS: 'account_deletion_requests',
  };
  
  // Exam-specific collection prefix for future multi-app support
  // Lazy-loaded to avoid initialization order issues
  private get examId(): string {
    return activeExamConfig.id;
  }

  // User Management
  async createUserProfile(user: User): Promise<void> {
    try {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: user.provider,
        createdAt: Timestamp.fromDate(user.createdAt),
        lastLoginAt: Timestamp.fromDate(user.lastLoginAt),
        preferences: {
          language: 'en',
          notifications: true,
          darkMode: false,
        },
        stats: {
          totalExams: 0,
          completedExams: 0,
          totalScore: 0,
          totalMaxScore: 0,
          averageScore: 0,
          streak: 0,
          lastActivity: Timestamp.fromDate(new Date()),
        },
      };

      await firestore()
        .collection(this.COLLECTIONS.USERS)
        .doc(user.uid)
        .set(userData, { merge: true });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async getUserProfile(uid: string): Promise<any | null> {
    try {
      const doc = await firestore()
        .collection(this.COLLECTIONS.USERS)
        .doc(uid)
        .get();

      const data = doc.data();
      if (data) {
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(uid: string, updates: any): Promise<void> {
    try {
      await firestore()
        .collection(this.COLLECTIONS.USERS)
        .doc(uid)
        .update({
          ...updates,
          lastUpdated: Timestamp.fromDate(new Date()),
        });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Progress Management
  async saveUserProgress(uid: string, progress: UserProgress): Promise<void> {
    try {
      // Ensure progress has valid structure
      const safeProgress: UserProgress = {
        exams: Array.isArray(progress.exams) ? progress.exams : [],
        totalScore: typeof progress.totalScore === 'number' ? progress.totalScore : 0,
        totalMaxScore: typeof progress.totalMaxScore === 'number' ? progress.totalMaxScore : 0,
        lastUpdated: typeof progress.lastUpdated === 'number' ? progress.lastUpdated : Date.now(),
      };

      const progressData = {
        ...safeProgress,
        lastUpdated: Timestamp.fromDate(new Date(safeProgress.lastUpdated)),
        exams: safeProgress.exams.map(exam => ({
          ...exam,
          lastAttempt: Timestamp.fromDate(
            new Date(typeof exam.lastAttempt === 'number' ? exam.lastAttempt : Date.now())
          ),
        })),
      };

      await firestore()
        .collection(this.COLLECTIONS.PROGRESS)
        .doc(uid)
        .set(progressData, { merge: true });
    } catch (error) {
      console.error('Error saving user progress:', error);
      throw error;
    }
  }

  async getUserProgress(uid: string): Promise<UserProgress | null> {
    try {
      const doc = await firestore()
        .collection(this.COLLECTIONS.PROGRESS)
        .doc(uid)
        .get();

      const data = doc.data();
      if (!data) {
        return null;
      }
      
      // Helper function to safely convert timestamps
      const convertTimestamp = (value: any): number => {
        if (!value) return Date.now();
        if (typeof value === 'number') return value;
        if (typeof value.toDate === 'function') {
          try {
            return value.toDate().getTime();
          } catch (e) {
            return Date.now();
          }
        }
        return Date.now();
      };
      
      return {
        exams: Array.isArray(data.exams) ? data.exams.map((exam: any) => ({
          ...exam,
          lastAttempt: convertTimestamp(exam.lastAttempt),
        })) : [],
        totalScore: typeof data.totalScore === 'number' ? data.totalScore : 0,
        totalMaxScore: typeof data.totalMaxScore === 'number' ? data.totalMaxScore : 0,
        lastUpdated: convertTimestamp(data.lastUpdated),
      } as UserProgress;
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

  async updateExamProgress(
    uid: string,
    examType: string,
    examId: number,
    answers: UserAnswer[],
    score?: number,
    maxScore?: number
  ): Promise<void> {
    try {
      const now = Timestamp.fromDate(new Date());
      
      // Update progress document
      const progressRef = firestore()
        .collection(this.COLLECTIONS.PROGRESS)
        .doc(uid);

      const progressDoc = await progressRef.get();
      const rawData = progressDoc.data();
      
      // Ensure progressData has a valid structure
      let progressData: any = {
        exams: [],
        totalScore: 0,
        totalMaxScore: 0,
        lastUpdated: now,
        ...(rawData || {}),
      };
      
      // Ensure exams array exists
      if (!Array.isArray(progressData.exams)) {
        progressData.exams = [];
      }

      // Find or create exam progress
      let examProgress = progressData.exams.find(
        (exam: any) => exam.examId === examId && exam.examType === examType
      );

      if (!examProgress) {
        examProgress = {
          examId,
          examType,
          answers: [],
          completed: false,
          lastAttempt: now,
        };
        progressData.exams.push(examProgress);
      }

      // Update exam progress
      examProgress.answers = answers;
      examProgress.completed = true;
      examProgress.score = score;
      examProgress.maxScore = maxScore;
      examProgress.lastAttempt = now;

      // Update total scores
      progressData.totalScore = progressData.exams.reduce(
        (sum: number, exam: any) => sum + (exam.score || 0),
        0
      );
      progressData.totalMaxScore = progressData.exams.reduce(
        (sum: number, exam: any) => sum + (exam.maxScore || 0),
        0
      );
      progressData.lastUpdated = now;

      await progressRef.set(progressData, { merge: true });

      // Save exam result
      await this.saveExamResult(uid, examType, examId, answers, score, maxScore);
    } catch (error) {
      console.error('Error updating exam progress:', error);
      throw error;
    }
  }

  // Exam Results
  async saveExamResult(
    uid: string,
    examType: string,
    examId: number,
    answers: UserAnswer[],
    score?: number,
    maxScore?: number
  ): Promise<void> {
    try {
      const resultData = {
        uid,
        examType,
        examId,
        answers,
        score: score || 0,
        maxScore: maxScore || 0,
        percentage: maxScore && maxScore > 0 ? Math.round((score || 0) / maxScore * 100) : 0,
        completedAt: Timestamp.fromDate(new Date()),
      };

      await firestore()
        .collection(this.COLLECTIONS.EXAM_RESULTS)
        .add(resultData);
    } catch (error) {
      console.error('Error saving exam result:', error);
      throw error;
    }
  }

  async getExamResults(uid: string, limit: number = 10): Promise<any[]> {
    try {
      const snapshot = await firestore()
        .collection(this.COLLECTIONS.EXAM_RESULTS)
        .where('uid', '==', uid)
        .orderBy('completedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt.toDate(),
      }));
    } catch (error) {
      console.error('Error getting exam results:', error);
      throw error;
    }
  }

  // Statistics
  async updateUserStats(uid: string, stats: any): Promise<void> {
    try {
      await firestore()
        .collection(this.COLLECTIONS.USERS)
        .doc(uid)
        .update({
          stats: {
            ...stats,
            lastActivity: Timestamp.fromDate(new Date()),
          },
        });
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  // Leaderboard
  async getLeaderboard(limit: number = 10): Promise<any[]> {
    try {
      const snapshot = await firestore()
        .collection(this.COLLECTIONS.USERS)
        .orderBy('stats.averageScore', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        stats: {
          ...doc.data().stats,
          lastActivity: doc.data().stats.lastActivity.toDate(),
        },
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  // Sync local progress to cloud
  async syncProgressToCloud(uid: string, localProgress: UserProgress): Promise<void> {
    try {
      // Get cloud progress
      const cloudProgress = await this.getUserProgress(uid);
      
      if (!cloudProgress) {
        // No cloud progress, save local progress
        await this.saveUserProgress(uid, localProgress);
        return;
      }

      // Merge local and cloud progress
      const mergedProgress = this.mergeProgress(localProgress, cloudProgress);
      await this.saveUserProgress(uid, mergedProgress);
    } catch (error) {
      console.error('Error syncing progress to cloud:', error);
      throw error;
    }
  }

  // Merge local and cloud progress
  private mergeProgress(local: UserProgress, cloud: UserProgress): UserProgress {
    // Ensure both have valid structure
    const safeLocal: UserProgress = {
      exams: local.exams || [],
      totalScore: local.totalScore ?? 0,
      totalMaxScore: local.totalMaxScore ?? 0,
      lastUpdated: local.lastUpdated ?? Date.now(),
    };

    const safeCloud: UserProgress = {
      exams: cloud.exams || [],
      totalScore: cloud.totalScore ?? 0,
      totalMaxScore: cloud.totalMaxScore ?? 0,
      lastUpdated: cloud.lastUpdated ?? Date.now(),
    };

    const mergedExams = [...safeCloud.exams];

    // Add or update local exams
    safeLocal.exams.forEach(localExam => {
      const existingIndex = mergedExams.findIndex(
        exam => exam.examId === localExam.examId && exam.examType === localExam.examType
      );

      if (existingIndex >= 0) {
        // Update existing exam if local is newer
        const localAttempt = localExam.lastAttempt ?? 0;
        const cloudAttempt = mergedExams[existingIndex].lastAttempt ?? 0;
        if (localAttempt > cloudAttempt) {
          mergedExams[existingIndex] = localExam;
        }
      } else {
        // Add new exam
        mergedExams.push(localExam);
      }
    });

    // Recalculate totals
    const totalScore = mergedExams.reduce((sum, exam) => sum + (exam.score || 0), 0);
    const totalMaxScore = mergedExams.reduce((sum, exam) => sum + (exam.maxScore || 0), 0);

    return {
      exams: mergedExams,
      totalScore,
      totalMaxScore,
      lastUpdated: Math.max(safeLocal.lastUpdated, safeCloud.lastUpdated),
    };
  }

  // Delete user data
  async deleteUserData(uid: string): Promise<void> {
    try {
      // Delete user profile
      await firestore()
        .collection(this.COLLECTIONS.USERS)
        .doc(uid)
        .delete();

      // Delete progress
      await firestore()
        .collection(this.COLLECTIONS.PROGRESS)
        .doc(uid)
        .delete();

      // Delete exam results
      const resultsSnapshot = await firestore()
        .collection(this.COLLECTIONS.EXAM_RESULTS)
        .where('uid', '==', uid)
        .get();

      const batch = firestore().batch();
      resultsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  }

  // User Settings Management
  async getUserSettings(uid: string): Promise<any | null> {
    try {
      const userDoc = await firestore()
        .collection(this.COLLECTIONS.USERS)
        .doc(uid)
        .get();

      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user settings:', error);
      throw error;
    }
  }

  async updateUserSettings(uid: string, settings: any): Promise<void> {
    try {
      await firestore()
        .collection(this.COLLECTIONS.USERS)
        .doc(uid)
        .set(settings, { merge: true });
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  // Account Deletion Requests
  async createDeletionRequest(uid: string, email: string): Promise<void> {
    try {
      await firestore()
        .collection(this.COLLECTIONS.ACCOUNT_DELETION_REQUESTS)
        .doc(uid)
        .set({
          uid,
          email,
          requestedAt: Timestamp.fromDate(new Date()),
          status: 'pending',
        });
    } catch (error) {
      console.error('Error creating deletion request:', error);
      throw error;
    }
  }

  async checkDeletionRequestExists(uid: string): Promise<boolean> {
    try {
      const doc = await firestore()
        .collection(this.COLLECTIONS.ACCOUNT_DELETION_REQUESTS)
        .doc(uid)
        .get();

      return doc.exists && doc.data()?.status === 'pending';
    } catch (error) {
      console.error('Error checking deletion request:', error);
      throw error;
    }
  }
}

export default new FirestoreService();
