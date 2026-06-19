import {
  ExamConfig,
  ExamPartConfig,
  ScoringGroupConfig,
} from '../config/exam-config.types';
import { MockExamStep } from '../types/mock-exam.types';

export interface GroupResult {
  groupId: string;
  labelKey: string;
  score: number;
  maxPoints: number;
  passingPoints: number;
  percentage: number;
  passed: boolean;
}

export interface OverallResult {
  totalScore: number;
  totalMaxPoints: number;
  totalPercentage: number;
  passedOverall: boolean;
  groupResults: GroupResult[];
}

/**
 * Calculates the score for a single mock exam step.
 *
 * Rules:
 * 1. If partConfig.scoreScaling is defined: score = correctCount * scoreScaling
 * 2. Else if partConfig.maxPoints > 0 and totalQuestions > 0:
 *    pointsPerQuestion = partConfig.maxPoints / totalQuestions
 *    score = Math.round(correctCount * pointsPerQuestion * 10) / 10
 * 3. Else: score = correctCount
 */
export const calculateStepScore = (
  partConfig: ExamPartConfig,
  correctCount: number,
  totalQuestions: number,
): number => {
  if (partConfig.scoreScaling !== undefined) {
    return correctCount * partConfig.scoreScaling;
  }
  if (partConfig.maxPoints > 0 && totalQuestions > 0) {
    const pointsPerQuestion = partConfig.maxPoints / totalQuestions;
    return Math.round(correctCount * pointsPerQuestion * 10) / 10;
  }
  return correctCount;
};

/**
 * For each scoring group in config.mockExam.scoringGroups:
 * 1. Filter steps where step.sectionNumber is in group.sectionNumbers
 * 2. Sum their scores
 * 3. Calculate percentage = (score / group.maxPoints) * 100
 * 4. passed = score >= group.passingPoints
 */
export const calculateGroupResults = (
  config: ExamConfig,
  steps: MockExamStep[],
): GroupResult[] => {
  if (!config.mockExam) return [];

  return config.mockExam.scoringGroups.map((group: ScoringGroupConfig) => {
    const groupSteps = steps.filter(
      step => group.sectionNumbers.includes(step.sectionNumber),
    );
    const score = groupSteps.reduce((sum, step) => sum + (step.score ?? 0), 0);
    const percentage = group.maxPoints > 0 ? (score / group.maxPoints) * 100 : 0;

    return {
      groupId: group.id,
      labelKey: group.labelKey,
      score,
      maxPoints: group.maxPoints,
      passingPoints: group.passingPoints,
      percentage,
      passed: score >= group.passingPoints,
    };
  });
};

/**
 * 1. totalScore = sum of all step scores
 * 2. groupResults = calculateGroupResults(config, steps)
 * 3. allGroupsPassed = every group.passed is true
 * 4. passedOverall = totalScore >= config.mockExam.passingTotalPoints AND allGroupsPassed
 */
export const calculateOverallResult = (
  config: ExamConfig,
  steps: MockExamStep[],
): OverallResult => {
  const totalScore = steps.reduce((sum, step) => sum + (step.score ?? 0), 0);
  const groupResults = calculateGroupResults(config, steps);
  const totalMaxPoints = config.mockExam?.totalMaxPoints ?? 0;
  const totalPercentage = totalMaxPoints > 0 ? (totalScore / totalMaxPoints) * 100 : 0;
  const allGroupsPassed = groupResults.every(g => g.passed);
  const passedOverall =
    totalScore >= (config.mockExam?.passingTotalPoints ?? 0) && allGroupsPassed;

  return {
    totalScore,
    totalMaxPoints,
    totalPercentage,
    passedOverall,
    groupResults,
  };
};
