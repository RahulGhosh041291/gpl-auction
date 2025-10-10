#!/bin/bash

# Create CloudFront distribution for ap-south-1 S3 bucket
# This will provide HTTPS and better mobile network compatibility

BUCKET_NAME="gpl-auction-frontend-rahul-2025"
AWS_REGION="ap-south-1"
S3_WEBSITE_ENDPOINT="${BUCKET_NAME}.s3-website.${AWS_REGION}.amazonaws.com"

echo "Creating CloudFront distribution..."
echo "S3 Website Endpoint: $S3_WEBSITE_ENDPOINT"
echo ""

# Create CloudFront distribution
DISTRIBUTION_OUTPUT=$(aws cloudfront create-distribution \
  --origin-domain-name $S3_WEBSITE_ENDPOINT \
  --default-root-object index.html \
  --query 'Distribution.[Id,DomainName,Status]' \
  --output text \
  --distribution-config '{
    "CallerReference": "'$(date +%s)'",
    "Comment": "GPL Auction Frontend - ap-south-1",
    "Enabled": true,
    "Origins": {
      "Quantity": 1,
      "Items": [
        {
          "Id": "S3-'$BUCKET_NAME'",
          "DomainName": "'$S3_WEBSITE_ENDPOINT'",
          "CustomOriginConfig": {
            "HTTPPort": 80,
            "HTTPSPort": 443,
            "OriginProtocolPolicy": "http-only"
          }
        }
      ]
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-'$BUCKET_NAME'",
      "ViewerProtocolPolicy": "redirect-to-https",
      "AllowedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"],
        "CachedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"]
        }
      },
      "Compress": true,
      "ForwardedValues": {
        "QueryString": false,
        "Cookies": {
          "Forward": "none"
        }
      },
      "MinTTL": 0,
      "DefaultTTL": 86400,
      "MaxTTL": 31536000
    },
    "CustomErrorResponses": {
      "Quantity": 1,
      "Items": [
        {
          "ErrorCode": 404,
          "ResponsePagePath": "/index.html",
          "ResponseCode": "200",
          "ErrorCachingMinTTL": 300
        }
      ]
    },
    "PriceClass": "PriceClass_All"
  }')

if [ $? -eq 0 ]; then
  DISTRIBUTION_ID=$(echo "$DISTRIBUTION_OUTPUT" | awk '{print $1}')
  CLOUDFRONT_DOMAIN=$(echo "$DISTRIBUTION_OUTPUT" | awk '{print $2}')
  STATUS=$(echo "$DISTRIBUTION_OUTPUT" | awk '{print $3}')
  
  echo "✅ CloudFront distribution created successfully!"
  echo ""
  echo "Distribution ID: $DISTRIBUTION_ID"
  echo "CloudFront URL: https://$CLOUDFRONT_DOMAIN"
  echo "Status: $STATUS"
  echo ""
  echo "⏳ The distribution is now deploying to 450+ edge locations worldwide."
  echo "   This usually takes 15-20 minutes."
  echo ""
  echo "📱 Once deployed, you can access your site from both laptop and mobile at:"
  echo "   https://$CLOUDFRONT_DOMAIN"
  echo ""
  echo "You can check the deployment status with:"
  echo "   aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status'"
  echo ""
  
  # Save distribution info
  echo "$DISTRIBUTION_ID" > .cloudfront-distribution-id
  echo "$CLOUDFRONT_DOMAIN" > .cloudfront-domain
  
  echo "ℹ️  Distribution info saved to:"
  echo "   - .cloudfront-distribution-id"
  echo "   - .cloudfront-domain"
else
  echo "❌ Failed to create CloudFront distribution"
  exit 1
fi
