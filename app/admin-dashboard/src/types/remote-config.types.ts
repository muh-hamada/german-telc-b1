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
  onboardingImages: string[]; // Array of 5 image URLs for onboarding steps
  removeTelcFromText_iOS: boolean; // Whether to remove "telc" text from translations on iOS
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
 * Premium Offer Configuration
 */
export interface PremiumOfferConfig {
  isActive: boolean;        // Whether to show offer UI
  discountPercentage: number; // e.g., 25 for 25% off
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
  // Premium offer configuration
  premiumOffer: PremiumOfferConfig;
  // Data version for cache invalidation - increment when exam data changes
  dataVersion: number;
  updatedAt: number;
}

export const DEFAULT_SUPPORT_AD_INTERVALS: SupportAdIntervalsConfig = {
  grammarStudy: 20,
  vocabularyStudy: 20,
};

export const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  supportAdIntervals: DEFAULT_SUPPORT_AD_INTERVALS,
  onboardingImages: [
    'https://firebasestorage.googleapis.com/v0/b/telc-b1-german.firebasestorage.app/o/onboarding_screen_steps%2Fstep-1.png?alt=media',
    'https://firebasestorage.googleapis.com/v0/b/telc-b1-german.firebasestorage.app/o/onboarding_screen_steps%2Fstep-2.png?alt=media',
    'https://firebasestorage.googleapis.com/v0/b/telc-b1-german.firebasestorage.app/o/onboarding_screen_steps%2Fstep-3.png?alt=media',
    'https://firebasestorage.googleapis.com/v0/b/telc-b1-german.firebasestorage.app/o/onboarding_screen_steps%2Fstep-4.png?alt=media',
    'https://firebasestorage.googleapis.com/v0/b/telc-b1-german.firebasestorage.app/o/onboarding_screen_steps%2Fstep-5.png?alt=media',
  ],
  removeTelcFromText_iOS: true, // Default: remove telc text on iOS (initial behavior)
  updatedAt: Date.now(),
};

export const DEFAULT_VOCABULARY_NATIVE_AD_CONFIG: VocabularyNativeAdConfig = {
  enabled: true,
  interval: 10,
};

export const DEFAULT_PREMIUM_OFFER_CONFIG: PremiumOfferConfig = {
  isActive: false,
  discountPercentage: 0,
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
  premiumOffer: DEFAULT_PREMIUM_OFFER_CONFIG,
  dataVersion: 1, // Increment when exam data changes to invalidate client cache
  updatedAt: Date.now(),
};

