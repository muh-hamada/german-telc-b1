import { AppConfig } from '../types';

// App configurations
export const APP_CONFIGS: Record<string, AppConfig> = {
  'german-a1': {
    id: 'german-a1',
    displayName: 'German TELC A1',
    language: 'German',
    level: 'A1',
    collectionName: 'german_a1_telc_exam_data',
  },
  'german-b1': {
    id: 'german-b1',
    displayName: 'German TELC B1',
    language: 'German',
    level: 'B1',
    collectionName: 'b1_telc_exam_data',
  },
  'german-b2': {
    id: 'german-b2',
    displayName: 'German TELC B2',
    language: 'German',
    level: 'B2',
    collectionName: 'german_b2_telc_exam_data',
  },
  'english-b1': {
    id: 'english-b1',
    displayName: 'English TELC B1',
    language: 'English',
    level: 'B1',
    collectionName: 'english_b1_telc_exam_data',
  },
  'english-b2': {
    id: 'english-b2',
    displayName: 'English TELC B2',
    language: 'English',
    level: 'B2',
    collectionName: 'english_b2_telc_exam_data',
  },
};

export const getAppConfig = (appId: string): AppConfig => {
  const config = APP_CONFIGS[appId];
  if (!config) {
    throw new Error(`Unknown app ID: ${appId}`);
  }
  return config;
};

