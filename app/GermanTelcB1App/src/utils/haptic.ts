/**
 * Haptic Feedback Utilities
 * 
 * Provides simple cross-platform haptic feedback for user interactions.
 * Based on the pattern from VocabularyRatingButtons component.
 */

import { Platform, Vibration } from 'react-native';

export type HapticType = 'light' | 'medium' | 'heavy';

/**
 * Trigger haptic feedback with different intensity levels
 * @param type - The intensity of the haptic feedback
 */
export const triggerHapticFeedback = (type: HapticType = 'light') => {
  try {
    // Simple vibration feedback that works on both iOS and Android
    // With proper permission handling
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      const duration = type === 'light' ? 10 : type === 'medium' ? 20 : 50;
      Vibration.vibrate(duration);
    }
  } catch (error) {
    // Silently fail if vibration is not available or permission is denied
    console.warn('Haptic feedback not available:', error);
  }
};

/**
 * Trigger success haptic feedback (light)
 */
export const hapticSuccess = () => triggerHapticFeedback('light');

/**
 * Trigger warning haptic feedback (medium)
 */
export const hapticWarning = () => triggerHapticFeedback('medium');

/**
 * Trigger error haptic feedback (heavy)
 */
export const hapticError = () => triggerHapticFeedback('heavy');

/**
 * Trigger selection haptic feedback (light)
 */
export const hapticSelection = () => triggerHapticFeedback('light');

