/**
 * Weekly Plan Screen
 * 
 * Shows detailed breakdown of tasks for a specific week:
 * - Week selector to navigate between weeks
 * - Focus areas for the week
 * - Daily task list
 * - Task completion tracking
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography } from '../../theme';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useAuth } from '../../contexts/AuthContext';
import { HomeStackParamList } from '../../types/navigation.types';
import { StudyPlan, WeeklyGoal, PrepPlanTask } from '../../types/prep-plan.types';
import { prepPlanService } from '../../services/prep-plan.service';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { hapticSelection } from '../../utils/haptic';

type NavigationProp = StackNavigationProp<HomeStackParamList, 'WeeklyPlan'>;
type ScreenRouteProp = RouteProp<HomeStackParamList, 'WeeklyPlan'>;

type Props = StackScreenProps<HomeStackParamList, 'WeeklyPlan'>;

const WeeklyPlanScreen: React.FC<Props> = () => {
  const { t } = useCustomTranslation();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();

  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [currentWeekNumber, setCurrentWeekNumber] = useState(
    route.params?.weekNumber || 1
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load plan
  useEffect(() => {
    loadPlan();
  }, [user]);

  const loadPlan = async () => {
    if (!user) return;

    try {
      const activePlan = await prepPlanService.getActivePlan(user.uid);
      if (activePlan) {
        setPlan(activePlan);
        setCurrentWeekNumber(route.params?.weekNumber || activePlan.currentWeek);
      } else {
        Alert.alert(
          t('prepPlan.weekly.noPlan'),
          t('prepPlan.weekly.noPlanDesc'),
          [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('[WeeklyPlan] Error loading plan:', error);
      Alert.alert(t('common.error'), t('prepPlan.weekly.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to previous week
  const handlePreviousWeek = () => {
    if (currentWeekNumber > 1) {
      hapticSelection();
      setCurrentWeekNumber(currentWeekNumber - 1);
      logEvent(AnalyticsEvents.PREP_PLAN_WEEK_VIEWED, {
        weekNumber: currentWeekNumber - 1,
      });
    }
  };

  // Navigate to next week
  const handleNextWeek = () => {
    if (plan && currentWeekNumber < plan.totalWeeks) {
      hapticSelection();
      setCurrentWeekNumber(currentWeekNumber + 1);
      logEvent(AnalyticsEvents.PREP_PLAN_WEEK_VIEWED, {
        weekNumber: currentWeekNumber + 1,
      });
    }
  };

  // Get task icon
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

  const currentWeek = plan.weeks[currentWeekNumber - 1];
  if (!currentWeek) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('prepPlan.weekly.weekNotFound')}</Text>
      </View>
    );
  }

  const completedTasks = currentWeek.tasks.filter(t => t.completed).length;
  const completionPercentage = Math.round(
    (completedTasks / currentWeek.tasks.length) * 100
  );

  return (
    <View style={styles.container}>
      {/* Week Selector */}
      <View style={styles.weekSelector}>
        <TouchableOpacity
          style={[styles.weekButton, currentWeekNumber === 1 && styles.weekButtonDisabled]}
          onPress={handlePreviousWeek}
          disabled={currentWeekNumber === 1}
        >
          <Icon
            name="chevron-left"
            size={24}
            color={currentWeekNumber === 1 ? colors.text.secondary : colors.primary[500]}
          />
        </TouchableOpacity>

        <View style={styles.weekInfo}>
          <Text style={styles.weekTitle}>
            {t('prepPlan.weekly.week')} {currentWeekNumber}
          </Text>
          <Text style={styles.weekSubtitle}>
            {new Date(currentWeek.startDate).toLocaleDateString()} -{' '}
            {new Date(currentWeek.endDate).toLocaleDateString()}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.weekButton,
            currentWeekNumber === plan.totalWeeks && styles.weekButtonDisabled,
          ]}
          onPress={handleNextWeek}
          disabled={currentWeekNumber === plan.totalWeeks}
        >
          <Icon
            name="chevron-right"
            size={24}
            color={
              currentWeekNumber === plan.totalWeeks
                ? colors.text.secondary
                : colors.primary[500]
            }
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Week Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              {t('prepPlan.weekly.weekProgress')}
            </Text>
            <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[styles.progressBar, { width: `${completionPercentage}%` }]}
            />
          </View>
          <Text style={styles.progressSubtitle}>
            {t('prepPlan.weekly.tasksCompletedRatio', { 
              completed: completedTasks, 
              total: currentWeek.tasks.length 
            })}
          </Text>

          {currentWeek.completed && (
            <View style={styles.completedBadge}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.completedBadgeText}>
                {t('prepPlan.weekly.weekCompleted')}
              </Text>
            </View>
          )}
        </View>

        {/* Focus Areas */}
        {currentWeek.focus && currentWeek.focus.length > 0 && (
          <View style={styles.focusCard}>
            <Text style={styles.focusTitle}>{t('prepPlan.weekly.focusAreas')}</Text>
            <View style={styles.focusChips}>
              {currentWeek.focus.map((area, index) => (
                <View key={index} style={styles.focusChip}>
                  <Text style={styles.focusChipText}>{area}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tasks List */}
        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>{t('prepPlan.weekly.tasks')}</Text>
          
          {currentWeek.tasks.map((task, index) => (
            <View
              key={task.id}
              style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
            >
              <View style={styles.taskHeader}>
                <View style={styles.taskIconContainer}>
                  <Icon
                    name={getTaskIcon(task.type)}
                    size={20}
                    color={task.completed ? colors.text.secondary : colors.primary[500]}
                  />
                </View>
                <View style={styles.taskInfo}>
                  <Text
                    style={[
                      styles.taskTitle,
                      task.completed && styles.taskTitleCompleted,
                    ]}
                  >
                    {task.title}
                  </Text>
                  {task.description && (
                    <Text style={styles.taskDescription}>{task.description}</Text>
                  )}
                </View>
                <View style={styles.taskStatus}>
                  {task.completed ? (
                    <Icon name="check-circle" size={24} color="#4CAF50" />
                  ) : (
                    <Icon name="radio-button-unchecked" size={24} color={colors.border.light} />
                  )}
                </View>
              </View>

              <View style={styles.taskMeta}>
                <View style={styles.taskMetaItem}>
                  <Icon name="access-time" size={14} color={colors.text.secondary} />
                  <Text style={styles.taskMetaText}>
                    {t('common.units.minutesValue', { count: task.estimatedMinutes })}
                  </Text>
                </View>

                {task.difficulty && (
                  <View style={styles.taskMetaItem}>
                    <Icon name="speed" size={14} color={colors.text.secondary} />
                    <Text style={styles.taskMetaText}>
                      {t(`prepPlan.weekly.difficulty.${task.difficulty}`)}
                    </Text>
                  </View>
                )}

                {task.completed && task.score !== undefined && (
                  <View style={styles.taskMetaItem}>
                    <Icon name="star" size={14} color="#FFB300" />
                    <Text style={styles.taskMetaText}>
                      {t('prepPlan.weekly.scoreRatio', { score: task.score, max: task.maxScore })}
                    </Text>
                  </View>
                )}
              </View>

              {task.completed && task.completedAt && (
                <Text style={styles.taskCompletedDate}>
                  {t('prepPlan.weekly.completedOn')}{' '}
                  {new Date(task.completedAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Estimated Time */}
        <View style={styles.summaryCard}>
          <Icon name="hourglass-empty" size={24} color={colors.primary[500]} />
          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>
              {t('prepPlan.weekly.totalTime')}
            </Text>
            <Text style={styles.summaryValue}>
              {t('common.units.hoursValue', { 
                count: Math.round(
                  currentWeek.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0) / 60
                )
              })}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  weekButton: {
    padding: 8,
  },
  weekButtonDisabled: {
    opacity: 0.3,
  },
  weekInfo: {
    flex: 1,
    alignItems: 'center',
  },
  weekTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  weekSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
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
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  progressSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    gap: 6,
  },
  completedBadgeText: {
    fontSize: typography.fontSize.sm,
    color: '#4CAF50',
    fontWeight: '600',
  },
  focusCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  focusTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  focusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  focusChip: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  focusChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[700],
    fontWeight: '600',
  },
  tasksSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  taskCardCompleted: {
    borderLeftColor: '#4CAF50',
    opacity: 0.7,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInfo: {
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
  taskDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  taskStatus: {
    marginLeft: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskMetaText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  taskCompletedDate: {
    fontSize: typography.fontSize.sm,
    color: '#4CAF50',
    marginTop: 8,
    fontStyle: 'italic',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryText: {
    marginLeft: 12,
  },
  summaryTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: '600',
  },
});

export default WeeklyPlanScreen;

