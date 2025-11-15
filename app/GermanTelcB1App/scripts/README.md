# Build Scripts Documentation

This directory contains automation scripts for managing multi-app configurations and builds.

## Scripts Overview

### 1. `generate-ios-icons.sh`
**Purpose**: Automatically resizes and copies app logos to iOS Assets folder for all required icon sizes.

**Usage**:
```bash
./scripts/generate-ios-icons.sh <exam-id>
```

**Example**:
```bash
./scripts/generate-ios-icons.sh german-b1
```

**What it does**:
- Finds the source logo from `logos/ios/logo-ios-{exam-id}.png`
- Creates backup of existing icons with timestamp
- Generates all 9 required iOS icon sizes using `sips`:
  - 40x40px (20@2x)
  - 60x60px (20@3x)
  - 58x58px (29@2x)
  - 87x87px (29@3x)
  - 80x80px (40@2x)
  - 120x120px (40@3x and 60@2x)
  - 180x180px (60@3x)
  - 1024x1024px (App Store)
- Copies them to `ios/TelcExamApp/Images.xcassets/AppIcon.appiconset/`
- Verifies all icons were generated successfully

**Requirements**:
- macOS (uses `sips` command)
- Source image must exist in `logos/ios/` directory

**Supported Exam IDs**:
- `german-b1` → `logos/ios/logo-ios-german-b1.png`
- `german-b2` → `logos/ios/logo-ios-german-b2.png`
- `english-b1` → `logos/ios/logo-ios-english-b1.png`
- `english-b2` → `logos/ios/logo-ios-english-b2.png`

---

### 2. `build-config.sh`
**Purpose**: Main build configuration script that applies exam-specific settings and prepares the app for building.

**Usage**:
```bash
./scripts/build-config.sh <exam-id> <platform>
```

**Example**:
```bash
./scripts/build-config.sh german-b1 ios
./scripts/build-config.sh german-b2 android
```

**What it does**:

#### For Android:
1. Runs `apply-exam-config.js` to update app configuration
2. Copies Firebase `google-services.json` for the specific exam
3. Copies app icon logo to all Android mipmap directories

#### For iOS:
1. Runs `apply-exam-config.js` to update app configuration
2. **Updates `Info.plist` with display name and bundle ID**
3. Copies Firebase `GoogleService-Info.plist` for the specific exam
4. **Automatically generates all iOS app icons using `generate-ios-icons.sh`**

---

### 3. `apply-exam-config.js`
**Purpose**: Node.js script that updates app.json and generates active-exam.config.ts with exam-specific settings.

**Usage**:
```bash
node scripts/apply-exam-config.js <exam-id> <platform>
```

**What it does**:

#### For Android:
- Updates `app.json` with exam-specific Bundle ID, Display Name
- Updates `android/app/build.gradle` with application ID
- Updates `android/app/src/main/res/values/strings.xml` with app name
- Updates AdMob App IDs for Android
- Updates `MainActivity.kt` and `settings.gradle` with component names
- Generates `src/config/active-exam.config.ts` with active exam configuration

#### For iOS:
- Updates `app.json` with exam-specific Bundle ID, Display Name
- **Updates `ios/TelcExamApp/Info.plist` with `CFBundleDisplayName` and `CFBundleIdentifier`**
- Updates AdMob App IDs for iOS
- Generates `src/config/active-exam.config.ts` with active exam configuration
- Firebase config is handled separately via `build-config.sh`

---

### 4. `verify-i18n.sh`
**Purpose**: Verifies translation file consistency across all languages.

**Usage**:
```bash
./scripts/verify-i18n.sh
```

**What it does**:
- Checks for missing translation keys
- Validates translation file structure
- Reports inconsistencies across languages

---

### 5. `clear-caches.sh`
**Purpose**: Clears all React Native and build caches.

**Usage**:
```bash
./scripts/clear-caches.sh
```

**What it does**:
- Clears Metro bundler cache
- Clears watchman cache
- Clears React Native temp files
- Clears iOS build cache (if on macOS)
- Clears Android build cache

---

## Complete Build Workflow

### iOS Build:
```bash
# 1. Apply configuration and generate icons
./scripts/build-config.sh german-b1 ios

# 2. Clean build (optional)
cd ios && xcodebuild clean && cd ..

# 3. Build and run
npm run ios
```

### Android Build:
```bash
# 1. Apply configuration and copy icons
./scripts/build-config.sh german-b1 android

# 2. Clean build (optional)
cd android && ./gradlew clean && cd ..

# 3. Build and run
npm run android
```

---

## Source Logo Requirements

### iOS Logos
- **Location**: `logos/ios/`
- **Format**: PNG
- **Recommended size**: 1024x1024px or higher
- **Naming convention**: `logo-ios-{exam-id}.png`

Examples:
- `logos/ios/logo-ios-german-b1.png`
- `logos/ios/logo-ios-german-b2.png`
- `logos/ios/logo-ios-english-b1.png`
- `logos/ios/logo-ios-english-b2.png`

### Android Logos
- **Location**: Root directory (will be improved in future)
- **Format**: PNG
- **Recommended size**: 512x512px or higher
- **Naming convention**: `launcher-icon-{level}.png`

Examples:
- `launcher-icon-b1.png`
- `launcher-icon-b2.png`

---

## Troubleshooting

### iOS Icon Generation Fails
**Problem**: Script reports "sips command not found"
**Solution**: This script only works on macOS. Use manual icon generation on other platforms.

**Problem**: "Source image not found"
**Solution**: Ensure the logo file exists in `logos/ios/` with the correct naming convention.

### Build Configuration Issues
**Problem**: Firebase configuration not found
**Solution**: Ensure you have the exam-specific Firebase config files:
- iOS: `ios/GoogleService-Info.{exam-id}.plist`
- Android: `android/app/google-services.{exam-id}.json`

**Problem**: Icons not updating after build
**Solution**:
1. Clean build folder: `cd ios && xcodebuild clean`
2. Rebuild: `npm run ios`

---

## Backup and Recovery

### Icon Backups
When `generate-ios-icons.sh` runs, it automatically creates a backup of existing icons in:
```
ios/TelcExamApp/Images.xcassets/AppIcon.appiconset/backup_YYYYMMDD_HHMMSS/
```

To restore from backup:
```bash
cp ios/TelcExamApp/Images.xcassets/AppIcon.appiconset/backup_20251115_065633/*.png \
   ios/TelcExamApp/Images.xcassets/AppIcon.appiconset/
```

---

## Notes

- All scripts assume they are run from the app root directory (`app/GermanTelcB1App/`)
- Scripts use colored output for better readability
- Exit codes: 0 = success, non-zero = failure
- Always review the output for warnings or errors

