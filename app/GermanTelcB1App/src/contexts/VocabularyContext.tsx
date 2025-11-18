/**
 * Vocabulary Context
 * 
 * Provides global vocabulary state and actions for the vocabulary builder feature.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import vocabularyDataService from '../services/vocabulary-data.service';
import vocabularyProgressService from '../services/vocabulary-progress.service';
import {
  VocabularyUserProgress,
  VocabularyWord,
  Rating,
  UserPersona,
  VocabularyStats,
} from '../types/vocabulary.types';

interface VocabularyContextType {
  // State
  progress: VocabularyUserProgress | null;
  stats: VocabularyStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Computed values
  newWordsCount: number;
  dueReviewsCount: number;
  hasReachedDailyLimit: boolean;
  
  // Actions
  loadProgress: () => Promise<void>;
  markWordAsLearned: (wordId: string) => Promise<void>;
  reviewWord: (wordId: string, rating: Rating) => Promise<void>;
  setUserPersona: (persona: UserPersona) => Promise<void>;
  getNewWords: (limit: number) => Promise<VocabularyWord[]>;
  getDueWords: () => Promise<VocabularyWord[]>;
  refreshStats: () => Promise<void>;
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

interface VocabularyProviderProps {
  children: ReactNode;
}

export const VocabularyProvider: React.FC<VocabularyProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<VocabularyUserProgress | null>(null);
  const [stats, setStats] = useState<VocabularyStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalWords, setTotalWords] = useState(0);

  // Computed values
  const newWordsCount = stats?.newWords || 0;
  const dueReviewsCount = stats?.dueToday || 0;
  const hasReachedDailyLimit = progress 
    ? vocabularyProgressService.hasReachedDailyLimit(progress)
    : false;

  /**
   * Load user's vocabulary progress
   */
  const loadProgress = useCallback(async () => {
    if (!user?.uid) {
      console.log('[VocabularyContext] No user, clearing progress');
      setProgress(null);
      setStats(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[VocabularyContext] Loading progress for user:', user.uid);

      // Fetch progress and total word count in parallel
      const [userProgress, wordCount] = await Promise.all([
        vocabularyProgressService.getUserProgress(user.uid),
        vocabularyDataService.getTotalWordCount(),
      ]);

      setProgress(userProgress);
      setTotalWords(wordCount);

      // Calculate stats
      const vocabularyStats = vocabularyProgressService.getVocabularyStats(userProgress, wordCount);
      setStats(vocabularyStats);

      console.log('[VocabularyContext] Progress loaded:', {
        totalWords: wordCount,
        studied: userProgress.totalWordsStudied,
        dueToday: vocabularyStats.dueToday,
      });
    } catch (err) {
      console.error('[VocabularyContext] Error loading progress:', err);
      setError('Failed to load vocabulary progress');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  /**
   * Load progress when user changes
   */
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  /**
   * Mark a new word as learned
   */
  const markWordAsLearned = useCallback(async (wordId: string) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('[VocabularyContext] Marking word as learned:', wordId);
      const updatedProgress = await vocabularyProgressService.markWordAsLearned(user.uid, wordId);
      setProgress(updatedProgress);

      // Update stats
      const vocabularyStats = vocabularyProgressService.getVocabularyStats(updatedProgress, totalWords);
      setStats(vocabularyStats);
    } catch (err) {
      console.error('[VocabularyContext] Error marking word as learned:', err);
      throw err;
    }
  }, [user?.uid, totalWords]);

  /**
   * Review a word with rating
   */
  const reviewWord = useCallback(async (wordId: string, rating: Rating) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('[VocabularyContext] Reviewing word:', wordId, 'rating:', rating);
      const updatedProgress = await vocabularyProgressService.reviewWord(user.uid, wordId, rating);
      setProgress(updatedProgress);

      // Update stats
      const vocabularyStats = vocabularyProgressService.getVocabularyStats(updatedProgress, totalWords);
      setStats(vocabularyStats);
    } catch (err) {
      console.error('[VocabularyContext] Error reviewing word:', err);
      throw err;
    }
  }, [user?.uid, totalWords]);

  /**
   * Set user persona
   */
  const setUserPersona = useCallback(async (persona: UserPersona) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('[VocabularyContext] Setting persona:', persona);
      await vocabularyProgressService.setUserPersona(user.uid, persona);
      await loadProgress(); // Reload to get updated progress
    } catch (err) {
      console.error('[VocabularyContext] Error setting persona:', err);
      throw err;
    }
  }, [user?.uid, loadProgress]);

  /**
   * Get new words to study
   */
  const getNewWords = useCallback(async (limit: number): Promise<VocabularyWord[]> => {
    if (!progress) {
      return [];
    }

    try {
      console.log('[VocabularyContext] Getting new words, limit:', limit);
      
      // Get studied word IDs as a Set for O(1) lookup performance
      const studiedWordIds = new Set(vocabularyProgressService.getStudiedWordIds(progress));
      
      // Use the new method that handles cursor-based pagination automatically
      const newWords = await vocabularyDataService.getNewWords(studiedWordIds, limit);

      console.log('[VocabularyContext] Retrieved', newWords.length, 'new words');
      return newWords;
    } catch (err) {
      console.error('[VocabularyContext] Error getting new words:', err);
      return [];
    }
  }, [progress]);

  /**
   * Get words due for review
   */
  const getDueWords = useCallback(async (): Promise<VocabularyWord[]> => {
    if (!progress) {
      return [];
    }

    try {
      console.log('[VocabularyContext] Getting due words');
      const dueWordIds = vocabularyProgressService.getDueReviews(progress);
      
      // Fetch word data for these IDs
      const words: VocabularyWord[] = [];
      for (const wordId of dueWordIds) {
        const word = await vocabularyDataService.getWordById(wordId);
        if (word) {
          words.push(word);
        }
      }

      console.log('[VocabularyContext] Retrieved', words.length, 'due words');
      return words;
    } catch (err) {
      console.error('[VocabularyContext] Error getting due words:', err);
      return [];
    }
  }, [progress]);

  /**
   * Refresh statistics
   */
  const refreshStats = useCallback(async () => {
    if (!progress) {
      return;
    }

    try {
      const vocabularyStats = vocabularyProgressService.getVocabularyStats(progress, totalWords);
      setStats(vocabularyStats);
    } catch (err) {
      console.error('[VocabularyContext] Error refreshing stats:', err);
    }
  }, [progress, totalWords]);

  const value: VocabularyContextType = {
    progress,
    stats,
    isLoading,
    error,
    newWordsCount,
    dueReviewsCount,
    hasReachedDailyLimit,
    loadProgress,
    markWordAsLearned,
    reviewWord,
    setUserPersona,
    getNewWords,
    getDueWords,
    refreshStats,
  };

  return (
    <VocabularyContext.Provider value={value}>
      {children}
    </VocabularyContext.Provider>
  );
};

/**
 * Hook to use vocabulary context
 */
export const useVocabulary = (): VocabularyContextType => {
  const context = useContext(VocabularyContext);
  if (context === undefined) {
    throw new Error('useVocabulary must be used within a VocabularyProvider');
  }
  return context;
};

