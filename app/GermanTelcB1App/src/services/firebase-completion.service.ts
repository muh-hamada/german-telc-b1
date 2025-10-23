import firestore from '@react-native-firebase/firestore';

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
  /**
   * Mark an exam as completed
   */
  async markExamCompleted(
    userId: string,
    examType: string,
    partNumber: number,
    examId: number,
    score: number
  ): Promise<void> {
    try {
      const docPath = `users/${userId}/completions/${examType}/${partNumber}/${examId}`;
      
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
      const docPath = `users/${userId}/completions/${examType}/${partNumber}/${examId}`;
      
      await firestore().doc(docPath).delete();
      
      console.log('[CompletionService] Unmarked exam as completed:', { examType, partNumber, examId });
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
      const docPath = `users/${userId}/completions/${examType}/${partNumber}/${examId}`;
      const doc = await firestore().doc(docPath).get();
      
      if (doc.exists) {
        return doc.data() as CompletionData;
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
      const collectionPath = `users/${userId}/completions/${examType}/${partNumber}`;
      const snapshot = await firestore().collection(collectionPath).get();
      
      const completed = snapshot.size;
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
      const collectionPath = `users/${userId}/completions/${examType}/${partNumber}`;
      const snapshot = await firestore().collection(collectionPath).get();
      
      return snapshot.docs.map(doc => doc.data() as CompletionData);
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
      
      // Define exam structure with totals
      const examStructure = {
        'grammar': { 1: 5, 2: 5 },
        'reading': { 1: 5, 2: 5, 3: 5 },
        'writing': { 1: 5 },
      };
      
      // Fetch stats for each exam type and part
      for (const [examType, parts] of Object.entries(examStructure)) {
        stats[examType] = {};
        
        for (const [partNumber, totalExams] of Object.entries(parts)) {
          const partStats = await this.getCompletionStats(
            userId,
            examType,
            parseInt(partNumber),
            totalExams
          );
          
          stats[examType][partNumber] = partStats;
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

