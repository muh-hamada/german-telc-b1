import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MainTabParamList } from '../types/navigation.types';
import { colors } from '../theme';
import HomeStackNavigator from './HomeStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';
import MockExamScreen from '../screens/MockExamScreen';
import AdBanner from '../components/AdBanner';
import { useNotificationReminder } from '../contexts/NotificationReminderContext';
import notificationReminderService from '../services/notification-reminder.service';

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
  'GrammarStudy',
  'Writing',
  'SpeakingMenu',
  'SpeakingPart1',
  'SpeakingPart2',
  'SpeakingPart3',
  'SpeakingPart4',
  'ListeningMenu',
  'ListeningPart1',
  'ListeningPart2',
  'ListeningPart3',
  'ExamStructure',
  'Settings',
  'CompletionStats',
  'B2SpeakingStructure',
  'B2SpeakingPart1',
  'B2SpeakingPart2',
  'B2SpeakingPart3',
  'VocabularyHome',
  'VocabularyStudyNew',
  'VocabularyReview',
  'VocabularyProgress',
  'VocabularyOnboarding',
  'VocabularyStudiedList',
  'ListeningPracticeList',
  'ListeningPractice',
  'ListeningPracticeQuestions',
];

/**
 * Custom Tab Bar component with persistent banner above it
 * This is the clean, proper way using React Navigation's tabBar prop
 */
const CustomTabBar = (props: any) => {
  // Check if current route should hide the tab bar
  const routeName = props.state?.routes[props.state.index]?.state?.routes?.[
    props.state.routes[props.state.index]?.state?.index ?? 0
  ]?.name;
  
  const shouldHideTabBar = routeName && HIDE_TAB_SCREENS.includes(routeName);
  
  return (
    <SafeAreaView edges={shouldHideTabBar ? ['bottom'] : []} style={styles.tabBarWrapper}>
      {/* Banner is ALWAYS visible - persistent across all screens */}
      <View style={styles.bannerContainer}>
        <AdBanner screen="main-tabs" />
      </View>
      
      {/* Tab bar only shown when not on a hidden screen */}
      {!shouldHideTabBar && <BottomTabBar {...props} />}
    </SafeAreaView>
  );
};

const TabNavigator: React.FC = () => {
  const { t } = useCustomTranslation();
  const { checkAndShowReminder } = useNotificationReminder();
  const appState = useRef(AppState.currentState);

  // Check for notification reminder triggers on mount and app foreground
  useEffect(() => {
    // Check on mount (handles onboarding completion and app launch)
    const checkReminder = async () => {
      try {
        // Get first launch date to determine which trigger to use
        const stats = await notificationReminderService.getReminderStats();
        
        if (!stats.firstLaunchDate) {
          // First time ever - check if coming from onboarding
          await checkAndShowReminder('onboarding');
        } else {
          // Not first time - check if 2 days have passed or cooldown expired
          const daysSinceInstall = stats.daysSinceInstall || 0;
          
          if (daysSinceInstall >= 2) {
            // It's been 2+ days since install, use that trigger
            await checkAndShowReminder('two_days_after_install');
          } else {
            // Check regular app launch trigger (respects cooldown)
            await checkAndShowReminder('app_launch');
          }
        }
      } catch (error) {
        console.error('[TabNavigator] Error checking notification reminder:', error);
      }
    };

    checkReminder();

    // Listen for app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground, check reminder again
        checkReminder();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [checkAndShowReminder]);

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
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
        options={{
          tabBarLabel: t('navigation.home'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
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
        name="ProfileStack"
        component={ProfileStackNavigator}
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

const styles = StyleSheet.create({
  tabBarWrapper: {
    backgroundColor: colors.background.primary,
  },
  bannerContainer: {
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.secondary[100],
  },
});

export default TabNavigator;
