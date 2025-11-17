# Remote Config Gradual Rollout Guide

## Overview

The streak feature now supports gradual rollout with user whitelisting, allowing you to test with specific users before enabling for everyone.

## Configuration Structure

The remote configuration is stored in Firestore under the `app_configs` collection. Each document represents an app (identified by `appId`).

### Configuration Fields

```typescript
{
  appId: string;                      // e.g., "com.yourapp.id"
  enableStreaksForAllUsers: boolean;  // Global enable/disable flag
  streaksWhitelistedUserIDs: string[]; // Array of Firebase user IDs
  updatedAt: number;                  // Timestamp (milliseconds)
}
```

## How It Works

The app evaluates whether streaks are enabled for a user using this logic:

1. **If `enableStreaksForAllUsers` is `true`**: Streaks are enabled for ALL users
2. **If `enableStreaksForAllUsers` is `false`**: Streaks are enabled ONLY for users whose Firebase UID is in the `streaksWhitelistedUserIDs` array
3. **If no config is loaded**: Falls back to `ENABLE_STREAKS` value in `development.config.ts`

## Firebase Setup

### 1. Create the Collection

In your Firebase Console:

1. Go to Firestore Database
2. Create a collection named `app_configs`
3. Create a document with your app ID (e.g., `com.german.telcb1`)

### 2. Document Structure Example

**For Testing (Whitelist Only):**
```json
{
  "appId": "com.german.telcb1",
  "enableStreaksForAllUsers": false,
  "streaksWhitelistedUserIDs": [
    "ABC123xyz...",
    "DEF456uvw..."
  ],
  "updatedAt": 1700000000000
}
```

**For Full Rollout:**
```json
{
  "appId": "com.german.telcb1",
  "enableStreaksForAllUsers": true,
  "streaksWhitelistedUserIDs": [],
  "updatedAt": 1700000000000
}
```

### 3. Get User IDs for Whitelisting

To get Firebase UIDs for testing:

1. Go to Firebase Console → Authentication
2. Find your test users
3. Copy their UID
4. Add to the `streaksWhitelistedUserIDs` array

## Testing the Gradual Rollout

### Phase 1: Internal Testing
```json
{
  "enableStreaksForAllUsers": false,
  "streaksWhitelistedUserIDs": ["your-uid-1", "your-uid-2"]
}
```
Only you and specific testers will see streaks.

### Phase 2: Beta Testing
```json
{
  "enableStreaksForAllUsers": false,
  "streaksWhitelistedUserIDs": [
    "beta-tester-1",
    "beta-tester-2",
    // ... add more beta testers
  ]
}
```
Expand the whitelist to include beta testers.

### Phase 3: Full Rollout
```json
{
  "enableStreaksForAllUsers": true,
  "streaksWhitelistedUserIDs": []
}
```
Enable for everyone. The whitelist is ignored when `enableStreaksForAllUsers` is `true`.

### Phase 4: Emergency Disable
```json
{
  "enableStreaksForAllUsers": false,
  "streaksWhitelistedUserIDs": []
}
```
Disable streaks for everyone if issues are found.

## Real-Time Updates

The app subscribes to Firestore changes, so updates to the configuration are applied in real-time:

1. User opens the app → loads cached config immediately
2. App fetches latest config from Firestore
3. App subscribes to real-time updates
4. When you update the config in Firestore → all active apps receive the update within seconds

## Caching

The config is cached locally using AsyncStorage:

- **First launch**: Uses default value from `development.config.ts`
- **Subsequent launches**: Uses cached config while fetching latest
- **No network**: Falls back to cached config

## Code Integration

### Using the Helper Function

All components now use the `isStreaksEnabledForUser` helper function from `RemoteConfigContext`:

```typescript
const { user } = useAuth();
const { isStreaksEnabledForUser } = useRemoteConfig();

// Check if streaks are enabled for the current user
if (isStreaksEnabledForUser(user?.uid)) {
  // Show streak features
}
```

### Files Updated

The following files were updated to use the new gradual rollout system:

- ✅ `src/types/remote-config.types.ts` - Type definitions
- ✅ `src/services/firebase-remote-config.service.ts` - Firebase service
- ✅ `src/contexts/RemoteConfigContext.tsx` - Context with helper function
- ✅ `src/screens/practice/GrammarStudyScreen.tsx`
- ✅ `src/contexts/StreakContext.tsx`
- ✅ `src/components/StreakModalContainer.tsx`
- ✅ `src/screens/ProfileScreen.tsx`
- ✅ `src/contexts/ProgressContext.tsx`
- ✅ `src/contexts/CompletionContext.tsx`
- ✅ `src/components/AdBanner.tsx`

## Monitoring

You can monitor the rollout by:

1. Checking Firebase Analytics for `AD_FREE_STATUS_CHECKED` events
2. Viewing Firestore reads for `app_configs` collection
3. Looking at app logs for `[RemoteConfigContext]` messages

## Security

- ✅ All users can **read** the config (required for the app to work)
- ✅ Only admin (UID: `jgOmmKqU1ZYO1KE8NwrqpxiUkn43`) can **write** to configs
- ✅ Firestore rules are configured in `/app/admin-dashboard/firestore.rules`

## Troubleshooting

### Streaks not showing for whitelisted user

1. Verify the user's UID is correct in the whitelist
2. Check that `enableStreaksForAllUsers` is `false`
3. Ensure the user has successfully logged in
4. Check app logs for `[RemoteConfigContext]` messages

### Config not updating in real-time

1. Verify the app has network connectivity
2. Check Firebase Console for Firestore read/write permissions
3. Restart the app to force a fresh fetch

### Falls back to default value

This happens when:
- No network connection
- Firebase Firestore is down
- The document doesn't exist
- The app ID doesn't match

The app will use `ENABLE_STREAKS` from `development.config.ts` as a fallback.

## Future Extensions

You can easily add more remote config fields:

```typescript
export interface RemoteConfig {
  appId: string;
  enableStreaksForAllUsers: boolean;
  streaksWhitelistedUserIDs: string[];
  enableNewFeature: boolean;           // New field
  newFeatureWhitelist: string[];       // New field
  maxDailyStreakReward: number;        // New field
  updatedAt: number;
}
```

Then add a helper function like `isNewFeatureEnabledForUser()` in `RemoteConfigContext`.

