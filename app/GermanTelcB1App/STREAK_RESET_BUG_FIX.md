# Streak Reset Bug Fix

## Problem

Users could skip a day without practicing, and when they opened the app the next day, their streak count would still be maintained. This violated the fundamental concept of streaks requiring daily consistency.

### Example Scenario:
- User practiced on Monday (2 activities), Tuesday (4 activities), and Wednesday (1 activity)
- User had a 3-day streak
- User did NOT practice on Thursday
- When user opened the app on Friday, the streak still showed 3/7 days
- **Expected**: Streak should reset to 0
- **Actual**: Streak remained at 3

## Root Cause

The streak validation logic only ran when a user **recorded a new activity**. This meant:
1. When the user opened the app without doing any activity, the streak was never checked
2. The `getStreakData()` function simply loaded the data from the database without validating if the streak should be broken
3. The `checkAndUpdateStreak()` function had a comment explicitly stating: *"If last activity was 2+ days ago, streak is broken (but we don't reset it here, that happens on next activity)"*

This caused the streak to persist even when the user missed a day, until they recorded their next activity.

## Solution

Modified the `getStreakData()` function in `firebase-streaks.service.ts` to:

1. **Check for broken streaks on load**: When loading streak data, immediately check if the last activity was more than 1 day ago
2. **Reset streak to 0**: If the user missed a day (last activity was NOT yesterday), reset `currentStreak` to 0
3. **Update database immediately**: Persist the reset to Firebase so it's reflected across all app instances
4. **Log analytics event**: Track when streaks are broken due to inactivity for monitoring purposes

### Implementation Details

```typescript
// Check if streak should be reset due to missed day(s)
const today = getLocalDateString();
if (completeData.lastActivityDate && 
    completeData.currentStreak > 0 && 
    !isSameDay(completeData.lastActivityDate, today)) {
  // Check if the last activity was yesterday (streak is still valid)
  if (!isConsecutiveDay(completeData.lastActivityDate, today)) {
    // Streak is broken - reset to 0
    console.log('[StreaksService] Streak broken due to inactivity.');
    completeData.currentStreak = 0;
    
    // Update the database immediately
    await firestore().doc(docPath).update({
      currentStreak: 0,
    });
    
    logEvent(AnalyticsEvents.STREAK_BROKEN, {
      previous_streak: streakData.currentStreak,
      reason: 'inactivity',
    });
  }
}
```

## Impact

✅ **Streaks now properly reset to 0 when a user misses a day**
✅ **Streak counts are validated on every app load, not just when recording activity**
✅ **Users see accurate streak information immediately upon opening the app**
✅ **Analytics events track streak breaks due to inactivity**

## Testing Scenarios

### Scenario 1: Missed Day
1. User practices on Day 1, 2, 3 (streak = 3)
2. User does NOT practice on Day 4
3. User opens app on Day 5
4. **Result**: Streak shows 0

### Scenario 2: Consecutive Days
1. User practices on Day 1, 2, 3 (streak = 3)
2. User opens app on Day 4 and practices
3. **Result**: Streak shows 4

### Scenario 3: Same Day Multiple Activities
1. User practices on Day 1 (streak = 1)
2. User practices again on Day 1
3. **Result**: Streak remains 1 (not incremented for same-day activities)

## Files Modified

- `app/GermanTelcB1App/src/services/firebase-streaks.service.ts` - Added streak validation logic to `getStreakData()` function

## Date

November 21, 2025

