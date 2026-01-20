/**
 * English TELC B2 Exam Configuration
 * 
 * This is the configuration for the existing English B2 exam app.
 * It maintains backward compatibility with the current setup.
 */

import { ExamConfig } from '../exam-config.types';

export const englishB2Config: ExamConfig = {
  // Basic Identity
  id: 'english-b2',
  language: 'english',
  level: 'B2',
  
  // App Identity
  appName: 'EnglishTelcB2',
  displayName: 'English TELC B2',

  bundleId: {
    android: 'com.mhamada.telcb2english',
    ios: 'com.mhamada.telcb2english',
  },
  
  // Firebase Collections (keeping existing collection names for backward compatibility)
  firebaseCollections: {
    examData: 'english_b2_telc_exam_data',              // Existing collection
    userProgress: 'users/{uid}/english_b2_progress/data',   // Fixed: Must be 4 segments for .doc() to work
    completions: 'users/{uid}/completions_english_b2',      // Lang and level in path (3 segments to allow appending 3 more for doc)
    streaks: 'users/{uid}/streaks/english-b2',              // Daily streaks tracking per exam
    vocabularyData: 'vocabulary_data_english_b2',           // Vocabulary words collection
    vocabularyProgress: 'users/{uid}/vocabulary_progress_english_b2/data', // User vocabulary progress
    speakingDialogues: 'users/{uid}/speaking_dialogues_english_b2', // Speaking assessments
  },
  
  // Exam Metadata (from existing exam-info.json)
  metadata: {
    cefrLevel: 'B2',
    totalDurationMinutes: 180,
    totalMaxPoints: 300,
    passingScore: 180,
  },
  
  // All features enabled for English B2
  features: {
    reading: true,
    listening: true,
    writing: true,
    speaking: true,
    grammar: true,
  },
  
  // Store IDs
  storeIds: {
    android: 'com.mhamada.telcb2english',
    ios: '6756295159',
  },

  ads: {
    appID: {
      android: 'ca-app-pub-5101905792101482~4246632658',
      ios: 'ca-app-pub-5101905792101482~3435279711',
    },
    banner: {
      android: 'ca-app-pub-5101905792101482/9307387645',
      ios: 'ca-app-pub-5101905792101482/5223181715',
    },
    rewarded: {
      android: 'ca-app-pub-5101905792101482/4699711181',
      ios: 'ca-app-pub-5101905792101482/6872795990',
    },
    userSupport: {
      android: 'ca-app-pub-5101905792101482/1283936700',
      ios: 'ca-app-pub-5101905792101482/2597018375',
    },
    vocabularyBuilder: {
      android: 'ca-app-pub-5101905792101482/1293799088',
      ios: 'ca-app-pub-5101905792101482/8252947346',
    },
    appOpen: {
      android: 'ca-app-pub-5101905792101482/7436130058',
      ios: 'ca-app-pub-5101905792101482/2951742524',
    },
  },

  premium: {
    productId: {
      android: 'full_access',
      ios: 'full_access_english_b2',
    },
  },

  writingEvaluationFnName: 'evaluateWritingEnglishB2',

  // Exam Structure - B2 has same structure as B1
  examStructure: {
    'grammar': [1, 2],
    'reading': [1, 2, 3],
    'writing': [1],         // B2 has only 1 writing part
    'speaking': [1, 2, 3],
    'listening': [1, 2, 3],
  },
};

