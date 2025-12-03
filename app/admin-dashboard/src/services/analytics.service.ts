/**
 * Analytics Service for Admin Dashboard
 * 
 * This service provides a safe wrapper around Firebase Analytics
 * that automatically disables tracking in development mode.
 * 
 * Usage:
 * import { analyticsService } from './services/analytics.service';
 * 
 * analyticsService.logEvent('user_action', { action: 'create_document' });
 */

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Flag to control analytics globally
const ANALYTICS_ENABLED = !isDevelopment;

interface AnalyticsParams {
  [key: string]: any;
}

class AnalyticsService {
  private isEnabled: boolean;
  private analytics: any = null;

  constructor() {
    this.isEnabled = ANALYTICS_ENABLED;
    
    if (!this.isEnabled) {
      console.log('[Analytics] Disabled in development mode');
    } else {
      // Initialize analytics only in production
      this.initializeAnalytics();
    }
  }

  private async initializeAnalytics() {
    try {
      // Dynamically import Firebase Analytics only in production
      const { getAnalytics, isSupported } = await import('firebase/analytics');
      const { firebaseService } = await import('./firebase.service');
      
      const supported = await isSupported();
      if (supported) {
        this.analytics = getAnalytics(firebaseService['app']);
        console.log('[Analytics] Initialized successfully');
      } else {
        console.log('[Analytics] Not supported in this environment');
      }
    } catch (error) {
      console.error('[Analytics] Failed to initialize:', error);
    }
  }

  /**
   * Log a custom event
   */
  async logEvent(eventName: string, params?: AnalyticsParams): Promise<void> {
    if (!this.isEnabled) {
      console.log(`[Analytics] (DEV) Event: ${eventName}`, params);
      return;
    }

    if (!this.analytics) {
      return;
    }

    try {
      const { logEvent } = await import('firebase/analytics');
      logEvent(this.analytics, eventName, params);
    } catch (error) {
      console.error('[Analytics] Error logging event:', error);
    }
  }

  /**
   * Log page view
   */
  async logPageView(pagePath: string, pageTitle?: string): Promise<void> {
    if (!this.isEnabled) {
      console.log(`[Analytics] (DEV) Page View: ${pagePath}`);
      return;
    }

    if (!this.analytics) {
      return;
    }

    try {
      const { logEvent } = await import('firebase/analytics');
      logEvent(this.analytics, 'page_view', {
        page_path: pagePath,
        page_title: pageTitle || document.title,
      });
    } catch (error) {
      console.error('[Analytics] Error logging page view:', error);
    }
  }

  /**
   * Set user property
   */
  async setUserProperty(name: string, value: string): Promise<void> {
    if (!this.isEnabled) {
      console.log(`[Analytics] (DEV) User Property: ${name} = ${value}`);
      return;
    }

    if (!this.analytics) {
      return;
    }

    try {
      const { setUserProperties } = await import('firebase/analytics');
      setUserProperties(this.analytics, { [name]: value });
    } catch (error) {
      console.error('[Analytics] Error setting user property:', error);
    }
  }

  /**
   * Set user ID
   */
  async setUserId(userId: string | null): Promise<void> {
    if (!this.isEnabled) {
      console.log(`[Analytics] (DEV) User ID: ${userId}`);
      return;
    }

    if (!this.analytics) {
      return;
    }

    try {
      const { setUserId } = await import('firebase/analytics');
      setUserId(this.analytics, userId);
    } catch (error) {
      console.error('[Analytics] Error setting user ID:', error);
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

