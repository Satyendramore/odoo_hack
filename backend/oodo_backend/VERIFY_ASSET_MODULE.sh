#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "Asset Module Verification Script"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FILES_CREATED=0
FILES_MODIFIED=0
ERRORS=0

# Check Java files exist
echo "Checking Java Files..."
echo ""

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((FILES_CREATED++))
    else
        echo -e "${RED}✗${NC} $1 (NOT FOUND)"
        ((ERRORS++))
    fi
}

check_file "src/main/java/com/assetflow/entity/Asset.java"
check_file "src/main/java/com/assetflow/enums/AssetStatus.java"
check_file "src/main/java/com/assetflow/dto/AssetRegistrationRequest.java"
check_file "src/main/java/com/assetflow/dto/AssetResponse.java"
check_file "src/main/java/com/assetflow/dto/AssetStatusUpdateRequest.java"
check_file "src/main/java/com/assetflow/service/AssetService.java"
check_file "src/main/java/com/assetflow/service/AssetTagGenerator.java"
check_file "src/main/java/com/assetflow/repository/AssetRepository.java"
check_file "src/main/java/com/assetflow/specification/AssetSpecifications.java"
check_file "src/main/java/com/assetflow/controller/AssetController.java"
check_file "src/main/java/com/assetflow/exception/AssetNotFoundException.java"
check_file "src/main/java/com/assetflow/exception/InvalidStatusTransitionException.java"
check_file "src/main/resources/db/migration/V002__create_asset_sequence_and_tables.sql"

echo ""
echo "Checking Documentation Files..."
echo ""

check_file "ASSET_MODULE_DOCUMENTATION.md"
check_file "ASSET_MODULE_QUICK_REFERENCE.md"
check_file "ASSET_MODULE_SUMMARY.md"
check_file "ASSET_MODULE_ARCHITECTURE.md"

echo ""
echo "Checking Modified Files..."
echo ""

if grep -q "AssetNotFoundException" "src/main/java/com/assetflow/exception/GlobalExceptionHandler.java"; then
    echo -e "${GREEN}✓${NC} GlobalExceptionHandler updated with AssetNotFoundException"
    ((FILES_MODIFIED++))
else
    echo -e "${RED}✗${NC} GlobalExceptionHandler missing AssetNotFoundException handler"
    ((ERRORS++))
fi

if grep -q "InvalidStatusTransitionException" "src/main/java/com/assetflow/exception/GlobalExceptionHandler.java"; then
    echo -e "${GREEN}✓${NC} GlobalExceptionHandler updated with InvalidStatusTransitionException"
    ((FILES_MODIFIED++))
else
    echo -e "${RED}✗${NC} GlobalExceptionHandler missing InvalidStatusTransitionException handler"
    ((ERRORS++))
fi

echo ""
echo "Code Quality Checks..."
echo ""

# Check for TODOs
if grep -r "TODO" src/main/java/com/assetflow/entity/Asset.java \
    src/main/java/com/assetflow/service/AssetService.java \
    src/main/java/com/assetflow/controller/AssetController.java 2>/dev/null | grep -v ".class"; then
    echo -e "${RED}✗${NC} Found TODO comments in code"
    ((ERRORS++))
else
    echo -e "${GREEN}✓${NC} No TODO comments found"
fi

# Check compilation
echo ""
echo "Compiling Project..."
echo ""

if mvn clean compile -q 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Project compiles successfully"
else
    echo -e "${RED}✗${NC} Compilation failed"
    ((ERRORS++))
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Summary"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Files Created:    ${GREEN}$FILES_CREATED${NC}"
echo "Files Modified:   ${GREEN}$FILES_MODIFIED${NC}"
echo "Errors Found:     ${RED}$ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Asset module is ready.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review.${NC}"
    exit 1
fi
