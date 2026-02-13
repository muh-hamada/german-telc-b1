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
  echo "  - german-a1"
  echo "  - german-a2"
  echo "  - german-b1"
  echo "  - german-b2"
  echo "  - english-b1"
  echo "  - english-b2"
  echo "  - dele-spanish-b1"
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

# Map exam ID to flavor name
case "$EXAM_ID" in
  "german-a1")
    FLAVOR="germanA1"
    ;;
  "german-a2")
    FLAVOR="germanA2"
    ;;
  "german-b1")
    FLAVOR="germanB1"
    ;;
  "german-b2")
    FLAVOR="germanB2"
    ;;
  "english-b1")
    FLAVOR="englishB1"
    ;;
  "english-b2")
    FLAVOR="englishB2"
    ;;
  "dele-spanish-b1")
    FLAVOR="deleSpanishB1"
    ;;
  *)
    echo "❌ Error: Unknown exam ID '$EXAM_ID'"
    exit 1
    ;;
esac

echo "================================================"
echo "Building Android App: $EXAM_ID ($BUILD_TYPE)"
echo "Flavor: $FLAVOR"
echo "================================================"
echo ""

# Apply configuration (for Android builds and app.json)
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
  echo "Building APK with flavor: ${FLAVOR}Release..."
  echo "Bundling JavaScript with dev=false..."
  npx react-native bundle \
    --platform android \
    --dev false \
    --entry-file index.js \
    --bundle-output android/app/src/main/assets/index.android.bundle \
    --assets-dest android/app/src/main/res
  
  cd android
  ./gradlew assemble${FLAVOR}Release
  cd ..
  
  OUTPUT_FILE=$(find android/app/build/outputs/apk/${FLAVOR}/release -name "*.apk" | head -n 1)
  
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
  echo "Building App Bundle (AAB) with flavor: ${FLAVOR}Release..."
  cd android
  ./gradlew bundle${FLAVOR}Release
  cd ..
  
  OUTPUT_FILE=$(find android/app/build/outputs/bundle/${FLAVOR}Release -name "*.aab" | head -n 1)
  
  echo ""
  echo "================================================"
  echo "✅ App Bundle built successfully for $EXAM_ID!"
  echo "================================================"
  echo "   AAB location: $OUTPUT_FILE"
  echo ""
  echo "This bundle is ready for Play Store upload."
  echo ""
fi