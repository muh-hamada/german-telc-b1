/**
 * German TELC A2 Exam Configuration
 * 
 * This is the configuration for the German A2 exam app.
 */

import { ExamConfig } from '../exam-config.types';

export const germanA2Config: ExamConfig = {
  // Basic Identity
  id: 'german-a2',
  language: 'german',
  level: 'A2',
  provider: 'telc',
  
  // App Identity
  appName: 'GermanTelcA2',
  displayName: 'German TELC A2',

  bundleId: {
    android: 'com.mhamada.telca2german',
    ios: 'com.mhamada.telca2german',
  },
  
  // Firebase Collections (keeping existing collection names for backward compatibility)
  firebaseCollections: {
    examData: 'german_a2_telc_exam_data',              // Existing collection
    userProgress: 'users/{uid}/german_a2_progress/data',   // Fixed: Must be 4 segments for .doc() to work
    completions: 'users/{uid}/completions_german_a1',      // Lang and level in path (3 segments to allow appending 3 more for doc)
    streaks: 'users/{uid}/streaks/german-a2',              // Daily streaks tracking per exam
    vocabularyData: 'vocabulary_data_german_a1',           // Vocabulary words collection
    vocabularyProgress: 'users/{uid}/vocabulary_progress_german_a2/data', // User vocabulary progress
    speakingDialogues: 'users/{uid}/speaking_dialogues_german_a2', // Speaking assessments
  },
  
  // Exam Metadata (from existing exam-info.json)
  metadata: {
    cefrLevel: 'A2',
    totalDurationMinutes: 85,
    totalMaxPoints: 60,
    passingScore: 36,
  },
  
  // All features enabled for German A2
  features: {
    reading: true,
    listening: true,
    writing: true,
    speaking: true,
    grammar: true,
  },
  
  // Store IDs
  storeIds: {
    android: 'com.mhamada.telca2german',
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
      ios: 'full_access_german_a2',
    },
  },

  writingEvaluationFnName: 'evaluateWritingGermanA2',

  // Exam Structure - A2 specific structure
  examStructure: {
    'reading': [1, 2, 3],
    'listening': [1, 2, 3],
    'writing': [1, 2],      // A2 has 2 writing parts
    'speaking': [1, 2, 3],
    // No grammar section in A2
  },
};

