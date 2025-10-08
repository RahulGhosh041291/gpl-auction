#!/bin/bash

# GPL Auction - Quick Start Script (Updated for Python 3.13)

echo "🚀 Starting GPL Season 2 Auction Application"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "backend/main.py" ]; then
    echo "❌ Error: Please run this script from the gpl-auction root directory"
    exit 1
fi

# Install email-validator if not present
echo "📦 Checking dependencies..."
cd backend
pip list | grep email-validator > /dev/null
if [ $? -ne 0 ]; then
    echo "Installing email-validator..."
    pip install email-validator
fi
cd ..

# Create database
echo ""
echo "🗄️  Creating database..."
cd backend
python -c "from database import engine, Base; from models import *; Base.metadata.create_all(bind=engine); print('✅ Database created!')"

# Start backend in background
echo ""
echo "🔧 Starting backend server..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Initialize teams
echo ""
echo "🏆 Initializing 12 teams..."
curl -X POST http://localhost:8000/api/teams/initialize
echo ""

cd ..

# Start frontend
echo ""
echo "⚛️  Starting frontend server..."
echo "Frontend will open in your browser at http://localhost:3000"
cd frontend
npm start

echo ""
echo "=============================================="
echo "✅ GPL Auction is running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"
