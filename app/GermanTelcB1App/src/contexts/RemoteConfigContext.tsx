import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  RemoteConfig, 
  RemoteConfigContextType, 
  DEFAULT_REMOTE_CONFIG,
  GlobalConfig,
  DEFAULT_GLOBAL_CONFIG,
  SupportAdIntervalsConfig,
  VocabularyNativeAdConfig,
  DEFAULT_VOCABULARY_NATIVE_AD_CONFIG,
} from '../types/remote-config.types';
import firebaseRemoteConfigService from '../services/firebase-remote-config.service';
import StorageService from '../services/storage.service';
import { activeExamConfig } from '../config/active-exam.config';

const RemoteConfigContext = createContext<RemoteConfigContextType | undefined>(undefined);

interface RemoteConfigProviderProps {
  children: ReactNode;
}

export const RemoteConfigProvider: React.FC<RemoteConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<RemoteConfig | null>(null);
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig | null>(null);
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
      
      // Step 1: Load cached configs immediately for fast startup
      const cachedConfig = await StorageService.getRemoteConfig();
      const cachedGlobalConfig = await StorageService.getGlobalConfig();
      
      if (cachedConfig) {
        console.log('[RemoteConfigContext] Loaded app config from cache:', cachedConfig);
        setConfig(cachedConfig);
      }
      
      if (cachedGlobalConfig) {
        console.log('[RemoteConfigContext] Loaded global config from cache:', cachedGlobalConfig);
        setGlobalConfig(cachedGlobalConfig);
      }
      
      if (cachedConfig || cachedGlobalConfig) {
        setIsLoading(false);
      }

      // Step 2: Fetch fresh configs from Firebase (in parallel)
      const [freshConfig, freshGlobalConfig] = await Promise.all([
        firebaseRemoteConfigService.getRemoteConfig(appId),
        firebaseRemoteConfigService.getGlobalConfig(),
      ]);
      
      // Step 3: Update state and cache with fresh configs
      setConfig(freshConfig);
      setGlobalConfig(freshGlobalConfig);
      await Promise.all([
        StorageService.saveRemoteConfig(freshConfig),
        StorageService.saveGlobalConfig(freshGlobalConfig),
      ]);
      setError(null);
      
      console.log('[RemoteConfigContext] Configs loaded and cached:', { freshConfig, freshGlobalConfig });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load remote config';
      console.error('[RemoteConfigContext] Error loading config:', errorMessage);
      setError(errorMessage);
      
      // Fallback to default configs
      const fallbackConfig: RemoteConfig = {
        ...DEFAULT_REMOTE_CONFIG,
        appId,
      };
      setConfig(fallbackConfig);
      setGlobalConfig(DEFAULT_GLOBAL_CONFIG);
    } finally {
      setIsLoading(false);
    }
  }, [appId]);

  /**
   * Subscribe to real-time config updates from Firebase
   */
  useEffect(() => {
    console.log('[RemoteConfigContext] Setting up real-time config listeners');
    
    // Subscribe to app-specific config
    const unsubscribeAppConfig = firebaseRemoteConfigService.subscribeToConfigChanges(
      appId,
      async (updatedConfig) => {
        console.log('[RemoteConfigContext] App config updated from Firebase:', updatedConfig);
        setConfig(updatedConfig);
        await StorageService.saveRemoteConfig(updatedConfig);
        setError(null);
      }
    );

    // Subscribe to global config
    const unsubscribeGlobalConfig = firebaseRemoteConfigService.subscribeToGlobalConfigChanges(
      async (updatedGlobalConfig) => {
        console.log('[RemoteConfigContext] Global config updated from Firebase:', updatedGlobalConfig);
        setGlobalConfig(updatedGlobalConfig);
        await StorageService.saveGlobalConfig(updatedGlobalConfig);
      }
    );

    return () => {
      console.log('[RemoteConfigContext] Cleaning up config listeners');
      unsubscribeAppConfig();
      unsubscribeGlobalConfig();
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

  /**
   * Get support ad interval for a specific placement
   * @param placement - The placement key (e.g., 'grammarStudy', 'vocabularyStudy')
   * @returns Number of items/questions between support ad prompts
   */
  const getSupportAdInterval = useCallback((placement: keyof SupportAdIntervalsConfig): number => {
    if (!globalConfig) {
      return DEFAULT_GLOBAL_CONFIG.supportAdIntervals[placement];
    }
    return globalConfig.supportAdIntervals[placement];
  }, [globalConfig]);

  /**
   * Check if premium features are enabled (kill switch)
   * When false, all premium UI/modals/entry points should be hidden
   */
  const isPremiumFeaturesEnabled = useCallback((): boolean => {
    if (!config) {
      return false; // Default to disabled if config not loaded
    }
    return config.enablePremiumFeatures;
  }, [config]);

  /**
   * Get vocabulary native ad configuration
   * @returns VocabularyNativeAdConfig with enabled flag and interval
   */
  const getVocabularyNativeAdConfig = useCallback((): VocabularyNativeAdConfig => {
    if (!config) {
      return DEFAULT_VOCABULARY_NATIVE_AD_CONFIG;
    }
    return {
      enabled: config.enableVocabularyNativeAd,
      interval: config.vocabularyNativeAdInterval,
    };
  }, [config]);

  const value: RemoteConfigContextType = {
    config,
    globalConfig,
    isLoading,
    error,
    refreshConfig,
    isStreaksEnabledForUser,
    getSupportAdInterval,
    isPremiumFeaturesEnabled,
    getVocabularyNativeAdConfig,
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

