# Development Plan: Onboarding Success Stories

## PRD Reference
- File: `onboarding-success-stories.md`
- Status: Draft / Ready for Engineering

## Overview
Add a social proof screen to the onboarding flow that shows animated, floating review cards sourced from Remote Config. The screen is guarded by a feature flag (`enable_onboarding_reviews_screen`) and sits between `OnboardingWelcome` and `OnboardingDisclaimer`. The admin dashboard gains a new panel under App Config to manage and import reviews from App Store Connect and Google Play APIs.

## Scope

### Mobile App (`app/GermanTelcB1App/`)
- **New screen:** `src/screens/OnboardingSuccessStoriesScreen.tsx`
- **Navigation:** `src/navigation/RootNavigator.tsx` — insert new route between `OnboardingWelcome` and `OnboardingDisclaimer`
- **Navigation types:** `src/types/navigation.types.ts` — add `OnboardingSuccessStories` to `RootStackParamList`
- **Remote Config types:** `src/types/remote-config.types.ts` — extend `GlobalConfig` with `enableOnboardingReviewsScreen` + `onboardingReviewsData`
- **Remote Config defaults:** `DEFAULT_GLOBAL_CONFIG` — add new fields with safe defaults
- **Remote Config service:** `src/services/firebase-remote-config.service.ts` — map new fields in `buildGlobalConfig`
- **Animation:** Custom floating animation engine inside the new screen (Animated API or Reanimated)

### Admin Dashboard (`app/admin-dashboard/`)
- **New panel block** inside `src/pages/ConfigPage.tsx` — "Onboarding Reviews" section
- **New modal component:** `src/components/OnboardingReviewsImportModal.tsx` — connects to App Store Connect & Google Play APIs
- **Remote Config types:** `src/types/remote-config.types.ts` — mirror the same `GlobalConfig` changes as the mobile app

## Data Schema (Remote Config — `global` doc)
```json
{
  "enable_onboarding_reviews_screen": false,
  "onboarding_reviews_data": [
    {
      "id": "rev_01",
      "user_name": "Sarah Kim",
      "avatar_url": "https://...",
      "rating": 5,
      "text": "The AI speaking assessment was incredible...",
      "source": "App Store"
    }
  ]
}
```

## Implementation Tasks

### Phase 1 — Types & Remote Config
- [x] Add `OnboardingReview` interface and extend `GlobalConfig` in mobile app `remote-config.types.ts`
- [x] Add same changes to admin dashboard `remote-config.types.ts`
- [x] Update `DEFAULT_GLOBAL_CONFIG` with safe defaults (`enableOnboardingReviewsScreen: false`, `onboardingReviewsData: []`)
- [x] Map new fields in `firebase-remote-config.service.ts` `buildGlobalConfig` method

### Phase 2 — Navigation
- [x] Add `OnboardingSuccessStories` route to `RootStackParamList` in `navigation.types.ts`
- [x] Register screen in `RootNavigator.tsx`
- [x] Update `OnboardingWelcomeScreen.tsx` navigation — after last step, check flag and navigate to `OnboardingSuccessStories` or skip to `OnboardingDisclaimer`

### Phase 3 — Mobile Screen
- [x] Create `OnboardingSuccessStoriesScreen.tsx` with static header/footer layout
- [x] Implement floating animation engine (Y-axis linear drift + X-axis sine wave + opacity fade zones)
- [x] Implement infinite loop queue logic (pre-fill viewport, recycle cards at top boundary)
- [x] Wire up Remote Config flag and review data
- [x] Add analytics events (`ONBOARDING_REVIEWS_SCREEN_VIEWED`, `ONBOARDING_REVIEWS_CONTINUE_CLICKED`)

### Phase 4 — Admin Dashboard
- [x] Add `OnboardingReviewsPanel` block to `ConfigPage.tsx` (list, reorder, save)
- [x] Create import modal inline in `ConfigPage.tsx` (App Store + Play Store review import, multi-select, avatar URL field, lazy-load pagination reusing `storeRatingsService.fetchReviews`)
- [x] Connect save to Firestore via existing `configService.saveGlobalConfig`

## Progress Log

### 2026-05-23 — Setup
- Organised feature folder: moved PRD + design image (`onboarding-success-stories.jpeg`) into `features/onboarding-success-stories/`
- Created development plan
- Explored codebase:
  - Onboarding flow: `Onboarding` → `OnboardingWelcome` (5 steps) → `Main`
  - Remote Config uses Firestore (`app_configs/global` for `GlobalConfig`)
  - `storeRatingsService.fetchReviews()` already exists with pagination — reused in admin import modal
  - No `react-native-reanimated` in project — used built-in `Animated` API

### 2026-05-23 — Implementation Complete
- **Phase 1**: Added `OnboardingReview` interface + `enableOnboardingReviewsScreen` / `onboardingReviewsData` to `GlobalConfig` in both mobile and admin dashboard type files. Updated `DEFAULT_GLOBAL_CONFIG` and `buildGlobalConfig`.
- **Phase 2 (Updated)**: Refactored `OnboardingSuccessStoriesScreen` into `OnboardingSuccessStoriesContent` and embedded it as a native step within `OnboardingWelcomeScreen.tsx` wizard flow.
- **Phase 3**: Created `OnboardingSuccessStoriesContent` — sine-wave animation engine using `Animated` API, pre-filled viewport queue with recycling, opacity fade zones, analytics events.
- **Phase 4**: Added "Onboarding Flow — Social Proof Reviews" section to `ConfigPage.tsx` — feature flag toggle, warning for <5 reviews, drag-reorder list, delete, import buttons. Import modal reuses `storeRatingsService.fetchReviews` with lazy-load pagination, multi-select, search/filter, per-card avatar URL field, platform switcher. Fixed AppId selection in admin importer to dynamically fetch reviews based on selected App context. Backend Function `store-ratings.ts` patched to properly omit optional string dates instead of defaulting dateless playstore reviews to current Date.
- **Phase 5 (Polish/Fixes)**: Refined density of UI items in the mobile flow (thinner text metrics, removed unused white space). Handled strict Right-To-Left (RTL - Arabic layout) constraints on the animating `<Animated.View>` arrays by shifting structural reliance from `left: X` to `start: X` values allowing symmetrical mathematical behavior during Native localization flipping. Modified the lifecycle constraints of Card Spawning (`SPAWN_Y` and `DEATH_Y`) to keep 100% of floating objects within the absolute boundary of the Container preventing overflow leakage on unclipped engines.

## Decisions & Notes
- **Animation Layout / RTL Logic**: To seamlessly support Arabic RTL positioning alongside an active JS animation loop calculating offsets relative to the viewport edge, the element mapping was converted from `left` positioning properties to React Native's generic `start` alignment layout parameters (resolving mathematically mirrored left/right anchors automatically).
- **Embedded vs Disconnected**: Merged the Social Proof step deep into the Onboarding Welcome carousel screen flow so it shares standard layout container metrics rather than behaving as an independent transition page.
- **Feature flag in `GlobalConfig`**: Reviews content is global across all apps, consistent with `onboardingImages`. Flag also lives in `global` doc.
- **Fallback default = `false`**: Guarantees no disruption to existing onboarding if Remote Config is unreachable.
- **Animation library**: Used React Native's built-in `Animated` API — `react-native-reanimated` is not in the project.
- **Sine wave approximation**: Since `Animated.sin` is not natively available, the sine curve is approximated as a 120-point piecewise-linear interpolation via `interpolate`. Accurate enough at 60 fps.
- **Navigation insertion point**: The reviews screen is inserted after `OnboardingWelcome` step 5 completes (both "Later" and "Dismiss premium modal" paths). The "Start Exam" path that leads directly to `MockExamRunning` is intentionally not intercepted — users who commit to premium skip straight to the app.
- **Admin import reuse**: `storeRatingsService.fetchReviews` (existing callable function `fetchAppStoreReviews`) supports both platforms with pagination — zero new backend code needed.
- **Avatar photos**: Store APIs don't provide user photos. The import modal exposes a per-card avatar URL text field. When blank, the mobile screen falls back to circular initials.
- **Max reviews**: Hard cap of 10 enforced on save (PRD: "up to 10 entries"). Warning shown when <5 while the flag is enabled.

## Open Questions
- Confirm whether `enableOnboardingReviewsScreen` should live in `GlobalConfig` (current approach) or app-specific `RemoteConfig`. Current assumption: global.
- The `fetchAppStoreReviews` Cloud Function is called with `appId: 'german-b1'` in the import modal. Should this be dynamic based on selected app, or is German B1 always the source? Needs product input.

## Completion Summary
Feature fully implemented across all four phases on 2026-05-23. All tasks complete. No new backend code required. The feature is entirely behind the `enableOnboardingReviewsScreen` Remote Config flag (default `false`) so it can be rolled out safely via the admin dashboard.
