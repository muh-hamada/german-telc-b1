import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { HomeStackParamList } from '../types/navigation.types';
import { colors, spacing } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import ExamStructureScreen from '../screens/ExamStructureScreen';
import PracticeMenuScreen from '../screens/practice/PracticeMenuScreen';
import ReadingMenuScreen from '../screens/practice/ReadingMenuScreen';
import ReadingPart1Screen from '../screens/practice/ReadingPart1Screen';
import ReadingPart2Screen from '../screens/practice/ReadingPart2Screen';
import ReadingPart3Screen from '../screens/practice/ReadingPart3Screen';
import GrammarPart1Screen from '../screens/practice/GrammarPart1Screen';
import GrammarPart2Screen from '../screens/practice/GrammarPart2Screen';
import WritingScreen from '../screens/practice/WritingScreen';
import SpeakingMenuScreen from '../screens/practice/SpeakingMenuScreen';
import SpeakingPart1Screen from '../screens/practice/SpeakingPart1Screen';
import SpeakingPart2Screen from '../screens/practice/SpeakingPart2Screen';
import SpeakingPart3Screen from '../screens/practice/SpeakingPart3Screen';
import ListeningMenuScreen from '../screens/practice/ListeningMenuScreen';
import ListeningPart1Screen from '../screens/practice/ListeningPart1Screen';
import ListeningPart2Screen from '../screens/practice/ListeningPart2Screen';
import ListeningPart3Screen from '../screens/practice/ListeningPart3Screen';

const Stack = createStackNavigator<HomeStackParamList>();

const HomeStackNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary[500],
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: t('home.title'),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ExamStructure"
        component={ExamStructureScreen}
        options={{
          title: t('examStructure.title'),
        }}
      />
      <Stack.Screen
        name="PracticeMenu"
        component={PracticeMenuScreen}
        options={{
          title: t('home.practice'),
        }}
      />
      <Stack.Screen
        name="ReadingMenu"
        component={ReadingMenuScreen}
        options={{
          title: t('practice.reading.title'),
        }}
      />
      <Stack.Screen
        name="ReadingPart1"
        component={ReadingPart1Screen}
        options={{
          title: t('practice.reading.part1'),
        }}
      />
      <Stack.Screen
        name="ReadingPart2"
        component={ReadingPart2Screen}
        options={{
          title: t('practice.reading.part2'),
        }}
      />
      <Stack.Screen
        name="ReadingPart3"
        component={ReadingPart3Screen}
        options={{
          title: t('practice.reading.part3'),
        }}
      />
      <Stack.Screen
        name="GrammarPart1"
        component={GrammarPart1Screen}
        options={{
          title: t('practice.grammar.part1'),
        }}
      />
      <Stack.Screen
        name="GrammarPart2"
        component={GrammarPart2Screen}
        options={{
          title: t('practice.grammar.part2'),
        }}
      />
      <Stack.Screen
        name="Writing"
        component={WritingScreen}
        options={{
          title: t('practice.writing.title'),
        }}
      />
      <Stack.Screen
        name="SpeakingMenu"
        component={SpeakingMenuScreen}
        options={{
          title: t('practice.speaking.title'),
        }}
      />
      <Stack.Screen
        name="SpeakingPart1"
        component={SpeakingPart1Screen}
        options={{
          title: t('practice.speaking.part1'),
        }}
      />
      <Stack.Screen
        name="SpeakingPart2"
        component={SpeakingPart2Screen}
        options={{
          title: t('practice.speaking.part2'),
        }}
      />
      <Stack.Screen
        name="SpeakingPart3"
        component={SpeakingPart3Screen}
        options={{
          title: t('practice.speaking.part3'),
        }}
      />
      <Stack.Screen
        name="ListeningMenu"
        component={ListeningMenuScreen}
        options={{
          title: t('practice.listening.title'),
        }}
      />
      <Stack.Screen
        name="ListeningPart1"
        component={ListeningPart1Screen}
        options={{
          title: t('practice.listening.part1'),
        }}
      />
      <Stack.Screen
        name="ListeningPart2"
        component={ListeningPart2Screen}
        options={{
          title: t('practice.listening.part2'),
        }}
      />
      <Stack.Screen
        name="ListeningPart3"
        component={ListeningPart3Screen}
        options={{
          title: t('practice.listening.part3'),
        }}
      />
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;
