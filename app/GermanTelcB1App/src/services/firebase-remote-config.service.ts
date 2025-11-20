import firestore from '@react-native-firebase/firestore';
import { RemoteConfig, DEFAULT_REMOTE_CONFIG } from '../types/remote-config.types';

/**
 * Firebase Remote Config Service
 * 
 * Manages remote configuration fetched from Firebase Firestore
 * Collection: appConfigs
 * Document ID: appId (e.g., 'german-b1')
 */
class FirebaseRemoteConfigService {
  private readonly COLLECTION_NAME = 'app_configs';

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

      const config: RemoteConfig = {
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
      };

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

          const config: RemoteConfig = {
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
          };

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
}

export default new FirebaseRemoteConfigService();

