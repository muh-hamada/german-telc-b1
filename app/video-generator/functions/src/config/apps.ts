import { AppConfig } from '../types';

// App configurations
export const APP_CONFIGS: Record<string, AppConfig> = {
  'german-a1': {
    id: 'german-a1',
    displayName: 'German TELC A1',
    language: 'German',
    level: 'A1',
    collectionName: 'german_a1_telc_exam_data',
    vocabularyCollection: 'vocabulary_data_german_a1',
    ttsLanguageCode: 'de-DE',
  },
  'german-a2': {
    id: 'german-a2',
    displayName: 'German TELC A2',
    language: 'German',
    level: 'A2',
    collectionName: 'german_a2_telc_exam_data',
    vocabularyCollection: 'vocabulary_data_german_a2',
    ttsLanguageCode: 'de-DE',
  },
  'german-b1': {
    id: 'german-b1',
    displayName: 'German TELC B1',
    language: 'German',
    level: 'B1',
    collectionName: 'b1_telc_exam_data',
    vocabularyCollection: 'vocabulary_data_german_b1',
    ttsLanguageCode: 'de-DE',
  },
  'german-b2': {
    id: 'german-b2',
    displayName: 'German TELC B2',
    language: 'German',
    level: 'B2',
    collectionName: 'german_b2_telc_exam_data',
    vocabularyCollection: 'vocabulary_data_german_b2',
    ttsLanguageCode: 'de-DE',
  },
  'english-b1': {
    id: 'english-b1',
    displayName: 'English TELC B1',
    language: 'English',
    level: 'B1',
    collectionName: 'english_b1_telc_exam_data',
    vocabularyCollection: 'vocabulary_data_english_b1',
    ttsLanguageCode: 'en-US',
  },
  'english-b2': {
    id: 'english-b2',
    displayName: 'English TELC B2',
    language: 'English',
    level: 'B2',
    collectionName: 'english_b2_telc_exam_data',
    vocabularyCollection: 'vocabulary_data_english_b2',
    ttsLanguageCode: 'en-US',
  },
};

export const getAppConfig = (appId: string): AppConfig => {
  const config = APP_CONFIGS[appId];
  if (!config) {
    throw new Error(`Unknown app ID: ${appId}`);
  }
  return config;
};

