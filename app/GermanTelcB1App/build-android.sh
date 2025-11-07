#!/bin/bash

set -e

EXAM_ID=$1
BUILD_TYPE=${2:-aab}  # Default to aab (bundle) if not specified

if [ -z "$EXAM_ID" ]; then
  echo "❌ Error: EXAM_ID is required"
  echo ""
  echo "Usage: ./build-android.sh <exam-id> [apk|aab]"
  echo "Example: ./build-android.sh german-b1"
  echo "Example: ./build-android.sh german-b1 apk"
  echo ""
  echo "Available exam IDs:"
  echo "  - german-b1"
  echo "  - german-b2"
  echo "  - english-b1"
  echo ""
  echo "Build types:"
  echo "  - apk: Build APK (for testing on emulator/device)"
  echo "  - aab: Build App Bundle (default, for Play Store release)"
  exit 1
fi

# Validate build type
if [ "$BUILD_TYPE" != "apk" ] && [ "$BUILD_TYPE" != "aab" ]; then
  echo "❌ Error: Invalid build type '$BUILD_TYPE'"
  echo "Must be either 'apk' or 'aab'"
  exit 1
fi

echo "================================================"
echo "Building Android App: $EXAM_ID ($BUILD_TYPE)"
echo "================================================"
echo ""

# Apply configuration
./scripts/build-config.sh "$EXAM_ID" android

# Run version check and exit if it fails
if ! ./check-dev-flags.sh; then
    echo "Build aborted due to dev flags check failure."
    exit 1
fi

# Set environment variable for Metro bundler
export EXAM_ID="$EXAM_ID"

# Build based on type
if [ "$BUILD_TYPE" = "apk" ]; then
  echo "Building APK..."
  echo "Bundling JavaScript with dev=false..."
  npx react-native bundle \
    --platform android \
    --dev false \
    --entry-file index.js \
    --bundle-output android/app/src/main/assets/index.android.bundle \
    --assets-dest android/app/src/main/res
  
  cd android
  ./gradlew assembleRelease
  cd ..
  
  OUTPUT_FILE=$(find android/app/build/outputs/apk/release -name "*.apk" | head -n 1)
  
  echo ""
  echo "================================================"
  echo "✅ APK built successfully for $EXAM_ID!"
  echo "================================================"
  echo "   APK location: $OUTPUT_FILE"
  echo ""
  echo "To install on device/emulator:"
  echo "   adb install \"$OUTPUT_FILE\""
  echo ""
else
  echo "Building App Bundle (AAB)..."
  npx react-native build-android --mode=release
  
  OUTPUT_FILE=$(find android/app/build/outputs/bundle/release -name "*.aab" | head -n 1)
  
  echo ""
  echo "================================================"
  echo "✅ App Bundle built successfully for $EXAM_ID!"
  echo "================================================"
  echo "   AAB location: $OUTPUT_FILE"
  echo ""
  echo "This bundle is ready for Play Store upload."
  echo ""
fi