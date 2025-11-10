import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { Text, I18nManager } from 'react-native';
import { HomeStackParamList } from '../types/navigation.types';
import { colors, spacing } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import ExamStructureScreen from '../screens/ExamStructureScreen';
import PracticeMenuScreen from '../screens/practice/PracticeMenuScreen';
import ReadingMenuScreen from '../screens/practice/ReadingMenuScreen';
import ReadingPart1Screen from '../screens/practice/ReadingPart1Screen';
import ReadingPart2Screen from '../screens/practice/ReadingPart2Screen';
import ReadingPart3Screen from '../screens/practice/ReadingPart3Screen';
import GrammarMenuScreen from '../screens/practice/GrammarMenuScreen';
import GrammarPart1Screen from '../screens/practice/GrammarPart1Screen';
import GrammarPart2Screen from '../screens/practice/GrammarPart2Screen';
import GrammarStudyScreen from '../screens/practice/GrammarStudyScreen';
import WritingScreen from '../screens/practice/WritingScreen';
import SpeakingMenuScreen from '../screens/practice/SpeakingMenuScreen';
import SpeakingPart1Screen from '../screens/practice/SpeakingPart1Screen';
import SpeakingPart2Screen from '../screens/practice/SpeakingPart2Screen';
import SpeakingPart3Screen from '../screens/practice/SpeakingPart3Screen';
import SpeakingPart4Screen from '../screens/practice/SpeakingPart4Screen';
import SpeakingB2StructureScreen from '../screens/practice/SpeakingB2StructureScreen';
import ListeningMenuScreen from '../screens/practice/ListeningMenuScreen';
import ListeningPart1Screen from '../screens/practice/ListeningPart1Screen';
import ListeningPart2Screen from '../screens/practice/ListeningPart2Screen';
import ListeningPart3Screen from '../screens/practice/ListeningPart3Screen';

const Stack = createStackNavigator<HomeStackParamList>();

// Header component for dynamic translations
const HeaderTitle: React.FC<{ titleKey: string }> = ({ titleKey }) => {
  const { t } = useTranslation();
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
  const { t } = useTranslation();
  
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
          headerTitle: () => <HeaderTitle titleKey="examStructure.title" />,
        }}
      />
      <Stack.Screen
        name="PracticeMenu"
        component={PracticeMenuScreen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="home.practice" />,
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
          headerTitle: () => <HeaderTitle titleKey="practice.reading.part1" />,
        }}
      />
      <Stack.Screen
        name="ReadingPart2"
        component={ReadingPart2Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="practice.reading.part2" />,
        }}
      />
      <Stack.Screen
        name="ReadingPart3"
        component={ReadingPart3Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="practice.reading.part3" />,
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
          headerTitle: () => <HeaderTitle titleKey="practice.grammar.part1" />,
        }}
      />
      <Stack.Screen
        name="GrammarPart2"
        component={GrammarPart2Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="practice.grammar.part2" />,
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
          headerTitle: () => <HeaderTitle titleKey="practice.speaking.part1" />,
        }}
      />
      <Stack.Screen
        name="SpeakingPart2"
        component={SpeakingPart2Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="practice.speaking.part2" />,
        }}
      />
      <Stack.Screen
        name="SpeakingPart3"
        component={SpeakingPart3Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="practice.speaking.part3" />,
        }}
      />
      <Stack.Screen
        name="SpeakingPart4"
        component={SpeakingPart4Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="practice.speaking.part4" />,
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
          headerTitle: () => <HeaderTitle titleKey="practice.listening.part1" />,
        }}
      />
      <Stack.Screen
        name="ListeningPart2"
        component={ListeningPart2Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="practice.listening.part2" />,
        }}
      />
      <Stack.Screen
        name="ListeningPart3"
        component={ListeningPart3Screen}
        options={{
          headerTitle: () => <HeaderTitle titleKey="practice.listening.part3" />,
        }}
      />
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;
