import { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack Navigator
export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  MockExamRunning: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList>;
  MockExam: undefined;
  Profile: { openLoginModal?: boolean } | undefined;
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
  Writing: { examId: number };
  SpeakingMenu: undefined;
  SpeakingPart1: undefined;
  SpeakingPart2: { topicId: number };
  SpeakingPart3: { scenarioId: number };
  ListeningMenu: undefined;
  ListeningPart1: undefined;
  ListeningPart2: undefined;
  ListeningPart3: undefined;
};

// Navigation prop types
export type RootStackNavigationProp = import('@react-navigation/stack').StackNavigationProp<RootStackParamList>;
export type MainTabNavigationProp = import('@react-navigation/bottom-tabs').BottomTabNavigationProp<MainTabParamList>;
export type HomeStackNavigationProp = import('@react-navigation/stack').StackNavigationProp<HomeStackParamList>;

// Route prop types
export type RootStackRouteProp<T extends keyof RootStackParamList> = import('@react-navigation/native').RouteProp<RootStackParamList, T>;
export type MainTabRouteProp<T extends keyof MainTabParamList> = import('@react-navigation/native').RouteProp<MainTabParamList, T>;
export type HomeStackRouteProp<T extends keyof HomeStackParamList> = import('@react-navigation/native').RouteProp<HomeStackParamList, T>;
