/**
 * Vocabulary Builder Types
 * 
 * Type definitions for the vocabulary learning feature with SM-2 spaced repetition.
 */

// User persona types for daily study limits
export type UserPersona = 'beginner' | 'serious' | 'casual';

// Card state in the learning process
export type CardState = 'new' | 'learning' | 'review';

// SM-2 rating (quality of recall)
export type Rating = 1 | 2 | 3 | 4; // 1=Again, 2=Hard, 3=Good, 4=Easy

/**
 * Daily study limits based on user persona
 */
export const PERSONA_DAILY_LIMITS: Record<UserPersona, number> = {
  beginner: 10,
  casual: 20,
  serious: 30,
};

/**
 * Vocabulary word structure (from Firebase)
 */
export interface VocabularyWord {
  id: string; // Firebase auto-generated document ID
  word: string;
  article?: string; // For nouns (der, die, das)
  translations: {
    en?: string;
    es?: string;
    fr?: string;
    ru?: string;
    ar?: string;
    de?: string;
  };
  type: 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'other';
  exampleSentences: ExampleSentence[];
  explanation?: string;
}

/**
 * Example sentence with translations
 */
export interface ExampleSentence {
  text: string;
  translations: {
    en?: string;
    es?: string;
    fr?: string;
    ru?: string;
    ar?: string;
    de?: string;
  };
}

/**
 * Card progress tracking (SM-2 algorithm data)
 */
export interface CardProgress {
  wordId: string; // Firebase document ID
  state: CardState;
  repetitions: number; // Number of successful repetitions
  easeFactor: number; // SM-2 ease factor (min 1.3, default 2.5)
  intervalDays: number; // Current interval in days
  lastReviewDate: number; // Timestamp of last review
  nextDueDate: number; // Timestamp when next review is due
  leechCount: number; // Number of times marked as "Again" (threshold: 8)
  isLeech: boolean; // Flagged as difficult word
  createdAt: number; // When first studied
}

/**
 * Daily study statistics
 */
export interface DailyStats {
  date: string; // YYYY-MM-DD format
  newWordsStudied: number;
  reviewsCompleted: number;
  correctReviews: number; // Rated as Good or Easy
}

/**
 * User's overall vocabulary progress
 */
export interface VocabularyUserProgress {
  // Map of wordId (Firebase document ID) to progress (for quick lookups)
  cards: Record<string, CardProgress>;
  
  // User preferences
  persona: UserPersona;
  
  // Stats
  dailyStats: Record<string, DailyStats>; // date -> stats
  lastStudyDate: string | null; // YYYY-MM-DD
  streak: number; // Current streak in days
  longestStreak: number;
  
  // Metadata
  totalWordsStudied: number; // Total unique words ever studied
  wordsInReview: number; // Words currently being reviewed
  wordsMastered: number; // Words with interval >= 21 days
  
  // Timestamps
  createdAt: number;
  lastUpdated: number;
}

/**
 * Study session data (for recording activity)
 */
export interface StudySession {
  newWordsStudied: number;
  reviewsCompleted: number;
  correctReviews: number;
  date: string; // YYYY-MM-DD
}

/**
 * SM-2 algorithm parameters
 */
export interface SM2Result {
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  nextDueDate: number;
}

/**
 * Vocabulary statistics for display
 */
export interface VocabularyStats {
  totalWords: number; // Total words available
  newWords: number; // Not yet studied
  learningWords: number; // In learning phase
  reviewWords: number; // In review phase
  masteredWords: number; // Interval >= 21 days
  dueToday: number; // Reviews due today
  forecastThisMonth: number; // Estimated words to master this month
}

