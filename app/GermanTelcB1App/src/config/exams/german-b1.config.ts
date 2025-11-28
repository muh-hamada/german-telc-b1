/**
 * German TELC B1 Exam Configuration
 * 
 * This is the configuration for the existing German B1 exam app.
 * It maintains backward compatibility with the current setup.
 */

import { ExamConfig } from '../exam-config.types';

export const germanB1Config: ExamConfig = {
  // Basic Identity
  id: 'german-b1',
  language: 'german',
  level: 'B1',
  
  // App Identity
  appName: 'GermanTelcB1',
  displayName: 'German TELC B1',
  bundleId: {
    android: 'com.mhamada.telcb1german',
    ios: 'com.mhamada.telcb1german',
  },
  
  // Firebase Collections (keeping existing collection names for backward compatibility)
  firebaseCollections: {
    examData: 'b1_telc_exam_data',              // Existing collection
    userProgress: 'users/{uid}/progress/data',   // Fixed: Must be 4 segments for .doc() to work
    completions: 'users/{uid}/completions',      // Backward compatible path
    streaks: 'users/{uid}/streaks/german-b1',    // Daily streaks tracking per exam
    vocabularyData: 'vocabulary_data_german_a1', // Vocabulary words collection "a1" is a typo, leave it for backward compatibility
    vocabularyProgress: 'users/{uid}/vocabulary_progress_german_a1/data', // User vocabulary progress "a1" is a typo, leave it for backward compatibility
  },
  
  // Exam Metadata (from existing exam-info.json)
  metadata: {
    cefrLevel: 'B1',
    totalDurationMinutes: 180,
    totalMaxPoints: 300,
    passingScore: 180,
  },
  
  // All features enabled for German B1
  features: {
    reading: true,
    listening: true,
    writing: true,
    speaking: true,
    grammar: true,
  },
  
  // Store IDs
  storeIds: {
    android: 'com.mhamada.telcb1german',
    ios: '6754566955',
  },

  ads: {
    appID: {
      android: 'ca-app-pub-5101905792101482~1016049874',
      ios: 'ca-app-pub-5101905792101482~3306771911',
    },
    banner: {
      android: 'ca-app-pub-5101905792101482/4385105786',
      ios: 'ca-app-pub-5101905792101482/1993690243',
    },
    rewarded: {
      android: 'ca-app-pub-5101905792101482/1207745272',
      ios: 'ca-app-pub-5101905792101482/5268814171',
    },
  },
};

