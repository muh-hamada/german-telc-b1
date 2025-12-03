/**
 * Review Modal Container
 * 
 * A container component that manages the display of the AppReviewModal
 * using the ReviewContext state
 */

import React from 'react';
import AppReviewModal from './AppReviewModal';
import { useReview } from '../contexts/ReviewContext';

const ReviewModalContainer: React.FC = () => {
  const { showReviewModal, dismissReview, completeReview, closeReviewModal } = useReview();

  return (
    <AppReviewModal
      visible={showReviewModal}
      onClose={closeReviewModal}
      onRate={completeReview}
      onDismiss={dismissReview}
    />
  );
};

export default ReviewModalContainer;

