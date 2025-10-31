#!/bin/bash

# Run version check and exit if it fails
if ! ./check-dev-flags.sh; then
    echo "Build aborted due to dev flags check failure."
    exit 1
fi

# Build the Android app
npx react-native build-android --mode=release

echo "Build completed successfully."