import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  Timestamp,
} from 'firebase/firestore';
import { firebaseService } from './firebase.service';
import { GlobalConfig, RemoteConfig } from '../types/remote-config.types';

class ConfigService {
  private db = firebaseService.getFirestore();
  private configCollection = 'app_configs';

  /**
   * Get global configuration
   */
  async getGlobalConfig(): Promise<GlobalConfig | null> {
    try {
      const docRef = doc(this.db, this.configCollection, 'global');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as GlobalConfig;
      }
      return null;
    } catch (error) {
      console.error('Error getting global config:', error);
      throw new Error('Failed to fetch global configuration');
    }
  }

  /**
   * Save global configuration
   */
  async saveGlobalConfig(config: GlobalConfig): Promise<void> {
    try {
      const docRef = doc(this.db, this.configCollection, 'global');
      const configToSave: GlobalConfig = {
        ...config,
        updatedAt: Date.now(),
      };
      await setDoc(docRef, configToSave);
    } catch (error) {
      console.error('Error saving global config:', error);
      throw new Error('Failed to save global configuration');
    }
  }

  /**
   * Get app-specific configuration
   */
  async getAppConfig(appId: string): Promise<RemoteConfig | null> {
    try {
      const docRef = doc(this.db, this.configCollection, appId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as RemoteConfig;
      }
      return null;
    } catch (error) {
      console.error(`Error getting config for app ${appId}:`, error);
      throw new Error(`Failed to fetch configuration for ${appId}`);
    }
  }

  /**
   * Save app-specific configuration
   */
  async saveAppConfig(appId: string, config: RemoteConfig): Promise<void> {
    try {
      const docRef = doc(this.db, this.configCollection, appId);
      const configToSave: RemoteConfig = {
        ...config,
        appId,
        updatedAt: Date.now(),
      };
      await setDoc(docRef, configToSave);
    } catch (error) {
      console.error(`Error saving config for app ${appId}:`, error);
      throw new Error(`Failed to save configuration for ${appId}`);
    }
  }

  /**
   * Get all app configurations (excluding global)
   */
  async getAllAppConfigs(): Promise<Record<string, RemoteConfig>> {
    try {
      const collectionRef = collection(this.db, this.configCollection);
      const querySnapshot = await getDocs(collectionRef);

      const configs: Record<string, RemoteConfig> = {};
      querySnapshot.forEach((docSnapshot) => {
        if (docSnapshot.id !== 'global') {
          configs[docSnapshot.id] = docSnapshot.data() as RemoteConfig;
        }
      });

      return configs;
    } catch (error) {
      console.error('Error getting all app configs:', error);
      throw new Error('Failed to fetch all app configurations');
    }
  }

  /**
   * Apply the same configuration to multiple apps
   */
  async applyConfigToMultipleApps(
    appIds: string[],
    config: Partial<RemoteConfig>
  ): Promise<void> {
    try {
      const promises = appIds.map(async (appId) => {
        const existingConfig = await this.getAppConfig(appId);
        if (existingConfig) {
          const updatedConfig: RemoteConfig = {
            ...existingConfig,
            ...config,
            appId, // Preserve the correct appId
            updatedAt: Date.now(),
          };
          await this.saveAppConfig(appId, updatedConfig);
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Error applying config to multiple apps:', error);
      throw new Error('Failed to apply configuration to all apps');
    }
  }

  /**
   * Initialize a new app config with defaults
   */
  async initializeAppConfig(appId: string, defaults: RemoteConfig): Promise<void> {
    try {
      const existingConfig = await this.getAppConfig(appId);
      if (!existingConfig) {
        await this.saveAppConfig(appId, { ...defaults, appId });
      }
    } catch (error) {
      console.error(`Error initializing config for app ${appId}:`, error);
      throw new Error(`Failed to initialize configuration for ${appId}`);
    }
  }
}

const configService = new ConfigService();
export { configService };

