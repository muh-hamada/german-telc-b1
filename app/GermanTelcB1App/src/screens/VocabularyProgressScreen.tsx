/**
 * Vocabulary Progress Screen
 * 
 * Statistics dashboard for vocabulary learning progress.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { useVocabulary } from '../contexts/VocabularyContext';
import VocabularyStatsCard from '../components/VocabularyStatsCard';
import Card from '../components/Card';

const VocabularyProgressScreen: React.FC = () => {
  const { t } = useCustomTranslation();
  const { stats, progress, isLoading, loadProgress } = useVocabulary();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProgress();
    setRefreshing(false);
  };

  if (isLoading || !stats || !progress) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary[500]}
          />
        }
      >
        <Text style={styles.title}>{t('vocabulary.progress.title')}</Text>

        {/* Stats Card */}
        <VocabularyStatsCard stats={stats} streak={progress.streak} />

        {/* Breakdown Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t('vocabulary.progress.breakdown')}</Text>
          
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownDot, { backgroundColor: colors.secondary[400] }]} />
            <Text style={styles.breakdownLabel}>{t('vocabulary.progress.newWords')}</Text>
            <Text style={styles.breakdownValue}>{stats.newWords}</Text>
          </View>

          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownDot, { backgroundColor: colors.warning[500] }]} />
            <Text style={styles.breakdownLabel}>{t('vocabulary.progress.learning')}</Text>
            <Text style={styles.breakdownValue}>{stats.learningWords}</Text>
          </View>

          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownDot, { backgroundColor: colors.success[500] }]} />
            <Text style={styles.breakdownLabel}>{t('vocabulary.progress.reviewing')}</Text>
            <Text style={styles.breakdownValue}>{stats.reviewWords}</Text>
          </View>

          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownDot, { backgroundColor: colors.primary[500] }]} />
            <Text style={styles.breakdownLabel}>{t('vocabulary.progress.mastered')}</Text>
            <Text style={styles.breakdownValue}>{stats.masteredWords}</Text>
          </View>
        </Card>

        {/* Persona Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t('vocabulary.progress.learningPace')}</Text>
          <View style={styles.personaContainer}>
            <Text style={styles.personaLabel}>
              {t(`vocabulary.persona.${progress.persona}`)}
            </Text>
            <Text style={styles.personaDescription}>
              {t('vocabulary.progress.dailyLimit', {
                count: progress.persona === 'beginner' ? 10 : progress.persona === 'serious' ? 20 : 5,
              })}
            </Text>
          </View>
        </Card>

        {/* Streak Info */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t('vocabulary.progress.streakInfo')}</Text>
          <View style={styles.streakInfo}>
            <View style={styles.streakItem}>
              <Text style={styles.streakValue}>{progress.streak}</Text>
              <Text style={styles.streakLabel}>{t('vocabulary.progress.currentStreak')}</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakItem}>
              <Text style={styles.streakValue}>{progress.longestStreak}</Text>
              <Text style={styles.streakLabel}>{t('vocabulary.progress.longestStreak')}</Text>
            </View>
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
  title: {
    ...typography.textStyles.h1,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
  },
  card: {
    padding: spacing.padding.lg,
  },
  cardTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.padding.sm,
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.margin.md,
  },
  breakdownLabel: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    flex: 1,
  },
  breakdownValue: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  personaContainer: {
    padding: spacing.padding.md,
    backgroundColor: colors.primary[50],
    borderRadius: 12,
  },
  personaLabel: {
    ...typography.textStyles.h3,
    color: colors.primary[700],
    marginBottom: spacing.margin.xs,
  },
  personaDescription: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakValue: {
    ...typography.textStyles.h1,
    color: colors.warning[500],
    fontWeight: 'bold',
    marginBottom: spacing.margin.xs,
  },
  streakLabel: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  streakDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.secondary[200],
  },
});

export default VocabularyProgressScreen;

