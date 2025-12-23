/**
 * Modal Queue Context
 * 
 * Centralized queue manager for global modals.
 * - Shows modals one at a time with configurable delay
 * - Supports priority ordering
 * - Pauses when contextual (screen-level) modals are active
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { GlobalModalType, QueuedModal, ModalQueueContextValue } from '../types/modal-queue.types';
import { MODAL_PRIORITIES, MODAL_QUEUE_CONFIG } from '../constants/modal-queue.constants';

const ModalQueueContext = createContext<ModalQueueContextValue | undefined>(undefined);

interface ModalQueueProviderProps {
  children: ReactNode;
}

export const ModalQueueProvider: React.FC<ModalQueueProviderProps> = ({ children }) => {
  const [queue, setQueue] = useState<QueuedModal[]>([]);
  const [currentModal, setCurrentModal] = useState<QueuedModal | null>(null);
  const [isContextualModalActive, setIsContextualModalActive] = useState(false);
  // Use ref for isProcessing to avoid re-render race condition
  // When isProcessing was state, calling setIsProcessing(true) would trigger a re-render,
  // causing the useEffect cleanup to run and clear the timeout before it could fire
  const isProcessingRef = useRef(false);
  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentModalRef = useRef<QueuedModal | null>(null);

  // Keep ref in sync with state for use in enqueue callback
  useEffect(() => {
    currentModalRef.current = currentModal;
  }, [currentModal]);

  // Generate unique ID for each modal
  const generateId = useCallback(() => {
    return `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Enqueue a modal
  const enqueue = useCallback((type: GlobalModalType, data?: Record<string, any>): string => {
    const id = generateId();
    const priority = MODAL_PRIORITIES[type];
    
    const newModal: QueuedModal = {
      id,
      type,
      priority,
      data,
      enqueuedAt: Date.now(),
    };

    setQueue(prev => {
      // Check for duplicates (same type already in queue or showing)
      const isDuplicate = prev.some(m => m.type === type) || currentModalRef.current?.type === type;
      if (isDuplicate) {
        console.log(`[ModalQueue] Duplicate ${type} ignored`);
        return prev;
      }
      
      console.log(`[ModalQueue] Enqueued ${type} with priority ${priority}`);
      return [...prev, newModal];
    });

    return id;
  }, [generateId]);

  // Remove a modal from queue
  const dequeue = useCallback((id: string) => {
    setQueue(prev => prev.filter(m => m.id !== id));
  }, []);

  // Clear entire queue
  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentModal(null);
  }, []);

  // Dismiss current modal and process next
  const dismissCurrentModal = useCallback(() => {
    console.log(`[ModalQueue] Dismissed ${currentModal?.type}`);
    setCurrentModal(null);
  }, [currentModal]);

  // Set contextual modal active state
  const setContextualModalActiveCallback = useCallback((active: boolean) => {
    console.log(`[ModalQueue] Contextual modal active: ${active}`);
    setIsContextualModalActive(active);
  }, []);

  // Process queue - show next modal after delay
  useEffect(() => {
    // Don't process if:
    // - Already showing a modal
    // - Queue is empty
    // - A contextual modal is active
    // - Already processing (in delay period)
    if (currentModal || queue.length === 0 || isContextualModalActive || isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;

    // Add delay before showing next modal
    processingTimeoutRef.current = setTimeout(() => {
      setQueue(prevQueue => {
        if (prevQueue.length === 0) {
          isProcessingRef.current = false;
          return prevQueue;
        }

        // Sort by priority (highest first), then by enqueue time (oldest first)
        const sorted = [...prevQueue].sort((a, b) => {
          if (b.priority !== a.priority) {
            return b.priority - a.priority;
          }
          return a.enqueuedAt - b.enqueuedAt;
        });

        const next = sorted[0];
        
        console.log(`[ModalQueue] Showing ${next.type} (priority: ${next.priority})`);
        setCurrentModal(next);
        isProcessingRef.current = false;
        
        return prevQueue.filter(m => m.id !== next.id);
      });
    }, MODAL_QUEUE_CONFIG.DELAY_BETWEEN_MODALS);

    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        isProcessingRef.current = false;
      }
    };
  }, [currentModal, queue, isContextualModalActive]);

  const value: ModalQueueContextValue = {
    enqueue,
    dequeue,
    clearQueue,
    currentModal,
    dismissCurrentModal,
    setContextualModalActive: setContextualModalActiveCallback,
    isContextualModalActive,
    queueLength: queue.length,
    isProcessing: isProcessingRef.current,
  };

  return (
    <ModalQueueContext.Provider value={value}>
      {children}
    </ModalQueueContext.Provider>
  );
};

export const useModalQueue = (): ModalQueueContextValue => {
  const context = useContext(ModalQueueContext);
  if (!context) {
    throw new Error('useModalQueue must be used within a ModalQueueProvider');
  }
  return context;
};

