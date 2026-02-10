/**
 * Modal Queue Types
 * 
 * Type definitions for the centralized modal queue manager
 */

export type GlobalModalType =
  | 'app-update-forced'
  | 'app-update-available'
  | 'notification-reminder'
  | 'hour-picker'
  | 'streak'
  | 'streak-reward'
  | 'app-review'
  | 'premium-upsell'
  | 'issue-updates'
  | 'cross-app-promotion';

export interface QueuedModal {
  id: string;
  type: GlobalModalType;
  priority: number;
  data?: Record<string, any>;
  enqueuedAt: number;
}

export interface ModalQueueContextValue {
  // Queue management
  enqueue: (type: GlobalModalType, data?: Record<string, any>) => string;
  dequeue: (id: string) => void;
  clearQueue: () => void;
  
  // Current modal state
  currentModal: QueuedModal | null;
  dismissCurrentModal: () => void;
  
  // Contextual modal coordination
  setContextualModalActive: (active: boolean) => void;
  isContextualModalActive: boolean;
  
  // Queue inspection (for debugging)
  queueLength: number;
  isProcessing: boolean;
}

