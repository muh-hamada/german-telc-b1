import firestore from '@react-native-firebase/firestore';
import { dataService } from './data.service';
import { activeExamConfig } from '../config/active-exam.config';

export interface CompletionData {
  examId: number;
  examType: string;
  partNumber: number;
  score: number;
  date: number;
  completed: boolean;
}

export interface CompletionStats {
  completed: number;
  total: number;
  percentage: number;
}

export interface AllCompletionStats {
  [examType: string]: {
    [partNumber: string]: CompletionStats;
  };
}

class FirebaseCompletionService {
  // Lazy-loaded to avoid initialization order issues
  private get examId(): string {
    return activeExamConfig.id;
  }

  /**
   * Get the completions path for a specific user
   * Replaces {uid} placeholder with actual userId
   */
  private getCompletionsPath(userId: string): string {
    return activeExamConfig.firebaseCollections.completions.replace('{uid}', userId);
  }

  /**
   * Mark an exam as completed
   * Uses the completions path from exam config
   */
  async markExamCompleted(
    userId: string,
    examType: string,
    partNumber: number,
    examId: number,
    score: number
  ): Promise<void> {
    try {
      const completionsBasePath = this.getCompletionsPath(userId);
      const docPath = `${completionsBasePath}/${examType}/${partNumber}/${examId}`;
      
      await firestore().doc(docPath).set({
        examId,
        examType,
        partNumber,
        score,
        date: Date.now(),
        completed: true,
      });
      
      console.log('[CompletionService] Marked exam as completed:', { examType, partNumber, examId });
    } catch (error) {
      console.error('[CompletionService] Error marking exam as completed:', error);
      throw error;
    }
  }

  /**
   * Unmark an exam as completed (toggle off)
   */
  async unmarkExamCompleted(
    userId: string,
    examType: string,
    partNumber: number,
    examId: number
  ): Promise<void> {
    try {
      const completionsBasePath = this.getCompletionsPath(userId);
      const docPath = `${completionsBasePath}/${examType}/${partNumber}/${examId}`;
      await firestore().doc(docPath).delete();
    } catch (error) {
      console.error('[CompletionService] Error unmarking exam:', error);
      throw error;
    }
  }

  /**
   * Get completion status for a specific exam
   */
  async getCompletionStatus(
    userId: string,
    examType: string,
    partNumber: number,
    examId: number
  ): Promise<CompletionData | null> {
    try {
      const completionsBasePath = this.getCompletionsPath(userId);
      const docPath = `${completionsBasePath}/${examType}/${partNumber}/${examId}`;
      const doc = await firestore().doc(docPath).get();
      
      const data = doc.data();
      if (data) {
        return data as CompletionData;
      }
      
      return null;
    } catch (error) {
      console.error('[CompletionService] Error getting completion status:', error);
      return null;
    }
  }

  /**
   * Get completion stats for a specific exam type and part
   */
  async getCompletionStats(
    userId: string,
    examType: string,
    partNumber: number,
    totalExams: number
  ): Promise<CompletionStats> {
    try {
      const completionsBasePath = this.getCompletionsPath(userId);
      const collectionPath = `${completionsBasePath}/${examType}/${partNumber}`;
      const snapshot = await firestore().collection(collectionPath).get();
      
      // Cap completed count to not exceed total (in case exams were removed)
      const completedCount = snapshot.size;
      const completed = Math.min(completedCount, totalExams);
      const percentage = totalExams > 0 ? Math.round((completed / totalExams) * 100) : 0;
      
      return {
        completed,
        total: totalExams,
        percentage,
      };
    } catch (error) {
      console.error('[CompletionService] Error getting completion stats:', error);
      return {
        completed: 0,
        total: totalExams,
        percentage: 0,
      };
    }
  }

  /**
   * Get all completion data for a specific exam type and part
   */
  async getAllCompletionsForPart(
    userId: string,
    examType: string,
    partNumber: number
  ): Promise<CompletionData[]> {
    try {
      const completionsBasePath = this.getCompletionsPath(userId);
      const collectionPath = `${completionsBasePath}/${examType}/${partNumber}`;
      const snapshot = await firestore().collection(collectionPath).get();
      
      const completions = snapshot.docs.map(doc => {
        const data = doc.data() as CompletionData;
        return data;
      });
      return completions;
    } catch (error) {
      console.error('[CompletionService] Error getting all completions:', error);
      return [];
    }
  }

  /**
   * Get all completion stats for all exam types
   */
  async getAllCompletionStats(userId: string): Promise<AllCompletionStats> {
    try {
      const stats: AllCompletionStats = {};
      
      // Define exam structure with parts (totals come from dataService)
      const examStructure = {
        'grammar': [1, 2],
        'reading': [1, 2, 3],
        'writing': [1],
        'speaking': [1, 2, 3],
        'listening': [1, 2, 3],
      };
      
      // Fetch stats for each exam type and part
      for (const [examType, parts] of Object.entries(examStructure)) {
        stats[examType] = {};
        
        for (const partNumber of parts) {
          // Get the actual current number of exams from the JSON data
          const examTypeKey = parts.length > 1 
            ? `${examType}-part${partNumber}` 
            : examType;
          const totalExams = await dataService.getExamCount(examTypeKey);
          
          console.log('[CompletionService] Total exams for', examTypeKey, ':', totalExams);

          const partStats = await this.getCompletionStats(
            userId,
            examType,
            partNumber,
            totalExams
          );

          console.log('[CompletionService] Part stats for', examTypeKey, ':', partStats);
          
          stats[examType][partNumber.toString()] = partStats;
        }
      }
      
      return stats;
    } catch (error) {
      console.error('[CompletionService] Error getting all completion stats:', error);
      return {};
    }
  }

  /**
   * Toggle completion status
   */
  async toggleCompletion(
    userId: string,
    examType: string,
    partNumber: number,
    examId: number,
    score: number
  ): Promise<boolean> {
    try {
      const current = await this.getCompletionStatus(userId, examType, partNumber, examId);

      if (current?.completed) {
        await this.unmarkExamCompleted(userId, examType, partNumber, examId);
        return false;
      } else {
        await this.markExamCompleted(userId, examType, partNumber, examId, score); 
        return true;
      }
    } catch (error) {
      console.error('[CompletionService] Error toggling completion:', error);
      throw error;
    }
  }
}

export default new FirebaseCompletionService();

