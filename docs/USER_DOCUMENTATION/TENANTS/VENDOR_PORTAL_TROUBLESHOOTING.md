# Vendor Portal Troubleshooting Guide
## Common Issues and Solutions

**Version:** 1.0  
**Last Updated:** February 12, 2026  
**For:** PT CEX Technical Team & Developers

---

## 🔴 Critical Issue: Token Refresh Error on Login

### Symptom

When vendor tries to login, they see error in console:
```
[ERROR] Token refresh failed: The route api/v1/auth/refresh could not be found.
Status: 404
```

### Root Cause

The vendor portal is using the shared `apiClient` which attempts to refresh tokens using the tenant auth endpoint `/api/v1/auth/refresh`. However, **vendor authentication uses Laravel Sanctum tokens that don't require refresh**.

### Why This Happens

1. **Shared API Client**: Vendor API uses the same `apiClient.ts` as tenant/platform auth
2. **Token Refresh Logic**: `apiClient` has automatic token refresh on 401 errors
3. **Wrong Endpoint**: Tries to call `/api/v1/auth/refresh` (tenant endpoint) instead of vendor endpoint
4. **Sanctum Design**: Vendor uses Sanctum tokens (24-hour session), not refresh tokens

### Solution Options

#### Option 1: Disable Token Refresh for Vendor (Recommended)

Vendor tokens are valid for 24 hours and don't need refresh. Modify `client.ts` to skip refresh for vendor routes:

```typescript
// frontend/src/services/api/client.ts

private async handleTokenRefresh(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
  // Skip token refresh for vendor routes
  if (config.url?.includes('/vendor/')) {
    this.log('info', 'Skipping token refresh for vendor route');
    this.logout();
    return Promise.reject(new Error('Vendor session expired'));
  }

  // ... existing refresh logic for tenant/platform
}
```

#### Option 2: Create Vendor-Specific API Client

Create a separate API client for vendor that doesn't have token refresh:

```typescript
// frontend/src/services/api/vendorClient.ts

class VendorApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/v1`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor - add token
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('vendor_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }
    );

    // Response interceptor - handle 401 without refresh
    this.instance.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          // Session expired, logout vendor
          localStorage.removeItem('vendor_token');
          localStorage.removeItem('vendor_user');
          localStorage.removeItem('vendor_profile');
          window.location.href = '/vendor/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ... API methods
}
```

#### Option 3: Add Vendor Refresh Endpoint (Not Recommended)

Add `/api/v1/vendor/auth/refresh` endpoint in backend, but this is unnecessary for Sanctum tokens.

### Immediate Workaround

For development/testing, you can temporarily disable token refresh in `client.ts`:

```typescript
// frontend/src/services/api/client.ts
private async handleTokenRefresh(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
  // TEMPORARY: Skip all token refresh
  this.logout();
  return Promise.reject(new Error('Session expired'));
}
```

---

## 🟡 Issue: Vendor Cannot Access Portal After Login

### Symptom

Vendor logs in successfully but gets redirected back to login page or sees "Access Denied" error.

### Possible Causes

1. **Portal Access Not Enabled**
   - Check: `vendors.portal_access_enabled = false`
   - Solution: Admin must enable portal access

2. **Onboarding Not Completed**
   - Check: `vendors.onboarding_status != 'completed'`
   - Solution: Vendor must complete onboarding steps

3. **Vendor Status Not Active**
   - Check: `vendors.status != 'active'`
   - Solution: Admin must activate vendor

4. **Token Not Stored**
   - Check: `localStorage.getItem('vendor_token')` is null
   - Solution: Check login response and token storage logic

### Debugging Steps

```javascript
// In browser console after login attempt
console.log('Token:', localStorage.getItem('vendor_token'));
console.log('User:', JSON.parse(localStorage.getItem('vendor_user') || '{}'));
console.log('Profile:', JSON.parse(localStorage.getItem('vendor_profile') || '{}'));

// Check vendor status
const profile = JSON.parse(localStorage.getItem('vendor_profile') || '{}');
console.log('Portal Access:', profile.portal_access_enabled);
console.log('Onboarding:', profile.onboarding_status);
console.log('Status:', profile.status);
```

---

## 🟡 Issue: CORS Errors on API Calls

### Symptom

```
Access to XMLHttpRequest at 'http://localhost:8000/api/v1/vendor/auth/login' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

### Solution

Update backend CORS configuration:

```php
// backend/config/cors.php
return [
    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'vendor/*',  // Add this
    ],
    
    'allowed_origins' => [
        'http://localhost:5173',
        'http://localhost:3000',
    ],
    
    'allowed_methods' => ['*'],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

---

## 🟡 Issue: Tenant Isolation Not Working

### Symptom

Vendor can see quotes from other tenants or gets "Vendor does not belong to this tenant" error.

### Solution

Ensure middleware is properly configured:

```php
// backend/routes/api/vendor.php
Route::prefix('vendor')->group(function () {
    Route::middleware([
        'auth:sanctum',
        'vendor.auth',      // Verify vendor account
        'vendor.tenant',    // Enforce tenant scoping
    ])->group(function () {
        // Protected vendor routes
    });
});
```

Check vendor-tenant relationship:

```php
// In tinker
$vendor = Vendor::find($vendorId);
echo $vendor->tenant_id;  // Should match current tenant

$user = User::find($userId);
echo $user->vendor_id;    // Should match vendor ID
```

---

## 🟢 Best Practices for Development

### 1. Use Separate Storage Keys

Vendor auth should use separate localStorage keys from tenant auth:

```typescript
// Vendor keys
vendor_token
vendor_user
vendor_profile
vendor_login_timestamp

// Tenant keys (don't mix!)
auth_token
user_id
tenant_id
```

### 2. Clear Auth State on Logout

Always clear all vendor-related data:

```typescript
const clearVendorAuth = () => {
  localStorage.removeItem('vendor_token');
  localStorage.removeItem('vendor_user');
  localStorage.removeItem('vendor_profile');
  localStorage.removeItem('vendor_login_timestamp');
};
```

### 3. Handle 401 Errors Gracefully

Don't try to refresh vendor tokens, just logout:

```typescript
if (error.response?.status === 401) {
  clearVendorAuth();
  window.location.href = '/vendor/login';
}
```

### 4. Test with Real Vendor Data

Always test with properly onboarded vendors:

```bash
# Create test vendor
php artisan tinker

$vendor = Vendor::factory()->create([
    'tenant_id' => $tenantId,
    'portal_access_enabled' => true,
    'onboarding_status' => 'completed',
    'status' => 'active',
]);

$user = User::factory()->create([
    'email' => 'vendor@test.com',
    'password' => bcrypt('password123'),
    'account_type' => 'vendor',
    'vendor_id' => $vendor->id,
]);
```

---

## 📞 Support

For additional help:
- **Email:** support@ptcex.com
- **Phone:** +62 21 1234 5678
- **Emergency:** +62 812 3456 7890

---

**Document Version:** 1.0  
**Last Updated:** February 12, 2026

