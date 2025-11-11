# USER & ROLE MANAGEMENT MODULE
## Database Schema & API Documentation

**Module:** Multi-Tenant User Management & RBAC  
**Total Fields:** 180+ fields  
**Total Tables:** 9 tables (users, tenant_users, roles, permissions, role_permissions, user_roles, user_permissions, resource_permissions, permission_groups)  
**Admin Pages:** `src/pages/admin/UserManagement.tsx`, `src/pages/admin/RoleManagement.tsx`, `src/pages/admin/PermissionManagement.tsx`  
**Type Definition:** `src/types/user.ts`, `src/types/role.ts`, `src/types/permission.ts`

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Business Context](#business-context)
3. [Database Schema](#database-schema)
4. [Relationship Diagram](#relationship-diagram)
5. [Field Specifications](#field-specifications)
6. [Business Rules](#business-rules)
7. [Permission System](#permission-system)
8. [API Endpoints](#api-endpoints)
9. [Admin UI Features](#admin-ui-features)
10. [Sample Data](#sample-data)
11. [Migration Script](#migration-script)
12. [Performance Indexes](#performance-indexes)

---

## OVERVIEW

Modul User & Role Management adalah **foundation keamanan** dari platform Stencil CMS multi-tenant. Sistem ini mengimplementasikan sophisticated Role-Based Access Control (RBAC) dengan support untuk multi-tenant environment, memastikan data isolation, granular permission control, dan audit trail compliance.

### Core Features

1. **Multi-Tenant User Management**
   - Centralized user authentication (landlord schema)
   - User-tenant relationships (many-to-many)
   - Single sign-on across multiple tenants
   - User dapat memiliki different roles di different tenants
   - Email-based authentication with Laravel Sanctum

2. **Advanced RBAC System**
   - Hierarchical role structure dengan inheritance
   - Tenant-scoped roles (per tenant customization)
   - Platform-level roles (super admin, support)
   - Granular permissions (CRUD + custom actions)
   - Resource-based permissions (object-level access control)
   - Permission groups untuk logical organization

3. **Permission Types**
   - **Static Permissions**: Predefined system permissions (e.g., `products.create`, `orders.view`)
   - **Dynamic Permissions**: Runtime permission checks (e.g., `order:123:approve`)
   - **Resource Permissions**: ACL per resource instance (e.g., "User X can edit Product Y")
   - **Wildcard Permissions**: Bulk permissions (e.g., `products.*` = all product operations)
   - **Negative Permissions**: Explicit deny rules (override allows)

4. **Security Features**
   - Password hashing with bcrypt (Laravel default)
   - Email verification workflow
   - Two-factor authentication (2FA) support
   - Password reset via email
   - Account lockout after failed login attempts
   - Session management & token revocation
   - IP whitelist/blacklist per user

5. **Audit Trail & Compliance**
   - Complete activity logging
   - Permission change tracking
   - Login history with IP & device info
   - Failed login attempt tracking
   - User action logs for compliance (SOC2, GDPR)

6. **User Profile Management**
   - Customizable user profiles
   - Avatar/profile picture upload
   - Multi-timezone support
   - Language preference
   - Notification preferences
   - Custom metadata (JSONB)

---

## BUSINESS CONTEXT

### Multi-Tenant User Model

**Stencil CMS** menggunakan **hybrid multi-tenant architecture**:

- **Landlord Schema (Central)**: 
  - `users` table - Single source of truth untuk all user accounts
  - `tenants` table - List of all tenants (companies/businesses)
  - `tenant_users` table - Pivot table linking users to tenants dengan roles

- **Tenant Schema (Per-Tenant)**:
  - Tenant-specific data (products, orders, content)
  - NO duplicate user table (prevent data inconsistency)
  - Access controlled via `tenant_users` pivot

### User-Tenant Relationship Model

**Scenario 1: User dalam Single Tenant**
```
User: john@example.com
├─ Tenant: PT CEX
   └─ Role: Admin
```

**Scenario 2: User dalam Multiple Tenants**
```
User: mary@consultancy.com
├─ Tenant: PT CEX
│  └─ Role: Manager
├─ Tenant: ABC Corporation
│  └─ Role: Editor
└─ Tenant: XYZ Shop
   └─ Role: Viewer
```

**Scenario 3: Platform Super Admin**
```
User: super@stencilcms.com
├─ Platform Role: Super Admin (global access)
└─ Can access ALL tenants
```

### Permission Inheritance Example

```
Platform Super Admin
  └─> Can do EVERYTHING across ALL tenants

Tenant Owner (per tenant)
  ├─> Inherits: Tenant Admin permissions
  └─> Plus: Billing, Subscription management

Tenant Admin
  ├─> Inherits: Manager permissions
  └─> Plus: User management, Settings

Manager
  ├─> Inherits: Editor permissions
  └─> Plus: Approve content, View analytics

Editor
  ├─> Inherits: Viewer permissions
  └─> Plus: Create, Edit, Delete content

Viewer
  └─> Read-only access
```

### PT CEX Specific Roles

Untuk tenant PT Custom Etching Xenial (PT CEX), sistem support custom roles:

1. **Owner**: Full control, billing access
2. **Finance Manager**: Payment verification, financial reports
3. **Sales Manager**: Order management, customer quotation
4. **Production Manager**: Vendor sourcing, production monitoring
5. **Customer Service**: Customer communication, order status updates
6. **Viewer**: Read-only dashboard access

---

## DATABASE SCHEMA

### Table 1: `users` (Landlord Schema)

Centralized user authentication table.

```sql
CREATE TABLE users (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email_verified_at TIMESTAMP,
    
    -- Profile Information
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    phone VARCHAR(50),
    
    -- Preferences
    language VARCHAR(10) DEFAULT 'id',
    timezone VARCHAR(100) DEFAULT 'Asia/Jakarta',
    date_format VARCHAR(50) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(10) DEFAULT '24h',
    
    -- Security
    two_factor_secret TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_recovery_codes JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'banned')),
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_platform_admin BOOLEAN DEFAULT FALSE,
    
    -- Account Security
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    last_activity_at TIMESTAMP,
    
    -- Password Management
    password_changed_at TIMESTAMP,
    must_change_password BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_users_email ON users(LOWER(email)) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_platform_admin ON users(is_platform_admin) WHERE is_platform_admin = TRUE;
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Full-text search
CREATE INDEX idx_users_search ON users USING GIN(
    to_tsvector('simple', name || ' ' || COALESCE(email, ''))
);

-- Trigger for updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Table 2: `tenant_users` (Landlord Schema)

Pivot table linking users to tenants with role assignments.

```sql
CREATE TABLE tenant_users (
    -- Composite Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- User Status in Tenant
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    is_owner BOOLEAN DEFAULT FALSE,
    
    -- Invitation
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    invitation_accepted_at TIMESTAMP,
    invitation_token VARCHAR(255),
    invitation_expires_at TIMESTAMP,
    
    -- Access Control
    can_access_admin_panel BOOLEAN DEFAULT TRUE,
    ip_whitelist JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    -- Constraints
    UNIQUE(tenant_id, user_id)
);

-- Indexes
CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX idx_tenant_users_status ON tenant_users(status);
CREATE INDEX idx_tenant_users_owner ON tenant_users(is_owner) WHERE is_owner = TRUE;
CREATE INDEX idx_tenant_users_deleted_at ON tenant_users(deleted_at);
```

### Table 3: `roles` (Landlord Schema - Tenant-Scoped)

Role definitions for RBAC system.

```sql
CREATE TABLE roles (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tenant Scope (NULL = platform role)
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Identification
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Hierarchy
    parent_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    level SMALLINT DEFAULT 0,
    
    -- Scope
    scope VARCHAR(50) DEFAULT 'tenant' CHECK (scope IN ('platform', 'tenant', 'hybrid')),
    
    -- Flags
    is_system BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    is_assignable BOOLEAN DEFAULT TRUE,
    
    -- Display
    color VARCHAR(20),
    icon VARCHAR(100),
    badge VARCHAR(50),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    -- Constraints
    UNIQUE(tenant_id, code)
);

-- Indexes
CREATE INDEX idx_roles_tenant ON roles(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_roles_code ON roles(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_roles_scope ON roles(scope);
CREATE INDEX idx_roles_parent ON roles(parent_role_id);
CREATE INDEX idx_roles_system ON roles(is_system);
CREATE INDEX idx_roles_deleted ON roles(deleted_at);
```

### Table 4: `permissions` (Landlord Schema)

Permission catalog - all possible permissions in the system.

```sql
CREATE TABLE permissions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Permission Details
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Categorization
    category VARCHAR(100),
    subcategory VARCHAR(100),
    
    -- Resource
    resource_type VARCHAR(100),
    
    -- Action
    action VARCHAR(50),
    
    -- Scope
    scope VARCHAR(50) DEFAULT 'tenant' CHECK (scope IN ('platform', 'tenant', 'global')),
    
    -- Flags
    is_system BOOLEAN DEFAULT FALSE,
    is_dangerous BOOLEAN DEFAULT FALSE,
    requires_verification BOOLEAN DEFAULT FALSE,
    
    -- Display
    group_name VARCHAR(100),
    order_index INTEGER DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_permissions_code ON permissions(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_permissions_resource_type ON permissions(resource_type);
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_permissions_scope ON permissions(scope);
CREATE INDEX idx_permissions_system ON permissions(is_system);
CREATE INDEX idx_permissions_deleted ON permissions(deleted_at);
```

### Table 5: `role_permissions` (Landlord Schema)

Links roles to permissions.

```sql
CREATE TABLE role_permissions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    
    -- Permission Modifiers
    is_granted BOOLEAN DEFAULT TRUE,
    conditions JSONB,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    -- Constraints
    UNIQUE(role_id, permission_id)
);

-- Indexes
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX idx_role_permissions_granted ON role_permissions(is_granted);
```

### Table 6: `user_roles` (Landlord Schema)

Links users to roles (tenant-scoped).

```sql
CREATE TABLE user_roles (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    
    -- Temporal Access
    starts_at TIMESTAMP,
    expires_at TIMESTAMP,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP,
    
    -- Constraints
    UNIQUE(tenant_id, user_id, role_id)
);

-- Indexes
CREATE INDEX idx_user_roles_tenant ON user_roles(tenant_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_expires ON user_roles(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_user_roles_deleted ON user_roles(deleted_at);
```

### Table 7: `user_permissions` (Landlord Schema)

Direct user permissions (override role permissions).

```sql
CREATE TABLE user_permissions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    
    -- Permission Modifiers
    is_granted BOOLEAN DEFAULT TRUE,
    conditions JSONB,
    
    -- Temporal Access
    starts_at TIMESTAMP,
    expires_at TIMESTAMP,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    reason TEXT,
    deleted_at TIMESTAMP,
    
    -- Constraints
    UNIQUE(tenant_id, user_id, permission_id)
);

-- Indexes
CREATE INDEX idx_user_permissions_tenant ON user_permissions(tenant_id);
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission ON user_permissions(permission_id);
CREATE INDEX idx_user_permissions_granted ON user_permissions(is_granted);
CREATE INDEX idx_user_permissions_expires ON user_permissions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_user_permissions_deleted ON user_permissions(deleted_at);
```

### Table 8: `resource_permissions` (Landlord Schema)

Resource-specific ACL (object-level permissions).

```sql
CREATE TABLE resource_permissions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tenant Scope
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Resource Identification (Polymorphic)
    resource_type VARCHAR(255) NOT NULL,
    resource_id UUID NOT NULL,
    
    -- Subject (User or Role)
    subject_type VARCHAR(50) NOT NULL CHECK (subject_type IN ('user', 'role')),
    subject_id UUID NOT NULL,
    
    -- Permission
    permission_code VARCHAR(100) NOT NULL,
    is_granted BOOLEAN DEFAULT TRUE,
    
    -- Conditions
    conditions JSONB,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_resource_permissions_tenant ON resource_permissions(tenant_id);
CREATE INDEX idx_resource_permissions_resource ON resource_permissions(resource_type, resource_id);
CREATE INDEX idx_resource_permissions_subject ON resource_permissions(subject_type, subject_id);
CREATE INDEX idx_resource_permissions_permission ON resource_permissions(permission_code);
CREATE INDEX idx_resource_permissions_deleted ON resource_permissions(deleted_at);
```

### Table 9: `permission_groups` (Landlord Schema)

Logical grouping of permissions for UI organization.

```sql
CREATE TABLE permission_groups (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Group Details
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Display
    icon VARCHAR(100),
    color VARCHAR(20),
    order_index INTEGER DEFAULT 0,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_permission_groups_code ON permission_groups(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_permission_groups_order ON permission_groups(order_index);
CREATE INDEX idx_permission_groups_deleted ON permission_groups(deleted_at);
```

---

## RELATIONSHIP DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    LANDLORD SCHEMA: RBAC SYSTEM                  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                     users (Central)                     │     │
│  │  - id (UUID, PK)                                        │     │
│  │  - email (unique), password                             │     │
│  │  - name, avatar_url, phone                              │     │
│  │  - language, timezone                                   │     │
│  │  - two_factor_secret, two_factor_enabled                │     │
│  │  - status, is_platform_admin                            │     │
│  │  - last_login_at, last_login_ip                         │     │
│  └───────────────┬───────────────┬────────────────────────┘     │
│                  │               │                               │
│                  │ 1:N           │ 1:N                           │
│                  │               │                               │
│    ┌─────────────▼─────┐  ┌─────▼───────────────┐               │
│    │ tenant_users      │  │  user_roles         │               │
│    │ - tenant_id (FK)  │  │  - tenant_id (FK)   │               │
│    │ - user_id (FK)    │  │  - user_id (FK)     │               │
│    │ - status          │  │  - role_id (FK)◄────┼────┐          │
│    │ - is_owner        │  │  - starts_at        │    │          │
│    └───────────────────┘  │  - expires_at       │    │          │
│                           └─────────────────────┘    │          │
│                                                       │          │
│         ┌────────────────────────────────────────────┘          │
│         │                                                        │
│    ┌────▼──────────────┐         ┌──────────────────┐          │
│    │  roles            │         │  permissions      │          │
│    │  - id (UUID, PK)  │◄────┐   │  - id (UUID, PK) │          │
│    │  - tenant_id (FK) │     │   │  - code (unique) │          │
│    │  - code, name     │     │   │  - name          │          │
│    │  - parent_role_id │     │   │  - category      │          │
│    │  - scope          │     │   │  - resource_type │          │
│    │  - is_system      │     │   │  - action        │          │
│    └─────┬─────────────┘     │   └───────┬──────────┘          │
│          │                   │           │                      │
│          │ N:N               │           │ N:N                  │
│          │     ┌─────────────┴───┐       │                      │
│          └────►│ role_permissions│◄──────┘                      │
│                │ - role_id (FK)  │                              │
│                │ - permission_id │                              │
│                │ - is_granted    │                              │
│                └─────────────────┘                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  user_permissions (Direct Override)                      │   │
│  │  - tenant_id (FK), user_id (FK), permission_id (FK)      │   │
│  │  - is_granted, conditions                                 │   │
│  │  - starts_at, expires_at                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  resource_permissions (Object-Level ACL)                 │   │
│  │  - tenant_id, resource_type, resource_id                 │   │
│  │  - subject_type, subject_id                              │   │
│  │  - permission_code, is_granted                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  permission_groups (UI Organization)                     │   │
│  │  - code, name, description, icon, order_index            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## FIELD SPECIFICATIONS

### Table: `users`

| Field | Type | Required | Default | Description | Validation |
|-------|------|----------|---------|-------------|------------|
| `id` | UUID | Yes | gen_random_uuid() | Primary key | Auto-generated |
| `email` | VARCHAR(255) | Yes | - | User email (unique) | Valid email format, unique |
| `password` | VARCHAR(255) | Yes | - | Hashed password | bcrypt hash (Laravel) |
| `email_verified_at` | TIMESTAMP | No | NULL | Email verification timestamp | NULL = unverified |
| `name` | VARCHAR(255) | Yes | - | Full name | Min 2 chars |
| `first_name` | VARCHAR(100) | No | - | First name | - |
| `last_name` | VARCHAR(100) | No | - | Last name | - |
| `avatar_url` | VARCHAR(500) | No | - | Profile picture URL | Valid URL |
| `phone` | VARCHAR(50) | No | - | Phone number | Valid format |
| `language` | VARCHAR(10) | No | 'id' | UI language preference | ISO 639-1 code |
| `timezone` | VARCHAR(100) | No | 'Asia/Jakarta' | User timezone | Valid TZ identifier |
| `date_format` | VARCHAR(50) | No | 'DD/MM/YYYY' | Date display format | - |
| `time_format` | VARCHAR(10) | No | '24h' | Time display format | '12h' or '24h' |
| `two_factor_secret` | TEXT | No | - | 2FA secret key | Encrypted |
| `two_factor_enabled` | BOOLEAN | No | FALSE | 2FA status | TRUE/FALSE |
| `two_factor_recovery_codes` | JSONB | No | - | Recovery codes array | Encrypted JSON |
| `status` | VARCHAR(20) | No | 'active' | Account status | active/inactive/suspended/banned |
| `is_email_verified` | BOOLEAN | No | FALSE | Email verification status | TRUE/FALSE |
| `is_platform_admin` | BOOLEAN | No | FALSE | Platform admin flag | TRUE/FALSE |
| `failed_login_attempts` | INTEGER | No | 0 | Failed login count | >= 0 |
| `locked_until` | TIMESTAMP | No | - | Account lockout expiry | NULL = not locked |
| `last_login_at` | TIMESTAMP | No | - | Last successful login | Auto-updated |
| `last_login_ip` | VARCHAR(45) | No | - | Last login IP address | IPv4 or IPv6 |
| `last_activity_at` | TIMESTAMP | No | - | Last activity timestamp | Auto-updated |
| `password_changed_at` | TIMESTAMP | No | - | Last password change | Auto-updated |
| `must_change_password` | BOOLEAN | No | FALSE | Force password change flag | TRUE/FALSE |
| `metadata` | JSONB | No | {} | Custom user metadata | Valid JSON |

### Table: `roles`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | UUID | Yes | gen_random_uuid() | Primary key |
| `tenant_id` | UUID | No | NULL | Tenant scope (NULL = platform role) |
| `code` | VARCHAR(100) | Yes | - | Unique role code |
| `name` | VARCHAR(255) | Yes | - | Display name |
| `description` | TEXT | No | - | Role description |
| `parent_role_id` | UUID | No | NULL | Parent role for inheritance |
| `level` | SMALLINT | No | 0 | Hierarchy level |
| `scope` | VARCHAR(50) | No | 'tenant' | platform/tenant/hybrid |
| `is_system` | BOOLEAN | No | FALSE | System role (immutable) |
| `is_default` | BOOLEAN | No | FALSE | Default role for new users |
| `is_assignable` | BOOLEAN | No | TRUE | Can be assigned to users |
| `color` | VARCHAR(20) | No | - | Badge color (hex or name) |
| `icon` | VARCHAR(100) | No | - | Icon identifier |
| `badge` | VARCHAR(50) | No | - | Badge text |

### Table: `permissions`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | UUID | Yes | gen_random_uuid() | Primary key |
| `code` | VARCHAR(100) | Yes | - | Unique permission code |
| `name` | VARCHAR(255) | Yes | - | Display name |
| `description` | TEXT | No | - | Permission description |
| `category` | VARCHAR(100) | No | - | Main category |
| `subcategory` | VARCHAR(100) | No | - | Sub-category |
| `resource_type` | VARCHAR(100) | No | - | Resource type (e.g., 'Product') |
| `action` | VARCHAR(50) | No | - | Action verb (e.g., 'create') |
| `scope` | VARCHAR(50) | No | 'tenant' | platform/tenant/global |
| `is_system` | BOOLEAN | No | FALSE | System permission |
| `is_dangerous` | BOOLEAN | No | FALSE | Requires extra confirmation |
| `requires_verification` | BOOLEAN | No | FALSE | Requires 2FA verification |

---

## BUSINESS RULES

### 1. User Authentication Rules

**Email Verification**:
- New users MUST verify email before full access
- Verification link expires after 24 hours
- Resend verification email max 3 times per hour
- Unverified users can login but limited access

**Password Policy**:
- Minimum length: 8 characters
- Must contain: uppercase, lowercase, number, special character
- Cannot reuse last 5 passwords
- Password expires every 90 days (configurable)
- Force change on first login (optional)

**Account Lockout**:
- Max failed attempts: 5 (configurable)
- Lockout duration: 30 minutes (exponential backoff)
- Unlock via email link or admin intervention
- Track lockout history for security audit

### 2. Multi-Tenant User Assignment

**Rules**:
- User can belong to multiple tenants simultaneously
- Each tenant assignment requires separate role
- User cannot be deleted if active in any tenant
- Soft delete preserves data for audit trail
- User can switch between tenants via UI

**Validation Logic**:
```javascript
function canAssignUserToTenant(user, tenant, role) {
  if (!user.is_email_verified) {
    throw new Error('User must verify email first');
  }
  
  if (user.status !== 'active') {
    throw new Error('User account is not active');
  }
  
  const existingAssignment = tenant_users.find({
    tenant_id: tenant.id,
    user_id: user.id
  });
  
  if (existingAssignment && existingAssignment.status === 'active') {
    throw new Error('User already assigned to this tenant');
  }
  
  return true;
}
```

### 3. Role Hierarchy & Inheritance

**Inheritance Rules**:
- Child role inherits ALL permissions from parent role
- Permission inheritance is recursive (multi-level)
- Explicit deny (is_granted = FALSE) overrides inherited allow
- User permissions override role permissions
- Resource permissions override user & role permissions

**Example Hierarchy**:
```
Owner (level 0)
  └─ Admin (level 1)
       └─ Manager (level 2)
            └─ Editor (level 3)
                 └─ Viewer (level 4)
```

### 4. Permission Resolution Algorithm

```javascript
function checkPermission(user, tenant, permissionCode, resource = null) {
  // Step 1: Check resource-specific ACL (highest priority)
  if (resource) {
    const resourceACL = resource_permissions.find({
      tenant_id: tenant.id,
      resource_type: resource.type,
      resource_id: resource.id,
      subject_type: 'user',
      subject_id: user.id,
      permission_code: permissionCode
    });
    
    if (resourceACL) {
      return resourceACL.is_granted;
    }
  }
  
  // Step 2: Check direct user permissions
  const userPerm = user_permissions.find({
    tenant_id: tenant.id,
    user_id: user.id,
    permission_id: getPermissionByCode(permissionCode).id
  });
  
  if (userPerm && !userPerm.isExpired()) {
    return userPerm.is_granted;
  }
  
  // Step 3: Check role permissions (with inheritance)
  const userRoles = getUserRolesInTenant(user, tenant);
  
  for (const role of userRoles) {
    const rolePerm = getRolePermissionsWithInheritance(role, permissionCode);
    
    if (rolePerm) {
      return rolePerm.is_granted;
    }
  }
  
  // Step 4: Default deny
  return false;
}
```

### 5. System Roles (Immutable)

**Platform-Level System Roles**:
- `super_admin`: Full platform access, cannot be deleted
- `platform_support`: Read-only access to all tenants
- `platform_billing`: Billing operations across tenants

**Tenant-Level Default Roles**:
- `tenant_owner`: Created automatically with new tenant
- `tenant_admin`: Standard admin role
- `tenant_viewer`: Read-only default role

**Protection**:
- System roles have `is_system = TRUE`
- Cannot be deleted via API
- Cannot modify permissions (only via migration)
- Visible in UI but disabled for editing

### 6. Temporal Permissions

**Time-Limited Access**:
```sql
-- Grant temporary editor access for 30 days
INSERT INTO user_roles (tenant_id, user_id, role_id, starts_at, expires_at)
VALUES (
  {tenant_id},
  {user_id},
  {editor_role_id},
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '30 days'
);
```

**Validation**:
- `starts_at` must be <= `expires_at`
- Expired permissions automatically ignored in permission checks
- Cleanup job runs daily to soft-delete expired records
- Email notification 3 days before expiry

### 7. Permission Naming Convention

**Format**: `{resource}.{action}` or `{resource}.*`

**Examples**:
```
products.view
products.create
products.edit
products.delete
products.publish
products.*  (wildcard = all product operations)

orders.view
orders.create
orders.approve
orders.cancel
orders.*

users.view
users.create
users.edit
users.delete
users.impersonate
users.*

settings.view
settings.edit
```

**Special Permissions**:
- `*.view` - View all resources
- `*.create` - Create all resources
- `*.*` - God mode (platform super admin only)

---

## PERMISSION SYSTEM

### Permission Categories

**1. Content Management**
- `pages.*` - Page CRUD operations
- `posts.*` - Blog post operations
- `media.*` - Media library operations

**2. E-Commerce**
- `products.*` - Product management
- `categories.*` - Category management
- `orders.*` - Order operations
- `customers.*` - Customer data access
- `vendors.*` - Vendor management

**3. Financial**
- `payments.view` - View payment records
- `payments.verify` - Verify customer payments
- `invoices.*` - Invoice management
- `reports.financial` - Financial reports access

**4. System Administration**
- `users.*` - User management
- `roles.*` - Role management
- `permissions.*` - Permission management
- `settings.*` - System settings
- `themes.*` - Theme management
- `plugins.*` - Plugin management

**5. Tenant Management (Platform Level)**
- `tenants.*` - Tenant operations
- `subscriptions.*` - Subscription management
- `billing.*` - Billing operations

### Dangerous Permissions

Permissions marked with `is_dangerous = TRUE` require extra confirmation:

- `users.delete` - Delete users permanently
- `orders.delete` - Delete order records
- `payments.delete` - Delete payment records
- `database.backup` - Backup database
- `database.restore` - Restore database
- `settings.system` - Modify system settings
- `*.delete` - Wildcard delete

**UI Behavior**:
- Show warning modal before action
- Require password re-entry
- Require 2FA if enabled
- Log action with full audit trail

---

## API ENDPOINTS

### Authentication

```yaml
POST /api/auth/register
  - Register new user account
  - Send verification email
  - Return: user object + verification message

POST /api/auth/login
  - Authenticate with email + password
  - Return: auth token + user object + tenant list

POST /api/auth/logout
  - Revoke current auth token
  - Return: success message

POST /api/auth/verify-email
  - Verify email address via token
  - Return: success message

POST /api/auth/forgot-password
  - Request password reset link
  - Return: email sent confirmation

POST /api/auth/reset-password
  - Reset password via token
  - Return: success message

POST /api/auth/2fa/enable
  - Enable two-factor authentication
  - Return: QR code + secret + recovery codes

POST /api/auth/2fa/verify
  - Verify 2FA code
  - Return: success message

POST /api/auth/2fa/disable
  - Disable 2FA
  - Return: success message
```

### User Management

```yaml
GET /api/users
  - List users (paginated, searchable, filterable)
  - Query params: search, status, tenant_id, page, per_page
  - Return: { data: [], meta: {}, links: {} }

GET /api/users/{id}
  - Get user details
  - Include: roles, permissions, tenant assignments
  - Return: user object

POST /api/users
  - Create new user
  - Body: { email, name, password, ... }
  - Return: user object

PUT /api/users/{id}
  - Update user details
  - Body: { name, phone, language, ... }
  - Return: updated user object

DELETE /api/users/{id}
  - Soft delete user
  - Check: user has no active tenant assignments
  - Return: success message

POST /api/users/{id}/assign-tenant
  - Assign user to tenant with role
  - Body: { tenant_id, role_id }
  - Return: tenant_user object

DELETE /api/users/{id}/remove-tenant/{tenant_id}
  - Remove user from tenant
  - Return: success message

GET /api/users/me
  - Get current authenticated user
  - Include: permissions, tenants, roles
  - Return: user object with context

PUT /api/users/me/profile
  - Update own profile
  - Body: { name, phone, avatar_url, ... }
  - Return: updated user object

PUT /api/users/me/password
  - Change own password
  - Body: { current_password, new_password }
  - Return: success message
```

### Role Management

```yaml
GET /api/roles
  - List roles (tenant-scoped or platform)
  - Query: tenant_id, scope, include_system
  - Return: roles array

GET /api/roles/{id}
  - Get role details
  - Include: permissions, user count
  - Return: role object

POST /api/roles
  - Create new role
  - Body: { tenant_id, code, name, permissions: [] }
  - Return: role object

PUT /api/roles/{id}
  - Update role
  - Body: { name, description, permissions: [] }
  - Return: updated role

DELETE /api/roles/{id}
  - Delete role
  - Check: no users assigned, not system role
  - Return: success message

POST /api/roles/{id}/permissions
  - Assign permissions to role
  - Body: { permission_ids: [] }
  - Return: updated role

DELETE /api/roles/{id}/permissions/{permission_id}
  - Remove permission from role
  - Return: success message
```

### Permission Management

```yaml
GET /api/permissions
  - List all permissions
  - Query: category, resource_type, scope
  - Return: permissions grouped by category

GET /api/permissions/user/{user_id}
  - Get user's effective permissions in tenant
  - Include: direct, role-inherited, resource-specific
  - Return: permissions array

POST /api/permissions/check
  - Check if user has permission
  - Body: { user_id, permission_code, resource_type, resource_id }
  - Return: { has_permission: boolean }

POST /api/user-permissions
  - Grant direct permission to user
  - Body: { user_id, tenant_id, permission_id, expires_at }
  - Return: user_permission object

DELETE /api/user-permissions/{id}
  - Revoke direct user permission
  - Return: success message
```

---

## ADMIN UI FEATURES

### User Management Dashboard

**Features**:
- User list dengan advanced filtering (status, tenant, role, date range)
- Search by name, email, phone
- Bulk actions: activate, deactivate, delete
- Export user list to CSV/Excel
- Quick view user details modal
- Tenant assignment visualization (badges per tenant)

**User Detail Page**:
- Profile information edit form
- Avatar upload dengan crop tool
- Security settings (password reset, 2FA status, lockout info)
- Tenant assignments table dengan inline role editor
- Permission summary (effective permissions calculated)
- Activity log (login history, actions performed)
- Delete user button (dengan confirmation modal)

### Role Management

**Features**:
- Role list grouped by scope (Platform, Tenant, Custom)
- Create/edit role modal dengan permission tree selector
- Permission categories accordion (expandable groups)
- Role hierarchy visualizer (tree diagram)
- User count per role
- Clone role functionality (duplicate dengan custom name)
- Delete protection untuk system roles

**Permission Assignment UI**:
- Tree structure dengan checkboxes
- "Select All" per category
- Search filter untuk permissions
- Toggle between "Show Granted Only" vs "Show All"
- Inherited permissions highlighted (dari parent role)

### Permission Manager

**Features**:
- Permission catalog view grouped by resource type
- Permission usage statistics (how many roles/users have it)
- Dangerous permissions highlighted (red badge)
- Create custom permissions (admin only)
- Permission audit log (who granted/revoked when)

---

## SAMPLE DATA

### Sample Users

```sql
-- Platform Super Admin
INSERT INTO users (id, email, password, name, is_platform_admin, status)
VALUES (
  gen_random_uuid(),
  'super@stencilcms.com',
  '$2y$10$...', -- bcrypt hash for 'password'
  'Super Administrator',
  TRUE,
  'active'
);

-- Tenant Owner
INSERT INTO users (id, email, password, name, status)
VALUES (
  gen_random_uuid(),
  'owner@ptcex.com',
  '$2y$10$...',
  'PT CEX Owner',
  'active'
);

-- Tenant Admin
INSERT INTO users (id, email, password, name, status)
VALUES (
  gen_random_uuid(),
  'admin@ptcex.com',
  '$2y$10$...',
  'PT CEX Admin',
  'active'
);
```

### Sample Roles

```sql
-- Platform Super Admin Role
INSERT INTO roles (id, tenant_id, code, name, scope, is_system)
VALUES (
  gen_random_uuid(),
  NULL,
  'super_admin',
  'Super Administrator',
  'platform',
  TRUE
);

-- Tenant Owner Role
INSERT INTO roles (id, tenant_id, code, name, scope, is_system, is_default)
VALUES (
  gen_random_uuid(),
  {pt_cex_tenant_id},
  'tenant_owner',
  'Tenant Owner',
  'tenant',
  TRUE,
  FALSE
);

-- Tenant Admin Role
INSERT INTO roles (id, tenant_id, code, name, scope, is_system, is_default)
VALUES (
  gen_random_uuid(),
  {pt_cex_tenant_id},
  'tenant_admin',
  'Tenant Administrator',
  'tenant',
  TRUE,
  TRUE
);

-- Finance Manager Role (Custom)
INSERT INTO roles (id, tenant_id, code, name, scope, is_system)
VALUES (
  gen_random_uuid(),
  {pt_cex_tenant_id},
  'finance_manager',
  'Finance Manager',
  'tenant',
  FALSE
);
```

### Sample Permissions

```sql
-- Product Management Permissions
INSERT INTO permissions (code, name, category, resource_type, action, scope)
VALUES 
  ('products.view', 'View Products', 'E-Commerce', 'Product', 'view', 'tenant'),
  ('products.create', 'Create Products', 'E-Commerce', 'Product', 'create', 'tenant'),
  ('products.edit', 'Edit Products', 'E-Commerce', 'Product', 'edit', 'tenant'),
  ('products.delete', 'Delete Products', 'E-Commerce', 'Product', 'delete', 'tenant'),
  ('products.publish', 'Publish Products', 'E-Commerce', 'Product', 'publish', 'tenant');

-- Order Management Permissions
INSERT INTO permissions (code, name, category, resource_type, action, scope)
VALUES 
  ('orders.view', 'View Orders', 'E-Commerce', 'Order', 'view', 'tenant'),
  ('orders.create', 'Create Orders', 'E-Commerce', 'Order', 'create', 'tenant'),
  ('orders.approve', 'Approve Orders', 'E-Commerce', 'Order', 'approve', 'tenant'),
  ('orders.cancel', 'Cancel Orders', 'E-Commerce', 'Order', 'cancel', 'tenant');

-- Payment Permissions
INSERT INTO permissions (code, name, category, resource_type, action, scope, is_dangerous)
VALUES 
  ('payments.view', 'View Payments', 'Financial', 'Payment', 'view', 'tenant', FALSE),
  ('payments.verify', 'Verify Payments', 'Financial', 'Payment', 'verify', 'tenant', FALSE),
  ('payments.delete', 'Delete Payments', 'Financial', 'Payment', 'delete', 'tenant', TRUE);
```

---

## MIGRATION SCRIPT

```sql
-- Migration: Create RBAC tables
-- Version: 1.0
-- Description: User management & RBAC system for multi-tenant CMS

BEGIN TRANSACTION;

-- Function for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table 1: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email_verified_at TIMESTAMP,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    phone VARCHAR(50),
    language VARCHAR(10) DEFAULT 'id',
    timezone VARCHAR(100) DEFAULT 'Asia/Jakarta',
    date_format VARCHAR(50) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(10) DEFAULT '24h',
    two_factor_secret TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_recovery_codes JSONB,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'banned')),
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_platform_admin BOOLEAN DEFAULT FALSE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    last_activity_at TIMESTAMP,
    password_changed_at TIMESTAMP,
    must_change_password BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX idx_users_email ON users(LOWER(email)) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_platform_admin ON users(is_platform_admin) WHERE is_platform_admin = TRUE;
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_users_search ON users USING GIN(to_tsvector('simple', name || ' ' || COALESCE(email, '')));

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table 2: tenant_users
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    is_owner BOOLEAN DEFAULT FALSE,
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    invitation_accepted_at TIMESTAMP,
    invitation_token VARCHAR(255),
    invitation_expires_at TIMESTAMP,
    can_access_admin_panel BOOLEAN DEFAULT TRUE,
    ip_whitelist JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX idx_tenant_users_status ON tenant_users(status);
CREATE INDEX idx_tenant_users_owner ON tenant_users(is_owner) WHERE is_owner = TRUE;
CREATE INDEX idx_tenant_users_deleted_at ON tenant_users(deleted_at);

-- Table 3: roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    level SMALLINT DEFAULT 0,
    scope VARCHAR(50) DEFAULT 'tenant' CHECK (scope IN ('platform', 'tenant', 'hybrid')),
    is_system BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    is_assignable BOOLEAN DEFAULT TRUE,
    color VARCHAR(20),
    icon VARCHAR(100),
    badge VARCHAR(50),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_roles_tenant ON roles(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_roles_code ON roles(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_roles_scope ON roles(scope);
CREATE INDEX idx_roles_parent ON roles(parent_role_id);
CREATE INDEX idx_roles_system ON roles(is_system);
CREATE INDEX idx_roles_deleted ON roles(deleted_at);

-- Table 4: permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    resource_type VARCHAR(100),
    action VARCHAR(50),
    scope VARCHAR(50) DEFAULT 'tenant' CHECK (scope IN ('platform', 'tenant', 'global')),
    is_system BOOLEAN DEFAULT FALSE,
    is_dangerous BOOLEAN DEFAULT FALSE,
    requires_verification BOOLEAN DEFAULT FALSE,
    group_name VARCHAR(100),
    order_index INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX idx_permissions_code ON permissions(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_permissions_resource_type ON permissions(resource_type);
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_permissions_scope ON permissions(scope);
CREATE INDEX idx_permissions_system ON permissions(is_system);
CREATE INDEX idx_permissions_deleted ON permissions(deleted_at);

-- Table 5: role_permissions
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    is_granted BOOLEAN DEFAULT TRUE,
    conditions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX idx_role_permissions_granted ON role_permissions(is_granted);

-- Table 6: user_roles
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    starts_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP,
    UNIQUE(tenant_id, user_id, role_id)
);

CREATE INDEX idx_user_roles_tenant ON user_roles(tenant_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_expires ON user_roles(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_user_roles_deleted ON user_roles(deleted_at);

-- Table 7: user_permissions
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    is_granted BOOLEAN DEFAULT TRUE,
    conditions JSONB,
    starts_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    reason TEXT,
    deleted_at TIMESTAMP,
    UNIQUE(tenant_id, user_id, permission_id)
);

CREATE INDEX idx_user_permissions_tenant ON user_permissions(tenant_id);
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission ON user_permissions(permission_id);
CREATE INDEX idx_user_permissions_granted ON user_permissions(is_granted);
CREATE INDEX idx_user_permissions_expires ON user_permissions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_user_permissions_deleted ON user_permissions(deleted_at);

-- Table 8: resource_permissions
CREATE TABLE resource_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    resource_type VARCHAR(255) NOT NULL,
    resource_id UUID NOT NULL,
    subject_type VARCHAR(50) NOT NULL CHECK (subject_type IN ('user', 'role')),
    subject_id UUID NOT NULL,
    permission_code VARCHAR(100) NOT NULL,
    is_granted BOOLEAN DEFAULT TRUE,
    conditions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_resource_permissions_tenant ON resource_permissions(tenant_id);
CREATE INDEX idx_resource_permissions_resource ON resource_permissions(resource_type, resource_id);
CREATE INDEX idx_resource_permissions_subject ON resource_permissions(subject_type, subject_id);
CREATE INDEX idx_resource_permissions_permission ON resource_permissions(permission_code);
CREATE INDEX idx_resource_permissions_deleted ON resource_permissions(deleted_at);

-- Table 9: permission_groups
CREATE TABLE permission_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(20),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX idx_permission_groups_code ON permission_groups(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_permission_groups_order ON permission_groups(order_index);
CREATE INDEX idx_permission_groups_deleted ON permission_groups(deleted_at);

COMMIT;
```

---

## PERFORMANCE INDEXES

### Critical Indexes for Query Performance

**1. User Lookups**:
```sql
-- Email lookup (login)
CREATE UNIQUE INDEX idx_users_email_lower ON users(LOWER(email)) WHERE deleted_at IS NULL;

-- Platform admin filter
CREATE INDEX idx_users_platform_admin ON users(is_platform_admin) 
WHERE is_platform_admin = TRUE AND deleted_at IS NULL;
```

**2. Multi-Tenant Queries**:
```sql
-- User's tenants lookup
CREATE INDEX idx_tenant_users_user_tenant ON tenant_users(user_id, tenant_id) 
WHERE deleted_at IS NULL;

-- Tenant's users lookup
CREATE INDEX idx_tenant_users_tenant_status ON tenant_users(tenant_id, status) 
WHERE deleted_at IS NULL;
```

**3. Permission Checks** (Most Frequent):
```sql
-- Permission resolution
CREATE INDEX idx_user_roles_composite ON user_roles(tenant_id, user_id, role_id) 
WHERE deleted_at IS NULL;

-- Role permission lookup
CREATE INDEX idx_role_permissions_composite ON role_permissions(role_id, permission_id, is_granted);

-- Direct user permission
CREATE INDEX idx_user_permissions_composite ON user_permissions(tenant_id, user_id, permission_id, is_granted) 
WHERE deleted_at IS NULL AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);
```

**4. Resource-Level ACL**:
```sql
-- Resource permission check
CREATE INDEX idx_resource_permissions_check ON resource_permissions(
    tenant_id, resource_type, resource_id, subject_type, subject_id, permission_code
) WHERE deleted_at IS NULL;
```

### Query Performance Benchmarks

Expected query performance on 10,000 users, 100 tenants, 500 roles:

- User login by email: **< 5ms**
- Get user's tenants: **< 10ms**
- Check single permission: **< 15ms**
- Calculate effective permissions: **< 50ms**
- Load role with permissions: **< 20ms**
- Full permission tree (admin UI): **< 100ms**

---

**Previous:** [11-FINANCIAL.md](./11-FINANCIAL.md)  
**Next:** [13-MEDIA.md](./13-MEDIA.md)

**Last Updated:** 2025-11-11  
**Status:** ✅ COMPLETE  
**Reviewed By:** System Architect
