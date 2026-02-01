import AsyncStorage from '@react-native-async-storage/async-storage';
import { MockExamProgress } from '../types/mock-exam.types';
import { dataService } from './data.service';
import { AnalyticsEvents, logEvent } from './analytics.events';
import { UserAnswer } from '../types/exam.types';
import { activeExamConfig } from '../config/active-exam.config';

const MOCK_EXAM_STORAGE_KEY = '@mock_exam_progress';

const getRandomId = (exams: any[], section?: string) => {
  console.log('[generateRandomExamSelection] exams', exams, section);
  if (!exams || exams.length === 0) return 0;
  const randomIndex = Math.floor(Math.random() * exams.length);
  return exams[randomIndex].id;
};

/**
 * Generates random test selection for mock exam
 * Picks one random test from each section's available exams
 */
export const generateRandomExamSelection = async () => {
  const isA1 = activeExamConfig.level === 'A1';
  const isDele = activeExamConfig.id === 'dele-spanish-b1';

  if (isDele) {
    // DELE Spanish B1 has different structure
    const promises = [
      dataService.getDeleReadingPart1Exams(),
      dataService.getDeleReadingPart2Exams(),
      dataService.getDeleReadingPart3Exams(),
      dataService.getDeleGrammarPart1Exams(),
      dataService.getDeleGrammarPart2Exams(),
      dataService.getDeleListeningPart1Exams(),
      dataService.getDeleListeningPart2Exams(),
      dataService.getDeleListeningPart3Exams(),
      dataService.getDeleListeningPart4Exams(),
      dataService.getDeleListeningPart5Exams(),
      dataService.getDeleWritingPart1Exams(),
      dataService.getDeleWritingPart2Exams(),
    ];

    const [
      readingPart1Exams,
      readingPart2Exams,
      readingPart3Exams,
      grammarPart1Exams,
      grammarPart2Exams,
      listeningPart1Exams,
      listeningPart2Exams,
      listeningPart3Exams,
      listeningPart4Exams,
      listeningPart5Exams,
      writingPart1Exams,
      writingPart2Exams,
    ] = await Promise.all(promises);

    const getRandomId = (exams: any[]) => {
      if (!exams || exams.length === 0) return 0;
      const randomIndex = Math.floor(Math.random() * exams.length);
      return exams[randomIndex].id;
    };

    const selectedTests: any = {
      'reading-1': getRandomId(readingPart1Exams),
      'reading-2': getRandomId(readingPart2Exams),
      'reading-3': getRandomId(readingPart3Exams),
      'grammar-1': getRandomId(grammarPart1Exams),
      'grammar-2': getRandomId(grammarPart2Exams),
      'listening-1': getRandomId(listeningPart1Exams),
      'listening-2': getRandomId(listeningPart2Exams),
      'listening-3': getRandomId(listeningPart3Exams),
      'listening-4': getRandomId(listeningPart4Exams),
      'listening-5': getRandomId(listeningPart5Exams),
      'writing-1': getRandomId(writingPart1Exams),
      'writing-2': getRandomId(writingPart2Exams),
    };

    console.log('[generateRandomExamSelection] DELE selectedTests', selectedTests);
    return selectedTests;
  }

  // Telc Exams for A1 and B1/B2
  let readingPart1Exams, readingPart2Exams, readingPart3Exams;
  let grammarPart1Exams, grammarPart2Exams;
  let writingExams, writingPart1Exams, writingPart2Exams;
  let listeningPart1Data, listeningPart2Data, listeningPart3Data;

  if (isA1) {
    const promises: Promise<any>[] = [
      dataService.getReadingPart1A1Exams(),
      dataService.getReadingPart2A1Exams(),
      dataService.getReadingPart3A1Exams(),
    ];

    // Fetch writing part 1 and part 2 for A1
    promises.push(
      dataService.getWritingPart1Exams(),
      dataService.getWritingPart2Exams()
    );

    promises.push(
      dataService.getListeningPart1Content(),
      dataService.getListeningPart2Content(),
      dataService.getListeningPart3Content()
    );

    const results = await Promise.all(promises);

    [
      readingPart1Exams,
      readingPart2Exams,
      readingPart3Exams,
      writingPart1Exams,
      writingPart2Exams,
      listeningPart1Data,
      listeningPart2Data,
      listeningPart3Data
    ] = results;
  } else {
    const promises: Promise<any>[] = [
      dataService.getReadingPart1Exams(),
      dataService.getReadingPart2Exams(),
      dataService.getReadingPart3Exams(),
    ];

    // Fetch grammar for B1/B2
    promises.push(
      dataService.getGrammarPart1Exams(),
      dataService.getGrammarPart2Exams()
    );

    promises.push(
      dataService.getWritingExams(),
      dataService.getListeningPart1Content(),
      dataService.getListeningPart2Content(),
      dataService.getListeningPart3Content()
    );

    const results = await Promise.all(promises);

    [
      readingPart1Exams,
      readingPart2Exams,
      readingPart3Exams,
      grammarPart1Exams,
      grammarPart2Exams,
      writingExams,
      listeningPart1Data,
      listeningPart2Data,
      listeningPart3Data
    ] = results;
  }

  const listeningPart1Exams = listeningPart1Data?.exams || [];
  const listeningPart2Exams = listeningPart2Data?.exams || [];
  const listeningPart3Exams = listeningPart3Data?.exams || [];

  const selectedTests: any = {
    'reading-1': getRandomId(readingPart1Exams),
    'reading-2': getRandomId(readingPart2Exams),
    'reading-3': getRandomId(readingPart3Exams),
    'listening-1': getRandomId(listeningPart1Exams),
    'listening-2': getRandomId(listeningPart2Exams),
    'listening-3': getRandomId(listeningPart3Exams),
  };

  if (isA1) {
    // A1 has writing-part1 and writing-part2, use same writing exam for both
    selectedTests['writing-part1'] = getRandomId(writingPart1Exams, 'writing-part1');
    selectedTests['writing-part2'] = getRandomId(writingPart2Exams, 'writing-part2');
  } else {
    // B1/B2 have language sections and single writing
    selectedTests['language-1'] = getRandomId(grammarPart1Exams);
    selectedTests['language-2'] = getRandomId(grammarPart2Exams);
    selectedTests['writing'] = getRandomId(writingExams);
  }

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
export const createInitialMockExamProgress = async (): Promise<MockExamProgress> => {
  const selectedTests = await generateRandomExamSelection();
  const examId = `mock-exam-${Date.now()}`;

  // Import appropriate MOCK_EXAM_STEPS based on exam level
  const isA1 = activeExamConfig.level === 'A1';
  const isDele = activeExamConfig.id === 'dele-spanish-b1';
  const {
    MOCK_EXAM_STEPS,
    MOCK_EXAM_STEPS_A1,
    MOCK_EXAM_STEPS_DELE_B1,
    TOTAL_WRITTEN_MAX_POINTS,
    TOTAL_WRITTEN_MAX_POINTS_A1,
    TOTAL_WRITTEN_MAX_POINTS_DELE_B1,
    TOTAL_ORAL_MAX_POINTS_DELE_B1,
  } = require('../types/mock-exam.types');

  let examSteps, writtenMaxPoints;

  if (isDele) {
    examSteps = MOCK_EXAM_STEPS_DELE_B1;
    // DELE: Group 1 (Reading + Writing) + Group 2 (Listening only, no speaking in mock)
    writtenMaxPoints = TOTAL_WRITTEN_MAX_POINTS_DELE_B1 + (TOTAL_ORAL_MAX_POINTS_DELE_B1 / 2); // 50 + 25 = 75
  } else if (isA1) {
    examSteps = MOCK_EXAM_STEPS_A1;
    writtenMaxPoints = TOTAL_WRITTEN_MAX_POINTS_A1;
  } else {
    examSteps = MOCK_EXAM_STEPS;
    writtenMaxPoints = TOTAL_WRITTEN_MAX_POINTS;
  }

  // Filter out speaking sections as they're not included in mock exam
  // For German/English: section 5 is speaking
  // For DELE: section 5 is speaking
  const speakingSectionNumber = 5;
  const steps = examSteps
    .filter((step: any) => step.sectionNumber !== speakingSectionNumber) // Exclude speaking
    .map((step: any) => ({
      ...step,
      isCompleted: false,
      score: undefined,
      startTime: undefined,
      endTime: undefined,
    }));

  console.log('[createInitialMockExamProgress] examSteps', steps);

  return {
    examId,
    startDate: Date.now(),
    currentStepId: steps[0].id,
    steps,
    selectedTests,
    totalScore: 0,
    totalMaxPoints: writtenMaxPoints, // Written sections only (no speaking)
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

      // Track exam completed
      const isA1 = activeExamConfig.level === 'A1';
      const isDele = activeExamConfig.id === 'dele-spanish-b1';

      let writtenScore, writtenMaxPoints, passingWrittenPoints, passingTotalPoints;

      if (isDele) {
        // DELE: Group 1 (Reading + Writing) is sections 1-2
        writtenScore = progress.steps
          .filter(s => s.sectionNumber <= 2)
          .reduce((acc, s) => acc + (s.score || 0), 0);
        writtenMaxPoints = 50; // Reading (25) + Writing (25)
        passingWrittenPoints = 30; // 60% of 50
        passingTotalPoints = 60; // 60% of 100
      } else {
        // German/English: Sections 1-4 are written
        writtenScore = progress.steps
          .filter(s => s.sectionNumber <= 4)
          .reduce((acc, s) => acc + (s.score || 0), 0);
        writtenMaxPoints = progress.totalMaxPoints;
        passingWrittenPoints = isA1 ? 27 : 135; // 60% of max points
        passingTotalPoints = isA1 ? 36 : 180; // 60% of total points
      }

      const passedWritten = writtenScore >= passingWrittenPoints;
      const passedOverall = progress.totalScore >= passingTotalPoints && passedWritten;

      logEvent(AnalyticsEvents.MOCK_EXAM_COMPLETED, {
        exam_id: progress.examId,
        total_score: progress.totalScore,
        total_max_points: progress.totalMaxPoints,
        written_score: writtenScore,
        percentage: Math.round((progress.totalScore / progress.totalMaxPoints) * 100),
        passed_written: passedWritten,
        passed_overall: passedOverall,
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

