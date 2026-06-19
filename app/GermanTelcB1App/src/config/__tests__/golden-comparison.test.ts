/**
 * Golden File Comparison Tests
 *
 * Compares config-driven mock exam step generation and score calculations
 * against golden reference files. This ensures that config changes don't
 * silently break the exam structure or scoring.
 *
 * To regenerate golden files:
 *   GENERATE_GOLDEN=1 npx jest src/config/__tests__/golden-comparison.test.ts --no-coverage
 */

import * as fs from 'fs';
import * as path from 'path';
import { EXAM_CONFIGS } from '../exams';
import { generateMockExamSteps } from '../../utils/exam-config.utils';
import { calculateOverallResult } from '../../utils/score-calculator';
import { MockExamStep } from '../../types/mock-exam.types';

const GOLDEN_DIR = path.join(__dirname, 'golden');
const GENERATE = process.env.GENERATE_GOLDEN === '1';

interface GoldenStepData {
  id: string;
  sectionNumber: number;
  sectionName: string;
  partNumber?: number;
  partName: string;
  maxPoints: number;
  timeMinutes?: number;
}

interface GoldenScoreResult {
  percentage: number;
  totalScore: number;
  totalMaxPoints: number;
  passedOverall: boolean;
  groupResults: {
    groupId: string;
    score: number;
    maxPoints: number;
    passingPoints: number;
    passed: boolean;
  }[];
}

interface GoldenExamData {
  examId: string;
  steps: GoldenStepData[];
  totalMaxPoints: number;
  passingTotalPoints: number;
  scoreMultiplier: number;
  scores: GoldenScoreResult[];
}

const TEST_PERCENTAGES = [0, 30, 59, 60, 61, 80, 100];

function createMockStepsWithScores(
  examId: string,
  percentage: number,
): MockExamStep[] {
  const config = EXAM_CONFIGS[examId];
  const steps = generateMockExamSteps(config);

  return steps.map(step => ({
    ...step,
    isCompleted: true,
    score: Math.round((step.maxPoints * percentage / 100) * 10) / 10,
  }));
}

function generateGoldenData(examId: string): GoldenExamData {
  const config = EXAM_CONFIGS[examId];
  const steps = generateMockExamSteps(config);

  const scores = TEST_PERCENTAGES.map(pct => {
    const stepsWithScores = createMockStepsWithScores(examId, pct);
    const result = calculateOverallResult(config, stepsWithScores);

    return {
      percentage: pct,
      totalScore: result.totalScore,
      totalMaxPoints: result.totalMaxPoints,
      passedOverall: result.passedOverall,
      groupResults: result.groupResults.map(g => ({
        groupId: g.groupId,
        score: g.score,
        maxPoints: g.maxPoints,
        passingPoints: g.passingPoints,
        passed: g.passed,
      })),
    };
  });

  return {
    examId,
    steps: steps.map(s => ({
      id: s.id,
      sectionNumber: s.sectionNumber,
      sectionName: s.sectionName,
      partNumber: s.partNumber,
      partName: s.partName,
      maxPoints: s.maxPoints,
      timeMinutes: s.timeMinutes,
    })),
    totalMaxPoints: config.mockExam!.totalMaxPoints,
    passingTotalPoints: config.mockExam!.passingTotalPoints,
    scoreMultiplier: config.mockExam!.scoreMultiplier,
    scores,
  };
}

const examIds = Object.keys(EXAM_CONFIGS);

if (GENERATE) {
  describe('Golden file generation', () => {
    it('generates golden files for all exams', () => {
      if (!fs.existsSync(GOLDEN_DIR)) {
        fs.mkdirSync(GOLDEN_DIR, { recursive: true });
      }

      for (const examId of examIds) {
        const data = generateGoldenData(examId);
        const filePath = path.join(GOLDEN_DIR, `${examId}.golden.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
      }

      expect(true).toBe(true); // Always passes when generating
    });
  });
} else {
  describe('Golden file comparison', () => {
    for (const examId of examIds) {
      describe(examId, () => {
        const goldenPath = path.join(GOLDEN_DIR, `${examId}.golden.json`);

        it('has a golden file', () => {
          expect(fs.existsSync(goldenPath)).toBe(true);
        });

        it('mock exam steps match golden file', () => {
          if (!fs.existsSync(goldenPath)) return;
          const golden: GoldenExamData = JSON.parse(
            fs.readFileSync(goldenPath, 'utf-8'),
          );
          const config = EXAM_CONFIGS[examId];
          const steps = generateMockExamSteps(config);

          expect(steps.map(s => ({
            id: s.id,
            sectionNumber: s.sectionNumber,
            sectionName: s.sectionName,
            partNumber: s.partNumber,
            partName: s.partName,
            maxPoints: s.maxPoints,
            timeMinutes: s.timeMinutes,
          }))).toEqual(golden.steps);
        });

        it('scoring config matches golden file', () => {
          if (!fs.existsSync(goldenPath)) return;
          const golden: GoldenExamData = JSON.parse(
            fs.readFileSync(goldenPath, 'utf-8'),
          );
          const config = EXAM_CONFIGS[examId];

          expect(config.mockExam!.totalMaxPoints).toBe(golden.totalMaxPoints);
          expect(config.mockExam!.passingTotalPoints).toBe(golden.passingTotalPoints);
          expect(config.mockExam!.scoreMultiplier).toBe(golden.scoreMultiplier);
        });

        it('score calculations match golden file at boundary percentages', () => {
          if (!fs.existsSync(goldenPath)) return;
          const golden: GoldenExamData = JSON.parse(
            fs.readFileSync(goldenPath, 'utf-8'),
          );

          for (const goldenScore of golden.scores) {
            const stepsWithScores = createMockStepsWithScores(
              examId,
              goldenScore.percentage,
            );
            const config = EXAM_CONFIGS[examId];
            const result = calculateOverallResult(config, stepsWithScores);

            expect({
              percentage: goldenScore.percentage,
              totalScore: result.totalScore,
              passedOverall: result.passedOverall,
            }).toEqual({
              percentage: goldenScore.percentage,
              totalScore: goldenScore.totalScore,
              passedOverall: goldenScore.passedOverall,
            });

            for (const goldenGroup of goldenScore.groupResults) {
              const actualGroup = result.groupResults.find(
                g => g.groupId === goldenGroup.groupId,
              );
              expect(actualGroup).toBeDefined();
              expect({
                groupId: goldenGroup.groupId,
                score: actualGroup!.score,
                passed: actualGroup!.passed,
              }).toEqual({
                groupId: goldenGroup.groupId,
                score: goldenGroup.score,
                passed: goldenGroup.passed,
              });
            }
          }
        });
      });
    }
  });
}
