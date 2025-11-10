/**
 * Review Trigger Utility
 * 
 * Simple event emitter for triggering review prompts from anywhere in the app
 */

type ReviewTriggerListener = (score?: number, maxScore?: number) => void;

class ReviewTrigger {
  private listeners: ReviewTriggerListener[] = [];

  /**
   * Register a listener for review trigger events
   */
  addListener(listener: ReviewTriggerListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Trigger a review request
   */
  trigger(score?: number, maxScore?: number): void {
    console.log('[ReviewTrigger] Triggering review request with score:', score, 'maxScore:', maxScore);
    this.listeners.forEach(listener => {
      try {
        listener(score, maxScore);
      } catch (error) {
        console.error('[ReviewTrigger] Error calling listener:', error);
      }
    });
  }
}

export const reviewTrigger = new ReviewTrigger();

