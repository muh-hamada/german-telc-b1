# App Tracking Transparency (ATT) Implementation

This document describes the implementation of App Tracking Transparency (ATT) for iOS to comply with Apple's App Store requirements.

## Overview

Apple requires apps to request permission using the App Tracking Transparency framework before collecting data used to track users. This implementation adds ATT support to the German Telc B1 app.

## What Was Implemented

### 1. iOS Info.plist Update
Added `NSUserTrackingUsageDescription` to inform users why tracking permission is needed.

**File:** `ios/TelcExamApp/Info.plist`
```xml
<key>NSUserTrackingUsageDescription</key>
<string>This app uses tracking to provide personalized ads and improve your learning experience. Your privacy is important to us.</string>
```

### 2. ATT Service
Created a new service to manage App Tracking Transparency permissions.

**File:** `src/services/app-tracking-transparency.service.ts`

Features:
- Request tracking permission with native iOS dialog
- Check current tracking status
- Determine if permission can be requested
- iOS-only implementation (gracefully handles Android)

### 3. App Initialization Update
Updated `App.tsx` to request ATT permission BEFORE initializing analytics and ads.

**Order of operations:**
1. Request ATT permission (iOS 14+)
2. Request GDPR/CCPA consent (UMP)
3. Initialize Google Mobile Ads SDK

### 4. Settings Screen Integration
Added ATT controls to the Settings screen under Privacy section.

Features:
- Display current ATT status
- Button to manage ATT permission
- Links to iOS Settings if permission already determined
- iOS-only UI (hidden on Android)

### 5. Analytics Service Update
Updated analytics service to respect ATT permissions and log status.

Features:
- Checks ATT status on initialization
- Logs tracking status for debugging
- Method to refresh ATT status when changed

### 6. Analytics Events
Added new analytics events for tracking ATT interactions:
- `SETTINGS_ATT_OPENED`
- `SETTINGS_ATT_UPDATED`

## Installation

### Step 1: Install Required Package

```bash
cd app/GermanTelcB1App
npm install react-native-tracking-transparency
```

### Step 2: Install iOS Pods

```bash
cd ios
pod install
cd ..
```

### Step 3: Add Translation Keys

Add the following keys to your translation files:

**English (en.json):**
```json
{
  "settings": {
    "attTitle": "App Tracking Transparency",
    "attInfo": "Control whether apps can track your activity across other companies' apps and websites. When tracking is enabled, we can provide more personalized ads.",
    "attNotAvailable": "Not available",
    "attNotAvailableMessage": "App Tracking Transparency is only available on iOS 14 and later.",
    "attDescription": "Allow tracking to enable personalized ads and improve your experience?",
    "attAlreadyDetermined": "Tracking permission is already set to: {{status}}. You can change it in iOS Settings.",
    "attAuthorized": "Tracking enabled. Thank you for helping us improve your experience!",
    "attDenied": "Tracking disabled. We respect your privacy choice.",
    "attError": "Unable to request tracking permission. Please try again.",
    "manageAttPermission": "Manage Tracking Permission",
    "requestPermission": "Request Permission"
  }
}
```

**German (de.json):**
```json
{
  "settings": {
    "attTitle": "App-Tracking-Transparenz",
    "attInfo": "Kontrollieren Sie, ob Apps Ihre Aktivität über Apps und Websites anderer Unternehmen hinweg verfolgen können. Wenn das Tracking aktiviert ist, können wir personalisiertere Anzeigen bereitstellen.",
    "attNotAvailable": "Nicht verfügbar",
    "attNotAvailableMessage": "App-Tracking-Transparenz ist nur auf iOS 14 und höher verfügbar.",
    "attDescription": "Tracking erlauben, um personalisierte Anzeigen zu aktivieren und Ihr Erlebnis zu verbessern?",
    "attAlreadyDetermined": "Die Tracking-Berechtigung ist bereits festgelegt auf: {{status}}. Sie können dies in den iOS-Einstellungen ändern.",
    "attAuthorized": "Tracking aktiviert. Vielen Dank, dass Sie uns helfen, Ihr Erlebnis zu verbessern!",
    "attDenied": "Tracking deaktiviert. Wir respektieren Ihre Datenschutzwahl.",
    "attError": "Tracking-Berechtigung konnte nicht angefordert werden. Bitte versuchen Sie es erneut.",
    "manageAttPermission": "Tracking-Berechtigung verwalten",
    "requestPermission": "Berechtigung anfordern"
  }
}
```

Add similar translations for other languages (Arabic, Turkish, etc.) as needed.

### Step 4: Test the Implementation

#### Development Testing
1. Run the app: `npm run ios:german-b1`
2. The ATT permission dialog should appear on first launch
3. Check the Privacy section in Settings to verify the UI

#### Production Testing
1. Build a TestFlight version
2. Install on a real device
3. Verify ATT prompt appears before any tracking
4. Test both "Allow" and "Don't Allow" scenarios

### Step 5: Update App Store Connect

Before submitting to App Store:

1. Sign in to [App Store Connect](https://appstoreconnect.apple.com)
2. Go to your app → App Privacy
3. Update privacy information:
   - Select "Yes" for "Does your app or third-party partners collect data from this app?"
   - Add data types being collected (e.g., Advertising Data, Device ID)
   - Specify that data is used for tracking
   - Link tracking to third-party advertising

## How ATT Works

### First Launch Flow
1. App starts
2. ATT service checks permission status → "not-determined"
3. Native iOS permission dialog appears
4. User chooses "Allow Tracking" or "Ask App Not to Track"
5. Status saved by iOS
6. GDPR/CCPA consent dialog appears (if in applicable region)
7. Ads SDK initializes

### Subsequent Launches
- ATT permission status is remembered by iOS
- No permission dialog shown
- App respects user's choice
- User can change in iOS Settings → Privacy → Tracking

### Status Values
- `authorized`: User allowed tracking
- `denied`: User declined tracking
- `restricted`: Tracking restricted by device settings (e.g., parental controls)
- `not-determined`: User hasn't been asked yet
- `unavailable`: Not iOS or iOS < 14

## Testing ATT Dialog

To test the ATT dialog again after dismissing:

1. Delete the app
2. Go to iOS Settings → Privacy → Tracking
3. Reset advertising identifier: Settings → Privacy → Apple Advertising → Reset Identifier
4. Reinstall and run the app

## Compliance Notes

### What Apple Requires
- Request ATT permission BEFORE any tracking
- Clear explanation of why tracking is needed
- Respect user's choice
- Don't condition app functionality on tracking permission

### What This Implementation Does
✅ Requests ATT permission on first launch
✅ Clear user-facing message explaining tracking
✅ Respects "Don't Allow" choice
✅ App works fully without tracking enabled
✅ ATT requested BEFORE UMP consent
✅ ATT requested BEFORE ads initialization

### What You Need to Do
1. Install `react-native-tracking-transparency` package
2. Add translation keys
3. Test on real iOS device
4. Update App Store Connect privacy information
5. Submit for review

## Review Notes for Apple

When submitting to App Store, include these notes:

```
ATT Implementation:
- ATT permission is requested on first app launch before any tracking begins
- Permission dialog appears immediately after app starts
- All tracking respects user's ATT choice
- App functions fully regardless of tracking permission
- Users can manage tracking permission in Settings → Privacy → App Tracking Transparency
- Clear explanation provided about why tracking is used (personalized ads, improved experience)
```

## Troubleshooting

### ATT Dialog Not Appearing
- Ensure `NSUserTrackingUsageDescription` is in Info.plist
- Check iOS version is 14.0+
- Verify `react-native-tracking-transparency` is installed
- Delete app and reinstall
- Check console logs for errors

### TypeScript Errors
- Run `npm install` to ensure all dependencies are installed
- The ATT service uses dynamic import to avoid issues if package is missing

### Permission Already Determined
- Once user makes a choice, iOS saves it
- User must change in iOS Settings → Privacy → Tracking
- Or delete and reinstall app

## Files Modified

1. `ios/TelcExamApp/Info.plist` - Added NSUserTrackingUsageDescription
2. `src/services/app-tracking-transparency.service.ts` - New ATT service
3. `App.tsx` - Integrated ATT into initialization flow
4. `src/screens/SettingsScreen.tsx` - Added ATT UI controls
5. `src/services/analytics.service.ts` - Updated to check ATT status
6. `src/services/analytics.events.ts` - Added ATT events

## Next Steps

1. **Install the package** (see Step 1 above)
2. **Add translations** for all supported languages
3. **Test thoroughly** on iOS device
4. **Update App Store Connect** privacy settings
5. **Submit for App Review** with proper notes

## References

- [Apple ATT Documentation](https://developer.apple.com/documentation/apptrackingtransparency)
- [App Store Review Guidelines 5.1.2](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage)
- [react-native-tracking-transparency](https://github.com/Expo/react-native-tracking-transparency)

