#!/bin/bash

# Script to bump app version for both iOS and Android
# Exits with error code if any step fails

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANDROID_BUILD_GRADLE="$SCRIPT_DIR/android/app/build.gradle"
IOS_PROJECT_FILE="$SCRIPT_DIR/ios/TelcExamApp.xcodeproj/project.pbxproj"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Error handler
error_exit() {
    echo -e "${RED}✗ Error: $1${NC}" >&2
    exit 1
}

echo -e "${BLUE}🚀 Bumping app version...${NC}\n"

# Check if files exist
[[ -f "$ANDROID_BUILD_GRADLE" ]] || error_exit "Android build.gradle not found at $ANDROID_BUILD_GRADLE"
[[ -f "$IOS_PROJECT_FILE" ]] || error_exit "iOS project.pbxproj not found at $IOS_PROJECT_FILE"

# ============================================
# ANDROID VERSION BUMP
# ============================================

echo -e "${BLUE}📱 Updating Android version...${NC}"

# Extract current Android versions (more robust parsing)
CURRENT_VERSION_CODE=$(grep -E "^\s*versionCode\s+[0-9]+" "$ANDROID_BUILD_GRADLE" | grep -oE "[0-9]+")
CURRENT_VERSION_NAME=$(grep -E "^\s*versionName\s+\"[0-9.]+\"" "$ANDROID_BUILD_GRADLE" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+")

# Validate extraction
[[ -n "$CURRENT_VERSION_CODE" ]] || error_exit "Failed to extract Android versionCode"
[[ -n "$CURRENT_VERSION_NAME" ]] || error_exit "Failed to extract Android versionName"
[[ "$CURRENT_VERSION_CODE" =~ ^[0-9]+$ ]] || error_exit "Invalid versionCode format: $CURRENT_VERSION_CODE"
[[ "$CURRENT_VERSION_NAME" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || error_exit "Invalid versionName format: $CURRENT_VERSION_NAME"

# Calculate new versions
NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))
# Parse version name (e.g., 1.0.57 -> major=1, minor=0, patch=57)
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION_NAME"
NEW_PATCH=$((PATCH + 1))
NEW_VERSION_NAME="${MAJOR}.${MINOR}.${NEW_PATCH}"

echo "  Current versionCode: $CURRENT_VERSION_CODE"
echo "  New versionCode: $NEW_VERSION_CODE"
echo "  Current versionName: $CURRENT_VERSION_NAME"
echo "  New versionName: $NEW_VERSION_NAME"

# Update Android build.gradle using perl (more reliable on macOS)
perl -i.bak -pe "s/(versionCode\s+)\d+/\${1}$NEW_VERSION_CODE/" "$ANDROID_BUILD_GRADLE" || error_exit "Failed to update Android versionCode"
perl -i.bak -pe "s/(versionName\s+\")[0-9.]+(\",?)/\${1}$NEW_VERSION_NAME\${2}/" "$ANDROID_BUILD_GRADLE" || error_exit "Failed to update Android versionName"
[[ -f "${ANDROID_BUILD_GRADLE}.bak" ]] && rm "${ANDROID_BUILD_GRADLE}.bak"

# Verify Android changes
VERIFY_VERSION_CODE=$(grep -E "^\s*versionCode\s+[0-9]+" "$ANDROID_BUILD_GRADLE" | grep -oE "[0-9]+")
VERIFY_VERSION_NAME=$(grep -E "^\s*versionName\s+\"[0-9.]+\"" "$ANDROID_BUILD_GRADLE" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+")
[[ "$VERIFY_VERSION_CODE" == "$NEW_VERSION_CODE" ]] || error_exit "Android versionCode verification failed"
[[ "$VERIFY_VERSION_NAME" == "$NEW_VERSION_NAME" ]] || error_exit "Android versionName verification failed"

echo -e "${GREEN}✓ Android version updated${NC}\n"

# ============================================
# iOS VERSION BUMP
# ============================================

echo -e "${BLUE}🍎 Updating iOS version...${NC}"

# Extract current iOS versions (first occurrence)
CURRENT_IOS_BUILD=$(grep -E "CURRENT_PROJECT_VERSION = [0-9]+;" "$IOS_PROJECT_FILE" | head -1 | grep -oE "[0-9]+")
CURRENT_IOS_MARKETING=$(grep -E "MARKETING_VERSION = [0-9.]+;" "$IOS_PROJECT_FILE" | head -1 | grep -oE "[0-9]+\.[0-9]+\.[0-9]+")

# Validate extraction
[[ -n "$CURRENT_IOS_BUILD" ]] || error_exit "Failed to extract iOS CURRENT_PROJECT_VERSION"
[[ -n "$CURRENT_IOS_MARKETING" ]] || error_exit "Failed to extract iOS MARKETING_VERSION"
[[ "$CURRENT_IOS_BUILD" =~ ^[0-9]+$ ]] || error_exit "Invalid iOS build number format: $CURRENT_IOS_BUILD"
[[ "$CURRENT_IOS_MARKETING" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || error_exit "Invalid iOS marketing version format: $CURRENT_IOS_MARKETING"

# Calculate new versions
NEW_IOS_BUILD=$((CURRENT_IOS_BUILD + 1))
# Parse version (e.g., 1.0.57 -> major=1, minor=0, patch=57)
IFS='.' read -r IOS_MAJOR IOS_MINOR IOS_PATCH <<< "$CURRENT_IOS_MARKETING"
NEW_IOS_PATCH=$((IOS_PATCH + 1))
NEW_IOS_MARKETING="${IOS_MAJOR}.${IOS_MINOR}.${NEW_IOS_PATCH}"

echo "  Current CURRENT_PROJECT_VERSION: $CURRENT_IOS_BUILD"
echo "  New CURRENT_PROJECT_VERSION: $NEW_IOS_BUILD"
echo "  Current MARKETING_VERSION: $CURRENT_IOS_MARKETING"
echo "  New MARKETING_VERSION: $NEW_IOS_MARKETING"

# Update iOS project.pbxproj using perl (all occurrences)
perl -i.bak -pe "s/(CURRENT_PROJECT_VERSION = )\d+;/\${1}$NEW_IOS_BUILD;/" "$IOS_PROJECT_FILE" || error_exit "Failed to update iOS CURRENT_PROJECT_VERSION"
perl -i.bak -pe "s/(MARKETING_VERSION = )[0-9.]+;/\${1}$NEW_IOS_MARKETING;/" "$IOS_PROJECT_FILE" || error_exit "Failed to update iOS MARKETING_VERSION"
[[ -f "${IOS_PROJECT_FILE}.bak" ]] && rm "${IOS_PROJECT_FILE}.bak"

# Verify iOS changes
VERIFY_IOS_BUILD=$(grep -E "CURRENT_PROJECT_VERSION = [0-9]+;" "$IOS_PROJECT_FILE" | head -1 | grep -oE "[0-9]+")
VERIFY_IOS_MARKETING=$(grep -E "MARKETING_VERSION = [0-9.]+;" "$IOS_PROJECT_FILE" | head -1 | grep -oE "[0-9]+\.[0-9]+\.[0-9]+")
[[ "$VERIFY_IOS_BUILD" == "$NEW_IOS_BUILD" ]] || error_exit "iOS CURRENT_PROJECT_VERSION verification failed"
[[ "$VERIFY_IOS_MARKETING" == "$NEW_IOS_MARKETING" ]] || error_exit "iOS MARKETING_VERSION verification failed"

echo -e "${GREEN}✓ iOS version updated${NC}\n"

# ============================================
# SUMMARY
# ============================================

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Version bump complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Android:${NC}"
echo "  versionCode: $CURRENT_VERSION_CODE → $NEW_VERSION_CODE"
echo "  versionName: $CURRENT_VERSION_NAME → $NEW_VERSION_NAME"
echo ""
echo -e "${BLUE}iOS:${NC}"
echo "  CURRENT_PROJECT_VERSION: $CURRENT_IOS_BUILD → $NEW_IOS_BUILD"
echo "  MARKETING_VERSION: $CURRENT_IOS_MARKETING → $NEW_IOS_MARKETING"
echo ""
echo -e "${BLUE}Updated files:${NC}"
echo "  • android/app/build.gradle"
echo "  • ios/TelcExamApp.xcodeproj/project.pbxproj"
echo ""

