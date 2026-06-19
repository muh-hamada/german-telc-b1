import { ExamConfig } from '../../config/exam-config.types';
import {
  findPartConfig,
  findSectionForPart,
  generateMockExamSteps,
} from '../exam-config.utils';

// Minimal ExamConfig with sections populated for testing
const createMockConfig = (overrides?: Partial<ExamConfig>): ExamConfig => ({
  id: 'test-b1',
  language: 'german',
  level: 'B1',
  provider: 'telc',
  appName: 'TestApp',
  displayName: 'Test B1',
  bundleId: { android: 'com.test', ios: 'com.test' },
  theme: 'default',
  firebaseCollections: {
    examData: 'test',
    userProgress: 'test',
    completions: 'test',
    streaks: 'test',
    vocabularyData: 'test',
    vocabularyProgress: 'test',
    speakingDialogues: 'test',
  },
  metadata: {
    cefrLevel: 'B1',
    totalDurationMinutes: 150,
    totalMaxPoints: 300,
    passingScore: 180,
  },
  features: {
    reading: true,
    listening: true,
    writing: true,
    speaking: true,
    grammar: true,
  },
  storeIds: { android: '', ios: '' },
  ads: {
    appID: { android: '', ios: '' },
    banner: { android: '', ios: '' },
    rewarded: { android: '', ios: '' },
    userSupport: { android: '', ios: '' },
    vocabularyBuilder: { android: '', ios: '' },
    appOpen: { android: '', ios: '' },
  },
  premium: { productId: { android: '', ios: '' } },
  writingEvaluationFnName: 'test',
  examStructure: { reading: [1, 2, 3] },
  sections: [
    {
      id: 'reading',
      order: 1,
      enabled: true,
      menuTitleKey: 'practice.reading.title',
      menuDescriptionKey: 'practice.reading.description',
      menuBehavior: 'submenu',
      parts: [
        {
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
          mockExamPartName: 'Teil 1: Globalverstehen',
          mockExamSectionNumber: 1,
          hasExamSelection: true,
        },
        {
          id: 'reading-2',
          partNumber: 2,
          screenKey: 'ReadingPart2',
          uiComponentKey: 'ReadingPart2UI',
          wrapperKey: 'ReadingPart2Wrapper',
          titleKey: 'practice.reading.part2',
          descriptionKey: 'practice.reading.descriptions.part2',
          navTitleKey: 'nav.practice.reading.part2',
          dataLoader: { listMethod: 'getReadingPart2Exams', fetchMethod: 'getReadingPart2ExamById' },
          maxPoints: 25,
          timeMinutes: 30,
          scoringGroup: 'written',
          mockExamSectionName: 'Leseverstehen',
          mockExamPartName: 'Teil 2: Detailverstehen',
          mockExamSectionNumber: 1,
          hasExamSelection: true,
        },
      ],
    },
    {
      id: 'speaking',
      order: 5,
      enabled: true,
      menuTitleKey: 'practice.speaking.title',
      menuDescriptionKey: 'practice.speaking.description',
      menuBehavior: 'submenu',
      parts: [
        {
          id: 'speaking-1',
          partNumber: 1,
          screenKey: 'SpeakingPart1',
          uiComponentKey: 'SpeakingPart1UI',
          wrapperKey: 'SpeakingPart1Wrapper',
          titleKey: 'practice.speaking.part1',
          descriptionKey: 'practice.speaking.descriptions.part1',
          navTitleKey: 'nav.practice.speaking.part1',
          dataLoader: { listMethod: 'getSpeakingPart1Exams', fetchMethod: 'getSpeakingPart1ExamById' },
          maxPoints: 15,
          timeMinutes: 3,
          scoringGroup: 'oral',
          mockExamSectionName: 'Mündlicher Ausdruck',
          mockExamPartName: 'Teil 1: Einander kennenlernen',
          mockExamSectionNumber: 5,
          hasExamSelection: false,
          skipInMockExam: true,
        },
      ],
    },
  ],
  mockExam: {
    stepOrder: ['reading-1', 'reading-2', 'speaking-1'],
    scoringGroups: [
      { id: 'written', labelKey: 'results.written', maxPoints: 225, passingPoints: 135, sectionNumbers: [1, 2, 3, 4] },
      { id: 'oral', labelKey: 'results.oral', maxPoints: 75, passingPoints: 45, sectionNumbers: [5] },
    ],
    totalMaxPoints: 300,
    passingTotalPoints: 180,
    skipSectionNumbers: [5],
    scoreMultiplier: 3,
  },
  ...overrides,
});

describe('exam-config.utils', () => {
  describe('findPartConfig', () => {
    it('finds a part by ID', () => {
      const config = createMockConfig();
      const part = findPartConfig(config, 'reading-1');
      expect(part).toBeDefined();
      expect(part!.id).toBe('reading-1');
      expect(part!.maxPoints).toBe(25);
    });

    it('finds a part in a different section', () => {
      const config = createMockConfig();
      const part = findPartConfig(config, 'speaking-1');
      expect(part).toBeDefined();
      expect(part!.id).toBe('speaking-1');
      expect(part!.mockExamSectionNumber).toBe(5);
    });

    it('returns undefined for non-existent part ID', () => {
      const config = createMockConfig();
      const part = findPartConfig(config, 'nonexistent');
      expect(part).toBeUndefined();
    });

    it('returns undefined when sections is empty', () => {
      const config = createMockConfig({ sections: [] });
      const part = findPartConfig(config, 'reading-1');
      expect(part).toBeUndefined();
    });
  });

  describe('findSectionForPart', () => {
    it('finds the section containing the part', () => {
      const config = createMockConfig();
      const section = findSectionForPart(config, 'reading-1');
      expect(section).toBeDefined();
      expect(section!.id).toBe('reading');
    });

    it('finds the correct section for speaking part', () => {
      const config = createMockConfig();
      const section = findSectionForPart(config, 'speaking-1');
      expect(section).toBeDefined();
      expect(section!.id).toBe('speaking');
    });

    it('returns undefined for non-existent part', () => {
      const config = createMockConfig();
      const section = findSectionForPart(config, 'nonexistent');
      expect(section).toBeUndefined();
    });

    it('returns undefined when sections is empty', () => {
      const config = createMockConfig({ sections: [] });
      const section = findSectionForPart(config, 'reading-1');
      expect(section).toBeUndefined();
    });
  });

  describe('generateMockExamSteps', () => {
    it('generates steps from stepOrder excluding skipped sections', () => {
      const config = createMockConfig();
      const steps = generateMockExamSteps(config);

      // speaking-1 has sectionNumber 5 which is in skipSectionNumbers
      expect(steps).toHaveLength(2);
      expect(steps[0].id).toBe('reading-1');
      expect(steps[1].id).toBe('reading-2');
    });

    it('generates correct step properties', () => {
      const config = createMockConfig();
      const steps = generateMockExamSteps(config);

      expect(steps[0]).toEqual({
        id: 'reading-1',
        sectionNumber: 1,
        sectionName: 'Leseverstehen',
        partNumber: 1,
        partName: 'Teil 1: Globalverstehen',
        maxPoints: 25,
        timeMinutes: 30,
      });
    });

    it('returns empty array when stepOrder is empty', () => {
      const config = createMockConfig({
        mockExam: {
          ...createMockConfig().mockExam,
          stepOrder: [],
        },
      });
      const steps = generateMockExamSteps(config);
      expect(steps).toEqual([]);
    });

    it('returns empty array when sections is empty', () => {
      const config = createMockConfig({ sections: [] });
      const steps = generateMockExamSteps(config);
      expect(steps).toEqual([]);
    });

    it('skips parts not found in sections', () => {
      const config = createMockConfig();
      config.mockExam!.stepOrder = ['reading-1', 'nonexistent', 'reading-2'];
      const steps = generateMockExamSteps(config);
      expect(steps).toHaveLength(2);
      expect(steps[0].id).toBe('reading-1');
      expect(steps[1].id).toBe('reading-2');
    });

    it('includes all parts when skipSectionNumbers is empty', () => {
      const config = createMockConfig();
      config.mockExam!.skipSectionNumbers = [];
      const steps = generateMockExamSteps(config);
      // Now speaking-1 should be included
      expect(steps).toHaveLength(3);
      expect(steps[2].id).toBe('speaking-1');
    });
  });
});
