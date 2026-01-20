#!/bin/bash

# Android Fastlane Release Script
# This script uploads an AAB file to Google Play Store and creates a release

set -e

# Check if required parameters are provided
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
  echo "❌ Error: Missing required parameters"
  echo ""
  echo "Usage: ./fastlane-android-release.sh <app-id> <aab-path> <message-index> [rollout] [track]"
  echo ""
  echo "Parameters:"
  echo "  app-id         : App identifier (e.g., german-b1, english-b2)"
  echo "  aab-path       : Path to the AAB file"
  echo "  message-index  : Index of the update message to use (0-based)"
  echo "  rollout        : (Optional) Rollout percentage (0.0-1.0, default: 1.0)"
  echo "  track          : (Optional) Release track (default: production)"
  echo ""
  echo "Examples:"
  echo "  ./fastlane-android-release.sh german-b1 dist/android/german-b1/app-release.aab 0"
  echo "  ./fastlane-android-release.sh german-b1 dist/android/german-b1/app-release.aab 0 0.1 production"
  echo ""
  exit 1
fi

APP_ID=$1
AAB_PATH=$2
MESSAGE_INDEX=$3
ROLLOUT=${4:-1.0}
TRACK=${5:-"production"}

echo "================================================"
echo "Android Fastlane Release"
echo "================================================"
echo "App ID:        $APP_ID"
echo "AAB Path:      $AAB_PATH"
echo "Message Index: $MESSAGE_INDEX"
echo "Rollout:       $(echo "$ROLLOUT * 100" | bc)%"
echo "Track:         $TRACK"
echo "================================================"
echo ""

# Validate AAB file exists
if [ ! -f "$AAB_PATH" ]; then
  echo "❌ Error: AAB file not found at: $AAB_PATH"
  exit 1
fi

# Run Fastlane
echo "🚀 Running Fastlane..."
bundle exec fastlane android release \
  app_id:"$APP_ID" \
  aab_path:"$AAB_PATH" \
  message_index:"$MESSAGE_INDEX" \
  rollout:"$ROLLOUT" \
  track:"$TRACK"

if [ $? -eq 0 ]; then
  echo ""
  echo "================================================"
  echo "✅ Android release completed successfully!"
  echo "================================================"
else
  echo ""
  echo "================================================"
  echo "❌ Android release failed!"
  echo "================================================"
  exit 1
fi
