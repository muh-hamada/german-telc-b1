// Mock all wrapper imports to avoid native module dependency chain
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

import { WRAPPER_REGISTRY } from '../wrapper-registry';

const EXPECTED_KEYS = [
  'ReadingPart1Wrapper',
  'ReadingPart2Wrapper',
  'ReadingPart3Wrapper',
  'LanguagePart1Wrapper',
  'LanguagePart2Wrapper',
  'ListeningPart1Wrapper',
  'ListeningPart2Wrapper',
  'ListeningPart3Wrapper',
  'WritingWrapper',
  'DeleReadingPart1Wrapper',
  'DeleReadingPart2Wrapper',
  'DeleReadingPart3Wrapper',
  'DeleGrammarPart1Wrapper',
  'DeleGrammarPart2Wrapper',
  'DeleListeningPart1Wrapper',
  'DeleListeningPart2Wrapper',
  'DeleListeningPart3Wrapper',
  'DeleListeningPart4Wrapper',
  'DeleListeningPart5Wrapper',
];

describe('wrapper-registry', () => {
  it('contains all expected wrapper keys', () => {
    for (const key of EXPECTED_KEYS) {
      expect(WRAPPER_REGISTRY).toHaveProperty(key);
    }
  });

  it('has exactly 19 entries', () => {
    expect(Object.keys(WRAPPER_REGISTRY)).toHaveLength(19);
  });

  it('all values are functions (React components)', () => {
    for (const [key, value] of Object.entries(WRAPPER_REGISTRY)) {
      expect(typeof value).toBe('function');
    }
  });

  it('has no undefined values', () => {
    for (const [key, value] of Object.entries(WRAPPER_REGISTRY)) {
      expect(value).toBeDefined();
    }
  });
});
