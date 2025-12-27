/**
 * Exam Prep Plan Type Definitions
 * 
 * These types define the structure for the personalized exam preparation plan feature.
 * This is a premium feature that provides users with AI-powered study plans based on
 * their diagnostic assessment and study schedule.
 */

import { ExamLevel } from "../config/exam-config.types";

/**
 * Onboarding Progress - Tracks user progress through prep plan setup
 * Used to resume onboarding if user exits mid-flow
 */
export interface PrepPlanOnboardingProgress {
  step: 'welcome' | 'config' | 'assessment' | 'results' | 'complete';
  config?: PrepPlanConfig;
  assessmentId?: string;
  lastUpdated: number;
  isComplete: boolean;
}

/**
 * Diagnostic Assessment Progress - Tracks progress through diagnostic test
 * Used to resume assessment if user exits mid-test
 */
export interface DiagnosticAssessmentProgress {
  examId: string;
  currentSectionIndex: number;
  answers: DiagnosticAnswers;
  startTime: number;
  lastUpdated: number;
}

/**
 * User's study configuration - collected during onboarding
 */
export interface PrepPlanConfig {
  examDate: Date;
  dailyStudyHours: number; // 0.5, 1, 1.5, 2, 3, 4, 5
  studyDaysPerWeek: number; // 1-7
  studyDays: boolean[]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun] - true if user studies that day
  preferredStudyTime?: 'morning' | 'afternoon' | 'evening' | 'flexible'; // Optional
  notificationsEnabled: boolean;
  createdAt: number;
  lastUpdated: number;
}

/**
 * Assessment results for a single section
 */
export interface SectionAssessment {
  sectionName: 'reading' | 'listening' | 'grammar' | 'writing' | 'speaking';
  score: number;
  maxScore: number;
  percentage: number;
  level: 'weak' | 'moderate' | 'strong';
  details?: {
    // For speaking: individual scores
    pronunciation?: number;
    fluency?: number;
    grammarAccuracy?: number;
    vocabularyRange?: number;
    contentRelevance?: number;
  };
}

/**
 * Complete diagnostic assessment results
 */
export interface DiagnosticAssessment {
  assessmentId: string;
  completedAt: number;
  examLevel: ExamLevel; // Which exam level this assessment was for
  sections: {
    reading?: SectionAssessment;
    listening?: SectionAssessment;
    grammar?: SectionAssessment; // Only for B1/B2
    writing: SectionAssessment;
    speaking: SectionAssessment;
  };
  overallScore: number;
  overallMaxScore: number;
  overallPercentage: number;
  overallLevel: 'beginner' | 'intermediate' | 'advanced';
  strengths: string[]; // e.g., ['reading', 'grammar']
  weaknesses: string[]; // e.g., ['listening', 'writing']
  recommendations?: string[]; // AI-generated recommendations
}

/**
 * A single task in the study plan
 */
export interface PrepPlanTask {
  id: string; // Unique task ID
  type: 'reading' | 'listening' | 'grammar' | 'writing' | 'speaking' | 'vocabulary' | 'mock-exam';
  section: string; // e.g., 'reading-part1', 'listening-part3', 'grammar-part1', 'writing', 'speaking-part1'
  title: string; // e.g., "Reading Practice - Teil 1"
  description?: string; // Additional details about the task
  examId?: number; // Which practice test/exam to use
  estimatedMinutes: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  completed: boolean;
  completedAt?: number;
  score?: number;
  maxScore?: number;
  dueDate?: Date; // Specific date this task should be completed by
}

/**
 * Weekly goal containing multiple tasks
 */
export interface WeeklyGoal {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  focus: string[]; // e.g., ['listening', 'writing'] - primary areas of focus this week
  focusDescription?: string; // Human-readable description like "Building listening comprehension"
  tasks: PrepPlanTask[];
  completed: boolean;
  completionPercentage: number; // 0-100
  totalEstimatedHours: number;
  completedHours: number;
}

/**
 * Complete study plan
 */
export interface StudyPlan {
  planId: string;
  userId: string;
  examLevel: ExamLevel;
  config: PrepPlanConfig;
  assessment: DiagnosticAssessment;
  weeks: WeeklyGoal[];
  totalWeeks: number;
  currentWeek: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isPaused: boolean;
  progress: StudyPlanProgress;
  createdAt: number;
  lastUpdated: number;
  aiInsights?: string[]; // AI-generated insights about the plan or progress
}

/**
 * Progress tracking for the study plan
 */
export interface StudyPlanProgress {
  totalTasks: number;
  completedTasks: number;
  totalStudyHours: number;
  completedStudyHours: number;
  currentStreak: number; // Days in a row user has studied
  longestStreak: number;
  lastStudyDate: string | null; // ISO date string
  sectionProgress: SectionProgress[];
  studySessions: StudySession[];
  examReadinessScore: number; // 0-100 - calculated readiness for exam
}

/**
 * Progress tracking per section
 */
export interface SectionProgress {
  sectionName: 'reading' | 'listening' | 'grammar' | 'writing' | 'speaking';
  initialScore: number; // From diagnostic
  currentScore: number; // Based on recent practice
  improvement: number; // Percentage point improvement
  tasksCompleted: number;
  totalTasks: number;
  lastPracticeDate: string | null;
}

/**
 * Individual study session record
 */
export interface StudySession {
  sessionId: string;
  date: string; // ISO date string
  startTime: number;
  endTime: number;
  durationMinutes: number;
  tasksCompleted: PrepPlanTask[];
  sectionsStudied: string[];
}

/**
 * Historical prep plans (for users who complete or restart plans)
 */
export interface PrepPlanHistory {
  plans: StudyPlan[];
  totalPlansCreated: number;
  totalPlansCompleted: number;
  totalStudyHours: number;
  averageCompletionRate: number;
}

/**
 * Notification preference for prep plan
 */
export interface PrepPlanNotification {
  enabled: boolean;
  preferredTime?: string; // e.g., "19:00" for 7 PM
  days: boolean[]; // Which days to send notifications [Mon-Sun]
  lastSent?: number;
}

/**
 * Request to update/regenerate plan
 */
export interface PrepPlanUpdateRequest {
  planId: string;
  examDate?: Date;
  newConfig: Partial<PrepPlanConfig>;
  reason?: string;
  preserveProgress: boolean; // If true, keep completed tasks
}

/**
 * Speaking Practice - Dialogue Turn (for speaking assessment)
 */
export interface SpeakingDialogueTurn {
  turnNumber: number;
  speaker: 'ai' | 'user';
  text: string; // What should be said
  audioUrl?: string; // AI audio response
  userAudioUrl?: string; // User's recorded response
  transcription?: string; // User's speech transcribed
  isQuestion: boolean; // Is this turn asking a question?
  completed: boolean;
  evaluatedAt?: number;
}

/**
 * Speaking evaluation results
 */
export interface SpeakingEvaluation {
  transcription: string;
  scores: {
    pronunciation: number; // 0-20
    fluency: number; // 0-20
    grammarAccuracy: number; // 0-20
    vocabularyRange: number; // 0-20
    contentRelevance: number; // 0-20
  };
  totalScore: number; // Sum of above (0-100)
  feedback: string;
  strengths: string[];
  areasToImprove: string[];
}

/**
 * Speaking Assessment Dialogue Structure
 */
export interface SpeakingAssessmentDialogue {
  dialogueId: string;
  partNumber: 1 | 2 | 3; // Which part of speaking exam
  level: ExamLevel;
  turns: SpeakingDialogueTurn[];
  totalTurns: number;
  currentTurn: number;
  isComplete: boolean;
  evaluation?: SpeakingEvaluation;
  startedAt?: number;
  completedAt?: number;
}

/**
 * Diagnostic Exam Structure (subset of questions for assessment)
 */
export interface DiagnosticExam {
  examId: string;
  level: ExamLevel;
  sections: {
    reading?: number[]; // Array of question IDs
    listening?: number[]; // Array of question IDs
    grammar?: number[]; // Array of question IDs (B1/B2 only)
    writing: number; // Single writing task ID
    speaking: SpeakingAssessmentDialogue; // Speaking dialogue
  };
  estimatedMinutes: number;
  createdAt: number;
}

/**
 * User's answers to diagnostic exam
 */
export interface DiagnosticAnswers {
  examId: string;
  userId: string;
  answers: {
    reading?: { [questionId: string]: any };
    listening?: { [questionId: string]: any };
    grammar?: { [questionId: string]: any };
    writing: {
      text: string;
      wordCount: number;
    };
    speaking: {
      dialogueId: string;
      audioUrls: string[];
      transcriptions: string[];
    };
  };
  startedAt: number;
  submittedAt: number;
}

