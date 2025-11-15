/**
 * Exam Configuration Registry
 * 
 * Central registry for all available exam configurations.
 * Import and register new exam configs here.
 */

import { ExamConfig } from '../exam-config.types';
import { germanB1Config } from './german-b1.config';
import { germanB2Config } from './german-b2.config';
import { englishB1Config } from './english-b1.config';

/**
 * Registry of all available exam configurations
 * Key: exam ID (e.g., 'german-b1')
 * Value: ExamConfig object
 */
export const EXAM_CONFIGS: Record<string, ExamConfig> = {
  'german-b1': germanB1Config,
  'german-b2': germanB2Config,
  'english-b1': englishB1Config,
};

/**
 * Get an exam configuration by ID
 * @param examId - The exam identifier (e.g., 'german-b1')
 * @returns The exam configuration
 * @throws Error if exam ID is not found
 */
export const getExamConfig = (examId: string): ExamConfig => {
  const config = EXAM_CONFIGS[examId];
  
  if (!config) {
    const availableIds = Object.keys(EXAM_CONFIGS).join(', ');
    throw new Error(
      `Exam configuration not found for: "${examId}". Available configurations: ${availableIds}`
    );
  }
  
  return config;
};

/**
 * Get list of all available exam IDs
 * @returns Array of exam IDs
 */
export const getAvailableExamIds = (): string[] => {
  return Object.keys(EXAM_CONFIGS);
};

/**
 * Check if an exam configuration exists
 * @param examId - The exam identifier
 * @returns true if configuration exists
 */
export const hasExamConfig = (examId: string): boolean => {
  return examId in EXAM_CONFIGS;
};

