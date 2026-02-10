/**
 * Modal Queue Renderer
 * 
 * Renders the current modal from the queue based on its type.
 * Connects queued modals to their respective context handlers.
 */

import React, { useEffect, useState } from 'react';
import { useAppUpdate } from '../contexts/AppUpdateContext';
import { useAuth } from '../contexts/AuthContext';
import { useModalQueue } from '../contexts/ModalQueueContext';
import { useCrossAppPromotion } from '../contexts/CrossAppPromotionContext';
import { useNotificationReminder } from '../contexts/NotificationReminderContext';
import { usePremium } from '../contexts/PremiumContext';
import { useRemoteConfig } from '../contexts/RemoteConfigContext';
import { useReview } from '../contexts/ReviewContext';
import { useStreak } from '../contexts/StreakContext';

// Import modal components
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import { DEFAULT_NOTIFICATION_HOUR } from '../services/firestore.service';
import { ReportedIssueDetails } from '../services/issue-report.service';
import premiumPromptService from '../services/premium-prompt.service';
import AppReviewModal from './AppReviewModal';
import AppUpdateModal from './AppUpdateModal';
import CrossAppPromotionModal from './CrossAppPromotionModal';
import HourPickerModal from './HourPickerModal';
import { IssueUpdateNotificationModal } from './IssueUpdateNotificationModal';
import NotificationReminderModal from './NotificationReminderModal';
import PremiumUpsellModal from './PremiumUpsellModal';
import StreakModal from './StreakModal';
import StreakRewardModal from './StreakRewardModal';

const ModalQueueRenderer: React.FC = () => {
  const { currentModal, dismissCurrentModal } = useModalQueue();
  const { user } = useAuth();
  const { isStreaksEnabledForUser, isPremiumFeaturesEnabled } = useRemoteConfig();
  const { isPremium, isPurchasing, purchasePremium, productPrice, productCurrency } = usePremium();
  
  // Get context data and handlers
  const { updateInfo, dismissUpdate, openAppStore } = useAppUpdate();
  const { dismissReview, completeReview } = useReview();
  const { 
    dismissReminder, 
    startEnableFlow, 
    handleHourSelect,
  } = useNotificationReminder();
  const { 
    streakData, 
    claimReward,
    dismissStreakModal,
  } = useStreak();
  const {
    heroApp: promoHeroApp,
    additionalApps: promoAdditionalApps,
    handleMaybeLater: promoHandleMaybeLater,
    handleAppClick: promoHandleAppClick,
    isManualTrigger: promoIsManualTrigger,
  } = useCrossAppPromotion();

  // Track reward modal state
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardClaimSuccessful, setRewardClaimSuccessful] = useState(false);

  // Reset reward modal state when current modal changes
  useEffect(() => {
    if (currentModal?.type === 'streak-reward') {
      setShowRewardModal(true);
      setRewardClaimSuccessful(false);
    } else {
      setShowRewardModal(false);
      setRewardClaimSuccessful(false);
    }
  }, [currentModal?.type]);

  if (!currentModal) {
    return null;
  }

  // Handler for app update modals
  const handleAppUpdateDismiss = () => {
    dismissUpdate();
    dismissCurrentModal();
  };

  const handleAppUpdateNow = () => {
    openAppStore();
    // Don't dismiss - user might return from app store
  };

  // Handler for app review modal
  const handleReviewDismiss = () => {
    dismissReview();
    dismissCurrentModal();
  };

  const handleReviewRate = () => {
    completeReview();
    dismissCurrentModal();
  };

  // Handler for notification reminder modal
  const handleNotificationDismiss = () => {
    dismissReminder();
    dismissCurrentModal();
  };

  const handleNotificationEnable = async () => {
    // Wait for permission flow to complete before dismissing
    // startEnableFlow will enqueue 'hour-picker' if permission is granted
    await startEnableFlow();
    dismissCurrentModal();
  };

  // Handler for hour picker modal
  const handleHourPickerClose = () => {
    dismissCurrentModal();
  };

  const handleHourPickerSelect = (hour: number) => {
    handleHourSelect(hour);
    dismissCurrentModal();
  };

  // Handler for streak modal
  const handleStreakDismiss = () => {
    // dismissStreakModal handles analytics logging
    dismissStreakModal();
    dismissCurrentModal();
  };

  // Handler for streak reward modal
  const handleRewardDismiss = () => {
    // Only log dismiss event if this wasn't a successful claim
    // (the modal auto-closes after successful claim animation)
    if (!rewardClaimSuccessful) {
      logEvent(AnalyticsEvents.STREAK_REWARD_MODAL_DISMISSED);
    }
    setShowRewardModal(false);
    dismissCurrentModal();
  };

  const handleClaimReward = async () => {
    const success = await claimReward();
    if (success) {
      // Mark as successful claim so dismiss handler doesn't log incorrect event
      setRewardClaimSuccessful(true);
      // The modal will auto-close via its internal timer calling onClose
      // We don't need our own timer since the modal handles it
    }
    return success;
  };

  // Handler for premium upsell modal
  const handlePremiumUpsellDismiss = async () => {
    // Only record dismiss if user is not premium (they dismissed the purchase offer)
    if (!isPremium) {
      await premiumPromptService.recordModalDismiss();
      logEvent(AnalyticsEvents.PREMIUM_UPSELL_MODAL_DISMISSED, {
        price: productPrice,
        currency: productCurrency,
      });
    }
    dismissCurrentModal();
  };

  const handlePremiumUpsellPurchase = async () => {
    logEvent(AnalyticsEvents.PREMIUM_UPSELL_PURCHASE_CLICKED, {
      price: productPrice,
      currency: productCurrency,
    });
    const success = await purchasePremium('PremiumUpsellModal');
    if (success) {
      await premiumPromptService.recordPurchase();
      // Don't dismiss automatically - let the modal show AlreadyPremiumView
      // User can close it with the close button
    }
  };

  // Render based on modal type
  switch (currentModal.type) {
    case 'app-update-forced':
    case 'app-update-available':
      if (!updateInfo) return null;
      return (
        <AppUpdateModal
          visible={true}
          isForced={currentModal.type === 'app-update-forced'}
          currentVersion={updateInfo.currentVersion}
          latestVersion={updateInfo.latestVersion}
          message={updateInfo.message}
          onUpdateNow={handleAppUpdateNow}
          onLater={handleAppUpdateDismiss}
        />
      );

    case 'app-review':
      return (
        <AppReviewModal
          visible={true}
          onClose={handleReviewDismiss}
          onRate={handleReviewRate}
          onDismiss={handleReviewDismiss}
        />
      );

    case 'notification-reminder':
      return (
        <NotificationReminderModal
          visible={true}
          onClose={handleNotificationDismiss}
          onEnable={handleNotificationEnable}
          onMaybeLater={handleNotificationDismiss}
        />
      );

    case 'hour-picker':
      return (
        <HourPickerModal
          visible={true}
          selectedHour={currentModal.data?.selectedHour || DEFAULT_NOTIFICATION_HOUR}
          onClose={handleHourPickerClose}
          onHourSelect={handleHourPickerSelect}
        />
      );

    case 'streak':
      // Check if streaks are enabled for user
      if (!isStreaksEnabledForUser(user?.uid) || !user) {
        dismissCurrentModal();
        return null;
      }
      return (
        <StreakModal
          visible={true}
          streakData={streakData}
          onContinue={handleStreakDismiss}
          onClose={handleStreakDismiss}
        />
      );

    case 'streak-reward':
      // Check if streaks are enabled for user
      if (!isStreaksEnabledForUser(user?.uid) || !user) {
        dismissCurrentModal();
        return null;
      }
      return (
        <StreakRewardModal
          visible={showRewardModal}
          currentStreak={streakData?.currentStreak || 0}
          onClaim={handleClaimReward}
          onClose={handleRewardDismiss}
        />
      );

    case 'premium-upsell':
      // Don't show if premium features are disabled
      if (!isPremiumFeaturesEnabled()) {
        dismissCurrentModal();
        return null;
      }
      // Note: We don't check isPremium here anymore because we want to show
      // AlreadyPremiumView after successful purchase. User closes with the close button.
      return (
        <PremiumUpsellModal
          visible={true}
          onClose={handlePremiumUpsellDismiss}
          onPurchase={handlePremiumUpsellPurchase}
          isPurchasing={isPurchasing}
          sourceScreen="PremiumUpsellModal"
        />
      );

    case 'issue-updates':
      const updatedReports = (currentModal.data?.updatedReports || []) as ReportedIssueDetails[];
      
      const handleIssueUpdatesDismiss = () => {
        dismissCurrentModal();
      };

      return (
        <IssueUpdateNotificationModal
          visible={true}
          onClose={handleIssueUpdatesDismiss}
          updatedReports={updatedReports}
        />
      );

    case 'cross-app-promotion':
      if (!promoHeroApp) {
        dismissCurrentModal();
        return null;
      }
      const handlePromoDismiss = async () => {
        await promoHandleMaybeLater();
        dismissCurrentModal();
      };
      const handlePromoAppClick = (appId: string, isHero: boolean) => {
        promoHandleAppClick(appId, isHero);
      };
      return (
        <CrossAppPromotionModal
          visible={true}
          heroApp={promoHeroApp}
          additionalApps={promoAdditionalApps}
          onMaybeLater={handlePromoDismiss}
          onAppClick={handlePromoAppClick}
          isManualTrigger={promoIsManualTrigger}
        />
      );

    default:
      console.warn(`[ModalQueueRenderer] Unknown modal type: ${currentModal.type}`);
      return null;
  }
};

export default ModalQueueRenderer;

