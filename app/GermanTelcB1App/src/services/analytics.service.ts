/**
 * Analytics Service
 * 
 * This service provides a safe wrapper around Firebase Analytics
 * that automatically disables tracking in development mode and
 * respects App Tracking Transparency (ATT) permissions on iOS.
 * 
 * Usage:
 * import { analyticsService } from './services/analytics.service';
 * 
 * analyticsService.logEvent('screen_view', { screen_name: 'Home' });
 * analyticsService.logScreenView('Home');
 */

import { Platform } from 'react-native';
import analytics from '@react-native-firebase/analytics';
import { activeExamConfig } from '../config/active-exam.config';

// Dynamic import to avoid circular dependencies
let attService: any = null;
const loadAttService = async () => {
  if (!attService) {
    try {
      const module = await import('./app-tracking-transparency.service');
      attService = module.default || module.attService;
    } catch (error) {
      console.warn('[Analytics] ATT service not available:', error);
    }
  }
  return attService;
};

// Check if we're in development mode
const isDevelopment = __DEV__;

// Flag to control analytics globally
const ANALYTICS_ENABLED = !isDevelopment;

interface AnalyticsParams {
  [key: string]: any;
}

class AnalyticsService {
  private isEnabled: boolean;
  private recentEvents: Map<string, number>;
  private readonly dedupeWindowMs = 750; // drop exact duplicates within this window
  private readonly appName: string;

  constructor() {
    this.isEnabled = ANALYTICS_ENABLED;
    this.recentEvents = new Map();
    this.appName = activeExamConfig.appName;

    if (!this.isEnabled) {
      console.log('[Analytics] Disabled in development mode');
    } else {
      console.log('[Analytics] Enabled in production mode');
      // Initialize ATT check
      this.checkAttPermission();
    }
  }

  /**
   * Check ATT permission and adjust analytics accordingly
   * This should be called on app start and when ATT status changes
   */
  private async checkAttPermission(): Promise<void> {
    if (Platform.OS !== 'ios') {
      return; // ATT is iOS only
    }

    try {
      const att = await loadAttService();
      if (!att) {
        console.log('[Analytics] ATT service not available, continuing with analytics');
        return;
      }

      const isAuthorized = await att.isTrackingAuthorized();
      
      if (!isAuthorized) {
        console.log('[Analytics] ATT not authorized, analytics may be limited');
        // Note: Firebase Analytics can still work with ATT denied
        // It just won't use IDFA for tracking
      } else {
        console.log('[Analytics] ATT authorized, full analytics enabled');
      }
    } catch (error) {
      console.error('[Analytics] Error checking ATT permission:', error);
    }
  }

  private stableKey(obj: any): string {
    if (!obj || typeof obj !== 'object') return '';
    const replacer = (_key: string, value: any) => {
      // Remove volatile fields from dedupe key
      if (typeof value === 'object' && value !== null) return value;
      return value;
    };
    const sorted = (input: any): any => {
      if (Array.isArray(input)) return input.map(sorted);
      if (input && typeof input === 'object') {
        const out: any = {};
        Object.keys(input)
          .filter(k => k !== 'ts')
          .sort()
          .forEach(k => {
            out[k] = sorted(input[k]);
          });
        return out;
      }
      return input;
    };
    try {
      return JSON.stringify(sorted(obj), replacer);
    } catch (_e) {
      return '';
    }
  }

  private shouldLog(eventName: string, params?: AnalyticsParams): boolean {
    const key = `${eventName}|${this.stableKey(params)}`;
    const now = Date.now();
    const last = this.recentEvents.get(key) || 0;
    if (now - last < this.dedupeWindowMs) {
      return false;
    }
    this.recentEvents.set(key, now);
    // Periodically prune old entries
    if (this.recentEvents.size > 200) {
      const cutoff = now - this.dedupeWindowMs * 4;
      for (const [k, t] of this.recentEvents.entries()) {
        if (t < cutoff) this.recentEvents.delete(k);
      }
    }
    return true;
  }

  /**
   * Log a custom event
   */
  logEvent(eventName: string, params?: AnalyticsParams): void {
    if (!this.shouldLog(eventName, params)) {
      return;
    }
    if (!this.isEnabled) {
      console.log(`[Analytics] (DEV) Event: ${eventName}`, params);
      return;
    }

    // Add app name to the event params
    params = {
      ...params,
      app_name: this.appName,
    };

    try {
      analytics().logEvent(eventName, params);
      console.log(`[Analytics] Event: ${eventName}`, params);
    } catch (error) {
      console.error('[Analytics] Error logging event:', error);
    }
  }

  /**
   * Log screen view
   */
  logScreenView(screenName: string, screenClass?: string): void {
    if (!this.shouldLog('screen_view', { screen_name: screenName, screen_class: screenClass })) {
      return;
    }
    if (!this.isEnabled) {
      console.log(`[Analytics] (DEV) Screen View: ${screenName}`);
      return;
    }

    try {
      analytics().logScreenView({ screen_name: screenName, screen_class: screenClass });
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
      analytics().setUserProperty(name, value);
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
      analytics().setUserId(userId);
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
      analytics().setAnalyticsCollectionEnabled(this.isEnabled);
      console.log(`[Analytics] Collection ${this.isEnabled ? 'enabled' : 'disabled'}`);
      
      // Recheck ATT permission when enabling analytics
      if (this.isEnabled) {
        this.checkAttPermission();
      }
    } catch (error) {
      console.error('[Analytics] Error toggling analytics:', error);
    }
  }

  /**
   * Refresh ATT status
   * Call this after user changes ATT permission in settings
   */
  async refreshAttStatus(): Promise<void> {
    await this.checkAttPermission();
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