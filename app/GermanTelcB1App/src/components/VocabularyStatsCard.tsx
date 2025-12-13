/**
 * Vocabulary Stats Card Component
 * 
 * Displays vocabulary learning statistics and forecast.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import Card from './Card';
import { VocabularyStats } from '../types/vocabulary.types';
import { useCustomTranslation } from '../hooks/useCustomTranslation';

interface VocabularyStatsCardProps {
  stats: VocabularyStats;
}

const VocabularyStatsCard: React.FC<VocabularyStatsCardProps> = ({ stats }) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('vocabulary.stats.title')}</Text>
      </View>

      <View style={styles.statsGrid}>
        {/* Words Mastered */}
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.masteredWords}</Text>
          <Text style={styles.statLabel}>{t('vocabulary.wordsMastered')}</Text>
        </View>

        {/* Due Today */}
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.error[500] }]}>
            {stats.dueToday}
          </Text>
          <Text style={styles.statLabel}>{t('vocabulary.dueToday')}</Text>
        </View>

        {/* In Learning */}
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success[500] }]}>
            {stats.learningWords}
          </Text>
          <Text style={styles.statLabel}>{t('vocabulary.learning')}</Text>
        </View>

        {/* Total Words */}
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary[500] }]}>
            {stats.totalWords}
          </Text>
          <Text style={styles.statLabel}>{t('vocabulary.totalWords')}</Text>
        </View>
      </View>

      {/* Forecast */}
      <View style={styles.forecastContainer}>
        <Text style={styles.forecast}>
          {t('vocabulary.forecast', { count: stats.forecastThisMonth })}
        </Text>
      </View>
    </Card>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      padding: spacing.padding.lg,
    },
    header: {
      marginBottom: spacing.margin.md,
    },
    title: {
      ...typography.textStyles.h3,
      color: colors.text.primary,
      textAlign: 'left',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.margin.md,
    },
    statItem: {
      flex: 1,
      minWidth: '45%',
      alignItems: 'center',
      padding: spacing.padding.md,
      backgroundColor: colors.background.primary,
      borderRadius: 12,
    },
    statValue: {
      ...typography.textStyles.h2,
      color: colors.primary[500],
      fontWeight: 'bold',
      marginBottom: spacing.margin.xs,
    },
    statLabel: {
      ...typography.textStyles.caption,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    forecastContainer: {
      marginTop: spacing.margin.lg,
      padding: spacing.padding.md,
      backgroundColor: colors.primary[50],
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary[500],
    },
    forecast: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      textAlign: 'center',
    },
  });

export default VocabularyStatsCard;

