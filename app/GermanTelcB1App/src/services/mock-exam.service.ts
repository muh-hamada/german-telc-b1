import AsyncStorage from '@react-native-async-storage/async-storage';
import { MockExamProgress } from '../types/mock-exam.types';
import { dataService } from './data.service';

const MOCK_EXAM_STORAGE_KEY = '@mock_exam_progress';

/**
 * Generates random test selection for mock exam
 * Picks one random test from each section's available exams
 */
export const generateRandomExamSelection = () => {
  // Get counts of available exams for each section
  const readingPart1Count = dataService.getReadingPart1Exams().length;
  const readingPart2Count = dataService.getReadingPart2Exams().length;
  const readingPart3Count = dataService.getReadingPart3Exams().length;
  const grammarPart1Count = dataService.getGrammarPart1Exams().length;
  const grammarPart2Count = dataService.getGrammarPart2Exams().length;
  
  // For listening and writing, we only have 1 exam per section currently
  // but we'll structure it the same way for consistency
  
  const selectedTests = {
    'reading-1': Math.floor(Math.random() * readingPart1Count),
    'reading-2': Math.floor(Math.random() * readingPart2Count),
    'reading-3': Math.floor(Math.random() * readingPart3Count),
    'language-1': Math.floor(Math.random() * grammarPart1Count),
    'language-2': Math.floor(Math.random() * grammarPart2Count),
    'listening-1': 0, // Only one exam available
    'listening-2': 0, // Only one exam available
    'listening-3': 0, // Only one exam available
    'writing': Math.floor(Math.random() * 5), // Assuming 5 writing exams
  };

  return selectedTests;
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
export const createInitialMockExamProgress = (): MockExamProgress => {
  const selectedTests = generateRandomExamSelection();
  const examId = `mock-exam-${Date.now()}`;

  // Import MOCK_EXAM_STEPS to initialize steps
  const { MOCK_EXAM_STEPS } = require('../types/mock-exam.types');
  
  // Filter out speaking sections as they're not included in mock exam
  const steps = MOCK_EXAM_STEPS
    .filter((step: any) => step.sectionNumber !== 5) // Exclude speaking
    .map((step: any) => ({
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
    totalMaxPoints: 225, // Written sections only (no speaking)
    isCompleted: false,
  };
};

/**
 * Updates a step in the mock exam progress
 */
export const updateStepProgress = async (
  stepId: string,
  score: number,
  isCompleted: boolean = true
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

    // Update total score
    progress.totalScore = progress.steps
      .filter(s => s.isCompleted && s.score !== undefined)
      .reduce((sum, s) => sum + (s.score || 0), 0);

    // Move to next step if not last
    if (stepIndex < progress.steps.length - 1) {
      progress.currentStepId = progress.steps[stepIndex + 1].id;
      progress.steps[stepIndex + 1].startTime = Date.now();
    } else {
      // Mark exam as completed
      progress.isCompleted = true;
      progress.endDate = Date.now();
    }

    await saveMockExamProgress(progress);
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
): number => {
  return selectedTests[stepId as keyof typeof selectedTests] || 0;
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
};

