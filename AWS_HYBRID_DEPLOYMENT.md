# AWS Hybrid Deployment Guide - Frontend Only

## 🎯 Overview

This guide shows you how to migrate **only the frontend** from Netlify to AWS S3 + CloudFront, while keeping your backend on Render.

### Why This Hybrid Approach?

✅ **Best of Both Worlds:**
- AWS S3 + CloudFront for frontend (better performance, more bandwidth)
- Render for backend (zero maintenance, auto-deploy from Git)
- Render PostgreSQL for database (until it expires at day 90)

### What You Get

| Component | Service | Why |
|-----------|---------|-----|
| **Frontend** | AWS S3 + CloudFront | 10x more bandwidth (1TB vs 100GB), faster CDN |
| **Backend** | Render (Current) | Zero maintenance, auto Git deploy, no cold starts after upgrade |
| **Database** | Render (Current) | Managed, automatic backups, simple |

---

## 🏗️ Hybrid Architecture

```
┌─────────────────────────────────────┐
│           USERS                      │
└──────────────┬──────────────────────┘
               │
               │ HTTPS
               ▼
┌──────────────────────────────────────┐
│   CloudFront CDN (AWS)               │
│   + S3 Static Website (AWS)          │
│   - React Frontend                   │
└──────────────────────────────────────┘
               │
               │ HTTPS API Calls
               ▼
┌──────────────────────────────────────┐
│   Render Backend Service             │
│   - FastAPI Application              │
│   - WebSocket Support                │
│   - Auto-deploy from GitHub          │
└──────────────┬───────────────────────┘
               │
               │ PostgreSQL
               ▼
┌──────────────────────────────────────┐
│   Render PostgreSQL Database         │
│   - Managed Database                 │
│   - Automatic Backups                │
└──────────────────────────────────────┘
```

---

## 💰 Cost Comparison

### Current (Netlify + Render)

| Service | Cost |
|---------|------|
| Netlify (Frontend) | $0/month |
| Render Backend | $0/month |
| Render DB (Months 1-3) | $0/month |
| Render DB (Month 4+) | $7/month |
| **Total (First 3 months)** | **$0** |
| **Total (After month 4)** | **$7/month** |

### Hybrid (AWS S3 + CloudFront + Render)

| Service | Cost |
|---------|------|
| AWS S3 (Frontend) | $0/month (Free tier: 5GB storage) |
| AWS CloudFront | $0/month (Free tier: 1TB transfer) |
| Render Backend | $0/month |
| Render DB (Months 1-3) | $0/month |
| Render DB (Month 4+) | $7/month |
| **Total (First 12 months)** | **$0** |
| **Total (After month 4)** | **$7/month** |

**After 12 Months (AWS free tier expires):**
- S3: ~$0.50/month (for 2GB storage)
- CloudFront: ~$1-2/month (for 100GB transfer)
- **Total: ~$8.50-9.50/month** (vs $7 with Netlify)

---

## 🎯 Benefits of Hybrid Approach

### Why Move Frontend to AWS?

1. **More Bandwidth**
   - Netlify: 100GB/month
   - CloudFront: 1TB/month (10x more!)

2. **Better CDN**
   - CloudFront: 450+ edge locations worldwide
   - Faster loading for global users

3. **Learning AWS**
   - Gain AWS experience without complex backend setup
   - Portfolio/resume builder

4. **No Build Minutes Limit**
   - Netlify: 300 build minutes/month
   - AWS: Unlimited (you build locally)

### Why Keep Backend on Render?

1. **Zero Maintenance**
   - No server management
   - No security updates
   - No systemd services

2. **Auto-Deploy**
   - Push to GitHub → Automatic deployment
   - No manual upload steps

3. **Built-in Features**
   - Health checks
   - Zero-downtime deploys
   - Environment variables UI

4. **WebSocket Support**
   - Works out of the box
   - No Nginx configuration needed

5. **Simpler Stack**
   - Focus on AWS frontend hosting
   - Don't need to learn EC2/RDS yet

---

## 📋 Prerequisites

- [ ] AWS account (free tier)
- [ ] Current Render backend URL (e.g., `https://your-app.onrender.com`)
- [ ] Frontend code ready
- [ ] AWS CLI installed

---

## 🚀 Step-by-Step Migration

---

## Step 1: AWS Account Setup (15 minutes)

### 1.1: Create AWS Account

```
1. Go to https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Fill in email, password, account details
4. Add payment method (required, but won't be charged in free tier)
5. Complete phone verification
6. Choose "Basic Support Plan" (Free)
```

### 1.2: Set Up Billing Alerts (CRITICAL!)

```
1. AWS Console → Billing Dashboard
2. Click "Budgets" in left sidebar
3. Click "Create budget"
4. Choose "Zero spend budget" template
5. Enter your email for alerts
6. Create budget

⚠️ This alerts you if ANY charges occur!
```

### 1.3: Install AWS CLI

```bash
# macOS (you're on macOS)
brew install awscli

# Verify installation
aws --version

# Should show: aws-cli/2.x.x
```

### 1.4: Configure AWS CLI

```bash
# Run configuration
aws configure

# You'll be asked for:
# 1. AWS Access Key ID: (get from next step)
# 2. AWS Secret Access Key: (get from next step)
# 3. Default region: us-east-1
# 4. Default output format: json
```

### 1.5: Create IAM User & Get Access Keys

```
1. AWS Console → IAM → Users → Create user
2. User name: gpl-auction-frontend-deployer
3. Click "Next"
4. Permissions: Attach policies directly
   - AmazonS3FullAccess
   - CloudFrontFullAccess
5. Click "Next" → "Create user"

6. Click on the created user
7. Security credentials tab
8. Access keys → Create access key
9. Use case: Command Line Interface (CLI)
10. Check "I understand" → Next
11. Description: "Frontend deployment"
12. Create access key

13. ⚠️ IMPORTANT: Copy both:
    - Access key ID
    - Secret access key
    (You won't see the secret again!)

14. Download .csv file as backup

15. Now run: aws configure
    And paste these credentials
```

---

## Step 2: Create S3 Bucket for Frontend (10 minutes)

### 2.1: Create S3 Bucket

```bash
# Choose a unique bucket name
# Format: gpl-auction-frontend-[your-name-or-random]
# Example: gpl-auction-frontend-rahul-2025

# Set your bucket name as a variable
export BUCKET_NAME="gpl-auction-frontend-rahul-2025"

# Create bucket
aws s3 mb s3://$BUCKET_NAME --region us-east-1

# Should see: make_bucket: gpl-auction-frontend-rahul-2025
```

### 2.2: Enable Static Website Hosting

```bash
# Enable website hosting
aws s3 website s3://$BUCKET_NAME/ \
    --index-document index.html \
    --error-document index.html

# Note: error-document is index.html for React Router support
```

### 2.3: Configure Bucket Policy for Public Access

```bash
# Create policy file
cat > bucket-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::BUCKET_NAME/*"
        }
    ]
}
EOF

# Replace BUCKET_NAME in the policy
sed -i '' "s/BUCKET_NAME/$BUCKET_NAME/g" bucket-policy.json

# Apply the policy
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json

# Remove the policy file
rm bucket-policy.json
```

### 2.4: Disable Block Public Access

```bash
# Allow public access to the bucket
aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

### 2.5: Get S3 Website Endpoint

```bash
# Get the website URL
echo "S3 Website URL: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"

# Save this URL - you'll need it for CloudFront
```

---

## Step 3: Build and Upload Frontend (15 minutes)

### 3.1: Update Frontend Environment Variables

```bash
# Go to your frontend directory
cd /Users/rghosh/Desktop/personal/repos/gpl-auction/frontend

# Create production environment file
cat > .env.production << EOF
# Your Render backend URL (replace with your actual URL)
REACT_APP_API_URL=https://your-backend.onrender.com/api
REACT_APP_WS_URL=wss://your-backend.onrender.com/api/auction/ws
EOF

# ⚠️ IMPORTANT: Replace "your-backend" with your actual Render backend URL
# You can find it in your Render dashboard
```

**How to find your Render backend URL:**
```
1. Go to https://dashboard.render.com/
2. Click on your backend service
3. Copy the URL at the top (e.g., https://gpl-auction-backend-abc123.onrender.com)
4. Update .env.production with this URL
```

### 3.2: Build Frontend for Production

```bash
# Make sure you're in the frontend directory
cd /Users/rghosh/Desktop/personal/repos/gpl-auction/frontend

# Install dependencies (if not already)
npm install

# Build for production
npm run build

# This creates an optimized 'build' folder
# Should see: "The build folder is ready to be deployed"
```

### 3.3: Upload to S3

```bash
# Make sure BUCKET_NAME is still set
export BUCKET_NAME="gpl-auction-frontend-rahul-2025"

# Upload build folder to S3
aws s3 sync build/ s3://$BUCKET_NAME/ --delete

# --delete removes old files that don't exist locally

# You should see output like:
# upload: build/index.html to s3://...
# upload: build/static/css/main.xxx.css to s3://...
# upload: build/static/js/main.xxx.js to s3://...
```

### 3.4: Test S3 Website

```bash
# Get the S3 website URL
echo "Test your site at: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"

# Open in browser - your app should load!
# Try logging in to verify API connection to Render backend works
```

---

## Step 4: Set Up CloudFront CDN (20 minutes + 15-20 min wait)

### 4.1: Create CloudFront Distribution

```bash
# Create CloudFront configuration
cat > cloudfront-config.json << EOF
{
    "CallerReference": "gpl-auction-$(date +%s)",
    "Comment": "GPL Auction Frontend CDN",
    "Enabled": true,
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-Website",
                "DomainName": "$BUCKET_NAME.s3-website-us-east-1.amazonaws.com",
                "CustomOriginConfig": {
                    "HTTPPort": 80,
                    "HTTPSPort": 443,
                    "OriginProtocolPolicy": "http-only"
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-Website",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 7,
            "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"]
            }
        },
        "ForwardedValues": {
            "QueryString": true,
            "Cookies": {
                "Forward": "none"
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000,
        "Compress": true
    },
    "CustomErrorResponses": {
        "Quantity": 2,
        "Items": [
            {
                "ErrorCode": 403,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            },
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            }
        ]
    },
    "DefaultRootObject": "index.html"
}
EOF

# Create the distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json > cloudfront-output.json

# Get the CloudFront URL
CLOUDFRONT_URL=$(cat cloudfront-output.json | grep -o '"DomainName": "[^"]*' | grep -o '[^"]*$' | head -1)

echo "✅ CloudFront Distribution Created!"
echo "📍 CloudFront URL: https://$CLOUDFRONT_URL"
echo "⏱️  Deployment takes 15-20 minutes"
echo ""
echo "Distribution ID saved to cloudfront-output.json"

# Save CloudFront domain for later
echo $CLOUDFRONT_URL > cloudfront-domain.txt

# Clean up
rm cloudfront-config.json
```

### 4.2: Get Distribution ID (for future use)

```bash
# Extract Distribution ID
DIST_ID=$(cat cloudfront-output.json | grep -o '"Id": "[^"]*' | grep -o '[^"]*$' | head -1)

echo "Your CloudFront Distribution ID: $DIST_ID"
echo $DIST_ID > distribution-id.txt

# You'll need this for cache invalidation later
```

### 4.3: Wait for CloudFront Deployment

```bash
# Check deployment status
aws cloudfront get-distribution --id $DIST_ID --query 'Distribution.Status' --output text

# Status will be "InProgress" initially, then "Deployed"
# Takes 15-20 minutes

# You can check every few minutes:
watch -n 60 'aws cloudfront get-distribution --id $DIST_ID --query Distribution.Status --output text'

# Press Ctrl+C to stop checking
```

### 4.4: Test CloudFront URL

Once status shows "Deployed":

```bash
# Your CloudFront URL
echo "🎉 Your site is now live at: https://$CLOUDFRONT_URL"

# Open in browser and test:
# 1. Site loads over HTTPS ✅
# 2. Login works ✅
# 3. Teams page loads ✅
# 4. All features work ✅
```

---

## Step 5: Update Render Backend CORS (5 minutes)

Your backend needs to allow requests from the new CloudFront URL.

### 5.1: Update CORS in Render Dashboard

```
1. Go to https://dashboard.render.com/
2. Click on your backend service
3. Go to "Environment" tab
4. Find CORS_ORIGINS variable (or add if missing)
5. Update value to include CloudFront URL:

   ["http://localhost:3000","https://YOUR-CLOUDFRONT-ID.cloudfront.net"]

6. Click "Save Changes"
7. Render will automatically redeploy (takes 2-3 minutes)
```

**Or update via Git (recommended):**

```bash
# Go to your backend directory
cd /Users/rghosh/Desktop/personal/repos/gpl-auction/backend

# Edit main.py to update CORS origins
# Find the origins list and add your CloudFront URL
```

Let me create a script to do this:

```bash
# Read the CloudFront domain
CLOUDFRONT_URL=$(cat /Users/rghosh/Desktop/personal/repos/gpl-auction/frontend/cloudfront-domain.txt)

# Update backend CORS
cd /Users/rghosh/Desktop/personal/repos/gpl-auction/backend

# Create or update .env with CloudFront URL
# (Make sure to keep your other environment variables)

echo ""
echo "⚠️  Add this to your CORS_ORIGINS in backend/main.py or .env:"
echo "https://$CLOUDFRONT_URL"
```

### 5.2: Verify CORS Update

```bash
# After Render redeploys, test API call from browser console
# Open https://YOUR-CLOUDFRONT-ID.cloudfront.net
# Open browser console (F12)
# Run:

fetch('https://your-backend.onrender.com/api/teams/')
  .then(r => r.json())
  .then(d => console.log('CORS working:', d))
  .catch(e => console.error('CORS error:', e))

# Should see teams data, not CORS error
```

---

## Step 6: Create Deployment Script (10 minutes)

Create a script to deploy future frontend updates easily.

### 6.1: Create Deployment Script

```bash
cd /Users/rghosh/Desktop/personal/repos/gpl-auction/frontend

# Create deployment script
cat > deploy-to-aws.sh << 'EOF'
#!/bin/bash

echo "🚀 Deploying GPL Auction Frontend to AWS..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if bucket name file exists
if [ ! -f "bucket-name.txt" ]; then
    echo -e "${RED}❌ Error: bucket-name.txt not found${NC}"
    echo "Create it with: echo 'your-bucket-name' > bucket-name.txt"
    exit 1
fi

# Check if distribution ID file exists
if [ ! -f "distribution-id.txt" ]; then
    echo -e "${RED}❌ Error: distribution-id.txt not found${NC}"
    echo "Create it with: echo 'your-distribution-id' > distribution-id.txt"
    exit 1
fi

# Read configuration
BUCKET_NAME=$(cat bucket-name.txt)
DIST_ID=$(cat distribution-id.txt)

echo -e "${YELLOW}📦 Building React app...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${YELLOW}☁️  Uploading to S3...${NC}"
aws s3 sync build/ s3://$BUCKET_NAME/ --delete

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Upload failed${NC}"
    exit 1
fi

echo -e "${YELLOW}🔄 Invalidating CloudFront cache...${NC}"
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*" > /dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Cache invalidation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}🌐 Your site: https://$(cat cloudfront-domain.txt)${NC}"
echo ""
echo "Note: CloudFront cache invalidation takes 3-5 minutes to complete"
EOF

# Make script executable
chmod +x deploy-to-aws.sh
```

### 6.2: Save Configuration

```bash
# Save bucket name
echo $BUCKET_NAME > bucket-name.txt

# Save distribution ID (if not already saved)
echo $DIST_ID > distribution-id.txt

# Add to .gitignore to avoid committing
echo "cloudfront-output.json" >> .gitignore
echo "cloudfront-domain.txt" >> .gitignore
echo "bucket-name.txt" >> .gitignore
echo "distribution-id.txt" >> .gitignore
```

### 6.3: Test Deployment Script

```bash
# Run the deployment script
./deploy-to-aws.sh

# Should see:
# 🚀 Deploying GPL Auction Frontend to AWS...
# 📦 Building React app...
# ☁️  Uploading to S3...
# 🔄 Invalidating CloudFront cache...
# ✅ Deployment successful!
```

---

## Step 7: Update Documentation (5 minutes)

### 7.1: Update URLs in Your Docs

```bash
cd /Users/rghosh/Desktop/personal/repos/gpl-auction

# Create a note about the new frontend URL
cat > AWS_FRONTEND_INFO.md << EOF
# AWS Frontend Deployment Info

## Frontend URL
**Production:** https://$(cat frontend/cloudfront-domain.txt)

## S3 Bucket
**Name:** $BUCKET_NAME
**Region:** us-east-1
**Website:** http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com

## CloudFront Distribution
**Domain:** $(cat frontend/cloudfront-domain.txt)
**Distribution ID:** $(cat frontend/distribution-id.txt)

## Backend (Render)
**URL:** https://your-backend.onrender.com
**Status:** Active

## Deployment Commands

### Deploy Frontend Updates
\`\`\`bash
cd frontend
./deploy-to-aws.sh
\`\`\`

### Invalidate CloudFront Cache (if needed)
\`\`\`bash
aws cloudfront create-invalidation --distribution-id $(cat frontend/distribution-id.txt) --paths "/*"
\`\`\`

### Sync Files to S3
\`\`\`bash
cd frontend
npm run build
aws s3 sync build/ s3://$BUCKET_NAME/ --delete
\`\`\`

## Cost
- **Current:** \$0/month (Free tier)
- **After 12 months:** ~\$1-2/month (S3 + CloudFront)

## Monitoring
- CloudFront: https://console.aws.amazon.com/cloudfront/
- S3: https://s3.console.aws.amazon.com/s3/buckets/$BUCKET_NAME

---

**Last Updated:** $(date)
EOF

echo "✅ Documentation created: AWS_FRONTEND_INFO.md"
```

---

## 📊 Migration Checklist

- [ ] AWS account created
- [ ] Billing alerts configured
- [ ] AWS CLI installed and configured
- [ ] S3 bucket created: `$BUCKET_NAME`
- [ ] Static website hosting enabled
- [ ] Bucket policy configured (public access)
- [ ] Frontend built with production config
- [ ] Frontend uploaded to S3
- [ ] S3 website tested
- [ ] CloudFront distribution created
- [ ] CloudFront deployed (15-20 min wait)
- [ ] CloudFront URL tested
- [ ] Render backend CORS updated
- [ ] CORS tested (no errors)
- [ ] Deployment script created
- [ ] All features tested (login, teams, players, auction)
- [ ] Documentation updated

---

## 🎯 Testing Checklist

Visit your CloudFront URL and verify:

- [ ] Site loads over HTTPS ✅
- [ ] Login works (admin/admin123) ✅
- [ ] Teams page shows 12 teams ✅
- [ ] Players page loads ✅
- [ ] Can create/edit/delete players ✅
- [ ] Player images upload ✅
- [ ] Team logos upload ✅
- [ ] Live Auction page loads ✅
- [ ] WebSocket connects ✅
- [ ] Excel export works ✅
- [ ] Registration form works ✅
- [ ] No CORS errors in console ✅
- [ ] No 404 errors ✅
- [ ] React Router works (refresh on any page) ✅

---

## 🚀 Future Deployments

### To Deploy Frontend Updates:

```bash
cd /Users/rghosh/Desktop/personal/repos/gpl-auction/frontend

# Make your code changes

# Deploy
./deploy-to-aws.sh

# Done! CloudFront will serve new version in 3-5 minutes
```

### To Deploy Backend Updates:

```bash
# Commit and push to GitHub
git add .
git commit -m "Update backend"
git push

# Render automatically deploys!
# No manual steps needed ✅
```

---

## 💰 Cost Summary

### Month 1-3
- AWS S3: $0 (Free tier)
- AWS CloudFront: $0 (Free tier)
- Render Backend: $0
- Render Database: $0
- **Total: $0**

### Month 4-12
- AWS S3: $0 (Free tier)
- AWS CloudFront: $0 (Free tier)
- Render Backend: $0
- Render Database: $7/month
- **Total: $7/month**

### Month 13+ (After AWS free tier)
- AWS S3: ~$0.50/month
- AWS CloudFront: ~$1-2/month
- Render Backend: $0
- Render Database: $7/month
- **Total: ~$8.50-9.50/month**

---

## 🎉 Benefits Achieved

✅ **10x More Bandwidth:** 1TB vs 100GB
✅ **Faster CDN:** CloudFront 450+ edge locations
✅ **AWS Experience:** Learn cloud hosting
✅ **No Build Limits:** Unlimited builds (build locally)
✅ **Same Backend Simplicity:** Render auto-deploy still works
✅ **No Server Management:** No EC2, no RDS complexity
✅ **Zero Downtime:** CloudFront always available

---

## 🔧 Troubleshooting

### CloudFront shows old version
```bash
# Invalidate cache
cd frontend
aws cloudfront create-invalidation --distribution-id $(cat distribution-id.txt) --paths "/*"

# Wait 3-5 minutes, then refresh browser
```

### CORS errors in browser console
```bash
# Check Render backend CORS_ORIGINS includes CloudFront URL
# Update in Render dashboard → Environment variables
# Or update backend/main.py and push to GitHub
```

### S3 upload fails
```bash
# Check AWS credentials
aws sts get-caller-identity

# Should show your IAM user

# Reconfigure if needed
aws configure
```

### Build fails
```bash
# Check .env.production has correct backend URL
cat .env.production

# Should show your Render backend URL

# Clean and rebuild
rm -rf build node_modules
npm install
npm run build
```

---

## 📚 Quick Command Reference

```bash
# Deploy frontend
cd frontend && ./deploy-to-aws.sh

# Manual upload to S3
cd frontend
npm run build
aws s3 sync build/ s3://YOUR-BUCKET-NAME/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR-DIST-ID --paths "/*"

# Check CloudFront status
aws cloudfront get-distribution --id YOUR-DIST-ID --query 'Distribution.Status' --output text

# List S3 bucket contents
aws s3 ls s3://YOUR-BUCKET-NAME/

# Check AWS identity
aws sts get-caller-identity
```

---

## 🆘 Need Help?

1. **CloudFront not deploying:** Check status in AWS Console → CloudFront
2. **CORS errors:** Verify Render backend CORS includes CloudFront URL
3. **Old content showing:** Invalidate CloudFront cache
4. **Build errors:** Check .env.production has correct backend URL
5. **API calls failing:** Test backend URL directly (should work)

---

**Migration Complete!** 🎉

Your frontend is now served by AWS CloudFront with better performance and bandwidth, while your backend remains simple and maintainable on Render!

---

**Created:** October 2025  
**Version:** 1.0  
**For:** GPL Auction Hybrid Deployment  
**Architecture:** AWS S3 + CloudFront (Frontend) + Render (Backend + Database)
