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
  echo "  - german-a1"
  echo "  - german-a2"
  echo "  - german-b1"
  echo "  - german-b2"
  echo "  - english-b1"
  echo "  - english-b2"
  echo "  - dele-spanish-b1"
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

# Run TypeScript script to apply configuration
npx tsx scripts/apply-exam-config.ts "$EXAM_ID" "$PLATFORM"

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
  
  # Extract level from exam ID (e.g., german-b1 -> b1, dele-spanish-b1 -> b1)
  LEVEL=$(echo "$EXAM_ID" | grep -o '[ab][12]')
  
  # Check if exam ID has a provider (three parts: provider-language-level)
  # Count the number of hyphens to determine format
  HYPHEN_COUNT=$(echo "$EXAM_ID" | tr -cd '-' | wc -c | tr -d ' ')
  
  if [ "$HYPHEN_COUNT" -eq 2 ]; then
    # Three parts: provider-language-level (e.g., dele-spanish-b1)
    PROVIDER=$(echo "$EXAM_ID" | cut -d'-' -f1)
    LANGUAGE=$(echo "$EXAM_ID" | cut -d'-' -f2)
  else
    # Two parts: language-level (e.g., german-b1)
    PROVIDER=""
    LANGUAGE=$(echo "$EXAM_ID" | sed 's/-[ab][12]$//')
  fi
  
  if [ -n "$LEVEL" ]; then
    # Determine logo filename based on whether provider exists
    if [ -n "$PROVIDER" ]; then
      LOGO_SOURCE="../../logos/android/launcher-icon-${PROVIDER}-${LEVEL}.png"
    else
      LOGO_SOURCE="../../logos/android/launcher-icon-${LEVEL}.png"
    fi
    
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
  
  echo ""
  echo "Copying launcher background for Android..."
  
  if [ -n "$LANGUAGE" ]; then
    BACKGROUND_SOURCE="../../logos/android/ic_launcher_background-${LANGUAGE}.png"
    
    if [ -f "$BACKGROUND_SOURCE" ]; then
      # Copy background to all Android mipmap directories
      cp "$BACKGROUND_SOURCE" "android/app/src/main/res/mipmap-hdpi/ic_launcher_background.png"
      cp "$BACKGROUND_SOURCE" "android/app/src/main/res/mipmap-mdpi/ic_launcher_background.png"
      cp "$BACKGROUND_SOURCE" "android/app/src/main/res/mipmap-xhdpi/ic_launcher_background.png"
      cp "$BACKGROUND_SOURCE" "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_background.png"
      cp "$BACKGROUND_SOURCE" "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_background.png"
      cp "$BACKGROUND_SOURCE" "android/app/src/main/res/mipmap-ldpi/ic_launcher_background.png"
      cp "$BACKGROUND_SOURCE" "android/app/src/main/res/drawable/ic_launcher_background.png"
      
      echo "✅ Copied $BACKGROUND_SOURCE to all Android launcher background directories"
    else
      echo "⚠️  Warning: $BACKGROUND_SOURCE not found"
      echo "   Skipping launcher background update"
    fi
  else
    echo "⚠️  Warning: Could not determine language from exam ID: $EXAM_ID"
    echo "   Skipping launcher background update"
  fi
fi

if [ "$PLATFORM" = "ios" ]; then
  echo "✅ iOS configuration will be handled by scheme build settings"
  echo "   Scheme-based configuration is active"
  
  # Copy the appropriate GoogleService-Info.plist for the build
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
  echo "Generating iOS app icons..."
  
  # Run the iOS icon generation script
  if [ -f "scripts/generate-ios-icons.sh" ]; then
    bash scripts/generate-ios-icons.sh "$EXAM_ID"
    
    if [ $? -eq 0 ]; then
      echo "✅ iOS app icons generated successfully"
    else
      echo "⚠️  Warning: iOS icon generation failed"
      echo "   Continuing with existing icons"
    fi
  else
    echo "⚠️  Warning: scripts/generate-ios-icons.sh not found"
    echo "   Skipping iOS icon generation"
  fi
fi

echo ""


if [ $? -eq 0 ]; then
  echo "✅ Configuration applied successfully!"
else
  echo "❌ Configuration failed!"
  exit 1
fi

