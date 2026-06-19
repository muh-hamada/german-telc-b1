#!/bin/bash
# Run Maestro E2E tests on Android emulator.
#
# Usage:
#   ./scripts/run-maestro-tests.sh                    # Run all tests for default exam (german-b1)
#   ./scripts/run-maestro-tests.sh <test-file.yaml>   # Run a specific test
#   EXAM=english-b1 ./scripts/run-maestro-tests.sh    # Run all tests for english-b1
#   EXAM=german-b2 npm run e2e                        # Same, via npm script
#
# Prerequisites:
#   - Android SDK installed at ~/Library/Android/sdk
#   - Maestro installed at ~/.maestro/bin
#   - Pixel_7a AVD configured
#   - Metro running (npm start)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# --- Paths ---
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$HOME/.maestro/bin:$PATH"

AVD_NAME="${AVD_NAME:-Pixel_7a}"
EXAM="${EXAM:-german-b1}"
TEST_FILE="${1:-}"

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}▸${NC} $1"; }
warn() { echo -e "${YELLOW}▸${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }

# --- Derive APP_ID from EXAM ---
case "$EXAM" in
  german-a1)          APP_ID=com.mhamada.telca1german ;;
  goethe-german-a1)   APP_ID=com.mhamada.goethea1german ;;
  german-a2)          APP_ID=com.mhamada.telca2german ;;
  german-b1)          APP_ID=com.mhamada.telcb1german ;;
  german-b2)          APP_ID=com.mhamada.telcb2german ;;
  english-b1)         APP_ID=com.mhamada.telcb1english ;;
  english-b2)         APP_ID=com.mhamada.telcb2english ;;
  dele-spanish-b1)    APP_ID=com.mhamada.deleb1spanish ;;
  *) fail "Unknown exam: $EXAM. Valid: german-a1, goethe-german-a1, german-a2, german-b1, german-b2, english-b1, english-b2, dele-spanish-b1" ;;
esac

# --- Verify tools ---
command -v adb >/dev/null 2>&1      || fail "adb not found. Install Android SDK."
command -v emulator >/dev/null 2>&1  || fail "emulator not found. Install Android SDK."
command -v maestro >/dev/null 2>&1   || fail "maestro not found. Install from https://maestro.mobile.dev"

# --- Check Metro ---
if ! curl -s http://localhost:8081/status 2>/dev/null | grep -q "packager-status:running"; then
  fail "Metro is not running. Start it first: npm start"
fi

# --- Start emulator if needed ---
if ! adb devices 2>/dev/null | grep -q "emulator-"; then
  log "Starting Android emulator ($AVD_NAME)..."
  emulator -avd "$AVD_NAME" -no-snapshot-load &>/dev/null &
  disown

  log "Waiting for emulator to boot..."
  adb wait-for-device
  # Wait for boot_completed
  for i in $(seq 1 60); do
    if [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; then
      break
    fi
    sleep 2
  done

  if [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" != "1" ]; then
    fail "Emulator failed to boot within 120 seconds."
  fi
  log "Emulator booted."
else
  log "Android emulator already running."
fi

DEVICE_ID=$(adb devices | grep "emulator-" | head -1 | awk '{print $1}')
log "Using device: $DEVICE_ID"

# --- Build and install app ---
log "Building and installing $EXAM on $DEVICE_ID..."
./scripts/build-config.sh "$EXAM" android
FLAVOR=$(echo "$EXAM" | perl -pe 's/(^|-)(\w)/uc($2)/ge')
cd android
./gradlew "install${FLAVOR}Debug" -q || { cd ..; fail "Gradle build failed for flavor ${FLAVOR}Debug"; }
cd ..
log "App installed."

# --- Launch app before tests ---
adb shell am force-stop "$APP_ID" 2>/dev/null || true
adb shell monkey -p "$APP_ID" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
sleep 5

# --- Run Maestro tests ---
echo ""
log "Running Maestro tests..."
echo "─────────────────────────────────────────"

PASS=0
FAIL=0
ERRORS=""

if [ -n "$TEST_FILE" ]; then
  # Run a specific test
  if [ ! -f "$TEST_FILE" ]; then
    # Try prepending .maestro/ if not found
    TEST_FILE=".maestro/$TEST_FILE"
  fi
  [ -f "$TEST_FILE" ] || fail "Test file not found: $TEST_FILE"

  log "Running: $TEST_FILE (app: $APP_ID)"
  if maestro test "$TEST_FILE" --device "$DEVICE_ID" --env APP_ID="$APP_ID" 2>&1; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    ERRORS="$ERRORS\n  ✗ $TEST_FILE"
  fi
else
  # Run all tests matching the current exam (files matching *-{exam}.yaml)
  for test_file in .maestro/*-"${EXAM}".yaml; do
    [ -f "$test_file" ] || continue
    log "Running: $test_file (app: $APP_ID)"
    if maestro test "$test_file" --device "$DEVICE_ID" --env APP_ID="$APP_ID" 2>&1; then
      PASS=$((PASS + 1))
    else
      FAIL=$((FAIL + 1))
      ERRORS="$ERRORS\n  ✗ $test_file"
    fi
    echo ""
  done
fi

# --- Summary ---
echo "─────────────────────────────────────────"
if [ $FAIL -eq 0 ]; then
  log "${GREEN}All $PASS test(s) passed.${NC}"
else
  warn "$PASS passed, $FAIL failed."
  echo -e "$ERRORS"
  exit 1
fi
