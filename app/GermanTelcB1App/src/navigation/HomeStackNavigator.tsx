import React from 'react';
import { createStackNavigator, TransitionPresets, CardStyleInterpolators } from '@react-navigation/stack';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { Text} from 'react-native';
import { HomeStackParamList } from '../types/navigation.types';
import { colors, spacing } from '../theme';
import ErrorBoundary from '../components/ErrorBoundary';
import HomeScreen from '../screens/HomeScreen';
import ExamStructureScreen from '../screens/ExamStructureScreen';
import PracticeMenuScreen from '../screens/practice/PracticeMenuScreen';
import ReadingMenuScreen from '../screens/practice/ReadingMenuScreen';
import ReadingPart1Screen from '../screens/practice/ReadingPart1Screen';
import ReadingPart1A1Screen from '../screens/practice/ReadingPart1A1Screen';
import ReadingPart2Screen from '../screens/practice/ReadingPart2Screen';
import ReadingPart2A1Screen from '../screens/practice/ReadingPart2A1Screen';
import ReadingPart3Screen from '../screens/practice/ReadingPart3Screen';
import ReadingPart3A1Screen from '../screens/practice/ReadingPart3A1Screen';
import GrammarMenuScreen from '../screens/practice/GrammarMenuScreen';
import GrammarPart1Screen from '../screens/practice/GrammarPart1Screen';
import GrammarPart2Screen from '../screens/practice/GrammarPart2Screen';
import GrammarStudyScreen from '../screens/practice/GrammarStudyScreen';
import WritingScreen from '../screens/practice/WritingScreen';
import WritingMenuScreen from '../screens/practice/WritingMenuScreen';
import WritingPart1Screen from '../screens/practice/WritingPart1Screen';
import WritingPart2Screen from '../screens/practice/WritingPart2Screen';
import SpeakingMenuScreen from '../screens/practice/SpeakingMenuScreen';
import SpeakingPart1Screen from '../screens/practice/SpeakingPart1Screen';
import SpeakingPart2Screen from '../screens/practice/SpeakingPart2Screen';
import SpeakingPart3Screen from '../screens/practice/SpeakingPart3Screen';
import SpeakingPart4Screen from '../screens/practice/SpeakingPart4Screen';
import A1SpeakingPart1Screen from '../screens/practice/A1SpeakingPart1Screen';
import A1SpeakingPart2Screen from '../screens/practice/A1SpeakingPart2Screen';
import A1SpeakingPart3Screen from '../screens/practice/A1SpeakingPart3Screen';
import SpeakingB2StructureScreen from '../screens/practice/SpeakingB2StructureScreen';
import SpeakingB2Part1Screen from '../screens/practice/SpeakingB2Part1Screen';
import SpeakingB2Part2Screen from '../screens/practice/SpeakingB2Part2Screen';
import SpeakingB2Part3Screen from '../screens/practice/SpeakingB2Part3Screen';
import ListeningMenuScreen from '../screens/practice/ListeningMenuScreen';
import ListeningPart1Screen from '../screens/practice/ListeningPart1Screen';
import ListeningPart1A1Screen from '../screens/practice/ListeningPart1A1Screen';
import ListeningPart2Screen from '../screens/practice/ListeningPart2Screen';
import ListeningPart2A1Screen from '../screens/practice/ListeningPart2A1Screen';
import ListeningPart3Screen from '../screens/practice/ListeningPart3Screen';
import ListeningPart3A1Screen from '../screens/practice/ListeningPart3A1Screen';
import ListeningPracticeListScreen from '../screens/practice/ListeningPracticeListScreen';
import ListeningPracticeScreen from '../screens/practice/ListeningPracticeScreen';
import ListeningPracticeQuestionsScreen from '../screens/practice/ListeningPracticeQuestionsScreen';
import VocabularyHomeScreen from '../screens/VocabularyHomeScreen';
import VocabularyOnboardingScreen from '../screens/VocabularyOnboardingScreen';
import VocabularyStudyNewScreen from '../screens/VocabularyStudyNewScreen';
import VocabularyReviewScreen from '../screens/VocabularyReviewScreen';
import VocabularyProgressScreen from '../screens/VocabularyProgressScreen';
import VocabularyStudiedListScreen from '../screens/VocabularyStudiedListScreen';
// Prep Plan Screens
import AssessmentResultsScreen from '../screens/prep-plan/AssessmentResultsScreen';
import SpeakingAssessmentScreen from '../screens/prep-plan/SpeakingAssessmentScreen';

const Stack = createStackNavigator<HomeStackParamList>();

// Header component for dynamic translations
const HeaderTitle: React.FC<{ titleKey: string }> = ({ titleKey }) => {
  const { t } = useCustomTranslation();
  return (
    <Text 
      style={{ 
        color: colors.white, 
        fontSize: 18, 
        fontWeight: '600',
        maxWidth: 250, // Prevent overlap with back button
      }}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {t(titleKey)}
    </Text>
  );
};

const HomeStackNavigator: React.FC = () => {
  const { t } = useCustomTranslation();
  
  // Common screen options for RTL support
  const screenOptions = {
    headerStyle: {
      backgroundColor: colors.primary[500],
    },
    headerTintColor: colors.white,
    headerTitleStyle: {
      fontWeight: '600' as '600',
      fontSize: 18,
    },
    headerBackTitleVisible: false,
    headerBackTitle: ' ', // This ensures no text appears next to back button on iOS
    headerTitleAlign: 'center' as 'center',
  };

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ExamStructure"
        component={ExamStructureScreen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.examStructure.title" />,
        }}
      />
      <Stack.Screen
        name="PracticeMenu"
        component={PracticeMenuScreen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="home.solve" />,
        }}
      />
      <Stack.Screen
        name="ReadingMenu"
        component={ReadingMenuScreen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="practice.reading.title" />,
        }}
      />
      <Stack.Screen
        name="ReadingPart1"
        component={ReadingPart1Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.reading.part1" />,
        }}
      />
      <Stack.Screen
        name="ReadingPart1A1"
        component={ReadingPart1A1Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.reading.a1.part1" />,
        }}
      />
      <Stack.Screen
        name="ReadingPart2"
        component={ReadingPart2Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.reading.part2" />,
        }}
      />
      <Stack.Screen
        name="ReadingPart2A1"
        component={ReadingPart2A1Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.reading.a1.part2" />,
        }}
      />
      <Stack.Screen
        name="ReadingPart3"
        component={ReadingPart3Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.reading.part3" />,
        }}
      />
      <Stack.Screen
        name="ReadingPart3A1"
        component={ReadingPart3A1Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.reading.a1.part3" />,
        }}
      />
      <Stack.Screen
        name="GrammarMenu"
        component={GrammarMenuScreen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="practice.grammar.title" />,
        }}
      />
      <Stack.Screen
        name="GrammarPart1"
        component={GrammarPart1Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.grammar.part1" />,
        }}
      />
      <Stack.Screen
        name="GrammarPart2"
        component={GrammarPart2Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.grammar.part2" />,
        }}
      />
      <Stack.Screen
        name="GrammarStudy"
        component={GrammarStudyScreen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="practice.grammar.study.title" />,
        }}
      />
      <Stack.Screen
        name="Writing"
        component={WritingScreen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="practice.writing.title" />,
        }}
      />
      <Stack.Screen
        name="WritingMenu"
        component={WritingMenuScreen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="practice.writing.title" />,
        }}
      />
      <Stack.Screen
        name="WritingPart1"
        component={WritingPart1Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.writing.a1.part1" />,
        }}
      />
      <Stack.Screen
        name="WritingPart2"
        component={WritingPart2Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.writing.a1.part2" />,
        }}
      />
      <Stack.Screen
        name="SpeakingMenu"
        component={SpeakingMenuScreen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="practice.speaking.title" />,
        }}
      />
      <Stack.Screen
        name="SpeakingPart1"
        component={SpeakingPart1Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.speaking.part1" />,
        }}
      />
      <Stack.Screen
        name="SpeakingPart2"
        component={SpeakingPart2Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.speaking.part2" />,
        }}
      />
      <Stack.Screen
        name="SpeakingPart3"
        component={SpeakingPart3Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.speaking.part3" />,
        }}
      />
      <Stack.Screen
        name="SpeakingPart4"
        component={SpeakingPart4Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.speaking.part4" />,
        }}
      />
      <Stack.Screen
        name="A1SpeakingPart1"
        component={A1SpeakingPart1Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.speaking.part1" />,
        }}
      />
      <Stack.Screen
        name="A1SpeakingPart2"
        component={A1SpeakingPart2Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.speaking.a1.part2" />,
        }}
      />
      <Stack.Screen
        name="A1SpeakingPart3"
        component={A1SpeakingPart3Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.speaking.a1.part3" />,
        }}
      />
      <Stack.Screen
        name="B2SpeakingStructure"
        component={SpeakingB2StructureScreen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="speaking.b2Structure.title" />,
        }}
      />
      <Stack.Screen
        name="B2SpeakingPart1"
        component={SpeakingB2Part1Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="speaking.b2Part1.title" />,
        }}
      />
      <Stack.Screen
        name="B2SpeakingPart2"
        component={SpeakingB2Part2Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="speaking.b2Part2.title" />,
        }}
      />
      <Stack.Screen
        name="B2SpeakingPart3"
        component={SpeakingB2Part3Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="speaking.b2Part3.title" />,
        }}
      />
      <Stack.Screen
        name="ListeningMenu"
        component={ListeningMenuScreen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="practice.listening.title" />,
        }}
      />
      <Stack.Screen
        name="ListeningPart1"
        component={ListeningPart1Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.listening.part1" />,
        }}
      />
      <Stack.Screen
        name="ListeningPart1A1"
        component={ListeningPart1A1Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.listening.a1.part1" />,
        }}
      />
      <Stack.Screen
        name="ListeningPart2"
        component={ListeningPart2Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.listening.part2" />,
        }}
      />
      <Stack.Screen
        name="ListeningPart2A1"
        component={ListeningPart2A1Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.listening.a1.part2" />,
        }}
      />
      <Stack.Screen
        name="ListeningPart3"
        component={ListeningPart3Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.listening.part3" />,
        }}
      />
      <Stack.Screen
        name="ListeningPart3A1"
        component={ListeningPart3A1Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="nav.practice.listening.a1.part3" />,
        }}
      />
      <Stack.Screen
        name="ListeningPracticeList"
        component={ListeningPracticeListScreen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="practice.listening.practice.title" />,
        }}
      />
      <Stack.Screen
        name="ListeningPractice"
        component={ListeningPracticeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ListeningPracticeQuestions"
        component={ListeningPracticeQuestionsScreen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="practice.listening.practice.assessUnderstanding" />,
        }}
      />
      <Stack.Screen
        name="VocabularyHome"
        component={VocabularyHomeScreen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="vocabulary.title" />,
        }}
      />
      <Stack.Screen
        name="VocabularyOnboarding"
        component={VocabularyOnboardingScreen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="vocabulary.onboarding.title" />,
        }}
      />
      <Stack.Screen
        name="VocabularyStudyNew"
        component={VocabularyStudyNewScreen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="vocabulary.studyNew" />,
        }}
      />
      <Stack.Screen
        name="VocabularyReview"
        component={VocabularyReviewScreen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="vocabulary.review" />,
        }}
      />
      <Stack.Screen
        name="VocabularyProgress"
        component={VocabularyProgressScreen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="vocabulary.progress.title" />,
        }}
      />
      <Stack.Screen
        name="VocabularyStudiedList"
        component={VocabularyStudiedListScreen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="vocabulary.studiedWordsList" />,
        }}
      />
      <Stack.Screen
        name="AssessmentResults"
        options={{
          headerTitle: () => <HeaderTitle titleKey="speaking.complete" />,
          ...TransitionPresets.SlideFromRightIOS,
        }}
      >
        {(props) => (
          <ErrorBoundary>
            <AssessmentResultsScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="SpeakingAssessment"
        options={{
          headerTitle: () => <HeaderTitle titleKey="speaking.title" />,
          ...TransitionPresets.SlideFromRightIOS,
        }}
      >
        {(props) => (
          <ErrorBoundary>
            <SpeakingAssessmentScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;
