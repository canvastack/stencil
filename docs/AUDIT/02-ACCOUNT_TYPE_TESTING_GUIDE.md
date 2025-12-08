# Account Type Testing & Login Flow Guide

**Purpose**: Step-by-step guide to test both Platform Admin and Tenant User account types  
**Last Updated**: November 20, 2025

---

## Account Type Matrix

### Account A: Platform Administrator

```yaml
Purpose: Platform-level management
Type: Platform Owner
Credentials:
  Email: admin@canvastencil.com
  Password: SuperAdmin2024!
  
Authentication Endpoint: POST /api/v1/platform/login
Token Contains: account object (not user)
No Tenant Context: Null

Accessible Routes:
  - Platform Dashboard
  - Tenant Management
  - Subscriptions
  - Domains
  - Analytics
  
Restricted Routes:
  - /admin/products (tenant-specific)
  - /admin/orders (tenant-specific)
  - /admin/customers (tenant-specific)
  - All /admin routes require tenant context
```

### Account B: Tenant Business Users

```yaml
Purpose: Tenant business operations
Type: Tenant User
Tenant: PT. Custom Etching Xenial (etchinx)

Users:
  1. Admin (Full Permissions)
     Email: admin@etchinx.com
     Password: DemoAdmin2024!
     
  2. Manager (Operations)
     Email: manager@etchinx.com
     Password: DemoManager2024!
     
  3. Sales (Limited Permissions)
     Email: sales@etchinx.com
     Password: DemoSales2024!

Authentication Endpoint: POST /api/v1/tenant/login
Token Contains: user object + tenant object
Tenant Context: etchinx

Accessible Routes (All Users):
  - /admin/orders (with role-based filtering)
  - /admin/customers (with role-based filtering)
  - /admin/reviews
  - /admin/dashboard
  - /admin/profile

Accessible Routes (Admin Only):
  - /admin/products
  - /admin/users
  - /admin/roles
  - /admin/vendors
  - /admin/inventory
  - /admin/themes
  - /admin/settings

Accessible Routes (Admin & Manager):
  - /admin/financial-report
  - /admin/3d-manager
  - /admin/language
```

---

## Current Frontend Issue

### Login Flow Mismatch

**File**: `src/pages/Login.tsx`

**Current Implementation** (Lines 28-59):
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // ... validation ...
  
  try {
    await login({
      email: formData.email,
      password: formData.password,
    });
    // No account type selection - assumes tenant account
    navigate('/admin');
  } catch (err) {
    toast.error(error || 'Login gagal. Silahan coba lagi.');
  }
};
```

**Problem**: 
1. No way to select "Platform Admin" vs "Tenant User"
2. No tenant selection for tenant users
3. Calls generic `/auth/login` endpoint that doesn't exist
4. Both account types redirect to same `/admin` route

### Authentication Service

**File**: `src/services/api/auth.ts`

**Current Implementation** (Line 112):
```typescript
async login(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  // Assumes single endpoint
}
```

**Problems**:
1. Hardcoded `/auth/login` endpoint
2. No platform/tenant distinction
3. Doesn't handle response format differences:
   - Platform: Returns `account` field
   - Tenant: Returns `user` + `tenant` fields

---

## Testing Scenarios

### Scenario 1: Platform Admin Login (Account A)

**Prerequisites**:
- Backend running on `http://localhost:8000`
- PostgreSQL with seeded data

**Steps**:

1. **Navigate to Login Page**
   ```
   URL: http://localhost:3000/login
   ```

2. **Would Need To Use** (BLOCKED - no UI for this):
   ```
   Email: admin@canvastencil.com
   Password: SuperAdmin2024!
   Account Type: Platform Admin
   ```

3. **Expected API Call** (CURRENTLY NOT WORKING):
   ```
   POST /api/v1/platform/login
   {
     "email": "admin@canvastencil.com",
     "password": "SuperAdmin2024!"
   }
   ```

4. **Expected Response**:
   ```json
   {
     "access_token": "...",
     "token_type": "Bearer",
     "expires_in": 3600,
     "account": {
       "id": 1,
       "uuid": "...",
       "email": "admin@canvastencil.com",
       "name": "Super Administrator",
       "email_verified_at": "2025-11-20T...",
       "created_at": "2025-11-20T...",
       "updated_at": "2025-11-20T..."
     },
     "account_type": "platform_owner",
     "permissions": [
       "platform:read",
       "platform:write",
       "tenants:manage",
       "analytics:view"
     ]
   }
   ```

5. **Expected Frontend State After Login**:
   ```javascript
   // localStorage
   auth_token: "eyJ0eXAi..."
   user_id: "1"
   user: JSON.stringify(account) // Note: named 'user' but contains account data
   tenant_id: null // No tenant for platform admin
   tenant: null
   ```

6. **Expected Redirect**:
   ```
   URL: /admin
   Page: Dashboard (Platform view - shows tenants, not business data)
   ```

7. **Expected Sidebar Menu** (Platform View):
   - Dashboard
   - Tenant Management
   - Subscriptions
   - Domains
   - Analytics
   - System

---

### Scenario 2: Tenant Admin Login (Account B - Admin)

**Prerequisites**:
- Backend running on `http://localhost:8000`
- PostgreSQL with seeded data including etchinx tenant

**Steps**:

1. **Navigate to Login Page**
   ```
   URL: http://localhost:3000/login
   ```

2. **Would Need To Use** (BLOCKED - no UI for this):
   ```
   Email: admin@etchinx.com
   Password: DemoAdmin2024!
   Account Type: Tenant User
   Tenant: PT. Custom Etching Xenial (etchinx)
   ```

3. **Expected API Call** (CURRENTLY NOT WORKING):
   ```
   POST /api/v1/tenant/login
   {
     "email": "admin@etchinx.com",
     "password": "DemoAdmin2024!",
     "tenant_id": "uuid-of-etchinx-tenant"
   }
   ```

4. **Expected Response**:
   ```json
   {
     "access_token": "...",
     "token_type": "Bearer",
     "expires_in": 3600,
     "user": {
       "id": 2,
       "uuid": "...",
       "email": "admin@etchinx.com",
       "name": "John Admin",
       "email_verified_at": "2025-11-20T...",
       "created_at": "2025-11-20T...",
       "updated_at": "2025-11-20T...",
       "permissions": [
         "tenant:manage",
         "users:manage",
         "customers:manage",
         "products:manage",
         "orders:manage",
         "vendors:manage",
         "analytics:view",
         "settings:manage"
       ]
     },
     "tenant": {
       "id": 1,
       "uuid": "...",
       "name": "PT. Custom Etching Xenial",
       "slug": "etchinx",
       "domain": null
     },
     "account_type": "tenant_user",
     "roles": ["admin"]
   }
   ```

5. **Expected Frontend State After Login**:
   ```javascript
   // localStorage
   auth_token: "eyJ0eXAi..."
   user_id: "2"
   user: JSON.stringify(user_object)
   tenant_id: "uuid-of-etchinx"
   tenant: JSON.stringify(tenant_object)
   ```

6. **Expected Redirect**:
   ```
   URL: /admin
   Page: Dashboard (Tenant view - shows business metrics)
   Tenant Context: PT. Custom Etching Xenial
   ```

7. **Expected Sidebar Menu** (Tenant Admin View):
   - Dashboard
   - Content (Home, About, Contact, FAQ)
   - Products (Catalog, Categories, Reviews, 3D Manager)
   - Orders
   - Customers
   - Vendors
   - Inventory
   - Users & Roles
   - Financial Reports
   - Settings
   - Themes
   - Media Library

---

### Scenario 3: Tenant Manager Login (Account B - Manager)

**Steps** (Same as Scenario 2, different credentials):

1. **Login Credentials**:
   ```
   Email: manager@etchinx.com
   Password: DemoManager2024!
   ```

2. **Expected API Response**:
   - Same tenant context as admin
   - `roles: ["manager"]`
   - `permissions`: Limited set (no settings, users, roles)

3. **Expected Sidebar Menu** (Manager View):
   - Dashboard
   - Products
   - Orders
   - Customers
   - Vendors
   - Inventory
   - Financial Reports
   
   **Hidden Items**:
   - Content (admin only)
   - Users & Roles (admin only)
   - Themes (admin only)
   - Settings (admin only)

---

### Scenario 4: Tenant Sales Login (Account B - Sales)

**Steps** (Same as Scenario 2, different credentials):

1. **Login Credentials**:
   ```
   Email: sales@etchinx.com
   Password: DemoSales2024!
   ```

2. **Expected API Response**:
   - Same tenant context as admin
   - `roles: ["sales"]`
   - `permissions`: Minimal set (only customers, orders, analytics)

3. **Expected Sidebar Menu** (Sales View):
   - Dashboard
   - Orders
   - Customers
   - Financial Reports (read-only)

---

## Data Isolation Testing

### Test: Platform Admin Cannot See Tenant Data

**Goal**: Verify that platform account cannot access tenant-specific data even with direct API calls

1. **As Platform Admin** (admin@canvastencil.com):
   ```
   GET /api/v1/products
   Expected: 403 Forbidden or data not accessible
   
   GET /api/v1/orders
   Expected: 403 Forbidden or data not accessible
   
   GET /api/v1/customers
   Expected: 403 Forbidden or data not accessible
   ```

2. **Alternative** (Platform Can Access Platform Routes):
   ```
   GET /api/v1/platform/tenants
   Expected: 200 OK - Returns list of all tenants
   
   GET /api/v1/platform/analytics/overview
   Expected: 200 OK - Returns platform-wide analytics
   ```

### Test: Tenant Admin Cannot See Other Tenant Data

**Goal**: Verify that one tenant's data is isolated from another tenant

**Note**: Only etchinx tenant in current seeding, but this would apply if another tenant existed.

1. **As Tenant Admin** (admin@etchinx.com):
   ```
   GET /api/v1/products
   Expected: 200 OK - Returns etchinx products only
   
   // All requests automatically scoped to tenant schema
   // No way to access products from other tenants
   ```

---

## Frontend Accessibility Matrix

### By Account Type

| Feature | Platform Admin | Tenant Admin | Tenant Manager | Tenant Sales |
|---------|---|---|---|---|
| Dashboard | ✅ Platform | ✅ Business | ✅ Business | ✅ Business |
| Products | ❌ | ✅ Manage | ✅ View | ❌ |
| Orders | ❌ | ✅ Manage | ✅ Manage | ✅ View |
| Customers | ❌ | ✅ Manage | ✅ Manage | ✅ View |
| Users & Roles | ❌ | ✅ Manage | ❌ | ❌ |
| Vendors | ❌ | ✅ Manage | ✅ Manage | ❌ |
| Inventory | ❌ | ✅ Manage | ✅ Manage | ❌ |
| Themes | ❌ | ✅ Manage | ❌ | ❌ |
| Settings | ❌ | ✅ Manage | ❌ | ❌ |
| Financial | ❌ | ✅ Manage | ✅ View | ✅ View |
| Tenant Mgmt | ✅ Manage | ❌ | ❌ | ❌ |
| Subscriptions | ✅ Manage | ❌ | ❌ | ❌ |
| Analytics | ✅ Platform | ✅ Tenant | ✅ Tenant | ✅ Tenant |

---

## Current State vs Expected State

### Current State (BROKEN)

```
1. User navigates to /login
2. Enters email and password
3. Frontend calls (BROKEN) POST /auth/login
   - No endpoint exists at this path
   - Cannot distinguish account type
   - Cannot route to platform vs tenant endpoint
4. Login fails with 404 or undefined endpoint error
5. User cannot log in at all
```

### Expected State (After Fix)

```
1. User navigates to /login
2. Selects "Account Type":
   - Platform Admin
   - Tenant User (with tenant dropdown)
3. Enters email and password
4. Frontend determines endpoint:
   - Platform → POST /api/v1/platform/login
   - Tenant → POST /api/v1/tenant/login
5. Backend responds with account/user + tenant data
6. Frontend stores token and context
7. Frontend redirects to /admin with appropriate dashboard
8. Sidebar menu reflects user's permissions
```

---

## API Endpoint Reference

### Platform Authentication Endpoints

```
POST /api/v1/platform/login
  - Login platform account
  - Body: { email, password }
  - Response: { access_token, account, permissions }

POST /api/v1/platform/logout
  - Logout (requires auth)
  - Headers: Authorization: Bearer <token>

POST /api/v1/platform/refresh
  - Refresh token (requires auth)
  - Headers: Authorization: Bearer <token>

GET /api/v1/platform/me
  - Get current account info (requires auth)
  - Headers: Authorization: Bearer <token>
```

### Tenant Authentication Endpoints

```
POST /api/v1/tenant/login
  - Login tenant user
  - Body: { email, password, tenant_id }
  - Response: { access_token, user, tenant, roles, permissions }

POST /api/v1/tenant/context-login
  - Login with tenant from middleware context
  - Body: { email, password }
  - Headers: X-Tenant-ID: <tenant_id>
  - Response: { access_token, user, tenant, roles, permissions }

POST /api/v1/tenant/logout
  - Logout (requires auth)
  - Headers: Authorization: Bearer <token>

POST /api/v1/tenant/refresh
  - Refresh token (requires auth)
  - Headers: Authorization: Bearer <token>

GET /api/v1/tenant/me
  - Get current user info (requires auth)
  - Headers: Authorization: Bearer <token>
```

### Tenant Business Endpoints

```
GET /api/v1/products (scoped to tenant)
GET /api/v1/orders (scoped to tenant)
GET /api/v1/customers (scoped to tenant)
GET /api/v1/vendors (scoped to tenant)
GET /api/v1/inventory (scoped to tenant)
... etc
```

---

## Troubleshooting

### Issue: Login Page Shows Demo Credentials Only

**Current State**: Login page shows hardcoded demo credentials (Lines 138-141):
```typescript
<p>Email: <span className="font-mono text-foreground">demo@etching.com</span></p>
<p>Password: <span className="font-mono text-foreground">demo123</span></p>
```

**Problem**: Demo credentials don't match seeded accounts

**Solution**:
1. Update to show actual credentials:
   ```
   Platform: admin@canvastencil.com / SuperAdmin2024!
   Tenant: admin@etchinx.com / DemoAdmin2024!
   ```
2. Or add account type selector UI

---

### Issue: No Way to Select Account Type

**Current State**: Single email/password form - no account type selection

**Solution**:
1. Add radio buttons for account type:
   ```
   ○ Platform Administrator
   ○ Tenant User
   ```
2. Show tenant dropdown only if "Tenant User" selected
3. Dynamically route to correct endpoint based on selection

---

### Issue: Token Not Stored After Login

**If This Happens**:
1. Check browser console for API errors
2. Verify backend is running on `http://localhost:8000`
3. Check if CORS is enabled
4. Verify endpoint URLs are correct
5. Check localStorage after login (F12 → Application → Storage)

---

## Recommendations for Testing

1. **Start with Platform Account**
   - Simpler (no tenant selection)
   - Good for debugging login flow
   - Test if `/api/v1/platform/login` responds

2. **Then Test Tenant Account**
   - More complex (requires tenant context)
   - Uses both user and tenant objects
   - Test data isolation

3. **Test Role-Based Access**
   - Try logging in as Sales (limited access)
   - Try accessing unauthorized pages
   - Verify menu items reflect permissions

4. **Test Security**
   - Try modifying tenant_id in localStorage
   - Try accessing other tenant's data
   - Verify backend enforces isolation

5. **Test Cross-Browser**
   - Chrome (primary)
   - Firefox (localStorage differences)
   - Safari (if available)

---

## Document Metadata

- **Created**: November 20, 2025
- **Last Updated**: November 20, 2025
- **Version**: 1.0 - Initial Testing Guide
- **Status**: Ready for Testing Phase
- **Next Steps**: Implement account type selection UI
