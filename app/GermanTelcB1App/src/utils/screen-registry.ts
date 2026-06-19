import React from 'react';

// Home & Structure
import HomeScreen from '../screens/HomeScreen';
import ExamStructureScreen from '../screens/ExamStructureScreen';

// Practice Menu
import PracticeMenuScreen from '../screens/practice/PracticeMenuScreen';
import SectionMenuScreen from '../screens/practice/SectionMenuScreen';

// Reading
import ReadingPart1Screen from '../screens/practice/ReadingPart1Screen';
import ReadingPart1A1Screen from '../screens/practice/ReadingPart1A1Screen';
import ReadingPart2Screen from '../screens/practice/ReadingPart2Screen';
import ReadingPart2A1Screen from '../screens/practice/ReadingPart2A1Screen';
import ReadingPart3Screen from '../screens/practice/ReadingPart3Screen';
import ReadingPart3A1Screen from '../screens/practice/ReadingPart3A1Screen';
import ReadingPart1A2Screen from '../screens/practice/ReadingPart1A2Screen';
import ReadingPart2A2Screen from '../screens/practice/ReadingPart2A2Screen';
import ReadingPart3A2Screen from '../screens/practice/ReadingPart3A2Screen';

// Grammar
import GrammarPart1Screen from '../screens/practice/GrammarPart1Screen';
import GrammarPart2Screen from '../screens/practice/GrammarPart2Screen';
import GrammarStudyScreen from '../screens/practice/GrammarStudyScreen';

// Writing
import WritingScreen from '../screens/practice/WritingScreen';
import WritingPart1Screen from '../screens/practice/WritingPart1Screen';
import WritingPart2Screen from '../screens/practice/WritingPart2Screen';

// Speaking
import SpeakingPart1Screen from '../screens/practice/SpeakingPart1Screen';
import SpeakingPart2Screen from '../screens/practice/SpeakingPart2Screen';
import SpeakingPart3Screen from '../screens/practice/SpeakingPart3Screen';
import SpeakingImportantPhrasesScreen from '../screens/practice/SpeakingImportantPhrasesScreen';
import A1SpeakingPart1Screen from '../screens/practice/A1SpeakingPart1Screen';
import A1SpeakingPart2Screen from '../screens/practice/A1SpeakingPart2Screen';
import A1SpeakingPart3Screen from '../screens/practice/A1SpeakingPart3Screen';
import SpeakingB2StructureScreen from '../screens/practice/SpeakingB2StructureScreen';
import SpeakingB2Part1Screen from '../screens/practice/SpeakingB2Part1Screen';
import SpeakingB2Part2Screen from '../screens/practice/SpeakingB2Part2Screen';
import SpeakingB2Part3Screen from '../screens/practice/SpeakingB2Part3Screen';
import DeleSpeakingAllPartsScreen from '../screens/dele/DeleSpeakingAllPartsScreen';

// Listening
import ListeningPart1Screen from '../screens/practice/ListeningPart1Screen';
import ListeningPart1A1Screen from '../screens/practice/ListeningPart1A1Screen';
import ListeningPart2Screen from '../screens/practice/ListeningPart2Screen';
import ListeningPart2A1Screen from '../screens/practice/ListeningPart2A1Screen';
import ListeningPart3Screen from '../screens/practice/ListeningPart3Screen';
import ListeningPart3A1Screen from '../screens/practice/ListeningPart3A1Screen';
import ListeningPart1A2Screen from '../screens/practice/ListeningPart1A2Screen';
import ListeningPart2A2Screen from '../screens/practice/ListeningPart2A2Screen';
import ListeningPart3A2Screen from '../screens/practice/ListeningPart3A2Screen';
import ListeningPart4Screen from '../screens/practice/ListeningPart4Screen';
import ListeningPart5Screen from '../screens/practice/ListeningPart5Screen';
import ListeningPracticeListScreen from '../screens/practice/ListeningPracticeListScreen';
import ListeningPracticeScreen from '../screens/practice/ListeningPracticeScreen';
import ListeningPracticeQuestionsScreen from '../screens/practice/ListeningPracticeQuestionsScreen';

// Vocabulary
import VocabularyHomeScreen from '../screens/VocabularyHomeScreen';
import VocabularyOnboardingScreen from '../screens/VocabularyOnboardingScreen';
import VocabularyStudyNewScreen from '../screens/VocabularyStudyNewScreen';
import VocabularyReviewScreen from '../screens/VocabularyReviewScreen';
import VocabularyProgressScreen from '../screens/VocabularyProgressScreen';
import VocabularyStudiedListScreen from '../screens/VocabularyStudiedListScreen';

// Prep Plan
import AssessmentResultsScreen from '../screens/prep-plan/AssessmentResultsScreen';
import SpeakingAssessmentScreen from '../screens/prep-plan/SpeakingAssessmentScreen';

export const SCREEN_REGISTRY: Record<string, React.ComponentType<any>> = {
  Home: HomeScreen,
  ExamStructure: ExamStructureScreen,
  PracticeMenu: PracticeMenuScreen,
  ReadingMenu: SectionMenuScreen,
  ReadingPart1: ReadingPart1Screen,
  ReadingPart1A1: ReadingPart1A1Screen,
  ReadingPart2: ReadingPart2Screen,
  ReadingPart2A1: ReadingPart2A1Screen,
  ReadingPart3: ReadingPart3Screen,
  ReadingPart3A1: ReadingPart3A1Screen,
  ReadingPart1A2: ReadingPart1A2Screen,
  ReadingPart2A2: ReadingPart2A2Screen,
  ReadingPart3A2: ReadingPart3A2Screen,
  GrammarMenu: SectionMenuScreen,
  GrammarPart1: GrammarPart1Screen,
  GrammarPart2: GrammarPart2Screen,
  GrammarStudy: GrammarStudyScreen,
  Writing: WritingScreen,
  WritingMenu: SectionMenuScreen,
  WritingPart1: WritingPart1Screen,
  WritingPart2: WritingPart2Screen,
  SpeakingMenu: SectionMenuScreen,
  SpeakingPart1: SpeakingPart1Screen,
  SpeakingPart2: SpeakingPart2Screen,
  SpeakingPart3: SpeakingPart3Screen,
  SpeakingPart4: SpeakingImportantPhrasesScreen,
  A1SpeakingPart1: A1SpeakingPart1Screen,
  A1SpeakingPart2: A1SpeakingPart2Screen,
  A1SpeakingPart3: A1SpeakingPart3Screen,
  B2SpeakingStructure: SpeakingB2StructureScreen,
  B2SpeakingPart1: SpeakingB2Part1Screen,
  B2SpeakingPart2: SpeakingB2Part2Screen,
  B2SpeakingPart3: SpeakingB2Part3Screen,
  DeleSpeakingAllParts: DeleSpeakingAllPartsScreen,
  SpeakingImportantPhrases: SpeakingImportantPhrasesScreen,
  ListeningMenu: SectionMenuScreen,
  ListeningPart1: ListeningPart1Screen,
  ListeningPart1A1: ListeningPart1A1Screen,
  ListeningPart2: ListeningPart2Screen,
  ListeningPart2A1: ListeningPart2A1Screen,
  ListeningPart3: ListeningPart3Screen,
  ListeningPart3A1: ListeningPart3A1Screen,
  ListeningPart1A2: ListeningPart1A2Screen,
  ListeningPart2A2: ListeningPart2A2Screen,
  ListeningPart3A2: ListeningPart3A2Screen,
  ListeningPart4: ListeningPart4Screen,
  ListeningPart5: ListeningPart5Screen,
  ListeningPracticeList: ListeningPracticeListScreen,
  ListeningPractice: ListeningPracticeScreen,
  ListeningPracticeQuestions: ListeningPracticeQuestionsScreen,
  VocabularyHome: VocabularyHomeScreen,
  VocabularyOnboarding: VocabularyOnboardingScreen,
  VocabularyStudyNew: VocabularyStudyNewScreen,
  VocabularyReview: VocabularyReviewScreen,
  VocabularyProgress: VocabularyProgressScreen,
  VocabularyStudiedList: VocabularyStudiedListScreen,
  AssessmentResults: AssessmentResultsScreen,
  SpeakingAssessment: SpeakingAssessmentScreen,
};
