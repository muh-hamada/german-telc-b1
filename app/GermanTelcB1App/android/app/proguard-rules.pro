# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Keep react-native-gesture-handler
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Keep React Native Animated nodes
-keep class com.facebook.react.animated.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }

# Keep Fabric/New Architecture
-keep class com.facebook.react.fabric.** { *; }
-keep class com.facebook.react.modules.** { *; }

# Keep Hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep SoLoader - critical for native library loading
-keep class com.facebook.soloader.** { *; }
-dontwarn com.facebook.soloader.**

# Keep React Native feature flags - critical for New Architecture
-keep class com.facebook.react.internal.featureflags.** { *; }
-dontwarn com.facebook.react.internal.featureflags.**

# Keep all classes related to native library loading
-keep class com.facebook.react.defaults.** { *; }
-keep class com.facebook.react.ReactNativeApplicationEntryPoint { *; }

# Keep native methods and classes
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep annotations
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions

