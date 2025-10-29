# 🏏 GPL Auction### 🏆 Team Management
- Create and manage 12 teams with ₹10 lakh budget each
- **Custom team logo upload** with preview
- Real-time budget tracking
- Team roster managementlaxia Premier League

A full-stack IPL-style cricket auction application with React.js frontend and FastAPI backend.

![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Frontend](https://img.shields.io/badge/Frontend-React-blue)
![Backend](https://img.shields.io/badge/Backend-FastAPI-green)

## ✨ Features

### 🔐 Authentication & Security
- Secure JWT-based authentication
- Role-based access control (Admin/Generic User)
- Protected routes for auction operations
- Password hashing with bcrypt

### � Team Management
- Create and manage 12 teams with ₹5 lakh budget each
- **Custom team logo upload** with preview
- Real-time budget tracking
- Team roster management

### 🎯 Player Management
- Add players with detailed profiles and photos
- 📊 **Cricheroes Integration** - Automatic stats fetching (v1.0.10)
- Player categories and base prices
- Availability status tracking

### 💰 Live Auction System
- **Authentication-required bidding** - Must login to place bids
- **Admin-only auction controls** - Start, reset, random player
- Real-time bidding with automatic highest bidder detection
- Team management with ₹10 lakh budget each
- Smart bid limits ensuring minimum 13 players per team
- Live auction with real-time updates via WebSocket
- Mark players as sold/unsold
- Budget validation

### 💳 Payment Integration
- 🏏 **Player Registration** - ₹500 registration fee
- **UPI Payments** - GPay, PhonePe, Paytm support
- Razorpay integration for secure payments
- Automatic payment verification

### 📊 Reports & Analytics
- Excel export functionality
- Team-wise player reports
- Bid history tracking

### 🎨 User Interface
- 📱 **Responsive Design** - Beautiful UI across all devices
- Smooth animations (Framer Motion)
- Modern, intuitive navigation

## Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.13)
- **ORM:** SQLAlchemy
- **Database:** SQLite (dev) / PostgreSQL (production)
- **Authentication:** JWT (python-jose) + bcrypt
- **Payments:** Razorpay (UPI, Card, NetBanking, Wallets)
- **Server:** Uvicorn
- **API Docs:** Swagger UI (built-in)
- **Integrations:** Cricheroes API (v1.0.10)

### Frontend
- **Framework:** React 18
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Animations:** Framer Motion
- **Icons:** React Icons
- **Styling:** CSS3 with modern features
- **Payments:** Razorpay Checkout (CDN)

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On macOS/Linux
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```bash
cp .env.example .env
```

5. Configure environment variables in `.env`:
- Add your Razorpay API keys (Key ID and Key Secret)
- Get keys from: https://dashboard.razorpay.com/app/keys
- Set SECRET_KEY for JWT
- Configure CORS origins

6. Initialize the database and teams:
```bash
# Run the server first
uvicorn main:app --reload

# In another terminal, initialize teams
curl -X POST http://localhost:8000/api/teams/initialize
```

7. Start the server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
- Set `REACT_APP_API_URL` to your backend URL
- Set `REACT_APP_WS_URL` for WebSocket connection
- Add Stripe publishable key

5. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## Usage Guide

### For Players

1. **Register**: Go to `/registration` and fill in your details
2. **Payment**: Complete the ₹500 registration fee via Stripe
3. **Profile**: View your profile at `/players/[id]`
4. **Wait**: Your profile is now available for auction

### For Auction Managers

1. **Start Auction**: Go to `/auction` and click "Start Auction"
2. **Bidding**: Select a team and place bids on players
3. **Mark Sold/Unsold**: Use controls to manage player status
4. **Monitor**: View real-time updates of all bids and team budgets

### Key Features

#### Smart Bid Limits
- Each team must maintain enough budget for minimum 13 players
- System calculates max bid limit: `remaining_budget - (12 - current_players) * 10000`
- Prevents teams from overbidding and failing to complete squad

#### Real-time Updates
- WebSocket connection for live auction updates
- Instant notifications of new bids
- Real-time team budget updates

#### Payment Integration
- Secure Stripe checkout for registration fees
- Automatic payment verification
- Player status update upon successful payment

## API Endpoints

### Teams
- `GET /api/teams/` - Get all teams
- `GET /api/teams/{id}` - Get team details
- `GET /api/teams/{id}/max-bid-limit` - Get team's max bid limit
- `POST /api/teams/initialize` - Initialize 12 teams

### Players
- `GET /api/players/` - Get all players (with filters)
- `GET /api/players/{id}` - Get player details
- `POST /api/players/` - Create player
- `PUT /api/players/{id}` - Update player

### Auction
- `GET /api/auction/current` - Get current auction
- `POST /api/auction/start` - Start auction
- `POST /api/auction/bid` - Place a bid
- `POST /api/auction/sold` - Mark player as sold
- `POST /api/auction/unsold` - Mark player as unsold
- `WS /api/auction/ws` - WebSocket connection

### Registration
- `POST /api/registration/register` - Register new player
- `GET /api/registration/check-email/{email}` - Check email availability
- `GET /api/registration/check-cricheroes/{id}` - Check Cricheroes data

### Payments
- `POST /api/payments/create-checkout-session` - Create Stripe checkout
- `GET /api/payments/verify/{session_id}` - Verify payment
- `POST /api/payments/webhook` - Stripe webhook handler

## Database Schema

### Tables
- **teams** - 12 teams with budgets and player counts
- **players** - Player profiles with stats and auction details
- **auctions** - Auction sessions
- **bids** - All bids placed during auctions
- **payments** - Payment records

## Environment Variables

### Backend (.env)
```
DATABASE_URL=sqlite:///./gpl_auction.db
SECRET_KEY=your-secret-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
CORS_ORIGINS=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WS_URL=ws://localhost:8000/api/auction/ws
REACT_APP_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

## 🚀 Production Deployment

### Quick Deploy (FREE Hosting)

**Recommended Stack:**
- **Frontend:** Netlify (FREE)
- **Backend:** Render (FREE)
- **Database:** Render PostgreSQL (FREE)

### 📖 Complete Deployment Guide

See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for detailed instructions including:
- Step-by-step Netlify deployment
- Render backend setup with PostgreSQL
- Environment configuration
- CORS setup
- Troubleshooting tips

### Quick Start

```bash
# 1. Run production checklist
./production_checklist.sh

# 2. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/gpl-auction.git
git push -u origin main

# 3. Deploy Frontend (Netlify)
# - Connect GitHub repo
# - Base directory: frontend
# - Build: npm run build
# - Publish: frontend/build

# 4. Deploy Backend (Render)
# - Connect GitHub repo
# - Root directory: backend
# - Build: pip install -r requirements.txt
# - Start: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 💰 Cost: $0.00 (100% FREE)
- ✅ Netlify: FREE forever
- ✅ Render: FREE tier (sleeps after 15min inactivity)
- ✅ PostgreSQL: 1GB storage FREE

📄 **Quick deployment summary:** [DEPLOY_NOW.md](./DEPLOY_NOW.md)

## License

MIT License - feel free to use for your cricket tournaments!

## Support

For issues or questions:
- Create an issue on GitHub
- Contact: support@gpl-auction.com

---

Built with ❤️ for cricket enthusiasts
