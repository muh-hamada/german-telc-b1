# Complete Fix for libreact_featureflagsjni.so Missing Error

## Problem Summary

**Error:** `java.lang.UnsatisfiedLinkError: dlopen failed: library "libreact_featureflagsjni.so" not found`

**Symptoms:**
- App crashes on startup on Android 11/12 real devices
- Works fine on emulators
- Occurs in React Native 0.82+ with New Architecture enabled

**Root Cause:**
The `libreact_featureflagsjni.so` native library (part of React Native's New Architecture feature flags system) is not being built or included in the release APK.

---

## The Complete Fix

### Step 1: Clean Everything

```bash
cd your-react-native-app

# Clean node_modules
rm -rf node_modules package-lock.json
npm install

# Clean Android build artifacts
rm -rf android/app/.cxx
cd android
rm -rf .gradle app/build build
cd ..
```

### Step 2: Update MainApplication.kt

Add explicit SoLoader initialization **before** `loadReactNative()`:

```kotlin
package com.your.package

import android.app.Application
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList = PackageList(this).packages.apply {
        // Packages that cannot be autolinked yet can be added manually here
      },
    )
  }

  override fun onCreate() {
    super.onCreate()
    
    // Explicitly initialize SoLoader BEFORE loadReactNative
    try {
      Log.d("MainApplication", "Initializing SoLoader...")
      SoLoader.init(this, OpenSourceMergedSoMapping)
      Log.d("MainApplication", "SoLoader initialized successfully")
    } catch (e: Exception) {
      Log.e("MainApplication", "Failed to initialize SoLoader", e)
      throw e
    }
    
    loadReactNative(this)
  }
}
```

**Important:** Use `OpenSourceMergedSoMapping`, not `false`. This is React Native's optimized SO mapping for production.

### Step 3: Enhanced ProGuard Rules

Add to `android/app/proguard-rules.pro`:

```proguard
# Keep SoLoader - critical for native library loading
-keep class com.facebook.soloader.** { *; }
-keep interface com.facebook.soloader.** { *; }
-keepclassmembers class com.facebook.soloader.** { *; }
-keepclasseswithmembers class com.facebook.soloader.** { *; }
-dontwarn com.facebook.soloader.**
-dontnote com.facebook.soloader.**

# Keep SoLoader specific classes
-keep,allowobfuscation class com.facebook.soloader.SoLoader {
    public static <methods>;
    public static <fields>;
}
-keep class com.facebook.soloader.SoLoaderULError { *; }
-keep class com.facebook.soloader.SoLoaderDSONotFoundError { *; }
-keep class com.facebook.soloader.DirectorySoSource { *; }
-keep class com.facebook.soloader.ApkSoSource { *; }

# Keep React Native feature flags
-keep class com.facebook.react.internal.featureflags.** { *; }
-dontwarn com.facebook.react.internal.featureflags.**

# Keep React Native feature flags - critical for New Architecture
-keep class com.facebook.react.defaults.** { *; }
-keep class com.facebook.react.ReactNativeApplicationEntryPoint { *; }

# Keep native methods and classes
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep annotations
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exception
```

### Step 4: Verify build.gradle Settings

In `android/app/build.gradle`, ensure these settings:

```gradle
android {
    // ...
    
    defaultConfig {
        // ...
        
        // Explicitly specify ABI filters
        ndk {
            abiFilters 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
        }
    }
    
    buildTypes {
        release {
            minifyEnabled true      // Must be true for production
            shrinkResources true    // Must be true for production
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
            // ... other settings
        }
    }
    
    packagingOptions {
        jniLibs {
            useLegacyPackaging = true
            keepDebugSymbols += ["**/*.so"]
        }
        
        // Ensure React Native native libraries are not stripped
        doNotStrip '**/libreactnative.so'
        doNotStrip '**/libhermes.so'
        doNotStrip '**/libfbjni.so'
        doNotStrip '**/libc++_shared.so'
    }
}
```

### Step 5: Verify gradle.properties

Ensure `android/gradle.properties` has:

```properties
# React Native Architecture
newArchEnabled=true
hermesEnabled=true

# Gradle memory (if you had OutOfMemoryError issues)
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

### Step 6: Rebuild

```bash
cd android
./gradlew assembleYourFlavorRelease
```

### Step 7: CRITICAL - Verify the Library Exists

After building, **verify the library is actually in the APK**:

```bash
unzip -l android/app/build/outputs/apk/yourFlavor/release/app-yourFlavor-release.apk | grep featureflag
```

**You MUST see these lines:**
```
lib/arm64-v8a/libreact_featureflagsjni.so
lib/armeabi-v7a/libreact_featureflagsjni.so
lib/x86/libreact_featureflagsjni.so
lib/x86_64/libreact_featureflagsjni.so
```

**If the library is NOT there**, the ProGuard rules won't help - the library isn't being built at all.

---

## If Library is Still Missing After Clean Build

### Option 1: Verify NDK Version

Check `android/build.gradle`:

```gradle
buildscript {
    ext {
        ndkVersion = "27.1.12297006"  // Must match what React Native 0.82 expects
    }
}
```

Verify NDK is installed:
```bash
ls -la ~/Library/Android/sdk/ndk/
# or
ls -la $ANDROID_HOME/ndk/
```

### Option 2: Check CMake Codegen

The error occurs because CMake can't find codegen directories. Verify they're being generated:

```bash
# After a build attempt, these should exist:
ls android/app/build/generated/autolinking/src/main/jni/
```

### Option 3: Update React Native

If on React Native 0.82.0, update to 0.82.1+ or latest:

```bash
npm install react-native@latest --save
npm install @react-native/new-app-screen@latest --save
npm install @react-native/babel-preset@latest --save-dev
npm install @react-native/eslint-config@latest --save-dev
npm install @react-native/metro-config@latest --save-dev
npm install @react-native/typescript-config@latest --save-dev
```

Then rebuild completely.

---

## What NOT to Do

❌ **Don't disable minification** (`minifyEnabled false`)
- This balloons APK size from ~140MB to ~190MB
- It's a band-aid, not a fix
- The library is still missing even with minification disabled

❌ **Don't disable New Architecture**
- React Native 0.82+ requires New Architecture
- Setting `newArchEnabled=false` is ignored in 0.82+

❌ **Don't only add ProGuard keep rules**
- ProGuard rules prevent *stripping* of existing code
- They don't make the build system *create* missing libraries
- The library must be built first

---

## Testing the Fix

1. **Build release APK**
2. **Verify library exists in APK** (see Step 7 above)
3. **Install on real Android 11/12 device**
4. **Check logcat for SoLoader logs:**

```bash
adb logcat | grep -E "(SoLoader|MainApplication)"
```

You should see:
```
D MainApplication: Initializing SoLoader...
W SoLoader: Initializing SoLoader: 0
W SoLoader: SoLoader initialized: 0
D MainApplication: SoLoader initialized successfully
```

5. **App should launch without crashes**

---

## Summary

The fix requires:
1. ✅ Clean rebuild of node_modules and Android build
2. ✅ Explicit SoLoader initialization with `OpenSourceMergedSoMapping`
3. ✅ Comprehensive ProGuard keep rules
4. ✅ Proper packaging options in build.gradle
5. ✅ **Verify the .so library actually exists in the APK**

The key insight: This is NOT just a ProGuard stripping issue - it's the native library not being built at all by React Native's build system in certain configurations.

---

## References

- [React Native 0.82 Release Notes](https://reactnative.dev/blog/2025/10/08/react-native-0.82)
- [GitHub Issue #50144](https://github.com/facebook/react-native/issues/50144) - Similar issue in RN 0.78
- [GitHub Issue #51102](https://github.com/facebook/react-native/issues/51102) - Similar issue in RN 0.79
- React Native New Architecture requires all native libraries to be properly linked
