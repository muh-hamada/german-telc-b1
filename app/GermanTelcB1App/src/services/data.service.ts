/**
 * Data Service with Firebase Support
 * 
 * This service fetches exam data from Firebase Firestore with caching for offline support.
 * 
 * Features:
 * - Fetches exam data from Firestore
 * - Returns empty data if Firestore document doesn't exist
 * - Caches data for 24 hours to reduce Firestore reads
 * - Supports cache clearing and force refresh
 * - Dynamically uses collection names based on active exam configuration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import { activeExamConfig } from '../config/active-exam.config';
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
import { DISABLE_DATA_CACHE } from '../config/development.config';

// TODO: Change to 24 hours in milliseconds once the data is stable
const CACHE_EXPIRATION = 10 * 1000; // 10 seconds in milliseconds
const CACHE_KEY_PREFIX = '@exam_data_';

interface CachedData {
  data: any;
  timestamp: number;
}

class DataService {
  // Lazy-loaded to avoid initialization order issues
  private get collectionName(): string {
    return activeExamConfig.firebaseCollections.examData;
  }

  /**
   * Fetch data from Firestore with caching
   * Returns empty/default data if document doesn't exist
   */
  private async fetchFromFirestore(docId: string, defaultValue: any = {}): Promise<any> {
    try {
      // Check cache first
      const cachedData = await this.getCachedData(docId);
      if (cachedData) {
        console.log(`[DataService] Using cached data for ${docId}`);
        return cachedData;
      }

      // Fetch from Firestore using dynamic collection name
      console.log(`[DataService] Fetching ${docId} from Firestore collection: ${this.collectionName}...`);
      const docSnapshot = await firestore()
        .collection(this.collectionName)
        .doc(docId)
        .get();

      const exists = typeof (docSnapshot as any).exists === 'function'
        ? (docSnapshot as any).exists()
        : (docSnapshot as any).exists;
      
      if (exists) {
        const firestoreData = docSnapshot.data();
        const data = firestoreData?.data || firestoreData || defaultValue;
        
        console.log(`[DataService] Successfully fetched ${docId} from Firestore`);
        // Cache the data
        await this.cacheData(docId, data);
        
        return data;
      } else {
        console.warn(`[DataService] Document ${docId} not found in Firestore, returning empty data`);
        return defaultValue;
      }
    } catch (error) {
      console.error(`[DataService] Error fetching ${docId} from Firestore:`, error);
      return defaultValue;
    }
  }

  /**
   * Get cached data if still valid
   */
  private async getCachedData(docId: string): Promise<any | null> {
    if (DISABLE_DATA_CACHE) {
      console.log(`[DataService] Data cache is disabled, returning null for ${docId}`);
      return null;
    }

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
    const data = await this.fetchFromFirestore('grammar-part1', { exams: [] });
    return data.exams || [];
  }

  async getGrammarPart1Exam(id: number): Promise<GrammarPart1Exam | undefined> {
    const exams = await this.getGrammarPart1Exams();
    return exams.find(exam => exam.id === id);
  }

  // Grammar Part 2
  async getGrammarPart2Exams(): Promise<GrammarPart2Exam[]> {
    const data = await this.fetchFromFirestore('grammar-part2', { exams: [] });
    return data.exams || [];
  }

  async getGrammarPart2Exam(id: number): Promise<GrammarPart2Exam | undefined> {
    const exams = await this.getGrammarPart2Exams();
    return exams.find(exam => exam.id === id);
  }

  // Reading Part 1
  async getReadingPart1Exams(): Promise<ReadingPart1Exam[]> {
    return await this.fetchFromFirestore('reading-part1', []);
  }

  async getReadingPart1ExamById(id: number): Promise<ReadingPart1Exam | undefined> {
    const exams = await this.getReadingPart1Exams();
    return exams.find(exam => exam.id === id);
  }

  // Reading Part 2
  async getReadingPart2Exams(): Promise<ReadingPart2Exam[]> {
    const data = await this.fetchFromFirestore('reading-part2', { exams: [] });
    return data.exams || [];
  }

  async getReadingPart2Exam(id: number): Promise<ReadingPart2Exam | undefined> {
    const exams = await this.getReadingPart2Exams();
    return exams.find(exam => exam.id === id);
  }

  // Reading Part 3
  async getReadingPart3Exams(): Promise<ReadingPart3Exam[]> {
    const data = await this.fetchFromFirestore('reading-part3', { exams: [] });
    return data.exams || [];
  }

  async getReadingPart3Exam(id: number): Promise<ReadingPart3Exam | undefined> {
    const exams = await this.getReadingPart3Exams();
    return exams.find(exam => exam.id === id);
  }

  // Writing
  async getWritingExams(): Promise<WritingExam[]> {
    const data = await this.fetchFromFirestore('writing', { exams: [] });
    return data.exams || [];
  }

  async getWritingExam(id: number): Promise<WritingExam | undefined> {
    const exams = await this.getWritingExams();
    return exams.find(exam => exam.id === id);
  }

  // Speaking Part 1
  async getSpeakingPart1Content(): Promise<SpeakingPart1Content> {
    const data = await this.fetchFromFirestore('speaking-part1', { content: {} });
    return data.content || {};
  }

  // Speaking Part 2
  async getSpeakingPart2Content(): Promise<SpeakingPart2Content> {
    return await this.fetchFromFirestore('speaking-part2', { topics: [] });
  }

  // Speaking Part 3
  async getSpeakingPart3Content(): Promise<SpeakingPart3Content> {
    return await this.fetchFromFirestore('speaking-part3', { scenarios: [] });
  }

  // Speaking Important Phrases (Part 4)
  async getSpeakingImportantPhrases(): Promise<SpeakingImportantPhrasesContent> {
    const data = await this.fetchFromFirestore('speaking-important-phrases', { groups: [] });
    return data;
  }

  // Oral Exam Structure (B2)
  async getOralExamStructure(): Promise<any> {
    return await this.fetchFromFirestore('oral-exam-structure', {});
  }

  // Speaking B2 Part 1
  async getSpeakingB2Part1Content(): Promise<any> {
    return await this.fetchFromFirestore('speaking-part1', { topics: [] });
  }

  // Speaking B2 Part 2
  async getSpeakingB2Part2Content(): Promise<any> {
    return await this.fetchFromFirestore('speaking-part2', { questions: [] });
  }

  // Speaking B2 Part 3
  async getSpeakingB2Part3Content(): Promise<any> {
    return await this.fetchFromFirestore('speaking-part3', { questions: [] });
  }

  // Listening Part 1
  async getListeningPart1Content(): Promise<any> {
    return await this.fetchFromFirestore('listening-part1', { exams: [] });
  }

  // Listening Part 2
  async getListeningPart2Content(): Promise<any> {
    return await this.fetchFromFirestore('listening-part2', { exams: [] });
  }

  // Listening Part 3
  async getListeningPart3Content(): Promise<any> {
    return await this.fetchFromFirestore('listening-part3', { exams: [] });
  }

  // Exam Info (structure, assessment criteria, etc.)
  async getExamInfo(): Promise<any> {
    return await this.fetchFromFirestore('exam-info', {});
  }

  // Grammar Study Questions
  async getGrammarStudyQuestions(): Promise<any[]> {
    const data = await this.fetchFromFirestore('grammar-study-questions', { data: [] });
    // The Firebase document has structure { data: [...], metadata: {...} }
    // Extract just the data array
    return data.data || [];
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
        return activeExamConfig.level === 'B2' ? (await this.getSpeakingB2Part1Content())?.topics?.length || 0 : 1;
      case 'speaking-part2':
        const part2Data = await this.getSpeakingPart2Content();
        return (activeExamConfig.level === 'B2' ? part2Data.questions?.length : part2Data.topics?.length) || 0;
      case 'speaking-part3':
        const part3Data = await this.getSpeakingPart3Content();
        return  (activeExamConfig.level === 'B2' ? part3Data.questions?.length : part3Data.scenarios?.length) || 0;
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
