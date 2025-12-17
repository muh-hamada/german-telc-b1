/**
 * German TELC A1 Exam Configuration
 * 
 * This is the configuration for the German A1 exam app.
 */

import { ExamConfig } from '../exam-config.types';

export const germanA1Config: ExamConfig = {
  // Basic Identity
  id: 'german-a1',
  language: 'german',
  level: 'A1',
  
  // App Identity
  appName: 'GermanTelcA1',
  displayName: 'German TELC A1',

  bundleId: {
    android: 'com.mhamada.telca1german',
    ios: 'com.mhamada.telca1german',
  },
  
  // Firebase Collections (keeping existing collection names for backward compatibility)
  firebaseCollections: {
    examData: 'german_a1_telc_exam_data',              // Existing collection
    userProgress: 'users/{uid}/german_a1_progress/data',   // Fixed: Must be 4 segments for .doc() to work
    completions: 'users/{uid}/completions_german_a1',      // Lang and level in path (3 segments to allow appending 3 more for doc)
    streaks: 'users/{uid}/streaks/german-a1',              // Daily streaks tracking per exam
    vocabularyData: 'vocabulary_data_german_a1',           // Vocabulary words collection
    vocabularyProgress: 'users/{uid}/vocabulary_progress_german_a1/data', // User vocabulary progress
  },
  
  // Exam Metadata (from existing exam-info.json)
  metadata: {
    cefrLevel: 'A1',
    totalDurationMinutes: 90,
    totalMaxPoints: 60,
    passingScore: 60,
  },
  
  // All features enabled for German A1
  features: {
    reading: true,
    listening: true,
    writing: true,
    speaking: true,
    grammar: true,
  },
  
  // Store IDs
  storeIds: {
    android: 'com.mhamada.telca1german',
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
  },

  premium: {
    productId: {
      android: 'full_access',
      ios: 'full_access_german_a1',
    },
  },

  writingEvaluationFnName: 'evaluateWritingA1'
};

