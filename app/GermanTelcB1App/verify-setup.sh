#!/bin/bash

# Installation and Setup Verification Script
# Checks that all prerequisites are installed and configured

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗"
echo -e "║  Release Automation - Setup Verification            ║"
echo -e "╚══════════════════════════════════════════════════════╝${NC}\n"

SUCCESS_COUNT=0
WARNING_COUNT=0
ERROR_COUNT=0

check_command() {
  if command -v "$1" &> /dev/null; then
    echo -e "${GREEN}✓${NC} $2 found: $(command -v "$1")"
    ((SUCCESS_COUNT++))
    return 0
  else
    echo -e "${RED}✗${NC} $2 not found"
    ((ERROR_COUNT++))
    return 1
  fi
}

check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $2 exists"
    ((SUCCESS_COUNT++))
    return 0
  else
    echo -e "${RED}✗${NC} $2 not found at: $1"
    ((ERROR_COUNT++))
    return 1
  fi
}

check_optional() {
  if [ -f "$1" ] || [ -n "${!2}" ]; then
    echo -e "${GREEN}✓${NC} $3 configured"
    ((SUCCESS_COUNT++))
    return 0
  else
    echo -e "${YELLOW}⚠${NC} $3 not configured (required for releases)"
    ((WARNING_COUNT++))
    return 1
  fi
}

echo -e "${BLUE}Checking System Requirements...${NC}"
check_command "node" "Node.js"
check_command "npm" "npm"
check_command "bundle" "Bundler" || echo -e "  ${YELLOW}→ Install with: gem install bundler${NC}"
check_command "ruby" "Ruby"
check_command "java" "Java (for Android builds)"
check_command "xcodebuild" "Xcode (for iOS builds)"

echo ""
echo -e "${BLUE}Checking Project Files...${NC}"
check_file "$SCRIPT_DIR/build-android.sh" "Android build script"
check_file "$SCRIPT_DIR/build-ios.sh" "iOS build script"
check_file "$SCRIPT_DIR/fastlane-android-release.sh" "Android release script"
check_file "$SCRIPT_DIR/fastlane-ios-release.sh" "iOS release script"
check_file "$SCRIPT_DIR/release-all.sh" "Main release orchestrator"
check_file "$SCRIPT_DIR/fastlane/Fastfile" "Fastlane configuration"
check_file "$SCRIPT_DIR/../update-messages.json" "Update messages"

echo ""
echo -e "${BLUE}Checking Build Configuration...${NC}"
check_file "$SCRIPT_DIR/android/app/build.gradle" "Android build.gradle"
if [ -d "$SCRIPT_DIR/ios/ExamPreparationApp.xcworkspace" ]; then
  echo -e "${GREEN}✓${NC} iOS workspace exists"
  ((SUCCESS_COUNT++))
else
  echo -e "${RED}✗${NC} iOS workspace not found at: $SCRIPT_DIR/ios/ExamPreparationApp.xcworkspace"
  ((ERROR_COUNT++))
fi
check_file "$SCRIPT_DIR/Gemfile" "Ruby Gemfile"

echo ""
echo -e "${BLUE}Checking Store Credentials (Optional)...${NC}"
# Check for Play Store credentials (file in fastlane directory or env var)
if [ -f "$SCRIPT_DIR/fastlane/playstore-service-account.json" ]; then
  echo -e "${GREEN}✓${NC} Google Play Store credentials configured (fastlane/playstore-service-account.json)"
  ((SUCCESS_COUNT++))
elif [ -f "$HOME/.playstore_credentials.json" ] || [ -n "$SUPPLY_JSON_KEY" ]; then
  echo -e "${GREEN}✓${NC} Google Play Store credentials configured"
  ((SUCCESS_COUNT++))
else
  echo -e "${YELLOW}⚠${NC} Google Play Store credentials not configured (required for releases)"
  ((WARNING_COUNT++))
fi

# Check for App Store credentials
if [ -n "$FASTLANE_PASSWORD" ]; then
  echo -e "${GREEN}✓${NC} App Store Connect password (env var)"
  ((SUCCESS_COUNT++))
elif [ -n "$FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD" ]; then
  echo -e "${GREEN}✓${NC} App Store Connect password (env var)"
  ((SUCCESS_COUNT++))
else
  echo -e "${YELLOW}⚠${NC} App Store Connect password not set (required for releases)"
  ((WARNING_COUNT++))
fi

echo ""
echo -e "${BLUE}Running Bundle Check...${NC}"
if bundle check &> /dev/null; then
  echo -e "${GREEN}✓${NC} Ruby gems are installed"
  ((SUCCESS_COUNT++))
else
  echo -e "${YELLOW}⚠${NC} Ruby gems need installation"
  echo -e "  ${YELLOW}→ Run: bundle install${NC}"
  ((WARNING_COUNT++))
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Summary:${NC}"
echo -e "  ${GREEN}✓ Success: $SUCCESS_COUNT${NC}"
if [ $WARNING_COUNT -gt 0 ]; then
  echo -e "  ${YELLOW}⚠ Warnings: $WARNING_COUNT${NC}"
fi
if [ $ERROR_COUNT -gt 0 ]; then
  echo -e "  ${RED}✗ Errors: $ERROR_COUNT${NC}"
fi
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

echo ""
if [ $ERROR_COUNT -gt 0 ]; then
  echo -e "${RED}❌ Setup has errors. Please fix them before running releases.${NC}"
  exit 1
elif [ $WARNING_COUNT -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Setup has warnings. You can build locally but may need credentials for store releases.${NC}"
  echo ""
  echo -e "${BLUE}Next steps:${NC}"
  echo -e "  1. Run: ${GREEN}bundle install${NC}"
  echo -e "  2. Configure Play Store API credentials"
  echo -e "  3. Configure App Store Connect password"
  echo -e "  4. See: ${BLUE}RELEASE-AUTOMATION.md${NC} for details"
  exit 0
else
  echo -e "${GREEN}✅ All checks passed! You're ready to run releases.${NC}"
  echo ""
  echo -e "${BLUE}Quick start:${NC}"
  echo -e "  ${GREEN}./release-all.sh 0${NC}          # Release all apps"
  echo -e "  ${GREEN}./release-help.sh${NC}           # Show command reference"
  echo ""
  exit 0
fi
