/**
 * Exam Configuration Type Definitions
 * 
 * These types define the structure for multi-language, multi-level exam configurations.
 * Each exam (e.g., German B1, English B2) has its own configuration.
 */

export type ExamLanguage = 'german' | 'english' | 'french' | 'spanish';
export type ExamLevel = 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'A1';

export interface ExamConfig {
  // Basic Identity
  id: string; // e.g., "german-b1"
  language: ExamLanguage; // e.g., "german"
  level: ExamLevel; // e.g., "B1"
  
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
    completions: string;      // e.g., "users/{uid}/completions" or "users/{uid}/completions/german_b2"
    streaks: string;          // e.g., "users/{uid}/streaks" for daily streaks tracking
    vocabularyData: string;   // e.g., "vocabulary_data_german_a1"
    vocabularyProgress: string; // e.g., "users/{uid}/vocabulary_progress_german_a1/data"
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
  storeIds: {
    android: string;
    ios: string;
  };

  ads: {
    appID: {
      android: string;
      ios: string;
    };
    banner: {
      android: string;
      ios: string;
    },
    rewarded: {
      android: string;
      ios: string;
    },
    userSupport: {
      android: string;
      ios: string;
    },
    vocabularyBuilder: {
      android: string;
      ios: string;
    }
  };

  // Premium/IAP Configuration
  premium: {
    productId: {
      android: string;
      ios: string;
    };
    // Note: Price comes from store dynamically via PremiumContext.productPrice
  };

  writingEvaluationFnName: string;

  // Exam Structure - defines which parts exist for each exam type
  examStructure: {
    [examType: string]: number[]; // e.g., { 'reading': [1, 2, 3], 'writing': [1, 2] }
  };
}

