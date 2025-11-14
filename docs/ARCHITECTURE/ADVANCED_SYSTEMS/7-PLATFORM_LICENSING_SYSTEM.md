# PLATFORM LICENSING SYSTEM
## Secure License Management for Multi-Tenant Platform

**Version:** 1.0  
**Last Updated:** November 14, 2025  
**Complexity:** High  
**Impact:** Critical - Security Foundation  
**Status:** 🏗️ **Architecture Design** (Implementation Required)

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Security Analysis](#security-analysis)
3. [License Architecture](#license-architecture)
4. [Database Schema](#database-schema)
5. [License Types](#license-types)
6. [Validation System](#validation-system)
7. [API Endpoints](#api-endpoints)
8. [Security Implementation](#security-implementation)
9. [License Lifecycle](#license-lifecycle)
10. [Migration Strategy](#migration-strategy)

---

## EXECUTIVE SUMMARY

### Problem with `tenant_id IS NULL` Approach

**Security Risks:**
❌ **SQL Injection**: `WHERE tenant_id IS NULL` dapat dimanipulasi  
❌ **Access Control**: Tidak ada fine-grained control  
❌ **Audit Trail**: Sulit tracking siapa access apa  
❌ **Scalability**: Tidak support multiple platform administrators  
❌ **Licensing**: Tidak ada license validation mechanism

### Recommended Solution: **Platform License System**

**Enhanced Security:**
✅ **Cryptographic Licensing**: RSA/AES encrypted license keys  
✅ **Multi-Layer Validation**: Database + Config + Runtime checks  
✅ **Audit Logging**: Complete access tracking  
✅ **Granular Control**: Feature-level licensing  
✅ **Expiration Management**: Automatic renewal workflows

---

## SECURITY ANALYSIS

### Current Risk Assessment

```sql
-- DANGEROUS: Current approach
SELECT * FROM platform_settings WHERE tenant_id IS NULL;

-- RISKS:
-- 1. Anyone dengan database access dapat bypass tenant isolation
-- 2. Tidak ada validation mechanism
-- 3. Tidak ada audit trail
-- 4. Tidak ada expiration control
-- 5. Tidak ada license feature restrictions
```

### Proposed Secure Architecture

```sql
-- SECURE: License-based approach
SELECT * FROM platform_settings 
WHERE platform_license_id = current_setting('app.platform_license_id')
AND license_valid_until > NOW()
AND license_status = 'active';

-- BENEFITS:
-- ✅ Cryptographic validation required
-- ✅ Complete audit trail
-- ✅ Expiration control
-- ✅ Feature-level restrictions
-- ✅ Multiple license support
```

---

## LICENSE ARCHITECTURE

### License Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                PLATFORM LICENSES                        │
│                                                         │
│  Master License (Platform Owner)                       │
│  ├── Features: All platform management                 │
│  ├── Validity: 1 year renewable                        │
│  ├── Max Tenants: Unlimited                            │
│  └── Support Level: Premium                            │
│                                                         │
│  Sub-licenses (Delegated Admins)                       │
│  ├── Features: Limited platform access                 │
│  ├── Validity: Inherited from Master                   │  
│  ├── Max Tenants: Configurable                         │
│  └── Support Level: Standard                           │
└─────────────────────────────────────────────────────────┘
                         │
                         │ manages
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────┐            ┌──────────────────┐
│   TENANT A       │            │   TENANT B       │
│                  │            │                  │
│  Service License │            │  Service License │
│  ├── Plan: Pro   │            │  ├── Plan: Basic │
│  ├── Users: 50   │            │  ├── Users: 10   │
│  ├── Storage: 1TB│            │  ├── Storage: 10GB│
│  └── Features:   │            │  └── Features:   │
│      - CMS       │            │      - CMS       │
│      - Inventory │            │      - Basic     │
│      - Analytics │            │      - Reports   │
└──────────────────┘            └──────────────────┘
```

### License Generation Flow

```mermaid
graph TD
    A[Platform Owner Registration] --> B[Generate Master License Key]
    B --> C[RSA Key Pair Generation]
    C --> D[License Data Encryption]
    D --> E[Store in Database + Config]
    E --> F[Send License Key to Owner]
    F --> G[Owner Installs License]
    G --> H[System Validates License]
    H --> I[Platform Activated]
```

---

## DATABASE SCHEMA

### Table 1: `platform_licenses`

```sql
CREATE TABLE platform_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- License Identity
    license_key VARCHAR(255) NOT NULL UNIQUE, -- Encrypted license string
    license_hash VARCHAR(255) NOT NULL UNIQUE, -- SHA-256 hash for quick lookup
    license_type VARCHAR(50) NOT NULL CHECK (license_type IN ('master', 'delegated')),
    
    -- Owner Information  
    owner_name VARCHAR(255) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    owner_organization VARCHAR(255) NULL,
    
    -- License Scope
    max_tenants INTEGER DEFAULT NULL, -- NULL = unlimited
    max_users INTEGER DEFAULT NULL,   -- NULL = unlimited  
    max_storage_gb INTEGER DEFAULT NULL, -- NULL = unlimited
    
    -- Features
    features JSONB DEFAULT '[]', -- ['user_management', 'billing', 'analytics']
    restrictions JSONB DEFAULT '{}', -- Custom restrictions
    
    -- Validity
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NOT NULL,
    last_validated TIMESTAMP NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired', 'revoked')),
    
    -- Hierarchy (for delegated licenses)
    parent_license_id UUID NULL REFERENCES platform_licenses(id) ON DELETE CASCADE,
    
    -- Security
    signature VARCHAR(1000) NOT NULL, -- RSA signature
    public_key TEXT NOT NULL,         -- RSA public key for validation
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_platform_licenses_hash ON platform_licenses(license_hash);
CREATE INDEX idx_platform_licenses_key ON platform_licenses(license_key);
CREATE INDEX idx_platform_licenses_email ON platform_licenses(owner_email);
CREATE INDEX idx_platform_licenses_status ON platform_licenses(status);
CREATE INDEX idx_platform_licenses_validity ON platform_licenses(valid_until);
CREATE INDEX idx_platform_licenses_parent ON platform_licenses(parent_license_id);
```

### Table 2: `tenant_service_licenses`

```sql
CREATE TABLE tenant_service_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tenant Reference
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Platform License Reference
    platform_license_id UUID NOT NULL REFERENCES platform_licenses(id) ON DELETE CASCADE,
    
    -- Service Plan
    plan_type VARCHAR(50) NOT NULL, -- 'basic', 'pro', 'enterprise'
    plan_name VARCHAR(255) NOT NULL,
    
    -- Quotas
    max_users INTEGER NOT NULL DEFAULT 10,
    max_storage_gb INTEGER NOT NULL DEFAULT 1,
    max_products INTEGER DEFAULT NULL,
    max_orders_per_month INTEGER DEFAULT NULL,
    
    -- Features
    features JSONB NOT NULL DEFAULT '[]',
    addons JSONB DEFAULT '[]',
    
    -- Billing
    monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'yearly'
    
    -- Validity
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired', 'cancelled')),
    
    -- Usage Tracking
    current_users INTEGER DEFAULT 0,
    current_storage_gb DECIMAL(10,2) DEFAULT 0.00,
    current_products INTEGER DEFAULT 0,
    current_orders_this_month INTEGER DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, platform_license_id)
);

CREATE INDEX idx_tenant_service_licenses_tenant ON tenant_service_licenses(tenant_id);
CREATE INDEX idx_tenant_service_licenses_platform ON tenant_service_licenses(platform_license_id);
CREATE INDEX idx_tenant_service_licenses_status ON tenant_service_licenses(status);
CREATE INDEX idx_tenant_service_licenses_validity ON tenant_service_licenses(valid_until);
```

### Table 3: `license_validations`

```sql
CREATE TABLE license_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- License Reference
    platform_license_id UUID NOT NULL REFERENCES platform_licenses(id) ON DELETE CASCADE,
    
    -- Validation Details
    validation_type VARCHAR(50) NOT NULL, -- 'startup', 'periodic', 'api_call'
    validation_result VARCHAR(50) NOT NULL, -- 'valid', 'expired', 'invalid', 'error'
    validation_message TEXT NULL,
    
    -- Environment Info
    server_hostname VARCHAR(255) NULL,
    server_ip INET NULL,
    user_agent VARCHAR(500) NULL,
    
    -- Features Accessed
    requested_features JSONB DEFAULT '[]',
    granted_features JSONB DEFAULT '[]',
    
    -- Timing
    validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_license_validations_license ON license_validations(platform_license_id);
CREATE INDEX idx_license_validations_result ON license_validations(validation_result);
CREATE INDEX idx_license_validations_type ON license_validations(validation_type);
CREATE INDEX idx_license_validations_date ON license_validations(validated_at);
```

---

## LICENSE TYPES

### 1. Platform Master License (Type A)

**Characteristics:**
```json
{
  "license_type": "master",
  "features": [
    "platform_management",
    "tenant_management", 
    "billing_management",
    "user_management",
    "analytics_full",
    "support_access",
    "api_full_access"
  ],
  "max_tenants": null,
  "max_users": null,
  "restrictions": {
    "tenant_business_data_access": false,
    "tenant_internal_settings": false
  }
}
```

**Permissions:**
- ✅ Manage all tenants (create, suspend, delete)
- ✅ View tenant billing & usage
- ✅ Platform configuration & settings
- ✅ Global analytics & reporting  
- ✅ Support ticket management
- ❌ **FORBIDDEN**: Access tenant business data
- ❌ **FORBIDDEN**: Modify tenant internal business settings

### 2. Platform Delegated License (Type A)

**Characteristics:**
```json
{
  "license_type": "delegated",
  "parent_license_id": "master_license_uuid",
  "features": [
    "tenant_support",
    "billing_readonly", 
    "analytics_readonly"
  ],
  "max_tenants": 100,
  "restrictions": {
    "platform_configuration": false,
    "tenant_creation": false,
    "billing_management": false
  }
}
```

### 3. Tenant Service License (Type B)

**Basic Plan:**
```json
{
  "plan_type": "basic",
  "max_users": 5,
  "max_storage_gb": 1,
  "max_products": 100,
  "features": [
    "cms_basic",
    "user_management", 
    "reports_basic"
  ],
  "monthly_price": 29.00
}
```

**Pro Plan:**
```json
{
  "plan_type": "pro", 
  "max_users": 25,
  "max_storage_gb": 10,
  "max_products": 1000,
  "features": [
    "cms_advanced",
    "inventory_management",
    "financial_tracking",
    "analytics_advanced",
    "api_access"
  ],
  "monthly_price": 99.00
}
```

**Enterprise Plan:**
```json
{
  "plan_type": "enterprise",
  "max_users": null,
  "max_storage_gb": 100, 
  "max_products": null,
  "features": [
    "cms_full",
    "inventory_advanced",
    "financial_full",
    "analytics_full",
    "api_full",
    "custom_integrations",
    "priority_support"
  ],
  "monthly_price": 299.00
}
```

---

## VALIDATION SYSTEM

### License Generation Process

```php
<?php
// Platform License Generator
class PlatformLicenseGenerator
{
    private $privateKey;
    private $publicKey;
    
    public function generateMasterLicense(array $licenseData): string
    {
        // 1. Create license payload
        $payload = [
            'type' => 'master',
            'owner' => $licenseData['owner'],
            'features' => $licenseData['features'],
            'issued_at' => time(),
            'valid_until' => $licenseData['valid_until'],
            'uuid' => Uuid::uuid4()
        ];
        
        // 2. Encrypt payload
        $encryptedPayload = $this->encryptPayload($payload);
        
        // 3. Create signature
        $signature = $this->createSignature($encryptedPayload);
        
        // 4. Combine to license key
        $licenseKey = base64_encode(json_encode([
            'payload' => $encryptedPayload,
            'signature' => $signature,
            'public_key' => $this->publicKey
        ]));
        
        return $licenseKey;
    }
    
    public function validateLicense(string $licenseKey): LicenseValidationResult
    {
        try {
            // 1. Decode license key
            $licenseData = json_decode(base64_decode($licenseKey), true);
            
            // 2. Verify signature
            if (!$this->verifySignature($licenseData)) {
                return new LicenseValidationResult(false, 'Invalid signature');
            }
            
            // 3. Decrypt payload
            $payload = $this->decryptPayload($licenseData['payload']);
            
            // 4. Check expiration
            if ($payload['valid_until'] < time()) {
                return new LicenseValidationResult(false, 'License expired');
            }
            
            // 5. Validate against database
            $dbLicense = $this->findLicenseInDatabase($payload['uuid']);
            if (!$dbLicense || $dbLicense->status !== 'active') {
                return new LicenseValidationResult(false, 'License revoked or inactive');
            }
            
            return new LicenseValidationResult(true, 'Valid', $payload);
            
        } catch (Exception $e) {
            return new LicenseValidationResult(false, 'Validation error: ' . $e->getMessage());
        }
    }
}
```

### Runtime Validation Middleware

```php
<?php
// Laravel Middleware for Platform License Validation
class ValidatePlatformLicense
{
    public function handle($request, Closure $next)
    {
        // 1. Check if this is platform admin request
        if (!$this->isPlatformAdminRequest($request)) {
            return $next($request);
        }
        
        // 2. Get license from config/environment
        $licenseKey = config('app.platform_license_key');
        if (!$licenseKey) {
            return response()->json(['error' => 'Platform license not configured'], 403);
        }
        
        // 3. Validate license
        $validator = app(PlatformLicenseValidator::class);
        $result = $validator->validateLicense($licenseKey);
        
        if (!$result->isValid) {
            return response()->json(['error' => $result->message], 403);
        }
        
        // 4. Set license context
        app()->instance('platform_license', $result->licenseData);
        
        // 5. Log validation
        $this->logValidation($result, $request);
        
        return $next($request);
    }
    
    private function isPlatformAdminRequest($request): bool
    {
        return str_starts_with($request->path(), 'api/platform/') || 
               $request->header('X-Platform-Admin') === 'true';
    }
}
```

### Database Query Security

```php
<?php
// Secure Platform Data Access
class PlatformRepository
{
    public function getPlatformSettings(): array
    {
        // Get current license context
        $license = app('platform_license');
        if (!$license) {
            throw new UnauthorizedException('No platform license');
        }
        
        // Query with license validation
        return DB::table('platform_settings')
            ->where('platform_license_id', $license['uuid'])
            ->where('license_valid_until', '>', now())
            ->get();
    }
    
    public function getTenantList(): Collection
    {
        $license = app('platform_license');
        
        // Check max_tenants restriction
        $maxTenants = $license['max_tenants'] ?? null;
        
        $query = DB::table('tenants')
            ->where('platform_license_id', $license['uuid']);
            
        if ($maxTenants !== null) {
            $query->limit($maxTenants);
        }
        
        return $query->get();
    }
}
```

---

## API ENDPOINTS

### Platform License Management

```yaml
# Platform License Endpoints
POST /api/platform/licenses
  - Create new platform license
  - Requires: Master license
  - Body: { owner_email, features, valid_until, max_tenants }

GET /api/platform/licenses
  - List all platform licenses
  - Requires: Master license
  - Response: [{ id, owner_email, status, valid_until, features }]

GET /api/platform/licenses/{id}
  - Get specific license details
  - Requires: Master license or own license
  
PATCH /api/platform/licenses/{id}
  - Update license (extend, modify features)
  - Requires: Master license
  
DELETE /api/platform/licenses/{id}
  - Revoke license
  - Requires: Master license

POST /api/platform/licenses/{id}/validate
  - Force license validation
  - Requires: Any platform license
  - Response: { valid, message, expires_at, features }
```

### Tenant Service License Management

```yaml
# Tenant Service License Endpoints  
POST /api/platform/tenants/{tenant_id}/license
  - Create/update tenant service license
  - Requires: Platform license
  - Body: { plan_type, max_users, features, valid_until }

GET /api/platform/tenants/{tenant_id}/license
  - Get tenant license details
  - Requires: Platform license or tenant admin

PATCH /api/platform/tenants/{tenant_id}/license
  - Upgrade/downgrade tenant plan
  - Requires: Platform license
  
DELETE /api/platform/tenants/{tenant_id}/license  
  - Cancel tenant license (suspend services)
  - Requires: Platform license

GET /api/platform/tenants/{tenant_id}/usage
  - Get tenant usage stats
  - Requires: Platform license or tenant admin
  - Response: { users: 15/25, storage: 5.2/10, products: 150/1000 }
```

### License Validation Endpoints

```yaml
# Validation Endpoints
POST /api/auth/validate-platform-license
  - Validate platform license key
  - Public endpoint (for initial setup)
  - Body: { license_key }
  - Response: { valid, features, expires_at, owner }

GET /api/platform/validation-history
  - Get license validation logs
  - Requires: Platform license
  - Response: [{ timestamp, result, message, features_requested }]

POST /api/platform/license/renew
  - Request license renewal
  - Requires: Valid platform license
  - Body: { renewal_period }
```

---

## SECURITY IMPLEMENTATION

### Configuration Management

```php
<?php
// config/platform.php
return [
    // Platform License Configuration
    'license_key' => env('PLATFORM_LICENSE_KEY'),
    'license_validation_interval' => env('PLATFORM_LICENSE_VALIDATION_INTERVAL', 3600), // 1 hour
    'license_grace_period' => env('PLATFORM_LICENSE_GRACE_PERIOD', 86400 * 7), // 7 days
    
    // RSA Keys for License Validation
    'license_public_key' => env('PLATFORM_LICENSE_PUBLIC_KEY'),
    'license_private_key' => env('PLATFORM_LICENSE_PRIVATE_KEY'), // Only on license server
    
    // Features
    'default_platform_features' => [
        'tenant_management',
        'user_management', 
        'billing_management',
        'analytics_basic'
    ],
    
    'premium_platform_features' => [
        'analytics_advanced',
        'api_full_access',
        'priority_support',
        'custom_integrations'
    ]
];
```

### Environment Variables

```bash
# .env - Platform Configuration
PLATFORM_LICENSE_KEY="base64_encoded_license_key_here"
PLATFORM_LICENSE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# License Server Configuration (separate server)
PLATFORM_LICENSE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
PLATFORM_LICENSE_SERVER_URL="https://license.stencil.com/api"

# Validation Settings
PLATFORM_LICENSE_VALIDATION_INTERVAL=3600
PLATFORM_LICENSE_GRACE_PERIOD=604800
PLATFORM_LICENSE_AUTO_RENEWAL=true
```

### License Installation Process

```bash
# Installation Command
php artisan platform:license:install

# This command will:
# 1. Prompt for license key
# 2. Validate license key against license server
# 3. Store license in config file
# 4. Create platform_licenses record in database
# 5. Set up cron job for periodic validation
# 6. Generate platform admin user
```

---

## LICENSE LIFECYCLE

### 1. License Creation & Distribution

```mermaid
graph TD
    A[Customer Purchases Platform License] --> B[License Server Generates Key]
    B --> C[RSA Encryption + Signing]
    C --> D[Store in License Database]
    D --> E[Email License Key to Customer]
    E --> F[Customer Installs License]
    F --> G[Platform Activated]
```

### 2. Periodic Validation

```mermaid
graph TD
    A[Cron Job Triggers] --> B[Read License from Config]
    B --> C[Validate Against Database]
    C --> D{License Valid?}
    D -->|Yes| E[Update last_validated]
    D -->|No| F[Trigger Grace Period]
    F --> G[Send Renewal Notification]
    G --> H[Restrict Platform Access]
    E --> I[Continue Normal Operation]
```

### 3. License Renewal Process

```mermaid
graph TD
    A[License Expiring Soon] --> B[Send Renewal Notification]
    B --> C[Customer Renews License]
    C --> D[License Server Extends Validity]
    D --> E[New License Key Generated]
    E --> F[Auto-update Platform License]
    F --> G[Confirm Renewal Success]
```

---

## MIGRATION STRATEGY

### Phase 1: Database Migration

```sql
-- Migration: Add license system tables
CREATE TABLE platform_licenses (...);
CREATE TABLE tenant_service_licenses (...);
CREATE TABLE license_validations (...);

-- Migration: Add license_id to existing tables
ALTER TABLE platform_settings 
ADD COLUMN platform_license_id UUID REFERENCES platform_licenses(id);

ALTER TABLE tenants 
ADD COLUMN service_license_id UUID REFERENCES tenant_service_licenses(id);

-- Migration: Update existing data
UPDATE platform_settings 
SET platform_license_id = (SELECT id FROM platform_licenses LIMIT 1)
WHERE tenant_id IS NULL;
```

### Phase 2: Code Migration

```php
<?php
// OLD: Insecure approach
class PlatformService 
{
    public function getPlatformSettings() 
    {
        return DB::table('platform_settings')
            ->whereNull('tenant_id')  // ❌ INSECURE
            ->get();
    }
}

// NEW: Secure license-based approach  
class PlatformService
{
    public function getPlatformSettings()
    {
        $license = app('platform_license');
        if (!$license) {
            throw new UnauthorizedException();
        }
        
        return DB::table('platform_settings')
            ->where('platform_license_id', $license['uuid'])  // ✅ SECURE
            ->where('license_valid_until', '>', now())
            ->get();
    }
}
```

### Phase 3: Frontend Integration

```typescript
// Platform License Context
interface PlatformLicense {
  id: string;
  owner: string;
  features: string[];
  validUntil: Date;
  maxTenants: number | null;
}

const usePlatformLicense = () => {
  const [license, setLicense] = useState<PlatformLicense | null>(null);
  
  useEffect(() => {
    validatePlatformLicense()
      .then(setLicense)
      .catch(() => setLicense(null));
  }, []);
  
  return { license, hasFeature: (feature: string) => license?.features.includes(feature) };
};

// Usage in components
const PlatformDashboard = () => {
  const { license, hasFeature } = usePlatformLicense();
  
  if (!license) {
    return <LicenseExpiredScreen />;
  }
  
  return (
    <div>
      <h1>Platform Dashboard</h1>
      {hasFeature('tenant_management') && <TenantManagement />}
      {hasFeature('billing_management') && <BillingDashboard />}
      {hasFeature('analytics_advanced') && <AdvancedAnalytics />}
    </div>
  );
};
```

---

**Kesimpulan:** Sistem licensing ini mengganti pendekatan `tenant_id IS NULL` yang berbahaya dengan validasi kriptografik berlapis, memberikan kontrol granular, audit trail lengkap, dan keamanan enterprise-grade untuk Platform Owner dan Tenant Service management.