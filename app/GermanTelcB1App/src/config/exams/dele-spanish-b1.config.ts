/**
 * DELE Spanish B1 Exam Configuration
 * 
 * This is the configuration for the existing DELE Spanish B1 exam app.
 * It maintains backward compatibility with the current setup.
 */

import { ExamConfig } from '../exam-config.types';

export const deleSpanishB1Config: ExamConfig = {
  // Basic Identity
  id: 'dele-spanish-b1',
  language: 'spanish',
  level: 'B1',
  provider: 'dele',
  
  // App Identity
  appName: 'DeleSpanishB1',
  displayName: 'Spanish DELE B1',

  bundleId: {
    android: 'com.mhamada.deleb1spanish',
    ios: 'com.mhamada.deleb1spanish',
  },
  
  // Firebase Collections (keeping existing collection names for backward compatibility)
  firebaseCollections: {
    examData: 'spanish_b1_dele_exam_data',              // Existing collection
    userProgress: 'users/{uid}/dele_spanish_b1_progress/data',   // Fixed: Must be 4 segments for .doc() to work
    completions: 'users/{uid}/dele_completions_spanish_b1',      // Lang and level in path (3 segments to allow appending 3 more for doc)
    streaks: 'users/{uid}/streaks/dele-spanish-b1',              // Daily streaks tracking per exam
    vocabularyData: 'vocabulary_data_spanish_b1',           // Vocabulary words collection
    vocabularyProgress: 'users/{uid}/dele_vocabulary_progress_spanish_b1/data', // User vocabulary progress
    speakingDialogues: 'users/{uid}/dele_speaking_dialogues_spanish_b1', // Speaking assessments
  },
  
  // Exam Metadata (from existing exam-info.json)
  metadata: {
    cefrLevel: 'B1',
    totalDurationMinutes: 200,
    totalMaxPoints: 100,
    passingScore: 60,
  },
  
  // All features enabled for Spanish DELE B1
  features: {
    reading: true,
    listening: true,
    writing: true,
    speaking: true,
    grammar: true,
  },
  
  // Store IDs
  storeIds: {
    android: 'com.mhamada.deleb1spanish',
    ios: '6758210099',
  },

  ads: {
    appID: {
      android: 'ca-app-pub-5101905792101482~3723260491',
      ios: 'ca-app-pub-5101905792101482~5306475915',
    },
    banner: {
      android: 'ca-app-pub-5101905792101482/9245720926',
      ios: 'ca-app-pub-5101905792101482/7657307086',
    },
    rewarded: {
      android: 'ca-app-pub-5101905792101482/1138116297',
      ios: 'ca-app-pub-5101905792101482/8544342339',
    },
    userSupport: {
      android: 'ca-app-pub-5101905792101482/4437576361',
      ios: 'ca-app-pub-5101905792101482/4653198789',
    },
    vocabularyBuilder: {
      android: 'ca-app-pub-5101905792101482/8825034623',
      ios: 'ca-app-pub-5101905792101482/9946544608',
    },
    appOpen: {
      android: 'ca-app-pub-5101905792101482/2410178827',
      ios: 'ca-app-pub-5101905792101482/6344225418',
    },
  },

  premium: {
    productId: {
      android: 'full_access',
      ios: 'full_access_dele_spanish_b1',
    },
  },

  writingEvaluationFnName: 'evaluateWritingDeleSpanishB1',

  // Exam Structure - DELE Spanish B1 has same structure as B1
  examStructure: {
    'grammar': [1, 2],
    'reading': [1, 2, 3],
    'writing': [1, 2],
    'speaking': [1, 2, 3, 4],
    'listening': [1, 2, 3, 4, 5],
  },
};

