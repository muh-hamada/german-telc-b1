#!/bin/bash

# React Native Cache Clearing Script
# Use this when changes aren't reflected in the emulator/simulator

echo "🧹 Clearing all React Native caches..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Clear Watchman
echo -e "\n${YELLOW}1. Clearing Watchman cache...${NC}"
watchman watch-del-all 2>/dev/null
echo -e "${GREEN}✓ Watchman cleared${NC}"

# Step 2: Clear Metro bundler cache
echo -e "\n${YELLOW}2. Clearing Metro bundler cache...${NC}"
rm -rf $TMPDIR/metro-* 2>/dev/null
rm -rf $TMPDIR/haste-* 2>/dev/null
rm -rf $TMPDIR/react-* 2>/dev/null
echo -e "${GREEN}✓ Metro cache cleared${NC}"

# Step 3: Clear node modules cache
echo -e "\n${YELLOW}3. Clearing node_modules cache...${NC}"
rm -rf node_modules/.cache 2>/dev/null
echo -e "${GREEN}✓ Node modules cache cleared${NC}"

# Step 4: Clear iOS build (if on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "\n${YELLOW}4. Cleaning iOS build folder...${NC}"
    cd ios
    xcodebuild clean -workspace ExamPreparationApp.xcworkspace -scheme ExamPreparationApp -quiet 2>/dev/null || true
    rm -rf build 2>/dev/null
    rm -rf ~/Library/Developer/Xcode/DerivedData/ExamPreparationApp-* 2>/dev/null
    cd ..
    echo -e "${GREEN}✓ iOS build cleaned${NC}"
fi

# Step 5: Clear Android build
echo -e "\n${YELLOW}5. Cleaning Android build folder...${NC}"
cd android
./gradlew clean 2>/dev/null || echo "Gradle clean skipped"
rm -rf app/build 2>/dev/null
cd ..
echo -e "${GREEN}✓ Android build cleaned${NC}"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ All caches cleared!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Start Metro bundler with cache reset:"
echo -e "   ${GREEN}npm start -- --reset-cache${NC}"
echo -e ""
echo -e "2. In a NEW terminal, run your app:"
echo -e "   ${GREEN}npm run ios${NC} or ${GREEN}npm run android${NC}"
echo -e ""
echo -e "3. If still not working, try a complete reinstall:"
echo -e "   ${GREEN}rm -rf node_modules && npm install${NC}"

exit 0

