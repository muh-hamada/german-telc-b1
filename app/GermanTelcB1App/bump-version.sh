#!/bin/bash

# Script to bump app version for both iOS and Android

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANDROID_BUILD_GRADLE="$SCRIPT_DIR/android/app/build.gradle"
IOS_PROJECT_FILE="$SCRIPT_DIR/ios/TelcExamApp.xcodeproj/project.pbxproj"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Bumping app version...${NC}\n"

# ============================================
# ANDROID VERSION BUMP
# ============================================

echo -e "${BLUE}📱 Updating Android version...${NC}"

# Extract current Android versions
CURRENT_VERSION_CODE=$(grep -E "^\s*versionCode\s+[0-9]+" "$ANDROID_BUILD_GRADLE" | sed -E 's/.*versionCode\s+([0-9]+).*/\1/')
CURRENT_VERSION_NAME=$(grep -E "^\s*versionName\s+\"[0-9.]+\"" "$ANDROID_BUILD_GRADLE" | sed -E 's/.*versionName\s+"([0-9.]+)".*/\1/')

# Calculate new versions
NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))
NEW_VERSION_NAME_PATCH=$(echo "$CURRENT_VERSION_NAME" | awk -F. '{print $NF}')
NEW_VERSION_NAME_PREFIX=$(echo "$CURRENT_VERSION_NAME" | awk -F. '{$NF=""; print $0}' | sed 's/ $//')
NEW_VERSION_NAME="${NEW_VERSION_NAME_PREFIX}.$((NEW_VERSION_NAME_PATCH + 1))"

echo "  Current versionCode: $CURRENT_VERSION_CODE"
echo "  New versionCode: $NEW_VERSION_CODE"
echo "  Current versionName: $CURRENT_VERSION_NAME"
echo "  New versionName: $NEW_VERSION_NAME"

# Update Android build.gradle
sed -i.bak -E "s/(versionCode\s+)[0-9]+/\1$NEW_VERSION_CODE/" "$ANDROID_BUILD_GRADLE"
sed -i.bak -E "s/(versionName\s+\")[0-9.]+(\",?)/\1$NEW_VERSION_NAME\2/" "$ANDROID_BUILD_GRADLE"
rm "${ANDROID_BUILD_GRADLE}.bak"

echo -e "${GREEN}✓ Android version updated${NC}\n"

# ============================================
# iOS VERSION BUMP
# ============================================

echo -e "${BLUE}🍎 Updating iOS version...${NC}"

# Extract current iOS versions (first occurrence)
CURRENT_IOS_BUILD=$(grep -E "CURRENT_PROJECT_VERSION = [0-9]+;" "$IOS_PROJECT_FILE" | head -1 | sed -E 's/.*CURRENT_PROJECT_VERSION = ([0-9]+);.*/\1/')
CURRENT_IOS_MARKETING=$(grep -E "MARKETING_VERSION = [0-9.]+;" "$IOS_PROJECT_FILE" | head -1 | sed -E 's/.*MARKETING_VERSION = ([0-9.]+);.*/\1/')

# Calculate new versions
NEW_IOS_BUILD=$((CURRENT_IOS_BUILD + 1))
NEW_IOS_MARKETING_PATCH=$(echo "$CURRENT_IOS_MARKETING" | awk -F. '{print $NF}')
NEW_IOS_MARKETING_PREFIX=$(echo "$CURRENT_IOS_MARKETING" | awk -F. '{$NF=""; print $0}' | sed 's/ $//')
NEW_IOS_MARKETING="${NEW_IOS_MARKETING_PREFIX}.$((NEW_IOS_MARKETING_PATCH + 1))"

echo "  Current CURRENT_PROJECT_VERSION: $CURRENT_IOS_BUILD"
echo "  New CURRENT_PROJECT_VERSION: $NEW_IOS_BUILD"
echo "  Current MARKETING_VERSION: $CURRENT_IOS_MARKETING"
echo "  New MARKETING_VERSION: $NEW_IOS_MARKETING"

# Update iOS project.pbxproj (all occurrences)
sed -i.bak -E "s/(CURRENT_PROJECT_VERSION = )[0-9]+;/\1$NEW_IOS_BUILD;/" "$IOS_PROJECT_FILE"
sed -i.bak -E "s/(MARKETING_VERSION = )[0-9.]+;/\1$NEW_IOS_MARKETING;/" "$IOS_PROJECT_FILE"
rm "${IOS_PROJECT_FILE}.bak"

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

