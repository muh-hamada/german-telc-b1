import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import crashlytics from '@react-native-firebase/crashlytics';
import { activeExamConfig } from '../config/active-exam.config';
import {
  GrammarPart1Exam,
  GrammarPart2Exam,
  ReadingPart1Exam,
  ReadingPart1A1Exam,
  ReadingPart2Exam,
  ReadingPart2A1Exam,
  ReadingPart3Exam,
  ReadingPart3A1Exam,
  WritingExam,
  SpeakingPart1Content,
  SpeakingPart2Content,
  SpeakingPart3Content,
  SpeakingImportantPhrasesContent,
  ListeningPracticeInterview,
} from '../types/exam.types';
import { DISABLE_DATA_CACHE } from '../config/development.config';

// Cache for 10 days - invalidation is handled by dataVersion in remote config
const CACHE_EXPIRATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
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
    console.log(`[CACHE_DEBUG] ========================================`);
    console.log(`[CACHE_DEBUG] fetchFromFirestore START for docId: "${docId}"`);
    console.log(`[CACHE_DEBUG] ========================================`);

    try {
      // Check cache first
      console.log(`[CACHE_DEBUG] Step 1: Checking cache...`);
      crashlytics().log(`DataService: Fetching doc "${docId}"`);
      const cachedData = await this.getCachedData(docId);
      
      if (cachedData) {
        crashlytics().log(`DataService: Cache HIT for "${docId}"`);
        console.log(`[CACHE_DEBUG] ✅✅✅ USING CACHED DATA for "${docId}" - NO Firebase fetch needed`);
        console.log(`[CACHE_DEBUG] ========================================`);
        return cachedData;
      }

      // Fetch from Firestore using dynamic collection name
      console.log(`[CACHE_DEBUG] Step 2: Cache miss - Fetching from Firebase...`);
      crashlytics().log(`DataService: Cache MISS for "${docId}", fetching from Firebase`);
      console.log(`[CACHE_DEBUG] Collection: "${this.collectionName}", Doc: "${docId}"`);
      
      const docSnapshot = await firestore()
        .collection(this.collectionName)
        .doc(docId)
        .get();

      const isFromCache = docSnapshot.metadata.fromCache;
      console.log(`[Firestore READ] Doc: ${docId} | Source: ${isFromCache ? 'CACHE (Free)' : 'SERVER (Billed)'}`);

      const exists = typeof (docSnapshot as any).exists === 'function'
        ? (docSnapshot as any).exists()
        : (docSnapshot as any).exists;
      
      console.log(`[CACHE_DEBUG] Firebase document exists: ${exists}`);
      
      if (exists) {
        const firestoreData = docSnapshot.data();
        const data = firestoreData?.data || firestoreData || defaultValue;
        
        crashlytics().log(`DataService: Successfully fetched "${docId}" from Firebase`);
        console.log(`[CACHE_DEBUG] ✅ Successfully fetched "${docId}" from Firebase`);
        console.log(`[CACHE_DEBUG] Step 3: Caching the fetched data...`);
        
        // Cache the data
        await this.cacheData(docId, data);
        
        console.log(`[CACHE_DEBUG] ========================================`);
        return data;
      } else {
        crashlytics().log(`DataService: Document "${docId}" NOT FOUND in Firebase`);
        console.warn(`[CACHE_DEBUG] ⚠️ Document "${docId}" not found in Firebase, returning default`);
        console.log(`[CACHE_DEBUG] ========================================`);
        return defaultValue;
      }
    } catch (error: any) {
      crashlytics().log(`DataService: Error fetching "${docId}": ${error?.message || 'Unknown error'}`);
      console.error(`[CACHE_DEBUG] ❌ ERROR fetching "${docId}" from Firebase:`, error);
      console.log(`[CACHE_DEBUG] ========================================`);
      return defaultValue;
    }
  }

  /**
   * Get cached data if still valid
   */
  private async getCachedData(docId: string): Promise<any | null> {
    console.log(`[CACHE_DEBUG] getCachedData called for docId: "${docId}"`);
    console.log(`[CACHE_DEBUG] DISABLE_DATA_CACHE value: ${DISABLE_DATA_CACHE}`);
    
    if (DISABLE_DATA_CACHE) {
      console.log(`[CACHE_DEBUG] Cache is DISABLED by config, returning null for ${docId}`);
      return null;
    }

    try {
      const cacheKey = CACHE_KEY_PREFIX + docId;
      console.log(`[CACHE_DEBUG] Looking up cache with key: "${cacheKey}"`);
      
      const cachedStr = await AsyncStorage.getItem(cacheKey);
      console.log(`[CACHE_DEBUG] AsyncStorage returned: ${cachedStr ? `string of length ${cachedStr.length}` : 'null'}`);
      
      if (!cachedStr) {
        console.log(`[CACHE_DEBUG] No cached data found for key: "${cacheKey}"`);
        return null;
      }

      const cached: CachedData = JSON.parse(cachedStr);
      const now = Date.now();
      const cacheAge = now - cached.timestamp;
      const cacheAgeHours = (cacheAge / (1000 * 60 * 60)).toFixed(2);
      const expirationHours = (CACHE_EXPIRATION / (1000 * 60 * 60)).toFixed(2);
      
      console.log(`[CACHE_DEBUG] Cache found for "${docId}":`);
      console.log(`[CACHE_DEBUG]   - Timestamp: ${new Date(cached.timestamp).toISOString()}`);
      console.log(`[CACHE_DEBUG]   - Age: ${cacheAgeHours} hours`);
      console.log(`[CACHE_DEBUG]   - Expiration threshold: ${expirationHours} hours`);
      console.log(`[CACHE_DEBUG]   - Is valid: ${cacheAge < CACHE_EXPIRATION}`);
      
      // Check if cache is still valid
      if (now - cached.timestamp < CACHE_EXPIRATION) {
        console.log(`[CACHE_DEBUG] ✅ CACHE HIT - Returning cached data for "${docId}"`);
        return cached.data;
      } else {
        // Cache expired, remove it
        console.log(`[CACHE_DEBUG] ❌ CACHE EXPIRED - Removing stale cache for "${docId}"`);
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
    } catch (error) {
      console.error(`[CACHE_DEBUG] ❌ ERROR reading cache for "${docId}":`, error);
      return null;
    }
  }

  /**
   * Cache data with timestamp
   */
  private async cacheData(docId: string, data: any): Promise<void> {
    console.log(`[CACHE_DEBUG] cacheData called for docId: "${docId}"`);
    try {
      const cacheKey = CACHE_KEY_PREFIX + docId;
      const cached: CachedData = {
        data,
        timestamp: Date.now(),
      };
      const jsonStr = JSON.stringify(cached);
      console.log(`[CACHE_DEBUG] Storing cache with key: "${cacheKey}", data size: ${jsonStr.length} bytes`);
      await AsyncStorage.setItem(cacheKey, jsonStr);
      console.log(`[CACHE_DEBUG] ✅ Successfully cached data for "${docId}"`);
    } catch (error) {
      console.error(`[CACHE_DEBUG] ❌ ERROR caching data for "${docId}":`, error);
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    console.log(`[CACHE_DEBUG] ⚠️ clearCache() called - CLEARING ALL CACHED DATA`);
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      console.log(`[CACHE_DEBUG] Found ${cacheKeys.length} cache keys to remove:`, cacheKeys);
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`[CACHE_DEBUG] ✅ All cache cleared successfully`);
    } catch (error) {
      console.error(`[CACHE_DEBUG] ❌ Error clearing cache:`, error);
    }
  }

  /**
   * Force refresh data from Firestore
   */
  async refreshData(docId: string): Promise<void> {
    console.log(`[CACHE_DEBUG] ⚠️ refreshData() called for "${docId}" - REMOVING CACHE`);
    const cacheKey = CACHE_KEY_PREFIX + docId;
    await AsyncStorage.removeItem(cacheKey);
    console.log(`[CACHE_DEBUG] ✅ Cache removed for "${docId}"`);
  }

  // Grammar Part 1
  async getGrammarPart1Exams(): Promise<GrammarPart1Exam[]> {
    const data = await this.fetchFromFirestore('grammar-part1', null);
    return data.exams || [];
  }

  async getGrammarPart1Exam(id: number): Promise<GrammarPart1Exam | undefined> {
    const exams = await this.getGrammarPart1Exams();
    return exams.find(exam => exam.id === id);
  }

  // Grammar Part 2
  async getGrammarPart2Exams(): Promise<GrammarPart2Exam[]> {
    const data = await this.fetchFromFirestore('grammar-part2', null);
    return data.exams || [];
  }

  async getGrammarPart2Exam(id: number): Promise<GrammarPart2Exam | undefined> {
    const exams = await this.getGrammarPart2Exams();
    return exams.find(exam => exam.id === id);
  }

  // Reading Part 1 (B1/B2)
  async getReadingPart1Exams(): Promise<ReadingPart1Exam[]> {
    return await this.fetchFromFirestore('reading-part1', null);
  }

  async getReadingPart1ExamById(id: number): Promise<ReadingPart1Exam | undefined> {
    const exams = await this.getReadingPart1Exams();
    return exams.find(exam => exam.id === id);
  }

  // Reading Part 1 A1 (True/False Questions)
  async getReadingPart1A1Exams(): Promise<ReadingPart1A1Exam[]> {
    return await this.fetchFromFirestore('reading-part1', null);
  }

  async getReadingPart1A1ExamById(id: number): Promise<ReadingPart1A1Exam | undefined> {
    const exams = await this.getReadingPart1A1Exams();
    return exams.find(exam => exam.id === id);
  }

  // Reading Part 2 (B1/B2)
  async getReadingPart2Exams(): Promise<ReadingPart2Exam[]> {
    const data = await this.fetchFromFirestore('reading-part2', null);
    return data.exams || [];
  }

  async getReadingPart2Exam(id: number): Promise<ReadingPart2Exam | undefined> {
    const exams = await this.getReadingPart2Exams();
    return exams.find(exam => exam.id === id);
  }

  // Reading Part 2 A1 (Matching Situations to Options)
  async getReadingPart2A1Exams(): Promise<ReadingPart2A1Exam[]> {
    const data = await this.fetchFromFirestore('reading-part2', null);
    return data.exams || [];
  }

  async getReadingPart2A1ExamById(id: number): Promise<ReadingPart2A1Exam | undefined> {
    const exams = await this.getReadingPart2A1Exams();
    return exams.find(exam => exam.id === id);
  }

  // Reading Part 3 (B1/B2)
  async getReadingPart3Exams(): Promise<ReadingPart3Exam[]> {
    const data = await this.fetchFromFirestore('reading-part3', null);
    return data.exams || [];
  }

  async getReadingPart3Exam(id: number): Promise<ReadingPart3Exam | undefined> {
    const exams = await this.getReadingPart3Exams();
    return exams.find(exam => exam.id === id);
  }

  // Reading Part 3 A1 (True/False Questions with Context)
  async getReadingPart3A1Exams(): Promise<ReadingPart3A1Exam[]> {
    const data = await this.fetchFromFirestore('reading-part3', null);
    return data.exams || [];
  }

  async getReadingPart3A1ExamById(id: number): Promise<ReadingPart3A1Exam | undefined> {
    const exams = await this.getReadingPart3A1Exams();
    return exams.find(exam => exam.id === id);
  }

  // Writing
  async getWritingExams(): Promise<WritingExam[]> {
    const data = await this.fetchFromFirestore('writing', null);
    return data.exams || [];
  }

  async getWritingExam(id: number): Promise<WritingExam | undefined> {
    const exams = await this.getWritingExams();
    return exams.find(exam => exam.id === id);
  }

  // Writing Part 1 (A1)
  async getWritingPart1Exams(): Promise<any[]> {
    const data = await this.fetchFromFirestore('writing-part1', null);
    return data.exams || [];
  }

  async getWritingPart1Exam(id: number): Promise<any | undefined> {
    const exams = await this.getWritingPart1Exams();
    return exams.find(exam => exam.id === id);
  }

  // Writing Part 2 (A1)
  async getWritingPart2Exams(): Promise<any[]> {
    const data = await this.fetchFromFirestore('writing-part2', null);
    return data.exams || [];
  }

  async getWritingPart2Exam(id: number): Promise<any | undefined> {
    const exams = await this.getWritingPart2Exams();
    return exams.find(exam => exam.id === id);
  }

  // Speaking Part 1
  async getSpeakingPart1Content(): Promise<SpeakingPart1Content> {
    const data = await this.fetchFromFirestore('speaking-part1', null);
    return data.content || {};
  }

  // Speaking Part 2
  async getSpeakingPart2Content(): Promise<SpeakingPart2Content> {
    return await this.fetchFromFirestore('speaking-part2', null);
  }

  // Speaking Part 3
  async getSpeakingPart3Content(): Promise<SpeakingPart3Content> {
    return await this.fetchFromFirestore('speaking-part3', null);
  }

  // Speaking Important Phrases (Part 4)
  async getSpeakingImportantPhrases(): Promise<SpeakingImportantPhrasesContent> {
    const data = await this.fetchFromFirestore('speaking-important-phrases', null);
    return data;
  }

  // Oral Exam Structure (B2)
  async getOralExamStructure(): Promise<any> {
    return await this.fetchFromFirestore('oral-exam-structure', null);
  }

  // Speaking B2 Part 1
  async getSpeakingB2Part1Content(): Promise<any> {
    return await this.fetchFromFirestore('speaking-part1', null);
  }

  // Speaking B2 Part 2
  async getSpeakingB2Part2Content(): Promise<any> {
    return await this.fetchFromFirestore('speaking-part2', null);
  }

  // Speaking B2 Part 3
  async getSpeakingB2Part3Content(): Promise<any> {
    return await this.fetchFromFirestore('speaking-part3', null);
  }

  // Speaking A1 Part 1
  async getA1SpeakingPart1Content(): Promise<any> {
    return await this.fetchFromFirestore('speaking-part1', null);
  }

  // Speaking A1 Part 2
  async getA1SpeakingPart2Content(): Promise<any> {
    return await this.fetchFromFirestore('speaking-part2', null);
  }

  // Speaking A1 Part 3
  async getA1SpeakingPart3Content(): Promise<any> {
    return await this.fetchFromFirestore('speaking-part3', null);
  }

  // Listening Part 1
  async getListeningPart1Content(): Promise<any> {
    return await this.fetchFromFirestore('listening-part1', null);
  }

  // Listening Part 2
  async getListeningPart2Content(): Promise<any> {
    return await this.fetchFromFirestore('listening-part2', null);
  }

  // Listening Part 3
  async getListeningPart3Content(): Promise<any> {
    return await this.fetchFromFirestore('listening-part3', null);
  }

  // Exam Info (structure, assessment criteria, etc.)
  async getExamInfo(): Promise<any> {
    return await this.fetchFromFirestore('exam-info', null);
  }

  // Grammar Study Questions
  async getGrammarStudyQuestions(): Promise<any[]> {
    const data = await this.fetchFromFirestore('grammar-study-questions', null);
    // The Firebase document has structure { data: [...], metadata: {...} }
    // Extract just the data array
    return data?.data || [];
  }

  // Listening Practice
  async getListeningPracticeInterviews(): Promise<ListeningPracticeInterview[]> {
    const data = await this.fetchFromFirestore('listening-practice', null);
    console.log('[ListeningPractice] Loaded interviews:', data?.interviews);
    return data?.interviews || [];
  }

  async getListeningPracticeById(id: number): Promise<ListeningPracticeInterview | undefined> {
    const interviews = await this.getListeningPracticeInterviews();
    return interviews.find(interview => interview.id === id);
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
      case 'writing-part1':
        return (await this.getWritingPart1Exams()).length;
      case 'writing-part2':
        return (await this.getWritingPart2Exams()).length;
      case 'speaking-part1':
        // A1 and B1 have 1 speaking part 1 (study material), B2 has topics
        if (activeExamConfig.level === 'A1') {
          return 1; // A1 has study material, not multiple exams
        }
        return activeExamConfig.level === 'B2' ? (await this.getSpeakingB2Part1Content())?.topics?.length || 0 : 1;
      case 'speaking-part2':
        const part2Data = await this.getSpeakingPart2Content();
        if (activeExamConfig.level === 'A1') {
          // A1 has simulation_data with one topic and cards
          return 1;
        }
        return (activeExamConfig.level === 'B2' ? part2Data.questions?.length : part2Data.topics?.length) || 0;
      case 'speaking-part3':
        const part3Data = await this.getSpeakingPart3Content();
        if (activeExamConfig.level === 'A1') {
          // A1 has simulation_data with cards_deck
          return 1; // We have one content 
        }
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
      case 'writing-part1':
        return await this.getWritingPart1Exams();
      case 'writing-part2':
        return await this.getWritingPart2Exams();
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
