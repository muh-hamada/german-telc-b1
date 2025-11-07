/**
 * Exam Configuration Type Definitions
 * 
 * These types define the structure for multi-language, multi-level exam configurations.
 * Each exam (e.g., German B1, English B2) has its own configuration.
 */

export type ExamLanguage = 'german' | 'english' | 'french' | 'spanish';
export type ExamLevel = 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface ExamConfig {
  // Basic Identity
  id: string;
  language: ExamLanguage;
  level: ExamLevel;
  
  // App Identity (for build configuration)
  appName: string;           // e.g., "GermanTelcB1"
  displayName: string;        // e.g., "German TELC B1"
  bundleId: {
    android: string;          // e.g., "com.mhamada.telcb1german"
    ios: string;              // e.g., "com.mhamada.telcb1german"
  };
  
  // Firebase Configuration
  firebaseCollections: {
    examData: string;         // e.g., "b1_telc_exam_data" or "german_b1_exam_data"
    userProgress: string;     // e.g., "users/{uid}/progress" or "users/{uid}/german_b1_progress"
  };
  
  // Exam Metadata
  metadata: {
    cefrLevel: string;
    totalDurationMinutes: number;
    totalMaxPoints: number;
    passingScore: number;
  };
  
  // Feature Flags - which exam sections are available
  features: {
    reading: boolean;
    listening: boolean;
    writing: boolean;
    speaking: boolean;
    grammar: boolean;
  };
  
  // Optional: App Store IDs for reviews and deep linking
  storeIds?: {
    android?: string;
    ios?: string;
  };
}

