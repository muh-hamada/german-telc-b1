import { NavigatorScreenParams } from '@react-navigation/native';
import { ListeningPracticeInterview } from './exam.types';

// Root Stack Navigator
export type RootStackParamList = {
  Onboarding: undefined;
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
  ReadingPart1: { examId: number };
  ReadingPart2: { examId: number };
  ReadingPart3: { examId: number };
  GrammarMenu: undefined;
  GrammarPart1: { examId: number };
  GrammarPart2: { examId: number };
  GrammarStudy: undefined;
  Writing: { examId: number };
  SpeakingMenu: undefined;
  SpeakingPart1: undefined;
  SpeakingPart2: { topicId: number };
  SpeakingPart3: { scenarioId: number };
  SpeakingPart4: { groupIndex: number };
  B2SpeakingStructure: undefined;
  B2SpeakingPart1: { topicId: number };
  B2SpeakingPart2: { topicId: number };
  B2SpeakingPart3: { questionId: number };
  ListeningMenu: undefined;
  ListeningPart1: { examId: number };
  ListeningPart2: { examId: number };
  ListeningPart3: { examId: number };
  ListeningPracticeList: undefined;
  ListeningPractice: { interview: ListeningPracticeInterview };
  ListeningPracticeQuestions: { interview: ListeningPracticeInterview };
  VocabularyHome: undefined;
  VocabularyOnboarding: undefined;
  VocabularyStudyNew: undefined;
  VocabularyReview: undefined;
  VocabularyProgress: undefined;
  VocabularyStudiedList: undefined;
};

// Profile Stack Navigator
export type ProfileStackParamList = {
  Profile: { openLoginModal?: boolean } | undefined;
  Settings: undefined;
  CompletionStats: undefined;
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
