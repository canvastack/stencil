# Account Type Implementation Guide

**Purpose**: Complete developer guide for implementing Platform Account vs Tenant Account separation  
**Created**: November 20, 2025  
**Status**: Ready for implementation (Phase 4 A Stage 1-2)  
**Audience**: Frontend & Backend developers

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Frontend Architecture](#frontend-architecture)
3. [Implementation Tasks](#implementation-tasks)
4. [Code Examples](#code-examples)
5. [Testing Scenarios](#testing-scenarios)
6. [Common Pitfalls](#common-pitfalls)

---

## Quick Reference

### Account Types Summary

| Aspect | Platform Admin | Tenant User |
|--------|---|---|
| **Type** | Account A | Account B |
| **Authentication Endpoint** | `/api/v1/platform/login` | `/api/v1/tenant/login` |
| **Database Access** | Landlord DB only | Tenant schema only |
| **Response Format** | `{ account, permissions }` | `{ user, tenant, permissions }` |
| **Email (Test)** | admin@canvastencil.com | admin@etchinx.com |
| **Password (Test)** | SuperAdmin2024! | DemoAdmin2024! |
| **Frontend Prefix** | `/admin` (platform) | `/admin` (tenant) |
| **Data Isolation** | Yes - no tenant access | Yes - single tenant only |
| **Permission Model** | Platform-level | Role-based per tenant |

---

## Frontend Architecture

### 1. Authentication Context Structure

```typescript
// src/types/auth.ts
export type AccountType = 'platform' | 'tenant';

export interface PlatformAccount {
  id: number;
  uuid: string;
  name: string;
  email: string;
  account_type: 'platform_owner';
  status: 'active';
  avatar?: string;
  permissions: string[];
}

export interface TenantUser {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  status: 'active';
  roles: string[];
  permissions: string[];
}

export interface TenantContext {
  id: string;
  uuid: string;
  name: string;
  slug: string;
  domain?: string;
  status: 'active';
  subscription_status: string;
  public_url: string;
  admin_url: string;
}

export interface AuthState {
  // Current session info
  accountType: AccountType | null;      // 'platform' or 'tenant'
  isAuthenticated: boolean;
  
  // Account data (mutually exclusive)
  account: PlatformAccount | null;      // Set if platform admin
  user: TenantUser | null;              // Set if tenant user
  tenant: TenantContext | null;         // Set if tenant user
  
  // Unified access for UI
  currentUser: (PlatformAccount | TenantUser) | null;
  permissions: string[];
  roles: string[];
  
  // Token management
  token: string | null;
  tokenExpiry: number | null;
  
  // Methods
  login: (email: string, password: string, accountType: AccountType, tenant?: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

### 2. Login Flow Diagram

```
User navigates to /login
           ↓
┌─────────────────────────────────┐
│ 1. Account Type Selection       │
│  □ Platform Admin               │
│  □ Tenant User                  │
└──────────┬──────────────────────┘
           ↓
        IF Platform Admin:
        └─→ Skip tenant selection
           ↓
        IF Tenant User:
        └─→ Show tenant dropdown
           ↓
┌─────────────────────────────────────┐
│ 2. Submit Credentials               │
│   Email: [user input]               │
│   Password: [user input]            │
│   Tenant: [selected] (if tenant)    │
└──────────┬──────────────────────────┘
           ↓
    Determine endpoint:
    Platform → /api/v1/platform/login
    Tenant   → /api/v1/tenant/login
           ↓
┌─────────────────────────────────────┐
│ 3. Backend Response Handler         │
│                                     │
│ Platform Response:                  │
│ {                                   │
│   access_token: "...",              │
│   account: {...},                   │
│   permissions: [...]                │
│ }                                   │
│                                     │
│ Tenant Response:                    │
│ {                                   │
│   access_token: "...",              │
│   user: {...},                      │
│   tenant: {...},                    │
│   permissions: [...]                │
│ }                                   │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 4. Store in Auth Context & LocalStorage
│                                     │
│ localStorage:                       │
│ - auth_token (JWT)                 │
│ - account_type ('platform'|'tenant')
│ - user_id (account id or user id)  │
│ - tenant_id (null or tenant uuid)  │
│                                     │
│ Context:                           │
│ - AuthState updated                │
│ - currentUser set                  │
│ - permissions loaded               │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 5. Route-Based Redirect             │
│                                     │
│ Platform Admin:                     │
│ └─→ /admin/dashboard (platform)    │
│                                     │
│ Tenant User:                        │
│ └─→ /admin/dashboard (tenant)      │
└─────────────────────────────────────┘
```

### 3. File Structure

```
src/
├── auth/
│   ├── authContext.tsx              # Main auth state & provider
│   ├── useAuth.ts                   # Hook to access auth
│   ├── ProtectedRoute.tsx           # Route guards
│   └── types.ts                     # TypeScript interfaces
├── services/
│   └── api/
│       └── auth.ts                  # Updated with dual endpoints
└── pages/
    ├── Login.tsx                    # Updated with account type selection
    └── admin/
        ├── (platform)/
        │   ├── Dashboard.tsx        # Platform dashboard
        │   ├── Tenants.tsx          # Tenant management
        │   └── ...
        └── (tenant)/
            ├── Dashboard.tsx        # Tenant dashboard
            ├── Orders.tsx           # Orders management
            └── ...
```

---

## Implementation Tasks

### TASK 1.0: Update AuthContext for Dual Account Types

**File**: `src/auth/authContext.tsx`

**Requirements**:
1. Add `accountType` field to state
2. Add `account` (Platform) and `user`/`tenant` (Tenant) fields
3. Implement login method with account type parameter
4. Route to correct endpoint based on account type
5. Handle different response formats

**Pseudo-code**:
```typescript
interface AuthContextType {
  accountType: 'platform' | 'tenant' | null;
  account: PlatformAccount | null;
  user: TenantUser | null;
  tenant: TenantContext | null;
  login: (email: string, password: string, accountType: AccountType, tenant?: string) => Promise<void>;
}

export const AuthProvider: React.FC = ({ children }) => {
  const login = async (email, password, accountType, tenant) => {
    const endpoint = accountType === 'platform'
      ? '/api/v1/platform/login'
      : '/api/v1/tenant/login';
    
    const response = await apiClient.post(endpoint, { email, password, tenant });
    
    // Handle platform response
    if (accountType === 'platform') {
      setAccount(response.account);
      setPermissions(response.permissions);
    }
    
    // Handle tenant response
    if (accountType === 'tenant') {
      setUser(response.user);
      setTenant(response.tenant);
      setPermissions(response.permissions);
    }
    
    // Store token
    localStorage.setItem('auth_token', response.access_token);
  };
};
```

---

### TASK 1.1: Update Login Page for Account Type Selection

**File**: `src/pages/Login.tsx`

**Requirements**:
1. Add account type radio buttons (Platform Admin / Tenant User)
2. Show tenant dropdown when Tenant User selected
3. Pass both accountType and tenant to login service
4. Handle different dashboards based on account type
5. Show error if account type not selected

**UI Elements**:
```typescript
// Account Type Selection
<div className="space-y-3">
  <label className="text-sm font-medium">Account Type</label>
  <div className="flex gap-4">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="accountType"
        value="platform"
        checked={accountType === 'platform'}
        onChange={(e) => setAccountType(e.target.value as AccountType)}
      />
      <span>Platform Admin</span>
    </label>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="accountType"
        value="tenant"
        checked={accountType === 'tenant'}
        onChange={(e) => setAccountType(e.target.value as AccountType)}
      />
      <span>Tenant User</span>
    </label>
  </div>
</div>

// Tenant Selection (shown only if tenant selected)
{accountType === 'tenant' && (
  <div className="space-y-2">
    <label className="text-sm font-medium">Select Tenant</label>
    <select
      value={selectedTenant}
      onChange={(e) => setSelectedTenant(e.target.value)}
      className="w-full border rounded px-3 py-2"
    >
      <option value="">Choose a tenant...</option>
      {tenants.map(t => (
        <option key={t.id} value={t.slug}>{t.name}</option>
      ))}
    </select>
  </div>
)}
```

---

### TASK 1.2: Update AuthService for Dual Endpoints

**File**: `src/services/api/auth.ts`

**Requirements**:
1. Rename `login()` to support both endpoints
2. Add `platform` parameter or create separate methods
3. Handle both response formats
4. Store account_type for later reference

**Implementation**:
```typescript
async login(
  credentials: LoginRequest,
  accountType: 'platform' | 'tenant',
  tenant?: string
): Promise<LoginResponse> {
  const endpoint = accountType === 'platform'
    ? '/api/v1/platform/login'
    : '/api/v1/tenant/login';
  
  const payload = {
    email: credentials.email,
    password: credentials.password,
    ...(tenant && { tenant_slug: tenant })
  };
  
  const response = await apiClient.post<LoginResponse>(endpoint, payload);
  return response;
}
```

---

### TASK 2.0: Create ProtectedRoute Component

**File**: `src/auth/ProtectedRoute.tsx`

**Requirements**:
1. Check user authentication
2. Check required roles
3. Check required permissions
4. Redirect to unauthorized page if denied
5. Support both platform and tenant routes

**Implementation**:
```typescript
interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  accountTypes?: ('platform' | 'tenant')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
  requiredRoles,
  requiredPermissions,
  accountTypes
}) => {
  const { accountType, roles, permissions, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (accountTypes && !accountTypes.includes(accountType)) {
    return <UnauthorizedPage reason="Account type mismatch" />;
  }
  
  if (requiredRoles && !requiredRoles.some(r => roles.includes(r))) {
    return <UnauthorizedPage reason="Insufficient role" />;
  }
  
  if (requiredPermissions && !requiredPermissions.every(p => permissions.includes(p))) {
    return <UnauthorizedPage reason="Insufficient permissions" />;
  }
  
  return <Component />;
};
```

---

### TASK 2.1: Update AdminLayout for Account Type Separation

**File**: `src/layouts/AdminLayout.tsx`

**Requirements**:
1. Render different sidebars based on account type
2. Show only authorized menu items
3. Implement menu item visibility based on roles
4. Support nested menu items

**Implementation**:
```typescript
export const AdminLayout: React.FC = () => {
  const { accountType, roles, permissions } = useAuth();
  
  const sidebarConfig = accountType === 'platform'
    ? PLATFORM_ADMIN_MENU
    : TENANT_USER_MENU;
  
  const visibleItems = sidebarConfig.filter(item => {
    if (!item.requiredRoles) return true;
    return roles.some(r => item.requiredRoles.includes(r));
  });
  
  return (
    <div className="flex h-screen">
      <AdminSidebar items={visibleItems} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
```

---

### TASK 2.2: Create AccountType-Aware Routes

**File**: `src/routes/admin.routes.tsx`

**Requirements**:
1. Separate routes for platform and tenant
2. All routes wrapped with ProtectedRoute
3. Clear route structure for maintenance
4. Support both account types

**Implementation**:
```typescript
const adminRoutes = [
  // Platform Admin Routes
  {
    path: 'dashboard',
    element: (
      <ProtectedRoute
        accountTypes={['platform']}
        component={PlatformDashboard}
      />
    )
  },
  {
    path: 'tenants',
    element: (
      <ProtectedRoute
        accountTypes={['platform']}
        requiredPermissions={['tenants:manage']}
        component={TenantManagement}
      />
    )
  },
  
  // Tenant User Routes
  {
    path: 'orders',
    element: (
      <ProtectedRoute
        accountTypes={['tenant']}
        component={OrderManagement}
      />
    )
  },
  {
    path: 'products',
    element: (
      <ProtectedRoute
        accountTypes={['tenant']}
        requiredRoles={['admin', 'manager']}
        component={ProductList}
      />
    )
  },
  // ... more routes
];
```

---

## Code Examples

### Example 1: Login with Account Type

```typescript
// src/pages/Login.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!accountType) {
    toast.error('Please select account type');
    return;
  }
  
  if (accountType === 'tenant' && !selectedTenant) {
    toast.error('Please select a tenant');
    return;
  }
  
  try {
    await login(
      { email, password },
      accountType,
      selectedTenant
    );
    
    const redirectUrl = accountType === 'platform'
      ? '/admin/dashboard'
      : '/admin/orders';
    
    navigate(redirectUrl);
  } catch (error) {
    toast.error('Login failed');
  }
};
```

### Example 2: Menu Item with Role Check

```typescript
// src/components/admin/AdminSidebar.tsx
const PLATFORM_ADMIN_MENU = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: 'LayoutDashboard',
    requiredRoles: []  // Available to all platform admins
  },
  {
    label: 'Tenants',
    href: '/admin/tenants',
    icon: 'Building',
    requiredRoles: [] // Only platform admins
  }
];

const TENANT_USER_MENU = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: 'LayoutDashboard',
    requiredRoles: [] // Available to all
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: 'ShoppingCart',
    requiredRoles: [] // Available to all
  },
  {
    label: 'Products',
    href: '/admin/products',
    icon: 'Package',
    requiredRoles: ['admin', 'manager'] // Admin + Manager only
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: 'Settings',
    requiredRoles: ['admin'] // Admin only
  }
];
```

### Example 3: Conditional Feature Access

```typescript
// src/components/admin/ProductList.tsx
export const ProductList: React.FC = () => {
  const { accountType, roles } = useAuth();
  const isAdmin = roles.includes('admin');
  const isManager = roles.includes('manager');
  
  return (
    <div>
      <h1>Products</h1>
      
      {/* Show create button only to admins */}
      {isAdmin && (
        <button onClick={handleCreate} className="btn btn-primary">
          Add Product
        </button>
      )}
      
      {/* Show edit/delete only to admins */}
      {table.map(product => (
        <tr key={product.id}>
          <td>{product.name}</td>
          <td>
            {isAdmin && (
              <>
                <button onClick={() => handleEdit(product.id)}>Edit</button>
                <button onClick={() => handleDelete(product.id)}>Delete</button>
              </>
            )}
          </td>
        </tr>
      ))}
    </div>
  );
};
```

---

## Testing Scenarios

### Test 1: Platform Admin Login

```
1. Navigate to /login
2. Select "Platform Admin"
3. Enter: admin@canvastencil.com / SuperAdmin2024!
4. No tenant selection shown
5. Login succeeds
6. Redirect to /admin/dashboard (platform version)
7. Sidebar shows: Dashboard, Tenants, Subscriptions, Domains, Analytics
8. Can access /admin/tenants
9. Cannot access /admin/orders (returns 403)
```

### Test 2: Tenant Admin Login

```
1. Navigate to /login
2. Select "Tenant User"
3. Select "etchinx" from dropdown
4. Enter: admin@etchinx.com / DemoAdmin2024!
5. Login succeeds
6. Redirect to /admin/dashboard (tenant version)
7. Sidebar shows: Dashboard, Orders, Customers, Products, Vendors, Users, Settings
8. Can access all menu items
9. Cannot access /admin/tenants (returns 403)
```

### Test 3: Tenant Manager Login

```
1. Navigate to /login
2. Select "Tenant User"
3. Select "etchinx" from dropdown
4. Enter: manager@etchinx.com / DemoManager2024!
5. Login succeeds
6. Sidebar shows: Dashboard, Orders, Customers, Reviews, Financial Report
7. Cannot access "Products" (admin only)
8. Cannot access "Users" (admin only)
9. Cannot access "Settings" (admin only)
```

### Test 4: Cross-Tenant Access Prevention

```
1. Login as admin@etchinx.com
2. URL-hack to /admin/customers?tenant=other-tenant
3. Page should redirect to /unauthorized
4. Backend should return 403
```

---

## Common Pitfalls

### ❌ Pitfall 1: Forgetting Account Type Check

```typescript
// WRONG - Platform admin could potentially access tenant routes
<Route path="/admin/orders" element={<OrderManagement />} />

// CORRECT - Must check account type
<Route 
  path="/admin/orders" 
  element={
    <ProtectedRoute
      accountTypes={['tenant']}
      component={OrderManagement}
    />
  } 
/>
```

### ❌ Pitfall 2: Storing Wrong User Info

```typescript
// WRONG - Platform admin doesn't have 'roles'
const { roles } = useAuth();
roles.includes('admin') // Could fail for platform admin

// CORRECT - Check account type first
const { accountType, roles } = useAuth();
if (accountType === 'platform') return true; // Platform admin is always admin-level
if (accountType === 'tenant') return roles.includes('admin');
```

### ❌ Pitfall 3: API Endpoint Hardcoding

```typescript
// WRONG - Only calls one endpoint
authService.login(credentials)

// CORRECT - Route to correct endpoint
authService.login(credentials, accountType, tenant)
```

### ❌ Pitfall 4: Inconsistent Response Handling

```typescript
// WRONG - Assumes all responses have 'user' field
const user = response.user; // Platform admin doesn't have this

// CORRECT - Check response structure
const currentUser = response.account || response.user;
const tenant = response.tenant || null;
```

### ❌ Pitfall 5: Client-Side Only Security

```typescript
// WRONG - Hidden menu items don't prevent URL access
if (isAdmin) {
  <MenuItem href="/admin/settings" />
}

// CORRECT - Server must validate too
<Route
  path="/admin/settings"
  element={
    <ProtectedRoute
      requiredRoles={['admin']}
      component={Settings}
    />
  }
/>
```

---

## Verification Checklist

Before marking blocker resolution as complete:

- [ ] **Blocker 1: Login**
  - [ ] Account type selection UI visible
  - [ ] Tenant dropdown shows for tenant users
  - [ ] Both endpoints called correctly
  - [ ] Token stored with account_type
  - [ ] Correct redirect based on account type

- [ ] **Blocker 2: Authorization**
  - [ ] ProtectedRoute component working
  - [ ] All /admin routes wrapped
  - [ ] Sidebar items filtered by permission
  - [ ] URL-hacking returns 403
  - [ ] Unauthorized page displays

- [ ] **Blocker 3: API Integration**
  - [ ] CustomerService returning real data
  - [ ] VendorService returning real data
  - [ ] InventoryService returning real data
  - [ ] PaymentService returning real data
  - [ ] Dashboard showing real metrics

---

## References

- `.zencoder/rules` - Development rules
- `docs/ARCHITECTURE/ADVANCED_SYSTEMS/1-MULTI_TENANT_ARCHITECTURE.md`
- `docs/ARCHITECTURE/ADVANCED_SYSTEMS/2-RBAC_PERMISSION_SYSTEM.md`
- `docs/ROADMAPS/PHASE_4_A_START_FRONTEND_BACKEND_INTEGRATION.md` (Critical Blockers section)
- `docs/AUDIT/01-AUTHENTICATION_AND_MULTI_TENANT_AUDIT.md`
- `docs/AUDIT/02-ACCOUNT_TYPE_TESTING_GUIDE.md`

---

**Document Version**: 1.0  
**Last Updated**: November 20, 2025  
**Status**: Ready for implementation
