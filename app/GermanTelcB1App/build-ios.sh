#!/bin/bash

set -e  # Exit on error

# Run version check and exit if it fails
if ! ./check-dev-flags.sh; then
    echo "Build aborted due to dev flags check failure."
    exit 1
fi

echo "Starting iOS archive..."
xcodebuild -workspace ios/GermanTelcB1App.xcworkspace \
           -scheme GermanTelcB1App \
           -configuration Release \
           -sdk iphoneos \
           -archivePath ios/build/GermanTelcB1App.xcarchive archive

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
IPA_PATH="ios/build/GermanTelcB1App.ipa"
if [ ! -f "$IPA_PATH" ]; then
    echo "Error: IPA file not found at $IPA_PATH"
    exit 1
fi

echo "Uploading to App Store Connect..."
xcrun altool --upload-app \
  --type ios \
  --file "$IPA_PATH" \
  --username "muhammad.aref.ali.hamada@gmail.com" \
  --password "yuur-innd-jamw-ahpg"

if [ $? -eq 0 ]; then
    echo "iOS build and upload completed successfully!"
else
    echo "Upload failed!"
    exit 1
fi