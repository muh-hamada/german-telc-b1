import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';
import { useStreak } from '../contexts/StreakContext';
import { useRemoteConfig } from '../contexts/RemoteConfigContext';

/**
 * Hook to check if user should see ads based on premium status,
 * streak rewards, and gift rewards
 */
export const useAdFreeStatus = () => {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const { adFreeStatus } = useStreak();
  const { isStreaksEnabledForUser } = useRemoteConfig();
  const [isGiftAdFreeActive, setIsGiftAdFreeActive] = useState(false);
  const [isGiftCheckLoading, setIsGiftCheckLoading] = useState(true);

  // Check gift ad-free status
  useEffect(() => {
    const checkGiftAdFree = async () => {
      setIsGiftCheckLoading(true);
      
      if (!user?.uid) {
        setIsGiftAdFreeActive(false);
        setIsGiftCheckLoading(false);
        return;
      }
      
      try {
        const { default: frequentUserRewardService } = await import('../services/frequent-user-reward.service');
        const isActive = await frequentUserRewardService.isAdFreeActive(user.uid);
        setIsGiftAdFreeActive(isActive);
      } catch (error) {
        console.error('[useAdFreeStatus] Error checking gift ad-free status:', error);
        setIsGiftAdFreeActive(false);
      } finally {
        setIsGiftCheckLoading(false);
      }
    };
    
    checkGiftAdFree();
  }, [user?.uid]);

  // Check if user has any active ad-free period
  const isAdFree = 
    isPremium || 
    isGiftAdFreeActive || 
    (isStreaksEnabledForUser(user?.uid) && adFreeStatus.isActive);

  return {
    isAdFree,
    isPremium,
    isGiftAdFreeActive,
    isStreakAdFreeActive: isStreaksEnabledForUser(user?.uid) && adFreeStatus.isActive,
    isLoading: isGiftCheckLoading,
  };
};
