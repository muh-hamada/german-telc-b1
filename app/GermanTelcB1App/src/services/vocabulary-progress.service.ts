/**
 * Vocabulary Progress Service
 * 
 * Manages user vocabulary progress and implements SM-2 spaced repetition algorithm.
 * Stores progress in Firebase: users/{uid}/vocabulary_progress_{language}_{level}/data
 */

import firestore, { Timestamp } from '@react-native-firebase/firestore';
import { activeExamConfig } from '../config/active-exam.config';
import {
  VocabularyUserProgress,
  CardProgress,
  CardState,
  Rating,
  SM2Result,
  DailyStats,
  UserPersona,
  PERSONA_DAILY_LIMITS,
  StudySession,
  VocabularyStats,
} from '../types/vocabulary.types';

const LEECH_THRESHOLD = 8; // Number of "Again" ratings before marking as leech
const MASTERY_INTERVAL = 21; // Days interval to be considered "mastered"
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

class VocabularyProgressService {
  // Lazy-loaded to avoid initialization order issues
  private get vocabularyProgressPath(): string {
    return activeExamConfig.firebaseCollections.vocabularyProgress;
  }

  /**
   * Get the user's vocabulary progress path
   */
  private getUserProgressPath(uid: string): string {
    return this.vocabularyProgressPath.replace('{uid}', uid);
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  private getTodayString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Create default progress object for new users
   * Note: Don't set persona - let onboarding set it
   */
  private createDefaultProgress(persona?: UserPersona): VocabularyUserProgress {
    const now = Date.now();
    return {
      cards: {},
      persona: persona || null as any, // null indicates needs onboarding
      dailyStats: {},
      lastStudyDate: null,
      streak: 0,
      longestStreak: 0,
      totalWordsStudied: 0,
      wordsInReview: 0,
      wordsMastered: 0,
      createdAt: now,
      lastUpdated: now,
    };
  }

  /**
   * SM-2 Algorithm Implementation
   * @param cardProgress - Current card progress
   * @param rating - Quality of recall (1=Again, 2=Hard, 3=Good, 4=Easy)
   * @returns Updated SM-2 parameters
   */
  calculateNextReview(cardProgress: CardProgress, rating: Rating): SM2Result {
    let { repetitions, easeFactor, intervalDays } = cardProgress;

    // Rating conversion: 1=Again, 2=Hard, 3=Good, 4=Easy
    // SM-2 uses quality 0-5, we map: 1->2, 2->3, 3->4, 4->5
    const quality = rating + 1;

    // If quality < 3 (Again or Hard below threshold), reset repetitions
    if (quality < 3) {
      repetitions = 0;
    } else {
      repetitions += 1;
    }

    // Update ease factor
    // Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor);

    // Calculate interval based on rating
    if (rating === 1) {
      // Again: reset to 1 day
      intervalDays = 1;
    } else if (rating === 2) {
      // Hard: previous interval * 1.2
      intervalDays = Math.round(intervalDays * 1.2);
    } else if (rating === 3) {
      // Good: standard SM-2
      if (repetitions === 1) {
        intervalDays = 1;
      } else if (repetitions === 2) {
        intervalDays = 6;
      } else {
        intervalDays = Math.round(intervalDays * easeFactor);
      }
    } else {
      // Easy: interval * ease * 1.5
      if (repetitions === 1) {
        intervalDays = 4;
      } else if (repetitions === 2) {
        intervalDays = 10;
      } else {
        intervalDays = Math.round(intervalDays * easeFactor * 1.5);
      }
    }

    // Add 10% random fuzz to avoid clustering
    const fuzz = 0.1;
    const fuzzFactor = 1 + (Math.random() * fuzz * 2 - fuzz);
    intervalDays = Math.max(1, Math.round(intervalDays * fuzzFactor));

    // Calculate next due date
    const nextDueDate = Date.now() + intervalDays * 24 * 60 * 60 * 1000;

    return {
      repetitions,
      easeFactor,
      intervalDays,
      nextDueDate,
    };
  }

  /**
   * Get user's vocabulary progress from Firebase
   */
  async getUserProgress(uid: string): Promise<VocabularyUserProgress> {
    try {
      const progressPath = this.getUserProgressPath(uid);
      console.log(`[VocabularyProgressService] Getting progress for uid: ${uid}, path: ${progressPath}`);

      const doc = await firestore().doc(progressPath).get();

      if (!doc.exists) {
        console.log('[VocabularyProgressService] No progress found, creating default');
        return this.createDefaultProgress();
      }

      const data = doc.data();
      if (!data) {
        return this.createDefaultProgress();
      }

      // Convert Firestore data to VocabularyUserProgress
      const progress: VocabularyUserProgress = {
        cards: data.cards || {},
        persona: data.persona || 'serious',
        dailyStats: data.dailyStats || {},
        lastStudyDate: data.lastStudyDate || null,
        streak: data.streak || 0,
        longestStreak: data.longestStreak || 0,
        totalWordsStudied: data.totalWordsStudied || 0,
        wordsInReview: data.wordsInReview || 0,
        wordsMastered: data.wordsMastered || 0,
        createdAt: data.createdAt || Date.now(),
        lastUpdated: data.lastUpdated || Date.now(),
      };

      console.log(`[VocabularyProgressService] Progress loaded: ${progress.totalWordsStudied} words studied`);
      return progress;
    } catch (error) {
      console.error('[VocabularyProgressService] Error getting progress:', error);
      return this.createDefaultProgress();
    }
  }

  /**
   * Save user's vocabulary progress to Firebase
   */
  async saveUserProgress(uid: string, progress: VocabularyUserProgress): Promise<void> {
    try {
      const progressPath = this.getUserProgressPath(uid);
      const progressData = {
        ...progress,
        lastUpdated: Date.now(),
      };

      await firestore().doc(progressPath).set(progressData, { merge: true });
      console.log('[VocabularyProgressService] Progress saved successfully');
    } catch (error) {
      console.error('[VocabularyProgressService] Error saving progress:', error);
      throw error;
    }
  }

  /**
   * Get new words (not yet studied)
   * Note: With Firebase auto-generated IDs, we need to fetch words from Firestore
   * and filter out studied ones. This method just returns studied word IDs.
   * @param progress - User's progress
   * @returns Array of word IDs that have been studied
   */
  getStudiedWordIds(progress: VocabularyUserProgress): string[] {
    return Object.keys(progress.cards);
  }

  /**
   * Get words due for review today
   * @param progress - User's progress
   * @returns Array of word IDs due for review
   */
  getDueReviews(progress: VocabularyUserProgress): string[] {
    const now = Date.now();
    const dueWordIds: string[] = [];

    Object.values(progress.cards).forEach(card => {
      if (card.state !== 'new' && card.nextDueDate <= now) {
        dueWordIds.push(card.wordId);
      }
    });

    return dueWordIds;
  }

  /**
   * Mark a new word as learned (first time studying)
   * @param uid - User ID
   * @param wordId - Firebase document ID
   * @returns Updated progress
   */
  async markWordAsLearned(uid: string, wordId: string): Promise<VocabularyUserProgress> {
    const progress = await this.getUserProgress(uid);
    const now = Date.now();

    // Create new card progress
    const cardProgress: CardProgress = {
      wordId,
      state: 'learning',
      repetitions: 0,
      easeFactor: DEFAULT_EASE_FACTOR,
      intervalDays: 1,
      lastReviewDate: now,
      nextDueDate: now + 24 * 60 * 60 * 1000, // Due tomorrow
      leechCount: 0,
      isLeech: false,
      createdAt: now,
    };

    progress.cards[wordId] = cardProgress;
    progress.totalWordsStudied += 1;
    progress.wordsInReview += 1;
    progress.lastUpdated = now;

    await this.saveUserProgress(uid, progress);
    return progress;
  }

  /**
   * Review a word with SM-2 rating
   * @param uid - User ID
   * @param wordId - Firebase document ID
   * @param rating - Quality rating (1-4)
   * @returns Updated progress
   */
  async reviewWord(uid: string, wordId: string, rating: Rating): Promise<VocabularyUserProgress> {
    const progress = await this.getUserProgress(uid);
    const cardProgress = progress.cards[wordId];

    if (!cardProgress) {
      throw new Error(`Word ${wordId} not found in progress`);
    }

    const now = Date.now();

    // Calculate next review using SM-2
    const sm2Result = this.calculateNextReview(cardProgress, rating);

    // Update card progress
    cardProgress.repetitions = sm2Result.repetitions;
    cardProgress.easeFactor = sm2Result.easeFactor;
    cardProgress.intervalDays = sm2Result.intervalDays;
    cardProgress.lastReviewDate = now;
    cardProgress.nextDueDate = sm2Result.nextDueDate;

    // Handle "Again" rating - increment leech count
    if (rating === 1) {
      cardProgress.leechCount += 1;
      if (cardProgress.leechCount >= LEECH_THRESHOLD) {
        cardProgress.isLeech = true;
      }
    }

    // Update card state based on interval
    if (sm2Result.intervalDays >= MASTERY_INTERVAL) {
      if (cardProgress.state !== 'review') {
        progress.wordsInReview -= 1;
        progress.wordsMastered += 1;
      }
      cardProgress.state = 'review';
    } else if (cardProgress.state === 'learning') {
      cardProgress.state = 'learning';
    }

    progress.cards[wordId] = cardProgress;
    progress.lastUpdated = now;

    await this.saveUserProgress(uid, progress);
    return progress;
  }

  /**
   * Record a study session
   * @param uid - User ID
   * @param session - Study session data
   * @returns Updated progress
   */
  async recordStudySession(uid: string, session: StudySession): Promise<VocabularyUserProgress> {
    const progress = await this.getUserProgress(uid);
    const today = this.getTodayString();

    // Update daily stats
    const todayStats: DailyStats = progress.dailyStats[today] || {
      date: today,
      newWordsStudied: 0,
      reviewsCompleted: 0,
      correctReviews: 0,
    };

    todayStats.newWordsStudied += session.newWordsStudied;
    todayStats.reviewsCompleted += session.reviewsCompleted;
    todayStats.correctReviews += session.correctReviews;

    progress.dailyStats[today] = todayStats;

    // Update streak
    if (progress.lastStudyDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      if (progress.lastStudyDate === yesterdayString) {
        // Continue streak
        progress.streak += 1;
      } else if (progress.lastStudyDate === null) {
        // First day
        progress.streak = 1;
      } else {
        // Streak broken, reset
        progress.streak = 1;
      }

      progress.lastStudyDate = today;
      progress.longestStreak = Math.max(progress.longestStreak, progress.streak);
    }

    await this.saveUserProgress(uid, progress);
    return progress;
  }

  /**
   * Get vocabulary statistics
   */
  getVocabularyStats(progress: VocabularyUserProgress, totalWords: number): VocabularyStats {
    const studiedWords = Object.keys(progress.cards).length;
    const newWords = totalWords - studiedWords;
    
    let learningWords = 0;
    let reviewWords = 0;
    let masteredWords = 0;
    let dueToday = 0;

    const now = Date.now();

    Object.values(progress.cards).forEach(card => {
      if (card.state === 'learning') {
        learningWords += 1;
      } else if (card.state === 'review') {
        reviewWords += 1;
        if (card.intervalDays >= MASTERY_INTERVAL) {
          masteredWords += 1;
        }
      }

      if (card.nextDueDate <= now) {
        dueToday += 1;
      }
    });

    // Simple forecast: based on current pace
    const todayString = this.getTodayString();
    const todayStats = progress.dailyStats[todayString];
    const avgPerDay = todayStats ? todayStats.newWordsStudied : 5;
    const forecastThisMonth = Math.min(avgPerDay * 30, newWords);

    return {
      totalWords,
      newWords,
      learningWords,
      reviewWords,
      masteredWords,
      dueToday,
      forecastThisMonth,
    };
  }

  /**
   * Get daily limit based on persona
   */
  getDailyLimit(persona: UserPersona): number {
    return PERSONA_DAILY_LIMITS[persona];
  }

  /**
   * Check if daily limit reached
   */
  hasReachedDailyLimit(progress: VocabularyUserProgress): boolean {
    const today = this.getTodayString();
    const todayStats = progress.dailyStats[today];
    
    if (!todayStats) {
      return false;
    }

    const dailyLimit = this.getDailyLimit(progress.persona);
    return todayStats.newWordsStudied >= dailyLimit;
  }

  /**
   * Set user persona
   */
  async setUserPersona(uid: string, persona: UserPersona): Promise<void> {
    const progress = await this.getUserProgress(uid);
    progress.persona = persona;
    await this.saveUserProgress(uid, progress);
  }
}

export default new VocabularyProgressService();

