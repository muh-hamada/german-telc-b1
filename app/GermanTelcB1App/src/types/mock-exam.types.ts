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
  selectedTests: Record<string, number>; // Flexible to support different exam structures (A1, B1, B2)
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

export const MOCK_EXAM_STEPS_A1: Omit<MockExamStep, 'isCompleted' | 'score' | 'startTime' | 'endTime'>[] = [
  
  { id: 'listening-1', sectionNumber: 3, sectionName: 'Hörverstehen', partNumber: 1, partName: 'Teil 1: Globalverstehen', maxPoints: 6, timeMinutes: 7 },
  { id: 'listening-2', sectionNumber: 3, sectionName: 'Hörverstehen', partNumber: 2, partName: 'Teil 2: Detailverstehen', maxPoints: 4, timeMinutes: 6 },
  { id: 'listening-3', sectionNumber: 3, sectionName: 'Hörverstehen', partNumber: 3, partName: 'Teil 3: Selektives Verstehen', maxPoints: 5, timeMinutes: 7 },
  
  { id: 'reading-1', sectionNumber: 1, sectionName: 'Leseverstehen', partNumber: 1, partName: 'Teil 1: Globalverstehen', maxPoints: 5, timeMinutes: 9 },
  { id: 'reading-2', sectionNumber: 1, sectionName: 'Leseverstehen', partNumber: 2, partName: 'Teil 2: Detailverstehen', maxPoints: 5, timeMinutes: 8 },
  { id: 'reading-3', sectionNumber: 1, sectionName: 'Leseverstehen', partNumber: 3, partName: 'Teil 3: Selektives Verstehen', maxPoints: 5, timeMinutes: 8 },
  
  { id: 'writing-part1', sectionNumber: 4, sectionName: 'Schriftlicher Ausdruck', partNumber: 1, partName: 'Teil 1: Formular ausfüllen', maxPoints: 5, timeMinutes: 10 },
  { id: 'writing-part2', sectionNumber: 4, sectionName: 'Schriftlicher Ausdruck', partNumber: 2, partName: 'Teil 2: Eine kurze Mitteilung', maxPoints: 10, timeMinutes: 10 },
  
  { id: 'speaking-1', sectionNumber: 5, sectionName: 'Mündlicher Ausdruck', partNumber: 1, partName: 'Teil 1: Sich vorstellen', maxPoints: 5, timeMinutes: 3 },
  { id: 'speaking-2', sectionNumber: 5, sectionName: 'Mündlicher Ausdruck', partNumber: 2, partName: 'Teil 2: Um Informationen bitten und Informationen geben', maxPoints: 5, timeMinutes: 4 },
  { id: 'speaking-3', sectionNumber: 5, sectionName: 'Mündlicher Ausdruck', partNumber: 3, partName: 'Teil 3: Bitte formulieren und darauf reagieren', maxPoints: 5, timeMinutes: 4 },
];

// B1/B2 Constants
export const TOTAL_WRITTEN_MAX_POINTS = 225; // Reading + Language + Listening + Writing
export const TOTAL_ORAL_MAX_POINTS = 75; // Speaking
export const TOTAL_MAX_POINTS = 300;
export const PASSING_WRITTEN_POINTS = 135; // 60% of 225
export const PASSING_ORAL_POINTS = 45; // 60% of 75
export const PASSING_TOTAL_POINTS = 180; // 60% of 300

// A1 Constants
export const TOTAL_WRITTEN_MAX_POINTS_A1 = 45; // Reading (15) + Listening (15) + Writing (15)
export const TOTAL_ORAL_MAX_POINTS_A1 = 15; // Speaking
export const TOTAL_MAX_POINTS_A1 = 60;
export const PASSING_WRITTEN_POINTS_A1 = 27; // 60% of 45
export const PASSING_ORAL_POINTS_A1 = 9; // 60% of 15
export const PASSING_TOTAL_POINTS_A1 = 36; // 60% of 60

