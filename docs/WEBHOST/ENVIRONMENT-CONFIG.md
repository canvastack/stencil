# Environment Configuration Reference
## Complete .env Configuration Guide

**Project:** CanvasTencil Multi-Tenant Platform  
**Last Updated:** December 26, 2025

---

## Table of Contents

1. [Backend Environment Variables](#backend-environment-variables)
2. [Frontend Environment Variables](#frontend-environment-variables)
3. [Environment-Specific Configurations](#environment-specific-configurations)
4. [Security Best Practices](#security-best-practices)
5. [Troubleshooting](#troubleshooting)

---

## Backend Environment Variables

### Complete Backend `.env` Template

```env
# ===========================================
# APPLICATION SETTINGS
# ===========================================
APP_NAME="CanvasTencil API"
APP_ENV=production  # Options: local, development, staging, production
APP_KEY=base64:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  # Generate with: php artisan key:generate
APP_DEBUG=false  # IMPORTANT: Must be false in production!
APP_URL=https://api.etchingxenial.biz.id  # Your backend API URL

# Frontend URL (for CORS)
FRONTEND_URL=https://etchingxenial.com  # Your frontend domain

# ===========================================
# LOGGING
# ===========================================
LOG_CHANNEL=daily  # Options: single, daily, stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=warning  # Options: debug, info, notice, warning, error, critical, alert, emergency

# ===========================================
# DATABASE
# ===========================================
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1  # Database server IP or hostname
DB_PORT=5432  # PostgreSQL default port
DB_DATABASE=stencil_production  # Your database name (may have cPanel prefix)
DB_USERNAME=stencil_user  # Database username (may have cPanel prefix)
DB_PASSWORD=your_secure_password_here  # Database password

# ===========================================
# CACHING
# ===========================================
BROADCAST_DRIVER=log
CACHE_DRIVER=file  # Options: file, redis, memcached, database
FILESYSTEM_DISK=local  # Options: local, s3, public
QUEUE_CONNECTION=database  # Options: sync, database, redis
SESSION_DRIVER=file  # Options: file, cookie, database, redis
SESSION_LIFETIME=120  # Minutes

# ===========================================
# SESSION & COOKIES
# ===========================================
SESSION_DOMAIN=.etchingxenial.biz.id  # Use leading dot for subdomain sharing
SESSION_SECURE_COOKIE=true  # Must be true for HTTPS
SESSION_SAME_SITE=lax  # Options: lax, strict, none

# ===========================================
# SANCTUM (API Authentication)
# ===========================================
SANCTUM_STATEFUL_DOMAINS=etchingxenial.com,www.etchingxenial.com  # Frontend domains

# ===========================================
# REDIS (Optional - if using Redis)
# ===========================================
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# ===========================================
# MAIL CONFIGURATION
# ===========================================
MAIL_MAILER=smtp  # Options: smtp, sendmail, mailgun, ses, postmark
MAIL_HOST=smtp.gmail.com  # SMTP server
MAIL_PORT=587  # Port: 587 (TLS) or 465 (SSL)
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-specific-password  # For Gmail: use App Password
MAIL_ENCRYPTION=tls  # Options: tls, ssl
MAIL_FROM_ADDRESS=noreply@etchingxenial.com
MAIL_FROM_NAME="${APP_NAME}"

# ===========================================
# AWS S3 (Optional - for file storage)
# ===========================================
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=ap-southeast-1  # Closest region
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

# ===========================================
# PUSHER (Optional - for WebSocket)
# ===========================================
PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=ap1

# ===========================================
# MEMCACHED (Optional)
# ===========================================
MEMCACHED_HOST=127.0.0.1

# ===========================================
# VITE (for asset building)
# ===========================================
VITE_APP_NAME="${APP_NAME}"
VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="${PUSHER_HOST}"
VITE_PUSHER_PORT="${PUSHER_PORT}"
VITE_PUSHER_SCHEME="${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"
```

### Environment-Specific Backend Configurations

#### Local Development `.env`

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

DB_HOST=127.0.0.1
DB_DATABASE=stencil_canvastack
DB_USERNAME=postgres
DB_PASSWORD=@admin

LOG_LEVEL=debug
SESSION_SECURE_COOKIE=false
```

#### Staging `.env`

```env
APP_ENV=staging
APP_DEBUG=true  # Can keep true for debugging
APP_URL=https://staging-api.etchingxenial.biz.id
FRONTEND_URL=https://staging.etchingxenial.com

LOG_LEVEL=debug
SESSION_SECURE_COOKIE=true
```

#### Production `.env`

```env
APP_ENV=production
APP_DEBUG=false  # MUST be false!
APP_URL=https://api.etchingxenial.biz.id
FRONTEND_URL=https://etchingxenial.com

LOG_LEVEL=warning  # Or error
SESSION_SECURE_COOKIE=true
```

---

## Frontend Environment Variables

### Complete Frontend `.env` Template

```env
# ===========================================
# API CONFIGURATION
# ===========================================
VITE_API_URL=http://localhost:8000/api/v1  # Backend API base URL
VITE_PUBLIC_API_URL=http://localhost:8000/api/v1  # Public API base URL
VITE_API_TIMEOUT=15000  # API request timeout in milliseconds

# ===========================================
# ENVIRONMENT
# ===========================================
NODE_ENV=development  # Options: development, production
VITE_APP_ENVIRONMENT=development  # Options: development, staging, production

# ===========================================
# DEBUG CONFIGURATION
# ===========================================
VITE_DEBUG_MODE=true  # Enable debug logging in console

# ===========================================
# FEATURES
# ===========================================
VITE_MOCK_API=false  # IMPORTANT: Must be false (no mock data allowed)
VITE_ENABLE_PWA=false  # Enable Progressive Web App features
VITE_ENABLE_OFFLINE=false  # Enable offline support
VITE_ENABLE_WEBSOCKET=false  # Enable WebSocket for real-time features

# ===========================================
# DEPLOYMENT
# ===========================================
VITE_APP_BASE_URL=/  # Base URL for routing (e.g., / or /stencil/)
VITE_APP_DEPLOY_PLATFORM=local  # Options: local, webhost, github, vercel
VITE_APP_IS_GITHUB_PAGES=false  # Set to true if deploying to GitHub Pages

# ===========================================
# APPLICATION TYPE (for multi-build)
# ===========================================
VITE_APP_IS_PLATFORM=false  # Set to true for platform build
VITE_APP_IS_TENANT=false  # Set to true for tenant build
VITE_APP_TENANT_SLUG=  # Tenant slug (e.g., etchinx) for tenant build

# ===========================================
# ANALYTICS (Optional)
# ===========================================
VITE_GOOGLE_ANALYTICS_ID=  # Google Analytics tracking ID
VITE_FACEBOOK_PIXEL_ID=  # Facebook Pixel ID

# ===========================================
# THIRD-PARTY SERVICES (Optional)
# ===========================================
VITE_SENTRY_DSN=  # Sentry error tracking DSN
VITE_STRIPE_PUBLIC_KEY=  # Stripe public key for payments
```

### Environment-Specific Frontend Configurations

#### Local Development `.env`

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_PUBLIC_API_URL=http://localhost:8000/api/v1

NODE_ENV=development
VITE_APP_ENVIRONMENT=development
VITE_DEBUG_MODE=true
VITE_MOCK_API=false

VITE_APP_BASE_URL=/
VITE_APP_DEPLOY_PLATFORM=local
```

#### Production - Tenant CEX `.env.production`

```env
VITE_API_URL=https://api.etchingxenial.biz.id/api/v1
VITE_PUBLIC_API_URL=https://api.etchingxenial.biz.id/api/v1
VITE_API_TIMEOUT=15000

NODE_ENV=production
VITE_APP_ENVIRONMENT=production

VITE_DEBUG_MODE=false
VITE_MOCK_API=false
VITE_ENABLE_PWA=false
VITE_ENABLE_OFFLINE=false
VITE_ENABLE_WEBSOCKET=false

VITE_APP_BASE_URL=/
VITE_APP_DEPLOY_PLATFORM=webhost
VITE_APP_IS_GITHUB_PAGES=false
VITE_APP_IS_TENANT=true
VITE_APP_TENANT_SLUG=etchinx
```

#### Production - Platform `.env.production.platform`

```env
VITE_API_URL=https://api.canvastack.com/api/v1
VITE_PUBLIC_API_URL=https://api.canvastack.com/api/v1
VITE_API_TIMEOUT=15000

NODE_ENV=production
VITE_APP_ENVIRONMENT=production

VITE_DEBUG_MODE=false
VITE_MOCK_API=false
VITE_ENABLE_PWA=false
VITE_ENABLE_OFFLINE=false
VITE_ENABLE_WEBSOCKET=false

VITE_APP_BASE_URL=/
VITE_APP_DEPLOY_PLATFORM=webhost
VITE_APP_IS_GITHUB_PAGES=false
VITE_APP_IS_PLATFORM=true
```

---

## Environment-Specific Configurations

### CORS Configuration (Backend)

Edit `backend/config/cors.php`:

#### Development

```php
'allowed_origins' => [
    'http://localhost:5173',
    'http://localhost:3000',
],
'supports_credentials' => true,
```

#### Production

```php
'allowed_origins' => [
    'https://etchingxenial.com',
    'https://www.etchingxenial.com',
    'https://stencil.canvastack.com',  // After platform migration
    'https://www.stencil.canvastack.com',
],

'allowed_origins_patterns' => [],

'allowed_headers' => ['*'],

'allowed_methods' => ['*'],

'supports_credentials' => true,
```

### Session Configuration (Backend)

Edit `backend/config/session.php`:

```php
'lifetime' => env('SESSION_LIFETIME', 120),
'expire_on_close' => false,
'secure' => env('SESSION_SECURE_COOKIE', false),  // true in production
'http_only' => true,
'same_site' => env('SESSION_SAME_SITE', 'lax'),
'domain' => env('SESSION_DOMAIN', null),  // Set to .yourdomain.com for subdomain sharing
```

---

## Security Best Practices

### 1. Never Commit `.env` to Git

**Ensure `.gitignore` includes:**

```gitignore
.env
.env.local
.env.production
.env.staging
.env.*.local
```

### 2. Use Strong Passwords

**Generate secure passwords:**

```bash
# Generate random password
openssl rand -base64 32

# Generate Laravel APP_KEY
php artisan key:generate
```

### 3. Restrict File Permissions

```bash
# Backend .env
chmod 600 backend/.env

# Verify
ls -la backend/.env
# Should show: -rw------- (only owner can read/write)
```

### 4. Environment Variables Checklist

**Before deploying to production:**

- [ ] `APP_DEBUG=false`
- [ ] `APP_ENV=production`
- [ ] Strong `DB_PASSWORD`
- [ ] Correct `APP_URL` and `FRONTEND_URL`
- [ ] `SESSION_SECURE_COOKIE=true`
- [ ] `VITE_DEBUG_MODE=false`
- [ ] `VITE_MOCK_API=false`
- [ ] All placeholder values replaced with real values
- [ ] Sensitive keys (AWS, Stripe, etc.) secured

### 5. Use Environment-Specific Files

**Organize environments:**

```
backend/
├── .env                  # Local development (gitignored)
├── .env.example          # Template (committed to Git)
├── .env.staging          # Staging (gitignored)
└── .env.production       # Production (gitignored)

frontend/
├── .env                  # Local development (gitignored)
├── .env.example          # Template (committed to Git)
├── .env.production       # Production (gitignored)
└── .env.production.platform  # Platform production (gitignored)
```

---

## Troubleshooting

### Issue: APP_KEY Not Set

**Error:** "No application encryption key has been specified."

**Solution:**
```bash
cd backend
php artisan key:generate
```

### Issue: Database Connection Failed

**Error:** "SQLSTATE[08006] [7] could not connect to server"

**Check:**
1. Database credentials in `.env`
2. Database server running
3. Port correct (5432 for PostgreSQL)
4. User has correct privileges

**Test connection:**
```bash
php artisan tinker
>>> DB::connection()->getPdo();
```

### Issue: CORS Errors in Frontend

**Error:** "Access to XMLHttpRequest... has been blocked by CORS policy"

**Solution:**
1. Check `FRONTEND_URL` in backend `.env`
2. Verify `config/cors.php` includes frontend domain
3. Clear config cache:
   ```bash
   php artisan config:clear
   php artisan config:cache
   ```

### Issue: Frontend API Calls 404

**Error:** "GET https://api.domain.com/api/v1/... 404 Not Found"

**Check:**
1. `VITE_API_URL` in frontend `.env.production`
2. Backend API actually deployed and running
3. Backend `.htaccess` configured correctly
4. Backend routes registered

**Test backend:**
```bash
curl https://api.etchingxenial.biz.id/api/v1/health
```

### Issue: Authentication Not Working

**Error:** "Unauthenticated" or "CSRF token mismatch"

**Solution:**
1. Check `SANCTUM_STATEFUL_DOMAINS` in backend `.env`
2. Ensure both frontend and backend use HTTPS
3. Check `SESSION_DOMAIN` setting
4. Verify cookies in browser DevTools
5. Clear backend config cache

### Issue: Assets Not Loading

**Error:** "GET https://domain.com/assets/... 404"

**Check:**
1. `VITE_APP_BASE_URL` in frontend `.env.production`
2. Verify `vite.config.ts` base path
3. Check `dist/index.html` for correct asset paths
4. Ensure all files uploaded to server

---

## Quick Reference

### Generate Secrets

```bash
# APP_KEY (Laravel)
php artisan key:generate

# Random password
openssl rand -base64 32

# UUID
uuidgen  # Linux/Mac
# or use online generator
```

### Test Environment Variables

**Backend:**
```bash
php artisan tinker
>>> env('APP_URL');
>>> config('app.url');
>>> config('cors.allowed_origins');
```

**Frontend:**
```bash
# During build
npm run build

# Check output for warnings about missing env vars
```

### View Current Configuration

**Backend:**
```bash
php artisan config:show app
php artisan config:show database
php artisan config:show cors
```

---

## Next Steps

1. ✅ Configure `.env` files for your environment
2. ✅ Secure sensitive values
3. ✅ Test configuration locally
4. ✅ Deploy to production with production `.env`
5. ✅ Verify all settings working in production

---

**Document Version:** 1.0  
**Last Updated:** December 26, 2025
