# Firebase Cloud Messaging (FCM) Setup Guide

This guide explains how to set up push notifications using Firebase Cloud Messaging (FCM) for the German Telc B1 app.

## Overview

The app now has the infrastructure to:
- ✅ Store FCM device tokens in Firestore
- ✅ Register/unregister tokens when notifications are toggled
- ✅ Automatically register tokens on login (if notifications are enabled)
- ✅ Clean up tokens on account deletion

## What's Already Implemented

### 1. Firestore Service (`firestore.service.ts`)
- `saveFCMToken(uid, token, platform)` - Save/update device token
- `removeFCMToken(uid)` - Remove device token
- `getFCMToken(uid)` - Get current device token

### 2. FCM Service (`fcm.service.ts`)
- Token registration and management
- Token refresh handling
- Permission requests
- Foreground/background message handling

### 3. Settings Screen Integration
- Toggle notifications on/off
- Automatically registers FCM token when enabled
- Unregisters token when disabled

### 4. Auth Context Integration
- Automatically registers FCM token on login (if notifications enabled)

## What You Need to Do

### Step 1: Install Required Package

```bash
npm install @react-native-firebase/messaging

# For iOS
cd ios && pod install && cd ..
```

### Step 2: iOS Configuration

1. **Enable Capabilities in Xcode:**
   - Open `ios/GermanTelcB1App.xcworkspace` in Xcode
   - Select your target → Signing & Capabilities
   - Add "Push Notifications" capability
   - Add "Background Modes" capability
     - Check "Remote notifications"

2. **Configure APNs (Apple Push Notification service):**
   - Go to [Apple Developer Portal](https://developer.apple.com)
   - Create an APNs Key or Certificate
   - Upload to Firebase Console:
     - Project Settings → Cloud Messaging → iOS App
     - Upload your APNs Key or Certificate

### Step 3: Android Configuration

1. **Update AndroidManifest.xml** (if not already done):
   ```xml
   <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
   ```

2. **Ensure google-services.json is in place:**
   - File: `android/app/google-services.json`
   - Already configured ✓

### Step 4: Uncomment FCM Service Code

Open `src/services/fcm.service.ts` and:
1. Uncomment the import: `import messaging from '@react-native-firebase/messaging';`
2. Uncomment all method implementations
3. Remove the warning messages

### Step 5: Add Background Handler (Required for iOS)

Add this to `index.js` (before `AppRegistry.registerComponent`):

```javascript
import messaging from '@react-native-firebase/messaging';

// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});
```

### Step 6: Test Notifications

1. **Enable notifications in Settings:**
   - Login to the app
   - Go to Settings
   - Toggle "Daily Notification" on
   - Check Firestore to verify token is saved:
     ```
     users/{uid}/fcmToken
     ```

2. **Send a test notification from Firebase Console:**
   - Go to Firebase Console → Cloud Messaging
   - Click "Send your first message"
   - Enter notification title and text
   - Select your app
   - Click "Send test message"
   - Paste the FCM token from Firestore

## Data Structure

### User Document with FCM Token

```typescript
{
  uid: "user123",
  email: "user@example.com",
  fcmToken: {
    token: "dXI2...token...here",
    updatedAt: Timestamp,
    platform: "ios" | "android"
  },
  notificationSettings: {
    enabled: true,
    hour: 9,  // 9 AM
    updatedAt: "2025-11-12T10:00:00Z"
  }
}
```

## Firebase Functions for Sending Notifications

Reference: `firebase-functions-example.js`

### Daily Notification Scheduler

The example includes a Cloud Function that:
1. Runs every hour (triggered by Cloud Scheduler)
2. Queries users with notifications enabled for that hour
3. Sends notifications to their FCM tokens
4. Handles invalid tokens (removes them from Firestore)

### Setup Cloud Scheduler (Optional)

```bash
# Create a Pub/Sub topic
gcloud pubsub topics create daily-notifications

# Create a scheduler job for each hour
for hour in {0..23}; do
  gcloud scheduler jobs create pubsub notify-hour-$hour \
    --schedule="0 $hour * * *" \
    --topic=daily-notifications \
    --message-body="{\"hour\": $hour}" \
    --time-zone="UTC"
done
```

## Troubleshooting

### iOS: Not receiving notifications
- Check that APNs certificate/key is configured in Firebase
- Verify Push Notifications capability is enabled in Xcode
- Test on a real device (simulator doesn't support push notifications)

### Android: Not receiving notifications
- Check that `google-services.json` is up to date
- Verify POST_NOTIFICATIONS permission is in AndroidManifest.xml
- For Android 13+, ensure runtime permission is granted

### Token not being saved
- Check console logs for errors
- Verify user is logged in
- Check Firestore rules allow writing to users/{uid}

### Tokens becoming invalid
- Tokens can expire or change when app is reinstalled
- The `onTokenRefresh` handler automatically updates them
- Invalid tokens are cleaned up by the Cloud Function

## Security: Firestore Rules

Ensure your Firestore rules protect FCM tokens:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can only read/write their own document
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Don't allow users to write fcmToken from client
      // (should be set by authenticated requests only)
      allow update: if request.auth != null 
        && request.auth.uid == userId
        && !("fcmToken" in request.resource.data.diff(resource.data).affectedKeys());
    }
  }
}
```

## Next Steps

1. Install the package
2. Configure iOS/Android as described above
3. Uncomment FCM service code
4. Test notification flow
5. Deploy Firebase Functions for automated daily notifications
6. Set up Cloud Scheduler (optional, for scheduled notifications)

## Resources

- [React Native Firebase - Messaging](https://rnfirebase.io/messaging/usage)
- [Firebase Console](https://console.firebase.google.com)
- [Apple Developer Portal](https://developer.apple.com)
- [Cloud Scheduler Documentation](https://cloud.google.com/scheduler/docs)

