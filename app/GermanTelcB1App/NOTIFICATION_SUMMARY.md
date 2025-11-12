# Push Notifications Summary

## ✅ What's Already Implemented

### 1. **FCM Token Storage** (`firestore.service.ts`)
- `saveFCMToken(uid, token, platform)` - Saves device token to Firestore
- `removeFCMToken(uid)` - Removes device token
- `getFCMToken(uid)` - Retrieves device token

**Firestore Structure:**
```javascript
users/{uid} {
  fcmToken: {
    token: "device-token-string",
    updatedAt: Timestamp,
    platform: "ios" | "android"
  },
  notificationSettings: {
    enabled: true,
    hour: 9,  // notification time (0-23)
    updatedAt: "ISO-timestamp"
  }
}
```

### 2. **FCM Service** (`fcm.service.ts`)
Complete service ready - just needs package installation and uncommenting:
- Permission requests
- Token registration & refresh
- Foreground/background message handling
- Token cleanup

### 3. **Settings Screen Integration** (`SettingsScreen.tsx`)
- Toggle to enable/disable notifications
- Hour picker for notification time
- Automatically registers FCM token when enabled
- Syncs settings to Firestore

### 4. **Auto-Registration on Login** (`AuthContext.tsx`)
- When user logs in, checks if notifications are enabled
- If enabled, automatically registers FCM token
- Non-blocking (doesn't stop login if FCM fails)

### 5. **Account Deletion** (`delete-user-account.ts`)
- FCM token is automatically deleted with user document

### 6. **Firebase Functions Example** (`firebase-functions-example.js`)
Ready-to-use Cloud Functions for:
- Sending daily notifications at scheduled times
- Cleaning up invalid/expired tokens
- Test notification endpoint

## 📋 To-Do: Enable Push Notifications

### Step 1: Install Package
```bash
npm install @react-native-firebase/messaging
cd ios && pod install && cd ..
```

### Step 2: Configure iOS (Xcode)
1. Open `ios/GermanTelcB1App.xcworkspace`
2. Enable capabilities:
   - ✓ Push Notifications
   - ✓ Background Modes → Remote notifications
3. Upload APNs certificate to Firebase Console

### Step 3: Configure Android
- Already configured ✓
- Permission in AndroidManifest.xml ✓
- google-services.json in place ✓

### Step 4: Uncomment Code
Open `src/services/fcm.service.ts`:
1. Uncomment: `import messaging from '@react-native-firebase/messaging';`
2. Uncomment all method implementations
3. Remove warning messages

### Step 5: Add Background Handler
In `index.js`:
```javascript
import messaging from '@react-native-firebase/messaging';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message:', remoteMessage);
});
```

### Step 6: Deploy Firebase Functions
```bash
cd functions
npm install
firebase deploy --only functions
```

### Step 7: Setup Cloud Scheduler (Optional)
For automated hourly notifications:
```bash
gcloud pubsub topics create daily-notifications

# Schedule jobs for each hour
firebase functions:config:set scheduler.timezone="UTC"
```

## 🧪 Testing

### Test Flow:
1. Login to app
2. Go to Settings
3. Enable "Daily Notification"
4. Check Firestore: `users/{uid}/fcmToken` exists
5. Send test notification from Firebase Console
6. Or call `testNotification` Cloud Function

### Test Notification via Console:
- Firebase Console → Cloud Messaging
- "Send test message"
- Paste FCM token from Firestore
- Send

### Test Notification via Cloud Function:
```javascript
// Call from app
import functions from '@react-native-firebase/functions';

functions()
  .httpsCallable('testNotification')()
  .then(result => console.log('Test sent:', result));
```

## 📊 How It Works

### User Enables Notifications:
1. User toggles notifications ON in Settings
2. App requests system permission (iOS/Android)
3. `FCMService.initialize(uid)` is called
4. FCM token is retrieved and saved to Firestore
5. Settings saved with enabled=true and selected hour

### Sending Notifications:
1. Cloud Scheduler triggers at each hour (0-23)
2. Cloud Function queries users with:
   - `notificationSettings.enabled == true`
   - `notificationSettings.hour == currentHour`
3. For each user, sends notification via FCM token
4. Invalid tokens are automatically cleaned up

### User Disables Notifications:
1. User toggles notifications OFF
2. `FCMService.unregisterToken(uid)` is called
3. Token deleted from device
4. Token removed from Firestore
5. Settings updated with enabled=false

### Token Refresh:
- FCM tokens can expire or change
- `onTokenRefresh` listener automatically updates Firestore
- No user action needed

## 🔒 Security

- ✓ Users can only write to their own user document
- ✓ FCM tokens are user-specific
- ✓ Firestore rules prevent cross-user access
- ✓ Cloud Functions verify authentication
- ✓ Invalid tokens are automatically removed

## 📚 Resources

- Full setup guide: `FCM_SETUP.md`
- Firebase Functions: `firebase-functions-example.js`
- FCM Service: `src/services/fcm.service.ts`
- React Native Firebase Docs: https://rnfirebase.io/messaging/usage

## 🎯 Current Status

**Status:** Ready to implement  
**Effort:** ~1-2 hours (setup + testing)  
**Dependencies:** `@react-native-firebase/messaging`  

All code is written and ready. Just need to:
1. Install the package
2. Configure iOS/Android
3. Uncomment FCM service code
4. Test!

