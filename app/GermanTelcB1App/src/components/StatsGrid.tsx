import React, { useMemo } from 'react';
import { View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';

export interface StatItem {
  icon?: string;
  iconColor?: string;
  iconBackgroundColor?: string;
  value: string | number;
  label: string;
  valueColor?: string;
}

interface StatsGridProps {
  stats: StatItem[];
  variant?: 'card' | 'compact';
  marginBottom?: number;
  backgroundColor?: string;
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats, variant = 'compact', marginBottom = 0, backgroundColor }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isCard = variant === 'card';
  const effectiveBackgroundColor = backgroundColor ?? colors.background.primary;

  return (
    <View style={[isCard ? styles.statsGridCard : styles.statsGridCompact, { marginBottom }]}>
      {stats.map((stat, index) => (
        <View key={index} style={[isCard ? styles.statCard : styles.statItem, { backgroundColor: effectiveBackgroundColor }]}>
          {stat.icon && isCard && (
            <View 
              style={[
                styles.statIconContainer, 
                { backgroundColor: stat.iconBackgroundColor || colors.primary[100] }
              ]}
            >
              <Icon 
                name={stat.icon} 
                size={20} 
                color={stat.iconColor || colors.primary[600]} 
              />
            </View>
          )}
          <Text 
            style={[
              isCard ? styles.statValueCard : styles.statValueCompact,
              stat.valueColor ? { color: stat.valueColor } : {}
            ]}
          >
            {stat.value}
          </Text>
          <Text style={isCard ? styles.statLabelCard : styles.statLabelCompact}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    statsGridCard: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: spacing.margin.md,
    },
    statsGridCompact: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: spacing.margin.md,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      borderRadius: spacing.borderRadius.md,
      padding: spacing.padding.md,
      alignItems: 'center',
      ...spacing.shadow.sm,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.padding.sm,
      borderRadius: spacing.borderRadius.md,
      ...spacing.shadow.sm,
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.margin.sm,
    },
    statValueCard: {
      ...typography.textStyles.h3,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.margin.xs,
    },
    statValueCompact: {
      ...typography.textStyles.h4,
      fontSize: 16,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: spacing.margin.sm,
      lineHeight: 20,
      textAlign: 'center',
    },
    statLabelCard: {
      ...typography.textStyles.bodySmall,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    statLabelCompact: {
      ...typography.textStyles.bodySmall,
      fontSize: 11,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 16,
    },
  });

export default StatsGrid;

