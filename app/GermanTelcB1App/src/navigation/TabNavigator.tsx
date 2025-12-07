import React, { useEffect, useRef, useCallback } from 'react';
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
import { useModalQueue } from '../contexts/ModalQueueContext';
import { useRemoteConfig } from '../contexts/RemoteConfigContext';
import { usePremium } from '../contexts/PremiumContext';
import notificationReminderService from '../services/notification-reminder.service';
import premiumPromptService from '../services/premium-prompt.service';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

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
  'Premium',
];

const HIDE_BANNER_SCREENS = [
  'Premium',
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

  const shouldHideBanner = routeName && HIDE_BANNER_SCREENS.includes(routeName);

  return (
    <SafeAreaView edges={(shouldHideTabBar && !shouldHideBanner) ? ['bottom'] : []} style={styles.tabBarWrapper}>
      {/* Banner is ALWAYS visible - persistent across all screens */}
      {!shouldHideBanner && (
        <View style={styles.bannerContainer}>
          <AdBanner screen="main-tabs" />
        </View>
      )}

      {/* Tab bar only shown when not on a hidden screen */}
      {!shouldHideTabBar && <BottomTabBar {...props} />}
    </SafeAreaView>
  );
};

// Constants for premium upsell tracking
const USAGE_TRACKING_INTERVAL_SECONDS = 10; // Track every 10 seconds

const TabNavigator: React.FC = () => {
  const { t } = useCustomTranslation();
  const { checkAndShowReminder } = useNotificationReminder();
  const { enqueue } = useModalQueue();
  const { isPremiumFeaturesEnabled } = useRemoteConfig();
  const { isPremium } = usePremium();
  const appState = useRef(AppState.currentState);
  const usageTrackingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasEnqueuedPremiumModalRef = useRef(false);

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

  // Check if premium modal should be shown
  const checkPremiumModal = useCallback(async () => {
    // Don't show if premium features are disabled, user is already premium,
    // or we've already queued the modal in this session
    if (!isPremiumFeaturesEnabled() || isPremium || hasEnqueuedPremiumModalRef.current) {
      return;
    }

    if (premiumPromptService.shouldShowPremiumModal()) {
      console.log('[TabNavigator] Enqueueing premium upsell modal');
      hasEnqueuedPremiumModalRef.current = true;
      enqueue('premium-upsell');
      logEvent(AnalyticsEvents.PREMIUM_UPSELL_MODAL_SHOWN);
    }
  }, [isPremiumFeaturesEnabled, isPremium, enqueue]);

  // Initialize premium prompt service and start usage tracking
  useEffect(() => {
    // Don't track if premium features are disabled or user is already premium
    if (!isPremiumFeaturesEnabled() || isPremium) {
      return;
    }

    const initAndTrack = async () => {
      await premiumPromptService.initialize();

      // Check immediately on mount
      checkPremiumModal();

      // Start tracking usage time
      usageTrackingRef.current = setInterval(async () => {
        await premiumPromptService.incrementUsageTime(USAGE_TRACKING_INTERVAL_SECONDS);
        checkPremiumModal();
      }, USAGE_TRACKING_INTERVAL_SECONDS * 1000);
    };

    initAndTrack();

    return () => {
      if (usageTrackingRef.current) {
        clearInterval(usageTrackingRef.current);
        usageTrackingRef.current = null;
      }
    };
  }, [isPremiumFeaturesEnabled, isPremium, checkPremiumModal]);

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
