import React from 'react';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { useAuth } from '../contexts/AuthContext';
import { useUserStats } from '../contexts/ProgressContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { DEMO_MODE, DEMO_STATS } from '../config/development.config';
import StatsGrid, { StatItem } from './StatsGrid';

interface ProfileStatsGridProps {
  marginBottom?: number;
  variant?: 'card' | 'compact';
  backgroundColor?: string;
}

const ProfileStatsGrid: React.FC<ProfileStatsGridProps> = ({ variant = 'card', marginBottom = 0, backgroundColor }) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const effectiveBackgroundColor = backgroundColor ?? colors.background.primary;
  const { user } = useAuth();
  const stats = useUserStats();

  // Use demo stats if demo mode is enabled
  const displayStats = DEMO_MODE ? DEMO_STATS : stats;

  const statsConfig: StatItem[] = [
    {
      icon: 'star',
      iconColor: colors.warning[600],
      iconBackgroundColor: colors.warning[100],
      value: user ? displayStats.completedExams : 0,
      label: t('profile.stats.examsCompleted'),
    },
    {
      icon: 'trophy',
      iconColor: colors.success[600],
      iconBackgroundColor: colors.success[100],
      value: `${user ? displayStats.averageScore : 0}%`,
      label: t('profile.stats.averageScore'),
    },
    // {
    //   icon: 'file-text',
    //   iconColor: colors.primary[600],
    //   iconBackgroundColor: colors.primary[100],
    //   value: user ? displayStats.totalScore : 0,
    //   label: t('profile.stats.totalScore'),
    // },
    // {
    //   icon: 'bolt',
    //   iconColor: colors.secondary[600],
    //   iconBackgroundColor: colors.secondary[100],
    //   value: `${user ? displayStats.completionRate : 0}%`,
    //   label: t('profile.stats.completionRate'),
    // },
  ];

  return <StatsGrid variant={variant} stats={statsConfig} backgroundColor={effectiveBackgroundColor} marginBottom={marginBottom} />;
}

export default ProfileStatsGrid;

