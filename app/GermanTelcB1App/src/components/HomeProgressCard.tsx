import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, I18nManager, ActivityIndicator } from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';
import { useUserStats } from '../contexts/ProgressContext';
import { useAuth } from '../contexts/AuthContext';
import { DEMO_MODE, DEMO_STATS, DEMO_COMPLETION_STATS } from '../config/development.config';
import Button from './Button';
import { useCompletion } from '../contexts/CompletionContext';

interface HomeProgressCardProps {
  onLoginPress?: () => void;
  onViewFullStats?: () => void;
}

const HomeProgressCard: React.FC<HomeProgressCardProps> = ({ onLoginPress, onViewFullStats }) => {
  const { t } = useCustomTranslation();
  const stats = useUserStats();
  const { user } = useAuth();
  const { allStats } = useCompletion();
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  
  useEffect(() => {
    // Simulate loading state for 1 second
    // We do this to avoid the loading state flashing when the user is logged in
    // but it takes a bit of time to load the "user" from the database
    const timeout = setTimeout(() => {
      setIsUserLoaded(true);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [])

  // Use demo stats if demo mode is enabled
  const displayStats = DEMO_MODE ? DEMO_STATS : stats;
  const displayCompletionStats = DEMO_MODE ? DEMO_COMPLETION_STATS : allStats;
  const hasUser = DEMO_MODE ? true : !!user;

  // Calculate total progress from completion stats
  const getTotalProgress = () => {
    let totalCompleted = 0;
    let totalExams = 0;

    Object.values(displayCompletionStats).forEach(examType => {
      Object.values(examType).forEach(partStats => {
        totalCompleted += partStats.completed;
        totalExams += partStats.total;
      });
    });

    return { totalCompleted, totalExams, percentage: totalExams > 0 ? Math.round((totalCompleted / totalExams) * 100) : 0 };
  };

  const totalProgress = getTotalProgress();

  const getScoreColor = (score: number): string => {
    if (score >= 80) return colors.success[500];
    if (score >= 60) return colors.warning[500];
    return colors.error[500];
  };

  const getScoreText = (score: number): string => {
    if (score >= 80) return t('progress.performanceLevels.excellent');
    if (score >= 60) return t('progress.performanceLevels.good');
    if (score >= 40) return t('progress.performanceLevels.fair');
    return t('progress.performanceLevels.needsImprovement');
  };

  // If the user is not loaded yet, show loading
  if (!isUserLoaded && user == null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  // If user is not logged in and not in demo mode, show login prompt only if they have no progress
  if (!hasUser && displayStats.totalExams === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptIcon}>📊</Text>
          <Text style={styles.loginPromptTitle}>{t('progress.startTracking')}</Text>
          <Text style={styles.loginPromptText}>
            {t('progress.trackingPrompt')}
          </Text>
          {onLoginPress && <Button title={t('progress.login')} onPress={onLoginPress} size='small' style={styles.loginButton} />}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Total Progress Section */}
      <View style={styles.totalProgressSection}>
        <View style={styles.totalProgressHeader}>
          <Text style={styles.totalProgressTitle}>{t('profile.totalProgress')}</Text>
          <Text style={styles.totalProgressCount}>
            {totalProgress.totalCompleted}/{totalProgress.totalExams} {t('profile.questions')}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${totalProgress.percentage}%` },
            ]}
          />
        </View>
      </View>

      {/* Your Progress Stats */}
      {displayStats.totalExams > 0 && (
        <>
          <View style={styles.statsGrid}>
            {/* <View style={styles.statItem}>
              <Text style={styles.statValue}>{displayStats.completedExams}</Text>
              <Text style={styles.statLabel}>{t('progress.examsCompleted')}</Text>
            </View> */}
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: getScoreColor(displayStats.averageScore) }]}>
                {displayStats.averageScore}%
              </Text>
              <Text style={styles.statLabel}>{t('progress.score').split(' ').join('\n')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: getScoreColor(displayStats.averageScore) }]}>
                {getScoreText(displayStats.averageScore)}
              </Text>
              <Text style={styles.statLabel}>{t('progress.performance').split(' ').join('\n')}</Text>
            </View>
          </View>
        </>
      )}

      {/* View Full Stats Link */}
      {onViewFullStats && (
        <TouchableOpacity style={styles.viewFullStatsButton} onPress={onViewFullStats}>
          <Text style={styles.viewFullStatsText}>{t('progress.viewFullStats')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.lg,
    ...spacing.shadow.sm,
  },
  totalProgressSection: {
    marginBottom: spacing.sm,
  },
  totalProgressHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  totalProgressTitle: {
    ...typography.textStyles.h4,
    fontSize: 16,
    color: colors.text.primary,
  },
  totalProgressCount: {
    ...typography.textStyles.h4,
    fontSize: 16,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.secondary[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success[500],
    borderRadius: 4,
  },
  percentageText: {
    ...typography.textStyles.bodySmall,
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.sm,
  },
  statsGrid: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-around',
    gap: spacing.xs,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.sm,
    borderRadius: spacing.borderRadius.md,
  },
  statValue: {
    ...typography.textStyles.h4,
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.textStyles.bodySmall,
    fontSize: 11,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  viewFullStatsButton: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  viewFullStatsText: {
    ...typography.textStyles.bodySmall,
    fontSize: 13,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.medium,
  },
  loginPrompt: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  loginPromptIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  loginPromptTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  loginPromptText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  loginButton: {
    marginTop: spacing.md,
  },
});

export default HomeProgressCard;

