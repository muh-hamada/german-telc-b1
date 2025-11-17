import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';
import { useStreak } from '../contexts/StreakContext';

interface DailyStreaksCardProps {
  // No props needed anymore, will use context
}

const DailyStreaksCard: React.FC<DailyStreaksCardProps> = () => {
  const { t } = useCustomTranslation();
  const { weeklyActivity, streakData, isLoading } = useStreak();

  // Map activity data to activity count for visualization
  const data = weeklyActivity.map(day => day.activitiesCount);

  console.log('weeklyActivity', weeklyActivity);
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Calculate max value for scaling
  const maxDataValue = Math.max(...data); // Minimum max of 10 for better visualization
  const maxValue = maxDataValue + 2; // Minimum max of 10 for better visualization
  
  // Get total for the week
  const totalActivity = data.reduce((sum, val) => sum + val, 0);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t('streaks.weeklyActivity')}</Text>
          <Text style={styles.subtitle}>
            {totalActivity} {t('streaks.totalActivities')}
          </Text>
          {streakData && (
            <Text style={styles.subtitle}>
              {t('streaks.longestStreak', { count: streakData.longestStreak })}
            </Text>
          )}
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalValue}>{totalActivity}</Text>
          <Text style={styles.totalIcon}>⚡</Text>
        </View>
      </View>

      {/* Reward Progress Indicator */}
      {streakData && streakData.currentStreak < 7 && !streakData.adFreeReward.claimed && (
        <View style={styles.rewardProgressContainer}>
          <View style={styles.rewardProgressHeader}>
            <Text style={styles.rewardProgressTitle}>
              🎁 {t('streaks.rewardProgress')}
            </Text>
            <Text style={styles.rewardProgressDays}>
              {streakData.currentStreak}/7 {t('streaks.days')}
            </Text>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${(streakData.currentStreak / 7) * 100}%` }
              ]} 
            />
          </View>
          
          <Text style={styles.rewardProgressMessage}>
            {t('streaks.rewardProgressMessage', { 
              days: 7 - streakData.currentStreak 
            })}
          </Text>
        </View>
      )}

      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yAxisLabel}>{maxValue}</Text>
          <Text style={styles.yAxisLabel}>{Math.round(maxValue * 0.5)}</Text>
          <Text style={styles.yAxisLabel}>0</Text>
        </View>

        {/* Bars */}
        <View style={styles.barsContainer}>
          {data.map((value, index) => {
            const heightPercentage = (value / maxValue) * 100;
            const isToday = index === 6; // Last day is today for demo purposes
            
            return (
              <View key={index} style={styles.barWrapper}>
                <View style={styles.barContainer}>
                  {/* Background grid line */}
                  <View style={styles.barBackground} />
                  
                  {/* Actual bar */}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${heightPercentage}%`,
                        backgroundColor: isToday
                          ? colors.primary[500]
                          : value > 0
                          ? colors.warning[500]
                          : colors.secondary[200],
                      },
                    ]}
                  >
                    {value > 0 && (
                      <Text style={styles.barValue}>{value}</Text>
                    )}
                  </View>
                </View>
                
                {/* Day label */}
                <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                  {days[index]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.padding.lg,
    marginBottom: spacing.margin.lg,
    ...spacing.shadow.sm,
  },
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.margin.md,
  },
  title: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  subtitle: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
  totalBadge: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.padding.md,
    paddingVertical: spacing.padding.sm,
    borderRadius: spacing.borderRadius.full,
  },
  totalValue: {
    ...typography.textStyles.h3,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.bold,
    marginRight: spacing.margin.xs,
  },
  totalIcon: {
    fontSize: 18,
  },
  chartContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    height: 180,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.padding.sm,
    marginBottom: spacing.margin.md,
    borderRadius: spacing.borderRadius.md,
  },
  yAxisLabel: {
    ...typography.textStyles.bodySmall,
    textAlign: 'center',
    color: colors.text.tertiary,
    fontSize: 10,
  },
  barsContainer: {
    flex: 1,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  barContainer: {
    width: '100%',
    height: 150,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  barBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    opacity: 0.3,
  },
  bar: {
    width: '80%',
    borderRadius: spacing.borderRadius.sm,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
    minHeight: 4,
  },
  barValue: {
    ...typography.textStyles.caption,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
    fontSize: 9,
  },
  dayLabel: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
    marginTop: spacing.margin.xs,
    fontSize: 10,
  },
  dayLabelToday: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },
  rewardProgressContainer: {
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

export default DailyStreaksCard;

