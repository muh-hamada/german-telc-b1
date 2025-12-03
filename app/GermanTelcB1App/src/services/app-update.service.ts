/**
 * App Update Service
 * 
 * Handles version checking and app store navigation for update functionality
 */

import DeviceInfo from 'react-native-device-info';
import { Linking, Platform } from 'react-native';
import StorageService from './storage.service';
import { activeExamConfig } from '../config/active-exam.config';

export interface AppUpdateCheckResult {
  shouldShow: boolean;
  isForced: boolean;
  latestVersion: string;
  currentVersion: string;
  message?: string;
  reason?: string;
}

class AppUpdateService {
  /**
   * Compare version strings (e.g., "1.0.31" vs "1.0.35")
   * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
   */
  private compareVersions(v1: string, v2: string): number {
    // Handle undefined, null, or empty strings
    if (!v1 || !v2) {
      console.warn('[AppUpdateService] Invalid version strings:', { v1, v2 });
      return 0; // Treat as equal if either is invalid
    }

    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    
    return 0;
  }

  /**
   * Check if update modal should be shown
   */
  async shouldShowUpdateModal(
    latestVersion: string,
    minRequiredVersion: string,
    forceUpdate: boolean,
    customMessage?: string
  ): Promise<AppUpdateCheckResult> {
    const currentVersion = DeviceInfo.getVersion();
    
    // Validate input versions
    if (!latestVersion || !minRequiredVersion) {
      console.log('[AppUpdateService] Invalid version config, skipping update check');
      return {
        shouldShow: false,
        isForced: false,
        latestVersion: latestVersion || '0.0.0',
        currentVersion,
        reason: 'Invalid version configuration',
      };
    }

    console.log('[AppUpdateService] Checking version:', {
      current: currentVersion,
      latest: latestVersion,
      minRequired: minRequiredVersion,
      force: forceUpdate,
    });

    // Check if current version is below minimum required
    const isOutdated = this.compareVersions(currentVersion, latestVersion) < 0;
    const isBelowMinimum = this.compareVersions(currentVersion, minRequiredVersion) < 0;

    if (!isOutdated) {
      return {
        shouldShow: false,
        isForced: false,
        latestVersion,
        currentVersion,
        reason: 'App is up to date',
      };
    }

    // If forced update or below minimum, always show
    if (forceUpdate || isBelowMinimum) {
      return {
        shouldShow: true,
        isForced: true,
        latestVersion,
        currentVersion,
        message: customMessage,
        reason: forceUpdate ? 'Force update enabled' : 'Below minimum required version',
      };
    }

    // Check if user dismissed this version recently (within 2 days)
    const dismissedData = await StorageService.getAppUpdateDismissedData();
    
    if (dismissedData && dismissedData.version === latestVersion) {
      const daysSinceDismissed = (Date.now() - dismissedData.dismissedAt) / (1000 * 60 * 60 * 24);
      
      if (daysSinceDismissed < 2) {
        return {
          shouldShow: false,
          isForced: false,
          latestVersion,
          currentVersion,
          reason: `User dismissed ${daysSinceDismissed.toFixed(1)} days ago, waiting for 2 days`,
        };
      }
    }

    // Show optional update
    return {
      shouldShow: true,
      isForced: false,
      latestVersion,
      currentVersion,
      message: customMessage,
      reason: 'New version available',
    };
  }

  /**
   * Mark current version as dismissed
   */
  async dismissUpdate(version: string): Promise<void> {
    await StorageService.saveAppUpdateDismissedData(version);
    console.log('[AppUpdateService] Update dismissed for version:', version);
  }

  /**
   * Open app store for update
   */
  async openAppStore(): Promise<boolean> {
    try {
      let url: string;
      if (Platform.OS === 'ios') {
        // Use iOS App Store ID from exam config
        const appStoreId = activeExamConfig.storeIds.ios;
        url = `itms-apps://apps.apple.com/app/id${appStoreId}`;
      } else {
        // Use Android bundle ID from exam config
        const bundleId = activeExamConfig.bundleId.android;
        url = `market://details?id=${bundleId}`;
      }
      
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
        console.log('[AppUpdateService] Opened app store:', url);
        return true;
      } else {
        // Fallback to web URL
        const webUrl = Platform.OS === 'ios'
          ? `https://apps.apple.com/app/id${activeExamConfig.storeIds.ios}`
          : `https://play.google.com/store/apps/details?id=${activeExamConfig.bundleId.android}`;
        
        await Linking.openURL(webUrl);
        console.log('[AppUpdateService] Opened app store (web):', webUrl);
        return true;
      }
    } catch (error) {
      console.error('[AppUpdateService] Error opening app store:', error);
      return false;
    }
  }
}

export default new AppUpdateService();

