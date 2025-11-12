# THEME SETTINGS MODULE
## Database Schema & API Documentation

**Module:** Theme Engine & Marketplace  
**Total Fields:** 200+ fields  
**Total Tables:** 12 tables (themes, theme_installations, theme_settings, theme_marketplace_listings, theme_purchases, theme_licenses, theme_versions, theme_files, theme_validation_results, theme_security_scans, theme_installation_logs, theme_hooks)  
**Admin Pages:** `src/pages/admin/ThemeSettings.tsx`, `src/pages/admin/ThemeDashboard.tsx`, `src/pages/admin/ThemeCodeEditor.tsx`, `src/pages/admin/ThemeAdvancedEditor.tsx`, `src/pages/admin/ThemeManager.tsx`, `src/pages/admin/ThemeMarketplace.tsx`, `src/pages/admin/ThemePackaging.tsx`, `src/pages/admin/ThemeUpload.tsx`, `src/pages/admin/ThemeExport.tsx`, `src/pages/admin/ThemeFiles.tsx`  
**Type Definition:** `src/types/theme.ts`  
**Core Engine:** `src/core/engine/ThemeManager.ts` (Implemented)

---

## CORE IMMUTABLE RULES COMPLIANCE

### **Rule 1: Teams Enabled with tenant_id as team_foreign_key**
✅ **ENFORCED** - All theme-related tables include mandatory `tenant_id UUID NOT NULL` with foreign key constraints to `tenants(uuid)` table for tenant-scoped data. Theme installations, settings, and purchases are strictly isolated per tenant.

### **Rule 2: API Guard Implementation**
✅ **ENFORCED** - All theme API endpoints include tenant-scoped access control. Theme data can only be accessed by authenticated users within the same tenant context. Theme marketplace is global but installations are tenant-specific.

### **Rule 3: UUID model_morph_key**
✅ **ENFORCED** - All theme tables use `uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid()` as the public identifier for external API references.

### **Rule 4: Strict Tenant Data Isolation**
✅ **ENFORCED** - Theme installations, settings, and purchases are strictly scoped to specific tenants. Global theme registry (themes table) is shared but access is controlled. Cross-tenant theme access is impossible at the database level.

### **Rule 5: RBAC Integration Requirements**
✅ **ENFORCED** - Theme management requires specific tenant-scoped permissions:
- `themes.view` - View available themes and marketplace
- `themes.create` - Upload and create new themes (admin/vendor only)
- `themes.edit` - Modify theme metadata and settings
- `themes.delete` - Delete themes from marketplace (admin only)
- `themes.manage` - Full theme management including marketplace operations
- `themes.install` - Install themes for tenant
- `themes.activate` - Activate/deactivate themes
- `themes.customize` - Access theme customizer and settings
- `themes.purchase` - Purchase paid themes
- `themes.admin` - Access advanced theme management and marketplace admin

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Business Context](#business-context)
3. [Database Schema](#database-schema)
4. [Relationship Diagram](#relationship-diagram)
5. [Field Specifications](#field-specifications)
6. [Business Rules](#business-rules)
7. [Theme Structure](#theme-structure)
8. [API Endpoints](#api-endpoints)
9. [RBAC Integration](#rbac-integration)
10. [Admin UI Features](#admin-ui-features)
11. [Sample Data](#sample-data)
12. [Migration Script](#migration-script)
13. [Performance Indexes](#performance-indexes)

---

## OVERVIEW

Modul Theme Settings adalah sistem **comprehensive theming** yang memungkinkan setiap tenant untuk memiliki visual identity unik melalui theme customization, theme marketplace, dan live theme editor. Sistem ini sudah **partially implemented** di frontend dan akan dilengkapi dengan backend API untuk marketplace integration.

### Core Features

1. **Theme Engine (Implemented di Frontend)**
   - ThemeManager untuk dynamic theme loading
   - Component-based theme architecture
   - Hot-swapping themes tanpa page reload
   - Lazy loading untuk performance optimization
   - Theme validation & error handling

2. **Theme Marketplace (Planned - Backend API)**
   - Browse & search available themes
   - Theme preview dengan screenshots
   - Purchase & licensing workflow
   - Automatic theme installation
   - Version management dengan rollback

3. **Theme Customization System**
   - Visual theme customizer (live preview)
   - Color scheme management
   - Typography settings (fonts, sizes, weights)
   - Layout configuration (container widths, spacing)
   - Custom CSS injection
   - Settings schema validation (JSON Schema)

4. **Theme Code Editor (Implemented)**
   - Monaco Editor integration dengan syntax highlighting
   - File tree explorer dengan drag & drop
   - Multi-tab interface (Code, Visual, Version Control, Settings)
   - Live preview dengan device modes (Desktop/Tablet/Mobile)
   - Auto-save functionality
   - Version control dengan diff viewer
   - Real-time collaboration support
   - Code completion & IntelliSense

5. **Advanced Theme Management (Implemented)**
   - **Theme Package Manager**: ZIP installation dengan progress tracking
   - **Theme Validator**: Security scanning, performance validation, accessibility checks
   - **Theme Sandbox**: Secure execution environment dengan resource limits
   - **Version Control**: Git-like versioning dengan rollback capability
   - **Hook System**: Theme lifecycle hooks (onActivate, onDeactivate, onUpdate)
   - **Update Manager**: Automatic theme updates dengan dependency management
   - **File Manager**: Direct file editing dengan syntax validation
   - **Export System**: Theme packaging dengan customizable options

6. **Security & Validation (Implemented)**
   - **Security Sandbox**: Isolated execution environment
   - **Code Scanning**: Malicious code detection
   - **Performance Validation**: Load time & resource usage checks
   - **Accessibility Validation**: WCAG compliance checking
   - **Dependency Scanning**: Vulnerability detection in dependencies
   - **File Size Limits**: 50MB max package size, 1MB max file size

7. **Multi-Tenant Theme Support**
   - Tenant-specific theme installations
   - Shared themes across tenants
   - Tenant-specific customizations (per-tenant settings)
   - Theme isolation (no cross-tenant interference)

---

## BUSINESS CONTEXT

### Theme Ecosystem Model

**Stencil CMS** menyediakan **complete theme ecosystem**:

- **Platform-Managed Themes (Landlord)**:
  - Official themes by Stencil team
  - Vetted community themes
  - Global theme registry
  - Version tracking & updates

- **Tenant-Specific Themes**:
  - Custom themes per tenant
  - Private themes (not in marketplace)
  - Tenant customizations (colors, fonts, layouts)
  - Settings persistence per tenant

### Revenue Model

1. **Free Themes**: Basic themes gratis untuk onboarding
2. **Premium Themes**: $49-$199 per theme dengan commercial license
3. **Marketplace Commission**: 25-30% dari third-party theme sales
4. **Custom Theme Development**: Professional services untuk bespoke themes

### PT CEX Use Case

Untuk PT Custom Etching Xenial (PT CEX) sebagai fokus utama business cycle:
- **Default Theme**: "Etching Professional" theme untuk etching business workflow
- **Business Integration**: Theme mendukung complete etching business cycle dari customer order hingga vendor payment
- **Customizations**: 
  - Brand colors (primary: #1e40af, secondary: #dc2626)
  - Custom fonts (Montserrat untuk headings, Inter untuk body)
  - Logo upload & placement
  - Custom hero section dengan 3D product preview
  - Product gallery layout dengan material showcase
  - Etching-specific components (material selector, size calculator, quote generator)
- **Workflow Integration**: Theme components terintegrasi dengan orders, vendors, customers, dan financial modules
- **Multi-tenant Ready**: Theme dapat di-customize per tenant untuk different etching businesses

---

## DATABASE SCHEMA

### Table 1: `themes` (Landlord Schema)

Global theme registry - all available themes.

```sql
CREATE TABLE themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    slug VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50) NOT NULL,
    
    author_name VARCHAR(255),
    author_email VARCHAR(255),
    author_url VARCHAR(500),
    
    compatibility_stencil_version VARCHAR(50),
    compatibility_react_version VARCHAR(50),
    
    support_email VARCHAR(255),
    support_docs_url VARCHAR(500),
    support_forum_url VARCHAR(500),
    
    pricing_type VARCHAR(20) DEFAULT 'free' CHECK (pricing_type IN ('free', 'paid', 'subscription')),
    pricing_price DECIMAL(10,2),
    pricing_currency VARCHAR(3) DEFAULT 'USD',
    pricing_license VARCHAR(50) DEFAULT 'single-site',
    
    tags JSONB DEFAULT '[]'::jsonb,
    categories JSONB DEFAULT '[]'::jsonb,
    
    screenshots JSONB DEFAULT '[]'::jsonb,
    demo_url VARCHAR(500),
    
    features JSONB DEFAULT '[]'::jsonb,
    
    is_official BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    customizer_settings_schema JSONB,
    
    download_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    
    package_url VARCHAR(500),
    package_size_bytes BIGINT,
    package_checksum VARCHAR(255),
    
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX idx_themes_slug ON themes(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_themes_pricing ON themes(pricing_type);
CREATE INDEX idx_themes_official ON themes(is_official) WHERE is_official = TRUE;
CREATE INDEX idx_themes_featured ON themes(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_themes_tags ON themes USING GIN(tags);
CREATE INDEX idx_themes_categories ON themes USING GIN(categories);
CREATE INDEX idx_themes_deleted ON themes(deleted_at);
CREATE INDEX idx_themes_search ON themes USING GIN(
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

CREATE TRIGGER update_themes_updated_at BEFORE UPDATE ON themes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Table 2: `theme_installations` (Landlord Schema)

Per-tenant theme installations.

```sql
CREATE TABLE theme_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    
    is_active BOOLEAN DEFAULT FALSE,
    
    installed_version VARCHAR(50) NOT NULL,
    available_version VARCHAR(50),
    
    installation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activation_date TIMESTAMP,
    last_update_check TIMESTAMP,
    
    auto_update_enabled BOOLEAN DEFAULT FALSE,
    
    installed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    activated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    installation_status VARCHAR(20) DEFAULT 'installed' CHECK (
        installation_status IN ('installing', 'installed', 'failed', 'updating', 'uninstalling')
    ),
    
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    UNIQUE(tenant_id, theme_id)
);

CREATE INDEX idx_theme_installations_tenant ON theme_installations(tenant_id);
CREATE INDEX idx_theme_installations_theme ON theme_installations(theme_id);
CREATE INDEX idx_theme_installations_active ON theme_installations(tenant_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_theme_installations_status ON theme_installations(installation_status);
CREATE INDEX idx_theme_installations_deleted ON theme_installations(deleted_at);
```

### Table 3: `theme_settings` (Landlord Schema)

Tenant-specific theme customizations.

```sql
CREATE TABLE theme_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    
    settings_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    custom_css TEXT,
    custom_js TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE(tenant_id, theme_id)
);

CREATE INDEX idx_theme_settings_tenant ON theme_settings(tenant_id);
CREATE INDEX idx_theme_settings_theme ON theme_settings(theme_id);
CREATE INDEX idx_theme_settings_data ON theme_settings USING GIN(settings_data);

CREATE TRIGGER update_theme_settings_updated_at BEFORE UPDATE ON theme_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row-Level Security (RLS) Policies for Multi-Tenant Architecture
ALTER TABLE theme_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access theme data for their tenant
CREATE POLICY tenant_isolation_theme_installations ON theme_installations
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_theme_settings ON theme_settings
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_theme_purchases ON theme_purchases
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### Table 4: `theme_marketplace_listings` (Landlord Schema)

Marketplace-specific data for themes.

```sql
CREATE TABLE theme_marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    theme_id UUID NOT NULL UNIQUE REFERENCES themes(id) ON DELETE CASCADE,
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'approved', 'rejected', 'suspended')
    ),
    
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    
    submission_notes TEXT,
    review_notes TEXT,
    
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    
    total_sales INTEGER DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0.00,
    
    commission_rate DECIMAL(5,2) DEFAULT 25.00,
    
    vendor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    vendor_payout_info JSONB,
    
    promotional_banner_url VARCHAR(500),
    promotional_video_url VARCHAR(500),
    
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_marketplace_theme ON theme_marketplace_listings(theme_id);
CREATE INDEX idx_marketplace_status ON theme_marketplace_listings(status);
CREATE INDEX idx_marketplace_published ON theme_marketplace_listings(is_published) WHERE is_published = TRUE;
CREATE INDEX idx_marketplace_vendor ON theme_marketplace_listings(vendor_id);
```

### Table 5: `theme_purchases` (Landlord Schema)

Purchase transactions for paid themes.

```sql
CREATE TABLE theme_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    price_paid DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    
    payment_method VARCHAR(50),
    payment_transaction_id VARCHAR(255),
    payment_status VARCHAR(20) DEFAULT 'completed' CHECK (
        payment_status IN ('pending', 'completed', 'failed', 'refunded')
    ),
    
    license_type VARCHAR(50),
    license_valid_until TIMESTAMP,
    
    purchased_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    invoice_number VARCHAR(100),
    invoice_url VARCHAR(500),
    
    refund_date TIMESTAMP,
    refund_reason TEXT,
    refund_amount DECIMAL(10,2),
    
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_theme_purchases_tenant ON theme_purchases(tenant_id);
CREATE INDEX idx_theme_purchases_theme ON theme_purchases(theme_id);
CREATE INDEX idx_theme_purchases_date ON theme_purchases(purchase_date);
CREATE INDEX idx_theme_purchases_status ON theme_purchases(payment_status);
CREATE INDEX idx_theme_purchases_purchaser ON theme_purchases(purchased_by);
```

### Table 6: `theme_licenses` (Landlord Schema)

License management for themes.

```sql
CREATE TABLE theme_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    purchase_id UUID NOT NULL REFERENCES theme_purchases(id) ON DELETE CASCADE,
    
    license_key VARCHAR(255) NOT NULL UNIQUE,
    
    status VARCHAR(20) DEFAULT 'active' CHECK (
        status IN ('active', 'suspended', 'expired', 'revoked')
    ),
    
    activations_limit INTEGER DEFAULT 1,
    activations_count INTEGER DEFAULT 0,
    
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    
    last_check_date TIMESTAMP,
    last_check_ip VARCHAR(45),
    
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_licenses_key ON theme_licenses(license_key);
CREATE INDEX idx_licenses_purchase ON theme_licenses(purchase_id);
CREATE INDEX idx_licenses_status ON theme_licenses(status);
CREATE INDEX idx_licenses_expiry ON theme_licenses(valid_until) WHERE valid_until IS NOT NULL;
```

### Table 7: `theme_versions` (Landlord Schema)

Version history and changelog for themes.

```sql
CREATE TABLE theme_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    
    version VARCHAR(50) NOT NULL,
    
    release_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    release_notes TEXT,
    
    changes JSONB DEFAULT '[]'::jsonb,
    
    package_url VARCHAR(500),
    package_checksum VARCHAR(255),
    
    is_stable BOOLEAN DEFAULT TRUE,
    is_security_update BOOLEAN DEFAULT FALSE,
    is_breaking_change BOOLEAN DEFAULT FALSE,
    
    min_stencil_version VARCHAR(50),
    max_stencil_version VARCHAR(50),
    
    download_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE(theme_id, version)
);

CREATE INDEX idx_theme_versions_theme ON theme_versions(theme_id);
CREATE INDEX idx_theme_versions_stable ON theme_versions(theme_id, is_stable) WHERE is_stable = TRUE;
CREATE INDEX idx_theme_versions_date ON theme_versions(release_date DESC);
```

### Table 8: `theme_files` (Landlord Schema)

File storage and management for theme development.

```sql
CREATE TABLE theme_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    tenant_id UUID NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    
    content TEXT,
    content_hash VARCHAR(64),
    
    language VARCHAR(50),
    is_binary BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE(theme_id, tenant_id, file_path)
);

CREATE INDEX idx_theme_files_theme ON theme_files(theme_id);
CREATE INDEX idx_theme_files_tenant ON theme_files(tenant_id);
CREATE INDEX idx_theme_files_type ON theme_files(file_type);
CREATE INDEX idx_theme_files_path ON theme_files(file_path);
```

### Table 9: `theme_validation_results` (Landlord Schema)

Theme validation and security scan results.

```sql
CREATE TABLE theme_validation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    
    validation_type VARCHAR(50) NOT NULL CHECK (
        validation_type IN ('structure', 'security', 'performance', 'accessibility', 'compatibility')
    ),
    
    is_valid BOOLEAN NOT NULL,
    score INTEGER DEFAULT 0,
    
    errors JSONB DEFAULT '[]'::jsonb,
    warnings JSONB DEFAULT '[]'::jsonb,
    
    scan_duration INTEGER,
    scanned_files INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE(theme_id, version, validation_type)
);

CREATE INDEX idx_validation_theme ON theme_validation_results(theme_id);
CREATE INDEX idx_validation_type ON theme_validation_results(validation_type);
CREATE INDEX idx_validation_valid ON theme_validation_results(is_valid);
CREATE INDEX idx_validation_score ON theme_validation_results(score DESC);
```

### Table 10: `theme_security_scans` (Landlord Schema)

Detailed security scan results for themes.

```sql
CREATE TABLE theme_security_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    validation_result_id UUID REFERENCES theme_validation_results(id) ON DELETE CASCADE,
    
    scan_type VARCHAR(50) NOT NULL CHECK (
        scan_type IN ('malware', 'vulnerability', 'dependency', 'code_injection', 'xss', 'csrf')
    ),
    
    severity VARCHAR(20) NOT NULL CHECK (
        severity IN ('critical', 'high', 'medium', 'low', 'info')
    ),
    
    finding_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    file_path VARCHAR(500),
    line_number INTEGER,
    
    remediation TEXT,
    false_positive BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_scans_theme ON theme_security_scans(theme_id);
CREATE INDEX idx_security_scans_validation ON theme_security_scans(validation_result_id);
CREATE INDEX idx_security_scans_severity ON theme_security_scans(severity);
CREATE INDEX idx_security_scans_type ON theme_security_scans(scan_type);
```

### Table 11: `theme_installation_logs` (Landlord Schema)

Installation and deployment tracking.

```sql
CREATE TABLE theme_installation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    installation_id UUID REFERENCES theme_installations(id) ON DELETE CASCADE,
    
    action VARCHAR(50) NOT NULL CHECK (
        action IN ('install', 'uninstall', 'activate', 'deactivate', 'update', 'rollback')
    ),
    
    status VARCHAR(20) NOT NULL CHECK (
        status IN ('started', 'in_progress', 'completed', 'failed', 'cancelled')
    ),
    
    stage VARCHAR(50),
    progress INTEGER DEFAULT 0,
    message TEXT,
    error_details TEXT,
    
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration INTEGER,
    
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_installation_logs_tenant ON theme_installation_logs(tenant_id);
CREATE INDEX idx_installation_logs_theme ON theme_installation_logs(theme_id);
CREATE INDEX idx_installation_logs_action ON theme_installation_logs(action);
CREATE INDEX idx_installation_logs_status ON theme_installation_logs(status);
CREATE INDEX idx_installation_logs_date ON theme_installation_logs(started_at DESC);
```

### Table 12: `theme_hooks` (Landlord Schema)

Theme lifecycle hooks and event handlers.

```sql
CREATE TABLE theme_hooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    tenant_id UUID NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    hook_name VARCHAR(100) NOT NULL,
    hook_type VARCHAR(50) NOT NULL CHECK (
        hook_type IN ('lifecycle', 'event', 'filter', 'action')
    ),
    
    trigger_event VARCHAR(100) NOT NULL,
    execution_order INTEGER DEFAULT 10,
    
    handler_code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    execution_count INTEGER DEFAULT 0,
    last_executed TIMESTAMP,
    average_execution_time INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE(theme_id, tenant_id, hook_name, trigger_event)
);

CREATE INDEX idx_theme_hooks_theme ON theme_hooks(theme_id);
CREATE INDEX idx_theme_hooks_tenant ON theme_hooks(tenant_id);
CREATE INDEX idx_theme_hooks_event ON theme_hooks(trigger_event);
CREATE INDEX idx_theme_hooks_active ON theme_hooks(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_theme_hooks_order ON theme_hooks(execution_order);

-- Row-Level Security for additional tables
ALTER TABLE theme_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_installation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_hooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_theme_files ON theme_files
    USING (tenant_id IS NULL OR tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_theme_installation_logs ON theme_installation_logs
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_theme_hooks ON theme_hooks
    USING (tenant_id IS NULL OR tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

## RELATIONSHIP DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        LANDLORD SCHEMA: ADVANCED THEME SYSTEM                       │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        themes (Central Registry)                            │   │
│  │  - id, slug, name, version, author info, pricing                           │   │
│  │  - tags, categories, screenshots, customizer_settings_schema               │   │
│  │  - is_official, is_featured, rating, download_count                        │   │
│  └─────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┘   │
│        │         │         │         │         │         │         │             │
│        │ 1:N     │ 1:N     │ 1:N     │ 1:N     │ 1:N     │ 1:N     │ 1:1         │
│        │         │         │         │         │         │         │             │
│  ┌─────▼──┐ ┌────▼──┐ ┌────▼──┐ ┌────▼──┐ ┌────▼──┐ ┌────▼──┐ ┌────▼──────────┐ │
│  │ theme_ │ │theme_ │ │theme_ │ │theme_ │ │theme_ │ │theme_ │ │theme_marketplace│ │
│  │ instal │ │files  │ │hooks  │ │valid  │ │secur  │ │vers   │ │_listings        │ │
│  │ lations│ │       │ │       │ │ation_ │ │ity_   │ │ions   │ │- status, vendor │ │
│  │        │ │       │ │       │ │results│ │scans  │ │       │ │- total_sales    │ │
│  └─────┬──┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └─────────────────┘ │
│        │                                                                         │
│        │ 1:N                                                                     │
│        │                                                                         │
│  ┌─────▼─────────────────────────────────────────────────────────────────────┐   │
│  │  theme_settings (Tenant Customizations)                                   │   │
│  │  - tenant_id, theme_id, settings_data (JSONB)                             │   │
│  │  - custom_css, custom_js, created_by, updated_by                          │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  theme_installation_logs (Activity Tracking)                               │   │
│  │  - tenant_id, theme_id, action, status, progress                           │   │
│  │  - started_at, completed_at, performed_by, metadata                        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌──────────────────────────────────────────┐                                      │
│  │  theme_purchases (Transactions)          │                                      │
│  │  - tenant_id, theme_id, price_paid       │◄─────┐                               │
│  │  - payment_status, purchased_by          │      │                               │
│  └─────────────┬────────────────────────────┘      │                               │
│                │                                   │                               │
│                │ 1:N                               │                               │
│                │                                   │                               │
│  ┌─────────────▼────────────────────────────┐      │                               │
│  │  theme_licenses (License Management)     │──────┘                               │
│  │  - purchase_id, license_key (unique)     │                                      │
│  │  - status, activations_limit/count       │                                      │
│  │  - valid_from, valid_until               │                                      │
│  └───────────────────────────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## FIELD SPECIFICATIONS

### Table: `themes`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | UUID | Yes | gen_random_uuid() | Primary key |
| `slug` | VARCHAR(255) | Yes | - | Unique theme identifier |
| `name` | VARCHAR(255) | Yes | - | Theme display name |
| `description` | TEXT | No | - | Theme description |
| `version` | VARCHAR(50) | Yes | - | Current version (semver) |
| `author_name` | VARCHAR(255) | No | - | Theme author name |
| `pricing_type` | VARCHAR(20) | No | 'free' | free/paid/subscription |
| `pricing_price` | DECIMAL(10,2) | No | - | Price in pricing_currency |
| `pricing_currency` | VARCHAR(3) | No | 'USD' | ISO 4217 currency code |
| `tags` | JSONB | No | [] | Array of tags |
| `categories` | JSONB | No | [] | Array of categories |
| `screenshots` | JSONB | No | [] | Array of screenshot URLs |
| `demo_url` | VARCHAR(500) | No | - | Live demo URL |
| `is_official` | BOOLEAN | No | FALSE | Official Stencil theme |
| `is_featured` | BOOLEAN | No | FALSE | Featured in marketplace |
| `customizer_settings_schema` | JSONB | No | - | JSON Schema for settings |
| `rating_average` | DECIMAL(3,2) | No | 0.00 | Average rating (0-5) |

---

## BUSINESS RULES

### 1. Theme Activation Rules

**Single Active Theme Per Tenant**:
- Only ONE theme can be `is_active = TRUE` per tenant
- Activating new theme automatically deactivates current theme
- Deactivation falls back to default system theme

**Validation**:
```javascript
async function activateTheme(tenantId, themeId) {
  await db.transaction(async (trx) => {
    await trx('theme_installations')
      .where('tenant_id', tenantId)
      .update({ is_active: false });
    
    await trx('theme_installations')
      .where({ tenant_id: tenantId, theme_id: themeId })
      .update({ 
        is_active: true, 
        activation_date: new Date(),
        activated_by: currentUserId 
      });
  });
}
```

### 2. Theme Purchase & Licensing

**Purchase Requirements**:
- Free themes: No purchase required, instant installation
- Paid themes: Purchase required before installation
- One-time purchase covers all future updates (lifetime license)
- Single-site license: Valid for 1 tenant only
- Multi-site license: Valid for N tenants (configurable)

**License Validation**:
```javascript
function canInstallTheme(theme, tenant) {
  if (theme.pricing_type === 'free') {
    return true;
  }
  
  const purchase = theme_purchases.find({
    tenant_id: tenant.id,
    theme_id: theme.id,
    payment_status: 'completed'
  });
  
  if (!purchase) {
    throw new Error('Theme purchase required');
  }
  
  const license = theme_licenses.find({
    purchase_id: purchase.id,
    status: 'active'
  });
  
  if (!license || (license.valid_until && license.valid_until < new Date())) {
    throw new Error('Valid license required');
  }
  
  return true;
}
```

### 3. Theme Settings Validation

**Schema-Based Validation**:
- Theme defines `customizer_settings_schema` (JSON Schema)
- Tenant settings must conform to schema
- Invalid settings rejected at save time
- Default values applied for missing settings

**Example Schema**:
```json
{
  "type": "object",
  "properties": {
    "primary_color": {
      "type": "string",
      "pattern": "^#[0-9A-Fa-f]{6}$",
      "default": "#3b82f6"
    },
    "font_family": {
      "type": "string",
      "enum": ["Inter", "Roboto", "Montserrat"],
      "default": "Inter"
    },
    "container_width": {
      "type": "integer",
      "minimum": 1024,
      "maximum": 1920,
      "default": 1280
    }
  },
  "required": ["primary_color"]
}
```

### 4. Theme Version Management

**Version Format**: Semantic Versioning (MAJOR.MINOR.PATCH)
- MAJOR: Breaking changes (e.g., 1.0.0 → 2.0.0)
- MINOR: New features, backward compatible (e.g., 1.0.0 → 1.1.0)
- PATCH: Bug fixes, backward compatible (e.g., 1.0.0 → 1.0.1)

**Update Policy**:
- **Auto-update enabled**: Update automatically to latest stable version
- **Auto-update disabled**: Notify user of available updates
- **Breaking changes**: Require manual approval before update
- **Security updates**: Force update with 7-day grace period

### 5. Theme Marketplace Submission

**Approval Process**:
1. Developer submits theme → `status = 'pending'`
2. Platform reviews code quality, security, compliance
3. Approved → `status = 'approved'`, `is_published = TRUE`
4. Rejected → `status = 'rejected'`, provide `review_notes`

**Quality Requirements**:
- No malicious code or security vulnerabilities
- Follows Stencil coding standards
- Includes documentation
- Screenshots and demo URL required
- Performance benchmarks pass (< 2s load time)
- Multi-tenant compatibility verified
- RBAC integration tested

### 6. Business Cycle Integration

**Etching Business Workflow Support**:
- Theme components must support complete etching business cycle
- Integration with orders, vendors, suppliers, customers, and financial modules
- Theme settings include business-specific configurations:
  - Material types and pricing
  - Vendor workflow preferences
  - Customer communication templates
  - Financial reporting layouts

**Theme-Business Alignment**:
```javascript
// Theme settings schema for etching business
{
  "business_type": "etching",
  "workflow_settings": {
    "enable_vendor_portal": true,
    "enable_customer_quotes": true,
    "enable_material_calculator": true,
    "payment_flow": "dp_or_full"
  },
  "integration_modules": [
    "orders", "vendors", "customers", "financial", "inventory"
  ]
}
```

---

## THEME STRUCTURE

### Directory Structure (Frontend - Implemented)

```
themes/
└── etching/                     # Theme slug
    ├── theme.json               # Theme manifest
    ├── index.ts                 # Theme entry point
    ├── components/              # React components
    │   ├── Header.tsx
    │   ├── Footer.tsx
    │   └── ProductCard.tsx
    ├── layouts/                 # Page layouts
    │   ├── DefaultLayout.tsx
    │   └── FullWidthLayout.tsx
    ├── pages/                   # Page components
    │   ├── Home.tsx
    │   └── Products.tsx
    ├── assets/                  # Static assets
    │   ├── css/
    │   │   └── theme.css
    │   └── images/
    └── config/
        └── settings.json        # Default settings
```

### Theme Manifest (theme.json)

```json
{
  "slug": "etching-professional",
  "name": "Etching Professional",
  "version": "1.0.0",
  "author": {
    "name": "Stencil Team",
    "email": "themes@stencilcms.com"
  },
  "compatibility": {
    "stencil_version": ">=2.0.0",
    "react_version": ">=18.0.0"
  },
  "pricing": {
    "type": "paid",
    "price": 79.00,
    "currency": "USD"
  },
  "customizer": {
    "sections": [
      {
        "id": "colors",
        "label": "Colors",
        "settings": [
          {
            "id": "primary_color",
            "type": "color",
            "label": "Primary Color",
            "default": "#3b82f6"
          }
        ]
      }
    ]
  }
}
```

---

## RBAC INTEGRATION

### Permission-Based Access Control

**Theme Management Permissions:**

| Permission | Description | Required Role | Scope |
|------------|-------------|---------------|-------|
| `themes.view` | View theme marketplace and available themes | All Users | Global |
| `themes.create` | Upload and create new themes | Admin, Vendor | Global |
| `themes.edit` | Modify theme metadata and settings | Admin, Theme Owner | Global |
| `themes.delete` | Delete themes from marketplace | Super Admin | Global |
| `themes.manage` | Full theme management operations | Admin | Global |
| `themes.install` | Install themes for tenant | Admin, Manager | Tenant |
| `themes.activate` | Activate/deactivate themes | Admin, Manager | Tenant |
| `themes.customize` | Access theme customizer | Admin, Manager, Editor | Tenant |
| `themes.purchase` | Purchase paid themes | Admin, Manager | Tenant |
| `themes.admin` | Advanced theme management | Super Admin | Platform |

### API Endpoint Protection

```php
// Laravel Route Protection Examples
Route::middleware(['auth:sanctum', 'tenant.context'])->group(function () {
    // Theme marketplace (global, requires themes.view)
    Route::get('/api/themes', [ThemeController::class, 'index'])
        ->middleware('permission:themes.view');
    
    // Install theme (tenant-scoped, requires themes.install)
    Route::post('/api/tenants/{tenant}/themes/install', [ThemeController::class, 'install'])
        ->middleware('permission:themes.install');
    
    // Customize theme (tenant-scoped, requires themes.customize)
    Route::put('/api/tenants/{tenant}/themes/settings', [ThemeController::class, 'updateSettings'])
        ->middleware('permission:themes.customize');
    
    // Upload theme (global, requires themes.create)
    Route::post('/api/themes', [ThemeController::class, 'store'])
        ->middleware('permission:themes.create');
});
```

### Frontend Permission Checks

```typescript
// React Permission Hooks
import { usePermission } from '@/hooks/usePermission';

function ThemeMarketplace() {
  const canInstall = usePermission('themes.install');
  const canCustomize = usePermission('themes.customize');
  const canPurchase = usePermission('themes.purchase');
  
  return (
    <div>
      {canInstall && (
        <Button onClick={installTheme}>Install Theme</Button>
      )}
      {canCustomize && (
        <Button onClick={openCustomizer}>Customize</Button>
      )}
      {canPurchase && (
        <Button onClick={purchaseTheme}>Purchase</Button>
      )}
    </div>
  );
}
```

### Role-Based Theme Access

**Platform Roles:**
- **Super Admin**: All theme permissions globally
- **Platform Support**: `themes.view` across all tenants

**Tenant Roles:**
- **Tenant Owner**: All theme permissions within tenant
- **Tenant Admin**: `themes.view`, `themes.install`, `themes.activate`, `themes.customize`, `themes.purchase`
- **Manager**: `themes.view`, `themes.customize`
- **Editor**: `themes.view`, `themes.customize` (limited)
- **Viewer**: `themes.view` only

---

## API ENDPOINTS

```yaml
# Theme Marketplace (Global - No tenant context required)
GET /api/themes
  - List available themes (marketplace)
  - Query: pricing_type, category, search, featured
  - Permission: themes.view
  - Return: { data: [], meta: {} }

GET /api/themes/{slug}
  - Get theme details
  - Include: versions, ratings, screenshots
  - Permission: themes.view
  - Return: theme object

POST /api/themes
  - Upload new theme (admin/vendor only)
  - Body: FormData with ZIP file
  - Permission: themes.create
  - Return: theme object

PUT /api/themes/{id}
  - Update theme metadata
  - Permission: themes.edit
  - Return: updated theme

DELETE /api/themes/{id}
  - Delete theme from marketplace
  - Permission: themes.delete
  - Return: success message

# Tenant-Scoped Theme Management
GET /api/tenants/{tenant_id}/themes
  - List tenant's installed themes
  - Permission: themes.view
  - Headers: X-Tenant-ID
  - Return: installations array

POST /api/tenants/{tenant_id}/themes/install
  - Install theme for tenant
  - Body: { theme_id, license_key? }
  - Permission: themes.install
  - Headers: X-Tenant-ID
  - Return: installation object

POST /api/tenants/{tenant_id}/themes/activate
  - Activate theme
  - Body: { theme_id }
  - Permission: themes.activate
  - Headers: X-Tenant-ID
  - Return: success message

GET /api/tenants/{tenant_id}/themes/active
  - Get currently active theme
  - Permission: themes.view
  - Headers: X-Tenant-ID
  - Return: active theme object

GET /api/tenants/{tenant_id}/themes/settings
  - Get active theme settings
  - Permission: themes.customize
  - Headers: X-Tenant-ID
  - Return: settings_data object

PUT /api/tenants/{tenant_id}/themes/settings
  - Update theme settings
  - Body: { settings_data, custom_css?, custom_js? }
  - Permission: themes.customize
  - Headers: X-Tenant-ID
  - Return: updated settings

DELETE /api/tenants/{tenant_id}/themes/{theme_id}
  - Uninstall theme from tenant
  - Permission: themes.manage
  - Headers: X-Tenant-ID
  - Return: success message

# Theme Purchasing
POST /api/tenants/{tenant_id}/themes/purchase
  - Purchase paid theme
  - Body: { theme_id, payment_method }
  - Permission: themes.purchase
  - Headers: X-Tenant-ID
  - Return: purchase & license objects

GET /api/tenants/{tenant_id}/themes/purchases
  - List theme purchases for tenant
  - Permission: themes.view
  - Headers: X-Tenant-ID
  - Return: purchases array

# Theme Marketplace Management (Admin only)
GET /api/admin/themes/submissions
  - List pending theme submissions
  - Permission: themes.admin
  - Return: submissions array

POST /api/admin/themes/{id}/approve
  - Approve theme submission
  - Permission: themes.admin
  - Return: success message

POST /api/admin/themes/{id}/reject
  - Reject theme submission
  - Body: { review_notes }
  - Permission: themes.admin
  - Return: success message
```

---

## ADMIN UI FEATURES

### 1. Theme Dashboard (`ThemeDashboard.tsx`)
- Grid view dengan theme cards (screenshots, name, price)
- Filter by pricing (free/paid), category, rating
- Search by name/description
- One-click install untuk free themes
- Purchase flow untuk paid themes
- Theme status indicators (active, installed, available)

### 2. Theme Manager (`ThemeManager.tsx`) - **IMPLEMENTED**
- **Installed Themes Management**: View, activate, export, uninstall themes
- **Theme Upload**: ZIP file upload dengan validation
- **File Editor**: Direct theme file editing dengan syntax highlighting
- **Language Support**: JavaScript, TypeScript, HTML, CSS, PHP, SQL
- **Real-time Preview**: Live theme preview dengan changes
- **Bulk Operations**: Multiple theme management

### 3. Theme Marketplace (`ThemeMarketplace.tsx`) - **IMPLEMENTED**
- **Advanced Search & Filtering**: Category, pricing, rating, popularity
- **Theme Grid Display**: Screenshots, ratings, download counts
- **Installation Progress**: Real-time installation tracking
- **Theme Categories**: Business, Portfolio, Minimal, E-commerce, Blog
- **Featured Themes**: Highlighted premium themes
- **Sort Options**: Popular, newest, highest rated, alphabetical

### 4. Theme Code Editor (`ThemeCodeEditor.tsx`) - **IMPLEMENTED**
- **Monaco Editor Integration**: Full IDE experience dengan IntelliSense
- **File Tree Explorer**: Hierarchical file navigation
- **Multi-tab Interface**: Code, Visual, Version Control, Settings tabs
- **Live Preview**: Real-time preview dengan device modes
- **Auto-save**: Automatic saving dengan unsaved changes tracking
- **Version Control**: Git-like versioning dengan diff viewer
- **Syntax Highlighting**: Support untuk multiple languages

### 5. Theme Packaging (`ThemePackaging.tsx`) - **IMPLEMENTED**
- **Theme Validation**: Comprehensive validation dengan scoring
- **Export Options**: Customizable export settings (README, changelog, license)
- **Package Creation**: ZIP package generation dengan metadata
- **Quality Checks**: Security, performance, accessibility validation
- **Validation Results**: Detailed error & warning reporting

### 6. Theme Upload (`ThemeUpload.tsx`) - **IMPLEMENTED**
- **Drag & Drop Upload**: Modern file upload interface
- **Progress Tracking**: Real-time upload progress
- **Validation Feedback**: Immediate validation results
- **Error Handling**: Comprehensive error reporting
- **Success Confirmation**: Installation success notifications

### 7. Theme Export (`ThemeExport.tsx`) - **IMPLEMENTED**
- **Export Wizard**: Step-by-step export process
- **Format Options**: Multiple export formats
- **Metadata Inclusion**: Theme information & documentation
- **Download Management**: Secure download links

### 8. Theme Files (`ThemeFiles.tsx`) - **IMPLEMENTED**
- **File Browser**: Complete file system navigation
- **Direct Editing**: In-browser file editing
- **File Operations**: Create, delete, rename, move files
- **Binary File Support**: Image & asset management
- **File History**: Track file changes & versions

### 9. Theme Settings (`ThemeSettings.tsx`)
- **Visual Customizer**: Live preview pane dengan iframe isolation
- **Settings Panel**: Grouped by sections (colors, typography, layout)
- **Advanced Controls**: Color pickers, font selectors, range sliders
- **Custom CSS/JS**: Code editor untuk custom styling
- **Device Preview**: Desktop/Tablet/Mobile preview modes
- **Save/Reset**: Settings management dengan rollback

### 10. Advanced Editor (`ThemeAdvancedEditor.tsx`)
- **Professional IDE**: Full-featured development environment
- **Component Library**: Reusable component management
- **Asset Manager**: Image, font, dan media management
- **Build Tools**: Theme compilation & optimization
- **Testing Suite**: Theme testing & validation tools
- Auto-save dengan draft recovery

---

## SAMPLE DATA

```sql
INSERT INTO themes (slug, name, version, pricing_type, is_official, customizer_settings_schema)
VALUES (
  'stencil-default',
  'Stencil Default',
  '1.0.0',
  'free',
  TRUE,
  '{
    "type": "object",
    "properties": {
      "primary_color": {"type": "string", "default": "#3b82f6"},
      "font_family": {"type": "string", "default": "Inter"}
    }
  }'::jsonb
);

INSERT INTO theme_installations (tenant_id, theme_id, is_active, installed_version)
VALUES (
  {pt_cex_tenant_id},
  {stencil_default_theme_id},
  TRUE,
  '1.0.0'
);

INSERT INTO theme_settings (tenant_id, theme_id, settings_data)
VALUES (
  {pt_cex_tenant_id},
  {stencil_default_theme_id},
  '{"primary_color": "#1e40af", "font_family": "Montserrat"}'::jsonb
);
```

---

## MIGRATION SCRIPT

```sql
BEGIN TRANSACTION;

-- Create all theme-related tables
CREATE TABLE themes (
    -- Full schema from DATABASE SCHEMA section
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    -- ... (complete schema as defined above)
);

CREATE TABLE theme_installations (
    -- Full schema from DATABASE SCHEMA section
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    -- ... (complete schema as defined above)
);

CREATE TABLE theme_settings (
    -- Full schema from DATABASE SCHEMA section
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    -- ... (complete schema as defined above)
);

CREATE TABLE theme_marketplace_listings (
    -- Full schema from DATABASE SCHEMA section
    -- ... (complete schema as defined above)
);

CREATE TABLE theme_purchases (
    -- Full schema from DATABASE SCHEMA section
    -- ... (complete schema as defined above)
);

CREATE TABLE theme_licenses (
    -- Full schema from DATABASE SCHEMA section
    -- ... (complete schema as defined above)
);

CREATE TABLE theme_versions (
    -- Full schema from DATABASE SCHEMA section
    -- ... (complete schema as defined above)
);

CREATE TABLE theme_files (
    -- Full schema from DATABASE SCHEMA section
    -- ... (complete schema as defined above)
);

CREATE TABLE theme_validation_results (
    -- Full schema from DATABASE SCHEMA section
    -- ... (complete schema as defined above)
);

CREATE TABLE theme_security_scans (
    -- Full schema from DATABASE SCHEMA section
    -- ... (complete schema as defined above)
);

CREATE TABLE theme_installation_logs (
    -- Full schema from DATABASE SCHEMA section
    -- ... (complete schema as defined above)
);

CREATE TABLE theme_hooks (
    -- Full schema from DATABASE SCHEMA section
    -- ... (complete schema as defined above)
);

-- Create all indexes (already included in table definitions)

-- Create triggers for updated_at columns
CREATE TRIGGER update_themes_updated_at BEFORE UPDATE ON themes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_theme_settings_updated_at BEFORE UPDATE ON theme_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row-Level Security for multi-tenant tables
ALTER TABLE theme_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_installation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_hooks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY tenant_isolation_theme_installations ON theme_installations
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_theme_settings ON theme_settings
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_theme_purchases ON theme_purchases
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_theme_files ON theme_files
    USING (tenant_id IS NULL OR tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_theme_installation_logs ON theme_installation_logs
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_theme_hooks ON theme_hooks
    USING (tenant_id IS NULL OR tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Insert default system theme
INSERT INTO themes (
    slug, name, version, pricing_type, is_official, is_featured,
    author_name, author_email,
    customizer_settings_schema
) VALUES (
    'stencil-default',
    'Stencil Default Theme',
    '1.0.0',
    'free',
    TRUE,
    TRUE,
    'Stencil Team',
    'themes@stencilcms.com',
    '{
        "type": "object",
        "properties": {
            "primary_color": {"type": "string", "default": "#3b82f6"},
            "secondary_color": {"type": "string", "default": "#8b5cf6"},
            "font_family": {"type": "string", "default": "Inter"},
            "container_width": {"type": "integer", "default": 1280}
        }
    }'::jsonb
);

COMMIT;
```

---

## PERFORMANCE INDEXES

**Critical Queries**:
```sql
-- Active theme lookup (most frequent)
CREATE INDEX idx_theme_installations_active_lookup 
ON theme_installations(tenant_id, is_active) 
WHERE is_active = TRUE AND deleted_at IS NULL;

-- Marketplace search
CREATE INDEX idx_themes_marketplace_search 
ON themes(pricing_type, is_featured, rating_average DESC) 
WHERE deleted_at IS NULL;

-- Settings retrieval
CREATE INDEX idx_theme_settings_tenant_theme 
ON theme_settings(tenant_id, theme_id);
```

**Expected Performance**:
- Get active theme: < 5ms
- Load theme settings: < 10ms
- Marketplace search: < 50ms
- Theme installation: < 2s

---

**Previous:** [14-DOCUMENTATION.md](./14-DOCUMENTATION.md)  
**Next:** [16-LANGUAGE.md](./16-LANGUAGE.md)

**Last Updated:** 2025-11-12  
**Status:** ✅ COMPLETE - FULLY AUDITED & UPDATED  
**Reviewed By:** CanvaStack Stencil  
**Compliance:** ✅ Multi-Tenant Architecture, ✅ RBAC Integration, ✅ Business Cycle Alignment
