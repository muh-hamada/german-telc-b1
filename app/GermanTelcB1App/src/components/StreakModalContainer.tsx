import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStreak } from '../contexts/StreakContext';
import { useRemoteConfig } from '../contexts/RemoteConfigContext';
import StreakModal from './StreakModal';
import StreakRewardModal from './StreakRewardModal';
import { REWARD_MODAL_SUCCESS_DURATION } from '../constants/streak.constants';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

/**
 * Container component that manages the display of streak modals
 * - Shows streak modal when shouldShowStreakModal flag is set in StreakContext
 * - Shows reward modal when user has pending reward
 * - All state management is handled by StreakContext (no local state needed)
 */
const StreakModalContainer: React.FC = () => {
  const { user } = useAuth();
  const { config } = useRemoteConfig();
  const { 
    streakData, 
    hasPendingReward, 
    shouldShowStreakModal,
    claimReward,
    dismissStreakModal 
  } = useStreak();
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [hasShownRewardModalThisSession, setHasShownRewardModalThisSession] = useState(false);

  // Show reward modal when user has pending reward
  useEffect(() => {
    if (!config?.enableStreaks || !user) {
      return;
    }

    // Only show once per session
    if (hasPendingReward && !hasShownRewardModalThisSession) {
      console.log('[StreakModalContainer] User has pending reward, showing modal');
      setShowRewardModal(true);
      setHasShownRewardModalThisSession(true);
    }
    
    // Reset flag when reward is no longer pending
    if (!hasPendingReward) {
      setHasShownRewardModalThisSession(false);
    }
  }, [user, hasPendingReward, hasShownRewardModalThisSession]);

  const handleCloseStreakModal = () => {
    console.log('[StreakModalContainer] Dismissing streak modal');
    logEvent(AnalyticsEvents.STREAK_MODAL_DISMISSED);
    dismissStreakModal();
  };

  const handleCloseRewardModal = () => {
    // Don't close reward modal permanently - it should persist until claimed
    // User can dismiss it with "Later" button but it will show again
    console.log('[StreakModalContainer] Reward modal dismissed, will show again next time');
    logEvent(AnalyticsEvents.STREAK_REWARD_MODAL_DISMISSED);
    setShowRewardModal(false);
  };

  const handleClaimReward = async () => {
    const success = await claimReward();
    if (success) {
      // Modal will auto-close via its internal timer, update container state after
      setTimeout(() => {
        setShowRewardModal(false);
      }, REWARD_MODAL_SUCCESS_DURATION + 100);
    }
    return success;
  };

  if (!config?.enableStreaks || !user) {
    return null;
  }

  return (
    <>
      <StreakModal
        visible={shouldShowStreakModal}
        streakData={streakData}
        onContinue={handleCloseStreakModal}
        onClose={handleCloseStreakModal}
      />
      
      <StreakRewardModal
        visible={showRewardModal}
        currentStreak={streakData?.currentStreak || 0}
        onClaim={handleClaimReward}
        onClose={handleCloseRewardModal}
      />
    </>
  );
};

export default StreakModalContainer;

