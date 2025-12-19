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

# Set bundle identifier and provisioning profile based on exam
if [[ "$EXAM_ID" == "german-b2" ]]; then
    BUNDLE_ID="com.mhamada.telcb2german"
    PROVISIONING_PROFILE="TelcExamApp AppStore Distribution B2"
elif [[ "$EXAM_ID" == "english-b1" ]]; then
    BUNDLE_ID="com.mhamada.telcb1english"
    PROVISIONING_PROFILE="TelcExamApp AppStore Distribution B1 English"
elif [[ "$EXAM_ID" == "english-b2" ]]; then
    BUNDLE_ID="com.mhamada.telcb2english"
    PROVISIONING_PROFILE="TelcExamApp AppStore Distribution B2 English"
elif [[ "$EXAM_ID" == "german-b1" ]]; then
    BUNDLE_ID="com.mhamada.telcb1german"
    PROVISIONING_PROFILE="TelcExamApp AppStore Distribution"
elif [[ "$EXAM_ID" == "german-a1" ]]; then
    BUNDLE_ID="com.mhamada.telca1german"
    PROVISIONING_PROFILE="TelcExamApp AppStore Distribution A1 German"
else
    BUNDLE_ID="com.mhamada.telcb1english"
    PROVISIONING_PROFILE="TelcExamApp AppStore Distribution English"
fi

echo "Bundle ID: $BUNDLE_ID"
echo "Provisioning Profile: $PROVISIONING_PROFILE"

echo "Starting iOS archive using scheme: $SCHEME_NAME..."
xcodebuild -workspace ios/${APP_NAME}.xcworkspace \
           -scheme ${SCHEME_NAME} \
           -configuration ${SCHEME_NAME}-Release \
           -sdk iphoneos \
           PRODUCT_BUNDLE_IDENTIFIER=$BUNDLE_ID \
           PROVISIONING_PROFILE_SPECIFIER="$PROVISIONING_PROFILE" \
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
echo "================================================"
echo "Uploading to App Store Connect..."
echo "================================================"
echo ""
xcrun altool --upload-app --type ios --file "$IPA_PATH" --username "muhammad.aref.ali.hamada@gmail.com" --password "yuur-innd-jamw-ahpg"

if [ $? -ne 0 ]; then
    echo "Upload failed!"
    exit 1
fi

echo "================================================"
echo "✅ iOS build and upload completed successfully!"
echo "================================================"