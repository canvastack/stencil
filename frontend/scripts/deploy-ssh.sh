#!/bin/bash

# SSH Deployment Script untuk CanvaStencil Frontend
# Upload & setup via SSH ke VPS DomaiNesia

echo "🚀 Starting SSH deployment..."

# Configuration
SSH_HOST="36.50.77.63"
SSH_USER="your-ssh-username"
REMOTE_PATH="/home/your-username/public_html/etchingxenial.com"
LOCAL_PATH="./dist"

# Check if dist exists
if [ ! -d "$LOCAL_PATH" ]; then
    echo "❌ Error: dist folder not found. Please run 'npm run build' first."
    exit 1
fi

echo "📦 Creating backup of existing files..."
ssh $SSH_USER@$SSH_HOST "cd $REMOTE_PATH && mkdir -p backups && tar -czf backups/backup-\$(date +%Y%m%d-%H%M%S).tar.gz * 2>/dev/null || echo 'No existing files to backup'"

echo "🗑️  Removing old files..."
ssh $SSH_USER@$SSH_HOST "cd $REMOTE_PATH && rm -rf * .htaccess"

echo "📤 Uploading new build files..."
rsync -avz --progress $LOCAL_PATH/ $SSH_USER@$SSH_HOST:$REMOTE_PATH/

echo "🔧 Setting correct permissions..."
ssh $SSH_USER@$SSH_HOST "cd $REMOTE_PATH && find . -type f -exec chmod 644 {} \; && find . -type d -exec chmod 755 {} \;"

echo "📝 Creating .htaccess for React Router..."
ssh $SSH_USER@$SSH_HOST "cat > $REMOTE_PATH/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
EOF
"

echo "✅ Deployment completed!"
echo "🌐 Frontend: https://etchingxenial.com"
echo "⏳ Wait for DNS propagation if domain is new (5-30 minutes)"
