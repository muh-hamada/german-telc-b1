import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import firebaseStreaksService, { StreakData, WeeklyActivityData } from '../services/firebase-streaks.service';
import { useRemoteConfig } from './RemoteConfigContext';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

interface AdFreeStatus {
  isActive: boolean;
  expiresAt: number | null;
}

interface StreakContextType {
  // State
  streakData: StreakData | null;
  weeklyActivity: WeeklyActivityData[];
  adFreeStatus: AdFreeStatus;
  isLoading: boolean;
  hasPendingReward: boolean;
  shouldShowStreakModal: boolean; // NEW: Flag to trigger modal display
  
  // Actions
  recordActivity: (activityType: 'exam' | 'completion' | 'grammar_study', activityId?: string, score?: number) => Promise<{ success: boolean; shouldShowModal: boolean }>;
  claimReward: () => Promise<boolean>;
  refreshStreakData: () => Promise<void>;
  checkAdFreeStatus: () => Promise<boolean>;
  dismissStreakModal: () => void; // NEW: Mark modal as shown
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

interface StreakProviderProps {
  children: ReactNode;
}

export const StreakProvider: React.FC<StreakProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { isStreaksEnabledForUser } = useRemoteConfig();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityData[]>([]);
  const [adFreeStatus, setAdFreeStatus] = useState<AdFreeStatus>({ isActive: false, expiresAt: null });
  const [isLoading, setIsLoading] = useState(false);
  const [hasPendingReward, setHasPendingReward] = useState(false);
  const [shouldShowStreakModal, setShouldShowStreakModal] = useState(false);

  // Load streak data
  const loadStreakData = useCallback(async () => {
    if (!user?.uid || !isStreaksEnabledForUser(user?.uid)) {
      console.log('[StreakContext] No user or streaks disabled, clearing data');
      setStreakData(null);
      setWeeklyActivity([]);
      setAdFreeStatus({ isActive: false, expiresAt: null });
      setHasPendingReward(false);
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
      
      console.log('[StreakContext] Streak data loaded:', {
        currentStreak: data.currentStreak,
        hasPending: pending,
        isAdFree,
      });
    } catch (error) {
      console.error('[StreakContext] Error loading streak data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, isStreaksEnabledForUser]);

  // Load data when user changes
  useEffect(() => {
    loadStreakData();
  }, [loadStreakData]);

  // Record activity
  const recordActivity = async (
    activityType: 'exam' | 'completion' | 'grammar_study',
    activityId: string = '',
    score: number = 0
  ): Promise<{ success: boolean; shouldShowModal: boolean }> => {
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
        
        // Set flag to show modal if needed
        if (result.shouldShowModal) {
          setShouldShowStreakModal(true);
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
    setShouldShowStreakModal(false);
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

  const value: StreakContextType = {
    streakData,
    weeklyActivity,
    adFreeStatus,
    isLoading,
    hasPendingReward,
    shouldShowStreakModal,
    recordActivity,
    claimReward,
    refreshStreakData,
    checkAdFreeStatus,
    dismissStreakModal,
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

