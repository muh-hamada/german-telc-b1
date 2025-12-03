import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProgress, ExamProgress, UserAnswer } from '../types/exam.types';

class StorageService {
  private static readonly KEYS = {
    USER_PROGRESS: 'user_progress',
    LANGUAGE_PREFERENCE: 'language_preference',
    ONBOARDING_COMPLETED: 'onboarding_completed',
    USER_SETTINGS: 'user_settings',
    GRAMMAR_STUDY_PROGRESS: 'grammar_study_progress',
    GRAMMAR_STUDY_SESSION_COUNTER: 'grammar_study_session_counter',
    REMOTE_CONFIG: 'remote_config',
    GLOBAL_CONFIG: 'global_config',
    APP_UPDATE_DISMISSED: 'app_update_dismissed',
  };

  // User Progress Methods
  async getUserProgress(): Promise<UserProgress | null> {
    try {
      const data = await AsyncStorage.getItem(StorageService.KEYS.USER_PROGRESS);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      
      // Validate and migrate data to ensure all required fields exist
      return this.validateAndMigrateProgress(parsed);
    } catch (error) {
      console.error('Error getting user progress:', error);
      return null;
    }
  }

  // Validate and migrate progress data to ensure it has all required fields
  private validateAndMigrateProgress(progress: any): UserProgress | null {
    try {
      if (!progress || typeof progress !== 'object') {
        return null;
      }

      // Ensure all required fields exist with defaults
      const validatedProgress: UserProgress = {
        exams: Array.isArray(progress.exams) ? progress.exams : [],
        totalScore: typeof progress.totalScore === 'number' ? progress.totalScore : 0,
        totalMaxScore: typeof progress.totalMaxScore === 'number' ? progress.totalMaxScore : 0,
        lastUpdated: typeof progress.lastUpdated === 'number' ? progress.lastUpdated : Date.now(),
      };

      // Validate each exam progress
      validatedProgress.exams = validatedProgress.exams.map(exam => ({
        examId: exam.examId,
        examType: exam.examType,
        answers: Array.isArray(exam.answers) ? exam.answers : [],
        completed: typeof exam.completed === 'boolean' ? exam.completed : false,
        score: typeof exam.score === 'number' ? exam.score : undefined,
        maxScore: typeof exam.maxScore === 'number' ? exam.maxScore : undefined,
        lastAttempt: typeof exam.lastAttempt === 'number' ? exam.lastAttempt : Date.now(),
      }));

      return validatedProgress;
    } catch (error) {
      console.error('Error validating progress data:', error);
      return null;
    }
  }

  // Alias for getUserProgress for compatibility
  async loadUserProgress(): Promise<UserProgress | null> {
    return this.getUserProgress();
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
    maxScore?: number,
    completed: boolean = true
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
      examProgress.completed = completed;
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
        StorageService.KEYS.GRAMMAR_STUDY_PROGRESS,
        StorageService.KEYS.GRAMMAR_STUDY_SESSION_COUNTER,
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

  // Grammar Study Progress Methods
  async getGrammarStudyProgress(): Promise<{ currentQuestionIndex: number; completedQuestions: Set<number> } | null> {
    try {
      const data = await AsyncStorage.getItem(StorageService.KEYS.GRAMMAR_STUDY_PROGRESS);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      return {
        currentQuestionIndex: parsed.currentQuestionIndex || 0,
        completedQuestions: new Set(parsed.completedQuestions || []),
      };
    } catch (error) {
      console.error('Error getting grammar study progress:', error);
      return null;
    }
  }

  async saveGrammarStudyProgress(currentQuestionIndex: number, completedQuestions: Set<number>): Promise<boolean> {
    try {
      const progressData = {
        currentQuestionIndex,
        completedQuestions: Array.from(completedQuestions),
        lastUpdated: Date.now(),
      };
      
      await AsyncStorage.setItem(
        StorageService.KEYS.GRAMMAR_STUDY_PROGRESS,
        JSON.stringify(progressData)
      );
      return true;
    } catch (error) {
      console.error('Error saving grammar study progress:', error);
      return false;
    }
  }

  async clearGrammarStudyProgress(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(StorageService.KEYS.GRAMMAR_STUDY_PROGRESS);
      return true;
    } catch (error) {
      console.error('Error clearing grammar study progress:', error);
      return false;
    }
  }

  // Grammar Study Session Counter Methods
  async getGrammarStudySessionCounter(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(StorageService.KEYS.GRAMMAR_STUDY_SESSION_COUNTER);
      return data ? parseInt(data, 10) : 0;
    } catch (error) {
      console.error('Error getting grammar study session counter:', error);
      return 0;
    }
  }

  async saveGrammarStudySessionCounter(count: number): Promise<void> {
    try {
      await AsyncStorage.setItem(
        StorageService.KEYS.GRAMMAR_STUDY_SESSION_COUNTER,
        count.toString()
      );
    } catch (error) {
      console.error('Error saving grammar study session counter:', error);
    }
  }

  async clearGrammarStudySessionCounter(): Promise<void> {
    try {
      await AsyncStorage.removeItem(StorageService.KEYS.GRAMMAR_STUDY_SESSION_COUNTER);
    } catch (error) {
      console.error('Error clearing grammar study session counter:', error);
    }
  }

  // Remote Config Cache Methods
  async getRemoteConfig(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(StorageService.KEYS.REMOTE_CONFIG);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting remote config from cache:', error);
      return null;
    }
  }

  async saveRemoteConfig(config: any): Promise<void> {
    try {
      await AsyncStorage.setItem(
        StorageService.KEYS.REMOTE_CONFIG,
        JSON.stringify(config)
      );
    } catch (error) {
      console.error('Error saving remote config to cache:', error);
    }
  }

  async clearRemoteConfig(): Promise<void> {
    try {
      await AsyncStorage.removeItem(StorageService.KEYS.REMOTE_CONFIG);
    } catch (error) {
      console.error('Error clearing remote config from cache:', error);
    }
  }

  // Global Config Cache Methods
  async getGlobalConfig(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(StorageService.KEYS.GLOBAL_CONFIG);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting global config from cache:', error);
      return null;
    }
  }

  async saveGlobalConfig(config: any): Promise<void> {
    try {
      await AsyncStorage.setItem(
        StorageService.KEYS.GLOBAL_CONFIG,
        JSON.stringify(config)
      );
    } catch (error) {
      console.error('Error saving global config to cache:', error);
    }
  }

  async clearGlobalConfig(): Promise<void> {
    try {
      await AsyncStorage.removeItem(StorageService.KEYS.GLOBAL_CONFIG);
    } catch (error) {
      console.error('Error clearing global config from cache:', error);
    }
  }

  // App Update Dismissal Methods
  async getAppUpdateDismissedData(): Promise<{ version: string; dismissedAt: number } | null> {
    try {
      const data = await AsyncStorage.getItem(StorageService.KEYS.APP_UPDATE_DISMISSED);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting app update dismissed data:', error);
      return null;
    }
  }

  async saveAppUpdateDismissedData(version: string): Promise<void> {
    try {
      const data = {
        version,
        dismissedAt: Date.now(),
      };
      await AsyncStorage.setItem(
        StorageService.KEYS.APP_UPDATE_DISMISSED,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Error saving app update dismissed data:', error);
    }
  }

  async clearAppUpdateDismissedData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(StorageService.KEYS.APP_UPDATE_DISMISSED);
    } catch (error) {
      console.error('Error clearing app update dismissed data:', error);
    }
  }
}

export default new StorageService();
