import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { ProfileStackParamList } from '../types/navigation.types';
import { colors, typography } from '../theme';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CompletionStatsScreen from '../screens/CompletionStatsScreen';

const Stack = createStackNavigator<ProfileStackParamList>();

const ProfileStackNavigator: React.FC = () => {
  const { t } = useCustomTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary[500],
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          ...typography.textStyles.h3,
          fontWeight: typography.fontWeight.semibold,
          color: colors.white,
        },
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
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator;