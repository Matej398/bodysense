#!/bin/bash

# BodySense Deployment Script for Hostinger
# This script builds the app and deploys to Hostinger server

echo "🚀 Starting deployment..."

# Build the project
echo "📦 Building project..."
npm install
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed! dist folder not found."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Hostinger
# Replace with your actual deployment path
DEPLOY_PATH="/home/u123456789/domains/bodysense.codelabhaven.com/public_html"

echo "📤 Deploying to Hostinger..."
echo "Deploy path: $DEPLOY_PATH"

# Copy files to server (adjust based on your setup)
# Option 1: Using SCP (if you have SSH access)
# scp -r dist/* user@your-server:$DEPLOY_PATH

# Option 2: Using rsync (if you have SSH access)
# rsync -avz --delete dist/ user@your-server:$DEPLOY_PATH

# Option 3: Using FTP (if using FTP deployment)
# lftp -c "open -u USERNAME,PASSWORD ftp.your-server.com; mirror -R dist/ $DEPLOY_PATH"

echo "✅ Deployment complete!"

