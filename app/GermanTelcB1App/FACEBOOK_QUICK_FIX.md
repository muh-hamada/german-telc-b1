# Facebook Sign-In Fix - Quick Reference

## The Problem
`[auth/invalid-credential] The supplied auth credential is malformed or has expired`

## The Root Cause  
Facebook SDK v13+ uses **Limited Login** by default on iOS 14+, which provides tokens that don't work with Firebase Authentication.

## The Solution  
✅ **Request App Tracking Transparency (ATT) permission BEFORE Facebook login**

Source: https://github.com/thebergamo/react-native-fbsdk-next/issues/520#issuecomment-2067687075

## What Was Changed

### auth.service.ts
```typescript
// Added import
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

// Added BEFORE Facebook login
const result = await request(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
if (result === RESULTS.GRANTED || result === RESULTS.UNAVAILABLE) {
  Settings.setAdvertiserTrackingEnabled(true);
} else {
  Settings.setAdvertiserTrackingEnabled(false);
}
```

## Test Now

### Clean Build
```bash
cd /Users/mham/projects/german-telc-b1/app/GermanTelcB1App
rm -rf ios/build
npm run ios
```

### Expected Flow
1. Tap "Sign in with Facebook"
2. **ATT permission dialog appears** ← This is NEW and CRITICAL!
3. Choose "Allow"
4. Facebook login proceeds
5. Success! ✅

### Expected Logs
```
[Facebook] Step 1.5: Requesting App Tracking Transparency permission
[Facebook] ATT Permission result: granted  ← KEY!
[Facebook] Tracking permission granted
[Facebook] Step 8: Access token check: { hasAccessToken: true, tokenLength: 200+ }
[Facebook] Firebase sign-in successful!
```

## Key Points

✅ **Must Request ATT** before Facebook login  
✅ **User must allow** tracking for best results  
✅ **Timing is critical** - ATT before LoginManager.logInWithPermissions()  
✅ **Already configured** in Podfile and Info.plist  

## If Still Failing

### Check ATT Permission
Settings → Privacy & Security → Tracking → [Your App] → ON

### Check Console for:
```
[Facebook] ATT Permission result: denied  ← Problem!
```

If denied, user needs to enable in Settings or reinstall app and allow when prompted.

## Files Modified
- ✅ `src/services/auth.service.ts` - Added ATT request
- ✅ `ios/Podfile` - AppTrackingTransparency enabled (line 18)
- ✅ `ios/GermanTelcB1App/Info.plist` - NSUserTrackingUsageDescription added

## Documentation
- `FACEBOOK_ATT_FIX.md` - Detailed explanation
- `FACEBOOK_TESTING_GUIDE.md` - Testing instructions  
- `FACEBOOK_TROUBLESHOOTING.md` - Common issues

---

**Status**: ✅ Ready to Test  
**Next Step**: Clean build and test Facebook sign-in  
**Key**: User MUST allow tracking when prompted!

