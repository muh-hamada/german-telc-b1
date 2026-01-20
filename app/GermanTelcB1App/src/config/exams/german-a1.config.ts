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
    speakingDialogues: 'users/{uid}/speaking_dialogues_german_a1', // Speaking assessments
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
    ios: '6756783649',
  },

  ads: {
    appID: {
      android: 'ca-app-pub-5101905792101482~7598249331',
      ios: 'ca-app-pub-5101905792101482~9095982078',
    },
    banner: {
      android: 'ca-app-pub-5101905792101482/7970602669',
      ios: 'ca-app-pub-5101905792101482/5933813876',
    },
    rewarded: {
      android: 'ca-app-pub-5101905792101482/8559977211',
      ios: 'ca-app-pub-5101905792101482/3603164006',
    },
    userSupport: {
      android: 'ca-app-pub-5101905792101482/5344439323',
      ios: 'ca-app-pub-5101905792101482/1994568863',
    },
    vocabularyBuilder: {
      android: 'ca-app-pub-5101905792101482/1179524107',
      ios: 'ca-app-pub-5101905792101482/7782900400',
    },
    appOpen: {
      android: 'ca-app-pub-5101905792101482/4264824199',
      ios: 'ca-app-pub-5101905792101482/8827079253',
    },
  },

  premium: {
    productId: {
      android: 'full_access',
      ios: 'full_access_german_a1',
    },
  },

  writingEvaluationFnName: 'evaluateWritingGermanA1',

  // Exam Structure - A1 specific structure
  examStructure: {
    'reading': [1, 2, 3],
    'listening': [1, 2, 3],
    'writing': [1, 2],      // A1 has 2 writing parts
    'speaking': [1, 2, 3],
    // No grammar section in A1
  },
};

