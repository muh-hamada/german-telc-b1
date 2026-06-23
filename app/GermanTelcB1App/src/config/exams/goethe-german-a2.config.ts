/**
 * Goethe German A2 Exam Configuration
 * 
 * This is the configuration for the Goethe-Zertifikat A2 exam app.
 * 
 * Key differences from Telc A2:
 * - 4 reading parts (vs 3 in Telc A2)
 * - 4 listening parts (vs 3 in Telc A2)
 * - 2 writing parts (both free-text, no form-filling)
 * - 100 total points (25 per section × 4), passing: 60%
 * - Written: 75 pts (3 sections × 25), Oral: 25 pts (speaking)
 * 
 * Question type mapping:
 * - Reading Part 1: Newspaper text + multi-choice → reuses ReadingPart2A2 screen
 * - Reading Part 2: Kaufhaus directory + multi-choice → reuses ReadingPart1A2 screen  
 * - Reading Part 3: Email + multi-choice → reuses ReadingPart2A2 screen
 * - Reading Part 4: Match people to ads → reuses ReadingPart3A2 screen
 * - Listening Part 1: Short texts + multi-choice → reuses ListeningPart2A2 screen
 * - Listening Part 2: Conversation + matching → reuses ListeningPart3A2 screen
 * - Listening Part 3: Short conversations + multi-choice → reuses ListeningPart2A2 screen
 * - Listening Part 4: Interview + Ja/Nein → reuses ListeningPart2 (B1) screen
 * - Writing Part 1: Informal SMS → reuses WritingPart2 screen
 * - Writing Part 2: Formal email → reuses WritingPart2 screen
 * - Speaking: reuses A2 speaking parts (A1SpeakingPart1/2/3)
 */

import { ExamConfig } from '../exam-config.types';

export const goetheGermanA2Config: ExamConfig = {
  // Basic Identity
  id: 'goethe-german-a2',
  language: 'german',
  level: 'A2',
  provider: 'goethe',
  
  // App Identity
  appName: 'GoetheGermanA2',
  displayName: 'Goethe German A2',

  bundleId: {
    android: 'com.mhamada.goethea2german',
    ios: 'com.mhamada.goethea2german',
  },
  
  // Theme Configuration
  theme: 'audiobook',
  
  // Firebase Collections
  firebaseCollections: {
    examData: 'goethe_german_a2_exam_data',
    userProgress: 'users/{uid}/goethe_german_a2_progress/data',
    completions: 'users/{uid}/completions_goethe_german_a2',
    streaks: 'users/{uid}/streaks/goethe-german-a2',
    vocabularyData: 'vocabulary_data_german_a2',
    vocabularyProgress: 'users/{uid}/vocabulary_progress_goethe_german_a2/data',
    speakingDialogues: 'users/{uid}/speaking_dialogues_goethe_german_a2',
  },
  
  // Exam Metadata
  metadata: {
    cefrLevel: 'A2',
    totalDurationMinutes: 105,
    totalMaxPoints: 100,
    passingScore: 60,
  },
  
  // Features
  features: {
    reading: true,
    listening: true,
    writing: true,
    speaking: true,
    grammar: false,
  },
  
  // Store IDs (placeholder — to be updated after app store submission)
  storeIds: {
    android: 'com.mhamada.goethea2german',
    ios: '',
  },

  ads: {
    appID: {
      android: '',
      ios: '',
    },
    banner: {
      android: '',
      ios: '',
    },
    rewarded: {
      android: '',
      ios: '',
    },
    userSupport: {
      android: '',
      ios: '',
    },
    vocabularyBuilder: {
      android: '',
      ios: '',
    },
    appOpen: {
      android: '',
      ios: '',
    },
  },

  premium: {
    productId: {
      android: 'full_access',
      ios: 'full_access_goethe_german_a2',
    },
  },

  writingEvaluationFnName: 'evaluateWritingGermanA2',

  // Exam Structure — Goethe A2 has 4 reading parts, 4 listening parts
  examStructure: {
    'reading': [1, 2, 3, 4],
    'listening': [1, 2, 3, 4],
    'writing': [1, 2],
    'speaking': [1, 2, 3],
  },

  // Declarative Exam Sections Configuration
  sections: [
    // ===== READING (Lesen) — 30 min, 4 parts, 20 items =====
    {
      id: 'reading',
      order: 1,
      enabled: true,
      menuTitleKey: 'practice.reading.title',
      menuDescriptionKey: 'practice.reading.descriptions.main',
      menuBehavior: 'submenu',
      parts: [
        {
          // Part 1: Read newspaper text, answer 5 multi-choice questions
          // Reuses ReadingPart2A2 screen (text + multi-choice with answers[])
          id: 'reading-1',
          partNumber: 1,
          screenKey: 'ReadingPart2A2',
          uiComponentKey: 'ReadingPart2A2UI',
          wrapperKey: 'ReadingPart2Wrapper',
          titleKey: 'practice.reading.goetheA2.part1',
          descriptionKey: 'practice.reading.descriptions.goetheA2.part1',
          navTitleKey: 'nav.practice.reading.part1',
          dataLoader: { listMethod: 'getReadingPart1GoetheA2Exams', fetchMethod: 'getReadingPart1GoetheA2ExamById' },
          maxPoints: 5,
          timeMinutes: 8,
          scoringGroup: 'written',
          mockExamSectionName: 'Leseverstehen',
          mockExamPartName: 'Teil 1: Medientexte verstehen',
          mockExamSectionNumber: 1,
          hasExamSelection: true,
        },
        {
          // Part 2: Read Kaufhaus info board, answer 5 multi-choice questions
          // Reuses ReadingPart1A2 screen (building directory with information{} + options[])
          id: 'reading-2',
          partNumber: 2,
          screenKey: 'ReadingPart1A2',
          uiComponentKey: 'ReadingPart1A2UI',
          wrapperKey: 'ReadingPart1Wrapper',
          titleKey: 'practice.reading.goetheA2.part2',
          descriptionKey: 'practice.reading.descriptions.goetheA2.part2',
          navTitleKey: 'nav.practice.reading.part2',
          dataLoader: { listMethod: 'getReadingPart2GoetheA2Exams', fetchMethod: 'getReadingPart2GoetheA2ExamById' },
          maxPoints: 5,
          timeMinutes: 8,
          scoringGroup: 'written',
          mockExamSectionName: 'Leseverstehen',
          mockExamPartName: 'Teil 2: Informationstafeln verstehen',
          mockExamSectionNumber: 1,
          hasExamSelection: true,
        },
        {
          // Part 3: Read email, answer 5 multi-choice questions
          // Reuses ReadingPart2A2 screen (same as Part 1 — text + multi-choice)
          id: 'reading-3',
          partNumber: 3,
          screenKey: 'ReadingPart2A2',
          uiComponentKey: 'ReadingPart2A2UI',
          wrapperKey: 'ReadingPart2Wrapper',
          titleKey: 'practice.reading.goetheA2.part3',
          descriptionKey: 'practice.reading.descriptions.goetheA2.part3',
          navTitleKey: 'nav.practice.reading.part3',
          dataLoader: { listMethod: 'getReadingPart3GoetheA2Exams', fetchMethod: 'getReadingPart3GoetheA2ExamById' },
          maxPoints: 5,
          timeMinutes: 7,
          scoringGroup: 'written',
          mockExamSectionName: 'Leseverstehen',
          mockExamPartName: 'Teil 3: Korrespondenz verstehen',
          mockExamSectionNumber: 1,
          hasExamSelection: true,
        },
        {
          // Part 4: Match 5 people to ads (a-f), one gets "x" (no match)
          // Reuses ReadingPart3A2 screen (advertisements{} + answer matching)
          id: 'reading-4',
          partNumber: 4,
          screenKey: 'ReadingPart3A2',
          uiComponentKey: 'ReadingPart3A2UI',
          wrapperKey: 'ReadingPart3Wrapper',
          titleKey: 'practice.reading.goetheA2.part4',
          descriptionKey: 'practice.reading.descriptions.goetheA2.part4',
          navTitleKey: 'nav.practice.reading.part4',
          dataLoader: { listMethod: 'getReadingPart4GoetheA2Exams', fetchMethod: 'getReadingPart4GoetheA2ExamById' },
          maxPoints: 5,
          timeMinutes: 7,
          scoringGroup: 'written',
          mockExamSectionName: 'Leseverstehen',
          mockExamPartName: 'Teil 4: Anzeigen verstehen',
          mockExamSectionNumber: 1,
          hasExamSelection: true,
        },
      ],
    },

    // ===== GRAMMAR (disabled for Goethe A2) =====
    {
      id: 'grammar',
      order: 2,
      enabled: false,
      menuTitleKey: 'practice.grammar.title',
      menuDescriptionKey: 'practice.grammar.descriptions.main',
      menuBehavior: 'submenu',
      parts: [],
    },

    // ===== LISTENING (Hören) — 30 min, 4 parts, 20 items =====
    {
      id: 'listening',
      order: 3,
      enabled: true,
      menuTitleKey: 'practice.listening.title',
      menuDescriptionKey: 'practice.listening.descriptions.main',
      menuBehavior: 'submenu',
      parts: [
        {
          // Part 1: 5 short texts (heard twice), 3-option multi-choice
          // Reuses ListeningPart2A2 screen (multi-choice with options[])
          id: 'listening-1',
          partNumber: 1,
          screenKey: 'ListeningPart2A2',
          uiComponentKey: 'ListeningPart2A2UI',
          wrapperKey: 'ListeningPart2Wrapper',
          titleKey: 'practice.listening.goetheA2.part1',
          descriptionKey: 'practice.listening.descriptions.goetheA2.part1',
          navTitleKey: 'nav.practice.listening.part1',
          dataLoader: { listMethod: 'getListeningPart1GoetheA2Content', fetchMethod: 'getListeningPart1GoetheA2Content' },
          maxPoints: 5,
          timeMinutes: 7,
          scoringGroup: 'written',
          mockExamSectionName: 'Hörverstehen',
          mockExamPartName: 'Teil 1: Kurze Texte verstehen',
          mockExamSectionNumber: 3,
          hasExamSelection: true,
        },
        {
          // Part 2: 1 conversation (heard once), match days to activities (a-i)
          // Reuses ListeningPart3A2 screen (matching with options{} + answer)
          id: 'listening-2',
          partNumber: 2,
          screenKey: 'ListeningPart3A2',
          uiComponentKey: 'ListeningPart3A2UI',
          wrapperKey: 'ListeningPart3Wrapper',
          titleKey: 'practice.listening.goetheA2.part2',
          descriptionKey: 'practice.listening.descriptions.goetheA2.part2',
          navTitleKey: 'nav.practice.listening.part2',
          dataLoader: { listMethod: 'getListeningPart2GoetheA2Content', fetchMethod: 'getListeningPart2GoetheA2Content' },
          maxPoints: 5,
          timeMinutes: 7,
          scoringGroup: 'written',
          mockExamSectionName: 'Hörverstehen',
          mockExamPartName: 'Teil 2: Gespräch verstehen',
          mockExamSectionNumber: 3,
          hasExamSelection: true,
        },
        {
          // Part 3: 5 short conversations (heard once), multi-choice
          // Reuses ListeningPart2A2 screen (multi-choice with options[])
          id: 'listening-3',
          partNumber: 3,
          screenKey: 'ListeningPart2A2',
          uiComponentKey: 'ListeningPart2A2UI',
          wrapperKey: 'ListeningPart2Wrapper',
          titleKey: 'practice.listening.goetheA2.part3',
          descriptionKey: 'practice.listening.descriptions.goetheA2.part3',
          navTitleKey: 'nav.practice.listening.part3',
          dataLoader: { listMethod: 'getListeningPart3GoetheA2Content', fetchMethod: 'getListeningPart3GoetheA2Content' },
          maxPoints: 5,
          timeMinutes: 7,
          scoringGroup: 'written',
          mockExamSectionName: 'Hörverstehen',
          mockExamPartName: 'Teil 3: Einzelgespräche verstehen',
          mockExamSectionNumber: 3,
          hasExamSelection: true,
        },
        {
          // Part 4: Interview (heard twice), 5 Ja/Nein (true/false) questions
          // Reuses ListeningPart2 (B1) screen (statements[] + is_correct)
          id: 'listening-4',
          partNumber: 4,
          screenKey: 'ListeningPart2',
          uiComponentKey: 'ListeningPart2UI',
          wrapperKey: 'ListeningPart2Wrapper',
          titleKey: 'practice.listening.goetheA2.part4',
          descriptionKey: 'practice.listening.descriptions.goetheA2.part4',
          navTitleKey: 'nav.practice.listening.part4',
          dataLoader: { listMethod: 'getListeningPart4GoetheA2Content', fetchMethod: 'getListeningPart4GoetheA2Content' },
          maxPoints: 5,
          timeMinutes: 9,
          scoringGroup: 'written',
          mockExamSectionName: 'Hörverstehen',
          mockExamPartName: 'Teil 4: Radiointerview verstehen',
          mockExamSectionNumber: 3,
          hasExamSelection: true,
        },
      ],
    },

    // ===== WRITING (Schreiben) — 30 min, 2 parts =====
    {
      id: 'writing',
      order: 4,
      enabled: true,
      menuTitleKey: 'practice.writing.title',
      menuDescriptionKey: 'practice.writing.description',
      menuBehavior: 'submenu',
      parts: [
        {
          // Part 1: Informal SMS/message (20-30 words, 3 bullet points)
          // Reuses WritingPart2 screen (writingPoints + instruction + modalAnswer)
          id: 'writing-part1',
          partNumber: 1,
          screenKey: 'WritingPart2',
          uiComponentKey: 'WritingPart2UI',
          wrapperKey: 'WritingWrapper',
          titleKey: 'practice.writing.goetheA2.part1',
          descriptionKey: 'practice.writing.descriptions.goetheA2.part1',
          navTitleKey: 'nav.practice.writing.part1',
          dataLoader: { listMethod: 'getWritingPart1Exams', fetchMethod: 'getWritingPart1Exam' },
          maxPoints: 10,
          scoreScaling: 1,
          timeMinutes: 15,
          scoringGroup: 'written',
          mockExamSectionName: 'Schriftlicher Ausdruck',
          mockExamPartName: 'Teil 1: Persönliche Mitteilung',
          mockExamSectionNumber: 4,
          hasExamSelection: true,
        },
        {
          // Part 2: Formal email (30-40 words, 3 bullet points)
          // Reuses WritingPart2 screen (same schema as Part 1)
          id: 'writing-part2',
          partNumber: 2,
          screenKey: 'WritingPart2',
          uiComponentKey: 'WritingPart2UI',
          wrapperKey: 'WritingWrapper',
          titleKey: 'practice.writing.goetheA2.part2',
          descriptionKey: 'practice.writing.descriptions.goetheA2.part2',
          navTitleKey: 'nav.practice.writing.part2',
          dataLoader: { listMethod: 'getWritingPart2Exams', fetchMethod: 'getWritingPart2Exam' },
          maxPoints: 10,
          scoreScaling: 1,
          timeMinutes: 15,
          scoringGroup: 'written',
          mockExamSectionName: 'Schriftlicher Ausdruck',
          mockExamPartName: 'Teil 2: Halbformelle Mitteilung',
          mockExamSectionNumber: 4,
          hasExamSelection: true,
        },
      ],
    },

    // ===== SPEAKING (Sprechen) — 15 min, 3 parts — reuses A2/A1 speaking =====
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
          maxPoints: 8,
          timeMinutes: 5,
          scoringGroup: 'oral',
          mockExamSectionName: 'Mündlicher Ausdruck',
          mockExamPartName: 'Teil 1: Fragen zur Person',
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
          titleKey: 'practice.speaking.goetheA2Part2',
          descriptionKey: 'speaking.goetheA2Part2.menuDescription',
          navTitleKey: 'nav.practice.speaking.part2',
          dataLoader: { listMethod: 'getA1SpeakingPart2Content', fetchMethod: 'getA1SpeakingPart2Content' },
          maxPoints: 8,
          timeMinutes: 5,
          scoringGroup: 'oral',
          mockExamSectionName: 'Mündlicher Ausdruck',
          mockExamPartName: 'Teil 2: Von sich erzählen',
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
          titleKey: 'practice.speaking.goetheA2Part3',
          descriptionKey: 'speaking.goetheA2Part3.menuDescription',
          navTitleKey: 'nav.practice.speaking.part3',
          dataLoader: { listMethod: 'getA1SpeakingPart3Content', fetchMethod: 'getA1SpeakingPart3Content' },
          maxPoints: 9,
          timeMinutes: 5,
          scoringGroup: 'oral',
          mockExamSectionName: 'Mündlicher Ausdruck',
          mockExamPartName: 'Teil 3: Etwas aushandeln',
          mockExamSectionNumber: 5,
          hasExamSelection: false,
          skipInMockExam: true,
        },
      ],
    },
  ],

  // Mock Exam Configuration
  // Goethe A2: 100 total points (75 written + 25 oral), passing 60%
  // Written exam only (speaking skipped in mock):
  //   Reading: 5+5+5+5 = 20 items × 1.25 = 25 points
  //   Listening: 5+5+5+5 = 20 items × 1.25 = 25 points
  //   Writing: Part 1 (10) + Part 2 (10) = 20 → × 1.25 = 25 points
  //   Speaking: 8+8+9 = 25 points (skipped in mock)
  mockExam: {
    stepOrder: [
      'listening-1', 'listening-2', 'listening-3', 'listening-4',
      'reading-1', 'reading-2', 'reading-3', 'reading-4',
      'writing-part1', 'writing-part2',
      'speaking-1', 'speaking-2', 'speaking-3',
    ],
    scoringGroups: [
      {
        id: 'written',
        labelKey: 'mockExam.results.written',
        maxPoints: 75,
        passingPoints: 45,
        sectionNumbers: [1, 3, 4],
      },
      {
        id: 'oral',
        labelKey: 'mockExam.results.oral',
        maxPoints: 25,
        passingPoints: 15,
        sectionNumbers: [5],
      },
    ],
    totalMaxPoints: 100,
    passingTotalPoints: 60,
    skipSectionNumbers: [5],
    scoreMultiplier: 1.25,
  },
};
