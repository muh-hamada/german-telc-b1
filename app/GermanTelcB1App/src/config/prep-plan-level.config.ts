/**
 * Prep Plan Level Configuration
 * 
 * This configuration defines how the prep plan works for different exam levels.
 * Different levels have different sections, point distributions, and assessment structures.
 * 
 * Based on mock-exam.types.ts structure but tailored for prep plan diagnostic assessment.
 */

import { ExamLevel } from './exam-config.types';

/**
 * Configuration for a single section in prep plan
 */
export interface PrepPlanLevelSection {
  sectionName: 'reading' | 'listening' | 'grammar' | 'writing' | 'speaking';
  enabled: boolean;
  displayName: string;
  assessmentQuestions: number; // How many questions in diagnostic
  assessmentMaxPoints: number;
  parts?: {
    partNumber: number;
    partName: string;
    maxPoints: number;
  }[];
  // Thresholds for level determination (percentage)
  thresholds: {
    weak: number; // Below this % = weak
    moderate: number; // Below this % = moderate
    strong: number; // At or above this % = strong
  };
}

/**
 * Complete prep plan configuration for an exam level
 */
export interface PrepPlanLevelConfig {
  level: ExamLevel;
  displayName: string;
  sections: PrepPlanLevelSection[];
  totalAssessmentPoints: number;
  assessmentTimeMinutes: number;
  // Overall thresholds for exam readiness
  overallThresholds: {
    beginner: number; // Below this % = beginner
    intermediate: number; // Below this % = intermediate
    advanced: number; // At or above this % = advanced
  };
  // Minimum weeks needed for preparation
  minimumWeeks: number;
  // Task distribution priorities (percentage of time per section)
  taskDistribution: {
    // For weak sections
    weaknessPriority: number; // 0.6 = 60% of time
    // For moderate sections
    moderatePriority: number; // 0.3 = 30% of time
    // For strong sections
    strengthPriority: number; // 0.1 = 10% of time
  };
}

/**
 * A1 Level Configuration
 * A1 has no grammar section, simpler structure
 */
export const PREP_PLAN_CONFIG_A1: PrepPlanLevelConfig = {
  level: 'A1',
  displayName: 'TELC A1',
  sections: [
    {
      sectionName: 'reading',
      enabled: true,
      displayName: 'Leseverstehen',
      assessmentQuestions: 3, // 1 question from each part
      assessmentMaxPoints: 3,
      parts: [
        { partNumber: 1, partName: 'Teil 1: Globalverstehen', maxPoints: 5 },
        { partNumber: 2, partName: 'Teil 2: Detailverstehen', maxPoints: 5 },
        { partNumber: 3, partName: 'Teil 3: Selektives Verstehen', maxPoints: 5 },
      ],
      thresholds: {
        weak: 50,
        moderate: 70,
        strong: 85,
      },
    },
    {
      sectionName: 'listening',
      enabled: true,
      displayName: 'Hörverstehen',
      assessmentQuestions: 3, // 1 question from each part
      assessmentMaxPoints: 3,
      parts: [
        { partNumber: 1, partName: 'Teil 1: Globalverstehen', maxPoints: 6 },
        { partNumber: 2, partName: 'Teil 2: Detailverstehen', maxPoints: 4 },
        { partNumber: 3, partName: 'Teil 3: Selektives Verstehen', maxPoints: 5 },
      ],
      thresholds: {
        weak: 50,
        moderate: 70,
        strong: 85,
      },
    },
    {
      sectionName: 'grammar',
      enabled: false, // No grammar in A1
      displayName: 'Sprachbausteine',
      assessmentQuestions: 0,
      assessmentMaxPoints: 0,
      thresholds: {
        weak: 0,
        moderate: 0,
        strong: 0,
      },
    },
    {
      sectionName: 'writing',
      enabled: true,
      displayName: 'Schriftlicher Ausdruck',
      assessmentQuestions: 1, // 1 writing task (simplified)
      assessmentMaxPoints: 15,
      parts: [
        { partNumber: 1, partName: 'Teil 1: Formular ausfüllen', maxPoints: 5 },
        { partNumber: 2, partName: 'Teil 2: Eine kurze Mitteilung', maxPoints: 10 },
      ],
      thresholds: {
        weak: 50,
        moderate: 70,
        strong: 85,
      },
    },
    {
      sectionName: 'speaking',
      enabled: true,
      displayName: 'Mündlicher Ausdruck',
      assessmentQuestions: 1, // Part 1 only (personal introduction)
      assessmentMaxPoints: 5,
      parts: [
        { partNumber: 1, partName: 'Teil 1: Sich vorstellen', maxPoints: 5 },
        { partNumber: 2, partName: 'Teil 2: Um Informationen bitten', maxPoints: 5 },
        { partNumber: 3, partName: 'Teil 3: Bitte formulieren', maxPoints: 5 },
      ],
      thresholds: {
        weak: 50,
        moderate: 70,
        strong: 85,
      },
    },
  ],
  totalAssessmentPoints: 26, // 3 + 3 + 0 + 15 + 5
  assessmentTimeMinutes: 30,
  overallThresholds: {
    beginner: 50,
    intermediate: 70,
    advanced: 85,
  },
  minimumWeeks: 4,
  taskDistribution: {
    weaknessPriority: 0.6,
    moderatePriority: 0.3,
    strengthPriority: 0.1,
  },
};

/**
 * B1 Level Configuration
 * B1 has all sections including grammar
 */
export const PREP_PLAN_CONFIG_B1: PrepPlanLevelConfig = {
  level: 'B1',
  displayName: 'TELC B1',
  sections: [
    {
      sectionName: 'reading',
      enabled: true,
      displayName: 'Leseverstehen',
      assessmentQuestions: 5, // Mix of questions from 3 parts
      assessmentMaxPoints: 15,
      parts: [
        { partNumber: 1, partName: 'Teil 1: Globalverstehen', maxPoints: 25 },
        { partNumber: 2, partName: 'Teil 2: Detailverstehen', maxPoints: 25 },
        { partNumber: 3, partName: 'Teil 3: Selektives Verstehen', maxPoints: 25 },
      ],
      thresholds: {
        weak: 50,
        moderate: 70,
        strong: 85,
      },
    },
    {
      sectionName: 'listening',
      enabled: true,
      displayName: 'Hörverstehen',
      assessmentQuestions: 3, // Shorter listening clips
      assessmentMaxPoints: 15,
      parts: [
        { partNumber: 1, partName: 'Teil 1: Globalverstehen', maxPoints: 25 },
        { partNumber: 2, partName: 'Teil 2: Detailverstehen', maxPoints: 25 },
        { partNumber: 3, partName: 'Teil 3: Selektives Verstehen', maxPoints: 25 },
      ],
      thresholds: {
        weak: 50,
        moderate: 70,
        strong: 85,
      },
    },
    {
      sectionName: 'grammar',
      enabled: true,
      displayName: 'Sprachbausteine',
      assessmentQuestions: 5,
      assessmentMaxPoints: 10,
      parts: [
        { partNumber: 1, partName: 'Teil 1: Grammatik', maxPoints: 15 },
        { partNumber: 2, partName: 'Teil 2: Lexik', maxPoints: 15 },
      ],
      thresholds: {
        weak: 50,
        moderate: 70,
        strong: 85,
      },
    },
    {
      sectionName: 'writing',
      enabled: true,
      displayName: 'Schriftlicher Ausdruck',
      assessmentQuestions: 1, // 1 writing task
      assessmentMaxPoints: 45,
      parts: [
        { partNumber: 1, partName: 'Schreiben einer E-Mail', maxPoints: 45 },
      ],
      thresholds: {
        weak: 50,
        moderate: 70,
        strong: 85,
      },
    },
    {
      sectionName: 'speaking',
      enabled: true,
      displayName: 'Mündlicher Ausdruck',
      assessmentQuestions: 1, // Part 1 only (personal introduction)
      assessmentMaxPoints: 15,
      parts: [
        { partNumber: 1, partName: 'Teil 1: Einander kennenlernen', maxPoints: 15 },
        { partNumber: 2, partName: 'Teil 2: Über ein Thema sprechen', maxPoints: 30 },
        { partNumber: 3, partName: 'Teil 3: Gemeinsam etwas planen', maxPoints: 30 },
      ],
      thresholds: {
        weak: 50,
        moderate: 70,
        strong: 85,
      },
    },
  ],
  totalAssessmentPoints: 100, // 15 + 15 + 10 + 45 + 15
  assessmentTimeMinutes: 35,
  overallThresholds: {
    beginner: 50,
    intermediate: 70,
    advanced: 85,
  },
  minimumWeeks: 4,
  taskDistribution: {
    weaknessPriority: 0.6,
    moderatePriority: 0.3,
    strengthPriority: 0.1,
  },
};

/**
 * B2 Level Configuration
 * Similar to B1 but with different point distributions
 */
export const PREP_PLAN_CONFIG_B2: PrepPlanLevelConfig = {
  level: 'B2',
  displayName: 'TELC B2',
  sections: [
    {
      sectionName: 'reading',
      enabled: true,
      displayName: 'Leseverstehen',
      assessmentQuestions: 5,
      assessmentMaxPoints: 15,
      parts: [
        { partNumber: 1, partName: 'Teil 1: Globalverstehen', maxPoints: 25 },
        { partNumber: 2, partName: 'Teil 2: Detailverstehen', maxPoints: 25 },
        { partNumber: 3, partName: 'Teil 3: Selektives Verstehen', maxPoints: 25 },
      ],
      thresholds: {
        weak: 50,
        moderate: 70,
        strong: 85,
      },
    },
    {
      sectionName: 'listening',
      enabled: true,
      displayName: 'Hörverstehen',
      assessmentQuestions: 3,
      assessmentMaxPoints: 15,
      parts: [
        { partNumber: 1, partName: 'Teil 1: Globalverstehen', maxPoints: 25 },
        { partNumber: 2, partName: 'Teil 2: Detailverstehen', maxPoints: 25 },
        { partNumber: 3, partName: 'Teil 3: Selektives Verstehen', maxPoints: 25 },
      ],
      thresholds: {
        weak: 50,
        moderate: 70,
        strong: 85,
      },
    },
    {
      sectionName: 'grammar',
      enabled: true,
      displayName: 'Sprachbausteine',
      assessmentQuestions: 5,
      assessmentMaxPoints: 10,
      parts: [
        { partNumber: 1, partName: 'Teil 1: Grammatik', maxPoints: 15 },
        { partNumber: 2, partName: 'Teil 2: Lexik', maxPoints: 15 },
      ],
      thresholds: {
        weak: 50,
        moderate: 70,
        strong: 85,
      },
    },
    {
      sectionName: 'writing',
      enabled: true,
      displayName: 'Schriftlicher Ausdruck',
      assessmentQuestions: 1,
      assessmentMaxPoints: 45,
      parts: [
        { partNumber: 1, partName: 'Schreiben einer E-Mail oder eines Briefs', maxPoints: 45 },
      ],
      thresholds: {
        weak: 50,
        moderate: 70,
        strong: 85,
      },
    },
    {
      sectionName: 'speaking',
      enabled: true,
      displayName: 'Mündlicher Ausdruck',
      assessmentQuestions: 1, // Part 1 only
      assessmentMaxPoints: 15,
      parts: [
        { partNumber: 1, partName: 'Teil 1: Sich vorstellen', maxPoints: 15 },
        { partNumber: 2, partName: 'Teil 2: Diskussion', maxPoints: 30 },
        { partNumber: 3, partName: 'Teil 3: Problemlösung', maxPoints: 30 },
      ],
      thresholds: {
        weak: 50,
        moderate: 70,
        strong: 85,
      },
    },
  ],
  totalAssessmentPoints: 100, // 15 + 15 + 10 + 45 + 15
  assessmentTimeMinutes: 35,
  overallThresholds: {
    beginner: 50,
    intermediate: 70,
    advanced: 85,
  },
  minimumWeeks: 4,
  taskDistribution: {
    weaknessPriority: 0.6,
    moderatePriority: 0.3,
    strengthPriority: 0.1,
  },
};

/**
 * All configurations indexed by level
 */
export const PREP_PLAN_CONFIGS: Record<ExamLevel, PrepPlanLevelConfig | null> = {
  'A1': PREP_PLAN_CONFIG_A1,
  'A2': null, // Not supported yet
  'B1': PREP_PLAN_CONFIG_B1,
  'B2': PREP_PLAN_CONFIG_B2,
  'C1': null, // Not supported yet
  'C2': null, // Not supported yet
};

/**
 * Helper: Get prep plan config for a specific level
 */
export const getPrepPlanConfig = (level: ExamLevel): PrepPlanLevelConfig => {
  const config = PREP_PLAN_CONFIGS[level];
  if (!config) {
    throw new Error(`Prep plan not supported for level: ${level}`);
  }
  return config;
};

/**
 * Helper: Get only enabled sections for a level
 */
export const getEnabledSections = (level: ExamLevel): PrepPlanLevelSection[] => {
  const config = getPrepPlanConfig(level);
  return config.sections.filter((section) => section.enabled);
};

/**
 * Helper: Get total assessment points for a level
 */
export const getTotalAssessmentPoints = (level: ExamLevel): number => {
  const config = getPrepPlanConfig(level);
  return config.totalAssessmentPoints;
};

/**
 * Helper: Calculate section level (weak/moderate/strong) based on percentage
 */
export const calculateSectionLevel = (
  percentage: number,
  section: PrepPlanLevelSection
): 'weak' | 'moderate' | 'strong' => {
  if (percentage < section.thresholds.weak) {
    return 'weak';
  } else if (percentage < section.thresholds.moderate) {
    return 'moderate';
  } else {
    return 'strong';
  }
};

/**
 * Helper: Calculate overall level based on percentage
 */
export const calculateOverallLevel = (
  percentage: number,
  config: PrepPlanLevelConfig
): 'beginner' | 'intermediate' | 'advanced' => {
  if (percentage < config.overallThresholds.beginner) {
    return 'beginner';
  } else if (percentage < config.overallThresholds.intermediate) {
    return 'intermediate';
  } else {
    return 'advanced';
  }
};

/**
 * Helper: Get minimum weeks needed for a level
 */
export const getMinimumWeeks = (level: ExamLevel): number => {
  const config = getPrepPlanConfig(level);
  return config.minimumWeeks;
};

/**
 * Helper: Check if a specific section is enabled for a level
 */
export const isSectionEnabled = (
  level: ExamLevel,
  sectionName: 'reading' | 'listening' | 'grammar' | 'writing' | 'speaking'
): boolean => {
  const config = getPrepPlanConfig(level);
  const section = config.sections.find((s) => s.sectionName === sectionName);
  return section?.enabled ?? false;
};

