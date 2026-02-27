/**
 * Goethe German A1 Exam Configuration
 * 
 * This is the configuration for the Goethe German A1 exam app.
 */

import { ExamConfig } from '../exam-config.types';

export const goetheGermanA1Config: ExamConfig = {
  // Basic Identity
  id: 'goethe-german-a1',
  language: 'german',
  level: 'A1',
  provider: 'goethe',
  
  // App Identity
  appName: 'GoetheGermanA1',
  displayName: 'Goethe German A1',

  bundleId: {
    android: 'com.mhamada.goethea1german',
    ios: 'com.mhamada.goethea1german',
  },
  
  // Theme Configuration
  theme: 'audiobook',
  
  // Firebase Collections (keeping existing collection names for backward compatibility)
  firebaseCollections: {
    examData: 'german_a1_telc_exam_data',              // Existing collection
    userProgress: 'users/{uid}/goethe_german_a1_progress/data',   // Fixed: Must be 4 segments for .doc() to work
    completions: 'users/{uid}/completions_goethe_german_a1',      // Lang and level in path (3 segments to allow appending 3 more for doc)
    streaks: 'users/{uid}/streaks/goethe-german-a1',              // Daily streaks tracking per exam
    vocabularyData: 'vocabulary_data_german_a1',           // Vocabulary words collection
    vocabularyProgress: 'users/{uid}/vocabulary_progress_goethe_german_a1/data', // User vocabulary progress
    speakingDialogues: 'users/{uid}/speaking_dialogues_goethe_german_a1', // Speaking assessments
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
    android: 'com.mhamada.goethea1german',
    ios: '6759726606',
  },

  ads: {
    appID: {
      android: 'ca-app-pub-5101905792101482~2106426459',
      ios: 'ca-app-pub-5101905792101482~9600047321',
    },
    banner: {
      android: 'ca-app-pub-5101905792101482/6560676787',
      ios: 'ca-app-pub-5101905792101482/2891168749',
    },
    rewarded: {
      android: 'ca-app-pub-5101905792101482/7023857007',
      ios: 'ca-app-pub-5101905792101482/3698176892',
    },
    userSupport: {
      android: 'ca-app-pub-5101905792101482/8336938678',
      ios: 'ca-app-pub-5101905792101482/6651643293',
    },
    vocabularyBuilder: {
      android: 'ca-app-pub-5101905792101482/2621431773',
      ios: 'ca-app-pub-5101905792101482/9233720398',
    },
    appOpen: {
      android: 'ca-app-pub-5101905792101482/1963102012',
      ios: 'ca-app-pub-5101905792101482/2072911095',
    },
  },

  premium: {
    productId: {
      android: 'full_access',
      ios: 'full_access_goethe_german_a1',
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

