import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import firebaseCompletionService, { CompletionData, CompletionStats, AllCompletionStats } from '../services/firebase-completion.service';
import { reviewTrigger } from '../utils/reviewTrigger';

interface CompletionContextType {
  // State
  completionData: Map<string, CompletionData>;
  allStats: AllCompletionStats;
  isLoading: boolean;
  
  // Actions
  getCompletionStatus: (examType: string, partNumber: number, examId: number) => CompletionData | null;
  toggleCompletion: (examType: string, partNumber: number, examId: number, score: number) => Promise<boolean>;
  refreshCompletions: () => Promise<void>;
  getStatsForPart: (examType: string, partNumber: number) => CompletionStats | null;
}

const CompletionContext = createContext<CompletionContextType | undefined>(undefined);

interface CompletionProviderProps {
  children: ReactNode;
}

export const CompletionProvider: React.FC<CompletionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [completionData, setCompletionData] = useState<Map<string, CompletionData>>(new Map());
  const [allStats, setAllStats] = useState<AllCompletionStats>({});
  const [isLoading, setIsLoading] = useState(false);

  // Create a key for the completion data map
  const createKey = (examType: string, partNumber: number, examId: number): string => {
    return `${examType}-${partNumber}-${examId}`;
  };

  // Load all completion data
  const loadCompletionData = useCallback(async () => {
    if (!user?.uid) {
      console.log('[CompletionContext] No user, clearing data');
      setCompletionData(new Map());
      setAllStats({});
      return;
    }

    try {
      console.log('[CompletionContext] Loading completion data for user:', user.uid);
      setIsLoading(true);
      
      // Load all stats
      const stats = await firebaseCompletionService.getAllCompletionStats(user.uid);
      console.log('[CompletionContext] Loaded stats:', stats);
      setAllStats(stats);
      
      // Load individual completion data for each exam type and part
      const newCompletionData = new Map<string, CompletionData>();
      
      const examStructure = {
        'grammar': [1, 2],
        'reading': [1, 2, 3],
        'writing': [1],
        'speaking': [1, 2, 3],
      };
      
      for (const [examType, parts] of Object.entries(examStructure)) {
        for (const partNumber of parts) {
          const completions = await firebaseCompletionService.getAllCompletionsForPart(
            user.uid,
            examType,
            partNumber
          );
          
          console.log(`[CompletionContext] Got ${completions.length} completions for ${examType} part ${partNumber}`);
          
          completions.forEach(completion => {
            const key = createKey(examType, partNumber, completion.examId);
            newCompletionData.set(key, completion);
          });
        }
      }
      
      console.log('[CompletionContext] Total completions loaded:', newCompletionData.size);
      setCompletionData(newCompletionData);
    } catch (error) {
      console.error('[CompletionContext] Error loading completion data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Load data when user changes
  useEffect(() => {
    loadCompletionData();
  }, [loadCompletionData]);

  // Get completion status for a specific exam
  const getCompletionStatus = (examType: string, partNumber: number, examId: number): CompletionData | null => {
    const key = createKey(examType, partNumber, examId);
    return completionData.get(key) || null;
  };

  // Toggle completion status
  const toggleCompletion = async (
    examType: string,
    partNumber: number,
    examId: number,
    score: number
  ): Promise<boolean> => {
    if (!user?.uid) {
      throw new Error('auth/not-logged-in');
    }

    try {
      console.log('[CompletionContext] Toggle completion called for:', { examType, partNumber, examId, score });
      
      const newStatus = await firebaseCompletionService.toggleCompletion(
        user.uid,
        examType,
        partNumber,
        examId,
        score
      );

      console.log('[CompletionContext] Firebase returned newStatus:', newStatus);
      
      // Update local state
      const key = createKey(examType, partNumber, examId);
      const newData = new Map(completionData);
      
      console.log('[CompletionContext] Updating local state for key:', key, 'newStatus:', newStatus);
      
      if (newStatus) {
        // Mark as completed
        newData.set(key, {
          examId,
          examType,
          partNumber,
          score,
          date: Date.now(),
          completed: true,
        });
        console.log('[CompletionContext] Added to local state');
      } else {
        // Remove from map
        newData.delete(key);
        console.log('[CompletionContext] Removed from local state');
      }
      
      setCompletionData(newData);
      
      // Refresh only stats (not the completion data to avoid overwriting optimistic update)
      const stats = await firebaseCompletionService.getAllCompletionStats(user.uid);
      setAllStats(stats);
      
      // Trigger review prompt if marking as complete (newStatus === true)
      // We use a mock maxScore of 100 to indicate completion
      if (newStatus) {
        console.log('[CompletionContext] Triggering review prompt for score:', score);
        // We use 100% to indicate completion
        reviewTrigger.trigger(100, 100);
      } else {
        console.log('[CompletionContext] Not triggering review prompt for score:', score);
      }
      
      return newStatus;
    } catch (error) {
      console.error('[CompletionContext] Error toggling completion:', error);
      throw error;
    }
  };

  // Refresh all completion data
  const refreshCompletions = async (): Promise<void> => {
    await loadCompletionData();
  };

  // Get stats for a specific part
  const getStatsForPart = (examType: string, partNumber: number): CompletionStats | null => {
    if (!allStats[examType] || !allStats[examType][partNumber]) {
      return null;
    }
    return allStats[examType][partNumber];
  };

  const value: CompletionContextType = {
    completionData,
    allStats,
    isLoading,
    getCompletionStatus,
    toggleCompletion,
    refreshCompletions,
    getStatsForPart,
  };

  return (
    <CompletionContext.Provider value={value}>
      {children}
    </CompletionContext.Provider>
  );
};

// Hook to use the context
export const useCompletion = (): CompletionContextType => {
  const context = useContext(CompletionContext);
  if (context === undefined) {
    throw new Error('useCompletion must be used within a CompletionProvider');
  }
  return context;
};

// Hook for specific exam completion status
export const useExamCompletion = (examType: string, partNumber: number, examId: number) => {
  const { getCompletionStatus, toggleCompletion } = useCompletion();
  const completionData = getCompletionStatus(examType, partNumber, examId);
  
  return {
    isCompleted: completionData?.completed || false,
    completionData,
    toggleCompletion: (score: number) => toggleCompletion(examType, partNumber, examId, score),
  };
};

