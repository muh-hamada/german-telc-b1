/**
 * German TELC B2 Exam Configuration
 * 
 * This is the configuration for the existing German B2 exam app.
 * It maintains backward compatibility with the current setup.
 */

import { ExamConfig, ExamSectionConfig, MockExamConfig } from '../exam-config.types';

export const germanB2Config: ExamConfig = {
  // Basic Identity
  id: 'german-b2',
  language: 'german',
  level: 'B2',
  provider: 'telc',
  
  // App Identity
  appName: 'GermanTelcB2',
  displayName: 'German TELC B2',

  bundleId: {
    android: 'com.mhamada.telcb2german',
    ios: 'com.mhamada.telcb2german',
  },
  
  // Theme Configuration
  theme: 'default',
  
  // Firebase Collections (keeping existing collection names for backward compatibility)
  firebaseCollections: {
    examData: 'german_b2_telc_exam_data',              // Existing collection
    userProgress: 'users/{uid}/german_b2_progress/data',   // Fixed: Must be 4 segments for .doc() to work
    completions: 'users/{uid}/completions_german_b2',      // Lang and level in path (3 segments to allow appending 3 more for doc)
    streaks: 'users/{uid}/streaks/german-b2',              // Daily streaks tracking per exam
    vocabularyData: 'vocabulary_data_german_b2',           // Vocabulary words collection
    vocabularyProgress: 'users/{uid}/vocabulary_progress_german_b2/data', // User vocabulary progress
    speakingDialogues: 'users/{uid}/speaking_dialogues_german_b2', // Speaking assessments
  },
  
  // Exam Metadata (from existing exam-info.json)
  metadata: {
    cefrLevel: 'B2',
    totalDurationMinutes: 180,
    totalMaxPoints: 300,
    passingScore: 180,
  },
  
  // All features enabled for German B2
  features: {
    reading: true,
    listening: true,
    writing: true,
    speaking: true,
    grammar: true,
  },
  
  // Store IDs
  storeIds: {
    android: 'com.mhamada.telcb2german',
    ios: '6755521000',
  },

  ads: {
    appID: {
      android: 'ca-app-pub-5101905792101482~5846015787',
      ios: 'ca-app-pub-5101905792101482~5081566168',
    },
    banner: {
      android: 'ca-app-pub-5101905792101482/4713607959',
      ios: 'ca-app-pub-5101905792101482/2408845954',
    },
    rewarded: {
      android: 'ca-app-pub-5101905792101482/4612825162',
      ios: 'ca-app-pub-5101905792101482/8782682610',
    },
    userSupport: {
      android: 'ca-app-pub-5101905792101482/2149594149',
      ios: 'ca-app-pub-5101905792101482/4312830857',
    },
    vocabularyBuilder: {
      android: 'ca-app-pub-5101905792101482/9694021528',
      ios: 'ca-app-pub-5101905792101482/3000620666',
    },
    appOpen: {
      android: 'ca-app-pub-5101905792101482/5987317016',
      ios: 'ca-app-pub-5101905792101482/2375375068',
    },
  },

  premium: {
    productId: {
      android: 'full_access',
      ios: 'full_access_german_b2',
    },
  },

  writingEvaluationFnName: 'evaluateWritingB2',

  // Exam Structure - B2 has same structure as B1
  examStructure: {
    'grammar': [1, 2],
    'reading': [1, 2, 3],
    'writing': [1],         // B2 has only 1 writing part
    'speaking': [1, 2, 3],
    'listening': [1, 2, 3],
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
          dataLoader: { listMethod: 'getReadingPart2Exams', fetchMethod: 'getReadingPart2Exam' },
          maxPoints: 25,
          timeMinutes: 30,
          scoringGroup: 'written',
          mockExamSectionName: 'Leseverstehen',
          mockExamPartName: 'Teil 2: Detailverstehen',
          mockExamSectionNumber: 1,
          hasExamSelection: true,
        },
        {
          id: 'reading-3',
          partNumber: 3,
          screenKey: 'ReadingPart3',
          uiComponentKey: 'ReadingPart3UI',
          wrapperKey: 'ReadingPart3Wrapper',
          titleKey: 'practice.reading.part3',
          descriptionKey: 'practice.reading.descriptions.part3',
          navTitleKey: 'nav.practice.reading.part3',
          dataLoader: { listMethod: 'getReadingPart3Exams', fetchMethod: 'getReadingPart3Exam' },
          maxPoints: 25,
          timeMinutes: 30,
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
      enabled: true,
      menuTitleKey: 'practice.grammar.title',
      menuDescriptionKey: 'practice.grammar.descriptions.main',
      menuBehavior: 'submenu',
      parts: [
        {
          id: 'language-1',
          partNumber: 1,
          screenKey: 'GrammarPart1',
          uiComponentKey: 'GrammarPart1UI',
          wrapperKey: 'LanguagePart1Wrapper',
          titleKey: 'practice.grammar.part1',
          descriptionKey: 'practice.grammar.descriptions.main',
          navTitleKey: 'nav.practice.grammar.part1',
          dataLoader: { listMethod: 'getGrammarPart1Exams', fetchMethod: 'getGrammarPart1Exam' },
          maxPoints: 15,
          timeMinutes: 45,
          scoringGroup: 'written',
          mockExamSectionName: 'Sprachbausteine',
          mockExamPartName: 'Teil 1: Grammatik',
          mockExamSectionNumber: 2,
          hasExamSelection: true,
        },
        {
          id: 'language-2',
          partNumber: 2,
          screenKey: 'GrammarPart2',
          uiComponentKey: 'GrammarPart2UI',
          wrapperKey: 'LanguagePart2Wrapper',
          titleKey: 'practice.grammar.part2',
          descriptionKey: 'practice.grammar.descriptions.main',
          navTitleKey: 'nav.practice.grammar.part2',
          dataLoader: { listMethod: 'getGrammarPart2Exams', fetchMethod: 'getGrammarPart2Exam' },
          maxPoints: 15,
          timeMinutes: 45,
          scoringGroup: 'written',
          mockExamSectionName: 'Sprachbausteine',
          mockExamPartName: 'Teil 2: Lexik',
          mockExamSectionNumber: 2,
          hasExamSelection: true,
        },
      ],
      extraMenuItems: [
        {
          id: 'grammar-study',
          titleKey: 'practice.grammar.study.title',
          descriptionKey: 'practice.grammar.study.description',
          screenKey: 'GrammarStudy',
          titleParams: { count: 150 },
          descriptionParams: { count: 150 },
        },
      ],
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
          screenKey: 'ListeningPart1',
          uiComponentKey: 'ListeningPart1UI',
          wrapperKey: 'ListeningPart1Wrapper',
          titleKey: 'practice.listening.part1',
          descriptionKey: 'practice.listening.part1Description',
          navTitleKey: 'nav.practice.listening.part1',
          dataLoader: { listMethod: 'getListeningPart1Content', fetchMethod: 'getListeningPart1Content' },
          maxPoints: 25,
          timeMinutes: 10,
          scoringGroup: 'written',
          mockExamSectionName: 'Hörverstehen',
          mockExamPartName: 'Teil 1: Globalverstehen',
          mockExamSectionNumber: 3,
          hasExamSelection: true,
        },
        {
          id: 'listening-2',
          partNumber: 2,
          screenKey: 'ListeningPart2',
          uiComponentKey: 'ListeningPart2UI',
          wrapperKey: 'ListeningPart2Wrapper',
          titleKey: 'practice.listening.part2',
          descriptionKey: 'practice.listening.part2Description',
          navTitleKey: 'nav.practice.listening.part2',
          dataLoader: { listMethod: 'getListeningPart2Content', fetchMethod: 'getListeningPart2Content' },
          maxPoints: 25,
          timeMinutes: 10,
          scoringGroup: 'written',
          mockExamSectionName: 'Hörverstehen',
          mockExamPartName: 'Teil 2: Detailverstehen',
          mockExamSectionNumber: 3,
          hasExamSelection: true,
        },
        {
          id: 'listening-3',
          partNumber: 3,
          screenKey: 'ListeningPart3',
          uiComponentKey: 'ListeningPart3UI',
          wrapperKey: 'ListeningPart3Wrapper',
          titleKey: 'practice.listening.part3',
          descriptionKey: 'practice.listening.part3Description',
          navTitleKey: 'nav.practice.listening.part3',
          dataLoader: { listMethod: 'getListeningPart3Content', fetchMethod: 'getListeningPart3Content' },
          maxPoints: 25,
          timeMinutes: 10,
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
      menuBehavior: 'modal',
      parts: [
        {
          id: 'writing',
          partNumber: 1,
          screenKey: 'WritingPart1',
          uiComponentKey: 'WritingUI',
          wrapperKey: 'WritingWrapper',
          titleKey: 'practice.writing.part1',
          descriptionKey: 'practice.writing.descriptions.part1',
          navTitleKey: 'nav.practice.writing.part1',
          dataLoader: { listMethod: 'getWritingPart1Exams', fetchMethod: 'getWritingExam' },
          maxPoints: 45,
          scoreScaling: 1,
          timeMinutes: 30,
          scoringGroup: 'written',
          mockExamSectionName: 'Schriftlicher Ausdruck',
          mockExamPartName: 'Schreiben einer E-Mail',
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
          screenKey: 'B2SpeakingPart1',
          uiComponentKey: 'B2SpeakingPart1UI',
          titleKey: 'speaking.b2Part1.menuTitle',
          descriptionKey: 'speaking.b2Part1.menuDescription',
          navTitleKey: 'speaking.b2Part1.title',
          dataLoader: { listMethod: 'getSpeakingB2Part1Content', fetchMethod: 'getSpeakingB2Part1Content', listResponseKey: 'topics' },
          navigationParamKey: 'topicId',
          modalItemType: 'exam.topic',
          maxPoints: 15,
          timeMinutes: 3,
          scoringGroup: 'oral',
          mockExamSectionName: 'Mündlicher Ausdruck',
          mockExamPartName: 'Teil 1: Einander kennenlernen',
          mockExamSectionNumber: 5,
          hasExamSelection: true,
          skipInMockExam: true,
        },
        {
          id: 'speaking-2',
          partNumber: 2,
          screenKey: 'B2SpeakingPart2',
          uiComponentKey: 'B2SpeakingPart2UI',
          titleKey: 'speaking.b2Part2.menuTitle',
          descriptionKey: 'speaking.b2Part2.menuDescription',
          navTitleKey: 'speaking.b2Part2.title',
          dataLoader: { listMethod: 'getSpeakingB2Part2Content', fetchMethod: 'getSpeakingB2Part2Content', listResponseKey: 'questions' },
          navigationParamKey: 'topicId',
          modalItemType: 'exam.topic',
          maxPoints: 30,
          timeMinutes: 6,
          scoringGroup: 'oral',
          mockExamSectionName: 'Mündlicher Ausdruck',
          mockExamPartName: 'Teil 2: Über ein Thema sprechen',
          mockExamSectionNumber: 5,
          hasExamSelection: true,
          skipInMockExam: true,
        },
        {
          id: 'speaking-3',
          partNumber: 3,
          screenKey: 'B2SpeakingPart3',
          uiComponentKey: 'B2SpeakingPart3UI',
          titleKey: 'speaking.b2Part3.menuTitle',
          descriptionKey: 'speaking.b2Part3.menuDescription',
          navTitleKey: 'speaking.b2Part3.title',
          dataLoader: { listMethod: 'getSpeakingB2Part3Content', fetchMethod: 'getSpeakingB2Part3Content', listResponseKey: 'questions' },
          navigationParamKey: 'questionId',
          modalItemType: 'exam.topic',
          maxPoints: 30,
          timeMinutes: 6,
          scoringGroup: 'oral',
          mockExamSectionName: 'Mündlicher Ausdruck',
          mockExamPartName: 'Teil 3: Gemeinsam etwas planen',
          mockExamSectionNumber: 5,
          hasExamSelection: true,
          skipInMockExam: true,
        },
      ],
      extraMenuItems: [
        {
          id: 'b2-speaking-structure',
          titleKey: 'speaking.b2Structure.menuTitle',
          descriptionKey: 'speaking.b2Structure.menuDescription',
          screenKey: 'B2SpeakingStructure',
        },
      ],
    },
  ] as ExamSectionConfig[],

  // Mock Exam Configuration
  mockExam: {
    stepOrder: [
      'reading-1', 'reading-2', 'reading-3',
      'language-1', 'language-2',
      'listening-1', 'listening-2', 'listening-3',
      'writing',
      'speaking-1', 'speaking-2', 'speaking-3',
    ],
    scoringGroups: [
      {
        id: 'written',
        labelKey: 'mockExam.results.written',
        maxPoints: 225,
        passingPoints: 135,
        sectionNumbers: [1, 2, 3, 4],
      },
      {
        id: 'oral',
        labelKey: 'mockExam.results.oral',
        maxPoints: 75,
        passingPoints: 45,
        sectionNumbers: [5],
      },
    ],
    totalMaxPoints: 300,
    passingTotalPoints: 180,
    skipSectionNumbers: [5],
    scoreMultiplier: 3,
  } as MockExamConfig,
};

