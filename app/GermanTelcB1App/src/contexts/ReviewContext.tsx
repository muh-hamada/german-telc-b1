/**
 * Review Context
 * 
 * Manages app review prompt state and logic across the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import reviewService from '../services/review.service';
import { openAppRating } from '../utils/appRating';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import { reviewTrigger } from '../utils/reviewTrigger';

interface ReviewContextType {
  // State
  showReviewModal: boolean;
  
  // Actions
  requestReview: (score?: number, maxScore?: number) => Promise<void>;
  dismissReview: () => void;
  completeReview: () => Promise<void>;
  closeReviewModal: () => void;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

interface ReviewProviderProps {
  children: ReactNode;
}

export const ReviewProvider: React.FC<ReviewProviderProps> = ({ children }) => {
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Listen to review trigger events
  useEffect(() => {
    const unsubscribe = reviewTrigger.addListener((score, maxScore) => {
      requestReview(score, maxScore);
    });

    return unsubscribe;
  }, []); // Empty deps because requestReview is defined below and doesn't change

  /**
   * Request to show review prompt
   * Checks eligibility and shows modal if appropriate
   */
  const requestReview = async (score?: number, maxScore?: number): Promise<void> => {
    try {
      console.log('[ReviewContext] Review requested with score:', score, 'maxScore:', maxScore);
      
      // If score is provided, check if it's positive enough
      if (score !== undefined && maxScore !== undefined) {
        const isPositive = reviewService.isPositiveScore(score, maxScore);
        if (!isPositive) {
          console.log('[ReviewContext] Score not positive enough for review prompt');
          return;
        }
      }

      // Check if we should show the prompt
      const { shouldShow, reason } = await reviewService.shouldShowReviewPrompt();
      
      if (shouldShow) {
        console.log('[ReviewContext] Showing review prompt');
        setShowReviewModal(true);
        
        // Update last prompt date
        await reviewService.updateLastPromptDate();
        
        // Log analytics event
        logEvent(AnalyticsEvents.REVIEW_PROMPT_SHOWN, {
          score,
          maxScore,
          percentage: maxScore ? Math.round((score || 0) / maxScore * 100) : undefined,
        });
      } else {
        console.log('[ReviewContext] Not showing review prompt:', reason);
      }
    } catch (error) {
      console.error('[ReviewContext] Error requesting review:', error);
    }
  };

  /**
   * User dismissed the review prompt
   */
  const dismissReview = async (): Promise<void> => {
    try {
      await reviewService.recordDismissal();
      setShowReviewModal(false);
      
      // Log analytics event
      logEvent(AnalyticsEvents.REVIEW_PROMPT_DISMISSED, {});
      
      console.log('[ReviewContext] Review dismissed');
    } catch (error) {
      console.error('[ReviewContext] Error dismissing review:', error);
    }
  };

  /**
   * User chose to rate the app
   */
  const completeReview = async (): Promise<void> => {
    try {
      setShowReviewModal(false);
      
      // Open the app store for rating
      const success = await openAppRating();
      
      // Log analytics event
      logEvent(AnalyticsEvents.REVIEW_COMPLETED, {
        success,
      });

      if (success) {
        // Record that review is completed
        await reviewService.recordReviewCompleted();
      } else {
        console.error('[ReviewContext] Failed to open app store for rating');
      }
    } catch (error) {
      console.error('[ReviewContext] Error completing review:', error);
    } finally {
      setShowReviewModal(false);
    }
  };

  /**
   * Close the review modal without action (for testing)
   */
  const closeReviewModal = (): void => {
    setShowReviewModal(false);
  };

  const value: ReviewContextType = {
    showReviewModal,
    requestReview,
    dismissReview,
    completeReview,
    closeReviewModal,
  };

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
};

// Hook to use the context
export const useReview = (): ReviewContextType => {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error('useReview must be used within a ReviewProvider');
  }
  return context;
};

