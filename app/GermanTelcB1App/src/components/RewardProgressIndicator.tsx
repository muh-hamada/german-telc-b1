import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  I18nManager,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';
import { 
  STREAK_REWARD_THRESHOLD,
  calculateDaysUntilNextReward,
  calculateNextRewardDays,
  calculateRewardDays
} from '../constants/streak.constants';

interface RewardProgressIndicatorProps {
  currentStreak: number;
  showAdFreeReward?: boolean;
}

const RewardProgressIndicator: React.FC<RewardProgressIndicatorProps> = ({
  currentStreak,
  showAdFreeReward = true,
}) => {
  const { t } = useCustomTranslation();

  // Calculate progress to next reward milestone
  const daysUntilNextReward = calculateDaysUntilNextReward(currentStreak);
  const nextRewardDays = calculateNextRewardDays(currentStreak);
  const currentRewardLevel = calculateRewardDays(currentStreak);
  
  // Calculate progress within current milestone period
  const currentMilestoneStart = currentRewardLevel * STREAK_REWARD_THRESHOLD;
  const nextMilestoneTarget = (currentRewardLevel + 1) * STREAK_REWARD_THRESHOLD;
  const progressInCurrentPeriod = currentStreak - currentMilestoneStart;
  const progressPercentage = (progressInCurrentPeriod / STREAK_REWARD_THRESHOLD) * 100;

  return (
    <View style={styles.rewardProgressContainer}>
      <View style={styles.rewardProgressHeader}>
        <Text style={styles.rewardProgressTitle}>
          🎁 {t('streaks.rewardProgress')}
        </Text>
        <Text style={styles.rewardProgressDays}>
          {currentStreak}/{nextMilestoneTarget} {t('streaks.days')}
        </Text>
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${progressPercentage}%` }
          ]} 
        />
      </View>
      
      <Text style={styles.rewardProgressMessage}>
        {t('streaks.rewardProgressMessage', { 
          days: daysUntilNextReward,
          rewardDays: nextRewardDays
        })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  rewardProgressContainer: {
    width: '100%',
    backgroundColor: colors.success[50],
    borderRadius: spacing.borderRadius.md,
    padding: spacing.padding.md,
    marginBottom: spacing.margin.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.success[500],
  },
  rewardProgressHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.margin.sm,
  },
  rewardProgressTitle: {
    ...typography.textStyles.bodySmall,
    color: colors.success[700],
    fontWeight: typography.fontWeight.semibold,
  },
  rewardProgressDays: {
    ...typography.textStyles.bodySmall,
    color: colors.success[600],
    fontWeight: typography.fontWeight.bold,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.success[100],
    borderRadius: spacing.borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.margin.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success[500],
    borderRadius: spacing.borderRadius.full,
  },
  rewardProgressMessage: {
    ...typography.textStyles.caption,
    color: colors.success[700],
    textAlign: 'center',
  },
});

export default RewardProgressIndicator;

