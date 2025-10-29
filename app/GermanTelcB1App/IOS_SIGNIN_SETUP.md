# iOS Sign-In Setup Guide

All three sign-in methods (Apple, Google, and Facebook) have been implemented for iOS. Follow these final steps to complete the setup:

## ✅ What's Already Done

1. ✅ Installed `@invertase/react-native-apple-authentication` package
2. ✅ Implemented Apple Sign-In in `auth.service.ts`
3. ✅ Added Google Sign-In URL scheme to `Info.plist`
4. ✅ Configured Facebook SDK in `Info.plist` and `AppDelegate.swift`
5. ✅ Updated `AppDelegate.swift` to handle URL schemes
6. ✅ Ran `pod install` to update dependencies

## 🔧 Final Steps in Xcode

You need to complete these steps in Xcode to enable Apple Sign-In:

### 1. Open the Project in Xcode
```bash
cd /Users/mham/projects/german-telc-b1/app/GermanTelcB1App/ios
open GermanTelcB1App.xcworkspace
```

### 2. Enable Apple Sign-In Capability

1. In Xcode, select your project in the navigator
2. Select your target (`GermanTelcB1App`)
3. Go to the "Signing & Capabilities" tab
4. Click the "+ Capability" button
5. Search for and add "Sign in with Apple"
6. Make sure you're signed in with your Apple Developer account

### 3. Update Bundle Identifier (if needed)

Make sure your Bundle Identifier matches what's configured in your Apple Developer account.

### 4. Build and Run

After adding the capability, build and run the app:

```bash
# From the project root
cd /Users/mham/projects/german-telc-b1/app/GermanTelcB1App
npm run ios
```

Or use Xcode directly:
- Press `Cmd + R` to build and run

## 🧪 Testing Each Sign-In Method

### Apple Sign-In
- **Requirements**: iOS 13+ device or simulator
- **Works on**: Real iOS devices (preferred), iOS Simulator 13+
- **Note**: On first sign-in, Apple will ask the user to share their email and name

### Google Sign-In
- **URL Scheme**: `com.googleusercontent.apps.494473710301-dd0gfpdhm8cn2c7puphlef9meajjjf7g`
- **Status**: ✅ Configured and ready
- **Client IDs**: 
  - iOS: `494473710301-dd0gfpdhm8cn2c7puphlef9meajjjf7g.apps.googleusercontent.com`
  - Web: `494473710301-vr1l4s8eaokh62nj6c91fol3pcfmu531.apps.googleusercontent.com`

### Facebook Sign-In
- **App ID**: `1507568217229301`
- **URL Scheme**: `fb1507568217229301`
- **Status**: ✅ Configured and ready
- **Note**: Make sure your app is properly configured in the Facebook Developer Console

## 🔍 Troubleshooting

### Apple Sign-In Issues
- **Error: "Apple Sign-In not supported"**
  - Make sure you're running iOS 13 or later
  - Verify the "Sign in with Apple" capability is added in Xcode
  
### Google Sign-In Issues
- **Error: "Missing URL scheme"**
  - This should now be fixed. If you still see it, verify `Info.plist` has the URL scheme.
  
### Facebook Sign-In Issues
- **App crashes immediately**
  - This should now be fixed with the proper SDK initialization
  - Make sure Facebook SDK is properly linked in the Podfile
  - Verify Facebook App ID and Client Token in `Info.plist`

### General Issues
- **Build errors**: Clean build folder (`Cmd + Shift + K`), then rebuild
- **Linker errors**: Make sure you ran `pod install` after adding new dependencies
- **Runtime errors**: Check that all SDK keys match your Firebase and Facebook console

## 📝 Important Notes

1. **Apple Sign-In** is only available on iOS 13+ devices
2. **Google Sign-In** requires valid OAuth client IDs from Google Cloud Console
3. **Facebook Sign-In** requires your app to be configured in Facebook Developer Console
4. All authentication is handled through Firebase Authentication backend

## 🔐 Security

- All authentication tokens are securely managed by Firebase
- User credentials are never stored locally in plain text
- OAuth flows are handled by official SDKs (Apple, Google, Facebook)

## 📱 Platform Support

| Sign-In Method | iOS | Android | Web |
|----------------|-----|---------|-----|
| Apple          | ✅  | ❌      | ⚠️  |
| Google         | ✅  | ✅      | ✅  |
| Facebook       | ✅  | ✅      | ✅  |
| Email/Password | ✅  | ✅      | ✅  |

*Note: Apple Sign-In on Android requires special configuration and is not commonly used.*

## 🚀 Next Steps

1. Add the "Sign in with Apple" capability in Xcode
2. Build and test the app
3. Test all three sign-in methods
4. (Optional) Configure Sign in with Apple on your website if you have a web version

## 🆘 Need Help?

If you encounter any issues:
1. Check the Xcode build logs for specific error messages
2. Verify all SDK keys and credentials match your console configurations
3. Make sure your Apple Developer account is properly configured
4. Check that your Firebase project has Apple, Google, and Facebook auth enabled

