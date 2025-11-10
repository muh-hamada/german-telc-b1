/**
 * HTTP Service for German Telc B1 Writing Assessment
 * 
 * This service calls Firebase Cloud Functions to evaluate user's writing responses
 * based on Telc B1 exam criteria.
 */

import functions from '@react-native-firebase/functions';

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

export interface EvaluationRequest {
  userAnswer: string;
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

/**
 * Main function to evaluate writing using Firebase Cloud Function
 */
export async function evaluateWriting(
  request: EvaluationRequest
): Promise<WritingAssessment> {
  try {
    const evaluateWritingFunction = functions().httpsCallable('evaluateWriting');
    
    const result = await evaluateWritingFunction({
      userAnswer: request.userAnswer,
      incomingEmail: request.incomingEmail,
      writingPoints: request.writingPoints,
      examTitle: request.examTitle,
    });

    return result.data as WritingAssessment;
  } catch (error) {
    console.error('Cloud function call failed:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to evaluate writing: ${error.message}`);
    }
    throw new Error('Failed to evaluate writing with unknown error');
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
    throw new Error(`Failed to convert image to base64: ${error}`);
  }
}

/**
 * Main function to evaluate handwritten text from an image using Firebase Cloud Function
 */
export async function evaluateWritingWithImage(
  request: ImageEvaluationRequest
): Promise<WritingAssessment> {
  try {
    let imageBase64: string;
    
    // Use provided base64 or convert from URI
    if (request.imageBase64) {
      imageBase64 = request.imageBase64;
    } else if (request.imageUri) {
      imageBase64 = await imageUriToBase64(request.imageUri);
    } else {
      throw new Error('Either imageUri or imageBase64 must be provided');
    }
    
    const evaluateWritingFunction = functions().httpsCallable('evaluateWriting');
    
    const result = await evaluateWritingFunction({
      imageBase64: imageBase64,
      incomingEmail: request.incomingEmail,
      writingPoints: request.writingPoints,
      examTitle: request.examTitle,
    });

    return result.data as WritingAssessment;
  } catch (error) {
    console.error('Cloud function call failed:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to evaluate writing with image: ${error.message}`);
    }
    throw new Error('Failed to evaluate writing with image with unknown error');
  }
}

/**
 * Mock assessment for testing when cloud function is not available
 */
export function getMockAssessment(): WritingAssessment {
  return {
    overallScore: 13,
    userInput: 'Liebe Sarah,\n\nvielen Dank für deine E-Mail. Ich freue mich sehr über deine Einladung.\n\nIch habe am Samstag Zeit und ich kann zu deiner Party kommen. Ich bringe eine Flasche Wein mit.\n\nKann ich noch jemanden mitbringen? Mein Freund möchte auch gern kommen.\n\nBis bald!\nDein Thomas',
    maxScore: 15,
    criteria: {
      taskCompletion: {
        grade: 'A',
        feedback: 'Alle vier Leitpunkte wurden sinnvoll und verständlich bearbeitet. Die Antwort geht auf alle Fragen der eingegangenen E-Mail ein.',
      },
      communicativeDesign: {
        grade: 'B',
        feedback: 'Anrede und Schluss sind passend. Es gibt eine gute Verbindung der Sätze, aber das Register schwankt leicht zwischen formell und informell.',
      },
      formalCorrectness: {
        grade: 'C',
        feedback: 'Viele Genusfehler und einige falsche Verbpositionen behindern das zügige Verständnis stellenweise. Achten Sie besonders auf die Artikel (der/die/das).',
      },
    },
    correctedAnswer: 'Liebe Sarah,\n\nvielen Dank für deine E-Mail. Ich freue mich sehr über deine Einladung.\n\nIch habe am Samstag Zeit und ich kann zu deiner Party kommen. Ich bringe eine Flasche Wein **mit**.\n\nKann ich noch jemanden mitbringen? Mein Freund möchte auch gern kommen.\n\nBis bald!\n**Dein** Thomas',
  };
}

