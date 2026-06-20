/**
 * Integration tests: Mock Exam Config Validation
 *
 * Tests that all exam configs produce valid mock exam steps,
 * have consistent scoring groups, and the scoring logic works
 * correctly with real config values.
 */
import { germanB1Config } from '../exams/german-b1.config';
import { germanB2Config } from '../exams/german-b2.config';
import { germanA1Config } from '../exams/german-a1.config';
import { germanA2Config } from '../exams/german-a2.config';
import { deleSpanishB1Config } from '../exams/dele-spanish-b1.config';
import { englishB1Config } from '../exams/english-b1.config';
import { englishB2Config } from '../exams/english-b2.config';
import { ExamConfig } from '../exam-config.types';
import { generateMockExamSteps, findPartConfig } from '../../utils/exam-config.utils';
import { calculateStepScore, calculateGroupResults, calculateOverallResult } from '../../utils/score-calculator';
import { MockExamStep } from '../../types/mock-exam.types';

const ALL_CONFIGS: { name: string; config: ExamConfig }[] = [
  { name: 'German B1', config: germanB1Config },
  { name: 'German B2', config: germanB2Config },
  { name: 'German A1', config: germanA1Config },
  { name: 'German A2', config: germanA2Config },
  { name: 'DELE Spanish B1', config: deleSpanishB1Config },
  { name: 'English B1', config: englishB1Config },
  { name: 'English B2', config: englishB2Config },
];

describe('Mock Exam Config Integration', () => {
  describe.each(ALL_CONFIGS)('$name', ({ config }) => {
    it('has mockExam.stepOrder with at least 3 steps', () => {
      expect(config.mockExam.stepOrder.length).toBeGreaterThanOrEqual(3);
    });

    it('every stepOrder entry maps to a part in sections', () => {
      for (const partId of config.mockExam.stepOrder) {
        const part = findPartConfig(config, partId);
        expect(part).toBeDefined();
      }
    });

    it('generateMockExamSteps produces non-empty steps (skipped sections excluded)', () => {
      const steps = generateMockExamSteps(config);
      expect(steps.length).toBeGreaterThan(0);

      // No step should have a sectionNumber in skipSectionNumbers
      for (const step of steps) {
        expect(config.mockExam.skipSectionNumbers).not.toContain(step.sectionNumber);
      }
    });

    it('generateMockExamSteps steps have valid properties', () => {
      const steps = generateMockExamSteps(config);

      for (const step of steps) {
        expect(step.id).toBeTruthy();
        expect(step.sectionNumber).toBeGreaterThan(0);
        expect(step.sectionName).toBeTruthy();
        expect(step.partName).toBeTruthy();
        expect(step.maxPoints).toBeGreaterThan(0);
        expect(step.timeMinutes).toBeGreaterThan(0);
      }
    });

    it('scoringGroups cover all non-skipped section numbers', () => {
      const steps = generateMockExamSteps(config);
      const stepSectionNumbers = new Set(steps.map(s => s.sectionNumber));
      const coveredByGroups = new Set(
        config.mockExam.scoringGroups.flatMap(g => g.sectionNumbers),
      );

      for (const sn of stepSectionNumbers) {
        expect(coveredByGroups).toContain(sn);
      }
    });

    it('totalMaxPoints equals sum of scoringGroup maxPoints', () => {
      const totalFromGroups = config.mockExam.scoringGroups.reduce(
        (sum, g) => sum + g.maxPoints,
        0,
      );
      expect(config.mockExam.totalMaxPoints).toBe(totalFromGroups);
    });

    it('passingTotalPoints is achievable (less than or equal to totalMaxPoints)', () => {
      expect(config.mockExam.passingTotalPoints).toBeLessThanOrEqual(
        config.mockExam.totalMaxPoints,
      );
    });

    it('each scoringGroup passingPoints <= maxPoints', () => {
      for (const group of config.mockExam.scoringGroups) {
        expect(group.passingPoints).toBeLessThanOrEqual(group.maxPoints);
      }
    });

    it('perfect score on all active steps gives correct total', () => {
      const steps = generateMockExamSteps(config);
      const perfectSteps: MockExamStep[] = steps.map(step => ({
        ...step,
        isCompleted: true,
        score: step.maxPoints,
        startTime: 1000,
        endTime: 2000,
        answers: [],
      }));

      const result = calculateOverallResult(config, perfectSteps);
      // Total score should equal sum of all active step maxPoints
      const expectedTotal = steps.reduce((sum, s) => sum + s.maxPoints, 0);
      expect(result.totalScore).toBe(expectedTotal);
      // Percentage should be relative to config.mockExam.totalMaxPoints
      expect(result.totalPercentage).toBeGreaterThan(0);
    });

    it('perfect score passes all groups whose sections are fully covered by active steps', () => {
      const steps = generateMockExamSteps(config);
      const stepSectionNumbers = new Set(steps.map(s => s.sectionNumber));
      const perfectSteps: MockExamStep[] = steps.map(step => ({
        ...step,
        isCompleted: true,
        score: step.maxPoints,
        startTime: 1000,
        endTime: 2000,
        answers: [],
      }));

      const result = calculateOverallResult(config, perfectSteps);
      // Groups whose ALL sectionNumbers have active steps should pass
      for (const groupResult of result.groupResults) {
        const group = config.mockExam.scoringGroups.find(g => g.id === groupResult.groupId)!;
        const allSectionsActive = group.sectionNumbers.every(sn => stepSectionNumbers.has(sn));
        if (allSectionsActive) {
          expect(groupResult.passed).toBe(true);
        }
      }
    });

    it('zero score results in overall fail', () => {
      const steps = generateMockExamSteps(config);
      const zeroSteps: MockExamStep[] = steps.map(step => ({
        ...step,
        isCompleted: true,
        score: 0,
        startTime: 1000,
        endTime: 2000,
        answers: [],
      }));

      const result = calculateOverallResult(config, zeroSteps);
      expect(result.passedOverall).toBe(false);
      expect(result.totalScore).toBe(0);
    });

    it('calculateStepScore produces valid scores for each part', () => {
      for (const partId of config.mockExam.stepOrder) {
        const part = findPartConfig(config, partId);
        if (!part || config.mockExam.skipSectionNumbers.includes(part.mockExamSectionNumber)) continue;

        // Full marks
        const fullScore = calculateStepScore(part, 10, 10);
        expect(fullScore).toBeLessThanOrEqual(part.maxPoints);
        expect(fullScore).toBeGreaterThan(0);

        // Zero marks
        const zeroScore = calculateStepScore(part, 0, 10);
        expect(zeroScore).toBe(0);
      }
    });

    it('group results pass/fail logic is consistent', () => {
      const steps = generateMockExamSteps(config);

      // Create steps where the first group passes but second group fails (if multiple groups)
      if (config.mockExam.scoringGroups.length >= 2) {
        const firstGroup = config.mockExam.scoringGroups[0];
        const secondGroup = config.mockExam.scoringGroups[1];

        // Check if the second group is fully skipped
        const secondGroupSkipped = secondGroup.sectionNumbers.every(
          sn => config.mockExam.skipSectionNumbers.includes(sn),
        );

        const mixedSteps: MockExamStep[] = steps.map(step => {
          const isInFirstGroup = firstGroup.sectionNumbers.includes(step.sectionNumber);
          return {
            ...step,
            isCompleted: true,
            score: isInFirstGroup ? step.maxPoints : 0,
            startTime: 1000,
            endTime: 2000,
            answers: [],
          };
        });

        const results = calculateGroupResults(config, mixedSteps);
        const firstResult = results.find(r => r.groupId === firstGroup.id);
        const secondResult = results.find(r => r.groupId === secondGroup.id);

        if (firstResult) expect(firstResult.passed).toBe(true);
        if (secondResult) {
          if (secondGroupSkipped) {
            // Skipped groups are treated as passed
            expect(secondResult.skipped).toBe(true);
            expect(secondResult.passed).toBe(true);
          } else {
            expect(secondResult.passed).toBe(false);
          }
        }

        const overall = calculateOverallResult(config, mixedSteps);
        if (secondGroupSkipped) {
          // When second group is skipped, overall depends only on first group
          expect(overall.passedOverall).toBe(true);
        } else {
          // Overall should fail because not all groups pass
          expect(overall.passedOverall).toBe(false);
        }
      }
    });
  });

  describe('German B1 specific', () => {
    it('produces 9 active steps (3 reading + 2 grammar + 3 listening + 1 writing, speaking skipped)', () => {
      const steps = generateMockExamSteps(germanB1Config);
      expect(steps).toHaveLength(9);
      expect(steps.map(s => s.id)).toEqual([
        'reading-1', 'reading-2', 'reading-3',
        'language-1', 'language-2',
        'listening-1', 'listening-2', 'listening-3',
        'writing',
      ]);
    });

    it('has scoreMultiplier of 3', () => {
      expect(germanB1Config.mockExam.scoreMultiplier).toBe(3);
    });

    it('needs 135/225 written and 45/75 oral to pass', () => {
      const written = germanB1Config.mockExam.scoringGroups.find(g => g.id === 'written')!;
      const oral = germanB1Config.mockExam.scoringGroups.find(g => g.id === 'oral')!;
      expect(written.passingPoints).toBe(135);
      expect(written.maxPoints).toBe(225);
      expect(oral.passingPoints).toBe(45);
      expect(oral.maxPoints).toBe(75);
    });
  });

  describe('DELE Spanish B1 specific', () => {
    it('has scoreMultiplier of 1', () => {
      expect(deleSpanishB1Config.mockExam.scoreMultiplier).toBe(1);
    });

    it('produces steps without speaking (skipSectionNumbers includes 5)', () => {
      const steps = generateMockExamSteps(deleSpanishB1Config);
      const speakingSteps = steps.filter(s => s.id.startsWith('speaking'));
      expect(speakingSteps).toHaveLength(0);
    });

    it('has readingWriting and listeningSpeaking scoring groups', () => {
      const groupIds = deleSpanishB1Config.mockExam.scoringGroups.map(g => g.id);
      expect(groupIds).toContain('readingWriting');
      expect(groupIds).toContain('listeningSpeaking');
    });
  });

  describe('German A1 specific', () => {
    it('produces steps for A1 exam parts', () => {
      const steps = generateMockExamSteps(germanA1Config);
      expect(steps.length).toBeGreaterThan(0);

      // A1 should have reading, listening, writing parts
      const ids = steps.map(s => s.id);
      expect(ids.some(id => id.startsWith('reading'))).toBe(true);
      expect(ids.some(id => id.startsWith('listening'))).toBe(true);
    });
  });
});
