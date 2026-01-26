/**
 * Shared Types for Firebase Functions
 * 
 * These types are duplicated from the React Native app to avoid
 * importing React Native-specific code into the Functions environment.
 */

/**
 * Exam levels supported by the application
 */
export type ExamLevel = 'A1' | 'B1' | 'B2';

/**
 * Languages supported by exams
 */
export type ExamLanguage = 'german' | 'english' | 'spanish';

/**
 * Short language codes for APIs (e.g., Whisper)
 */
export const LANGUAGE_SHORT_CODES: Record<ExamLanguage, string> = {
  german: 'de',
  english: 'en',
  spanish: 'es',
};

/**
 * Writing Assessment Result for B1/B2 levels
 */
export interface WritingAssessment {
  overallScore: number;
  maxScore: number;
  userInput: string;
  criteria: {
    taskCompletion: {
      grade: 'A' | 'B' | 'C' | 'D';
      feedback: string;
    };
    communicativeDesign: {
      grade: 'A' | 'B' | 'C' | 'D';
      feedback: string;
    };
    formalCorrectness: {
      grade: 'A' | 'B' | 'C' | 'D';
      feedback: string;
    };
  };
  correctedAnswer: string;
}

/**
 * Evaluation Request for B1/B2 levels
 */
export interface EvaluationRequest {
  userAnswer?: string;
  imageBase64?: string;
  incomingEmail: string;
  writingPoints: string[];
  examTitle: string;
}

