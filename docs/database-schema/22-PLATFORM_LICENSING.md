# PLATFORM LICENSING SYSTEM
## Database Schema & API Documentation

**Module:** Platform License Management & Service Licensing  
**Total Fields:** 95+ fields  
**Total Tables:** 3 tables (platform_licenses, tenant_service_licenses, license_validations)  
**Admin Pages:** `src/pages/platform/LicenseManagement.tsx`, `src/pages/platform/TenantServiceLicenses.tsx`  
**Type Definition:** `src/types/platform-license.ts`, `src/types/service-license.ts`  
**Status:** 🚧 **NEW REQUIREMENT - HIGH PRIORITY**

> **🔐 SECURITY CRITICAL**  
> **Purpose**: Replace insecure `tenant_id IS NULL` approach with cryptographic licensing  
> **Impact**: **CRITICAL** - Foundation for Platform Owner access control  
> **Integration**: Multi-tenant architecture, RBAC, tenant service management

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Business Context](#business-context)
3. [Database Schema](#database-schema)
4. [License Types](#license-types)
5. [Security Implementation](#security-implementation)
6. [API Endpoints](#api-endpoints)
7. [Admin UI Features](#admin-ui-features)
8. [Migration Strategy](#migration-strategy)

---

## OVERVIEW

### **Purpose**
Secure Platform Owner authentication & authorization system using cryptographic license validation to replace the vulnerable `tenant_id IS NULL` approach.

### **Key Components**
1. **Platform Licenses** - RSA-encrypted master licenses for Platform Owners
2. **Service Licenses** - Hierarchical tenant service plan management  
3. **Validation System** - Multi-layer license verification & audit logging

### **Security Benefits**
- ✅ **Cryptographic Security** - RSA-2048 encryption vs plain database queries
- ✅ **Audit Trail** - Complete logging vs no tracking
- ✅ **Expiration Control** - Time-limited access vs permanent access
- ✅ **Feature Control** - Granular permissions vs all-or-nothing
- ✅ **Revocation** - Instant license revocation capability

---

## BUSINESS CONTEXT

### **Platform Owner (Account Type A) Access**

**Old Approach (INSECURE):**
```sql
-- ❌ VULNERABLE - Anyone with DB access can bypass
SELECT * FROM platform_settings WHERE tenant_id IS NULL;
```

**New Approach (SECURE):**
```sql
-- ✅ SECURE - Requires valid cryptographic license
SELECT * FROM platform_settings 
WHERE platform_license_id = current_setting('app.platform_license_id')
AND license_valid_until > NOW() 
AND license_status = 'active';
```

### **License Hierarchy**
- **Master License**: Platform Owner with full platform access
- **Delegated License**: Limited platform admin (support, billing)
- **Service License**: Tenant service plans (Basic, Pro, Enterprise)

---

## DATABASE SCHEMA

### Table 1: `platform_licenses`

**Purpose**: Store encrypted Platform Owner licenses with RSA validation

```sql
CREATE TABLE platform_licenses (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    -- License Identity
    license_key TEXT NOT NULL UNIQUE, -- Base64 encoded RSA-encrypted license
    license_hash VARCHAR(255) NOT NULL UNIQUE, -- SHA-256 hash for indexing
    license_type VARCHAR(50) NOT NULL CHECK (license_type IN ('master', 'delegated')),
    
    -- Owner Information
    owner_name VARCHAR(255) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    owner_organization VARCHAR(255) NULL,
    owner_phone VARCHAR(50) NULL,
    
    -- License Scope & Restrictions
    max_tenants INTEGER DEFAULT NULL, -- NULL = unlimited
    max_users INTEGER DEFAULT NULL,   -- NULL = unlimited
    max_storage_gb INTEGER DEFAULT NULL, -- NULL = unlimited
    
    -- Features (JSONB array)
    features JSONB DEFAULT '[]', -- ["platform_management", "tenant_billing", "analytics_full"]
    restrictions JSONB DEFAULT '{}', -- Custom access restrictions
    
    -- Hierarchy (for delegated licenses)
    parent_license_id UUID NULL REFERENCES platform_licenses(uuid) ON DELETE CASCADE,
    delegation_level SMALLINT DEFAULT 0, -- 0=master, 1=delegated, 2=sub-delegated
    
    -- Validity & Status
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NOT NULL,
    last_validated TIMESTAMP NULL,
    validation_count INTEGER DEFAULT 0,
    
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired', 'revoked')),
    
    -- Cryptographic Security
    signature TEXT NOT NULL, -- RSA-2048 signature
    public_key TEXT NOT NULL, -- RSA public key for validation
    encryption_algorithm VARCHAR(50) DEFAULT 'RSA-2048',
    
    -- Environment Binding
    allowed_domains JSONB DEFAULT '[]', -- ["admin.stencil.com", "platform.stencil.com"]
    allowed_ips JSONB DEFAULT '[]', -- IP whitelist (optional)
    
    -- Renewal Management
    renewal_notification_sent BOOLEAN DEFAULT FALSE,
    renewal_grace_period_days INTEGER DEFAULT 7,
    auto_renewal_enabled BOOLEAN DEFAULT FALSE,
    
    -- Audit Fields
    created_by UUID NULL, -- Reference to creating user
    updated_by UUID NULL, -- Reference to last updating user
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_platform_licenses_uuid ON platform_licenses(uuid);
CREATE INDEX idx_platform_licenses_hash ON platform_licenses(license_hash);
CREATE INDEX idx_platform_licenses_email ON platform_licenses(owner_email);
CREATE INDEX idx_platform_licenses_status ON platform_licenses(status) WHERE status != 'revoked';
CREATE INDEX idx_platform_licenses_validity ON platform_licenses(valid_until) WHERE status = 'active';
CREATE INDEX idx_platform_licenses_parent ON platform_licenses(parent_license_id) WHERE parent_license_id IS NOT NULL;
CREATE INDEX idx_platform_licenses_type ON platform_licenses(license_type);

-- RLS Policy (for additional security)
ALTER TABLE platform_licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY platform_license_isolation ON platform_licenses
    USING (uuid::text = current_setting('app.platform_license_id', true));
```

**Field Specifications:**

| Field | Type | Description | Business Rules |
|-------|------|-------------|----------------|
| `license_key` | TEXT | RSA-encrypted license data | Base64 encoded, 2000+ chars |
| `license_hash` | VARCHAR(255) | SHA-256 of license_key | For fast lookups |
| `features` | JSONB | Enabled platform features | Array: ["platform_management", "billing", "analytics"] |
| `max_tenants` | INTEGER | Maximum allowed tenants | NULL = unlimited |
| `valid_until` | TIMESTAMP | License expiration | Must be future date |
| `signature` | TEXT | RSA signature | Cryptographic validation |

### Table 2: `tenant_service_licenses`

**Purpose**: Manage tenant service plans under Platform License hierarchy

```sql
CREATE TABLE tenant_service_licenses (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    -- Relationships
    tenant_id UUID NOT NULL, -- FK to tenants table
    platform_license_id UUID NOT NULL REFERENCES platform_licenses(uuid) ON DELETE CASCADE,
    
    -- Service Plan Configuration
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('basic', 'pro', 'enterprise', 'custom')),
    plan_name VARCHAR(255) NOT NULL,
    plan_version VARCHAR(50) DEFAULT '1.0',
    
    -- Resource Quotas
    max_users INTEGER NOT NULL DEFAULT 10,
    max_admin_users INTEGER NOT NULL DEFAULT 2,
    max_storage_gb INTEGER NOT NULL DEFAULT 1,
    max_products INTEGER DEFAULT NULL,
    max_orders_per_month INTEGER DEFAULT NULL,
    max_api_calls_per_month INTEGER DEFAULT NULL,
    
    -- Feature Permissions (JSONB array)
    features JSONB NOT NULL DEFAULT '[]', -- ["cms_basic", "inventory", "analytics"]
    addons JSONB DEFAULT '[]', -- ["advanced_reports", "custom_integrations"]
    restrictions JSONB DEFAULT '{}', -- Custom feature restrictions
    
    -- Billing Information
    monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    yearly_price DECIMAL(10,2) DEFAULT NULL,
    setup_fee DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    
    -- Service Level Agreement
    uptime_sla DECIMAL(5,2) DEFAULT 99.50, -- 99.50%
    support_level VARCHAR(50) DEFAULT 'standard' CHECK (support_level IN ('basic', 'standard', 'premium', 'enterprise')),
    response_time_hours INTEGER DEFAULT 24,
    
    -- Validity & Status
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NOT NULL,
    trial_ends_at TIMESTAMP NULL,
    grace_period_ends_at TIMESTAMP NULL,
    
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('trial', 'active', 'suspended', 'expired', 'cancelled')),
    suspension_reason VARCHAR(255) NULL,
    
    -- Usage Tracking (Current Period)
    current_users INTEGER DEFAULT 0,
    current_admin_users INTEGER DEFAULT 0,
    current_storage_gb DECIMAL(10,2) DEFAULT 0.00,
    current_products INTEGER DEFAULT 0,
    current_orders_this_month INTEGER DEFAULT 0,
    current_api_calls_this_month INTEGER DEFAULT 0,
    
    -- Usage Alerts
    usage_alert_threshold DECIMAL(5,2) DEFAULT 80.00, -- Alert at 80% usage
    last_usage_alert_sent TIMESTAMP NULL,
    overage_allowed BOOLEAN DEFAULT FALSE,
    overage_rate DECIMAL(10,4) DEFAULT 0.00, -- Per unit overage cost
    
    -- Renewal & Billing
    auto_renewal BOOLEAN DEFAULT TRUE,
    next_billing_date TIMESTAMP NULL,
    last_billed_at TIMESTAMP NULL,
    billing_contact_email VARCHAR(255) NULL,
    
    -- Audit Fields
    created_by UUID NULL,
    updated_by UUID NULL,
    activated_by UUID NULL,
    activated_at TIMESTAMP NULL,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(tenant_id), -- One license per tenant
    CONSTRAINT valid_date_range CHECK (valid_until > valid_from),
    CONSTRAINT positive_quotas CHECK (max_users > 0 AND max_storage_gb > 0)
);

-- Indexes
CREATE INDEX idx_tenant_service_licenses_uuid ON tenant_service_licenses(uuid);
CREATE INDEX idx_tenant_service_licenses_tenant ON tenant_service_licenses(tenant_id);
CREATE INDEX idx_tenant_service_licenses_platform ON tenant_service_licenses(platform_license_id);
CREATE INDEX idx_tenant_service_licenses_status ON tenant_service_licenses(status) WHERE status != 'cancelled';
CREATE INDEX idx_tenant_service_licenses_validity ON tenant_service_licenses(valid_until) WHERE status IN ('active', 'trial');
CREATE INDEX idx_tenant_service_licenses_billing ON tenant_service_licenses(next_billing_date) WHERE status = 'active';
CREATE INDEX idx_tenant_service_licenses_plan ON tenant_service_licenses(plan_type, plan_name);

-- RLS Policy
ALTER TABLE tenant_service_licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_service_license_isolation ON tenant_service_licenses
    USING (
        tenant_id::text = current_setting('app.tenant_id', true) OR
        platform_license_id::text = current_setting('app.platform_license_id', true)
    );
```

### Table 3: `license_validations`

**Purpose**: Audit trail for all license validation attempts

```sql
CREATE TABLE license_validations (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    -- License Reference
    platform_license_id UUID NOT NULL REFERENCES platform_licenses(uuid) ON DELETE CASCADE,
    
    -- Validation Context
    validation_type VARCHAR(50) NOT NULL CHECK (validation_type IN ('startup', 'periodic', 'api_request', 'manual')),
    validation_result VARCHAR(50) NOT NULL CHECK (validation_result IN ('valid', 'expired', 'invalid', 'revoked', 'error')),
    validation_message TEXT NULL,
    error_code VARCHAR(50) NULL,
    
    -- Request Context
    request_ip INET NULL,
    request_user_agent VARCHAR(1000) NULL,
    request_hostname VARCHAR(255) NULL,
    request_path VARCHAR(500) NULL,
    request_method VARCHAR(10) NULL,
    
    -- Features & Permissions Accessed
    requested_features JSONB DEFAULT '[]',
    granted_features JSONB DEFAULT '[]',
    denied_features JSONB DEFAULT '[]',
    permission_context VARCHAR(255) NULL,
    
    -- Performance Metrics
    validation_duration_ms INTEGER NULL,
    database_query_count INTEGER DEFAULT 0,
    cache_hit BOOLEAN DEFAULT FALSE,
    
    -- Environment Info
    server_hostname VARCHAR(255) NULL,
    server_version VARCHAR(100) NULL,
    app_environment VARCHAR(50) NULL, -- 'development', 'staging', 'production'
    
    -- Timing
    validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL, -- When this validation expires (for caching)
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_license_validations_license ON license_validations(platform_license_id);
CREATE INDEX idx_license_validations_result ON license_validations(validation_result);
CREATE INDEX idx_license_validations_date ON license_validations(validated_at);
CREATE INDEX idx_license_validations_type ON license_validations(validation_type);
CREATE INDEX idx_license_validations_ip ON license_validations(request_ip) WHERE request_ip IS NOT NULL;

-- Partitioning by month for performance
CREATE INDEX idx_license_validations_date_month ON license_validations(date_trunc('month', validated_at));
```

---

## LICENSE TYPES

### 1. Master Platform License

```json
{
  "license_type": "master",
  "features": [
    "platform_management",
    "tenant_management",
    "billing_management", 
    "user_management",
    "analytics_full",
    "support_management",
    "api_full_access",
    "configuration_management"
  ],
  "restrictions": {
    "tenant_business_data_access": false,
    "tenant_internal_settings": false
  },
  "max_tenants": null,
  "max_users": null,
  "delegation_allowed": true
}
```

### 2. Delegated Platform License

```json
{
  "license_type": "delegated", 
  "parent_license_id": "master-uuid",
  "features": [
    "tenant_support",
    "billing_readonly",
    "analytics_readonly",
    "user_readonly"
  ],
  "restrictions": {
    "platform_configuration": false,
    "tenant_creation": false,
    "license_management": false
  },
  "max_tenants": 100,
  "delegation_allowed": false
}
```

### 3. Service License Plans

**Basic Plan ($29/month):**
```json
{
  "plan_type": "basic",
  "max_users": 5,
  "max_storage_gb": 1,
  "features": ["cms_basic", "user_management", "reports_basic"],
  "support_level": "basic"
}
```

**Pro Plan ($99/month):**
```json
{
  "plan_type": "pro",
  "max_users": 25, 
  "max_storage_gb": 10,
  "features": ["cms_advanced", "inventory", "financial_tracking", "analytics"],
  "support_level": "standard"
}
```

**Enterprise Plan ($299/month):**
```json
{
  "plan_type": "enterprise",
  "max_users": null,
  "max_storage_gb": 100,
  "features": ["cms_full", "inventory_advanced", "financial_full", "api_access", "integrations"],
  "support_level": "premium"
}
```

---

## SECURITY IMPLEMENTATION

### License Generation Process

```typescript
interface LicensePayload {
  uuid: string;
  type: 'master' | 'delegated';
  owner: {
    name: string;
    email: string;
    organization?: string;
  };
  features: string[];
  restrictions: Record<string, any>;
  validity: {
    issued_at: number;
    valid_from: number; 
    valid_until: number;
  };
  quotas: {
    max_tenants?: number;
    max_users?: number;
  };
}

interface GeneratedLicense {
  license_key: string; // Base64 encoded
  license_hash: string; // SHA-256
  signature: string;   // RSA signature
  public_key: string;  // RSA public key
}
```

### Validation Middleware

```php
// Laravel Middleware
class ValidatePlatformLicense
{
    public function handle($request, Closure $next)
    {
        if (!$this->isPlatformRequest($request)) {
            return $next($request);
        }
        
        $licenseKey = config('app.platform_license_key');
        $result = $this->licenseValidator->validate($licenseKey);
        
        if (!$result->isValid()) {
            $this->logValidation($result, $request);
            return response()->json(['error' => 'Invalid platform license'], 403);
        }
        
        // Set license context for request
        app()->instance('platform_license', $result->getLicenseData());
        $this->logValidation($result, $request);
        
        return $next($request);
    }
}
```

---

## API ENDPOINTS

### Platform License Management

```yaml
# Platform License Management (admin.stencil.com)
POST /api/platform/licenses
  summary: Create new platform license
  security: [{ platformAuth: [] }]
  requestBody:
    required: true
    content:
      application/json:
        schema:
          type: object
          required: [owner_email, valid_until, features]
          properties:
            owner_name: { type: string }
            owner_email: { type: string, format: email }
            owner_organization: { type: string }
            valid_until: { type: string, format: date-time }
            features: { type: array, items: { type: string } }
            max_tenants: { type: integer, minimum: 1 }
            license_type: { type: string, enum: [master, delegated] }

GET /api/platform/licenses
  summary: List all platform licenses
  security: [{ platformAuth: [] }]
  parameters:
    - name: status
      in: query
      schema: { type: string, enum: [active, expired, revoked] }
    - name: type
      in: query  
      schema: { type: string, enum: [master, delegated] }
  responses:
    200:
      content:
        application/json:
          schema:
            type: object
            properties:
              licenses:
                type: array
                items:
                  $ref: '#/components/schemas/PlatformLicense'

GET /api/platform/licenses/{uuid}
  summary: Get platform license details
  security: [{ platformAuth: [] }]
  parameters:
    - name: uuid
      in: path
      required: true
      schema: { type: string, format: uuid }

PATCH /api/platform/licenses/{uuid}
  summary: Update platform license
  security: [{ platformAuth: [] }]
  requestBody:
    content:
      application/json:
        schema:
          type: object
          properties:
            valid_until: { type: string, format: date-time }
            status: { type: string, enum: [active, suspended, revoked] }
            features: { type: array, items: { type: string } }

DELETE /api/platform/licenses/{uuid}
  summary: Revoke platform license
  security: [{ platformAuth: [] }]
```

### Tenant Service License Management

```yaml
# Tenant Service License Management
POST /api/platform/tenants/{tenant_id}/service-license
  summary: Create/update tenant service license
  security: [{ platformAuth: [] }]
  parameters:
    - name: tenant_id
      in: path
      required: true
      schema: { type: string, format: uuid }
  requestBody:
    required: true
    content:
      application/json:
        schema:
          type: object
          required: [plan_type, valid_until]
          properties:
            plan_type: { type: string, enum: [basic, pro, enterprise, custom] }
            plan_name: { type: string }
            max_users: { type: integer, minimum: 1 }
            max_storage_gb: { type: integer, minimum: 1 }
            features: { type: array, items: { type: string } }
            monthly_price: { type: number, minimum: 0 }
            valid_until: { type: string, format: date-time }

GET /api/platform/tenants/{tenant_id}/service-license
  summary: Get tenant service license
  security: [{ platformAuth: [], tenantAuth: [] }]
  responses:
    200:
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/TenantServiceLicense'

GET /api/platform/tenants/{tenant_id}/usage
  summary: Get tenant usage statistics
  security: [{ platformAuth: [], tenantAuth: [] }]
  responses:
    200:
      content:
        application/json:
          schema:
            type: object
            properties:
              users: 
                type: object
                properties:
                  current: { type: integer }
                  limit: { type: integer }
                  percentage: { type: number }
              storage:
                type: object
                properties:
                  current_gb: { type: number }
                  limit_gb: { type: integer }
                  percentage: { type: number }
```

### License Validation

```yaml
# License Validation
POST /api/auth/validate-platform-license
  summary: Validate platform license key
  description: Public endpoint for license installation/validation
  requestBody:
    required: true
    content:
      application/json:
        schema:
          type: object
          required: [license_key]
          properties:
            license_key: { type: string }
            environment: { type: string, enum: [development, staging, production] }
  responses:
    200:
      content:
        application/json:
          schema:
            type: object
            properties:
              valid: { type: boolean }
              owner: { type: string }
              features: { type: array, items: { type: string } }
              expires_at: { type: string, format: date-time }
              max_tenants: { type: integer }
    403:
      content:
        application/json:
          schema:
            type: object
            properties:
              error: { type: string }
              message: { type: string }

GET /api/platform/validation-history
  summary: Get license validation history
  security: [{ platformAuth: [] }]
  parameters:
    - name: days
      in: query
      schema: { type: integer, default: 7, maximum: 90 }
    - name: result
      in: query
      schema: { type: string, enum: [valid, expired, invalid, error] }
  responses:
    200:
      content:
        application/json:
          schema:
            type: object
            properties:
              validations:
                type: array
                items:
                  type: object
                  properties:
                    validated_at: { type: string, format: date-time }
                    result: { type: string }
                    message: { type: string }
                    request_ip: { type: string }
                    features_requested: { type: array }
```

---

## ADMIN UI FEATURES

### Platform License Management (`src/pages/platform/LicenseManagement.tsx`)

```typescript
interface LicenseManagementFeatures {
  // License Overview
  licenseList: {
    filters: ['active', 'expired', 'revoked'];
    columns: ['owner', 'type', 'expires', 'tenants', 'status'];
    actions: ['view', 'edit', 'renew', 'revoke'];
  };
  
  // License Creation
  createLicense: {
    form: ['owner_details', 'features', 'quotas', 'validity'];
    validation: 'real_time';
    preview: 'license_key_preview';
  };
  
  // License Details
  viewLicense: {
    tabs: ['details', 'features', 'usage', 'validation_history'];
    charts: ['usage_over_time', 'validation_success_rate'];
    actions: ['extend', 'modify_features', 'delegate'];
  };
  
  // Validation History
  validationHistory: {
    filters: ['date_range', 'result', 'ip_address'];
    realTime: 'live_validation_feed';
    alerts: 'failed_validation_alerts';
  };
}
```

### Tenant Service Licenses (`src/pages/platform/TenantServiceLicenses.tsx`)

```typescript
interface TenantServiceLicenseFeatures {
  // Service Plan Management
  planManagement: {
    predefinedPlans: ['basic', 'pro', 'enterprise'];
    customPlans: 'custom_plan_builder';
    pricing: 'dynamic_pricing_calculator';
  };
  
  // Tenant License Overview
  tenantOverview: {
    list: 'tenant_license_table';
    search: 'tenant_search_filter';
    bulkActions: ['upgrade', 'downgrade', 'suspend'];
  };
  
  // Usage Monitoring
  usageMonitoring: {
    realTimeUsage: 'live_usage_dashboard';
    alerts: 'quota_exceed_alerts';
    trends: 'usage_trend_analysis';
  };
  
  // Billing Integration
  billing: {
    invoiceGeneration: 'automated_invoicing';
    paymentTracking: 'payment_status_tracking';
    revenueReports: 'revenue_analytics';
  };
}
```

---

## MIGRATION STRATEGY

### Phase 1: Database Schema Creation

```sql
-- 1. Create new licensing tables
CREATE TABLE platform_licenses (...);
CREATE TABLE tenant_service_licenses (...);
CREATE TABLE license_validations (...);

-- 2. Add license references to existing tables
ALTER TABLE users ADD COLUMN platform_license_id UUID REFERENCES platform_licenses(uuid);
ALTER TABLE tenants ADD COLUMN service_license_id UUID REFERENCES tenant_service_licenses(uuid);

-- 3. Update existing platform settings
ALTER TABLE platform_settings 
ADD COLUMN platform_license_id UUID REFERENCES platform_licenses(uuid);
```

### Phase 2: Data Migration

```php
// Migrate existing platform data
class MigratePlatformLicensing extends Migration
{
    public function up()
    {
        // 1. Create master platform license
        $masterLicense = PlatformLicense::create([
            'license_key' => $this->generateMasterLicense(),
            'license_type' => 'master',
            'owner_name' => config('app.platform_owner_name'),
            'owner_email' => config('app.platform_owner_email'),
            'features' => ['platform_management', 'tenant_management', 'billing_management'],
            'valid_until' => now()->addYear(),
            'status' => 'active'
        ]);
        
        // 2. Update existing platform settings
        DB::table('platform_settings')
            ->whereNull('tenant_id')
            ->update(['platform_license_id' => $masterLicense->uuid]);
            
        // 3. Create service licenses for existing tenants
        $tenants = DB::table('tenants')->get();
        foreach ($tenants as $tenant) {
            TenantServiceLicense::create([
                'tenant_id' => $tenant->uuid,
                'platform_license_id' => $masterLicense->uuid,
                'plan_type' => 'pro', // Default migration to Pro plan
                'max_users' => 25,
                'max_storage_gb' => 10,
                'features' => ['cms_advanced', 'inventory', 'analytics'],
                'monthly_price' => 99.00,
                'valid_until' => now()->addYear()
            ]);
        }
        
        // 4. Remove old tenant_id IS NULL queries
        $this->updateApplicationCode();
    }
}
```

### Phase 3: Code Refactoring

```php
// Old insecure approach
class OldPlatformService 
{
    public function getPlatformSettings()
    {
        return DB::table('platform_settings')
            ->whereNull('tenant_id') // ❌ REMOVE THIS
            ->get();
    }
}

// New secure approach
class PlatformService
{
    public function getPlatformSettings()
    {
        $license = app('platform_license');
        if (!$license || !$this->validateLicense($license)) {
            throw new UnauthorizedException('Invalid platform license');
        }
        
        return DB::table('platform_settings')
            ->where('platform_license_id', $license['uuid']) // ✅ SECURE
            ->where('license_valid_until', '>', now())
            ->get();
    }
    
    private function validateLicense($license): bool
    {
        return $this->licenseValidator->validateSignature($license);
    }
}
```

---

**Summary**: Platform Licensing System provides enterprise-grade security replacing vulnerable `tenant_id IS NULL` with RSA-encrypted license validation, complete audit trails, and hierarchical service management for scalable multi-tenant operations.