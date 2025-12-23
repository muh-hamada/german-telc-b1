# 📋 Exam Prep Plan Premium Feature - Implementation PRD (v2.0)

**Last Updated:** December 23, 2025  
**Status:** Ready for Implementation  
**Priority:** High - Premium Feature

---

## 📑 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Feature Overview](#feature-overview)
3. [Feedback Integration](#feedback-integration)
4. [System Architecture](#system-architecture)
5. [Data Models & Firebase Structure](#data-models--firebase-structure)
6. [Multi-Level Exam Support (A1-B2)](#multi-level-exam-support-a1-b2)
7. [Speaking Practice Component](#speaking-practice-component)
8. [UI/UX Implementation](#uiux-implementation)
9. [Onboarding Progress Persistence](#onboarding-progress-persistence)
10. [Business Logic & Services](#business-logic--services)
11. [Personalized Notifications](#personalized-notifications)
12. [Plan Management & Updates](#plan-management--updates)
13. [Analytics & Progress Tracking](#analytics--progress-tracking)
14. [Premium Integration](#premium-integration)
15. [Localization](#localization)
16. [Implementation Timeline](#implementation-timeline)
17. [Testing Strategy](#testing-strategy)
18. [Success Metrics](#success-metrics)
19. [Technical Considerations](#technical-considerations)
20. [Future Enhancements](#future-enhancements)

---

## 🎯 Executive Summary

The **Exam Prep Plan** is a premium feature that provides users with a personalized, AI-powered study plan tailored to their:
- Current skill level (determined via diagnostic assessment)
- Available study time
- Exam date
- Specific exam level (A1, B1, B2)

This feature transforms the app from a practice tool into a comprehensive exam preparation coach, dramatically increasing user engagement, retention, and premium conversion rates.

### Key Differentiators
- **Multi-level support**: Works for A1, B1, and B2 exams with level-specific configurations
- **Interactive speaking practice**: AI-powered dialogue-based speaking assessment
- **Adaptive learning**: Plan adjusts based on performance and progress
- **Progress persistence**: Users can pause and resume onboarding without losing data
- **Personalized notifications**: Smart reminders based on study plan and user progress
- **Accessible to all**: Feature visible to free users with premium upsell gate

---

## 🔄 Feedback Integration

This PRD incorporates the following critical feedback:

### 1. **Universal Visibility with Premium Gate**
- **Change**: Prep Plan button visible to ALL users on home screen
- **Implementation**: Show premium modal with benefits if user is not premium
- **Rationale**: Increases feature awareness and drives premium conversions

### 2. **Mandatory Assessment Sections**
- **Change**: All assessment sections (including writing) are required
- **Implementation**: Remove "optional" writing section, make it mandatory
- **Rationale**: Ensures comprehensive skill evaluation for accurate plan generation

### 3. **Speaking Practice Component** ⭐ NEW
- **Change**: Add interactive AI-powered speaking practice
- **Implementation**: 
  - Start with Speaking Part 1 (personal introduction)
  - Dialogue-based interaction: User answers, then asks questions
  - AI responds and asks follow-up questions
  - Real-time speech recognition and evaluation
  - Scoring based on fluency, pronunciation, grammar, and content
- **Rationale**: Speaking is crucial for exam success and missing from current assessments

### 4. **Speaking in All Sections**
- **Change**: Include speaking scores in assessment results, dashboard, and all progress tracking
- **Implementation**: Update data models, UI components, and analytics to include speaking
- **Rationale**: Speaking is 25% of the exam (75/300 points for B1/B2)

### 5. **Onboarding Progress Persistence** ⭐ NEW
- **Change**: Save progress at each onboarding step
- **Implementation**:
  - Save partial progress to Firestore
  - Update home screen card title/description based on incomplete status
  - Allow users to resume from where they left off
- **Rationale**: Reduces abandonment and improves user experience

### 6. **Personalized Notifications** ⭐ NEW
- **Change**: Send prep plan-specific notifications
- **Implementation**:
  - Extend `send-scheduled-notifications.ts`
  - Check if user has active prep plan
  - Send personalized messages based on:
    - Today's tasks
    - Upcoming milestones
    - Missed study days
    - Exam countdown
- **Rationale**: Increases engagement and plan completion rates

### 7. **Multi-Level Exam Support (A1-B2)** ⭐ NEW
- **Change**: Make prep plan work across all exam levels
- **Implementation**:
  - Create `prep-plan-level.config.ts` similar to `mock-exam.types.ts`
  - Define level-specific sections, points, and structure
  - Generate assessments and plans based on exam level config
- **Rationale**: Makes feature reusable across all apps (German A1, B1, B2, English B1, B2)

### 8. **Comprehensive Data Tracking**
- **Change**: Store detailed analytics data
- **Implementation**: Capture:
  - Every task attempt with timestamp
  - Score progression over time
  - Time spent per section/task
  - Weak areas identified
  - Improvement velocity
  - Study patterns and consistency
- **Rationale**: Enables powerful insights and recommendations

### 9. **Plan Settings Updates** ⭐ NEW
- **Change**: Allow users to update plan settings
- **Implementation**:
  - User can change: exam date, study hours/day, study days/week
  - Show confirmation modal before regenerating
  - Adjust current plan while preserving completed tasks
  - Recalculate remaining tasks based on new settings
- **Rationale**: Life circumstances change; plan should adapt

### 10. **Scope Reduction**
- **Change**: Skip all post-exam features
- **Implementation**: Remove "How did your exam go?" and results tracking features for now
- **Rationale**: Focus on core preparation experience first

---

## 🏗️ System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Home Screen (Visible to All)                                  │
│         ↓                                                       │
│  [Tap Prep Plan Card]                                          │
│         ↓                                                       │
│  Premium Check                                                  │
│    ├── Not Premium → Show Premium Modal → Purchase             │
│    └── Premium → Check Onboarding Status                       │
│                  ├── Not Started → Start Onboarding            │
│                  ├── Incomplete → Resume from Saved Step       │
│                  └── Complete → Show Dashboard                 │
│         ↓                                                       │
│  Onboarding Flow (Save Progress at Each Step)                  │
│    ├── Step 1: Schedule Configuration                          │
│    ├── Step 2: Diagnostic Assessment (ALL sections)            │
│    │     ├── Reading                                           │
│    │     ├── Listening                                         │
│    │     ├── Grammar (B1/B2 only)                              │
│    │     ├── Writing (Mandatory)                               │
│    │     └── Speaking (AI-powered dialogue) ⭐ NEW             │
│    ├── Step 3: Assessment Results                              │
│    └── Step 4: Generate Plan (AI-powered)                      │
│         ↓                                                       │
│  Study Plan Dashboard                                           │
│    ├── Today's Tasks                                           │
│    ├── Weekly Progress                                         │
│    ├── Exam Countdown                                          │
│    └── [Update Settings] ⭐ NEW                                │
│         ↓                                                       │
│  Daily Study Sessions                                           │
│    ├── Complete Tasks                                          │
│    ├── Track Progress                                          │
│    └── Receive Personalized Notifications ⭐ NEW               │
│         ↓                                                       │
│  Progress Analytics                                             │
│    ├── Performance Trends                                      │
│    ├── Weak Areas                                              │
│    ├── Readiness Score                                         │
│    └── AI Recommendations                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Models & Firebase Structure

### 5.1 TypeScript Type Definitions

Create new file: `src/types/prep-plan.types.ts`

```typescript
/**
 * Exam Prep Plan Types
 * 
 * This file defines all TypeScript types for the Exam Prep Plan feature.
 * It supports multi-level exams (A1-B2) with flexible configurations.
 */

import { ExamLevel } from '../config/exam-config.types';

// ==================== ONBOARDING TYPES ====================

/**
 * Onboarding progress tracking
 * Persists partial progress if user abandons onboarding
 */
export interface PrepPlanOnboardingProgress {
  userId: string;
  examLevel: ExamLevel; // A1, B1, or B2
  currentStep: 'schedule' | 'assessment' | 'results' | 'generating' | 'completed';
  stepProgress: {
    schedule?: PrepPlanConfig;
    assessment?: DiagnosticAssessment;
    plan?: StudyPlan;
  };
  startedAt: number;
  lastUpdatedAt: number;
}

// ==================== CONFIGURATION TYPES ====================

/**
 * User's study schedule configuration
 */
export interface PrepPlanConfig {
  examDate: Date;
  dailyStudyHours: number; // 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5+
  studyDaysPerWeek: number; // 1-7
  preferredStudyTime: 'morning' | 'afternoon' | 'evening' | 'flexible';
  notificationsEnabled: boolean;
  createdAt: number;
  lastUpdated: number;
}

// ==================== ASSESSMENT TYPES ====================

/**
 * Score and level for a single section
 */
export interface SectionAssessment {
  score: number;
  maxScore: number;
  percentage: number;
  level: 'weak' | 'moderate' | 'strong';
  attempts?: AssessmentAttempt[]; // Detailed tracking
}

/**
 * Individual assessment attempt details
 */
export interface AssessmentAttempt {
  questionId: string;
  userAnswer: string | number;
  correctAnswer: string | number;
  isCorrect: boolean;
  timeSpentSeconds: number;
  attemptedAt: number;
}

/**
 * Complete diagnostic assessment results
 * Structure adapts based on exam level (A1 vs B1/B2)
 */
export interface DiagnosticAssessment {
  assessmentId: string;
  examLevel: ExamLevel;
  completedAt: number;
  sections: {
    reading: SectionAssessment;
    listening: SectionAssessment;
    grammar?: SectionAssessment; // Only for B1/B2
    writing: SectionAssessment;
    speaking: SectionAssessment; // ⭐ NEW - Always required
  };
  overallLevel: 'beginner' | 'intermediate' | 'advanced';
  overallScore: number;
  overallMaxScore: number;
  overallPercentage: number;
  strengths: string[]; // e.g., ['reading', 'grammar']
  weaknesses: string[]; // e.g., ['listening', 'speaking']
  totalTimeSpentMinutes: number;
}

// ==================== TASK TYPES ====================

/**
 * Task type with dynamic sections based on exam level
 */
export type TaskType = 'reading' | 'listening' | 'grammar' | 'writing' | 'speaking' | 'vocabulary' | 'mock-exam';

/**
 * Individual task within a study plan
 */
export interface PrepPlanTask {
  id: string;
  type: TaskType;
  section: string; // e.g., 'reading-part1', 'speaking-part1'
  title: string; // Localized task title
  description?: string; // Optional instructions
  examId?: number; // Reference to specific exam content
  topicId?: number; // For speaking/writing topics
  estimatedMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'high' | 'medium' | 'low'; // Based on weaknesses
  completed: boolean;
  completedAt?: number;
  score?: number;
  maxScore?: number;
  timeSpentMinutes?: number;
  attempts: number; // How many times user attempted this task
}

// ==================== WEEKLY GOAL TYPES ====================

/**
 * Weekly study goals and tasks
 */
export interface WeeklyGoal {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  focusAreas: string[]; // e.g., ['listening', 'speaking']
  focusDescription: string; // Localized description
  tasks: PrepPlanTask[];
  totalEstimatedHours: number;
  completed: boolean;
  completionPercentage: number;
  averageScore?: number; // Average of completed task scores
}

// ==================== STUDY PLAN TYPES ====================

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
  progress: StudyPlanProgress;
  aiInsights?: string[]; // AI-generated recommendations
  createdAt: number;
  lastUpdated: number;
}

/**
 * Progress tracking for study plan
 */
export interface StudyPlanProgress {
  totalTasks: number;
  completedTasks: number;
  totalStudyHours: number;
  completedStudyHours: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null; // ISO date string
  studyDaysCount: number; // Total days studied
  averageSessionMinutes: number;
  overallCompletionPercentage: number;
  examReadinessScore: number; // 0-100, calculated based on progress and performance
  sectionProgress: {
    reading: SectionProgress;
    listening: SectionProgress;
    grammar?: SectionProgress; // Only for B1/B2
    writing: SectionProgress;
    speaking: SectionProgress;
  };
}

/**
 * Progress for individual section
 */
export interface SectionProgress {
  tasksCompleted: number;
  totalTasks: number;
  averageScore: number;
  initialScore: number; // From diagnostic
  currentScore: number; // Latest performance
  improvement: number; // Percentage improvement
  lastPracticed: number | null;
  timeSpentMinutes: number;
}

// ==================== HISTORICAL DATA TYPES ====================

/**
 * Daily study session record
 */
export interface StudySession {
  sessionId: string;
  date: string; // ISO date
  tasksCompleted: number;
  timeSpentMinutes: number;
  averageScore: number;
  sectionsStudied: TaskType[];
  startTime: number;
  endTime: number;
}

/**
 * User's prep plan history
 */
export interface PrepPlanHistory {
  userId: string;
  currentPlan: StudyPlan | null;
  pastPlans: StudyPlan[]; // Completed or abandoned plans
  totalPlansCreated: number;
  totalPlansCompleted: number;
  totalStudyHours: number;
  totalTasksCompleted: number;
  sessions: StudySession[]; // Last 30 days
  statistics: {
    averageCompletionRate: number;
    averageStudyHoursPerPlan: number;
    mostImprovedSection: string;
    averageImprovementPercentage: number;
  };
}

// ==================== NOTIFICATION TYPES ====================

/**
 * Prep plan-specific notification data
 */
export interface PrepPlanNotification {
  type: 'task_reminder' | 'milestone' | 'streak' | 'exam_countdown' | 'motivation';
  planId: string;
  taskId?: string;
  title: string;
  body: string;
  scheduledFor: number;
  sent: boolean;
  sentAt?: number;
}

// ==================== SETTINGS UPDATE TYPES ====================

/**
 * Plan update request
 */
export interface PrepPlanUpdateRequest {
  planId: string;
  newConfig: Partial<PrepPlanConfig>;
  reason?: string; // Optional: why user is updating
}

/**
 * Plan update result
 */
export interface PrepPlanUpdateResult {
  success: boolean;
  updatedPlan: StudyPlan;
  changes: {
    tasksAdded: number;
    tasksRemoved: number;
    weeksChanged: number;
  };
  message: string;
}

// ==================== SPEAKING PRACTICE TYPES ⭐ NEW ====================

/**
 * Speaking dialogue turn in assessment
 */
export interface SpeakingDialogueTurn {
  id: string;
  speaker: 'ai' | 'user';
  type: 'question' | 'answer';
  germanText: string;
  englishTranslation?: string;
  audioUrl?: string; // For AI responses
  expectedResponse?: string; // For scoring
  userResponse?: {
    text: string; // Transcribed text
    audioUrl?: string; // Recorded audio
    duration: number; // seconds
  };
  evaluation?: SpeakingEvaluation;
}

/**
 * Evaluation of user's speaking response
 */
export interface SpeakingEvaluation {
  overallScore: number; // 0-100
  fluency: number; // 0-100
  pronunciation: number; // 0-100
  grammar: number; // 0-100
  vocabulary: number; // 0-100
  contentAccuracy: number; // 0-100
  feedback: string;
  strengths: string[];
  areasForImprovement: string[];
}

/**
 * Speaking assessment dialogue
 */
export interface SpeakingAssessmentDialogue {
  id: string;
  part: number; // Speaking Part 1, 2, or 3
  turns: SpeakingDialogueTurn[];
  totalScore: number;
  maxScore: number;
  completedAt?: number;
  timeSpentSeconds: number;
}

// ==================== EXPORT ALL ====================

export type {
  PrepPlanOnboardingProgress,
  PrepPlanConfig,
  SectionAssessment,
  AssessmentAttempt,
  DiagnosticAssessment,
  TaskType,
  PrepPlanTask,
  WeeklyGoal,
  StudyPlan,
  StudyPlanProgress,
  SectionProgress,
  StudySession,
  PrepPlanHistory,
  PrepPlanNotification,
  PrepPlanUpdateRequest,
  PrepPlanUpdateResult,
  SpeakingDialogueTurn,
  SpeakingEvaluation,
  SpeakingAssessmentDialogue,
};
```

### 5.2 Firestore Structure

```
users/
  {userId}/
    prep-plan/
      onboarding/
        - currentStep: string
        - stepProgress: object
        - startedAt: number
        - lastUpdatedAt: number
      
      active-plan/
        - planId: string
        - examLevel: string
        - config: object
        - assessment: object
        - weeks: array
        - progress: object
        - createdAt: number
        - lastUpdated: number
      
      history/
        {planId}/
          - (same structure as active-plan)
          - completedAt: number
          - finalScore: number
      
      sessions/
        {sessionId}/
          - date: string
          - tasksCompleted: number
          - timeSpentMinutes: number
          - sectionsStudied: array
          - startTime: number
          - endTime: number
      
      notifications/
        {notificationId}/
          - type: string
          - planId: string
          - taskId: string (optional)
          - scheduledFor: number
          - sent: boolean
          - sentAt: number (optional)
```

---

## 🎓 Multi-Level Exam Support (A1-B2)

### 6.1 Level Configuration File

Create new file: `src/config/prep-plan-level.config.ts`

```typescript
/**
 * Prep Plan Level Configuration
 * 
 * Defines exam structure and assessment parameters for each exam level.
 * Similar to mock-exam.types.ts but specifically for prep plan assessments.
 */

import { ExamLevel } from './exam-config.types';

export interface PrepPlanLevelSection {
  id: string;
  name: string; // Internal name
  displayName: string; // Localization key
  parts: number; // How many parts this section has
  assessmentQuestions: number; // Questions for diagnostic
  maxPoints: number; // Total points for this section in real exam
  assessmentMaxPoints: number; // Points in diagnostic (usually lower)
  estimatedMinutes: number; // Time for diagnostic section
  enabled: boolean; // Whether this section exists for this level
}

export interface PrepPlanLevelConfig {
  level: ExamLevel;
  displayName: string;
  sections: {
    reading: PrepPlanLevelSection;
    listening: PrepPlanLevelSection;
    grammar?: PrepPlanLevelSection; // Only for B1/B2
    writing: PrepPlanLevelSection;
    speaking: PrepPlanLevelSection;
  };
  totalAssessmentTime: number; // Total diagnostic time in minutes
  totalExamPoints: number; // Real exam total points
  passingPercentage: number; // Usually 60%
  levelThresholds: {
    weak: number; // Below this percentage (e.g., 50%)
    moderate: number; // Below this percentage (e.g., 75%)
    strong: number; // Above moderate threshold
  };
}

// ==================== A1 CONFIGURATION ====================

export const PREP_PLAN_CONFIG_A1: PrepPlanLevelConfig = {
  level: 'A1',
  displayName: 'TELC A1',
  sections: {
    reading: {
      id: 'reading',
      name: 'reading',
      displayName: 'prepPlan.sections.reading',
      parts: 3,
      assessmentQuestions: 6, // 2 from each part
      maxPoints: 15, // Real exam
      assessmentMaxPoints: 6,
      estimatedMinutes: 10,
      enabled: true,
    },
    listening: {
      id: 'listening',
      name: 'listening',
      displayName: 'prepPlan.sections.listening',
      parts: 3,
      assessmentQuestions: 5,
      maxPoints: 15,
      assessmentMaxPoints: 5,
      estimatedMinutes: 10,
      enabled: true,
    },
    grammar: {
      id: 'grammar',
      name: 'grammar',
      displayName: 'prepPlan.sections.grammar',
      parts: 0,
      assessmentQuestions: 0,
      maxPoints: 0,
      assessmentMaxPoints: 0,
      estimatedMinutes: 0,
      enabled: false, // A1 doesn't have separate grammar section
    },
    writing: {
      id: 'writing',
      name: 'writing',
      displayName: 'prepPlan.sections.writing',
      parts: 2,
      assessmentQuestions: 1, // One short task
      maxPoints: 15,
      assessmentMaxPoints: 10,
      estimatedMinutes: 15,
      enabled: true,
    },
    speaking: {
      id: 'speaking',
      name: 'speaking',
      displayName: 'prepPlan.sections.speaking',
      parts: 3,
      assessmentQuestions: 5, // Simple dialogue questions
      maxPoints: 15,
      assessmentMaxPoints: 10,
      estimatedMinutes: 8,
      enabled: true,
    },
  },
  totalAssessmentTime: 43, // minutes
  totalExamPoints: 60,
  passingPercentage: 60,
  levelThresholds: {
    weak: 50,
    moderate: 70,
    strong: 85,
  },
};

// ==================== B1 CONFIGURATION ====================

export const PREP_PLAN_CONFIG_B1: PrepPlanLevelConfig = {
  level: 'B1',
  displayName: 'TELC B1',
  sections: {
    reading: {
      id: 'reading',
      name: 'reading',
      displayName: 'prepPlan.sections.reading',
      parts: 3,
      assessmentQuestions: 8, // Mix from all parts
      maxPoints: 75,
      assessmentMaxPoints: 10,
      estimatedMinutes: 12,
      enabled: true,
    },
    listening: {
      id: 'listening',
      name: 'listening',
      displayName: 'prepPlan.sections.listening',
      parts: 3,
      assessmentQuestions: 6,
      maxPoints: 75,
      assessmentMaxPoints: 10,
      estimatedMinutes: 12,
      enabled: true,
    },
    grammar: {
      id: 'grammar',
      name: 'grammar',
      displayName: 'prepPlan.sections.grammar',
      parts: 2,
      assessmentQuestions: 10,
      maxPoints: 30,
      assessmentMaxPoints: 10,
      estimatedMinutes: 10,
      enabled: true,
    },
    writing: {
      id: 'writing',
      name: 'writing',
      displayName: 'prepPlan.sections.writing',
      parts: 1,
      assessmentQuestions: 1,
      maxPoints: 45,
      assessmentMaxPoints: 15,
      estimatedMinutes: 20,
      enabled: true,
    },
    speaking: {
      id: 'speaking',
      name: 'speaking',
      displayName: 'prepPlan.sections.speaking',
      parts: 3,
      assessmentQuestions: 8, // Dialogue-based
      maxPoints: 75,
      assessmentMaxPoints: 15,
      estimatedMinutes: 12,
      enabled: true,
    },
  },
  totalAssessmentTime: 66, // minutes
  totalExamPoints: 300,
  passingPercentage: 60,
  levelThresholds: {
    weak: 50,
    moderate: 75,
    strong: 90,
  },
};

// ==================== B2 CONFIGURATION ====================

export const PREP_PLAN_CONFIG_B2: PrepPlanLevelConfig = {
  level: 'B2',
  displayName: 'TELC B2',
  sections: {
    reading: {
      id: 'reading',
      name: 'reading',
      displayName: 'prepPlan.sections.reading',
      parts: 3,
      assessmentQuestions: 8,
      maxPoints: 75,
      assessmentMaxPoints: 10,
      estimatedMinutes: 15,
      enabled: true,
    },
    listening: {
      id: 'listening',
      name: 'listening',
      displayName: 'prepPlan.sections.listening',
      parts: 3,
      assessmentQuestions: 6,
      maxPoints: 75,
      assessmentMaxPoints: 10,
      estimatedMinutes: 15,
      enabled: true,
    },
    grammar: {
      id: 'grammar',
      name: 'grammar',
      displayName: 'prepPlan.sections.grammar',
      parts: 2,
      assessmentQuestions: 10,
      maxPoints: 30,
      assessmentMaxPoints: 10,
      estimatedMinutes: 12,
      enabled: true,
    },
    writing: {
      id: 'writing',
      name: 'writing',
      displayName: 'prepPlan.sections.writing',
      parts: 1,
      assessmentQuestions: 1,
      maxPoints: 45,
      assessmentMaxPoints: 15,
      estimatedMinutes: 25,
      enabled: true,
    },
    speaking: {
      id: 'speaking',
      name: 'speaking',
      displayName: 'prepPlan.sections.speaking',
      parts: 3,
      assessmentQuestions: 10,
      maxPoints: 75,
      assessmentMaxPoints: 15,
      estimatedMinutes: 15,
      enabled: true,
    },
  },
  totalAssessmentTime: 82, // minutes
  totalExamPoints: 300,
  passingPercentage: 60,
  levelThresholds: {
    weak: 55,
    moderate: 75,
    strong: 90,
  },
};

// ==================== CONFIG SELECTOR ====================

export const PREP_PLAN_CONFIGS: Record<ExamLevel, PrepPlanLevelConfig> = {
  'A1': PREP_PLAN_CONFIG_A1,
  'B1': PREP_PLAN_CONFIG_B1,
  'B2': PREP_PLAN_CONFIG_B2,
  'A2': PREP_PLAN_CONFIG_A1, // Placeholder, can be customized later
  'C1': PREP_PLAN_CONFIG_B2, // Placeholder, can be customized later
  'C2': PREP_PLAN_CONFIG_B2, // Placeholder, can be customized later
};

export function getPrepPlanConfig(level: ExamLevel): PrepPlanLevelConfig {
  return PREP_PLAN_CONFIGS[level] || PREP_PLAN_CONFIG_B1;
}

// ==================== HELPER FUNCTIONS ====================

export function getEnabledSections(level: ExamLevel): string[] {
  const config = getPrepPlanConfig(level);
  return Object.entries(config.sections)
    .filter(([_, section]) => section.enabled)
    .map(([key, _]) => key);
}

export function getTotalAssessmentPoints(level: ExamLevel): number {
  const config = getPrepPlanConfig(level);
  return Object.values(config.sections)
    .filter(section => section.enabled)
    .reduce((sum, section) => sum + section.assessmentMaxPoints, 0);
}

export function calculateSectionLevel(
  percentage: number,
  config: PrepPlanLevelConfig
): 'weak' | 'moderate' | 'strong' {
  if (percentage < config.levelThresholds.weak) return 'weak';
  if (percentage < config.levelThresholds.moderate) return 'moderate';
  return 'strong';
}
```

---

## 🗣️ Speaking Practice Component

### 7.1 Component Overview

The speaking component provides an interactive, AI-powered dialogue experience for assessment and practice.

**Key Features:**
- Real-time speech recognition (Web Speech API / Expo Speech)
- AI-powered response generation (OpenAI GPT-4o-mini)
- Turn-based dialogue: User answers → User asks → AI responds
- Pronunciation and fluency analysis
- Immediate feedback and scoring

### 7.2 Speaking Practice Component

Create new file: `src/components/speaking/SpeakingDialogueComponent.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { SpeakingDialogueTurn, SpeakingEvaluation } from '../../types/prep-plan.types';
import { speakingService } from '../../services/speaking.service';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';

interface SpeakingDialogueProps {
  part: number; // 1, 2, or 3
  level: 'A1' | 'B1' | 'B2';
  onComplete: (turns: SpeakingDialogueTurn[], totalScore: number) => void;
  onCancel: () => void;
}

export const SpeakingDialogueComponent: React.FC<SpeakingDialogueProps> = ({
  part,
  level,
  onComplete,
  onCancel,
}) => {
  const { t } = useCustomTranslation();
  const [turns, setTurns] = useState<SpeakingDialogueTurn[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    initializeSpeaking();
  }, []);

  const initializeSpeaking = async () => {
    // Request microphone permission
    const { status } = await Audio.requestPermissionsAsync();
    setHasPermission(status === 'granted');

    if (status !== 'granted') {
      Alert.alert(
        t('common.error'),
        t('prepPlan.speaking.permissionDenied')
      );
      return;
    }

    // Load initial dialogue from service
    const initialTurns = await speakingService.generateDialogue(part, level);
    setTurns(initialTurns);

    // Play first AI question
    if (initialTurns[0]?.speaker === 'ai') {
      await playAIResponse(initialTurns[0].germanText);
    }
  };

  const playAIResponse = async (text: string) => {
    // Use text-to-speech for AI responses
    await Speech.speak(text, {
      language: 'de-DE',
      pitch: 1.0,
      rate: 0.9,
    });
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert(t('common.error'), t('prepPlan.speaking.recordingFailed'));
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        // Process the recording
        await processUserResponse(uri);
      }

      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const processUserResponse = async (audioUri: string) => {
    setIsProcessing(true);

    try {
      const currentTurn = turns[currentTurnIndex];

      // Send audio to backend for transcription and evaluation
      const evaluation = await speakingService.evaluateResponse(
        audioUri,
        currentTurn,
        level
      );

      // Update turn with user response and evaluation
      const updatedTurns = [...turns];
      updatedTurns[currentTurnIndex] = {
        ...currentTurn,
        userResponse: {
          text: evaluation.transcription,
          audioUrl: audioUri,
          duration: evaluation.duration,
        },
        evaluation: evaluation.evaluation,
      };

      setTurns(updatedTurns);

      // Move to next turn or complete
      if (currentTurnIndex < turns.length - 1) {
        const nextTurn = updatedTurns[currentTurnIndex + 1];
        setCurrentTurnIndex(currentTurnIndex + 1);

        // If next turn is AI, play response
        if (nextTurn.speaker === 'ai') {
          await playAIResponse(nextTurn.germanText);
        }
      } else {
        // Dialogue complete
        const totalScore = calculateTotalScore(updatedTurns);
        onComplete(updatedTurns, totalScore);
      }
    } catch (error) {
      console.error('Failed to process response:', error);
      Alert.alert(t('common.error'), t('prepPlan.speaking.processingFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateTotalScore = (turns: SpeakingDialogueTurn[]): number => {
    const evaluatedTurns = turns.filter(t => t.evaluation);
    if (evaluatedTurns.length === 0) return 0;

    const avgScore = evaluatedTurns.reduce(
      (sum, turn) => sum + (turn.evaluation?.overallScore || 0),
      0
    ) / evaluatedTurns.length;

    return Math.round(avgScore);
  };

  const currentTurn = turns[currentTurnIndex];

  if (!hasPermission) {
    return (
      <View style={{ padding: 20 }}>
        <Text>{t('prepPlan.speaking.permissionRequired')}</Text>
      </View>
    );
  }

  if (turns.length === 0 || !currentTurn) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Progress indicator */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 16 }}>
          {t('prepPlan.speaking.turn')} {currentTurnIndex + 1} / {turns.length}
        </Text>
      </View>

      {/* Current question/prompt */}
      <View style={{ backgroundColor: '#f0f0f0', padding: 15, borderRadius: 10, marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          {currentTurn.type === 'question'
            ? t('prepPlan.speaking.aiAsks')
            : t('prepPlan.speaking.yourTurn')}
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 5 }}>
          {currentTurn.germanText}
        </Text>
        {currentTurn.englishTranslation && (
          <Text style={{ fontSize: 14, color: '#666', fontStyle: 'italic' }}>
            {currentTurn.englishTranslation}
          </Text>
        )}
      </View>

      {/* Previous turns history */}
      <View style={{ flex: 1, marginBottom: 20 }}>
        {turns.slice(0, currentTurnIndex).map((turn, index) => (
          <View
            key={turn.id}
            style={{
              alignSelf: turn.speaker === 'ai' ? 'flex-start' : 'flex-end',
              backgroundColor: turn.speaker === 'ai' ? '#e3f2fd' : '#c8e6c9',
              padding: 10,
              borderRadius: 8,
              marginBottom: 10,
              maxWidth: '80%',
            }}
          >
            <Text style={{ fontSize: 14 }}>
              {turn.userResponse?.text || turn.germanText}
            </Text>
            {turn.evaluation && (
              <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
                ⭐ {turn.evaluation.overallScore}/100
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Recording controls */}
      {currentTurn.speaker === 'user' && (
        <View style={{ alignItems: 'center' }}>
          {isProcessing ? (
            <View style={{ alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={{ marginTop: 10 }}>
                {t('prepPlan.speaking.analyzing')}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={isRecording ? stopRecording : startRecording}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: isRecording ? '#f44336' : '#667eea',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Icon
                name={isRecording ? 'stop' : 'microphone'}
                size={40}
                color="#fff"
              />
            </TouchableOpacity>
          )}
          <Text style={{ marginTop: 10, fontSize: 16 }}>
            {isRecording
              ? t('prepPlan.speaking.tapToStop')
              : t('prepPlan.speaking.tapToSpeak')}
          </Text>
        </View>
      )}

      {/* Cancel button */}
      <TouchableOpacity
        onPress={onCancel}
        style={{ marginTop: 20, padding: 10, alignItems: 'center' }}
      >
        <Text style={{ color: '#666' }}>{t('common.cancel')}</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### 7.3 Speaking Service

Create new file: `src/services/speaking.service.ts`

```typescript
import { functions } from '../config/firebase.config';
import { SpeakingDialogueTurn, SpeakingEvaluation } from '../types/prep-plan.types';
import { activeExamConfig } from '../config/active-exam.config';

class SpeakingService {
  /**
   * Generate dialogue turns for speaking assessment
   */
  async generateDialogue(part: number, level: string): Promise<SpeakingDialogueTurn[]> {
    try {
      const callable = functions().httpsCallable('generateSpeakingDialogue');
      const result = await callable({ part, level, examLevel: activeExamConfig.level });
      return result.data.turns;
    } catch (error) {
      console.error('Error generating dialogue:', error);
      throw error;
    }
  }

  /**
   * Evaluate user's speaking response
   */
  async evaluateResponse(
    audioUri: string,
    turn: SpeakingDialogueTurn,
    level: string
  ): Promise<{
    transcription: string;
    duration: number;
    evaluation: SpeakingEvaluation;
  }> {
    try {
      // Upload audio file
      const audioBase64 = await this.uploadAudio(audioUri);

      // Call Cloud Function for evaluation
      const callable = functions().httpsCallable('evaluateSpeakingResponse');
      const result = await callable({
        audioBase64,
        turnId: turn.id,
        expectedResponse: turn.expectedResponse,
        level,
      });

      return result.data;
    } catch (error) {
      console.error('Error evaluating response:', error);
      throw error;
    }
  }

  /**
   * Convert audio file to base64 for upload
   */
  private async uploadAudio(uri: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:audio/... prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const speakingService = new SpeakingService();
```

### 7.4 Cloud Function for Speaking Evaluation

Create new file: `functions/src/evaluate-speaking.ts`

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: functions.config().openai.key,
});

/**
 * Generate speaking dialogue for Part 1 (Personal Introduction)
 */
export const generateSpeakingDialogue = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { part, level } = data;

    // For now, focus on Part 1
    if (part === 1) {
      return {
        turns: [
          {
            id: 'turn-1',
            speaker: 'ai',
            type: 'question',
            germanText: 'Guten Tag! Wie heißen Sie?',
            englishTranslation: 'Good day! What is your name?',
            expectedResponse: 'Ich heiße [Name]',
          },
          {
            id: 'turn-2',
            speaker: 'user',
            type: 'answer',
            germanText: '', // User will speak
            expectedResponse: 'Ich heiße [Name]',
          },
          {
            id: 'turn-3',
            speaker: 'ai',
            type: 'question',
            germanText: 'Woher kommen Sie?',
            englishTranslation: 'Where are you from?',
            expectedResponse: 'Ich komme aus [Land/Stadt]',
          },
          {
            id: 'turn-4',
            speaker: 'user',
            type: 'answer',
            germanText: '',
            expectedResponse: 'Ich komme aus [Land/Stadt]',
          },
          {
            id: 'turn-5',
            speaker: 'ai',
            type: 'question',
            germanText: 'Was machen Sie beruflich?',
            englishTranslation: 'What do you do professionally?',
            expectedResponse: 'Ich bin [Beruf] / Ich arbeite als [Beruf]',
          },
          {
            id: 'turn-6',
            speaker: 'user',
            type: 'answer',
            germanText: '',
            expectedResponse: 'Ich bin [Beruf] / Ich arbeite als [Beruf]',
          },
          {
            id: 'turn-7',
            speaker: 'ai',
            type: 'question',
            germanText: 'Haben Sie Hobbys? Was machen Sie gerne in Ihrer Freizeit?',
            englishTranslation: 'Do you have hobbies? What do you like to do in your free time?',
            expectedResponse: 'Ich [verb] gerne / Meine Hobbys sind [hobbies]',
          },
          {
            id: 'turn-8',
            speaker: 'user',
            type: 'answer',
            germanText: '',
            expectedResponse: 'Ich [verb] gerne / Meine Hobbys sind [hobbies]',
          },
        ],
      };
    }

    throw new functions.https.HttpsError('unimplemented', 'Part not yet implemented');
  }
);

/**
 * Evaluate user's speaking response using Whisper + GPT-4
 */
export const evaluateSpeakingResponse = functions
  .runWith({
    timeoutSeconds: 120,
    memory: '512MB',
  })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { audioBase64, turnId, expectedResponse, level } = data;

    try {
      // Step 1: Transcribe audio using Whisper
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      
      const transcription = await openai.audio.transcriptions.create({
        file: audioBuffer as any,
        model: 'whisper-1',
        language: 'de',
      });

      const transcribedText = transcription.text;

      // Step 2: Evaluate with GPT-4o-mini
      const prompt = `
You are evaluating a German language learner's speaking response for a TELC ${level} exam.

Expected response pattern: ${expectedResponse}
User's actual response: ${transcribedText}

Evaluate the response on a scale of 0-100 for each criterion:
1. Fluency (natural flow, pauses)
2. Pronunciation (clarity, accent)
3. Grammar (correct structures)
4. Vocabulary (appropriate word choice)
5. Content Accuracy (answers the question correctly)

Provide:
- Overall score (0-100)
- Score for each criterion
- Brief feedback (2-3 sentences)
- Strengths (list)
- Areas for improvement (list)

Respond in JSON format:
{
  "overallScore": 0-100,
  "fluency": 0-100,
  "pronunciation": 0-100,
  "grammar": 0-100,
  "vocabulary": 0-100,
  "contentAccuracy": 0-100,
  "feedback": "string",
  "strengths": ["string"],
  "areasForImprovement": ["string"]
}
      `;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const evaluation = JSON.parse(completion.choices[0].message.content || '{}');

      return {
        transcription: transcribedText,
        duration: 0, // Calculate from audio metadata if needed
        evaluation,
      };
    } catch (error) {
      console.error('Error evaluating speaking:', error);
      throw new functions.https.HttpsError('internal', 'Failed to evaluate speaking');
    }
  });
```

---

## 🎨 UI/UX Implementation

### 8.1 Screen List

1. **PrepPlanOnboardingScreen** - Schedule configuration
2. **DiagnosticAssessmentScreen** - Multi-section assessment
3. **AssessmentResultsScreen** - Results with speaking included
4. **StudyPlanDashboardScreen** - Main hub
5. **WeeklyPlanScreen** - Weekly breakdown
6. **PrepPlanProgressScreen** - Analytics and insights
7. **PrepPlanSettingsScreen** ⭐ NEW - Update plan settings

### 8.2 Home Screen Integration

Update `src/screens/HomeScreen.tsx`:

```typescript
// Add prep plan card - VISIBLE TO ALL USERS
const PrepPlanCard = () => {
  const { isPremium } = usePremium();
  const { enqueue } = useModalQueue();
  const [onboardingProgress, setOnboardingProgress] = useState<PrepPlanOnboardingProgress | null>(null);

  useEffect(() => {
    loadOnboardingProgress();
  }, []);

  const loadOnboardingProgress = async () => {
    if (!user) return;
    const progress = await prepPlanService.getOnboardingProgress(user.uid);
    setOnboardingProgress(progress);
  };

  const handlePress = () => {
    if (!isPremium) {
      // Show premium modal with benefits
      enqueue('premium-upsell', {
        feature: 'prep-plan',
        benefits: [
          t('prepPlan.benefits.personalized'),
          t('prepPlan.benefits.diagnostic'),
          t('prepPlan.benefits.speaking'),
          t('prepPlan.benefits.tracking'),
          t('prepPlan.benefits.adaptive'),
        ],
      });
      return;
    }

    // Navigate based on progress
    if (!onboardingProgress) {
      navigation.navigate('PrepPlanOnboarding');
    } else if (onboardingProgress.currentStep === 'completed') {
      navigation.navigate('StudyPlanDashboard');
    } else {
      // Resume onboarding
      navigation.navigate('PrepPlanOnboarding', {
        resume: true,
        step: onboardingProgress.currentStep,
      });
    }
  };

  // Dynamic title and description based on progress
  const getCardContent = () => {
    if (!onboardingProgress || !isPremium) {
      return {
        title: t('prepPlan.title'),
        description: t('prepPlan.description'),
        badge: '⭐ PREMIUM',
      };
    }

    switch (onboardingProgress.currentStep) {
      case 'schedule':
        return {
          title: t('prepPlan.continueOnboarding'),
          description: t('prepPlan.onboarding.resumeSchedule'),
          badge: '▶️ CONTINUE',
        };
      case 'assessment':
        return {
          title: t('prepPlan.continueAssessment'),
          description: t('prepPlan.onboarding.resumeAssessment'),
          badge: '▶️ CONTINUE',
        };
      case 'results':
      case 'generating':
        return {
          title: t('prepPlan.almostReady'),
          description: t('prepPlan.onboarding.finishSetup'),
          badge: '🎯 FINISH',
        };
      case 'completed':
        return {
          title: t('prepPlan.myPlan'),
          description: t('prepPlan.viewDashboard'),
          badge: '📊 VIEW',
        };
      default:
        return {
          title: t('prepPlan.title'),
          description: t('prepPlan.description'),
          badge: '⭐ START',
        };
    }
  };

  const content = getCardContent();

  return (
    <AnimatedGradientBorder
      borderWidth={2}
      borderRadius={12}
      colors={['#667eea', '#764ba2', '#f093fb', '#4facfe']}
      duration={4000}
      style={styles.card}
    >
      <Card style={styles.cardInner} onPress={handlePress}>
        <Text style={styles.premiumBadge}>{content.badge}</Text>
        <Text style={styles.cardTitle}>{content.title}</Text>
        <Text style={styles.cardDescription}>{content.description}</Text>
      </Card>
    </AnimatedGradientBorder>
  );
};
```

### 8.3 Navigation Updates

Update `src/navigation/HomeStackNavigator.tsx`:

```typescript
export type HomeStackParamList = {
  // ... existing screens
  PrepPlanOnboarding: { resume?: boolean; step?: string };
  DiagnosticAssessment: { config: PrepPlanConfig };
  AssessmentResults: { assessmentId: string };
  StudyPlanDashboard: undefined;
  WeeklyPlan: { weekNumber: number };
  PrepPlanProgress: undefined;
  PrepPlanSettings: { planId: string };
  SpeakingAssessment: { part: number }; // ⭐ NEW
};
```

### 8.4 Key Screens

#### 8.4.1 PrepPlanOnboardingScreen

```typescript
// Saves progress after each step
// Validates inputs
// Shows estimated totals
// Supports resume from saved progress
```

#### 8.4.2 DiagnosticAssessmentScreen

```typescript
// Multi-section assessment
// Progress saved after each section
// Includes speaking dialogue component
// Writing is MANDATORY (not optional)
// Shows timer and progress
// Auto-saves on background/exit
```

#### 8.4.3 AssessmentResultsScreen

```typescript
// Shows all 5 sections including speaking
// Radar chart with speaking axis
// Overall score calculation includes speaking
// Strengths/weaknesses analysis
// "Generate Plan" CTA button
```

#### 8.4.4 StudyPlanDashboardScreen

```typescript
// Exam countdown
// Today's tasks (all 5 section types)
// Study streak
// Progress stats
// [Update Settings] button ⭐ NEW
```

#### 8.4.5 PrepPlanSettingsScreen ⭐ NEW

```typescript
// Update exam date
// Change study hours/day
// Change study days/week
// [Save & Regenerate Plan] button
// Shows confirmation modal before regenerating
```

---

## 💾 Onboarding Progress Persistence

### 9.1 Service Methods

Create/extend `src/services/prep-plan.service.ts`:

```typescript
class PrepPlanService {
  /**
   * Save onboarding progress
   */
  async saveOnboardingProgress(
    userId: string,
    step: string,
    data: any
  ): Promise<void> {
    const progressRef = firestore()
      .collection('users')
      .doc(userId)
      .collection('prep-plan')
      .doc('onboarding');

    await progressRef.set({
      currentStep: step,
      stepProgress: {
        ...data,
      },
      lastUpdatedAt: Date.now(),
    }, { merge: true });
  }

  /**
   * Get onboarding progress
   */
  async getOnboardingProgress(
    userId: string
  ): Promise<PrepPlanOnboardingProgress | null> {
    const progressRef = firestore()
      .collection('users')
      .doc(userId)
      .collection('prep-plan')
      .doc('onboarding');

    const doc = await progressRef.get();
    if (!doc.exists) return null;

    return doc.data() as PrepPlanOnboardingProgress;
  }

  /**
   * Clear onboarding progress (after completion)
   */
  async clearOnboardingProgress(userId: string): Promise<void> {
    const progressRef = firestore()
      .collection('users')
      .doc(userId)
      .collection('prep-plan')
      .doc('onboarding');

    await progressRef.delete();
  }
}
```

### 9.2 Implementation in Onboarding Screens

```typescript
// In PrepPlanOnboardingScreen
const handleNextStep = async () => {
  // Save current step data
  await prepPlanService.saveOnboardingProgress(user.uid, 'schedule', {
    schedule: configData,
  });

  // Navigate to next screen
  navigation.navigate('DiagnosticAssessment', { config: configData });
};

// In DiagnosticAssessmentScreen
const handleSectionComplete = async (sectionName: string, results: any) => {
  // Save assessment progress
  await prepPlanService.saveOnboardingProgress(user.uid, 'assessment', {
    assessment: {
      ...existingAssessment,
      [sectionName]: results,
    },
  });
};
```

---

## 🔔 Personalized Notifications

### 11.1 Extend Notification Service

Update `functions/src/send-scheduled-notifications.ts`:

```typescript
/**
 * Build prep plan-specific notification
 */
async function buildPrepPlanNotification(
  uid: string,
  userData: any,
  dayOfWeek: number
): Promise<{ title: string; body: string } | null> {
  const db = admin.firestore();

  try {
    // Check if user has active prep plan
    const planDoc = await db
      .collection('users')
      .doc(uid)
      .collection('prep-plan')
      .doc('active-plan')
      .get();

    if (!planDoc.exists) return null;

    const plan = planDoc.data() as any;
    const today = new Date().toISOString().split('T')[0];

    // Get today's tasks
    const currentWeek = plan.weeks[plan.currentWeek - 1];
    if (!currentWeek) return null;

    const todaysTasks = currentWeek.tasks.filter((task: any) => !task.completed);

    if (todaysTasks.length === 0) return null;

    const userLanguage = userData.language || 'en';
    const firstName = extractFirstName(userData.displayName);

    // Calculate days until exam
    const daysUntilExam = Math.ceil(
      (new Date(plan.config.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Choose notification type based on context
    if (daysUntilExam <= 7) {
      // Final week - urgent
      return {
        title: PREP_PLAN_TITLES[userLanguage] || PREP_PLAN_TITLES.en,
        body: firstName
          ? `${firstName}, ${daysUntilExam} days until your exam! 🎯 Complete today's tasks.`
          : `${daysUntilExam} days until your exam! 🎯 Complete today's tasks.`,
      };
    } else if (plan.progress.currentStreak === 0 && plan.progress.lastStudyDate !== today) {
      // Missed yesterday - motivational
      return {
        title: PREP_PLAN_TITLES[userLanguage] || PREP_PLAN_TITLES.en,
        body: firstName
          ? `${firstName}, don't break your progress! You have ${todaysTasks.length} tasks waiting. 💪`
          : `Don't break your progress! You have ${todaysTasks.length} tasks waiting. 💪`,
      };
    } else {
      // Normal reminder
      const taskList = todaysTasks.slice(0, 2).map((t: any) => t.title).join(', ');
      return {
        title: PREP_PLAN_TITLES[userLanguage] || PREP_PLAN_TITLES.en,
        body: firstName
          ? `${firstName}, ready for today? 📚 ${taskList}`
          : `Ready for today? 📚 ${taskList}`,
      };
    }
  } catch (error) {
    console.error('Error building prep plan notification:', error);
    return null;
  }
}

// In sendNotificationToUser function:
async function sendNotificationToUser(...) {
  // ... existing code ...

  // Check for prep plan notification first
  const prepPlanNotif = await buildPrepPlanNotification(uid, userData, dayOfWeek);

  let title, body;
  if (prepPlanNotif) {
    title = prepPlanNotif.title;
    body = prepPlanNotif.body;
  } else {
    // Fall back to standard notification
    title = NOTIFICATION_TITLES[userLanguage];
    body = buildNotificationBody(userLanguage, dayOfWeek, firstName, streakDays);
  }

  // ... rest of notification send logic ...
}
```

---

## ⚙️ Plan Management & Updates

### 12.1 Update Settings Screen

Create `src/screens/prep-plan/PrepPlanSettingsScreen.tsx`:

```typescript
const PrepPlanSettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [examDate, setExamDate] = useState<Date>(new Date());
  const [dailyHours, setDailyHours] = useState(2);
  const [studyDays, setStudyDays] = useState(5);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    const activePlan = await prepPlanService.getActivePlan(user.uid);
    setPlan(activePlan);
    if (activePlan) {
      setExamDate(new Date(activePlan.config.examDate));
      setDailyHours(activePlan.config.dailyStudyHours);
      setStudyDays(activePlan.config.studyDaysPerWeek);
    }
  };

  const handleSave = () => {
    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirmUpdate = async () => {
    setIsUpdating(true);
    try {
      const updateRequest: PrepPlanUpdateRequest = {
        planId: plan!.planId,
        newConfig: {
          examDate,
          dailyStudyHours: dailyHours,
          studyDaysPerWeek: studyDays,
        },
      };

      const result = await prepPlanService.updatePlan(user.uid, updateRequest);

      Alert.alert(
        t('common.success'),
        t('prepPlan.settings.updateSuccess', {
          added: result.changes.tasksAdded,
          removed: result.changes.tasksRemoved,
        })
      );

      navigation.goBack();
    } catch (error) {
      Alert.alert(t('common.error'), t('prepPlan.settings.updateFailed'));
    } finally {
      setIsUpdating(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.sectionTitle}>{t('prepPlan.settings.examDate')}</Text>
        <DatePicker value={examDate} onChange={setExamDate} />

        <Text style={styles.sectionTitle}>{t('prepPlan.settings.dailyHours')}</Text>
        <Slider
          value={dailyHours}
          onValueChange={setDailyHours}
          minimumValue={0.5}
          maximumValue={5}
          step={0.5}
        />
        <Text>{dailyHours} hours/day</Text>

        <Text style={styles.sectionTitle}>{t('prepPlan.settings.studyDays')}</Text>
        <DaySelector selectedDays={studyDays} onChange={setStudyDays} />

        <Button title={t('prepPlan.settings.saveAndRegenerate')} onPress={handleSave} />
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('prepPlan.settings.confirmTitle')}</Text>
            <Text style={styles.modalBody}>
              {t('prepPlan.settings.confirmBody')}
            </Text>
            <View style={styles.modalButtons}>
              <Button
                title={t('common.cancel')}
                onPress={() => setShowConfirmModal(false)}
              />
              <Button
                title={t('common.confirm')}
                onPress={handleConfirmUpdate}
                disabled={isUpdating}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
```

### 12.2 Plan Update Service Method

```typescript
class PrepPlanService {
  /**
   * Update plan settings and regenerate tasks
   * Preserves completed tasks, adjusts remaining ones
   */
  async updatePlan(
    userId: string,
    updateRequest: PrepPlanUpdateRequest
  ): Promise<PrepPlanUpdateResult> {
    const { planId, newConfig } = updateRequest;

    // Get current plan
    const currentPlan = await this.getActivePlan(userId);
    if (!currentPlan || currentPlan.planId !== planId) {
      throw new Error('Plan not found');
    }

    // Merge new config with existing
    const updatedConfig = {
      ...currentPlan.config,
      ...newConfig,
      lastUpdated: Date.now(),
    };

    // Recalculate available time
    const daysUntilExam = Math.ceil(
      (new Date(updatedConfig.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const totalStudyHours =
      daysUntilExam * (updatedConfig.dailyStudyHours * updatedConfig.studyDaysPerWeek / 7);

    // Get completed tasks
    const completedTasks = currentPlan.weeks
      .flatMap(week => week.tasks)
      .filter(task => task.completed);

    // Generate new plan with adjusted parameters
    const newWeeks = await this.generateWeeklyGoals(
      daysUntilExam,
      totalStudyHours,
      currentPlan.assessment,
      updatedConfig,
      completedTasks // Pass completed tasks to avoid duplication
    );

    // Update plan
    const updatedPlan: StudyPlan = {
      ...currentPlan,
      config: updatedConfig,
      weeks: newWeeks,
      totalWeeks: newWeeks.length,
      lastUpdated: Date.now(),
    };

    // Save to Firestore
    await this.savePlan(userId, updatedPlan);

    return {
      success: true,
      updatedPlan,
      changes: {
        tasksAdded: newWeeks.flatMap(w => w.tasks).length - completedTasks.length,
        tasksRemoved: 0, // We don't remove, only add
        weeksChanged: Math.abs(newWeeks.length - currentPlan.weeks.length),
      },
      message: 'Plan updated successfully',
    };
  }
}
```

---

## 📊 Analytics & Progress Tracking

### 13.1 New Analytics Events

```typescript
// src/services/analytics.events.ts

export const AnalyticsEvents = {
  // ... existing events

  // Prep Plan Events
  PREP_PLAN_CARD_VIEWED: 'prep_plan_card_viewed',
  PREP_PLAN_CARD_CLICKED: 'prep_plan_card_clicked',
  PREP_PLAN_PREMIUM_GATE_SHOWN: 'prep_plan_premium_gate_shown',
  PREP_PLAN_ONBOARDING_STARTED: 'prep_plan_onboarding_started',
  PREP_PLAN_ONBOARDING_RESUMED: 'prep_plan_onboarding_resumed',
  PREP_PLAN_CONFIG_SAVED: 'prep_plan_config_saved',
  PREP_PLAN_DIAGNOSTIC_STARTED: 'prep_plan_diagnostic_started',
  PREP_PLAN_DIAGNOSTIC_SECTION_COMPLETED: 'prep_plan_diagnostic_section_completed',
  PREP_PLAN_DIAGNOSTIC_COMPLETED: 'prep_plan_diagnostic_completed',
  PREP_PLAN_SPEAKING_STARTED: 'prep_plan_speaking_started', // ⭐ NEW
  PREP_PLAN_SPEAKING_COMPLETED: 'prep_plan_speaking_completed', // ⭐ NEW
  PREP_PLAN_RESULTS_VIEWED: 'prep_plan_results_viewed',
  PREP_PLAN_GENERATED: 'prep_plan_generated',
  PREP_PLAN_DASHBOARD_OPENED: 'prep_plan_dashboard_opened',
  PREP_PLAN_TASK_STARTED: 'prep_plan_task_started',
  PREP_PLAN_TASK_COMPLETED: 'prep_plan_task_completed',
  PREP_PLAN_WEEK_COMPLETED: 'prep_plan_week_completed',
  PREP_PLAN_SETTINGS_OPENED: 'prep_plan_settings_opened', // ⭐ NEW
  PREP_PLAN_SETTINGS_UPDATED: 'prep_plan_settings_updated', // ⭐ NEW
  PREP_PLAN_NOTIFICATION_SENT: 'prep_plan_notification_sent', // ⭐ NEW
  PREP_PLAN_ABANDONED: 'prep_plan_abandoned',
};
```

### 13.2 Data Tracking

Track comprehensive data at every step:

- **Onboarding**: Step entry/exit, time spent, abandonment points
- **Assessment**: Per-question responses, time per section, difficulty patterns
- **Study Sessions**: Start/end time, tasks attempted, scores, interruptions
- **Progress**: Daily/weekly completion rates, score trends, weak areas
- **Notifications**: Sent/opened/dismissed, engagement patterns

---

## 💎 Premium Integration

### 15.1 Premium Benefits Modal

```typescript
// When non-premium user taps prep plan card
const PrepPlanPremiumModal = () => {
  return (
    <View>
      <Text style={styles.title}>Unlock Exam Prep Plan</Text>
      <Text style={styles.subtitle}>Premium Feature</Text>

      <View style={styles.benefits}>
        <BenefitItem
          icon="check-circle"
          text={t('prepPlan.benefits.personalized')}
        />
        <BenefitItem
          icon="check-circle"
          text={t('prepPlan.benefits.diagnostic')}
        />
        <BenefitItem
          icon="check-circle"
          text={t('prepPlan.benefits.speaking')}
        />
        <BenefitItem
          icon="check-circle"
          text={t('prepPlan.benefits.tracking')}
        />
        <BenefitItem
          icon="check-circle"
          text={t('prepPlan.benefits.adaptive')}
        />
      </View>

      <Button title={t('premium.upgrade')} onPress={handleUpgrade} />
    </View>
  );
};
```

---

## 🌍 Localization

### 16.1 New Translation Keys

Add to all locale files (`en.json`, `de.json`, `ar.json`, etc.):

```json
{
  "prepPlan": {
    "title": "Exam Prep Plan",
    "description": "Get a personalized study plan based on your level and schedule",
    "continueOnboarding": "Continue Setup",
    "continueAssessment": "Finish Assessment",
    "almostReady": "Almost Ready!",
    "myPlan": "My Study Plan",
    "viewDashboard": "View your personalized study plan",
    
    "benefits": {
      "personalized": "AI-generated study plan tailored to your level",
      "diagnostic": "Comprehensive diagnostic assessment",
      "speaking": "Interactive speaking practice with AI",
      "tracking": "Detailed progress tracking and analytics",
      "adaptive": "Plan adapts to your performance"
    },

    "sections": {
      "reading": "Reading",
      "listening": "Listening",
      "grammar": "Grammar",
      "writing": "Writing",
      "speaking": "Speaking"
    },

    "onboarding": {
      "title": "Create Your Study Plan",
      "welcome": "Let's create your personalized study plan in 4 steps",
      "step1": "Study Schedule",
      "step2": "Level Assessment",
      "step3": "Results",
      "step4": "Generate Plan",
      "resumeSchedule": "Continue setting up your study schedule",
      "resumeAssessment": "Complete your level assessment",
      "finishSetup": "Generate your personalized plan",
      "examDate": "When is your exam?",
      "studyHours": "Daily study time",
      "studyDays": "Study days per week",
      "preferredTime": "Preferred study time",
      "morning": "Morning (6-11 AM)",
      "afternoon": "Afternoon (12-6 PM)",
      "evening": "Evening (6-11 PM)",
      "flexible": "Flexible",
      "hoursPerDay": "{{hours}} hours/day",
      "daysPerWeek": "{{days}} days/week",
      "totalWeeks": "Total: {{weeks}} weeks",
      "totalHours": "Total: {{hours}} hours",
      "next": "Next: Assessment",
      "startAssessment": "Start Level Assessment"
    },

    "assessment": {
      "title": "Level Assessment",
      "subtitle": "Quick assessment to determine your current level",
      "allSectionsRequired": "All sections are required",
      "estimatedTime": "Estimated time: {{minutes}} minutes",
      "section": "Section {{current}}/{{total}}",
      "nextSection": "Next: {{section}}",
      "complete": "Complete Assessment",
      "progress": "{{completed}}/{{total}} sections completed",
      "saveProgress": "Progress saved automatically"
    },

    "speaking": {
      "title": "Speaking Assessment",
      "subtitle": "Interactive dialogue practice",
      "permissionRequired": "Microphone permission is required for speaking practice",
      "permissionDenied": "Please enable microphone access in settings",
      "recordingFailed": "Failed to start recording",
      "processingFailed": "Failed to process your response",
      "analyzing": "Analyzing your response...",
      "tapToSpeak": "Tap to speak",
      "tapToStop": "Tap to stop",
      "aiAsks": "AI asks:",
      "yourTurn": "Your turn to speak:",
      "turn": "Turn {{current}}/{{total}}",
      "listenCarefully": "Listen carefully and respond in German",
      "speakClearly": "Speak clearly and naturally"
    },

    "results": {
      "title": "Your Assessment Results",
      "overallScore": "Overall Score",
      "strengths": "Your Strengths",
      "weaknesses": "Areas to Improve",
      "generatePlan": "Generate My Study Plan",
      "generating": "Generating your personalized plan...",
      "level": {
        "beginner": "Beginner",
        "intermediate": "Intermediate",
        "advanced": "Advanced"
      },
      "sectionLevel": {
        "weak": "Needs Practice",
        "moderate": "Good",
        "strong": "Excellent"
      }
    },

    "dashboard": {
      "title": "My Study Plan",
      "examIn": "Exam in {{days}} days",
      "examInWeeks": "Exam in {{weeks}} weeks",
      "todaysTasks": "Today's Tasks",
      "weeklyProgress": "This Week's Progress",
      "studyStreak": "{{days}}-day study streak 🔥",
      "hoursCompleted": "{{completed}}/{{total}} hours",
      "tasksCompleted": "{{completed}}/{{total}} tasks",
      "startStudying": "Start Studying",
      "viewPlan": "View Full Plan",
      "viewProgress": "View Progress",
      "updateSettings": "Update Plan Settings",
      "noTasksToday": "No tasks scheduled for today. Great job staying ahead!",
      "taskTypes": {
        "reading": "📖 Reading",
        "listening": "🎧 Listening",
        "grammar": "📝 Grammar",
        "writing": "✍️ Writing",
        "speaking": "🗣️ Speaking",
        "vocabulary": "📚 Vocabulary",
        "mock-exam": "🎯 Mock Exam"
      }
    },

    "settings": {
      "title": "Update Plan Settings",
      "examDate": "Exam Date",
      "dailyHours": "Study Hours per Day",
      "studyDays": "Study Days per Week",
      "saveAndRegenerate": "Save & Update Plan",
      "confirmTitle": "Update Study Plan?",
      "confirmBody": "Your plan will be adjusted based on the new settings. Completed tasks will be preserved.",
      "updateSuccess": "Plan updated! Added {{added}} tasks.",
      "updateFailed": "Failed to update plan. Please try again."
    },

    "progress": {
      "title": "Progress & Analytics",
      "overallCompletion": "Overall Completion",
      "sectionProgress": "Section Progress",
      "improvementTrends": "Improvement Trends",
      "readinessScore": "Exam Readiness",
      "recommendations": "AI Recommendations",
      "seeAllSessions": "See All Study Sessions",
      "averageScore": "Average Score",
      "timeSpent": "Time Spent",
      "improvement": "+{{percent}}% improvement",
      "lastPracticed": "Last practiced: {{date}}"
    }
  }
}
```

---

## ⏱️ Implementation Timeline

### Phase 1: Foundation & Data Models (Week 1-2)
- [ ] Create TypeScript types (`prep-plan.types.ts`)
- [ ] Create level configs (`prep-plan-level.config.ts`)
- [ ] Set up Firestore structure
- [ ] Implement `PrepPlanService` core methods
- [ ] Implement onboarding progress persistence
- [ ] Write unit tests for services

### Phase 2: Speaking Component (Week 3)
- [ ] Implement `SpeakingDialogueComponent`
- [ ] Create `speaking.service.ts`
- [ ] Build Cloud Functions for speaking:
  - `generateSpeakingDialogue`
  - `evaluateSpeakingResponse`
- [ ] Test speech recognition and TTS
- [ ] Integrate with assessment flow

### Phase 3: UI - Onboarding & Assessment (Week 4-5)
- [ ] Build `PrepPlanOnboardingScreen`
- [ ] Build `DiagnosticAssessmentScreen` (multi-section)
- [ ] Integrate speaking assessment
- [ ] Build `AssessmentResultsScreen` (with speaking)
- [ ] Update `HomeScreen` with prep plan card (visible to all)
- [ ] Implement premium gate modal
- [ ] Add navigation routes

### Phase 4: UI - Dashboard & Management (Week 6)
- [ ] Build `StudyPlanDashboardScreen`
- [ ] Build `WeeklyPlanScreen`
- [ ] Build `PrepPlanProgressScreen`
- [ ] Build `PrepPlanSettingsScreen` ⭐ NEW
- [ ] Implement task completion flow
- [ ] Add progress visualization charts

### Phase 5: Plan Generation & AI (Week 7)
- [ ] Implement `generateStudyPlan` logic
- [ ] Create Cloud Function for AI recommendations
- [ ] Implement adaptive task distribution
- [ ] Build plan update/regeneration logic
- [ ] Test multi-level support (A1, B1, B2)

### Phase 6: Notifications & Engagement (Week 8)
- [ ] Extend `send-scheduled-notifications.ts`
- [ ] Implement prep plan notification logic
- [ ] Add notification scheduling
- [ ] Test notification delivery
- [ ] Implement notification analytics

### Phase 7: Testing & Polish (Week 9-10)
- [ ] End-to-end testing (all levels)
- [ ] Localization for all languages
- [ ] Analytics implementation
- [ ] Performance optimization
- [ ] Premium flow testing
- [ ] Bug fixes and refinements

### Phase 8: Beta & Launch (Week 11-12)
- [ ] Beta testing with select users
- [ ] Gather feedback and iterate
- [ ] Final QA pass
- [ ] Documentation
- [ ] Launch to production

---

## 🧪 Testing Strategy

### Unit Tests
- Service methods (prepPlanService, speakingService)
- Data transformations
- Score calculations
- Level determination logic

### Integration Tests
- Firestore read/write operations
- Cloud Function calls
- Navigation flows
- Progress persistence

### E2E Tests
- Complete onboarding flow (all levels)
- Assessment completion (including speaking)
- Plan generation
- Task completion
- Settings update
- Premium gate

### User Acceptance Testing
- Beta group of 10-20 users
- Test on A1, B1, and B2 levels
- Collect feedback on:
  - Speaking practice usability
  - Plan accuracy and usefulness
  - Notification relevance
  - Overall experience

---

## 📈 Success Metrics

### Adoption Metrics
- **Prep Plan Card CTR**: % of users who tap the card
- **Premium Conversion**: % of free users who upgrade after seeing feature
- **Onboarding Completion**: % who complete full assessment
- **Plan Activation**: % who generate a plan

### Engagement Metrics
- **Daily Active Users (DAU)**: Users engaging with prep plan daily
- **Weekly Active Users (WAU)**: Users engaging weekly
- **Task Completion Rate**: % of scheduled tasks completed
- **Study Streak**: Average and median streak length
- **Session Duration**: Average time per study session

### Performance Metrics
- **Score Improvement**: Average % improvement from diagnostic to current
- **Section Improvement**: Improvement per section (especially speaking)
- **Exam Readiness**: Average readiness score at 1 week before exam
- **Plan Completion**: % of users who complete their entire plan

### Retention Metrics
- **7-Day Retention**: % still active after 7 days
- **30-Day Retention**: % still active after 30 days
- **Churn Rate**: % who abandon plan
- **Reactivation**: % who return after abandoning

### Business Metrics
- **Premium Upgrades**: Number of upgrades attributed to prep plan
- **Revenue Impact**: Additional revenue from feature
- **User Satisfaction**: Rating/feedback scores
- **Support Tickets**: Number of issues/questions

### Target Goals (6 Months Post-Launch)
- 60% of premium users create a prep plan
- 40% plan completion rate
- 20% average score improvement
- 75% user satisfaction rating
- 5-point increase in NPS

---

## 🔧 Technical Considerations

### Performance
- **Caching**: Cache study plan locally using AsyncStorage
- **Lazy Loading**: Load weeks and tasks on-demand
- **Pagination**: Paginate historical data and sessions
- **Indexes**: Create Firestore indexes for queries
- **Image Optimization**: Compress charts and visuals

### Offline Support
- **Read Access**: View plan and progress offline
- **Task Queue**: Queue task completions for sync when online
- **Content Download**: Pre-download today's content
- **Conflict Resolution**: Handle conflicts when syncing

### Data Privacy
- **User Privacy**: Assessment results are private
- **Anonymization**: Analytics data is anonymized
- **GDPR Compliance**: Allow data export and deletion
- **Consent**: Optional analytics sharing

### Scalability
- **Cloud Functions**: Use for heavy AI computations
- **Rate Limiting**: Limit AI calls per user (prevent abuse)
- **Cost Monitoring**: Track OpenAI and Whisper usage
- **Database Optimization**: Efficient queries and batch writes

### Error Handling
- **Graceful Degradation**: Fall back if AI fails
- **Retry Logic**: Retry failed Cloud Function calls
- **User Feedback**: Clear error messages
- **Logging**: Comprehensive logging for debugging

### Security
- **Authentication**: All endpoints require auth
- **Authorization**: Users can only access their own data
- **Input Validation**: Validate all user inputs
- **API Keys**: Secure storage of OpenAI keys

---

## 🚀 Future Enhancements (Post-MVP)

### Phase 2 Features
- **Smart Notifications**: ML-powered optimal reminder times
- **Peer Comparison**: Anonymous leaderboards
- **Gamification**: Badges, achievements, XP system
- **Mock Exam Integration**: Automatic mock exams at milestones
- **Video Lessons**: Integrate video content for weak areas

### Phase 3 Features
- **AI Tutor Chat**: Real-time Q&A assistant
- **Community Study Groups**: Connect users with similar plans
- **Speaking Parts 2 & 3**: Expand speaking practice
- **Calendar Integration**: Sync with Google/Apple Calendar
- **Plan Templates**: Intensive, moderate, relaxed options

### Phase 4 Features
- **Multi-language UI**: Support for more interface languages
- **Voice Commands**: Control app with voice
- **Exam Simulation Mode**: Full timed practice exams
- **Certification Tracking**: Track all exam attempts and results
- **Parent/Teacher Dashboard**: For educators

---

## ✅ Implementation Checklist

### Pre-Implementation
- [ ] Review and approve PRD
- [ ] Prioritize features (MVP vs. Future)
- [ ] Create UI/UX mockups (Figma/Sketch)
- [ ] Set up project tracking (Jira/Linear)
- [ ] Assign tasks to team members

### During Implementation
- [ ] Daily standups to track progress
- [ ] Weekly demo of completed features
- [ ] Continuous testing and QA
- [ ] Documentation updates
- [ ] Code reviews

### Pre-Launch
- [ ] Security audit
- [ ] Performance testing
- [ ] Beta user testing
- [ ] Marketing materials preparation
- [ ] App Store metadata update

### Post-Launch
- [ ] Monitor analytics daily
- [ ] Respond to user feedback
- [ ] Fix critical bugs within 24h
- [ ] Weekly performance reports
- [ ] Plan iterations based on data

---

## 📞 Questions & Discussion Points

1. Should we support B2 level in MVP or start with A1/B1 only?
2. What's the budget for OpenAI API calls? (Whisper + GPT-4)
3. Should we offer a free trial of prep plan (e.g., first week free)?
4. How often should we re-evaluate and update the plan automatically?
5. Should speaking practice be available outside of assessments?
6. Do we want social features (share progress, study groups)?
7. Should we integrate with external calendar apps?
8. What's the plan for supporting more exam levels (C1, C2, A2)?

---

## 🎯 Conclusion

This comprehensive PRD defines a robust, multi-level Exam Prep Plan feature that:
- ✅ Works across A1, B1, and B2 levels
- ✅ Includes interactive speaking practice with AI
- ✅ Persists onboarding progress to reduce abandonment
- ✅ Sends personalized notifications based on study plan
- ✅ Allows plan updates while preserving progress
- ✅ Visible to all users with premium upsell
- ✅ Tracks comprehensive data for insights
- ✅ Provides an exceptional user experience

This feature positions the app as a comprehensive exam preparation platform, significantly increasing user engagement, retention, and premium conversions.

**Next Steps:**
1. Review and approve PRD
2. Create UI/UX mockups
3. Set up development environment
4. Begin Phase 1 implementation

---

**Document Version:** 2.0  
**Author:** AI Assistant  
**Date:** December 23, 2025  
**Status:** Ready for Implementation

