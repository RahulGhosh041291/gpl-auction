#!/bin/bash

# GPL Auction - Production Ready Checklist
# ==========================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   GPL AUCTION - PRODUCTION DEPLOYMENT CHECKLIST     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if something exists
check_exists() {
    if [ -e "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        return 0
    else
        echo -e "${RED}❌${NC} $2"
        return 1
    fi
}

# Function to check if string exists in file
check_content() {
    if grep -q "$1" "$2" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $3"
        return 0
    else
        echo -e "${YELLOW}⚠️${NC}  $3"
        return 1
    fi
}

echo -e "${YELLOW}📋 Essential Files Check:${NC}"
echo ""
check_exists "backend/main.py" "Backend main.py exists"
check_exists "backend/requirements.txt" "Backend requirements.txt exists"
check_exists "frontend/package.json" "Frontend package.json exists"
check_exists "frontend/src/App.js" "Frontend App.js exists"
check_exists ".gitignore" "Root .gitignore exists"
check_exists "DEPLOYMENT_GUIDE.md" "Deployment guide exists"
echo ""

echo -e "${YELLOW}🔒 Security Check:${NC}"
echo ""
check_exists ".env" "No .env file in root (good)" && echo -e "${YELLOW}⚠️${NC}  .env file found - make sure it's in .gitignore" || echo -e "${GREEN}✅${NC} No .env file in root (good)"
check_exists "keys" "No keys file (good)" && echo -e "${YELLOW}⚠️${NC}  Keys file found - will be removed during cleanup" || echo -e "${GREEN}✅${NC} No keys file (good)"
echo ""

echo -e "${YELLOW}🔧 Configuration Check:${NC}"
echo ""
check_content "CORSMiddleware" "backend/main.py" "CORS configured in backend"
check_content "jwt" "backend/main.py" "JWT authentication configured"
check_exists "backend/routers/auth.py" "Auth router exists"
check_exists "frontend/src/components/ProtectedRoute/ProtectedRoute.js" "Protected routes exist"
echo ""

echo -e "${YELLOW}📦 Dependencies Check:${NC}"
echo ""
if [ -f "backend/requirements.txt" ]; then
    echo "Backend dependencies:"
    echo "  • fastapi"
    echo "  • uvicorn"
    echo "  • sqlalchemy"
    echo "  • python-jose"
    echo "  • passlib"
    echo ""
fi

if [ -f "frontend/package.json" ]; then
    echo "Frontend dependencies:"
    echo "  • react"
    echo "  • react-router-dom"
    echo "  • axios"
    echo "  • framer-motion"
    echo ""
fi

echo -e "${YELLOW}🗂️  Directory Structure:${NC}"
echo ""
echo "backend/"
echo "  ├── main.py"
echo "  ├── database.py"
echo "  ├── models.py"
echo "  ├── schemas.py"
echo "  ├── routers/"
echo "  └── requirements.txt"
echo ""
echo "frontend/"
echo "  ├── src/"
echo "  │   ├── App.js"
echo "  │   ├── components/"
echo "  │   └── pages/"
echo "  ├── public/"
echo "  └── package.json"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo ""
echo "1. Run cleanup script:"
echo -e "   ${GREEN}./cleanup_for_production.sh${NC}"
echo ""
echo "2. Read deployment guide:"
echo -e "   ${GREEN}cat DEPLOYMENT_GUIDE.md${NC}"
echo ""
echo "3. Update CORS origins in backend/main.py with your production domain"
echo ""
echo "4. Create GitHub repository and push code:"
echo -e "   ${GREEN}git init${NC}"
echo -e "   ${GREEN}git add .${NC}"
echo -e "   ${GREEN}git commit -m 'Initial commit'${NC}"
echo -e "   ${GREEN}git remote add origin <your-repo-url>${NC}"
echo -e "   ${GREEN}git push -u origin main${NC}"
echo ""
echo "5. Deploy:"
echo "   • Frontend: Netlify (FREE)"
echo "   • Backend: Render (FREE)"
echo ""
echo -e "${GREEN}🎯 Recommended: Netlify + Render (Both FREE)${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
