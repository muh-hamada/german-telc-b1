# Modal Queue Manager - Implementation Plan

## Problem Statement

The app currently has multiple global modals (App Update, Notification Reminder, Streak, App Review) that are triggered independently by their own contexts. This leads to:

1. **Modal stacking** - Multiple modals appearing simultaneously
2. **Poor UX** - No controlled delay between modals
3. **Unpredictable ordering** - No priority system
4. **Conflict with contextual modals** - Global modals can interrupt screen-specific flows

### Current Architecture

```
App.tsx
├── AppUpdateProvider → AppUpdateModalContainer
├── ReviewProvider → ReviewModalContainer
├── NotificationReminderProvider → NotificationReminderModalContainer
└── StreakProvider → StreakModalContainer

Each context independently controls its modal visibility.
```

---

## Solution: Modal Queue Manager

A centralized queue manager that:
- Collects all global modal display requests
- Shows modals one at a time with configurable delay
- Supports priority ordering
- Pauses when contextual (screen-level) modals are active

---

## Modal Classification

### Global Modals (Managed by Queue)
| Modal | Current Context | Priority |
|-------|-----------------|----------|
| Forced App Update | AppUpdateContext | 100 (highest) |
| App Update Available | AppUpdateContext | 50 |
| Notification Reminder | NotificationReminderContext | 30 |
| Streak Modal | StreakContext | 25 |
| Streak Reward Modal | StreakContext | 24 |
| App Review | ReviewContext | 10 (lowest) |

### Contextual Modals (Stay in Screens - Not Queued)
| Modal | Location |
|-------|----------|
| VocabularyCompletionModal | VocabularyStudyNewScreen, VocabularyReviewScreen |
| ResultsModal | ListeningPart1-3, ReadingPart1-3, GrammarPart1-2 screens |
| Writing Evaluation Modal | WritingUI component |
| ExamSelectionModal | PracticeMenuScreen, ListeningMenuScreen, etc. |
| LoginModal/LoginPromptModal | Various screens |
| LanguageSelectorModal | SettingsScreen, OnboardingScreen |
| PersonaSelectorModal | OnboardingScreen |
| DeleteAccountModal | ProfileScreen |
| HourPickerModal | NotificationReminderModalContainer (sub-modal) |

---

## File Structure

```
src/
├── contexts/
│   ├── ModalQueueContext.tsx          # NEW - Main queue manager
│   ├── AppUpdateContext.tsx           # MODIFY - Use queue instead of direct show
│   ├── ReviewContext.tsx              # MODIFY - Use queue instead of direct show
│   ├── NotificationReminderContext.tsx # MODIFY - Use queue instead of direct show
│   └── StreakContext.tsx              # MODIFY - Use queue instead of direct show
├── components/
│   ├── ModalQueueRenderer.tsx         # NEW - Renders queued modals
│   ├── AppUpdateModalContainer.tsx    # DELETE - Merged into ModalQueueRenderer
│   ├── ReviewModalContainer.tsx       # DELETE - Merged into ModalQueueRenderer
│   ├── NotificationReminderModalContainer.tsx # DELETE - Merged into ModalQueueRenderer
│   ├── StreakModalContainer.tsx       # DELETE - Merged into ModalQueueRenderer
│   └── ... (existing modal components stay)
├── types/
│   └── modal-queue.types.ts           # NEW - Type definitions
└── constants/
    └── modal-queue.constants.ts       # NEW - Configuration constants
```

---

## Implementation Details

### 1. Type Definitions (`src/types/modal-queue.types.ts`)

```typescript
export type GlobalModalType =
  | 'app-update-forced'
  | 'app-update-available'
  | 'notification-reminder'
  | 'hour-picker'
  | 'streak'
  | 'streak-reward'
  | 'app-review';

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
```

### 2. Constants (`src/constants/modal-queue.constants.ts`)

```typescript
export const MODAL_PRIORITIES: Record<GlobalModalType, number> = {
  'app-update-forced': 100,
  'app-update-available': 50,
  'notification-reminder': 30,
  'streak': 25,
  'streak-reward': 24,
  'hour-picker': 23, // Sub-modal of notification reminder
  'app-review': 10,
};

export const MODAL_QUEUE_CONFIG = {
  // Delay between modals in milliseconds
  DELAY_BETWEEN_MODALS: 1000,
  
  // Maximum modals to show per session (0 = unlimited)
  MAX_MODALS_PER_SESSION: 0,
  
  // Delay before showing first modal after app launch
  INITIAL_DELAY: 2000,
};
```

### 3. Modal Queue Context (`src/contexts/ModalQueueContext.tsx`)

```typescript
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { GlobalModalType, QueuedModal, ModalQueueContextValue } from '../types/modal-queue.types';
import { MODAL_PRIORITIES, MODAL_QUEUE_CONFIG } from '../constants/modal-queue.constants';

const ModalQueueContext = createContext<ModalQueueContextValue | undefined>(undefined);

export const ModalQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<QueuedModal[]>([]);
  const [currentModal, setCurrentModal] = useState<QueuedModal | null>(null);
  const [isContextualModalActive, setIsContextualModalActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate unique ID for each modal
  const generateId = () => `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
      const isDuplicate = prev.some(m => m.type === type) || currentModal?.type === type;
      if (isDuplicate) {
        console.log(`[ModalQueue] Duplicate ${type} ignored`);
        return prev;
      }
      
      console.log(`[ModalQueue] Enqueued ${type} with priority ${priority}`);
      return [...prev, newModal];
    });

    return id;
  }, [currentModal]);

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
    if (currentModal || queue.length === 0 || isContextualModalActive || isProcessing) {
      return;
    }

    setIsProcessing(true);

    // Add delay before showing next modal
    processingTimeoutRef.current = setTimeout(() => {
      // Sort by priority (highest first), then by enqueue time (oldest first)
      const sorted = [...queue].sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return a.enqueuedAt - b.enqueuedAt;
      });

      const next = sorted[0];
      
      console.log(`[ModalQueue] Showing ${next.type} (priority: ${next.priority})`);
      setCurrentModal(next);
      setQueue(prev => prev.filter(m => m.id !== next.id));
      setIsProcessing(false);
    }, MODAL_QUEUE_CONFIG.DELAY_BETWEEN_MODALS);

    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, [currentModal, queue, isContextualModalActive, isProcessing]);

  const value: ModalQueueContextValue = {
    enqueue,
    dequeue,
    clearQueue,
    currentModal,
    dismissCurrentModal,
    setContextualModalActive: setContextualModalActiveCallback,
    isContextualModalActive,
    queueLength: queue.length,
    isProcessing,
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
```

### 4. Modal Queue Renderer (`src/components/ModalQueueRenderer.tsx`)

```typescript
import React from 'react';
import { useModalQueue } from '../contexts/ModalQueueContext';
import { useAppUpdate } from '../contexts/AppUpdateContext';
import { useReview } from '../contexts/ReviewContext';
import { useNotificationReminder } from '../contexts/NotificationReminderContext';
import { useStreak } from '../contexts/StreakContext';

// Import modal components
import AppUpdateModal from './AppUpdateModal';
import AppReviewModal from './AppReviewModal';
import NotificationReminderModal from './NotificationReminderModal';
import HourPickerModal from './HourPickerModal';
import StreakModal from './StreakModal';
import StreakRewardModal from './StreakRewardModal';

const ModalQueueRenderer: React.FC = () => {
  const { currentModal, dismissCurrentModal } = useModalQueue();
  
  // Get context data and handlers
  const { updateInfo, dismissUpdate, openAppStore } = useAppUpdate();
  const { dismissReview, completeReview } = useReview();
  const { dismissReminder, startEnableFlow, handleHourSelect } = useNotificationReminder();
  const { streakData, dismissStreakModal, claimReward } = useStreak();

  if (!currentModal) {
    return null;
  }

  const handleDismiss = () => {
    // Call type-specific dismiss handler, then dismiss from queue
    switch (currentModal.type) {
      case 'app-update-forced':
      case 'app-update-available':
        dismissUpdate();
        break;
      case 'app-review':
        dismissReview();
        break;
      case 'notification-reminder':
        dismissReminder();
        break;
      case 'streak':
        dismissStreakModal();
        break;
      // streak-reward and hour-picker handled separately
    }
    dismissCurrentModal();
  };

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
          onUpdateNow={() => {
            openAppStore();
            dismissCurrentModal();
          }}
          onLater={handleDismiss}
        />
      );

    case 'app-review':
      return (
        <AppReviewModal
          visible={true}
          onClose={handleDismiss}
          onRate={() => {
            completeReview();
            dismissCurrentModal();
          }}
          onDismiss={handleDismiss}
        />
      );

    case 'notification-reminder':
      return (
        <NotificationReminderModal
          visible={true}
          onClose={handleDismiss}
          onEnable={() => {
            startEnableFlow();
            dismissCurrentModal();
          }}
          onMaybeLater={handleDismiss}
        />
      );

    case 'hour-picker':
      return (
        <HourPickerModal
          visible={true}
          selectedHour={currentModal.data?.selectedHour || 9}
          onClose={handleDismiss}
          onHourSelect={(hour) => {
            handleHourSelect(hour);
            dismissCurrentModal();
          }}
        />
      );

    case 'streak':
      return (
        <StreakModal
          visible={true}
          streakData={streakData}
          onContinue={handleDismiss}
          onClose={handleDismiss}
        />
      );

    case 'streak-reward':
      return (
        <StreakRewardModal
          visible={true}
          currentStreak={streakData?.currentStreak || 0}
          onClaim={async () => {
            const success = await claimReward();
            if (success) {
              // Wait for reward animation, then dismiss
              setTimeout(() => dismissCurrentModal(), 2000);
            }
            return success;
          }}
          onClose={handleDismiss}
        />
      );

    default:
      console.warn(`[ModalQueueRenderer] Unknown modal type: ${currentModal.type}`);
      return null;
  }
};

export default ModalQueueRenderer;
```

---

## Migration Guide

### Step 1: Update App.tsx

```typescript
// Before
import AppUpdateModalContainer from './src/components/AppUpdateModalContainer';
import NotificationReminderModalContainer from './src/components/NotificationReminderModalContainer';
import ReviewModalContainer from './src/components/ReviewModalContainer';
import StreakModalContainer from './src/components/StreakModalContainer';

// After
import { ModalQueueProvider } from './src/contexts/ModalQueueContext';
import ModalQueueRenderer from './src/components/ModalQueueRenderer';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <ModalQueueProvider>
        <RemoteConfigProvider>
          <AppUpdateProvider>
            <ReviewProvider>
              <AuthProvider>
                {/* ... other providers ... */}
                <RootNavigator />
                <ModalQueueRenderer />
                {/* REMOVE: Individual modal containers */}
              </AuthProvider>
            </ReviewProvider>
          </AppUpdateProvider>
        </RemoteConfigProvider>
      </ModalQueueProvider>
    </SafeAreaProvider>
  );
};
```

### Step 2: Update AppUpdateContext.tsx

```typescript
// Before: Manages showModal state internally
const [shouldShowUpdateModal, setShouldShowUpdateModal] = useState(false);

// Somewhere in the context:
setShouldShowUpdateModal(true);

// After: Enqueue to modal queue
import { useModalQueue } from './ModalQueueContext';

const { enqueue } = useModalQueue();

// When update is detected:
if (updateInfo.isForced) {
  enqueue('app-update-forced', { updateInfo });
} else {
  enqueue('app-update-available', { updateInfo });
}

// Remove: shouldShowUpdateModal state
// Remove: Any direct modal visibility control
```

### Step 3: Update ReviewContext.tsx

```typescript
// Before
const [showReviewModal, setShowReviewModal] = useState(false);
setShowReviewModal(true);

// After
const { enqueue } = useModalQueue();
enqueue('app-review');
```

### Step 4: Update NotificationReminderContext.tsx

```typescript
// Before
const [showReminderModal, setShowReminderModal] = useState(false);
setShowReminderModal(true);

// After
const { enqueue } = useModalQueue();
enqueue('notification-reminder');

// For HourPicker (after notification flow):
enqueue('hour-picker', { selectedHour: 9 });
```

### Step 5: Update StreakContext.tsx

```typescript
// Before
const [shouldShowStreakModal, setShouldShowStreakModal] = useState(false);

// After
const { enqueue } = useModalQueue();

// When streak activity is recorded:
enqueue('streak');

// When reward is pending:
enqueue('streak-reward');
```

### Step 6: Update Screens with Contextual Modals

For screens that show contextual modals (VocabularyReviewScreen, etc.):

```typescript
import { useModalQueue } from '../contexts/ModalQueueContext';

const VocabularyReviewScreen: React.FC = () => {
  const { setContextualModalActive } = useModalQueue();
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const handleReviewComplete = () => {
    // Pause global modal queue
    setContextualModalActive(true);
    setShowCompletionModal(true);
    
    // Record streak activity (will enqueue modal, but won't show yet)
    recordActivity('vocabulary_review');
  };

  const handleCompletionModalClose = () => {
    setShowCompletionModal(false);
    // Resume global modal queue
    setContextualModalActive(false);
  };

  return (
    <>
      {/* ... screen content ... */}
      <VocabularyCompletionModal
        visible={showCompletionModal}
        onClose={handleCompletionModalClose}
        // ...
      />
    </>
  );
};
```

---

## Implementation Order

### Phase 1: Core Infrastructure
- [ ] Create `src/types/modal-queue.types.ts`
- [ ] Create `src/constants/modal-queue.constants.ts`
- [ ] Create `src/contexts/ModalQueueContext.tsx`
- [ ] Create `src/components/ModalQueueRenderer.tsx`

### Phase 2: Integrate with App
- [ ] Update `App.tsx` - Add ModalQueueProvider and ModalQueueRenderer
- [ ] Keep existing modal containers temporarily (for fallback)

### Phase 3: Migrate Contexts (One at a Time)
- [ ] Migrate `AppUpdateContext.tsx` - Enqueue instead of direct show
- [ ] Test app update modal flow
- [ ] Migrate `ReviewContext.tsx`
- [ ] Test app review modal flow
- [ ] Migrate `NotificationReminderContext.tsx`
- [ ] Test notification reminder flow
- [ ] Migrate `StreakContext.tsx`
- [ ] Test streak modal flow

### Phase 4: Handle Contextual Modals
- [ ] Update `VocabularyStudyNewScreen.tsx` - Add setContextualModalActive
- [ ] Update `VocabularyReviewScreen.tsx` - Add setContextualModalActive
- [ ] Update screens with `ResultsModal` - Add setContextualModalActive
- [ ] Update `WritingUI.tsx` - Add setContextualModalActive for evaluation modal

### Phase 5: Cleanup
- [ ] Remove `AppUpdateModalContainer.tsx`
- [ ] Remove `ReviewModalContainer.tsx`
- [ ] Remove `NotificationReminderModalContainer.tsx`
- [ ] Remove `StreakModalContainer.tsx`
- [ ] Remove unused state variables from migrated contexts

### Phase 6: Testing & Polish
- [ ] Test multiple modals queuing correctly
- [ ] Test priority ordering
- [ ] Test delay between modals
- [ ] Test contextual modal pausing
- [ ] Test edge cases (rapid triggers, app backgrounding, etc.)

---

## Configuration Options

The queue behavior can be tuned via `MODAL_QUEUE_CONFIG`:

```typescript
DELAY_BETWEEN_MODALS: 1000,  // 1 second between modals
MAX_MODALS_PER_SESSION: 0,   // No limit (set to 3-5 for less intrusive UX)
INITIAL_DELAY: 2000,         // 2 seconds after app launch before first modal
```

---

## Edge Cases to Handle

1. **App backgrounding** - Clear processing timeout when app goes to background
2. **Forced app update** - Should bypass queue and show immediately
3. **Modal dismissal during animation** - Ensure proper cleanup
4. **Same modal enqueued twice** - Deduplication by type
5. **Context not ready** - Handle case where context data isn't loaded yet

---

## Analytics Events to Add

```typescript
// New events for modal queue
MODAL_QUEUE_ENQUEUED: 'modal_queue_enqueued',
MODAL_QUEUE_SHOWN: 'modal_queue_shown',
MODAL_QUEUE_DISMISSED: 'modal_queue_dismissed',
MODAL_QUEUE_DUPLICATE_IGNORED: 'modal_queue_duplicate_ignored',
```

---

## Rollback Plan

If issues arise:
1. Keep old modal container files (don't delete until stable)
2. Add feature flag in RemoteConfig to toggle between old/new system
3. Can revert by removing ModalQueueProvider and restoring individual containers

