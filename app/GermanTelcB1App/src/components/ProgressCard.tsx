import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { useUserStats } from '../contexts/ProgressContext';
import { useAuth } from '../contexts/AuthContext';
import { DEMO_MODE, DEMO_STATS } from '../config/demo.config';

interface ProgressCardProps {
  onPress?: () => void;
  showDetails?: boolean;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ onPress, showDetails = true }) => {
  const stats = useUserStats();
  const { user } = useAuth();
  
  // Use demo stats if demo mode is enabled
  const displayStats = DEMO_MODE ? DEMO_STATS : stats;
  const hasUser = DEMO_MODE ? true : !!user;

  const getScoreColor = (score: number): string => {
    if (score >= 80) return colors.success[500];
    if (score >= 60) return colors.warning[500];
    return colors.error[500];
  };

  const getScoreText = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  // If user is not logged in and not in demo mode, show login prompt
  if (!hasUser) {
    return (
      <TouchableOpacity 
        style={styles.container} 
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Your Progress</Text>
        </View>
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptIcon}>🔒</Text>
          <Text style={styles.loginPromptTitle}>Login Required</Text>
          <Text style={styles.loginPromptText}>
            Please login to save and view your progress across all devices
          </Text>
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
        <Text style={styles.title}>Your Progress</Text>
        {displayStats.totalExams > 0 && (
          <Text style={[styles.score, { color: getScoreColor(displayStats.averageScore) }]}>
            {displayStats.averageScore}%
          </Text>
        )}
      </View>

      {displayStats.totalExams > 0 ? (
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Exams Completed</Text>
            <Text style={styles.statValue}>
              {displayStats.completedExams} / {displayStats.totalExams}
            </Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Completion Rate</Text>
            <Text style={styles.statValue}>{displayStats.completionRate}%</Text>
          </View>

          {showDetails && (
            <>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Total Score</Text>
                <Text style={styles.statValue}>
                  {displayStats.totalScore} / {displayStats.totalMaxScore}
                </Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Performance</Text>
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
            Start practicing to track your progress!
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
    marginBottom: spacing.md,
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
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
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
});

export default ProgressCard;
