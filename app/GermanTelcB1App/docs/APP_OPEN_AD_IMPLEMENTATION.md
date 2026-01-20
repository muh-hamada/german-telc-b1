# App Open Ad Implementation

This document describes the implementation of AdMob App Open Ads in the application.

## Overview

App Open Ads are full-screen ads that appear when users launch or return to the app. They provide a monetization opportunity during natural app transition moments without disrupting the user experience.

## Implementation Details

### 1. Configuration Updates

#### Exam Config Types (`src/config/exam-config.types.ts`)
Added `appOpen` ad unit IDs to the `ExamConfig` type:

```typescript
ads: {
  // ... existing ad types
  appOpen: {
    android: string;
    ios: string;
  }
}
```

#### Exam Configs
Updated all exam configurations with App Open ad unit IDs:

- **German B1** (`src/config/exams/german-b1.config.ts`)
  - Android: `ca-app-pub-5101905792101482/2950422331`
  - iOS: `ca-app-pub-5101905792101482/3743338080`

- **German B2** (`src/config/exams/german-b2.config.ts`)
  - Android: `ca-app-pub-5101905792101482/7228656522`
  - iOS: `ca-app-pub-5101905792101482/1156519495`

- **German A1** (`src/config/exams/german-a1.config.ts`)
  - Android: `ca-app-pub-5101905792101482/4129893094`
  - iOS: `ca-app-pub-5101905792101482/8577033532`

- **English B1** (`src/config/exams/english-b1.config.ts`)
  - Android: `ca-app-pub-5101905792101482/6006939216`
  - iOS: `ca-app-pub-5101905792101482/6112855189`

- **English B2** (`src/config/exams/english-b2.config.ts`)
  - Android: `ca-app-pub-5101905792101482/5866423636`
  - iOS: `ca-app-pub-5101905792101482/1321332099`

### 2. App Open Ad Service (`src/services/app-open-ad.service.ts`)

A singleton service that manages the lifecycle of App Open Ads.

#### Key Features:
- **Ad Loading**: Preloads ads in the background for instant display
- **Smart Display Logic**: 
  - Respects premium status (no ads for premium users)
  - 4-hour cooldown between ads to prevent ad fatigue
  - Only shows when ad is fully loaded
- **Privacy Compliance**: Respects GDPR consent (uses `consentService.canShowPersonalizedAds()`)
- **Event Tracking**: Logs all ad events to analytics
- **Auto-reload**: Automatically loads next ad after showing current one

#### Main Methods:

```typescript
// Preload an ad in the background
appOpenAdService.loadAd(): Promise<void>

// Show ad if available and conditions are met
appOpenAdService.showAdIfAvailable(isPremium: boolean): Promise<boolean>

// Check if ad is ready to show
appOpenAdService.isAdLoaded(): boolean

// Reset cooldown (for testing)
appOpenAdService.resetCooldown(): void
```

#### Cooldown Logic:
- 4 hours (4 * 60 * 60 * 1000 ms) between ad displays
- Prevents showing ads too frequently
- Can be reset for testing purposes

### 3. Analytics Events (`src/services/analytics.events.ts`)

Added comprehensive analytics events for tracking app open ad performance:

```typescript
APP_OPEN_AD_REQUESTED: 'app_open_ad_requested',
APP_OPEN_AD_LOADED: 'app_open_ad_loaded',
APP_OPEN_AD_FAILED_TO_LOAD: 'app_open_ad_failed_to_load',
APP_OPEN_AD_SHOWN: 'app_open_ad_shown',
APP_OPEN_AD_CLOSED: 'app_open_ad_closed',
APP_OPEN_AD_ERROR: 'app_open_ad_error',
```

### 4. Integration in TabNavigator (`src/navigation/TabNavigator.tsx`)

The App Open Ad is displayed when users reach the main screen (TabNavigator).

#### Implementation:
1. **Preload on Mount**: Ad is loaded in the background when TabNavigator mounts
2. **Show After Delay**: After 1 second delay, attempts to show the ad (if conditions are met)
3. **Once Per Session**: Uses a ref to ensure ad is only shown once per app session

```typescript
// Preload ad
useEffect(() => {
  appOpenAdService.loadAd();
}, []);

// Show ad when reaching main screen (only once)
useEffect(() => {
  if (hasShownAppOpenAdRef.current) return;
  
  const timer = setTimeout(async () => {
    const wasShown = await appOpenAdService.showAdIfAvailable(isPremium);
    if (wasShown) {
      hasShownAppOpenAdRef.current = true;
    }
  }, 1000);
  
  return () => clearTimeout(timer);
}, [isPremium]);
```

## User Flow

### New Users:
1. User selects language (Language Selection Screen)
2. User completes onboarding (Onboarding Screens)
3. User reaches Main Screen (TabNavigator)
4. **→ App Open Ad shows after 1 second** (if not premium)
5. User continues to Home Screen

### Returning Users:
1. User opens app
2. App navigates to Main Screen (TabNavigator)
3. **→ App Open Ad shows after 1 second** (if conditions are met)
4. User continues to Home Screen

## Ad Display Conditions

An App Open Ad will be shown when ALL of the following conditions are met:

1. ✅ User is NOT a premium subscriber
2. ✅ Ad is fully loaded and ready to display
3. ✅ At least 4 hours have passed since the last ad was shown
4. ✅ Ad has not been shown in the current app session
5. ✅ No other ad is currently being displayed

## Testing

### Development Mode:
The service automatically uses `TestIds.APP_OPEN` in development mode, which shows Google's test ads.

### Testing Cooldown:
To test the ad multiple times:
```typescript
// Reset cooldown timer
appOpenAdService.resetCooldown();
```

### Testing Premium Status:
- Test with `isPremium = false` to see ads
- Test with `isPremium = true` to verify ads are not shown

## Performance Considerations

1. **Background Loading**: Ads are preloaded in the background to minimize impact on app startup time
2. **Cached Ads**: Once loaded, ads are kept in memory until shown
3. **Automatic Reload**: After showing an ad, the service automatically loads the next ad for future use
4. **Memory Management**: Service properly cleans up ad instances after display

## Privacy & Compliance

1. **GDPR Compliance**: Respects user consent preferences via `consentService.canShowPersonalizedAds()`
2. **Non-Personalized Ads**: If user declines personalized ads, shows non-personalized ads
3. **Premium Respect**: No ads are shown to premium subscribers

## Monitoring & Analytics

Track these metrics in Firebase Analytics:

- **Load Success Rate**: `APP_OPEN_AD_LOADED` / `APP_OPEN_AD_REQUESTED`
- **Show Rate**: `APP_OPEN_AD_SHOWN` / `APP_OPEN_AD_LOADED`
- **Error Rate**: `APP_OPEN_AD_ERROR` + `APP_OPEN_AD_FAILED_TO_LOAD`
- **User Engagement**: `APP_OPEN_AD_CLOSED` (how often users complete viewing)

## Future Enhancements

Potential improvements for future versions:

1. **Dynamic Cooldown**: Adjust cooldown based on user engagement
2. **A/B Testing**: Test different cooldown periods
3. **Frequency Capping**: Limit to X ads per day
4. **Smart Timing**: Show ads at better moments (e.g., after completing a task)
5. **Background/Foreground Detection**: Show ads when app returns from background

## Troubleshooting

### Ad Not Showing?

Check these common issues:

1. **Premium Status**: User might be premium
2. **Cooldown Active**: Last ad was shown less than 4 hours ago
3. **Ad Not Loaded**: Ad might still be loading
4. **Session Already Shown**: Ad was already shown in this session
5. **Test IDs**: In production, ensure using real ad unit IDs (not test IDs)

### Enable Debug Logging:

All service logs are prefixed with `[AppOpenAd]` for easy filtering:

```
[AppOpenAd] Service initialized with unit ID: ...
[AppOpenAd] Starting to load ad...
[AppOpenAd] Ad loaded successfully
[AppOpenAd] Showing app open ad...
```

## Related Files

- `src/services/app-open-ad.service.ts` - Main service implementation
- `src/navigation/TabNavigator.tsx` - Integration point
- `src/config/exam-config.types.ts` - Type definitions
- `src/config/exams/*.config.ts` - Exam-specific configurations
- `src/services/analytics.events.ts` - Analytics event definitions
