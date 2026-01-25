import { NavigatorScreenParams } from '@react-navigation/native';
import { ListeningPracticeInterview } from './exam.types';

// Root Stack Navigator
export type RootStackParamList = {
  Onboarding: undefined;
  OnboardingWelcome: undefined;
  OnboardingDisclaimer: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  MockExamRunning: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList>;
  MockExam: undefined;
  ProfileStack: NavigatorScreenParams<ProfileStackParamList>;
};

// Home Stack Navigator
export type HomeStackParamList = {
  Home: undefined;
  ExamStructure: undefined;
  PracticeMenu: undefined;
  ReadingMenu: undefined;
  ReadingPart1: { examId: string };
  ReadingPart1A1: { examId: string };
  ReadingPart2: { examId: string };
  ReadingPart2A1: { examId: string };
  ReadingPart3: { examId: string };
  ReadingPart3A1: { examId: string };
  GrammarMenu: undefined;
  GrammarPart1: { examId: string };
  GrammarPart2: { examId: string };
  GrammarStudy: undefined;
  Writing: { examId: string , part: number}; // For DELE combined Writing screen
  WritingMenu: undefined;
  WritingPart1: { examId: string };
  WritingPart2: { examId: string };
  SpeakingMenu: undefined;
  SpeakingPart1: undefined;
  SpeakingPart2: { topicId: string };
  SpeakingPart3: { scenarioId: string };
  SpeakingPart4: { groupIndex: string };
  A1SpeakingPart1: undefined;
  A1SpeakingPart2: undefined;
  A1SpeakingPart3: undefined;
  B2SpeakingStructure: undefined;
  B2SpeakingPart1: { topicId: string };
  B2SpeakingPart2: { topicId: string };
  B2SpeakingPart3: { questionId: string };
  ListeningMenu: undefined;
  ListeningPart1: { examId: string };
  ListeningPart1A1: { examId: string };
  ListeningPart2: { examId: string };
  ListeningPart2A1: { examId: string };
  ListeningPart3: { examId: string };
  ListeningPart3A1: { examId: string };
  ListeningPart4: { examId: string };
  ListeningPart5: { examId: string };
  ListeningPracticeList: undefined;
  ListeningPractice: { interview: ListeningPracticeInterview; id: number };
  ListeningPracticeQuestions: { interview: ListeningPracticeInterview; id: number };
  VocabularyHome: undefined;
  VocabularyOnboarding: undefined;
  VocabularyStudyNew: undefined;
  VocabularyReview: undefined;
  VocabularyProgress: undefined;
  VocabularyStudiedList: undefined;

  SpeakingImportantPhrases: { groupIndex: number };

  // Speaking Assessment Routes
  SpeakingAssessment: { dialogueId?: string };
  AssessmentResults: { assessmentId?: string; dialogueId?: string };
  // Spanish DELE Exam Routes
  DeleReadingPart1: { examId: string };
  DeleReadingPart2: { examId: string };
  DeleReadingPart3: { examId: string };
  DeleGrammarPart1: { examId: string };
  DeleGrammarPart2: { examId: string };
  DeleListeningPart1: { examId: string };
  DeleListeningPart2: { examId: string };
  DeleListeningPart3: { examId: string };
  DeleListeningPart4: { examId: string };
  DeleListeningPart5: { examId: string };
  DeleWritingPart1: { examId: string };
  DeleWritingPart2: { examId: string };
  DeleSpeakingAllParts: { part: number; topicId: string };
};

// Profile Stack Navigator
export type ProfileStackParamList = {
  Profile: { openLoginModal?: boolean } | undefined;
  Settings: undefined;
  CompletionStats: undefined;
  Premium: undefined;
  ReportedIssues: undefined;
};

// Navigation prop types
export type RootStackNavigationProp = import('@react-navigation/stack').StackNavigationProp<RootStackParamList>;
export type MainTabNavigationProp = import('@react-navigation/bottom-tabs').BottomTabNavigationProp<MainTabParamList>;
export type HomeStackNavigationProp = import('@react-navigation/stack').StackNavigationProp<HomeStackParamList>;
export type ProfileStackNavigationProp = import('@react-navigation/stack').StackNavigationProp<ProfileStackParamList>;

// Route prop types
export type RootStackRouteProp<T extends keyof RootStackParamList> = import('@react-navigation/native').RouteProp<RootStackParamList, T>;
export type MainTabRouteProp<T extends keyof MainTabParamList> = import('@react-navigation/native').RouteProp<MainTabParamList, T>;
export type HomeStackRouteProp<T extends keyof HomeStackParamList> = import('@react-navigation/native').RouteProp<HomeStackParamList, T>;
export type ProfileStackRouteProp<T extends keyof ProfileStackParamList> = import('@react-navigation/native').RouteProp<ProfileStackParamList, T>;
