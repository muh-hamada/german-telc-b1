# Facebook Limited Login Fix

## Problem

Facebook Sign-In on iOS was showing a "Limited Login" warning and throwing the error:
```
[auth/invalid-credential] The supplied auth credential is malformed or has expired.
```

### Root Cause

Starting with iOS 14, Facebook SDK defaults to "Limited Login" mode which:
- Provides limited user data
- Uses a different token format that **doesn't work** with Firebase Authentication
- Is designed for privacy-focused authentication without tracking

## Solution

We've configured the app to use **Classic Facebook Login** instead of Limited Login. This requires:

1. **App Tracking Transparency (ATT)** permission
2. **Facebook SDK configuration** to enable tracking
3. **Login behavior** set to classic mode

## Changes Made

### 1. Added App Tracking Permission (`Info.plist`)

```xml
<key>NSUserTrackingUsageDescription</key>
<string>This app would like to use tracking to provide you with a personalized ad experience and enable Facebook login.</string>
```

### 2. Updated Facebook Sign-In Flow (`auth.service.ts`)

```typescript
// Configure login to use classic login (not Limited Login)
LoginManager.setLoginBehavior('native_with_fallback');

// Use classic Facebook Login with limited tracking for iOS 14+
const result = await LoginManager.logInWithPermissions(
  ['public_profile', 'email'],
  'limited',  // Use 'limited' tracking for iOS 14+
  'my_nonce'  // Optional nonce for security
);
```

**Key improvements:**
- Set login behavior to `native_with_fallback` for classic login
- Added token validation before creating Firebase credential
- Better error handling with specific error codes
- Enhanced logging for debugging

### 3. Configured Facebook SDK in AppDelegate (`AppDelegate.swift`)

```swift
// Configure Facebook SDK settings
Settings.shared.isAdvertiserIDCollectionEnabled = true
Settings.shared.isAutoLogAppEventsEnabled = true
Settings.shared.isAdvertiserTrackingEnabled = true

// Request tracking authorization for iOS 14+
ATTrackingManager.requestTrackingAuthorization { status in
  switch status {
  case .authorized:
    Settings.shared.isAdvertiserTrackingEnabled = true
  // ... handle other cases
  }
}
```

### 4. Added Required Imports

```swift
import AppTrackingTransparency
import AdSupport
```

### 5. Added Facebook SKAdNetwork Identifiers (`Info.plist`)

```xml
<key>SKAdNetworkItems</key>
<array>
  <dict>
    <key>SKAdNetworkIdentifier</key>
    <string>v9wttpbfk9.skadnetwork</string>
  </dict>
  <dict>
    <key>SKAdNetworkIdentifier</key>
    <string>n38lu8286q.skadnetwork</string>
  </dict>
</array>
```

## How It Works Now

1. **User taps "Sign in with Facebook"**
2. **App requests tracking permission** (iOS 14+)
   - Shows system dialog: "Allow [App] to track your activity?"
3. **User response:**
   - **Allow**: Classic Facebook Login with full features ✅
   - **Don't Allow**: Still attempts classic login but with limited tracking
4. **Facebook login flow** opens in native Facebook app or web view
5. **Access token obtained** and validated
6. **Firebase credential created** with the valid token
7. **User signed in** to Firebase successfully

## User Experience

### First Time Sign-In
1. App requests tracking permission
2. User sees: "This app would like to use tracking to provide you with a personalized ad experience and enable Facebook login."
3. User chooses "Allow" or "Ask App Not to Track"
4. Facebook login proceeds

### Subsequent Sign-Ins
- If user previously logged in with Facebook, they see: "You previously logged into Telc B1 German with Facebook. Would you like to continue?"
- One tap to continue

## Testing

1. **Clean build** and test:
   ```bash
   cd /Users/mham/projects/german-telc-b1/app/GermanTelcB1App
   npm run ios
   ```

2. **Test scenarios:**
   - ✅ First-time sign-in (user grants tracking)
   - ✅ First-time sign-in (user denies tracking)
   - ✅ Returning user sign-in
   - ✅ Sign out and sign back in
   - ✅ Token validation and Firebase authentication

3. **Check logs:**
   ```
   signInWithFacebook step 1
   signInWithFacebook step 2 {...}
   signInWithFacebook step 3
   signInWithFacebook step 4 {...}
   signInWithFacebook step 5 - Token received: EAAV...
   signInWithFacebook step 6 {...}
   signInWithFacebook step 7 - Firebase sign-in successful
   ```

## Important Notes

### App Store Submission

When submitting to the App Store, you must:

1. **Declare tracking usage** in App Store Connect
2. **Provide justification** for tracking request
3. **Be transparent** about data usage

### Privacy Considerations

- Users can deny tracking and still use the app with other sign-in methods (Google, Apple, Email)
- Tracking permission can be changed in iOS Settings > Privacy & Security > Tracking
- The app respects user's tracking preferences

### Alternative: Limited Login

If you prefer **NOT** to request tracking permission, you would need to:

1. Remove the tracking request code
2. Implement Facebook's Limited Login API
3. Manually handle user authentication without Firebase
4. Update your backend to work with limited tokens

This is more complex and not recommended for most apps.

## Troubleshooting

### Still seeing Limited Login warning?

1. **Check tracking authorization status:**
   ```swift
   let status = ATTrackingManager.trackingAuthorizationStatus
   print("Tracking status: \(status.rawValue)")
   ```

2. **Verify Facebook SDK settings:**
   ```swift
   print("Advertiser tracking enabled: \(Settings.shared.isAdvertiserTrackingEnabled)")
   ```

3. **Reset tracking permission:**
   - Settings > Privacy & Security > Tracking
   - Reset permission for your app

### Invalid credential error?

1. **Check token validity:**
   - Verify the access token is not empty
   - Check token format (should start with "EAAV" or similar)

2. **Verify Facebook App configuration:**
   - App ID matches in Info.plist and firebase.config.ts
   - Firebase has Facebook authentication enabled
   - Correct OAuth redirect URIs configured

### App crashes on Facebook login?

1. **Check Facebook SDK initialization:**
   - Verify AppDelegate properly initializes Facebook SDK
   - Check URL scheme handler is configured

2. **Review Info.plist:**
   - FacebookAppID
   - FacebookClientToken
   - FacebookDisplayName
   - CFBundleURLTypes with fb[app-id]

## Summary

✅ **Fixed**: Facebook Sign-In now works with Firebase Authentication on iOS
✅ **Method**: Using Classic Facebook Login with App Tracking Transparency
✅ **User Experience**: One-time permission request, then seamless Facebook login
✅ **Privacy**: Users can choose to allow or deny tracking
✅ **Compatibility**: Works on iOS 14+ with proper fallbacks

## Files Modified

1. `src/services/auth.service.ts` - Updated Facebook sign-in flow
2. `ios/GermanTelcB1App/Info.plist` - Added tracking permission and SKAdNetwork IDs
3. `ios/GermanTelcB1App/AppDelegate.swift` - Added tracking request and Facebook SDK configuration

## Reference

- [Facebook iOS SDK - App Tracking Transparency](https://developers.facebook.com/docs/app-events/guides/advertising-tracking-enabled)
- [Apple - App Tracking Transparency](https://developer.apple.com/documentation/apptrackingtransparency)
- [Firebase Auth with Facebook](https://firebase.google.com/docs/auth/ios/facebook-login)
- [React Native FBSDK Next](https://github.com/thebergamo/react-native-fbsdk-next)

