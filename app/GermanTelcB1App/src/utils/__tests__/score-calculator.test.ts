import { ExamConfig, ExamPartConfig } from '../../config/exam-config.types';
import { MockExamStep } from '../../types/mock-exam.types';
import {
  calculateStepScore,
  calculateGroupResults,
  calculateOverallResult,
} from '../score-calculator';

const createPartConfig = (overrides?: Partial<ExamPartConfig>): ExamPartConfig => ({
  id: 'reading-1',
  partNumber: 1,
  screenKey: 'ReadingPart1',
  uiComponentKey: 'ReadingPart1UI',
  wrapperKey: 'ReadingPart1Wrapper',
  titleKey: 'practice.reading.part1',
  descriptionKey: 'practice.reading.descriptions.part1',
  navTitleKey: 'nav.practice.reading.part1',
  dataLoader: { listMethod: 'getReadingPart1Exams', fetchMethod: 'getReadingPart1ExamById' },
  maxPoints: 25,
  timeMinutes: 30,
  scoringGroup: 'written',
  mockExamSectionName: 'Leseverstehen',
  mockExamPartName: 'Teil 1',
  mockExamSectionNumber: 1,
  hasExamSelection: true,
  ...overrides,
});

const createMockStep = (overrides?: Partial<MockExamStep>): MockExamStep => ({
  id: 'reading-1',
  sectionNumber: 1,
  sectionName: 'Leseverstehen',
  partName: 'Teil 1',
  maxPoints: 25,
  isCompleted: true,
  score: 0,
  ...overrides,
});

const createTelcB1Config = (): ExamConfig => ({
  id: 'german-b1',
  language: 'german',
  level: 'B1',
  provider: 'telc',
  appName: 'GermanTelcB1',
  displayName: 'German TELC B1',
  bundleId: { android: 'com.test', ios: 'com.test' },
  theme: 'default',
  firebaseCollections: {
    examData: 'test', userProgress: 'test', completions: 'test',
    streaks: 'test', vocabularyData: 'test', vocabularyProgress: 'test', speakingDialogues: 'test',
  },
  metadata: { cefrLevel: 'B1', totalDurationMinutes: 150, totalMaxPoints: 300, passingScore: 180 },
  features: { reading: true, listening: true, writing: true, speaking: true, grammar: true },
  storeIds: { android: '', ios: '' },
  ads: {
    appID: { android: '', ios: '' }, banner: { android: '', ios: '' },
    rewarded: { android: '', ios: '' }, userSupport: { android: '', ios: '' },
    vocabularyBuilder: { android: '', ios: '' }, appOpen: { android: '', ios: '' },
  },
  premium: { productId: { android: '', ios: '' } },
  writingEvaluationFnName: 'test',
  examStructure: { reading: [1, 2, 3] },
  sections: [],
  mockExam: {
    stepOrder: ['reading-1', 'reading-2', 'reading-3', 'grammar-1', 'grammar-2', 'listening-1', 'listening-2', 'listening-3', 'writing'],
    scoringGroups: [
      { id: 'written', labelKey: 'results.written', maxPoints: 225, passingPoints: 135, sectionNumbers: [1, 2, 3, 4] },
      { id: 'oral', labelKey: 'results.oral', maxPoints: 75, passingPoints: 45, sectionNumbers: [5] },
    ],
    totalMaxPoints: 300,
    passingTotalPoints: 180,
    skipSectionNumbers: [5],
    scoreMultiplier: 3,
  },
});

const createDeleB1Config = (): ExamConfig => ({
  ...createTelcB1Config(),
  id: 'spanish-b1',
  language: 'spanish',
  provider: 'dele',
  mockExam: {
    stepOrder: ['reading-1', 'reading-2', 'reading-3', 'grammar-1', 'grammar-2', 'listening-1', 'listening-2', 'listening-3', 'listening-4', 'listening-5', 'writing'],
    scoringGroups: [
      { id: 'readingWriting', labelKey: 'results.readingWriting', maxPoints: 50, passingPoints: 30, sectionNumbers: [1, 4] },
      { id: 'listeningSpeaking', labelKey: 'results.listeningSpeaking', maxPoints: 50, passingPoints: 30, sectionNumbers: [3, 5] },
    ],
    totalMaxPoints: 100,
    passingTotalPoints: 60,
    skipSectionNumbers: [],
    scoreMultiplier: 1,
  },
});

describe('score-calculator', () => {
  describe('calculateStepScore', () => {
    it('B1 reading: 5/5 correct with maxPoints 25 → 25', () => {
      const part = createPartConfig({ maxPoints: 25 });
      expect(calculateStepScore(part, 5, 5)).toBe(25);
    });

    it('B1 reading: 3/5 correct with maxPoints 25 → 15', () => {
      const part = createPartConfig({ maxPoints: 25 });
      expect(calculateStepScore(part, 3, 5)).toBe(15);
    });

    it('DELE writing with scoreScaling 0.5: correctCount=20 → 10', () => {
      const part = createPartConfig({ scoreScaling: 0.5, maxPoints: 25 });
      expect(calculateStepScore(part, 20, 25)).toBe(10);
    });

    it('returns correctCount when maxPoints is 0', () => {
      const part = createPartConfig({ maxPoints: 0 });
      expect(calculateStepScore(part, 8, 10)).toBe(8);
    });

    it('returns correctCount when totalQuestions is 0', () => {
      const part = createPartConfig({ maxPoints: 25 });
      expect(calculateStepScore(part, 0, 0)).toBe(0);
    });

    it('handles scoreScaling of 0', () => {
      const part = createPartConfig({ scoreScaling: 0 });
      expect(calculateStepScore(part, 5, 5)).toBe(0);
    });

    it('rounds to 1 decimal place', () => {
      // 2/3 of 25 = 16.666... → rounds to 16.7
      const part = createPartConfig({ maxPoints: 25 });
      expect(calculateStepScore(part, 2, 3)).toBe(16.7);
    });
  });

  describe('calculateGroupResults', () => {
    it('groups steps by sectionNumber and sums scores', () => {
      const config = createTelcB1Config();
      const steps: MockExamStep[] = [
        createMockStep({ id: 'reading-1', sectionNumber: 1, score: 20 }),
        createMockStep({ id: 'reading-2', sectionNumber: 1, score: 15 }),
        createMockStep({ id: 'grammar-1', sectionNumber: 2, score: 10 }),
        createMockStep({ id: 'listening-1', sectionNumber: 3, score: 25 }),
        createMockStep({ id: 'writing', sectionNumber: 4, score: 30 }),
      ];

      const results = calculateGroupResults(config, steps);
      expect(results).toHaveLength(2);

      const written = results.find(r => r.groupId === 'written')!;
      expect(written.score).toBe(100); // 20+15+10+25+30
      expect(written.maxPoints).toBe(225);
      expect(written.passed).toBe(false); // 100 < 135

      const oral = results.find(r => r.groupId === 'oral')!;
      expect(oral.score).toBe(0); // no section 5 steps
      expect(oral.passed).toBe(false);
    });

    it('returns empty array when mockExam has no scoring groups', () => {
      const config = { ...createTelcB1Config(), mockExam: { ...createTelcB1Config().mockExam, scoringGroups: [] } };
      const results = calculateGroupResults(config, []);
      expect(results).toEqual([]);
    });
  });

  describe('calculateOverallResult', () => {
    it('100% score passes', () => {
      const config = createTelcB1Config();
      const steps: MockExamStep[] = [
        createMockStep({ sectionNumber: 1, score: 75 }),
        createMockStep({ sectionNumber: 2, score: 30 }),
        createMockStep({ sectionNumber: 3, score: 75 }),
        createMockStep({ sectionNumber: 4, score: 45 }),
        createMockStep({ sectionNumber: 5, score: 75 }),
      ];

      const result = calculateOverallResult(config, steps);
      expect(result.totalScore).toBe(300);
      expect(result.passedOverall).toBe(true);
    });

    it('0% score fails', () => {
      const config = createTelcB1Config();
      const steps: MockExamStep[] = [
        createMockStep({ sectionNumber: 1, score: 0 }),
        createMockStep({ sectionNumber: 2, score: 0 }),
      ];

      const result = calculateOverallResult(config, steps);
      expect(result.totalScore).toBe(0);
      expect(result.passedOverall).toBe(false);
    });

    it('exactly 60% passes when all groups pass', () => {
      const config = createTelcB1Config();
      const steps: MockExamStep[] = [
        createMockStep({ sectionNumber: 1, score: 135 }), // written group total = 135 (exactly 60% of 225)
        createMockStep({ sectionNumber: 5, score: 45 }),   // oral group total = 45 (exactly 60% of 75)
      ];

      const result = calculateOverallResult(config, steps);
      expect(result.totalScore).toBe(180);
      expect(result.passedOverall).toBe(true);
    });

    it('59% overall fails', () => {
      const config = createTelcB1Config();
      const steps: MockExamStep[] = [
        createMockStep({ sectionNumber: 1, score: 134 }), // written group = 134 < 135 → fails
        createMockStep({ sectionNumber: 5, score: 45 }),
      ];

      const result = calculateOverallResult(config, steps);
      expect(result.totalScore).toBe(179);
      expect(result.passedOverall).toBe(false); // written group fails
    });

    it('DELE: one group passes but other fails → overall fail', () => {
      const config = createDeleB1Config();
      const steps: MockExamStep[] = [
        createMockStep({ sectionNumber: 1, score: 35 }), // readingWriting: 35 >= 30 → pass
        createMockStep({ sectionNumber: 3, score: 20 }), // listeningSpeaking: 20 < 30 → fail
      ];

      const result = calculateOverallResult(config, steps);
      expect(result.totalScore).toBe(55);
      expect(result.passedOverall).toBe(false); // listeningSpeaking group fails
    });

    it('Telc B1: written passes, oral skipped (0) → overall fails because oral group fails', () => {
      const config = createTelcB1Config();
      const steps: MockExamStep[] = [
        createMockStep({ sectionNumber: 1, score: 75 }),
        createMockStep({ sectionNumber: 2, score: 30 }),
        createMockStep({ sectionNumber: 3, score: 75 }),
        createMockStep({ sectionNumber: 4, score: 45 }),
        // No section 5 steps — oral score is 0
      ];

      const result = calculateOverallResult(config, steps);
      expect(result.totalScore).toBe(225);
      // Written group: 225 >= 135 → pass
      // Oral group: 0 < 45 → fail
      expect(result.passedOverall).toBe(false);
    });

    it('calculates percentage correctly', () => {
      const config = createTelcB1Config();
      const steps: MockExamStep[] = [
        createMockStep({ sectionNumber: 1, score: 150 }),
      ];

      const result = calculateOverallResult(config, steps);
      expect(result.totalPercentage).toBe(50); // 150/300 * 100
    });
  });
});
