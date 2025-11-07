#!/bin/bash

# Script to generate hermesvm.framework dSYM after archiving
# This fixes the "archive did not include a dSYM for hermesvm.framework" error

set -e

echo "🔍 Searching for hermesvm.framework in archive..."

# Find the most recent archive
ARCHIVE_PATH=$(ls -dt ~/Library/Developer/Xcode/Archives/*/*.xcarchive 2>/dev/null | head -1)

if [[ -z "$ARCHIVE_PATH" || ! -d "$ARCHIVE_PATH" ]]; then
  echo "❌ No archive found. Please archive the project first."
  exit 1
fi

echo "📦 Archive Path: $ARCHIVE_PATH"

# Find hermesvm framework in the archive
HERMESVM_FRAMEWORK=$(find "$ARCHIVE_PATH/Products/Applications" -name "hermesvm.framework" -type d | head -1)

if [[ -z "$HERMESVM_FRAMEWORK" ]]; then
  echo "❌ hermesvm.framework not found in archive!"
  exit 1
fi

echo "📍 Found hermesvm.framework at: $HERMESVM_FRAMEWORK"

# Find the hermesvm binary
HERMESVM_BINARY="$HERMESVM_FRAMEWORK/hermesvm"

if [[ ! -f "$HERMESVM_BINARY" ]]; then
  echo "❌ hermesvm binary not found!"
  exit 1
fi

# Generate dSYM
DSYM_OUTPUT="$ARCHIVE_PATH/dSYMs/hermesvm.framework.dSYM"

echo "🔨 Generating dSYM with dsymutil..."
dsymutil "$HERMESVM_BINARY" -o "$DSYM_OUTPUT"

if [[ -d "$DSYM_OUTPUT" ]]; then
  echo "✅ hermesvm.framework.dSYM generated successfully at: $DSYM_OUTPUT"
  echo ""
  echo "📂 All dSYM files in archive:"
  find "$ARCHIVE_PATH/dSYMs" -name "*.dSYM" -type d
  echo ""
  echo "🎉 Done! You can now validate/distribute your archive."
else
  echo "❌ Failed to generate dSYM!"
  exit 1
fi

