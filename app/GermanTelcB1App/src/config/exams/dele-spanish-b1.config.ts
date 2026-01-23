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
  
  // App Identity
  appName: 'DeleSpanishB1',
  displayName: 'DELE Spanish B1',

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
    vocabularyData: 'dele_vocabulary_data_spanish_b1',           // Vocabulary words collection
    vocabularyProgress: 'users/{uid}/dele_vocabulary_progress_spanish_b1/data', // User vocabulary progress
    speakingDialogues: 'users/{uid}/dele_speaking_dialogues_spanish_b1', // Speaking assessments
  },
  
  // Exam Metadata (from existing exam-info.json)
  metadata: {
    cefrLevel: 'B1',
    totalDurationMinutes: 180,
    totalMaxPoints: 300,
    passingScore: 180,
  },
  
  // All features enabled for German B2
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
    ios: '',
  },

  ads: {
    appID: {
      android: '',
      ios: '',
    },
    banner: {
      android: '',
      ios: '',
    },
    rewarded: {
      android: '',
      ios: '',
    },
    userSupport: {
      android: '',
      ios: '',
    },
    vocabularyBuilder: {
      android: '',
      ios: '',
    },
    appOpen: {
      android: '',
      ios: '',
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

