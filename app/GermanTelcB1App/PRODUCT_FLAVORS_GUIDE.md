# Android Product Flavors Guide

## Overview

This project uses **Android Product Flavors** to support multiple exam apps from a single codebase. This is the industry-standard approach for building multiple variants of an Android app.

## What Are Product Flavors?

Product Flavors allow you to create different versions of your app from the same source code, each with:
- Different package names (applicationId)
- Different app names
- Different Firebase configurations
- Same source code and namespace

## Available Flavors

| Flavor | Exam ID | Application ID | App Name |
|--------|---------|----------------|----------|
| `germanB1` | german-b1 | `com.mhamada.telcb1german` | German TELC B1 |
| `germanB2` | german-b2 | `com.mhamada.telcb2german` | German TELC B2 |
| `englishB1` | english-b1 | `com.mhamada.telcb1english` | English TELC B1 |

## 🚀 Running in Development Mode

### Quick Start (Default: German B1)
```bash
npm run android
# or
npm start  # In one terminal
npx react-native run-android  # In another terminal
```

### Run Specific Flavor
```bash
# German B1
npm run android:german-b1

# German B2
npm run android:german-b2

# English B1
npm run android:english-b1
```

### Manual Variant Selection
```bash
# Using React Native CLI directly with mode flag
npx react-native run-android --mode=germanB1Debug --appId com.mhamada.telcb1german
npx react-native run-android --mode=germanB2Debug --appId com.mhamada.telcb2german
npx react-native run-android --mode=englishB1Debug --appId com.mhamada.telcb1english

# Using Gradle directly
cd android
./gradlew installGermanB1Debug
./gradlew installGermanB2Debug
./gradlew installEnglishB1Debug
cd ..
```

## 📦 Building Release APKs/AABs

### Build APK (for testing)
```bash
npm run build:android:apk:german-b1
npm run build:android:apk:german-b2
npm run build:android:apk:english-b1
```

### Build AAB (for Play Store)
```bash
npm run build:android:german-b1
npm run build:android:german-b2
npm run build:android:english-b1
```

## 📁 Project Structure

### Source Code (Shared)
```
android/app/src/main/
├── java/com/mhamada/telcb1german/  # Shared source code (namespace never changes)
│   ├── MainActivity.kt
│   └── MainApplication.kt
├── res/
│   └── values/
│       └── strings.xml  # Base strings (app_name set by flavor)
└── AndroidManifest.xml  # Shared manifest
```

### Flavor-Specific Files
```
android/app/src/
├── germanB1/
│   └── google-services.json  # Firebase config for German B1
├── germanB2/
│   └── google-services.json  # Firebase config for German B2
└── englishB1/
    └── google-services.json  # Firebase config for English B1
```

### Configuration Files (Root Level)
```
android/app/
├── google-services.german-b1.json  # Source config (backed up)
├── google-services.german-b2.json  # Source config (backed up)
└── google-services.json            # Active config (git-ignored, generated)
```

## 🔧 How It Works

### 1. Namespace (Fixed)
- **Value**: `com.mhamada.telcb1german`
- **Purpose**: Tells Android where source code lives
- **Never changes**: All flavors use the same namespace

### 2. Application ID (Per Flavor)
- **Purpose**: Unique identifier in Play Store
- **Changes per flavor**:
  - germanB1: `com.mhamada.telcb1german`
  - germanB2: `com.mhamada.telcb2german`
  - englishB1: `com.mhamada.telcb1english`

### 3. Build Variants
Gradle creates variants by combining flavors with build types:
- **Debug Variants**: `germanB1Debug`, `germanB2Debug`, `englishB1Debug`
- **Release Variants**: `germanB1Release`, `germanB2Release`, `englishB1Release`

## 🔥 Firebase Configuration

Each flavor has its own `google-services.json` file in its flavor directory:

1. **Download** from Firebase Console for each project
2. **Place** in `android/app/src/<flavorName>/google-services.json`
3. **Gradle automatically** uses the correct config for each flavor

No need to manually copy files during builds!

## ⚙️ Configuration

### build.gradle
```gradle
android {
    namespace "com.mhamada.telcb1german"  // Fixed for all flavors
    
    defaultConfig {
        applicationId "com.mhamada.telcb1german"  // Default
    }
    
    flavorDimensions "exam"
    productFlavors {
        germanB1 {
            dimension "exam"
            applicationId "com.mhamada.telcb1german"
            resValue "string", "app_name", "German TELC B1"
        }
        germanB2 {
            dimension "exam"
            applicationId "com.mhamada.telcb2german"
            resValue "string", "app_name", "German TELC B2"
        }
        englishB1 {
            dimension "exam"
            applicationId "com.mhamada.telcb1english"
            resValue "string", "app_name", "English TELC B1"
        }
    }
}
```

## 🎯 Benefits

### ✅ Development
- Run any app variant directly on emulator/device
- No manual configuration switching
- Fast iteration with hot reload

### ✅ Release Builds
- Single command to build specific app
- Correct Firebase config automatically selected
- No risk of using wrong configuration

### ✅ Maintenance
- All apps share same codebase
- Fix bugs once, all apps benefit
- Easy to add new exam variants

## 📱 Testing Multiple Apps

You can install multiple flavors on the same device simultaneously:

```bash
# Install all variants
npm run android:german-b1  # Installs German B1
npm run android:german-b2  # Installs German B2 (separate app)
npm run android:english-b1 # Installs English B1 (separate app)
```

Each app appears as a separate app on the device with its own:
- Icon
- App name
- Firebase project
- Local storage

## 🐛 Troubleshooting

### Issue: App crashes with "ClassNotFoundException"
**Solution**: Clean build and rebuild
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android --variant=germanB2Debug
```

### Issue: Wrong Firebase project being used
**Solution**: Check that correct `google-services.json` is in flavor directory
```bash
# Verify flavor-specific configs exist
ls -la android/app/src/germanB1/google-services.json
ls -la android/app/src/germanB2/google-services.json
ls -la android/app/src/englishB1/google-services.json
```

### Issue: "Task not found" error
**Solution**: Make sure flavor name matches exactly (case-sensitive)
```bash
# ❌ Wrong
./gradlew assembleGermanb1Release

# ✅ Correct
./gradlew assembleGermanB1Release
```

## 🆕 Adding a New Flavor

1. **Update `build.gradle`**:
```gradle
germanB3 {
    dimension "exam"
    applicationId "com.mhamada.telcb3german"
    resValue "string", "app_name", "German TELC B3"
}
```

2. **Add Firebase config**:
```bash
mkdir -p android/app/src/germanB3
cp path/to/google-services.json android/app/src/germanB3/
```

3. **Update scripts**:
- Add to `build-android.sh` flavor mapping
- Add npm scripts to `package.json`

4. **Test**:
```bash
npx react-native run-android --mode=germanB3Debug --appId com.mhamada.telcb3german
```

## 📚 Additional Resources

- [Android Product Flavors Documentation](https://developer.android.com/build/build-variants)
- [Firebase Multiple Environments](https://firebase.google.com/docs/projects/multiprojects)
- [React Native Build Variants](https://reactnative.dev/docs/building-for-different-platforms)

