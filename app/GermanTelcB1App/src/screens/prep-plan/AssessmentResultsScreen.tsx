/**
 * Assessment Results Screen
 * 
 * Displays diagnostic assessment results with section breakdown,
 * strengths/weaknesses, and generates personalized study plan.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useAppTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { spacing, typography, type ThemeColors } from '../../theme';
import { SpeakingEvaluation } from '../../types/prep-plan.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { speakingService } from '../../services/speaking.service';
import { HomeStackParamList } from '../../types/navigation.types';

type ScreenRouteProp = RouteProp<HomeStackParamList, 'AssessmentResults'>;

type Props = StackScreenProps<HomeStackParamList, 'AssessmentResults'>;

const AssessmentResultsScreen: React.FC<Props> = () => {
  const { t } = useCustomTranslation();
  const navigation = useNavigation();
  const route = useRoute<ScreenRouteProp>();
  const { dialogueId } = route.params as { dialogueId?: string };
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [evaluation, setEvaluation] = useState<SpeakingEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvaluation();
  }, []);

  const loadEvaluation = async () => {
    if (!user || !dialogueId) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('[AssessmentResults] Loading dialogue:', dialogueId);
      const dialogue = await speakingService.loadDialogueProgress(user.uid, dialogueId);
      console.log('[AssessmentResults] Dialogue loaded:', JSON.stringify(dialogue?.overallEvaluation));
      
      if (dialogue?.overallEvaluation) {
        setEvaluation(dialogue.overallEvaluation);
        logEvent(AnalyticsEvents.PREP_PLAN_RESULTS_VIEWED, {
          dialogueId,
          totalScore: dialogue.overallEvaluation.totalScore,
        });
      }
    } catch (error) {
      console.error('[AssessmentResults] Error loading evaluation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return colors.success[500];
    if (percentage >= 60) return colors.warning[500];
    return colors.error[500];
  };

  const renderScoreBar = (label: string, score: number, max: number) => {
    const percentage = (score / max) * 100;
    const color = getScoreColor(score, max);
    
    return (
      <View style={styles.sectionCard} key={label}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{label}</Text>
          <Text style={[styles.sectionPercentage, { color }]}>
            {Math.round(percentage)}%
          </Text>
        </View>
        
        <View style={styles.sectionProgressBar}>
          <View
            style={[
              styles.sectionProgressFill,
              { width: `${percentage}%`, backgroundColor: color },
            ]}
          />
        </View>
        
        <View style={styles.sectionFooter}>
          <Text style={styles.sectionScore}>
            {score} / {max} {t('examStructure.points')}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!evaluation) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{t('speaking.loadError')}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Overall Score */}
        <View style={styles.overallCard}>
          <Text style={styles.overallTitle}>{t('speaking.complete')}</Text>
          <View style={styles.overallScoreContainer}>
            <Text style={styles.overallScore}>
              {Math.round(evaluation.totalScore)}
            </Text>
            <Text style={styles.overallMax}>/ 100</Text>
          </View>
          <Text style={styles.feedbackText}>{evaluation.feedback}</Text>
        </View>

        {/* Section Breakdown */}
        <View style={styles.sectionsContainer}>
          <Text style={styles.sectionGroupTitle}>
            {t('speaking.scoresBreakdown')}
          </Text>
          
          {renderScoreBar(t('speaking.pronunciation'), evaluation.scores.pronunciation, 20)}
          {renderScoreBar(t('speaking.fluency'), evaluation.scores.fluency, 20)}
          {renderScoreBar(t('speaking.grammar'), evaluation.scores.grammarAccuracy, 20)}
          {renderScoreBar(t('speaking.vocabulary'), evaluation.scores.vocabularyRange, 20)}
          {renderScoreBar(t('speaking.content'), evaluation.scores.contentRelevance, 20)}
        </View>

        {/* Strengths */}
        {evaluation.strengths.length > 0 && (
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>
              {t('speaking.strengths')}
            </Text>
            {evaluation.strengths.map((strength, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemText}>• {strength}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Areas to Improve */}
        {evaluation.areasToImprove.length > 0 && (
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>
              {t('speaking.areasToImprove')}
            </Text>
            {evaluation.areasToImprove.map((area, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemText}>• {area}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.padding.xl,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.padding.lg,
  },
  loadingText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginTop: spacing.margin.md,
  },
  errorText: {
    ...typography.textStyles.body,
    color: colors.error[500],
    textAlign: 'center',
    marginBottom: spacing.margin.lg,
  },
  retryButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.xl,
    borderRadius: spacing.borderRadius.md,
  },
  retryButtonText: {
    ...typography.textStyles.button,
    color: colors.text.inverse,
  },
  overallCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.xl,
    borderRadius: spacing.borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.margin.xl,
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  overallTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
  },
  overallScoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    direction: 'ltr',
  },
  overallScore: {
    ...typography.textStyles.h1,
    color: colors.primary[500],
  },
  overallMax: {
    ...typography.textStyles.h2,
    color: colors.text.secondary,
    marginLeft: spacing.margin.xs,
  },
  starsContainer: {
    flexDirection: 'row',
    marginTop: spacing.margin.sm,
  },
  star: {
    fontSize: 24,
    opacity: 0.3,
    marginHorizontal: spacing.margin.xs,
  },
  starFilled: {
    opacity: 1,
  },
  overallLevel: {
    ...typography.textStyles.h4,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  sectionsContainer: {
  },
  feedbackText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.margin.md,
    lineHeight: 24,
  },
  sectionGroupTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
    textAlign: 'left',
  },
  sectionCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.margin.sm,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: spacing.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.margin.sm,
  },
  sectionIconText: {
    ...typography.textStyles.bold,
    color: colors.text.inverse,
  },
  sectionTitle: {
    ...typography.textStyles.bold,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'left',
  },
  sectionPercentage: {
    ...typography.textStyles.h4,
    fontWeight: 'bold',
  },
  sectionProgressBar: {
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: spacing.borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.margin.sm,
  },
  sectionProgressFill: {
    height: '100%',
    borderRadius: spacing.borderRadius.full,
  },
  sectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionScore: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
  },
  sectionLevel: {
    ...typography.textStyles.bold,
    textTransform: 'capitalize',
  },
  headerCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.xl,
    borderRadius: spacing.borderRadius.lg,
    marginBottom: spacing.margin.xl,
  },
  section: {
    marginBottom: spacing.margin.xl,
  },
  swSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.margin.xl,
  },
  swColumn: {
    flex: 1,
    marginHorizontal: spacing.margin.sm,
  },
  listContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
  },
  listTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
    textAlign: 'left',
  },
  listItem: {
    marginBottom: spacing.margin.sm,
  },
  listItemText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
  },
  generateButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.lg,
    paddingHorizontal: spacing.padding.xl,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    ...typography.textStyles.button,
    color: colors.text.inverse,
    marginLeft: spacing.margin.sm,
  },
  deleteButton: {
    paddingVertical: spacing.padding.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    ...typography.textStyles.body,
    color: colors.error[500],
    fontWeight: '600',
  },
});

export default AssessmentResultsScreen;

