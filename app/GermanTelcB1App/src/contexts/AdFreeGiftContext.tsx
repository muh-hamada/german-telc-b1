/**
 * Ad-Free Gift Context
 * 
 * Manages the ad-free day loyalty gift feature:
 * - Initializes on app launch
 * - Checks eligibility using remote config flag
 * - Schedules modal to appear 1 minute after session start
 * - Manages reward claiming
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { usePremium } from './PremiumContext';
import { useStreak } from './StreakContext';
import { useRemoteConfig } from './RemoteConfigContext';
import { useModalQueue } from './ModalQueueContext';
import adFreeGiftService from '../services/ad-free-gift.service';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import { FORCE_AD_FREE_GIFT_ELIGIBLE } from '../config/development.config';

interface AdFreeGiftContextType {
  // State
  isEligible: boolean;
  isRewardClaimed: boolean;
  
  // Actions
  claimReward: () => Promise<boolean>;
  resetRewardState: () => void;
}

const AdFreeGiftContext = createContext<AdFreeGiftContextType | undefined>(undefined);

interface AdFreeGiftProviderProps {
  children: ReactNode;
}

export const AdFreeGiftProvider: React.FC<AdFreeGiftProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const { adFreeStatus, streakData } = useStreak();
  const { config } = useRemoteConfig();
  const { enqueue } = useModalQueue();
  
  const [isEligible, setIsEligible] = useState(false);
  const [isRewardClaimed, setIsRewardClaimed] = useState(false);
  const hasScheduledModalRef = useRef(false);
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCheckingRef = useRef(false); // Prevent multiple concurrent checks

  /**
   * Check eligibility on mount and when dependencies change
   */
  const checkEligibility = useCallback(async () => {
    // Prevent multiple concurrent checks
    if (isCheckingRef.current) {
      return;
    }
    
    isCheckingRef.current = true;
    
    try {
      // Development mode: force eligible for testing
      if (FORCE_AD_FREE_GIFT_ELIGIBLE) {
        console.log('[AdFreeGift] FORCE_AD_FREE_GIFT_ELIGIBLE is true, forcing eligible');
        setIsEligible(true);
        
        if (!hasScheduledModalRef.current) {
          scheduleModal();
        }
        return;
      }

      // Feature flag check - disabled by default
      const isFeatureEnabled = config?.adFreeGiftEnabled ?? false;
      
      if (!isFeatureEnabled) {
        console.log('[AdFreeGift] Feature disabled by remote config');
        setIsEligible(false);
        return;
      }

      // Don't check if already scheduled
      if (hasScheduledModalRef.current) {
        return;
      }

      // Must have user (not anonymous)
      if (!user?.uid) {
        console.log('[AdFreeGift] No user, not eligible');
        setIsEligible(false);
        return;
      }

      // Record session first
      await adFreeGiftService.recordSession();
      
      // Check all eligibility criteria
      const eligibilityResult = await adFreeGiftService.checkEligibility(
        isPremium,
        adFreeStatus?.isActive || false,
        false, // hasStreakReward - we check streak count instead
        streakData?.currentStreak || 0
      );

      console.log('[AdFreeGift] Eligibility check:', eligibilityResult);
      
      setIsEligible(eligibilityResult.isEligible);
      
      // Log analytics event
      logEvent(AnalyticsEvents.AD_FREE_GIFT_ELIGIBILITY_CHECKED, {
        is_eligible: eligibilityResult.isEligible,
        reason: eligibilityResult.reason,
        session_count: eligibilityResult.sessionCount,
        days_since_last_reward: eligibilityResult.daysSinceLastReward,
        is_premium: isPremium,
        has_ad_free_reward: adFreeStatus?.isActive || false,
        current_streak: streakData?.currentStreak || 0,
      });

      // Schedule modal if eligible (store result for modal shown event)
      if (eligibilityResult.isEligible && !hasScheduledModalRef.current) {
        scheduleModal(eligibilityResult.sessionCount);
      }
    } catch (error) {
      console.error('[AdFreeGift] Error checking eligibility:', error);
      setIsEligible(false);
    } finally {
      isCheckingRef.current = false;
    }
  }, [user?.uid, isPremium, adFreeStatus?.isActive, streakData?.currentStreak, config?.adFreeGiftEnabled]);

  /**
   * Schedule modal to appear after delay
   */
  const scheduleModal = useCallback((sessionCount?: number) => {
    const delay = adFreeGiftService.getConfig().MODAL_DELAY_MS;
    
    console.log(`[AdFreeGift] Scheduling modal in ${delay}ms`);
    hasScheduledModalRef.current = true;
    
    modalTimerRef.current = setTimeout(() => {
      console.log('[AdFreeGift] Showing modal');
      enqueue('ad-free-gift');
      
      logEvent(AnalyticsEvents.AD_FREE_GIFT_MODAL_SHOWN, {
        user_type: 'free',
        session_count: sessionCount,
        timestamp: Date.now(),
      });
    }, delay);
  }, [enqueue]);

  /**
   * Claim the reward
   */
  const claimReward = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[AdFreeGift] Claiming reward');
      
      if (!user?.uid) {
        console.error('[AdFreeGift] No user ID - this should not happen as modal checks for user');
        return false;
      }
      
      console.log('[AdFreeGift] User ID:', user.uid);
      
      // Grant standalone ad-free day (24 hours) via frequent user reward service
      console.log('[AdFreeGift] Importing service...');
      const frequentUserRewardService = (await import('../services/frequent-user-reward.service')).default;
      console.log('[AdFreeGift] Service imported:', typeof frequentUserRewardService);
      console.log('[AdFreeGift] Service has grantAdFreeDay:', typeof frequentUserRewardService.grantAdFreeDay);
      
      console.log('[AdFreeGift] Calling grantAdFreeDay with userId:', user.uid);
      const success = await frequentUserRewardService.grantAdFreeDay(user.uid, 24, 'gift');
      console.log('[AdFreeGift] grantAdFreeDay returned:', success);
      
      if (success) {
        // Record that reward was given
        await adFreeGiftService.recordRewardGiven();
        setIsRewardClaimed(true);
        
        logEvent(AnalyticsEvents.AD_FREE_GIFT_CLAIMED, {
          timestamp: Date.now(),
        });
        
        console.log('[AdFreeGift] Reward claimed successfully');
        return true;
      } else {
        console.error('[AdFreeGift] Failed to activate ad-free day');
        return false;
      }
    } catch (error) {
      console.error('[AdFreeGift] Error claiming reward:', error);
      console.error('[AdFreeGift] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[AdFreeGift] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[AdFreeGift] Error stack:', error instanceof Error ? error.stack : 'No stack');
      return false;
    }
  }, [user?.uid]);

  /**
   * Reset reward state (for modal transitions)
   */
  const resetRewardState = useCallback(() => {
    setIsRewardClaimed(false);
  }, []);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    // In force mode, skip dependency checks and run immediately
    if (FORCE_AD_FREE_GIFT_ELIGIBLE) {
      checkEligibility();
    } else {
      // Wait for dependencies to be loaded
      if (!user?.uid || isPremium === undefined || !streakData) {
        return;
      }
      checkEligibility();
    }

    // Cleanup timeout on unmount
    return () => {
      // DO NOT clear the timer on unmount to survive remounts
      // The timer should only be cleared when the modal is shown or app is truly closed
    };
  }, [checkEligibility, user?.uid, isPremium, streakData]);

  const value: AdFreeGiftContextType = useMemo(() => ({
    isEligible,
    isRewardClaimed,
    claimReward,
    resetRewardState,
  }), [isEligible, isRewardClaimed, claimReward, resetRewardState]);

  return (
    <AdFreeGiftContext.Provider value={value}>
      {children}
    </AdFreeGiftContext.Provider>
  );
};

// Hook to use the context
export const useAdFreeGift = (): AdFreeGiftContextType => {
  const context = useContext(AdFreeGiftContext);
  if (context === undefined) {
    throw new Error('useAdFreeGift must be used within an AdFreeGiftProvider');
  }
  return context;
};
