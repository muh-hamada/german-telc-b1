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
 * Vocabulary Native Ad Configuration
 */
export interface VocabularyNativeAdConfig {
  enabled: boolean;
  interval: number; // Show ad after every N vocabulary words
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
  // Premium features kill switch - set to false to hide all premium UI/modals
  enablePremiumFeatures: boolean;
  // Vocabulary native ad configuration
  enableVocabularyNativeAd: boolean;
  vocabularyNativeAdInterval: number;
  updatedAt: number;
}

export const DEFAULT_SUPPORT_AD_INTERVALS: SupportAdIntervalsConfig = {
  grammarStudy: 20,
  vocabularyStudy: 20,
};

export const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  supportAdIntervals: DEFAULT_SUPPORT_AD_INTERVALS,
  updatedAt: Date.now(),
};

export const DEFAULT_VOCABULARY_NATIVE_AD_CONFIG: VocabularyNativeAdConfig = {
  enabled: true,
  interval: 10,
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
  enablePremiumFeatures: false,
  enableVocabularyNativeAd: DEFAULT_VOCABULARY_NATIVE_AD_CONFIG.enabled,
  vocabularyNativeAdInterval: DEFAULT_VOCABULARY_NATIVE_AD_CONFIG.interval,
  updatedAt: Date.now(),
};

