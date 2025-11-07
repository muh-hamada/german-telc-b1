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
  echo "  - german-b1"
  echo "  - german-b2"
  echo "  - english-b1"
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

# Run Node script to apply configuration
node scripts/apply-exam-config.js "$EXAM_ID" "$PLATFORM"

if [ $? -eq 0 ]; then
  echo "✅ Configuration applied successfully!"
else
  echo "❌ Configuration failed!"
  exit 1
fi

