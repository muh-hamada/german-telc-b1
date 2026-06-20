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
  skipped: boolean;
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
  const skipSectionNumbers = config.mockExam.skipSectionNumbers;

  return config.mockExam.scoringGroups.map((group: ScoringGroupConfig) => {
    // A group is skipped if ALL its section numbers are in skipSectionNumbers
    const isSkipped = group.sectionNumbers.every(
      sn => skipSectionNumbers.includes(sn),
    );

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
      passed: isSkipped ? true : score >= group.passingPoints,
      skipped: isSkipped,
    };
  });
};

/**
 * 1. totalScore = sum of all non-skipped step scores
 * 2. groupResults = calculateGroupResults(config, steps)
 * 3. Exclude skipped groups from totalMaxPoints and passingTotalPoints
 * 4. allGroupsPassed = every non-skipped group.passed is true
 * 5. passedOverall = totalScore >= adjustedPassingPoints AND allGroupsPassed
 */
export const calculateOverallResult = (
  config: ExamConfig,
  steps: MockExamStep[],
): OverallResult => {
  const groupResults = calculateGroupResults(config, steps);

  // Exclude skipped groups from totals
  const skippedMaxPoints = groupResults
    .filter(g => g.skipped)
    .reduce((sum, g) => sum + g.maxPoints, 0);

  const totalMaxPoints = config.mockExam.totalMaxPoints - skippedMaxPoints;
  const totalScore = steps.reduce((sum, step) => sum + (step.score ?? 0), 0);
  const totalPercentage = totalMaxPoints > 0 ? (totalScore / totalMaxPoints) * 100 : 0;

  // Only check non-skipped groups for pass/fail
  const allGroupsPassed = groupResults
    .filter(g => !g.skipped)
    .every(g => g.passed);

  // Adjust passing points proportionally (subtract skipped groups' passing points)
  const skippedPassingPoints = groupResults
    .filter(g => g.skipped)
    .reduce((sum, g) => sum + g.passingPoints, 0);
  const adjustedPassingPoints = config.mockExam.passingTotalPoints - skippedPassingPoints;

  const passedOverall =
    totalScore >= adjustedPassingPoints && allGroupsPassed;

  return {
    totalScore,
    totalMaxPoints,
    totalPercentage,
    passedOverall,
    groupResults,
  };
};
