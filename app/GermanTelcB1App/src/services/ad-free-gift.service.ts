/**
 * Ad-Free Gift Service
 * 
 * Manages the ad-free day loyalty gift feature:
 * - Tracks user sessions across different calendar days
 * - Checks eligibility for receiving the gift
 * - Manages reward cooldown periods
 * - Stores all data in device storage (AsyncStorage)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SESSION_DATES: '@ad_free_gift_session_dates',
  LAST_REWARD_DATE: '@ad_free_gift_last_reward_date',
};

// Configuration
const CONFIG = {
  REQUIRED_SESSION_DAYS: 3, // User must have sessions on 3 different days
  COOLDOWN_DAYS: 14, // Must wait 14 days between rewards
  MODAL_DELAY_MS: 60 * 1000, // Show modal 1 minute after session start
  MAX_STREAK_FOR_ELIGIBILITY: 4, // If streak is 5+, user gets streak reward soon
};

interface SessionData {
  dates: string[]; // Array of YYYY-MM-DD strings
  lastUpdated: number;
}

interface EligibilityResult {
  isEligible: boolean;
  reason?: string;
  sessionCount?: number;
  daysSinceLastReward?: number;
}

class AdFreeGiftService {
  /**
   * Get today's date as YYYY-MM-DD string in local timezone
   */
  private getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Calculate days between two dates
   */
  private daysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Record a session for today
   * @returns Updated session data
   */
  async recordSession(): Promise<SessionData> {
    try {
      const today = this.getTodayDateString();
      const sessionData = await this.getSessionData();

      // Check if today already recorded
      if (!sessionData.dates.includes(today)) {
        sessionData.dates.push(today);
        sessionData.lastUpdated = Date.now();
        
        // Keep only last 30 days to avoid unbounded growth
        if (sessionData.dates.length > 30) {
          sessionData.dates = sessionData.dates.slice(-30);
        }

        await AsyncStorage.setItem(
          STORAGE_KEYS.SESSION_DATES,
          JSON.stringify(sessionData)
        );

        console.log('[AdFreeGift] Session recorded for:', today, 'Total unique days:', sessionData.dates.length);
      }

      return sessionData;
    } catch (error) {
      console.error('[AdFreeGift] Error recording session:', error);
      return { dates: [], lastUpdated: Date.now() };
    }
  }

  /**
   * Get session data from storage
   */
  async getSessionData(): Promise<SessionData> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_DATES);
      if (!data) {
        return { dates: [], lastUpdated: Date.now() };
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('[AdFreeGift] Error getting session data:', error);
      return { dates: [], lastUpdated: Date.now() };
    }
  }

  /**
   * Get last reward date
   */
  async getLastRewardDate(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LAST_REWARD_DATE);
    } catch (error) {
      console.error('[AdFreeGift] Error getting last reward date:', error);
      return null;
    }
  }

  /**
   * Record that reward was given
   */
  async recordRewardGiven(): Promise<void> {
    try {
      const today = this.getTodayDateString();
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_REWARD_DATE, today);
      console.log('[AdFreeGift] Reward marked as given on:', today);
    } catch (error) {
      console.error('[AdFreeGift] Error recording reward:', error);
    }
  }

  /**
   * Check if user is eligible for the ad-free day gift
   * @param isPremium - Whether user has premium subscription
   * @param hasAdFreeReward - Whether user already has ad-free from streaks
   * @param hasStreakReward - Whether user has streak reward active
   * @param currentStreak - User's current streak count
   * @returns Eligibility result with reason
   */
  async checkEligibility(
    isPremium: boolean,
    hasAdFreeReward: boolean,
    hasStreakReward: boolean,
    currentStreak: number
  ): Promise<EligibilityResult> {
    try {
      // Must be free user
      if (isPremium) {
        return {
          isEligible: false,
          reason: 'User has premium subscription',
        };
      }

      // Must not have ad-free reward already active
      if (hasAdFreeReward) {
        return {
          isEligible: false,
          reason: 'User already has ad-free day from streaks',
        };
      }

      // Must not have streak reward active
      if (hasStreakReward) {
        return {
          isEligible: false,
          reason: 'User has streak reward active',
        };
      }

      // Streak must be less than 5 (if >= 5, they get streak reward soon)
      if (currentStreak >= 5) {
        return {
          isEligible: false,
          reason: `User streak is ${currentStreak}, will get streak reward soon`,
        };
      }

      // Check session count (must have at least 3 sessions on different days)
      const sessionData = await this.getSessionData();
      const uniqueDays = sessionData.dates.length;
      
      if (uniqueDays < CONFIG.REQUIRED_SESSION_DAYS) {
        return {
          isEligible: false,
          reason: `User has only ${uniqueDays} session days (need ${CONFIG.REQUIRED_SESSION_DAYS})`,
          sessionCount: uniqueDays,
        };
      }

      // Check cooldown period
      const lastRewardDate = await this.getLastRewardDate();
      if (lastRewardDate) {
        const today = this.getTodayDateString();
        const daysSince = this.daysBetween(lastRewardDate, today);
        
        if (daysSince < CONFIG.COOLDOWN_DAYS) {
          return {
            isEligible: false,
            reason: `Only ${daysSince} days since last reward (need ${CONFIG.COOLDOWN_DAYS})`,
            daysSinceLastReward: daysSince,
          };
        }
      }

      // All checks passed
      return {
        isEligible: true,
        sessionCount: uniqueDays,
      };
    } catch (error) {
      console.error('[AdFreeGift] Error checking eligibility:', error);
      return {
        isEligible: false,
        reason: 'Error checking eligibility',
      };
    }
  }

  /**
   * Get configuration constants (for testing/debugging)
   */
  getConfig() {
    return { ...CONFIG };
  }

  /**
   * Reset all data (for testing purposes)
   */
  async resetData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SESSION_DATES,
        STORAGE_KEYS.LAST_REWARD_DATE,
      ]);
      console.log('[AdFreeGift] All data reset');
    } catch (error) {
      console.error('[AdFreeGift] Error resetting data:', error);
    }
  }

  /**
   * Get debug statistics
   */
  async getDebugStats(): Promise<{
    uniqueSessionDays: number;
    sessionDates: string[];
    lastRewardDate: string | null;
    daysSinceLastReward: number | null;
  }> {
    const sessionData = await this.getSessionData();
    const lastRewardDate = await this.getLastRewardDate();
    const today = this.getTodayDateString();
    
    return {
      uniqueSessionDays: sessionData.dates.length,
      sessionDates: sessionData.dates,
      lastRewardDate,
      daysSinceLastReward: lastRewardDate ? this.daysBetween(lastRewardDate, today) : null,
    };
  }
}

export default new AdFreeGiftService();
