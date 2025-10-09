# AWS Free Tier Deployment Guide - GPL Auction

## 🎯 Overview

This guide provides step-by-step instructions to deploy the GPL Auction application on AWS using **Free Tier** eligible services.

### Application Architecture

**Frontend:** React.js (Static Files)  
**Backend:** FastAPI (Python)  
**Database:** PostgreSQL  
**WebSocket:** Real-time auction bidding  
**File Storage:** Player images, team logos

---

## 📋 AWS Free Tier Resources We'll Use

| Service | Free Tier | What We'll Use It For |
|---------|-----------|----------------------|
| **EC2** | 750 hours/month (t2.micro or t3.micro) | Backend FastAPI server |
| **RDS** | 750 hours/month (db.t2.micro, 20GB storage) | PostgreSQL database |
| **S3** | 5GB storage, 20,000 GET requests | Static frontend hosting + images |
| **CloudFront** | 1TB data transfer out, 10M requests | CDN for frontend |
| **Elastic IP** | 1 free if attached to running instance | Static IP for backend |
| **Route 53** | $0.50/month per hosted zone (NOT FREE) | DNS management (optional) |
| **Certificate Manager** | FREE | SSL/TLS certificates |

**Estimated Cost:** $0-2/month (only if using custom domain)

---

## 🏗️ Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               │ HTTPS                    │ HTTPS/WSS
               ▼                          ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   CloudFront (CDN)       │   │   Application Load       │
│   + S3 (Static Files)    │   │   Balancer (Optional)    │
│   - React Frontend       │   │   or Direct EC2 Access   │
└──────────────────────────┘   └────────┬─────────────────┘
                                        │
                                        │ HTTP
                                        ▼
                              ┌──────────────────────────┐
                              │   EC2 Instance           │
                              │   - FastAPI Backend      │
                              │   - Uvicorn Server       │
                              │   - Nginx (Reverse Proxy)│
                              └────────┬─────────────────┘
                                       │
                                       │ PostgreSQL
                                       ▼
                              ┌──────────────────────────┐
                              │   RDS PostgreSQL         │
                              │   - db.t2.micro          │
                              │   - 20GB Storage         │
                              └──────────────────────────┘
```

---

## 📝 Pre-Deployment Checklist

- [ ] AWS Account created (with credit card, but we'll stay in free tier)
- [ ] AWS CLI installed on your local machine
- [ ] Basic knowledge of SSH and terminal commands
- [ ] Your application code ready (✅ You already have this!)
- [ ] Environment variables documented (✅ Check your .env files)

---

## 🚀 STEP-BY-STEP DEPLOYMENT

---

## Phase 1: AWS Account & Initial Setup

### Step 1.1: Create AWS Account
1. Go to https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Fill in email, password, and account details
4. Add payment method (required but won't be charged if staying in free tier)
5. Complete phone verification
6. Choose "Basic Support Plan" (Free)

### Step 1.2: Set Up Billing Alerts (IMPORTANT!)
```
1. Go to AWS Console → Billing Dashboard
2. Click "Budgets" in left sidebar
3. Click "Create budget"
4. Choose "Zero spend budget" template
5. Enter your email for alerts
6. Create budget

This alerts you if ANY charges occur!
```

### Step 1.3: Install AWS CLI
```bash
# macOS (you're on macOS)
brew install awscli

# Verify installation
aws --version

# Configure AWS CLI
aws configure
# Enter:
#   - AWS Access Key ID: (get from IAM)
#   - AWS Secret Access Key: (get from IAM)
#   - Default region: us-east-1 (cheapest, has free tier)
#   - Default output format: json
```

### Step 1.4: Create IAM User (Security Best Practice)
```
1. AWS Console → IAM → Users → Add User
2. Username: gpl-auction-deployer
3. Access type: Programmatic access + AWS Management Console
4. Permissions: Attach existing policies
   - AmazonEC2FullAccess
   - AmazonS3FullAccess
   - AmazonRDSFullAccess
   - CloudFrontFullAccess
5. Download credentials CSV (SAVE THIS SAFELY!)
6. Use these credentials for aws configure
```

---

## Phase 2: Database Setup (RDS PostgreSQL)

### Step 2.1: Create RDS PostgreSQL Instance

```
1. AWS Console → RDS → Create database

2. Choose a database creation method:
   ☑ Standard create

3. Engine options:
   - Engine type: PostgreSQL
   - Version: PostgreSQL 15.x (latest in free tier)

4. Templates:
   ☑ Free tier (IMPORTANT!)

5. Settings:
   - DB instance identifier: gpl-auction-db
   - Master username: postgres
   - Master password: [Generate strong password]
   - Confirm password: [Same password]

6. DB instance class:
   - db.t3.micro (free tier eligible)

7. Storage:
   - Storage type: General Purpose (SSD)
   - Allocated storage: 20 GB (free tier max)
   - ☐ Enable storage autoscaling (to avoid charges)

8. Connectivity:
   - Virtual Private Cloud (VPC): Default VPC
   - Public access: Yes (for initial setup)
   - VPC security group: Create new
   - Security group name: gpl-auction-db-sg

9. Additional configuration:
   - Initial database name: gpl_auction
   - ☐ Enable automated backups (to save space)
   - ☐ Enable encryption (not needed for free tier)

10. Click "Create database"

⏱️ Takes 5-10 minutes to create
```

### Step 2.2: Configure Security Group

```
1. RDS → Databases → gpl-auction-db
2. Click on VPC security group
3. Inbound rules → Edit inbound rules
4. Add rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: 0.0.0.0/0 (temporarily, we'll restrict later)
   - Description: Temporary open access

5. Save rules

⚠️ We'll restrict this to only EC2 instance later
```

### Step 2.3: Get Database Connection Details

```
1. RDS → Databases → gpl-auction-db
2. Note down:
   - Endpoint: gpl-auction-db.xxxxxxxxx.us-east-1.rds.amazonaws.com
   - Port: 5432
   - Database name: gpl_auction
   - Master username: postgres
   - Password: [Your password]

3. Connection string format:
   postgresql://postgres:PASSWORD@ENDPOINT:5432/gpl_auction
```

### Step 2.4: Test Database Connection (Local)

```bash
# Install PostgreSQL client (if not already)
brew install postgresql

# Test connection
psql -h gpl-auction-db.xxxxxxxxx.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d gpl_auction \
     -p 5432

# If successful, you'll see:
# gpl_auction=>

# Exit
\q
```

---

## Phase 3: Backend Setup (EC2 Instance)

### Step 3.1: Launch EC2 Instance

```
1. AWS Console → EC2 → Launch Instance

2. Name and tags:
   - Name: gpl-auction-backend

3. Application and OS Images:
   - Quick Start: Ubuntu
   - AMI: Ubuntu Server 22.04 LTS
   - Architecture: 64-bit (x86)

4. Instance type:
   - t2.micro (free tier eligible)
   - 1 vCPU, 1 GB RAM

5. Key pair (login):
   - Click "Create new key pair"
   - Name: gpl-auction-key
   - Type: RSA
   - Format: .pem (for SSH)
   - Download and save: ~/Downloads/gpl-auction-key.pem

6. Network settings:
   - VPC: Default
   - Auto-assign public IP: Enable
   - Firewall (security group): Create new
   - Security group name: gpl-auction-backend-sg
   - Description: GPL Auction Backend Security Group
   
   - Inbound rules:
     ☑ SSH (port 22) from My IP
     ☑ HTTP (port 80) from Anywhere
     ☑ HTTPS (port 443) from Anywhere
     ☑ Custom TCP (port 8000) from Anywhere (FastAPI)

7. Configure storage:
   - Size: 8 GB (free tier max is 30GB, 8GB sufficient)
   - Volume type: gp2 (General Purpose SSD)

8. Advanced details:
   - Leave as default

9. Summary:
   - Number of instances: 1

10. Launch instance

⏱️ Takes 2-3 minutes to launch
```

### Step 3.2: Connect to EC2 Instance

```bash
# Set permissions on key file
chmod 400 ~/Downloads/gpl-auction-key.pem

# Get public IP from EC2 console
# Example: 54.123.45.67

# SSH into instance
ssh -i ~/Downloads/gpl-auction-key.pem ubuntu@54.123.45.67

# You should see Ubuntu welcome message
```

### Step 3.3: Allocate Elastic IP (Static IP)

```
1. EC2 → Elastic IPs → Allocate Elastic IP address
2. Click "Allocate"
3. Select the new IP → Actions → Associate Elastic IP address
4. Instance: gpl-auction-backend
5. Private IP: (auto-selected)
6. Associate

✅ Now your backend has a permanent IP address!
📝 Note this IP: e.g., 54.123.45.67
```

### Step 3.4: Install Dependencies on EC2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.12
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install python3.12 python3.12-venv python3.12-dev -y

# Install pip
sudo apt install python3-pip -y

# Install PostgreSQL client
sudo apt install postgresql-client -y

# Install Nginx
sudo apt install nginx -y

# Install Git
sudo apt install git -y

# Install system dependencies for Python packages
sudo apt install build-essential libssl-dev libffi-dev -y
sudo apt install libjpeg-dev zlib1g-dev -y
```

### Step 3.5: Clone Your Repository

```bash
# Generate SSH key for GitHub
ssh-keygen -t ed25519 -C "ec2-gpl-auction"
# Press enter for all prompts (default location, no passphrase)

# Display public key
cat ~/.ssh/id_ed25519.pub

# Copy this key and add to GitHub:
# GitHub → Settings → SSH and GPG keys → New SSH key

# Clone repository
cd /home/ubuntu
git clone git@github.com:RahulGhosh041291/gpl-auction.git
cd gpl-auction
```

### Step 3.6: Set Up Python Virtual Environment

```bash
cd /home/ubuntu/gpl-auction/backend

# Create virtual environment
python3.12 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import fastapi; print('FastAPI installed successfully')"
```

### Step 3.7: Configure Environment Variables

```bash
cd /home/ubuntu/gpl-auction/backend

# Create .env file
nano .env

# Add the following (replace with your actual values):
```

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@gpl-auction-db.xxxxxxxxx.us-east-1.rds.amazonaws.com:5432/gpl_auction

# Security
SECRET_KEY=generate-a-very-long-random-string-here-at-least-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Origins (add your CloudFront URL later)
CORS_ORIGINS=["http://localhost:3000","https://yourdomain.com"]

# Razorpay (if using payment integration)
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# AWS S3 (for file uploads - we'll set this up next)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=gpl-auction-uploads
AWS_REGION=us-east-1
```

```bash
# Save and exit: Ctrl+X, then Y, then Enter

# Generate SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Copy output and update SECRET_KEY in .env
```

### Step 3.8: Initialize Database

```bash
cd /home/ubuntu/gpl-auction/backend
source venv/bin/activate

# Test database connection
python -c "from database import engine; print('Database connected:', engine)"

# Run database initialization (creates tables)
python -c "from database import Base, engine; from models import *; Base.metadata.create_all(bind=engine); print('Tables created successfully')"

# Initialize teams (if you have initialization script)
# This will create the 12 teams
python -c "from routers.teams import initialize_teams; import asyncio; asyncio.run(initialize_teams())"
```

### Step 3.9: Test Backend Locally on EC2

```bash
cd /home/ubuntu/gpl-auction/backend
source venv/bin/activate

# Start server
uvicorn main:app --host 0.0.0.0 --port 8000

# In another terminal (from your Mac):
curl http://YOUR_EC2_ELASTIC_IP:8000/api/teams/

# Should return JSON with teams data
# Press Ctrl+C to stop server
```

### Step 3.10: Set Up Systemd Service (Production)

```bash
# Create systemd service file
sudo nano /etc/systemd/system/gpl-auction.service
```

```ini
[Unit]
Description=GPL Auction FastAPI Application
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/gpl-auction/backend
Environment="PATH=/home/ubuntu/gpl-auction/backend/venv/bin"
ExecStart=/home/ubuntu/gpl-auction/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Save and exit

# Reload systemd
sudo systemctl daemon-reload

# Enable service (start on boot)
sudo systemctl enable gpl-auction

# Start service
sudo systemctl start gpl-auction

# Check status
sudo systemctl status gpl-auction

# Should show "active (running)"
```

### Step 3.11: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/gpl-auction
```

```nginx
# WebSocket upgrade headers
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    server_name YOUR_EC2_ELASTIC_IP;  # Replace with your IP or domain

    # Increase max upload size for player images
    client_max_body_size 10M;

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket endpoint for live auction
    location /api/auction/ws {
        proxy_pass http://localhost:8000/api/auction/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # WebSocket timeout
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8000/health;
    }

    # API docs (optional, can remove in production)
    location /docs {
        proxy_pass http://localhost:8000/docs;
    }
}
```

```bash
# Save and exit

# Enable site
sudo ln -s /etc/nginx/sites-available/gpl-auction /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx on boot
sudo systemctl enable nginx
```

### Step 3.12: Test Backend API

```bash
# From your Mac:
curl http://YOUR_EC2_ELASTIC_IP/api/teams/

# Should return JSON with teams

# Test WebSocket (if you have wscat installed)
npm install -g wscat
wscat -c ws://YOUR_EC2_ELASTIC_IP/api/auction/ws
```

---

## Phase 4: File Storage Setup (S3)

### Step 4.1: Create S3 Bucket for Uploads

```
1. AWS Console → S3 → Create bucket

2. General configuration:
   - Bucket name: gpl-auction-uploads-[your-unique-id]
     (must be globally unique, e.g., gpl-auction-uploads-2025)
   - AWS Region: us-east-1

3. Object Ownership:
   ☑ ACLs disabled (recommended)

4. Block Public Access:
   ☐ Block all public access (we need images accessible)
   ☐ Block public access to buckets...
   ☐ Block public access to objects...
   ☑ I acknowledge...

5. Bucket Versioning:
   ○ Disable

6. Encryption:
   - Server-side encryption: Amazon S3-managed keys (SSE-S3)

7. Create bucket
```

### Step 4.2: Configure S3 Bucket Policy

```
1. S3 → gpl-auction-uploads-xxx → Permissions
2. Bucket policy → Edit
3. Add this policy:
```

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::gpl-auction-uploads-YOUR-ID/*"
        }
    ]
}
```

```
4. Save changes
```

### Step 4.3: Configure CORS for S3

```
1. S3 → gpl-auction-uploads-xxx → Permissions
2. Cross-origin resource sharing (CORS) → Edit
3. Add:
```

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"]
    }
]
```

```
4. Save changes
```

### Step 4.4: Update Backend to Use S3 (Optional Enhancement)

This is optional - you can continue storing images as base64 in database, or migrate to S3 for better performance.

```bash
# SSH to EC2
ssh -i ~/Downloads/gpl-auction-key.pem ubuntu@YOUR_EC2_IP

cd /home/ubuntu/gpl-auction/backend
source venv/bin/activate

# Install boto3 (AWS SDK)
pip install boto3

# Update requirements.txt
echo "boto3==1.34.0" >> requirements.txt
```

---

## Phase 5: Frontend Setup (S3 + CloudFront)

### Step 5.1: Create S3 Bucket for Frontend

```
1. S3 → Create bucket

2. Bucket name: gpl-auction-frontend-[unique-id]
3. Region: us-east-1
4. Block Public Access: Uncheck all (we need public website)
   ☑ I acknowledge...
5. Create bucket
```

### Step 5.2: Enable Static Website Hosting

```
1. S3 → gpl-auction-frontend-xxx
2. Properties tab → Static website hosting
3. Edit:
   - ☑ Enable
   - Hosting type: Host a static website
   - Index document: index.html
   - Error document: index.html (for React Router)
4. Save changes
5. Note the Bucket website endpoint (e.g., http://gpl-auction-frontend-xxx.s3-website-us-east-1.amazonaws.com)
```

### Step 5.3: Configure Bucket Policy for Public Access

```
1. Permissions → Bucket policy → Edit
2. Add:
```

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::gpl-auction-frontend-YOUR-ID/*"
        }
    ]
}
```

### Step 5.4: Build Frontend with Production Config

```bash
# On your Mac
cd /Users/rghosh/Desktop/personal/repos/gpl-auction/frontend

# Create production environment file
cat > .env.production << EOF
REACT_APP_API_URL=http://YOUR_EC2_ELASTIC_IP/api
REACT_APP_WS_URL=ws://YOUR_EC2_ELASTIC_IP/api/auction/ws
EOF

# Install dependencies (if not already)
npm install

# Build for production
npm run build

# This creates a 'build' folder with optimized static files
```

### Step 5.5: Upload Frontend to S3

```bash
# Install AWS CLI (if not already)
brew install awscli

# Configure AWS CLI (if not already)
aws configure

# Upload build folder to S3
aws s3 sync build/ s3://gpl-auction-frontend-YOUR-ID/ --delete

# Output should show files being uploaded:
# upload: build/index.html to s3://...
# upload: build/static/css/main.xxx.css to s3://...
# etc.
```

### Step 5.6: Test Static Website

```
Visit: http://gpl-auction-frontend-YOUR-ID.s3-website-us-east-1.amazonaws.com

Should see your React app!
```

### Step 5.7: Create CloudFront Distribution (CDN)

```
1. AWS Console → CloudFront → Create distribution

2. Origin:
   - Origin domain: Select your S3 website endpoint
     (NOT the S3 bucket, but the website endpoint)
   - Name: gpl-auction-frontend
   - Protocol: HTTP only

3. Default cache behavior:
   - Viewer protocol policy: Redirect HTTP to HTTPS
   - Allowed HTTP methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   - Cache policy: CachingOptimized

4. Settings:
   - Price class: Use all edge locations (best performance)
   - Alternate domain name: (leave empty for now, add custom domain later)
   - Custom SSL certificate: Default CloudFront certificate
   - Default root object: index.html

5. Create distribution

⏱️ Takes 15-20 minutes to deploy worldwide

6. Note the CloudFront domain name:
   Example: d1234abcd.cloudfront.net
```

### Step 5.8: Configure CloudFront for React Router

```
1. CloudFront → Your distribution → Error pages
2. Create custom error response:
   - HTTP error code: 403 Forbidden
   - Customize error response: Yes
   - Response page path: /index.html
   - HTTP response code: 200 OK
3. Create error response

4. Create another:
   - HTTP error code: 404 Not Found
   - Customize error response: Yes
   - Response page path: /index.html
   - HTTP response code: 200 OK
5. Create error response

This ensures React Router works with direct URLs
```

### Step 5.9: Update Backend CORS

```bash
# SSH to EC2
ssh -i ~/Downloads/gpl-auction-key.pem ubuntu@YOUR_EC2_IP

cd /home/ubuntu/gpl-auction/backend

# Edit .env file
nano .env

# Update CORS_ORIGINS to include CloudFront URL:
CORS_ORIGINS=["http://localhost:3000","https://d1234abcd.cloudfront.net","http://gpl-auction-frontend-xxx.s3-website-us-east-1.amazonaws.com"]

# Save and exit

# Restart backend
sudo systemctl restart gpl-auction
```

### Step 5.10: Test Complete Application

```
1. Visit: https://d1234abcd.cloudfront.net
2. Should see your GPL Auction app
3. Test login: admin / admin123
4. Check if API calls work (Teams, Players, etc.)
5. Test WebSocket (Live Auction page)
```

---

## Phase 6: SSL/HTTPS Setup (Optional but Recommended)

### Step 6.1: Get Free SSL Certificate (If Using Custom Domain)

```
1. AWS Console → Certificate Manager
2. Request certificate
3. Request a public certificate
4. Domain names: 
   - yourdomain.com
   - www.yourdomain.com
5. Validation method: DNS validation
6. Request certificate
7. Follow DNS validation instructions
```

### Step 6.2: Update CloudFront with SSL

```
1. CloudFront → Your distribution → Edit
2. Alternate domain names: yourdomain.com
3. Custom SSL certificate: Select your ACM certificate
4. Save changes
```

### Step 6.3: Set Up HTTPS for Backend (Let's Encrypt)

```bash
# SSH to EC2
ssh -i ~/Downloads/gpl-auction-key.pem ubuntu@YOUR_EC2_IP

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate (if you have a domain pointing to EC2)
sudo certbot --nginx -d api.yourdomain.com

# Follow prompts
# Certbot will automatically configure Nginx for HTTPS

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Phase 7: Monitoring & Maintenance

### Step 7.1: Set Up CloudWatch Alarms

```
1. EC2 → Select instance → Monitoring → Create alarm
2. Metric: CPUUtilization
3. Threshold: > 80% for 5 minutes
4. Notification: Send email

5. Create another alarm for RDS:
   - Metric: DatabaseConnections
   - Threshold: > 80% of max connections
```

### Step 7.2: Enable CloudWatch Logs

```bash
# SSH to EC2
ssh -i ~/Downloads/gpl-auction-key.pem ubuntu@YOUR_EC2_IP

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Configure log collection
sudo nano /opt/aws/amazon-cloudwatch-agent/etc/config.json
```

```json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/syslog",
            "log_group_name": "/aws/ec2/gpl-auction",
            "log_stream_name": "{instance_id}/syslog"
          }
        ]
      }
    }
  }
}
```

### Step 7.3: Automated Backups

```
RDS Automated Backups (Already configured with free tier):
- Retention: 7 days
- Backup window: Set to low-traffic hours

Manual Database Backup Script:
```

```bash
# Create backup script
nano ~/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="gpl_auction_backup_$DATE.sql"

# Dump database
pg_dump -h gpl-auction-db.xxx.rds.amazonaws.com \
        -U postgres \
        -d gpl_auction \
        > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://gpl-auction-uploads-xxx/backups/

# Remove local file
rm $BACKUP_FILE

echo "Backup completed: $BACKUP_FILE"
```

```bash
# Make executable
chmod +x ~/backup-db.sh

# Add to crontab (run daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /home/ubuntu/backup-db.sh
```

---

## 🎯 Deployment Automation Script

Save time with this automated deployment script:

```bash
# Create deployment script
nano ~/deploy-gpl-auction.sh
```

```bash
#!/bin/bash

echo "🚀 Deploying GPL Auction Application..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend deployment
echo -e "${YELLOW}📦 Updating backend...${NC}"
cd /home/ubuntu/gpl-auction
git pull origin main

cd backend
source venv/bin/activate
pip install -r requirements.txt

# Restart backend
echo -e "${YELLOW}🔄 Restarting backend service...${NC}"
sudo systemctl restart gpl-auction
sleep 5

# Check status
if sudo systemctl is-active --quiet gpl-auction; then
    echo -e "${GREEN}✅ Backend deployed successfully${NC}"
else
    echo "❌ Backend deployment failed"
    exit 1
fi

# Frontend deployment (run from your Mac)
echo -e "${YELLOW}📦 Build frontend on your Mac and run:${NC}"
echo "cd frontend"
echo "npm run build"
echo "aws s3 sync build/ s3://gpl-auction-frontend-YOUR-ID/ --delete"
echo "aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths '/*'"

echo -e "${GREEN}🎉 Deployment complete!${NC}"
```

```bash
# Make executable
chmod +x ~/deploy-gpl-auction.sh

# Use it:
~/deploy-gpl-auction.sh
```

---

## 📊 Cost Breakdown (Monthly)

| Service | Free Tier | Expected Usage | Cost |
|---------|-----------|----------------|------|
| EC2 t2.micro | 750 hours | 730 hours | **$0** |
| RDS db.t2.micro | 750 hours | 730 hours | **$0** |
| RDS Storage 20GB | 20GB | 10-15GB | **$0** |
| S3 Storage | 5GB | 1-2GB | **$0** |
| S3 Requests | 20K GET, 2K PUT | 10K | **$0** |
| CloudFront | 1TB transfer | 50GB | **$0** |
| Data Transfer | 15GB out | 10GB | **$0** |
| Elastic IP | 1 free | 1 | **$0** |
| **TOTAL** | | | **$0/month** |

**⚠️ Potential Charges:**
- Domain name: $12/year (optional)
- Route 53 hosted zone: $0.50/month (if using custom domain)
- Exceeding free tier limits

---

## 🛡️ Security Checklist

- [ ] Enable MFA on AWS root account
- [ ] Use IAM roles instead of access keys where possible
- [ ] Restrict RDS security group to only EC2 IP
- [ ] Set up AWS CloudTrail for audit logs
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] Strong passwords for database and admin accounts
- [ ] Enable AWS GuardDuty (free 30-day trial)
- [ ] Regular backup testing
- [ ] SSL/TLS certificates for production
- [ ] Environment variables never committed to Git

---

## 🔧 Troubleshooting

### Backend Not Starting
```bash
# Check logs
sudo journalctl -u gpl-auction -n 50

# Check if port 8000 is in use
sudo lsof -i :8000

# Check backend status
sudo systemctl status gpl-auction
```

### Database Connection Failed
```bash
# Test connection
psql -h YOUR_RDS_ENDPOINT -U postgres -d gpl_auction

# Check security group
# EC2 Console → Security Groups → RDS security group
# Ensure port 5432 is open from EC2 IP
```

### Frontend Not Loading
```bash
# Check S3 website hosting is enabled
# Check CloudFront distribution status
# Check browser console for CORS errors

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### WebSocket Not Working
```bash
# Check Nginx WebSocket configuration
sudo nginx -t

# Check backend logs
sudo journalctl -u gpl-auction -f

# Ensure WebSocket path is correct in frontend
```

---

## 📚 Additional Resources

- [AWS Free Tier Details](https://aws.amazon.com/free/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [FastAPI Deployment Best Practices](https://fastapi.tiangolo.com/deployment/)
- [React Production Build](https://create-react-app.dev/docs/production-build/)

---

## 🎯 Quick Command Reference

```bash
# SSH to EC2
ssh -i ~/Downloads/gpl-auction-key.pem ubuntu@YOUR_EC2_IP

# Check backend status
sudo systemctl status gpl-auction

# Restart backend
sudo systemctl restart gpl-auction

# View backend logs
sudo journalctl -u gpl-auction -f

# Deploy frontend (from Mac)
cd frontend
npm run build
aws s3 sync build/ s3://gpl-auction-frontend-YOUR-ID/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"

# Update backend code
cd /home/ubuntu/gpl-auction
git pull
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart gpl-auction

# Database backup
~/backup-db.sh

# Check disk space
df -h

# Check memory usage
free -h

# Monitor system resources
htop
```

---

## ✅ Post-Deployment Checklist

- [ ] Backend API accessible via HTTP
- [ ] Frontend loads from CloudFront
- [ ] Login works (admin/admin123)
- [ ] Teams page shows 12 teams
- [ ] Players CRUD operations work
- [ ] Live Auction WebSocket connects
- [ ] File uploads work (player images)
- [ ] Excel export downloads
- [ ] Database backup script tested
- [ ] Monitoring alarms configured
- [ ] Billing alerts set up
- [ ] Security groups properly configured
- [ ] SSL certificates installed (if using custom domain)
- [ ] Documentation updated with URLs

---

## 🆘 Support

If you encounter issues:
1. Check AWS service health dashboard
2. Review CloudWatch logs
3. Check security group rules
4. Verify environment variables
5. Test with curl/Postman first
6. Check browser console for frontend errors

---

**Created:** October 2025  
**Version:** 1.0  
**For:** GPL Auction Application  
**Target:** AWS Free Tier Deployment
