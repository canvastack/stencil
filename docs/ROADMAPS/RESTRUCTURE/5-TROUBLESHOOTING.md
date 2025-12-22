# TROUBLESHOOTING GUIDE
## Common Issues & Solutions

**Version**: 1.0.0  
**Last Updated**: December 22, 2025  
**Purpose**: Quick reference for resolving common restructure and deployment issues  

---

## 📋 **ISSUE CATEGORIES**

1. [CORS Errors](#1-cors-errors)
2. [Session & Cookie Issues](#2-session--cookie-issues)
3. [API Connection Issues](#3-api-connection-issues)
4. [Authentication Problems](#4-authentication-problems)
5. [SPA Routing Issues](#5-spa-routing-issues)
6. [Environment Variable Issues](#6-environment-variable-issues)
7. [Build & Deploy Errors](#7-build--deploy-errors)
8. [Database Connection Issues](#8-database-connection-issues)
9. [Performance Problems](#9-performance-problems)
10. [File Upload Issues](#10-file-upload-issues)

---

## 1. CORS ERRORS

### **Issue 1.1: "Access to XMLHttpRequest blocked by CORS policy"**

**Symptom:**
```
Access to XMLHttpRequest at 'http://localhost:8000/api/v1/health' 
from origin 'http://localhost:5173' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Cause**: Backend tidak mengizinkan frontend origin.

**Solution:**

**Backend: `backend/.env`**
```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
CORS_SUPPORTS_CREDENTIALS=true
```

**Backend: `backend/config/cors.php`**
```php
'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')),
'supports_credentials' => true,
```

**Clear config cache:**
```bash
cd backend
php artisan config:clear
php artisan config:cache
php artisan serve
```

**Verify:**
```bash
curl -I http://localhost:8000/api/v1/health
# Should see: Access-Control-Allow-Origin: http://localhost:5173
```

---

### **Issue 1.2: "CORS error only in production, works locally"**

**Symptom**: Local works, production shows CORS error.

**Cause**: Production `.env` has wrong origin or missing HTTPS.

**Solution:**

**Backend: `backend/.env` (Production)**
```env
# Use HTTPS in production!
FRONTEND_URL=https://etchingxenial.biz.id
CORS_ALLOWED_ORIGINS=https://etchingxenial.biz.id,https://www.etchingxenial.biz.id

# NOT http:// in production!
```

**Check `.htaccess` has CORS headers as backup:**

**Backend: `api.etchingxenial.biz.id/public/.htaccess`**
```apache
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "https://etchingxenial.biz.id"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    Header set Access-Control-Allow-Credentials "true"
</IfModule>
```

**Clear production cache:**
```bash
ssh username@etchingxenial.biz.id
cd /home/username/api.etchingxenial.biz.id
php artisan config:clear
php artisan cache:clear
```

---

### **Issue 1.3: "CORS error on OPTIONS preflight request"**

**Symptom**: POST/PUT/DELETE requests fail with CORS error, but GET works.

**Cause**: OPTIONS preflight request not handled properly.

**Solution:**

**Backend: `backend/app/Http/Middleware/HandleCors.php` (if custom)**

Make sure middleware returns proper response for OPTIONS:

```php
public function handle($request, Closure $next)
{
    if ($request->getMethod() === "OPTIONS") {
        return response('', 200)
            ->header('Access-Control-Allow-Origin', config('cors.allowed_origins'))
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-TOKEN')
            ->header('Access-Control-Allow-Credentials', 'true');
    }

    return $next($request);
}
```

**Or use Laravel's built-in CORS middleware (recommended):**

**Backend: `backend/app/Http/Kernel.php`**
```php
protected $middleware = [
    // ...
    \Illuminate\Http\Middleware\HandleCors::class,
];
```

---

## 2. SESSION & COOKIE ISSUES

### **Issue 2.1: "Session not persisting after page refresh"**

**Symptom**: Login works, but refresh page logs user out.

**Cause**: Cookie not set correctly or wrong domain.

**Solution:**

**Backend: `backend/.env`**
```env
# Local
SESSION_DOMAIN=localhost  # No dot prefix for localhost!
SESSION_SECURE_COOKIE=false  # false for HTTP
SESSION_SAME_SITE=lax

# Production
SESSION_DOMAIN=.etchingxenial.biz.id  # Dot prefix for subdomain sharing!
SESSION_SECURE_COOKIE=true  # true for HTTPS
SESSION_SAME_SITE=none  # none for cross-domain
```

**Frontend: Ensure `withCredentials: true`**

```typescript
// src/lib/axios.ts
axios.defaults.withCredentials = true;

// Or per request
axios.get('/api/v1/health', {
  withCredentials: true
})
```

**Clear cookies and retry:**
```javascript
// Browser console
document.cookie.split(";").forEach(c => {
  document.cookie = c.trim().split("=")[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
});
```

---

### **Issue 2.2: "419 CSRF token mismatch"**

**Symptom**:
```
419 CSRF token mismatch
```

**Cause**: CSRF token not sent or expired.

**Solution:**

**1. Get CSRF cookie BEFORE login:**

```typescript
// src/services/authService.ts
async function login(credentials) {
  // IMPORTANT: Get CSRF cookie first
  await axios.get('/sanctum/csrf-cookie', {
    withCredentials: true
  });
  
  // Then login
  const response = await axios.post('/api/v1/auth/login', credentials, {
    withCredentials: true
  });
  
  return response.data;
}
```

**2. Ensure CSRF token in headers:**

```typescript
// src/lib/axios.ts
axios.interceptors.request.use((config) => {
  // Get CSRF token from cookie
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];
    
  if (token) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
  }
  
  return config;
});
```

**3. Check Sanctum stateful domains:**

**Backend: `backend/config/sanctum.php`**
```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost:5173')),
```

**Backend: `backend/.env`**
```env
SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:3000
# Production:
SANCTUM_STATEFUL_DOMAINS=etchingxenial.biz.id,www.etchingxenial.biz.id
```

---

### **Issue 2.3: "Cookies not being set in browser"**

**Symptom**: No cookies in DevTools → Application → Cookies.

**Cause**: SameSite policy blocking cookies.

**Solution:**

**Development (localhost):**
```env
SESSION_SAME_SITE=lax  # Works for same-domain (localhost)
SESSION_SECURE_COOKIE=false
```

**Production (cross-subdomain):**
```env
SESSION_SAME_SITE=none  # Required for cross-domain
SESSION_SECURE_COOKIE=true  # MUST be true when SameSite=none
```

**Check browser console for warnings:**
```
A cookie associated with a cross-site resource was set without the `SameSite` attribute.
```

**Fix: Ensure HTTPS in production and SameSite=none**

---

## 3. API CONNECTION ISSUES

### **Issue 3.1: "Failed to fetch" or "Network Error"**

**Symptom**: All API calls fail with generic network error.

**Cause**: Backend not running, or wrong URL.

**Solution:**

**1. Verify backend is running:**
```bash
# Check if Laravel server is running
curl http://localhost:8000/api/v1/health
# Should return JSON, not error

# Check process
# Windows:
netstat -ano | findstr :8000

# Linux/Mac:
lsof -i :8000
```

**2. Check API URL in frontend:**

```typescript
// frontend/src/lib/config.ts
export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  }
}

// Verify URL is correct
console.log('API URL:', config.api.baseUrl);
```

**3. Check frontend .env:**

```env
# frontend/.env.development
VITE_API_BASE_URL=http://localhost:8000/api/v1  # Correct!
# NOT: http://localhost:8000 (missing /api/v1)
```

**4. Rebuild frontend after .env change:**
```bash
cd frontend
npm run dev  # Restart dev server
```

---

### **Issue 3.2: "404 Not Found" on API routes**

**Symptom**: API routes return 404.

**Cause**: Routes not registered or cached incorrectly.

**Solution:**

**1. Verify routes exist:**
```bash
cd backend
php artisan route:list | grep api
# Should list all API routes
```

**2. Clear route cache:**
```bash
php artisan route:clear
php artisan route:cache
php artisan serve
```

**3. Check route file syntax:**

**Backend: `backend/routes/api.php`**
```php
// Correct:
Route::prefix('v1')->group(function () {
    Route::get('/health', [HealthController::class, 'index']);
});

// Incorrect (missing prefix):
Route::get('/health', [HealthController::class, 'index']);
```

**4. Check API prefix in RouteServiceProvider:**

**Backend: `backend/app/Providers/RouteServiceProvider.php`**
```php
Route::prefix('api')
    ->middleware('api')
    ->namespace($this->namespace)
    ->group(base_path('routes/api.php'));
```

---

### **Issue 3.3: "500 Internal Server Error"**

**Symptom**: API returns 500 error.

**Cause**: Backend error (check logs).

**Solution:**

**1. Check Laravel logs:**
```bash
cd backend
tail -f storage/logs/laravel.log
```

**2. Enable debug mode temporarily:**

**Backend: `backend/.env`**
```env
APP_DEBUG=true  # Only for debugging! Set false in production
```

**3. Common causes:**
- Database connection failed
- Missing environment variables
- PHP errors (syntax, missing classes)
- Permission issues (storage/ not writable)

**4. Fix permissions:**
```bash
chmod -R 775 storage bootstrap/cache
```

---

## 4. AUTHENTICATION PROBLEMS

### **Issue 4.1: "Login returns 401 Unauthorized"**

**Symptom**: Login request returns 401.

**Cause**: Invalid credentials or auth not working.

**Solution:**

**1. Verify credentials in database:**
```sql
-- Check user exists
SELECT email, account_type FROM users WHERE email = 'admin@canvastencil.com';
```

**2. Test backend directly:**
```bash
# Get CSRF cookie
curl -c cookies.txt http://localhost:8000/sanctum/csrf-cookie

# Login
curl -b cookies.txt -X POST http://localhost:8000/api/v1/platform/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@canvastencil.com","password":"your_password"}'
```

**3. Check AuthController:**

**Backend: Ensure password is being verified:**
```php
// app/Http/Controllers/Auth/LoginController.php
if (!Auth::attempt($credentials)) {
    return response()->json(['message' => 'Invalid credentials'], 401);
}
```

**4. Check user seeder:**
```bash
php artisan db:seed --class=UserSeeder
```

---

### **Issue 4.2: "Token not being saved to localStorage"**

**Symptom**: Login successful, but token not saved.

**Cause**: Frontend code not saving token correctly.

**Solution:**

**Check auth service:**

```typescript
// src/services/authService.ts
export async function login(credentials) {
  await axios.get('/sanctum/csrf-cookie');
  
  const response = await axios.post('/api/v1/auth/login', credentials);
  
  // IMPORTANT: Save token
  const { access_token, user } = response.data;
  
  localStorage.setItem('stencil_auth_token', access_token);
  localStorage.setItem('stencil_auth_user', JSON.stringify(user));
  
  return response.data;
}
```

**Verify token saved:**
```javascript
// Browser console
console.log(localStorage.getItem('stencil_auth_token'));
// Should return token string
```

---

### **Issue 4.3: "Authenticated requests return 401"**

**Symptom**: Login works, but subsequent API calls return 401.

**Cause**: Token not sent in Authorization header.

**Solution:**

**Add axios interceptor:**

```typescript
// src/lib/axios.ts
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('stencil_auth_token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});
```

**Verify header is sent:**
```javascript
// Browser DevTools → Network tab
// Check request headers:
// Authorization: Bearer eyJ0eXAiOiJKV1QiLC...
```

---

## 5. SPA ROUTING ISSUES

### **Issue 5.1: "404 Not Found on page refresh"**

**Symptom**: Navigate to `/products`, refresh page → 404 error.

**Cause**: `.htaccess` not configured for SPA routing.

**Solution:**

**Frontend: `public_html/.htaccess`**
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Handle React Router - serve index.html for all routes
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [L]
</IfModule>
```

**Test:**
```bash
# Should return HTML, not 404
curl https://etchingxenial.biz.id/products
```

---

### **Issue 5.2: "Blank page on refresh (no 404)"**

**Symptom**: Refresh shows blank page, no errors.

**Cause**: React Router not handling route correctly.

**Solution:**

**Check Router configuration:**

```typescript
// src/App.tsx
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>  {/* Not HashRouter! */}
      <Routes>
        <Route path="/products" element={<Products />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**Check base path in vite.config.ts:**
```typescript
export default defineConfig({
  base: '/',  // Should be '/' for root domain
})
```

---

## 6. ENVIRONMENT VARIABLE ISSUES

### **Issue 6.1: "Environment variables are undefined"**

**Symptom**: `import.meta.env.VITE_API_BASE_URL` returns `undefined`.

**Cause**: Missing `VITE_` prefix or server not restarted.

**Solution:**

**1. Check .env file:**
```env
# Correct:
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Incorrect (missing VITE_ prefix):
API_BASE_URL=http://localhost:8000/api/v1
```

**2. Restart dev server:**
```bash
# Ctrl+C to stop
npm run dev  # Restart
```

**3. Verify env loaded:**
```javascript
// Browser console
console.log(import.meta.env);
// Should show all VITE_ variables
```

---

### **Issue 6.2: "Production build uses dev environment"**

**Symptom**: Production uses localhost URLs.

**Cause**: Wrong .env file or build command.

**Solution:**

**1. Check .env files:**
```bash
# Should have TWO separate files:
frontend/.env.development  # Dev config
frontend/.env.production   # Prod config
```

**2. Build with production mode:**
```bash
cd frontend
npm run build -- --mode production

# Or if package.json script configured:
npm run build  # Should use production mode by default
```

**3. Verify build uses production values:**
```bash
# Check built files
grep "localhost" dist/assets/*.js
# Should return nothing (no localhost in prod build)

grep "api.etchingxenial" dist/assets/*.js
# Should find production URL
```

---

## 7. BUILD & DEPLOY ERRORS

### **Issue 7.1: "npm run build fails with TypeScript errors"**

**Symptom**:
```
TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
```

**Cause**: TypeScript strict mode catching type errors.

**Solution:**

**Option A: Fix types (recommended):**
```typescript
// Before:
const apiUrl = import.meta.env.VITE_API_BASE_URL;

// After:
const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
```

**Option B: Temporarily disable strict mode:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": false  // Not recommended for production!
  }
}
```

---

### **Issue 7.2: "Composer install fails on production"**

**Symptom**:
```
Your requirements could not be resolved to an installable set of packages.
```

**Cause**: PHP version mismatch or missing extensions.

**Solution:**

**1. Check PHP version:**
```bash
php -v
# Should be 8.1+ or 8.2+
```

**2. Check required extensions:**
```bash
php -m | grep -E "pdo|pgsql|mbstring|xml|json"
```

**3. Install missing extensions:**
```bash
# Shared hosting: Contact hosting support
# VPS/Dedicated:
sudo apt-get install php8.2-pdo php8.2-pgsql php8.2-mbstring php8.2-xml
```

**4. Use correct composer version:**
```bash
# Use PHP 8.2 specifically
php8.2 /usr/local/bin/composer install --no-dev --optimize-autoloader
```

---

## 8. DATABASE CONNECTION ISSUES

### **Issue 8.1: "SQLSTATE[08006] Connection refused"**

**Symptom**: Cannot connect to database.

**Cause**: Wrong credentials or database not running.

**Solution:**

**1. Verify database is running:**
```bash
# PostgreSQL
sudo systemctl status postgresql

# Check connection
psql -h localhost -U username -d database_name
```

**2. Check .env credentials:**
```env
DB_CONNECTION=pgsql
DB_HOST=localhost  # or 127.0.0.1
DB_PORT=5432
DB_DATABASE=stencil_canvastack
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

**3. Test connection:**
```bash
php artisan db:show
# Should display database info
```

---

### **Issue 8.2: "Access denied for user"**

**Symptom**:
```
SQLSTATE[28000] Access denied for user 'username'@'localhost'
```

**Cause**: Wrong password or user doesn't have permissions.

**Solution:**

**1. Reset user password:**
```sql
-- PostgreSQL
ALTER USER username WITH PASSWORD 'new_password';

-- MySQL
ALTER USER 'username'@'localhost' IDENTIFIED BY 'new_password';
```

**2. Grant permissions:**
```sql
-- PostgreSQL
GRANT ALL PRIVILEGES ON DATABASE stencil_canvastack TO username;

-- MySQL
GRANT ALL PRIVILEGES ON stencil_canvastack.* TO 'username'@'localhost';
FLUSH PRIVILEGES;
```

---

## 9. PERFORMANCE PROBLEMS

### **Issue 9.1: "Frontend loads very slowly"**

**Symptom**: Page takes > 5s to load.

**Cause**: Large bundle size or no optimization.

**Solution:**

**1. Analyze bundle:**
```bash
cd frontend
npm run build

# Check bundle sizes
ls -lh dist/assets/
```

**2. Enable code splitting:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
})
```

**3. Lazy load routes:**
```typescript
// src/App.tsx
const ProductPage = lazy(() => import('./pages/Products'));

<Route path="/products" element={
  <Suspense fallback={<Loading />}>
    <ProductPage />
  </Suspense>
} />
```

---

### **Issue 9.2: "API responses very slow (> 2s)"**

**Symptom**: API calls take too long.

**Cause**: No database indexes, N+1 queries, or server overload.

**Solution:**

**1. Enable query logging:**
```bash
# backend/.env
DB_LOG_QUERIES=true
LOG_LEVEL=debug
```

**2. Check for N+1 queries:**
```php
// app/Http/Controllers/ProductController.php

// Bad (N+1):
$products = Product::all();
foreach ($products as $product) {
    $product->category; // Extra query for each product
}

// Good (eager loading):
$products = Product::with('category')->get();
```

**3. Add database indexes:**
```sql
-- Products table
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_at ON products(created_at);
```

**4. Enable caching:**
```bash
# backend/.env
CACHE_DRIVER=redis  # or 'file' if redis not available
```

---

## 10. FILE UPLOAD ISSUES

### **Issue 10.1: "File upload returns 413 Request Entity Too Large"**

**Symptom**: Large files fail to upload.

**Cause**: Server limits.

**Solution:**

**1. Increase PHP limits:**

**Edit `php.ini`:**
```ini
upload_max_filesize = 100M
post_max_size = 100M
memory_limit = 256M
max_execution_time = 300
```

**2. Check `.htaccess`:**
```apache
php_value upload_max_filesize 100M
php_value post_max_size 100M
php_value memory_limit 256M
php_value max_execution_time 300
```

**3. Check Nginx (if applicable):**
```nginx
client_max_body_size 100M;
```

**4. Restart server:**
```bash
# PHP-FPM
sudo systemctl restart php8.2-fpm

# Apache
sudo systemctl restart apache2
```

---

### **Issue 10.2: "File upload successful but file not saved"**

**Symptom**: Upload returns success, but file not in storage.

**Cause**: Permission issues.

**Solution:**

**1. Check storage permissions:**
```bash
cd backend
chmod -R 775 storage
chown -R www-data:www-data storage  # Linux/Unix
```

**2. Verify symlink:**
```bash
php artisan storage:link
# Creates: public/storage → storage/app/public
```

**3. Check storage path:**
```php
// app/Http/Controllers/UploadController.php
$path = $request->file('image')->store('uploads', 'public');
// File should be in: storage/app/public/uploads/

// Access via: /storage/uploads/filename.jpg
```

---

## 🔍 **DEBUGGING TIPS**

### **General Debugging Workflow**

1. **Check Browser Console** (F12)
   - JavaScript errors
   - Network requests
   - Console logs

2. **Check Network Tab**
   - Request/response
   - Status codes
   - Headers

3. **Check Backend Logs**
   ```bash
   tail -f backend/storage/logs/laravel.log
   ```

4. **Enable Debug Mode Temporarily**
   ```env
   APP_DEBUG=true  # Backend
   VITE_ENABLE_DEBUG=true  # Frontend
   ```

5. **Clear All Caches**
   ```bash
   # Backend
   php artisan cache:clear
   php artisan config:clear
   php artisan route:clear
   php artisan view:clear
   
   # Frontend
   rm -rf node_modules/.vite
   npm run dev
   ```

---

## 🆘 **STILL HAVING ISSUES?**

### **Escalation Path**

1. **Search Existing Documentation**
   - Check other roadmap documents
   - Review Laravel/React documentation

2. **Community Support**
   - Laravel forums: https://laracasts.com/discuss
   - React community: https://react.dev/community

3. **Professional Support**
   - Contact hosting provider
   - Hire Laravel/React consultant

4. **Document New Issues**
   - Add to this troubleshooting guide
   - Help future developers!

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-12-22  
**Next Document**: [6-SCRIPTS_AND_AUTOMATION.md](./6-SCRIPTS_AND_AUTOMATION.md)
