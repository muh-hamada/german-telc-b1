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
# This is essential for React Native 0.82+ with New Architecture
-keep class com.facebook.soloader.** { *; }
-keep interface com.facebook.soloader.** { *; }
-keepclassmembers class com.facebook.soloader.** { *; }
-keepclasseswithmembers class com.facebook.soloader.** { *; }
-dontwarn com.facebook.soloader.**
-dontnote com.facebook.soloader.**

# Keep SoLoader annotations
-keepattributes *Annotation*,Signature,Exception

# Prevent SoLoader from being optimized away
-keep,allowobfuscation class com.facebook.soloader.SoLoader {
    public static <methods>;
    public static <fields>;
}
-keep class com.facebook.soloader.SoLoaderULError { *; }
-keep class com.facebook.soloader.SoLoaderDSONotFoundError { *; }
-keep class com.facebook.soloader.DirectorySoSource { *; }
-keep class com.facebook.soloader.ApkSoSource { *; }

# Keep React Native feature flags - critical for New Architecture
-keep class com.facebook.react.internal.featureflags.** { *; }
-keep interface com.facebook.react.internal.featureflags.** { *; }
-keepclassmembers class com.facebook.react.internal.featureflags.** { *; }
-dontwarn com.facebook.react.internal.featureflags.**

# Keep all classes related to native library loading
-keep class com.facebook.react.defaults.** { *; }
-keep class com.facebook.react.ReactNativeApplicationEntryPoint { *; }

# Keep all JNI/native classes that load .so libraries
-keepclasseswithmembers class * {
    native <methods>;
}
-keepclasseswithmembernames,includedescriptorclasses class * {
    native <methods>;
}

# Keep React Native runtime classes
-keep class com.facebook.react.runtime.** { *; }
-keep interface com.facebook.react.runtime.** { *; }

# Keep all classes that have native methods (critical for .so loading)
-keep class com.facebook.react.turbomodule.core.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Keep annotations - critical for reflection and native binding
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# Prevent R8 from removing classes used via reflection
-keepattributes RuntimeVisibleAnnotations
-keepattributes RuntimeInvisibleAnnotations
-keepattributes RuntimeVisibleParameterAnnotations
-keepattributes RuntimeInvisibleParameterAnnotations

# Keep source file names and line numbers for better crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep all React Native codegen classes (New Architecture)
-keep class com.facebook.react.codegen.** { *; }

# Keep React view manager classes
-keep class * extends com.facebook.react.uimanager.ViewManager { *; }
-keep class * extends com.facebook.react.bridge.BaseJavaModule { *; }

# Keep all TurboModule implementations
-keep class * implements com.facebook.react.turbomodule.core.interfaces.TurboModule { *; }

# Keep Fabric components
-keep class * implements com.facebook.react.fabric.** { *; }

# Prevent obfuscation of classes accessed via reflection
-keep @com.facebook.react.bridge.ReactMethod class * { *; }
-keepclassmembers class ** {
    @com.facebook.react.bridge.ReactMethod <methods>;
}
-keepclassmembers class ** {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
}
-keepclassmembers class ** {
    @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>;
}
-keepclasseswithmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# Keep JSI (JavaScript Interface) classes
-keep class com.facebook.react.jsi.** { *; }
-keep interface com.facebook.react.jsi.** { *; }

# Keep React Native event dispatchers
-keep class com.facebook.react.uimanager.events.** { *; }

# Additional R8 full mode rules for React Native
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters

# Do not strip any method/class that is annotated with @DoNotStrip
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}

# Keep setters in Views
-keepclassmembers public class * extends android.view.View {
    void set*(***);
    *** get*();
}

# Keep React Native New Architecture entry point
-keep class com.facebook.react.ReactNativeApplicationEntryPoint { 
    public static <methods>; 
}
-keep class com.facebook.react.defaults.DefaultNewArchitectureEntryPoint {
    public static <methods>;
    *;
}

# Ensure reflection-based access is preserved
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

