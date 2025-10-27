import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { UserProgress, ExamProgress, UserAnswer } from '../types/exam.types';
import StorageService from '../services/storage.service';
import firebaseProgressService from '../services/firebase-progress.service';
import { AuthContext } from './AuthContext';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

// Progress Context Types
interface ProgressState {
  userProgress: UserProgress | null;
  isLoading: boolean;
  error: string | null;
}

interface ProgressContextType extends ProgressState {
  // Actions
  loadUserProgress: () => Promise<void>;
  updateExamProgress: (
    examType: string,
    examId: number,
    answers: UserAnswer[],
    score?: number,
    maxScore?: number
  ) => Promise<boolean>;
  getExamProgress: (examType: string, examId: number) => ExamProgress | null;
  clearUserProgress: () => Promise<boolean>;
  refreshProgress: () => Promise<void>;
  syncProgressToFirebase: () => Promise<boolean>;
}

// Action Types
type ProgressAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER_PROGRESS'; payload: UserProgress | null }
  | { type: 'UPDATE_EXAM_PROGRESS'; payload: { examType: string; examId: number; answers: UserAnswer[]; score?: number; maxScore?: number } }
  | { type: 'CLEAR_PROGRESS' };

// Initial State
const initialState: ProgressState = {
  userProgress: null,
  isLoading: false,
  error: null,
};

// Reducer
const progressReducer = (state: ProgressState, action: ProgressAction): ProgressState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_USER_PROGRESS':
      return { ...state, userProgress: action.payload, isLoading: false, error: null };
    
    case 'UPDATE_EXAM_PROGRESS': {
      const { examType, examId, answers, score, maxScore } = action.payload;
      const now = Date.now();
      
      // Initialize userProgress if it doesn't exist
      let currentProgress = state.userProgress || {
        exams: [],
        totalScore: 0,
        totalMaxScore: 0,
        lastUpdated: now,
      };
      
      // Create a mutable copy of exams array
      const exams = [...currentProgress.exams];
      
      // Find existing exam progress or create new one
      const existingIndex = exams.findIndex(
        exam => exam.examId === examId && exam.examType === examType
      );
      
      const examProgress: ExamProgress = {
        examId,
        examType: examType as any,
        answers,
        completed: true,
        score,
        maxScore,
        lastAttempt: now,
      };
      
      if (existingIndex >= 0) {
        // Update existing exam
        exams[existingIndex] = examProgress;
      } else {
        // Add new exam
        exams.push(examProgress);
      }
      
      // Calculate total scores
      const totalScore = exams.reduce((sum, exam) => sum + (exam.score || 0), 0);
      const totalMaxScore = exams.reduce((sum, exam) => sum + (exam.maxScore || 0), 0);
      
      return {
        ...state,
        userProgress: {
          exams,
          totalScore,
          totalMaxScore,
          lastUpdated: now,
        },
      };
    }
    
    case 'CLEAR_PROGRESS':
      return { ...state, userProgress: null, error: null };
    
    default:
      return state;
  }
};

// Context
const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

// Provider Component
interface ProgressProviderProps {
  children: ReactNode;
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(progressReducer, initialState);
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;

  // Load user progress function
  const loadUserProgress = React.useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('[ProgressContext] Loading progress for user:', user?.uid || 'not logged in');
      
      if (user?.uid) {
        // User is authenticated, load from Firebase and merge with local storage
        try {
          console.log('[ProgressContext] Loading Firebase progress for user:', user.uid);
          const firebaseProgress = await firebaseProgressService.loadProgressFromFirebase(user.uid);
          
          // Check if there's local storage data to migrate
          const localProgress = await StorageService.getUserProgress();
          
          if (localProgress && localProgress.exams.length > 0) {
            console.log('[ProgressContext] Found local progress with', localProgress.exams.length, 'exams');
            
            if (!firebaseProgress || firebaseProgress.exams.length === 0) {
              // No Firebase data, migrate local progress
              console.log('[ProgressContext] Migrating local progress to Firebase');
              await firebaseProgressService.migrateLocalProgress(user.uid, localProgress);
              dispatch({ type: 'SET_USER_PROGRESS', payload: localProgress });
              
              // Clear local storage after successful migration
              await StorageService.clearUserProgress();
              console.log('[ProgressContext] Local progress migrated and cleared');
            } else {
              // Merge local and Firebase progress
              console.log('[ProgressContext] Merging local and Firebase progress');
              const mergedProgress = await firebaseProgressService.mergeAndSaveProgress(
                user.uid,
                localProgress,
                firebaseProgress
              );
              dispatch({ type: 'SET_USER_PROGRESS', payload: mergedProgress });
              
              // Clear local storage after successful merge
              await StorageService.clearUserProgress();
              console.log('[ProgressContext] Progress merged and local storage cleared');
            }
          } else {
            // No local progress, just use Firebase data
            dispatch({ type: 'SET_USER_PROGRESS', payload: firebaseProgress });
            console.log('[ProgressContext] Successfully loaded Firebase progress');
          }
        } catch (firebaseError) {
          console.error('[ProgressContext] Failed to load Firebase progress:', firebaseError);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to load progress from Firebase' });
          dispatch({ type: 'SET_USER_PROGRESS', payload: null });
        }
      } else {
        // No user, load from local storage
        console.log('[ProgressContext] No user logged in, loading from local storage');
        try {
          const localProgress = await StorageService.getUserProgress();
          dispatch({ type: 'SET_USER_PROGRESS', payload: localProgress });
          console.log('[ProgressContext] Successfully loaded local progress:', localProgress ? 'has data' : 'empty');
        } catch (localError) {
          console.error('[ProgressContext] Failed to load local progress:', localError);
          dispatch({ type: 'SET_USER_PROGRESS', payload: null });
        }
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('[ProgressContext] Error loading progress:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load progress' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user?.uid]); // Only depend on user.uid, not the entire user object

  // Load user progress on mount and when user changes
  useEffect(() => {
    // Use a flag to avoid race conditions when unmounting
    let isActive = true;
    
    const loadProgress = async () => {
      if (isActive) {
        try {
          await loadUserProgress();
        } catch (error) {
          console.error('Error in loadProgress effect:', error);
        }
      }
    };
    
    loadProgress();
    
    return () => {
      isActive = false;
    };
  }, [loadUserProgress]); // Depend on the memoized function

  const updateExamProgress = async (
    examType: string,
    examId: number,
    answers: UserAnswer[],
    score?: number,
    maxScore?: number
  ): Promise<boolean> => {
    try {
      console.log('[ProgressContext] Updating exam progress:', { examType, examId, score, maxScore });
      
      dispatch({ type: 'SET_LOADING', payload: true });
      
      if (user?.uid) {
        // User is logged in, save to Firebase
        try {
          console.log('[ProgressContext] Saving to Firebase for user:', user.uid);
          await firebaseProgressService.saveExamResult(
            examType as any,
            examId,
            {
              examId,
              score: score || 0,
              maxScore: maxScore || 0,
              percentage: maxScore ? Math.round((score || 0) / maxScore * 100) : 0,
              correctAnswers: score || 0,
              totalQuestions: answers.length,
              answers: answers.map(a => ({
                questionId: a.questionId,
                userAnswer: a.answer,
                correctAnswer: '',
                isCorrect: a.isCorrect || false,
              })),
              timestamp: Date.now(),
            },
            user.uid
          );
          
          console.log('[ProgressContext] Successfully saved to Firebase');
          
          // Update in context immediately
          dispatch({
            type: 'UPDATE_EXAM_PROGRESS',
            payload: { examType, examId, answers, score, maxScore },
          });

          // Log practice exam completed
          logEvent(AnalyticsEvents.PRACTICE_EXAM_COMPLETED, {
            section: examType.split('-')[0],
            part: Number((examType.split('-')[1] || '').replace('part', '')) || undefined,
            exam_id: examId,
            score: score || 0,
            max_score: maxScore || 0,
            percentage: maxScore ? Math.round((score || 0) / (maxScore || 1) * 100) : 0,
          });
          
          dispatch({ type: 'SET_LOADING', payload: false });
          return true;
        } catch (firebaseError) {
          console.error('[ProgressContext] Failed to save to Firebase:', firebaseError);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to save progress to Firebase' });
          dispatch({ type: 'SET_LOADING', payload: false });
          return false;
        }
      } else {
        // User is not logged in, save to local storage
        console.log('[ProgressContext] User not logged in, saving to local storage');
        try {
          await StorageService.updateExamProgress(examType, examId, answers, score, maxScore);
          console.log('[ProgressContext] Successfully saved to local storage');
          
          // Update in context immediately
          dispatch({
            type: 'UPDATE_EXAM_PROGRESS',
            payload: { examType, examId, answers, score, maxScore },
          });

          // Log practice exam completed
          logEvent(AnalyticsEvents.PRACTICE_EXAM_COMPLETED, {
            section: examType.split('-')[0],
            part: Number((examType.split('-')[1] || '').replace('part', '')) || undefined,
            exam_id: examId,
            score: score || 0,
            max_score: maxScore || 0,
            percentage: maxScore ? Math.round((score || 0) / (maxScore || 1) * 100) : 0,
          });
          
          dispatch({ type: 'SET_LOADING', payload: false });
          return true;
        } catch (localError) {
          console.error('[ProgressContext] Failed to save to local storage:', localError);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to save progress locally' });
          dispatch({ type: 'SET_LOADING', payload: false });
          return false;
        }
      }
    } catch (error) {
      console.error('[ProgressContext] Error updating exam progress:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update progress' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return false;
    }
  };

  const getExamProgress = (examType: string, examId: number): ExamProgress | null => {
    if (!state.userProgress) return null;
    
    return (
      state.userProgress.exams.find(
        exam => exam.examId === examId && exam.examType === examType
      ) || null
    );
  };

  const clearUserProgress = async (): Promise<boolean> => {
    try {
      if (!user?.uid) {
        console.error('[ProgressContext] Cannot clear progress: User not logged in');
        return false;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Clear Firebase progress only
      try {
        await firebaseProgressService.clearAllProgress(user.uid);
        dispatch({ type: 'CLEAR_PROGRESS' });
        dispatch({ type: 'SET_LOADING', payload: false });
        return true;
      } catch (error) {
        console.error('[ProgressContext] Failed to clear progress:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to clear progress' });
        dispatch({ type: 'SET_LOADING', payload: false });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear progress' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return false;
    }
  };

  const refreshProgress = async (): Promise<void> => {
    await loadUserProgress();
  };

  const syncProgressToFirebase = async (): Promise<boolean> => {
    try {
      return await firebaseProgressService.syncProgressToFirebase(user?.uid);
    } catch (error) {
      console.error('Error syncing progress to Firebase:', error);
      return false;
    }
  };

  const contextValue: ProgressContextType = {
    ...state,
    loadUserProgress,
    updateExamProgress,
    getExamProgress,
    clearUserProgress,
    refreshProgress,
    syncProgressToFirebase,
  };

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  );
};

// Hook to use the context
export const useProgress = (): ProgressContextType => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

// Utility hooks for specific progress data
export const useExamProgress = (examType: string, examId: number) => {
  const { getExamProgress, userProgress } = useProgress();
  return getExamProgress(examType, examId);
};

export const useUserStats = () => {
  const { userProgress } = useProgress();
  
  if (!userProgress) {
    return {
      totalExams: 0,
      completedExams: 0,
      totalScore: 0,
      totalMaxScore: 0,
      averageScore: 0,
      completionRate: 0,
    };
  }

  const completedExams = userProgress.exams.filter(exam => exam.completed).length;
  const totalExams = userProgress.exams.length;
  const averageScore = userProgress.totalMaxScore > 0 
    ? (userProgress.totalScore / userProgress.totalMaxScore) * 100 
    : 0;
  const completionRate = totalExams > 0 ? (completedExams / totalExams) * 100 : 0;

  return {
    totalExams,
    completedExams,
    totalScore: userProgress.totalScore,
    totalMaxScore: userProgress.totalMaxScore,
    averageScore: Math.round(averageScore),
    completionRate: Math.round(completionRate),
  };
};
