# Backend Deployment Guide
## Laravel API to Production Web Hosting

**Target Domain:** `api.etchingxenial.biz.id`  
**Folder Path:** `/api.etchingxenial.biz.id`  
**Stack:** Laravel 10, PostgreSQL, PHP 8.1+

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [File Upload](#file-upload)
4. [Environment Configuration](#environment-configuration)
5. [Composer Dependencies](#composer-dependencies)
6. [Database Migration & Seeding](#database-migration--seeding)
7. [Web Server Configuration](#web-server-configuration)
8. [File Permissions](#file-permissions)
9. [Testing](#testing)
10. [Optimization](#optimization)

---

## Prerequisites

### Server Requirements

- **PHP:** 8.1 or higher
- **PostgreSQL:** 12 or higher
- **Required PHP Extensions:**
  - BCMath
  - Ctype
  - Fileinfo
  - JSON
  - Mbstring
  - OpenSSL
  - PDO
  - PDO_PGSQL
  - Tokenizer
  - XML
  - cURL

### Check Server Requirements

```bash
# If SSH access is available
php -v
php -m | grep -i pgsql
php -m | grep -i mbstring
```

If SSH is not available, create `info.php` in public folder:

```php
<?php phpinfo(); ?>
```

Visit `https://api.etchingxenial.biz.id/info.php` and verify extensions. **Delete this file after checking!**

---

## Database Setup

### Step 1: Create PostgreSQL Database (cPanel)

1. Login to cPanel
2. Navigate to **PostgreSQL Databases**
3. Create new database:
   - **Database Name:** `stencil_production` (or your choice)
   - **Note:** cPanel may prefix with your username, e.g., `username_stencil_production`
4. Create database user:
   - **Username:** `stencil_user`
   - **Password:** Generate strong password
5. Add user to database with **ALL PRIVILEGES**
6. Note down:
   - Database name (with prefix)
   - Username (with prefix)
   - Password
   - Host (usually `localhost` or `127.0.0.1`)

### Step 2: Test Database Connection

Use database client (pgAdmin, DBeaver) to test connection:

```
Host: [your-server-ip or localhost]
Port: 5432
Database: username_stencil_production
Username: username_stencil_user
Password: [your-password]
```

---

## File Upload

### Prepare Files for Upload

On your local machine:

```bash
# Navigate to backend directory
cd d:/worksites/canvastack/projects/canvastencil/backend

# Create deployment package (exclude unnecessary files)
# Option 1: Using Git
git archive -o ../backend-deploy.zip HEAD

# Option 2: Manual ZIP (exclude these)
# - /node_modules
# - /vendor
# - /storage/*.log
# - /.env (will create new on server)
# - /.git
```

### Upload via FTP/SFTP

1. **Using FileZilla:**
   - Host: `ftp.etchingxenial.biz.id` or use SFTP with server IP
   - Username: Your cPanel username
   - Password: Your cPanel password
   - Port: 21 (FTP) or 22 (SFTP)

2. **Upload to correct location:**
   ```
   Remote Path: /api.etchingxenial.biz.id
   ```

3. **Upload structure:**
   ```
   /api.etchingxenial.biz.id/
   ├── app/
   ├── bootstrap/
   ├── config/
   ├── database/
   ├── public/
   ├── resources/
   ├── routes/
   ├── storage/
   ├── artisan
   ├── composer.json
   └── composer.lock
   ```

### Alternative: SSH Upload

If SSH access available:

```bash
# From local machine
scp -r backend/ username@server-ip:/path/to/api.etchingxenial.biz.id/

# Or using rsync
rsync -avz --exclude 'vendor' --exclude 'node_modules' \
  backend/ username@server-ip:/path/to/api.etchingxenial.biz.id/
```

---

## Environment Configuration

### Step 1: Create Production `.env`

SSH into server or use cPanel File Manager:

```bash
cd /api.etchingxenial.biz.id
cp .env.example .env
nano .env  # or use cPanel File Manager editor
```

### Step 2: Configure `.env` for Production

```env
# Application
APP_NAME="CanvaStencil API"
APP_ENV=production
APP_KEY=  # Will generate in next step
APP_DEBUG=false  # IMPORTANT: Set to false in production!
APP_URL=https://api.etchingxenial.biz.id

# Frontend URL (CORS)
FRONTEND_URL=https://etchingxenial.com

# Database (use your actual credentials)
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=username_stencil_production
DB_USERNAME=username_stencil_user
DB_PASSWORD=[your-strong-password]

# Logging
LOG_CHANNEL=daily
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=warning  # Use 'error' for production

# Session & Cache
SESSION_DRIVER=file
SESSION_LIFETIME=120
SESSION_DOMAIN=.etchingxenial.biz.id
SESSION_SECURE_COOKIE=true

CACHE_DRIVER=file
QUEUE_CONNECTION=database

# Sanctum (Authentication)
SANCTUM_STATEFUL_DOMAINS=etchingxenial.com,www.etchingxenial.com
SESSION_SAME_SITE=lax

# Mail (configure your mail service)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com  # or your SMTP
MAIL_PORT=587
MAIL_USERNAME=[your-email]
MAIL_PASSWORD=[your-app-password]
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=[your-email]
MAIL_FROM_NAME="${APP_NAME}"

# AWS S3 (if using for file storage)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=ap-southeast-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false
```

### Step 3: Generate Application Key

```bash
php artisan key:generate
```

This will populate `APP_KEY` in `.env` file.

---

## Composer Dependencies

### Install Dependencies

**Option 1: SSH Access**

```bash
cd /api.etchingxenial.biz.id

# Install Composer if not available
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer

# Install dependencies (production only, no dev dependencies)
composer install --optimize-autoloader --no-dev
```

**Option 2: No SSH Access**

1. Install dependencies on local machine:
   ```bash
   composer install --optimize-autoloader --no-dev
   ```

2. Upload the entire `vendor/` directory via FTP
   - **Warning:** This is slow (thousands of files). Use ZIP if possible:
   ```bash
   # On local
   cd backend
   zip -r vendor.zip vendor/
   # Upload vendor.zip, then extract on server via cPanel File Manager
   ```

### Optimize Autoloader

```bash
composer dump-autoload --optimize
```

---

## Database Migration & Seeding

### Step 1: Run Migrations

```bash
cd /api.etchingxenial.biz.id

php artisan migrate --force
```

The `--force` flag is required in production mode.

### Step 2: Seed Database

```bash
# Seed all data
php artisan db:seed --force

# Or seed specific seeders
php artisan db:seed --class=PlatformContentSeeder --force
php artisan db:seed --class=TenantContentSeeder --force
php artisan db:seed --class=UserSeeder --force
```

### Step 3: Verify Database

```bash
php artisan tinker

# In tinker console
>>> \App\Models\Tenant::count();
>>> \App\Models\TenantPage::count();
>>> \App\Models\PlatformPage::count();
>>> \App\Models\User::count();
>>> exit
```

Or connect with database client and check tables.

---

## Web Server Configuration

### Configure Document Root

In cPanel or server admin panel:

1. **Set Document Root** for `api.etchingxenial.biz.id` to:
   ```
   /api.etchingxenial.biz.id/public
   ```

2. **Enable HTTPS/SSL:**
   - Use Let's Encrypt SSL (free, auto-renewal)
   - In cPanel: SSL/TLS → Install Let's Encrypt certificate

### Create `.htaccess` in `/public`

Laravel should have this by default, but verify:

```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

### Force HTTPS (Optional but Recommended)

Add to `.htaccess` in `/public` before other rules:

```apache
# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## File Permissions

### Set Correct Permissions

```bash
cd /api.etchingxenial.biz.id

# Storage and cache directories must be writable
chmod -R 775 storage
chmod -R 775 bootstrap/cache

# If using shared hosting, may need 777
chmod -R 777 storage
chmod -R 777 bootstrap/cache

# Create storage symlink for public file access
php artisan storage:link
```

### Verify Writable Directories

```bash
# Test write permissions
touch storage/logs/test.log
ls -la storage/logs/test.log
rm storage/logs/test.log
```

---

## Testing

### Test API Endpoints

```bash
# Health check
curl https://api.etchingxenial.biz.id/api/v1/health

# Public content endpoint
curl https://api.etchingxenial.biz.id/api/v1/public/pages/home

# Tenant content endpoint
curl https://api.etchingxenial.biz.id/api/v1/public/tenant/etchinx/home
```

### Test Authentication

```bash
# Register/Login
curl -X POST https://api.etchingxenial.biz.id/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'
```

### Check Logs

```bash
tail -f storage/logs/laravel.log
```

If errors occur, check:
- Database connection
- File permissions
- PHP version and extensions
- `.env` configuration

---

## Optimization

### Production Optimizations

```bash
cd /api.etchingxenial.biz.id

# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Optimize autoloader
composer dump-autoload --optimize

# Clear all cache if needed
php artisan optimize:clear
```

### Clear Cache When Updating

After any configuration change:

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

Then re-cache:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Maintenance Mode

### Enable Maintenance Mode

```bash
php artisan down --message="System maintenance in progress" --retry=60
```

### Disable Maintenance Mode

```bash
php artisan up
```

---

## Monitoring & Logs

### Check Application Logs

```bash
# View recent logs
tail -n 100 storage/logs/laravel.log

# Follow logs in real-time
tail -f storage/logs/laravel.log

# Search for errors
grep -i error storage/logs/laravel.log
```

### Setup Log Rotation

Create `.logrotate` config or use hosting provider's log rotation.

---

## Security Checklist

- [ ] `APP_DEBUG=false` in production
- [ ] Strong database password
- [ ] `.env` file not publicly accessible
- [ ] HTTPS enabled with valid SSL
- [ ] CORS properly configured
- [ ] Rate limiting enabled (Laravel default)
- [ ] File upload validation in place
- [ ] SQL injection protection (Eloquent ORM)
- [ ] XSS protection enabled
- [ ] CSRF protection enabled

---

## Troubleshooting

### Issue: 500 Internal Server Error

**Check:**
1. Error logs: `storage/logs/laravel.log`
2. Web server error logs (cPanel → Error Logs)
3. PHP error logs

**Common Causes:**
- File permissions (storage/ not writable)
- Missing `.env` file
- Database connection failed
- Missing PHP extensions

### Issue: Database Connection Failed

**Solution:**
```bash
# Test database connection
php artisan tinker
>>> DB::connection()->getPdo();
```

Check:
- Database credentials in `.env`
- Database server running
- User has correct privileges

### Issue: CORS Errors

**Solution:**
Verify `config/cors.php`:

```php
'allowed_origins' => [
    'https://etchingxenial.com',
    'https://www.etchingxenial.com',
],

'allowed_origins_patterns' => [],

'allowed_headers' => ['*'],

'allowed_methods' => ['*'],

'supports_credentials' => true,
```

And in `.env`:
```env
SANCTUM_STATEFUL_DOMAINS=etchingxenial.com,www.etchingxenial.com
```

---

## Next Steps

After backend deployment is complete:

1. Verify all API endpoints working
2. Test authentication flow
3. Proceed to [FRONTEND-DEPLOYMENT.md](./FRONTEND-DEPLOYMENT.md)

---

**Support:** Check Laravel logs and server error logs for detailed error messages.
