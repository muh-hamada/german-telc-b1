/**
 * Analytics Data Service
 * 
 * This service aggregates user statistics from Firestore for the analytics dashboard.
 * It fetches and processes data from the users collection and their subcollections.
 */

import { firestoreService } from './firestore.service';

export interface AnalyticsData {
  totalUsers: number;
  activeUsers7d: number;
  activeUsers30d: number;
  newUsersThisMonth: number;
  notifications: {
    enabled: number;
    disabled: number;
    notSet: number;
  };
  languages: {
    [key: string]: number;
  };
  signInMethods: {
    google: number;
    apple: number;
    email: number;
    anonymous: number;
  };
  completionRates: {
    b1: { [examType: string]: number };
    b2: { [examType: string]: number };
  };
  progressStats: {
    averageProgress: number;
    usersWithProgress: number;
    b1Users: number;
    b2Users: number;
  };
}

class AnalyticsDataService {
  private cache: AnalyticsData | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch all analytics data with caching
   */
  async getAnalyticsData(forceRefresh: boolean = false): Promise<AnalyticsData> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (!forceRefresh && this.cache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      console.log('[AnalyticsDataService] Returning cached data');
      return this.cache;
    }

    console.log('[AnalyticsDataService] Fetching fresh analytics data...');
    
    try {
      const users = await firestoreService.getAllUsers();
      const analyticsData = await this.aggregateUserData(users);
      
      // Cache the result
      this.cache = analyticsData;
      this.cacheTimestamp = now;
      
      return analyticsData;
    } catch (error) {
      console.error('[AnalyticsDataService] Error fetching analytics:', error);
      throw error;
    }
  }

  /**
   * Aggregate user data into analytics metrics
   */
  private async aggregateUserData(users: any[]): Promise<AnalyticsData> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const analytics: AnalyticsData = {
      totalUsers: users.length,
      activeUsers7d: 0,
      activeUsers30d: 0,
      newUsersThisMonth: 0,
      notifications: {
        enabled: 0,
        disabled: 0,
        notSet: 0,
      },
      languages: {},
      signInMethods: {
        google: 0,
        apple: 0,
        email: 0,
        anonymous: 0,
      },
      completionRates: {
        b1: {},
        b2: {},
      },
      progressStats: {
        averageProgress: 0,
        usersWithProgress: 0,
        b1Users: 0,
        b2Users: 0,
      },
    };

    // Process each user
    for (const user of users) {
      // Last login activity
      const lastLoginAt = user.lastLoginAt?.toDate?.() || user.lastLoginAt;
      if (lastLoginAt) {
        if (lastLoginAt >= sevenDaysAgo) {
          analytics.activeUsers7d++;
        }
        if (lastLoginAt >= thirtyDaysAgo) {
          analytics.activeUsers30d++;
        }
      }

      // Created date
      const createdAt = user.createdAt?.toDate?.() || user.createdAt;
      if (createdAt && createdAt >= startOfMonth) {
        analytics.newUsersThisMonth++;
      }

      // Notification settings
      if (user.notificationSettings) {
        if (user.notificationSettings.enabled === true) {
          analytics.notifications.enabled++;
        } else if (user.notificationSettings.enabled === false) {
          analytics.notifications.disabled++;
        } else {
          analytics.notifications.notSet++;
        }
      } else {
        analytics.notifications.notSet++;
      }

      // Language preferences
      const language = user.preferences?.language || user.language || 'unknown';
      analytics.languages[language] = (analytics.languages[language] || 0) + 1;

      // Sign-in methods
      const provider = user.provider?.toLowerCase() || 'unknown';
      if (provider.includes('google')) {
        analytics.signInMethods.google++;
      } else if (provider.includes('apple')) {
        analytics.signInMethods.apple++;
      } else if (provider.includes('password') || provider.includes('email')) {
        analytics.signInMethods.email++;
      } else if (provider.includes('anonymous')) {
        analytics.signInMethods.anonymous++;
      }
    }

    // Fetch completion and progress statistics
    await this.aggregateCompletionAndProgress(users, analytics);

    return analytics;
  }

  /**
   * Aggregate completion and progress data from user subcollections
   */
  private async aggregateCompletionAndProgress(
    users: any[],
    analytics: AnalyticsData
  ): Promise<void> {
    let totalProgressB1 = 0;
    let totalProgressB2 = 0;
    let b1UsersCount = 0;
    let b2UsersCount = 0;

    const b1CompletionMap: { [key: string]: Set<string> } = {};
    const b2CompletionMap: { [key: string]: Set<string> } = {};

    // Sample a subset of users for performance (or fetch all if dataset is small)
    const sampleSize = Math.min(users.length, 100); // Limit to 100 users for performance
    const sampledUsers = users.slice(0, sampleSize);

    for (const user of sampledUsers) {
      try {
        const userData = await firestoreService.getUserData(user.uid);

        // Process B1 progress
        if (userData.progressB1) {
          b1UsersCount++;
          // Calculate progress percentage (assuming progress structure has exam completions)
          const progress = this.calculateProgress(userData.progressB1);
          totalProgressB1 += progress;
        }

        // Process B2 progress
        if (userData.progressB2) {
          b2UsersCount++;
          const progress = this.calculateProgress(userData.progressB2);
          totalProgressB2 += progress;
        }

        // Process B1 completions
        if (userData.completionsB1 && userData.completionsB1.length > 0) {
          userData.completionsB1.forEach((stat: any) => {
            const key = `${stat.examType}-part${stat.partNumber}`;
            if (!b1CompletionMap[key]) {
              b1CompletionMap[key] = new Set();
            }
            b1CompletionMap[key].add(user.uid);
          });
        }

        // Process B2 completions
        if (userData.completionsB2 && userData.completionsB2.length > 0) {
          userData.completionsB2.forEach((stat: any) => {
            const key = `${stat.examType}-part${stat.partNumber}`;
            if (!b2CompletionMap[key]) {
              b2CompletionMap[key] = new Set();
            }
            b2CompletionMap[key].add(user.uid);
          });
        }
      } catch (error) {
        console.error(`Error fetching data for user ${user.uid}:`, error);
      }
    }

    // Calculate averages and completion rates
    const totalUsers = b1UsersCount + b2UsersCount;
    analytics.progressStats.usersWithProgress = totalUsers;
    analytics.progressStats.b1Users = b1UsersCount;
    analytics.progressStats.b2Users = b2UsersCount;

    if (totalUsers > 0) {
      analytics.progressStats.averageProgress = 
        ((totalProgressB1 + totalProgressB2) / totalUsers);
    }

    // Calculate completion rates (users who completed / sampled users)
    Object.entries(b1CompletionMap).forEach(([key, userSet]) => {
      analytics.completionRates.b1[key] = userSet.size;
    });

    Object.entries(b2CompletionMap).forEach(([key, userSet]) => {
      analytics.completionRates.b2[key] = userSet.size;
    });
  }

  /**
   * Calculate progress percentage from progress data
   */
  private calculateProgress(progressData: any): number {
    if (!progressData) return 0;

    // Count completed sections
    let completed = 0;
    let total = 0;

    // Check various exam sections (adjust based on actual data structure)
    const sections = [
      'grammar', 'reading', 'writing', 'listening', 'speaking'
    ];

    sections.forEach(section => {
      if (progressData[section]) {
        const sectionData = progressData[section];
        // Count parts
        Object.keys(sectionData).forEach(key => {
          if (key.startsWith('part')) {
            total++;
            if (sectionData[key]?.completed) {
              completed++;
            }
          }
        });
      }
    });

    return total > 0 ? (completed / total) * 100 : 0;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
    console.log('[AnalyticsDataService] Cache cleared');
  }
}

export const analyticsDataService = new AnalyticsDataService();

