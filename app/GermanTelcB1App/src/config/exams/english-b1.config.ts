/**
 * German TELC B1 Exam Configuration
 * 
 * This is the configuration for the existing German B1 exam app.
 * It maintains backward compatibility with the current setup.
 */

import { ExamConfig } from '../exam-config.types';

export const englishB1Config: ExamConfig = {
  // Basic Identity
  id: 'english-b1',
  language: 'english',
  level: 'B1',
  
  // App Identity
  appName: 'EnglishTelcB1',
  displayName: 'English TELC B1',

  bundleId: {
    android: 'com.mhamada.telcb1english.v2',
    ios: 'com.mhamada.telcb1english',
  },
  
  // Firebase Collections (keeping existing collection names for backward compatibility)
  firebaseCollections: {
    examData: 'english_b1_telc_exam_data',              // Existing collection
    userProgress: 'users/{uid}/english_b1_progress/data',   // Fixed: Must be 4 segments for .doc() to work
    completions: 'users/{uid}/completions_english_b1',      // Fixed: Must be 3 segments (Collection) so service can append 3 more to make a Doc (6 segments
    streaks: 'users/{uid}/streaks/english-b1',              // Daily streaks tracking per exam
    vocabularyData: 'vocabulary_data_english_b1',           // Vocabulary words collection
    vocabularyProgress: 'users/{uid}/vocabulary_progress_english_b1/data', // User vocabulary progress
    speakingDialogues: 'users/{uid}/speaking_dialogues_english_b1', // Speaking assessments
  },
  
  // Exam Metadata (from existing exam-info.json)
  metadata: {
    cefrLevel: 'B1',
    totalDurationMinutes: 180,
    totalMaxPoints: 300,
    passingScore: 180,
  },
  
  // All features enabled for English B1
  features: {
    reading: true,
    listening: true,
    writing: true,
    speaking: true,
    grammar: true,
  },
  
  // Store IDs
  storeIds: {
    android: 'com.mhamada.telcb1english.v2',
    ios: '6755912773',
  },

  ads: {
    appID: {
      android: 'ca-app-pub-5101905792101482~2261614095',
      ios: 'ca-app-pub-5101905792101482~2868118756',
    },
    banner: {
      android: 'ca-app-pub-5101905792101482/4436351291',
      ios: 'ca-app-pub-5101905792101482/7489890041',
    },
    rewarded: {
      android: 'ca-app-pub-5101905792101482/7322369087',
      ios: 'ca-app-pub-5101905792101482/5903693242',
    },
    userSupport: {
      android: 'ca-app-pub-5101905792101482/2664599468',
      ios: 'ca-app-pub-5101905792101482/7398051391',
    },
    vocabularyBuilder: {
      android: 'ca-app-pub-5101905792101482/3919962422',
      ios: 'ca-app-pub-5101905792101482/4633266531',
    },
  },

  premium: {
    productId: {
      android: 'full_access',
      ios: 'full_access_english_b1',
    },
  },

  writingEvaluationFnName: 'evaluateWritingEnglishB1',

  // Exam Structure - B1 structure
  examStructure: {
    'grammar': [1, 2],
    'reading': [1, 2, 3],
    'writing': [1],         // B1 has only 1 writing part
    'speaking': [1, 2, 3],
    'listening': [1, 2, 3],
  },
};

