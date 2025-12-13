/**
 * Vocabulary Progress Screen
 * 
 * Statistics dashboard for vocabulary learning progress.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { spacing, typography, type ThemeColors } from '../theme';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { useVocabulary } from '../contexts/VocabularyContext';
import { useAppTheme } from '../contexts/ThemeContext';
import VocabularyStatsCard from '../components/VocabularyStatsCard';
import Card from '../components/Card';
import PersonaSelectorModal from '../components/PersonaSelectorModal';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import { UserPersona } from '../types/vocabulary.types';
import { PERSONA_DAILY_LIMITS } from '../types/vocabulary.types';

const VocabularyProgressScreen: React.FC = () => {
  const { t } = useCustomTranslation();
  const { stats, progress, isLoading, loadProgress, setUserPersona } = useVocabulary();
  const [refreshing, setRefreshing] = React.useState(false);
  const [isPersonaModalVisible, setIsPersonaModalVisible] = React.useState(false);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  React.useEffect(() => {
    logEvent(AnalyticsEvents.VOCABULARY_PROGRESS_OPENED);
  }, []);

  const handleRefresh = async () => {
    logEvent(AnalyticsEvents.VOCABULARY_PROGRESS_REFRESHED);
    setRefreshing(true);
    await loadProgress();
    setRefreshing(false);
  };

  const handlePersonaChange = async (persona: 'casual' | 'serious' | 'beginner') => {
    await setUserPersona(persona);
    logEvent(AnalyticsEvents.VOCABULARY_PERSONA_CHANGED, { persona });
  };

  const handleOpenPersonaModal = () => {
    logEvent(AnalyticsEvents.VOCABULARY_PERSONA_CHANGE_OPENED);
    setIsPersonaModalVisible(true);
  };

  if (isLoading || !stats || !progress) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary[500]}
          />
        }
      >

        {/* Stats Card */}
        <VocabularyStatsCard stats={stats} />

        {/* Breakdown Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t('vocabulary.progress.breakdown')}</Text>
          
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownDot, { backgroundColor: colors.secondary[400] }]} />
            <Text style={styles.breakdownLabel}>{t('vocabulary.progress.newWords')}</Text>
            <Text style={styles.breakdownValue}>{stats.newWords}</Text>
          </View>

          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownDot, { backgroundColor: colors.warning[500] }]} />
            <Text style={styles.breakdownLabel}>{t('vocabulary.progress.learning')}</Text>
            <Text style={styles.breakdownValue}>{stats.learningWords}</Text>
          </View>

          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownDot, { backgroundColor: colors.success[500] }]} />
            <Text style={styles.breakdownLabel}>{t('vocabulary.progress.reviewing')}</Text>
            <Text style={styles.breakdownValue}>{stats.reviewWords}</Text>
          </View>

          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownDot, { backgroundColor: colors.primary[500] }]} />
            <Text style={styles.breakdownLabel}>{t('vocabulary.progress.mastered')}</Text>
            <Text style={styles.breakdownValue}>{stats.masteredWords}</Text>
          </View>
        </Card>

        {/* Persona Card */}
        <TouchableOpacity 
          onPress={handleOpenPersonaModal}
          activeOpacity={0.7}
        >
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>{t('vocabulary.progress.learningPace')}</Text>
            <View style={styles.personaContainer}>
              <Text style={styles.personaLabel}>
                {t(`vocabulary.persona.${progress.persona}`)}
              </Text>
              <Text style={styles.personaDescription}>
                {t('vocabulary.progress.dailyLimit', {
                  count: PERSONA_DAILY_LIMITS[progress.persona],
                })}
              </Text>
            </View>
          </Card>
        </TouchableOpacity>
      </ScrollView>

      {/* Persona Selector Modal */}
      <PersonaSelectorModal
        visible={isPersonaModalVisible}
        onClose={() => setIsPersonaModalVisible(false)}
        onPersonaSelect={handlePersonaChange}
        currentPersona={progress.persona}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background.primary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.padding.lg,
      gap: spacing.margin.md,
    },
    card: {
      padding: spacing.padding.lg,
    },
    cardTitle: {
      ...typography.textStyles.h3,
      color: colors.text.primary,
      marginBottom: spacing.margin.md,
      textAlign: 'left',
    },
    breakdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.padding.sm,
    },
    breakdownDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: spacing.margin.md,
    },
    breakdownLabel: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      flex: 1,
      textAlign: 'left',
    },
    breakdownValue: {
      ...typography.textStyles.h3,
      color: colors.text.primary,
      fontWeight: 'bold',
    },
    personaContainer: {
      padding: spacing.padding.md,
      backgroundColor: colors.primary[50],
      borderRadius: 12,
    },
    personaLabel: {
      ...typography.textStyles.h3,
      color: colors.primary[700],
      marginBottom: spacing.margin.xs,
      textAlign: 'left',
    },
    personaDescription: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      textAlign: 'left',
    },
  });

export default VocabularyProgressScreen;

