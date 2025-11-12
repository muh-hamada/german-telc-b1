import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';
import CompletionStatsCard from '../components/CompletionStatsCard';
import { useCompletion } from '../contexts/CompletionContext';
import { useAuth } from '../contexts/AuthContext';

const CompletionStatsScreen: React.FC = () => {
  const { t } = useCustomTranslation();
  const { allStats, isLoading } = useCompletion();
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>{t('stats.subtitle')}</Text>

        <CompletionStatsCard 
          stats={allStats} 
          isLoading={isLoading} 
          showLoggedOutMessage={!user}
          showOnlyTop={false}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  },
});

export default CompletionStatsScreen;