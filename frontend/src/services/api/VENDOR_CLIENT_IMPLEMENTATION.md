# Vendor API Client Implementation

**Date:** February 12, 2026  
**Issue:** Token refresh error on vendor login  
**Solution:** Separate vendor API client without token refresh

---

## Problem

When vendors tried to login, they encountered this error:

```
[ERROR] Token refresh failed: The route api/v1/auth/refresh could not be found.
Status: 404
```

### Root Cause

1. Vendor portal was using the shared `apiClient.ts` 
2. `apiClient` has automatic token refresh logic for tenant/platform auth
3. On 401 errors, it tried to call `/api/v1/auth/refresh` (tenant endpoint)
4. Vendor authentication uses **Laravel Sanctum tokens** (24-hour session)
5. Sanctum tokens **don't need refresh** - they're session-based

---

## Solution

Created a dedicated `vendorClient.ts` that:

✅ **No Token Refresh Logic** - Sanctum tokens are session-based  
✅ **Separate Token Storage** - Uses `vendor_token` instead of `auth_token`  
✅ **Vendor-Specific Error Handling** - Logout on 401 without refresh attempt  
✅ **Automatic Tenant Scoping** - Adds `X-Tenant-ID` header  
✅ **Clean Session Management** - Clears vendor data on logout  

---

## Files Created/Modified

### 1. Created: `frontend/src/services/api/vendorClient.ts`

**Purpose:** Dedicated API client for vendor portal

**Key Features:**
- Axios instance configured for vendor endpoints
- Request interceptor: Adds `Bearer` token and `X-Tenant-ID`
- Response interceptor: Handles 401 by logging out (no refresh)
- Error formatting for consistent error handling
- Logging for debugging

**Key Differences from `client.ts`:**

| Feature | `client.ts` (Tenant/Platform) | `vendorClient.ts` (Vendor) |
|---------|-------------------------------|----------------------------|
| Token Refresh | ✅ Yes (`/auth/refresh`) | ❌ No (Sanctum session) |
| Token Storage | `auth_token` | `vendor_token` |
| 401 Handling | Refresh token → Retry | Logout immediately |
| Session Type | JWT with refresh | Sanctum 24-hour session |
| Base URL | `/api/v1` | `/api/v1` |

### 2. Modified: `frontend/src/services/api/vendorApi.ts`

**Changes:**
- Import changed from `apiClient` to `vendorApiClient`
- All API calls now use `vendorApiClient` instead of `apiClient`
- No other logic changes needed

**Before:**
```typescript
import apiClient from './client';
const response = await apiClient.post('/vendor/auth/login', credentials);
```

**After:**
```typescript
import vendorApiClient from './vendorClient';
const response = await vendorApiClient.post('/vendor/auth/login', credentials);
```

---

## How It Works

### Authentication Flow

```
1. Vendor Login
   ↓
2. POST /api/v1/vendor/auth/login
   ↓
3. Backend returns Sanctum token
   ↓
4. vendorApiClient stores token in localStorage
   - Key: 'vendor_token'
   - Value: Sanctum token (valid 24 hours)
   ↓
5. All subsequent requests include:
   - Authorization: Bearer {token}
   - X-Tenant-ID: {tenant_id}
```

### Error Handling Flow

```
1. API Request with expired/invalid token
   ↓
2. Backend returns 401 Unauthorized
   ↓
3. vendorApiClient response interceptor catches 401
   ↓
4. NO TOKEN REFRESH ATTEMPT (key difference!)
   ↓
5. Clear vendor auth data:
   - vendor_token
   - vendor_user
   - vendor_profile
   - vendor_login_timestamp
   ↓
6. Redirect to /vendor/login
```

### Comparison with Tenant Auth

**Tenant/Platform Auth (client.ts):**
```
401 Error → Try refresh token → Success? Retry request : Logout
```

**Vendor Auth (vendorClient.ts):**
```
401 Error → Logout immediately (no refresh)
```

---

## Token Storage Separation

### Vendor Portal Storage Keys

```typescript
vendor_token              // Sanctum token
vendor_user               // VendorUser object
vendor_profile            // VendorProfile object
vendor_login_timestamp    // Login time for grace period
```

### Tenant/Platform Storage Keys

```typescript
auth_token                // JWT token
refresh_token             // JWT refresh token
user_id                   // User ID
tenant_id                 // Tenant ID
login_timestamp           // Login time
```

**Why Separate?**
- Prevents conflicts between vendor and tenant auth
- Allows vendor to be logged in while admin is logged in (different browser tabs)
- Clear separation of concerns
- Easier debugging

---

## Testing

### Test Vendor Login

```bash
# 1. Start frontend
cd frontend
npm run dev

# 2. Navigate to vendor login
http://localhost:5173/vendor/login

# 3. Login with test credentials
Email: vendor@etchinx.com
Password: [your password]

# 4. Check console - should NOT see token refresh errors
# 5. Check localStorage
localStorage.getItem('vendor_token')  // Should have token
localStorage.getItem('auth_token')    // Should be null (no conflict)
```

### Test Session Expiration

```javascript
// In browser console after login

// 1. Manually expire token
localStorage.setItem('vendor_token', 'invalid_token');

// 2. Try to access protected route
// Navigate to: http://localhost:5173/vendor/dashboard

// 3. Should see:
// - Console: "Vendor session expired (401), logging out"
// - Redirect to: /vendor/login
// - NO token refresh attempt
```

### Test Logout

```javascript
// In browser console after login

// 1. Check stored data
console.log('Token:', localStorage.getItem('vendor_token'));
console.log('User:', localStorage.getItem('vendor_user'));

// 2. Click logout button

// 3. Verify cleanup
console.log('Token:', localStorage.getItem('vendor_token'));  // null
console.log('User:', localStorage.getItem('vendor_user'));    // null
```

---

## Benefits

### 1. Clean Separation of Concerns
- Vendor auth logic completely separate from tenant/platform
- No risk of conflicts or interference
- Easier to maintain and debug

### 2. Correct Sanctum Implementation
- No unnecessary token refresh attempts
- Follows Laravel Sanctum best practices
- 24-hour session management

### 3. Better Error Handling
- Clear error messages for vendors
- Immediate logout on session expiration
- No confusing "token refresh failed" errors

### 4. Performance
- No wasted API calls trying to refresh Sanctum tokens
- Faster error handling (no retry logic)
- Reduced server load

### 5. Security
- Separate token storage prevents token leakage
- Clear session boundaries
- Proper logout cleanup

---

## Migration Notes

### For Existing Code

If you have existing code using `apiClient` for vendor endpoints, update it:

**Before:**
```typescript
import apiClient from '@/services/api/client';
const response = await apiClient.post('/vendor/quotes/123/accept', data);
```

**After:**
```typescript
import vendorApiClient from '@/services/api/vendorClient';
const response = await vendorApiClient.post('/vendor/quotes/123/accept', data);
```

### For New Code

Always use `vendorApiClient` for vendor portal endpoints:

```typescript
import vendorApiClient from '@/services/api/vendorClient';

// ✅ Correct
await vendorApiClient.get('/vendor/quotes');
await vendorApiClient.post('/vendor/auth/login', credentials);

// ❌ Wrong - don't use apiClient for vendor endpoints
await apiClient.get('/vendor/quotes');
```

---

## Troubleshooting

### Issue: Still seeing token refresh errors

**Solution:** Clear browser cache and localStorage
```javascript
localStorage.clear();
location.reload();
```

### Issue: Vendor can't login

**Check:**
1. Backend is running: `http://localhost:8000`
2. Vendor has portal access enabled
3. Vendor status is "active"
4. Onboarding is completed

**Debug:**
```javascript
// Check API client
import vendorApiClient from '@/services/api/vendorClient';
console.log('Authenticated:', vendorApiClient.isAuthenticated());
console.log('Token:', localStorage.getItem('vendor_token'));
```

### Issue: 401 errors on every request

**Possible causes:**
1. Token expired (24 hours passed)
2. Token invalid (manually modified)
3. Backend session expired
4. CORS issues

**Solution:**
1. Logout and login again
2. Check backend logs
3. Verify CORS configuration

---

## Future Enhancements

### Potential Improvements

1. **Token Expiration Warning**
   - Show warning 1 hour before token expires
   - Prompt vendor to save work

2. **Activity Tracking**
   - Track last activity timestamp
   - Auto-logout after inactivity

3. **Remember Me**
   - Optional longer session (7 days)
   - Secure token storage

4. **Multi-Device Management**
   - Show active sessions
   - Logout from specific devices

---

## References

- **Laravel Sanctum Docs:** https://laravel.com/docs/sanctum
- **Axios Interceptors:** https://axios-http.com/docs/interceptors
- **Vendor Portal Design:** `.kiro/specs/vendor-portal-implementation/design.md`
- **API Documentation:** `openapi/VENDOR_PORTAL_API.md`

---

## Summary

✅ **Problem Solved:** Token refresh error eliminated  
✅ **Clean Implementation:** Separate vendor API client  
✅ **Best Practices:** Follows Sanctum session management  
✅ **No Breaking Changes:** Existing code continues to work  
✅ **Better UX:** Clear error messages, proper logout flow  

**Status:** COMPLETE ✅  
**Ready for:** Production use

