#!/bin/bash

# i18n Reset and Verification Script
# This script clears all caches and verifies the i18n configuration

echo "🔄 Starting i18n reset and verification..."

# Get the script directory and navigate to the project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

echo "Working directory: $PROJECT_ROOT"

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

LOCALES=("en" "de" "ar" "es" "fr" "ru")

for locale in "${LOCALES[@]}"; do
    FILE="src/locales/${locale}.json"
    if [ -f "$FILE" ]; then
        echo -e "${GREEN}✓ Translation exists: ${locale}.json${NC}"
    else
        echo -e "${RED}✗ Missing translation: ${locale}.json${NC}"
    fi
done

# Step 4: Validate JSON syntax
echo -e "\n${YELLOW}4. Validating JSON files...${NC}"

JSON_ERROR=false
for file in src/locales/*.json; do
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

# Step 5: Extract and compare keys
echo -e "\n${YELLOW}5. Checking for missing translation keys...${NC}"

# Use English as the reference
REFERENCE_FILE="src/locales/en.json"
if [ ! -f "$REFERENCE_FILE" ]; then
    echo -e "${RED}✗ Reference file (en.json) not found${NC}"
    exit 1
fi

echo -e "${GREEN}Using en.json as reference${NC}"

MISSING_KEYS_FOUND=false

# Compare each locale against reference using a single node command
# This avoids shell sort/comm locale issues and handles errors properly
for locale in "${LOCALES[@]}"; do
    if [ "$locale" == "en" ]; then
        continue
    fi
    
    FILE="src/locales/${locale}.json"
    if [ ! -f "$FILE" ]; then
        echo -e "${RED}✗ Missing locale file: ${locale}.json${NC}"
        MISSING_KEYS_FOUND=true
        continue
    fi
    
    echo -e "\n${YELLOW}Checking ${locale}.json...${NC}"
    
    # Run comparison in node to avoid sort/comm locale issues
    RESULT=$(node -e "
    const fs = require('fs');
    const extractKeys = (obj, prefix = '') => {
        let keys = [];
        for (const key of Object.keys(obj)) {
            const path = prefix ? \`\${prefix}.\${key}\` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                keys = keys.concat(extractKeys(obj[key], path));
            } else {
                keys.push(path);
            }
        }
        return keys;
    };
    const extractEmptyKeys = (obj, prefix = '') => {
        let keys = [];
        for (const key of Object.keys(obj)) {
            const path = prefix ? \`\${prefix}.\${key}\` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                keys = keys.concat(extractEmptyKeys(obj[key], path));
            } else if (obj[key] === '' || obj[key] === null || obj[key] === undefined || (typeof obj[key] === 'string' && obj[key].trim() === '')) {
                keys.push(path);
            }
        }
        return keys;
    };
    const refData = JSON.parse(fs.readFileSync('$REFERENCE_FILE', 'utf8'));
    const locData = JSON.parse(fs.readFileSync('$FILE', 'utf8'));
    const refKeys = new Set(extractKeys(refData));
    const locKeys = new Set(extractKeys(locData));
    const missing = [...refKeys].filter(k => !locKeys.has(k)).sort();
    const empty = extractEmptyKeys(locData).sort();
    const output = { missing, empty, total: refKeys.size };
    console.log(JSON.stringify(output));
    " 2>&1)
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Error checking ${locale}.json: ${RESULT}${NC}"
        MISSING_KEYS_FOUND=true
        continue
    fi
    
    MISSING_COUNT=$(echo "$RESULT" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.missing.length)")
    EMPTY_COUNT=$(echo "$RESULT" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.empty.length)")
    TOTAL_COUNT=$(echo "$RESULT" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.total)")
    
    if [ "$MISSING_COUNT" -eq 0 ] && [ "$EMPTY_COUNT" -eq 0 ]; then
        echo -e "${GREEN}✓ All keys match (${TOTAL_COUNT} keys)${NC}"
    else
        if [ "$MISSING_COUNT" -gt 0 ]; then
            echo -e "${RED}✗ Missing keys in ${locale}.json:${NC}"
            echo "$RESULT" | node -e "
            const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
            d.missing.forEach(k => console.log('  - ' + k));
            "
            MISSING_KEYS_FOUND=true
        fi
        
        if [ "$EMPTY_COUNT" -gt 0 ]; then
            echo -e "${RED}✗ Empty/null values in ${locale}.json:${NC}"
            echo "$RESULT" | node -e "
            const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
            d.empty.forEach(k => console.log('  - ' + k + ' (empty value)'));
            "
            MISSING_KEYS_FOUND=true
        fi
    fi
done

# Step 6: Check i18n.ts imports
echo -e "\n${YELLOW}6. Verifying i18n.ts configuration...${NC}"

if grep -q "import en from '../locales/en.json'" src/utils/i18n.ts 2>/dev/null; then
    echo -e "${GREEN}✓ Translation imports path correct${NC}"
else
    echo -e "${YELLOW}⚠ Could not verify i18n.ts import paths${NC}"
fi

# Step 7: Check active exam configuration
echo -e "\n${YELLOW}7. Checking active exam configuration...${NC}"

if [ -f "src/config/active-exam.config.ts" ]; then
    ACTIVE_EXAM=$(grep "export const activeExamConfig" src/config/active-exam.config.ts)
    echo -e "${GREEN}✓ Active exam: ${ACTIVE_EXAM}${NC}"
else
    echo -e "${YELLOW}⚠ active-exam.config.ts not found${NC}"
fi

# Final summary
echo -e "\n${GREEN}========================================${NC}"
if [ "$MISSING_KEYS_FOUND" = true ]; then
    echo -e "${RED}❌ Translation verification FAILED!${NC}"
    echo -e "${RED}Missing/empty translation keys detected!${NC}"
    echo -e "${YELLOW}Please add the missing keys and fill empty values in the respective locale files before committing${NC}"
    echo -e "${GREEN}========================================${NC}"
    exit 1
else
    echo -e "${GREEN}✓ i18n verification complete!${NC}"
    echo -e "${GREEN}All translation keys are in sync${NC}"
    echo -e "${GREEN}========================================${NC}"
fi

exit 0
