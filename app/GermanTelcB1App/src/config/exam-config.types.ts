/**
 * Exam Configuration Type Definitions
 * 
 * These types define the structure for multi-language, multi-level exam configurations.
 * Each exam (e.g., German B1, English B2) has its own configuration.
 */

// ─── Declarative Exam Section Types ──────────────────────────────────────────

/** Identifies how a part loads its exam list and individual exams */
export interface DataLoaderConfig {
  /** Method name on DataService to fetch the exam list for this part */
  listMethod: string;
  /** Method name on DataService to fetch a single exam by ID */
  fetchMethod: string;
  /** Key to extract the array from the response (e.g., 'topics', 'questions', 'exams'). If omitted, response is treated as array directly. */
  listResponseKey?: string;
}

/** Scoring group identifier for pass/fail calculation */
export type ScoringGroupId = string;

/** Configuration for a single exam part (e.g., Reading Part 1) */
export interface ExamPartConfig {
  /** Unique part identifier within the section, e.g., "reading-1" */
  id: string;
  /** Part number (1, 2, 3, ...) */
  partNumber: number;
  /** Key to look up the screen component in the ScreenRegistry */
  screenKey: string;
  /** Key to look up the UI component in the UIComponentRegistry (for mock exam wrappers) */
  uiComponentKey: string;
  /** Key to look up the wrapper component for mock exam */
  wrapperKey: string;
  /** Translation key for the card title in the section menu */
  titleKey: string;
  /** Translation key for the card description in the section menu */
  descriptionKey: string;
  /** Translation key for the navigation header */
  navTitleKey: string;
  /** Data loading configuration */
  dataLoader: DataLoaderConfig;
  /** Maximum points for this part */
  maxPoints: number;
  /** Time in minutes allocated for this part in mock exam */
  timeMinutes: number;
  /** Which scoring group this part belongs to */
  scoringGroup: ScoringGroupId;
  /** Optional score scaling factor (e.g., 0.5 for DELE writing) */
  scoreScaling?: number;
  /** Section name displayed in the mock exam stepper (e.g., "Leseverstehen") */
  mockExamSectionName: string;
  /** Part name displayed in the mock exam stepper (e.g., "Teil 1: Globalverstehen") */
  mockExamPartName: string;
  /** Section number for grouping in mock exam results */
  mockExamSectionNumber: number;
  /** If true, this part shows an exam selection modal before navigating */
  hasExamSelection: boolean;
  /** If true, this part is skipped in mock exam (e.g., speaking) */
  skipInMockExam?: boolean;
  /** Navigation param key for this part (e.g., "examId", "topicId") */
  navigationParamKey?: string;
  /** Translation key for item label in exam selection modal (e.g., "Topic", "Part") */
  modalItemType?: string;
  /** If set, renders a separator with this translation key before this part in the section menu */
  separatorBeforeKey?: string;
}

/** Extra menu item that doesn't correspond to an exam part */
export interface ExtraMenuItem {
  id: string;
  titleKey: string;
  descriptionKey: string;
  screenKey: string;
  titleParams?: Record<string, any>;
  descriptionParams?: Record<string, any>;
}

/** Configuration for a single exam section (e.g., Reading, Listening) */
export interface ExamSectionConfig {
  /** Section identifier, e.g., "reading", "listening" */
  id: string;
  /** Display order (lower = first) */
  order: number;
  /** Whether this section is shown in the menu */
  enabled: boolean;
  /** Translation key for the menu card title */
  menuTitleKey: string;
  /** Translation key for the menu card description */
  menuDescriptionKey: string;
  /** The parts within this section */
  parts: ExamPartConfig[];
  /** How the section behaves in the practice menu */
  menuBehavior: 'submenu' | 'direct' | 'modal';
  /** Additional non-part menu items (e.g., vocabulary, tips) */
  extraMenuItems?: ExtraMenuItem[];
}

/** Configuration for a scoring group in mock exam results */
export interface ScoringGroupConfig {
  /** Scoring group identifier */
  id: ScoringGroupId;
  /** Translation key for results display label */
  labelKey: string;
  /** Maximum points for this group */
  maxPoints: number;
  /** Points needed to pass (usually 60% of maxPoints) */
  passingPoints: number;
  /** Which mockExamSectionNumbers belong to this group */
  sectionNumbers: number[];
}

/** Mock exam orchestration configuration */
export interface MockExamConfig {
  /** Ordered part IDs defining the mock exam flow */
  stepOrder: string[];
  /** Scoring groups for pass/fail calculation */
  scoringGroups: ScoringGroupConfig[];
  /** Total maximum points across all groups */
  totalMaxPoints: number;
  /** Points needed to pass overall */
  passingTotalPoints: number;
  /** Section numbers to skip (e.g., [5] for speaking) */
  skipSectionNumbers: number[];
  /** Score multiplier (3 for Telc, 1 for DELE) */
  scoreMultiplier: number;
}

// ─── Core Types ──────────────────────────────────────────────────────────────

export type ExamLanguage = 'german' | 'english' | 'french' | 'spanish' | 'russian' | 'arabic';
export type ExamLevel = 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'A1';
export type LanguageCode = 'en' | 'de' | 'fr' | 'es' | 'ru' | 'ar';
export type ExamProvider = 'telc' | 'dele' | 'goethe';

export interface ExamConfig {
  // Basic Identity
  id: string; // e.g., "german-b1"
  language: ExamLanguage; // e.g., "german"
  level: ExamLevel; // e.g., "B1"
  provider: ExamProvider; // e.g., "telc", "dele", "goethe", etc.
  
  // App Identity (for build configuration)
  appName: string;           // e.g., "GermanTelcB1"
  displayName: string;        // e.g., "German TELC B1"
  bundleId: {
    android: string;          // e.g., "com.mhamada.telcb1german"
    ios: string;              // e.g., "com.mhamada.telcb1german"
  };
  
  // Theme Configuration
  theme: 'default' | 'alarm' | 'audiobook'; // Color theme for this exam
  
  // Firebase Configuration
  firebaseCollections: {
    examData: string;         // e.g., "b1_telc_exam_data" or "german_b1_exam_data"
    userProgress: string;     // e.g., "users/{uid}/progress" or "users/{uid}/german_b1_progress"
    completions: string;      // e.g., "users/{uid}/completions" or "users/{uid}/completions/german_b2"
    streaks: string;          // e.g., "users/{uid}/streaks" for daily streaks tracking
    vocabularyData: string;   // e.g., "vocabulary_data_german_a1"
    vocabularyProgress: string; // e.g., "users/{uid}/vocabulary_progress_german_a1/data"
    speakingDialogues: string; // e.g., "users/{uid}/speaking_dialogues_german_b1" for speaking assessments
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
    },
    appOpen: {
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

  // Declarative Exam Configuration
  sections: ExamSectionConfig[];
  mockExam: MockExamConfig;
}

