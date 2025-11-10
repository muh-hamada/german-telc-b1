#!/bin/bash

# Build Configuration Script
# Applies exam configuration before building the app

set -e

EXAM_ID=$1
PLATFORM=$2

if [ -z "$EXAM_ID" ]; then
  echo "❌ Error: EXAM_ID is required"
  echo ""
  echo "Usage: ./scripts/build-config.sh <exam-id> <platform>"
  echo "Example: ./scripts/build-config.sh german-b1 android"
  echo ""
  echo "Available exam IDs:"
  echo "  - german-b1"
  echo "  - german-b2"
  echo "  - english-b1"
  echo ""
  echo "Available platforms:"
  echo "  - android"
  echo "  - ios"
  exit 1
fi

if [ -z "$PLATFORM" ]; then
  echo "❌ Error: PLATFORM is required (android or ios)"
  exit 1
fi

echo "================================================"
echo "Configuring build for: $EXAM_ID ($PLATFORM)"
echo "================================================"
echo ""

# Run Node script to apply configuration
node scripts/apply-exam-config.js "$EXAM_ID" "$PLATFORM"

echo ""
echo "Copying Firebase configuration files..."

if [ "$PLATFORM" = "android" ]; then
  GOOGLE_SERVICES_SOURCE="android/app/google-services.${EXAM_ID}.json"
  GOOGLE_SERVICES_TARGET="android/app/google-services.json"
  
  if [ -f "$GOOGLE_SERVICES_SOURCE" ]; then
    cp "$GOOGLE_SERVICES_SOURCE" "$GOOGLE_SERVICES_TARGET"
    echo "✅ Copied $GOOGLE_SERVICES_SOURCE to $GOOGLE_SERVICES_TARGET"
  else
    echo "⚠️  Warning: $GOOGLE_SERVICES_SOURCE not found"
    echo "   Using existing google-services.json (if any)"
  fi
  
  echo ""
  echo "Copying app icon logo for Android..."
  
  # Extract level from exam ID (e.g., german-b1 -> b1)
  LEVEL=$(echo "$EXAM_ID" | grep -o 'b[12]')
  
  if [ -n "$LEVEL" ]; then
    LOGO_SOURCE="../../logo-${LEVEL}.png"
    
    if [ -f "$LOGO_SOURCE" ]; then
      # Copy logo to all Android mipmap directories
      cp "$LOGO_SOURCE" "android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png"
      cp "$LOGO_SOURCE" "android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png"
      cp "$LOGO_SOURCE" "android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png"
      cp "$LOGO_SOURCE" "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png"
      cp "$LOGO_SOURCE" "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png"
      cp "$LOGO_SOURCE" "android/app/src/main/res/mipmap-ldpi/ic_launcher_foreground.png"
      cp "$LOGO_SOURCE" "android/app/src/main/res/drawable/ic_launcher_foreground.png"
      
      echo "✅ Copied $LOGO_SOURCE to all Android app icon directories"
    else
      echo "⚠️  Warning: $LOGO_SOURCE not found"
      echo "   Skipping app icon update"
    fi
  else
    echo "⚠️  Warning: Could not determine level from exam ID: $EXAM_ID"
    echo "   Skipping app icon update"
  fi
fi

if [ "$PLATFORM" = "ios" ]; then
  GOOGLE_PLIST_SOURCE="ios/GoogleService-Info.${EXAM_ID}.plist"
  GOOGLE_PLIST_TARGET="ios/GoogleService-Info.plist"
  
  if [ -f "$GOOGLE_PLIST_SOURCE" ]; then
    cp "$GOOGLE_PLIST_SOURCE" "$GOOGLE_PLIST_TARGET"
    echo "✅ Copied $GOOGLE_PLIST_SOURCE to $GOOGLE_PLIST_TARGET"
  else
    echo "⚠️  Warning: $GOOGLE_PLIST_SOURCE not found"
    echo "   Using existing GoogleService-Info.plist (if any)"
  fi
  
  echo ""
  echo "Cleaning Xcode build cache..."
  rm -rf ~/Library/Developer/Xcode/DerivedData/GermanTelc*
  rm -rf ios/build
  echo "✅ Cleaned Xcode DerivedData and build folder"
  
  echo ""
  echo "Running pod install to update iOS dependencies..."
  cd ios
  export LANG=en_US.UTF-8
  pod install
  cd ..
  echo "✅ Pod install completed"
fi

echo ""


if [ $? -eq 0 ]; then
  echo "✅ Configuration applied successfully!"
else
  echo "❌ Configuration failed!"
  exit 1
fi

