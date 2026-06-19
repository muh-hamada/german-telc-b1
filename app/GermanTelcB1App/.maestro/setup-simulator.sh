#!/bin/bash
# Setup simulator for Maestro E2E testing
# This script configures the simulator app state so Maestro tests can run
# without being blocked by consent dialogs, ads, or onboarding flows.
#
# Usage: ./setup-simulator.sh <SIMULATOR_UDID>
# Example: ./setup-simulator.sh 929AD880-71DF-426D-8CB4-30CA02376A18

set -euo pipefail

SIMULATOR_UDID="${1:?Usage: $0 <SIMULATOR_UDID>}"
BUNDLE_ID="com.mhamada.telcb1german"

echo "Setting up simulator $SIMULATOR_UDID for E2E testing..."

# Kill the app if running
xcrun simctl terminate "$SIMULATOR_UDID" "$BUNDLE_ID" 2>/dev/null || true

# Find the app data container
APP_DATA=$(xcrun simctl get_app_container "$SIMULATOR_UDID" "$BUNDLE_ID" data 2>/dev/null)
if [ -z "$APP_DATA" ]; then
  echo "ERROR: App not installed on simulator. Build and install first."
  exit 1
fi

echo "App data: $APP_DATA"

# 1. Set AsyncStorage: hasLaunched=true, user-language=en (skip onboarding)
RCTS_DIR="$APP_DATA/Library/Application Support/$BUNDLE_ID/RCTAsyncLocalStorage_V1"
if [ -f "$RCTS_DIR/manifest.json" ]; then
  python3 -c "
import json
with open('$RCTS_DIR/manifest.json', 'r') as f:
    data = json.load(f)
data['user-language'] = 'en'
data['hasLaunched'] = 'true'
with open('$RCTS_DIR/manifest.json', 'w') as f:
    json.dump(data, f)
print('AsyncStorage updated: user-language=en, hasLaunched=true')
"
else
  echo "WARNING: AsyncStorage not found. Run the app once first."
fi

# 2. Set UserDefaults: disable GDPR consent dialog
APP_PLIST="$APP_DATA/Library/Preferences/$BUNDLE_ID.plist"
if [ -f "$APP_PLIST" ]; then
  defaults write "$APP_PLIST" IABTCF_gdprApplies -int 0
  defaults write "$APP_PLIST" ump_status -int 1
  defaults write "$APP_PLIST" ump_rq_st -int 1
  echo "UserDefaults updated: GDPR disabled, UMP status=NOT_REQUIRED"
else
  echo "WARNING: Preferences plist not found. Run the app once first."
fi

# 3. Set HIDE_ADS=true in development config (prevents ad WebViews from blocking accessibility tree)
DEV_CONFIG="$(dirname "$0")/../src/config/development.config.ts"
if [ -f "$DEV_CONFIG" ]; then
  sed -i '' 's/export const HIDE_ADS = false;/export const HIDE_ADS = true;/' "$DEV_CONFIG"
  echo "development.config.ts: HIDE_ADS=true"
  echo ""
  echo "⚠️  IMPORTANT: Remember to revert HIDE_ADS=false before committing!"
else
  echo "WARNING: development.config.ts not found."
fi

echo ""
echo "Setup complete! Now:"
echo "  1. Launch the app: xcrun simctl launch $SIMULATOR_UDID $BUNDLE_ID"
echo "  2. Wait ~5 seconds for the app to load"
echo "  3. Run tests: maestro test .maestro/practice-menu-sections.yaml --device $SIMULATOR_UDID"
