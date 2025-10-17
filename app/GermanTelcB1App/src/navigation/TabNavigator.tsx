import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { MainTabParamList } from '../types/navigation.types';
import { colors, spacing } from '../theme';
import HomeStackNavigator from './HomeStackNavigator';
import MockExamScreen from '../screens/MockExamScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border.light,
          borderTopWidth: 1,
          paddingBottom: spacing.padding.sm,
          paddingTop: spacing.padding.sm,
          height: 60,
        },
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
        options={{
          tabBarLabel: t('navigation.home'),
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="MockExam"
        component={MockExamScreen}
        options={{
          tabBarLabel: t('navigation.mockExam'),
          tabBarIcon: ({ color, size }) => (
            <ExamIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('navigation.profile'),
          tabBarIcon: ({ color, size }) => (
            <ProfileIcon color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Simple icon components (replace with proper icons later)
const HomeIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <View style={{ width: size, height: size, backgroundColor: color, borderRadius: 2 }} />
);

const ExamIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <View style={{ width: size, height: size, backgroundColor: color, borderRadius: 2 }} />
);

const ProfileIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <View style={{ width: size, height: size, backgroundColor: color, borderRadius: 2 }} />
);

export default TabNavigator;
