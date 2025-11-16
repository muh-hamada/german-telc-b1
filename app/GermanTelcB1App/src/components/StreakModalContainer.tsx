import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStreak } from '../contexts/StreakContext';
import StreakModal from './StreakModal';
import StreakRewardModal from './StreakRewardModal';
import { ENABLE_STREAKS } from '../config/development.config';

/**
 * Container component that manages the display of streak modals
 * - Shows streak modal after first activity of the day
 * - Shows reward modal when 7-day streak is achieved
 * - Persists reward modal if not claimed
 */
const StreakModalContainer: React.FC = () => {
  const { user } = useAuth();
  const { streakData, hasPendingReward, claimReward } = useStreak();
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [hasShownStreakToday, setHasShownStreakToday] = useState(false);

  // Check for pending reward on mount and when user/pending status changes
  useEffect(() => {
    if (!ENABLE_STREAKS || !user) {
      return;
    }

    // Show reward modal if user has pending reward
    if (hasPendingReward) {
      console.log('[StreakModalContainer] User has pending reward, showing modal');
      setShowRewardModal(true);
    }
  }, [user, hasPendingReward]);

  // Listen for streak data changes that indicate modal should be shown
  useEffect(() => {
    if (!ENABLE_STREAKS || !user || !streakData) {
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Check if modal should be shown today
    if (streakData.streakModalShownToday && 
        streakData.lastStreakModalDate === today && 
        !hasShownStreakToday) {
      console.log('[StreakModalContainer] Showing streak modal for today');
      setShowStreakModal(true);
      setHasShownStreakToday(true);
    }
  }, [streakData, user, hasShownStreakToday]);

  // Reset daily flag when date changes
  useEffect(() => {
    const checkDate = () => {
      const today = new Date().toISOString().split('T')[0];
      if (streakData && streakData.lastStreakModalDate !== today) {
        setHasShownStreakToday(false);
      }
    };

    // Check every minute for date change
    const interval = setInterval(checkDate, 60000);
    return () => clearInterval(interval);
  }, [streakData]);

  const handleCloseStreakModal = () => {
    setShowStreakModal(false);
  };

  const handleCloseRewardModal = () => {
    // Don't close reward modal - it should persist until claimed
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
        visible={showStreakModal}
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

