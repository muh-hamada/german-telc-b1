import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';
import { useStreak } from '../contexts/StreakContext';
import { useRemoteConfig } from '../contexts/RemoteConfigContext';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

const AD_FREE_EXPIRY_KEY = 'ad_free_reward_expires_at';

// Module-scoped listener set: allows any code to trigger a re-check
// of the reward ad-free status across all mounted useAdFreeStatus consumers.
const refreshListeners = new Set<() => void>();

const triggerAdFreeRefresh = () => {
  refreshListeners.forEach(listener => listener());
};

/**
 * Grant a reward ad-free period. Persists expiry to AsyncStorage
 * and immediately notifies all banner ad consumers to hide.
 */
export const grantRewardAdFree = async (durationHours: number) => {
  const expiresAt = Date.now() + durationHours * 60 * 60 * 1000;
  await AsyncStorage.setItem(AD_FREE_EXPIRY_KEY, String(expiresAt));
  logEvent(AnalyticsEvents.AD_FREE_REWARD_GRANTED, {
    duration_hours: durationHours,
    expires_at: expiresAt,
  });
  triggerAdFreeRefresh();
};

/**
 * Hook to check if user should see ads based on premium status,
 * streak rewards, and reward ad-free periods
 */
export const useAdFreeStatus = () => {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const { adFreeStatus } = useStreak();
  const { isStreaksEnabledForUser } = useRemoteConfig();
  const [isRewardAdFreeActive, setIsRewardAdFreeActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to external refresh triggers
  useEffect(() => {
    const listener = () => setRefreshKey(k => k + 1);
    refreshListeners.add(listener);
    return () => { refreshListeners.delete(listener); };
  }, []);

  // Check reward ad-free status from AsyncStorage
  useEffect(() => {
    const check = async () => {
      setIsLoading(true);
      try {
        const raw = await AsyncStorage.getItem(AD_FREE_EXPIRY_KEY);
        if (raw) {
          const expiresAt = Number(raw);
          const now = Date.now();
          if (expiresAt > now) {
            setIsRewardAdFreeActive(true);
            logEvent(AnalyticsEvents.AD_FREE_REWARD_STATUS_CHECKED, {
              is_active: true,
              remaining_minutes: Math.round((expiresAt - now) / 60000),
            });
          } else {
            // Expired — clean up
            setIsRewardAdFreeActive(false);
            await AsyncStorage.removeItem(AD_FREE_EXPIRY_KEY);
            logEvent(AnalyticsEvents.AD_FREE_REWARD_EXPIRED, {
              expired_at: expiresAt,
            });
          }
        } else {
          setIsRewardAdFreeActive(false);
        }
      } catch (error) {
        console.error('[useAdFreeStatus] Error checking reward ad-free status:', error);
        setIsRewardAdFreeActive(false);
      } finally {
        setIsLoading(false);
      }
    };
    check();
  }, [refreshKey]);

  // Check if user has any active ad-free period
  const isAdFree =
    isPremium ||
    isRewardAdFreeActive ||
    (isStreaksEnabledForUser(user?.uid) && adFreeStatus.isActive);

  return {
    isAdFree,
    isPremium,
    isRewardAdFreeActive,
    isStreakAdFreeActive: isStreaksEnabledForUser(user?.uid) && adFreeStatus.isActive,
    isLoading,
  };
};
