/**
 * OpenAI Service for German Telc B1 Writing Assessment
 * 
 * This service integrates with Firebase Cloud Functions to evaluate user's writing responses
 * based on Telc B1 exam criteria.
 */

import axios from "axios";
import { Platform } from "react-native";
import { activeExamConfig } from "../config/active-exam.config";

// API Configuration
const IS_DEV = __DEV__;
const evaluateWritingFunctionName = activeExamConfig.writingEvaluationFnName;

const testPath = (Platform.OS === 'android' ? 'http://10.0.2.2' : 'http://localhost') + ':5001/telc-b1-german/us-central1';
const CLOUD_FUNCTIONS_API_URL = IS_DEV ? testPath + '/' + evaluateWritingFunctionName : 'https://us-central1-telc-b1-german.cloudfunctions.net/' + evaluateWritingFunctionName;

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

export interface WritingAssessmentA1 {
  overallScore: number;
  maxScore: number; // 10 for A1
  userInput: string;
  contentPoints: Array<{
    pointNumber: number;
    pointText: string;
    score: 3 | 1.5 | 0;
    feedback: string;
  }>;
  communicativeDesign: {
    score: 1 | 0.5 | 0;
    feedback: string;
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

export interface ImageEvaluationRequest {
  imageUri?: string;
  imageBase64?: string;
  incomingEmail: string;
  writingPoints: string[];
  examTitle: string;
}

export interface EvaluationRequestA1 {
  userAnswer?: string;
  imageBase64?: string;
  examTitle: string;
  instructionHeader: string;
  taskPoints: Array<{
    id: string;
    text: string;
  }>;
}

export interface ImageEvaluationRequestA1 {
  imageUri?: string;
  imageBase64?: string;
  examTitle: string;
  instructionHeader: string;
  taskPoints: Array<{
    id: string;
    text: string;
  }>;
}

/**
 * Calls Firebase Cloud Functions to assess the writing
 */
async function callCloudFunctions(request: EvaluationRequest): Promise<WritingAssessment> {
  try {
    const response = await axios.post<WritingAssessment>(CLOUD_FUNCTIONS_API_URL, {
      userAnswer: request.userAnswer,
      incomingEmail: request.incomingEmail,
      writingPoints: request.writingPoints,
      examTitle: request.examTitle,
      imageBase64: request.imageBase64,
    });

    const assessment: WritingAssessment = response.data;
    return assessment;
  } catch (error: any) {
    console.error('Error in callCloudFunctions:', error);
    
    // Handle axios errors
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.error || error.response.statusText;
      console.error('Server error:', errorMessage);

      let humanReadableErrorMessage;
      if(request.imageBase64){
        humanReadableErrorMessage = 'Das Bild konnte nicht gelesen werden. Bitte versuchen Sie es erneut.';
      } else {
        humanReadableErrorMessage = 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.';
      }

      throw new Error(humanReadableErrorMessage);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
      throw new Error('Es ist ein Fehler aufgetreten. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.');
    } else if (error instanceof Error) {
      // If it's already a user-friendly message, pass it through
      if (error.message.includes('Bewertung')) {
        throw error;
      }
      throw new Error('Es ist ein Fehler aufgetreten. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.');
    }
    throw new Error('Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
  }
}

/**
 * Converts an image URI to base64
 */
async function imageUriToBase64(uri: string): Promise<string> {
  try {
    // For React Native, we need to use fetch to get the blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Remove the data:image/...;base64, prefix if it exists
        const base64 = base64data.split(',')[1] || base64data;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error('Das Bild konnte nicht gelesen werden. Bitte versuchen Sie es erneut.');
  }
}
/**
 * Main function to evaluate writing using Firebase Cloud Functions
 */
export async function evaluateWriting(
  request: EvaluationRequest
): Promise<WritingAssessment> {
  const assessment = await callCloudFunctions(request);
  return assessment;
}

/**
 * Main function to evaluate handwritten text from an image using Firebase Cloud Functions
 */
export async function evaluateWritingWithImage(
  request: ImageEvaluationRequest
): Promise<WritingAssessment> {
  let imageBase64: string;
  
  // Use provided base64 or convert from URI
  if (request.imageBase64) {
    imageBase64 = request.imageBase64;
  } else if (request.imageUri) {
    imageBase64 = await imageUriToBase64(request.imageUri);
  } else {
    throw new Error('Kein Bild gefunden. Bitte laden Sie ein Bild hoch.');
  }

  request.imageBase64 = imageBase64;
  
  return await callCloudFunctions(request);
}

/**
 * Calls Firebase Cloud Functions to assess the A1 writing
 */
async function callCloudFunctionsA1(request: EvaluationRequestA1): Promise<WritingAssessmentA1> {
  try {
    const response = await axios.post<WritingAssessmentA1>(CLOUD_FUNCTIONS_API_URL, {
      userAnswer: request.userAnswer,
      examTitle: request.examTitle,
      instructionHeader: request.instructionHeader,
      taskPoints: request.taskPoints,
      imageBase64: request.imageBase64,
    });

    const assessment: WritingAssessmentA1 = response.data;
    return assessment;
  } catch (error: any) {
    console.error('Error in callCloudFunctionsA1:', error);
    
    // Handle axios errors
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.error || error.response.statusText;
      console.error('Server error:', errorMessage);

      let humanReadableErrorMessage;
      if(request.imageBase64){
        humanReadableErrorMessage = 'Das Bild konnte nicht gelesen werden. Bitte versuchen Sie es erneut.';
      } else {
        humanReadableErrorMessage = 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.';
      }

      throw new Error(humanReadableErrorMessage);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
      throw new Error('Es ist ein Fehler aufgetreten. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.');
    } else if (error instanceof Error) {
      // If it's already a user-friendly message, pass it through
      if (error.message.includes('Bewertung')) {
        throw error;
      }
      throw new Error('Es ist ein Fehler aufgetreten. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.');
    }
    throw new Error('Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
  }
}

/**
 * Main function to evaluate A1 writing using Firebase Cloud Functions
 */
export async function evaluateWritingA1(
  request: EvaluationRequestA1
): Promise<WritingAssessmentA1> {
  const assessment = await callCloudFunctionsA1(request);
  return assessment;
}

/**
 * Main function to evaluate A1 handwritten text from an image using Firebase Cloud Functions
 */
export async function evaluateWritingWithImageA1(
  request: ImageEvaluationRequestA1
): Promise<WritingAssessmentA1> {
  let imageBase64: string;
  
  // Use provided base64 or convert from URI
  if (request.imageBase64) {
    imageBase64 = request.imageBase64;
  } else if (request.imageUri) {
    imageBase64 = await imageUriToBase64(request.imageUri);
  } else {
    throw new Error('Kein Bild gefunden. Bitte laden Sie ein Bild hoch.');
  }

  request.imageBase64 = imageBase64;
  
  return await callCloudFunctionsA1(request);
}