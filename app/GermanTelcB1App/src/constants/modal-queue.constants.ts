/**
 * Modal Queue Constants
 * 
 * Configuration and priority settings for the modal queue manager
 */

import { GlobalModalType } from '../types/modal-queue.types';

/**
 * Priority levels for each modal type
 * Higher numbers = higher priority (shown first)
 */
export const MODAL_PRIORITIES: Record<GlobalModalType, number> = {
  'app-update-forced': 100,
  'app-update-available': 50,
  'notification-reminder': 30,
  'streak': 25,
  'streak-reward': 24,
  'hour-picker': 23, // Sub-modal of notification reminder
  'issue-updates': 20, // After streaks, before premium upsell
  'premium-upsell': 15, // After streaks, before review
  'app-review': 10,
  'cross-app-promotion': 5, // Lowest priority - shown after all other modals
};

/**
 * Queue behavior configuration
 */
export const MODAL_QUEUE_CONFIG = {
  /** Delay between modals in milliseconds */
  DELAY_BETWEEN_MODALS: 1000,
  
  /** Maximum modals to show per session (0 = unlimited) */
  MAX_MODALS_PER_SESSION: 0,
  
  /** Delay before showing first modal after app launch */
  INITIAL_DELAY: 2000,
};

