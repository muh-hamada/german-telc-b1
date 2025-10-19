# Facebook Login Setup Guide

## The Problem
The app crashes at `LoginManager.logInWithPermissions()` because the Facebook SDK is not properly configured with valid credentials.

## Solution

### Step 1: Create a Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Consumer" as the app type
4. Fill in the app details:
   - App Name: "German TELC B1 App"
   - Contact Email: Your email
5. Click "Create App"

### Step 2: Get Your Facebook App Credentials
1. In your Facebook App Dashboard, go to "Settings" → "Basic"
2. Copy the **App ID** (e.g., `1234567890123456`)
3. Go to "Settings" → "Advanced"
4. Copy the **Client Token**

### Step 3: Configure Android
1. In Facebook App Dashboard, click "Add Platform" → "Android"
2. Add your package name: `com.mhamada.telcb1german`
3. Add your debug key hash:
   ```bash
   cd android
   ./gradlew signingReport
   # Copy the SHA1 from the debug keystore
   ```
4. Or generate key hash:
   ```bash
   keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64
   ```
   Default password is: `android`

### Step 4: Update App Configuration Files

#### 1. Update `android/app/src/main/res/values/strings.xml`
Replace `YOUR_FACEBOOK_APP_ID` and `YOUR_FACEBOOK_CLIENT_TOKEN` with your actual values:
```xml
<string name="facebook_app_id">1234567890123456</string>
<string name="fb_login_protocol_scheme">fb1234567890123456</string>
<string name="facebook_client_token">YOUR_CLIENT_TOKEN_HERE</string>
```

#### 2. Update `src/config/firebase.config.ts`
Replace the Facebook config values:
```typescript
export const facebookConfig = {
  appId: "1234567890123456",
  appName: "German TELC B1 App",
  clientToken: "YOUR_CLIENT_TOKEN_HERE",
};
```

### Step 5: Enable Facebook Login in Firebase
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable "Facebook" provider
3. Enter your Facebook App ID and App Secret (from Facebook Dashboard)
4. Copy the OAuth redirect URI from Firebase
5. Add this URI to Facebook App:
   - Facebook Dashboard → Products → Facebook Login → Settings
   - Add the redirect URI to "Valid OAuth Redirect URIs"
   - Example: `https://telc-b1-german.firebaseapp.com/__/auth/handler`

### Step 6: Rebuild the App
```bash
cd android
./gradlew clean
cd ..
npm run android
```

## Testing Facebook Login
1. Make sure you're using a physical device or an emulator with Google Play Services
2. The Facebook app doesn't need to be installed (SDK handles it via browser)
3. For testing, add test users in Facebook Dashboard → Roles → Test Users

## Common Issues

### Issue: "App Not Set Up: This app is still in development mode"
**Solution**: In Facebook Dashboard, go to "Settings" → "Basic" and toggle "App Mode" to "Live"

### Issue: "Invalid Key Hash"
**Solution**: Regenerate the key hash and add it to Facebook Dashboard

### Issue: App crashes immediately on login
**Solution**: Make sure:
- Facebook App ID and Client Token are correctly set in `strings.xml`
- AndroidManifest.xml has the Facebook meta-data tags
- The app has been rebuilt after configuration changes

## Alternative: Disable Facebook Login Temporarily
If you want to disable Facebook login for now, you can comment it out in the LoginModal or use Google/Email authentication instead.

