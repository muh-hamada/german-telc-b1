/**
 * App Configurations for Admin Dashboard
 * 
 * This mirrors the exam configurations from the mobile app
 * and defines which Firebase collections to use for each app.
 */

export interface AppConfig {
  id: string;
  language: string;
  level: string;
  displayName: string;
  collectionName: string;
  description: string;
  dataFolder: string;
}

export const APP_CONFIGS: Record<string, AppConfig> = {
  'german-b1': {
    id: 'german-b1',
    language: 'german',
    level: 'B1',
    displayName: 'German TELC B1',
    collectionName: 'b1_telc_exam_data', // Existing collection for backward compatibility
    description: 'German language exam preparation for TELC B1 level',
    dataFolder: 'german-b1',
  },
  'german-b2': {
    id: 'german-b2',
    language: 'german',
    level: 'B2',
    displayName: 'German TELC B2',
    collectionName: 'german_b2_telc_exam_data',
    description: 'German language exam preparation for TELC B2 level',
    dataFolder: 'german-b2',
  },
  'english-b1': {
    id: 'english-b1',
    language: 'english',
    level: 'B1',
    displayName: 'English TELC B1',
    collectionName: 'english_b1_telc_exam_data',
    description: 'English language exam preparation for TELC B1 level',
    dataFolder: 'english-b1',
  },
};

export const getAppConfig = (appId: string): AppConfig => {
  const config = APP_CONFIGS[appId];
  if (!config) {
    throw new Error(`App configuration not found for ID: ${appId}`);
  }
  return config;
};

export const getAllAppConfigs = (): AppConfig[] => {
  return Object.values(APP_CONFIGS);
};

