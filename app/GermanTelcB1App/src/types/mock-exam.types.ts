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
}

export interface MockExamProgress {
  examId: string;
  startDate: number;
  endDate?: number;
  currentStepId: string;
  steps: MockExamStep[];
  selectedTests: {
    'reading-1': number;
    'reading-2': number;
    'reading-3': number;
    'language-1': number;
    'language-2': number;
    'listening-1': number;
    'listening-2': number;
    'listening-3': number;
    'writing': number;
  };
  totalScore: number;
  totalMaxPoints: number;
  isCompleted: boolean;
  hasStarted: boolean;
}

export const MOCK_EXAM_STEPS: Omit<MockExamStep, 'isCompleted' | 'score' | 'startTime' | 'endTime'>[] = [
  // 1. Leseverstehen (Reading) - 75 points
  { id: 'reading-1', sectionNumber: 1, sectionName: 'Leseverstehen', partNumber: 1, partName: 'Teil 1: Globalverstehen', maxPoints: 25, timeMinutes: 30 },
  { id: 'reading-2', sectionNumber: 1, sectionName: 'Leseverstehen', partNumber: 2, partName: 'Teil 2: Detailverstehen', maxPoints: 25, timeMinutes: 30 },
  { id: 'reading-3', sectionNumber: 1, sectionName: 'Leseverstehen', partNumber: 3, partName: 'Teil 3: Selektives Verstehen', maxPoints: 25, timeMinutes: 30 },
  
  // 2. Sprachbausteine (Language Elements) - 30 points
  { id: 'language-1', sectionNumber: 2, sectionName: 'Sprachbausteine', partNumber: 1, partName: 'Teil 1: Grammatik', maxPoints: 15, timeMinutes: 45 },
  { id: 'language-2', sectionNumber: 2, sectionName: 'Sprachbausteine', partNumber: 2, partName: 'Teil 2: Lexik', maxPoints: 15, timeMinutes: 45 },
  
  // 3. Hörverstehen (Listening) - 75 points
  { id: 'listening-1', sectionNumber: 3, sectionName: 'Hörverstehen', partNumber: 1, partName: 'Teil 1: Globalverstehen', maxPoints: 25, timeMinutes: 10 },
  { id: 'listening-2', sectionNumber: 3, sectionName: 'Hörverstehen', partNumber: 2, partName: 'Teil 2: Detailverstehen', maxPoints: 25, timeMinutes: 10 },
  { id: 'listening-3', sectionNumber: 3, sectionName: 'Hörverstehen', partNumber: 3, partName: 'Teil 3: Selektives Verstehen', maxPoints: 25, timeMinutes: 10 },
  
  // 4. Schriftlicher Ausdruck (Writing) - 45 points
  { id: 'writing', sectionNumber: 4, sectionName: 'Schriftlicher Ausdruck', partName: 'Schreiben einer E-Mail', maxPoints: 45, timeMinutes: 30 },
  
  // 5. Mündlicher Ausdruck (Speaking) - 75 points (skipped in mock exam)
  { id: 'speaking-1', sectionNumber: 5, sectionName: 'Mündlicher Ausdruck', partNumber: 1, partName: 'Teil 1: Einander kennenlernen', maxPoints: 15, timeMinutes: 3 },
  { id: 'speaking-2', sectionNumber: 5, sectionName: 'Mündlicher Ausdruck', partNumber: 2, partName: 'Teil 2: Über ein Thema sprechen', maxPoints: 30, timeMinutes: 6 },
  { id: 'speaking-3', sectionNumber: 5, sectionName: 'Mündlicher Ausdruck', partNumber: 3, partName: 'Teil 3: Gemeinsam etwas planen', maxPoints: 30, timeMinutes: 6 },
];

export const TOTAL_WRITTEN_MAX_POINTS = 225; // Reading + Language + Listening + Writing
export const TOTAL_ORAL_MAX_POINTS = 75; // Speaking
export const TOTAL_MAX_POINTS = 300;
export const PASSING_WRITTEN_POINTS = 135; // 60% of 225
export const PASSING_ORAL_POINTS = 45; // 60% of 75
export const PASSING_TOTAL_POINTS = 180; // 60% of 300

