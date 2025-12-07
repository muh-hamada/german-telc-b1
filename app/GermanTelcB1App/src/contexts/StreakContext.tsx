import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import firebaseStreaksService, { StreakData, WeeklyActivityData, StreakFreeze } from '../services/firebase-streaks.service';
import { usePremium } from './PremiumContext';
import { useRemoteConfig } from './RemoteConfigContext';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import { useModalQueue } from './ModalQueueContext';

interface AdFreeStatus {
  isActive: boolean;
  expiresAt: number | null;
}

interface RecordActivityParams {
  activityType: 'exam' | 'completion' | 'grammar_study' | 'vocabulary_study' | 'vocabulary_review';
  activityId?: string;
  score?: number;
  options?: {shouldSuppressStreakModal?: boolean};
}

interface StreakContextType {
  // State
  streakData: StreakData | null;
  weeklyActivity: WeeklyActivityData[];
  adFreeStatus: AdFreeStatus;
  isLoading: boolean;
  hasPendingReward: boolean;
  streakFreeze: StreakFreeze | null; // Premium feature
  
  // Actions
  recordActivity: (params: RecordActivityParams) => Promise<{ success: boolean; shouldShowModal: boolean }>;
  claimReward: () => Promise<boolean>;
  refreshStreakData: () => Promise<void>;
  checkAdFreeStatus: () => Promise<boolean>;
  dismissStreakModal: () => void;
  setStreakModalVisibility: (visible: boolean) => void;
  useStreakFreeze: () => Promise<boolean>; // Premium feature
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

interface StreakProviderProps {
  children: ReactNode;
}

export const StreakProvider: React.FC<StreakProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { isStreaksEnabledForUser } = useRemoteConfig();
  const { isPremium } = usePremium();
  const { enqueue } = useModalQueue();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityData[]>([]);
  const [adFreeStatus, setAdFreeStatus] = useState<AdFreeStatus>({ isActive: false, expiresAt: null });
  const [isLoading, setIsLoading] = useState(false);
  const [hasPendingReward, setHasPendingReward] = useState(false);
  const [hasShownRewardModalThisSession, setHasShownRewardModalThisSession] = useState(false);
  const [streakFreeze, setStreakFreeze] = useState<StreakFreeze | null>(null);

  // Load streak data
  const loadStreakData = useCallback(async () => {
    if (!user?.uid || !isStreaksEnabledForUser(user?.uid)) {
      console.log('[StreakContext] No user or streaks disabled, clearing data');
      setStreakData(null);
      setWeeklyActivity([]);
      setAdFreeStatus({ isActive: false, expiresAt: null });
      setHasPendingReward(false);
      setStreakFreeze(null);
      return;
    }

    try {
      console.log('[StreakContext] Loading streak data for user:', user.uid);
      setIsLoading(true);
      
      const data = await firebaseStreaksService.getStreakData(user.uid);
      setStreakData(data);
      
      const weekly = await firebaseStreaksService.getWeeklyActivity(user.uid);
      setWeeklyActivity(weekly);
      
      const isAdFree = await firebaseStreaksService.isAdFreeActive(user.uid);
      setAdFreeStatus({
        isActive: isAdFree,
        expiresAt: data.adFreeReward.expiresAt,
      });
      
      const pending = await firebaseStreaksService.hasPendingReward(user.uid);
      setHasPendingReward(pending);
      
      // Load streak freeze data if premium
      if (isPremium) {
        const freezeData = await firebaseStreaksService.getStreakFreezeData(user.uid);
        setStreakFreeze(freezeData);
        
        // Auto-apply freeze if streak would be broken
        await firebaseStreaksService.checkAndAutoApplyFreeze(user.uid, isPremium);
      } else {
        setStreakFreeze(null);
      }
      
      console.log('[StreakContext] Streak data loaded:', {
        currentStreak: data.currentStreak,
        hasPending: pending,
        isAdFree,
        hasFreezes: isPremium,
      });
    } catch (error) {
      console.error('[StreakContext] Error loading streak data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, isStreaksEnabledForUser, isPremium]);

  // Load data when user changes
  useEffect(() => {
    loadStreakData();
  }, [loadStreakData]);

  // Show reward modal when user has pending reward (once per session)
  useEffect(() => {
    if (!isStreaksEnabledForUser(user?.uid) || !user) {
      return;
    }

    // Only show once per session
    if (hasPendingReward && !hasShownRewardModalThisSession) {
      console.log('[StreakContext] User has pending reward, enqueuing modal');
      enqueue('streak-reward');
      setHasShownRewardModalThisSession(true);
    }
    
    // Reset flag when reward is no longer pending
    if (!hasPendingReward) {
      setHasShownRewardModalThisSession(false);
    }
  }, [user, hasPendingReward, hasShownRewardModalThisSession, isStreaksEnabledForUser, enqueue]);

  // Record activity
  const recordActivity = async (params: RecordActivityParams): Promise<{ success: boolean; shouldShowModal: boolean }> => {
    const { activityType, activityId, score, options } = params;
    const shouldSuppressStreakModal = options?.shouldSuppressStreakModal || false;

    if (!user?.uid || !isStreaksEnabledForUser(user?.uid)) {
      console.log('[StreakContext] Cannot record activity: no user or streaks disabled');
      return { success: false, shouldShowModal: false };
    }

    try {
      console.log('[StreakContext] Recording activity:', { activityType, activityId, score });
      
      const result = await firebaseStreaksService.recordActivity(
        user.uid,
        activityType,
        activityId,
        score
      );
      
      if (result.success) {
        // Update local state
        setStreakData(result.streakData);
        
        // Refresh weekly activity
        const weekly = await firebaseStreaksService.getWeeklyActivity(user.uid);
        setWeeklyActivity(weekly);
        
        // Check for pending reward
        const pending = await firebaseStreaksService.hasPendingReward(user.uid);
        setHasPendingReward(pending);
        
        // Enqueue streak modal if needed
        if (result.shouldShowModal) {
          if (!shouldSuppressStreakModal) {
            enqueue('streak');
          } else {
            console.log('[StreakContext] Streak modal suppressed');
          }
          
          // Log analytics event when modal is triggered
          logEvent(AnalyticsEvents.STREAK_MODAL_SHOWN, {
            currentStreak: result.streakData.currentStreak,
            longestStreak: result.streakData.longestStreak,
            hasPendingReward: result.streakData.adFreeReward.earned,
            shouldSuppressStreakModal: shouldSuppressStreakModal,
          });
        }
        
        console.log('[StreakContext] Activity recorded successfully, shouldShowModal:', result.shouldShowModal);
      }
      
      return { success: result.success, shouldShowModal: result.shouldShowModal };
    } catch (error) {
      console.error('[StreakContext] Error recording activity:', error);
      return { success: false, shouldShowModal: false };
    }
  };

  // Dismiss streak modal (mark as shown)
  const dismissStreakModal = () => {
    logEvent(AnalyticsEvents.STREAK_MODAL_DISMISSED, {
      currentStreak: streakData?.currentStreak || 0,
      longestStreak: streakData?.longestStreak || 0,
    });
  };

  // Claim reward
  const claimReward = async (): Promise<boolean> => {
    if (!user?.uid || !isStreaksEnabledForUser(user?.uid)) {
      console.log('[StreakContext] Cannot claim reward: no user or streaks disabled');
      return false;
    }

    try {
      console.log('[StreakContext] Claiming reward');
      
      const success = await firebaseStreaksService.claimAdFreeReward(user.uid);
      
      if (success) {
        // Refresh all data
        await loadStreakData();
        console.log('[StreakContext] Reward claimed successfully');
      } else {
        // Log failure for debugging
        logEvent(AnalyticsEvents.STREAK_REWARD_CLAIMED, {
          success: false,
          error: 'claim_failed',
        });
      }
      
      return success;
    } catch (error) {
      console.error('[StreakContext] Error claiming reward:', error);
      return false;
    }
  };

  // Refresh streak data
  const refreshStreakData = async (): Promise<void> => {
    await loadStreakData();
  };

  // Check ad-free status
  const checkAdFreeStatus = async (): Promise<boolean> => {
    if (!user?.uid || !isStreaksEnabledForUser(user?.uid)) {
      return false;
    }

    try {
      const isAdFree = await firebaseStreaksService.isAdFreeActive(user.uid);
      setAdFreeStatus({
        isActive: isAdFree,
        expiresAt: streakData?.adFreeReward.expiresAt || null,
      });
      
      logEvent(AnalyticsEvents.AD_FREE_STATUS_CHECKED, {
        isActive: isAdFree,
        expiresAt: streakData?.adFreeReward.expiresAt || null,
      });
      
      return isAdFree;
    } catch (error) {
      console.error('[StreakContext] Error checking ad-free status:', error);
      return false;
    }
  };

  const setStreakModalVisibility = (visible: boolean) => {
    if (visible) {
      enqueue('streak');
      logEvent(AnalyticsEvents.STREAK_MODAL_SHOWN, {
        currentStreak: streakData?.currentStreak,
        longestStreak: streakData?.longestStreak,
        hasPendingReward: streakData?.adFreeReward.earned,
        trigger: 'manual',
      });
    }
  };

  // Use a streak freeze (premium feature)
  const useStreakFreeze = async (): Promise<boolean> => {
    if (!user?.uid || !isPremium) {
      console.log('[StreakContext] Cannot use streak freeze: no user or not premium');
      return false;
    }

    try {
      const success = await firebaseStreaksService.useStreakFreeze(user.uid);
      
      if (success) {
        // Refresh data to get updated freeze count
        await loadStreakData();
      }
      
      return success;
    } catch (error) {
      console.error('[StreakContext] Error using streak freeze:', error);
      return false;
    }
  };

  const value: StreakContextType = {
    streakData,
    weeklyActivity,
    adFreeStatus,
    isLoading,
    hasPendingReward,
    streakFreeze,
    recordActivity,
    claimReward,
    refreshStreakData,
    checkAdFreeStatus,
    dismissStreakModal,
    setStreakModalVisibility,
    useStreakFreeze,
  };

  return (
    <StreakContext.Provider value={value}>
      {children}
    </StreakContext.Provider>
  );
};

// Hook to use the context
export const useStreak = (): StreakContextType => {
  const context = useContext(StreakContext);
  if (context === undefined) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
};
