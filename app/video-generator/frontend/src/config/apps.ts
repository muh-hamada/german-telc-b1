import { AppConfig } from '../types';

// App configurations matching the existing system
export const APP_CONFIGS: Record<string, AppConfig> = {
  'german-a1': {
    id: 'german-a1',
    displayName: 'German TELC A1',
    language: 'German',
    level: 'A1',
  },
  'german-b1': {
    id: 'german-b1',
    displayName: 'German TELC B1',
    language: 'German',
    level: 'B1',
  },
  'german-b2': {
    id: 'german-b2',
    displayName: 'German TELC B2',
    language: 'German',
    level: 'B2',
  },
  'english-b1': {
    id: 'english-b1',
    displayName: 'English TELC B1',
    language: 'English',
    level: 'B1',
  },
  'english-b2': {
    id: 'english-b2',
    displayName: 'English TELC B2',
    language: 'English',
    level: 'B2',
  },
};

export const FIREBASE_COLLECTIONS: Record<string, string> = {
  'german-a1': 'german_a1_telc_exam_data',
  'german-b1': 'b1_telc_exam_data', // Backward compatibility
  'german-b2': 'german_b2_telc_exam_data',
  'english-b1': 'english_b1_telc_exam_data',
  'english-b2': 'english_b2_telc_exam_data',
};

export const getAppConfig = (appId: string): AppConfig => {
  return APP_CONFIGS[appId] || APP_CONFIGS['german-a1'];
};

export const getFirebaseCollection = (appId: string): string => {
  return FIREBASE_COLLECTIONS[appId] || 'german_a1_telc_exam_data';
};

export const questionTexts: Record<string, any> = {
  default: {
    title: 'Exam Question',
    description: 'Read the following text and answer the questions by selecting the correct answer.',
  },
  'german-a1': {
    'reading-part2': {
      title: 'Reading Question',
      description: 'Read the following situation and choose the correct option that matches.',
    }
  },
};