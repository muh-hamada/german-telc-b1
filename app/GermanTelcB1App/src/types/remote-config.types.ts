/**
 * Remote Configuration Types
 * 
 * Defines the structure of remote configuration fetched from Firebase
 */

export interface RemoteConfig {
  appId: string;
  enableStreaksForAllUsers: boolean;
  streaksWhitelistedUserIDs: string[];
  updatedAt: number;
}

export interface RemoteConfigContextType {
  config: RemoteConfig | null;
  isLoading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
  isStreaksEnabledForUser: (userId?: string) => boolean;
}

export const DEFAULT_REMOTE_CONFIG: RemoteConfig = {
  appId: '',
  enableStreaksForAllUsers: false,
  streaksWhitelistedUserIDs: [],
  updatedAt: Date.now(),
};

