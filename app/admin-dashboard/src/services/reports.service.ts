import { firebaseService } from './firebase.service';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';

// Interface matching user-analytics.ts AnalyticsData
export interface AnalyticsData {
  totalUsers: number;
  platforms: { [key: string]: number };
  languages: { [key: string]: number };
  notifications: {
    enabled: number;
    disabled: number;
  };
  premium: {
    total: number;
    nonPremium: number;
  };
  personas: { [key: string]: number };
  vocabulary: {
    totalWordsStudied: number;
    totalMastered: number;
  };
  progress: {
    totalScore: number;
    examsCompleted: number;
  };
  streaks: {
    currentStreakDistribution: { [key: string]: number };
    longestStreakDistribution: { [key: string]: number };
    activeStreaks: number;
  };
  lastUpdated: any; // Firestore Timestamp
}

export interface DailySnapshot extends AnalyticsData {
  date: string; // Document ID (YYYY-MM-DD)
}

export interface AppAnalytics {
  appId: string;
  current: AnalyticsData | null;
  snapshots: DailySnapshot[];
}

const APP_IDS = ['german-b1', 'german-b2', 'english-b1', 'english-b2', 'german-a1', 'german-a2', 'dele-spanish-b1'];

class ReportsService {
  private db = firebaseService.getFirestore();
  private cache: Map<string, { data: AppAnalytics; timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get analytics data for a specific app
   */
  async getAppAnalytics(appId: string, daysBack: number = 30): Promise<AppAnalytics> {
    const cacheKey = `${appId}-${daysBack}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const analyticsRef = doc(this.db, 'user_analytics', appId);
    const analyticsDoc = await getDoc(analyticsRef);
    
    let current: AnalyticsData | null = null;
    if (analyticsDoc.exists()) {
      current = analyticsDoc.data() as AnalyticsData;
    }

    // Get daily snapshots
    const snapshotsRef = collection(this.db, 'user_analytics', appId, 'daily_snapshots');
    const snapshotsQuery = query(
      snapshotsRef,
      orderBy('__name__', 'desc'),
      limit(daysBack)
    );
    
    const snapshotsSnap = await getDocs(snapshotsQuery);
    const snapshots: DailySnapshot[] = [];
    
    snapshotsSnap.forEach((doc) => {
      snapshots.push({
        date: doc.id,
        ...doc.data() as AnalyticsData,
      });
    });

    // Sort by date ascending for charts
    snapshots.sort((a, b) => a.date.localeCompare(b.date));

    const result: AppAnalytics = {
      appId,
      current,
      snapshots,
    };

    this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  }

  /**
   * Get analytics for all apps
   */
  async getAllAppsAnalytics(daysBack: number = 30): Promise<AppAnalytics[]> {
    const results = await Promise.all(
      APP_IDS.map(appId => this.getAppAnalytics(appId, daysBack))
    );
    return results;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get available app IDs
   */
  getAppIds(): string[] {
    return APP_IDS;
  }
}

export const reportsService = new ReportsService();

