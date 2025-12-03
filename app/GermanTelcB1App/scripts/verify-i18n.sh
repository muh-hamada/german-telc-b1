#!/bin/bash

# i18n Reset and Verification Script
# This script clears all caches and verifies the i18n configuration

echo "🔄 Starting i18n reset and verification..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Clear Metro bundler cache
echo -e "\n${YELLOW}1. Clearing Metro bundler cache...${NC}"
rm -rf /tmp/metro-* /tmp/haste-*
echo -e "${GREEN}✓ Metro cache cleared${NC}"

# Step 2: Clear watchman
echo -e "\n${YELLOW}2. Clearing watchman...${NC}"
if command -v watchman &> /dev/null; then
    watchman watch-del-all
    echo -e "${GREEN}✓ Watchman cleared${NC}"
else
    echo -e "${YELLOW}⚠ Watchman not installed${NC}"
fi

# Step 3: Verify translation files exist
echo -e "\n${YELLOW}3. Verifying translation files...${NC}"

BASE_LOCALES=("en" "de" "ar" "es" "fr" "ru")
EXAM_DIRS=("german-b1" "german-b2")

for locale in "${BASE_LOCALES[@]}"; do
    FILE="src/locales/${locale}.json"
    if [ -f "$FILE" ]; then
        echo -e "${GREEN}✓ Base translation exists: ${locale}.json${NC}"
    else
        echo -e "${RED}✗ Missing base translation: ${locale}.json${NC}"
    fi
done

for exam in "${EXAM_DIRS[@]}"; do
    echo -e "\n  Checking exam: $exam"
    for locale in "${BASE_LOCALES[@]}"; do
        FILE="src/locales/exam-content/${exam}/${locale}.json"
        if [ -f "$FILE" ]; then
            echo -e "${GREEN}  ✓ ${exam}/${locale}.json${NC}"
        else
            echo -e "${RED}  ✗ Missing: ${exam}/${locale}.json${NC}"
        fi
    done
done

# Step 4: Validate JSON syntax
echo -e "\n${YELLOW}4. Validating JSON files...${NC}"

JSON_ERROR=false
for file in src/locales/*.json src/locales/exam-content/*/*.json; do
    if [ -f "$file" ]; then
        if node -e "JSON.parse(require('fs').readFileSync('$file', 'utf8'))" 2>/dev/null; then
            echo -e "${GREEN}✓ Valid JSON: $(basename $file)${NC}"
        else
            echo -e "${RED}✗ Invalid JSON: $file${NC}"
            JSON_ERROR=true
        fi
    fi
done

if [ "$JSON_ERROR" = true ]; then
    echo -e "\n${RED}⚠ Fix JSON errors before proceeding${NC}"
    exit 1
fi

# Step 5: Check i18n.ts imports
echo -e "\n${YELLOW}5. Verifying i18n.ts configuration...${NC}"

if grep -q "import en from '../locales/en.json'" src/utils/i18n.ts; then
    echo -e "${GREEN}✓ Base translations import path correct${NC}"
else
    echo -e "${RED}✗ Base translations import path incorrect${NC}"
fi

if grep -q "import germanB1En from '../locales/exam-content/german-b1/en.json'" src/utils/i18n.ts; then
    echo -e "${GREEN}✓ Exam translations import path correct${NC}"
else
    echo -e "${RED}✗ Exam translations import path incorrect${NC}"
fi

# Step 6: Check active exam configuration
echo -e "\n${YELLOW}6. Checking active exam configuration...${NC}"

ACTIVE_EXAM=$(grep "export const activeExamConfig" src/config/active-exam.config.ts)
echo -e "${GREEN}✓ Active exam: ${ACTIVE_EXAM}${NC}"

# Step 7: Test key extraction
echo -e "\n${YELLOW}7. Testing translation key (profile.totalProgress)...${NC}"

for locale in "${BASE_LOCALES[@]}"; do
    if grep -q '"totalProgress"' "src/locales/${locale}.json"; then
        echo -e "${GREEN}✓ Key exists in ${locale}.json${NC}"
    else
        echo -e "${RED}✗ Key missing in ${locale}.json${NC}"
    fi
done

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ i18n verification complete!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Start Metro bundler with cache reset:"
echo -e "   ${GREEN}npm start -- --reset-cache${NC}"
echo -e "\n2. In a new terminal, run the app:"
echo -e "   ${GREEN}npm run ios${NC} or ${GREEN}npm run android${NC}"
echo -e "\n3. If issues persist, check I18N_SETUP.md for detailed troubleshooting"

exit 0


