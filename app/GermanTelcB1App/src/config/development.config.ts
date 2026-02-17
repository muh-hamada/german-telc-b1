/**
 * 🎬 APP STORE SCREENSHOT DEMO MODE
 * 
 * Enable this for App Store screenshots to:
 * - Show attractive progress data (85% score, "Excellent")
 * - Hide all banner ads for clean screenshots
 * - Display professional, polished app appearance
 * 
 * ⚠️ CRITICAL: Set to FALSE before production release!
 */

export const DEMO_MODE = false; // Set to false for production

export const ALWAYS_SHOW_PREMIUM_MODAL = false; // Set to false for production

export const HIDE_ADS = false; // Set to false for production

export const SKIP_REWARDED_ADS = false; // Set to false for production

export const ALWAYS_SHOW_REVIEW_MODAL = false; // Set to false for production

export const DISABLE_DATA_CACHE = false; // Set to true to disable data cache

export const HIDE_SUPPORT_US = false; // Set to false for production

export const SIMULATE_PREMIUM_USER = false; // Set to true to simulate a premium user

export const FORCE_DARK_MODE = false; // Set to true to force dark mode

/**
 * Streak Feature Flags
 */
export const FORCE_SHOW_STREAK_MODAL = false; // Force show streak modal for testing

export const SIMULATE_7_DAY_STREAK = false; // Simulate 7-day streak for reward testing

/**
 * Demo progress statistics shown in ProgressCard
 */
export const DEMO_STATS = {
  totalExams: 45,
  completedExams: 38,
  totalScore: 3215,
  totalMaxScore: 3600,
  averageScore: 85,
  completionRate: 84,
};

/**
 * Demo completion statistics for CompletionStatsCard
 * Shows realistic progress across all exam sections
 */
export const DEMO_COMPLETION_STATS = {
  grammar: {
    1: { completed: 8, total: 10, percentage: 80 },
    2: { completed: 7, total: 10, percentage: 70 },
  },
  reading: {
    1: { completed: 4, total: 5, percentage: 80 },
    2: { completed: 5, total: 5, percentage: 100 },
    3: { completed: 3, total: 5, percentage: 60 },
  },
  writing: {
    1: { completed: 7, total: 10, percentage: 70 },
  },
  speaking: {
    1: { completed: 6, total: 8, percentage: 75 },
    2: { completed: 5, total: 8, percentage: 62.5 },
    3: { completed: 7, total: 8, percentage: 87.5 },
  },
  listening: {
    1: { completed: 4, total: 5, percentage: 80 },
    2: { completed: 3, total: 5, percentage: 60 },
    3: { completed: 5, total: 5, percentage: 100 },
  },
};

