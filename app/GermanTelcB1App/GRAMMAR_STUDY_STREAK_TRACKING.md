# Grammar Study - Streak Activity Tracking

## Change Summary

Modified the Grammar Study screen to reward users with **1 streak activity point for every 15 questions answered** instead of tracking each individual question.

## Problem

Previously, the Grammar Study screen was recording a streak activity for **every single question** answered, which meant:
- Users could get multiple activity points in a short time
- Streak progress was too easy to achieve
- Not consistent with the effort required

## Solution

Implemented a **session-based counter** that:
1. ✅ Tracks how many questions the user answers in the current session
2. ✅ Records 1 streak activity **only after every 15 questions**
3. ✅ Resets the counter automatically (using modulo operator)
4. ✅ Persists across the session (until app is closed/screen is left)

---

## Implementation Details

### New State Variable

```typescript
// Track questions answered in this session for streak activity
const [sessionQuestionsAnswered, setSessionQuestionsAnswered] = useState(0);
```

### Updated Logic in `handleAnswerSelect`

**Before:**
```typescript
// Record streak activity for EVERY question
if (ENABLE_STREAKS && user?.uid) {
  const activityId = `grammar-study-${currentQuestionIndex}`;
  await recordActivity('grammar_study', activityId, isCorrect ? 1 : 0);
}
```

**After:**
```typescript
// Increment session question counter
const newSessionCount = sessionQuestionsAnswered + 1;
setSessionQuestionsAnswered(newSessionCount);

// Record streak activity every 15 questions
if (ENABLE_STREAKS && user?.uid && newSessionCount % 15 === 0) {
  const activityId = `grammar-study-session-${Date.now()}`;
  await recordActivity('grammar_study', activityId, 1);
  console.log(`[GrammarStudyScreen] Streak activity recorded after ${newSessionCount} questions`);
}
```

---

## How It Works

### Session Flow Example:

```
User opens Grammar Study screen
sessionQuestionsAnswered = 0

User answers Question 1 → sessionQuestionsAnswered = 1  (no activity recorded)
User answers Question 2 → sessionQuestionsAnswered = 2  (no activity recorded)
...
User answers Question 14 → sessionQuestionsAnswered = 14 (no activity recorded)
User answers Question 15 → sessionQuestionsAnswered = 15 ✅ (1 activity recorded!)

User answers Question 16 → sessionQuestionsAnswered = 16 (no activity recorded)
...
User answers Question 30 → sessionQuestionsAnswered = 30 ✅ (1 activity recorded!)

User answers Question 31 → sessionQuestionsAnswered = 31 (no activity recorded)
...
User answers Question 45 → sessionQuestionsAnswered = 45 ✅ (1 activity recorded!)
```

### Key Points:

1. **Counter persists during session** - As long as the user stays on the Grammar Study screen
2. **Counter resets on screen exit** - When user leaves or closes the app
3. **Uses modulo operator** - `newSessionCount % 15 === 0` checks if divisible by 15
4. **Unique activity IDs** - Uses timestamp to ensure uniqueness: `grammar-study-session-${Date.now()}`

---

## Benefits

### ✅ Balanced Reward System
- Users need to invest meaningful time (15 questions) to earn 1 activity
- Prevents gaming the system by answering just a few questions

### ✅ Encourages Longer Study Sessions
- Motivates users to complete at least 15 questions per session
- Promotes better learning habits

### ✅ Consistent with Other Activities
- Exam completion = 1 activity
- Practice completion = 1 activity
- 15 grammar questions = 1 activity ✅ (now consistent!)

### ✅ Fair Progression
- Users who study more get more activities
- But not so easy that the 7-day streak becomes trivial

---

## Testing Checklist

- [x] Answer 1-14 questions → No streak activity recorded
- [x] Answer 15th question → 1 streak activity recorded ✅
- [x] Answer 16-29 questions → No additional activity
- [x] Answer 30th question → 2nd activity recorded ✅
- [x] Leave screen and return → Counter resets to 0
- [x] Check DailyStreaksCard updates after 15 questions
- [x] Verify modal shows after first 15 questions of the day

---

## Configuration

If you want to change the threshold (currently 15 questions), modify this line:

```typescript
// In handleAnswerSelect function
if (ENABLE_STREAKS && user?.uid && newSessionCount % 15 === 0) {
  //                                                    ^^
  //                                    Change this number
```

**Recommended values:**
- `10` - More frequent rewards (easier)
- `15` - Balanced (current) ✅
- `20` - Less frequent rewards (harder)
- `25` - Challenging

---

## Files Modified

- ✅ `src/screens/practice/GrammarStudyScreen.tsx`
  - Added `sessionQuestionsAnswered` state
  - Modified `handleAnswerSelect` to track and reward every 15 questions

---

## Status: ✅ COMPLETE

Grammar Study now rewards 1 streak activity for every 15 questions answered, creating a balanced and fair progression system!

