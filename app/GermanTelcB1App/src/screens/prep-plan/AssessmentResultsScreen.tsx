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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useAppTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { spacing, typography, type ThemeColors } from '../../theme';
import { prepPlanService } from '../../services/prep-plan.service';
import { DiagnosticAssessment } from '../../types/prep-plan.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { HomeStackParamList } from '../../types/navigation.types';

type ScreenRouteProp = RouteProp<HomeStackParamList, 'AssessmentResults'>;

const AssessmentResultsScreen: React.FC = () => {
  const { t } = useCustomTranslation();
  const navigation = useNavigation();
  const route = useRoute<ScreenRouteProp>();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [assessment, setAssessment] = useState<DiagnosticAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  useEffect(() => {
    loadAssessment();
  }, []);

  const loadAssessment = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const savedAssessment = await prepPlanService.getAssessment(user.uid);
      
      if (savedAssessment) {
        setAssessment(savedAssessment);
        logEvent(AnalyticsEvents.PREP_PLAN_RESULTS_VIEWED, {
          assessmentId: savedAssessment.assessmentId,
          overallScore: savedAssessment.overallScore,
          overallPercentage: savedAssessment.overallPercentage,
        });
      }
    } catch (error) {
      console.error('[AssessmentResults] Error loading assessment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!assessment || !user) return;
    
    try {
      setIsGeneratingPlan(true);
      
      // Get onboarding config
      const onboardingProgress = await prepPlanService.getOnboardingProgress();
      if (!onboardingProgress?.config) {
        console.error('[AssessmentResults] No onboarding config found');
        return;
      }
      
      // Generate study plan
      const plan = await prepPlanService.generateStudyPlan(
        user.uid,
        onboardingProgress.config,
        assessment
      );
      
      // Clear onboarding progress
      await prepPlanService.clearOnboardingProgress();
      
      logEvent(AnalyticsEvents.PREP_PLAN_GENERATED, {
        planId: plan.planId,
        totalWeeks: plan.totalWeeks,
        totalTasks: plan.progress.totalTasks,
      });
      
      // Navigate to dashboard
      navigation.navigate('StudyPlanDashboard' as never);
    } catch (error) {
      console.error('[AssessmentResults] Error generating plan:', error);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const getSectionColor = (level: 'weak' | 'moderate' | 'strong') => {
    switch (level) {
      case 'strong':
        return colors.success[500];
      case 'moderate':
        return colors.warning[500];
      case 'weak':
        return colors.error[500];
    }
  };

  const getSectionIcon = (level: 'weak' | 'moderate' | 'strong') => {
    switch (level) {
      case 'strong':
        return '✓';
      case 'moderate':
        return '~';
      case 'weak':
        return '!';
    }
  };

  const renderSectionCard = (
    sectionName: string,
    score: number,
    maxScore: number,
    percentage: number,
    level: 'weak' | 'moderate' | 'strong'
  ) => {
    const color = getSectionColor(level);
    const icon = getSectionIcon(level);
    
    return (
      <View style={styles.sectionCard} key={sectionName}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: color }]}>
              <Text style={styles.sectionIconText}>{icon}</Text>
            </View>
            <Text style={styles.sectionTitle}>
              {t(`prepPlan.diagnostic.sections.${sectionName}`)}
            </Text>
          </View>
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
            {t('prepPlan.results.scoreWithPoints', { score, max: maxScore })}
          </Text>
          <Text style={[styles.sectionLevel, { color }]}>
            {t(`prepPlan.results.level.${level}`)}
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

  if (!assessment) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{t('prepPlan.results.notFound')}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>{t('common.goBack')}</Text>
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
          <Text style={styles.overallTitle}>{t('prepPlan.results.title')}</Text>
          <View style={styles.overallScoreContainer}>
            <Text style={styles.overallScore}>
              {Math.round(assessment.overallPercentage)}%
            </Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map(star => (
                <Text
                  key={star}
                  style={[
                    styles.star,
                    star <= Math.round(assessment.overallPercentage / 20) && styles.starFilled,
                  ]}
                >
                  ⭐
                </Text>
              ))}
            </View>
          </View>
          <Text style={styles.overallLevel}>
            {t(`prepPlan.results.level.${assessment.overallLevel}`)}
          </Text>
        </View>

        {/* Section Breakdown */}
        <View style={styles.sectionsContainer}>
          <Text style={styles.sectionGroupTitle}>
            {t('prepPlan.results.sectionBreakdown')}
          </Text>
          
          {assessment.sections.reading && renderSectionCard(
            'reading',
            assessment.sections.reading.score,
            assessment.sections.reading.maxScore,
            assessment.sections.reading.percentage,
            assessment.sections.reading.level
          )}
          
          {assessment.sections.listening && renderSectionCard(
            'listening',
            assessment.sections.listening.score,
            assessment.sections.listening.maxScore,
            assessment.sections.listening.percentage,
            assessment.sections.listening.level
          )}
          
          {assessment.sections.grammar && renderSectionCard(
            'grammar',
            assessment.sections.grammar.score,
            assessment.sections.grammar.maxScore,
            assessment.sections.grammar.percentage,
            assessment.sections.grammar.level
          )}
          
          {assessment.sections.writing && renderSectionCard(
            'writing',
            assessment.sections.writing.score,
            assessment.sections.writing.maxScore,
            assessment.sections.writing.percentage,
            assessment.sections.writing.level
          )}
          
          {assessment.sections.speaking && renderSectionCard(
            'speaking',
            assessment.sections.speaking.score,
            assessment.sections.speaking.maxScore,
            assessment.sections.speaking.percentage,
            assessment.sections.speaking.level
          )}
        </View>

        {/* Strengths */}
        {assessment.strengths.length > 0 && (
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>
              {t('prepPlan.results.strengthsWithIcon')}
            </Text>
            {assessment.strengths.map((strength, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemText}>
                  {t('prepPlan.results.bulletPoint', { text: t(`prepPlan.diagnostic.sections.${strength}`) })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Weaknesses */}
        {assessment.weaknesses.length > 0 && (
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>
              {t('prepPlan.results.weaknessesWithIcon')}
            </Text>
            {assessment.weaknesses.map((weakness, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemText}>
                  {t('prepPlan.results.bulletPoint', { text: t(`prepPlan.diagnostic.sections.${weakness}`) })}
                </Text>
              </View>
            ))}
            <Text style={styles.weaknessNote}>
              {t('prepPlan.results.weaknessNote', {
                percentage: 60,
              })}
            </Text>
          </View>
        )}

        {/* Generate Plan Button */}
        <TouchableOpacity
          style={[styles.generateButton, isGeneratingPlan && styles.generateButtonDisabled]}
          disabled={isGeneratingPlan}
          onPress={handleGeneratePlan}
        >
          {isGeneratingPlan ? (
            <>
              <ActivityIndicator size="small" color={colors.text.inverse} />
              <Text style={styles.generateButtonText}>
                {t('prepPlan.results.generating')}
              </Text>
            </>
          ) : (
            <Text style={styles.generateButtonText}>
              {t('prepPlan.results.generatePlan')}
            </Text>
          )}
        </TouchableOpacity>
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
    alignItems: 'center',
    marginBottom: spacing.margin.sm,
  },
  overallScore: {
    ...typography.textStyles.h1,
    fontSize: 56,
    color: colors.primary[500],
    fontWeight: 'bold',
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
    marginBottom: spacing.margin.xl,
  },
  sectionGroupTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
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
  listContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.lg,
  },
  listTitle: {
    ...typography.textStyles.bold,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
  },
  listItem: {
    marginBottom: spacing.margin.sm,
  },
  listItemText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
  },
  weaknessNote: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
    marginTop: spacing.margin.md,
    fontStyle: 'italic',
  },
  generateButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.lg,
    paddingHorizontal: spacing.padding.xl,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: spacing.margin.lg,
    marginBottom: spacing.margin.xl,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    ...typography.textStyles.button,
    color: colors.text.inverse,
    marginLeft: spacing.margin.sm,
  },
});

export default AssessmentResultsScreen;

