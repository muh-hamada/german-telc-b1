import * as admin from 'firebase-admin';
import { getAppConfig } from '../config/apps';
import { QuestionData, ReadingPart2A1Exam, ReadingPart3A1Exam } from '../types';

// Configuration from environment variables
const EXAM_DOCUMENT = process.env.EXAM_DOCUMENT || 'reading-part2';

/**
 * Select the next unprocessed question for video generation
 */
export async function selectNextQuestion(appId: string): Promise<QuestionData | null> {
  const db = admin.firestore();
  const appConfig = getAppConfig(appId);
  const collectionName = process.env.EXAM_COLLECTION || appConfig.collectionName;

  try {
    // Get processed questions from tracking collection
    const trackingDoc = await db.collection('video_generation_data').doc(appId).get();
    const processedQuestions = new Set<string>();
    
    if (trackingDoc.exists) {
      const data = trackingDoc.data();
      if (data?.processed_questions) {
        Object.keys(data.processed_questions).forEach(key => processedQuestions.add(key));
      }
    }

    // Fetch all exams for the specified document
    const examDoc = await db
      .collection(collectionName)
      .doc(EXAM_DOCUMENT)
      .get();

    if (!examDoc.exists) {
      console.log(`No ${EXAM_DOCUMENT} document found in ${collectionName}`);
      return null;
    }

    const examData = examDoc.data();
    // Handle nested data structure
    const exams: (ReadingPart2A1Exam | ReadingPart3A1Exam)[] = examData?.data?.exams || examData?.exams || [];

    // Find first unprocessed question
    for (const exam of exams) {
      for (let questionIndex = 0; questionIndex < exam.questions.length; questionIndex++) {
        const question = exam.questions[questionIndex];
        const questionKey = `${EXAM_DOCUMENT}-exam${exam.id}-index${questionIndex}`;
        
        if (!processedQuestions.has(questionKey)) {
          console.log(`Selected question: ${questionKey}`);
          return {
            appId,
            examId: exam.id,
            questionIndex,
            question,
            exam,
          };
        }
      }
    }

    console.log('All questions have been processed');
    return null;
  } catch (error) {
    console.error('Error selecting question:', error);
    throw error;
  }
}

/**
 * Get a specific question by exam and question index
 */
export async function getQuestion(
  appId: string,
  examId: string,
  questionIndex: number
): Promise<QuestionData | null> {
  const db = admin.firestore();
  const appConfig = getAppConfig(appId);
  const collectionName = process.env.EXAM_COLLECTION || appConfig.collectionName;

  try {
    const examDoc = await db
      .collection(collectionName)
      .doc(EXAM_DOCUMENT)
      .get();

    if (!examDoc.exists) {
      return null;
    }

    const examData = examDoc.data();
    // Handle nested data structure
    const exams: (ReadingPart2A1Exam | ReadingPart3A1Exam)[] = examData?.data?.exams || examData?.exams || [];
    const exam = exams.find(e => e.id === examId);

    if (!exam) {
      return null;
    }

    const question = exam.questions[questionIndex];

    if (!question) {
      return null;
    }

    return {
      appId,
      examId,
      questionIndex,
      question,
      exam,
    };
  } catch (error) {
    console.error('Error getting question:', error);
    throw error;
  }
}

