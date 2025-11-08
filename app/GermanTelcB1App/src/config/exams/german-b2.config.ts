/**
 * German TELC B1 Exam Configuration
 * 
 * This is the configuration for the existing German B1 exam app.
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
    userProgress: 'users/{uid}/german_b2_progress',        // Existing structure
  },
  
  // Exam Metadata (from existing exam-info.json)
  metadata: {
    cefrLevel: 'B2',
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
    android: 'com.mhamada.telcb2german',
    ios: '',  // Will be filled when iOS app is published
  },
};

