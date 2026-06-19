import React from 'react';

// Lazy imports to avoid circular dependencies
import DeleGrammarPart1Wrapper from '../components/exam-wrappers/DeleGrammarPart1Wrapper';
import DeleGrammarPart2Wrapper from '../components/exam-wrappers/DeleGrammarPart2Wrapper';
import DeleListeningPart1Wrapper from '../components/exam-wrappers/DeleListeningPart1Wrapper';
import DeleListeningPart2Wrapper from '../components/exam-wrappers/DeleListeningPart2Wrapper';
import DeleListeningPart3Wrapper from '../components/exam-wrappers/DeleListeningPart3Wrapper';
import DeleListeningPart4Wrapper from '../components/exam-wrappers/DeleListeningPart4Wrapper';
import DeleListeningPart5Wrapper from '../components/exam-wrappers/DeleListeningPart5Wrapper';
import DeleReadingPart1Wrapper from '../components/exam-wrappers/DeleReadingPart1Wrapper';
import DeleReadingPart2Wrapper from '../components/exam-wrappers/DeleReadingPart2Wrapper';
import DeleReadingPart3Wrapper from '../components/exam-wrappers/DeleReadingPart3Wrapper';
import LanguagePart1Wrapper from '../components/exam-wrappers/LanguagePart1Wrapper';
import LanguagePart2Wrapper from '../components/exam-wrappers/LanguagePart2Wrapper';
import ListeningPart1Wrapper from '../components/exam-wrappers/ListeningPart1Wrapper';
import ListeningPart2Wrapper from '../components/exam-wrappers/ListeningPart2Wrapper';
import ListeningPart3Wrapper from '../components/exam-wrappers/ListeningPart3Wrapper';
import ReadingPart1Wrapper from '../components/exam-wrappers/ReadingPart1Wrapper';
import ReadingPart2Wrapper from '../components/exam-wrappers/ReadingPart2Wrapper';
import ReadingPart3Wrapper from '../components/exam-wrappers/ReadingPart3Wrapper';
import WritingWrapper from '../components/exam-wrappers/WritingWrapper';

export const WRAPPER_REGISTRY: Record<string, React.ComponentType<any>> = {
  ReadingPart1Wrapper,
  ReadingPart2Wrapper,
  ReadingPart3Wrapper,
  LanguagePart1Wrapper,
  LanguagePart2Wrapper,
  ListeningPart1Wrapper,
  ListeningPart2Wrapper,
  ListeningPart3Wrapper,
  WritingWrapper,
  DeleReadingPart1Wrapper,
  DeleReadingPart2Wrapper,
  DeleReadingPart3Wrapper,
  DeleGrammarPart1Wrapper,
  DeleGrammarPart2Wrapper,
  DeleListeningPart1Wrapper,
  DeleListeningPart2Wrapper,
  DeleListeningPart3Wrapper,
  DeleListeningPart4Wrapper,
  DeleListeningPart5Wrapper,
};
