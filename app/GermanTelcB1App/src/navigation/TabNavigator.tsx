import React from 'react';
import { View, StyleSheet } from 'react-native';
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
