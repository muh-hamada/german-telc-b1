import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { UserProgress, ExamProgress, UserAnswer } from '../types/exam.types';
import StorageService from '../services/storage.service';
import firebaseProgressService from '../services/firebase-progress.service';
import { useAuth } from './AuthContext';

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
  hasUnsyncedProgress: () => Promise<boolean>;
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
      if (!state.userProgress) return state;
      
      const { examType, examId, answers, score, maxScore } = action.payload;
      const now = Date.now();
      
      // Find existing exam progress or create new one
      let examProgress = state.userProgress.exams.find(
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
        state.userProgress.exams.push(examProgress);
      }
      
      // Update exam progress
      examProgress.answers = answers;
      examProgress.completed = true;
      examProgress.score = score;
      examProgress.maxScore = maxScore;
      examProgress.lastAttempt = now;
      
      // Update total scores
      const totalScore = state.userProgress.exams.reduce(
        (sum, exam) => sum + (exam.score || 0),
        0
      );
      const totalMaxScore = state.userProgress.exams.reduce(
        (sum, exam) => sum + (exam.maxScore || 0),
        0
      );
      
      return {
        ...state,
        userProgress: {
          ...state.userProgress,
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
  const { user } = useAuth();

  // Load user progress on mount and when user changes
  useEffect(() => {
    loadUserProgress();
  }, [user]);

  const loadUserProgress = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      if (user) {
        // User is authenticated, try to merge local and Firebase progress
        const mergedProgress = await firebaseProgressService.mergeProgress();
        dispatch({ type: 'SET_USER_PROGRESS', payload: mergedProgress });
      } else {
        // No user, just load local progress
        const progress = await StorageService.getUserProgress();
        dispatch({ type: 'SET_USER_PROGRESS', payload: progress });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load progress' });
    }
  };

  const updateExamProgress = async (
    examType: string,
    examId: number,
    answers: UserAnswer[],
    score?: number,
    maxScore?: number
  ): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Update in storage (local and Firebase if authenticated)
      const success = await StorageService.updateExamProgress(
        examType,
        examId,
        answers,
        score,
        maxScore
      );
      
      if (success) {
        // Update in context
        dispatch({
          type: 'UPDATE_EXAM_PROGRESS',
          payload: { examType, examId, answers, score, maxScore },
        });
        
        // Try to sync to Firebase if user is authenticated
        if (user) {
          try {
            await firebaseProgressService.syncProgressToFirebase();
          } catch (firebaseError) {
            console.warn('Failed to sync to Firebase:', firebaseError);
          }
        }
        
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to save progress' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update progress' });
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
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Clear both local and Firebase progress
      const success = await firebaseProgressService.clearAllProgress();
      
      if (success) {
        dispatch({ type: 'CLEAR_PROGRESS' });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to clear progress' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear progress' });
      return false;
    }
  };

  const refreshProgress = async (): Promise<void> => {
    await loadUserProgress();
  };

  const syncProgressToFirebase = async (): Promise<boolean> => {
    try {
      return await firebaseProgressService.syncProgressToFirebase();
    } catch (error) {
      console.error('Error syncing progress to Firebase:', error);
      return false;
    }
  };

  const hasUnsyncedProgress = async (): Promise<boolean> => {
    try {
      return await firebaseProgressService.hasUnsyncedProgress();
    } catch (error) {
      console.error('Error checking unsynced progress:', error);
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
    hasUnsyncedProgress,
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
