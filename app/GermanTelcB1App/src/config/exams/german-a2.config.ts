/**
 * German TELC A2 Exam Configuration
 * 
 * This is the configuration for the German A2 exam app.
 */

import { ExamConfig, ExamSectionConfig, MockExamConfig } from '../exam-config.types';

export const germanA2Config: ExamConfig = {
  // Basic Identity
  id: 'german-a2',
  language: 'german',
  level: 'A2',
  provider: 'telc',
  
  // App Identity
  appName: 'GermanTelcA2',
  displayName: 'German TELC A2',

  bundleId: {
    android: 'com.mhamada.telca2german',
    ios: 'com.mhamada.telca2german',
  },
  
  // Theme Configuration
  theme: 'default',
  
  // Firebase Collections (keeping existing collection names for backward compatibility)
  firebaseCollections: {
    examData: 'german_a2_telc_exam_data',              // Existing collection
    userProgress: 'users/{uid}/german_a2_progress/data',   // Fixed: Must be 4 segments for .doc() to work
    completions: 'users/{uid}/completions_german_a2',      // Lang and level in path (3 segments to allow appending 3 more for doc)
    streaks: 'users/{uid}/streaks/german-a2',              // Daily streaks tracking per exam
    vocabularyData: 'vocabulary_data_german_a2',           // Vocabulary words collection
    vocabularyProgress: 'users/{uid}/vocabulary_progress_german_a2/data', // User vocabulary progress
    speakingDialogues: 'users/{uid}/speaking_dialogues_german_a2', // Speaking assessments
  },
  
  // Exam Metadata (from existing exam-info.json)
  metadata: {
    cefrLevel: 'A2',
    totalDurationMinutes: 85,
    totalMaxPoints: 60,
    passingScore: 36,
  },
  
  // All features enabled for German A2
  features: {
    reading: true,
    listening: true,
    writing: true,
    speaking: true,
    grammar: true,
  },
  
  // Store IDs
  storeIds: {
    android: 'com.mhamada.telca2german',
    ios: '6759285601',
  },

  ads: {
    appID: {
      android: 'ca-app-pub-5101905792101482~7489444215',
      ios: 'ca-app-pub-5101905792101482~8374326066',
    },
    banner: {
      android: 'ca-app-pub-5101905792101482/3363765868',
      ios: 'ca-app-pub-5101905792101482/7061244390',
    },
    rewarded: {
      android: 'ca-app-pub-5101905792101482/2050684196',
      ios: 'ca-app-pub-5101905792101482/4163618312',
    },
    userSupport: {
      android: 'ca-app-pub-5101905792101482/5984790854',
      ios: 'ca-app-pub-5101905792101482/4435081057',
    },
    vocabularyBuilder: {
      android: 'ca-app-pub-5101905792101482/1914952828',
      ios: 'ca-app-pub-5101905792101482/2233248106',
    },
    appOpen: {
      android: 'ca-app-pub-5101905792101482/3737901467',
      ios: 'ca-app-pub-5101905792101482/6919867494',
    },
  },

  premium: {
    productId: {
      android: 'full_access',
      ios: 'full_access_german_a2',
    },
  },

  writingEvaluationFnName: 'evaluateWritingGermanA2',

  // Exam Structure - A2 specific structure
  examStructure: {
    'reading': [1, 2, 3],
    'listening': [1, 2, 3],
    'writing': [1, 2],      // A2 has 2 writing parts
    'speaking': [1, 2, 3],
    // No grammar section in A2
  },

  // Declarative Exam Sections Configuration
  sections: [
    {
      id: 'reading',
      order: 1,
      enabled: true,
      menuTitleKey: 'practice.reading.title',
      menuDescriptionKey: 'practice.reading.descriptions.main',
      menuBehavior: 'submenu',
      parts: [
        {
          id: 'reading-1',
          partNumber: 1,
          screenKey: 'ReadingPart1A2',
          uiComponentKey: 'ReadingPart1A2UI',
          wrapperKey: 'ReadingPart1Wrapper',
          titleKey: 'practice.reading.a2.part1',
          descriptionKey: 'practice.reading.descriptions.a2.part1',
          navTitleKey: 'nav.practice.reading.part1',
          dataLoader: { listMethod: 'getReadingPart1A2Exams', fetchMethod: 'getReadingPart1A2ExamById' },
          maxPoints: 5,
          timeMinutes: 8,
          scoringGroup: 'written',
          mockExamSectionName: 'Leseverstehen',
          mockExamPartName: 'Teil 1: Globalverstehen',
          mockExamSectionNumber: 1,
          hasExamSelection: true,
        },
        {
          id: 'reading-2',
          partNumber: 2,
          screenKey: 'ReadingPart2A2',
          uiComponentKey: 'ReadingPart2A2UI',
          wrapperKey: 'ReadingPart2Wrapper',
          titleKey: 'practice.reading.a2.part2',
          descriptionKey: 'practice.reading.descriptions.a2.part2',
          navTitleKey: 'nav.practice.reading.part2',
          dataLoader: { listMethod: 'getReadingPart2A2Exams', fetchMethod: 'getReadingPart2A2ExamById' },
          maxPoints: 5,
          timeMinutes: 9,
          scoringGroup: 'written',
          mockExamSectionName: 'Leseverstehen',
          mockExamPartName: 'Teil 2: Detailverstehen',
          mockExamSectionNumber: 1,
          hasExamSelection: true,
        },
        {
          id: 'reading-3',
          partNumber: 3,
          screenKey: 'ReadingPart3A2',
          uiComponentKey: 'ReadingPart3A2UI',
          wrapperKey: 'ReadingPart3Wrapper',
          titleKey: 'practice.reading.a2.part3',
          descriptionKey: 'practice.reading.descriptions.a2.part3',
          navTitleKey: 'nav.practice.reading.part3',
          dataLoader: { listMethod: 'getReadingPart3A2Exams', fetchMethod: 'getReadingPart3A2ExamById' },
          maxPoints: 5,
          timeMinutes: 8,
          scoringGroup: 'written',
          mockExamSectionName: 'Leseverstehen',
          mockExamPartName: 'Teil 3: Selektives Verstehen',
          mockExamSectionNumber: 1,
          hasExamSelection: true,
        },
      ],
    },
    {
      id: 'grammar',
      order: 2,
      enabled: false,
      menuTitleKey: 'practice.grammar.title',
      menuDescriptionKey: 'practice.grammar.descriptions.main',
      menuBehavior: 'submenu',
      parts: [],
    },
    {
      id: 'listening',
      order: 3,
      enabled: true,
      menuTitleKey: 'practice.listening.title',
      menuDescriptionKey: 'practice.listening.comingSoon',
      menuBehavior: 'submenu',
      parts: [
        {
          id: 'listening-1',
          partNumber: 1,
          screenKey: 'ListeningPart1A2',
          uiComponentKey: 'ListeningPart1A2UI',
          wrapperKey: 'ListeningPart1Wrapper',
          titleKey: 'practice.listening.a2.part1',
          descriptionKey: 'practice.listening.descriptions.a2.part1',
          navTitleKey: 'nav.practice.listening.part1',
          dataLoader: { listMethod: 'getListeningPart1Content', fetchMethod: 'getListeningPart1Content' },
          maxPoints: 5,
          timeMinutes: 7,
          scoringGroup: 'written',
          mockExamSectionName: 'Hörverstehen',
          mockExamPartName: 'Teil 1: Globalverstehen',
          mockExamSectionNumber: 3,
          hasExamSelection: true,
        },
        {
          id: 'listening-2',
          partNumber: 2,
          screenKey: 'ListeningPart2A2',
          uiComponentKey: 'ListeningPart2A2UI',
          wrapperKey: 'ListeningPart2Wrapper',
          titleKey: 'practice.listening.a2.part2',
          descriptionKey: 'practice.listening.descriptions.a2.part2',
          navTitleKey: 'nav.practice.listening.part2',
          dataLoader: { listMethod: 'getListeningPart2Content', fetchMethod: 'getListeningPart2Content' },
          maxPoints: 5,
          timeMinutes: 7,
          scoringGroup: 'written',
          mockExamSectionName: 'Hörverstehen',
          mockExamPartName: 'Teil 2: Detailverstehen',
          mockExamSectionNumber: 3,
          hasExamSelection: true,
        },
        {
          id: 'listening-3',
          partNumber: 3,
          screenKey: 'ListeningPart3A2',
          uiComponentKey: 'ListeningPart3A2UI',
          wrapperKey: 'ListeningPart3Wrapper',
          titleKey: 'practice.listening.a2.part3',
          descriptionKey: 'practice.listening.descriptions.a2.part3',
          navTitleKey: 'nav.practice.listening.part3',
          dataLoader: { listMethod: 'getListeningPart3Content', fetchMethod: 'getListeningPart3Content' },
          maxPoints: 5,
          timeMinutes: 6,
          scoringGroup: 'written',
          mockExamSectionName: 'Hörverstehen',
          mockExamPartName: 'Teil 3: Selektives Verstehen',
          mockExamSectionNumber: 3,
          hasExamSelection: true,
        },
      ],
    },
    {
      id: 'writing',
      order: 4,
      enabled: true,
      menuTitleKey: 'practice.writing.title',
      menuDescriptionKey: 'practice.writing.description',
      menuBehavior: 'submenu',
      parts: [
        {
          id: 'writing-part1',
          partNumber: 1,
          screenKey: 'WritingPart1',
          uiComponentKey: 'WritingPart1UI',
          wrapperKey: 'WritingWrapper',
          titleKey: 'practice.writing.a2.part1',
          descriptionKey: 'practice.writing.descriptions.a2.part1',
          navTitleKey: 'nav.practice.writing.part1',
          dataLoader: { listMethod: 'getWritingPart1Exams', fetchMethod: 'getWritingPart1Exam' },
          maxPoints: 5,
          timeMinutes: 10,
          scoringGroup: 'written',
          mockExamSectionName: 'Schriftlicher Ausdruck',
          mockExamPartName: 'Teil 1: Formular ausfüllen',
          mockExamSectionNumber: 4,
          hasExamSelection: true,
        },
        {
          id: 'writing-part2',
          partNumber: 2,
          screenKey: 'WritingPart2',
          uiComponentKey: 'WritingPart2UI',
          wrapperKey: 'WritingWrapper',
          titleKey: 'practice.writing.a2.part2',
          descriptionKey: 'practice.writing.descriptions.a2.part2',
          navTitleKey: 'nav.practice.writing.part2',
          dataLoader: { listMethod: 'getWritingPart2Exams', fetchMethod: 'getWritingPart2Exam' },
          maxPoints: 10,
          scoreScaling: 1,
          timeMinutes: 15,
          scoringGroup: 'written',
          mockExamSectionName: 'Schriftlicher Ausdruck',
          mockExamPartName: 'Teil 2: Eine kurze Mitteilung',
          mockExamSectionNumber: 4,
          hasExamSelection: true,
        },
      ],
    },
    {
      id: 'speaking',
      order: 5,
      enabled: true,
      menuTitleKey: 'practice.speaking.title',
      menuDescriptionKey: 'practice.speaking.descriptions.main',
      menuBehavior: 'submenu',
      parts: [
        {
          id: 'speaking-1',
          partNumber: 1,
          screenKey: 'A1SpeakingPart1',
          uiComponentKey: 'A1SpeakingPart1UI',
          wrapperKey: 'A1SpeakingPart1Wrapper',
          titleKey: 'practice.speaking.part1',
          descriptionKey: 'practice.speaking.descriptions.part1',
          navTitleKey: 'nav.practice.speaking.part1',
          dataLoader: { listMethod: 'getA1SpeakingPart1Content', fetchMethod: 'getA1SpeakingPart1Content' },
          maxPoints: 3,
          timeMinutes: 3,
          scoringGroup: 'oral',
          mockExamSectionName: 'Mündlicher Ausdruck',
          mockExamPartName: 'Teil 1: Sich vorstellen',
          mockExamSectionNumber: 5,
          hasExamSelection: false,
          skipInMockExam: true,
        },
        {
          id: 'speaking-2',
          partNumber: 2,
          screenKey: 'A1SpeakingPart2',
          uiComponentKey: 'A1SpeakingPart2UI',
          wrapperKey: 'A1SpeakingPart2Wrapper',
          titleKey: 'practice.speaking.a2Part2',
          descriptionKey: 'speaking.a2Part2.menuDescription',
          navTitleKey: 'nav.practice.speaking.part2',
          dataLoader: { listMethod: 'getA1SpeakingPart2Content', fetchMethod: 'getA1SpeakingPart2Content' },
          maxPoints: 6,
          timeMinutes: 4,
          scoringGroup: 'oral',
          mockExamSectionName: 'Mündlicher Ausdruck',
          mockExamPartName: 'Teil 2: Ein Alltagsgespräch führen',
          mockExamSectionNumber: 5,
          hasExamSelection: false,
          skipInMockExam: true,
        },
        {
          id: 'speaking-3',
          partNumber: 3,
          screenKey: 'A1SpeakingPart3',
          uiComponentKey: 'A1SpeakingPart3UI',
          wrapperKey: 'A1SpeakingPart3Wrapper',
          titleKey: 'practice.speaking.a2Part3',
          descriptionKey: 'speaking.a2Part3.menuDescription',
          navTitleKey: 'nav.practice.speaking.part3',
          dataLoader: { listMethod: 'getA1SpeakingPart3Content', fetchMethod: 'getA1SpeakingPart3Content' },
          maxPoints: 6,
          timeMinutes: 4,
          scoringGroup: 'oral',
          mockExamSectionName: 'Mündlicher Ausdruck',
          mockExamPartName: 'Teil 3: Etwas aushandeln',
          mockExamSectionNumber: 5,
          hasExamSelection: false,
          skipInMockExam: true,
        },
      ],
    },
  ] as ExamSectionConfig[],

  // Mock Exam Configuration
  mockExam: {
    stepOrder: [
      'listening-1', 'listening-2', 'listening-3',
      'reading-1', 'reading-2', 'reading-3',
      'writing-part1', 'writing-part2',
      'speaking-1', 'speaking-2', 'speaking-3',
    ],
    scoringGroups: [
      {
        id: 'written',
        labelKey: 'mockExam.results.written',
        maxPoints: 45,
        passingPoints: 27,
        sectionNumbers: [1, 3, 4],
      },
      {
        id: 'oral',
        labelKey: 'mockExam.results.oral',
        maxPoints: 15,
        passingPoints: 9,
        sectionNumbers: [5],
      },
    ],
    totalMaxPoints: 60,
    passingTotalPoints: 36,
    skipSectionNumbers: [5],
    scoreMultiplier: 1,
  } as MockExamConfig,
};

