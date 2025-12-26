# Frontend Deployment Guide
## React SPA to Production Web Hosting

**Target Domain:** `etchingxenial.com`  
**Folder Path:** `/public_html`  
**Stack:** React 18, Vite, TypeScript

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Build Production Bundle](#build-production-bundle)
4. [Upload to Server](#upload-to-server)
5. [Web Server Configuration](#web-server-configuration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- Node.js 18+ and npm
- Git
- FTP/SFTP client (FileZilla)
- Text editor

### Backend API Ready

Ensure backend API is deployed and accessible:
- ✅ `https://api.etchingxenial.biz.id` responding
- ✅ Database seeded with content
- ✅ CORS configured for frontend domain

---

## Environment Configuration

### Step 1: Create Production Environment File

Create `.env.production` in frontend root:

```bash
cd d:/worksites/canvastack/projects/canvastencil/frontend

# Create production env file
cp .env .env.production
```

### Step 2: Configure Production Variables

Edit `.env.production`:

```env
# API Configuration - PRODUCTION
VITE_API_URL=https://api.etchingxenial.biz.id/api/v1
VITE_PUBLIC_API_URL=https://api.etchingxenial.biz.id/api/v1
VITE_API_TIMEOUT=15000

# Environment
NODE_ENV=production
VITE_APP_ENVIRONMENT=production

# Debug Configuration - DISABLE IN PRODUCTION
VITE_DEBUG_MODE=false

# Features - DISABLE IN PRODUCTION
VITE_MOCK_API=false
VITE_ENABLE_PWA=false
VITE_ENABLE_OFFLINE=false

# WebSocket Configuration (if needed)
VITE_ENABLE_WEBSOCKET=false

# Base URL - Set to root since deploying to domain root
VITE_APP_BASE_URL=/

# Deployment platform
VITE_APP_DEPLOY_PLATFORM=webhost
VITE_APP_IS_GITHUB_PAGES=false
```

### Step 3: Verify Vite Config

Check `vite.config.ts` base URL configuration:

```typescript
// Should use VITE_APP_BASE_URL from env or default to '/'
const getBaseUrl = () => {
  const platform = env.VITE_APP_DEPLOY_PLATFORM || 'local';
  const isGithubPages = env.VITE_APP_IS_GITHUB_PAGES === 'true';
  
  if (platform === 'github' || isGithubPages) {
    return '/stencil/';
  }
  
  // For webhost, use root or env variable
  return env.VITE_APP_BASE_URL || (mode === 'production' ? '/' : '/');
};

return {
  base: getBaseUrl(),
  // ... rest of config
};
```

---

## Build Production Bundle

### Step 1: Clean Previous Builds

```bash
cd d:/worksites/canvastack/projects/canvastencil/frontend

# Remove previous build
rm -rf dist/

# Clear node modules cache (optional)
npm cache clean --force
```

### Step 2: Install Dependencies

```bash
# Install production dependencies
npm ci --production=false
```

### Step 3: Build for Production

```bash
# Build with production environment
npm run build

# Or explicitly specify mode
vite build --mode production
```

**Expected Output:**
```
vite v5.x.x building for production...
✓ 1234 modules transformed.
dist/index.html                    1.23 kB
dist/assets/index-abc123.css      45.67 kB │ gzip: 12.34 kB
dist/assets/index-xyz789.js      234.56 kB │ gzip: 78.90 kB
✓ built in 12.34s
```

### Step 4: Verify Build Output

```bash
cd dist/
ls -la

# Should see:
# - index.html
# - assets/ (CSS, JS, fonts)
# - images/ (if any)
# - favicon.ico
# - manifest.json (if PWA enabled)
```

### Step 5: Test Build Locally

```bash
# Preview production build
npm run preview

# Open browser to http://localhost:4173
# Test all routes and functionality
```

**Test Checklist:**
- [ ] Homepage loads
- [ ] All routes work (admin, public pages)
- [ ] API calls successful (check Network tab)
- [ ] Images load correctly
- [ ] No console errors
- [ ] Authentication works

---

## Upload to Server

### Option 1: FTP Upload (FileZilla)

#### Step 1: Connect to Server

1. Open FileZilla
2. Enter credentials:
   - **Host:** `ftp.etchingxenial.com` or server IP
   - **Username:** Your cPanel username
   - **Password:** Your cPanel password
   - **Port:** 21 (FTP) or 22 (SFTP - recommended)

#### Step 2: Backup Existing Files

If there are existing files in `/public_html`:

1. Download current files as backup
2. Or rename folder: `public_html` → `public_html_backup_20251226`

#### Step 3: Clear Target Directory

Navigate to `/public_html` and:
- Delete old files (except `.htaccess` if exists and you want to keep)
- Keep cPanel-generated files: `cgi-bin/`, `.htpasswds`, etc.

#### Step 4: Upload Build Files

1. **Local site:** Navigate to `d:/worksites/canvastack/projects/canvastencil/frontend/dist/`
2. **Remote site:** Navigate to `/public_html/`
3. **Select all files in dist/** (Ctrl+A)
4. **Right-click → Upload** (or drag and drop)

**Upload Structure:**
```
/public_html/
├── assets/
│   ├── index-abc123.css
│   ├── index-xyz789.js
│   └── [other chunks]
├── images/
│   └── [image files]
├── index.html
├── favicon.ico
└── .htaccess (will create next)
```

**Upload Progress:**
- Total files: ~100-500 (depending on assets)
- Total size: ~5-20 MB
- Time: 2-10 minutes (depending on connection)

### Option 2: SSH Upload

If SSH access available:

```bash
# From local machine
cd d:/worksites/canvastack/projects/canvastencil/frontend

# Upload via SCP
scp -r dist/* username@server-ip:/home/username/public_html/

# Or use rsync (faster, skips unchanged files)
rsync -avz --delete dist/ username@server-ip:/home/username/public_html/
```

### Option 3: cPanel File Manager

1. Login to cPanel
2. Navigate to **File Manager**
3. Go to `/public_html/`
4. **Upload** → Select ZIP of dist folder
5. Extract ZIP in cPanel
6. Move extracted contents to root of public_html
7. Delete ZIP file

---

## Web Server Configuration

### Step 1: Configure `.htaccess` for SPA Routing

Create `.htaccess` in `/public_html/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Force HTTPS (recommended for production)
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # Handle React Router (SPA routing)
  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Rewrite everything else to index.html
  RewriteRule ^ index.html [L]

  # CORS Headers (if needed)
  <IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "https://api.etchingxenial.biz.id"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
    Header set Access-Control-Allow-Credentials "true"
  </IfModule>
</IfModule>

# Disable directory browsing
Options -Indexes

# Enable compression for better performance
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching for static assets
<IfModule mod_expires.c>
  ExpiresActive On
  
  # Images
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  
  # CSS and JavaScript
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
  
  # Fonts
  ExpiresByType font/woff "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType application/font-woff "access plus 1 year"
  ExpiresByType application/font-woff2 "access plus 1 year"
  
  # HTML
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
```

### Step 2: Configure SSL/HTTPS

In cPanel:

1. Navigate to **SSL/TLS Status**
2. Enable **AutoSSL** or install Let's Encrypt certificate
3. Verify HTTPS working: `https://etchingxenial.com`

### Step 3: Verify Document Root

In cPanel → **Domains** → Verify:
- Domain: `etchingxenial.com`
- Document Root: `/public_html`

---

## Testing

### Step 1: Test Homepage

Visit: `https://etchingxenial.com`

**Expected:**
- Homepage loads correctly
- No 404 errors
- Images and assets load
- Styles applied

### Step 2: Test SPA Routing

Test all routes:
- ✅ `/` - Homepage
- ✅ `/admin` - Admin dashboard
- ✅ `/admin/login` - Login page
- ✅ `/admin/content/home` - Content editor
- ✅ `/admin/content/about` - About editor
- ✅ `/etchinx/home` - Tenant public page
- ✅ `/etchinx/about` - About page
- ✅ `/etchinx/contact` - Contact page
- ✅ `/etchinx/faq` - FAQ page

**Test method:**
1. Visit each URL directly (hard refresh: Ctrl+F5)
2. Should load correctly, not show 404
3. Content should display from API

### Step 3: Test API Integration

Open browser DevTools → Network tab:

1. **Check API calls:**
   - Requests going to `https://api.etchingxenial.biz.id`
   - Response status: 200 OK
   - Data returned correctly

2. **Check for errors:**
   - Console tab: No errors
   - Network tab: No failed requests (red)

### Step 4: Test Authentication

1. **Login:**
   - Visit `/admin/login`
   - Enter credentials
   - Should redirect to admin dashboard
   - Token stored in cookies/localStorage

2. **Protected routes:**
   - Try accessing `/admin/content/home` without login
   - Should redirect to login
   - After login, should access successfully

3. **Logout:**
   - Click logout
   - Should clear session
   - Redirect to public page

### Step 5: Test Content Editing

1. Login as tenant admin
2. Navigate to `/admin/content/home`
3. Edit content (e.g., change hero title)
4. Click "Save"
5. Verify:
   - Success toast appears
   - No errors in console
   - Changes saved to database

6. Visit public page: `/etchinx/home`
7. Verify changes appear

### Step 6: Cross-Browser Testing

Test on:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (if available)
- ✅ Mobile browsers (responsive)

### Step 7: Performance Testing

Use Chrome DevTools → Lighthouse:

```
Run audit for:
- Performance
- Accessibility
- Best Practices
- SEO

Target scores:
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90
```

---

## Troubleshooting

### Issue: White Screen / Blank Page

**Cause:** Base URL misconfiguration or assets not loading

**Solution:**
1. Check browser console for errors
2. Verify `.env.production` has `VITE_APP_BASE_URL=/`
3. Check `index.html` - asset paths should be `/assets/...` not `/stencil/assets/...`
4. Rebuild with correct config:
   ```bash
   rm -rf dist/
   npm run build
   # Re-upload
   ```

### Issue: 404 on Routes

**Cause:** `.htaccess` not configured correctly

**Solution:**
1. Verify `.htaccess` exists in `/public_html/`
2. Check RewriteRule: `RewriteRule ^ index.html [L]`
3. Ensure `mod_rewrite` enabled on server (usually is)
4. Check server error logs in cPanel

### Issue: Assets Not Loading (404 on CSS/JS)

**Cause:** Incorrect base path or missing files

**Solution:**
1. Check `dist/` folder has `assets/` directory
2. Verify all files uploaded (check file count)
3. Check file permissions: 644 for files, 755 for directories
4. Inspect `index.html` source - verify asset paths

### Issue: API Calls Failing (CORS Error)

**Cause:** CORS not configured on backend or wrong origin

**Solution:**
1. Check backend `.env`:
   ```env
   FRONTEND_URL=https://etchingxenial.com
   SANCTUM_STATEFUL_DOMAINS=etchingxenial.com,www.etchingxenial.com
   ```

2. Check backend `config/cors.php`:
   ```php
   'allowed_origins' => [
       'https://etchingxenial.com',
       'https://www.etchingxenial.com',
   ],
   'supports_credentials' => true,
   ```

3. Clear backend config cache:
   ```bash
   php artisan config:clear
   php artisan config:cache
   ```

### Issue: Authentication Not Working

**Cause:** Cookie domain or SameSite settings

**Solution:**
1. Check backend `.env`:
   ```env
   SESSION_DOMAIN=.etchingxenial.biz.id
   SESSION_SECURE_COOKIE=true
   SESSION_SAME_SITE=lax
   ```

2. Ensure both frontend and API use HTTPS

3. Check browser DevTools → Application → Cookies
   - Should see Laravel session cookie
   - Domain should match

### Issue: Images Not Displaying

**Cause:** Image paths incorrect or files not uploaded

**Solution:**
1. Check image paths in code (e.g., `/images/hero/...`)
2. Verify images uploaded to `/public_html/images/`
3. Check file permissions: 644
4. Use absolute URLs if needed: `https://etchingxenial.com/images/...`

---

## Performance Optimization

### Enable Gzip Compression

Verify `.htaccess` has:

```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

### Enable Browser Caching

Already in `.htaccess` above - sets long cache times for static assets.

### Lazy Loading Images

Ensure images use lazy loading:

```jsx
<img src="/images/hero.jpg" loading="lazy" alt="Hero" />
```

### Code Splitting

Vite automatically splits code. Verify in `dist/assets/`:
- Multiple JS chunks (e.g., `index-*.js`, `vendor-*.js`)
- Smaller initial bundle size

---

## Deployment Checklist

Before going live:

- [ ] Backend API deployed and tested
- [ ] Database seeded with production content
- [ ] `.env.production` configured correctly
- [ ] Production build successful (`npm run build`)
- [ ] All files uploaded to `/public_html/`
- [ ] `.htaccess` configured for SPA routing
- [ ] SSL/HTTPS enabled and working
- [ ] All routes tested (direct URL access)
- [ ] API integration working
- [ ] Authentication tested
- [ ] Content editing tested
- [ ] Cross-browser tested
- [ ] Mobile responsive tested
- [ ] Performance audit passed
- [ ] No console errors
- [ ] SEO meta tags verified

---

## Updating Deployment

When pushing updates:

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies (if package.json changed)
npm install

# 3. Build
npm run build

# 4. Backup current production
# Via FTP: Download /public_html to local backup

# 5. Upload new build
# Via FTP: Upload dist/* to /public_html/

# 6. Test
# Visit site and verify changes
```

---

## Rollback Procedure

If deployment fails:

1. **Via FTP:**
   - Delete current files in `/public_html/`
   - Upload previous backup

2. **Via Git (if version controlled on server):**
   ```bash
   git checkout [previous-commit-hash]
   npm run build
   # Replace files
   ```

3. **Via backup:**
   - Extract previous `dist/` backup
   - Upload to server

---

## Next Steps

After frontend deployment:

1. ✅ Verify all functionality end-to-end
2. ✅ Monitor error logs
3. ✅ Set up uptime monitoring
4. Proceed to [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) for future platform domain migration

---

**Support:** Check browser console and network tab for detailed error messages.
