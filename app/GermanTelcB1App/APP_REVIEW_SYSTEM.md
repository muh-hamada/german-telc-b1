# App Review System Documentation

## Overview

A comprehensive app review prompt system that intelligently requests user ratings after positive experiences. The system is designed to maximize positive reviews while respecting user preferences and avoiding over-prompting.

## Features

✅ **Smart Triggering**: Prompts only after positive experiences (score ≥ 80%)
✅ **Cooldown Period**: 7-day minimum between prompts
✅ **Dismissal Tracking**: Stops prompting after 3 dismissals
✅ **One-Time Rating**: Never prompts again after user rates
✅ **Multi-Language Support**: Translations for all 6 supported languages
✅ **Analytics Integration**: Tracks all review-related events
✅ **Beautiful UI**: Engaging modal with modern design

## Architecture

### Components

1. **ReviewService** (`src/services/review.service.ts`)
   - Core logic for eligibility checking
   - Storage management for review state
   - Configuration for thresholds and cooldowns

2. **ReviewContext** (`src/contexts/ReviewContext.tsx`)
   - Global state management
   - Action handlers (request, dismiss, complete)
   - Event listener integration

3. **AppReviewModal** (`src/components/AppReviewModal.tsx`)
   - Beautiful UI modal component
   - Multi-language support via i18next
   - Configurable buttons and messaging

4. **ReviewTrigger** (`src/utils/reviewTrigger.ts`)
   - Event emitter for triggering reviews
   - Decouples review logic from business logic

5. **AppRating Utility** (`src/utils/appRating.ts`)
   - Opens native app store for rating
   - Platform-specific URL handling

## Trigger Points

The system is integrated at two key trigger points:

### 1. After Exam Completion (`ProgressContext`)
```typescript
// Triggered in updateExamProgress when:
// - User completes any exam
// - Score ≥ 80% (configurable)
reviewTrigger.trigger(score, maxScore);
```

### 2. After Marking as Complete (`CompletionContext`)
```typescript
// Triggered in toggleCompletion when:
// - User marks an exam as completed
reviewTrigger.trigger(score, 100);
```

## Configuration

### App Store IDs

**IMPORTANT**: Update these values in `src/utils/appRating.ts`:

```typescript
const APP_STORE_ID = 'YOUR_APP_STORE_ID'; // iOS App Store ID
const PLAY_STORE_ID = 'YOUR_PACKAGE_NAME'; // Android package name
```

#### How to find your IDs:

**iOS App Store ID:**
1. Go to App Store Connect
2. Navigate to your app
3. The App ID is in the URL: `...apps/[YOUR_APP_ID]`
4. Example: `123456789`

**Android Package Name:**
1. It's in your `android/app/build.gradle`
2. Look for `applicationId`
3. Example: `com.yourcompany.germantelcb1app`

### Review Thresholds

Update in `src/services/review.service.ts`:

```typescript
const CONFIG = {
  MIN_SCORE_PERCENTAGE: 80,  // Minimum score to trigger (80%)
  COOLDOWN_DAYS: 7,          // Days between prompts
  MAX_DISMISS_COUNT: 3,      // Max dismissals before stopping
};
```

## Storage Keys

The system uses AsyncStorage with these keys:

- `@review_last_prompt_date`: Last time prompt was shown
- `@review_completed`: Whether user has rated
- `@review_dismissed_count`: Number of times dismissed

## Analytics Events

The following events are tracked:

```typescript
REVIEW_PROMPT_SHOWN       // When modal is displayed
REVIEW_PROMPT_DISMISSED   // When user clicks "Maybe Later"
REVIEW_COMPLETED          // When user clicks "Rate the App"
```

Event parameters include:
- `score`: User's score
- `maxScore`: Maximum possible score
- `percentage`: Score as percentage
- `success`: Whether store opened successfully

## Translations

Review prompts are translated into all supported languages:

| Language | Code | Title Key | Message Key |
|----------|------|-----------|-------------|
| English  | en   | review.title | review.message |
| German   | de   | review.title | review.message |
| Arabic   | ar   | review.title | review.message |
| Spanish  | es   | review.title | review.message |
| French   | fr   | review.title | review.message |
| Russian  | ru   | review.title | review.message |

## Testing

### Test the Review Prompt

```typescript
// In your component or screen
import { reviewTrigger } from '../utils/reviewTrigger';

// Trigger with high score (will show if eligible)
reviewTrigger.trigger(90, 100);
```

### Reset Review Data (Development Only)

```typescript
import reviewService from '../services/review.service';

// Reset all review data
await reviewService.resetReviewData();
```

### Check Review Stats

```typescript
const stats = await reviewService.getReviewStats();
console.log('Review Stats:', stats);
// {
//   hasReviewed: false,
//   dismissCount: 2,
//   lastPromptDate: Date,
//   daysSinceLastPrompt: 3
// }
```

## User Flow

```
User completes exam with score ≥ 80%
         ↓
ReviewTrigger fires
         ↓
ReviewContext checks eligibility:
  - Has user already rated? → Don't show
  - Dismissed 3+ times? → Don't show
  - Shown in last 7 days? → Don't show
  - Otherwise → Show modal
         ↓
User sees beautiful modal:
  - "Rate the App" → Opens store & marks complete
  - "Maybe Later" → Increments dismiss count
```

## Best Practices

### DO:
✅ Trigger after genuinely positive experiences
✅ Respect user's decision to dismiss
✅ Test with different languages
✅ Monitor analytics to optimize thresholds

### DON'T:
❌ Trigger immediately on app launch
❌ Prompt during frustrating experiences
❌ Ask repeatedly after user declines
❌ Block user interaction while showing prompt

## Customization

### Change Modal Appearance

Edit `src/components/AppReviewModal.tsx`:
- Colors are from `src/styles/theme`
- Icon can be changed (currently ⭐)
- Button styling in `styles` object

### Modify Trigger Logic

Edit `src/services/review.service.ts`:
- Add custom eligibility rules
- Change score thresholds
- Implement A/B testing

### Add New Trigger Points

```typescript
// In any component or context
import { reviewTrigger } from '../utils/reviewTrigger';

// Trigger when appropriate
reviewTrigger.trigger(userScore, maxScore);
```

## Troubleshooting

### Modal not showing?

1. Check console logs: `[ReviewService]` and `[ReviewContext]`
2. Verify eligibility with `reviewService.shouldShowReviewPrompt()`
3. Ensure score ≥ 80% threshold
4. Check if already reviewed or dismissed 3+ times

### Store not opening?

1. Verify App Store IDs are set correctly
2. Check console for `[AppRating]` errors
3. Test on physical device (not simulator)
4. Ensure proper platform permissions

### Wrong language showing?

1. Check i18next configuration
2. Verify translation keys exist in all locale files
3. Look for console errors from i18next

## Future Enhancements

Potential improvements for the future:

- [ ] In-app rating API (iOS 10.3+ / Android 5.0+)
- [ ] A/B testing for message variants
- [ ] Different thresholds per exam type
- [ ] Sentiment analysis for writing responses
- [ ] Rate limiting based on user segments
- [ ] Custom timing strategies (e.g., after 3rd success)

## Support

For issues or questions about the review system:
1. Check console logs for `[Review*]` prefixed messages
2. Review analytics events in Firebase
3. Use `reviewService.getReviewStats()` for debugging

---

**Last Updated**: October 2025
**Version**: 1.0.0

