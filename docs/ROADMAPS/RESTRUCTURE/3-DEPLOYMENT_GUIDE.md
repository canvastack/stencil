# DEPLOYMENT GUIDE
## Production Deployment to Web Hosting

**Version**: 1.0.0  
**Last Updated**: December 22, 2025  
**Estimated Time**: 4-6 hours  
**Difficulty**: 🔴 High  

---

## 🎯 **OBJECTIVE**

Deploy CanvaStencil platform ke production hosting dengan subdomain structure:
- **Frontend**: `etchingxenial.biz.id` (React build di `public_html/`)
- **Backend**: `api.etchingxenial.biz.id` (Laravel di subdomain)

---

## ⚠️ **PRE-DEPLOYMENT CHECKLIST**

### **1. Hosting Requirements**

- [ ] **Web Server**: Apache 2.4+ or Nginx 1.18+
- [ ] **PHP Version**: 8.1+ (recommended 8.2)
- [ ] **Database**: PostgreSQL 13+ or MySQL 8.0+
- [ ] **SSL Certificate**: Valid HTTPS certificate (Let's Encrypt recommended)
- [ ] **Storage**: Minimum 2GB available
- [ ] **Memory**: PHP memory_limit >= 256MB
- [ ] **Execution Time**: max_execution_time >= 300
- [ ] **File Upload**: post_max_size >= 100MB, upload_max_filesize >= 100MB

### **2. PHP Extensions Required**

```bash
# Check installed extensions
php -m

# Required extensions:
- pdo_pgsql (or pdo_mysql)
- pgsql (or mysqli)
- mbstring
- xml
- json
- curl
- zip
- gd
- fileinfo
- openssl
- tokenizer
- bcmath
```

### **3. Access Credentials**

- [ ] cPanel/Hosting panel login
- [ ] FTP/SFTP credentials
- [ ] Database credentials
- [ ] SSH access (optional, recommended)
- [ ] Domain DNS management access

### **4. Backup Verification**

- [ ] Local project backup created
- [ ] Database export prepared
- [ ] `.env` files documented
- [ ] Git repository up to date
- [ ] Rollback plan documented

---

## 🌐 **SECTION 1: HOSTING SETUP**

### **Step 1.1: Create Subdomain (cPanel)**

**Via cPanel:**

1. Login to cPanel
2. Navigate to **Domains** → **Subdomains**
3. Create subdomain:
   - **Subdomain**: `api`
   - **Domain**: `etchingxenial.biz.id`
   - **Document Root**: `/home/username/api.etchingxenial.biz.id/public`
   
   ⚠️ **IMPORTANT**: Document root MUST point to Laravel's `/public` folder

4. Click **Create**

**Expected Result:**
```
Subdomain: api.etchingxenial.biz.id
Document Root: /home/username/api.etchingxenial.biz.id/public
```

### **Step 1.2: SSL Certificate Setup**

**Using Let's Encrypt (Free):**

1. Navigate to **Security** → **SSL/TLS Status**
2. Select domains:
   - `etchingxenial.biz.id`
   - `www.etchingxenial.biz.id`
   - `api.etchingxenial.biz.id`
3. Click **Run AutoSSL**

**Verify SSL:**
```bash
# Check SSL certificate
curl -I https://api.etchingxenial.biz.id
# Should return HTTP/2 200 (not HTTP/1.1)

curl -I https://etchingxenial.biz.id
# Should return HTTP/2 200
```

### **Step 1.3: Database Setup**

**Via cPanel:**

1. Navigate to **Databases** → **PostgreSQL Databases** (or MySQL)
2. Create new database:
   - **Database Name**: `stencil_production`
   - **Collation**: `utf8mb4_unicode_ci` (MySQL) or `en_US.UTF-8` (PostgreSQL)

3. Create database user:
   - **Username**: `stencil_user`
   - **Password**: Generate strong password (save it!)

4. Add user to database with **ALL PRIVILEGES**

5. **Note credentials:**
```
Database: username_stencil_production
Username: username_stencil_user
Password: [generated_password]
Host: localhost
Port: 5432 (PostgreSQL) or 3306 (MySQL)
```

---

## 🔧 **SECTION 2: BACKEND DEPLOYMENT**

### **Step 2.1: Upload Laravel Files**

**Method A: FTP/SFTP (Recommended for First Deploy)**

Using FileZilla or similar:

1. Connect to hosting via SFTP
2. Navigate to `/home/username/`
3. Create folder: `api.etchingxenial.biz.id`
4. Upload **entire backend folder** EXCEPT:
   - `vendor/` (will reinstall)
   - `node_modules/` (not needed)
   - `storage/logs/*.log`
   - `.env` (will create new)

**Method B: Git (Recommended for Updates)**

```bash
# SSH into server
ssh username@etchingxenial.biz.id

# Clone repository
cd /home/username
git clone https://github.com/your-repo/stencil.git api.etchingxenial.biz.id

# Or pull updates
cd api.etchingxenial.biz.id
git pull origin main
```

**Expected Structure:**
```
/home/username/api.etchingxenial.biz.id/
├── app/
├── bootstrap/
├── config/
├── database/
├── public/          # ← Document root
│   └── index.php
├── routes/
├── storage/
├── artisan
├── composer.json
└── ...
```

### **Step 2.2: Set File Permissions**

```bash
# SSH into server
cd /home/username/api.etchingxenial.biz.id

# Set storage permissions
chmod -R 775 storage
chmod -R 775 bootstrap/cache

# Set ownership (replace 'username' with your hosting username)
chown -R username:username storage
chown -R username:username bootstrap/cache

# Verify
ls -la storage
ls -la bootstrap/cache
```

### **Step 2.3: Install Dependencies**

```bash
cd /home/username/api.etchingxenial.biz.id

# Install Composer dependencies (production only)
composer install --optimize-autoloader --no-dev

# If composer not found, use PHP directly
php /usr/local/bin/composer install --optimize-autoloader --no-dev
```

**Expected Output:**
```
Loading composer repositories with package information
Installing dependencies from lock file
...
Generating optimized autoload files
```

### **Step 2.4: Create Production .env File**

```bash
cd /home/username/api.etchingxenial.biz.id

# Copy example
cp .env.example .env

# Edit with nano or via File Manager
nano .env
```

**Production .env Content:**

```env
APP_NAME="CanvaStencil"
APP_ENV=production
APP_KEY=  # Will generate in next step
APP_DEBUG=false  # CRITICAL: false in production
APP_URL=https://api.etchingxenial.biz.id

# Frontend
FRONTEND_URL=https://etchingxenial.biz.id

# Database (Use credentials from Step 1.3)
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=username_stencil_production
DB_USERNAME=username_stencil_user
DB_PASSWORD=your_generated_password

# Session & Cookie
SESSION_DRIVER=redis  # or 'file' if redis not available
SESSION_LIFETIME=120
SESSION_DOMAIN=.etchingxenial.biz.id  # Note: Dot prefix!
SESSION_SECURE_COOKIE=true  # HTTPS required
SESSION_SAME_SITE=none

# Redis (if available)
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Sanctum
SANCTUM_STATEFUL_DOMAINS=etchingxenial.biz.id,www.etchingxenial.biz.id,api.etchingxenial.biz.id

# CORS
CORS_ALLOWED_ORIGINS=https://etchingxenial.biz.id,https://www.etchingxenial.biz.id
CORS_SUPPORTS_CREDENTIALS=true

# Cache & Queue
CACHE_DRIVER=file  # or 'redis' if available
QUEUE_CONNECTION=database  # or 'redis' if available

# Mail (Production SMTP)
MAIL_MAILER=smtp
MAIL_HOST=smtp.your-provider.com
MAIL_PORT=587
MAIL_USERNAME=noreply@etchingxenial.biz.id
MAIL_PASSWORD=your_smtp_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@etchingxenial.biz.id"
MAIL_FROM_NAME="${APP_NAME}"

# Logging
LOG_CHANNEL=daily
LOG_LEVEL=error  # Only errors in production
```

### **Step 2.5: Generate Application Key**

```bash
cd /home/username/api.etchingxenial.biz.id

php artisan key:generate

# Output: Application key set successfully.
```

**Verify `.env` has `APP_KEY`:**
```bash
grep APP_KEY .env
# Should show: APP_KEY=base64:...
```

### **Step 2.6: Run Migrations & Seeders**

```bash
cd /home/username/api.etchingxenial.biz.id

# Run migrations
php artisan migrate --force

# Run seeders (if needed)
php artisan db:seed --force

# Or specific seeder
php artisan db:seed --class=ProductSeeder --force
```

⚠️ **CAUTION**: This will create/modify database tables. Ensure database backup exists!

### **Step 2.7: Optimize Laravel**

```bash
cd /home/username/api.etchingxenial.biz.id

# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Generate optimized caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Optimize autoloader
composer dump-autoload --optimize
```

### **Step 2.8: Configure .htaccess in public/**

**File: `/home/username/api.etchingxenial.biz.id/public/.htaccess`**

```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Force HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
    # CORS Headers (backup - Laravel handles this)
    Header set Access-Control-Allow-Origin "https://etchingxenial.biz.id"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, X-CSRF-TOKEN"
    Header set Access-Control-Allow-Credentials "true"
    
    # Security Headers
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "DENY"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
    Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"
    
    # HSTS (Strict Transport Security)
    Header set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
</IfModule>

# Disable Directory Listing
Options -Indexes

# Prevent access to .env and other sensitive files
<FilesMatch "^\.env">
    Order allow,deny
    Deny from all
</FilesMatch>

# Block access to specific directories
RedirectMatch 403 ^/\.git
RedirectMatch 403 ^/storage/
RedirectMatch 403 ^/vendor/
```

### **Step 2.9: Verify Backend Deployment**

**Test API Endpoints:**

```bash
# Health check
curl https://api.etchingxenial.biz.id/api/v1/health

# Expected: {"status":"ok","timestamp":"..."}

# CSRF Cookie
curl -I https://api.etchingxenial.biz.id/sanctum/csrf-cookie

# Expected: HTTP/2 204, Set-Cookie headers
```

**Browser Test:**
1. Navigate to: `https://api.etchingxenial.biz.id`
2. Should show Laravel default page or blank page (not 500 error)

---

## 🎨 **SECTION 3: FRONTEND DEPLOYMENT**

### **Step 3.1: Build Frontend**

**On Local Machine:**

```bash
cd frontend

# Ensure production .env is configured
# Copy .env.production to .env
copy .env.production .env

# Build for production
npm run build

# Output should be in: dist/
```

**Verify Build:**
```bash
# Check dist/ folder
ls dist/

# Should contain:
# - index.html
# - assets/
#   - index-[hash].js
#   - index-[hash].css
#   - vendor-[hash].js
```

### **Step 3.2: Upload Frontend Build**

**Via FTP/SFTP:**

1. Connect to hosting
2. Navigate to `/home/username/public_html/`
3. **IMPORTANT**: Backup existing files (if any)
4. Upload **contents of `dist/` folder** (NOT the dist/ folder itself)
5. Structure should be:

```
/home/username/public_html/
├── assets/
│   ├── index-abc123.js
│   ├── index-def456.css
│   ├── vendor-xyz789.js
│   └── ...images, fonts, etc.
├── index.html
├── favicon.ico
├── robots.txt
├── .htaccess  # ← Will create next
└── ...
```

### **Step 3.3: Configure .htaccess for SPA**

**File: `/home/username/public_html/.htaccess`**

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Force HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    
    # Redirect www to non-www (optional)
    RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
    RewriteRule ^(.*)$ https://%1/$1 [R=301,L]
    
    # Handle React Router SPA routing
    # Serve existing files/directories as-is
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    
    # All other requests go to index.html
    RewriteRule ^ index.html [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
    # Security headers for frontend
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Content Security Policy (adjust as needed)
    Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.etchingxenial.biz.id;"
    
    # HSTS
    Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>

# Gzip Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE text/javascript
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/json
    AddOutputFilterByType DEFLATE application/xml
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
    ExpiresActive On
    
    # HTML (no cache - for SPA updates)
    ExpiresByType text/html "access plus 0 seconds"
    
    # CSS & JavaScript (1 year - files have hash in name)
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    
    # Images
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"
    
    # Fonts
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType application/font-woff "access plus 1 year"
    ExpiresByType application/font-woff2 "access plus 1 year"
</IfModule>

# Disable Directory Listing
Options -Indexes

# Prevent access to sensitive files
<FilesMatch "(^\.htaccess|^\.env|\.log$|\.sql$|\.git)">
    Order allow,deny
    Deny from all
</FilesMatch>
```

### **Step 3.4: Create robots.txt**

**File: `/home/username/public_html/robots.txt`**

```txt
User-agent: *
Allow: /

# Sitemaps
Sitemap: https://etchingxenial.biz.id/sitemap.xml

# Disallow admin areas
Disallow: /admin
Disallow: /platform
Disallow: /login
```

### **Step 3.5: Verify Frontend Deployment**

**Browser Tests:**

1. Navigate to: `https://etchingxenial.biz.id`
   - Should load homepage
   - No console errors
   - Assets load correctly

2. Test routes:
   - `https://etchingxenial.biz.id/products`
   - `https://etchingxenial.biz.id/about`
   - `https://etchingxenial.biz.id/admin`

3. Test page refresh:
   - Navigate to `/products`
   - Press F5 (refresh)
   - Should stay on `/products` (not 404)

4. Check console (F12):
   - No 404 errors for assets
   - No CORS errors
   - API calls going to correct domain

---

## 🔗 **SECTION 4: INTEGRATION TESTING**

### **Step 4.1: Test API Connection**

**Browser Console at `https://etchingxenial.biz.id`:**

```javascript
// Test CSRF cookie
fetch('https://api.etchingxenial.biz.id/sanctum/csrf-cookie', {
  credentials: 'include'
})
  .then(r => console.log('CSRF OK', r.status))
  .catch(e => console.error('CSRF Error', e))

// Test Health endpoint
fetch('https://api.etchingxenial.biz.id/api/v1/health')
  .then(r => r.json())
  .then(data => console.log('Health OK', data))
  .catch(e => console.error('Health Error', e))
```

**Expected**: No errors, successful responses.

### **Step 4.2: Test Authentication**

1. Navigate to: `https://etchingxenial.biz.id/login`
2. Try Platform Admin login:
   - Email: `admin@canvastencil.com`
   - Password: [your password]
3. Check Network tab:
   - CSRF request successful
   - Login request successful
   - Token received
   - Redirect to dashboard

### **Step 4.3: Test Tenant Context**

1. Login as Tenant User
2. Navigate to tenant pages:
   - `https://etchingxenial.biz.id/admin/products`
   - `https://etchingxenial.biz.id/admin/orders`
3. Verify:
   - Data loads correctly
   - API calls successful
   - No CORS errors
   - Session persists after refresh

---

## 🔒 **SECTION 5: SECURITY HARDENING**

### **Step 5.1: Hide Sensitive Information**

```bash
# Backend: Prevent .env access
cd /home/username/api.etchingxenial.biz.id/public

# Verify .htaccess blocks .env
curl https://api.etchingxenial.biz.id/.env
# Should return 403 Forbidden
```

### **Step 5.2: Disable Error Display**

**Backend `.env`:**
```env
APP_DEBUG=false  # Must be false!
LOG_LEVEL=error  # Only log errors
```

**Verify:**
```bash
# Cause an error (invalid route)
curl https://api.etchingxenial.biz.id/api/v1/nonexistent

# Should return generic error, NOT stack trace
```

### **Step 5.3: Configure Firewall (if available)**

**cPanel Security:**
1. **ModSecurity**: Enable (default rules)
2. **Hotlink Protection**: Enable for assets
3. **IP Blocker**: Block suspicious IPs
4. **SSL/TLS**: Force HTTPS

### **Step 5.4: Rate Limiting**

**Backend: Verify throttle middleware active**

```php
// routes/api.php should have:
Route::middleware(['throttle:api'])->group(function () {
    // API routes
});
```

**Test:**
```bash
# Make 100 requests quickly
for i in {1..100}; do
  curl https://api.etchingxenial.biz.id/api/v1/health
done

# Should see "429 Too Many Requests" after limit
```

---

## 📊 **SECTION 6: MONITORING & OPTIMIZATION**

### **Step 6.1: Enable Laravel Logging**

**Backend `.env`:**
```env
LOG_CHANNEL=daily
LOG_LEVEL=error
```

**Check logs:**
```bash
cd /home/username/api.etchingxenial.biz.id/storage/logs
tail -f laravel.log
```

### **Step 6.2: Database Performance**

**Check slow queries (PostgreSQL):**
```sql
-- Enable slow query log
ALTER SYSTEM SET log_min_duration_statement = '1000'; -- Log queries > 1s

-- View slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### **Step 6.3: Frontend Performance**

**Test with Lighthouse:**
```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://etchingxenial.biz.id --output html --output-path ./report.html
```

**Target Scores:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

---

## ✅ **POST-DEPLOYMENT CHECKLIST**

### **Backend Verification**

- [ ] API accessible via HTTPS: `https://api.etchingxenial.biz.id`
- [ ] SSL certificate valid (no warnings)
- [ ] Health endpoint working
- [ ] CSRF cookie endpoint working
- [ ] Database connection successful
- [ ] Migrations completed
- [ ] Seeders executed
- [ ] No 500 errors in logs
- [ ] `.env` has `APP_DEBUG=false`
- [ ] File permissions correct (775 for storage)
- [ ] Caches optimized (config, route, view cached)

### **Frontend Verification**

- [ ] Website accessible via HTTPS: `https://etchingxenial.biz.id`
- [ ] SSL certificate valid
- [ ] Homepage loads correctly
- [ ] All routes accessible
- [ ] Page refresh doesn't cause 404
- [ ] Assets load correctly (no 404)
- [ ] Images display correctly
- [ ] Dark mode toggle works
- [ ] Responsive on mobile
- [ ] Console has no errors

### **Integration Verification**

- [ ] API calls from frontend successful
- [ ] CORS working (no errors)
- [ ] Authentication flows working (Platform & Tenant)
- [ ] Sessions persist after refresh
- [ ] Cookies set correctly
- [ ] Data loads from real backend (no mock data)
- [ ] File uploads working
- [ ] Email notifications working (if configured)

### **Performance Verification**

- [ ] Lighthouse score > 90 (all metrics)
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] API response time < 500ms
- [ ] Database query time < 100ms avg

### **Security Verification**

- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] `.env` file not accessible
- [ ] Error messages don't expose stack traces
- [ ] Security headers present (check browser dev tools)
- [ ] Rate limiting working
- [ ] CSRF protection active
- [ ] XSS protection headers active

---

## 🔄 **ROLLBACK PROCEDURE**

If critical issues occur:

### **Step 1: Restore Frontend (Immediate)**

```bash
# Via FTP/SFTP
# Delete current files in public_html/
# Upload backup files
```

### **Step 2: Restore Backend (5 minutes)**

```bash
# SSH into server
cd /home/username/api.etchingxenial.biz.id

# Restore from backup
# Option A: Git
git checkout previous-version-tag

# Option B: Upload backup via FTP
```

### **Step 3: Restore Database (10 minutes)**

```bash
# PostgreSQL
psql -U username -d username_stencil_production < backup.sql

# MySQL
mysql -u username -p username_stencil_production < backup.sql
```

### **Step 4: Clear Caches**

```bash
cd /home/username/api.etchingxenial.biz.id
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

---

## 🆘 **EMERGENCY CONTACTS**

- **Hosting Support**: [Your hosting provider support]
- **DNS Provider**: [Your DNS provider support]
- **SSL Certificate**: Let's Encrypt / Your SSL provider
- **Database**: [Database admin contact]

---

## 🎉 **SUCCESS CRITERIA**

Deployment is successful when:

✅ **All checkboxes in Post-Deployment Checklist are checked**  
✅ **No critical errors in logs for 1 hour**  
✅ **Performance metrics meet targets**  
✅ **User acceptance testing passed**  
✅ **Rollback plan tested and ready**

---

## 🎯 **NEXT STEPS**

1. ✅ Complete deployment
2. ✅ Monitor for 24 hours
3. ➡️ Proceed to **`4-TESTING_CHECKLIST.md`** for comprehensive testing
4. ⏭️ Review **`5-TROUBLESHOOTING.md`** for common issues

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-12-22  
**Next Document**: [4-TESTING_CHECKLIST.md](./4-TESTING_CHECKLIST.md)
