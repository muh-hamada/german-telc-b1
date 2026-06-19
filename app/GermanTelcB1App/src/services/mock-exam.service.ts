import AsyncStorage from '@react-native-async-storage/async-storage';
import { MockExamProgress } from '../types/mock-exam.types';
import { dataService } from './data.service';
import { AnalyticsEvents, logEvent } from './analytics.events';
import { UserAnswer } from '../types/exam.types';
import { activeExamConfig } from '../config/active-exam.config';
import { findPartConfig } from '../utils/exam-config.utils';

const MOCK_EXAM_STORAGE_KEY = '@mock_exam_progress';

/**
 * Generates random test selection for mock exam.
 * Iterates config.mockExam.stepOrder, loads exams via dataLoader.listMethod,
 * and picks a random ID for each non-skipped part.
 */
export const generateRandomExamSelection = async (): Promise<Record<string, any>> => {
  const config = activeExamConfig;
  const selection: Record<string, any> = {};

  for (const partId of config.mockExam.stepOrder) {
    const part = findPartConfig(config, partId);
    if (!part || part.skipInMockExam) continue;

    const method = part.dataLoader.listMethod;
    const data = await (dataService as any)[method]();

    // Handle array responses, { exams: [...] }, and listResponseKey configs
    let exams: any[];
    if (Array.isArray(data)) {
      exams = data;
    } else if (part.dataLoader.listResponseKey && data?.[part.dataLoader.listResponseKey]) {
      const items = data[part.dataLoader.listResponseKey];
      exams = Array.isArray(items)
        ? items.map((item: any, idx: number) => (item.id !== undefined ? item : { ...item, id: idx }))
        : [];
    } else {
      exams = data?.exams || [];
    }

    if (exams.length > 0) {
      const randomIndex = Math.floor(Math.random() * exams.length);
      selection[partId] = exams[randomIndex].id;
    } else {
      selection[partId] = 0;
    }
  }

  return selection;
};

/**
 * Saves mock exam progress to AsyncStorage
 */
export const saveMockExamProgress = async (progress: MockExamProgress): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(progress);
    await AsyncStorage.setItem(MOCK_EXAM_STORAGE_KEY, jsonValue);
    console.log('Mock exam progress saved');
  } catch (error) {
    console.error('Error saving mock exam progress:', error);
    throw new Error('Failed to save mock exam progress');
  }
};

/**
 * Loads mock exam progress from AsyncStorage
 * Returns null if no progress exists
 */
export const loadMockExamProgress = async (): Promise<MockExamProgress | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(MOCK_EXAM_STORAGE_KEY);
    if (jsonValue === null) {
      return null;
    }
    const progress: MockExamProgress = JSON.parse(jsonValue);
    console.log('Mock exam progress loaded');
    return progress;
  } catch (error) {
    console.error('Error loading mock exam progress:', error);
    return null;
  }
};

/**
 * Clears mock exam progress from AsyncStorage
 */
export const clearMockExamProgress = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(MOCK_EXAM_STORAGE_KEY);
    console.log('Mock exam progress cleared');
  } catch (error) {
    console.error('Error clearing mock exam progress:', error);
    throw new Error('Failed to clear mock exam progress');
  }
};

/**
 * Checks if there is an active (incomplete) mock exam
 */
export const hasActiveMockExam = async (): Promise<boolean> => {
  try {
    const progress = await loadMockExamProgress();
    return progress !== null && !progress.isCompleted;
  } catch (error) {
    console.error('Error checking for active mock exam:', error);
    return false;
  }
};

/**
 * Creates initial mock exam progress object
 */
export const createInitialMockExamProgress = async (): Promise<MockExamProgress> => {
  const selectedTests = await generateRandomExamSelection();
  const examId = `mock-exam-${Date.now()}`;

  const config = activeExamConfig;
  const { generateMockExamSteps } = require('../utils/exam-config.utils');

  const examSteps = generateMockExamSteps(config);
  const steps = examSteps.map((step: any) => ({
    ...step,
    isCompleted: false,
    score: undefined,
    startTime: undefined,
    endTime: undefined,
  }));

  return {
    examId,
    startDate: Date.now(),
    currentStepId: steps[0].id,
    steps,
    selectedTests,
    totalScore: 0,
    totalMaxPoints: config.mockExam.totalMaxPoints,
    isCompleted: false,
    hasStarted: false,
  };
};

/**
 * Updates a step in the mock exam progress
 */
export const updateStepProgress = async (
  stepId: string,
  score: number,
  isCompleted: boolean = true,
  answers: UserAnswer[]
): Promise<void> => {
  try {
    const progress = await loadMockExamProgress();
    if (!progress) {
      throw new Error('No mock exam progress found');
    }

    // Find and update the step
    const stepIndex = progress.steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) {
      throw new Error(`Step ${stepId} not found`);
    }

    progress.steps[stepIndex].score = score;
    progress.steps[stepIndex].isCompleted = isCompleted;
    progress.steps[stepIndex].endTime = Date.now();
    progress.steps[stepIndex].answers = answers;

    // Track step completed
    const completedDurationMs = (progress.steps[stepIndex].endTime || 0) - (progress.steps[stepIndex].startTime || progress.startDate);
    logEvent(AnalyticsEvents.MOCK_EXAM_STEP_COMPLETED, {
      exam_id: progress.examId,
      step_id: progress.steps[stepIndex].id,
      step_index: stepIndex,
      score,
      max_points: progress.steps[stepIndex].maxPoints,
      duration_ms: completedDurationMs,
    });

    // Update total score
    progress.totalScore = progress.steps
      .filter(s => s.isCompleted && s.score !== undefined)
      .reduce((sum, s) => sum + (s.score || 0), 0);

    // Move to next step if not last
    if (stepIndex < progress.steps.length - 1) {
      progress.currentStepId = progress.steps[stepIndex + 1].id;
      progress.steps[stepIndex + 1].startTime = Date.now();

      // Track next step started
      logEvent(AnalyticsEvents.MOCK_EXAM_STEP_STARTED, {
        exam_id: progress.examId,
        step_id: progress.steps[stepIndex + 1].id,
        step_index: stepIndex + 1,
      });
    } else {
      // Mark exam as completed
      progress.isCompleted = true;
      progress.endDate = Date.now();

      // Track exam completed using config-driven scoring
      const { calculateOverallResult } = require('../utils/score-calculator');
      const result = calculateOverallResult(activeExamConfig, progress.steps);

      logEvent(AnalyticsEvents.MOCK_EXAM_COMPLETED, {
        exam_id: progress.examId,
        total_score: progress.totalScore,
        total_max_points: progress.totalMaxPoints,
        written_score: result.groupResults[0]?.score ?? 0,
        percentage: Math.round(result.totalPercentage),
        passed_written: result.groupResults[0]?.passed ?? false,
        passed_overall: result.passedOverall,
        duration_ms: (progress.endDate || 0) - progress.startDate,
      });
    }

    progress.hasStarted = true;

    await saveMockExamProgress(progress);

    // If this is the first time starting, log started and first step started
    if (stepIndex === 0 && progress.steps[0].startTime === undefined) {
      logEvent(AnalyticsEvents.MOCK_EXAM_STARTED, {
        exam_id: progress.examId,
        step_id: progress.steps[0].id,
        total_steps: progress.steps.length,
      });
      progress.steps[0].startTime = Date.now();
      logEvent(AnalyticsEvents.MOCK_EXAM_STEP_STARTED, {
        exam_id: progress.examId,
        step_id: progress.steps[0].id,
        step_index: 0,
      });
      await saveMockExamProgress(progress);
    }
  } catch (error) {
    console.error('Error updating step progress:', error);
    throw error;
  }
};

/**
 * Gets the current step from progress
 */
export const getCurrentStep = (progress: MockExamProgress) => {
  return progress.steps.find(s => s.id === progress.currentStepId);
};

/**
 * Gets the test ID for a given step
 */
export const getTestIdForStep = (
  stepId: string,
  selectedTests: MockExamProgress['selectedTests']
): number | string => {
  return selectedTests[stepId] || 0;
};

/**
 * Navigates to a specific step (for development mode only)
 */
export const navigateToStep = async (stepId: string): Promise<void> => {
  try {
    const progress = await loadMockExamProgress();
    if (!progress) {
      throw new Error('No mock exam progress found');
    }

    // Find the step
    const stepIndex = progress.steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) {
      throw new Error(`Step ${stepId} not found`);
    }

    // Update current step
    progress.currentStepId = stepId;

    // Set start time if not already set
    if (!progress.steps[stepIndex].startTime) {
      progress.steps[stepIndex].startTime = Date.now();
    }

    await saveMockExamProgress(progress);
    console.log(`[DEV] Navigated to step: ${stepId}`);
  } catch (error) {
    console.error('Error navigating to step:', error);
    throw error;
  }
};

export const mockExamService = {
  generateRandomExamSelection,
  saveMockExamProgress,
  loadMockExamProgress,
  clearMockExamProgress,
  hasActiveMockExam,
  createInitialMockExamProgress,
  updateStepProgress,
  getCurrentStep,
  getTestIdForStep,
  navigateToStep,
};

