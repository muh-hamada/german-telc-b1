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
  LISTENING_PRACTICE_SECTION_OPENED: 'listening_practice_section_opened',
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
  
  // Listening Practice
  LISTENING_PRACTICE_STARTED: 'listening_practice_started',
  LISTENING_PRACTICE_PAUSED: 'listening_practice_paused',
  LISTENING_PRACTICE_RESUMED: 'listening_practice_resumed',
  LISTENING_PRACTICE_COMPLETED: 'listening_practice_completed',
  LISTENING_PRACTICE_ASSESSMENT_STARTED: 'listening_practice_assessment_started',
  LISTENING_PRACTICE_QUESTION_ANSWERED: 'listening_practice_question_answered',
  LISTENING_PRACTICE_ASSESSMENT_COMPLETED: 'listening_practice_assessment_completed',
  LISTENING_PRACTICE_LISTEN_AGAIN: 'listening_practice_listen_again',
  LISTENING_PRACTICE_BACK_TO_HOME: 'listening_practice_back_to_home',

  // Vocabulary Builder
  VOCABULARY_HOME_OPENED: 'vocabulary_home_opened',
  VOCABULARY_STUDY_NEW_STARTED: 'vocabulary_study_new_started',
  VOCABULARY_NEW_WORD_STUDIED: 'vocabulary_new_word_studied',
  VOCABULARY_REVIEW_STARTED: 'vocabulary_review_started',
  VOCABULARY_WORD_REVIEWED: 'vocabulary_word_reviewed',
  VOCABULARY_DAILY_GOAL_COMPLETED: 'vocabulary_daily_goal_completed',
  VOCABULARY_PERSONA_SELECTED: 'vocabulary_persona_selected',
  VOCABULARY_PROGRESS_OPENED: 'vocabulary_progress_opened',
  VOCABULARY_PROGRESS_REFRESHED: 'vocabulary_progress_refreshed',
  VOCABULARY_PERSONA_CHANGE_OPENED: 'vocabulary_persona_change_opened',
  VOCABULARY_PERSONA_CHANGED: 'vocabulary_persona_changed',
  VOCABULARY_PERSONA_MODAL_OPENED: 'vocabulary_persona_modal_opened',
  VOCABULARY_PERSONA_MODAL_CLOSED: 'vocabulary_persona_modal_closed',
  VOCABULARY_STUDIED_LIST_OPENED: 'vocabulary_studied_list_opened',
  VOCABULARY_WORD_EXPANDED: 'vocabulary_word_expanded',
  VOCABULARY_WORD_COLLAPSED: 'vocabulary_word_collapsed',
  VOCABULARY_LOGIN_MODAL_OPENED: 'vocabulary_login_modal_opened',
  VOCABULARY_LOGIN_SUCCESS: 'vocabulary_login_success',
  VOCABULARY_LOGIN_FAILED: 'vocabulary_login_failed',

  // Vocabulary Native Ad
  VOCABULARY_NATIVE_AD_REQUESTED: 'vocabulary_native_ad_requested', // When native ad load is initiated
  VOCABULARY_NATIVE_AD_LOADED: 'vocabulary_native_ad_loaded', // When native ad loads successfully
  VOCABULARY_NATIVE_AD_FAILED: 'vocabulary_native_ad_failed', // When native ad fails to load
  VOCABULARY_NATIVE_AD_DISPLAYED: 'vocabulary_native_ad_displayed', // When native ad card is shown to user
  VOCABULARY_NATIVE_AD_CLICKED: 'vocabulary_native_ad_clicked', // When user clicks on the native ad
  VOCABULARY_NATIVE_AD_IMPRESSION: 'vocabulary_native_ad_impression', // When native ad records an impression
  VOCABULARY_NATIVE_AD_CLOSED: 'vocabulary_native_ad_closed', // When user continues past the ad card
  VOCABULARY_NATIVE_AD_SKIPPED: 'vocabulary_native_ad_skipped', // When ad is skipped (premium/streak users)

  // Notification Reminder
  NOTIFICATION_REMINDER_SHOWN: 'notification_reminder_shown',
  NOTIFICATION_REMINDER_ENABLED: 'notification_reminder_enabled',
  NOTIFICATION_REMINDER_MAYBE_LATER: 'notification_reminder_maybe_later',
  NOTIFICATION_REMINDER_PERMISSION_DENIED: 'notification_reminder_permission_denied',
  
  // Streaks
  STREAK_ACTIVITY_RECORDED: 'streak_activity_recorded',
  STREAK_MODAL_SHOWN: 'streak_modal_shown',
  STREAK_MODAL_DISMISSED: 'streak_modal_dismissed',
  STREAK_REWARD_EARNED: 'streak_reward_earned',
  STREAK_REWARD_CLAIMED: 'streak_reward_claimed',
  STREAK_REWARD_MODAL_DISMISSED: 'streak_reward_modal_dismissed',
  STREAK_BROKEN: 'streak_broken',
  GRAMMAR_STUDY_ACTIVITY_THRESHOLD: 'grammar_study_activity_threshold',
  AD_FREE_ACTIVATED: 'ad_free_activated',
  AD_FREE_EXPIRED: 'ad_free_expired',
  AD_FREE_STATUS_CHECKED: 'ad_free_status_checked',
  
  // App Update
  APP_UPDATE_MODAL_SHOWN: 'app_update_modal_shown',
  APP_UPDATE_NOW_CLICKED: 'app_update_now_clicked',
  APP_UPDATE_LATER_CLICKED: 'app_update_later_clicked',
  APP_UPDATE_MODAL_DISMISSED: 'app_update_modal_dismissed',
  APP_UPDATE_STORE_OPENED: 'app_update_store_opened',

  // User Support Ad
  USER_SUPPORT_AD_BUTTON_SHOWN: 'user_support_ad_button_shown', // When button becomes visible (for conditional displays like ResultsModal)
  USER_SUPPORT_AD_SCREEN_SHOWN: 'user_support_ad_screen_shown', // When SupportAdScreen is displayed
  USER_SUPPORT_AD_CLICKED: 'user_support_ad_clicked', // When user clicks watch ad button
  USER_SUPPORT_AD_SHOWN: 'user_support_ad_shown', // When rewarded ad is successfully displayed
  USER_SUPPORT_AD_EARNED_REWARD: 'user_support_ad_earned_reward', // When user earns reward for watching
  USER_SUPPORT_AD_CLOSED: 'user_support_ad_closed', // When rewarded ad is closed
  USER_SUPPORT_AD_SKIPPED: 'user_support_ad_skipped', // When user skips the ad screen
  USER_SUPPORT_AD_ERROR: 'user_support_ad_error', // When ad fails to load
  USER_SUPPORT_AD_SHOW_FAILED: 'user_support_ad_show_failed', // When ad fails to show

  // Premium / In-App Purchase
  PREMIUM_PURCHASE_INITIATED: 'premium_purchase_initiated',
  PREMIUM_PURCHASE_SUCCESS: 'premium_purchase_success',
  PREMIUM_PURCHASE_ERROR: 'premium_purchase_error',
  PREMIUM_RESTORE_INITIATED: 'premium_restore_initiated',
  PREMIUM_RESTORE_SUCCESS: 'premium_restore_success',
  PREMIUM_RESTORE_NOT_FOUND: 'premium_restore_not_found',
  PREMIUM_RESTORE_ERROR: 'premium_restore_error',
  PREMIUM_UPSELL_MODAL_SHOWN: 'premium_upsell_modal_shown',
  PREMIUM_UPSELL_MODAL_DISMISSED: 'premium_upsell_modal_dismissed',
  PREMIUM_UPSELL_PURCHASE_CLICKED: 'premium_upsell_purchase_clicked',
  PREMIUM_SCREEN_OPENED: 'premium_screen_opened',
  PREMIUM_SCREEN_PURCHASE_CLICKED: 'premium_screen_purchase_clicked',
  PREMIUM_SCREEN_RESTORE_CLICKED: 'premium_screen_restore_clicked',
  PREMIUM_HOME_BUTTON_CLICKED: 'premium_home_button_clicked',
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


