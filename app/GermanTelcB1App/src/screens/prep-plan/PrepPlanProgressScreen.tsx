/**
 * Prep Plan Progress Screen
 * 
 * Shows comprehensive analytics and insights:
 * - Overall completion metrics
 * - Section progress comparison
 * - Weekly performance trends
 * - Study consistency calendar
 * - Improvement tracking (before/after)
 * - Exam readiness score
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography } from '../../theme';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useAuth } from '../../contexts/AuthContext';
import { StudyPlan, DiagnosticAssessment } from '../../types/prep-plan.types';
import { prepPlanService } from '../../services/prep-plan.service';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';

const { width } = Dimensions.get('window');

const PrepPlanProgressScreen: React.FC = () => {
  const { t } = useCustomTranslation();
  const { user } = useAuth();
  const navigation = useNavigation();

  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [assessment, setAssessment] = useState<DiagnosticAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress();
    logEvent(AnalyticsEvents.PREP_PLAN_PROGRESS_VIEWED);
  }, [user]);

  const loadProgress = async () => {
    if (!user) return;

    try {
      const activePlan = await prepPlanService.getActivePlan(user.uid);
      if (activePlan) {
        setPlan(activePlan);
        const assessmentData = await prepPlanService.getAssessment(user.uid);
        setAssessment(assessmentData);
      } else {
        Alert.alert(
          t('prepPlan.progress.noPlan'),
          t('prepPlan.progress.noPlanDesc'),
          [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('[PrepPlanProgress] Error loading data:', error);
      Alert.alert(t('common.error'), t('prepPlan.progress.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate exam readiness score (0-100)
  const calculateReadinessScore = (): number => {
    if (!plan) return 0;
    
    // Weighted score based on:
    // - Task completion (40%)
    // - Time invested (30%)
    // - Current week progress (30%)
    
    const taskCompletionScore = (plan.progress.completedTasks / plan.progress.totalTasks) * 40;
    const timeInvestedScore = Math.min(
      (plan.progress.completedStudyHours / plan.progress.totalStudyHours) * 30,
      30
    );
    const weekProgressScore = ((plan.currentWeek - 1) / plan.totalWeeks) * 30;
    
    return Math.round(taskCompletionScore + timeInvestedScore + weekProgressScore);
  };

  // Get readiness level
  const getReadinessLevel = (score: number): {
    label: string;
    color: string;
    icon: string;
  } => {
    if (score >= 80) {
      return {
        label: t('prepPlan.progress.readiness.excellent'),
        color: '#4CAF50',
        icon: 'check-circle',
      };
    } else if (score >= 60) {
      return {
        label: t('prepPlan.progress.readiness.good'),
        color: '#8BC34A',
        icon: 'thumb-up',
      };
    } else if (score >= 40) {
      return {
        label: t('prepPlan.progress.readiness.fair'),
        color: '#FFC107',
        icon: 'alert-circle',
      };
    } else {
      return {
        label: t('prepPlan.progress.readiness.needsWork'),
        color: '#FF5722',
        icon: 'alert',
      };
    }
  };

  // Render section progress bars
  const renderSectionProgress = () => {
    if (!assessment) return null;

    const sections = [
      { key: 'reading', data: assessment.sections.reading },
      { key: 'listening', data: assessment.sections.listening },
      { key: 'grammar', data: assessment.sections.grammar },
      { key: 'writing', data: assessment.sections.writing },
      { key: 'speaking', data: assessment.sections.speaking },
    ].filter(s => s.data !== undefined);

    return sections.map(section => {
      if (!section.data) return null;
      
      const percentage = section.data.percentage;
      const level = section.data.level;
      
      let barColor: string = colors.primary[500];
      if (level === 'strong') barColor = '#4CAF50';
      else if (level === 'weak') barColor = '#FF5722';
      else if (level === 'moderate') barColor = '#FFC107';

      return (
        <View key={section.key} style={styles.sectionProgressItem}>
          <View style={styles.sectionProgressHeader}>
            <Text style={styles.sectionProgressLabel}>
              {t(`prepPlan.diagnostic.sections.${section.key}`)}
            </Text>
            <Text style={styles.sectionProgressValue}>{Math.round(percentage)}%</Text>
          </View>
          <View style={styles.sectionProgressBarContainer}>
            <View
              style={[
                styles.sectionProgressBar,
                { width: `${percentage}%`, backgroundColor: barColor },
              ]}
            />
          </View>
          <Text style={[styles.sectionProgressLevel, { color: barColor }]}>
            {t(`prepPlan.results.level.${level}`)}
          </Text>
        </View>
      );
    });
  };

  // Render weekly performance
  const renderWeeklyPerformance = () => {
    if (!plan) return null;

    return plan.weeks.slice(0, plan.currentWeek).map((week, index) => {
      const completedTasks = week.tasks.filter(t => t.completed).length;
      const percentage = (completedTasks / week.tasks.length) * 100;

      return (
        <View key={week.weekNumber} style={styles.weekBarContainer}>
          <Text style={styles.weekBarLabel}>W{week.weekNumber}</Text>
          <View style={styles.weekBarBg}>
            <View
              style={[
                styles.weekBar,
                {
                  width: `${percentage}%`,
                  backgroundColor:
                    percentage >= 80
                      ? '#4CAF50'
                      : percentage >= 50
                      ? '#FFC107'
                      : '#FF5722',
                },
              ]}
            />
          </View>
          <Text style={styles.weekBarValue}>{Math.round(percentage)}%</Text>
        </View>
      );
    });
  };

  // Render study consistency calendar
  const renderStudyCalendar = () => {
    if (!plan) return null;

    const today = new Date();
    const startDate = new Date(plan.startDate);
    const daysSinceStart = Math.floor(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Show last 4 weeks (28 days)
    const daysToShow = Math.min(28, daysSinceStart);
    const calendarDays = [];

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Check if user studied that day (simplified - checking if any task completed that day)
      const hasActivity = plan.weeks.some(week =>
        week.tasks.some(task => {
          if (!task.completedAt) return false;
          const taskDate = new Date(task.completedAt);
          return taskDate.toDateString() === date.toDateString();
        })
      );

      calendarDays.push({
        date,
        hasActivity,
      });
    }

    return (
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => (
          <View
            key={index}
            style={[
              styles.calendarDay,
              day.hasActivity && styles.calendarDayActive,
            ]}
          >
            {day.hasActivity && <View style={styles.calendarDayDot} />}
          </View>
        ))}
      </View>
    );
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!plan) {
    return null;
  }

  const readinessScore = calculateReadinessScore();
  const readinessLevel = getReadinessLevel(readinessScore);
  const completionPercentage = Math.round(
    (plan.progress.completedTasks / plan.progress.totalTasks) * 100
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Exam Readiness Card */}
      <View style={styles.readinessCard}>
        <Text style={styles.cardTitle}>{t('prepPlan.progress.examReadiness')}</Text>
        <View style={styles.readinessContent}>
          <View style={styles.readinessCircle}>
            <Text style={styles.readinessScore}>{readinessScore}</Text>
            <Text style={styles.readinessOutOf}>/ 100</Text>
          </View>
          <View style={styles.readinessInfo}>
            <View style={styles.readinessLevel}>
              <Icon name={readinessLevel.icon} size={20} color={readinessLevel.color} />
              <Text style={[styles.readinessLevelText, { color: readinessLevel.color }]}>
                {readinessLevel.label}
              </Text>
            </View>
            <Text style={styles.readinessDescription}>
              {readinessScore >= 80
                ? t('prepPlan.progress.readinessDesc.excellent')
                : readinessScore >= 60
                ? t('prepPlan.progress.readinessDesc.good')
                : readinessScore >= 40
                ? t('prepPlan.progress.readinessDesc.fair')
                : t('prepPlan.progress.readinessDesc.needsWork')}
            </Text>
          </View>
        </View>
      </View>

      {/* Overall Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Icon name="checkbox-marked-circle" size={32} color={colors.primary[500]} />
          <Text style={styles.statValue}>{completionPercentage}%</Text>
          <Text style={styles.statLabel}>{t('prepPlan.progress.completion')}</Text>
        </View>
        <View style={styles.statBox}>
          <Icon name="clock-check" size={32} color="#4ECDC4" />
          <Text style={styles.statValue}>
            {t('common.units.hoursValue', { count: Math.round(plan.progress.completedStudyHours) })}
          </Text>
          <Text style={styles.statLabel}>{t('prepPlan.progress.timeStudied')}</Text>
        </View>
        <View style={styles.statBox}>
          <Icon name="fire" size={32} color="#FF6B35" />
          <Text style={styles.statValue}>{plan.progress.currentStreak}</Text>
          <Text style={styles.statLabel}>{t('prepPlan.progress.streak')}</Text>
        </View>
      </View>

      {/* Section Progress */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('prepPlan.progress.sectionProgress')}</Text>
        <Text style={styles.cardSubtitle}>
          {t('prepPlan.progress.sectionProgressDesc')}
        </Text>
        {renderSectionProgress()}
      </View>

      {/* Weekly Performance */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('prepPlan.progress.weeklyPerformance')}</Text>
        <Text style={styles.cardSubtitle}>
          {t('prepPlan.progress.weeklyPerformanceDesc')}
        </Text>
        <View style={styles.weeklyChart}>{renderWeeklyPerformance()}</View>
      </View>

      {/* Study Consistency */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('prepPlan.progress.studyConsistency')}</Text>
        <Text style={styles.cardSubtitle}>
          {t('prepPlan.progress.studyConsistencyDesc')}
        </Text>
        {renderStudyCalendar()}
        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendBoxActive]} />
            <Text style={styles.legendText}>{t('prepPlan.progress.studyDay')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendBoxInactive]} />
            <Text style={styles.legendText}>{t('prepPlan.progress.noStudy')}</Text>
          </View>
        </View>
      </View>

      {/* Strengths & Weaknesses */}
      {assessment && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t('prepPlan.progress.strengthsWeaknesses')}
          </Text>
          <View style={styles.swGrid}>
            <View style={styles.swColumn}>
              <Text style={styles.swTitle}>
                {t('prepPlan.progress.strengthsWithIcon')}
              </Text>
              {assessment.strengths.map((strength, index) => (
                <Text key={index} style={styles.swItem}>
                  • {strength}
                </Text>
              ))}
            </View>
            <View style={styles.swColumn}>
              <Text style={styles.swTitle}>
                {t('prepPlan.progress.weaknessesWithIcon')}
              </Text>
              {assessment.weaknesses.map((weakness, index) => (
                <Text key={index} style={styles.swItem}>
                  • {weakness}
                </Text>
              ))}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: 12,
  },
  readinessCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  readinessContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  readinessCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  readinessScore: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
  },
  readinessOutOf: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  readinessInfo: {
    flex: 1,
    marginLeft: 20,
  },
  readinessLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  readinessLevelText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  readinessDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 4,
    marginBottom: 16,
  },
  sectionProgressItem: {
    marginBottom: 16,
  },
  sectionProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionProgressLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  sectionProgressValue: {
    fontSize: typography.fontSize.base,
    color: colors.primary[500],
    fontWeight: '600',
  },
  sectionProgressBarContainer: {
    height: 8,
    backgroundColor: colors.border.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  sectionProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  sectionProgressLevel: {
    fontSize: typography.fontSize.sm,
    marginTop: 4,
    fontWeight: '600',
  },
  weeklyChart: {
    marginTop: 8,
  },
  weekBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weekBarLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    width: 30,
    fontWeight: '600',
  },
  weekBarBg: {
    flex: 1,
    height: 20,
    backgroundColor: colors.border.light,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  weekBar: {
    height: '100%',
    borderRadius: 4,
  },
  weekBarValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    width: 40,
    textAlign: 'right',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 12,
  },
  calendarDay: {
    width: (width - 32 - 28 * 3) / 7, // 7 days per row
    height: (width - 32 - 28 * 3) / 7,
    borderRadius: 4,
    backgroundColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayActive: {
    backgroundColor: colors.primary[500],
  },
  calendarDayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendBoxActive: {
    backgroundColor: colors.primary[500],
  },
  legendBoxInactive: {
    backgroundColor: colors.border.light,
  },
  legendText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  swGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  swColumn: {
    flex: 1,
  },
  swTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  swItem: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 4,
  },
});

export default PrepPlanProgressScreen;

