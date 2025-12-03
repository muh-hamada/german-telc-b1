/**
 * Remote Configuration Types
 * 
 * Defines the structure of remote configuration fetched from Firebase
 */

/**
 * Support Ad Intervals Configuration
 * Defines how often support ads should be shown in different screens
 */
export interface SupportAdIntervalsConfig {
  grammarStudy: number;    // Show ad after every N grammar questions
  vocabularyStudy: number; // Show ad after every N vocabulary items
}

/**
 * Global Configuration
 * Applies to all apps - stored in app_configs/global
 */
export interface GlobalConfig {
  supportAdIntervals: SupportAdIntervalsConfig;
  updatedAt: number;
}

/**
 * App-specific Remote Configuration
 * Stored in app_configs/{appId}
 */
export interface RemoteConfig {
  appId: string;
  enableStreaksForAllUsers: boolean;
  streaksWhitelistedUserIDs: string[];
  minRequiredVersion: string;
  latestVersion: string;
  forceUpdate: boolean;
  updateMessage?: { [locale: string]: string };
  updatedAt: number;
}

export interface RemoteConfigContextType {
  config: RemoteConfig | null;
  globalConfig: GlobalConfig | null;
  isLoading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
  isStreaksEnabledForUser: (userId?: string) => boolean;
  getSupportAdInterval: (placement: keyof SupportAdIntervalsConfig) => number;
}

export const DEFAULT_SUPPORT_AD_INTERVALS: SupportAdIntervalsConfig = {
  grammarStudy: 20,
  vocabularyStudy: 20,
};

export const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  supportAdIntervals: DEFAULT_SUPPORT_AD_INTERVALS,
  updatedAt: Date.now(),
};

export const DEFAULT_REMOTE_CONFIG: RemoteConfig = {
  appId: '',
  enableStreaksForAllUsers: false,
  streaksWhitelistedUserIDs: [],
  minRequiredVersion: '0.0.0',
  latestVersion: '0.0.0',
  forceUpdate: false,
  updateMessage: {
    en: 'A new version is available with improvements and bug fixes!',
    de: 'Eine neue Version mit Verbesserungen und Fehlerbehebungen ist verfügbar!',
    ar: 'هناك إصدار جديد متاح مع تحسينات وإصلاحات للأخطاء!',
    es: 'Hay una nueva versión disponible con mejoras y correcciones de errores!',
    fr: 'Une nouvelle version est disponible avec des améliorations et des corrections de bugs!',
    ru: 'Доступна новая версия с улучшениями и исправлениями ошибок!',
  },
  updatedAt: Date.now(),
};

