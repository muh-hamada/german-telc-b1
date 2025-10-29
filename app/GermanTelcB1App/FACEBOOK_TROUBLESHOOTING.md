# Facebook Sign-In Troubleshooting Guide

## Current Issue: "auth/no-token" Error

The error `"Something went wrong obtaining access token"` means the Facebook SDK completed the login but didn't return an access token. This typically happens when:

1. **Limited Login is being used** (default on iOS 14+)
2. **Facebook app configuration is incomplete**
3. **OAuth redirect URIs are not configured**
4. **App is in Development Mode** with incorrect test users

## Quick Fixes to Try

### Fix 1: Check Facebook Developer Console Settings

1. Go to [Facebook Developer Console](https://developers.facebook.com/apps/)
2. Select your app (ID: `1507568217229301`)
3. Navigate to **Settings** → **Basic**
4. Make sure:
   - ✅ App is **Live** (not Development mode)
   - ✅ iOS Bundle ID is correctly set
   - ✅ Privacy Policy URL is set
   - ✅ Terms of Service URL is set (if required)

### Fix 2: Configure OAuth Settings

1. In Facebook Developer Console, go to **Products** → **Facebook Login** → **Settings**
2. Add OAuth Redirect URIs:
   ```
   fb1507568217229301://authorize
   ```
3. Make sure "Client OAuth Login" is **ENABLED**
4. Make sure "Web OAuth Login" is **ENABLED**
5. Valid OAuth Redirect URIs should include your app's custom URL scheme

### Fix 3: Check iOS Settings in Facebook Console

1. Go to **Settings** → **Basic**
2. Click **Add Platform** → **iOS**
3. Enter:
   - **Bundle ID**: Check your Xcode project for the exact Bundle Identifier
   - **iPhone Store ID**: (optional for testing)
4. Enable **Single Sign-On**: YES

### Fix 4: Verify Facebook App is Not in Restricted Mode

If your Facebook app is still in **Development Mode**:

1. Add your Apple ID / Facebook account as a **Test User**:
   - Go to **Roles** → **Test Users**
   - Or go to **Roles** → **Administrators** and add yourself

2. OR switch app to **Live Mode**:
   - Go to **Settings** → **Basic**
   - Toggle **App Mode** to **Live**
   - Note: This requires Privacy Policy and may require App Review

### Fix 5: Clean Build and Reinstall

```bash
# Clean iOS build
cd ios
rm -rf build
rm -rf ~/Library/Developer/Xcode/DerivedData/*
pod deintegrate
pod install
cd ..

# Clean React Native cache
rm -rf node_modules
rm -rf ios/Pods
npm install
cd ios && pod install && cd ..

# Delete app from simulator/device
# Then rebuild
npm run ios
```

### Fix 6: Test with Facebook App Installed

The error often occurs when testing without the Facebook app installed. Try:

1. **Install Facebook app** on your device/simulator
2. **Log into Facebook** in the app
3. Try sign-in again

Without the Facebook app, the SDK falls back to web login which might have different behavior.

### Fix 7: Check Info.plist Configuration

Verify these keys exist in `ios/GermanTelcB1App/Info.plist`:

```xml
<key>FacebookAppID</key>
<string>1507568217229301</string>

<key>FacebookClientToken</key>
<string>c1f3d10c6a4054707078aae7a71dd580</string>

<key>FacebookDisplayName</key>
<string>German TELC B1 App</string>

<key>FacebookAutoLogAppEventsEnabled</key>
<true/>

<key>FacebookAdvertiserIDCollectionEnabled</key>
<true/>

<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>fb1507568217229301</string>
    </array>
  </dict>
</array>

<key>LSApplicationQueriesSchemes</key>
<array>
  <string>fbapi</string>
  <string>fb-messenger-share-api</string>
  <string>fbauth2</string>
  <string>fbshareextension</string>
</array>
```

## Debugging Steps

### Step 1: Check Console Logs

Look for these log messages:

```
signInWithFacebook step 1
signInWithFacebook step 1.5 - Logged out previous session
signInWithFacebook step 2 - Login result: {...}
signInWithFacebook step 3 - Getting access token
signInWithFacebook step 4 - Access token data: [Token exists or No token]
```

If you see "No token" at step 4, the Facebook SDK didn't return a token.

### Step 2: Check Login Result

The login result should show:
```javascript
{
  "isCancelled": false,
  "grantedPermissions": ["public_profile", "email"],
  "declinedPermissions": []
}
```

If `grantedPermissions` is empty or doesn't include the required permissions, that's the issue.

### Step 3: Verify Facebook SDK Initialization

Check if you see in the logs:
```
Tracking authorization granted
```

If not, the tracking permission was denied, which might affect token generation.

## Common Issues and Solutions

### Issue: "No token" but login succeeds

**Cause**: Limited Login is being used despite configuration

**Solution**: 
1. Delete the app from your device
2. Clean build
3. Reinstall
4. Accept tracking permission when prompted

### Issue: App crashes when clicking Facebook sign-in

**Cause**: URL scheme handler not properly configured

**Solution**: Check `AppDelegate.swift` has the URL handler:
```swift
func application(
  _ app: UIApplication,
  open url: URL,
  options: [UIApplication.OpenURLOptionsKey : Any] = [:]
) -> Bool {
  if ApplicationDelegate.shared.application(
    app,
    open: url,
    sourceApplication: options[UIApplication.OpenURLOptionsKey.sourceApplication] as? String,
    annotation: options[UIApplication.OpenURLOptionsKey.annotation]
  ) {
    return true
  }
  return false
}
```

### Issue: "Invalid OAuth redirect URI"

**Cause**: Facebook app doesn't have the correct redirect URI configured

**Solution**: Add `fb1507568217229301://authorize` to OAuth Redirect URIs in Facebook Console

## Alternative: Use Email/Google Sign-In Instead

If Facebook sign-in continues to cause issues, consider:

1. **Recommend users use Google Sign-In** (fully working)
2. **Recommend users use Apple Sign-In** (fully working)
3. **Recommend users use Email/Password** (fully working)

Facebook's SDK has become increasingly complex with Limited Login, tracking permissions, and app review requirements.

## Next Steps

1. **Check Facebook Developer Console** for app configuration
2. **Verify OAuth redirect URIs** are set correctly
3. **Test with Facebook app installed** on device
4. **Review console logs** for specific error messages
5. **Try clean build** and reinstall

## Need More Help?

Provide the following information:
- Complete console logs from sign-in attempt
- Facebook App Mode (Development or Live)
- Whether Facebook app is installed on test device
- iOS version and device type
- Complete error message including stack trace

## Reference

- [Facebook Login for iOS - Documentation](https://developers.facebook.com/docs/facebook-login/ios)
- [react-native-fbsdk-next GitHub](https://github.com/thebergamo/react-native-fbsdk-next)
- [Firebase Facebook Auth](https://firebase.google.com/docs/auth/ios/facebook-login)

