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

SCHEME_NAME="TelcExamApp"

echo "================================================"
echo "Building iOS App: $EXAM_ID"
echo "Scheme: $SCHEME_NAME"
echo "================================================"
echo ""

# Apply configuration (generates active-exam.config.ts)
./scripts/build-config.sh "$EXAM_ID" ios

# Run version check and exit if it fails
if ! ./check-dev-flags.sh; then
    echo "Build aborted due to dev flags check failure."
    exit 1
fi

# Set environment variable
export EXAM_ID="$EXAM_ID"

APP_NAME="TelcExamApp"

echo "Starting iOS archive using scheme: $SCHEME_NAME..."
xcodebuild -workspace ios/${APP_NAME}.xcworkspace \
           -scheme ${SCHEME_NAME} \
           -configuration ${SCHEME_NAME}-Release \
           -sdk iphoneos \
           -archivePath ios/build/${APP_NAME}.xcarchive archive

if [ $? -ne 0 ]; then
    echo "Archive failed!"
    exit 1
fi

echo "Exporting archive..."
xcodebuild -exportArchive \
           -archivePath ios/build/${APP_NAME}.xcarchive \
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
echo "✅ iOS build completed successfully!"
echo "================================================"
echo "   Exam: $EXAM_ID"
echo "   Scheme: $SCHEME_NAME"
echo "   IPA location: $IPA_PATH"
echo ""
echo "To upload to App Store Connect, run:"
echo "   xcrun altool --upload-app --type ios --file \"$IPA_PATH\" --username YOUR_APPLE_ID --password YOUR_APP_PASSWORD"
echo ""