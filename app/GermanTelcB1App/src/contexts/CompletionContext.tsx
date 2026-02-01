import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import firebaseCompletionService, { CompletionData, CompletionStats, AllCompletionStats } from '../services/firebase-completion.service';
import { reviewTrigger } from '../utils/reviewTrigger';
import { useStreak } from './StreakContext';
import { useRemoteConfig } from './RemoteConfigContext';
import { activeExamConfig } from '../config/active-exam.config';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

interface CompletionContextType {
  // State
  completionData: Map<string, CompletionData>;
  allStats: AllCompletionStats;
  isLoading: boolean;
  
  // Actions
  getCompletionStatus: (examType: string, partNumber: number, examId: string) => CompletionData | null;
  toggleCompletion: (examType: string, partNumber: number, examId: string, score: number) => Promise<boolean>;
  refreshCompletions: () => Promise<void>;
  getStatsForPart: (examType: string, partNumber: number) => CompletionStats | null;
  autoMarkCompletedIfEligible: (examTypeWithPart: string, examId: string | number, score: number, maxScore: number) => Promise<boolean>;
}

const CompletionContext = createContext<CompletionContextType | undefined>(undefined);

interface CompletionProviderProps {
  children: ReactNode;
}

export const CompletionProvider: React.FC<CompletionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { recordActivity } = useStreak();
  const { isStreaksEnabledForUser } = useRemoteConfig();
  const [completionData, setCompletionData] = useState<Map<string, CompletionData>>(new Map());
  const [allStats, setAllStats] = useState<AllCompletionStats>({});
  const [isLoading, setIsLoading] = useState(false);

  // Create a key for the completion data map
  const createKey = (examType: string, partNumber: number, examId: string): string => {
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
      
      // Use exam structure from active config
      const examStructure = activeExamConfig.examStructure;
      
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
  const getCompletionStatus = (examType: string, partNumber: number, examId: string): CompletionData | null => {
    const key = createKey(examType, partNumber, examId);
    return completionData.get(key) || null;
  };

  // Toggle completion status
  const toggleCompletion = async (
    examType: string,
    partNumber: number,
    examId: string,
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
        
        // Record streak activity (if enabled and user is logged in)
        if (isStreaksEnabledForUser(user?.uid) && user?.uid) {
          try {
            const activityId = `${examType}-${partNumber}-${examId}`;
            await recordActivity({
              activityType: 'completion',
              activityId: activityId,
              score: score,
            });
            console.log('[CompletionContext] Streak activity recorded for completion');
          } catch (streakError) {
            console.error('[CompletionContext] Error recording streak:', streakError);
            // Don't fail the whole operation if streak recording fails
          }
        }
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

  // Auto-mark as completed if score >= 80%
  const autoMarkCompletedIfEligible = async (
    examTypeWithPart: string,
    examId: string | number,
    score: number,
    maxScore: number
  ): Promise<boolean> => {
    if (!user?.uid) {
      console.log('[CompletionContext] Not logged in, skipping auto-completion');
      return false;
    }

    if (maxScore === 0) {
      console.log('[CompletionContext] maxScore is 0, skipping auto-completion');
      return false;
    }

    const percentage = (score / maxScore) * 100;
    
    if (percentage < 80) {
      console.log('[CompletionContext] Score below 80%, skipping auto-completion');
      return false;
    }

    try {
      console.log('[CompletionContext] Score above 80%, marking as completed');

      // Parse examType to get base type and part number
      const partMatch = examTypeWithPart.match(/part(\d+)/);
      const partNumber = partMatch ? parseInt(partMatch[1]) : 1;
      const baseExamType = examTypeWithPart.split('-')[0];
      const examIdString = String(examId);

      // Check if already completed
      const completionStatus = await firebaseCompletionService.getCompletionStatus(
        user.uid,
        baseExamType,
        partNumber,
        examIdString
      );

      if (completionStatus?.completed) {
        console.log('[CompletionContext] Already completed, skipping auto-completion');
        return false;
      }

      // Mark as completed
      await firebaseCompletionService.markExamCompleted(
        user.uid,
        baseExamType,
        partNumber,
        examIdString,
        score
      );

      console.log('[CompletionContext] Auto-marked as completed (score >= 80%)');

      // Update local state
      const key = createKey(baseExamType, partNumber, examIdString);
      const newData = new Map(completionData);
      newData.set(key, {
        examId: examIdString,
        examType: baseExamType,
        partNumber,
        score,
        date: Date.now(),
        completed: true,
      });
      setCompletionData(newData);

      // Refresh stats
      const stats = await firebaseCompletionService.getAllCompletionStats(user.uid);
      setAllStats(stats);

      // Log analytics
      logEvent(AnalyticsEvents.PRACTICE_MARK_COMPLETED_TOGGLED, {
        section: baseExamType,
        part: partNumber,
        exam_id: examIdString,
        completed: true,
        auto_marked: true,
        score: score,
        percentage: Math.round(percentage),
      });

      return true;
    } catch (error) {
      console.error('[CompletionContext] Failed to auto-mark completion:', error);
      return false;
    }
  };

  const value: CompletionContextType = {
    completionData,
    allStats,
    isLoading,
    getCompletionStatus,
    toggleCompletion,
    refreshCompletions,
    getStatsForPart,
    autoMarkCompletedIfEligible,
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
export const useExamCompletion = (examTypeWithPart: string, examId: string | number) => {
  const { getCompletionStatus, toggleCompletion } = useCompletion();
  
  // Parse examType to extract base type and part number for internal Firebase calls
  // Format: 'reading-part1' -> base: 'reading', part: 1
  const partMatch = examTypeWithPart.match(/part(\d+)/);
  const partNumber = partMatch ? parseInt(partMatch[1]) : 1;
  const baseExamType = examTypeWithPart.split('-')[0];
  
  // Convert examId to string for consistency
  const examIdString = String(examId);
  
  const completionData = getCompletionStatus(baseExamType, partNumber, examIdString);
  
  return {
    isCompleted: completionData?.completed || false,
    completionData,
    toggleCompletion: (score: number) => toggleCompletion(baseExamType, partNumber, examIdString, score),
  };
};

