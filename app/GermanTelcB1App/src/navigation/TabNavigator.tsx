import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MainTabParamList } from '../types/navigation.types';
import { colors, spacing } from '../theme';
import HomeStackNavigator from './HomeStackNavigator';
import MockExamScreen from '../screens/MockExamScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Screens where tab bar should be hidden
const HIDE_TAB_SCREENS = [
  'PracticeMenu',
  'ReadingMenu',
  'ReadingPart1',
  'ReadingPart2',
  'ReadingPart3',
  'GrammarMenu',
  'GrammarPart1',
  'GrammarPart2',
  'Writing',
  'SpeakingMenu',
  'SpeakingPart1',
  'SpeakingPart2',
  'SpeakingPart3',
  'ListeningMenu',
  'ListeningPart1',
  'ListeningPart2',
  'ListeningPart3',
  'ExamStructure',
];

const TabNavigator: React.FC = () => {
  const { t } = useTranslation();

  const getTabBarStyle = (route: any) => {
    const routeName = getFocusedRouteNameFromRoute(route);
    
    if (routeName && HIDE_TAB_SCREENS.includes(routeName)) {
      return { display: 'none' as 'none' };
    }
    
    return {
      backgroundColor: colors.white,
      borderTopColor: colors.border.light,
      borderTopWidth: 1,
      paddingTop: spacing.padding.sm,
      height: 70,
    };
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStackNavigator}
        options={({ route }) => ({
          tabBarLabel: t('navigation.home'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
          tabBarStyle: getTabBarStyle(route),
        })}
      />
      <Tab.Screen
        name="MockExam"
        component={MockExamScreen}
        options={{
          tabBarLabel: t('navigation.mockExam'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="assignment" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('navigation.profile'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
