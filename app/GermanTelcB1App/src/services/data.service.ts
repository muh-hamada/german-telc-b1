/**
 * Enhanced Data Service with Firebase Support
 * 
 * This service fetches data from Firebase Firestore with local JSON fallback and caching for offline support.
 * 
 * Features:
 * - Fetches exam data from Firestore
 * - Falls back to local JSON if Firestore is unavailable
 * - Caches data for 24 hours to reduce Firestore reads
 * - Supports cache clearing and force refresh
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import {
  GrammarPart1Exam,
  GrammarPart2Exam,
  ReadingPart1Exam,
  ReadingPart2Exam,
  ReadingPart3Exam,
  WritingExam,
  SpeakingPart1Content,
  SpeakingPart2Content,
  SpeakingPart3Content,
  SpeakingImportantPhrasesContent,
} from '../types/exam.types';

// Import local JSON data as fallback
import grammarPart1DataLocal from '../data/grammar-part1.json';
import grammarPart2DataLocal from '../data/grammar-part2.json';
import readingPart1DataLocal from '../data/reading-part1.json';
import readingPart2DataLocal from '../data/reading-part2.json';
import readingPart3DataLocal from '../data/reading-part3.json';
import writingDataLocal from '../data/writing.json';
import speakingPart1DataLocal from '../data/speaking-part1.json';
import speakingPart2DataLocal from '../data/speaking-part2.json';
import speakingPart3DataLocal from '../data/speaking-part3.json';
import listeningPart1DataLocal from '../data/listening-part1.json';
import listeningPart2DataLocal from '../data/listening-part2.json';
import listeningPart3DataLocal from '../data/listening-part3.json';
import examInfoDataLocal from '../data/exam-info.json';
import grammarStudyQuestionsDataLocal from '../data/grammer-study-questions.json';

const COLLECTION_NAME = 'b1_telc_exam_data';
// TODO: Change to 24 hours in milliseconds once the data is stable
const CACHE_EXPIRATION = 60 * 1000; // 1 minute in milliseconds
const CACHE_KEY_PREFIX = '@exam_data_';

interface CachedData {
  data: any;
  timestamp: number;
}

class DataService {
  private useFirebase = true; // Set to false to always use local data

  /**
   * Fetch data from Firestore with caching
   */
  private async fetchFromFirestore(docId: string, fallbackData: any): Promise<any> {
    if (!this.useFirebase) {
      console.log(`[DataService] Firebase disabled, using local data for ${docId}`);
      return fallbackData;
    }

    try {
      // Check cache first
      const cachedData = await this.getCachedData(docId);
      if (cachedData) {
        console.log(`[DataService] Using cached data for ${docId}`);
        return cachedData;
      }

      // Fetch from Firestore
      console.log(`[DataService] Fetching ${docId} from Firestore...`);
      const docSnapshot = await firestore()
        .collection(COLLECTION_NAME)
        .doc(docId)
        .get();

      const exists = typeof (docSnapshot as any).exists === 'function'
        ? (docSnapshot as any).exists()
        : (docSnapshot as any).exists;
      if (exists) {
        const firestoreData = docSnapshot.data();
        const data = firestoreData?.data || firestoreData || fallbackData;
        
        console.log(`[DataService] Successfully fetched ${docId} from Firestore`);
        // Cache the data
        await this.cacheData(docId, data);
        
        return data;
      } else {
        console.warn(`[DataService] Document ${docId} not found in Firestore, using local data`);
        return fallbackData;
      }
    } catch (error) {
      console.error(`[DataService] Error fetching ${docId} from Firestore:`, error);
      return fallbackData;
    }
  }

  /**
   * Get cached data if still valid
   */
  private async getCachedData(docId: string): Promise<any | null> {
    try {
      const cacheKey = CACHE_KEY_PREFIX + docId;
      const cachedStr = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedStr) {
        return null;
      }

      const cached: CachedData = JSON.parse(cachedStr);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - cached.timestamp < CACHE_EXPIRATION) {
        return cached.data;
      } else {
        // Cache expired, remove it
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
    } catch (error) {
      console.error('[DataService] Error reading cache:', error);
      return null;
    }
  }

  /**
   * Cache data with timestamp
   */
  private async cacheData(docId: string, data: any): Promise<void> {
    try {
      const cacheKey = CACHE_KEY_PREFIX + docId;
      const cached: CachedData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cached));
    } catch (error) {
      console.error('[DataService] Error caching data:', error);
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log('[DataService] Cache cleared successfully');
    } catch (error) {
      console.error('[DataService] Error clearing cache:', error);
    }
  }

  /**
   * Force refresh data from Firestore
   */
  async refreshData(docId: string): Promise<void> {
    const cacheKey = CACHE_KEY_PREFIX + docId;
    await AsyncStorage.removeItem(cacheKey);
    console.log(`[DataService] Cache cleared for ${docId}`);
  }

  // Grammar Part 1
  async getGrammarPart1Exams(): Promise<GrammarPart1Exam[]> {
    const data = await this.fetchFromFirestore('grammar-part1', grammarPart1DataLocal);
    return data.exams;
  }

  async getGrammarPart1Exam(id: number): Promise<GrammarPart1Exam | undefined> {
    const exams = await this.getGrammarPart1Exams();
    return exams.find(exam => exam.id === id);
  }

  // Grammar Part 2
  async getGrammarPart2Exams(): Promise<GrammarPart2Exam[]> {
    const data = await this.fetchFromFirestore('grammar-part2', grammarPart2DataLocal);
    return data.exams;
  }

  async getGrammarPart2Exam(id: number): Promise<GrammarPart2Exam | undefined> {
    const exams = await this.getGrammarPart2Exams();
    return exams.find(exam => exam.id === id);
  }

  // Reading Part 1
  async getReadingPart1Exams(): Promise<ReadingPart1Exam[]> {
    return await this.fetchFromFirestore('reading-part1', readingPart1DataLocal as ReadingPart1Exam[]);
  }

  async getReadingPart1ExamById(id: number): Promise<ReadingPart1Exam | undefined> {
    const exams = await this.getReadingPart1Exams();
    return exams.find(exam => exam.id === id);
  }

  // Reading Part 2
  async getReadingPart2Exams(): Promise<ReadingPart2Exam[]> {
    const data = await this.fetchFromFirestore('reading-part2', readingPart2DataLocal);
    return data.exams;
  }

  async getReadingPart2Exam(id: number): Promise<ReadingPart2Exam | undefined> {
    const exams = await this.getReadingPart2Exams();
    return exams.find(exam => exam.id === id);
  }

  // Reading Part 3
  async getReadingPart3Exams(): Promise<ReadingPart3Exam[]> {
    const data = await this.fetchFromFirestore('reading-part3', readingPart3DataLocal);
    return data.exams;
  }

  async getReadingPart3Exam(id: number): Promise<ReadingPart3Exam | undefined> {
    const exams = await this.getReadingPart3Exams();
    return exams.find(exam => exam.id === id);
  }

  // Writing
  async getWritingExams(): Promise<WritingExam[]> {
    const data = await this.fetchFromFirestore('writing', writingDataLocal);
    return data.exams;
  }

  async getWritingExam(id: number): Promise<WritingExam | undefined> {
    const exams = await this.getWritingExams();
    return exams.find(exam => exam.id === id);
  }

  // Speaking Part 1
  async getSpeakingPart1Content(): Promise<SpeakingPart1Content> {
    const data = await this.fetchFromFirestore('speaking-part1', speakingPart1DataLocal);
    return data.content;
  }

  // Speaking Part 2
  async getSpeakingPart2Content(): Promise<SpeakingPart2Content> {
    const data = await this.fetchFromFirestore('speaking-part2', speakingPart2DataLocal);
    return data;
  }

  // Speaking Part 3
  async getSpeakingPart3Content(): Promise<SpeakingPart3Content> {
    const data = await this.fetchFromFirestore('speaking-part3', speakingPart3DataLocal);
    return data;
  }

  // Speaking Important Phrases (Part 4) - Firebase only (no local fallback)
  async getSpeakingImportantPhrases(): Promise<SpeakingImportantPhrasesContent> {
    // Pass empty object as fallback; we only expect Firebase to return real data
    const data = await this.fetchFromFirestore('speaking-important-phrases', {});
    const typed = data as SpeakingImportantPhrasesContent;
    if (!typed || !Array.isArray(typed.groups)) {
      throw new Error('speaking-important-phrases not available');
    }
    return typed;
  }

  // Listening Part 1
  async getListeningPart1Content(): Promise<any> {
    return await this.fetchFromFirestore('listening-part1', listeningPart1DataLocal);
  }

  // Listening Part 2
  async getListeningPart2Content(): Promise<any> {
    return await this.fetchFromFirestore('listening-part2', listeningPart2DataLocal);
  }

  // Listening Part 3
  async getListeningPart3Content(): Promise<any> {
    return await this.fetchFromFirestore('listening-part3', listeningPart3DataLocal);
  }

  // Exam Info (structure, assessment criteria, etc.)
  async getExamInfo(): Promise<any> {
    return await this.fetchFromFirestore('exam-info', examInfoDataLocal);
  }

  // Grammar Study Questions
  async getGrammarStudyQuestions(): Promise<any[]> {
    const data = await this.fetchFromFirestore('grammar-study-questions', { data: grammarStudyQuestionsDataLocal });
    // The Firebase document has structure { data: [...], metadata: {...} }
    // Extract just the data array
    return data.data || data;
  }

  // Utility methods
  async getExamCount(examType: string): Promise<number> {
    switch (examType) {
      case 'grammar-part1':
        return (await this.getGrammarPart1Exams()).length;
      case 'grammar-part2':
        return (await this.getGrammarPart2Exams()).length;
      case 'reading-part1':
        return (await this.getReadingPart1Exams()).length;
      case 'reading-part2':
        return (await this.getReadingPart2Exams()).length;
      case 'reading-part3':
        return (await this.getReadingPart3Exams()).length;
      case 'writing':
        return (await this.getWritingExams()).length;
      case 'speaking-part1':
        return 1; // Single personal introduction, no multiple exams
      case 'speaking-part2':
        const part2Data = await this.getSpeakingPart2Content();
        return part2Data.topics?.length || 0;
      case 'speaking-part3':
        const part3Data = await this.getSpeakingPart3Content();
        return part3Data.scenarios?.length || 0;
      case 'speaking-important-phrases':
        // Not a count-based exam; treat as available if document exists
        return (await this.getSpeakingImportantPhrases())?.groups?.length ? 1 : 0;
      case 'listening-part1':
        const listeningPart1Data = await this.getListeningPart1Content();
        return listeningPart1Data.exams?.length || 0;
      case 'listening-part2':
        const listeningPart2Data = await this.getListeningPart2Content();
        return listeningPart2Data.exams?.length || 0;
      case 'listening-part3':
        const listeningPart3Data = await this.getListeningPart3Content();
        return listeningPart3Data.exams?.length || 0;
        default:
        return 0;
    }
  }

  async isExamAvailable(examType: string): Promise<boolean> {
    const count = await this.getExamCount(examType);
    return count > 0;
  }

  // Generic method to get all exams of a specific type
  async getAllExamsByType(type: string): Promise<any[]> {
    switch (type) {
      case 'grammar-part1':
        return await this.getGrammarPart1Exams();
      case 'grammar-part2':
        return await this.getGrammarPart2Exams();
      case 'reading-part1':
        return await this.getReadingPart1Exams();
      case 'reading-part2':
        return await this.getReadingPart2Exams();
      case 'reading-part3':
        return await this.getReadingPart3Exams();
      case 'writing':
        return await this.getWritingExams();
      case 'speaking-part1':
        return [await this.getSpeakingPart1Content()];
      case 'speaking-part2':
        return [await this.getSpeakingPart2Content()];
      case 'speaking-part3':
        return [await this.getSpeakingPart3Content()];
      case 'speaking-important-phrases':
        return [await this.getSpeakingImportantPhrases()];
      default:
        return [];
    }
  }

  // Get a specific exam by type and ID
  async getExamByTypeAndId(type: string, id: number): Promise<any | undefined> {
    const exams = await this.getAllExamsByType(type);
    return exams.find(exam => exam.id === id);
  }
}

const dataService = new DataService();
export { dataService };
export default dataService;
