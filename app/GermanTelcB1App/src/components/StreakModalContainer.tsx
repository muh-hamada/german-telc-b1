import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStreak } from '../contexts/StreakContext';
import StreakModal from './StreakModal';
import StreakRewardModal from './StreakRewardModal';
import { ENABLE_STREAKS } from '../config/development.config';

/**
 * Container component that manages the display of streak modals
 * - Shows streak modal when shouldShowStreakModal flag is set in StreakContext
 * - Shows reward modal when user has pending reward
 * - All state management is handled by StreakContext (no local state needed)
 */
const StreakModalContainer: React.FC = () => {
  const { user } = useAuth();
  const { 
    streakData, 
    hasPendingReward, 
    shouldShowStreakModal,
    claimReward,
    dismissStreakModal 
  } = useStreak();
  const [showRewardModal, setShowRewardModal] = useState(false);

  // Show reward modal when user has pending reward
  useEffect(() => {
    if (!ENABLE_STREAKS || !user) {
      return;
    }

    if (hasPendingReward) {
      console.log('[StreakModalContainer] User has pending reward, showing modal');
      setShowRewardModal(true);
    }
  }, [user, hasPendingReward]);

  const handleCloseStreakModal = () => {
    console.log('[StreakModalContainer] Dismissing streak modal');
    dismissStreakModal();
  };

  const handleCloseRewardModal = () => {
    // Don't close reward modal permanently - it should persist until claimed
    // User can dismiss it with "Later" button but it will show again
    console.log('[StreakModalContainer] Reward modal dismissed, will show again next time');
    setShowRewardModal(false);
  };

  const handleClaimReward = async () => {
    const success = await claimReward();
    return success;
  };

  if (!ENABLE_STREAKS || !user) {
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

