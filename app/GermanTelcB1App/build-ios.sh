#!/bin/bash

set -e

EXAM_ID=$1

if [ -z "$EXAM_ID" ]; then
  echo "❌ Error: EXAM_ID is required"
  echo ""
  echo "Usage: ./build-ios.sh <exam-id>"
  echo "Example: ./build-ios.sh german-b1"
  echo ""
  echo "Available exam IDs:"
  echo "  - german-b1"
  echo "  - german-b2"
  echo "  - english-b1"
  exit 1
fi

echo "================================================"
echo "Building iOS App: $EXAM_ID"
echo "================================================"
echo ""

# Apply configuration
./scripts/build-config.sh "$EXAM_ID" ios

# Run version check and exit if it fails
if ! ./check-dev-flags.sh; then
    echo "Build aborted due to dev flags check failure."
    exit 1
fi

# Set environment variable
export EXAM_ID="$EXAM_ID"

# Get app name from configuration
APP_NAME="GermanTelcB1App"

echo "Starting iOS archive for $APP_NAME..."
xcodebuild -workspace ios/GermanTelcB1App.xcworkspace \
           -scheme GermanTelcB1App \
           -configuration Release \
           -sdk iphoneos \
           -archivePath ios/build/${APP_NAME}.xcarchive archive

if [ $? -ne 0 ]; then
    echo "Archive failed!"
    exit 1
fi

echo "Exporting archive..."
xcodebuild -exportArchive \
           -archivePath ios/build/GermanTelcB1App.xcarchive \
           -exportOptionsPlist ios/exportOptions.plist \
           -exportPath ios/build

if [ $? -ne 0 ]; then
    echo "Export failed!"
    exit 1
fi

# Check if IPA was created
IPA_PATH="ios/build/${APP_NAME}.ipa"
if [ ! -f "$IPA_PATH" ]; then
    echo "Error: IPA file not found at $IPA_PATH"
    exit 1
fi

echo ""
echo "================================================"
echo "✅ iOS build completed successfully for $EXAM_ID!"
echo "================================================"
echo "   IPA location: $IPA_PATH"
echo ""
echo "To upload to App Store Connect, run:"
echo "   xcrun altool --upload-app --type ios --file \"$IPA_PATH\" --username YOUR_APPLE_ID --password YOUR_APP_PASSWORD"
echo ""