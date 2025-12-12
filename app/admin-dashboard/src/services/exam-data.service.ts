import { doc, getDoc } from 'firebase/firestore';
import { firebaseService } from './firebase.service';
import { APP_CONFIGS } from '../config/apps.config';

// Document IDs for exam sections
const EXAM_DOCUMENT_IDS = [
  'reading-part1',
  'reading-part2',
  'reading-part3',
  'listening-part1',
  'listening-part2',
  'listening-part3',
  'listening-practice',
  'grammar-part1',
  'grammar-part2',
  'writing',
  'speaking-part1',
  'speaking-part2',
  'speaking-part3',
];

export interface ExamSectionData {
  documentId: string;
  data: any;
  exists: boolean;
}

export interface AppExamData {
  appId: string;
  collectionName: string;
  sections: Record<string, ExamSectionData>;
}

class ExamDataService {
  private db = firebaseService.getFirestore();
  private cache: Record<string, AppExamData> = {};
  private cacheTimestamp: number = 0;
  private cacheDuration = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Get exam data for a specific app from Firebase
   */
  async getAppExamData(appId: string): Promise<AppExamData> {
    const config = APP_CONFIGS[appId];
    if (!config) {
      throw new Error(`App configuration not found for ID: ${appId}`);
    }

    const appData: AppExamData = {
      appId,
      collectionName: config.collectionName,
      sections: {},
    };

    // Fetch all exam documents for this app
    for (const docId of EXAM_DOCUMENT_IDS) {
      try {
        const docRef = doc(this.db, config.collectionName, docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const docData = docSnap.data();
          appData.sections[docId] = {
            documentId: docId,
            data: docData.data || docData, // Handle both wrapped and unwrapped data
            exists: true,
          };
        } else {
          appData.sections[docId] = {
            documentId: docId,
            data: null,
            exists: false,
          };
        }
      } catch (error) {
        console.error(`Error fetching ${docId} for ${appId}:`, error);
        appData.sections[docId] = {
          documentId: docId,
          data: null,
          exists: false,
        };
      }
    }

    return appData;
  }

  /**
   * Get exam data for all apps
   */
  async getAllAppsExamData(forceRefresh: boolean = false): Promise<Record<string, AppExamData>> {
    // Check cache
    const now = Date.now();
    if (!forceRefresh && this.cacheTimestamp && (now - this.cacheTimestamp) < this.cacheDuration) {
      console.log('Returning cached exam data');
      return this.cache;
    }

    console.log('Fetching fresh exam data from Firebase...');
    const allData: Record<string, AppExamData> = {};
    const appIds = Object.keys(APP_CONFIGS);

    // Fetch data for all apps in parallel
    const promises = appIds.map(async (appId) => {
      const data = await this.getAppExamData(appId);
      return { appId, data };
    });

    const results = await Promise.all(promises);
    
    for (const { appId, data } of results) {
      allData[appId] = data;
    }

    // Update cache
    this.cache = allData;
    this.cacheTimestamp = now;

    return allData;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache = {};
    this.cacheTimestamp = 0;
  }
}

export const examDataService = new ExamDataService();

