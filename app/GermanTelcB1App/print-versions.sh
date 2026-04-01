#!/bin/bash

# Print current iOS and Android app versions

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Android
ANDROID_GRADLE="$SCRIPT_DIR/android/app/build.gradle"
ANDROID_VERSION_NAME=$(grep 'versionName ' "$ANDROID_GRADLE" | sed 's/.*versionName "\(.*\)"/\1/')
ANDROID_VERSION_CODE=$(grep 'versionCode ' "$ANDROID_GRADLE" | sed 's/.*versionCode \([0-9]*\)/\1/')

# iOS
IOS_PBXPROJ="$SCRIPT_DIR/ios/ExamPreparationApp.xcodeproj/project.pbxproj"
IOS_MARKETING_VERSION=$(grep 'MARKETING_VERSION' "$IOS_PBXPROJ" | head -1 | sed 's/.*= \(.*\);/\1/')
IOS_BUILD_NUMBER=$(grep 'CURRENT_PROJECT_VERSION' "$IOS_PBXPROJ" | head -1 | sed 's/.*= \(.*\);/\1/')

echo ""
echo "=== App Versions ==="
echo "Android: $ANDROID_VERSION_NAME (versionCode: $ANDROID_VERSION_CODE)"
echo "iOS:     $IOS_MARKETING_VERSION (build: $IOS_BUILD_NUMBER)"
echo "===================="
echo ""
