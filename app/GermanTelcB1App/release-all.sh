#!/bin/bash

# Master Release Script for Telc Exam Apps
# This script orchestrates the entire build and release process for both Android and iOS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"
LOG_DIR="$SCRIPT_DIR/release-logs"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Apps to build (can be configured)
DEFAULT_APPS=("german-a1" "german-b1" "german-b2" "english-b1" "english-b2")

# Usage message
usage() {
  echo "Usage: ./release-all.sh <message-index> [options]"
  echo ""
  echo "Required:"
  echo "  message-index   : Index of update message to use (0-based, from update-messages.json)"
  echo ""
  echo "Options:"
  echo "  --apps          : Comma-separated list of apps to release (default: all)"
  echo "                    Example: --apps german-b1,english-b2"
  echo "  --android-only  : Only build and release Android apps"
  echo "  --ios-only      : Only build and release iOS apps"
  echo "  --skip-build    : Skip build steps (use existing builds)"
  echo "  --skip-version-bump : Skip version bump (versions already updated)"
  echo "  --debug         : Show build logs in real-time (verbose mode)"
  echo "  --rollout       : Android rollout percentage 0.0-1.0 (default: 1.0)"
  echo "  --track         : Android release track (default: production)"
  echo "  --help          : Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./release-all.sh 0"
  echo "  ./release-all.sh 0 --apps german-b1,english-b2"
  echo "  ./release-all.sh 0 --android-only"
  echo "  ./release-all.sh 0 --skip-build --rollout 0.1"
  echo "  ./release-all.sh 0 --debug"
  echo "  ./release-all.sh 0 --skip-version-bump --skip-build"
  exit 1
}

# Error handler
error_exit() {
    echo -e "${RED}✗ Error: $1${NC}" >&2
    exit 1
}

# Check for help first
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  usage
fi

# Check if message index is provided
if [ -z "$1" ]; then
  usage
fi

MESSAGE_INDEX=$1
shift

# Parse options
APPS=("${DEFAULT_APPS[@]}")
BUILD_ANDROID=true
BUILD_IOS=true
SKIP_BUILD=false
SKIP_VERSION_BUMP=false
DEBUG_MODE=false
ROLLOUT=1.0
TRACK="production"

while [[ $# -gt 0 ]]; do
  case $1 in
    --apps)
      IFS=',' read -ra APPS <<< "$2"
      shift 2
      ;;
    --android-only)
      BUILD_IOS=false
      shift
      ;;
    --ios-only)
      BUILD_ANDROID=false
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-version-bump)
      SKIP_VERSION_BUMP=true
      shift
      ;;
    --debug)
      DEBUG_MODE=true
      shift
      ;;
    --rollout)
      ROLLOUT=$2
      shift 2
      ;;
    --track)
      TRACK=$2
      shift 2
      ;;
    --help)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

# Create directories
mkdir -p "$DIST_DIR"
mkdir -p "$LOG_DIR"

# Create timestamped log file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/release_${TIMESTAMP}.log"

# Log function (avoiding conflict with macOS log command)
write_log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

write_log "${BLUE}================================================"
write_log "Telc Apps - Automated Release Process"
write_log "================================================${NC}"
write_log ""
write_log "Message Index: $MESSAGE_INDEX"
write_log "Apps to release: ${APPS[*]}"
write_log "Build Android: $BUILD_ANDROID"
write_log "Build iOS: $BUILD_IOS"
write_log "Skip Build: $SKIP_BUILD"
write_log "Skip Version Bump: $SKIP_VERSION_BUMP"
write_log "Debug Mode: $DEBUG_MODE"
if [ "$BUILD_ANDROID" = true ]; then
  write_log "Android Rollout: $(echo "$ROLLOUT * 100" | bc)%"
  write_log "Android Track: $TRACK"
fi
write_log "Log file: $LOG_FILE"
write_log ""

# ============================================
# PRE-RELEASE CHECKS
# ============================================

write_log "${BLUE}================================================"
write_log "PRE-RELEASE CHECKS"
write_log "================================================${NC}\n"

# Step 1: Check dev flags
write_log "${BLUE}📋 Checking for dev flags...${NC}"
if [ "$DEBUG_MODE" = true ]; then
  ./check-dev-flags.sh 2>&1 | tee -a "$LOG_FILE"
  DEV_CHECK_RESULT=${PIPESTATUS[0]}
  if [ $DEV_CHECK_RESULT -ne 0 ]; then
    error_exit "Dev flags check failed. Please disable all development flags before release."
  fi
else
  if ! ./check-dev-flags.sh >> "$LOG_FILE" 2>&1; then
    error_exit "Dev flags check failed. Please disable all development flags before release."
  fi
fi
write_log "${GREEN}✓ No dev flags detected${NC}\n"

# Step 2: Bump version
if [ "$SKIP_VERSION_BUMP" = true ]; then
  write_log "${YELLOW}⏭  Skipping version bump (already bumped)${NC}\n"
elif [ "$SKIP_BUILD" = false ]; then
  write_log "${BLUE}🔢 Bumping version numbers...${NC}"
  if [ "$DEBUG_MODE" = true ]; then
    ./bump-version.sh 2>&1 | tee -a "$LOG_FILE"
    BUMP_RESULT=${PIPESTATUS[0]}
    if [ $BUMP_RESULT -ne 0 ]; then
      error_exit "Version bump failed. Check the log for details."
    fi
  else
    if ! ./bump-version.sh >> "$LOG_FILE" 2>&1; then
      error_exit "Version bump failed. Check the log for details."
    fi
  fi
  write_log "${GREEN}✓ Version numbers updated${NC}\n"
else
  write_log "${YELLOW}⏭  Skipping version bump (skip-build mode)${NC}\n"
fi

# Ensure bundle is installed
if ! command -v bundle &> /dev/null; then
  write_log "${YELLOW}⚠️  Bundler not found. Installing...${NC}"
  gem install bundler
fi

# Install Ruby dependencies
write_log "${BLUE}📦 Installing Ruby dependencies...${NC}"
if [ "$DEBUG_MODE" = true ]; then
  bundle install 2>&1 | tee -a "$LOG_FILE"
  BUNDLE_RESULT=${PIPESTATUS[0]}
  if [ $BUNDLE_RESULT -ne 0 ]; then
    error_exit "Failed to install Ruby dependencies"
  fi
else
  bundle install >> "$LOG_FILE" 2>&1 || error_exit "Failed to install Ruby dependencies"
fi
write_log "${GREEN}✓ Ruby dependencies installed${NC}\n"

# Validate update message exists
UPDATE_MESSAGES_FILE="$SCRIPT_DIR/../update-messages.json"
if [ ! -f "$UPDATE_MESSAGES_FILE" ]; then
  error_exit "Update messages file not found at: $UPDATE_MESSAGES_FILE"
fi

# Extract version info from Android build.gradle
ANDROID_BUILD_GRADLE="$SCRIPT_DIR/android/app/build.gradle"
VERSION_NAME=$(grep -E "^\s*versionName\s+\"[0-9.]+\"" "$ANDROID_BUILD_GRADLE" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+")
VERSION_CODE=$(grep -E "^\s*versionCode\s+[0-9]+" "$ANDROID_BUILD_GRADLE" | grep -oE "[0-9]+")

# Extract iOS version
IOS_PROJECT_FILE="$SCRIPT_DIR/ios/TelcExamApp.xcodeproj/project.pbxproj"
IOS_BUILD_NUMBER=$(grep -E "CURRENT_PROJECT_VERSION = [0-9]+;" "$IOS_PROJECT_FILE" | head -1 | grep -oE "[0-9]+")
IOS_VERSION=$(grep -E "MARKETING_VERSION = [0-9.]+;" "$IOS_PROJECT_FILE" | head -1 | grep -oE "[0-9]+\.[0-9]+\.[0-9]+")

write_log "${BLUE}Version Info:${NC}"
write_log "  Android: ${VERSION_NAME} (${VERSION_CODE})"
write_log "  iOS: ${IOS_VERSION} (${IOS_BUILD_NUMBER})"
write_log ""

# ============================================
# ANDROID BUILD & RELEASE
# ============================================

if [ "$BUILD_ANDROID" = true ]; then
  write_log "${BLUE}================================================"
  write_log "ANDROID BUILD & RELEASE"
  write_log "================================================${NC}\n"
  
  for APP_ID in "${APPS[@]}"; do
    write_log "${BLUE}▶ Processing Android app: $APP_ID${NC}"
    
    AAB_OUTPUT_DIR="$DIST_DIR/android/$APP_ID"
    mkdir -p "$AAB_OUTPUT_DIR"
    
    # Build step
    if [ "$SKIP_BUILD" = false ]; then
      write_log "  🔨 Building Android app..."
      
      if [ "$DEBUG_MODE" = true ]; then
        ./build-android.sh "$APP_ID" aab 2>&1 | tee -a "$LOG_FILE"
        BUILD_RESULT=${PIPESTATUS[0]}
        if [ $BUILD_RESULT -ne 0 ]; then
          error_exit "Android build failed for $APP_ID"
        fi
      else
        if ! ./build-android.sh "$APP_ID" aab >> "$LOG_FILE" 2>&1; then
          error_exit "Android build failed for $APP_ID"
        fi
      fi
      
      # Find the built AAB file
      case "$APP_ID" in
        "german-a1") FLAVOR="germanA1" ;;
        "german-b1") FLAVOR="germanB1" ;;
        "german-b2") FLAVOR="germanB2" ;;
        "english-b1") FLAVOR="englishB1" ;;
        "english-b2") FLAVOR="englishB2" ;;
        *) error_exit "Unknown app ID: $APP_ID" ;;
      esac
      
      AAB_SOURCE=$(find android/app/build/outputs/bundle/${FLAVOR}Release -name "*.aab" | head -n 1)
      
      if [ ! -f "$AAB_SOURCE" ]; then
        error_exit "AAB file not found after build for $APP_ID"
      fi
      
      # Copy AAB to dist directory
      AAB_PATH="$AAB_OUTPUT_DIR/app-release.aab"
      cp "$AAB_SOURCE" "$AAB_PATH"
      
      write_log "${GREEN}  ✓ Build complete: $AAB_PATH${NC}"
    else
      AAB_PATH="$AAB_OUTPUT_DIR/app-release.aab"
      if [ ! -f "$AAB_PATH" ]; then
        error_exit "AAB file not found at $AAB_PATH (skip-build mode)"
      fi
      write_log "  ⏭  Skipping build, using existing AAB: $AAB_PATH"
    fi
    
    # Release step
    write_log "  📤 Releasing to Play Store..."
    
    if [ "$DEBUG_MODE" = true ]; then
      ./fastlane-android-release.sh "$APP_ID" "$AAB_PATH" "$MESSAGE_INDEX" "$ROLLOUT" "$TRACK" 2>&1 | tee -a "$LOG_FILE"
      RELEASE_RESULT=${PIPESTATUS[0]}
      if [ $RELEASE_RESULT -ne 0 ]; then
        error_exit "Android release failed for $APP_ID"
      fi
    else
      if ! ./fastlane-android-release.sh "$APP_ID" "$AAB_PATH" "$MESSAGE_INDEX" "$ROLLOUT" "$TRACK" >> "$LOG_FILE" 2>&1; then
        error_exit "Android release failed for $APP_ID"
      fi
    fi
    
    write_log "${GREEN}  ✓ Released successfully!${NC}\n"
  done
  
  write_log "${GREEN}✅ All Android apps built and released!${NC}\n"
fi

# ============================================
# iOS BUILD & RELEASE
# ============================================

if [ "$BUILD_IOS" = true ]; then
  write_log "${BLUE}================================================"
  write_log "iOS BUILD & RELEASE"
  write_log "================================================${NC}\n"
  
  for APP_ID in "${APPS[@]}"; do
    write_log "${BLUE}▶ Processing iOS app: $APP_ID${NC}"
    
    # Build and upload step
    if [ "$SKIP_BUILD" = false ]; then
      write_log "  🔨 Building and uploading iOS app..."
      
      # The build-ios.sh script already uploads to App Store Connect
      if [ "$DEBUG_MODE" = true ]; then
        ./build-ios.sh "$APP_ID" 2>&1 | tee -a "$LOG_FILE"
        BUILD_RESULT=${PIPESTATUS[0]}
        if [ $BUILD_RESULT -ne 0 ]; then
          error_exit "iOS build/upload failed for $APP_ID"
        fi
      else
        if ! ./build-ios.sh "$APP_ID" >> "$LOG_FILE" 2>&1; then
          error_exit "iOS build/upload failed for $APP_ID"
        fi
      fi
      
      write_log "${GREEN}  ✓ Build and upload complete${NC}"
    else
      write_log "  ⏭  Skipping build (assuming already uploaded to App Store Connect)"
    fi
    
    # Release step (create version and submit for review)
    write_log "  📤 Creating release in App Store Connect..."
    
    if [ "$DEBUG_MODE" = true ]; then
      ./fastlane-ios-release.sh "$APP_ID" "$IOS_VERSION" "$IOS_BUILD_NUMBER" "$MESSAGE_INDEX" 2>&1 | tee -a "$LOG_FILE"
      RELEASE_RESULT=${PIPESTATUS[0]}
      if [ $RELEASE_RESULT -ne 0 ]; then
        error_exit "iOS release failed for $APP_ID"
      fi
    else
      if ! ./fastlane-ios-release.sh "$APP_ID" "$IOS_VERSION" "$IOS_BUILD_NUMBER" "$MESSAGE_INDEX" >> "$LOG_FILE" 2>&1; then
        error_exit "iOS release failed for $APP_ID"
      fi
    fi
    
    write_log "${GREEN}  ✓ Released successfully!${NC}\n"
  done
  
  write_log "${GREEN}✅ All iOS apps built and released!${NC}\n"
fi

# ============================================
# SUMMARY
# ============================================

write_log "${GREEN}================================================"
write_log "🎉 RELEASE PROCESS COMPLETE!"
write_log "================================================${NC}\n"

write_log "${BLUE}Summary:${NC}"
write_log "  Apps released: ${APPS[*]}"
write_log "  Android: $BUILD_ANDROID"
write_log "  iOS: $BUILD_IOS"
write_log "  Version (Android): ${VERSION_NAME} (${VERSION_CODE})"
write_log "  Version (iOS): ${IOS_VERSION} (${IOS_BUILD_NUMBER})"
write_log "  Update message index: $MESSAGE_INDEX"
write_log ""
write_log "Full log available at: $LOG_FILE"
write_log ""
write_log "${YELLOW}Next steps:${NC}"
write_log "  1. Monitor Play Console for Android rollout status"
write_log "  2. Monitor App Store Connect for iOS review status"
write_log "  3. Check for any user reports or issues"
write_log ""

exit 0
