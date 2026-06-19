import AsyncStorage from '@react-native-async-storage/async-storage';
import { MockExamProgress, MockExamStep } from '../../types/mock-exam.types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock data service
jest.mock('../data.service', () => ({
  dataService: {
    getReadingPart1Exams: jest.fn(() => Promise.resolve([{ id: 1 }, { id: 2 }, { id: 3 }])),
    getReadingPart2Exams: jest.fn(() => Promise.resolve([{ id: 4 }, { id: 5 }])),
    getGrammarPart1Exams: jest.fn(() => Promise.resolve([{ id: 10 }])),
    getListeningPart1Content: jest.fn(() => Promise.resolve({ exams: [{ id: 'L1' }, { id: 'L2' }] })),
    getSpeakingTopics: jest.fn(() => Promise.resolve({ topics: [{ id: 'T1' }, { id: 'T2' }, { id: 'T3' }] })),
  },
}));

// Mock analytics
jest.mock('../analytics.events', () => ({
  AnalyticsEvents: {
    MOCK_EXAM_STARTED: 'mock_exam_started',
    MOCK_EXAM_STEP_STARTED: 'mock_exam_step_started',
    MOCK_EXAM_STEP_COMPLETED: 'mock_exam_step_completed',
    MOCK_EXAM_COMPLETED: 'mock_exam_completed',
  },
  logEvent: jest.fn(),
}));

// Mock active exam config
jest.mock('../../config/active-exam.config', () => ({
  activeExamConfig: {
    id: 'german-b1',
    language: 'german',
    level: 'B1',
    provider: 'telc',
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
            mockExamPartName: 'Teil 1',
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
            mockExamPartName: 'Teil 2',
            mockExamSectionNumber: 1,
            hasExamSelection: true,
          },
        ],
      },
      {
        id: 'grammar',
        order: 2,
        enabled: true,
        menuTitleKey: 'practice.grammar.title',
        menuDescriptionKey: 'practice.grammar.description',
        menuBehavior: 'submenu',
        parts: [
          {
            id: 'grammar-1',
            partNumber: 1,
            screenKey: 'GrammarPart1',
            uiComponentKey: 'GrammarPart1UI',
            wrapperKey: 'GrammarPart1Wrapper',
            titleKey: 'practice.grammar.part1',
            descriptionKey: 'practice.grammar.descriptions.part1',
            navTitleKey: 'nav.practice.grammar.part1',
            dataLoader: { listMethod: 'getGrammarPart1Exams', fetchMethod: 'getGrammarPart1ExamById' },
            maxPoints: 30,
            timeMinutes: 20,
            scoringGroup: 'written',
            mockExamSectionName: 'Sprachbausteine',
            mockExamPartName: 'Teil 1',
            mockExamSectionNumber: 2,
            hasExamSelection: true,
          },
        ],
      },
      {
        id: 'listening',
        order: 3,
        enabled: true,
        menuTitleKey: 'practice.listening.title',
        menuDescriptionKey: 'practice.listening.description',
        menuBehavior: 'submenu',
        parts: [
          {
            id: 'listening-1',
            partNumber: 1,
            screenKey: 'ListeningPart1',
            uiComponentKey: 'ListeningPart1UI',
            wrapperKey: 'ListeningPart1Wrapper',
            titleKey: 'practice.listening.part1',
            descriptionKey: 'practice.listening.descriptions.part1',
            navTitleKey: 'nav.practice.listening.part1',
            dataLoader: { listMethod: 'getListeningPart1Content', fetchMethod: 'getListeningPart1ExamById' },
            maxPoints: 25,
            timeMinutes: 10,
            scoringGroup: 'written',
            mockExamSectionName: 'Hörverstehen',
            mockExamPartName: 'Teil 1',
            mockExamSectionNumber: 3,
            hasExamSelection: true,
          },
        ],
      },
      {
        id: 'speaking',
        order: 4,
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
            dataLoader: { listMethod: 'getSpeakingTopics', fetchMethod: 'getSpeakingTopicById', listResponseKey: 'topics' },
            maxPoints: 25,
            timeMinutes: 5,
            scoringGroup: 'oral',
            mockExamSectionName: 'Speaking',
            mockExamPartName: 'Teil 1',
            mockExamSectionNumber: 5,
            hasExamSelection: true,
            skipInMockExam: true,
          },
        ],
      },
    ],
    mockExam: {
      stepOrder: ['reading-1', 'reading-2', 'grammar-1', 'listening-1', 'speaking-1'],
      scoringGroups: [
        { id: 'written', labelKey: 'results.written', maxPoints: 225, passingPoints: 135, sectionNumbers: [1, 2, 3] },
        { id: 'oral', labelKey: 'results.oral', maxPoints: 75, passingPoints: 45, sectionNumbers: [5] },
      ],
      totalMaxPoints: 300,
      passingTotalPoints: 180,
      skipSectionNumbers: [5],
      scoreMultiplier: 3,
    },
  },
}));

import {
  generateRandomExamSelection,
  saveMockExamProgress,
  loadMockExamProgress,
  clearMockExamProgress,
  hasActiveMockExam,
  createInitialMockExamProgress,
  updateStepProgress,
} from '../mock-exam.service';

describe('mock-exam.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateRandomExamSelection', () => {
    it('selects one exam per step in stepOrder', async () => {
      const selection = await generateRandomExamSelection();

      expect(selection).toHaveProperty('reading-1');
      expect(selection).toHaveProperty('reading-2');
      expect(selection).toHaveProperty('grammar-1');
      expect(selection).toHaveProperty('listening-1');
    });

    it('selects valid IDs from available exams', async () => {
      const selection = await generateRandomExamSelection();

      // reading-1 returns [{ id: 1 }, { id: 2 }, { id: 3 }]
      expect([1, 2, 3]).toContain(selection['reading-1']);
      // reading-2 returns [{ id: 4 }, { id: 5 }]
      expect([4, 5]).toContain(selection['reading-2']);
      // grammar-1 returns [{ id: 10 }]
      expect(selection['grammar-1']).toBe(10);
    });

    it('handles { exams: [...] } response format', async () => {
      const selection = await generateRandomExamSelection();

      // listening-1 uses getListeningPart1Content which returns { exams: [{ id: "L1" }, { id: "L2" }] }
      expect(['L1', 'L2']).toContain(selection['listening-1']);
    });

    it('handles listResponseKey config (e.g., topics)', async () => {
      const selection = await generateRandomExamSelection();

      // speaking-1 has listResponseKey: 'topics' and skipInMockExam: true
      // So it should be skipped and NOT appear in selection
      expect(selection).not.toHaveProperty('speaking-1');
    });

    it('skips parts with skipInMockExam: true', async () => {
      const selection = await generateRandomExamSelection();
      expect(selection).not.toHaveProperty('speaking-1');
    });
  });

  describe('saveMockExamProgress', () => {
    it('saves progress to AsyncStorage as JSON', async () => {
      const progress: MockExamProgress = {
        examId: 'mock-exam-123',
        startDate: 1000,
        currentStepId: 'reading-1',
        steps: [],
        selectedTests: {},
        totalScore: 0,
        totalMaxPoints: 300,
        isCompleted: false,
        hasStarted: false,
      };

      await saveMockExamProgress(progress);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@mock_exam_progress',
        JSON.stringify(progress),
      );
    });

    it('throws on storage error', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage full'));

      const progress: MockExamProgress = {
        examId: 'mock-exam-123',
        startDate: 1000,
        currentStepId: 'reading-1',
        steps: [],
        selectedTests: {},
        totalScore: 0,
        totalMaxPoints: 300,
        isCompleted: false,
        hasStarted: false,
      };

      await expect(saveMockExamProgress(progress)).rejects.toThrow('Failed to save mock exam progress');
    });
  });

  describe('loadMockExamProgress', () => {
    it('returns null when no progress exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      const result = await loadMockExamProgress();
      expect(result).toBeNull();
    });

    it('returns parsed progress when exists', async () => {
      const progress: MockExamProgress = {
        examId: 'mock-exam-123',
        startDate: 1000,
        currentStepId: 'reading-1',
        steps: [],
        selectedTests: { 'reading-1': 1 },
        totalScore: 50,
        totalMaxPoints: 300,
        isCompleted: false,
        hasStarted: true,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(progress));

      const result = await loadMockExamProgress();
      expect(result).toEqual(progress);
    });

    it('returns null on parse error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('invalid-json{');
      const result = await loadMockExamProgress();
      expect(result).toBeNull();
    });
  });

  describe('clearMockExamProgress', () => {
    it('removes item from AsyncStorage', async () => {
      await clearMockExamProgress();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@mock_exam_progress');
    });

    it('throws on storage error', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('fail'));
      await expect(clearMockExamProgress()).rejects.toThrow('Failed to clear mock exam progress');
    });
  });

  describe('hasActiveMockExam', () => {
    it('returns false when no progress exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      const result = await hasActiveMockExam();
      expect(result).toBe(false);
    });

    it('returns true when progress exists and not completed', async () => {
      const progress: MockExamProgress = {
        examId: 'mock-exam-123',
        startDate: 1000,
        currentStepId: 'reading-1',
        steps: [],
        selectedTests: {},
        totalScore: 0,
        totalMaxPoints: 300,
        isCompleted: false,
        hasStarted: true,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(progress));

      const result = await hasActiveMockExam();
      expect(result).toBe(true);
    });

    it('returns false when progress exists but is completed', async () => {
      const progress: MockExamProgress = {
        examId: 'mock-exam-123',
        startDate: 1000,
        currentStepId: 'reading-1',
        steps: [],
        selectedTests: {},
        totalScore: 0,
        totalMaxPoints: 300,
        isCompleted: true,
        hasStarted: true,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(progress));

      const result = await hasActiveMockExam();
      expect(result).toBe(false);
    });
  });

  describe('createInitialMockExamProgress', () => {
    it('creates progress with steps from config', async () => {
      const progress = await createInitialMockExamProgress();

      expect(progress.examId).toContain('mock-exam-');
      expect(progress.isCompleted).toBe(false);
      expect(progress.hasStarted).toBe(false);
      expect(progress.totalMaxPoints).toBe(300);
      expect(progress.totalScore).toBe(0);
      expect(progress.steps.length).toBeGreaterThan(0);
      expect(progress.currentStepId).toBe(progress.steps[0].id);
    });

    it('steps have correct initial state', async () => {
      const progress = await createInitialMockExamProgress();

      for (const step of progress.steps) {
        expect(step.isCompleted).toBe(false);
        expect(step.score).toBeUndefined();
        expect(step.startTime).toBeUndefined();
        expect(step.endTime).toBeUndefined();
      }
    });

    it('selectedTests contains entries for each step', async () => {
      const progress = await createInitialMockExamProgress();

      expect(Object.keys(progress.selectedTests).length).toBeGreaterThan(0);
    });
  });

  describe('updateStepProgress', () => {
    const createMockProgress = (): MockExamProgress => ({
      examId: 'mock-exam-123',
      startDate: 1000,
      currentStepId: 'reading-1',
      steps: [
        {
          id: 'reading-1',
          sectionNumber: 1,
          sectionName: 'Leseverstehen',
          partName: 'Teil 1',
          maxPoints: 25,
          isCompleted: false,
          score: undefined,
          startTime: 500,
        },
        {
          id: 'reading-2',
          sectionNumber: 1,
          sectionName: 'Leseverstehen',
          partName: 'Teil 2',
          maxPoints: 25,
          isCompleted: false,
          score: undefined,
        },
        {
          id: 'grammar-1',
          sectionNumber: 2,
          sectionName: 'Sprachbausteine',
          partName: 'Teil 1',
          maxPoints: 30,
          isCompleted: false,
          score: undefined,
        },
      ],
      selectedTests: { 'reading-1': 1, 'reading-2': 4, 'grammar-1': 10 },
      totalScore: 0,
      totalMaxPoints: 300,
      isCompleted: false,
      hasStarted: true,
    });

    it('updates step score and completion', async () => {
      const progress = createMockProgress();
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(progress));

      await updateStepProgress('reading-1', 20, true, []);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData.steps[0].score).toBe(20);
      expect(savedData.steps[0].isCompleted).toBe(true);
      expect(savedData.steps[0].endTime).toBeDefined();
    });

    it('advances to next step after completion', async () => {
      const progress = createMockProgress();
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(progress));

      await updateStepProgress('reading-1', 20, true, []);

      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData.currentStepId).toBe('reading-2');
    });

    it('marks exam completed when last step completes', async () => {
      const progress = createMockProgress();
      progress.steps[0].isCompleted = true;
      progress.steps[0].score = 20;
      progress.steps[1].isCompleted = true;
      progress.steps[1].score = 15;
      progress.currentStepId = 'grammar-1';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(progress));

      await updateStepProgress('grammar-1', 25, true, []);

      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData.isCompleted).toBe(true);
      expect(savedData.endDate).toBeDefined();
    });

    it('updates total score from all completed steps', async () => {
      const progress = createMockProgress();
      progress.steps[0].isCompleted = true;
      progress.steps[0].score = 20;
      progress.currentStepId = 'reading-2';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(progress));

      await updateStepProgress('reading-2', 15, true, []);

      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData.totalScore).toBe(35); // 20 + 15
    });

    it('throws when no progress exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      await expect(updateStepProgress('reading-1', 20, true, [])).rejects.toThrow('No mock exam progress found');
    });

    it('throws when step not found', async () => {
      const progress = createMockProgress();
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(progress));
      await expect(updateStepProgress('nonexistent', 20, true, [])).rejects.toThrow('Step nonexistent not found');
    });
  });
});
