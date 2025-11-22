import React from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';
import Card from '../components/Card';
import HomeProgressCard from '../components/HomeProgressCard';
import HomeHeader from '../components/HomeHeader';
import { HomeStackNavigationProp } from '../types/navigation.types';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation.types';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

type HomeScreenNavigationProp = CompositeNavigationProp<
  HomeStackNavigationProp,
  BottomTabNavigationProp<MainTabParamList>
>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { t } = useCustomTranslation();

  const handleExamStructurePress = () => {
    logEvent(AnalyticsEvents.EXAM_STRUCTURE_OPENED);
    navigation.navigate('ExamStructure');
  };

  const handlePracticePress = () => {
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'practice_menu' });
    navigation.navigate('PracticeMenu');
  };

  const handleVocabularyPress = () => {
    logEvent(AnalyticsEvents.VOCABULARY_HOME_OPENED);
    // Check if user has completed onboarding (has persona set)
    // For now, navigate directly to VocabularyHome
    navigation.navigate('VocabularyHome');
  };

  const handleLoginPress = () => {
    logEvent(AnalyticsEvents.PROGRESS_CARD_LOGIN_NAVIGATED);
    navigation.navigate('ProfileStack', { screen: 'Profile', params: { openLoginModal: true } });
  };

  const handleViewFullStats = () => {
    logEvent(AnalyticsEvents.PROGRESS_CARD_VIEW_FULL_STATS);
    navigation.navigate('ProfileStack', { screen: 'Profile' });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />
        
        <HomeProgressCard
          onLoginPress={handleLoginPress}
          onViewFullStats={handleViewFullStats}
        />

        <Card style={styles.card} onPress={handleExamStructurePress}>
          <Text style={styles.cardTitle}>{t('home.examStructure')}</Text>
          <Text style={styles.cardDescription}>
            {t('home.descriptions.examStructure')}
          </Text>
        </Card>

        <Card style={styles.card} onPress={handlePracticePress}>
          <Text style={styles.cardTitle}>{t('home.practice')}</Text>
          <Text style={styles.cardDescription}>
            {t('home.descriptions.practice')}
          </Text>
        </Card>

        <Card style={styles.card} onPress={handleVocabularyPress}>
          <Text style={styles.cardTitle}>{t('home.vocabulary')}</Text>
          <Text style={styles.cardDescription}>
            {t('home.descriptions.vocabulary')}
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.padding.lg,
    paddingTop: 0,
    gap: spacing.margin.md,
  },
  card: {
    minHeight: 120,
    justifyContent: 'center',
  },
  cardTitle: {
    ...typography.textStyles.h3,
    color: colors.primary[500],
    marginBottom: spacing.margin.sm,
  },
  cardDescription: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
});

export default HomeScreen;
