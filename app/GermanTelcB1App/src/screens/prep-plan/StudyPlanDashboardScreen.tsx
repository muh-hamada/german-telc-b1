/**
 * Study Plan Dashboard Screen
 * 
 * Main hub for the prep plan feature - shows:
 * - Exam countdown
 * - Overall progress
 * - Today's tasks
 * - Study streak
 * - Quick actions
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography } from '../../theme';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useAuth } from '../../contexts/AuthContext';
import { HomeStackParamList } from '../../types/navigation.types';
import { StudyPlan, PrepPlanTask } from '../../types/prep-plan.types';
import { prepPlanService } from '../../services/prep-plan.service';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { SkeletonLoader } from '../../components/SkeletonLoader';

type NavigationProp = StackNavigationProp<HomeStackParamList, 'StudyPlanDashboard'>;
type ScreenRouteProp = RouteProp<HomeStackParamList, 'StudyPlanDashboard'>;

type Props = StackScreenProps<HomeStackParamList, 'StudyPlanDashboard'>;

const StudyPlanDashboardScreen: React.FC<Props> = () => {
  const { t } = useCustomTranslation();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();

  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [todaysTasks, setTodaysTasks] = useState<PrepPlanTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate days until exam
  const getDaysUntilExam = () => {
    if (!plan) return 0;
    const today = new Date();
    const examDate = new Date(plan.endDate);
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Load plan and tasks
  const loadDashboard = async () => {
    if (!user) return;

    try {
      const activePlan = await prepPlanService.getActivePlan(user.uid);
      if (activePlan) {
        setPlan(activePlan);
        const tasks = await prepPlanService.getTodaysTasks(user.uid);
        setTodaysTasks(tasks);
      } else {
        // No active plan - redirect back to home
        Alert.alert(
          t('prepPlan.dashboard.noPlan'),
          t('prepPlan.dashboard.noPlanDesc'),
          [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('[StudyPlanDashboard] Error loading plan:', error);
      Alert.alert(t('common.error'), t('prepPlan.dashboard.loadError'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Reload on focus (to update completion status)
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
      logEvent(AnalyticsEvents.PREP_PLAN_DASHBOARD_OPENED);
    }, [user])
  );

  // Pull to refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboard();
  };

  // Navigate to task
  const handleStartTask = (task: PrepPlanTask) => {
    logEvent(AnalyticsEvents.PREP_PLAN_TASK_STARTED, {
      taskId: task.id,
      taskType: task.type,
    });

    // Navigate to appropriate screen based on task type
    try {
      switch (task.type) {
        case 'reading':
          navigation.navigate('ReadingPractice' as any);
          break;
        case 'listening':
          navigation.navigate('ListeningPractice' as any);
          break;
        case 'grammar':
          navigation.navigate('LanguagePractice' as any);
          break;
        case 'writing':
          navigation.navigate('WritingPractice' as any);
          break;
        case 'speaking':
          navigation.navigate('SpeakingAssessment', { dialogueId: 'part1' });
          break;
        case 'vocabulary':
          navigation.navigate('VocabularyBuilder' as any);
          break;
        case 'mock-exam':
          navigation.navigate('MockExamsList' as any);
          break;
        default:
          logEvent(AnalyticsEvents.PREP_PLAN_TASK_NAVIGATION_FAILED, {
            taskId: task.id,
            taskType: task.type,
            reason: 'unknown_task_type',
          });
          Alert.alert(t('common.error'), t('prepPlan.dashboard.taskTypeNotSupported'));
      }
    } catch (error) {
      logEvent(AnalyticsEvents.PREP_PLAN_TASK_NAVIGATION_FAILED, {
        taskId: task.id,
        taskType: task.type,
        reason: 'navigation_error',
        error: String(error),
      });
      Alert.alert(t('common.error'), t('prepPlan.dashboard.taskTypeNotSupported'));
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header Skeleton */}
        <View style={styles.header}>
          <SkeletonLoader width={120} height={24} style={{ marginBottom: 8 }} />
          <SkeletonLoader width={80} height={32} />
        </View>

        {/* Progress Card Skeleton */}
        <View style={styles.progressCard}>
          <SkeletonLoader width={150} height={20} style={{ marginBottom: 12 }} />
          <SkeletonLoader width="100%" height={12} borderRadius={6} style={{ marginBottom: 8 }} />
          <SkeletonLoader width={120} height={16} />
        </View>

        {/* Stats Row Skeleton */}
        <View style={styles.statsRow}>
          {[1, 2, 3].map((_, index) => (
            <View key={index} style={styles.statCard}>
              <SkeletonLoader width={40} height={40} borderRadius={20} style={{ marginBottom: 8 }} />
              <SkeletonLoader width={40} height={24} style={{ marginBottom: 4 }} />
              <SkeletonLoader width={60} height={16} />
            </View>
          ))}
        </View>

        {/* Tasks Section Skeleton */}
        <View style={styles.section}>
          <SkeletonLoader width={150} height={22} style={{ marginBottom: 16 }} />
          {[1, 2, 3].map((_, index) => (
            <View key={index} style={[styles.taskCard, { marginBottom: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <SkeletonLoader width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <SkeletonLoader width="80%" height={18} style={{ marginBottom: 6 }} />
                  <SkeletonLoader width="40%" height={14} />
                </View>
                <SkeletonLoader width={24} height={24} borderRadius={12} />
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions Skeleton */}
        <View style={styles.section}>
          <SkeletonLoader width={120} height={22} style={{ marginBottom: 16 }} />
          {[1, 2, 3].map((_, index) => (
            <View key={index} style={[styles.actionButton, { marginBottom: 8 }]}>
              <SkeletonLoader width="100%" height={20} />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (!plan) {
    return null; // Will show alert and redirect
  }

  const daysUntilExam = getDaysUntilExam();
  const completionPercentage = Math.round(
    (plan.progress.completedTasks / plan.progress.totalTasks) * 100
  );
  const currentWeek = plan.weeks[plan.currentWeek - 1];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header - Exam Countdown */}
      <View style={styles.headerCard}>
        <View style={styles.examCountdownContainer}>
          <Icon name="event" size={32} color={colors.primary[500]} />
          <View style={styles.examCountdownText}>
            <Text style={styles.examLabel}>{t('prepPlan.dashboard.examIn')}</Text>
            <Text style={styles.examDays}>
              {daysUntilExam} {t('prepPlan.dashboard.days')}
            </Text>
            <Text style={styles.examDate}>
              {new Date(plan.endDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Overall Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              {t('prepPlan.dashboard.overallProgress')}
            </Text>
            <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[styles.progressBar, { width: `${completionPercentage}%` }]}
            />
          </View>
          <Text style={styles.progressSubtitle}>
            {t('prepPlan.dashboard.tasksCompletedRatio', {
              completed: plan.progress.completedTasks,
              total: plan.progress.totalTasks
            })}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Icon name="local-fire-department" size={24} color="#FF6B35" />
          <Text style={styles.statValue}>{plan.progress.currentStreak}</Text>
          <Text style={styles.statLabel}>{t('prepPlan.dashboard.dayStreak')}</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="access-time" size={24} color={colors.primary[500]} />
          <Text style={styles.statValue}>
            {Math.round(plan.progress.completedStudyHours)}
          </Text>
          <Text style={styles.statLabel}>{t('prepPlan.dashboard.hoursStudied')}</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="date-range" size={24} color="#4ECDC4" />
          <Text style={styles.statValue}>
            {t('prepPlan.dashboard.weekRatio', { current: plan.currentWeek, total: plan.totalWeeks })}
          </Text>
          <Text style={styles.statLabel}>{t('prepPlan.dashboard.currentWeek')}</Text>
        </View>
      </View>

      {/* Today's Tasks */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {t('prepPlan.dashboard.todaysTasks')}
          </Text>
          {todaysTasks.length > 0 && (
            <Text style={styles.sectionSubtitle}>
              {t('prepPlan.dashboard.completedRatio', {
                completed: todaysTasks.filter(t => t.completed).length,
                total: todaysTasks.length
              })}
            </Text>
          )}
        </View>

        {todaysTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="check-circle" size={48} color="#4CAF50" />
            <Text style={styles.emptyStateTitle}>
              {t('prepPlan.dashboard.noTasksToday')}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {t('prepPlan.dashboard.noTasksDesc')}
            </Text>
          </View>
        ) : (
          todaysTasks.map(task => (
            <TouchableOpacity
              key={task.id}
              style={[
                styles.taskCard,
                task.completed && styles.taskCardCompleted,
              ]}
              onPress={() => !task.completed && handleStartTask(task)}
              disabled={task.completed}
            >
              <View style={styles.taskIcon}>
                <Icon
                  name={getTaskIcon(task.type)}
                  size={24}
                  color={task.completed ? colors.text.secondary : colors.primary[500]}
                />
              </View>
              <View style={styles.taskContent}>
                <Text
                  style={[
                    styles.taskTitle,
                    task.completed && styles.taskTitleCompleted,
                  ]}
                >
                  {task.title}
                </Text>
                <View style={styles.taskMeta}>
                  <Icon name="access-time" size={14} color={colors.text.secondary} />
                  <Text style={styles.taskMetaText}>
                    {t('common.units.minutesValue', { count: task.estimatedMinutes })}
                  </Text>
                </View>
              </View>
              <View style={styles.taskAction}>
                {task.completed ? (
                  <Icon name="check-circle" size={24} color="#4CAF50" />
                ) : (
                  <Icon name="play-circle" size={24} color={colors.primary[500]} />
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('prepPlan.dashboard.quickActions')}</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            logEvent(AnalyticsEvents.PREP_PLAN_QUICK_ACTION_CLICKED, {
              action: 'view_weekly_plan',
              weekNumber: plan.currentWeek,
            });
            navigation.navigate('WeeklyPlan', { weekNumber: plan.currentWeek });
          }}
        >
          <Icon name="event-note" size={24} color={colors.primary[500]} />
          <Text style={styles.actionButtonText}>
            {t('prepPlan.dashboard.viewWeeklyPlan')}
          </Text>
          <Icon name="chevron-right" size={24} color={colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            logEvent(AnalyticsEvents.PREP_PLAN_QUICK_ACTION_CLICKED, {
              action: 'view_progress',
            });
            navigation.navigate('PrepPlanProgress');
          }}
        >
          <Icon name="show-chart" size={24} color={colors.primary[500]} />
          <Text style={styles.actionButtonText}>
            {t('prepPlan.dashboard.viewProgress')}
          </Text>
          <Icon name="chevron-right" size={24} color={colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            logEvent(AnalyticsEvents.PREP_PLAN_QUICK_ACTION_CLICKED, {
              action: 'update_settings',
            });
            navigation.navigate('PrepPlanSettings');
          }}
        >
          <Icon name="settings" size={24} color={colors.primary[500]} />
          <Text style={styles.actionButtonText}>
            {t('prepPlan.dashboard.updateSettings')}
          </Text>
          <Icon name="chevron-right" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Helper function to get icon for task type
const getTaskIcon = (type: PrepPlanTask['type']): string => {
  const iconMap: Record<PrepPlanTask['type'], string> = {
    reading: 'book-open-page-variant',
    listening: 'headphones',
    grammar: 'pencil',
    writing: 'text-box',
    speaking: 'microphone',
    vocabulary: 'cards',
    'mock-exam': 'clipboard-text',
  };
  return iconMap[type] || 'help-circle';
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
  header: {
    marginBottom: 16,
  },
  progressCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  examCountdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  examCountdownText: {
    marginLeft: 12,
    flex: 1,
  },
  examLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  examDays: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  examDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.border.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  progressSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  emptyState: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    marginLeft: 12,
  },
  taskTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: '600',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.secondary,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  taskMetaText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  taskAction: {
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
});

export default StudyPlanDashboardScreen;

