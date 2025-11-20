import firestore from '@react-native-firebase/firestore';
import { activeExamConfig } from '../config/active-exam.config';
import { AnalyticsEvents, logEvent } from './analytics.events';
import { 
  STREAK_REWARD_THRESHOLD, 
  AD_FREE_DURATION_HOURS,
  calculateRewardDays
} from '../constants/streak.constants';

// Type Definitions
export interface DailyActivity {
  activitiesCount: number; // Total number of activities (exams + study sessions)
  examsCompleted: number;
  studySessionsCompleted: number;
  timestamp: number;
}

export interface AdFreeReward {
  earned: boolean;
  claimed: boolean;
  expiresAt: number | null;
  earnedAt: number | null;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string; // YYYY-MM-DD in user's local timezone
  totalDays: number;
  dailyActivities: { [date: string]: DailyActivity };
  adFreeReward: AdFreeReward;
  streakModalShownToday: boolean;
  lastStreakModalDate: string; // YYYY-MM-DD
}

export interface WeeklyActivityData {
  date: string;
  activitiesCount: number; // Total activities for the day
  examsCompleted: number;
  studySessionsCompleted: number;
}

// Helper functions
function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDay(date1: string, date2: string): boolean {
  return date1 === date2;
}

function isConsecutiveDay(lastDate: string, currentDate: string): boolean {
  const last = new Date(lastDate);
  const current = new Date(currentDate);
  const diffTime = current.getTime() - last.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays === 1;
}

function shouldIncrementStreak(lastActivityDate: string): boolean {
  const today = getLocalDateString();
  if (isSameDay(lastActivityDate, today)) {
    // Same day, no increment
    return false;
  }
  return isConsecutiveDay(lastActivityDate, today);
}

class FirebaseStreaksService {
  // Lazy-loaded to avoid initialization order issues
  private get examId(): string {
    return activeExamConfig.id;
  }

  /**
   * Get the streaks path for a specific user
   * Replaces {uid} placeholder with actual userId and {examId} with exam ID
   */
  private getStreaksPath(userId: string): string {
    return activeExamConfig.firebaseCollections.streaks
      .replace('{uid}', userId)
      .replace('{examId}', this.examId);
  }

  /**
   * Initialize default streak data
   */
  private getDefaultStreakData(): StreakData {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: '',
      totalDays: 0,
      dailyActivities: {},
      adFreeReward: {
        earned: false,
        claimed: false,
        expiresAt: null,
        earnedAt: null,
      },
      streakModalShownToday: false,
      lastStreakModalDate: '',
    };
  }

  /**
   * Get streak data for a user
   */
  async getStreakData(userId: string): Promise<StreakData> {
    try {
      const docPath = this.getStreaksPath(userId);
      const doc = await firestore().doc(docPath).get();
      
      if (!doc.exists) {
        console.log('[StreaksService] No streak data found, returning defaults');
        return this.getDefaultStreakData();
      }

      const data = doc.data();
      if (!data) {
        console.log('[StreaksService] Document exists but data is empty, returning defaults');
        return this.getDefaultStreakData();
      }

      const streakData = data as StreakData;
      
      // Ensure all required fields exist (migration/backwards compatibility)
      const completeData: StreakData = {
        currentStreak: streakData.currentStreak || 0,
        longestStreak: streakData.longestStreak || 0,
        lastActivityDate: streakData.lastActivityDate || '',
        totalDays: streakData.totalDays || 0,
        dailyActivities: streakData.dailyActivities || {},
        adFreeReward: streakData.adFreeReward || {
          earned: false,
          claimed: false,
          expiresAt: null,
          earnedAt: null,
        },
        streakModalShownToday: streakData.streakModalShownToday || false,
        lastStreakModalDate: streakData.lastStreakModalDate || '',
      };
      
      console.log('[StreaksService] Loaded streak data:', completeData);
      return completeData;
    } catch (error) {
      console.error('[StreaksService] Error getting streak data:', error);
      return this.getDefaultStreakData();
    }
  }

  /**
   * Record activity for the day
   * @param userId - User ID
   * @param activityType - Type of activity ('exam', 'completion', 'grammar_study')
   * @param activityId - Unique identifier for this activity (to avoid duplicates)
   * @param score - Score earned (optional, for future use)
   */
  async recordActivity(
    userId: string,
    activityType: 'exam' | 'completion' | 'grammar_study' | 'vocabulary_study',
    activityId: string = '',
    score: number = 0
  ): Promise<{ success: boolean; shouldShowModal: boolean; streakData: StreakData }> {
    try {
      console.log('[StreaksService] Recording activity:', { activityType, activityId, score });
      
      const today = getLocalDateString();
      const docPath = this.getStreaksPath(userId);
      const docRef = firestore().doc(docPath);

      // Get current data
      const doc = await docRef.get();
      let streakData: StreakData;
      
      if (!doc.exists) {
        console.log('[StreaksService] Document does not exist, creating default data');
        streakData = this.getDefaultStreakData();
      } else {
        const data = doc.data();
        if (!data) {
          console.log('[StreaksService] Document exists but data is empty, creating default data');
          streakData = this.getDefaultStreakData();
        } else {
          streakData = data as StreakData;
          // Ensure all required fields exist (migration/backwards compatibility)
          if (!streakData.dailyActivities) {
            streakData.dailyActivities = {};
          }
          if (!streakData.adFreeReward) {
            streakData.adFreeReward = {
              earned: false,
              claimed: false,
              expiresAt: null,
              earnedAt: null,
            };
          }
          if (streakData.lastActivityDate === undefined) {
            streakData.lastActivityDate = '';
          }
          if (streakData.lastStreakModalDate === undefined) {
            streakData.lastStreakModalDate = '';
          }
        }
      }

      console.log('[StreaksService] Current streak data:', {
        currentStreak: streakData.currentStreak,
        lastActivityDate: streakData.lastActivityDate,
        totalDays: streakData.totalDays,
      });

      // Check if this is the first activity of the day
      const isFirstActivityToday = !streakData.lastActivityDate || !isSameDay(streakData.lastActivityDate, today);

      // Initialize today's activity if it doesn't exist
      if (!streakData.dailyActivities[today]) {
        streakData.dailyActivities[today] = {
          activitiesCount: 0,
          examsCompleted: 0,
          studySessionsCompleted: 0,
          timestamp: Date.now(),
        };
      }

      // Get today's activity
      const todayActivity = streakData.dailyActivities[today];

      // Increment activity count
      todayActivity.activitiesCount += 1;

      // Track activity type
      if (activityType === 'exam' || activityType === 'completion') {
        todayActivity.examsCompleted += 1;
      } else if (activityType === 'grammar_study' || activityType === 'vocabulary_study') {
        todayActivity.studySessionsCompleted += 1;
      }

      // Update timestamp
      todayActivity.timestamp = Date.now();

      let shouldShowModal = false;

      // Since any activity counts, check if this is the first activity of the day
      if (isFirstActivityToday) {
        // Update streak information
        if (streakData.lastActivityDate === '') {
          // First ever activity
          streakData.currentStreak = 1;
          streakData.longestStreak = 1;
          streakData.totalDays = 1;
        } else if (shouldIncrementStreak(streakData.lastActivityDate)) {
          // Consecutive day
          streakData.currentStreak += 1;
          streakData.totalDays += 1;
          if (streakData.currentStreak > streakData.longestStreak) {
            streakData.longestStreak = streakData.currentStreak;
          }
        } else if (!isSameDay(streakData.lastActivityDate, today)) {
          // Streak broken
          console.log('[StreaksService] Streak broken');
          logEvent(AnalyticsEvents.STREAK_BROKEN, {
            previous_streak: streakData.currentStreak,
          });
          streakData.currentStreak = 1;
          streakData.totalDays += 1;
        }

        streakData.lastActivityDate = today;

        // Check if user reached a new reward milestone
        // Reward is earned at every 7-day multiple (7, 14, 21, etc.)
        const currentRewardLevel = calculateRewardDays(streakData.currentStreak);
        const previousRewardLevel = calculateRewardDays(streakData.currentStreak - 1);
        
        if (currentRewardLevel > previousRewardLevel && currentRewardLevel > 0) {
          // User just reached a new milestone!
          streakData.adFreeReward.earned = true;
          streakData.adFreeReward.earnedAt = Date.now();
          console.log(`[StreaksService] User earned ${currentRewardLevel}-day reward at ${streakData.currentStreak} day streak!`);
          logEvent(AnalyticsEvents.STREAK_REWARD_EARNED, {
            streak: streakData.currentStreak,
            rewardDays: currentRewardLevel,
          });
        }

        // Check if modal should be shown
        if (!streakData.streakModalShownToday || !isSameDay(streakData.lastStreakModalDate, today)) {
          shouldShowModal = true;
          streakData.streakModalShownToday = true;
          streakData.lastStreakModalDate = today;
        }
      }

      // Save updated data
      await docRef.set(streakData);

      logEvent(AnalyticsEvents.STREAK_ACTIVITY_RECORDED, {
        activity_type: activityType,
        activity_id: activityId,
        current_streak: streakData.currentStreak,
        total_days: streakData.totalDays,
      });

      console.log('[StreaksService] Activity recorded successfully', {
        currentStreak: streakData.currentStreak,
        shouldShowModal,
        activitiesCount: todayActivity.activitiesCount,
      });

      return { success: true, shouldShowModal, streakData };
    } catch (error) {
      console.error('[StreaksService] Error recording activity:', error);
      return {
        success: false,
        shouldShowModal: false,
        streakData: this.getDefaultStreakData(),
      };
    }
  }

  /**
   * Check and update streak (useful for checking on app launch)
   */
  async checkAndUpdateStreak(userId: string): Promise<StreakData> {
    try {
      const streakData = await this.getStreakData(userId);
      const today = getLocalDateString();

      // If last activity was yesterday, streak is still valid
      // If last activity was 2+ days ago, streak is broken (but we don't reset it here, that happens on next activity)
      // If last activity was today, nothing to update

      // Just return the data, the streak will be updated on next activity
      return streakData;
    } catch (error) {
      console.error('[StreaksService] Error checking streak:', error);
      return this.getDefaultStreakData();
    }
  }

  /**
   * Claim the ad-free reward
   */
  async claimAdFreeReward(userId: string): Promise<boolean> {
    try {
      console.log('[StreaksService] Claiming ad-free reward');
      
      const docPath = this.getStreaksPath(userId);
      const docRef = firestore().doc(docPath);
      const doc = await docRef.get();

      if (!doc.exists) {
        console.error('[StreaksService] No streak data found');
        return false;
      }

      const streakData = doc.data() as StreakData;

      if (!streakData.adFreeReward.earned) {
        console.error('[StreaksService] Reward not earned yet');
        return false;
      }

      if (streakData.adFreeReward.claimed && streakData.adFreeReward.expiresAt && streakData.adFreeReward.expiresAt > Date.now()) {
        console.log('[StreaksService] Reward already claimed and still active');
        return true;
      }

      // Claim the reward
      const now = Date.now();
      const rewardDays = calculateRewardDays(streakData.currentStreak);
      const rewardHours = rewardDays * AD_FREE_DURATION_HOURS;
      const expiresAt = now + (rewardHours * 60 * 60 * 1000);

      streakData.adFreeReward.claimed = true;
      streakData.adFreeReward.expiresAt = expiresAt;

      // DON'T reset streak - keep counting to allow continuous progress
      // Just mark the current reward as claimed so they can earn the next milestone
      streakData.adFreeReward.earned = false;
      streakData.adFreeReward.earnedAt = null;

      await docRef.set(streakData);

      logEvent(AnalyticsEvents.STREAK_REWARD_CLAIMED, {
        expires_at: expiresAt,
        reward_days: rewardDays,
        reward_hours: rewardHours,
        current_streak: streakData.currentStreak, // Log the streak they're continuing
      });

      logEvent(AnalyticsEvents.AD_FREE_ACTIVATED, {
        duration_hours: rewardHours,
        duration_days: rewardDays,
      });

      console.log('[StreaksService] Reward claimed successfully');
      return true;
    } catch (error) {
      console.error('[StreaksService] Error claiming reward:', error);
      return false;
    }
  }

  /**
   * Check if user has active ad-free period
   */
  async isAdFreeActive(userId: string): Promise<boolean> {
    try {
      const streakData = await this.getStreakData(userId);
      
      if (!streakData.adFreeReward.claimed || !streakData.adFreeReward.expiresAt) {
        return false;
      }

      const isActive = streakData.adFreeReward.expiresAt > Date.now();

      // If expired, clean up
      if (!isActive && streakData.adFreeReward.claimed) {
        console.log('[StreaksService] Ad-free period expired, cleaning up');
        const docPath = this.getStreaksPath(userId);
        await firestore().doc(docPath).update({
          'adFreeReward.claimed': false,
          'adFreeReward.expiresAt': null,
        });

        logEvent(AnalyticsEvents.AD_FREE_EXPIRED);
      }

      return isActive;
    } catch (error) {
      console.error('[StreaksService] Error checking ad-free status:', error);
      return false;
    }
  }

  /**
   * Check if streak modal should be shown
   */
  async shouldShowStreakModal(userId: string): Promise<boolean> {
    try {
      const streakData = await this.getStreakData(userId);
      const today = getLocalDateString();
      
      // Show if not shown today
      return !isSameDay(streakData.lastStreakModalDate, today);
    } catch (error) {
      console.error('[StreaksService] Error checking modal status:', error);
      return false;
    }
  }

  /**
   * Mark streak modal as shown for today
   */
  async markStreakModalShown(userId: string): Promise<void> {
    try {
      const today = getLocalDateString();
      const docPath = this.getStreaksPath(userId);
      
      await firestore().doc(docPath).update({
        streakModalShownToday: true,
        lastStreakModalDate: today,
      });

      logEvent(AnalyticsEvents.STREAK_MODAL_SHOWN, {
        date: today,
      });
    } catch (error) {
      console.error('[StreaksService] Error marking modal shown:', error);
    }
  }

  /**
   * Get last 7 days of activity for bar chart
   */
  async getWeeklyActivity(userId: string): Promise<WeeklyActivityData[]> {
    try {
      const streakData = await this.getStreakData(userId);
      const result: WeeklyActivityData[] = [];
      
      // Get last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD

        const activity = streakData.dailyActivities[dateString];
        
        result.push({
          date: dateString,
          activitiesCount: activity?.activitiesCount || 0,
          examsCompleted: activity?.examsCompleted || 0,
          studySessionsCompleted: activity?.studySessionsCompleted || 0,
        });
      }

      return result;
    } catch (error) {
      console.error('[StreaksService] Error getting weekly activity:', error);
      return [];
    }
  }

  /**
   * Check if user has pending reward to claim
   */
  async hasPendingReward(userId: string): Promise<boolean> {
    try {
      const streakData = await this.getStreakData(userId);
      return streakData.adFreeReward.earned && !streakData.adFreeReward.claimed;
    } catch (error) {
      console.error('[StreaksService] Error checking pending reward:', error);
      return false;
    }
  }
}

export default new FirebaseStreaksService();

