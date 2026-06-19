export interface MockExamStep {
  id: string;
  sectionNumber: number;
  sectionName: string;
  partNumber?: number;
  partName: string;
  maxPoints: number;
  timeMinutes?: number;
  isCompleted: boolean;
  score?: number;
  startTime?: number;
  endTime?: number;
  answers?: import('../types/exam.types').UserAnswer[];
}

export interface MockExamProgress {
  examId: string;
  startDate: number;
  endDate?: number;
  currentStepId: string;
  steps: MockExamStep[];
  selectedTests: Record<string, number | string>; // Support numeric IDs (German/English) and UUID strings (DELE)
  totalScore: number;
  totalMaxPoints: number;
  isCompleted: boolean;
  hasStarted: boolean;
}

// All mock exam step arrays and scoring constants are now config-driven.
// See src/config/exams/*.config.ts for exam-specific values.
// Use generateMockExamSteps() from src/utils/exam-config.utils.ts to generate steps.
// Use calculateOverallResult() from src/utils/score-calculator.ts for scoring.
