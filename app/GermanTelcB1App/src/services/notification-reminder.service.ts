/**
 * Notification Reminder Service
 * 
 * Manages notification permission reminder prompts with intelligent timing:
 * - Shows reminders at strategic moments (after onboarding, after 2 days, on app open)
 * - Implements 3-day cooldown period after "Maybe Later"
 * - Never shows again once notifications are enabled
 * - Tracks user preferences and dismissal count
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import FCMService from './fcm.service';

const STORAGE_KEYS = {
  LAST_PROMPT_DATE: '@notification_reminder_last_prompt_date',
  REMINDER_COMPLETED: '@notification_reminder_completed',
  REMINDER_DISMISSED_COUNT: '@notification_reminder_dismissed_count',
  FIRST_LAUNCH_DATE: '@notification_reminder_first_launch_date',
  ONBOARDING_PROMPT_SHOWN: '@notification_reminder_onboarding_shown',
};

// Configuration
const CONFIG = {
  COOLDOWN_DAYS: 3, // Days to wait after "Maybe Later"
  DAYS_AFTER_INSTALL: 2, // Days after first launch to show reminder
  MAX_DISMISS_COUNT: 5, // After this many dismissals, reduce frequency (but still show)
};

export interface NotificationReminderResult {
  shouldShow: boolean;
  reason?: string;
}

export type TriggerType = 'onboarding' | 'app_launch' | 'two_days_after_install';

class NotificationReminderService {
  /**
   * Check if we should show the notification reminder
   * @param triggerType - The type of trigger that initiated the check
   * @returns Promise<NotificationReminderResult>
   */
  async shouldShowReminder(triggerType: TriggerType): Promise<NotificationReminderResult> {
    try {
      // Check if user has already enabled notifications
      const hasCompleted = await this.hasUserEnabledNotifications();
      if (hasCompleted) {
        return { 
          shouldShow: false, 
          reason: 'User has already enabled notifications' 
        };
      }

      // Check if notifications are already enabled via FCM
      const notificationStatus = await FCMService.checkNotificationStatus();
      if (notificationStatus.enabled) {
        // Mark as completed if they enabled elsewhere
        await this.recordCompleted();
        return {
          shouldShow: false,
          reason: 'Notifications already enabled in system'
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

      // Check trigger-specific conditions
      if (triggerType === 'onboarding') {
        const onboardingShown = await this.hasOnboardingPromptShown();
        if (onboardingShown) {
          return {
            shouldShow: false,
            reason: 'Onboarding prompt already shown'
          };
        }
      }

      if (triggerType === 'two_days_after_install') {
        const firstLaunchDate = await this.getFirstLaunchDate();
        if (!firstLaunchDate) {
          return {
            shouldShow: false,
            reason: 'First launch date not set'
          };
        }
        
        const daysSinceInstall = this.getDaysSince(firstLaunchDate);
        if (daysSinceInstall < CONFIG.DAYS_AFTER_INSTALL) {
          return {
            shouldShow: false,
            reason: `Only ${daysSinceInstall} days since install (min: ${CONFIG.DAYS_AFTER_INSTALL})`
          };
        }
      }

      // Check dismiss count for analytics (but don't block)
      const dismissCount = await this.getDismissCount();
      if (dismissCount >= CONFIG.MAX_DISMISS_COUNT) {
        console.log(`[NotificationReminder] User has dismissed ${dismissCount} times, but still showing`);
      }

      return { shouldShow: true };
    } catch (error) {
      console.error('[NotificationReminder] Error checking if should show reminder:', error);
      return { shouldShow: false, reason: 'Error checking reminder eligibility' };
    }
  }

  /**
   * Record that the user clicked "Maybe Later"
   */
  async recordMaybeLater(): Promise<void> {
    try {
      const currentCount = await this.getDismissCount();
      await AsyncStorage.setItem(
        STORAGE_KEYS.REMINDER_DISMISSED_COUNT,
        String(currentCount + 1)
      );
      await this.updateLastPromptDate();
      console.log('[NotificationReminder] Recorded "Maybe Later", count:', currentCount + 1);
    } catch (error) {
      console.error('[NotificationReminder] Error recording "Maybe Later":', error);
    }
  }

  /**
   * Record that the user enabled notifications
   */
  async recordCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDER_COMPLETED, 'true');
      console.log('[NotificationReminder] Recorded notification enablement');
    } catch (error) {
      console.error('[NotificationReminder] Error recording completion:', error);
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
      console.error('[NotificationReminder] Error updating last prompt date:', error);
    }
  }

  /**
   * Record first launch date if not already set
   */
  async recordFirstLaunch(): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_LAUNCH_DATE);
      if (!existing) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.FIRST_LAUNCH_DATE,
          new Date().toISOString()
        );
        console.log('[NotificationReminder] Recorded first launch date');
      }
    } catch (error) {
      console.error('[NotificationReminder] Error recording first launch:', error);
    }
  }

  /**
   * Mark onboarding prompt as shown
   */
  async recordOnboardingPromptShown(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_PROMPT_SHOWN, 'true');
      console.log('[NotificationReminder] Recorded onboarding prompt shown');
    } catch (error) {
      console.error('[NotificationReminder] Error recording onboarding prompt:', error);
    }
  }

  /**
   * Check if user has already enabled notifications
   */
  private async hasUserEnabledNotifications(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(STORAGE_KEYS.REMINDER_COMPLETED);
      return completed === 'true';
    } catch (error) {
      console.error('[NotificationReminder] Error checking completion status:', error);
      return false;
    }
  }

  /**
   * Check if onboarding prompt was shown
   */
  private async hasOnboardingPromptShown(): Promise<boolean> {
    try {
      const shown = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_PROMPT_SHOWN);
      return shown === 'true';
    } catch (error) {
      console.error('[NotificationReminder] Error checking onboarding prompt:', error);
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
      console.error('[NotificationReminder] Error getting last prompt date:', error);
      return null;
    }
  }

  /**
   * Get first launch date
   */
  private async getFirstLaunchDate(): Promise<Date | null> {
    try {
      const dateStr = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_LAUNCH_DATE);
      return dateStr ? new Date(dateStr) : null;
    } catch (error) {
      console.error('[NotificationReminder] Error getting first launch date:', error);
      return null;
    }
  }

  /**
   * Get the number of times user has dismissed the prompt
   */
  private async getDismissCount(): Promise<number> {
    try {
      const count = await AsyncStorage.getItem(STORAGE_KEYS.REMINDER_DISMISSED_COUNT);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('[NotificationReminder] Error getting dismiss count:', error);
      return 0;
    }
  }

  /**
   * Calculate days since a given date
   */
  private getDaysSince(date: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Reset all reminder data (for testing purposes)
   */
  async resetReminderData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.LAST_PROMPT_DATE,
        STORAGE_KEYS.REMINDER_COMPLETED,
        STORAGE_KEYS.REMINDER_DISMISSED_COUNT,
        STORAGE_KEYS.FIRST_LAUNCH_DATE,
        STORAGE_KEYS.ONBOARDING_PROMPT_SHOWN,
      ]);
      console.log('[NotificationReminder] Reset all reminder data');
    } catch (error) {
      console.error('[NotificationReminder] Error resetting reminder data:', error);
    }
  }

  /**
   * Get reminder statistics for debugging
   */
  async getReminderStats(): Promise<{
    hasCompleted: boolean;
    dismissCount: number;
    lastPromptDate: Date | null;
    daysSinceLastPrompt: number | null;
    firstLaunchDate: Date | null;
    daysSinceInstall: number | null;
    onboardingPromptShown: boolean;
  }> {
    const hasCompleted = await this.hasUserEnabledNotifications();
    const dismissCount = await this.getDismissCount();
    const lastPromptDate = await this.getLastPromptDate();
    const daysSinceLastPrompt = lastPromptDate 
      ? this.getDaysSince(lastPromptDate) 
      : null;
    const firstLaunchDate = await this.getFirstLaunchDate();
    const daysSinceInstall = firstLaunchDate
      ? this.getDaysSince(firstLaunchDate)
      : null;
    const onboardingPromptShown = await this.hasOnboardingPromptShown();

    return {
      hasCompleted,
      dismissCount,
      lastPromptDate,
      daysSinceLastPrompt,
      firstLaunchDate,
      daysSinceInstall,
      onboardingPromptShown,
    };
  }
}

export default new NotificationReminderService();

