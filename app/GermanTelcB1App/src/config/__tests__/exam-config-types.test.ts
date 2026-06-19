import {
  DataLoaderConfig,
  ScoringGroupId,
  ExamPartConfig,
  ExtraMenuItem,
  ExamSectionConfig,
  ScoringGroupConfig,
  MockExamConfig,
} from '../exam-config.types';

describe('Exam Config Types', () => {
  it('DataLoaderConfig conforms to expected shape', () => {
    const config: DataLoaderConfig = {
      listMethod: 'getReadingPart1Exams',
      fetchMethod: 'getReadingPart1ExamById',
    };
    expect(config.listMethod).toBe('getReadingPart1Exams');
    expect(config.fetchMethod).toBe('getReadingPart1ExamById');
  });

  it('ScoringGroupId is a string type', () => {
    const groupId: ScoringGroupId = 'written';
    expect(typeof groupId).toBe('string');
  });

  it('ExamPartConfig conforms to expected shape', () => {
    const part: ExamPartConfig = {
      id: 'reading-1',
      partNumber: 1,
      screenKey: 'ReadingPart1',
      uiComponentKey: 'ReadingPart1UI',
      wrapperKey: 'ReadingPart1Wrapper',
      titleKey: 'practice.reading.part1',
      descriptionKey: 'practice.reading.descriptions.part1',
      navTitleKey: 'nav.practice.reading.part1',
      dataLoader: {
        listMethod: 'getReadingPart1Exams',
        fetchMethod: 'getReadingPart1ExamById',
      },
      maxPoints: 25,
      timeMinutes: 15,
      scoringGroup: 'written',
      mockExamSectionName: 'Leseverstehen',
      mockExamPartName: 'Teil 1: Globalverstehen',
      mockExamSectionNumber: 1,
      hasExamSelection: true,
    };
    expect(part.id).toBe('reading-1');
    expect(part.partNumber).toBe(1);
    expect(part.maxPoints).toBe(25);
    expect(part.hasExamSelection).toBe(true);
  });

  it('ExamPartConfig supports optional fields', () => {
    const part: ExamPartConfig = {
      id: 'writing-1',
      partNumber: 1,
      screenKey: 'WritingScreen',
      uiComponentKey: 'WritingUI',
      wrapperKey: 'WritingWrapper',
      titleKey: 'practice.writing.part1',
      descriptionKey: 'practice.writing.descriptions.part1',
      navTitleKey: 'nav.practice.writing.part1',
      dataLoader: {
        listMethod: 'getWritingExams',
        fetchMethod: 'getWritingExamById',
      },
      maxPoints: 45,
      timeMinutes: 30,
      scoringGroup: 'written',
      scoreScaling: 0.5,
      mockExamSectionName: 'Schriftlicher Ausdruck',
      mockExamPartName: 'Schreiben',
      mockExamSectionNumber: 4,
      hasExamSelection: false,
      skipInMockExam: false,
      navigationParamKey: 'examId',
    };
    expect(part.scoreScaling).toBe(0.5);
    expect(part.skipInMockExam).toBe(false);
    expect(part.navigationParamKey).toBe('examId');
  });

  it('ExtraMenuItem conforms to expected shape', () => {
    const item: ExtraMenuItem = {
      id: 'vocabulary',
      titleKey: 'practice.vocabulary.title',
      descriptionKey: 'practice.vocabulary.description',
      screenKey: 'VocabularyScreen',
      titleParams: { level: 'B1' },
      descriptionParams: { count: 500 },
    };
    expect(item.id).toBe('vocabulary');
    expect(item.titleParams).toEqual({ level: 'B1' });
  });

  it('ExamSectionConfig conforms to expected shape', () => {
    const section: ExamSectionConfig = {
      id: 'reading',
      order: 1,
      enabled: true,
      menuTitleKey: 'practice.reading.title',
      menuDescriptionKey: 'practice.reading.description',
      parts: [],
      menuBehavior: 'submenu',
    };
    expect(section.id).toBe('reading');
    expect(section.enabled).toBe(true);
    expect(section.menuBehavior).toBe('submenu');
  });

  it('ExamSectionConfig supports all menuBehavior values', () => {
    const behaviors: Array<ExamSectionConfig['menuBehavior']> = ['submenu', 'direct', 'modal'];
    expect(behaviors).toHaveLength(3);
  });

  it('ScoringGroupConfig conforms to expected shape', () => {
    const group: ScoringGroupConfig = {
      id: 'written',
      labelKey: 'mockExam.results.written',
      maxPoints: 225,
      passingPoints: 135,
      sectionNumbers: [1, 2, 3, 4],
    };
    expect(group.id).toBe('written');
    expect(group.passingPoints).toBe(135);
    expect(group.sectionNumbers).toEqual([1, 2, 3, 4]);
  });

  it('MockExamConfig conforms to expected shape', () => {
    const mockExam: MockExamConfig = {
      stepOrder: ['reading-1', 'reading-2', 'reading-3', 'grammar-1', 'grammar-2'],
      scoringGroups: [
        {
          id: 'written',
          labelKey: 'mockExam.results.written',
          maxPoints: 225,
          passingPoints: 135,
          sectionNumbers: [1, 2, 3, 4],
        },
      ],
      totalMaxPoints: 300,
      passingTotalPoints: 180,
      skipSectionNumbers: [5],
      scoreMultiplier: 3,
    };
    expect(mockExam.stepOrder).toHaveLength(5);
    expect(mockExam.scoringGroups).toHaveLength(1);
    expect(mockExam.totalMaxPoints).toBe(300);
    expect(mockExam.scoreMultiplier).toBe(3);
  });
});
