/**
 * Analytics Service
 * 
 * This service provides a safe wrapper around Firebase Analytics
 * that automatically disables tracking in development mode.
 * 
 * Usage:
 * import { analyticsService } from './services/analytics.service';
 * 
 * analyticsService.logEvent('screen_view', { screen_name: 'Home' });
 * analyticsService.logScreenView('Home');
 */

import { Platform } from 'react-native';

// Check if we're in development mode
const isDevelopment = __DEV__;

// Flag to control analytics globally
const ANALYTICS_ENABLED = !isDevelopment;

interface AnalyticsParams {
  [key: string]: any;
}

class AnalyticsService {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = ANALYTICS_ENABLED;
    
    if (!this.isEnabled) {
      console.log('[Analytics] Disabled in development mode');
    }
  }

  /**
   * Log a custom event
   */
  logEvent(eventName: string, params?: AnalyticsParams): void {
    if (!this.isEnabled) {
      console.log(`[Analytics] (DEV) Event: ${eventName}`, params);
      return;
    }

    try {
      // TODO: If you want to use Firebase Analytics, uncomment the following:
      // import analytics from '@react-native-firebase/analytics';
      // analytics().logEvent(eventName, params);
      
      // For now, just log to console in production too since analytics isn't initialized
      console.log(`[Analytics] Event: ${eventName}`, params);
    } catch (error) {
      console.error('[Analytics] Error logging event:', error);
    }
  }

  /**
   * Log screen view
   */
  logScreenView(screenName: string, screenClass?: string): void {
    if (!this.isEnabled) {
      console.log(`[Analytics] (DEV) Screen View: ${screenName}`);
      return;
    }

    try {
      // TODO: If you want to use Firebase Analytics, uncomment the following:
      // import analytics from '@react-native-firebase/analytics';
      // analytics().logScreenView({ screen_name: screenName, screen_class: screenClass });
      
      console.log(`[Analytics] Screen View: ${screenName}`);
    } catch (error) {
      console.error('[Analytics] Error logging screen view:', error);
    }
  }

  /**
   * Set user property
   */
  setUserProperty(name: string, value: string): void {
    if (!this.isEnabled) {
      console.log(`[Analytics] (DEV) User Property: ${name} = ${value}`);
      return;
    }

    try {
      // TODO: If you want to use Firebase Analytics, uncomment the following:
      // import analytics from '@react-native-firebase/analytics';
      // analytics().setUserProperty(name, value);
      
      console.log(`[Analytics] User Property: ${name} = ${value}`);
    } catch (error) {
      console.error('[Analytics] Error setting user property:', error);
    }
  }

  /**
   * Set user ID
   */
  setUserId(userId: string | null): void {
    if (!this.isEnabled) {
      console.log(`[Analytics] (DEV) User ID: ${userId}`);
      return;
    }

    try {
      // TODO: If you want to use Firebase Analytics, uncomment the following:
      // import analytics from '@react-native-firebase/analytics';
      // analytics().setUserId(userId);
      
      console.log(`[Analytics] User ID: ${userId}`);
    } catch (error) {
      console.error('[Analytics] Error setting user ID:', error);
    }
  }

  /**
   * Enable/disable analytics collection
   */
  setAnalyticsCollectionEnabled(enabled: boolean): void {
    this.isEnabled = enabled && ANALYTICS_ENABLED;
    
    try {
      // TODO: If you want to use Firebase Analytics, uncomment the following:
      // import analytics from '@react-native-firebase/analytics';
      // analytics().setAnalyticsCollectionEnabled(this.isEnabled);
      
      console.log(`[Analytics] Collection ${this.isEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('[Analytics] Error toggling analytics:', error);
    }
  }

  /**
   * Check if analytics is enabled
   */
  isAnalyticsEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Export class for testing
export { AnalyticsService };

