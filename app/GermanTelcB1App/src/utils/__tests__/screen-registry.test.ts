// Mock all screen imports to avoid native module dependency chain
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

import { SCREEN_REGISTRY } from '../screen-registry';

const EXPECTED_KEYS = [
  'Home',
  'ExamStructure',
  'PracticeMenu',
  'ReadingMenu',
  'ReadingPart1',
  'ReadingPart1A1',
  'ReadingPart2',
  'ReadingPart2A1',
  'ReadingPart3',
  'ReadingPart3A1',
  'ReadingPart1A2',
  'ReadingPart2A2',
  'ReadingPart3A2',
  'GrammarMenu',
  'GrammarPart1',
  'GrammarPart2',
  'GrammarStudy',
  'Writing',
  'WritingMenu',
  'WritingPart1',
  'WritingPart2',
  'SpeakingMenu',
  'SpeakingPart1',
  'SpeakingPart2',
  'SpeakingPart3',
  'SpeakingPart4',
  'A1SpeakingPart1',
  'A1SpeakingPart2',
  'A1SpeakingPart3',
  'B2SpeakingStructure',
  'B2SpeakingPart1',
  'B2SpeakingPart2',
  'B2SpeakingPart3',
  'DeleSpeakingAllParts',
  'SpeakingImportantPhrases',
  'ListeningMenu',
  'ListeningPart1',
  'ListeningPart1A1',
  'ListeningPart2',
  'ListeningPart2A1',
  'ListeningPart3',
  'ListeningPart3A1',
  'ListeningPart1A2',
  'ListeningPart2A2',
  'ListeningPart3A2',
  'ListeningPart4',
  'ListeningPart5',
  'ListeningPracticeList',
  'ListeningPractice',
  'ListeningPracticeQuestions',
  'VocabularyHome',
  'VocabularyOnboarding',
  'VocabularyStudyNew',
  'VocabularyReview',
  'VocabularyProgress',
  'VocabularyStudiedList',
  'AssessmentResults',
  'SpeakingAssessment',
];

describe('screen-registry', () => {
  it('contains all expected screen keys', () => {
    for (const key of EXPECTED_KEYS) {
      expect(SCREEN_REGISTRY).toHaveProperty(key);
    }
  });

  it('has expected number of entries', () => {
    expect(Object.keys(SCREEN_REGISTRY).length).toBeGreaterThanOrEqual(58);
  });

  it('all values are functions (React components)', () => {
    for (const [key, value] of Object.entries(SCREEN_REGISTRY)) {
      expect(typeof value).toBe('function');
    }
  });

  it('has no undefined values', () => {
    for (const [key, value] of Object.entries(SCREEN_REGISTRY)) {
      expect(value).toBeDefined();
    }
  });
});
