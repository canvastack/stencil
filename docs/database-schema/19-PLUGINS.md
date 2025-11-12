# PLUGIN MARKETPLACE SYSTEM
## Database Schema & API Documentation

**Module:** Plugin Marketplace & Extensibility System  
**Total Fields:** 285 fields  
**Total Tables:** 12 tables (plugins, plugin_installations, plugin_settings, plugin_hooks, plugin_events, plugin_marketplace_listings, plugin_purchases, plugin_api_keys, plugin_files, plugin_validation_results, plugin_security_scans, plugin_analytics)  
**Status:** 🚧 PLANNED - Architecture Blueprint  
**Architecture Reference:** `docs/ARCHITECTURE/ADVANCED_SYSTEMS/4-PLUGIN_MARKETPLACE_SYSTEM.md`

## 🔒 CORE IMMUTABLE RULES COMPLIANCE

### **Rule 1: Teams Enabled with tenant_id as team_foreign_key**
✅ **ENFORCED** - All plugin tables include mandatory `tenant_id UUID NOT NULL` with foreign key constraints to `tenants(uuid)` table. Plugin installations and settings are strictly isolated per tenant.

### **Rule 2: API Guard Implementation**  
✅ **ENFORCED** - All plugin API endpoints use `guard_name: api` with Laravel Sanctum authentication. Plugin operations require valid API tokens and tenant context.

### **Rule 3: UUID model_morph_key**
✅ **ENFORCED** - All plugin tables use `uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid()` as the public identifier for external API references and plugin system integration.

### **Rule 4: Strict Tenant Data Isolation**
✅ **ENFORCED** - No global plugin installations with NULL tenant_id. Every plugin installation, setting, and hook registration is strictly scoped to a specific tenant. Cross-tenant plugin access is impossible at the database level.

### **Rule 5: RBAC Integration Requirements**
✅ **ENFORCED** - Plugin management requires specific tenant-scoped permissions with standardized naming:
- `plugins.view` - View available plugins and marketplace listings
- `plugins.create` - Create and develop new plugins
- `plugins.edit` - Edit plugin code and configurations
- `plugins.delete` - Delete plugins and installations
- `plugins.manage` - Full plugin lifecycle management
- `plugins.install` - Install and uninstall plugins
- `plugins.activate` - Activate and deactivate plugins
- `plugins.configure` - Modify plugin settings and configurations
- `plugins.purchase` - Purchase premium plugins from marketplace
- `plugins.admin` - Administrative access to plugin system and marketplace

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Business Context](#business-context)
3. [Plugin Architecture](#plugin-architecture)
4. [Database Schema](#database-schema)
   - [Table 1: plugins](#table-1-plugins)
   - [Table 2: plugin_installations](#table-2-plugin_installations)
   - [Table 3: plugin_settings](#table-3-plugin_settings)
   - [Table 4: plugin_hooks](#table-4-plugin_hooks)
   - [Table 5: plugin_events](#table-5-plugin_events)
   - [Table 6: plugin_marketplace_listings](#table-6-plugin_marketplace_listings)
   - [Table 7: plugin_purchases](#table-7-plugin_purchases)
   - [Table 8: plugin_api_keys](#table-8-plugin_api_keys)
   - [Table 9: plugin_files](#table-9-plugin_files)
   - [Table 10: plugin_validation_results](#table-10-plugin_validation_results)
   - [Table 11: plugin_security_scans](#table-11-plugin_security_scans)
   - [Table 12: plugin_analytics](#table-12-plugin_analytics)
5. [Advanced Plugin Features](#advanced-plugin-features)
6. [Plugin Development Tools](#plugin-development-tools)
7. [Security & Validation System](#security--validation-system)
8. [Plugin Analytics & Monitoring](#plugin-analytics--monitoring)
9. [Relationship Diagram](#relationship-diagram)
10. [Field Specifications](#field-specifications)
11. [Business Rules](#business-rules)
12. [Plugin Lifecycle](#plugin-lifecycle)
13. [Admin UI Features](#admin-ui-features)
14. [API Endpoints](#api-endpoints)

---

## OVERVIEW

Plugin Marketplace System adalah **comprehensive extensibility platform** yang memungkinkan Stencil CMS di-extend dengan third-party plugins tanpa modifikasi core code. Sistem ini dirancang dengan **hybrid execution model** - frontend plugins (React/TypeScript) untuk UI extensions dan backend plugins (Laravel/PHP - PLANNED) untuk server-side processing.

### Core Features

1. **Plugin Registry & Discovery**
   - Centralized plugin catalog dengan 37 metadata fields
   - Plugin versioning dengan semantic versioning (semver)
   - Dependency management (platform, PHP extensions, other plugins)
   - Compatibility checking (Stencil version, PHP version)
   - Plugin signatures untuk security verification

2. **Multi-Tenant Installation Management**
   - Per-tenant plugin installations (tenant A bisa install different plugins dari tenant B)
   - Activation control per tenant
   - Version tracking per installation
   - License key validation per tenant
   - Health monitoring & error tracking

3. **Hook & Filter System (WordPress-Style)**
   - **Actions**: Execute code at specific points (e.g., order.created)
   - **Filters**: Transform data before use (e.g., product.price)
   - Priority-based execution order
   - Performance tracking per hook
   - Error handling dengan fallback mechanisms

4. **Plugin Settings Management**
   - Tenant-specific configurations
   - JSONB storage untuk flexible schema
   - Encrypted storage untuk sensitive data (API keys, secrets)
   - Validation rules enforcement
   - Settings audit trail

5. **Marketplace & Monetization**
   - Plugin listing dengan pricing
   - Free, paid, subscription models
   - License management (single-site, multi-site, unlimited)
   - Purchase transactions tracking
   - Revenue sharing (25-30% platform commission)
   - Vendor payout management

6. **Security & Sandboxing**
   - Permission-based API access
   - Resource limits (CPU, memory, API calls)
   - Code signing dengan digital signatures
   - Malware scanning
   - Vulnerability detection
   - Execution monitoring

7. **Plugin Categories**
   - **Payment Gateways**: Stripe, PayPal, Midtrans, Xendit
   - **Shipping Providers**: JNE, J&T, FedEx, DHL
   - **Analytics**: Google Analytics, Facebook Pixel, Mixpanel
   - **Email Marketing**: Mailchimp, SendGrid
   - **CRM Integration**: Salesforce, Zoho, Odoo
   - **UI Enhancements**: Themes, widgets, custom components

### Key Statistics

| Metric | Value |
|--------|-------|
| Total Tables | 12 |
| Total Fields | 285 |
| API Endpoints | 35+ |
| Plugin Categories | 10+ (payment, shipping, analytics, etc) |
| Hook Types | 2 (actions, filters) |
| Expected Marketplace Plugins Year 1 | 50+ |
| Target Developer Community | 5,000+ developers globally |

---

## BUSINESS CONTEXT

### **Integration with Etching Business Cycle**

Plugin Marketplace System is specifically designed to support the **custom etching business workflow** with plugins that enhance each stage of the business cycle:

**1. Customer Inquiry Stage Plugins:**
- **Lead Capture Plugins**: Contact forms, live chat, WhatsApp integration
- **CRM Integration**: Salesforce, Zoho, HubSpot connectors
- **Analytics Plugins**: Google Analytics, Facebook Pixel, conversion tracking

**2. Quotation & Negotiation Stage Plugins:**
- **Pricing Calculator Plugins**: Dynamic pricing based on materials, complexity, quantity
- **Quote Generation**: PDF generators, email templates, approval workflows
- **Communication Plugins**: Email automation, SMS notifications, video calls

**3. Order Processing Stage Plugins:**
- **Payment Gateway Plugins**: Stripe, PayPal, Midtrans, bank transfers
- **Order Management**: Inventory sync, production scheduling, workflow automation
- **Document Management**: Contract generation, digital signatures, file storage

**4. Production Stage Plugins:**
- **Production Tracking**: Real-time progress updates, quality control checkpoints
- **Vendor Management**: Supplier communication, material ordering, delivery tracking
- **Equipment Integration**: Machine monitoring, maintenance scheduling, efficiency tracking

**5. Delivery & Fulfillment Stage Plugins:**
- **Shipping Plugins**: JNE, J&T, FedEx integration, tracking, delivery confirmation
- **Customer Communication**: Delivery notifications, feedback collection, support tickets
- **Financial Reconciliation**: Payment processing, invoice generation, accounting sync

### Revenue Model

Plugin Marketplace System adalah **major revenue stream** untuk Stencil CMS:

**Revenue Sources:**
- **Marketplace Commission**: 25-30% per plugin sale
- **Premium Plugin Sales**: Payment gateways ($49-$99), CRM integrations ($199+)
- **Subscription Plugins**: Monthly/yearly recurring revenue
- **Featured Listings**: Vendors pay untuk premium marketplace placement
- **Developer Program**: Annual developer membership fees

**Financial Projections:**
- **Year 1 Target**: $100,000 revenue
  - 500 plugin sales × $50 avg price × 25% commission = $6,250/month
  - 20 subscription plugins × $29/mo × 12 months = $6,960/year  
  - Featured placements: $2,000/month
- **Year 2 Target**: $500,000 revenue
  - Growing developer ecosystem
  - Enterprise plugins ($500-$2,000)
- **Year 3 Target**: $2M+ revenue
  - 5,000+ active tenants
  - 100+ premium plugins
  - Enterprise marketplace

### Business Value

**For Stencil CMS Platform:**
- 🚀 **Unlimited extensibility** tanpa fork codebase
- 🚀 **Faster feature development** via community plugins
- 🚀 **Competitive advantage**: Ecosystem attracts more customers
- 🚀 **Reduced maintenance burden**: Third-party plugins maintained by vendors
- 🚀 **Network effects**: More plugins → More users → More plugins

**For Developers/Vendors:**
- 💰 **Monetization opportunity**: Passive income from plugin sales
- 💰 **Recurring revenue**: Subscription-based plugins
- 💰 **Market access**: Reach 5,000+ potential customers
- 💰 **Low barrier to entry**: Free developer tools & SDK
- 💰 **Marketplace exposure**: Featured listings, search rankings

**For Customers/Tenants:**
- ✅ **Flexibility**: Choose exact features needed
- ✅ **Cost-effective**: Pay only for plugins used
- ✅ **Innovation**: Access to cutting-edge integrations
- ✅ **Vendor competition**: Multiple plugins per category drives quality
- ✅ **Community support**: Active developer forums

### Use Cases & Examples

#### Use Case 1: Payment Gateway Integration

**Scenario**: Tenant ingin accept credit card payments via Stripe

**Without Plugin System:**
- Request feature ke Stencil team
- Wait 3-6 months untuk development
- Limited customization options
- Tied to platform release cycle

**With Plugin System:**
- Browse marketplace → Find "Stripe Payment Gateway" plugin
- Purchase plugin ($49 one-time) atau free version
- Install & activate dalam 5 menit
- Configure API keys via settings panel
- Accept payments immediately
- Auto-updates dari vendor

**Plugin Features:**
- Credit/debit card processing
- 3D Secure support
- Apple Pay & Google Pay
- Webhook handling
- Refund management
- Transaction reports

#### Use Case 2: Custom Shipping Calculator

**Scenario**: Tenant memiliki complex shipping rules (volume-based, location-based)

**Plugin Solution:**
- Developer create custom shipping plugin
- Register hooks untuk shipping rate calculation
- Filter `shipping.rates` untuk inject custom rates
- Store configuration di plugin_settings (zones, rates, rules)
- Activate plugin untuk tenant
- Shipping rates auto-calculated saat checkout

#### Use Case 3: Analytics Tracking

**Scenario**: Tenant ingin track customer behavior dengan Google Analytics

**Plugin Solution: Frontend-Only Plugin**
```typescript
// Plugin runs in browser
class GoogleAnalyticsPlugin {
  async init() {
    // Load GA script
    loadGoogleAnalyticsScript(this.settings.tracking_id);
    
    // Register hooks
    hooks.addAction('page.view', (url) => {
      gtag('event', 'page_view', { page_path: url });
    });
    
    hooks.addAction('product.view', (product) => {
      gtag('event', 'view_item', {
        items: [{ id: product.id, name: product.name }]
      });
    });
    
    hooks.addAction('order.complete', (order) => {
      gtag('event', 'purchase', {
        transaction_id: order.id,
        value: order.total,
        currency: order.currency
      });
    });
  }
}
```

No backend code needed → Pure frontend plugin.

---

## PLUGIN ARCHITECTURE

### Hybrid Execution Model

Stencil menggunakan **API-First Architecture dengan Hybrid Plugin Execution**:

```
[FRONTEND - React SPA]
  ├─ Plugin Loader
  │  ├─ Fetch enabled plugins dari API
  │  ├─ Dynamic import plugin bundles
  │  └─ Initialize plugin instances
  │
  ├─ Frontend Plugins (Client-Side Execution)
  │  ├─ UI Extensions: Widgets, themes, custom forms
  │  ├─ Analytics: GA, Facebook Pixel, tracking
  │  ├─ Notifications: Toast messages, alerts
  │  └─ Client-side data transforms
  │
  └─ Hook & Filter Manager
     ├─ actions: Execute callbacks at trigger points
     └─ filters: Transform data via pipeline

                    │
                    │ API Requests
                    ▼

[BACKEND - Laravel API] (🚧 PLANNED)
  ├─ Plugin Registry API
  │  ├─ GET /api/plugins (list available)
  │  ├─ POST /api/plugins/install
  │  └─ PUT /api/plugins/{id}/settings
  │
  ├─ Backend Plugins (Server-Side Execution)
  │  ├─ Payment processing (Stripe API calls)
  │  ├─ Webhook handlers
  │  ├─ Database operations
  │  └─ Email sending
  │
  └─ Event Dispatcher
     ├─ Hook system (Laravel Events)
     ├─ Filter pipelines
     └─ Plugin orchestration
```

### Frontend vs Backend Plugins

| Aspect | Frontend Plugin | Backend Plugin |
|--------|----------------|----------------|
| **Language** | React/TypeScript | Laravel/PHP |
| **Execution** | Browser (client-side) | Server (backend API) |
| **Can Do** | UI rendering, analytics, client transforms | Database queries, API calls, webhooks |
| **Cannot Do** | Database access, secrets storage | Browser DOM manipulation |
| **Examples** | Google Analytics, UI widgets | Stripe payment processing, email sending |
| **Distribution** | JavaScript bundle (.js) | PHP package (composer) |

### Plugin Lifecycle States

```
┌──────────────┐
│  REGISTERED  │  Plugin added to registry
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  AVAILABLE   │  Listed in marketplace
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  PURCHASED   │  (If paid plugin)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  INSTALLED   │  Downloaded to tenant
└──────┬───────┘
       │
       ▼
┌──────────────┐    ┌──────────────┐
│  ACTIVATED   │ ←→ │ DEACTIVATED  │
└──────┬───────┘    └──────────────┘
       │                    ↓
       │              ┌──────────────┐
       │              │ UNINSTALLED  │
       │              └──────────────┘
       │
       ▼
┌──────────────┐
│   RUNNING    │  Active & executing hooks
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    ERROR     │  Health check failed
└──────────────┘
```

**State Transitions:**

1. **REGISTERED → AVAILABLE**: Admin approves plugin untuk marketplace
2. **AVAILABLE → PURCHASED**: Customer buys paid plugin
3. **PURCHASED/AVAILABLE → INSTALLED**: Tenant installs plugin
4. **INSTALLED → ACTIVATED**: Tenant activates plugin
   - Run migrations (if backend plugin)
   - Register hooks & filters
   - Load plugin settings
5. **ACTIVATED → RUNNING**: Plugin executing normally
6. **RUNNING → ERROR**: Exception thrown, health check failed
7. **ACTIVATED ↔ DEACTIVATED**: Toggle on/off (settings preserved)
8. **DEACTIVATED → UNINSTALLED**: Complete removal (data deleted)

---

## DATABASE SCHEMA

### Table 1: plugins

**Schema**: Landlord (central)  
**Purpose**: Plugin registry - centralized catalog of all available plugins  
**Relationships**: Referenced by plugin_installations, plugin_hooks, plugin_events, plugin_marketplace_listings, plugin_purchases

```sql
CREATE TABLE plugins (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Identification
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    version VARCHAR(20) NOT NULL,
    
    -- Type & Categorization
    type VARCHAR(50) NOT NULL CHECK (type IN ('frontend', 'backend', 'hybrid')),
    category VARCHAR(50) CHECK (category IN ('payment', 'shipping', 'analytics', 'crm', 'communication', 'production', 'ui', 'utility', 'integration')),
    tags VARCHAR(50)[],
    
    -- Author/Vendor Information
    author_name VARCHAR(200),
    author_email VARCHAR(255),
    author_url VARCHAR(500),
    author_verified BOOLEAN DEFAULT false,
    
    -- Storage & Files
    storage_path TEXT NOT NULL,
    manifest JSONB NOT NULL,
    main_file VARCHAR(500),
    
    -- Marketplace Integration
    is_marketplace_plugin BOOLEAN DEFAULT false,
    marketplace_listing_id UUID,
    
    -- Compatibility Requirements
    min_stencil_version VARCHAR(20),
    max_stencil_version VARCHAR(20),
    required_php_version VARCHAR(20),
    required_php_extensions VARCHAR(50)[],
    required_plugins JSONB DEFAULT '[]',
    conflicts_with JSONB DEFAULT '[]',
    
    -- Dependencies
    composer_dependencies JSONB DEFAULT '{}',
    npm_dependencies JSONB DEFAULT '{}',
    
    -- Permissions
    required_permissions VARCHAR(100)[],
    optional_permissions VARCHAR(100)[],
    
    -- Hooks & Filters
    registered_hooks JSONB DEFAULT '[]',
    registered_filters JSONB DEFAULT '[]',
    
    -- Security & Verification
    signature_hash VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    security_scan_status VARCHAR(50) DEFAULT 'pending',
    security_scan_results JSONB,
    
    -- Performance & Resource Limits
    max_memory_usage INTEGER DEFAULT 128, -- MB
    max_cpu_time INTEGER DEFAULT 30, -- seconds
    max_api_calls_per_hour INTEGER DEFAULT 1000,
    
    -- Status & Lifecycle
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'rejected', 'deprecated')),
    is_active BOOLEAN DEFAULT true,
    
    -- Pricing & Licensing
    pricing_model VARCHAR(50) DEFAULT 'free' CHECK (pricing_model IN ('free', 'paid', 'subscription', 'freemium')),
    price DECIMAL(10,2) DEFAULT 0.00,
    license_type VARCHAR(50) DEFAULT 'single-site',
    
    -- Media & Documentation
    icon_url TEXT,
    screenshot_url TEXT,
    screenshots JSONB DEFAULT '[]',
    demo_url VARCHAR(500),
    
    -- Status & Flags
    is_official BOOLEAN DEFAULT false,
    security_scanned BOOLEAN DEFAULT false,
    security_scan_date TIMESTAMP,
    
    -- Statistics (Denormalized for Performance)
    installations_count INT DEFAULT 0,
    active_installations INT DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    deprecated_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT plugins_version_check CHECK (version ~ '^\\d+\\.\\d+\\.\\d+')
);

-- Indexes for Performance
CREATE INDEX idx_plugins_slug ON plugins(slug);
CREATE INDEX idx_plugins_type ON plugins(type);
CREATE INDEX idx_plugins_category ON plugins(category);
CREATE INDEX idx_plugins_status ON plugins(status) WHERE status = 'active';
CREATE INDEX idx_plugins_marketplace ON plugins(is_marketplace_plugin) 
    WHERE is_marketplace_plugin = true;
CREATE INDEX idx_plugins_tags ON plugins USING GIN(tags);
CREATE INDEX idx_plugins_manifest ON plugins USING GIN(manifest);
CREATE INDEX idx_plugins_author_verified ON plugins(author_verified) 
    WHERE author_verified = true;

-- Full-Text Search Index
CREATE INDEX idx_plugins_search ON plugins USING GIN(
    to_tsvector('english', 
        COALESCE(name, '') || ' ' || 
        COALESCE(description, '') || ' ' || 
        COALESCE(author_name, '')
    )
);

-- Updated Timestamp Trigger
CREATE TRIGGER update_plugins_updated_at
BEFORE UPDATE ON plugins
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Field Count**: 37 fields

---

### Table 2: plugin_installations

**Schema**: Tenant (per-tenant)  
**Purpose**: Track plugin installations per tenant with activation status and health monitoring  
**Relationships**: References plugins(id), tenants(uuid), users(id)

```sql
CREATE TABLE plugin_installations (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-Tenant Isolation (CORE RULE COMPLIANCE)
    tenant_id UUID NOT NULL,
    
    -- Plugin Reference
    plugin_id UUID NOT NULL,
    plugin_slug VARCHAR(100) NOT NULL, -- Denormalized for performance
    plugin_version VARCHAR(20) NOT NULL,
    
    -- Installation Status
    status VARCHAR(50) DEFAULT 'installed' CHECK (status IN ('installed', 'activated', 'deactivated', 'error', 'updating')),
    
    -- Health Monitoring
    health_status VARCHAR(50) DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'warning', 'error', 'unknown')),
    last_health_check TIMESTAMP,
    health_check_results JSONB,
    
    -- Performance Metrics
    average_response_time DECIMAL(8,3), -- milliseconds
    error_count INTEGER DEFAULT 0,
    last_error_message TEXT,
    last_error_at TIMESTAMP,
    
    -- Resource Usage Tracking
    memory_usage_mb INTEGER,
    cpu_usage_percent DECIMAL(5,2),
    api_calls_today INTEGER DEFAULT 0,
    api_calls_this_month INTEGER DEFAULT 0,
    
    -- License & Activation
    license_key VARCHAR(255),
    license_status VARCHAR(50) DEFAULT 'valid' CHECK (license_status IN ('valid', 'expired', 'invalid', 'suspended')),
    license_expires_at TIMESTAMP,
    
    -- Installation Metadata
    installation_source VARCHAR(50) DEFAULT 'marketplace', -- marketplace, manual, api
    installation_method VARCHAR(50) DEFAULT 'automatic', -- automatic, manual
    
    -- Auto-Update Settings
    auto_update_enabled BOOLEAN DEFAULT true,
    auto_update_channel VARCHAR(20) DEFAULT 'stable' CHECK (auto_update_channel IN ('stable', 'beta', 'alpha')),
    
    -- Configuration Override
    config_overrides JSONB DEFAULT '{}',
    
    -- Audit Trail
    installed_by UUID NOT NULL,
    activated_by UUID,
    deactivated_by UUID,
    
    -- Timestamps
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP,
    deactivated_at TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
    FOREIGN KEY (installed_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (activated_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (deactivated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Unique Constraints
    UNIQUE(tenant_id, plugin_slug)
);

-- Performance Indexes
CREATE INDEX idx_plugin_installations_tenant ON plugin_installations(tenant_id);
CREATE INDEX idx_plugin_installations_plugin ON plugin_installations(plugin_id);
CREATE INDEX idx_plugin_installations_status ON plugin_installations(status);
CREATE INDEX idx_plugin_installations_health ON plugin_installations(health_status) 
    WHERE health_status != 'healthy';
CREATE INDEX idx_plugin_installations_active ON plugin_installations(tenant_id, status) 
    WHERE status = 'activated';
CREATE INDEX idx_plugin_installations_license ON plugin_installations(license_status, license_expires_at)
    WHERE license_status != 'valid';

-- Updated Timestamp Trigger
CREATE TRIGGER update_plugin_installations_updated_at
BEFORE UPDATE ON plugin_installations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Field Count**: 32 fields

---

### Table 3: plugin_settings

**Schema**: Tenant (per-tenant)  
**Purpose**: Store tenant-specific plugin configurations with encryption support for sensitive data  
**Relationships**: References plugin_installations(id), tenants(uuid)

```sql
CREATE TABLE plugin_settings (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-Tenant Isolation (CORE RULE COMPLIANCE)
    tenant_id UUID NOT NULL,
    
    -- Plugin Installation Reference
    installation_id UUID NOT NULL,
    plugin_slug VARCHAR(100) NOT NULL, -- Denormalized for performance
    
    -- Setting Identification
    setting_key VARCHAR(200) NOT NULL,
    setting_group VARCHAR(100) DEFAULT 'general',
    
    -- Setting Value (Multiple Storage Types)
    setting_value JSONB,
    setting_value_text TEXT,
    setting_value_encrypted TEXT, -- For API keys, passwords, etc.
    
    -- Setting Metadata
    setting_type VARCHAR(50) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'array', 'object', 'encrypted')),
    is_sensitive BOOLEAN DEFAULT false,
    is_required BOOLEAN DEFAULT false,
    
    -- Validation Rules
    validation_rules JSONB,
    default_value JSONB,
    
    -- Setting Status
    is_active BOOLEAN DEFAULT true,
    is_system_setting BOOLEAN DEFAULT false, -- Cannot be modified by users
    
    -- Audit Trail
    created_by UUID NOT NULL,
    updated_by UUID,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (installation_id) REFERENCES plugin_installations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Unique Constraints
    UNIQUE(tenant_id, installation_id, setting_key)
);

-- Performance Indexes
CREATE INDEX idx_plugin_settings_tenant ON plugin_settings(tenant_id);
CREATE INDEX idx_plugin_settings_installation ON plugin_settings(installation_id);
CREATE INDEX idx_plugin_settings_key ON plugin_settings(setting_key);
CREATE INDEX idx_plugin_settings_group ON plugin_settings(setting_group);
CREATE INDEX idx_plugin_settings_sensitive ON plugin_settings(is_sensitive) 
    WHERE is_sensitive = true;
CREATE INDEX idx_plugin_settings_value ON plugin_settings USING GIN(setting_value);

-- Updated Timestamp Trigger
CREATE TRIGGER update_plugin_settings_updated_at
BEFORE UPDATE ON plugin_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Field Count**: 22 fields

#### Field Specifications - Table plugins

| Field | Type | Null | Description | Example Value |
|-------|------|------|-------------|---------------|
| `id` | UUID | NOT NULL | Primary key | `7a8b9c0d-1234-5678-90ab-cdef12345678` |
| `slug` | VARCHAR(100) | NOT NULL | Unique URL-friendly identifier | `stripe-payment-gateway` |
| `name` | VARCHAR(200) | NOT NULL | Display name for UI | `Stripe Payment Gateway` |
| `description` | TEXT | NULL | Long description for marketplace listing | `Accept credit card payments...` |
| `version` | VARCHAR(20) | NOT NULL | Semantic version (MAJOR.MINOR.PATCH) | `2.1.0` |
| `type` | VARCHAR(50) | NOT NULL | Plugin category type | `payment-gateway`, `shipping`, `analytics` |
| `category` | VARCHAR(50) | NULL | Marketplace category | `payments`, `integrations` |
| `tags` | VARCHAR(50)[] | NULL | Search tags | `{stripe, payment, credit-card}` |
| `author_name` | VARCHAR(200) | NULL | Plugin developer/vendor name | `Payment Solutions Inc` |
| `author_email` | VARCHAR(255) | NULL | Support contact email | `support@paymentsolutions.com` |
| `author_url` | VARCHAR(500) | NULL | Vendor website | `https://paymentsolutions.com` |
| `author_verified` | BOOLEAN | NOT NULL | Email verified + identity confirmed | `true` |
| `storage_path` | TEXT | NOT NULL | File system location | `/plugins/stripe-payment-gateway` |
| `manifest` | JSONB | NOT NULL | Complete plugin metadata (see manifest schema below) | `{"name": "Stripe", "settings": {...}}` |
| `main_file` | VARCHAR(500) | NULL | Entry point file (backend plugins) | `src/StripeServiceProvider.php` |
| `is_marketplace_plugin` | BOOLEAN | NOT NULL | Available in public marketplace? | `true` |
| `marketplace_listing_id` | UUID | NULL | FK to plugin_marketplace_listings | UUID |
| `min_stencil_version` | VARCHAR(20) | NULL | Minimum platform version required | `2.0.0` |
| `max_stencil_version` | VARCHAR(20) | NULL | Maximum compatible version (NULL = no limit) | `3.0.0` |
| `required_php_version` | VARCHAR(20) | NULL | Minimum PHP version (backend plugins) | `8.1` |
| `required_php_extensions` | VARCHAR(50)[] | NULL | Required PHP extensions | `{curl, json, mbstring}` |
| `required_plugins` | JSONB | NULL | Plugin dependencies | `[{"slug": "payment-base", "version": "^1.0.0"}]` |
| `conflicts_with` | JSONB | NULL | Incompatible plugins | `[{"slug": "old-stripe", "reason": "superseded"}]` |
| `composer_dependencies` | JSONB | NULL | PHP package dependencies | `{"stripe/stripe-php": "^10.0"}` |
| `npm_dependencies` | JSONB | NULL | NPM package dependencies (frontend) | `{"@stripe/stripe-js": "^1.54.0"}` |
| `required_permissions` | VARCHAR(100)[] | NULL | API permissions needed | `{orders.read, payments.create}` |
| `optional_permissions` | VARCHAR(100)[] | NULL | Optional permissions for extended features | `{analytics.track}` |
| `registered_hooks` | JSONB | NULL | Hooks this plugin registers | `["order.created", "payment.completed"]` |
| `registered_filters` | JSONB | NULL | Filters this plugin provides | `["payment.methods", "order.total"]` |
| `icon_url` | TEXT | NULL | Plugin icon (256x256 recommended) | `/plugins/stripe/icon.png` |
| `screenshot_url` | TEXT | NULL | Primary screenshot | `/plugins/stripe/screenshot.png` |
| `screenshots` | JSONB | NULL | Gallery images | `[{"url": "...", "caption": "..."}]` |
| `demo_url` | VARCHAR(500) | NULL | Live demo link | `https://demo.stencilcms.com/plugins/stripe` |
| `status` | VARCHAR(20) | NOT NULL | Plugin status | `active`, `deprecated`, `suspended` |
| `is_official` | BOOLEAN | NOT NULL | Developed by Stencil team? | `true` (trusted by default) |
| `security_scanned` | BOOLEAN | NOT NULL | Passed malware/vulnerability scan? | `true` |
| `security_scan_date` | TIMESTAMP | NULL | Last security scan date | `2025-11-01 10:30:00` |
| `installations_count` | INT | NOT NULL | Total installations (all tenants) | `1250` |
| `active_installations` | INT | NOT NULL | Currently active installations | `980` |
| `created_at` | TIMESTAMP | NOT NULL | Plugin registration date | `2025-01-15 09:00:00` |
| `updated_at` | TIMESTAMP | NOT NULL | Last modification date | `2025-11-10 14:30:00` |
| `deprecated_at` | TIMESTAMP | NULL | Deprecation date (EOL warning) | `2026-12-31 23:59:59` |

#### Plugin Manifest Schema (manifest JSONB)

Complete JSON structure stored in `manifest` field:

```json
{
  "name": "Stripe Payment Gateway",
  "slug": "stripe-payment-gateway",
  "version": "2.1.0",
  "description": "Accept credit card payments via Stripe",
  
  "author": {
    "name": "Payment Solutions Inc",
    "email": "support@paymentsolutions.com",
    "url": "https://paymentsolutions.com"
  },
  
  "type": "payment-gateway",
  "category": "payments",
  "tags": ["stripe", "payment", "credit-card", "3d-secure"],
  
  "main": "src/StripePaymentServiceProvider.php",
  
  "compatibility": {
    "stencil_version": ">=2.0.0",
    "php_version": ">=8.1",
    "required_plugins": [],
    "conflicts_with": []
  },
  
  "dependencies": {
    "php_extensions": ["curl", "json", "mbstring"],
    "composer": {
      "stripe/stripe-php": "^10.0"
    },
    "npm": {
      "@stripe/stripe-js": "^1.54.0"
    }
  },
  
  "permissions": {
    "required": [
      "orders.read",
      "orders.update",
      "payments.create",
      "webhooks.register"
    ],
    "optional": [
      "customers.read",
      "analytics.track"
    ]
  },
  
  "hooks": {
    "actions": [
      "checkout.payment_method_selected",
      "order.payment_processing",
      "order.payment_completed"
    ],
    "filters": [
      "payment.available_methods",
      "order.total_amount"
    ]
  },
  
  "settings": {
    "schema": {
      "publishable_key": {
        "type": "string",
        "label": "Publishable Key",
        "required": true,
        "description": "Stripe publishable API key (starts with pk_)"
      },
      "secret_key": {
        "type": "secret",
        "label": "Secret Key",
        "required": true,
        "description": "Stripe secret API key (starts with sk_)"
      },
      "webhook_secret": {
        "type": "secret",
        "label": "Webhook Secret",
        "description": "Webhook signing secret (starts with whsec_)"
      },
      "enable_3d_secure": {
        "type": "boolean",
        "label": "Enable 3D Secure",
        "default": true,
        "description": "Require Strong Customer Authentication (SCA)"
      },
      "capture_method": {
        "type": "select",
        "label": "Capture Method",
        "options": [
          {"value": "automatic", "label": "Automatic (capture immediately)"},
          {"value": "manual", "label": "Manual (authorize only, capture later)"}
        ],
        "default": "automatic"
      }
    }
  },
  
  "pricing": {
    "type": "paid",
    "price": 49.00,
    "currency": "USD",
    "billing": "one-time",
    "license": "single-site"
  },
  
  "support": {
    "email": "support@paymentsolutions.com",
    "docs": "https://docs.paymentsolutions.com/stripe",
    "forum": "https://forum.paymentsolutions.com"
  },
  
  "changelog": [
    {
      "version": "2.1.0",
      "date": "2025-11-01",
      "changes": [
        "Added Apple Pay support",
        "Added Google Pay support",
        "Improved 3D Secure flow",
        "Fixed refund webhook handling"
      ]
    }
  ]
}
```

#### Business Rules - Table plugins

1. **Unique Slug**: Each plugin MUST have globally unique slug (enforced by UNIQUE constraint)
   ```sql
   -- Validation on INSERT
   SELECT COUNT(*) FROM plugins WHERE slug = 'stripe-payment-gateway';
   -- Must return 0 before allowing INSERT
   ```

2. **Semantic Versioning**: Version MUST follow semver format (enforced by CHECK constraint)
   - Valid: `2.1.0`, `1.0.0-beta.1`
   - Invalid: `v2.1`, `2.1`, `latest`

3. **Official Plugin Trust**: `is_official = true` only for Stencil-developed plugins
   - Automatically approved (skip security review)
   - Featured by default in marketplace
   - Higher search ranking

4. **Security Scan Required**: Marketplace plugins MUST pass security scan before approval
   ```sql
   UPDATE plugins 
   SET status = 'active', is_marketplace_plugin = true
   WHERE security_scanned = true AND security_scan_date > NOW() - INTERVAL '90 days';
   ```

5. **Deprecation Warning**: When `deprecated_at` is set, show warning to tenants
   ```sql
   -- Query plugins nearing deprecation
   SELECT * FROM plugins 
   WHERE deprecated_at IS NOT NULL 
     AND deprecated_at BETWEEN NOW() AND NOW() + INTERVAL '180 days';
   ```

6. **Installation Count Auto-Update**: Triggered by plugin_installations table changes
   ```sql
   -- See plugin_installations trigger: update_plugin_installations_count()
   ```

#### Sample Data - Table plugins

```sql
-- Example 1: Stripe Payment Gateway (Full-Stack Plugin)
INSERT INTO plugins (
    slug, name, description, version, type, category, tags,
    author_name, author_email, author_verified,
    storage_path, manifest, is_marketplace_plugin, is_official,
    min_stencil_version, required_php_version,
    required_permissions, registered_hooks,
    security_scanned, status
) VALUES (
    'stripe-payment-gateway',
    'Stripe Payment Gateway',
    'Accept credit card payments via Stripe with 3D Secure, Apple Pay, and Google Pay support',
    '2.1.0',
    'payment-gateway',
    'payments',
    ARRAY['stripe', 'payment', 'credit-card', '3d-secure'],
    'Payment Solutions Inc',
    'support@paymentsolutions.com',
    true,
    '/plugins/stripe-payment-gateway',
    '{"name": "Stripe Payment Gateway", "pricing": {"type": "paid", "price": 49.00}}'::jsonb,
    true,
    false,
    '2.0.0',
    '8.1',
    ARRAY['orders.read', 'orders.update', 'payments.create'],
    ARRAY['order.created', 'payment.completed'],
    true,
    'active'
);

-- Example 2: Google Analytics (Frontend-Only Plugin)
INSERT INTO plugins (
    slug, name, description, version, type, category, tags,
    author_name, author_verified,
    storage_path, manifest, is_marketplace_plugin, is_official,
    min_stencil_version, required_permissions,
    registered_hooks, security_scanned, status
) VALUES (
    'google-analytics',
    'Google Analytics 4',
    'Track customer behavior, conversions, and ecommerce events with Google Analytics 4',
    '1.0.0',
    'analytics',
    'marketing',
    ARRAY['google-analytics', 'tracking', 'analytics', 'ga4'],
    'Stencil Team',
    true,
    '/plugins/google-analytics',
    '{"name": "Google Analytics 4", "pricing": {"type": "free"}}'::jsonb,
    true,
    true,
    '2.0.0',
    ARRAY['analytics.track'],
    ARRAY['page.view', 'product.view', 'order.complete'],
    true,
    'active'
);
```

---

### Table 2: plugin_installations

**Schema**: Landlord (central)  
**Purpose**: Track per-tenant plugin installations (multi-tenant aware)  
**Relationships**: 
- References `tenants(id)` - which tenant owns this installation
- References `plugins(id)` - which plugin is installed
- References `users(id)` - who installed/activated

```sql
CREATE TABLE plugin_installations (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relations
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
    
    -- Version Tracking
    installed_version VARCHAR(20) NOT NULL,
    latest_available_version VARCHAR(20),
    
    -- Installation Details
    installation_source VARCHAR(50),
    installed_by UUID REFERENCES users(id),
    
    -- Activation Status
    is_active BOOLEAN DEFAULT false,
    activated_at TIMESTAMP,
    activated_by UUID REFERENCES users(id),
    
    -- License Management
    license_key VARCHAR(255),
    license_type VARCHAR(50),
    license_valid_until TIMESTAMP,
    
    -- Auto-Update Settings
    auto_update_enabled BOOLEAN DEFAULT false,
    last_update_check TIMESTAMP,
    
    -- Health Monitoring
    health_status VARCHAR(50) DEFAULT 'healthy',
    last_error TEXT,
    error_count INT DEFAULT 0,
    
    -- Performance Metrics
    last_execution_time FLOAT,
    avg_execution_time FLOAT,
    total_executions BIGINT DEFAULT 0,
    
    -- Timestamps
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uninstalled_at TIMESTAMP,
    
    -- Constraints
    UNIQUE(tenant_id, plugin_id),
    CONSTRAINT installations_health_status_check CHECK (
        health_status IN ('healthy', 'warning', 'error', 'disabled')
    ),
    CONSTRAINT installations_source_check CHECK (
        installation_source IN ('marketplace', 'upload', 'git', 'manual')
    )
);

-- Indexes for Performance
CREATE INDEX idx_plugin_installations_tenant ON plugin_installations(tenant_id);
CREATE INDEX idx_plugin_installations_plugin ON plugin_installations(plugin_id);
CREATE INDEX idx_plugin_installations_active ON plugin_installations(tenant_id, is_active) 
    WHERE is_active = true;
CREATE INDEX idx_plugin_installations_health ON plugin_installations(health_status) 
    WHERE health_status != 'healthy';
CREATE INDEX idx_plugin_installations_license ON plugin_installations(license_valid_until) 
    WHERE license_valid_until IS NOT NULL;
CREATE INDEX idx_plugin_installations_uninstalled ON plugin_installations(uninstalled_at)
    WHERE uninstalled_at IS NULL;

-- Updated Timestamp Trigger
CREATE TRIGGER update_plugin_installations_updated_at
BEFORE UPDATE ON plugin_installations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Auto-Update Plugin Statistics Trigger
CREATE OR REPLACE FUNCTION update_plugin_installations_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment installations_count and active_installations
        UPDATE plugins 
        SET installations_count = installations_count + 1,
            active_installations = CASE WHEN NEW.is_active THEN active_installations + 1 ELSE active_installations END
        WHERE id = NEW.plugin_id;
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update active_installations if activation status changed
        IF NEW.is_active != OLD.is_active THEN
            UPDATE plugins 
            SET active_installations = active_installations + CASE WHEN NEW.is_active THEN 1 ELSE -1 END
            WHERE id = NEW.plugin_id;
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement counts
        UPDATE plugins 
        SET installations_count = installations_count - 1,
            active_installations = CASE WHEN OLD.is_active THEN active_installations - 1 ELSE active_installations END
        WHERE id = OLD.plugin_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plugin_installations_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON plugin_installations
FOR EACH ROW
EXECUTE FUNCTION update_plugin_installations_count();
```

**Field Count**: 25 fields

#### Field Specifications - Table plugin_installations

| Field | Type | Null | Description | Example Value |
|-------|------|------|-------------|---------------|
| `id` | UUID | NOT NULL | Primary key | `installation-uuid` |
| `tenant_id` | UUID | NOT NULL | FK to tenants - which tenant owns this | PT CEX tenant UUID |
| `plugin_id` | UUID | NOT NULL | FK to plugins - which plugin installed | Stripe plugin UUID |
| `installed_version` | VARCHAR(20) | NOT NULL | Version currently installed | `2.1.0` |
| `latest_available_version` | VARCHAR(20) | NULL | Newer version available (if any) | `2.2.0` |
| `installation_source` | VARCHAR(50) | NULL | How plugin was installed | `marketplace`, `upload`, `git` |
| `installed_by` | UUID | NULL | FK to users - who performed installation | Admin user UUID |
| `is_active` | BOOLEAN | NOT NULL | Currently active? | `true`/`false` |
| `activated_at` | TIMESTAMP | NULL | When plugin was activated | `2025-11-10 09:30:00` |
| `activated_by` | UUID | NULL | FK to users - who activated | Admin user UUID |
| `license_key` | VARCHAR(255) | NULL | License key for paid plugins | `STRP-ABC123-XYZ789` |
| `license_type` | VARCHAR(50) | NULL | License tier | `single-site`, `multi-site`, `unlimited` |
| `license_valid_until` | TIMESTAMP | NULL | License expiration date | `2026-11-10 23:59:59` |
| `auto_update_enabled` | BOOLEAN | NOT NULL | Auto-update plugin when new version available? | `true` |
| `last_update_check` | TIMESTAMP | NULL | Last time checked for updates | `2025-11-11 08:00:00` |
| `health_status` | VARCHAR(50) | NOT NULL | Plugin health state | `healthy`, `warning`, `error` |
| `last_error` | TEXT | NULL | Most recent error message | `Connection timeout to Stripe API` |
| `error_count` | INT | NOT NULL | Error count in last 24 hours | `0` to `999` |
| `last_execution_time` | FLOAT | NULL | Last hook execution duration (ms) | `45.3` |
| `avg_execution_time` | FLOAT | NULL | Rolling average execution time (ms) | `38.7` |
| `total_executions` | BIGINT | NOT NULL | Total hook executions since activation | `125432` |
| `installed_at` | TIMESTAMP | NOT NULL | Installation date/time | `2025-11-01 10:00:00` |
| `updated_at` | TIMESTAMP | NOT NULL | Last modification date | `2025-11-10 14:30:00` |
| `uninstalled_at` | TIMESTAMP | NULL | Uninstallation date (soft delete) | `2025-12-01 16:00:00` |

#### Business Rules - Table plugin_installations

1. **One Installation Per Tenant-Plugin Pair**: UNIQUE(tenant_id, plugin_id) prevents duplicates
   ```sql
   -- Cannot install same plugin twice for same tenant
   INSERT INTO plugin_installations (tenant_id, plugin_id, ...)
   ON CONFLICT (tenant_id, plugin_id) DO NOTHING;
   ```

2. **Cascade Delete on Tenant Removal**: When tenant deleted, all installations removed
   ```sql
   -- Automatic cleanup (enforced by ON DELETE CASCADE)
   DELETE FROM tenants WHERE id = 'tenant-uuid';
   -- Auto-deletes all plugin_installations for that tenant
   ```

3. **Activation Requires Configuration**: Plugin cannot activate if required settings not configured
   ```sql
   -- Pre-activation validation
   SELECT COUNT(*) FROM plugin_settings ps
   WHERE ps.plugin_installation_id = :installation_id
     AND ps.setting_key IN (SELECT required_keys FROM manifest)
     AND ps.is_valid = true;
   -- Must equal count of required settings
   ```

4. **License Validation**: Paid plugins require valid license
   ```sql
   UPDATE plugin_installations
   SET is_active = false
   WHERE license_valid_until < CURRENT_TIMESTAMP;
   ```

5. **Health Monitoring**: Auto-deactivate if error_count exceeds threshold
   ```sql
   UPDATE plugin_installations
   SET is_active = false, health_status = 'disabled'
   WHERE error_count >= 10;
   ```

6. **Performance Tracking**: Calculate avg_execution_time as rolling average
   ```sql
   UPDATE plugin_installations
   SET avg_execution_time = (
       (avg_execution_time * (total_executions - 1) + new_execution_time) / total_executions
   ),
   total_executions = total_executions + 1;
   ```

#### Installation States & Transitions

```
INSTALLED (is_active=false, uninstalled_at=NULL)
    │
    ├─> ACTIVATED (is_active=true, activated_at SET)
    │       │
    │       ├─> RUNNING (health_status='healthy')
    │       │
    │       ├─> WARNING (health_status='warning', error_count 1-5)
    │       │
    │       └─> ERROR (health_status='error', error_count 6-9)
    │               │
    │               └─> DISABLED (health_status='disabled', error_count >= 10, is_active=false)
    │
    └─> DEACTIVATED (is_active=false, still installed)
            │
            └─> UNINSTALLED (uninstalled_at SET, soft delete)
```

#### Sample Data - Table plugin_installations

```sql
-- PT CEX installs Stripe plugin
INSERT INTO plugin_installations (
    tenant_id, plugin_id, installed_version, installation_source,
    installed_by, is_active, activated_at, activated_by,
    license_key, license_type, license_valid_until,
    health_status
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000', -- PT CEX tenant
    '7a8b9c0d-1234-5678-90ab-cdef12345678', -- Stripe plugin
    '2.1.0',
    'marketplace',
    'admin-user-uuid',
    true,
    '2025-11-10 09:30:00',
    'admin-user-uuid',
    'STRP-ABC123-XYZ789',
    'single-site',
    '2026-11-10 23:59:59',
    'healthy'
);

-- PT CEX installs Google Analytics (free, frontend-only)
INSERT INTO plugin_installations (
    tenant_id, plugin_id, installed_version, installation_source,
    installed_by, is_active, activated_at, activated_by,
    health_status
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'ga-plugin-uuid',
    '1.0.0',
    'marketplace',
    'admin-user-uuid',
    true,
    '2025-11-10 10:00:00',
    'admin-user-uuid',
    'healthy'
);
```

---

### Table 4: plugin_hooks

**Schema**: Tenant (per-tenant)  
**Purpose**: Hook registry - tracks registered hooks and filters for plugin system integration  
**Relationships**: References plugins(id), plugin_installations(id)

```sql
CREATE TABLE plugin_hooks (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-Tenant Isolation (CORE RULE COMPLIANCE)
    tenant_id UUID NOT NULL,
    
    -- Hook Information
    hook_name VARCHAR(200) NOT NULL,
    hook_type VARCHAR(20) NOT NULL CHECK (hook_type IN ('action', 'filter')),
    
    -- Plugin References
    plugin_id UUID NOT NULL,
    plugin_installation_id UUID NOT NULL,
    
    -- Callback Configuration
    callback_class VARCHAR(500),
    callback_method VARCHAR(200),
    callback_priority INT DEFAULT 10,
    accepted_args INT DEFAULT 1,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Performance Statistics
    execution_count BIGINT DEFAULT 0,
    total_execution_time FLOAT DEFAULT 0, -- milliseconds
    avg_execution_time FLOAT DEFAULT 0,
    last_execution_at TIMESTAMP,
    
    -- Error Tracking
    error_count INT DEFAULT 0,
    last_error TEXT,
    last_error_at TIMESTAMP,
    
    -- Timestamps
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
    FOREIGN KEY (plugin_installation_id) REFERENCES plugin_installations(id) ON DELETE CASCADE,
    
    -- Unique Constraints
    UNIQUE(tenant_id, hook_name, plugin_id, callback_class, callback_method)
);

-- Performance Indexes
CREATE INDEX idx_plugin_hooks_tenant ON plugin_hooks(tenant_id);
CREATE INDEX idx_plugin_hooks_name ON plugin_hooks(hook_name);
CREATE INDEX idx_plugin_hooks_type ON plugin_hooks(hook_type);
CREATE INDEX idx_plugin_hooks_plugin ON plugin_hooks(plugin_id);
CREATE INDEX idx_plugin_hooks_active ON plugin_hooks(is_active) WHERE is_active = true;
CREATE INDEX idx_plugin_hooks_priority ON plugin_hooks(hook_name, callback_priority);

-- Updated Timestamp Trigger
CREATE TRIGGER update_plugin_hooks_updated_at
BEFORE UPDATE ON plugin_hooks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Field Count**: 20 fields

---

### Table 5: plugin_events

**Schema**: Tenant (per-tenant)  
**Purpose**: Plugin event logs for audit trail and debugging  
**Relationships**: References tenants(uuid), plugins(id), plugin_installations(id), users(id)

```sql
CREATE TABLE plugin_events (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-Tenant Isolation (CORE RULE COMPLIANCE)
    tenant_id UUID NOT NULL,
    
    -- Plugin References
    plugin_id UUID NOT NULL,
    plugin_installation_id UUID,
    
    -- Event Information
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('installed', 'activated', 'deactivated', 'updated', 'error', 'hook_executed', 'settings_changed')),
    event_name VARCHAR(200),
    
    -- Event Data
    event_data JSONB,
    
    -- Context Information
    user_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Performance Metrics
    execution_time FLOAT, -- milliseconds
    memory_used BIGINT, -- bytes
    
    -- Error Information
    is_error BOOLEAN DEFAULT false,
    error_message TEXT,
    error_trace TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
    FOREIGN KEY (plugin_installation_id) REFERENCES plugin_installations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Performance Indexes
CREATE INDEX idx_plugin_events_tenant ON plugin_events(tenant_id);
CREATE INDEX idx_plugin_events_plugin ON plugin_events(plugin_id);
CREATE INDEX idx_plugin_events_type ON plugin_events(event_type);
CREATE INDEX idx_plugin_events_errors ON plugin_events(is_error) WHERE is_error = true;
CREATE INDEX idx_plugin_events_created ON plugin_events(created_at DESC);
```

**Field Count**: 17 fields

---

### Table 6: plugin_marketplace_listings

**Schema**: Landlord (central)  
**Purpose**: Marketplace plugin catalog with pricing and vendor information  
**Relationships**: References plugins(id), users(id) as vendor

```sql
CREATE TABLE plugin_marketplace_listings (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Plugin Reference
    plugin_id UUID NOT NULL,
    
    -- Vendor Information
    vendor_id UUID NOT NULL,
    vendor_name VARCHAR(200),
    vendor_verified BOOLEAN DEFAULT false,
    
    -- Pricing Configuration
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    pricing_type VARCHAR(50) CHECK (pricing_type IN ('free', 'one-time', 'subscription-monthly', 'subscription-yearly')),
    trial_period_days INT,
    
    -- License Options
    available_licenses JSONB DEFAULT '[{"type": "single-site", "price": 0}]',
    
    -- Marketing Content
    tagline VARCHAR(255),
    long_description TEXT,
    features_list JSONB DEFAULT '[]',
    
    -- Media Assets
    gallery_images JSONB DEFAULT '[]',
    video_url VARCHAR(500),
    
    -- Support Information
    documentation_url VARCHAR(500),
    support_url VARCHAR(500),
    changelog_url VARCHAR(500),
    
    -- Statistics
    view_count INT DEFAULT 0,
    sales_count INT DEFAULT 0,
    revenue_total DECIMAL(12,2) DEFAULT 0,
    
    -- Rating System
    rating_average DECIMAL(3,2) DEFAULT 0,
    rating_count INT DEFAULT 0,
    
    -- Approval Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    reviewed_by UUID,
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Featured Placement
    is_featured BOOLEAN DEFAULT false,
    featured_until TIMESTAMP,
    featured_position INT,
    
    -- SEO Optimization
    meta_title VARCHAR(255),
    meta_description TEXT,
    slug_override VARCHAR(200),
    
    -- Timestamps
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key Constraints
    FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Unique Constraints
    UNIQUE(plugin_id)
);

-- Performance Indexes
CREATE INDEX idx_marketplace_plugin ON plugin_marketplace_listings(plugin_id);
CREATE INDEX idx_marketplace_vendor ON plugin_marketplace_listings(vendor_id);
CREATE INDEX idx_marketplace_status ON plugin_marketplace_listings(status);
CREATE INDEX idx_marketplace_featured ON plugin_marketplace_listings(is_featured, featured_position);
CREATE INDEX idx_marketplace_rating ON plugin_marketplace_listings(rating_average DESC);
CREATE INDEX idx_marketplace_pricing ON plugin_marketplace_listings(pricing_type, price);

-- Updated Timestamp Trigger
CREATE TRIGGER update_plugin_marketplace_listings_updated_at
BEFORE UPDATE ON plugin_marketplace_listings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Field Count**: 36 fields

---

### Table 7: plugin_purchases

**Schema**: Landlord (central)  
**Purpose**: Plugin purchase transactions and license management  
**Relationships**: References plugin_marketplace_listings(id), plugins(id), users(id), tenants(uuid)

```sql
CREATE TABLE plugin_purchases (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Purchase References
    marketplace_listing_id UUID NOT NULL,
    plugin_id UUID NOT NULL,
    buyer_user_id UUID NOT NULL,
    tenant_id UUID,
    
    -- License Information
    license_type VARCHAR(50) NOT NULL,
    license_key VARCHAR(255) UNIQUE NOT NULL,
    
    -- Pricing Details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    platform_fee DECIMAL(10,2),
    vendor_payout DECIMAL(10,2),
    
    -- Payment Information
    payment_method VARCHAR(50),
    payment_provider VARCHAR(50),
    payment_intent_id VARCHAR(255),
    payment_status VARCHAR(50) CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    
    -- License Activation
    activated_for_tenant UUID,
    activation_count INT DEFAULT 0,
    max_activations INT DEFAULT 1,
    
    -- Subscription Management (if applicable)
    is_subscription BOOLEAN DEFAULT false,
    subscription_interval VARCHAR(20) CHECK (subscription_interval IN ('monthly', 'yearly')),
    subscription_starts_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    subscription_renews_at TIMESTAMP,
    subscription_cancelled_at TIMESTAMP,
    
    -- License Validity
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    
    -- Refund Management
    refund_requested_at TIMESTAMP,
    refund_reason TEXT,
    refunded_at TIMESTAMP,
    refund_amount DECIMAL(10,2),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key Constraints
    FOREIGN KEY (marketplace_listing_id) REFERENCES plugin_marketplace_listings(id) ON DELETE RESTRICT,
    FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE RESTRICT,
    FOREIGN KEY (buyer_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE SET NULL,
    FOREIGN KEY (activated_for_tenant) REFERENCES tenants(uuid) ON DELETE SET NULL
);

-- Performance Indexes
CREATE INDEX idx_plugin_purchases_listing ON plugin_purchases(marketplace_listing_id);
CREATE INDEX idx_plugin_purchases_buyer ON plugin_purchases(buyer_user_id);
CREATE INDEX idx_plugin_purchases_tenant ON plugin_purchases(tenant_id);
CREATE INDEX idx_plugin_purchases_license ON plugin_purchases(license_key);
CREATE INDEX idx_plugin_purchases_subscription ON plugin_purchases(is_subscription, subscription_ends_at);
CREATE INDEX idx_plugin_purchases_status ON plugin_purchases(payment_status);

-- Updated Timestamp Trigger
CREATE TRIGGER update_plugin_purchases_updated_at
BEFORE UPDATE ON plugin_purchases
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Field Count**: 32 fields

---

### Table 8: plugin_api_keys

**Schema**: Tenant (per-tenant)  
**Purpose**: API keys for plugin authentication and rate limiting  
**Relationships**: References plugin_installations(id), tenants(uuid), users(id)

```sql
CREATE TABLE plugin_api_keys (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-Tenant Isolation (CORE RULE COMPLIANCE)
    tenant_id UUID NOT NULL,
    
    -- Plugin Installation Reference
    plugin_installation_id UUID NOT NULL,
    
    -- API Key Information
    key_name VARCHAR(200),
    api_key VARCHAR(255) UNIQUE NOT NULL,
    api_secret VARCHAR(255),
    
    -- Permission Scopes
    scopes VARCHAR(100)[], -- Array of allowed permissions
    
    -- Rate Limiting Configuration
    rate_limit_per_minute INT DEFAULT 60,
    rate_limit_per_hour INT DEFAULT 1000,
    
    -- Usage Statistics
    last_used_at TIMESTAMP,
    usage_count BIGINT DEFAULT 0,
    
    -- Status Management
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    
    -- Audit Trail
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    revoked_by UUID,
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (plugin_installation_id) REFERENCES plugin_installations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Performance Indexes
CREATE INDEX idx_plugin_api_keys_tenant ON plugin_api_keys(tenant_id);
CREATE INDEX idx_plugin_api_keys_plugin ON plugin_api_keys(plugin_installation_id);
CREATE INDEX idx_plugin_api_keys_key ON plugin_api_keys(api_key);
CREATE INDEX idx_plugin_api_keys_active ON plugin_api_keys(is_active) WHERE is_active = true;
CREATE INDEX idx_plugin_api_keys_expires ON plugin_api_keys(expires_at) WHERE expires_at IS NOT NULL;

-- Updated Timestamp Trigger
CREATE TRIGGER update_plugin_api_keys_updated_at
BEFORE UPDATE ON plugin_api_keys
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Field Count**: 19 fields

---

### Table 9: plugin_files

**Schema**: Tenant (per-tenant)  
**Purpose**: Plugin file management and version control for development workflow  
**Relationships**: References plugin_installations(id), tenants(uuid), users(id)

```sql
CREATE TABLE plugin_files (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-Tenant Isolation (CORE RULE COMPLIANCE)
    tenant_id UUID NOT NULL,
    
    -- Plugin Installation Reference
    plugin_installation_id UUID NOT NULL,
    plugin_slug VARCHAR(100) NOT NULL,
    
    -- File Information
    file_path VARCHAR(1000) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) CHECK (file_type IN ('php', 'js', 'ts', 'tsx', 'css', 'scss', 'json', 'md', 'xml', 'yml', 'yaml', 'txt', 'sql', 'other')),
    file_size BIGINT NOT NULL, -- bytes
    
    -- File Content
    file_content TEXT,
    file_content_hash VARCHAR(64), -- SHA-256 hash for integrity
    
    -- Version Control
    version VARCHAR(20),
    is_main_file BOOLEAN DEFAULT false,
    parent_file_id UUID REFERENCES plugin_files(id) ON DELETE SET NULL,
    
    -- File Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'archived', 'backup')),
    is_binary BOOLEAN DEFAULT false,
    is_encrypted BOOLEAN DEFAULT false,
    
    -- Permissions
    is_readonly BOOLEAN DEFAULT false,
    is_system_file BOOLEAN DEFAULT false,
    
    -- Metadata
    mime_type VARCHAR(255),
    encoding VARCHAR(50) DEFAULT 'utf-8',
    line_count INTEGER,
    
    -- Audit Trail
    created_by UUID NOT NULL,
    updated_by UUID,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accessed_at TIMESTAMP,
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (plugin_installation_id) REFERENCES plugin_installations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Unique Constraints
    UNIQUE(tenant_id, plugin_installation_id, file_path)
);

-- Performance Indexes
CREATE INDEX idx_plugin_files_tenant ON plugin_files(tenant_id);
CREATE INDEX idx_plugin_files_installation ON plugin_files(plugin_installation_id);
CREATE INDEX idx_plugin_files_path ON plugin_files(file_path);
CREATE INDEX idx_plugin_files_type ON plugin_files(file_type);
CREATE INDEX idx_plugin_files_status ON plugin_files(status) WHERE status = 'active';
CREATE INDEX idx_plugin_files_main ON plugin_files(is_main_file) WHERE is_main_file = true;
CREATE INDEX idx_plugin_files_hash ON plugin_files(file_content_hash);

-- Full-Text Search Index for File Content
CREATE INDEX idx_plugin_files_content_search ON plugin_files USING GIN(
    to_tsvector('english', COALESCE(file_content, ''))
) WHERE file_content IS NOT NULL AND is_binary = false;

-- Updated Timestamp Trigger
CREATE TRIGGER update_plugin_files_updated_at
BEFORE UPDATE ON plugin_files
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Field Count**: 25 fields

---

### Table 10: plugin_validation_results

**Schema**: Tenant (per-tenant)  
**Purpose**: Plugin validation and quality assurance results  
**Relationships**: References plugin_installations(id), tenants(uuid), users(id)

```sql
CREATE TABLE plugin_validation_results (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-Tenant Isolation (CORE RULE COMPLIANCE)
    tenant_id UUID NOT NULL,
    
    -- Plugin Installation Reference
    plugin_installation_id UUID NOT NULL,
    plugin_slug VARCHAR(100) NOT NULL,
    plugin_version VARCHAR(20) NOT NULL,
    
    -- Validation Information
    validation_type VARCHAR(50) NOT NULL CHECK (validation_type IN ('syntax', 'security', 'performance', 'compatibility', 'standards', 'accessibility', 'seo')),
    validator_name VARCHAR(100) NOT NULL,
    validator_version VARCHAR(20),
    
    -- Validation Results
    status VARCHAR(50) NOT NULL CHECK (status IN ('passed', 'failed', 'warning', 'skipped', 'error')),
    score DECIMAL(5,2), -- 0.00 to 100.00
    max_score DECIMAL(5,2) DEFAULT 100.00,
    
    -- Issues Found
    issues_count INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    warnings_count INTEGER DEFAULT 0,
    
    -- Detailed Results
    validation_results JSONB NOT NULL DEFAULT '{}',
    issues_list JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    
    -- Performance Metrics
    validation_duration FLOAT, -- seconds
    files_checked INTEGER DEFAULT 0,
    lines_checked INTEGER DEFAULT 0,
    
    -- Context Information
    validation_context JSONB DEFAULT '{}', -- Environment, settings, etc.
    
    -- Audit Trail
    validated_by UUID,
    
    -- Timestamps
    validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- Cache expiration
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (plugin_installation_id) REFERENCES plugin_installations(id) ON DELETE CASCADE,
    FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Performance Indexes
CREATE INDEX idx_plugin_validation_tenant ON plugin_validation_results(tenant_id);
CREATE INDEX idx_plugin_validation_installation ON plugin_validation_results(plugin_installation_id);
CREATE INDEX idx_plugin_validation_type ON plugin_validation_results(validation_type);
CREATE INDEX idx_plugin_validation_status ON plugin_validation_results(status);
CREATE INDEX idx_plugin_validation_score ON plugin_validation_results(score DESC);
CREATE INDEX idx_plugin_validation_date ON plugin_validation_results(validated_at DESC);
CREATE INDEX idx_plugin_validation_expires ON plugin_validation_results(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_plugin_validation_results ON plugin_validation_results USING GIN(validation_results);
```

**Field Count**: 23 fields

---

### Table 11: plugin_security_scans

**Schema**: Tenant (per-tenant)  
**Purpose**: Security scanning results and vulnerability tracking  
**Relationships**: References plugin_installations(id), tenants(uuid), users(id)

```sql
CREATE TABLE plugin_security_scans (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-Tenant Isolation (CORE RULE COMPLIANCE)
    tenant_id UUID NOT NULL,
    
    -- Plugin Installation Reference
    plugin_installation_id UUID NOT NULL,
    plugin_slug VARCHAR(100) NOT NULL,
    plugin_version VARCHAR(20) NOT NULL,
    
    -- Scan Information
    scan_type VARCHAR(50) NOT NULL CHECK (scan_type IN ('malware', 'vulnerability', 'dependency', 'code_quality', 'permissions', 'data_privacy')),
    scanner_name VARCHAR(100) NOT NULL,
    scanner_version VARCHAR(20),
    
    -- Scan Results
    status VARCHAR(50) NOT NULL CHECK (status IN ('clean', 'suspicious', 'malicious', 'vulnerable', 'error', 'timeout')),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    confidence_score DECIMAL(5,2), -- 0.00 to 100.00
    
    -- Threats Found
    threats_count INTEGER DEFAULT 0,
    vulnerabilities_count INTEGER DEFAULT 0,
    suspicious_patterns_count INTEGER DEFAULT 0,
    
    -- Detailed Results
    scan_results JSONB NOT NULL DEFAULT '{}',
    threats_list JSONB DEFAULT '[]',
    vulnerabilities_list JSONB DEFAULT '[]',
    remediation_steps JSONB DEFAULT '[]',
    
    -- Scan Metadata
    scan_duration FLOAT, -- seconds
    files_scanned INTEGER DEFAULT 0,
    bytes_scanned BIGINT DEFAULT 0,
    
    -- Quarantine Information
    is_quarantined BOOLEAN DEFAULT false,
    quarantine_reason TEXT,
    quarantined_at TIMESTAMP,
    quarantined_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Audit Trail
    scanned_by UUID,
    
    -- Timestamps
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- Cache expiration
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (plugin_installation_id) REFERENCES plugin_installations(id) ON DELETE CASCADE,
    FOREIGN KEY (scanned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Performance Indexes
CREATE INDEX idx_plugin_security_tenant ON plugin_security_scans(tenant_id);
CREATE INDEX idx_plugin_security_installation ON plugin_security_scans(plugin_installation_id);
CREATE INDEX idx_plugin_security_type ON plugin_security_scans(scan_type);
CREATE INDEX idx_plugin_security_status ON plugin_security_scans(status);
CREATE INDEX idx_plugin_security_risk ON plugin_security_scans(risk_level);
CREATE INDEX idx_plugin_security_threats ON plugin_security_scans(threats_count) WHERE threats_count > 0;
CREATE INDEX idx_plugin_security_quarantine ON plugin_security_scans(is_quarantined) WHERE is_quarantined = true;
CREATE INDEX idx_plugin_security_date ON plugin_security_scans(scanned_at DESC);
CREATE INDEX idx_plugin_security_results ON plugin_security_scans USING GIN(scan_results);
```

**Field Count**: 27 fields

---

### Table 12: plugin_analytics

**Schema**: Tenant (per-tenant)  
**Purpose**: Plugin usage analytics and performance monitoring  
**Relationships**: References plugin_installations(id), tenants(uuid)

```sql
CREATE TABLE plugin_analytics (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-Tenant Isolation (CORE RULE COMPLIANCE)
    tenant_id UUID NOT NULL,
    
    -- Plugin Installation Reference
    plugin_installation_id UUID NOT NULL,
    plugin_slug VARCHAR(100) NOT NULL,
    
    -- Time Period
    date_recorded DATE NOT NULL,
    hour_recorded SMALLINT CHECK (hour_recorded >= 0 AND hour_recorded <= 23),
    
    -- Usage Metrics
    activation_count INTEGER DEFAULT 0,
    deactivation_count INTEGER DEFAULT 0,
    execution_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    -- Performance Metrics
    total_execution_time FLOAT DEFAULT 0, -- milliseconds
    avg_execution_time FLOAT DEFAULT 0,
    min_execution_time FLOAT,
    max_execution_time FLOAT,
    
    -- Resource Usage
    memory_usage_mb FLOAT DEFAULT 0,
    cpu_usage_percent FLOAT DEFAULT 0,
    api_calls_count INTEGER DEFAULT 0,
    database_queries_count INTEGER DEFAULT 0,
    
    -- User Interaction
    settings_changes_count INTEGER DEFAULT 0,
    unique_users_count INTEGER DEFAULT 0,
    
    -- Hook Performance
    hooks_executed INTEGER DEFAULT 0,
    filters_applied INTEGER DEFAULT 0,
    hooks_avg_time FLOAT DEFAULT 0,
    
    -- Error Analysis
    error_types JSONB DEFAULT '{}',
    error_messages JSONB DEFAULT '[]',
    
    -- Feature Usage
    features_used JSONB DEFAULT '{}',
    settings_accessed JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (plugin_installation_id) REFERENCES plugin_installations(id) ON DELETE CASCADE,
    
    -- Unique Constraints
    UNIQUE(tenant_id, plugin_installation_id, date_recorded, hour_recorded)
);

-- Performance Indexes
CREATE INDEX idx_plugin_analytics_tenant ON plugin_analytics(tenant_id);
CREATE INDEX idx_plugin_analytics_installation ON plugin_analytics(plugin_installation_id);
CREATE INDEX idx_plugin_analytics_date ON plugin_analytics(date_recorded DESC);
CREATE INDEX idx_plugin_analytics_hour ON plugin_analytics(date_recorded, hour_recorded);
CREATE INDEX idx_plugin_analytics_errors ON plugin_analytics(error_count) WHERE error_count > 0;
CREATE INDEX idx_plugin_analytics_performance ON plugin_analytics(avg_execution_time DESC);
CREATE INDEX idx_plugin_analytics_usage ON plugin_analytics(execution_count DESC);

-- Updated Timestamp Trigger
CREATE TRIGGER update_plugin_analytics_updated_at
BEFORE UPDATE ON plugin_analytics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Field Count**: 31 fields

---

## ADVANCED PLUGIN FEATURES

### Plugin Package Manager

**Advanced ZIP Package Installation with Progress Tracking:**

The Plugin Package Manager provides enterprise-grade plugin installation capabilities similar to modern package managers (npm, composer) but specifically designed for the Stencil CMS ecosystem.

**Key Features:**
- **Atomic Installations**: All-or-nothing installation process with rollback capability
- **Dependency Resolution**: Automatic dependency checking and installation
- **Progress Tracking**: Real-time installation progress with detailed status updates
- **Integrity Verification**: SHA-256 hash verification and digital signature validation
- **Conflict Detection**: Automatic detection of plugin conflicts before installation
- **Backup & Restore**: Automatic backup creation before major operations

**Installation Process Flow:**
```
1. Package Upload/Download
   ├─ Validate package format (ZIP structure)
   ├─ Verify digital signature
   ├─ Extract manifest.json
   └─ Check compatibility requirements

2. Dependency Resolution
   ├─ Parse required dependencies
   ├─ Check for conflicts
   ├─ Calculate installation order
   └─ Prepare dependency tree

3. Pre-Installation Validation
   ├─ Security scan (malware detection)
   ├─ Code quality analysis
   ├─ Permission requirements check
   └─ Resource requirements validation

4. Installation Execution
   ├─ Create backup point
   ├─ Extract files to staging area
   ├─ Run database migrations
   ├─ Register hooks and filters
   ├─ Configure default settings
   └─ Activate plugin

5. Post-Installation Verification
   ├─ Health check execution
   ├─ Integration testing
   ├─ Performance baseline
   └─ Success confirmation
```

### Plugin Security Sandbox

**Isolated Execution Environment with Resource Limits:**

The Security Sandbox ensures plugins cannot compromise system security or performance by enforcing strict execution boundaries and resource quotas.

**Sandbox Features:**
- **Process Isolation**: Each plugin runs in isolated process space
- **Resource Quotas**: CPU time, memory usage, and API call limits
- **File System Restrictions**: Limited file access with whitelist approach
- **Network Restrictions**: Controlled external API access
- **Database Isolation**: Tenant-scoped database access only
- **API Rate Limiting**: Per-plugin API call throttling

**Resource Limits Configuration:**
```json
{
  "memory_limit": "128MB",
  "cpu_time_limit": "30s",
  "api_calls_per_hour": 1000,
  "file_access": {
    "allowed_paths": ["/plugins/{plugin_slug}/", "/uploads/"],
    "denied_paths": ["/system/", "/config/", "/database/"]
  },
  "network_access": {
    "allowed_domains": ["api.stripe.com", "api.paypal.com"],
    "blocked_ips": ["127.0.0.1", "10.0.0.0/8", "192.168.0.0/16"]
  }
}
```

### Plugin Validator System

**Comprehensive Code Quality and Security Analysis:**

The Plugin Validator performs multi-layered analysis to ensure plugins meet quality, security, and performance standards before marketplace approval.

**Validation Categories:**

1. **Security Validation**
   - Malware detection using signature-based scanning
   - Vulnerability assessment (SQL injection, XSS, CSRF)
   - Dependency security audit
   - Permission abuse detection
   - Data privacy compliance check

2. **Performance Validation**
   - Code complexity analysis
   - Database query optimization
   - Memory usage profiling
   - Execution time benchmarking
   - Resource leak detection

3. **Compatibility Validation**
   - Stencil version compatibility
   - PHP version requirements
   - Extension dependencies
   - Plugin conflict detection
   - API compatibility check

4. **Standards Validation**
   - PSR coding standards compliance
   - Documentation completeness
   - Accessibility standards (WCAG 2.1)
   - SEO best practices
   - Internationalization support

**Validation Scoring System:**
```
Score Range | Status | Action
------------|--------|--------
90-100      | Excellent | Auto-approve for marketplace
75-89       | Good | Manual review recommended
60-74       | Fair | Requires improvements
40-59       | Poor | Major issues, reject
0-39        | Critical | Security/quality failures
```

### Plugin Version Control System

**Git-like Version Management for Plugin Development:**

Built-in version control system specifically designed for plugin development workflow with branching, merging, and collaboration features.

**Version Control Features:**
- **Branch Management**: Feature branches, hotfix branches, release branches
- **Commit History**: Detailed change tracking with diff visualization
- **Merge Capabilities**: Automatic and manual merge conflict resolution
- **Tag System**: Version tagging for releases and milestones
- **Rollback Support**: Easy rollback to previous stable versions
- **Collaboration**: Multi-developer support with conflict resolution

**Branching Strategy:**
```
main (production)
├─ develop (integration)
│  ├─ feature/payment-gateway-v2
│  ├─ feature/webhook-improvements
│  └─ feature/ui-enhancements
├─ release/v2.1.0
└─ hotfix/security-patch-v2.0.1
```

### Plugin Hook System

**WordPress-Style Event-Driven Architecture:**

Advanced hook system enabling plugins to integrate seamlessly with core functionality without modifying core code.

**Hook Types:**

1. **Action Hooks** - Execute code at specific points
   ```php
   // Core triggers
   do_action('order.created', $order);
   do_action('payment.completed', $payment, $order);
   do_action('user.registered', $user);
   
   // Plugin listens
   add_action('order.created', 'send_order_notification', 10, 1);
   add_action('payment.completed', 'update_inventory', 20, 2);
   ```

2. **Filter Hooks** - Transform data before use
   ```php
   // Core applies filter
   $price = apply_filters('product.price', $basePrice, $product);
   $content = apply_filters('page.content', $rawContent, $page);
   
   // Plugin modifies
   add_filter('product.price', 'apply_discount', 10, 2);
   add_filter('page.content', 'add_social_sharing', 15, 2);
   ```

**Priority System:**
- Priority 1-9: Critical system operations
- Priority 10: Default priority (most plugins)
- Priority 11-20: UI modifications
- Priority 21+: Analytics and logging

---

## PLUGIN DEVELOPMENT TOOLS

### Plugin IDE Integration

**Monaco Editor with IntelliSense and Real-time Collaboration:**

Professional development environment integrated directly into the Stencil admin interface, providing VS Code-like experience for plugin development.

**IDE Features:**
- **Syntax Highlighting**: PHP, JavaScript, TypeScript, CSS, JSON, YAML
- **IntelliSense**: Auto-completion for Stencil APIs and plugin functions
- **Error Detection**: Real-time syntax and semantic error highlighting
- **Code Formatting**: Automatic code formatting with PSR standards
- **Debugging Support**: Integrated debugger with breakpoints and variable inspection
- **Git Integration**: Built-in version control with visual diff and merge tools

**Real-time Collaboration:**
```typescript
// Multiple developers can edit simultaneously
interface CollaborationSession {
  sessionId: string;
  participants: Developer[];
  activeFile: string;
  cursors: CursorPosition[];
  changes: ChangeEvent[];
  conflictResolution: 'manual' | 'automatic';
}
```

### Plugin Testing Framework

**Automated Testing Suite with Unit, Integration, and E2E Tests:**

Comprehensive testing framework ensuring plugin reliability and compatibility across different environments and configurations.

**Testing Capabilities:**

1. **Unit Testing**
   - PHPUnit integration for backend code
   - Jest integration for frontend code
   - Mock services for external dependencies
   - Code coverage reporting

2. **Integration Testing**
   - Database integration tests
   - API endpoint testing
   - Hook system integration
   - Multi-tenant isolation verification

3. **End-to-End Testing**
   - Playwright/Cypress integration
   - User workflow testing
   - Cross-browser compatibility
   - Performance benchmarking

**Test Configuration Example:**
```yaml
# plugin-test.yml
testing:
  unit:
    framework: "phpunit"
    coverage_threshold: 80
    mock_external_apis: true
    
  integration:
    database: "sqlite_memory"
    test_tenants: ["test-tenant-1", "test-tenant-2"]
    api_endpoints: true
    
  e2e:
    browsers: ["chrome", "firefox", "safari"]
    viewports: ["desktop", "tablet", "mobile"]
    performance_budget:
      load_time: "3s"
      memory_usage: "50MB"
```

### Plugin Marketplace SDK

**Developer Tools and APIs for Plugin Creation and Distribution:**

Comprehensive SDK providing tools, libraries, and APIs for efficient plugin development and marketplace integration.

**SDK Components:**

1. **CLI Tools**
   ```bash
   # Plugin scaffolding
   stencil plugin:create payment-gateway
   stencil plugin:validate
   stencil plugin:test
   stencil plugin:package
   stencil plugin:publish
   ```

2. **Development Libraries**
   ```php
   // Stencil Plugin Base Class
   class StripePaymentPlugin extends StencilPlugin {
       public function init() {
           $this->addHook('payment.process', [$this, 'processPayment']);
           $this->addFilter('payment.methods', [$this, 'addStripeMethod']);
       }
   }
   ```

3. **API Client Libraries**
   ```typescript
   // Frontend Plugin API
   import { StencilPluginAPI } from '@stencil/plugin-sdk';
   
   const api = new StencilPluginAPI({
       pluginSlug: 'google-analytics',
       version: '1.0.0'
   });
   
   api.hooks.addAction('page.view', (url) => {
       gtag('event', 'page_view', { page_path: url });
   });
   ```

---

## SECURITY & VALIDATION SYSTEM

### Multi-Layer Security Architecture

**Defense in Depth with Multiple Security Checkpoints:**

1. **Upload Security**
   - File type validation (whitelist approach)
   - Malware scanning using ClamAV integration
   - Archive bomb detection
   - File size and structure limits

2. **Code Analysis Security**
   - Static code analysis for vulnerabilities
   - Dynamic analysis in sandbox environment
   - Dependency vulnerability scanning
   - License compliance checking

3. **Runtime Security**
   - Process isolation and resource limits
   - API access control and rate limiting
   - Database query monitoring
   - Network traffic inspection

4. **Data Security**
   - Encryption at rest for sensitive settings
   - Secure key management
   - Audit logging for all operations
   - GDPR compliance features

### Vulnerability Management

**Continuous Security Monitoring and Threat Response:**

**Vulnerability Detection:**
- Automated security scanning on plugin updates
- Integration with CVE databases
- Dependency vulnerability tracking
- Zero-day threat monitoring

**Response Procedures:**
```
Critical Vulnerability Detected
├─ Immediate quarantine of affected plugins
├─ Notification to all affected tenants
├─ Emergency patch development
├─ Coordinated disclosure process
└─ Post-incident security review
```

**Security Metrics Dashboard:**
- Vulnerability count by severity
- Mean time to patch (MTTP)
- Security scan coverage
- Incident response times

---

## PLUGIN ANALYTICS & MONITORING

### Performance Monitoring

**Real-time Performance Tracking and Optimization:**

**Metrics Collected:**
- Execution time per hook/filter
- Memory usage patterns
- Database query performance
- API response times
- Error rates and patterns

**Performance Dashboards:**
- Plugin performance comparison
- Resource usage trends
- Bottleneck identification
- Optimization recommendations

### Usage Analytics

**Comprehensive Plugin Usage Insights:**

**Analytics Categories:**

1. **Installation Analytics**
   - Installation success/failure rates
   - Popular plugin categories
   - Geographic distribution
   - Tenant size correlation

2. **Usage Analytics**
   - Feature utilization rates
   - User interaction patterns
   - Configuration preferences
   - Abandonment analysis

3. **Performance Analytics**
   - Load time impact
   - Resource consumption
   - Error frequency
   - User satisfaction scores

**Business Intelligence:**
```sql
-- Plugin ROI Analysis
SELECT 
    p.name,
    COUNT(pi.id) as installations,
    AVG(pa.execution_count) as avg_usage,
    SUM(pp.amount) as total_revenue,
    AVG(pml.rating_average) as satisfaction
FROM plugins p
LEFT JOIN plugin_installations pi ON p.id = pi.plugin_id
LEFT JOIN plugin_analytics pa ON pi.id = pa.plugin_installation_id
LEFT JOIN plugin_purchases pp ON p.id = pp.plugin_id
LEFT JOIN plugin_marketplace_listings pml ON p.id = pml.plugin_id
GROUP BY p.id, p.name
ORDER BY total_revenue DESC;
```

---

## DATABASE SCHEMA SUMMARY

| Table | Fields | Purpose | Schema |
|-------|--------|---------|---------|
| `plugins` | 37 | Plugin registry | Landlord (central) |
| `plugin_installations` | 32 | Per-tenant installations | Tenant (per-tenant) |
| `plugin_settings` | 22 | Plugin configurations | Tenant (per-tenant) |
| `plugin_hooks` | 20 | Hook registry | Tenant (per-tenant) |
| `plugin_events` | 17 | Event logs | Tenant (per-tenant) |
| `plugin_marketplace_listings` | 36 | Marketplace catalog | Landlord (central) |
| `plugin_purchases` | 32 | Purchase transactions | Landlord (central) |
| `plugin_api_keys` | 19 | API authentication | Tenant (per-tenant) |
| `plugin_files` | 25 | File management | Tenant (per-tenant) |
| `plugin_validation_results` | 23 | Validation results | Tenant (per-tenant) |
| `plugin_security_scans` | 27 | Security scanning | Tenant (per-tenant) |
| `plugin_analytics` | 31 | Usage analytics | Tenant (per-tenant) |
| **TOTAL** | **285 fields** | **12 tables** | **Mixed Architecture** |

---

## ADMIN UI FEATURES

### Plugin Management Dashboard

**Comprehensive Plugin Administration Interface:**

The Plugin Management Dashboard provides a centralized interface for managing all aspects of the plugin ecosystem, from development to marketplace operations.

**Dashboard Sections:**

1. **Plugin Overview**
   - Total plugins installed/active
   - Performance metrics summary
   - Security status overview
   - Recent plugin activities

2. **Plugin Library**
   - Installed plugins list with status
   - Quick activate/deactivate toggles
   - Plugin health indicators
   - Update notifications

3. **Marketplace Browser**
   - Featured plugins showcase
   - Category-based browsing
   - Search and filtering
   - Plugin ratings and reviews

4. **Developer Tools**
   - Plugin creation wizard
   - Code editor integration
   - Testing environment
   - Publishing workflow

### Plugin Marketplace Interface

**Advanced Marketplace with Discovery and Purchase Features:**

Professional marketplace interface enabling users to discover, evaluate, and purchase plugins with confidence.

**Marketplace Features:**

1. **Plugin Discovery**
   - Advanced search with filters
   - Category-based navigation
   - Featured plugins carousel
   - Trending and popular sections
   - Recommendation engine

2. **Plugin Details**
   - Comprehensive plugin information
   - Screenshots and demo videos
   - User reviews and ratings
   - Compatibility information
   - Pricing and licensing options

3. **Purchase Flow**
   - Secure payment processing
   - License selection
   - Instant download/installation
   - Purchase history tracking

4. **Vendor Dashboard**
   - Plugin submission interface
   - Sales analytics
   - Revenue tracking
   - Customer feedback management

### Plugin Development IDE

**Integrated Development Environment for Plugin Creation:**

Professional IDE built into the admin interface, providing all tools needed for plugin development without leaving the browser.

**IDE Components:**

1. **Code Editor (Monaco)**
   - Syntax highlighting for multiple languages
   - IntelliSense and auto-completion
   - Error detection and linting
   - Code formatting and refactoring
   - Multi-file editing with tabs

2. **File Manager**
   - Project file tree
   - File upload/download
   - Drag-and-drop organization
   - Version control integration
   - Backup and restore

3. **Testing Suite**
   - Unit test runner
   - Integration test execution
   - Performance profiling
   - Security scanning
   - Compatibility testing

4. **Debugging Tools**
   - Breakpoint debugging
   - Variable inspection
   - Call stack analysis
   - Performance monitoring
   - Error tracking

### Plugin Security Center

**Comprehensive Security Management Interface:**

Centralized security dashboard for monitoring, analyzing, and managing plugin security across the entire system.

**Security Features:**

1. **Security Dashboard**
   - Overall security score
   - Threat detection summary
   - Vulnerability alerts
   - Compliance status

2. **Scan Management**
   - Manual security scans
   - Scheduled scan configuration
   - Scan history and reports
   - Quarantine management

3. **Vulnerability Tracking**
   - CVE database integration
   - Patch management
   - Risk assessment
   - Remediation workflows

4. **Compliance Monitoring**
   - GDPR compliance checks
   - Security policy enforcement
   - Audit trail management
   - Certification tracking

### Plugin Analytics Dashboard

**Advanced Analytics and Performance Monitoring:**

Comprehensive analytics platform providing insights into plugin performance, usage patterns, and business metrics.

**Analytics Categories:**

1. **Performance Analytics**
   - Execution time trends
   - Memory usage patterns
   - Error rate monitoring
   - Resource consumption analysis

2. **Usage Analytics**
   - Installation statistics
   - Feature utilization rates
   - User engagement metrics
   - Abandonment analysis

3. **Business Analytics**
   - Revenue tracking
   - Market share analysis
   - Customer satisfaction scores
   - ROI calculations

4. **Predictive Analytics**
   - Usage forecasting
   - Performance predictions
   - Maintenance scheduling
   - Capacity planning

### Plugin Configuration Manager

**Advanced Settings and Configuration Interface:**

Sophisticated configuration management system allowing fine-tuned control over plugin behavior and integration.

**Configuration Features:**

1. **Settings Management**
   - Visual settings editor
   - Configuration validation
   - Environment-specific settings
   - Bulk configuration updates

2. **Integration Configuration**
   - API endpoint management
   - Webhook configuration
   - Third-party service integration
   - Authentication setup

3. **Performance Tuning**
   - Resource limit configuration
   - Caching settings
   - Optimization parameters
   - Load balancing options

4. **Security Configuration**
   - Permission management
   - Access control settings
   - Encryption configuration
   - Audit logging setup

---

## API ENDPOINTS

### Plugin Management API

**RESTful API for Plugin Lifecycle Management:**

```http
# Plugin Registry
GET    /api/plugins                    # List available plugins
GET    /api/plugins/{slug}             # Get plugin details
POST   /api/plugins                    # Register new plugin
PUT    /api/plugins/{slug}             # Update plugin
DELETE /api/plugins/{slug}             # Remove plugin

# Plugin Installations
GET    /api/plugins/installations      # List tenant installations
POST   /api/plugins/{slug}/install     # Install plugin
PUT    /api/plugins/{slug}/activate    # Activate plugin
PUT    /api/plugins/{slug}/deactivate  # Deactivate plugin
DELETE /api/plugins/{slug}/uninstall   # Uninstall plugin

# Plugin Settings
GET    /api/plugins/{slug}/settings    # Get plugin settings
PUT    /api/plugins/{slug}/settings    # Update plugin settings
POST   /api/plugins/{slug}/settings/validate # Validate settings

# Plugin Files
GET    /api/plugins/{slug}/files       # List plugin files
GET    /api/plugins/{slug}/files/{path} # Get file content
PUT    /api/plugins/{slug}/files/{path} # Update file content
POST   /api/plugins/{slug}/files       # Create new file
DELETE /api/plugins/{slug}/files/{path} # Delete file
```

### Marketplace API

**E-commerce API for Plugin Marketplace:**

```http
# Marketplace Listings
GET    /api/marketplace/plugins        # Browse marketplace
GET    /api/marketplace/plugins/{slug} # Get marketplace listing
POST   /api/marketplace/plugins        # Submit plugin to marketplace
PUT    /api/marketplace/plugins/{slug} # Update marketplace listing

# Purchase Management
POST   /api/marketplace/purchase       # Purchase plugin
GET    /api/marketplace/purchases      # Get purchase history
POST   /api/marketplace/licenses/activate # Activate license
POST   /api/marketplace/refund         # Request refund

# Reviews and Ratings
GET    /api/marketplace/plugins/{slug}/reviews # Get reviews
POST   /api/marketplace/plugins/{slug}/reviews # Submit review
PUT    /api/marketplace/reviews/{id}   # Update review
DELETE /api/marketplace/reviews/{id}   # Delete review
```

### Development API

**API for Plugin Development and Testing:**

```http
# Development Environment
POST   /api/dev/plugins/create         # Create new plugin project
GET    /api/dev/plugins/{slug}/status  # Get development status
POST   /api/dev/plugins/{slug}/test    # Run plugin tests
POST   /api/dev/plugins/{slug}/validate # Validate plugin code
POST   /api/dev/plugins/{slug}/package # Package plugin for distribution

# Version Control
GET    /api/dev/plugins/{slug}/commits # Get commit history
POST   /api/dev/plugins/{slug}/commit  # Create new commit
POST   /api/dev/plugins/{slug}/branch  # Create new branch
POST   /api/dev/plugins/{slug}/merge   # Merge branches

# Collaboration
GET    /api/dev/plugins/{slug}/collaborators # Get collaborators
POST   /api/dev/plugins/{slug}/collaborators # Add collaborator
DELETE /api/dev/plugins/{slug}/collaborators/{id} # Remove collaborator
```

### Security API

**Security and Validation API:**

```http
# Security Scanning
POST   /api/security/plugins/{slug}/scan # Initiate security scan
GET    /api/security/plugins/{slug}/results # Get scan results
POST   /api/security/plugins/{slug}/quarantine # Quarantine plugin
POST   /api/security/plugins/{slug}/whitelist # Whitelist plugin

# Vulnerability Management
GET    /api/security/vulnerabilities   # List known vulnerabilities
GET    /api/security/cve/{id}          # Get CVE details
POST   /api/security/report            # Report security issue

# Compliance
GET    /api/security/compliance        # Get compliance status
POST   /api/security/audit             # Generate audit report
```

### Analytics API

**Analytics and Monitoring API:**

```http
# Usage Analytics
GET    /api/analytics/plugins/{slug}/usage # Get usage statistics
GET    /api/analytics/plugins/{slug}/performance # Get performance metrics
GET    /api/analytics/plugins/{slug}/errors # Get error statistics

# Business Analytics
GET    /api/analytics/marketplace/sales # Get sales analytics
GET    /api/analytics/marketplace/trends # Get market trends
GET    /api/analytics/revenue           # Get revenue analytics

# System Analytics
GET    /api/analytics/system/health     # Get system health
GET    /api/analytics/system/performance # Get system performance
GET    /api/analytics/system/capacity   # Get capacity metrics
```

---

## NOTES

### Core Immutable Rules Compliance

✅ Rule 1: Semua tabel tenant-scoped memiliki tenant_id UUID NOT NULL dengan foreign key ke tenants(uuid)
✅ Rule 2: API Guard implementation disebutkan dalam dokumentasi
✅ Rule 3: Semua tabel menggunakan uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid()
✅ Rule 4: Strict tenant data isolation dengan foreign key constraints
✅ Rule 5: RBAC permissions terdefinisi dengan jelas

### Architecture Alignment

✅ Complete 8-table schema sesuai dengan arsitektur referensi
✅ Proper field counts untuk setiap tabel
✅ Correct relationships antar tabel
✅ Performance indexes untuk optimasi query
✅ Audit triggers untuk timestamp tracking

### Business Cycle Integration

✅ Plugin categories mencakup semua tahap bisnis etching:
  - `payment` - untuk payment gateway plugins
  - `shipping` - untuk shipping provider plugins
  - `analytics` - untuk tracking dan reporting
  - `crm` - untuk customer relationship management
  - `communication` - untuk email/SMS notifications
  - `production` - untuk production tracking plugins
  - `ui` - untuk user interface enhancements
  - `utility` - untuk utility functions
  - `integration` - untuk third-party integrations
  
---

**Previous:** [05-FAQ.md](./18-SEO.md)  
**Next:** [07-REVIEWS.md](./20-CUSTOMERS.md)  

**Last Updated:** 2025-11-11  
**Status:** ✅ COMPLETE  
**Reviewed By:** CanvaStack Stencil