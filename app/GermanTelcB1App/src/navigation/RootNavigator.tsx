import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../types/navigation.types';
import { colors } from '../theme';
import OnboardingScreen from '../screens/OnboardingScreen';
import OnboardingDisclaimerScreen from '../screens/OnboardingDisclaimerScreen';
import TabNavigator from './TabNavigator';
import MockExamRunningScreen from '../screens/MockExamRunningScreen';
import { logScreenView } from '../services/analytics.events';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

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
