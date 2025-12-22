# CONFIGURATION SETUP GUIDE
## Frontend & Backend Integration Configuration

**Version**: 1.0.0  
**Last Updated**: December 22, 2025  
**Estimated Time**: 1-2 hours  
**Difficulty**: 🟠 Medium-High  

---

## ✅ **COMPLETION STATUS**

**Status**: ✅ **COMPLETED**  
**Completed On**: December 23, 2025 (00:42 WIB)  
**Git Commit**: (pending)  

**Actual Results:**
- ✅ Frontend `.env.development`, `.env.production`, `.env.example` updated
- ✅ Centralized config file created: `frontend/src/lib/config.ts`
- ✅ Backend `.env.example` updated with CORS, Sanctum, Session config
- ✅ Backend `.env.production` template created
- ✅ Backend `config/cors.php` updated to use environment variables
- ✅ Backend `config/session.php` updated with SESSION_DOMAIN, SESSION_SECURE_COOKIE, SESSION_SAME_SITE
- ✅ Backend `config/sanctum.php` updated with localhost:5173 and SANCTUM_GUARD
- ✅ Both servers tested successfully:
  - Backend: `php artisan serve` (port 8000) ✅
  - Frontend: `npm run dev` (port 5173) ✅

**Next Steps**: Proceed to `3-DEPLOYMENT_GUIDE.md`

---

## 🎯 **OBJECTIVE**

Configure frontend dan backend untuk bekerja seamlessly baik di local development maupun production environment dengan proper CORS, session management, dan API integration.

---

## 📋 **CONFIGURATION CHECKLIST**

- [x] Frontend environment variables (.env files) ✅
- [x] Frontend Vite configuration ✅
- [x] Frontend API client setup ✅
- [x] Backend environment variables ✅
- [x] Backend CORS configuration ✅
- [x] Backend Session & Sanctum configuration ✅
- [x] Backend API routes verification ✅
- [x] Local development testing ✅
- [x] Production configuration preparation ✅

---

## 🔧 **FRONTEND CONFIGURATION**

### **File 1: `frontend/.env.development`**

```env
#################################################################
# FRONTEND DEVELOPMENT ENVIRONMENT
# Used when running: npm run dev
# Backend: http://localhost:8000
#################################################################

# API Base URLs (Local Laravel Backend)
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_PLATFORM_API_BASE_URL=http://localhost:8000/api/v1/platform
VITE_TENANT_API_BASE_URL=http://localhost:8000/api/v1/tenant

# Authentication
VITE_AUTH_TOKEN_KEY=stencil_auth_token
VITE_AUTH_USER_KEY=stencil_auth_user

# Session & Cookie
VITE_SESSION_DOMAIN=localhost
VITE_SECURE_COOKIE=false

# WebSocket (Optional - if using Laravel Reverb)
VITE_WS_URL=ws://localhost:6001
VITE_WS_KEY=your-reverb-app-key

# Feature Flags (Development)
VITE_ENABLE_DEBUG=true
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEVTOOLS=true

# App Info
VITE_APP_NAME=CanvaStencil
VITE_APP_VERSION=3.7.0
VITE_APP_ENV=development
```

---

### **File 2: `frontend/.env.production`**

```env
#################################################################
# FRONTEND PRODUCTION ENVIRONMENT
# Used when building: npm run build
# Backend: https://api.etchingxenial.biz.id
#################################################################

# API Base URLs (Production Backend)
VITE_API_BASE_URL=https://api.etchingxenial.biz.id/api/v1
VITE_PLATFORM_API_BASE_URL=https://api.etchingxenial.biz.id/api/v1/platform
VITE_TENANT_API_BASE_URL=https://api.etchingxenial.biz.id/api/v1/tenant

# Authentication
VITE_AUTH_TOKEN_KEY=stencil_auth_token
VITE_AUTH_USER_KEY=stencil_auth_user

# Session & Cookie
VITE_SESSION_DOMAIN=.etchingxenial.biz.id
VITE_SECURE_COOKIE=true

# WebSocket (Optional - if using Laravel Reverb)
VITE_WS_URL=wss://api.etchingxenial.biz.id:6001
VITE_WS_KEY=your-production-reverb-app-key

# Feature Flags (Production)
VITE_ENABLE_DEBUG=false
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEVTOOLS=false

# App Info
VITE_APP_NAME=CanvaStencil
VITE_APP_VERSION=3.7.0
VITE_APP_ENV=production
```

---

### **File 3: `frontend/.env.example`**

```env
# Copy this file to .env.development and .env.production
# Update values according to your environment

VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_PLATFORM_API_BASE_URL=http://localhost:8000/api/v1/platform
VITE_TENANT_API_BASE_URL=http://localhost:8000/api/v1/tenant

VITE_AUTH_TOKEN_KEY=stencil_auth_token
VITE_AUTH_USER_KEY=stencil_auth_user

VITE_SESSION_DOMAIN=localhost
VITE_SECURE_COOKIE=false

VITE_WS_URL=ws://localhost:6001
VITE_WS_KEY=

VITE_ENABLE_DEBUG=true
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEVTOOLS=true

VITE_APP_NAME=CanvaStencil
VITE_APP_VERSION=3.7.0
VITE_APP_ENV=development
```

---

### **File 4: `frontend/vite.config.ts`**

```typescript
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    
    server: {
      port: 5173,
      host: true,
      strictPort: true,
      
      // IMPORTANT: Proxy API requests to Laravel backend
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path, // Keep /api prefix
        },
        '/sanctum': {
          target: env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      minify: mode === 'production' ? 'terser' : false,
      chunkSizeWarningLimit: 1000,
      
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks for better caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            'monaco': ['@monaco-editor/react', 'monaco-editor'],
          },
        },
      },
    },
    
    define: {
      // Expose env variables to client
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION),
      __APP_ENV__: JSON.stringify(mode),
    },
  }
})
```

---

### **File 5: `frontend/src/lib/config.ts` (Create if not exists)**

```typescript
/**
 * Application Configuration
 * Centralized configuration using Vite environment variables
 */

export const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'CanvaStencil',
    version: import.meta.env.VITE_APP_VERSION || '3.7.0',
    env: import.meta.env.VITE_APP_ENV || 'development',
  },
  
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
    platformUrl: import.meta.env.VITE_PLATFORM_API_BASE_URL || 'http://localhost:8000/api/v1/platform',
    tenantUrl: import.meta.env.VITE_TENANT_API_BASE_URL || 'http://localhost:8000/api/v1/tenant',
    timeout: 30000, // 30 seconds
  },
  
  auth: {
    tokenKey: import.meta.env.VITE_AUTH_TOKEN_KEY || 'stencil_auth_token',
    userKey: import.meta.env.VITE_AUTH_USER_KEY || 'stencil_auth_user',
    sessionDomain: import.meta.env.VITE_SESSION_DOMAIN || 'localhost',
    secureCookie: import.meta.env.VITE_SECURE_COOKIE === 'true',
  },
  
  websocket: {
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:6001',
    key: import.meta.env.VITE_WS_KEY || '',
  },
  
  features: {
    debug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
    mockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
    devtools: import.meta.env.VITE_ENABLE_DEVTOOLS === 'true',
  },
  
  // Helper methods
  isDevelopment: () => import.meta.env.DEV,
  isProduction: () => import.meta.env.PROD,
} as const

// Type-safe access
export type AppConfig = typeof config
```

---

### **File 6: Update `frontend/src/lib/axios.ts` or API Client**

```typescript
import axios, { AxiosError, AxiosInstance } from 'axios'
import { config } from './config'

// Create axios instances for different contexts
export const apiClient: AxiosInstance = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  withCredentials: true, // IMPORTANT: Include cookies for Sanctum
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

export const platformApiClient: AxiosInstance = axios.create({
  baseURL: config.api.platformUrl,
  timeout: config.api.timeout,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

export const tenantApiClient: AxiosInstance = axios.create({
  baseURL: config.api.tenantUrl,
  timeout: config.api.timeout,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

// Request interceptor - Add auth token
const addAuthInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(config.auth.tokenKey)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )
}

// Response interceptor - Handle errors
const addResponseInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Unauthorized - clear auth and redirect to login
        localStorage.removeItem(config.auth.tokenKey)
        localStorage.removeItem(config.auth.userKey)
        window.location.href = '/login'
      }
      
      if (error.response?.status === 419) {
        // CSRF token mismatch - refresh CSRF token
        return refreshCSRFToken().then(() => {
          if (error.config) {
            return instance.request(error.config)
          }
        })
      }
      
      return Promise.reject(error)
    }
  )
}

// Apply interceptors
addAuthInterceptor(apiClient)
addAuthInterceptor(platformApiClient)
addAuthInterceptor(tenantApiClient)

addResponseInterceptor(apiClient)
addResponseInterceptor(platformApiClient)
addResponseInterceptor(tenantApiClient)

// CSRF token helper
async function refreshCSRFToken() {
  try {
    await axios.get(`${config.api.baseUrl.replace('/api/v1', '')}/sanctum/csrf-cookie`, {
      withCredentials: true,
    })
  } catch (error) {
    console.error('Failed to refresh CSRF token:', error)
  }
}

// Export convenience methods
export const api = {
  get: apiClient.get,
  post: apiClient.post,
  put: apiClient.put,
  patch: apiClient.patch,
  delete: apiClient.delete,
}

export default apiClient
```

---

### **File 7: `frontend/package.json` Scripts Update**

```json
{
  "scripts": {
    "dev": "vite --mode development",
    "build": "vite build --mode production",
    "build:dev": "vite build --mode development",
    "preview": "vite preview",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui"
  }
}
```

---

## 🔧 **BACKEND CONFIGURATION**

### **File 8: `backend/.env` (Local Development)**

```env
#################################################################
# BACKEND DEVELOPMENT ENVIRONMENT
# Local development configuration
#################################################################

APP_NAME="CanvaStencil"
APP_ENV=local
APP_KEY=base64:YOUR_APP_KEY_HERE  # php artisan key:generate
APP_DEBUG=true
APP_URL=http://localhost:8000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Database Configuration
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=stencil_canvastack
DB_USERNAME=postgres
DB_PASSWORD=your_database_password

# Session Configuration
SESSION_DRIVER=file
SESSION_LIFETIME=120
SESSION_DOMAIN=localhost
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax

# Laravel Sanctum Configuration
SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:3000,127.0.0.1:5173
SANCTUM_GUARD=api

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
CORS_ALLOWED_METHODS="GET,POST,PUT,PATCH,DELETE,OPTIONS"
CORS_ALLOWED_HEADERS="Content-Type,Authorization,X-Requested-With,X-CSRF-TOKEN"
CORS_EXPOSED_HEADERS=""
CORS_MAX_AGE=0
CORS_SUPPORTS_CREDENTIALS=true

# Cache & Queue
CACHE_DRIVER=file
QUEUE_CONNECTION=sync

# Mail (Development)
MAIL_MAILER=log
MAIL_FROM_ADDRESS="noreply@stencilcms.local"
MAIL_FROM_NAME="${APP_NAME}"

# Broadcasting (Optional - Laravel Reverb)
BROADCAST_DRIVER=log
REVERB_APP_ID=your-app-id
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_HOST=localhost
REVERB_PORT=6001
REVERB_SCHEME=http

# Multi-Tenancy
TENANT_DEFAULT_DATABASE=stencil_canvastack
TENANT_SCHEMA_PREFIX=tenant_

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=debug
```

---

### **File 9: `backend/.env.production` (Template for Production)**

```env
#################################################################
# BACKEND PRODUCTION ENVIRONMENT
# Production configuration template
# ⚠️ NEVER commit this file with real credentials!
#################################################################

APP_NAME="CanvaStencil"
APP_ENV=production
APP_KEY=base64:GENERATE_NEW_KEY_FOR_PRODUCTION  # CRITICAL: Different from dev!
APP_DEBUG=false
APP_URL=https://api.etchingxenial.biz.id

# Frontend URL
FRONTEND_URL=https://etchingxenial.biz.id

# Database Configuration (Use hosting provided credentials)
DB_CONNECTION=pgsql
DB_HOST=localhost  # Usually localhost on shared hosting
DB_PORT=5432
DB_DATABASE=your_production_database
DB_USERNAME=your_production_username
DB_PASSWORD=your_strong_production_password

# Session Configuration
SESSION_DRIVER=redis  # Recommended for production
SESSION_LIFETIME=120
SESSION_DOMAIN=.etchingxenial.biz.id  # Note the dot prefix for subdomain sharing
SESSION_SECURE_COOKIE=true  # HTTPS required
SESSION_SAME_SITE=none

# Redis Configuration (if using)
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Laravel Sanctum Configuration
SANCTUM_STATEFUL_DOMAINS=etchingxenial.biz.id,www.etchingxenial.biz.id,api.etchingxenial.biz.id
SANCTUM_GUARD=api

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://etchingxenial.biz.id,https://www.etchingxenial.biz.id
CORS_ALLOWED_METHODS="GET,POST,PUT,PATCH,DELETE,OPTIONS"
CORS_ALLOWED_HEADERS="Content-Type,Authorization,X-Requested-With,X-CSRF-TOKEN"
CORS_EXPOSED_HEADERS=""
CORS_MAX_AGE=3600
CORS_SUPPORTS_CREDENTIALS=true

# Cache & Queue
CACHE_DRIVER=redis  # Recommended for production
QUEUE_CONNECTION=redis

# Mail (Production SMTP)
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-smtp-username
MAIL_PASSWORD=your-smtp-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@etchingxenial.biz.id"
MAIL_FROM_NAME="${APP_NAME}"

# Broadcasting (Production - Laravel Reverb with SSL)
BROADCAST_DRIVER=reverb
REVERB_APP_ID=production-app-id
REVERB_APP_KEY=production-app-key
REVERB_APP_SECRET=production-app-secret
REVERB_HOST=api.etchingxenial.biz.id
REVERB_PORT=6001
REVERB_SCHEME=https

# Multi-Tenancy
TENANT_DEFAULT_DATABASE=stencil_canvastack_production
TENANT_SCHEMA_PREFIX=tenant_

# Logging
LOG_CHANNEL=daily
LOG_LEVEL=warning

# Performance
OCTANE_SERVER=swoole  # Optional: For high performance
```

---

### **File 10: `backend/config/cors.php`**

```php
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => explode(',', env('CORS_ALLOWED_METHODS', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')),

    'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')),

    'allowed_origins_patterns' => [],

    'allowed_headers' => explode(',', env('CORS_ALLOWED_HEADERS', 'Content-Type,Authorization,X-Requested-With,X-CSRF-TOKEN')),

    'exposed_headers' => explode(',', env('CORS_EXPOSED_HEADERS', '')),

    'max_age' => (int) env('CORS_MAX_AGE', 0),

    'supports_credentials' => env('CORS_SUPPORTS_CREDENTIALS', 'true') === 'true',
];
```

---

### **File 11: `backend/config/session.php` (Verify)**

```php
<?php

use Illuminate\Support\Str;

return [
    'driver' => env('SESSION_DRIVER', 'file'),
    
    'lifetime' => env('SESSION_LIFETIME', 120),
    
    'expire_on_close' => false,
    
    'encrypt' => false,
    
    'files' => storage_path('framework/sessions'),
    
    'connection' => env('SESSION_CONNECTION'),
    
    'table' => 'sessions',
    
    'store' => env('SESSION_STORE'),
    
    'lottery' => [2, 100],
    
    'cookie' => env(
        'SESSION_COOKIE',
        Str::slug(env('APP_NAME', 'laravel'), '_').'_session'
    ),
    
    // CRITICAL for cross-subdomain sessions
    'path' => '/',
    
    // CRITICAL: Share cookies across subdomains
    'domain' => env('SESSION_DOMAIN', null),
    
    // CRITICAL: Must be true in production with HTTPS
    'secure' => env('SESSION_SECURE_COOKIE', false),
    
    'http_only' => true,
    
    // CRITICAL: 'none' for cross-domain, 'lax' for same-domain
    'same_site' => env('SESSION_SAME_SITE', 'lax'),
];
```

---

### **File 12: `backend/config/sanctum.php` (Verify)**

```php
<?php

return [
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
        env('APP_URL') ? ','.parse_url(env('APP_URL'), PHP_URL_HOST) : ''
    ))),

    'guard' => ['api'],

    'expiration' => null,

    'middleware' => [
        'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
        'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
    ],
];
```

---

## ✅ **VERIFICATION STEPS**

### **Step 1: Verify Environment Files**

```powershell
# Frontend
Test-Path frontend\.env.development  # Should be True
Test-Path frontend\.env.production   # Should be True

# Backend
Test-Path backend\.env               # Should be True
```

### **Step 2: Start Development Servers**

**Terminal 1: Backend**
```bash
cd backend
php artisan serve
# Should show: Laravel development server started on http://localhost:8000
```

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
# Should show: Local: http://localhost:5173/
```

### **Step 3: Test CORS & API Connection**

**Open Browser Console** at `http://localhost:5173`

```javascript
// Test CSRF cookie endpoint
fetch('http://localhost:8000/sanctum/csrf-cookie', {
  credentials: 'include'
})
  .then(r => r.text())
  .then(console.log)
  .catch(console.error)

// Test API health endpoint
fetch('http://localhost:8000/api/v1/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Expected**: No CORS errors, successful responses.

### **Step 4: Test Authentication Flow**

1. Navigate to login page: `http://localhost:5173/login`
2. Try Platform Admin login: `admin@canvastencil.com`
3. Check Network tab for:
   - CSRF token request to `/sanctum/csrf-cookie`
   - Login POST to `/api/v1/platform/auth/login`
   - Successful response with token
   - No CORS errors

---

## 🐛 **COMMON ISSUES**

### **Issue: CORS Error "No 'Access-Control-Allow-Origin' header"**

**Solution**:
```env
# backend/.env
CORS_ALLOWED_ORIGINS=http://localhost:5173
CORS_SUPPORTS_CREDENTIALS=true
```

```bash
cd backend
php artisan config:clear
php artisan config:cache
```

---

### **Issue: 419 CSRF Token Mismatch**

**Solution**:
1. Ensure `withCredentials: true` in axios config
2. Call `/sanctum/csrf-cookie` before login
3. Check `SESSION_DOMAIN` is correct

```typescript
// Before login
await axios.get('http://localhost:8000/sanctum/csrf-cookie', {
  withCredentials: true
})

// Then login
await axios.post('http://localhost:8000/api/v1/auth/login', credentials, {
  withCredentials: true
})
```

---

### **Issue: Session Not Persisting**

**Solution**:
```env
# backend/.env
SESSION_DOMAIN=localhost  # No dot prefix for localhost
SESSION_SECURE_COOKIE=false  # False for HTTP
SESSION_SAME_SITE=lax

# Production
SESSION_DOMAIN=.etchingxenial.biz.id  # Dot prefix for subdomain sharing
SESSION_SECURE_COOKIE=true  # True for HTTPS
SESSION_SAME_SITE=none
```

---

## 🎯 **NEXT STEPS**

1. ✅ Complete configuration setup
2. ✅ Test local development
3. ➡️ Proceed to **`3-DEPLOYMENT_GUIDE.md`** for production deployment

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-12-22  
**Next Document**: [3-DEPLOYMENT_GUIDE.md](./3-DEPLOYMENT_GUIDE.md)
