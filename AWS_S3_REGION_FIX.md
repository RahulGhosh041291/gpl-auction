# Quick Fix: S3 Region Mismatch

## Problem
Your S3 bucket `gpl-auction-frontend-rahul-2025` was created in `ap-south-1` (Mumbai), but the guide assumes `us-east-1` (N. Virginia).

## Solution Options

### Option 1: Use Your Existing Bucket in ap-south-1 (Recommended - Faster)

```bash
# Set your bucket name
export BUCKET_NAME="gpl-auction-frontend-rahul-2025"
export AWS_REGION="ap-south-1"

# The bucket already exists, so skip to Step 2.2

# Enable static website hosting
aws s3 website s3://$BUCKET_NAME/ \
    --index-document index.html \
    --error-document index.html \
    --region $AWS_REGION

# Configure bucket policy
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

sed -i '' "s/BUCKET_NAME/$BUCKET_NAME/g" bucket-policy.json
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json --region $AWS_REGION
rm bucket-policy.json

# Disable block public access
aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --region $AWS_REGION \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Get the correct S3 website URL for ap-south-1
echo "✅ S3 Website URL: http://$BUCKET_NAME.s3-website.ap-south-1.amazonaws.com"

# Now proceed to Step 3: Build and upload frontend
cd /Users/rghosh/Desktop/personal/repos/gpl-auction/frontend

# Create production environment file (update with your Render backend URL)
cat > .env.production << EOF
REACT_APP_API_URL=https://your-backend.onrender.com/api
REACT_APP_WS_URL=wss://your-backend.onrender.com/api/auction/ws
EOF

# Build
npm run build

# Upload to S3
aws s3 sync build/ s3://$BUCKET_NAME/ --delete --region $AWS_REGION

# Test the website
echo "🌐 Test your site at: http://$BUCKET_NAME.s3-website.ap-south-1.amazonaws.com"
open "http://$BUCKET_NAME.s3-website.ap-south-1.amazonaws.com"
```

### Option 2: Delete and Recreate in us-east-1 (If you prefer)

```bash
# WARNING: This will delete your existing bucket!

# Delete the bucket in ap-south-1
export BUCKET_NAME="gpl-auction-frontend-rahul-2025"
aws s3 rb s3://$BUCKET_NAME --force --region ap-south-1

# Create new bucket in us-east-1
aws s3 mb s3://$BUCKET_NAME --region us-east-1

# Then follow the guide from Step 2.2 onwards
```

## CloudFront Configuration Update

When you create CloudFront in Step 4, use the **correct S3 website endpoint**:

For **ap-south-1** bucket:
```
DomainName: gpl-auction-frontend-rahul-2025.s3-website.ap-south-1.amazonaws.com
```

NOT:
```
DomainName: gpl-auction-frontend-rahul-2025.s3-website-us-east-1.amazonaws.com
```

## Updated CloudFront Creation Command (for ap-south-1)

```bash
cd /Users/rghosh/Desktop/personal/repos/gpl-auction/frontend

export BUCKET_NAME="gpl-auction-frontend-rahul-2025"
export AWS_REGION="ap-south-1"

# Create CloudFront configuration with correct region
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
                "DomainName": "$BUCKET_NAME.s3-website.$AWS_REGION.amazonaws.com",
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

# Save for later
echo $CLOUDFRONT_URL > cloudfront-domain.txt
echo $AWS_REGION > aws-region.txt

# Clean up
rm cloudfront-config.json
```

## Why ap-south-1 is Actually Good for You!

If you're in India, **ap-south-1 (Mumbai)** is actually **better** than us-east-1:

✅ **Faster uploads** from your location (lower latency)
✅ **Compliance** with data residency requirements (if any)
✅ **S3 pricing** is the same across regions for free tier

CloudFront will still cache globally, so users worldwide get fast access!

## Updated Deployment Script (Region-Aware)

```bash
cd /Users/rghosh/Desktop/personal/repos/gpl-auction/frontend

# Create region-aware deployment script
cat > deploy-to-aws.sh << 'EOF'
#!/bin/bash

echo "🚀 Deploying GPL Auction Frontend to AWS..."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if configuration files exist
if [ ! -f "bucket-name.txt" ]; then
    echo -e "${RED}❌ Error: bucket-name.txt not found${NC}"
    exit 1
fi

if [ ! -f "aws-region.txt" ]; then
    echo -e "${YELLOW}⚠️  aws-region.txt not found, defaulting to us-east-1${NC}"
    echo "us-east-1" > aws-region.txt
fi

BUCKET_NAME=$(cat bucket-name.txt)
AWS_REGION=$(cat aws-region.txt)

if [ -f "distribution-id.txt" ]; then
    DIST_ID=$(cat distribution-id.txt)
fi

echo -e "${YELLOW}📦 Building React app...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${YELLOW}☁️  Uploading to S3 (region: $AWS_REGION)...${NC}"
aws s3 sync build/ s3://$BUCKET_NAME/ --delete --region $AWS_REGION

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Upload failed${NC}"
    exit 1
fi

if [ -n "$DIST_ID" ]; then
    echo -e "${YELLOW}🔄 Invalidating CloudFront cache...${NC}"
    aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*" > /dev/null
fi

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}🌐 S3 Website: http://$BUCKET_NAME.s3-website.$AWS_REGION.amazonaws.com${NC}"

if [ -f "cloudfront-domain.txt" ]; then
    echo -e "${GREEN}🌐 CloudFront: https://$(cat cloudfront-domain.txt)${NC}"
fi

echo ""
echo "Note: CloudFront cache invalidation takes 3-5 minutes to complete"
EOF

chmod +x deploy-to-aws.sh

# Save configuration
echo "$BUCKET_NAME" > bucket-name.txt
echo "$AWS_REGION" > aws-region.txt

echo "✅ Region-aware deployment script created!"
```

## Next Steps

1. Run the **Option 1** commands above to configure your existing ap-south-1 bucket
2. Build and upload your frontend
3. Test the S3 website URL: http://gpl-auction-frontend-rahul-2025.s3-website.ap-south-1.amazonaws.com
4. Create CloudFront with the updated command (using ap-south-1 endpoint)
5. Continue with the rest of the guide

## Summary

- ✅ Your bucket is in `ap-south-1` (Mumbai)
- ✅ This is actually good if you're in India!
- ✅ Use the corrected commands above
- ✅ CloudFront will still work globally

The error occurred because the guide assumed `us-east-1`, but your bucket was created in a different region. The fix is simple - just use the correct regional endpoint!
