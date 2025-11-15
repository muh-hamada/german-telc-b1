#!/bin/bash

# iOS App Icon Generator
# Resizes and copies app icon to iOS Assets folder for different sizes

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if exam ID is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Exam ID not provided${NC}"
    echo "Usage: $0 <exam-id>"
    echo "Example: $0 german-b1"
    exit 1
fi

EXAM_ID="$1"
echo -e "${BLUE}📱 Generating iOS app icons for: ${EXAM_ID}${NC}"

# Determine source image based on exam ID
SOURCE_IMAGE=""
case "$EXAM_ID" in
    "german-b1")
        SOURCE_IMAGE="../../logos/ios/logo-ios-german-b1.png"
        ;;
    "german-b2")
        SOURCE_IMAGE="../../logos/ios/logo-ios-german-b2.png"
        ;;
    "english-b1")
        SOURCE_IMAGE="../../logos/ios/logo-ios-english-b1.png"
        ;;
    "english-b2")
        SOURCE_IMAGE="../../logos/ios/logo-ios-english-b2.png"
        ;;
    *)
        echo -e "${RED}Error: Unknown exam ID: ${EXAM_ID}${NC}"
        echo "Supported: german-b1, german-b2, english-b1, english-b2"
        exit 1
        ;;
esac

# Check if source image exists
if [ ! -f "$SOURCE_IMAGE" ]; then
    echo -e "${RED}Error: Source image not found: ${SOURCE_IMAGE}${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found source image: ${SOURCE_IMAGE}${NC}"

# Target directory
ASSETS_DIR="ios/TelcExamApp/Images.xcassets/AppIcon.appiconset"

# Check if sips command exists (macOS built-in image tool)
if ! command -v sips &> /dev/null; then
    echo -e "${RED}Error: sips command not found. Are you on macOS?${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Generating icon sizes...${NC}"

# Create backup of existing icons
BACKUP_DIR="${ASSETS_DIR}/backup_$(date +%Y%m%d_%H%M%S)"
echo -e "\n${YELLOW}Creating backup of existing icons...${NC}"
mkdir -p "$BACKUP_DIR"
cp -r "${ASSETS_DIR}"/*.png "$BACKUP_DIR" 2>/dev/null || true
echo -e "${GREEN}✓ Backup created: ${BACKUP_DIR}${NC}"

# Generate each icon size
# iOS icon sizes (actual pixel dimensions)
# Format: filename|size
ICON_LIST=(
    "40.png|40"
    "60.png|60"
    "58.png|58"
    "87.png|87"
    "80.png|80"
    "120.png|120"
    "120 1.png|120"
    "180.png|180"
    "1024.png|1024"
)

generated_count=0

for icon_entry in "${ICON_LIST[@]}"; do
    filename="${icon_entry%%|*}"
    size="${icon_entry##*|}"
    output_path="${ASSETS_DIR}/${filename}"
    
    echo -e "  ${BLUE}→${NC} Generating ${filename} (${size}x${size}px)..."
    
    # Use sips to resize the image
    sips -z "$size" "$size" "$SOURCE_IMAGE" --out "$output_path" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} Created ${filename}"
        generated_count=$((generated_count + 1))
    else
        echo -e "  ${RED}✗${NC} Failed to create ${filename}"
        exit 1
    fi
done

# Verify all icons were created
echo -e "\n${YELLOW}Verifying generated icons...${NC}"
missing_count=0
total_icons=${#ICON_LIST[@]}

for icon_entry in "${ICON_LIST[@]}"; do
    filename="${icon_entry%%|*}"
    if [ ! -f "${ASSETS_DIR}/${filename}" ]; then
        echo -e "  ${RED}✗${NC} Missing: ${filename}"
        missing_count=$((missing_count + 1))
    fi
done

if [ $missing_count -eq 0 ]; then
    echo -e "${GREEN}✓ All ${total_icons} icon sizes generated successfully${NC}"
else
    echo -e "${RED}✗ Missing ${missing_count} icon(s)${NC}"
    exit 1
fi

# Show summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ iOS app icons generated successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${BLUE}Details:${NC}"
echo -e "  Exam: ${EXAM_ID}"
echo -e "  Source: ${SOURCE_IMAGE}"
echo -e "  Target: ${ASSETS_DIR}"
echo -e "  Icons: ${generated_count} sizes"
echo -e "  Backup: ${BACKUP_DIR}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "  1. Clean build: ${GREEN}cd ios && xcodebuild clean${NC}"
echo -e "  2. Rebuild app: ${GREEN}npm run ios${NC}"

exit 0
