/**
 * Vocabulary Home Screen
 * 
 * Main hub for vocabulary learning with study and review options.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { useVocabulary } from '../contexts/VocabularyContext';
import Card from '../components/Card';
import VocabularyProgressCircle from '../components/VocabularyProgressCircle';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import type { HomeStackNavigationProp } from '../types/navigation.types';

const VocabularyHomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useCustomTranslation();
  const { stats, progress, isLoading, newWordsCount, dueReviewsCount } = useVocabulary();

  React.useEffect(() => {
    logEvent(AnalyticsEvents.VOCABULARY_HOME_OPENED);
  }, []);

  const handleStudyNew = () => {
    if (newWordsCount === 0) {
      return;
    }
    logEvent(AnalyticsEvents.VOCABULARY_STUDY_NEW_STARTED);
    navigation.navigate('VocabularyStudyNew');
  };

  const handleReview = () => {
    if (dueReviewsCount === 0) {
      return;
    }
    logEvent(AnalyticsEvents.VOCABULARY_REVIEW_STARTED);
    navigation.navigate('VocabularyReview');
  };

  const handleViewProgress = () => {
    logEvent(AnalyticsEvents.VOCABULARY_PROGRESS_OPENED);
    navigation.navigate('VocabularyProgress');
  };

  if (isLoading || !stats || !progress) {
    return (
      <View style={styles.loadingContainer}>
      <Text>{JSON.stringify({isLoading, stats, progress, newWordsCount, dueReviewsCount})}</Text>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Progress Circle */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('vocabulary.title')}</Text>
          <VocabularyProgressCircle
            current={stats.masteredWords}
            total={stats.totalWords}
            size={140}
          />
          <View style={styles.streakContainer}>
            <Text style={styles.streakText}>
              {progress.streak} {t('vocabulary.dayStreak')}
            </Text>
          </View>
        </View>

        {/* Study New Words Card */}
        <Card
          style={[
            styles.actionCard,
            newWordsCount === 0 && styles.disabledCard,
          ]}
          onPress={handleStudyNew}
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.success[100] }]}>
              <Icon name="school" size={32} color={colors.success[500]} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{t('vocabulary.studyNew')}</Text>
              <Text style={styles.cardDescription}>
                {t('vocabulary.newWordsAvailable', { count: newWordsCount })}
              </Text>
            </View>
            {newWordsCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.success[500] }]}>
                <Text style={styles.badgeText}>{newWordsCount}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Review Card */}
        <Card
          style={[
            styles.actionCard,
            dueReviewsCount === 0 && styles.disabledCard,
          ]}
          onPress={handleReview}
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.warning[100] }]}>
              <Icon name="refresh" size={32} color={colors.warning[500]} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{t('vocabulary.review')}</Text>
              <Text style={styles.cardDescription}>
                {t('vocabulary.dueReviews', { count: dueReviewsCount })}
              </Text>
            </View>
            {dueReviewsCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.warning[500] }]}>
                <Text style={styles.badgeText}>{dueReviewsCount}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Progress Card */}
        <Card style={styles.actionCard} onPress={handleViewProgress}>
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary[100] }]}>
              <Icon name="trending-up" size={32} color={colors.primary[500]} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{t('vocabulary.viewProgress')}</Text>
              <Text style={styles.cardDescription}>
                {t('vocabulary.viewProgressDesc')}
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.padding.lg,
    gap: spacing.margin.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.margin.lg,
    paddingVertical: spacing.padding.lg,
  },
  title: {
    ...typography.textStyles.h1,
    color: colors.text.primary,
    marginBottom: spacing.margin.lg,
  },
  streakContainer: {
    marginTop: spacing.margin.md,
    paddingHorizontal: spacing.padding.lg,
    paddingVertical: spacing.padding.sm,
    backgroundColor: colors.warning[50],
    borderRadius: 20,
  },
  streakText: {
    ...typography.textStyles.body,
    color: colors.warning[700],
    fontWeight: '600',
  },
  actionCard: {
    marginBottom: spacing.margin.md,
  },
  disabledCard: {
    opacity: 0.5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.margin.md,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  cardDescription: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
  },
  badge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.padding.sm,
  },
  badgeText: {
    ...typography.textStyles.caption,
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default VocabularyHomeScreen;

