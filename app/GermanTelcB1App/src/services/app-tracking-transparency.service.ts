/**
 * App Tracking Transparency (ATT) Service
 * 
 * This service manages iOS App Tracking Transparency permissions.
 * Apple requires apps to request permission before collecting data used to track users.
 * 
 * This should be requested BEFORE initializing any tracking/analytics services.
 * 
 * Usage:
 * import { attService } from './services/app-tracking-transparency.service';
 * 
 * const status = await attService.requestPermission();
 * if (status === 'authorized') {
 *   // Initialize tracking services
 * }
 */

import { Platform } from 'react-native';

// Type definitions for tracking authorization status
export type TrackingStatus = 
  | 'authorized'      // User has authorized tracking
  | 'denied'          // User has denied tracking
  | 'restricted'      // Tracking is restricted (e.g., parental controls)
  | 'not-determined'  // User has not yet been asked
  | 'unavailable';    // ATT is not available (Android or older iOS)

interface TrackingTransparencyModule {
  getTrackingStatus: () => Promise<TrackingStatus>;
  requestTrackingPermission: () => Promise<TrackingStatus>;
}

class AppTrackingTransparencyService {
  private trackingStatus: TrackingStatus = 'unavailable';
  private module: TrackingTransparencyModule | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the ATT module (only on iOS 14+)
   */
  private async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // ATT is only available on iOS 14+
    if (Platform.OS !== 'ios') {
      this.trackingStatus = 'unavailable';
      this.initialized = true;
      return;
    }

    try {
      // Dynamically import the module to avoid Android crashes
      const trackingTransparency = await import('react-native-tracking-transparency');
      this.module = trackingTransparency.default || trackingTransparency;
      
      // Get initial tracking status
      this.trackingStatus = await this.module.getTrackingStatus();
      console.log('[ATT] Initial tracking status:', this.trackingStatus);
    } catch (error) {
      console.warn('[ATT] App Tracking Transparency not available:', error);
      console.log('[ATT] Please install: npm install react-native-tracking-transparency');
      this.trackingStatus = 'unavailable';
    } finally {
      this.initialized = true;
    }
  }

  /**
   * Request tracking permission from the user
   * Shows the iOS tracking permission dialog
   * 
   * @returns Promise<TrackingStatus> - The tracking permission status
   */
  async requestPermission(): Promise<TrackingStatus> {
    await this.initialize();

    if (!this.module || Platform.OS !== 'ios') {
      console.log('[ATT] ATT not available on this platform');
      return this.trackingStatus;
    }

    try {
      // Check current status first
      const currentStatus = await this.module.getTrackingStatus();
      this.trackingStatus = currentStatus;

      // If already determined, return current status
      if (currentStatus !== 'not-determined') {
        console.log('[ATT] Tracking status already determined:', currentStatus);
        return currentStatus;
      }

      // Request permission
      console.log('[ATT] Requesting tracking permission...');
      const newStatus = await this.module.requestTrackingPermission();
      this.trackingStatus = newStatus;

      console.log('[ATT] Tracking permission result:', newStatus);
      this.logTrackingStatus(newStatus);

      return newStatus;
    } catch (error) {
      console.error('[ATT] Error requesting tracking permission:', error);
      return this.trackingStatus;
    }
  }

  /**
   * Get the current tracking permission status
   * Does not show the permission dialog
   * 
   * @returns Promise<TrackingStatus> - The current tracking status
   */
  async getStatus(): Promise<TrackingStatus> {
    await this.initialize();

    if (!this.module || Platform.OS !== 'ios') {
      return this.trackingStatus;
    }

    try {
      this.trackingStatus = await this.module.getTrackingStatus();
      return this.trackingStatus;
    } catch (error) {
      console.error('[ATT] Error getting tracking status:', error);
      return this.trackingStatus;
    }
  }

  /**
   * Check if tracking is authorized
   * @returns boolean - true if user has authorized tracking
   */
  async isTrackingAuthorized(): Promise<boolean> {
    const status = await this.getStatus();
    return status === 'authorized';
  }

  /**
   * Check if tracking permission can be requested
   * @returns boolean - true if permission dialog can be shown
   */
  async canRequestPermission(): Promise<boolean> {
    const status = await this.getStatus();
    return status === 'not-determined';
  }

  /**
   * Check if ATT is available on this device
   * @returns boolean - true if ATT is available (iOS 14+)
   */
  isAvailable(): boolean {
    return Platform.OS === 'ios' && this.module !== null;
  }

  /**
   * Log tracking status in a human-readable format
   */
  private logTrackingStatus(status: TrackingStatus): void {
    const statusMap: Record<TrackingStatus, string> = {
      authorized: '✓ Tracking authorized - User has given permission',
      denied: '✗ Tracking denied - User has declined permission',
      restricted: '⚠ Tracking restricted - Device settings prevent tracking',
      'not-determined': '? Not determined - User has not been asked yet',
      unavailable: 'ℹ Unavailable - ATT not available on this platform',
    };

    console.log(`[ATT] Status: ${statusMap[status]}`);
  }

  /**
   * Get a user-friendly description of the tracking status
   */
  getStatusDescription(status: TrackingStatus): string {
    const descriptions: Record<TrackingStatus, string> = {
      authorized: 'Tracking is enabled',
      denied: 'Tracking is disabled',
      restricted: 'Tracking is restricted by device settings',
      'not-determined': 'Not yet asked',
      unavailable: 'Not available',
    };

    return descriptions[status];
  }
}

// Export singleton instance
export const attService = new AppTrackingTransparencyService();
export default attService;

