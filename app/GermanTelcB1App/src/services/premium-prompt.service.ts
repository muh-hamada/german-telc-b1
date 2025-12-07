/**
 * Premium Prompt Service
 * 
 * Tracks app usage time and determines when to show premium upsell modal.
 * - First prompt: After 3 minutes of cumulative app usage
 * - Subsequent prompts: 3 days after last dismissal
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration
const FIRST_PROMPT_AFTER_SECONDS = 3 * 60; // 3 minutes
const REPROMPT_AFTER_DAYS = 3;
const REPROMPT_AFTER_MS = REPROMPT_AFTER_DAYS * 24 * 60 * 60 * 1000;

// Storage keys
const STORAGE_KEYS = {
  CUMULATIVE_USAGE_SECONDS: '@premium_usage_seconds',
  LAST_DISMISS_TIMESTAMP: '@premium_last_dismiss',
  FIRST_PROMPT_SHOWN: '@premium_first_shown',
  HAS_PURCHASED: '@premium_has_purchased', // Local cache of purchase status
};

class PremiumPromptService {
  private usageSeconds: number = 0;
  private lastDismissTimestamp: number | null = null;
  private firstPromptShown: boolean = false;
  private hasPurchased: boolean = false;
  private isInitialized: boolean = false;

  /**
   * Initialize the service by loading saved state
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const [usageStr, dismissStr, firstShownStr, purchasedStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CUMULATIVE_USAGE_SECONDS),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_DISMISS_TIMESTAMP),
        AsyncStorage.getItem(STORAGE_KEYS.FIRST_PROMPT_SHOWN),
        AsyncStorage.getItem(STORAGE_KEYS.HAS_PURCHASED),
      ]);

      this.usageSeconds = usageStr ? parseInt(usageStr, 10) : 0;
      this.lastDismissTimestamp = dismissStr ? parseInt(dismissStr, 10) : null;
      this.firstPromptShown = firstShownStr === 'true';
      this.hasPurchased = purchasedStr === 'true';
      this.isInitialized = true;

      console.log('[PremiumPromptService] Initialized:', {
        usageSeconds: this.usageSeconds,
        lastDismissTimestamp: this.lastDismissTimestamp,
        firstPromptShown: this.firstPromptShown,
        hasPurchased: this.hasPurchased,
      });
    } catch (error) {
      console.error('[PremiumPromptService] Error initializing:', error);
      this.isInitialized = true;
    }
  }

  /**
   * Increment usage time by the given number of seconds
   */
  async incrementUsageTime(seconds: number): Promise<void> {
    this.usageSeconds += seconds;
    
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CUMULATIVE_USAGE_SECONDS,
        this.usageSeconds.toString()
      );
    } catch (error) {
      console.error('[PremiumPromptService] Error saving usage time:', error);
    }
  }

  /**
   * Get current usage time in seconds
   */
  getUsageSeconds(): number {
    return this.usageSeconds;
  }

  /**
   * Check if premium modal should be shown
   * Logic:
   * - If user has purchased, never show
   * - First time: show after FIRST_PROMPT_AFTER_SECONDS of cumulative usage
   * - After first time: show REPROMPT_AFTER_DAYS after last dismissal
   */
  shouldShowPremiumModal(): boolean {
    return true;

    // Never show if user has purchased
    if (this.hasPurchased) {
      console.log('[PremiumPromptService] User has purchased, not showing modal');
      return false;
    }

    const now = Date.now();

    // First prompt - based on usage time
    if (!this.firstPromptShown) {
      const shouldShow = this.usageSeconds >= FIRST_PROMPT_AFTER_SECONDS;
      console.log('[PremiumPromptService] First prompt check:', {
        usageSeconds: this.usageSeconds,
        threshold: FIRST_PROMPT_AFTER_SECONDS,
        shouldShow,
      });
      return shouldShow;
    }

    // Subsequent prompts - based on time since last dismissal
    if (this.lastDismissTimestamp) {
      const timeSinceDismiss = now - this.lastDismissTimestamp;
      const shouldShow = timeSinceDismiss >= REPROMPT_AFTER_MS;
      console.log('[PremiumPromptService] Reprompt check:', {
        daysSinceDismiss: timeSinceDismiss / (24 * 60 * 60 * 1000),
        thresholdDays: REPROMPT_AFTER_DAYS,
        shouldShow,
      });
      return shouldShow;
    }

    // If first prompt was shown but no dismiss timestamp, wait for reprompt period
    return false;
  }

  /**
   * Record that the modal was dismissed
   */
  async recordModalDismiss(): Promise<void> {
    this.lastDismissTimestamp = Date.now();
    this.firstPromptShown = true;

    try {
      await Promise.all([
        AsyncStorage.setItem(
          STORAGE_KEYS.LAST_DISMISS_TIMESTAMP,
          this.lastDismissTimestamp.toString()
        ),
        AsyncStorage.setItem(STORAGE_KEYS.FIRST_PROMPT_SHOWN, 'true'),
      ]);
      
      console.log('[PremiumPromptService] Modal dismiss recorded');
    } catch (error) {
      console.error('[PremiumPromptService] Error recording dismiss:', error);
    }
  }

  /**
   * Record that user has purchased premium
   * This prevents the modal from showing again
   */
  async recordPurchase(): Promise<void> {
    this.hasPurchased = true;

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_PURCHASED, 'true');
      console.log('[PremiumPromptService] Purchase recorded');
    } catch (error) {
      console.error('[PremiumPromptService] Error recording purchase:', error);
    }
  }

  /**
   * Reset all state (for testing)
   */
  async reset(): Promise<void> {
    this.usageSeconds = 0;
    this.lastDismissTimestamp = null;
    this.firstPromptShown = false;
    this.hasPurchased = false;

    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.CUMULATIVE_USAGE_SECONDS),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_DISMISS_TIMESTAMP),
        AsyncStorage.removeItem(STORAGE_KEYS.FIRST_PROMPT_SHOWN),
        AsyncStorage.removeItem(STORAGE_KEYS.HAS_PURCHASED),
      ]);
      
      console.log('[PremiumPromptService] State reset');
    } catch (error) {
      console.error('[PremiumPromptService] Error resetting:', error);
    }
  }
}

const premiumPromptService = new PremiumPromptService();
export default premiumPromptService;

