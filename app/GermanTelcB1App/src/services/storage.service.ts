import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProgress, ExamProgress, UserAnswer } from '../types/exam.types';

class StorageService {
  private static readonly KEYS = {
    USER_PROGRESS: 'user_progress',
    LANGUAGE_PREFERENCE: 'language_preference',
    ONBOARDING_COMPLETED: 'onboarding_completed',
    USER_SETTINGS: 'user_settings',
  };

  // User Progress Methods
  async getUserProgress(): Promise<UserProgress | null> {
    try {
      const data = await AsyncStorage.getItem(StorageService.KEYS.USER_PROGRESS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user progress:', error);
      return null;
    }
  }

  async saveUserProgress(progress: UserProgress): Promise<boolean> {
    try {
      await AsyncStorage.setItem(
        StorageService.KEYS.USER_PROGRESS,
        JSON.stringify(progress)
      );
      return true;
    } catch (error) {
      console.error('Error saving user progress:', error);
      return false;
    }
  }

  async updateExamProgress(
    examType: string,
    examId: number,
    answers: UserAnswer[],
    score?: number,
    maxScore?: number
  ): Promise<boolean> {
    try {
      const currentProgress = await this.getUserProgress();
      const now = Date.now();

      if (!currentProgress) {
        // Create new progress
        const newProgress: UserProgress = {
          exams: [],
          totalScore: 0,
          totalMaxScore: 0,
          lastUpdated: now,
        };
        return await this.saveUserProgress(newProgress);
      }

      // Find existing exam progress or create new one
      let examProgress = currentProgress.exams.find(
        exam => exam.examId === examId && exam.examType === examType
      );

      if (!examProgress) {
        examProgress = {
          examId,
          examType: examType as any,
          answers: [],
          completed: false,
          lastAttempt: now,
        };
        currentProgress.exams.push(examProgress);
      }

      // Update exam progress
      examProgress.answers = answers;
      examProgress.completed = true;
      examProgress.score = score;
      examProgress.maxScore = maxScore;
      examProgress.lastAttempt = now;

      // Update total scores
      currentProgress.totalScore = currentProgress.exams.reduce(
        (sum, exam) => sum + (exam.score || 0),
        0
      );
      currentProgress.totalMaxScore = currentProgress.exams.reduce(
        (sum, exam) => sum + (exam.maxScore || 0),
        0
      );
      currentProgress.lastUpdated = now;

      return await this.saveUserProgress(currentProgress);
    } catch (error) {
      console.error('Error updating exam progress:', error);
      return false;
    }
  }

  async getExamProgress(examType: string, examId: number): Promise<ExamProgress | null> {
    try {
      const progress = await this.getUserProgress();
      if (!progress) return null;

      return (
        progress.exams.find(
          exam => exam.examId === examId && exam.examType === examType
        ) || null
      );
    } catch (error) {
      console.error('Error getting exam progress:', error);
      return null;
    }
  }

  async clearUserProgress(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(StorageService.KEYS.USER_PROGRESS);
      return true;
    } catch (error) {
      console.error('Error clearing user progress:', error);
      return false;
    }
  }

  // Language Preference Methods
  async getLanguagePreference(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(StorageService.KEYS.LANGUAGE_PREFERENCE);
    } catch (error) {
      console.error('Error getting language preference:', error);
      return null;
    }
  }

  async saveLanguagePreference(language: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(StorageService.KEYS.LANGUAGE_PREFERENCE, language);
      return true;
    } catch (error) {
      console.error('Error saving language preference:', error);
      return false;
    }
  }

  // Onboarding Methods
  async isOnboardingCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(StorageService.KEYS.ONBOARDING_COMPLETED);
      return completed === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  async setOnboardingCompleted(): Promise<boolean> {
    try {
      await AsyncStorage.setItem(StorageService.KEYS.ONBOARDING_COMPLETED, 'true');
      return true;
    } catch (error) {
      console.error('Error setting onboarding completed:', error);
      return false;
    }
  }

  // User Settings Methods
  async getUserSettings(): Promise<Record<string, any> | null> {
    try {
      const data = await AsyncStorage.getItem(StorageService.KEYS.USER_SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user settings:', error);
      return null;
    }
  }

  async saveUserSettings(settings: Record<string, any>): Promise<boolean> {
    try {
      await AsyncStorage.setItem(
        StorageService.KEYS.USER_SETTINGS,
        JSON.stringify(settings)
      );
      return true;
    } catch (error) {
      console.error('Error saving user settings:', error);
      return false;
    }
  }

  // Utility Methods
  async clearAllData(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove([
        StorageService.KEYS.USER_PROGRESS,
        StorageService.KEYS.LANGUAGE_PREFERENCE,
        StorageService.KEYS.ONBOARDING_COMPLETED,
        StorageService.KEYS.USER_SETTINGS,
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }

  async getStorageInfo(): Promise<{ used: number; available: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const data = await AsyncStorage.multiGet(keys);
      
      let used = 0;
      data.forEach(([key, value]) => {
        if (value) {
          used += key.length + value.length;
        }
      });

      return {
        used,
        available: 0, // AsyncStorage doesn't provide available space info
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { used: 0, available: 0 };
    }
  }
}

export default new StorageService();
