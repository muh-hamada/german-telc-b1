/**
 * App Review Service
 * 
 * Manages app review prompts with intelligent timing and user experience:
 * - Only prompts users after positive experiences (score >= 80%)
 * - Respects user preferences (skipped prompts)
 * - Implements cooldown period between prompts
 * - Tracks whether user has already rated the app
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALWAYS_SHOW_REVIEW_MODAL } from '../config/development.config';

const STORAGE_KEYS = {
  LAST_PROMPT_DATE: '@review_last_prompt_date',
  REVIEW_COMPLETED: '@review_completed',
  REVIEW_DISMISSED_COUNT: '@review_dismissed_count',
};

// Configuration
const CONFIG = {
  MIN_SCORE_PERCENTAGE: 80, // Minimum score percentage to trigger review prompt
  COOLDOWN_DAYS: 7, // Days to wait between prompts
  MAX_DISMISS_COUNT: 3, // After this many dismissals, stop prompting
};

export interface ReviewPromptResult {
  shouldShow: boolean;
  reason?: string;
}

class ReviewService {
  /**
   * Check if we should show the review prompt
   * @returns Promise<ReviewPromptResult>
   */
  async shouldShowReviewPrompt(): Promise<ReviewPromptResult> {
    // Always show review modal in demo/testing mode
    if (ALWAYS_SHOW_REVIEW_MODAL) {
      return { shouldShow: true };
    }

    try {
      // Check if user has already reviewed
      const hasReviewed = await this.hasUserReviewed();
      if (hasReviewed) {
        return { 
          shouldShow: false, 
          reason: 'User has already reviewed the app' 
        };
      }

      // Check dismiss count
      const dismissCount = await this.getDismissCount();
      if (dismissCount >= CONFIG.MAX_DISMISS_COUNT) {
        return { 
          shouldShow: false, 
          reason: `User dismissed ${dismissCount} times (max: ${CONFIG.MAX_DISMISS_COUNT})` 
        };
      }

      // Check cooldown period
      const lastPromptDate = await this.getLastPromptDate();
      if (lastPromptDate) {
        const daysSinceLastPrompt = this.getDaysSince(lastPromptDate);
        if (daysSinceLastPrompt < CONFIG.COOLDOWN_DAYS) {
          return { 
            shouldShow: false, 
            reason: `Only ${daysSinceLastPrompt} days since last prompt (min: ${CONFIG.COOLDOWN_DAYS})` 
          };
        }
      }

      return { shouldShow: true };
    } catch (error) {
      console.error('[ReviewService] Error checking if should show prompt:', error);
      return { shouldShow: false, reason: 'Error checking prompt eligibility' };
    }
  }

  /**
   * Check if the score is positive enough to trigger a review prompt
   * @param score User's score
   * @param maxScore Maximum possible score
   * @returns boolean
   */
  isPositiveScore(score: number, maxScore: number): boolean {
    if (maxScore === 0) return false;
    const percentage = (score / maxScore) * 100;
    return percentage >= CONFIG.MIN_SCORE_PERCENTAGE;
  }

  /**
   * Record that the user dismissed the review prompt
   */
  async recordDismissal(): Promise<void> {
    try {
      const currentCount = await this.getDismissCount();
      await AsyncStorage.setItem(
        STORAGE_KEYS.REVIEW_DISMISSED_COUNT,
        String(currentCount + 1)
      );
      await this.updateLastPromptDate();
      console.log('[ReviewService] Recorded dismissal, count:', currentCount + 1);
    } catch (error) {
      console.error('[ReviewService] Error recording dismissal:', error);
    }
  }

  /**
   * Record that the user completed the review
   */
  async recordReviewCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REVIEW_COMPLETED, 'true');
      console.log('[ReviewService] Recorded review completion');
    } catch (error) {
      console.error('[ReviewService] Error recording review completion:', error);
    }
  }

  /**
   * Update the last prompt date to now
   */
  async updateLastPromptDate(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_PROMPT_DATE,
        new Date().toISOString()
      );
    } catch (error) {
      console.error('[ReviewService] Error updating last prompt date:', error);
    }
  }

  /**
   * Check if user has already reviewed the app
   */
  private async hasUserReviewed(): Promise<boolean> {
    try {
      const reviewed = await AsyncStorage.getItem(STORAGE_KEYS.REVIEW_COMPLETED);
      return reviewed === 'true';
    } catch (error) {
      console.error('[ReviewService] Error checking review status:', error);
      return false;
    }
  }

  /**
   * Get the last prompt date
   */
  private async getLastPromptDate(): Promise<Date | null> {
    try {
      const dateStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_PROMPT_DATE);
      return dateStr ? new Date(dateStr) : null;
    } catch (error) {
      console.error('[ReviewService] Error getting last prompt date:', error);
      return null;
    }
  }

  /**
   * Get the number of times user has dismissed the prompt
   */
  private async getDismissCount(): Promise<number> {
    try {
      const count = await AsyncStorage.getItem(STORAGE_KEYS.REVIEW_DISMISSED_COUNT);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('[ReviewService] Error getting dismiss count:', error);
      return 0;
    }
  }

  /**
   * Calculate days since a given date
   */
  private getDaysSince(date: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Reset all review data (for testing purposes)
   */
  async resetReviewData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.LAST_PROMPT_DATE,
        STORAGE_KEYS.REVIEW_COMPLETED,
        STORAGE_KEYS.REVIEW_DISMISSED_COUNT,
      ]);
      console.log('[ReviewService] Reset all review data');
    } catch (error) {
      console.error('[ReviewService] Error resetting review data:', error);
    }
  }

  /**
   * Get review statistics for debugging
   */
  async getReviewStats(): Promise<{
    hasReviewed: boolean;
    dismissCount: number;
    lastPromptDate: Date | null;
    daysSinceLastPrompt: number | null;
  }> {
    const hasReviewed = await this.hasUserReviewed();
    const dismissCount = await this.getDismissCount();
    const lastPromptDate = await this.getLastPromptDate();
    const daysSinceLastPrompt = lastPromptDate 
      ? this.getDaysSince(lastPromptDate) 
      : null;

    return {
      hasReviewed,
      dismissCount,
      lastPromptDate,
      daysSinceLastPrompt,
    };
  }
}

export default new ReviewService();

