/**
 * Active Exam Configuration
 * 
 * THIS FILE IS AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated at: 2026-02-11T14:03:48.071Z
 * Exam: Spanish DELE B1
 * 
 * This file determines which exam configuration is active for the current build.
 * To change the active exam, run the build script with a different exam ID.
 */

import { ExamConfig } from './exam-config.types';
import { getExamConfig } from './exams';

const ACTIVE_EXAM_ID = 'dele-spanish-b1';

/**
 * Get the active exam configuration
 * @returns The currently active ExamConfig
 */
export const getActiveExamConfig = (): ExamConfig => {
  return getExamConfig(ACTIVE_EXAM_ID);
};

/**
 * The currently active exam configuration
 * This is a cached instance of the active config for convenience
 */
export const activeExamConfig = getActiveExamConfig();

/**
 * Get the active exam ID
 * @returns The ID of the currently active exam
 */
export const getActiveExamId = (): string => {
  return ACTIVE_EXAM_ID;
};

// Log the active configuration in development mode
if (__DEV__) {
  console.log('[ExamConfig] Active exam:', activeExamConfig.displayName);
  console.log('[ExamConfig] Exam ID:', activeExamConfig.id);
  console.log('[ExamConfig] Firebase collection:', activeExamConfig.firebaseCollections.examData);
}
