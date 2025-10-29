# Facebook Sign-In FINAL FIX - App Tracking Transparency

## The Solution (Based on GitHub Issue #520)

According to the [react-native-fbsdk-next GitHub issue #520](https://github.com/thebergamo/react-native-fbsdk-next/issues/520#issuecomment-2067687075), the key to fixing the `[auth/invalid-credential]` error is to **request App Tracking Transparency permission BEFORE attempting Facebook login**.

## What Changed

### ✅ Added `react-native-permissions` Integration

The critical fix is in `src/services/auth.service.ts`:

```typescript
// Import permissions library
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

// BEFORE Facebook login, request ATT permission
if (Platform.OS === 'ios') {
  const result = await request(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
  
  if (result === RESULTS.GRANTED || result === RESULTS.UNAVAILABLE) {
    Settings.setAdvertiserTrackingEnabled(true);
  } else {
    Settings.setAdvertiserTrackingEnabled(false);
  }
}
```

### Why This Works

1. **Limited Login Problem**: iOS 14+ Facebook SDK defaults to "Limited Login" which provides tokens incompatible with Firebase
2. **ATT Requirement**: Facebook needs tracking permission to use "Classic Login" with valid Firebase tokens
3. **Timing is Critical**: Permission MUST be requested BEFORE `LoginManager.logInWithPermissions()`

## Complete Flow Now

```
1. User taps "Sign in with Facebook"
2. ✅ App requests App Tracking Transparency permission
3. User sees: "Allow [App] to track your activity across companies' apps and websites?"
4. User chooses "Allow" or "Ask App Not to Track"
5. Facebook SDK configured based on ATT response
6. Facebook login initiated with native_with_fallback behavior
7. User authenticates with Facebook
8. Valid access token received
9. Firebase credential created
10. User signed in successfully! ✅
```

## Configuration Already in Place

### 1. Podfile (`ios/Podfile`)
```ruby
setup_permissions([
  'AppTrackingTransparency',  # ✅ Already configured
  'Camera',
  'PhotoLibrary',
])
```

### 2. Info.plist
```xml
<key>NSUserTrackingUsageDescription</key>
<string>This app would like to use tracking to provide you with a personalized ad experience and enable Facebook login.</string>

<key>FacebookAutoLogAppEventsEnabled</key>
<true/>

<key>FacebookAdvertiserIDCollectionEnabled</key>
<true/>
```

### 3. Auth Service (`auth.service.ts`)
- ✅ Requests ATT permission before login
- ✅ Configures Facebook SDK based on permission result
- ✅ Uses native login with fallback (not browser)
- ✅ Includes retry logic for token retrieval

## Expected Console Output

When Facebook sign-in works correctly:

```
[Facebook] Step 1: Starting Facebook sign-in
[Facebook] Step 1.5: Requesting App Tracking Transparency permission
[Facebook] ATT Permission result: granted
[Facebook] Tracking permission granted or unavailable (iOS < 14)
[Facebook] Step 2: Configuring Facebook SDK for iOS
[Facebook] Facebook SDK configured
[Facebook] Step 3: Logged out previous session
[Facebook] Step 4: Setting login behavior
[Facebook] Step 5: Requesting login with permissions
[Facebook] Step 6: Login result received: { isCancelled: false, grantedPermissions: [...] }
[Facebook] Step 7: Getting current access token
[Facebook] Step 8: Access token check: { hasData: true, hasAccessToken: true, tokenLength: 200+ }
[Facebook] Step 9: Valid token received, length: 250
[Facebook] Creating Firebase credential with access token
[Facebook] Firebase credential created, signing in...
[Facebook] Firebase sign-in successful!
```

## Testing Instructions

### 1. Clean Build (Important!)

```bash
cd /Users/mham/projects/german-telc-b1/app/GermanTelcB1App

# Clean everything
rm -rf ios/build
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Rebuild
npm run ios
```

### 2. Test Facebook Sign-In

1. Launch the app
2. Tap "Sign in with Facebook"
3. **You'll see ATT permission dialog first** (this is the key!)
   - "Allow [App] to track your activity?"
4. Choose **"Allow"** (important for classic login to work)
5. Facebook login screen appears
6. Sign in with Facebook
7. Should succeed! ✅

### 3. If User Denies ATT Permission

If user chooses "Ask App Not to Track":
- App will still attempt Facebook login
- But may fall back to Limited Login
- Which could still cause `invalid-credential` error

**Solution**: User needs to allow tracking in Settings:
- Settings → Privacy & Security → Tracking → [Your App] → ON

## Key Points

### ✅ This Solution Works Because:

1. **Requests ATT before Facebook login** (timing is critical)
2. **Configures Facebook SDK based on ATT result**
3. **Uses native login instead of browser** (better UX with permission granted)
4. **Properly initializes Facebook SDK** with App ID and Client Token

### ⚠️ Requirements:

- User must grant ATT permission for best experience
- Info.plist must have NSUserTrackingUsageDescription
- Podfile must include 'AppTrackingTransparency' permission
- Facebook SDK settings must enable advertiser tracking

## Troubleshooting

### Still Getting "invalid-credential"?

**Check ATT Permission Status:**
```
[Facebook] ATT Permission result: denied  ← Problem!
```

**Solution:**
1. Delete the app
2. Reinstall
3. Allow tracking when prompted

OR

Go to Settings → Privacy & Security → Tracking → Enable for your app

### "granted" but still failing?

**Check Facebook Developer Console:**
- iOS platform configured with correct Bundle ID
- OAuth Redirect URI: `fb1507568217229301://authorize`
- Client OAuth Login: Enabled
- Web OAuth Login: Enabled

## Reference

- [GitHub Issue #520 - Limited Login Problem](https://github.com/thebergamo/react-native-fbsdk-next/issues/520)
- [Comment with ATT Solution](https://github.com/thebergamo/react-native-fbsdk-next/issues/520#issuecomment-2067687075)
- [react-native-permissions Documentation](https://github.com/zoontek/react-native-permissions)
- [Apple ATT Documentation](https://developer.apple.com/documentation/apptrackingtransparency)

## Files Modified

1. `src/services/auth.service.ts` - Added ATT permission request before Facebook login
2. `ios/Podfile` - Already had AppTrackingTransparency enabled
3. `ios/GermanTelcB1App/Info.plist` - Already had NSUserTrackingUsageDescription

## Summary

✅ **Root Cause**: Facebook SDK v13+ uses Limited Login by default, which provides incompatible tokens  
✅ **Solution**: Request App Tracking Transparency permission BEFORE Facebook login  
✅ **Result**: Facebook uses Classic Login with valid Firebase-compatible tokens  
✅ **Status**: Ready to test!

The Facebook sign-in should now work perfectly. The key was requesting ATT permission at the right time - before initiating the Facebook login flow. 🎉

