#!/bin/bash

# iOS Fastlane Release Script
# This script creates a release in App Store Connect and submits for review

set -e

# Check if required parameters are provided
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ]; then
  echo "❌ Error: Missing required parameters"
  echo ""
  echo "Usage: ./fastlane-ios-release.sh <app-id> <version> <build-number> <message-index>"
  echo ""
  echo "Parameters:"
  echo "  app-id         : App identifier (e.g., german-b1, english-b2)"
  echo "  version        : App version (e.g., 1.4.0)"
  echo "  build-number   : Build number (e.g., 42)"
  echo "  message-index  : Index of the update message to use (0-based)"
  echo ""
  echo "Examples:"
  echo "  ./fastlane-ios-release.sh german-b1 1.4.0 42 0"
  echo "  ./fastlane-ios-release.sh english-b2 2.1.0 15 3"
  echo ""
  exit 1
fi

APP_ID=$1
VERSION=$2
BUILD_NUMBER=$3
MESSAGE_INDEX=$4

echo "================================================"
echo "iOS Fastlane Release"
echo "================================================"
echo "App ID:        $APP_ID"
echo "Version:       $VERSION"
echo "Build Number:  $BUILD_NUMBER"
echo "Message Index: $MESSAGE_INDEX"
echo "================================================"
echo ""

# Run Fastlane
echo "🚀 Running Fastlane..."
bundle exec fastlane ios release \
  app_id:"$APP_ID" \
  version:"$VERSION" \
  build_number:"$BUILD_NUMBER" \
  message_index:"$MESSAGE_INDEX"

if [ $? -eq 0 ]; then
  echo ""
  echo "================================================"
  echo "✅ iOS release completed successfully!"
  echo "================================================"
else
  echo ""
  echo "================================================"
  echo "❌ iOS release failed!"
  echo "================================================"
  exit 1
fi
