/**
 * Frequent User Reward Service
 * 
 * Manages rewards for frequent users that are independent of the streak system.
 * Handles granting ad-free days and other loyalty rewards.
 */

import firestore from '@react-native-firebase/firestore';
import { AnalyticsEvents, logEvent } from './analytics.events';

interface FrequentUserRewardData {
  adFree: {
    isActive: boolean;
    expiresAt: number | null;
    grantedAt: number | null;
    source: 'gift' | 'promotion' | 'other';
  };
  lastUpdated: number;
}

const DEFAULT_REWARD_DATA: FrequentUserRewardData = {
  adFree: {
    isActive: false,
    expiresAt: null,
    grantedAt: null,
    source: 'gift',
  },
  lastUpdated: Date.now(),
};

class FrequentUserRewardService {
  private readonly COLLECTION_NAME = 'user_rewards';

  /**
   * Get the Firestore document path for a user's rewards
   */
  private getRewardPath(userId: string): string {
    return `${this.COLLECTION_NAME}/${userId}`;
  }

  /**
   * Get user's reward data
   */
  async getRewardData(userId: string): Promise<FrequentUserRewardData> {
    try {
      const docPath = this.getRewardPath(userId);
      const doc = await firestore().doc(docPath).get();

      if (!doc.exists) {
        return DEFAULT_REWARD_DATA;
      }

      return doc.data() as FrequentUserRewardData;
    } catch (error) {
      console.error('[FrequentUserRewardService] Error getting reward data:', error);
      return DEFAULT_REWARD_DATA;
    }
  }

  /**
   * Grant ad-free day to a user
   * @param userId - User ID
   * @param durationHours - Duration in hours (default: 24)
   * @param source - Source of the reward ('gift', 'promotion', 'other')
   */
  async grantAdFreeDay(
    userId: string, 
    durationHours: number = 24,
    source: 'gift' | 'promotion' | 'other' = 'gift'
  ): Promise<boolean> {
    try {
      console.log(`[FrequentUserRewardService] Granting ${durationHours}h ad-free day to user ${userId}`);
      
      const docPath = this.getRewardPath(userId);
      console.log(`[FrequentUserRewardService] Document path: ${docPath}`);
      
      const docRef = firestore().doc(docPath);
      console.log('[FrequentUserRewardService] Getting document...');
      
      const doc = await docRef.get();
      console.log(`[FrequentUserRewardService] Document exists: ${doc.exists}`);

      let rewardData: FrequentUserRewardData;
      
      if (!doc.exists || !doc.data()) {
        console.log('[FrequentUserRewardService] Document does not exist or has no data, using default');
        rewardData = { ...DEFAULT_REWARD_DATA };
      } else {
        const docData = doc.data();
        console.log('[FrequentUserRewardService] Raw document data:', JSON.stringify(docData));
        rewardData = docData as FrequentUserRewardData;
      }

      const now = Date.now();

      // Check if ad-free is already active
      if (rewardData.adFree && rewardData.adFree.isActive && rewardData.adFree.expiresAt && rewardData.adFree.expiresAt > now) {
        console.log('[FrequentUserRewardService] Ad-free already active, extending duration');
        // Extend the current duration
        const remainingTime = rewardData.adFree.expiresAt - now;
        const additionalTime = durationHours * 60 * 60 * 1000;
        rewardData.adFree.expiresAt = now + remainingTime + additionalTime;
      } else {
        // Activate new ad-free period
        const expiresAt = now + (durationHours * 60 * 60 * 1000);
        
        console.log('[FrequentUserRewardService] Activating new ad-free period');
        // Ensure adFree object exists
        if (!rewardData.adFree) {
          rewardData.adFree = { ...DEFAULT_REWARD_DATA.adFree };
        }
        rewardData.adFree.isActive = true;
        rewardData.adFree.expiresAt = expiresAt;
        rewardData.adFree.grantedAt = now;
        rewardData.adFree.source = source;
      }

      rewardData.lastUpdated = now;

      console.log('[FrequentUserRewardService] Writing to Firestore...');
      console.log('[FrequentUserRewardService] Data to write:', JSON.stringify(rewardData));
      
      await docRef.set(rewardData);
      
      console.log('[FrequentUserRewardService] Firestore write completed successfully');

      logEvent(AnalyticsEvents.AD_FREE_ACTIVATED, {
        duration_hours: durationHours,
        expires_at: rewardData.adFree.expiresAt,
        source,
        service: 'frequent_user_reward',
      });

      console.log(`[FrequentUserRewardService] Ad-free day granted, expires at ${new Date(rewardData.adFree.expiresAt!).toISOString()}`);
      return true;
    } catch (error) {
      console.error('[FrequentUserRewardService] Error granting ad-free day:', error);
      console.error('[FrequentUserRewardService] Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('[FrequentUserRewardService] Error stack:', error instanceof Error ? error.stack : 'No stack');
      return false;
    }
  }

  /**
   * Check if user has active ad-free period
   */
  async isAdFreeActive(userId: string): Promise<boolean> {
    try {
      const rewardData = await this.getRewardData(userId);
      
      if (!rewardData.adFree.isActive || !rewardData.adFree.expiresAt) {
        return false;
      }

      const now = Date.now();
      const isActive = rewardData.adFree.expiresAt > now;

      // If expired, update the document
      if (!isActive && rewardData.adFree.isActive) {
        await this.deactivateExpiredAdFree(userId);
      }

      return isActive;
    } catch (error) {
      console.error('[FrequentUserRewardService] Error checking ad-free status:', error);
      return false;
    }
  }

  /**
   * Get ad-free expiration timestamp
   */
  async getAdFreeExpiresAt(userId: string): Promise<number | null> {
    try {
      const rewardData = await this.getRewardData(userId);
      
      if (!rewardData.adFree.isActive || !rewardData.adFree.expiresAt) {
        return null;
      }

      const now = Date.now();
      if (rewardData.adFree.expiresAt <= now) {
        return null;
      }

      return rewardData.adFree.expiresAt;
    } catch (error) {
      console.error('[FrequentUserRewardService] Error getting expiration:', error);
      return null;
    }
  }

  /**
   * Deactivate expired ad-free period
   */
  private async deactivateExpiredAdFree(userId: string): Promise<void> {
    try {
      const docPath = this.getRewardPath(userId);
      const docRef = firestore().doc(docPath);

      await docRef.update({
        'adFree.isActive': false,
        lastUpdated: Date.now(),
      });

      logEvent(AnalyticsEvents.AD_FREE_EXPIRED, {
        service: 'frequent_user_reward',
      });

      console.log('[FrequentUserRewardService] Expired ad-free period deactivated');
    } catch (error) {
      console.error('[FrequentUserRewardService] Error deactivating ad-free:', error);
    }
  }

  /**
   * Manually revoke ad-free period (for testing purposes)
   */
  async revokeAdFree(userId: string): Promise<boolean> {
    try {
      const docPath = this.getRewardPath(userId);
      const docRef = firestore().doc(docPath);

      await docRef.update({
        'adFree.isActive': false,
        'adFree.expiresAt': null,
        lastUpdated: Date.now(),
      });

      console.log('[FrequentUserRewardService] Ad-free period revoked');
      return true;
    } catch (error) {
      console.error('[FrequentUserRewardService] Error revoking ad-free:', error);
      return false;
    }
  }
}

export default new FrequentUserRewardService();
