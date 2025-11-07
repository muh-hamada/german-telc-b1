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
    userProgress: 'users/{uid}/progress',        // Existing structure
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
    ios: '',  // Will be filled when iOS app is published
  },
};

