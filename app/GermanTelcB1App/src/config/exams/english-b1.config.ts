/**
 * German TELC B2 Exam Configuration
 * 
 * This is the configuration for the existing German B2 exam app.
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
    android: 'com.mhamada.telcb1english',
    ios: 'com.mhamada.telcb1english',
  },
  
  // Firebase Collections (keeping existing collection names for backward compatibility)
  firebaseCollections: {
    examData: 'english_b1_telc_exam_data',              // Existing collection
    userProgress: 'users/{uid}/english_b1_progress/data',   // Fixed: Must be 4 segments for .doc() to work
    completions: 'users/{uid}/completions/english_b1',      // Lang and level in path (already 4 segments, correct)
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
    android: 'com.mhamada.telcb1english',
    ios: '',  // Will be filled when iOS app is published
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
  },
};

