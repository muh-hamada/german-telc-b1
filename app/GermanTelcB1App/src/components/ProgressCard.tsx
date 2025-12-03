import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';
import { useUserStats } from '../contexts/ProgressContext';
import { useAuth } from '../contexts/AuthContext';
import { DEMO_MODE, DEMO_STATS } from '../config/development.config';
import Button from './Button';

interface ProgressCardProps {
  onPress?: () => void;
  onLoginPress?: () => void;
  showDetails?: boolean;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ onPress, onLoginPress, showDetails = true }) => {
  const { t } = useCustomTranslation();
  const stats = useUserStats();
  const { user } = useAuth();
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  
  useEffect(() => {
    // Simulate loading state for 2 seconds
    // We do this to avoid the loading state flashing when the user is logged in
    // but it takes a bit of time to load the "user" from the database
    const timeout = setTimeout(() => {
      setIsUserLoaded(true);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [])

  // Use demo stats if demo mode is enabled
  const displayStats = DEMO_MODE ? DEMO_STATS : stats;
  const hasUser = DEMO_MODE ? true : !!user;

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

  // If the user is not null, then render the card directly
  if (!isUserLoaded && user == null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  // If user is not logged in and not in demo mode, show login prompt only if they have progress
  if (!hasUser && displayStats.totalExams === 0) {
    return (
      <TouchableOpacity 
        style={styles.container} 
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        {/* <View style={styles.header}>
          <Text style={styles.title}>{t('progress.yourProgress')}</Text>
        </View> */}
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptIcon}>📊</Text>
          <Text style={styles.loginPromptTitle}>{t('progress.startTracking')}</Text>
          <Text style={styles.loginPromptText}>
            {t('progress.trackingPrompt')}
          </Text>
          {onLoginPress && <Button title={t('progress.login')} onPress={onLoginPress} size='small' style={styles.loginButton} />}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('progress.yourProgress')}</Text>
        {displayStats.totalExams > 0 && (
          <Text style={[styles.score, { color: getScoreColor(displayStats.averageScore) }]}>
            {displayStats.averageScore}%
          </Text>
        )}
      </View>

      {displayStats.totalExams > 0 ? (
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('progress.examsCompleted')}</Text>
            <Text style={styles.statValue}>
              {displayStats.completedExams} / {displayStats.totalExams}
            </Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('progress.completionRate')}</Text>
            <Text style={styles.statValue}>{displayStats.completionRate}%</Text>
          </View>

          {showDetails && (
            <>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{t('progress.totalScore')}</Text>
                <Text style={styles.statValue}>
                  {displayStats.totalScore} / {displayStats.totalMaxScore}
                </Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{t('progress.performance')}</Text>
                <Text style={[styles.statValue, { color: getScoreColor(displayStats.averageScore) }]}>
                  {getScoreText(displayStats.averageScore)}
                </Text>
              </View>
            </>
          )}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {t('progress.startPracticing')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.lg,
    // marginVertical: spacing.sm,
    ...spacing.shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
  },
  score: {
    ...typography.textStyles.h3,
    fontWeight: typography.fontWeight.bold,
  },
  statsContainer: {
    gap: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  statValue: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
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
  loadingState: {
    alignItems: 'center',
    paddingVertical: spacing.lg * 2,
  },
});

export default ProgressCard;
