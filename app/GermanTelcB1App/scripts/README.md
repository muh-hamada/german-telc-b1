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
- Copies them to `ios/ExamPreparationApp/Images.xcassets/AppIcon.appiconset/`
- Verifies all icons were generated successfully

**Requirements**:
- macOS (uses `sips` command)
- Source image must exist in `logos/ios/` directory

**Supported Exam IDs**:
- `german-b1` → `logos/ios/logo-ios-german-b1.png`
- `german-b2` → `logos/ios/logo-ios-german-b2.png`
- `english-b1` → `logos/ios/logo-ios-english-b1.png`
- `english-b2` → `logos/ios/logo-ios-english-b2.png`
- `german-a1` → `logos/ios/logo-ios-german-a1.png`

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
4. **Copies launcher background (language-specific) to all Android mipmap directories**

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
- **Updates `ios/ExamPreparationApp/Info.plist` with `CFBundleDisplayName` and `CFBundleIdentifier`**
- Updates AdMob App IDs for iOS
- Generates `src/config/active-exam.config.ts` with active exam configuration
- Firebase config is handled separately via `build-config.sh`

---

### 4. `verify-i18n.sh`
**Purpose**: Verifies translation file consistency across all languages and ensures all locales have matching keys with the English reference.

**Usage**:
```bash
./scripts/verify-i18n.sh
```

**What it does**:
1. Clears Metro bundler and watchman caches
2. Verifies all translation files exist (en, de, ar, es, fr, ru)
3. Validates JSON syntax for all locale files
4. Extracts all keys from each locale file
5. Compares each locale against English (reference) to find:
   - Missing keys (keys in en.json but not in other locales)
   - Reports missing locale files
6. Verifies i18n.ts configuration
7. Checks active exam configuration

**Exit Codes**:
- `0` - All translation keys are in sync across all locales
- `1` - Missing translation keys detected or validation failed

**Pre-commit Hook**:
This script runs automatically as a pre-commit hook to prevent commits with missing translation keys. If any locale is missing keys that exist in en.json, the commit will be blocked.

**Important**:
- English (en.json) is always used as the reference
- All other locales must have exactly the same keys as English
- Missing locale files are treated as failures
- Invalid JSON syntax will fail the verification

---

## Git Hooks

### Pre-commit Hook
The project uses [Husky](https://typicode.github.io/husky/) to manage git hooks. A pre-commit hook is configured at the repository root (`../../.husky/pre-commit`) that automatically runs the `verify-i18n.sh` script before every commit.

**What happens during pre-commit**:
1. The hook runs `verify-i18n.sh` automatically
2. If translation keys are missing in any locale:
   - The commit is **blocked**
   - An error message shows which keys are missing in which locales
   - You must add the missing translation keys before committing
3. If all translations are in sync:
   - The commit proceeds normally

**Setup** (already configured):
```bash
# Husky is installed and configured at the project root
# Pre-commit hook location: ../../.husky/pre-commit
```

**Bypassing the hook** (not recommended):
```bash
# Only use this if absolutely necessary
git commit --no-verify -m "your message"
```

**Important**: The pre-commit hook ensures that incomplete translations are never pushed to GitHub, maintaining translation consistency across all languages.

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
- `logos/ios/logo-ios-german-a1.png`

### Android Logos
- **Location**: Root directory (will be improved in future)
- **Format**: PNG
- **Recommended size**: 512x512px or higher
- **Naming convention**: `launcher-icon-{level}.png`

Examples:
- `launcher-icon-b1.png`
- `launcher-icon-b2.png`

### Android Launcher Backgrounds
- **Location**: `logos/android/`
- **Format**: PNG
- **Recommended size**: 1024x1024px
- **Naming convention**: `ic_launcher_background-{language}.png`

Examples:
- `logos/android/ic_launcher_background-german.png`
- `logos/android/ic_launcher_background-english.png`

**Note**: The background is language-specific (german, english), while the foreground icon is level-specific (b1, b2). This allows you to:
- Use the same background for both B1 and B2 apps of the same language
- Use different foreground icons to distinguish between B1 and B2 levels

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
ios/ExamPreparationApp/Images.xcassets/AppIcon.appiconset/backup_YYYYMMDD_HHMMSS/
```

To restore from backup:
```bash
cp ios/ExamPreparationApp/Images.xcassets/AppIcon.appiconset/backup_20251115_065633/*.png \
   ios/ExamPreparationApp/Images.xcassets/AppIcon.appiconset/
```

---

## Notes

- All scripts assume they are run from the app root directory (`app/GermanTelcB1App/`)
- Scripts use colored output for better readability
- Exit codes: 0 = success, non-zero = failure
- Always review the output for warnings or errors

