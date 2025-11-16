import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  I18nManager,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';

interface DailyStreaksCardProps {
  data?: number[];
}

// Mock data for demonstration - will be replaced with real data later
const MOCK_DATA = [25, 30, 20, 18, 22, 27, 15];

const DailyStreaksCard: React.FC<DailyStreaksCardProps> = ({ data = MOCK_DATA }) => {
  const { t } = useCustomTranslation();

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Calculate max value for scaling
  const maxValue = Math.max(...data, 30); // Minimum max of 30 for better visualization
  
  // Get total for the week
  const totalActivity = data.reduce((sum, val) => sum + val, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('profile.weeklyActivity')}</Text>
          <Text style={styles.subtitle}>
            {totalActivity} {t('profile.totalXP')}
          </Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalValue}>{totalActivity}</Text>
          <Text style={styles.totalIcon}>⚡</Text>
        </View>
      </View>

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
    marginBottom: spacing.margin.lg,
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
    alignItems: I18nManager.isRTL ? 'flex-start' : 'flex-end',
    paddingRight: I18nManager.isRTL ? 0 : spacing.padding.sm,
    paddingLeft: I18nManager.isRTL ? spacing.padding.sm : 0,
    width: 35,
  },
  yAxisLabel: {
    ...typography.textStyles.bodySmall,
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
    borderTopColor: colors.secondary[100],
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
});

export default DailyStreaksCard;

