# Google Sign-In DEVELOPER_ERROR - Troubleshooting Guide

## Issue
Error: `DEVELOPER_ERROR` when attempting Google Sign-In

## Your Configuration
- **Package Name**: `com.mhamada.telcb1german`
- **Debug SHA-1**: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- **SHA-256**: `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`
- **Web Client ID**: `494473710301-vr1l4s8eaokh62nj6c91fol3pcfmu531.apps.googleusercontent.com`

## Solutions (Try in order)

### 1. ✅ Add SHA-1 Fingerprint to Firebase Console (Most Common Fix)

**Steps:**
1. Go to https://console.firebase.google.com/
2. Select project: **telc-b1-german**
3. Click ⚙️ (Settings) → **Project settings**
4. Scroll to "Your apps" → Select Android app
5. Under "SHA certificate fingerprints", click **"Add fingerprint"**
6. Add both:
   - **SHA-1**: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
   - **SHA-256**: `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`
7. **Important**: Download the updated `google-services.json`
8. Replace `android/app/google-services.json` with the new file
9. Clean and rebuild:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx react-native run-android
   ```

### 2. ✅ Enable Google Sign-In in Firebase Console

1. Go to Firebase Console → **Authentication**
2. Click **Sign-in method** tab
3. Find **Google** in the providers list
4. Click **Google** → Enable it
5. Set support email
6. Save

### 3. ✅ Verify OAuth 2.0 Client IDs in Google Cloud Console

1. Go to https://console.cloud.google.com/
2. Select project: **telc-b1-german**
3. Go to **APIs & Services** → **Credentials**
4. Verify you have:
   - **Android OAuth 2.0 Client** with package name `com.mhamada.telcb1german` and SHA-1
   - **Web OAuth 2.0 Client** (this is your webClientId)

### 4. ✅ Verify webClientId Configuration

Make sure your `webClientId` in the code matches the **Web OAuth 2.0 Client ID** from Google Cloud Console.

Current config in `firebase.config.ts`:
```typescript
webClientId: "494473710301-vr1l4s8eaokh62nj6c91fol3pcfmu531.apps.googleusercontent.com"
```

**To find the correct Web Client ID:**
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Look for "OAuth 2.0 Client IDs" of type "Web application"
3. Copy the Client ID (NOT the Android client ID)

### 5. ✅ If you created a new Android OAuth Client

If you just created an Android OAuth client in Google Cloud Console:

1. Make sure the **Package name** is: `com.mhamada.telcb1german`
2. Make sure the **SHA-1** is: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
3. Wait 5-10 minutes for Google's servers to propagate the changes
4. Clear app data and reinstall:
   ```bash
   adb uninstall com.mhamada.telcb1german
   npx react-native run-android
   ```

### 6. ✅ For Release Builds

If testing a release build, you need a **release keystore SHA-1**:

```bash
keytool -list -v -keystore android/app/release.keystore -alias release-key
```

Add this SHA-1 to Firebase Console as well.

## Quick Check Commands

```bash
# 1. Get your SHA-1 (already done)
cd android && ./gradlew signingReport

# 2. Verify package name in google-services.json
grep "package_name" android/app/google-services.json

# 3. Clean and rebuild
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

## Still Not Working?

Try this complete reset:

```bash
# 1. Uninstall app
adb uninstall com.mhamada.telcb1german

# 2. Clean everything
cd android
./gradlew clean
./gradlew cleanBuildCache
rm -rf .gradle
cd ..

# 3. Clear Metro cache
npm start -- --reset-cache

# 4. Reinstall (in new terminal)
npx react-native run-android
```

## Common Mistakes

1. ❌ Using **Android Client ID** as `webClientId` (should use **Web Client ID**)
2. ❌ Not downloading updated `google-services.json` after adding SHA-1
3. ❌ SHA-1 not matching your debug keystore
4. ❌ Not waiting 5-10 minutes after making changes in Google Cloud Console
5. ❌ Wrong package name in OAuth client configuration

## Need More Help?

Check the official troubleshooting guide:
https://react-native-google-signin.github.io/docs/troubleshooting

Or check Firebase Auth troubleshooting:
https://firebase.google.com/docs/auth/android/google-signin#troubleshooting


