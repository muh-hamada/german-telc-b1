/**
 * Streak-related constants
 */

export const QUESTIONS_PER_ACTIVITY = 15;
export const STREAK_REWARD_THRESHOLD = 7; // Days needed for first milestone
export const AD_FREE_DURATION_HOURS = 24; // Base duration (multiplied by streak milestones)
export const REWARD_MODAL_SUCCESS_DURATION = 2000;

/**
 * Calculate reward days based on streak
 * Formula: rewardDays = Math.floor(streakDays / 7)
 * Example: 7 days = 1 day, 14 days = 2 days, 21 days = 3 days
 */
export const calculateRewardDays = (streakDays: number): number => {
  return Math.floor(streakDays / STREAK_REWARD_THRESHOLD);
};

/**
 * Calculate days until next reward
 * Example: If at 10 days, need 4 more days to reach 14
 */
export const calculateDaysUntilNextReward = (streakDays: number): number => {
  const nextMilestone = Math.ceil((streakDays + 1) / STREAK_REWARD_THRESHOLD) * STREAK_REWARD_THRESHOLD;
  return nextMilestone - streakDays;
};

/**
 * Calculate next reward days amount
 * Example: If at 10 days (current = 1 day reward), next will be 2 days
 */
export const calculateNextRewardDays = (streakDays: number): number => {
  return calculateRewardDays(streakDays) + 1;
};

