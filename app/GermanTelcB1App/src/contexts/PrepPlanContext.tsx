/**
 * Prep Plan Context
 * 
 * Provides real-time access to the user's active study plan, today's tasks,
 * and task completion functionality.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from './AuthContext';
import { prepPlanService } from '../services/prep-plan.service';
import { activeExamConfig } from '../config/active-exam.config';
import {
  StudyPlan,
  PrepPlanTask,
  WeeklyGoal,
} from '../types/prep-plan.types';
import { logEvent, AnalyticsEvents } from '../services/analytics.events';

interface PrepPlanContextValue {
  activePlan: StudyPlan | null;
  todaysTasks: PrepPlanTask[];
  currentWeek: WeeklyGoal | null;
  isLoading: boolean;
  error: string | null;
  refreshPlan: () => Promise<void>;
  completeTask: (taskId: string, score?: number, maxScore?: number) => Promise<void>;
  getDaysUntilExam: () => number;
  getExamReadinessScore: () => number;
}

const PrepPlanContext = createContext<PrepPlanContextValue | undefined>(undefined);

interface PrepPlanProviderProps {
  children: ReactNode;
}

export const PrepPlanProvider: React.FC<PrepPlanProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [todaysTasks, setTodaysTasks] = useState<PrepPlanTask[]>([]);
  const [currentWeek, setCurrentWeek] = useState<WeeklyGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Set up real-time Firestore listener for active plan
   */
  useEffect(() => {
    if (!user) {
      setActivePlan(null);
      setTodaysTasks([]);
      setCurrentWeek(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Subscribe to plan updates
    const unsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('prep-plan')
      .doc(activeExamConfig.id)
      .onSnapshot(
        (snapshot) => {
          if (snapshot.exists) {
            const data = snapshot.data();
            const plan = data?.plan as StudyPlan | undefined;

            if (plan && plan.isActive) {
              setActivePlan(plan);
              updateDerivedState(plan);
            } else {
              setActivePlan(null);
              setTodaysTasks([]);
              setCurrentWeek(null);
            }
          } else {
            setActivePlan(null);
            setTodaysTasks([]);
            setCurrentWeek(null);
          }
          setIsLoading(false);
        },
        (err) => {
          console.error('[PrepPlanContext] Firestore listener error:', err);
          setError('Failed to load study plan');
          setIsLoading(false);
        }
      );

    return () => unsubscribe();
  }, [user]);

  /**
   * Update derived state (today's tasks, current week) from plan
   */
  const updateDerivedState = (plan: StudyPlan) => {
    // Find current week
    const week = plan.weeks.find((w) => w.weekNumber === plan.currentWeek);
    setCurrentWeek(week || null);

    // Calculate today's tasks (incomplete tasks from current week)
    if (week) {
      const incompleteTasks = week.tasks.filter((task) => !task.completed);
      // Limit to 3-5 tasks per day
      const tasksForToday = incompleteTasks.slice(0, 5);
      setTodaysTasks(tasksForToday);
    } else {
      setTodaysTasks([]);
    }
  };

  /**
   * Manually refresh the plan from Firestore
   */
  const refreshPlan = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const plan = await prepPlanService.getActivePlan(user.uid);
      if (plan) {
        setActivePlan(plan);
        updateDerivedState(plan);
      } else {
        setActivePlan(null);
        setTodaysTasks([]);
        setCurrentWeek(null);
      }
    } catch (err) {
      console.error('[PrepPlanContext] Error refreshing plan:', err);
      setError('Failed to refresh study plan');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Mark a task as complete
   */
  const completeTask = async (taskId: string, score?: number, maxScore?: number) => {
    if (!user || !activePlan) {
      throw new Error('No active plan or user');
    }

    try {
      // Update in Firestore (this will trigger the listener to update state)
      await prepPlanService.completeTask(
        user.uid,
        activePlan.planId,
        taskId,
        score,
        maxScore
      );

      // Log analytics
      logEvent(AnalyticsEvents.PREP_PLAN_TASK_COMPLETED, {
        taskId,
        planId: activePlan.planId,
        weekNumber: activePlan.currentWeek,
        score,
        maxScore,
      });

      // Check if week is now complete
      if (currentWeek) {
        const weekTasks = currentWeek.tasks;
        const completedCount = weekTasks.filter((t) => t.completed || t.id === taskId).length;
        if (completedCount === weekTasks.length) {
          logEvent(AnalyticsEvents.PREP_PLAN_WEEK_COMPLETED, {
            weekNumber: currentWeek.weekNumber,
            planId: activePlan.planId,
          });
        }
      }
    } catch (err) {
      console.error('[PrepPlanContext] Error completing task:', err);
      throw err;
    }
  };

  /**
   * Get days until exam
   */
  const getDaysUntilExam = (): number => {
    if (!activePlan) return 0;
    const today = new Date();
    const examDate = new Date(activePlan.endDate);
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  /**
   * Calculate exam readiness score (0-100)
   * Based on: task completion (40%), time invested (30%), weeks completed (30%)
   */
  const getExamReadinessScore = (): number => {
    if (!activePlan) return 0;

    const { progress, totalWeeks, weeks } = activePlan;

    // Task completion percentage (40%)
    const taskCompletion =
      progress.totalTasks > 0
        ? (progress.completedTasks / progress.totalTasks) * 0.4
        : 0;

    // Time investment percentage (30%)
    const timeInvestment =
      progress.totalStudyHours > 0
        ? Math.min(progress.completedStudyHours / progress.totalStudyHours, 1) * 0.3
        : 0;

    // Weeks completed percentage (30%)
    const completedWeeks = weeks.filter((w) => w.completed).length;
    const weeksCompletion = totalWeeks > 0 ? (completedWeeks / totalWeeks) * 0.3 : 0;

    const readinessScore = (taskCompletion + timeInvestment + weeksCompletion) * 100;

    return Math.round(readinessScore);
  };

  const value: PrepPlanContextValue = {
    activePlan,
    todaysTasks,
    currentWeek,
    isLoading,
    error,
    refreshPlan,
    completeTask,
    getDaysUntilExam,
    getExamReadinessScore,
  };

  return <PrepPlanContext.Provider value={value}>{children}</PrepPlanContext.Provider>;
};

/**
 * Hook to use PrepPlanContext
 */
export const usePrepPlan = (): PrepPlanContextValue => {
  const context = useContext(PrepPlanContext);
  if (context === undefined) {
    throw new Error('usePrepPlan must be used within a PrepPlanProvider');
  }
  return context;
};

