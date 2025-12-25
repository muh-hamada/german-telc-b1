/**
 * Prep Plan Service
 * 
 * Handles CRUD operations for user study plans, task management,
 * and progress tracking.
 */

import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PrepPlanOnboardingProgress,
  PrepPlanConfig,
  StudyPlan,
  WeeklyGoal,
  PrepPlanTask,
  DiagnosticAssessment,
  StudyPlanProgress,
  SectionProgress,
  PrepPlanUpdateRequest,
} from '../types/prep-plan.types';
import { activeExamConfig } from '../config/active-exam.config';
import {
  getPrepPlanConfig,
  getEnabledSections,
  PrepPlanLevelSection,
} from '../config/prep-plan-level.config';
import { AnalyticsEvents, logEvent } from './analytics.events';

const ONBOARDING_STORAGE_KEY = '@prep_plan_onboarding_progress';
const PLAN_STORAGE_KEY = '@prep_plan_active';

class PrepPlanService {
  /**
   * ===================================
   * ONBOARDING PROGRESS MANAGEMENT
   * ===================================
   */

  /**
   * Save onboarding progress to AsyncStorage (for resuming)
   */
  async saveOnboardingProgress(
    progress: PrepPlanOnboardingProgress
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify(progress)
      );
    } catch (error) {
      console.error('[PrepPlanService] Error saving onboarding progress:', error);
      throw error;
    }
  }

  /**
   * Get onboarding progress from AsyncStorage
   */
  async getOnboardingProgress(): Promise<PrepPlanOnboardingProgress | null> {
    try {
      const data = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error('[PrepPlanService] Error getting onboarding progress:', error);
      return null;
    }
  }

  /**
   * Clear onboarding progress (after completing or canceling)
   */
  async clearOnboardingProgress(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch (error) {
      console.error('[PrepPlanService] Error clearing onboarding progress:', error);
    }
  }

  /**
   * ===================================
   * STUDY PLAN GENERATION
   * ===================================
   */

  /**
   * Generate a complete study plan based on config and assessment
   */
  async generateStudyPlan(
    userId: string,
    config: PrepPlanConfig,
    assessment: DiagnosticAssessment,
    aiRecommendations?: string[]
  ): Promise<StudyPlan> {
    try {
      const examLevel = activeExamConfig.level;
      const levelConfig = getPrepPlanConfig(examLevel);

      // Calculate time-related variables
      const daysUntilExam = this.calculateDaysUntilExam(config.examDate);
      const weeksUntilExam = Math.ceil(daysUntilExam / 7);
      
      // Validate minimum time
      if (weeksUntilExam < levelConfig.minimumWeeks) {
        throw new Error(
          `Not enough time! Minimum ${levelConfig.minimumWeeks} weeks required for ${examLevel} preparation.`
        );
      }

      // Calculate total available study hours
      const totalStudyHours = this.calculateTotalStudyHours(
        daysUntilExam,
        config.dailyStudyHours,
        config.studyDaysPerWeek
      );

      // Generate weekly goals
      const weeks = await this.generateWeeklyGoals(
        weeksUntilExam,
        totalStudyHours,
        assessment,
        config,
        levelConfig
      );

      // Calculate total tasks
      const totalTasks = weeks.reduce((sum, week) => sum + week.tasks.length, 0);

      // Initialize section progress
      const sectionProgress: SectionProgress[] = this.initializeSectionProgress(
        assessment,
        totalTasks,
        levelConfig
      );

      // Create the study plan
      const plan: StudyPlan = {
        planId: `plan-${Date.now()}`,
        userId,
        examLevel,
        config,
        assessment,
        weeks,
        totalWeeks: weeksUntilExam,
        currentWeek: 1,
        startDate: new Date(),
        endDate: config.examDate,
        isActive: true,
        isPaused: false,
        progress: {
          totalTasks,
          completedTasks: 0,
          totalStudyHours,
          completedStudyHours: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastStudyDate: null,
          sectionProgress,
          studySessions: [],
          examReadinessScore: assessment.overallPercentage,
        },
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        aiInsights: aiRecommendations,
      };

      // Save to Firestore
      await this.savePlan(userId, plan);

      // Save to local cache
      await this.cachePlan(plan);

      // Log analytics
      logEvent(AnalyticsEvents.PREP_PLAN_GENERATED, {
        planId: plan.planId,
        examLevel,
        totalWeeks: weeksUntilExam,
        totalTasks,
        totalHours: totalStudyHours,
        overallLevel: assessment.overallLevel,
      });

      return plan;
    } catch (error) {
      console.error('[PrepPlanService] Error generating study plan:', error);
      throw error;
    }
  }

  /**
   * Generate weekly goals based on assessment weaknesses
   */
  private async generateWeeklyGoals(
    numWeeks: number,
    totalHours: number,
    assessment: DiagnosticAssessment,
    config: PrepPlanConfig,
    levelConfig: any
  ): Promise<WeeklyGoal[]> {
    const weeks: WeeklyGoal[] = [];
    const hoursPerWeek = totalHours / numWeeks;

    // Determine focus areas by priority
    const weakSections = assessment.weaknesses;
    const strongSections = assessment.strengths;
    const enabledSections = getEnabledSections(assessment.examLevel);

    for (let i = 0; i < numWeeks; i++) {
      const weekNumber = i + 1;
      const startDate = new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000);

      // Determine focus for this week
      const focus = this.determineFocusAreas(
        weekNumber,
        numWeeks,
        weakSections,
        strongSections
      );

      // Generate tasks for this week
      const tasks = await this.generateTasksForWeek(
        weekNumber,
        numWeeks,
        hoursPerWeek,
        focus,
        assessment,
        config,
        enabledSections
      );

      const totalEstimatedHours =
        tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0) / 60;

      weeks.push({
        weekNumber,
        startDate,
        endDate,
        focus,
        focusDescription: this.getFocusDescription(focus, weekNumber, numWeeks),
        tasks,
        completed: false,
        completionPercentage: 0,
        totalEstimatedHours,
        completedHours: 0,
      });
    }

    return weeks;
  }

  /**
   * Generate tasks for a specific week
   */
  private async generateTasksForWeek(
    weekNumber: number,
    totalWeeks: number,
    hoursPerWeek: number,
    focus: string[],
    assessment: DiagnosticAssessment,
    config: PrepPlanConfig,
    enabledSections: PrepPlanLevelSection[]
  ): Promise<PrepPlanTask[]> {
    const tasks: PrepPlanTask[] = [];
    const minutesAvailable = hoursPerWeek * 60;
    const taskDistribution = getPrepPlanConfig(assessment.examLevel).taskDistribution;

    // Determine task difficulty based on week number
    const difficulty = this.getDifficultyForWeek(weekNumber, totalWeeks);

    // Allocate time based on section priorities
    const sectionTimeAllocation: Record<string, number> = {};
    
    for (const section of enabledSections) {
      const sectionName = section.sectionName;
      const isWeak = assessment.weaknesses.includes(sectionName);
      const isStrong = assessment.strengths.includes(sectionName);

      let timeAllocation = 0;
      if (isWeak) {
        timeAllocation = minutesAvailable * taskDistribution.weaknessPriority;
      } else if (isStrong) {
        timeAllocation = minutesAvailable * taskDistribution.strengthPriority;
      } else {
        timeAllocation = minutesAvailable * taskDistribution.moderatePriority;
      }

      sectionTimeAllocation[sectionName] = timeAllocation;
    }

    // Create tasks for each section
    for (const section of enabledSections) {
      const sectionName = section.sectionName;
      const timeAllocation = sectionTimeAllocation[sectionName];
      
      if (timeAllocation > 0) {
        const sectionTasks = await this.createSectionTasks(
          sectionName,
          timeAllocation,
          weekNumber,
          totalWeeks,
          difficulty,
          assessment.examLevel
        );
        tasks.push(...sectionTasks);
      }
    }

    // Add mock exam in later weeks (last 2-3 weeks for plans with 6+ weeks)
    const shouldAddMockExam = totalWeeks >= 6 && weekNumber >= totalWeeks - 2 && weekNumber < totalWeeks;
    if (shouldAddMockExam) {
      const mockExamNumber = weekNumber - (totalWeeks - 3);
      tasks.push({
        id: `task-mock-exam-w${weekNumber}`,
        type: 'mock-exam',
        section: 'mock-exam',
        title: `Mock Exam ${mockExamNumber}`,
        description: 'Complete full mock exam under timed conditions',
        estimatedMinutes: 120,
        difficulty: 'hard',
        completed: false,
      });
    }

    return tasks;
  }

  /**
   * Create tasks for a specific section
   */
  private async createSectionTasks(
    sectionName: string,
    timeAllocation: number,
    weekNumber: number,
    totalWeeks: number,
    difficulty: 'easy' | 'medium' | 'hard',
    examLevel: 'A1' | 'B1' | 'B2'
  ): Promise<PrepPlanTask[]> {
    const tasks: PrepPlanTask[] = [];
    
    // Skip if no time allocated
    if (timeAllocation <= 0) {
      return tasks;
    }

    // Determine how many tasks to create based on time allocation
    const avgTaskTime = this.getAverageTaskTime(sectionName);
    const numTasks = Math.max(1, Math.floor(timeAllocation / avgTaskTime));

    // Generate tasks for this section
    for (let i = 0; i < numTasks; i++) {
      const task = await this.createSingleTask(
        sectionName,
        weekNumber,
        i + 1,
        difficulty,
        examLevel
      );
      if (task) {
        tasks.push(task);
      }
    }
    
    return tasks;
  }

  /**
   * Create a single task for a section
   */
  private async createSingleTask(
    sectionName: string,
    weekNumber: number,
    taskIndex: number,
    difficulty: 'easy' | 'medium' | 'hard',
    examLevel: 'A1' | 'B1' | 'B2'
  ): Promise<PrepPlanTask | null> {
    const taskId = `task-w${weekNumber}-${sectionName}-${taskIndex}`;

    switch (sectionName) {
      case 'reading':
        return this.createReadingTask(taskId, weekNumber, taskIndex, difficulty, examLevel);
      
      case 'listening':
        return this.createListeningTask(taskId, weekNumber, taskIndex, difficulty, examLevel);
      
      case 'grammar':
        return this.createGrammarTask(taskId, weekNumber, taskIndex, difficulty, examLevel);
      
      case 'writing':
        return this.createWritingTask(taskId, weekNumber, taskIndex, difficulty, examLevel);
      
      case 'speaking':
        return this.createSpeakingTask(taskId, weekNumber, taskIndex, difficulty, examLevel);
      
      default:
        return null;
    }
  }

  /**
   * Create a reading practice task
   */
  private async createReadingTask(
    taskId: string,
    weekNumber: number,
    taskIndex: number,
    difficulty: 'easy' | 'medium' | 'hard',
    examLevel: 'A1' | 'B1' | 'B2'
  ): Promise<PrepPlanTask> {
    // Rotate through reading parts
    const parts = examLevel === 'A1' ? [1, 2, 3] : [1, 2, 3];
    const part = parts[(taskIndex - 1) % parts.length];
    
    return {
      id: taskId,
      type: 'reading',
      section: `reading-part${part}`,
      title: `Reading Part ${part}`,
      description: `Practice reading comprehension - Part ${part}`,
      estimatedMinutes: 25,
      difficulty,
      completed: false,
      // examId will be assigned when user starts the task (random selection)
    };
  }

  /**
   * Create a listening practice task
   */
  private async createListeningTask(
    taskId: string,
    weekNumber: number,
    taskIndex: number,
    difficulty: 'easy' | 'medium' | 'hard',
    examLevel: 'A1' | 'B1' | 'B2'
  ): Promise<PrepPlanTask> {
    // Rotate through listening parts
    const parts = examLevel === 'A1' ? [1, 2, 3] : [1, 2, 3];
    const part = parts[(taskIndex - 1) % parts.length];
    
    return {
      id: taskId,
      type: 'listening',
      section: `listening-part${part}`,
      title: `Listening Part ${part}`,
      description: `Practice listening comprehension - Part ${part}`,
      estimatedMinutes: 30,
      difficulty,
      completed: false,
    };
  }

  /**
   * Create a grammar practice task
   */
  private async createGrammarTask(
    taskId: string,
    weekNumber: number,
    taskIndex: number,
    difficulty: 'easy' | 'medium' | 'hard',
    examLevel: 'A1' | 'B1' | 'B2'
  ): Promise<PrepPlanTask> {
    // Grammar is only for B1 and B2
    const parts = [1, 2];
    const part = parts[(taskIndex - 1) % parts.length];
    
    return {
      id: taskId,
      type: 'grammar',
      section: `grammar-part${part}`,
      title: `Grammar Part ${part}`,
      description: `Practice grammar and vocabulary - Part ${part}`,
      estimatedMinutes: 20,
      difficulty,
      completed: false,
    };
  }

  /**
   * Create a writing practice task
   */
  private async createWritingTask(
    taskId: string,
    weekNumber: number,
    taskIndex: number,
    difficulty: 'easy' | 'medium' | 'hard',
    examLevel: 'A1' | 'B1' | 'B2'
  ): Promise<PrepPlanTask> {
    return {
      id: taskId,
      type: 'writing',
      section: 'writing',
      title: 'Writing Practice',
      description: 'Practice writing skills with AI feedback',
      estimatedMinutes: 45,
      difficulty,
      completed: false,
    };
  }

  /**
   * Create a speaking practice task
   */
  private async createSpeakingTask(
    taskId: string,
    weekNumber: number,
    taskIndex: number,
    difficulty: 'easy' | 'medium' | 'hard',
    examLevel: 'A1' | 'B1' | 'B2'
  ): Promise<PrepPlanTask> {
    // Rotate through speaking parts
    const parts = [1, 2, 3];
    const part = parts[(taskIndex - 1) % parts.length];
    
    return {
      id: taskId,
      type: 'speaking',
      section: `speaking-part${part}`,
      title: `Speaking Part ${part}`,
      description: `Practice speaking skills - Part ${part}`,
      estimatedMinutes: 30,
      difficulty,
      completed: false,
    };
  }

  /**
   * Get average task time for a section (in minutes)
   */
  private getAverageTaskTime(sectionName: string): number {
    switch (sectionName) {
      case 'reading':
        return 25;
      case 'listening':
        return 30;
      case 'grammar':
        return 20;
      case 'writing':
        return 45;
      case 'speaking':
        return 30;
      default:
        return 30;
    }
  }

  /**
   * Determine task difficulty based on week progression
   */
  private getDifficultyForWeek(
    weekNumber: number,
    totalWeeks: number
  ): 'easy' | 'medium' | 'hard' {
    const progressPercentage = (weekNumber / totalWeeks) * 100;
    
    if (progressPercentage <= 33) {
      return 'easy';
    } else if (progressPercentage <= 66) {
      return 'medium';
    } else {
      return 'hard';
    }
  }

  /**
   * Determine focus areas for a week
   */
  private determineFocusAreas(
    weekNumber: number,
    totalWeeks: number,
    weakSections: string[],
    strongSections: string[]
  ): string[] {
    // Early weeks: Focus on weaknesses
    if (weekNumber <= totalWeeks / 2) {
      return weakSections.slice(0, 2);
    }
    // Middle weeks: Mix of all sections
    else if (weekNumber <= totalWeeks - 2) {
      return [...weakSections.slice(0, 1), ...strongSections.slice(0, 1)];
    }
    // Final weeks: Mock exams and review
    else {
      return ['mock-exam', 'review'];
    }
  }

  /**
   * Get human-readable focus description
   */
  private getFocusDescription(
    focus: string[],
    weekNumber: number,
    totalWeeks: number
  ): string {
    if (focus.includes('mock-exam')) {
      return 'Mock exams and final preparation';
    }
    return `Focus on ${focus.join(' and ')}`;
  }

  /**
   * Initialize section progress trackers
   */
  private initializeSectionProgress(
    assessment: DiagnosticAssessment,
    totalTasks: number,
    levelConfig: any
  ): SectionProgress[] {
    const progress: SectionProgress[] = [];
    const enabledSections = getEnabledSections(assessment.examLevel);

    for (const section of enabledSections) {
      const sectionAssessment = assessment.sections[section.sectionName];
      if (sectionAssessment) {
        progress.push({
          sectionName: section.sectionName,
          initialScore: sectionAssessment.percentage,
          currentScore: sectionAssessment.percentage,
          improvement: 0,
          tasksCompleted: 0,
          totalTasks: Math.floor(totalTasks / enabledSections.length), // Rough estimate
          lastPracticeDate: null,
        });
      }
    }

    return progress;
  }

  /**
   * ===================================
   * TASK MANAGEMENT
   * ===================================
   */

  /**
   * Mark a task as complete and update progress
   */
  async completeTask(
    userId: string,
    planId: string,
    taskId: string,
    score?: number,
    maxScore?: number
  ): Promise<void> {
    try {
      const plan = await this.getActivePlan(userId);
      if (!plan || plan.planId !== planId) {
        throw new Error('Plan not found');
      }

      // Find and update the task
      let taskFound = false;
      for (const week of plan.weeks) {
        const task = week.tasks.find((t) => t.id === taskId);
        if (task) {
          task.completed = true;
          task.completedAt = Date.now();
          if (score !== undefined && maxScore !== undefined) {
            task.score = score;
            task.maxScore = maxScore;
          }
          taskFound = true;
          break;
        }
      }

      if (!taskFound) {
        throw new Error('Task not found');
      }

      // Update progress
      plan.progress.completedTasks += 1;
      plan.lastUpdated = Date.now();

      // TODO: Update streak, study hours, section progress

      // Save updated plan
      await this.updatePlan(userId, plan);

      logEvent(AnalyticsEvents.PREP_PLAN_TASK_COMPLETED, {
        planId,
        taskId,
        score,
        maxScore,
      });
    } catch (error) {
      console.error('[PrepPlanService] Error completing task:', error);
      throw error;
    }
  }

  /**
   * Get today's tasks for the user
   */
  async getTodaysTasks(userId: string): Promise<PrepPlanTask[]> {
    try {
      const plan = await this.getActivePlan(userId);
      if (!plan) return [];

      const currentWeek = plan.weeks[plan.currentWeek - 1];
      if (!currentWeek) return [];

      // Return uncompleted tasks from current week
      // TODO: Add date-based filtering
      return currentWeek.tasks.filter((task) => !task.completed);
    } catch (error) {
      console.error('[PrepPlanService] Error getting today tasks:', error);
      return [];
    }
  }

  /**
   * ===================================
   * PLAN MANAGEMENT
   * ===================================
   */

  /**
   * Get active study plan for user
   */
  async getActivePlan(userId: string): Promise<StudyPlan | null> {
    try {
      // Try cache first
      const cached = await this.getCachedPlan();
      if (cached && cached.userId === userId && cached.isActive) {
        return cached;
      }

      // Fetch from Firestore
      const examId = activeExamConfig.id;
      const docPath = `users/${userId}/prep-plan/${examId}`;
      const doc = await firestore().doc(docPath).get();

      if (!doc.exists) {
        return null;
      }

      const plan = doc.data() as StudyPlan;
      if (!plan) {
        console.warn('[PrepPlanService] Document exists but data is undefined');
        return null;
      }
      
      await this.cachePlan(plan);
      return plan;
    } catch (error) {
      console.error('[PrepPlanService] Error getting active plan:', error);
      return null;
    }
  }

  /**
   * Save plan to Firestore
   */
  async savePlan(userId: string, plan: StudyPlan): Promise<void> {
    try {
      const examId = activeExamConfig.id;
      const docPath = `users/${userId}/prep-plan/${examId}`;
      await firestore().doc(docPath).set(plan);
    } catch (error) {
      console.error('[PrepPlanService] Error saving plan:', error);
      throw error;
    }
  }

  /**
   * Update existing plan
   */
  async updatePlan(userId: string, plan: StudyPlan): Promise<void> {
    try {
      plan.lastUpdated = Date.now();
      await this.savePlan(userId, plan);
      await this.cachePlan(plan);
    } catch (error) {
      console.error('[PrepPlanService] Error updating plan:', error);
      throw error;
    }
  }

  /**
   * Update plan configuration and regenerate
   */
  async updatePlanConfig(
    userId: string,
    request: PrepPlanUpdateRequest
  ): Promise<StudyPlan> {
    try {
      const currentPlan = await this.getActivePlan(userId);
      if (!currentPlan || currentPlan.planId !== request.planId) {
        throw new Error('Plan not found');
      }

      // Merge new config
      const newConfig: PrepPlanConfig = {
        ...currentPlan.config,
        ...request.newConfig,
        lastUpdated: Date.now(),
      };

      // Calculate new plan parameters
      const today = new Date();
      const examDate = new Date(newConfig.examDate);
      const daysUntilExam = Math.max(
        1,
        Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      );
      const numWeeks = Math.ceil(daysUntilExam / 7);
      const totalStudyHours =
        (daysUntilExam * newConfig.dailyStudyHours * newConfig.studyDaysPerWeek) / 7;

      // Collect all completed tasks from current plan
      const completedTasks: PrepPlanTask[] = [];
      let completedStudyHours = 0;
      
      for (const week of currentPlan.weeks) {
        for (const task of week.tasks) {
          if (task.completed) {
            completedTasks.push(task);
            completedStudyHours += task.estimatedMinutes / 60;
          }
        }
      }

      // Generate new plan with adjusted weeks
      const hoursPerWeek = totalStudyHours / numWeeks;
      const weakSections = currentPlan.assessment.weaknesses;
      const strongSections = currentPlan.assessment.strengths;
      const enabledSections = getEnabledSections(currentPlan.assessment.examLevel);

      const newWeeks: WeeklyGoal[] = [];
      
      for (let i = 0; i < numWeeks; i++) {
        const weekNumber = i + 1;
        const startDate = new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000);
        const endDate = new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000);

        // Determine focus for this week
        const focus = this.determineFocusAreas(
          weekNumber,
          numWeeks,
          weakSections,
          strongSections
        );

        // Generate new tasks for this week
        const tasks = await this.generateTasksForWeek(
          weekNumber,
          numWeeks,
          hoursPerWeek,
          focus,
          currentPlan.assessment,
          newConfig,
          enabledSections
        );

        const totalEstimatedHours =
          tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0) / 60;

        newWeeks.push({
          weekNumber,
          startDate,
          endDate,
          focus,
          focusDescription: this.getFocusDescription(focus, weekNumber, numWeeks),
          tasks,
          completed: false,
          completionPercentage: 0,
          totalEstimatedHours,
          completedHours: 0,
        });
      }

      // Merge completed tasks into the appropriate weeks
      // Keep completed tasks in their original week positions if possible
      const completedTasksByWeek = new Map<number, PrepPlanTask[]>();
      for (const task of completedTasks) {
        const weekNumber = this.extractWeekNumber(task.id);
        if (weekNumber && weekNumber <= numWeeks) {
          if (!completedTasksByWeek.has(weekNumber)) {
            completedTasksByWeek.set(weekNumber, []);
          }
          completedTasksByWeek.get(weekNumber)!.push(task);
        }
      }

      // Add completed tasks to their weeks
      for (const [weekNumber, tasks] of completedTasksByWeek) {
        if (weekNumber <= newWeeks.length) {
          const week = newWeeks[weekNumber - 1];
          // Prepend completed tasks to the week
          week.tasks = [...tasks, ...week.tasks];
          week.completedHours = tasks.reduce((sum, t) => sum + t.estimatedMinutes / 60, 0);
          week.completionPercentage = Math.round(
            (tasks.length / week.tasks.length) * 100
          );
        }
      }

      // Create updated plan
      const updatedPlan: StudyPlan = {
        ...currentPlan,
        config: newConfig,
        weeks: newWeeks,
        totalWeeks: numWeeks,
        currentWeek: this.calculateCurrentWeek(newWeeks),
        startDate: today,
        endDate: examDate,
        progress: {
          ...currentPlan.progress,
          totalTasks: newWeeks.reduce((sum, w) => sum + w.tasks.length, 0),
          completedTasks: completedTasks.length,
          totalStudyHours,
          completedStudyHours,
        },
        lastUpdated: Date.now(),
      };

      await this.updatePlan(userId, updatedPlan);

      logEvent(AnalyticsEvents.PREP_PLAN_SETTINGS_UPDATED, {
        planId: updatedPlan.planId,
        newWeeks: numWeeks,
        oldWeeks: currentPlan.totalWeeks,
        completedTasksPreserved: completedTasks.length,
      });

      return updatedPlan;
    } catch (error) {
      console.error('[PrepPlanService] Error updating plan config:', error);
      throw error;
    }
  }

  /**
   * Extract week number from task ID (e.g., "task-w3-reading-1" => 3)
   */
  private extractWeekNumber(taskId: string): number | null {
    const match = taskId.match(/task-w(\d+)-/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Calculate which week the user is currently in
   */
  private calculateCurrentWeek(weeks: WeeklyGoal[]): number {
    const now = Date.now();
    for (const week of weeks) {
      const start = new Date(week.startDate).getTime();
      const end = new Date(week.endDate).getTime();
      if (now >= start && now < end) {
        return week.weekNumber;
      }
    }
    // Default to first incomplete week
    for (const week of weeks) {
      if (!week.completed) {
        return week.weekNumber;
      }
    }
    return 1;
  }

  /**
   * Save assessment to Firestore
   */
  async saveAssessment(userId: string, assessment: DiagnosticAssessment): Promise<void> {
    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .collection('prep-plan')
        .doc(activeExamConfig.id)
        .set(
          {
            assessment,
            assessmentCompletedAt: assessment.completedAt,
            lastUpdated: Date.now(),
          },
          { merge: true }
        );
      
      console.log('[PrepPlanService] Assessment saved successfully');
    } catch (error) {
      console.error('[PrepPlanService] Error saving assessment:', error);
      throw error;
    }
  }

  /**
   * Get saved assessment
   */
  async getAssessment(userId: string): Promise<DiagnosticAssessment | null> {
    try {
      const doc = await firestore()
        .collection('users')
        .doc(userId)
        .collection('prep-plan')
        .doc(activeExamConfig.id)
        .get();
      
      if (!doc.exists) return null;
      
      const data = doc.data();
      return data?.assessment || null;
    } catch (error) {
      console.error('[PrepPlanService] Error getting assessment:', error);
      return null;
    }
  }

  /**
   * ===================================
   * HELPER METHODS
   * ===================================
   */

  /**
   * Calculate days until exam
   */
  private calculateDaysUntilExam(examDate: Date): number {
    const now = new Date();
    const diff = examDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate total available study hours
   */
  private calculateTotalStudyHours(
    daysUntilExam: number,
    dailyStudyHours: number,
    studyDaysPerWeek: number
  ): number {
    const weeksUntilExam = daysUntilExam / 7;
    return weeksUntilExam * (dailyStudyHours * studyDaysPerWeek);
  }

  /**
   * Cache plan to AsyncStorage
   */
  private async cachePlan(plan: StudyPlan): Promise<void> {
    try {
      if (!plan) {
        console.warn('[PrepPlanService] Cannot cache undefined/null plan');
        return;
      }
      await AsyncStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
    } catch (error) {
      console.error('[PrepPlanService] Error caching plan:', error);
    }
  }

  /**
   * Get cached plan from AsyncStorage
   */
  private async getCachedPlan(): Promise<StudyPlan | null> {
    try {
      const data = await AsyncStorage.getItem(PLAN_STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error('[PrepPlanService] Error getting cached plan:', error);
      return null;
    }
  }
}

export const prepPlanService = new PrepPlanService();

