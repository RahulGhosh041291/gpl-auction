#!/bin/bash

# GPL Auction - Production Cleanup Script
# =========================================
# Removes development/testing files not needed for deployment

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${YELLOW}🧹 Cleaning up development files...${NC}"
echo ""

# Count files before
BEFORE=$(find . -type f | wc -l | tr -d ' ')

# Remove all test scripts
echo "Removing test scripts..."
rm -f test_*.sh
rm -f check-status.sh
rm -f test-backend.sh
rm -f test_auth.py

# Remove all documentation/guide markdown files (keep only README.md)
echo "Removing development documentation..."
rm -f ACTION_REQUIRED_PHOTO_TEST.md
rm -f ADMIN_CREDENTIALS.md
rm -f ALL_FIXES_SUMMARY.md
rm -f AUTHENTICATION.md
rm -f AUTHENTICATION_GUIDE.md
rm -f CHANGES_SUMMARY.md
rm -f CURRENT_STATUS.md
rm -f DEVELOPMENT.md
rm -f DOWNLOAD_EXCEL_FEATURE.md
rm -f EXCEL_DOWNLOAD_FIX.md
rm -f EXCEL_DOWNLOAD_QUICK_REF.md
rm -f EXCEL_DOWNLOAD_SUMMARY.md
rm -f EXCEL_DOWNLOAD_TEST_CHECKLIST.md
rm -f EXCEL_DOWNLOAD_VISUAL_GUIDE.md
rm -f FEATURES.md
rm -f FILE_STRUCTURE.txt
rm -f FINAL_STATUS.md
rm -f FIXES_COMPLETED.md
rm -f FIXES_ROUND_2.md
rm -f FIXES_SUMMARY.md
rm -f FORM_STRUCTURE.md
rm -f IMAGE_UPLOAD_TO_EDIT_PLAYER.md
rm -f IMPLEMENTATION_SUMMARY.md
rm -f IPL_AUCTION_LOGIC.md
rm -f IPL_LOGIC_CONFIRMED.md
rm -f LIVE_AUCTION_AUTH_FEATURE.md
rm -f LIVE_AUCTION_AUTH_SUMMARY.md
rm -f LIVE_AUCTION_AUTH_VISUAL_GUIDE.md
rm -f MARK_AVAILABLE_FIX.md
rm -f MASTER_RESET_BUG_FIX.md
rm -f MASTER_RESET_FEATURE.md
rm -f MASTER_RESET_QUICK_REF.md
rm -f MIGRATION_CHECKLIST.md
rm -f MIGRATION_GUIDE.md
rm -f MIGRATION_SUMMARY.txt
rm -f PHOTO_BUG_ROOT_CAUSE_FIXED.md
rm -f PHOTO_FIX_ACTION_REQUIRED.md
rm -f PHOTO_UPLOAD_DEBUG.md
rm -f PHOTO_UPLOAD_FIX_ENHANCED.md
rm -f PLAYER_DELETE_FIX.md
rm -f PLAYER_DELETE_TROUBLESHOOTING.md
rm -f PLAYER_IMAGES_ANALYSIS.md
rm -f PLAYER_IMAGE_FIX.md
rm -f PROJECT_SUMMARY.md
rm -f PYTHON_313_FIX.md
rm -f QUICKSTART.md
rm -f QUICK_REFERENCE.md
rm -f QUICK_START.md
rm -f REGISTRATION_UPDATE.md
rm -f SERVER_STARTED.md
rm -f SETUP_COMPLETE.md
rm -f SOLD_TO_UNSOLD_FIX.md
rm -f START_AUCTION_FIX.md
rm -f TEAM_LOGO_FEATURE_SUMMARY.md
rm -f TEAM_LOGO_UPLOAD_FEATURE.md
rm -f TEAM_LOGO_VISUAL_GUIDE.md
rm -f TESTING_GUIDE.md
rm -f UPDATES_COMPLETE.md
rm -f UPDATES_COMPLETE_V2.md

# Remove migration scripts (already applied)
echo "Removing migration scripts..."
rm -f migrate_add_team_logo.py

# Remove setup scripts (not needed in production)
echo "Removing setup scripts..."
rm -f setup.sh

# Remove keys file if it's just temp data
if [ -f "keys" ]; then
    echo "Removing keys file..."
    rm -f keys
fi

# Remove package.json from root (it's in frontend/)
if [ -f "package.json" ]; then
    echo "Removing root package.json..."
    rm -f package.json
fi

# Remove __pycache__ directories
echo "Removing Python cache files..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null

# Remove .pyc files
find . -type f -name "*.pyc" -delete 2>/dev/null

# Remove node_modules from frontend (will be reinstalled)
if [ -d "frontend/node_modules" ]; then
    echo "Note: frontend/node_modules should be in .gitignore"
fi

# Remove backend database (should be created fresh in production)
if [ -f "backend/gpl_auction.db" ]; then
    echo "Note: backend/gpl_auction.db should be in .gitignore"
fi

# Count files after
AFTER=$(find . -type f | wc -l | tr -d ' ')
REMOVED=$((BEFORE - AFTER))

echo ""
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo "Files before: $BEFORE"
echo "Files after:  $AFTER"
echo "Removed:      $REMOVED files"
echo ""

# Show what remains
echo -e "${YELLOW}📁 Essential files that remain:${NC}"
echo ""
echo "Root:"
echo "  ✅ README.md - Project documentation"
echo "  ✅ start.sh - Production start script"
echo ""
echo "Backend:"
echo "  ✅ backend/*.py - All Python source files"
echo "  ✅ backend/requirements.txt - Python dependencies"
echo "  ✅ backend/.env (if exists) - Environment variables"
echo ""
echo "Frontend:"
echo "  ✅ frontend/src/ - All React source files"
echo "  ✅ frontend/public/ - Static assets"
echo "  ✅ frontend/package.json - Node dependencies"
echo ""

echo -e "${YELLOW}📋 Files you should keep in .gitignore:${NC}"
echo "  • node_modules/"
echo "  • __pycache__/"
echo "  • *.pyc"
echo "  • .env"
echo "  • backend/gpl_auction.db"
echo "  • .DS_Store"
echo ""

echo -e "${GREEN}🎉 Ready for production deployment!${NC}"
echo ""
