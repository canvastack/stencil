#!/bin/bash

# FTP Deployment Script untuk CanvaStencil Frontend
# Upload dist folder ke VPS DomaiNesia

echo "🚀 Starting FTP deployment..."

# Configuration
FTP_HOST="etchingxenial.com"
FTP_USER="your-ftp-username"
FTP_PASS="your-ftp-password"
REMOTE_PATH="/public_html"  # Adjust sesuai struktur hosting DomaiNesia
LOCAL_PATH="./dist"

# Check if dist exists
if [ ! -d "$LOCAL_PATH" ]; then
    echo "❌ Error: dist folder not found. Please run 'npm run build' first."
    exit 1
fi

echo "📦 Uploading files to $FTP_HOST..."

# Using lftp for better FTP upload
lftp -c "
set ftp:ssl-allow no;
open -u $FTP_USER,$FTP_PASS $FTP_HOST;
mirror --reverse --delete --verbose $LOCAL_PATH $REMOTE_PATH;
bye;
"

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Visit: https://$FTP_HOST"
else
    echo "❌ Deployment failed!"
    exit 1
fi
