# Firebase Setup Instructions

This document provides step-by-step instructions for setting up Firebase authentication and Firestore for the German TELC B1 Exam Preparation App.

## Prerequisites

- A Google account
- Node.js and npm installed
- React Native development environment set up

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `german-telc-b1-app` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Add Apps to Your Project

### Add Android App

1. In the Firebase console, click "Add app" and select Android
2. Enter package name: `com.germantelcb1app`
3. Enter app nickname: `German TELC B1 Android`
4. Download `google-services.json` and place it in `android/app/`
5. Click "Next" and follow the setup instructions

### Add iOS App

1. Click "Add app" and select iOS
2. Enter bundle ID: `com.germantelcb1app`
3. Enter app nickname: `German TELC B1 iOS`
4. Download `GoogleService-Info.plist` and add it to your iOS project
5. Click "Next" and follow the setup instructions

## Step 3: Enable Authentication

1. In the Firebase console, go to "Authentication" > "Sign-in method"
2. Enable the following providers:
   - **Email/Password**: Click "Email/Password" and enable it
   - **Google**: Click "Google" and enable it, add your project's support email
   - **Facebook**: Click "Facebook" and enable it (requires Facebook App setup)
   - **Apple**: Click "Apple" and enable it (iOS only)

### Google Sign-In Setup

1. In Google Sign-In settings, add your SHA-1 fingerprint:
   ```bash
   cd android
   ./gradlew signingReport
   ```
2. Copy the SHA-1 fingerprint and add it to the Firebase console

### Facebook Sign-In Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs
5. Add your Facebook App ID and App Secret to Firebase

## Step 4: Enable Firestore Database

1. In the Firebase console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location for your database
5. Click "Done"

## Step 5: Update Configuration Files

### ✅ Gradle Configuration (Already Done)

The Android Gradle configuration has been automatically updated with:
- Google Services plugin in project-level `build.gradle`
- Firebase dependencies in app-level `build.gradle`
- Placeholder `google-services.json` file

### Update Firebase Config

Edit `src/config/firebase.config.ts` with your actual Firebase configuration:

```typescript
export const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id",
  iosClientId: "your-ios-client-id.apps.googleusercontent.com",
  androidClientId: "your-android-client-id.apps.googleusercontent.com",
};
```

### Replace Placeholder google-services.json

1. Download the actual `google-services.json` from your Firebase project
2. Replace the placeholder file at `android/app/google-services.json`
3. The placeholder file is already in place for development

### Update Google Sign-In Config

```typescript
export const googleSignInConfig = {
  webClientId: "your-web-client-id.apps.googleusercontent.com",
  iosClientId: firebaseConfig.iosClientId,
  androidClientId: firebaseConfig.androidClientId,
};
```

### Update Facebook Config

```typescript
export const facebookConfig = {
  appId: "your-facebook-app-id",
  appName: "German TELC B1 App",
};
```

## Step 6: Install Native Dependencies

### Android Setup

1. Add to `android/build.gradle`:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

2. Add to `android/app/build.gradle`:
```gradle
apply plugin: 'com.google.gms.google-services'
```

3. Add to `android/settings.gradle`:
```gradle
include ':react-native-fbsdk-next'
project(':react-native-fbsdk-next').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-fbsdk-next/android')
```

### iOS Setup

1. Add to `ios/Podfile`:
```ruby
pod 'GoogleSignIn'
pod 'FBSDKCoreKit'
pod 'FBSDKLoginKit'
```

2. Run `cd ios && pod install`

3. Add to `ios/YourApp/Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>google</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>YOUR_REVERSED_CLIENT_ID</string>
        </array>
    </dict>
    <dict>
        <key>CFBundleURLName</key>
        <string>facebook</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>fbYOUR_FACEBOOK_APP_ID</string>
        </array>
    </dict>
</array>
```

## Step 7: Test the Setup

1. Run the app: `npx react-native run-android` or `npx react-native run-ios`
2. Go to the Profile screen
3. Try signing in with different providers
4. Check the Firebase console to see if users are created

## Security Rules

### Firestore Security Rules

Update your Firestore security rules in the Firebase console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read and write their own progress
    match /progress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read and write their own exam results
    match /examResults/{resultId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Google Sign-In not working**: Check SHA-1 fingerprint and package name
2. **Facebook Sign-In not working**: Verify App ID and redirect URIs
3. **Firestore permission denied**: Check security rules
4. **Build errors**: Ensure all native dependencies are properly linked

### Debug Mode

Enable debug mode in your Firebase config for development:

```typescript
// In firebase.config.ts
export const isDevelopment = __DEV__;
```

## Production Considerations

1. **Security Rules**: Update Firestore rules for production
2. **API Keys**: Use environment variables for sensitive data
3. **App Signing**: Use proper app signing for production builds
4. **Analytics**: Enable Firebase Analytics for user insights
5. **Crashlytics**: Add Firebase Crashlytics for crash reporting

## Support

For issues with Firebase setup:
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Firebase](https://rnfirebase.io/)
- [Google Sign-In for React Native](https://github.com/react-native-google-signin/google-signin)
- [Facebook SDK for React Native](https://github.com/thebergamo/react-native-fbsdk-next)
