#!/bin/bash

# Paths to the necessary files
DEV_CONFIG_FILE="./src/config/development.config.ts"

# Extract development flags from demo.config.ts
DEMO_MODE=$(grep -oE "DEMO_MODE\s*=\s*false" "$DEV_CONFIG_FILE" | awk '{print $3}')
HIDE_ADS=$(grep -oE "HIDE_ADS\s*=\s*false" "$DEV_CONFIG_FILE" | awk '{print $3}')
SKIP_REWARDED_ADS=$(grep -oE "SKIP_REWARDED_ADS\s*=\s*false" "$DEV_CONFIG_FILE" | awk '{print $3}')
ALWAYS_SHOW_REVIEW_MODAL=$(grep -oE "ALWAYS_SHOW_REVIEW_MODAL\s*=\s*false" "$DEV_CONFIG_FILE" | awk '{print $3}')

# Check if all versions match
if [ "$DEMO_MODE" != "false" ] || [ "$HIDE_ADS" != "false" ] || [ "$SKIP_REWARDED_ADS" != "false" ] || [ "$ALWAYS_SHOW_REVIEW_MODAL" != "false" ]; then
    echo "Development flags enabled detected!"
    echo "Enabled Development Config:"
    flags="  "
    [ "$DEMO_MODE" != "false" ] && flags+="DEMO_MODE, "
    [ "$HIDE_ADS" != "false" ] && flags+="HIDE_ADS, "
    [ "$SKIP_REWARDED_ADS" != "false" ] && flags+="SKIP_REWARDED_ADS, "
    [ "$ALWAYS_SHOW_REVIEW_MODAL" != "false" ] && flags+="ALWAYS_SHOW_REVIEW_MODAL, "
    # Remove trailing comma and space, print only if not empty
    if [ -n "$flags" ]; then
        echo "${flags%, }"
    fi
    echo "Please ensure all development flags are set to false."
    echo "Exiting build process due to development flags enabled."
    exit 1
fi

echo "Development flags disabled. Proceeding with the build..."