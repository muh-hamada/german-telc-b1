/**
 * German TELC B2 Exam Configuration
 * 
 * This is the configuration for the existing German B2 exam app.
 * It maintains backward compatibility with the current setup.
 */

import { ExamConfig } from '../exam-config.types';

export const germanB2Config: ExamConfig = {
  // Basic Identity
  id: 'german-b2',
  language: 'german',
  level: 'B2',
  
  // App Identity
  appName: 'GermanTelcB2',
  displayName: 'German TELC B2',

  bundleId: {
    android: 'com.mhamada.telcb2german',
    ios: 'com.mhamada.telcb2german',
  },
  
  // Firebase Collections (keeping existing collection names for backward compatibility)
  firebaseCollections: {
    examData: 'german_b2_telc_exam_data',              // Existing collection
    userProgress: 'users/{uid}/german_b2_progress/data',   // Fixed: Must be 4 segments for .doc() to work
    completions: 'users/{uid}/completions_german_b2',      // Lang and level in path (3 segments to allow appending 3 more for doc)
    streaks: 'users/{uid}/streaks/german-b2',              // Daily streaks tracking per exam
    vocabularyData: 'vocabulary_data_german_b2',           // Vocabulary words collection
    vocabularyProgress: 'users/{uid}/vocabulary_progress_german_b2/data', // User vocabulary progress
  },
  
  // Exam Metadata (from existing exam-info.json)
  metadata: {
    cefrLevel: 'B2',
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
    android: 'com.mhamada.telcb2german',
    ios: '6755521000',
  },

  ads: {
    appID: {
      android: 'ca-app-pub-5101905792101482~5846015787',
      ios: 'ca-app-pub-5101905792101482~5081566168',
    },
    banner: {
      android: 'ca-app-pub-5101905792101482/4713607959',
      ios: 'ca-app-pub-5101905792101482/2408845954',
    },
    rewarded: {
      android: 'ca-app-pub-5101905792101482/4612825162',
      ios: 'ca-app-pub-5101905792101482/8782682610',
    },
    userSupport: {
      android: 'ca-app-pub-5101905792101482/2149594149',
      ios: 'ca-app-pub-5101905792101482/4312830857',
    },
  },

  premium: {
    productId: {
      android: 'premium_unlock',
      ios: 'com.mhamada.telcb2german.premium',
    },
  },

  writingEvaluationFnName: 'evaluateWritingB2'
};

