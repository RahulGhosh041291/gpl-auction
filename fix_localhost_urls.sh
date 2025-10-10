#!/bin/bash

# Fix hardcoded localhost URLs in frontend
# Replace all http://localhost:8000 with ${API_URL} in JavaScript files

cd frontend/src

# Fix Login.js
sed -i '' "s|'http://localhost:8000/api/auth/login'|\`\${API_URL}/auth/login\`|g" pages/Login/Login.js
# Add API_URL import if not present
if ! grep -q "import.*API_URL.*from.*services/api" pages/Login/Login.js; then
    sed -i '' "5i\\
import { API_URL } from '../../services/api';
" pages/Login/Login.js
fi

# Fix Teams.js
sed -i '' "s|'http://localhost:8000/api/teams/|\`\${API_URL}/teams/|g" pages/Teams/Teams.js
# Add API_URL import
if ! grep -q "import.*API_URL.*from.*services/api" pages/Teams/Teams.js; then
    sed -i '' "s|import { teamsAPI } from|import { teamsAPI, API_URL } from|g" pages/Teams/Teams.js
fi

# Fix Players.js
sed -i '' "s|'http://localhost:8000/api/players/|\`\${API_URL}/players/|g" pages/Players/Players.js
# Add API_URL import
if ! grep -q "import.*API_URL.*from.*services/api" pages/Players/Players.js; then
    sed -i '' "s|import { playersAPI } from|import { playersAPI, API_URL } from|g" pages/Players/Players.js
fi

# Fix TeamRegistration.js if it uses hardcoded URLs
if grep -q "http://localhost:8000" pages/TeamRegistration/TeamRegistration.js 2>/dev/null; then
    sed -i '' "s|process.env.REACT_APP_API_URL \|\| 'http://localhost:8000'|process.env.REACT_APP_API_URL \|\| 'http://localhost:8000'|g" pages/TeamRegistration/TeamRegistration.js
fi

echo "✅ Fixed all hardcoded localhost URLs"
echo "Files updated:"
echo "  - pages/Login/Login.js"
echo "  - pages/Teams/Teams.js"
echo "  - pages/Players/Players.js"
