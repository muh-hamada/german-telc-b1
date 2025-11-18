import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { RemoteConfig, RemoteConfigContextType, DEFAULT_REMOTE_CONFIG } from '../types/remote-config.types';
import firebaseRemoteConfigService from '../services/firebase-remote-config.service';
import StorageService from '../services/storage.service';
import { activeExamConfig } from '../config/active-exam.config';

const RemoteConfigContext = createContext<RemoteConfigContextType | undefined>(undefined);

interface RemoteConfigProviderProps {
  children: ReactNode;
}

export const RemoteConfigProvider: React.FC<RemoteConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<RemoteConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const appId = activeExamConfig.id;

  /**
   * Load config with caching strategy:
   * 1. Load from cache immediately (fast)
   * 2. Fetch from Firebase (fresher data)
   * 3. Save to cache for next time
   */
  const loadConfig = useCallback(async () => {
    try {
      console.log('[RemoteConfigContext] Loading remote config for appId:', appId);
      
      // Step 1: Load cached config immediately for fast startup
      const cachedConfig = await StorageService.getRemoteConfig();
      if (cachedConfig) {
        console.log('[RemoteConfigContext] Loaded config from cache:', cachedConfig);
        setConfig(cachedConfig);
        setIsLoading(false);
      }

      // Step 2: Fetch fresh config from Firebase
      const freshConfig = await firebaseRemoteConfigService.getRemoteConfig(appId);
      
      // Step 3: Update state and cache with fresh config
      setConfig(freshConfig);
      await StorageService.saveRemoteConfig(freshConfig);
      setError(null);
      
      console.log('[RemoteConfigContext] Config loaded and cached:', freshConfig);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load remote config';
      console.error('[RemoteConfigContext] Error loading config:', errorMessage);
      setError(errorMessage);
      
      // Fallback to default config with development.config value
      const fallbackConfig: RemoteConfig = {
        ...DEFAULT_REMOTE_CONFIG,
        appId,
      };
      setConfig(fallbackConfig);
    } finally {
      setIsLoading(false);
    }
  }, [appId]);

  /**
   * Subscribe to real-time config updates from Firebase
   */
  useEffect(() => {
    console.log('[RemoteConfigContext] Setting up real-time config listener');
    
    const unsubscribe = firebaseRemoteConfigService.subscribeToConfigChanges(
      appId,
      async (updatedConfig) => {
        console.log('[RemoteConfigContext] Config updated from Firebase:', updatedConfig);
        setConfig(updatedConfig);
        await StorageService.saveRemoteConfig(updatedConfig);
        setError(null);
      }
    );

    return () => {
      console.log('[RemoteConfigContext] Cleaning up config listener');
      unsubscribe();
    };
  }, [appId]);

  /**
   * Initial config load on mount
   */
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  /**
   * Manually refresh config
   */
  const refreshConfig = useCallback(async () => {
    console.log('[RemoteConfigContext] Manually refreshing config');
    setIsLoading(true);
    await loadConfig();
  }, [loadConfig]);

  /**
   * Check if streaks are enabled for a specific user
   * Logic:
   * - If enableStreaksForAllUsers is true, return true for everyone
   * - If enableStreaksForAllUsers is false, check if userId is in whitelist
   * - If no userId provided, return enableStreaksForAllUsers value
   */
  const isStreaksEnabledForUser = useCallback((userId?: string): boolean => {
    if (!config) {
      return false; // No config loaded yet
    }

    // If enabled for all users, return true
    if (config.enableStreaksForAllUsers) {
      return true;
    }

    // If not enabled for all, check whitelist
    if (userId && config.streaksWhitelistedUserIDs.includes(userId)) {
      console.log('[RemoteConfigContext] Streaks enabled for whitelisted user:', userId);
      return true;
    }

    // Not enabled for this user
    return false;
  }, [config]);

  const value: RemoteConfigContextType = {
    config,
    isLoading,
    error,
    refreshConfig,
    isStreaksEnabledForUser,
  };

  return (
    <RemoteConfigContext.Provider value={value}>
      {children}
    </RemoteConfigContext.Provider>
  );
};

/**
 * Hook to use the RemoteConfigContext
 */
export const useRemoteConfig = (): RemoteConfigContextType => {
  const context = useContext(RemoteConfigContext);
  if (context === undefined) {
    throw new Error('useRemoteConfig must be used within a RemoteConfigProvider');
  }
  return context;
};

