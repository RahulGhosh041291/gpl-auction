# AWS Deployment Quick Checklist

Use this checklist to track your deployment progress.

## Phase 1: AWS Account Setup
- [ ] AWS account created
- [ ] Billing alerts configured (CRITICAL!)
- [ ] AWS CLI installed and configured
- [ ] IAM user created with necessary permissions
- [ ] Access keys downloaded and saved securely

## Phase 2: Database (RDS PostgreSQL)
- [ ] RDS instance created (db.t2.micro, PostgreSQL)
- [ ] Database name: `gpl_auction`
- [ ] Master username and password set
- [ ] Security group configured (port 5432)
- [ ] Database endpoint noted: `_______________________________`
- [ ] Connection tested from local machine
- [ ] Connection string ready: `postgresql://postgres:PASSWORD@ENDPOINT:5432/gpl_auction`

## Phase 3: Backend (EC2)
- [ ] EC2 instance launched (t2.micro, Ubuntu 22.04)
- [ ] Key pair downloaded: `gpl-auction-key.pem`
- [ ] Security group configured (ports 22, 80, 443, 8000)
- [ ] Elastic IP allocated and associated
- [ ] EC2 Public IP noted: `_______________________________`
- [ ] SSH connection successful
- [ ] System dependencies installed (Python 3.12, Nginx, etc.)
- [ ] Repository cloned via SSH
- [ ] Python virtual environment created
- [ ] Python packages installed from requirements.txt
- [ ] `.env` file configured with all variables
- [ ] Database tables created and initialized
- [ ] 12 teams initialized in database
- [ ] Backend tested locally (uvicorn)
- [ ] Systemd service created and enabled
- [ ] Nginx reverse proxy configured
- [ ] Backend accessible via: `http://YOUR_IP/api/teams/`
- [ ] WebSocket endpoint tested: `ws://YOUR_IP/api/auction/ws`

## Phase 4: File Storage (S3)
- [ ] S3 bucket created for uploads: `gpl-auction-uploads-______`
- [ ] Bucket policy configured (public read access)
- [ ] CORS configured for bucket
- [ ] Bucket name noted: `_______________________________`
- [ ] AWS credentials added to backend .env

## Phase 5: Frontend (S3 + CloudFront)
- [ ] S3 bucket created for frontend: `gpl-auction-frontend-______`
- [ ] Static website hosting enabled
- [ ] Bucket policy configured (public access)
- [ ] Frontend `.env.production` configured with backend URL
- [ ] Frontend built: `npm run build`
- [ ] Build uploaded to S3
- [ ] S3 website endpoint tested: `_______________________________`
- [ ] CloudFront distribution created
- [ ] CloudFront domain noted: `_______________________________`
- [ ] Error pages configured (403, 404 → index.html)
- [ ] CloudFront distribution deployed (15-20 min wait)
- [ ] Backend CORS updated with CloudFront URL
- [ ] Frontend accessible via: `https://_______.cloudfront.net`

## Phase 6: SSL/HTTPS (Optional)
- [ ] Custom domain purchased (if applicable)
- [ ] SSL certificate requested in Certificate Manager
- [ ] DNS validation completed
- [ ] CloudFront configured with custom domain
- [ ] Let's Encrypt certificate installed on EC2 (Certbot)
- [ ] HTTPS working for both frontend and backend

## Phase 7: Monitoring & Maintenance
- [ ] CloudWatch alarms set up (CPU, connections)
- [ ] CloudWatch Logs configured
- [ ] RDS automated backups enabled (7 days)
- [ ] Manual backup script created and tested
- [ ] Cron job for daily backups configured
- [ ] Deployment automation script created

## Testing Checklist
- [ ] Frontend loads successfully
- [ ] Login works (admin/admin123)
- [ ] Teams page shows 12 teams
- [ ] Players page loads
- [ ] Create new player works
- [ ] Edit player works
- [ ] Delete player works
- [ ] Player images upload and display
- [ ] Team logos upload and display
- [ ] Live Auction page loads
- [ ] Live Auction authentication works
- [ ] WebSocket connection established
- [ ] Bidding functionality works
- [ ] Excel export downloads successfully
- [ ] Registration page works
- [ ] CricHeroes integration works (if profile provided)
- [ ] Payment integration works (if configured)

## Security Checklist
- [ ] MFA enabled on AWS root account
- [ ] IAM user has minimum required permissions
- [ ] RDS security group restricted to EC2 IP only
- [ ] Strong database password set
- [ ] Backend SECRET_KEY is random and secure
- [ ] Environment variables not in Git repository
- [ ] SSH key stored securely
- [ ] CloudTrail enabled for audit logs
- [ ] Regular security updates scheduled
- [ ] SSL/TLS certificates configured

## Cost Monitoring
- [ ] Zero-spend budget alert configured
- [ ] Email alerts for any charges enabled
- [ ] Monthly cost review reminder set
- [ ] Free tier usage dashboard checked

## Documentation
- [ ] Backend URL documented: `_______________________________`
- [ ] Frontend URL documented: `_______________________________`
- [ ] Database endpoint documented: `_______________________________`
- [ ] S3 bucket names documented
- [ ] CloudFront distribution ID documented: `_______________________________`
- [ ] All passwords stored in secure password manager
- [ ] Team members notified of new URLs

## Final Verification
- [ ] All endpoints tested end-to-end
- [ ] Mobile responsiveness checked
- [ ] Browser compatibility verified (Chrome, Safari, Firefox)
- [ ] Performance acceptable (page load < 3s)
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] Database queries performing well
- [ ] WebSocket stable connection maintained

---

## Important URLs

| Resource | URL |
|----------|-----|
| Backend API | http://______________________/api/ |
| Frontend | https://______________________ |
| API Docs | http://______________________/docs |
| Database | ______________________.rds.amazonaws.com:5432 |
| S3 Frontend Bucket | s3://gpl-auction-frontend-______ |
| S3 Uploads Bucket | s3://gpl-auction-uploads-______ |
| CloudFront Distribution | ______________________.cloudfront.net |

---

## Quick Commands

### SSH to EC2
```bash
ssh -i ~/Downloads/gpl-auction-key.pem ubuntu@YOUR_IP
```

### Restart Backend
```bash
sudo systemctl restart gpl-auction
```

### View Logs
```bash
sudo journalctl -u gpl-auction -f
```

### Deploy Frontend
```bash
cd frontend
npm run build
aws s3 sync build/ s3://gpl-auction-frontend-YOUR-ID/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Update Backend Code
```bash
cd /home/ubuntu/gpl-auction
git pull
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart gpl-auction
```

### Database Backup
```bash
~/backup-db.sh
```

---

## Estimated Timeline

- Phase 1 (Account Setup): 30 minutes
- Phase 2 (Database): 20 minutes
- Phase 3 (Backend): 1-2 hours
- Phase 4 (S3 Storage): 15 minutes
- Phase 5 (Frontend): 30 minutes + 20 min CloudFront wait
- Phase 6 (SSL): 30 minutes (optional)
- Phase 7 (Monitoring): 30 minutes

**Total: 3-4 hours** (first time)  
**Future deployments: 5-10 minutes** (with automation script)

---

## Need Help?

1. Check AWS service health: https://status.aws.amazon.com/
2. Review CloudWatch logs for errors
3. Test API with curl before debugging frontend
4. Check security group rules if connectivity fails
5. Verify environment variables if unexpected behavior

---

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

Mark your progress and refer to AWS_DEPLOYMENT_GUIDE.md for detailed instructions!
