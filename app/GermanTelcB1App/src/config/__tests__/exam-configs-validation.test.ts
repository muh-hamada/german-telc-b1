// Mock all wrapper and screen imports to avoid native module dependency chain
jest.mock('../../components/exam-wrappers/DeleGrammarPart1Wrapper', () => () => null);
jest.mock('../../components/exam-wrappers/DeleGrammarPart2Wrapper', () => () => null);
jest.mock('../../components/exam-wrappers/DeleListeningPart1Wrapper', () => () => null);
jest.mock('../../components/exam-wrappers/DeleListeningPart2Wrapper', () => () => null);
jest.mock('../../components/exam-wrappers/DeleListeningPart3Wrapper', () => () => null);
jest.mock('../../components/exam-wrappers/DeleListeningPart4Wrapper', () => () => null);
jest.mock('../../components/exam-wrappers/DeleListeningPart5Wrapper', () => () => null);
jest.mock('../../components/exam-wrappers/DeleReadingPart1Wrapper', () => () => null);
jest.mock('../../components/exam-wrappers/DeleReadingPart2Wrapper', () => () => null);
jest.mock('../../components/exam-wrappers/DeleReadingPart3Wrapper', () => () => null);
jest.mock('../../components/exam-wrappers/LanguagePart1Wrapper', () => () => null);
jest.mock('../../components/exam-wrappers/LanguagePart2Wrapper', () => () => null);
jest.mock('../../components/exam-wrappers/ListeningPart1Wrapper', () => () => null);
jest.mock('../../components/exam-wrappers/ListeningPart2Wrapper', () => () => null);
jest.mock('../../components/exam-wrappers/ListeningPart3Wrapper', () => () => null);
jest.mock('../../components/exam-wrappers/ReadingPart1Wrapper', () => () => null);
jest.mock('../../components/exam-wrappers/ReadingPart2Wrapper', () => () => null);
jest.mock('../../components/exam-wrappers/ReadingPart3Wrapper', () => () => null);
jest.mock('../../components/exam-wrappers/WritingWrapper', () => () => null);
jest.mock('../../screens/HomeScreen', () => () => null);
jest.mock('../../screens/ExamStructureScreen', () => () => null);
jest.mock('../../screens/practice/PracticeMenuScreen', () => () => null);
jest.mock('../../screens/practice/SectionMenuScreen', () => () => null);
jest.mock('../../screens/practice/ReadingPart1Screen', () => () => null);
jest.mock('../../screens/practice/ReadingPart1A1Screen', () => () => null);
jest.mock('../../screens/practice/ReadingPart2Screen', () => () => null);
jest.mock('../../screens/practice/ReadingPart2A1Screen', () => () => null);
jest.mock('../../screens/practice/ReadingPart3Screen', () => () => null);
jest.mock('../../screens/practice/ReadingPart3A1Screen', () => () => null);
jest.mock('../../screens/practice/ReadingPart1A2Screen', () => () => null);
jest.mock('../../screens/practice/ReadingPart2A2Screen', () => () => null);
jest.mock('../../screens/practice/ReadingPart3A2Screen', () => () => null);
jest.mock('../../screens/practice/GrammarPart1Screen', () => () => null);
jest.mock('../../screens/practice/GrammarPart2Screen', () => () => null);
jest.mock('../../screens/practice/GrammarStudyScreen', () => () => null);
jest.mock('../../screens/practice/WritingScreen', () => () => null);
jest.mock('../../screens/practice/WritingPart1Screen', () => () => null);
jest.mock('../../screens/practice/WritingPart2Screen', () => () => null);
jest.mock('../../screens/practice/SpeakingPart1Screen', () => () => null);
jest.mock('../../screens/practice/SpeakingPart2Screen', () => () => null);
jest.mock('../../screens/practice/SpeakingPart3Screen', () => () => null);
jest.mock('../../screens/practice/SpeakingImportantPhrasesScreen', () => () => null);
jest.mock('../../screens/practice/A1SpeakingPart1Screen', () => () => null);
jest.mock('../../screens/practice/A1SpeakingPart2Screen', () => () => null);
jest.mock('../../screens/practice/A1SpeakingPart3Screen', () => () => null);
jest.mock('../../screens/practice/SpeakingB2StructureScreen', () => () => null);
jest.mock('../../screens/practice/SpeakingB2Part1Screen', () => () => null);
jest.mock('../../screens/practice/SpeakingB2Part2Screen', () => () => null);
jest.mock('../../screens/practice/SpeakingB2Part3Screen', () => () => null);
jest.mock('../../screens/dele/DeleSpeakingAllPartsScreen', () => () => null);
jest.mock('../../screens/practice/ListeningPart1Screen', () => () => null);
jest.mock('../../screens/practice/ListeningPart1A1Screen', () => () => null);
jest.mock('../../screens/practice/ListeningPart2Screen', () => () => null);
jest.mock('../../screens/practice/ListeningPart2A1Screen', () => () => null);
jest.mock('../../screens/practice/ListeningPart3Screen', () => () => null);
jest.mock('../../screens/practice/ListeningPart3A1Screen', () => () => null);
jest.mock('../../screens/practice/ListeningPart1A2Screen', () => () => null);
jest.mock('../../screens/practice/ListeningPart2A2Screen', () => () => null);
jest.mock('../../screens/practice/ListeningPart3A2Screen', () => () => null);
jest.mock('../../screens/practice/ListeningPart4Screen', () => () => null);
jest.mock('../../screens/practice/ListeningPart5Screen', () => () => null);
jest.mock('../../screens/practice/ListeningPracticeListScreen', () => () => null);
jest.mock('../../screens/practice/ListeningPracticeScreen', () => () => null);
jest.mock('../../screens/practice/ListeningPracticeQuestionsScreen', () => () => null);
jest.mock('../../screens/VocabularyHomeScreen', () => () => null);
jest.mock('../../screens/VocabularyOnboardingScreen', () => () => null);
jest.mock('../../screens/VocabularyStudyNewScreen', () => () => null);
jest.mock('../../screens/VocabularyReviewScreen', () => () => null);
jest.mock('../../screens/VocabularyProgressScreen', () => () => null);
jest.mock('../../screens/VocabularyStudiedListScreen', () => () => null);
jest.mock('../../screens/prep-plan/AssessmentResultsScreen', () => () => null);
jest.mock('../../screens/prep-plan/SpeakingAssessmentScreen', () => () => null);

import { germanB1Config } from '../exams/german-b1.config';
import { SCREEN_REGISTRY } from '../../utils/screen-registry';
import { WRAPPER_REGISTRY } from '../../utils/wrapper-registry';

describe('German B1 Config Validation', () => {
  it('has sections defined', () => {
    expect(germanB1Config.sections).toBeDefined();
    expect(germanB1Config.sections!.length).toBeGreaterThan(0);
  });

  it('has mockExam defined', () => {
    expect(germanB1Config.mockExam).toBeDefined();
  });

  describe('sections schema completeness', () => {
    it('has 5 sections (reading, grammar, listening, writing, speaking)', () => {
      expect(germanB1Config.sections).toHaveLength(5);
      const ids = germanB1Config.sections!.map(s => s.id);
      expect(ids).toContain('reading');
      expect(ids).toContain('grammar');
      expect(ids).toContain('listening');
      expect(ids).toContain('writing');
      expect(ids).toContain('speaking');
    });

    it('reading has 3 parts', () => {
      const reading = germanB1Config.sections!.find(s => s.id === 'reading')!;
      expect(reading.parts).toHaveLength(3);
    });

    it('grammar has 2 parts', () => {
      const grammar = germanB1Config.sections!.find(s => s.id === 'grammar')!;
      expect(grammar.parts).toHaveLength(2);
    });

    it('listening has 3 parts', () => {
      const listening = germanB1Config.sections!.find(s => s.id === 'listening')!;
      expect(listening.parts).toHaveLength(3);
    });

    it('writing has 1 part', () => {
      const writing = germanB1Config.sections!.find(s => s.id === 'writing')!;
      expect(writing.parts).toHaveLength(1);
    });

    it('speaking has 3 parts', () => {
      const speaking = germanB1Config.sections!.find(s => s.id === 'speaking')!;
      expect(speaking.parts).toHaveLength(3);
    });

    it('all parts have required fields', () => {
      for (const section of germanB1Config.sections!) {
        for (const part of section.parts) {
          expect(part.id).toBeTruthy();
          expect(part.partNumber).toBeGreaterThan(0);
          expect(part.screenKey).toBeTruthy();
          expect(part.wrapperKey).toBeTruthy();
          expect(part.titleKey).toBeTruthy();
          expect(part.descriptionKey).toBeTruthy();
          expect(part.navTitleKey).toBeTruthy();
          expect(part.dataLoader.listMethod).toBeTruthy();
          expect(part.dataLoader.fetchMethod).toBeTruthy();
          expect(part.maxPoints).toBeGreaterThanOrEqual(0);
          expect(part.timeMinutes).toBeGreaterThan(0);
          expect(part.scoringGroup).toBeTruthy();
          expect(part.mockExamSectionName).toBeTruthy();
          expect(part.mockExamPartName).toBeTruthy();
          expect(part.mockExamSectionNumber).toBeGreaterThan(0);
          expect(typeof part.hasExamSelection).toBe('boolean');
        }
      }
    });
  });

  describe('screenKey validation', () => {
    it('all screenKey values exist in SCREEN_REGISTRY', () => {
      for (const section of germanB1Config.sections!) {
        for (const part of section.parts) {
          expect(SCREEN_REGISTRY).toHaveProperty(
            part.screenKey,
            expect.anything(),
          );
        }
      }
    });
  });

  describe('wrapperKey validation', () => {
    it('all wrapperKey values exist in WRAPPER_REGISTRY', () => {
      for (const section of germanB1Config.sections!) {
        for (const part of section.parts) {
          // Speaking parts don't have wrappers in the mock exam (they are skipped)
          if (part.skipInMockExam) return;
          expect(WRAPPER_REGISTRY).toHaveProperty(
            part.wrapperKey,
            expect.anything(),
          );
        }
      }
    });
  });

  describe('mockExam configuration', () => {
    it('stepOrder references valid part IDs from sections', () => {
      const allPartIds = germanB1Config.sections!.flatMap(s => s.parts.map(p => p.id));
      for (const stepId of germanB1Config.mockExam!.stepOrder) {
        expect(allPartIds).toContain(stepId);
      }
    });

    it('scoring groups cover all non-skipped section numbers', () => {
      const allSectionNumbers = new Set(
        germanB1Config.mockExam!.scoringGroups.flatMap(g => g.sectionNumbers),
      );
      const skipNumbers = new Set(germanB1Config.mockExam!.skipSectionNumbers);
      const partSectionNumbers = new Set(
        germanB1Config.sections!.flatMap(s => s.parts.map(p => p.mockExamSectionNumber)),
      );
      for (const num of partSectionNumbers) {
        if (!skipNumbers.has(num)) {
          expect(allSectionNumbers.has(num)).toBe(true);
        }
      }
    });

    it('totalMaxPoints equals sum of scoring group maxPoints', () => {
      const sum = germanB1Config.mockExam!.scoringGroups.reduce(
        (acc, g) => acc + g.maxPoints,
        0,
      );
      expect(germanB1Config.mockExam!.totalMaxPoints).toBe(sum);
    });

    it('passingTotalPoints is 60% of totalMaxPoints', () => {
      expect(germanB1Config.mockExam!.passingTotalPoints).toBe(
        germanB1Config.mockExam!.totalMaxPoints * 0.6,
      );
    });

    it('each scoringGroup passingPoints is 60% of its maxPoints', () => {
      for (const group of germanB1Config.mockExam!.scoringGroups) {
        expect(group.passingPoints).toBe(group.maxPoints * 0.6);
      }
    });
  });
});
