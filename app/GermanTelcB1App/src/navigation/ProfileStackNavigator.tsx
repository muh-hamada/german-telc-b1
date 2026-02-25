import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { useAppTheme } from '../contexts/ThemeContext';
import { ProfileStackParamList } from '../types/navigation.types';
import { typography } from '../theme';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CompletionStatsScreen from '../screens/CompletionStatsScreen';
import PremiumScreen from '../screens/PremiumScreen';
import ReportedIssuesScreen from '../screens/ReportedIssuesScreen';

const Stack = createStackNavigator<ProfileStackParamList>();

const ProfileStackNavigator: React.FC = () => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.navigation.background,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: colors.navigation.text,
        headerTitleStyle: {
          ...typography.textStyles.h3,
          fontWeight: typography.fontWeight.semibold,
          color: colors.navigation.text,
        },
        headerBackTitle: ' ', // This ensures no text appears next to back button on iOS
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('settings.title'),
        }}
      />
      <Stack.Screen
        name="CompletionStats"
        component={CompletionStatsScreen}
        options={{
          title: t('stats.title'),
        }}
      />
      <Stack.Screen
        name="Premium"
        component={PremiumScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ReportedIssues"
        component={ReportedIssuesScreen}
        options={{
          title: t('reportedIssues.title'),
        }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator;