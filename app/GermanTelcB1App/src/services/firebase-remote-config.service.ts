import firestore from '@react-native-firebase/firestore';
import { 
  RemoteConfig, 
  DEFAULT_REMOTE_CONFIG,
  GlobalConfig,
  DEFAULT_GLOBAL_CONFIG,
  DEFAULT_SUPPORT_AD_INTERVALS,
  DEFAULT_VOCABULARY_NATIVE_AD_CONFIG,
  DEFAULT_PREMIUM_OFFER_CONFIG,
} from '../types/remote-config.types';

/**
 * Firebase Remote Config Service
 * 
 * Manages remote configuration fetched from Firebase Firestore
 * Collection: app_configs
 * Document IDs: 
 *   - {appId} (e.g., 'german-b1') for app-specific config
 *   - 'global' for global config that applies to all apps
 */
class FirebaseRemoteConfigService {
  private readonly COLLECTION_NAME = 'app_configs';
  private readonly GLOBAL_DOC_ID = 'global';

  /**
   * Build RemoteConfig object from Firestore data with proper defaults
   * @param data - Raw data from Firestore
   * @param appId - The app identifier
   * @returns Properly formatted RemoteConfig object
   */
  private buildRemoteConfig(data: any, appId: string): RemoteConfig {
    return {
      appId: data.appId || appId,
      enableStreaksForAllUsers: data.enableStreaksForAllUsers !== undefined 
        ? data.enableStreaksForAllUsers 
        : DEFAULT_REMOTE_CONFIG.enableStreaksForAllUsers,
      streaksWhitelistedUserIDs: Array.isArray(data.streaksWhitelistedUserIDs)
        ? data.streaksWhitelistedUserIDs
        : DEFAULT_REMOTE_CONFIG.streaksWhitelistedUserIDs,
      minRequiredVersion: data.minRequiredVersion || DEFAULT_REMOTE_CONFIG.minRequiredVersion,
      latestVersion: data.latestVersion || DEFAULT_REMOTE_CONFIG.latestVersion,
      forceUpdate: data.forceUpdate !== undefined 
        ? data.forceUpdate 
        : DEFAULT_REMOTE_CONFIG.forceUpdate,
      updateMessage: data.updateMessage || DEFAULT_REMOTE_CONFIG.updateMessage,
      updatedAt: data.updatedAt || Date.now(),
      enablePremiumFeatures: data.enablePremiumFeatures !== undefined 
        ? data.enablePremiumFeatures 
        : DEFAULT_REMOTE_CONFIG.enablePremiumFeatures,
      enableVocabularyNativeAd: data.enableVocabularyNativeAd !== undefined
        ? data.enableVocabularyNativeAd
        : DEFAULT_VOCABULARY_NATIVE_AD_CONFIG.enabled,
      vocabularyNativeAdInterval: data.vocabularyNativeAdInterval !== undefined
        ? data.vocabularyNativeAdInterval
        : DEFAULT_VOCABULARY_NATIVE_AD_CONFIG.interval,
      premiumOffer: data.premiumOffer || DEFAULT_PREMIUM_OFFER_CONFIG,
    };
  }

  /**
   * Get remote configuration for a specific app
   * @param appId - The app identifier (e.g., 'german-b1')
   * @returns RemoteConfig object
   */
  async getRemoteConfig(appId: string): Promise<RemoteConfig> {
    try {
      console.log(`[RemoteConfigService] Fetching config for appId: ${appId}`);
      
      const docRef = firestore().collection(this.COLLECTION_NAME).doc(appId);
      const doc = await docRef.get();

      if (!doc.exists) {
        console.warn(`[RemoteConfigService] No config found for appId: ${appId}, using defaults`);
        return {
          ...DEFAULT_REMOTE_CONFIG,
          appId,
        };
      }

      const data = doc.data();
      if (!data) {
        console.warn(`[RemoteConfigService] Empty config data for appId: ${appId}, using defaults`);
        return {
          ...DEFAULT_REMOTE_CONFIG,
          appId,
        };
      }

      const config = this.buildRemoteConfig(data, appId);

      console.log('[RemoteConfigService] Config loaded successfully:', config);
      return config;
    } catch (error) {
      console.error('[RemoteConfigService] Error fetching remote config:', error);
      // Return default config on error
      return {
        ...DEFAULT_REMOTE_CONFIG,
        appId,
      };
    }
  }

  /**
   * Subscribe to real-time updates of remote configuration
   * @param appId - The app identifier
   * @param callback - Function to call when config changes
   * @returns Unsubscribe function
   */
  subscribeToConfigChanges(
    appId: string,
    callback: (config: RemoteConfig) => void
  ): () => void {
    console.log(`[RemoteConfigService] Subscribing to config changes for appId: ${appId}`);
    
    const unsubscribe = firestore()
      .collection(this.COLLECTION_NAME)
      .doc(appId)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot.exists) {
            console.warn(`[RemoteConfigService] Config document not found for appId: ${appId}`);
            callback({
              ...DEFAULT_REMOTE_CONFIG,
              appId,
            });
            return;
          }

          const data = snapshot.data();
          if (!data) {
            console.warn(`[RemoteConfigService] Empty config data for appId: ${appId}`);
            callback({
              ...DEFAULT_REMOTE_CONFIG,
              appId,
            });
            return;
          }

          const config = this.buildRemoteConfig(data, appId);

          console.log('[RemoteConfigService] Config updated:', config);
          callback(config);
        },
        (error) => {
          console.error('[RemoteConfigService] Error in config subscription:', error);
          // Provide default config on error
          callback({
            ...DEFAULT_REMOTE_CONFIG,
            appId,
          });
        }
      );

    return unsubscribe;
  }

  /**
   * Get global configuration that applies to all apps
   * @returns GlobalConfig object
   */
  async getGlobalConfig(): Promise<GlobalConfig> {
    try {
      console.log('[RemoteConfigService] Fetching global config');
      
      const docRef = firestore().collection(this.COLLECTION_NAME).doc(this.GLOBAL_DOC_ID);
      const doc = await docRef.get();

      if (!doc.exists) {
        console.warn('[RemoteConfigService] No global config found, using defaults');
        return DEFAULT_GLOBAL_CONFIG;
      }

      const data = doc.data();
      if (!data) {
        console.warn('[RemoteConfigService] Empty global config data, using defaults');
        return DEFAULT_GLOBAL_CONFIG;
      }

      const config: GlobalConfig = {
        supportAdIntervals: {
          grammarStudy: data.supportAdIntervals?.grammarStudy ?? DEFAULT_SUPPORT_AD_INTERVALS.grammarStudy,
          vocabularyStudy: data.supportAdIntervals?.vocabularyStudy ?? DEFAULT_SUPPORT_AD_INTERVALS.vocabularyStudy,
        },
        onboardingImages: Array.isArray(data.onboardingImages)
          ? data.onboardingImages
          : DEFAULT_GLOBAL_CONFIG.onboardingImages,
        updatedAt: data.updatedAt || Date.now(),
      };

      console.log('[RemoteConfigService] Global config loaded successfully:', config);
      return config;
    } catch (error) {
      console.error('[RemoteConfigService] Error fetching global config:', error);
      return DEFAULT_GLOBAL_CONFIG;
    }
  }

  /**
   * Subscribe to real-time updates of global configuration
   * @param callback - Function to call when config changes
   * @returns Unsubscribe function
   */
  subscribeToGlobalConfigChanges(callback: (config: GlobalConfig) => void): () => void {
    console.log('[RemoteConfigService] Subscribing to global config changes');
    
    const unsubscribe = firestore()
      .collection(this.COLLECTION_NAME)
      .doc(this.GLOBAL_DOC_ID)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot.exists) {
            console.warn('[RemoteConfigService] Global config document not found');
            callback(DEFAULT_GLOBAL_CONFIG);
            return;
          }

          const data = snapshot.data();
          if (!data) {
            console.warn('[RemoteConfigService] Empty global config data');
            callback(DEFAULT_GLOBAL_CONFIG);
            return;
          }

          const config: GlobalConfig = {
            supportAdIntervals: {
              grammarStudy: data.supportAdIntervals?.grammarStudy ?? DEFAULT_SUPPORT_AD_INTERVALS.grammarStudy,
              vocabularyStudy: data.supportAdIntervals?.vocabularyStudy ?? DEFAULT_SUPPORT_AD_INTERVALS.vocabularyStudy,
            },
            onboardingImages: Array.isArray(data.onboardingImages)
              ? data.onboardingImages
              : DEFAULT_GLOBAL_CONFIG.onboardingImages,
            updatedAt: data.updatedAt || Date.now(),
          };

          console.log('[RemoteConfigService] Global config updated:', config);
          callback(config);
        },
        (error) => {
          console.error('[RemoteConfigService] Error in global config subscription:', error);
          callback(DEFAULT_GLOBAL_CONFIG);
        }
      );

    return unsubscribe;
  }
}

export default new FirebaseRemoteConfigService();

