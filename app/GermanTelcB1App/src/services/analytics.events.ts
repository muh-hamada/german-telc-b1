import { Platform } from 'react-native';
import { analyticsService } from './analytics.service';

// Centralized event names
export const AnalyticsEvents = {
  // Screen
  SCREEN_VIEW: 'screen_view',

  // Mock exam
  MOCK_EXAM_START_CLICKED: 'mock_exam_start_clicked',
  MOCK_EXAM_RESUME_DIALOG_SHOWN: 'mock_exam_resume_dialog_shown',
  MOCK_EXAM_RESUME_SELECTED: 'mock_exam_resume_selected',
  MOCK_EXAM_START_NEW_SELECTED: 'mock_exam_start_new_selected',
  MOCK_EXAM_STARTED: 'mock_exam_started',
  MOCK_EXAM_STEP_STARTED: 'mock_exam_step_started',
  MOCK_EXAM_STEP_COMPLETED: 'mock_exam_step_completed',
  MOCK_EXAM_COMPLETED: 'mock_exam_completed',

  // Practice
  PRACTICE_SECTION_OPENED: 'practice_section_opened',
  EXAM_SELECTION_OPENED: 'exam_selection_opened',
  PRACTICE_EXAM_OPENED: 'practice_exam_opened',
  QUESTION_ANSWERED: 'question_answered',
  PRACTICE_EXAM_COMPLETED: 'practice_exam_completed',

  // Writing evaluation
  WRITING_EVAL_REQUESTED: 'writing_eval_requested',
  REWARDED_AD_PROMPT_SHOWN: 'rewarded_ad_prompt_shown',
  REWARDED_AD_OPENED: 'rewarded_ad_opened',
  REWARDED_AD_EARNED_REWARD: 'rewarded_ad_earned_reward',
  REWARDED_AD_CLOSED: 'rewarded_ad_closed',
  REWARDED_AD_ERROR: 'rewarded_ad_error',
  REWARDED_AD_SKIPPED: 'rewarded_ad_skipped',
  WRITING_EVAL_COMPLETED: 'writing_eval_completed',
  WRITING_EVAL_FAILED: 'writing_eval_failed',

  // Progress
  PROGRESS_CARD_LOGIN_NAVIGATED: 'progress_card_login_navigated',
  PROGRESS_CARD_VIEW_FULL_STATS: 'progress_card_view_full_stats',

  // Ads
  BANNER_AD_LOADED: 'banner_ad_loaded',
  BANNER_AD_FAILED: 'banner_ad_failed',

  // Misc
  EXAM_STRUCTURE_OPENED: 'exam_structure_opened',
  AUTH_LOGIN_OPENED: 'auth_login_opened',
  AUTH_LOGIN_SUCCESS: 'auth_login_success',
  AUTH_LOGOUT: 'auth_logout',
  ONBOARDING_LANGUAGE_SELECTED: 'onboarding_language_selected',
  ONBOARDING_GO_PRESSED: 'onboarding_go_pressed',
  ONBOARDING_DISCLAIMER_TOGGLED: 'onboarding_disclaimer_toggled',
  ONBOARDING_DISCLAIMER_ACCEPTED: 'onboarding_disclaimer_accepted',
  PROFILE_LOGIN_MODAL_OPENED: 'profile_login_modal_opened',
  PROFILE_LOGIN_SUCCESS: 'profile_login_success',
  PROFILE_LOGIN_FAILED: 'profile_login_failed',
  PROFILE_SIGN_OUT_PROMPT_SHOWN: 'profile_sign_out_prompt_shown',
  PROFILE_SIGN_OUT_CONFIRMED: 'profile_sign_out_confirmed',
  PROFILE_SIGN_OUT_CANCELLED: 'profile_sign_out_cancelled',
  PROFILE_CLEAR_PROGRESS_PROMPT_SHOWN: 'profile_clear_progress_prompt_shown',
  PROFILE_CLEAR_PROGRESS_CONFIRMED: 'profile_clear_progress_confirmed',
  PROFILE_CLEAR_PROGRESS_CANCELLED: 'profile_clear_progress_cancelled',
  PROFILE_DELETE_ACCOUNT_CLICKED: 'profile_delete_account_clicked',
  PROFILE_DELETE_ACCOUNT_CONFIRMED: 'profile_delete_account_confirmed',
  PROFILE_DELETE_ACCOUNT_CANCELLED: 'profile_delete_account_cancelled',
  LANGUAGE_CHANGE_OPENED: 'language_change_opened',
  LANGUAGE_CHANGED: 'language_changed',
  EXAM_SELECTION_CLOSED: 'exam_selection_closed',
  PRACTICE_MARK_COMPLETED_TOGGLED: 'practice_mark_completed_toggled',
  AUDIO_PLAY_PRESSED: 'audio_play_pressed',
  AUDIO_STARTED: 'audio_started',
  AUDIO_COMPLETED: 'audio_completed',
  AUDIO_PAUSED: 'audio_paused',
  AUDIO_STOPPED: 'audio_stopped',
  MOCK_EXAM_EXIT_PROMPT_SHOWN: 'mock_exam_exit_prompt_shown',
  MOCK_EXAM_EXIT_CONFIRMED: 'mock_exam_exit_confirmed',
  MOCK_EXAM_EXIT_CANCELLED: 'mock_exam_exit_cancelled',
  
  // Review
  REVIEW_PROMPT_SHOWN: 'review_prompt_shown',
  REVIEW_PROMPT_DISMISSED: 'review_prompt_dismissed',
  REVIEW_COMPLETED: 'review_completed',

  // App Rating
  APP_RATING_OPENED: 'app_rating_opened',
  APP_RATING_COMPLETED: 'app_rating_completed',
  APP_RATING_FAILED: 'app_rating_failed',
  
  // Settings
  SETTINGS_NOTIFICATIONS_ENABLED: 'settings_notifications_enabled',
  SETTINGS_NOTIFICATIONS_DISABLED: 'settings_notifications_disabled',
  SETTINGS_NOTIFICATION_TIME_CHANGED: 'settings_notification_time_changed',
  SETTINGS_AD_CONSENT_OPENED: 'settings_ad_consent_opened',
  SETTINGS_AD_CONSENT_UPDATED: 'settings_ad_consent_updated',
  SETTINGS_ATT_OPENED: 'settings_att_opened',
  SETTINGS_ATT_UPDATED: 'settings_att_updated',
  
  // Notification Reminder
  NOTIFICATION_REMINDER_SHOWN: 'notification_reminder_shown',
  NOTIFICATION_REMINDER_ENABLED: 'notification_reminder_enabled',
  NOTIFICATION_REMINDER_MAYBE_LATER: 'notification_reminder_maybe_later',
  NOTIFICATION_REMINDER_PERMISSION_DENIED: 'notification_reminder_permission_denied',
  
  // Streaks
  STREAK_ACTIVITY_RECORDED: 'streak_activity_recorded',
  STREAK_MODAL_SHOWN: 'streak_modal_shown',
  STREAK_REWARD_EARNED: 'streak_reward_earned',
  STREAK_REWARD_CLAIMED: 'streak_reward_claimed',
  STREAK_BROKEN: 'streak_broken',
  AD_FREE_ACTIVATED: 'ad_free_activated',
  AD_FREE_EXPIRED: 'ad_free_expired',
} as const;

type EventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

// Common params helper
export function withCommonParams(params?: Record<string, any>) {
  return {
    platform: Platform.OS,
    ts: Date.now(),
    ...params,
  };
}

// Convenience wrappers
export function logEvent(eventName: EventName, params?: Record<string, any>) {
  analyticsService.logEvent(eventName, withCommonParams(params));
}

export function logScreenView(screenName: string) {
  analyticsService.logScreenView(screenName);
}


