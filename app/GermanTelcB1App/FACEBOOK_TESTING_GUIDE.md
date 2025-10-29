# Testing Facebook Sign-In on iOS - Step by Step

## What Changed

I've completely revamped the Facebook sign-in to fix the "auth/no-token" error:

### Key Improvements:
1. ✅ **Browser-based login** instead of native app (bypasses Limited Login)
2. ✅ **Explicit SDK initialization** with App ID and Client Token
3. ✅ **Retry logic** with delays to wait for token
4. ✅ **Better debugging** with `[Facebook]` prefixed logs
5. ✅ **Permission validation** before proceeding

## Testing Instructions

### Step 1: Clean Build (Critical!)

```bash
cd /Users/mham/projects/german-telc-b1/app/GermanTelcB1App

# Remove old builds
rm -rf ios/build
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Clean Metro bundler
watchman watch-del-all
rm -rf /tmp/metro-*

# Rebuild iOS
npm run ios
```

### Step 2: Test Facebook Sign-In

1. **Launch the app**
2. **Tap "Sign in with Facebook"**
3. **Watch the console output** (Metro bundler console)
4. **Allow tracking** when prompted (important!)
5. **Safari will open** with Facebook login
6. **Log in or approve** the app
7. **Safari redirects back** to your app
8. **Check if signed in successfully**

### Step 3: Check Console Logs

**Expected logs (SUCCESS):**

```
[Facebook] Step 1: Starting Facebook sign-in
[Facebook] Configuring Facebook SDK for iOS
[Facebook] Facebook SDK configured
[Facebook] Step 1.5: Logged out previous session
[Facebook] Setting login behavior to browser
[Facebook] Step 2: Requesting login with permissions
[Facebook] Step 3: Login result received: { isCancelled: false, grantedPermissions: [...] }
[Facebook] Step 4: Getting current access token
[Facebook] Step 5: Access token check: { hasData: true, hasAccessToken: true, tokenLength: 200 }
[Facebook] Step 6: Valid token received, length: 200
[Facebook] Creating Firebase credential with access token
[Facebook] Firebase credential created, signing in...
[Facebook] Firebase sign-in successful!
```

**Failure logs (if still broken):**

```
[Facebook] Step 5: Access token check: { hasData: false, hasAccessToken: false }
[Facebook] Retrying to get access token after delay...
[Facebook] Sign-in error: { code: 'auth/no-token', message: '...' }
```

## If Still Failing: Facebook Developer Console Setup

### Required: OAuth Redirect URI

1. Go to https://developers.facebook.com/apps/1507568217229301
2. Navigate to **Products** → **Facebook Login** → **Settings**
3. Add to **Valid OAuth Redirect URIs**:
   ```
   fb1507568217229301://authorize
   ```
4. Click **Save Changes**

### Required: iOS Platform Setup

1. Go to **Settings** → **Basic**
2. Click **+ Add Platform** → **iOS**
3. Enter your **Bundle ID** (get from Xcode):
   - Open `ios/GermanTelcB1App.xcworkspace` in Xcode
   - Select project → Target → General → Bundle Identifier
   - Copy that value (e.g., `com.yourcompany.germantelcb1app`)
4. Enable **Single Sign On**: YES
5. Click **Save Changes**

### Required: App Mode

If your app is in **Development Mode**:

**Option A: Add yourself as a test user**
1. Go to **Roles** → **Roles** → **Test Users**
2. Add a test user or use your Facebook account
3. Make sure you're logged into Facebook with that account

**Option B: Switch to Live Mode**
1. Go to **Settings** → **Basic**
2. Toggle **App Mode** to **Live**
3. Note: Requires Privacy Policy URL and Terms of Service URL

### Required: Enable OAuth Settings

1. Go to **Products** → **Facebook Login** → **Settings**
2. Enable **Client OAuth Login**: YES
3. Enable **Web OAuth Login**: YES
4. Save Changes

## Debugging Checklist

### ✅ Info.plist Configuration

Open `ios/GermanTelcB1App/Info.plist` and verify:

- [ ] `FacebookAppID` = `1507568217229301`
- [ ] `FacebookClientToken` = `c1f3d10c6a4054707078aae7a71dd580`
- [ ] `FacebookDisplayName` = `German TELC B1 App`
- [ ] `FacebookAutoLogAppEventsEnabled` = `true`
- [ ] `FacebookAdvertiserIDCollectionEnabled` = `true`
- [ ] `NSUserTrackingUsageDescription` exists
- [ ] `CFBundleURLTypes` includes `fb1507568217229301`
- [ ] `LSApplicationQueriesSchemes` includes `fbapi`, `fbauth2`, etc.

### ✅ AppDelegate Configuration

Open `ios/GermanTelcB1App/AppDelegate.swift` and verify:

- [ ] Imports `FBSDKCoreKit`
- [ ] Imports `AppTrackingTransparency`
- [ ] Imports `GoogleSignIn`
- [ ] Initializes Facebook SDK in `didFinishLaunchingWithOptions`
- [ ] Has URL handler for `application(_:open:options:)`
- [ ] Requests tracking authorization

### ✅ Facebook Console Configuration

- [ ] iOS platform added with correct Bundle ID
- [ ] OAuth Redirect URI: `fb1507568217229301://authorize`
- [ ] Client OAuth Login: Enabled
- [ ] Web OAuth Login: Enabled
- [ ] App is Live OR you're added as test user/admin

## Common Error Messages and Fixes

### Error: "auth/no-token"

**Meaning**: Login succeeded but no access token returned

**Fix**:
1. Check Facebook Console OAuth Redirect URIs
2. Verify Bundle ID matches in Xcode and Facebook Console
3. Make sure app is Live or you're a test user
4. Clean build and try again

### Error: "auth/permissions-denied"

**Meaning**: User didn't grant required permissions

**Fix**:
1. Try signing in again
2. Accept both "public_profile" and "email" permissions
3. Check Facebook Console has these permissions enabled

### Error: "auth/cancelled"

**Meaning**: User cancelled the login

**Fix**:
- Normal behavior, user just needs to try again

### Safari doesn't open

**Meaning**: URL scheme or login behavior issue

**Fix**:
1. Check `CFBundleURLTypes` in Info.plist
2. Verify URL handler in AppDelegate.swift
3. Clean build and reinstall

## Alternative: Test Without Facebook Account

If you don't want to configure everything in Facebook Developer Console, you can:

1. **Disable Facebook sign-in** temporarily
2. **Use Google Sign-In** (fully working ✅)
3. **Use Apple Sign-In** (fully working ✅)
4. **Use Email/Password** (fully working ✅)

To disable Facebook button, you can hide it in the UI or show a message that it's "Coming Soon".

## Success Criteria

When Facebook sign-in works correctly:

1. ✅ Tracking permission dialog appears
2. ✅ Safari opens with Facebook login page
3. ✅ After login, Safari automatically closes and returns to app
4. ✅ User is signed into the app with their Facebook account
5. ✅ Console shows "[Facebook] Firebase sign-in successful!"
6. ✅ No errors in console

## Summary

The Facebook sign-in now uses **browser-based authentication** which is:
- ✅ More reliable than native app flow
- ✅ Works without Facebook app installed
- ✅ Bypasses Limited Login issues
- ✅ Consistent across iOS versions

**Most important steps:**
1. Clean build
2. Configure OAuth Redirect URI in Facebook Console
3. Set Bundle ID in Facebook Console iOS platform
4. Test with tracking permission allowed

Good luck! If you continue to have issues, the error messages are now much more detailed and will help pinpoint the exact problem.

## Need Help?

If you're still stuck after following all steps above, please provide:
1. Complete console logs from sign-in attempt
2. Screenshot of Facebook Developer Console → Facebook Login → Settings
3. Your Bundle ID from Xcode
4. Whether your app is in Development or Live mode
5. Any error messages you see

---

**Files Modified:**
- `src/services/auth.service.ts` - Enhanced Facebook sign-in with browser login
- `ios/GermanTelcB1App/Info.plist` - Added Facebook SDK configuration keys
- `ios/GermanTelcB1App/AppDelegate.swift` - Already configured in previous step

**Documentation:**
- `FACEBOOK_FIX_SUMMARY.md` - This file
- `FACEBOOK_TROUBLESHOOTING.md` - Detailed troubleshooting
- `FACEBOOK_LIMITED_LOGIN_FIX.md` - Explanation of Limited Login issues

