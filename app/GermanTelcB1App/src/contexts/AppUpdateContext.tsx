/**
 * App Update Context
 * 
 * Manages app version checking and update modal display logic.
 * Uses the ModalQueueContext to show update modals.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRemoteConfig } from './RemoteConfigContext';
import { useModalQueue } from './ModalQueueContext';
import appUpdateService, { AppUpdateCheckResult } from '../services/app-update.service';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

interface AppUpdateContextType {
  updateInfo: AppUpdateCheckResult | null;
  dismissUpdate: () => Promise<void>;
  openAppStore: () => Promise<void>;
}

const AppUpdateContext = createContext<AppUpdateContextType | undefined>(undefined);

interface AppUpdateProviderProps {
  children: ReactNode;
}

export const AppUpdateProvider: React.FC<AppUpdateProviderProps> = ({ children }) => {
  const { config, isLoading: configLoading } = useRemoteConfig();
  const { enqueue } = useModalQueue();
  const [updateInfo, setUpdateInfo] = useState<AppUpdateCheckResult | null>(null);

  /**
   * Check for updates when config is loaded
   */
  useEffect(() => {
    const checkForUpdates = async () => {
      if (configLoading || !config) {
        return;
      }

      console.log('[AppUpdateContext] Checking for updates...', config.latestVersion, config.minRequiredVersion, config.forceUpdate, config.updateMessage?.en);
      
      const result = await appUpdateService.shouldShowUpdateModal(
        config.latestVersion,
        config.minRequiredVersion,
        config.forceUpdate,
        config.updateMessage?.en // Use appropriate locale
      );

      console.log('[AppUpdateContext] Update check result:', result);
      
      setUpdateInfo(result);
      
      if (result.shouldShow) {
        // Enqueue the appropriate modal type
        const modalType = result.isForced ? 'app-update-forced' : 'app-update-available';
        enqueue(modalType);
        
        logEvent(AnalyticsEvents.APP_UPDATE_MODAL_SHOWN, {
          current_version: result.currentVersion,
          latest_version: result.latestVersion,
          is_forced: result.isForced,
          reason: result.reason,
        });
      }
    };

    // Add a small delay to ensure other contexts can initialize first
    const timer = setTimeout(checkForUpdates, 1000);
    return () => clearTimeout(timer);
  }, [config, configLoading, enqueue]);

  const dismissUpdate = useCallback(async () => {
    if (!updateInfo) return;

    console.log('[AppUpdateContext] Dismissing update modal');
    
    logEvent(AnalyticsEvents.APP_UPDATE_LATER_CLICKED, {
      current_version: updateInfo.currentVersion,
      latest_version: updateInfo.latestVersion,
    });

    await appUpdateService.dismissUpdate(updateInfo.latestVersion);
  }, [updateInfo]);

  const openAppStore = useCallback(async () => {
    if (!updateInfo) return;

    console.log('[AppUpdateContext] Opening app store');
    
    logEvent(AnalyticsEvents.APP_UPDATE_NOW_CLICKED, {
      current_version: updateInfo.currentVersion,
      latest_version: updateInfo.latestVersion,
    });

    const success = await appUpdateService.openAppStore();
    
    if (success) {
      logEvent(AnalyticsEvents.APP_UPDATE_STORE_OPENED, {
        current_version: updateInfo.currentVersion,
        latest_version: updateInfo.latestVersion,
      });
    }
    
    // Don't close modal after opening store - user might return
  }, [updateInfo]);

  const value: AppUpdateContextType = {
    updateInfo,
    dismissUpdate,
    openAppStore,
  };

  return (
    <AppUpdateContext.Provider value={value}>
      {children}
    </AppUpdateContext.Provider>
  );
};

/**
 * Hook to use the AppUpdateContext
 */
export const useAppUpdate = (): AppUpdateContextType => {
  const context = useContext(AppUpdateContext);
  if (context === undefined) {
    throw new Error('useAppUpdate must be used within an AppUpdateProvider');
  }
  return context;
};
