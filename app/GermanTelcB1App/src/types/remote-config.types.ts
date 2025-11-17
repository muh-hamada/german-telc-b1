/**
 * Remote Configuration Types
 * 
 * Defines the structure of remote configuration fetched from Firebase
 */

export interface RemoteConfig {
  appId: string;
  enableStreaks: boolean;
  updatedAt: number;
}

export interface RemoteConfigContextType {
  config: RemoteConfig | null;
  isLoading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
}

export const DEFAULT_REMOTE_CONFIG: RemoteConfig = {
  appId: '',
  enableStreaks: true, // Default fallback value
  updatedAt: Date.now(),
};

