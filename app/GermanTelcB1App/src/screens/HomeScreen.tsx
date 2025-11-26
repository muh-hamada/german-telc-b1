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
import AnimatedGradientBorder from '../components/AnimatedGradientBorder';
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

  const handleListeningPracticePress = () => {
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'listening_practice' });
    navigation.navigate('ListeningPracticeList');
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
          <Text style={styles.cardTitle}>{t('home.solve')}</Text>
          <Text style={styles.cardDescription}>
            {t('home.descriptions.solve')}
          </Text>
        </Card>

        <AnimatedGradientBorder
          borderWidth={2}
          borderRadius={12}
          colors={['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#667eea']}
          duration={4000}
          style={{ ...styles.card, ...styles.animatedCard }}
        >
          <Card style={styles.cardInner} onPress={handleListeningPracticePress}>
            <Text style={styles.newLabel}>{t('home.newLabel')}</Text>
            <Text style={styles.cardTitle}>{t('home.listeningPractice')}</Text>
            <Text style={styles.cardDescription}>
              {t('home.descriptions.listeningPractice')}
            </Text>
          </Card>
        </AnimatedGradientBorder>

        <AnimatedGradientBorder
          borderWidth={2}
          borderRadius={12}
          colors={['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#667eea']}
          duration={4000}
          style={{ ...styles.card, ...styles.animatedCard }}
        >
          <Card style={styles.cardInner} onPress={handleVocabularyPress}>
            <Text style={styles.newLabel}>{t('home.newLabel')}</Text>
            <Text style={styles.cardTitle}>{t('home.vocabulary')}</Text>
            <Text style={styles.cardDescription}>
              {t('home.descriptions.vocabulary')}
            </Text>
          </Card>
        </AnimatedGradientBorder>
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
  animatedCard: {
    // ...spacing.shadow.xs,
  },
  cardInner: {
    minHeight: 120,
    justifyContent: 'center',
    borderWidth: 0,
  },
  newLabel: {
    position: 'absolute',
    top: 10,
    right: 11,
    textTransform: 'uppercase',
    color: colors.black,
    fontSize: 10,
  },
  cardTitle: {
    ...typography.textStyles.h3,
    color: colors.primary[500],
    marginBottom: spacing.margin.sm,
    textAlign: 'left',
  },
  cardDescription: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    lineHeight: 24,
    textAlign: 'left',
  },
});

export default HomeScreen;
