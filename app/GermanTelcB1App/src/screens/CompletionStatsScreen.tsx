import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import CompletionStatsCard from '../components/CompletionStatsCard';
import { useCompletion } from '../contexts/CompletionContext';
import { useAuth } from '../contexts/AuthContext';
import { DEMO_MODE, DEMO_COMPLETION_STATS } from '../config/development.config';

const CompletionStatsScreen: React.FC = () => {
  const { t } = useCustomTranslation();
  const { allStats, isLoading } = useCompletion();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Use demo stats if demo mode is enabled
  const displayStats = DEMO_MODE ? DEMO_COMPLETION_STATS : allStats;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>{t('stats.subtitle')}</Text>

        <CompletionStatsCard 
          stats={displayStats} 
          isLoading={isLoading} 
          showLoggedOutMessage={!user}
          showOnlyTop={false}
        />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.padding.lg,
  },
  subtitle: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.margin.lg,
    textAlign: 'left',
  },
});

export default CompletionStatsScreen;
