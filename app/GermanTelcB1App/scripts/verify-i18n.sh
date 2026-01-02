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

# Helper function to extract all keys from JSON
extract_keys() {
    node -e "
    const fs = require('fs');
    const extractKeys = (obj, prefix = '') => {
        let keys = [];
        for (let key in obj) {
            const path = prefix ? \`\${prefix}.\${key}\` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                keys = keys.concat(extractKeys(obj[key], path));
            } else {
                keys.push(path);
            }
        }
        return keys;
    };
    const data = JSON.parse(fs.readFileSync('$1', 'utf8'));
    console.log(extractKeys(data).join('\n'));
    "
}

# Use English as the reference
REFERENCE_FILE="src/locales/en.json"
if [ ! -f "$REFERENCE_FILE" ]; then
    echo -e "${RED}✗ Reference file (en.json) not found${NC}"
    exit 1
fi

echo -e "${GREEN}Using en.json as reference${NC}"
REFERENCE_KEYS=$(extract_keys "$REFERENCE_FILE" | sort)

MISSING_KEYS_FOUND=false

# Check each locale against reference
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
    
    LOCALE_KEYS=$(extract_keys "$FILE" | sort)
    
    # Find missing keys (in reference but not in locale)
    MISSING=$(comm -23 <(echo "$REFERENCE_KEYS") <(echo "$LOCALE_KEYS"))
    
    # Find extra keys (in locale but not in reference)
    EXTRA=$(comm -13 <(echo "$REFERENCE_KEYS") <(echo "$LOCALE_KEYS"))
    
    if [ -z "$MISSING" ] && [ -z "$EXTRA" ]; then
        echo -e "${GREEN}✓ All keys match ($(echo "$REFERENCE_KEYS" | wc -l | xargs) keys)${NC}"
    else
        if [ -n "$MISSING" ]; then
            echo -e "${RED}✗ Missing keys in ${locale}.json:${NC}"
            echo "$MISSING" | while read key; do
                [ -n "$key" ] && echo -e "${RED}  - $key${NC}"
            done
            MISSING_KEYS_FOUND=true
        fi
        
        # Extra keys check (not logged to console)
        # if [ -n "$EXTRA" ]; then
        #     echo -e "${YELLOW}⚠ Extra keys in ${locale}.json (not in en.json):${NC}"
        #     echo "$EXTRA" | while read key; do
        #         echo -e "${YELLOW}  + $key${NC}"
        #     done
        # fi
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
    echo -e "${RED}Missing translation keys detected!${NC}"
    echo -e "${YELLOW}Please add the missing keys to the respective locale files before committing${NC}"
    echo -e "${GREEN}========================================${NC}"
    exit 1
else
    echo -e "${GREEN}✓ i18n verification complete!${NC}"
    echo -e "${GREEN}All translation keys are in sync${NC}"
    echo -e "${GREEN}========================================${NC}"
fi

exit 0
