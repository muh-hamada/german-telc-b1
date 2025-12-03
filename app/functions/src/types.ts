export interface AssessmentCriterion {
  grade: 'A' | 'B' | 'C' | 'D';
  points?: number;
  feedback: string;
}

export interface WritingAssessment {
  overallScore: number;
  maxScore: number;
  userInput: string;
  criteria: {
    taskCompletion: AssessmentCriterion;
    communicativeDesign: AssessmentCriterion;
    formalCorrectness: AssessmentCriterion;
  };
  correctedAnswer: string;
}

export interface EvaluationRequest {
  userAnswer?: string;
  imageBase64?: string;
  incomingEmail: string;
  writingPoints: string[];
  examTitle: string;
}

