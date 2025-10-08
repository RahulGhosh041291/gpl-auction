# 🚀 GPL Auction - Production Deployment Guide

Complete step-by-step guide to deploy your GPL Auction application to free hosting platforms.

---

## 📋 Table of Contents
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Option 1: Netlify (Frontend) + Render (Backend)](#option-1-netlify--render-recommended)
- [Option 2: Vercel (Frontend) + Railway (Backend)](#option-2-vercel--railway)
- [Database Migration (SQLite → PostgreSQL)](#database-migration)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Troubleshooting](#troubleshooting)

---

## ✅ Pre-Deployment Checklist

### 1. Clean Up Development Files

```bash
# Run the cleanup script
./cleanup_for_production.sh
```

### 2. Verify .gitignore

Ensure the following are in `.gitignore`:
- `node_modules/`
- `__pycache__/`
- `*.db`
- `.env`
- `keys`

### 3. Update CORS Settings

**File:** `backend/main.py`

```python
from fastapi.middleware.cors import CORSMiddleware

# Update origins to include your production domains
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "https://your-app-name.netlify.app",  # Add your Netlify domain
    "https://your-custom-domain.com",     # Add custom domain if any
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. Prepare Environment Variables

Create a `.env.example` file in `backend/`:

```env
DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=https://your-app-name.netlify.app
```

---

## 🎯 Option 1: Netlify + Render (Recommended)

### Frontend Deployment (Netlify)

**Netlify is completely FREE for personal projects**

#### Step 1: Prepare Frontend for Production

1. **Update API Base URL**

   **File:** `frontend/src/api.js` (create if doesn't exist)

   ```javascript
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
   
   export default API_BASE_URL;
   ```

2. **Update all Axios calls** to use this base URL:

   ```javascript
   import API_BASE_URL from './api';
   
   // Example in LiveAuction.js
   const response = await axios.get(`${API_BASE_URL}/api/players`);
   ```

3. **Create build configuration**

   **File:** `frontend/netlify.toml`

   ```toml
   [build]
     command = "npm run build"
     publish = "build"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   
   [build.environment]
     NODE_VERSION = "18"
   ```

#### Step 2: Deploy to Netlify

1. **Create GitHub Repository**

   ```bash
   git init
   git add .
   git commit -m "Initial commit - ready for deployment"
   git branch -M main
   git remote add origin https://github.com/yourusername/gpl-auction.git
   git push -u origin main
   ```

2. **Deploy via Netlify Dashboard**

   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Configure build settings:
     - **Base directory:** `frontend`
     - **Build command:** `npm run build`
     - **Publish directory:** `frontend/build`
   - Add environment variable:
     - Key: `REACT_APP_API_URL`
     - Value: (Leave blank for now, will update after backend deployment)
   - Click "Deploy site"

3. **Note your Netlify URL** (e.g., `https://your-app-name.netlify.app`)

---

### Backend Deployment (Render)

**Render offers FREE tier for backend hosting**

#### Step 1: Prepare Backend for Production

1. **Update requirements.txt**

   **File:** `backend/requirements.txt`

   Add PostgreSQL support:
   ```
   fastapi
   uvicorn[standard]
   sqlalchemy
   python-jose[cryptography]
   passlib[bcrypt]
   python-multipart
   pydantic
   psycopg2-binary
   python-dotenv
   ```

2. **Create startup script**

   **File:** `backend/start.sh`

   ```bash
   #!/bin/bash
   
   # Run database migrations
   python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine)"
   
   # Start the server
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

   Make it executable:
   ```bash
   chmod +x backend/start.sh
   ```

3. **Update database connection**

   **File:** `backend/database.py`

   ```python
   import os
   from sqlalchemy import create_engine
   from sqlalchemy.ext.declarative import declarative_base
   from sqlalchemy.orm import sessionmaker
   from dotenv import load_dotenv
   
   load_dotenv()
   
   # Use PostgreSQL in production, SQLite in development
   DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./gpl_auction.db")
   
   # Render provides DATABASE_URL with postgres://, but SQLAlchemy needs postgresql://
   if DATABASE_URL.startswith("postgres://"):
       DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
   
   engine = create_engine(
       DATABASE_URL,
       connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
   )
   
   SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
   Base = declarative_base()
   ```

#### Step 2: Deploy to Render

1. **Go to [render.com](https://render.com)** and sign up (free)

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** `gpl-auction-backend`
     - **Root Directory:** `backend`
     - **Environment:** `Python 3`
     - **Build Command:** `pip install -r requirements.txt`
     - **Start Command:** `./start.sh`
     - **Instance Type:** Free

3. **Add Environment Variables**
   - Click "Environment" tab
   - Add:
     - `SECRET_KEY`: Generate with `openssl rand -hex 32`
     - `CORS_ORIGINS`: Your Netlify URL (e.g., `https://your-app-name.netlify.app`)
     - `DATABASE_URL`: (Render will auto-generate when you add PostgreSQL)

4. **Add PostgreSQL Database**
   - In Render dashboard, click "New +" → "PostgreSQL"
   - Name: `gpl-auction-db`
   - Plan: Free
   - Click "Create Database"
   - Copy the "Internal Database URL"
   - Go back to your Web Service → Environment
   - Add `DATABASE_URL` with the Internal URL

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Note your backend URL (e.g., `https://gpl-auction-backend.onrender.com`)

#### Step 3: Update Frontend with Backend URL

1. Go to Netlify Dashboard
2. Site settings → Environment variables
3. Update `REACT_APP_API_URL` to your Render backend URL
4. Trigger redeploy

---

## 🎯 Option 2: Vercel + Railway

### Frontend Deployment (Vercel)

**Vercel is FREE for personal projects**

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Deploy

```bash
cd frontend
vercel
```

Follow prompts:
- Set up and deploy: Y
- Which scope: (your account)
- Link to existing project: N
- Project name: gpl-auction
- Directory: ./
- Override settings: N

#### Step 3: Add Environment Variable

```bash
vercel env add REACT_APP_API_URL
```

Enter your backend URL when prompted.

---

### Backend Deployment (Railway)

**Railway offers $5 free credit per month**

#### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

#### Step 2: Deploy

```bash
cd backend
railway login
railway init
railway up
```

#### Step 3: Add PostgreSQL

```bash
railway add --plugin postgresql
```

#### Step 4: Set Environment Variables

```bash
railway variables set SECRET_KEY=$(openssl rand -hex 32)
railway variables set CORS_ORIGINS=https://your-vercel-app.vercel.app
```

---

## 🗄️ Database Migration (SQLite → PostgreSQL)

### Option A: Fresh Database (Recommended)

1. Deploy backend with PostgreSQL
2. Tables will be created automatically
3. Login with admin credentials
4. Add teams, players manually or import via API

### Option B: Migrate Existing Data

1. **Export SQLite data**

   ```bash
   sqlite3 backend/gpl_auction.db .dump > backup.sql
   ```

2. **Convert to PostgreSQL format**

   - Remove SQLite-specific syntax
   - Update data types
   - Fix quotes

3. **Import to PostgreSQL**

   ```bash
   psql $DATABASE_URL < backup.sql
   ```

---

## ⚙️ Post-Deployment Configuration

### 1. Create Admin User

Visit: `https://your-backend-url.onrender.com/docs`

Use the Swagger UI to create an admin user:

```json
POST /api/users/register
{
  "username": "admin",
  "password": "your-secure-password",
  "role": "admin"
}
```

### 2. Test Authentication

1. Go to your frontend URL
2. Click "Login"
3. Login with admin credentials
4. Verify all features work

### 3. Add Teams and Players

Use the Teams and Players pages to add your auction data.

---

## 🔧 Troubleshooting

### CORS Errors

**Symptom:** "Access blocked by CORS policy"

**Fix:** 
1. Check `backend/main.py` origins list includes your frontend domain
2. Redeploy backend
3. Clear browser cache

### Database Connection Errors

**Symptom:** "Could not connect to database"

**Fix:**
1. Verify `DATABASE_URL` environment variable is set
2. Check PostgreSQL database is running (in Render/Railway dashboard)
3. Ensure `DATABASE_URL` uses `postgresql://` not `postgres://`

### 404 Errors on Page Refresh

**Symptom:** 404 when refreshing any page except home

**Fix:**
1. Add `netlify.toml` with redirects (see Netlify section above)
2. For Vercel, create `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Environment Variables Not Working

**Symptom:** App uses localhost URLs in production

**Fix:**
1. Ensure environment variables are prefixed with `REACT_APP_`
2. Rebuild the app after adding variables
3. Don't forget to restart/redeploy after changes

### Build Failures

**Symptom:** Deployment fails during build

**Fix:**
1. Check Node.js version (use 18.x)
2. Verify all dependencies are in `package.json`
3. Check build logs for specific errors
4. Test build locally: `npm run build`

---

## 💰 Cost Breakdown (FREE Tier Limits)

### Netlify (Frontend)
- ✅ **Cost:** FREE
- **Limits:** 100GB bandwidth/month, 300 build minutes/month
- **Custom Domain:** FREE
- **SSL Certificate:** FREE

### Render (Backend)
- ✅ **Cost:** FREE
- **Limits:** 750 hours/month, auto-sleeps after 15 min inactivity
- **Note:** First request after sleep takes ~30 seconds

### Railway (Alternative Backend)
- **Cost:** $5 free credit/month
- **Usage:** ~$5-10/month after credit
- **No Sleep:** Always active

### PostgreSQL
- **Render:** 1GB storage FREE
- **Railway:** 1GB storage FREE

---

## 🎉 Deployment Complete!

Your GPL Auction app is now live!

**Frontend URL:** `https://your-app-name.netlify.app`  
**Backend URL:** `https://gpl-auction-backend.onrender.com`

### Share with your team:
- Frontend URL for users to access
- Admin credentials (securely)
- User registration link

---

## 📚 Additional Resources

- [Netlify Documentation](https://docs.netlify.com)
- [Render Documentation](https://render.com/docs)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [React Production Build](https://create-react-app.dev/docs/production-build/)

---

## 🆘 Need Help?

If you encounter any issues:
1. Check the troubleshooting section above
2. Review deployment logs in Netlify/Render dashboard
3. Verify environment variables are set correctly
4. Test locally before deploying

**Good luck with your auction! 🎊**
