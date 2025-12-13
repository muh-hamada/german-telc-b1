import React, { useState, useEffect, useMemo } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../types/navigation.types';
import OnboardingScreen from '../screens/OnboardingScreen';
import OnboardingDisclaimerScreen from '../screens/OnboardingDisclaimerScreen';
import TabNavigator from './TabNavigator';
import MockExamRunningScreen from '../screens/MockExamRunningScreen';
import { logScreenView } from '../services/analytics.events';
import { useAppTheme } from '../contexts/ThemeContext';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const { colors, mode } = useAppTheme();

  const navigationTheme = useMemo(() => {
    const baseTheme = mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: colors.primary[500],
        background: colors.background.primary,
        card: colors.background.secondary,
        text: colors.text.primary,
        border: colors.border.light,
        notification: colors.primary[400],
      },
    };
  }, [colors, mode]);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        setIsFirstLaunch(hasLaunched === null);
      } catch (error) {
        console.log('Error checking first launch:', error);
        setIsFirstLaunch(true);
      }
    };

    checkFirstLaunch();
  }, []);

  if (isFirstLaunch === null) {
    // Show loading screen or splash screen
    return null;
  }

  return (
    <NavigationContainer
      onStateChange={(state) => {
        try {
          const route = state?.routes?.[state.index ?? 0];
          const name = route?.name || 'Unknown';
          logScreenView(name);
        } catch (e) {
          // no-op
        }
      }}
      theme={navigationTheme}
    >
      <Stack.Navigator
        initialRouteName={isFirstLaunch ? 'Onboarding' : 'Main'}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background.primary },
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="OnboardingDisclaimer" component={OnboardingDisclaimerScreen} />
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="MockExamRunning" component={MockExamRunningScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
