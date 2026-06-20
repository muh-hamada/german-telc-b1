/**
 * Goethe German A1 Exam Configuration
 * 
 * This is the configuration for the Goethe German A1 exam app.
 */

import { ExamConfig, ExamSectionConfig, MockExamConfig } from '../exam-config.types';

export const goetheGermanA1Config: ExamConfig = {
  // Basic Identity
  id: 'goethe-german-a1',
  language: 'german',
  level: 'A1',
  provider: 'goethe',
  
  // App Identity
  appName: 'GoetheGermanA1',
  displayName: 'Goethe German A1',

  bundleId: {
    android: 'com.mhamada.goethea1german',
    ios: 'com.mhamada.goethea1german',
  },
  
  // Theme Configuration
  theme: 'audiobook',
  
  // Firebase Collections (keeping existing collection names for backward compatibility)
  firebaseCollections: {
    examData: 'german_a1_telc_exam_data',              // Existing collection
    userProgress: 'users/{uid}/goethe_german_a1_progress/data',   // Fixed: Must be 4 segments for .doc() to work
    completions: 'users/{uid}/completions_goethe_german_a1',      // Lang and level in path (3 segments to allow appending 3 more for doc)
    streaks: 'users/{uid}/streaks/goethe-german-a1',              // Daily streaks tracking per exam
    vocabularyData: 'vocabulary_data_german_a1',           // Vocabulary words collection
    vocabularyProgress: 'users/{uid}/vocabulary_progress_goethe_german_a1/data', // User vocabulary progress
    speakingDialogues: 'users/{uid}/speaking_dialogues_goethe_german_a1', // Speaking assessments
  },
  
  // Exam Metadata (from existing exam-info.json)
  metadata: {
    cefrLevel: 'A1',
    totalDurationMinutes: 90,
    totalMaxPoints: 60,
    passingScore: 60,
  },
  
  // All features enabled for German A1
  features: {
    reading: true,
    listening: true,
    writing: true,
    speaking: true,
    grammar: true,
  },
  
  // Store IDs
  storeIds: {
    android: 'com.mhamada.goethea1german',
    ios: '6759726606',
  },

  ads: {
    appID: {
      android: 'ca-app-pub-5101905792101482~2106426459',
      ios: 'ca-app-pub-5101905792101482~9600047321',
    },
    banner: {
      android: 'ca-app-pub-5101905792101482/6560676787',
      ios: 'ca-app-pub-5101905792101482/2891168749',
    },
    rewarded: {
      android: 'ca-app-pub-5101905792101482/7023857007',
      ios: 'ca-app-pub-5101905792101482/3698176892',
    },
    userSupport: {
      android: 'ca-app-pub-5101905792101482/8336938678',
      ios: 'ca-app-pub-5101905792101482/6651643293',
    },
    vocabularyBuilder: {
      android: 'ca-app-pub-5101905792101482/2621431773',
      ios: 'ca-app-pub-5101905792101482/9233720398',
    },
    appOpen: {
      android: 'ca-app-pub-5101905792101482/1963102012',
      ios: 'ca-app-pub-5101905792101482/2072911095',
    },
  },

  premium: {
    productId: {
      android: 'full_access',
      ios: 'full_access_goethe_german_a1',
    },
  },

  writingEvaluationFnName: 'evaluateWritingGermanA1',

  // Exam Structure - A1 specific structure
  examStructure: {
    'reading': [1, 2, 3],
    'listening': [1, 2, 3],
    'writing': [1, 2],      // A1 has 2 writing parts
    'speaking': [1, 2, 3],
    // No grammar section in A1
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
          screenKey: 'ReadingPart1A1',
          uiComponentKey: 'ReadingPart1A1UI',
          wrapperKey: 'ReadingPart1Wrapper',
          titleKey: 'practice.reading.part1',
          descriptionKey: 'practice.reading.descriptions.part1',
          navTitleKey: 'nav.practice.reading.part1',
          dataLoader: { listMethod: 'getReadingPart1A1Exams', fetchMethod: 'getReadingPart1A1ExamById' },
          maxPoints: 5,
          timeMinutes: 9,
          scoringGroup: 'written',
          mockExamSectionName: 'Leseverstehen',
          mockExamPartName: 'Teil 1: Globalverstehen',
          mockExamSectionNumber: 1,
          hasExamSelection: true,
        },
        {
          id: 'reading-2',
          partNumber: 2,
          screenKey: 'ReadingPart2A1',
          uiComponentKey: 'ReadingPart2A1UI',
          wrapperKey: 'ReadingPart2Wrapper',
          titleKey: 'practice.reading.part2',
          descriptionKey: 'practice.reading.descriptions.part2',
          navTitleKey: 'nav.practice.reading.part2',
          dataLoader: { listMethod: 'getReadingPart2A1Exams', fetchMethod: 'getReadingPart2A1ExamById' },
          maxPoints: 5,
          timeMinutes: 8,
          scoringGroup: 'written',
          mockExamSectionName: 'Leseverstehen',
          mockExamPartName: 'Teil 2: Detailverstehen',
          mockExamSectionNumber: 1,
          hasExamSelection: true,
        },
        {
          id: 'reading-3',
          partNumber: 3,
          screenKey: 'ReadingPart3A1',
          uiComponentKey: 'ReadingPart3A1UI',
          wrapperKey: 'ReadingPart3Wrapper',
          titleKey: 'practice.reading.part3',
          descriptionKey: 'practice.reading.descriptions.part3',
          navTitleKey: 'nav.practice.reading.part3',
          dataLoader: { listMethod: 'getReadingPart3A1Exams', fetchMethod: 'getReadingPart3A1ExamById' },
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
          screenKey: 'ListeningPart1A1',
          uiComponentKey: 'ListeningPart1A1UI',
          wrapperKey: 'ListeningPart1Wrapper',
          titleKey: 'practice.listening.part1',
          descriptionKey: 'practice.listening.part1Description',
          navTitleKey: 'nav.practice.listening.part1',
          dataLoader: { listMethod: 'getListeningPart1Content', fetchMethod: 'getListeningPart1Content' },
          maxPoints: 6,
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
          screenKey: 'ListeningPart2A1',
          uiComponentKey: 'ListeningPart2A1UI',
          wrapperKey: 'ListeningPart2Wrapper',
          titleKey: 'practice.listening.part2',
          descriptionKey: 'practice.listening.part2Description',
          navTitleKey: 'nav.practice.listening.part2',
          dataLoader: { listMethod: 'getListeningPart2Content', fetchMethod: 'getListeningPart2Content' },
          maxPoints: 4,
          timeMinutes: 6,
          scoringGroup: 'written',
          mockExamSectionName: 'Hörverstehen',
          mockExamPartName: 'Teil 2: Detailverstehen',
          mockExamSectionNumber: 3,
          hasExamSelection: true,
        },
        {
          id: 'listening-3',
          partNumber: 3,
          screenKey: 'ListeningPart3A1',
          uiComponentKey: 'ListeningPart3A1UI',
          wrapperKey: 'ListeningPart3Wrapper',
          titleKey: 'practice.listening.part3',
          descriptionKey: 'practice.listening.part3Description',
          navTitleKey: 'nav.practice.listening.part3',
          dataLoader: { listMethod: 'getListeningPart3Content', fetchMethod: 'getListeningPart3Content' },
          maxPoints: 5,
          timeMinutes: 7,
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
          titleKey: 'practice.writing.part1',
          descriptionKey: 'practice.writing.descriptions.part1',
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
          titleKey: 'practice.writing.part2',
          descriptionKey: 'practice.writing.descriptions.part2',
          navTitleKey: 'nav.practice.writing.part2',
          dataLoader: { listMethod: 'getWritingPart2Exams', fetchMethod: 'getWritingPart2Exam' },
          maxPoints: 10,
          scoreScaling: 1,
          timeMinutes: 10,
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
          maxPoints: 5,
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
          titleKey: 'practice.speaking.part2',
          descriptionKey: 'practice.speaking.descriptions.part2',
          navTitleKey: 'nav.practice.speaking.part2',
          dataLoader: { listMethod: 'getA1SpeakingPart2Content', fetchMethod: 'getA1SpeakingPart2Content' },
          maxPoints: 5,
          timeMinutes: 4,
          scoringGroup: 'oral',
          mockExamSectionName: 'Mündlicher Ausdruck',
          mockExamPartName: 'Teil 2: Um Informationen bitten und Informationen geben',
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
          titleKey: 'practice.speaking.part3',
          descriptionKey: 'practice.speaking.descriptions.part3',
          navTitleKey: 'nav.practice.speaking.part3',
          dataLoader: { listMethod: 'getA1SpeakingPart3Content', fetchMethod: 'getA1SpeakingPart3Content' },
          maxPoints: 5,
          timeMinutes: 4,
          scoringGroup: 'oral',
          mockExamSectionName: 'Mündlicher Ausdruck',
          mockExamPartName: 'Teil 3: Bitte formulieren und darauf reagieren',
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

