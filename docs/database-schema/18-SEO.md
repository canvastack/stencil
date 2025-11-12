# UNIVERSAL SEO MANAGEMENT ENGINE
## Enterprise-Grade SEO System with Multi-Tenant Architecture

**Module:** Cross-Module - SEO Management Engine  
**Total Fields:** 150+  
**Total Tables:** 8  
**Admin Pages:** All admin pages + dedicated SEO Settings + SEO Analytics Dashboard  
**Version:** 2.0 - Enterprise Edition  
**Last Updated:** November 12, 2025  
**Status:** 🚧 **Architecture Blueprint** (Backend API + Frontend Integration Planned)

---

## OVERVIEW

**Enterprise-grade SEO Management Engine** dengan **multi-tenant architecture** dan **advanced analytics**. System ini dirancang untuk mendukung 10,000+ tenants dengan complete SEO automation, AI-powered optimization, dan comprehensive performance tracking.

### **Business Value**

**Revenue Impact:**
- 💰 **SEO-driven Traffic**: 40-60% increase dalam organic traffic
- 💰 **Conversion Optimization**: Better meta descriptions = higher CTR
- 💰 **Multi-tenant Efficiency**: Single SEO system untuk semua tenants
- 💰 **Enterprise Features**: Advanced analytics untuk data-driven decisions

**Operational Benefits:**
- ⚡ **Automated SEO**: AI-powered meta generation dan optimization
- ⚡ **Bulk Operations**: Mass SEO updates across multiple pages/products
- ⚡ **Performance Monitoring**: Real-time SEO performance tracking
- ⚡ **Compliance**: Structured data untuk better search visibility

### **Architecture Approach**

**Multi-Layer SEO System:**
1. **Tenant-Scoped Default SEO** - Per-tenant fallback settings
2. **Polymorphic SEO Meta** - Individual page/item SEO dengan tenant isolation
3. **SEO Analytics Engine** - Performance tracking dan insights
4. **AI-Powered Optimization** - Smart suggestions dan auto-generation
5. **Bulk Management System** - Mass operations untuk enterprise efficiency

### **Fallback Hierarchy (Tenant-Aware)**

```
Individual SEO (page/product/etc) within tenant
    ↓ (if empty)
Tenant Default SEO Settings
    ↓ (if empty)
System Default Values
```

**Multi-Tenant Example:**
- **Tenant A - Product X** → Custom SEO → Use Product X SEO
- **Tenant A - Product Y** → No custom SEO → Use Tenant A default SEO
- **Tenant B - Product Z** → No custom SEO → Use Tenant B default SEO (isolated)
- **New Tenant** → No configuration → Use system defaults

---

## DATABASE SCHEMA

### **Multi-Tenant Architecture Integration**

All SEO tables implement **tenant isolation** via `tenant_id` dengan **PostgreSQL Row-Level Security (RLS)** policies untuk complete data isolation dan security.

```sql
-- Enable RLS on all SEO tables
ALTER TABLE seo_default_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_analytics ENABLE ROW LEVEL SECURITY;
-- ... (all other SEO tables)

-- RLS Policy Example
CREATE POLICY tenant_isolation_seo ON seo_default_settings
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### **1. Tenant-Scoped Default SEO Settings**

**Enhanced dengan multi-tenant support dan enterprise features.**

```sql
CREATE TABLE seo_default_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Basic site information
    site_name VARCHAR(255) NOT NULL DEFAULT 'Stencil CMS',
    site_tagline VARCHAR(500) NULL,
    site_description TEXT NULL,
    
    -- Default meta templates
    default_meta_title VARCHAR(255) NULL,
    default_meta_description TEXT NULL,
    default_meta_keywords TEXT NULL,
    
    -- Open Graph defaults
    og_type VARCHAR(50) DEFAULT 'website',
    og_site_name VARCHAR(255) NULL,
    og_default_image_url VARCHAR(500) NULL,
    og_locale VARCHAR(10) DEFAULT 'id_ID',
    
    -- Twitter Card defaults
    twitter_card_type VARCHAR(50) DEFAULT 'summary_large_image',
    twitter_site VARCHAR(100) NULL,
    twitter_creator VARCHAR(100) NULL,
    
    -- Schema.org defaults
    schema_org_type VARCHAR(50) DEFAULT 'Organization',
    schema_org_data JSONB NULL,
    
    -- SEO behavior
    default_robots VARCHAR(100) DEFAULT 'index, follow',
    allow_search_engines BOOLEAN DEFAULT TRUE,
    canonical_base_url VARCHAR(500) NULL,
    
    -- Search engine verification
    google_site_verification VARCHAR(255) NULL,
    bing_site_verification VARCHAR(255) NULL,
    yandex_verification VARCHAR(255) NULL,
    baidu_verification VARCHAR(255) NULL,
    
    -- Social media profiles
    facebook_page_url VARCHAR(500) NULL,
    instagram_url VARCHAR(500) NULL,
    twitter_url VARCHAR(500) NULL,
    linkedin_url VARCHAR(500) NULL,
    youtube_url VARCHAR(500) NULL,
    tiktok_url VARCHAR(500) NULL,
    
    -- Advanced SEO settings
    enable_auto_meta_generation BOOLEAN DEFAULT TRUE,
    enable_ai_optimization BOOLEAN DEFAULT FALSE,
    enable_structured_data BOOLEAN DEFAULT TRUE,
    enable_breadcrumbs BOOLEAN DEFAULT TRUE,
    
    -- Performance settings
    enable_meta_caching BOOLEAN DEFAULT TRUE,
    cache_duration_minutes INTEGER DEFAULT 60,
    
    -- Analytics integration
    google_analytics_id VARCHAR(50) NULL,
    google_tag_manager_id VARCHAR(50) NULL,
    facebook_pixel_id VARCHAR(50) NULL,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    UNIQUE(tenant_id)
);

-- Indexes for performance
CREATE INDEX idx_seo_default_settings_tenant ON seo_default_settings(tenant_id);
CREATE INDEX idx_seo_default_settings_updated ON seo_default_settings(updated_at);

-- Triggers
CREATE TRIGGER update_seo_default_settings_updated_at BEFORE UPDATE ON seo_default_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE seo_default_settings IS 'Tenant-scoped default SEO settings with enterprise features';
COMMENT ON COLUMN seo_default_settings.tenant_id IS 'Tenant isolation - each tenant has own SEO defaults';
COMMENT ON COLUMN seo_default_settings.default_meta_title IS 'Template: {page} | {site_name} | {tagline}';
COMMENT ON COLUMN seo_default_settings.default_meta_description IS 'Fallback meta description with template variables';
COMMENT ON COLUMN seo_default_settings.enable_auto_meta_generation IS 'Auto-generate meta from content if empty';
COMMENT ON COLUMN seo_default_settings.enable_ai_optimization IS 'Use AI for SEO suggestions and optimization';
COMMENT ON COLUMN seo_default_settings.enable_meta_caching IS 'Cache generated meta tags for performance';
COMMENT ON COLUMN seo_default_settings.cache_duration_minutes IS 'How long to cache meta tags (default 60 min)';

-- Row Level Security
CREATE POLICY tenant_isolation_seo_defaults ON seo_default_settings
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### **2. Enhanced Polymorphic SEO Meta (Multi-Tenant)**

**Upgraded dengan advanced features dan tenant isolation.**

```sql
CREATE TABLE seo_meta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Polymorphic relationship
    seo_metable_type VARCHAR(255) NOT NULL,
    seo_metable_id UUID NOT NULL,
    
    -- Basic meta tags
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    meta_keywords TEXT NULL,
    
    -- Open Graph
    og_title VARCHAR(255) NULL,
    og_description TEXT NULL,
    og_image_url VARCHAR(500) NULL,
    og_type VARCHAR(50) NULL,
    og_locale VARCHAR(10) NULL,
    
    -- Twitter Card
    twitter_title VARCHAR(255) NULL,
    twitter_description TEXT NULL,
    twitter_image_url VARCHAR(500) NULL,
    twitter_card_type VARCHAR(50) NULL,
    
    -- Advanced SEO
    canonical_url VARCHAR(500) NULL,
    robots VARCHAR(100) NULL,
    
    -- Schema.org structured data
    schema_type VARCHAR(50) NULL,
    schema_data JSONB NULL,
    
    -- Custom meta tags
    custom_meta_tags JSONB NULL,
    
    -- SEO scoring and optimization
    seo_score INTEGER DEFAULT 0 CHECK (seo_score >= 0 AND seo_score <= 100),
    seo_issues JSONB DEFAULT '[]',
    last_analyzed_at TIMESTAMP NULL,
    
    -- AI-powered features
    ai_generated_title VARCHAR(255) NULL,
    ai_generated_description TEXT NULL,
    ai_suggestions JSONB DEFAULT '[]',
    ai_last_updated_at TIMESTAMP NULL,
    
    -- Performance tracking
    click_through_rate DECIMAL(5,4) DEFAULT 0.0000,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    average_position DECIMAL(4,2) DEFAULT 0.00,
    
    -- Status and control
    is_enabled BOOLEAN DEFAULT TRUE,
    is_ai_optimized BOOLEAN DEFAULT FALSE,
    optimization_status VARCHAR(50) DEFAULT 'pending' CHECK (optimization_status IN ('pending', 'optimized', 'needs_review', 'manual')),
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    UNIQUE(tenant_id, seo_metable_type, seo_metable_id)
);

-- Indexes for performance
CREATE INDEX idx_seo_meta_tenant ON seo_meta(tenant_id);
CREATE INDEX idx_seo_meta_metable ON seo_meta(seo_metable_type, seo_metable_id);
CREATE INDEX idx_seo_meta_enabled ON seo_meta(is_enabled) WHERE is_enabled = true;
CREATE INDEX idx_seo_meta_score ON seo_meta(seo_score);
CREATE INDEX idx_seo_meta_optimization ON seo_meta(optimization_status);
CREATE INDEX idx_seo_meta_updated ON seo_meta(updated_at);

-- Triggers
CREATE TRIGGER update_seo_meta_updated_at BEFORE UPDATE ON seo_meta
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
CREATE POLICY tenant_isolation_seo_meta ON seo_meta
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Comments
COMMENT ON TABLE seo_meta IS 'Tenant-scoped polymorphic SEO meta with AI optimization';
COMMENT ON COLUMN seo_meta.tenant_id IS 'Tenant isolation for complete data separation';
COMMENT ON COLUMN seo_meta.seo_metable_type IS 'Model type: products, pages, categories, etc.';
COMMENT ON COLUMN seo_meta.seo_score IS 'SEO quality score (0-100) based on best practices';
COMMENT ON COLUMN seo_meta.ai_suggestions IS 'AI-powered optimization suggestions';
COMMENT ON COLUMN seo_meta.click_through_rate IS 'CTR from search results (Google Search Console)';
```

### **3. SEO Analytics & Performance Tracking**

**New table untuk comprehensive SEO performance monitoring.**

```sql
CREATE TABLE seo_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Reference to SEO meta
    seo_meta_id UUID REFERENCES seo_meta(id) ON DELETE CASCADE,
    
    -- URL and page info
    url VARCHAR(1000) NOT NULL,
    page_title VARCHAR(255) NULL,
    page_type VARCHAR(100) NULL,
    
    -- Search Console data
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    click_through_rate DECIMAL(5,4) DEFAULT 0.0000,
    average_position DECIMAL(4,2) DEFAULT 0.00,
    
    -- Keywords performance
    primary_keyword VARCHAR(255) NULL,
    keyword_ranking INTEGER NULL,
    keyword_search_volume INTEGER NULL,
    keyword_difficulty INTEGER NULL,
    
    -- Technical SEO metrics
    page_load_speed_ms INTEGER NULL,
    mobile_friendly_score INTEGER NULL,
    core_web_vitals_score INTEGER NULL,
    
    -- Content analysis
    content_length INTEGER NULL,
    heading_structure JSONB NULL,
    internal_links_count INTEGER DEFAULT 0,
    external_links_count INTEGER DEFAULT 0,
    
    -- Social signals
    social_shares INTEGER DEFAULT 0,
    social_engagement_rate DECIMAL(5,4) DEFAULT 0.0000,
    
    -- Date tracking
    date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(tenant_id, seo_meta_id, date_recorded)
);

-- Indexes
CREATE INDEX idx_seo_analytics_tenant ON seo_analytics(tenant_id);
CREATE INDEX idx_seo_analytics_meta ON seo_analytics(seo_meta_id);
CREATE INDEX idx_seo_analytics_date ON seo_analytics(date_recorded);
CREATE INDEX idx_seo_analytics_url ON seo_analytics(url);
CREATE INDEX idx_seo_analytics_ctr ON seo_analytics(click_through_rate);
CREATE INDEX idx_seo_analytics_position ON seo_analytics(average_position);

-- Row Level Security
CREATE POLICY tenant_isolation_seo_analytics ON seo_analytics
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE seo_analytics IS 'SEO performance tracking and analytics data';
```

### **4. SEO Bulk Operations**

**New table untuk managing bulk SEO operations.**

```sql
CREATE TABLE seo_bulk_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Operation details
    operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN ('bulk_update', 'bulk_generate', 'bulk_analyze', 'bulk_optimize')),
    operation_name VARCHAR(255) NOT NULL,
    operation_description TEXT NULL,
    
    -- Target selection
    target_type VARCHAR(100) NULL, -- 'products', 'pages', 'categories', etc.
    target_filters JSONB NULL, -- Filters for selecting targets
    target_count INTEGER DEFAULT 0,
    
    -- Operation configuration
    operation_config JSONB NULL,
    template_data JSONB NULL,
    
    -- Progress tracking
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    processed_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    -- Results
    results JSONB NULL,
    error_log JSONB NULL,
    
    -- Timing
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    estimated_duration_minutes INTEGER NULL,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    CHECK (completed_at IS NULL OR completed_at >= started_at)
);

-- Indexes
CREATE INDEX idx_seo_bulk_operations_tenant ON seo_bulk_operations(tenant_id);
CREATE INDEX idx_seo_bulk_operations_status ON seo_bulk_operations(status);
CREATE INDEX idx_seo_bulk_operations_type ON seo_bulk_operations(operation_type);
CREATE INDEX idx_seo_bulk_operations_created ON seo_bulk_operations(created_at);

-- Row Level Security
CREATE POLICY tenant_isolation_seo_bulk_operations ON seo_bulk_operations
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE seo_bulk_operations IS 'Bulk SEO operations for enterprise efficiency';
```

### **5. Enhanced SEO Sitemap Management**

**Upgraded sitemap table dengan multi-tenant support.**

```sql
CREATE TABLE seo_sitemap_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- URL information
    url VARCHAR(1000) NOT NULL,
    canonical_url VARCHAR(1000) NULL,
    
    -- Sitemap properties
    priority DECIMAL(2,1) DEFAULT 0.5 CHECK (priority >= 0.0 AND priority <= 1.0),
    changefreq VARCHAR(20) DEFAULT 'weekly' CHECK (changefreq IN ('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never')),
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Content information
    page_type VARCHAR(100) NULL,
    content_type VARCHAR(100) NULL,
    language_code VARCHAR(10) DEFAULT 'id',
    
    -- SEO metadata
    title VARCHAR(255) NULL,
    description TEXT NULL,
    keywords TEXT NULL,
    
    -- Images in page
    images JSONB DEFAULT '[]',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_indexed BOOLEAN DEFAULT FALSE,
    index_status VARCHAR(50) DEFAULT 'pending',
    
    -- Performance
    last_crawled_at TIMESTAMP NULL,
    crawl_errors JSONB DEFAULT '[]',
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(tenant_id, url)
);

-- Indexes
CREATE INDEX idx_seo_sitemap_tenant ON seo_sitemap_entries(tenant_id);
CREATE INDEX idx_seo_sitemap_active ON seo_sitemap_entries(is_active) WHERE is_active = true;
CREATE INDEX idx_seo_sitemap_modified ON seo_sitemap_entries(last_modified);
CREATE INDEX idx_seo_sitemap_priority ON seo_sitemap_entries(priority);
CREATE INDEX idx_seo_sitemap_type ON seo_sitemap_entries(page_type);

-- Triggers
CREATE TRIGGER update_seo_sitemap_entries_updated_at BEFORE UPDATE ON seo_sitemap_entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
CREATE POLICY tenant_isolation_seo_sitemap ON seo_sitemap_entries
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE seo_sitemap_entries IS 'Tenant-scoped sitemap entries with enhanced metadata';
```

### **6. SEO Templates & Automation**

**New table untuk SEO template management.**

```sql
CREATE TABLE seo_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Template identification
    template_name VARCHAR(255) NOT NULL,
    template_description TEXT NULL,
    template_type VARCHAR(100) NOT NULL, -- 'product', 'category', 'page', 'blog_post'
    
    -- Template content
    title_template VARCHAR(500) NOT NULL,
    description_template TEXT NOT NULL,
    keywords_template TEXT NULL,
    
    -- Open Graph templates
    og_title_template VARCHAR(500) NULL,
    og_description_template TEXT NULL,
    
    -- Twitter templates
    twitter_title_template VARCHAR(500) NULL,
    twitter_description_template TEXT NULL,
    
    -- Schema.org template
    schema_template JSONB NULL,
    
    -- Template variables
    available_variables JSONB DEFAULT '[]',
    
    -- Usage rules
    auto_apply BOOLEAN DEFAULT FALSE,
    apply_conditions JSONB NULL,
    priority INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    UNIQUE(tenant_id, template_name)
);

-- Indexes
CREATE INDEX idx_seo_templates_tenant ON seo_templates(tenant_id);
CREATE INDEX idx_seo_templates_type ON seo_templates(template_type);
CREATE INDEX idx_seo_templates_active ON seo_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_seo_templates_auto_apply ON seo_templates(auto_apply) WHERE auto_apply = true;

-- Row Level Security
CREATE POLICY tenant_isolation_seo_templates ON seo_templates
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE seo_templates IS 'SEO templates for automated meta generation';
```

### **7. SEO Audit & Recommendations**

**New table untuk SEO audit results dan recommendations.**

```sql
CREATE TABLE seo_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Audit scope
    audit_name VARCHAR(255) NOT NULL,
    audit_type VARCHAR(50) NOT NULL CHECK (audit_type IN ('full_site', 'page_specific', 'technical', 'content', 'performance')),
    audit_scope JSONB NULL, -- URLs, pages, or filters audited
    
    -- Audit results
    overall_score INTEGER DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
    technical_score INTEGER DEFAULT 0 CHECK (technical_score >= 0 AND technical_score <= 100),
    content_score INTEGER DEFAULT 0 CHECK (content_score >= 0 AND content_score <= 100),
    performance_score INTEGER DEFAULT 0 CHECK (performance_score >= 0 AND performance_score <= 100),
    
    -- Issues found
    critical_issues JSONB DEFAULT '[]',
    warning_issues JSONB DEFAULT '[]',
    info_issues JSONB DEFAULT '[]',
    
    -- Recommendations
    recommendations JSONB DEFAULT '[]',
    priority_actions JSONB DEFAULT '[]',
    
    -- Progress tracking
    total_issues INTEGER DEFAULT 0,
    resolved_issues INTEGER DEFAULT 0,
    
    -- Audit metadata
    audit_status VARCHAR(50) DEFAULT 'completed' CHECK (audit_status IN ('running', 'completed', 'failed')),
    audit_duration_seconds INTEGER NULL,
    pages_audited INTEGER DEFAULT 0,
    
    -- Comparison with previous audit
    previous_audit_id UUID REFERENCES seo_audits(id) ON DELETE SET NULL,
    score_change INTEGER DEFAULT 0,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_seo_audits_tenant ON seo_audits(tenant_id);
CREATE INDEX idx_seo_audits_type ON seo_audits(audit_type);
CREATE INDEX idx_seo_audits_score ON seo_audits(overall_score);
CREATE INDEX idx_seo_audits_created ON seo_audits(created_at);

-- Row Level Security
CREATE POLICY tenant_isolation_seo_audits ON seo_audits
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE seo_audits IS 'SEO audit results and recommendations';
```

### **8. SEO Keywords & Ranking Tracking**

**New table untuk keyword research dan ranking monitoring.**

```sql
CREATE TABLE seo_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Keyword information
    keyword VARCHAR(500) NOT NULL,
    keyword_type VARCHAR(50) DEFAULT 'primary' CHECK (keyword_type IN ('primary', 'secondary', 'long_tail', 'branded')),
    
    -- Search data
    search_volume INTEGER NULL,
    keyword_difficulty INTEGER NULL CHECK (keyword_difficulty >= 0 AND keyword_difficulty <= 100),
    cost_per_click DECIMAL(8,2) NULL,
    competition_level VARCHAR(20) CHECK (competition_level IN ('low', 'medium', 'high')),
    
    -- Ranking data
    current_position INTEGER NULL,
    best_position INTEGER NULL,
    previous_position INTEGER NULL,
    position_change INTEGER DEFAULT 0,
    
    -- Target information
    target_url VARCHAR(1000) NULL,
    target_page_id UUID NULL,
    target_page_type VARCHAR(100) NULL,
    
    -- Performance metrics
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    click_through_rate DECIMAL(5,4) DEFAULT 0.0000,
    
    -- Tracking settings
    is_tracking BOOLEAN DEFAULT TRUE,
    tracking_frequency VARCHAR(20) DEFAULT 'daily' CHECK (tracking_frequency IN ('daily', 'weekly', 'monthly')),
    
    -- Dates
    first_tracked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    UNIQUE(tenant_id, keyword, target_url)
);

-- Indexes
CREATE INDEX idx_seo_keywords_tenant ON seo_keywords(tenant_id);
CREATE INDEX idx_seo_keywords_keyword ON seo_keywords(keyword);
CREATE INDEX idx_seo_keywords_position ON seo_keywords(current_position);
CREATE INDEX idx_seo_keywords_tracking ON seo_keywords(is_tracking) WHERE is_tracking = true;
CREATE INDEX idx_seo_keywords_volume ON seo_keywords(search_volume);

-- Row Level Security
CREATE POLICY tenant_isolation_seo_keywords ON seo_keywords
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

COMMENT ON TABLE seo_keywords IS 'Keyword research and ranking tracking';
```

---

## **RBAC PERMISSION SYSTEM INTEGRATION**

### **SEO Management Permissions**

**Granular permission structure untuk enterprise-grade access control:**

```sql
-- SEO Permission Categories
INSERT INTO permissions (code, name, category, description) VALUES
-- Default SEO Settings
('seo.defaults.view', 'View Default SEO Settings', 'seo', 'View tenant default SEO configuration'),
('seo.defaults.edit', 'Edit Default SEO Settings', 'seo', 'Modify tenant default SEO settings'),

-- Individual SEO Management
('seo.meta.view', 'View SEO Meta', 'seo', 'View individual page/product SEO settings'),
('seo.meta.create', 'Create SEO Meta', 'seo', 'Create custom SEO for pages/products'),
('seo.meta.edit', 'Edit SEO Meta', 'seo', 'Modify existing SEO meta tags'),
('seo.meta.delete', 'Delete SEO Meta', 'seo', 'Remove custom SEO (revert to defaults)'),

-- Bulk Operations
('seo.bulk.create', 'Create Bulk Operations', 'seo', 'Create bulk SEO operations'),
('seo.bulk.execute', 'Execute Bulk Operations', 'seo', 'Run bulk SEO updates/generation'),
('seo.bulk.view', 'View Bulk Operations', 'seo', 'View bulk operation history and status'),

-- Analytics & Reporting
('seo.analytics.view', 'View SEO Analytics', 'seo', 'Access SEO performance data'),
('seo.analytics.export', 'Export SEO Analytics', 'seo', 'Export SEO reports and data'),

-- Advanced Features
('seo.audit.run', 'Run SEO Audits', 'seo', 'Execute SEO audits and analysis'),
('seo.audit.view', 'View SEO Audits', 'seo', 'View audit results and recommendations'),
('seo.keywords.manage', 'Manage Keywords', 'seo', 'Manage keyword tracking and research'),
('seo.templates.manage', 'Manage SEO Templates', 'seo', 'Create and edit SEO templates'),

-- Sitemap Management
('seo.sitemap.view', 'View Sitemap', 'seo', 'View sitemap entries'),
('seo.sitemap.manage', 'Manage Sitemap', 'seo', 'Add/edit/remove sitemap entries'),

-- AI Features
('seo.ai.use', 'Use AI Optimization', 'seo', 'Access AI-powered SEO suggestions'),
('seo.ai.configure', 'Configure AI Settings', 'seo', 'Configure AI optimization settings');
```

### **Role-Based SEO Access**

```sql
-- SEO Editor Role (Content Team)
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'seo_editor' AND p.code IN (
    'seo.meta.view', 'seo.meta.create', 'seo.meta.edit',
    'seo.analytics.view', 'seo.audit.view', 'seo.ai.use'
);

-- SEO Manager Role (Marketing Team)
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'seo_manager' AND p.code LIKE 'seo.%';

-- Tenant Admin (Full SEO Access)
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'tenant_admin' AND p.code LIKE 'seo.%';
```

---

## **ENTERPRISE FEATURES**

### **1. AI-Powered SEO Optimization**

**Smart meta generation dan optimization suggestions:**

```sql
-- AI Configuration per tenant
ALTER TABLE seo_default_settings ADD COLUMN ai_provider VARCHAR(50) DEFAULT 'openai';
ALTER TABLE seo_default_settings ADD COLUMN ai_model VARCHAR(100) DEFAULT 'gpt-4';
ALTER TABLE seo_default_settings ADD COLUMN ai_api_key_encrypted TEXT NULL;
ALTER TABLE seo_default_settings ADD COLUMN ai_optimization_level VARCHAR(20) DEFAULT 'balanced' 
    CHECK (ai_optimization_level IN ('conservative', 'balanced', 'aggressive'));

-- AI Optimization Log
CREATE TABLE seo_ai_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    seo_meta_id UUID NOT NULL REFERENCES seo_meta(id) ON DELETE CASCADE,
    
    optimization_type VARCHAR(50) NOT NULL, -- 'title', 'description', 'keywords', 'full'
    original_content TEXT NULL,
    optimized_content TEXT NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00
    
    ai_provider VARCHAR(50) NOT NULL,
    ai_model VARCHAR(100) NOT NULL,
    prompt_used TEXT NULL,
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected')),
    applied_at TIMESTAMP NULL,
    applied_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_seo_ai_optimizations_tenant ON seo_ai_optimizations(tenant_id);
CREATE INDEX idx_seo_ai_optimizations_meta ON seo_ai_optimizations(seo_meta_id);
CREATE INDEX idx_seo_ai_optimizations_status ON seo_ai_optimizations(status);
```

### **2. Advanced SEO Analytics Dashboard**

**Comprehensive performance tracking dan insights:**

```sql
-- SEO Performance Summary (Materialized View for Performance)
CREATE MATERIALIZED VIEW seo_performance_summary AS
SELECT 
    sa.tenant_id,
    sa.page_type,
    COUNT(*) as total_pages,
    AVG(sa.click_through_rate) as avg_ctr,
    AVG(sa.average_position) as avg_position,
    SUM(sa.impressions) as total_impressions,
    SUM(sa.clicks) as total_clicks,
    AVG(sm.seo_score) as avg_seo_score,
    COUNT(CASE WHEN sm.is_ai_optimized THEN 1 END) as ai_optimized_count
FROM seo_analytics sa
LEFT JOIN seo_meta sm ON sa.seo_meta_id = sm.id
WHERE sa.date_recorded >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY sa.tenant_id, sa.page_type;

-- Refresh materialized view daily
CREATE INDEX idx_seo_performance_summary_tenant ON seo_performance_summary(tenant_id);

-- SEO Alerts & Notifications
CREATE TABLE seo_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    alert_type VARCHAR(50) NOT NULL, -- 'ranking_drop', 'ctr_decline', 'indexing_issue', 'technical_error'
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    affected_urls JSONB DEFAULT '[]',
    
    alert_data JSONB NULL, -- Additional context data
    
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP NULL,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_seo_alerts_tenant ON seo_alerts(tenant_id);
CREATE INDEX idx_seo_alerts_severity ON seo_alerts(severity);
CREATE INDEX idx_seo_alerts_resolved ON seo_alerts(is_resolved);
```

### **3. Multi-Language SEO Support**

**SEO optimization untuk multiple languages:**

```sql
-- Language-specific SEO meta
ALTER TABLE seo_meta ADD COLUMN language_code VARCHAR(10) DEFAULT 'id';
ALTER TABLE seo_meta ADD COLUMN is_default_language BOOLEAN DEFAULT TRUE;
ALTER TABLE seo_meta DROP CONSTRAINT IF EXISTS unique_seo_meta_metable;
ALTER TABLE seo_meta ADD CONSTRAINT unique_seo_meta_metable_lang 
    UNIQUE(tenant_id, seo_metable_type, seo_metable_id, language_code);

-- Hreflang management
CREATE TABLE seo_hreflang (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    source_url VARCHAR(1000) NOT NULL,
    target_url VARCHAR(1000) NOT NULL,
    language_code VARCHAR(10) NOT NULL, -- 'en', 'id', 'en-US', 'id-ID'
    region_code VARCHAR(10) NULL, -- 'US', 'ID', 'GB'
    
    is_default BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, source_url, language_code)
);

CREATE INDEX idx_seo_hreflang_tenant ON seo_hreflang(tenant_id);
CREATE INDEX idx_seo_hreflang_source ON seo_hreflang(source_url);
```

### **4. SEO Performance Caching**

**Multi-level caching untuk optimal performance:**

```sql
-- SEO Cache Management
CREATE TABLE seo_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    cache_key VARCHAR(500) NOT NULL,
    cache_type VARCHAR(50) NOT NULL, -- 'meta_tags', 'sitemap', 'structured_data'
    
    cached_data JSONB NOT NULL,
    
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, cache_key)
);

CREATE INDEX idx_seo_cache_tenant ON seo_cache(tenant_id);
CREATE INDEX idx_seo_cache_key ON seo_cache(cache_key);
CREATE INDEX idx_seo_cache_expires ON seo_cache(expires_at);
CREATE INDEX idx_seo_cache_type ON seo_cache(cache_type);

-- Auto-cleanup expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_seo_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM seo_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run every hour)
SELECT cron.schedule('cleanup-seo-cache', '0 * * * *', 'SELECT cleanup_expired_seo_cache();');
```

---

## **BUSINESS INTEGRATION SCENARIOS**

### **Etching Business Workflow Integration**

**SEO optimization untuk complete customer journey:**

#### **1. Product SEO Automation**
```sql
-- Auto-generate SEO untuk new products
CREATE OR REPLACE FUNCTION auto_generate_product_seo()
RETURNS TRIGGER AS $$
BEGIN
    -- Create SEO meta for new product
    INSERT INTO seo_meta (
        tenant_id, seo_metable_type, seo_metable_id,
        meta_title, meta_description, meta_keywords,
        schema_type, schema_data
    ) VALUES (
        NEW.tenant_id,
        'products',
        NEW.id,
        NEW.name || ' - Custom Etching Services | ' || (SELECT site_name FROM seo_default_settings WHERE tenant_id = NEW.tenant_id),
        'Professional ' || NEW.name || ' etching service. High-quality laser engraving with precision and durability. Custom designs available.',
        NEW.name || ', etching, laser engraving, custom design',
        'Product',
        jsonb_build_object(
            '@context', 'https://schema.org',
            '@type', 'Product',
            'name', NEW.name,
            'description', NEW.description,
            'category', 'Etching Services',
            'brand', jsonb_build_object('@type', 'Brand', 'name', 'Etching Xenial')
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_product_seo
    AFTER INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_product_seo();
```

#### **2. Order-Based SEO Insights**
```sql
-- Track SEO performance impact on orders
CREATE TABLE seo_conversion_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    seo_meta_id UUID REFERENCES seo_meta(id) ON DELETE SET NULL,
    
    referrer_url VARCHAR(1000) NULL,
    search_query VARCHAR(500) NULL,
    landing_page_url VARCHAR(1000) NOT NULL,
    
    conversion_value DECIMAL(12,2) NULL,
    conversion_type VARCHAR(50) DEFAULT 'order', -- 'order', 'inquiry', 'quote_request'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_seo_conversion_tracking_tenant ON seo_conversion_tracking(tenant_id);
CREATE INDEX idx_seo_conversion_tracking_meta ON seo_conversion_tracking(seo_meta_id);
CREATE INDEX idx_seo_conversion_tracking_order ON seo_conversion_tracking(order_id);
```

#### **3. Multi-Language Customer Support**
```sql
-- SEO untuk customer support pages dalam multiple languages
INSERT INTO seo_templates (tenant_id, template_name, template_type, title_template, description_template) VALUES
('{tenant_id}', 'FAQ Page ID', 'faq', 'Pertanyaan Umum - {category} | {site_name}', 'Temukan jawaban untuk pertanyaan umum tentang {category}. Panduan lengkap layanan etching dan custom engraving.'),
('{tenant_id}', 'FAQ Page EN', 'faq', 'Frequently Asked Questions - {category} | {site_name}', 'Find answers to common questions about {category}. Complete guide to etching and custom engraving services.'),
('{tenant_id}', 'Contact Page ID', 'contact', 'Hubungi Kami - Layanan Etching Profesional | {site_name}', 'Hubungi tim ahli kami untuk konsultasi gratis. Layanan etching berkualitas tinggi dengan teknologi terdepan.'),
('{tenant_id}', 'Contact Page EN', 'contact', 'Contact Us - Professional Etching Services | {site_name}', 'Contact our expert team for free consultation. High-quality etching services with cutting-edge technology.');
```

---

## **PERFORMANCE OPTIMIZATION STRATEGY**

### **Database Optimization**

```sql
-- Composite indexes untuk common queries
CREATE INDEX idx_seo_meta_tenant_type_enabled ON seo_meta(tenant_id, seo_metable_type, is_enabled) 
    WHERE is_enabled = true;

CREATE INDEX idx_seo_analytics_tenant_date_type ON seo_analytics(tenant_id, date_recorded, page_type);

CREATE INDEX idx_seo_keywords_tenant_tracking_position ON seo_keywords(tenant_id, is_tracking, current_position) 
    WHERE is_tracking = true;

-- Partial indexes untuk better performance
CREATE INDEX idx_seo_meta_ai_optimized ON seo_meta(tenant_id, is_ai_optimized) 
    WHERE is_ai_optimized = true;

CREATE INDEX idx_seo_bulk_operations_active ON seo_bulk_operations(tenant_id, status) 
    WHERE status IN ('pending', 'running');
```

### **Caching Strategy**

**Multi-level caching untuk optimal performance:**

1. **Database Level**: Materialized views untuk analytics
2. **Application Level**: Redis cache untuk frequently accessed SEO data
3. **CDN Level**: Cache generated meta tags dan sitemaps
4. **Browser Level**: Cache static SEO assets

```sql
-- Materialized view untuk SEO dashboard
CREATE MATERIALIZED VIEW seo_dashboard_stats AS
SELECT 
    tenant_id,
    COUNT(DISTINCT sm.id) as total_seo_pages,
    AVG(sm.seo_score) as avg_seo_score,
    COUNT(CASE WHEN sm.is_ai_optimized THEN 1 END) as ai_optimized_pages,
    COUNT(CASE WHEN sa.click_through_rate > 0.03 THEN 1 END) as high_ctr_pages,
    SUM(sa.impressions) as total_impressions,
    SUM(sa.clicks) as total_clicks
FROM seo_meta sm
LEFT JOIN seo_analytics sa ON sm.id = sa.seo_meta_id 
    AND sa.date_recorded >= CURRENT_DATE - INTERVAL '30 days'
WHERE sm.is_enabled = true
GROUP BY tenant_id;

-- Refresh every 6 hours
SELECT cron.schedule('refresh-seo-dashboard', '0 */6 * * *', 'REFRESH MATERIALIZED VIEW seo_dashboard_stats;');
```

---

## **MIGRATION & DEPLOYMENT STRATEGY**

### **Phase 1: Foundation (Week 1-2)**
1. Create core SEO tables dengan multi-tenant support
2. Implement basic RBAC permissions
3. Setup Row-Level Security policies
4. Create basic API endpoints

### **Phase 2: Core Features (Week 3-4)**
1. Implement SEO meta management
2. Build fallback hierarchy logic
3. Create admin interface integration
4. Setup basic analytics tracking

### **Phase 3: Advanced Features (Week 5-6)**
1. Implement AI-powered optimization
2. Build bulk operations system
3. Create comprehensive analytics dashboard
4. Setup performance monitoring

### **Phase 4: Enterprise Features (Week 7-8)**
1. Implement advanced audit system
2. Build keyword tracking
3. Create template management
4. Setup multi-language support

### **Phase 5: Integration & Testing (Week 9-10)**
1. Integrate dengan etching business workflow
2. Performance optimization
3. Comprehensive testing
4. Documentation completion

---

## **MONITORING & OBSERVABILITY**

### **Key Metrics to Track**

```sql
-- SEO Performance KPIs
CREATE VIEW seo_kpi_dashboard AS
SELECT 
    t.name as tenant_name,
    COUNT(DISTINCT sm.id) as total_seo_pages,
    AVG(sm.seo_score) as avg_seo_score,
    AVG(sa.click_through_rate) as avg_ctr,
    AVG(sa.average_position) as avg_position,
    SUM(sa.impressions) as total_impressions,
    SUM(sa.clicks) as total_clicks,
    COUNT(CASE WHEN sm.is_ai_optimized THEN 1 END) as ai_optimized_count,
    COUNT(DISTINCT sk.id) as tracked_keywords,
    AVG(sk.current_position) as avg_keyword_position
FROM tenants t
LEFT JOIN seo_meta sm ON t.id = sm.tenant_id AND sm.is_enabled = true
LEFT JOIN seo_analytics sa ON sm.id = sa.seo_meta_id 
    AND sa.date_recorded >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN seo_keywords sk ON t.id = sk.tenant_id AND sk.is_tracking = true
GROUP BY t.id, t.name;
```

### **Automated Alerts**

```sql
-- SEO Health Monitoring
CREATE OR REPLACE FUNCTION check_seo_health()
RETURNS void AS $$
DECLARE
    tenant_record RECORD;
    alert_data JSONB;
BEGIN
    -- Check for tenants with low SEO scores
    FOR tenant_record IN 
        SELECT tenant_id, AVG(seo_score) as avg_score
        FROM seo_meta 
        WHERE is_enabled = true 
        GROUP BY tenant_id 
        HAVING AVG(seo_score) < 60
    LOOP
        INSERT INTO seo_alerts (tenant_id, alert_type, severity, title, description)
        VALUES (
            tenant_record.tenant_id,
            'low_seo_score',
            'medium',
            'Low SEO Score Detected',
            'Average SEO score is ' || tenant_record.avg_score || '. Consider running SEO audit and optimization.'
        );
    END LOOP;
    
    -- Check for ranking drops
    INSERT INTO seo_alerts (tenant_id, alert_type, severity, title, description, affected_urls)
    SELECT 
        tenant_id,
        'ranking_drop',
        'high',
        'Significant Ranking Drop',
        'Keywords dropped more than 10 positions',
        jsonb_agg(target_url)
    FROM seo_keywords 
    WHERE position_change < -10 
        AND last_updated_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Run health check daily
SELECT cron.schedule('seo-health-check', '0 9 * * *', 'SELECT check_seo_health();');
```

### 2. Polymorphic SEO Meta (Per Page/Item)

```sql
CREATE TABLE seo_meta (
    id BIGSERIAL PRIMARY KEY,
    seo_metable_type VARCHAR(255) NOT NULL,
    seo_metable_id BIGINT NOT NULL,
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    meta_keywords TEXT NULL,
    og_title VARCHAR(255) NULL,
    og_description TEXT NULL,
    og_image_url VARCHAR(500) NULL,
    og_type VARCHAR(50) NULL,
    twitter_title VARCHAR(255) NULL,
    twitter_description TEXT NULL,
    twitter_image_url VARCHAR(500) NULL,
    twitter_card_type VARCHAR(50) NULL,
    canonical_url VARCHAR(500) NULL,
    robots VARCHAR(100) NULL,
    schema_type VARCHAR(50) NULL,
    schema_data JSONB NULL,
    custom_meta_tags JSONB NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE seo_meta ADD CONSTRAINT unique_seo_meta_metable UNIQUE (seo_metable_type, seo_metable_id);

CREATE INDEX idx_seo_meta_metable_type ON seo_meta(seo_metable_type);
CREATE INDEX idx_seo_meta_is_enabled ON seo_meta(is_enabled);

CREATE TRIGGER update_seo_meta_updated_at BEFORE UPDATE ON seo_meta
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN seo_meta.seo_metable_type IS 'App\Models\Page, App\Models\Product, etc.';
COMMENT ON COLUMN seo_meta.seo_metable_id IS 'ID of the related model';
COMMENT ON COLUMN seo_meta.meta_title IS 'Custom title (max 60 chars recommended)';
COMMENT ON COLUMN seo_meta.meta_description IS 'Custom description (max 160 chars recommended)';
COMMENT ON COLUMN seo_meta.meta_keywords IS 'Comma-separated keywords';
COMMENT ON COLUMN seo_meta.og_title IS 'OG title (can differ from meta_title)';
COMMENT ON COLUMN seo_meta.og_description IS 'OG description';
COMMENT ON COLUMN seo_meta.og_image_url IS 'OG image URL';
COMMENT ON COLUMN seo_meta.og_type IS 'website, article, product';
COMMENT ON COLUMN seo_meta.twitter_card_type IS 'summary, summary_large_image';
COMMENT ON COLUMN seo_meta.canonical_url IS 'Custom canonical URL';
COMMENT ON COLUMN seo_meta.robots IS 'Custom robots directive: index/noindex, follow/nofollow';
COMMENT ON COLUMN seo_meta.schema_type IS 'Article, Product, Event, etc.';
COMMENT ON COLUMN seo_meta.is_enabled IS 'Enable/disable SEO for this item';
```

**Supported Models (seo_metable_type):**
- `App\Models\Page` - Homepage, About, Contact, FAQ, custom pages
- `App\Models\Product` - Individual products
- `App\Models\ProductCategory` - Product categories
- `App\Models\BlogPost` - Blog articles
- `App\Models\FaqCategory` - FAQ categories
- Dan model lainnya yang perlu SEO

**Custom Meta Tags Example (JSON):**
```json
{
  "article:author": "John Doe",
  "article:published_time": "2025-01-01T00:00:00Z",
  "article:section": "Technology",
  "product:price:amount": "100000",
  "product:price:currency": "IDR"
}
```

### 3. SEO Sitemap Table (Optional)

```sql
CREATE TABLE seo_sitemap_entries (
    id BIGSERIAL PRIMARY KEY,
    url VARCHAR(500) NOT NULL UNIQUE,
    priority DECIMAL(2,1) DEFAULT 0.5,
    changefreq VARCHAR(20) DEFAULT 'weekly' CHECK (changefreq IN ('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never')),
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_seo_sitemap_entries_is_active ON seo_sitemap_entries(is_active);
CREATE INDEX idx_seo_sitemap_entries_last_modified ON seo_sitemap_entries(last_modified);

CREATE TRIGGER update_seo_sitemap_entries_last_modified BEFORE UPDATE ON seo_sitemap_entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN seo_sitemap_entries.priority IS '0.0 to 1.0';
```

---

## API ENDPOINTS

### Global/Default SEO Settings

#### Get Default SEO Settings

```http
GET /api/v1/admin/seo/settings
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "siteName": "Stencil CMS",
    "defaultMetaTitle": "{page} | {siteName}",
    "defaultMetaDescription": "Leading provider of laser etching and custom engraving services in Indonesia",
    "defaultMetaKeywords": "laser etching, engraving, custom products, Indonesia",
    "openGraph": {
      "type": "website",
      "siteName": "Stencil CMS",
      "defaultImageUrl": "/images/og-default.jpg",
      "locale": "id_ID"
    },
    "twitter": {
      "cardType": "summary_large_image",
      "site": "@stencilcms",
      "creator": "@stencilcms"
    },
    "schemaOrg": {
      "type": "Organization",
      "data": {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Stencil CMS",
        "url": "https://stencilcms.com",
        "logo": "https://stencilcms.com/images/logo.png",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+62-21-1234567",
          "contactType": "customer service"
        },
        "sameAs": [
          "https://facebook.com/stencilcms",
          "https://instagram.com/stencilcms",
          "https://twitter.com/stencilcms"
        ]
      }
    },
    "robots": {
      "default": "index, follow",
      "allowSearchEngines": true
    },
    "canonicalBaseUrl": "https://stencilcms.com",
    "verification": {
      "googleSiteVerification": "abc123xyz",
      "bingSiteVerification": "def456uvw"
    },
    "socialMedia": {
      "facebook": "https://facebook.com/stencilcms",
      "instagram": "https://instagram.com/stencilcms",
      "twitter": "https://twitter.com/stencilcms",
      "linkedin": "https://linkedin.com/company/stencilcms",
      "youtube": "https://youtube.com/@stencilcms"
    }
  }
}
```

#### Update Default SEO Settings

```http
PUT /api/v1/admin/seo/settings
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "siteName": "Stencil CMS",
  "defaultMetaTitle": "{page} | {siteName}",
  "defaultMetaDescription": "Your trusted partner for laser etching services",
  "defaultMetaKeywords": "laser etching, custom engraving, Indonesia",
  "openGraph": {
    "type": "website",
    "siteName": "Stencil CMS",
    "defaultImageUrl": "/uploads/og-default.jpg",
    "locale": "id_ID"
  },
  "twitter": {
    "cardType": "summary_large_image",
    "site": "@stencilcms",
    "creator": "@stencilcms"
  },
  "schemaOrg": {
    "type": "Organization",
    "data": {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Stencil CMS",
      "url": "https://stencilcms.com"
    }
  },
  "robots": {
    "default": "index, follow",
    "allowSearchEngines": true
  },
  "canonicalBaseUrl": "https://stencilcms.com",
  "verification": {
    "googleSiteVerification": "abc123xyz",
    "bingSiteVerification": "def456uvw"
  },
  "socialMedia": {
    "facebook": "https://facebook.com/stencilcms",
    "instagram": "https://instagram.com/stencilcms"
  }
}
```

---

### Per-Page/Item SEO Management

#### Get SEO for Specific Page/Item

```http
GET /api/v1/admin/seo/{type}/{id}
Authorization: Bearer {token}
```

**Parameters:**
- `type`: Model type (`page`, `product`, `category`, etc.)
- `id`: Model ID

**Example:**
```http
GET /api/v1/admin/seo/page/1
GET /api/v1/admin/seo/product/123
GET /api/v1/admin/seo/category/5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "metableType": "App\\Models\\Page",
    "metableId": 1,
    "isEnabled": true,
    "basicMeta": {
      "title": "Home - Premium Laser Etching Services",
      "description": "Discover our professional laser etching services for acrylic, glass, metal, and wood. Quality guaranteed.",
      "keywords": "laser etching, custom engraving, acrylic etching, glass engraving"
    },
    "openGraph": {
      "title": "Premium Laser Etching Services | Stencil CMS",
      "description": "Professional laser etching and custom engraving services",
      "imageUrl": "/uploads/og-home.jpg",
      "type": "website"
    },
    "twitter": {
      "title": "Premium Laser Etching Services",
      "description": "Professional laser etching and custom engraving",
      "imageUrl": "/uploads/twitter-home.jpg",
      "cardType": "summary_large_image"
    },
    "advanced": {
      "canonicalUrl": "https://stencilcms.com/",
      "robots": "index, follow"
    },
    "schema": {
      "type": "WebPage",
      "data": {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Home",
        "description": "Homepage of Stencil CMS"
      }
    },
    "customMetaTags": {
      "geo.region": "ID-JK",
      "geo.placename": "Jakarta"
    }
  }
}
```

#### Update SEO for Specific Page/Item

```http
PUT /api/v1/admin/seo/{type}/{id}
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "isEnabled": true,
  "basicMeta": {
    "title": "About Us - Stencil CMS History & Team",
    "description": "Learn about our journey, mission, values, and meet our talented team",
    "keywords": "about us, company history, team, mission, vision"
  },
  "openGraph": {
    "title": "About Us | Stencil CMS",
    "description": "Discover our story and meet the team",
    "imageUrl": "/uploads/og-about.jpg",
    "type": "website"
  },
  "twitter": {
    "title": "About Us | Stencil CMS",
    "description": "Our story and team",
    "imageUrl": "/uploads/twitter-about.jpg",
    "cardType": "summary_large_image"
  },
  "advanced": {
    "canonicalUrl": "https://stencilcms.com/about",
    "robots": "index, follow"
  }
}
```

#### Delete SEO for Page/Item (Revert to Default)

```http
DELETE /api/v1/admin/seo/{type}/{id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "SEO settings deleted. Page will now use default SEO settings."
}
```

---

### Public Endpoints (Frontend)

#### Get Complete SEO for Public Page

```http
GET /api/v1/seo?url=/about
GET /api/v1/seo?type=product&id=123
```

**Query Parameters:**
- `url`: Page URL (for URL-based lookup)
- OR `type` + `id`: For model-based lookup

**Response:**
```json
{
  "success": true,
  "data": {
    "meta": {
      "title": "About Us - Stencil CMS History & Team | Stencil CMS",
      "description": "Learn about our journey, mission, values, and meet our talented team",
      "keywords": "about us, company history, team, mission, vision",
      "robots": "index, follow",
      "canonical": "https://stencilcms.com/about"
    },
    "openGraph": {
      "og:type": "website",
      "og:title": "About Us | Stencil CMS",
      "og:description": "Discover our story and meet the team",
      "og:image": "https://stencilcms.com/uploads/og-about.jpg",
      "og:url": "https://stencilcms.com/about",
      "og:site_name": "Stencil CMS",
      "og:locale": "id_ID"
    },
    "twitter": {
      "twitter:card": "summary_large_image",
      "twitter:title": "About Us | Stencil CMS",
      "twitter:description": "Our story and team",
      "twitter:image": "https://stencilcms.com/uploads/twitter-about.jpg",
      "twitter:site": "@stencilcms",
      "twitter:creator": "@stencilcms"
    },
    "schema": {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "About Us",
      "description": "Learn about our journey and team",
      "url": "https://stencilcms.com/about"
    },
    "verification": {
      "google-site-verification": "abc123xyz",
      "msvalidate.01": "def456uvw"
    },
    "source": "custom"
  }
}
```

**Note:** `source` field indicates:
- `custom` - Using custom SEO from seo_meta table
- `default` - Using default SEO settings
- `system` - Using system defaults (nothing configured)

---

## INTEGRATION DENGAN ADMIN PAGES

Setiap halaman admin harus memiliki **SEO Settings Tab/Section**.

### Homepage Admin Integration

**Location:** `src/pages/admin/PageHome.tsx`

Add SEO tab with fields:
```typescript
<Tabs>
  <Tab label="Content">...</Tab>
  <Tab label="SEO Settings">
    <SEOEditor 
      type="page" 
      id={pageId}
      defaultTitle="Home | {siteName}"
    />
  </Tab>
</Tabs>
```

### Product Editor Integration

**Location:** `src/pages/admin/ProductEditor.tsx`

Add SEO section:
```typescript
<Tabs>
  <Tab label="General">...</Tab>
  <Tab label="Customization">...</Tab>
  <Tab label="SEO">
    <SEOEditor 
      type="product" 
      id={productId}
      defaultTitle="{productName} | Products | {siteName}"
      defaultDescription="Buy {productName} - {shortDescription}"
    />
  </Tab>
</Tabs>
```

---

## SEO COMPONENT STRUCTURE

### Reusable SEO Editor Component

```typescript
interface SEOEditorProps {
  type: 'page' | 'product' | 'category';
  id: number;
  defaultTitle?: string;
  defaultDescription?: string;
}

const SEOEditor: React.FC<SEOEditorProps> = ({ type, id, defaultTitle, defaultDescription }) => {
  // Fetch current SEO or use defaults
  // Provide form with:
  // - Basic Meta (title, description, keywords)
  // - Open Graph settings
  // - Twitter Card settings
  // - Advanced (canonical, robots)
  // - Preview of how it will look in search results
  // - Character count indicators (60 for title, 160 for description)
  // - Button to "Use Default SEO" (delete custom SEO)
}
```

---

## FALLBACK LOGIC IMPLEMENTATION

### Backend Logic (Laravel Example)

```php
class SEOService
{
    public function getSEOForPage($type, $id)
    {
        // 1. Try to get custom SEO
        $customSEO = SEOMeta::where('seo_metable_type', $type)
            ->where('seo_metable_id', $id)
            ->where('is_enabled', true)
            ->first();
        
        if ($customSEO && $customSEO->meta_title) {
            return $this->formatSEO($customSEO, 'custom');
        }
        
        // 2. Fallback to default SEO
        $defaultSEO = SEODefaultSettings::first();
        
        if ($defaultSEO) {
            return $this->formatSEO($defaultSEO, 'default');
        }
        
        // 3. System defaults
        return $this->getSystemDefaults();
    }
    
    private function formatSEO($seo, $source)
    {
        // Process template variables
        // {page} -> current page name
        // {siteName} -> site name
        // {productName} -> product name (if product)
        // etc.
    }
}
```

### Frontend Meta Tags Rendering

```typescript
// In Next.js or React Helmet
import { Helmet } from 'react-helmet';

const SEOHead: React.FC<{ seoData: SEOData }> = ({ seoData }) => {
  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{seoData.meta.title}</title>
      <meta name="description" content={seoData.meta.description} />
      <meta name="keywords" content={seoData.meta.keywords} />
      <meta name="robots" content={seoData.meta.robots} />
      <link rel="canonical" href={seoData.meta.canonical} />
      
      {/* Open Graph */}
      {Object.entries(seoData.openGraph).map(([key, value]) => (
        <meta key={key} property={key} content={value} />
      ))}
      
      {/* Twitter Card */}
      {Object.entries(seoData.twitter).map(([key, value]) => (
        <meta key={key} name={key} content={value} />
      ))}
      
      {/* Schema.org */}
      <script type="application/ld+json">
        {JSON.stringify(seoData.schema)}
      </script>
      
      {/* Verification */}
      {seoData.verification && Object.entries(seoData.verification).map(([key, value]) => (
        <meta key={key} name={key} content={value} />
      ))}
    </Helmet>
  );
};
```

---

## VALIDATION RULES

### Default SEO Settings
```
site_name: required|string|max:255
default_meta_title: nullable|string|max:255
default_meta_description: nullable|string|max:500
og_default_image_url: nullable|url|max:500
canonical_base_url: nullable|url|max:500
```

### Per-Page SEO
```
meta_title: nullable|string|max:60 (recommended for SEO)
meta_description: nullable|string|max:160 (recommended for SEO)
meta_keywords: nullable|string|max:500
og_image_url: nullable|url|max:500
canonical_url: nullable|url|max:500
robots: nullable|in:index follow,index nofollow,noindex follow,noindex nofollow
```

---

## BUSINESS RULES

1. **Default SEO Settings** hanya ada 1 record (singleton pattern)
2. **Polymorphic SEO** dapat diterapkan ke model apapun
3. **Fallback hierarchy** harus jelas: Custom → Default → System
4. **Title template** menggunakan placeholder `{page}`, `{siteName}`, `{productName}`, dll
5. **Character limits** untuk SEO best practices:
   - Title: 50-60 characters
   - Description: 150-160 characters
6. **OG Image** minimal 1200x630px untuk optimal display
7. **Canonical URL** harus absolute URL (bukan relative)
8. **Robots tag** mempengaruhi indexing di search engines
9. **Delete custom SEO** akan revert ke default settings
10. **Schema.org** disesuaikan dengan page type (WebPage, Product, Article, etc.)

---

## SITEMAP GENERATION

### Generate Sitemap Endpoint

```http
GET /sitemap.xml
```

**Response (XML):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://stencilcms.com/</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://stencilcms.com/about</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- Dynamic products -->
  <url>
    <loc>https://stencilcms.com/products/acrylic-laser-cutting</loc>
    <lastmod>2025-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
```

### Robots.txt Endpoint

```http
GET /robots.txt
```

**Response:**
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://stencilcms.com/sitemap.xml
```

---

## EXAMPLE SCENARIOS

### Scenario 1: Homepage dengan Custom SEO

```
Request: GET /
Custom SEO exists for Page(id=1, type='home')
→ Use custom SEO from seo_meta table
→ Title: "Home - Premium Laser Etching Services"
→ Source: "custom"
```

### Scenario 2: About Page tanpa Custom SEO

```
Request: GET /about
No custom SEO for Page(id=2, type='about')
→ Use default SEO settings
→ Title: "About | Stencil CMS" (from template "{page} | {siteName}")
→ Source: "default"
```

### Scenario 3: Product dengan Custom SEO

```
Request: GET /products/acrylic-etching
Custom SEO exists for Product(id=15)
→ Use custom SEO
→ Title: "Acrylic Laser Etching - High Precision Custom Engraving"
→ Description: "Professional acrylic laser etching service..."
→ Schema: Product type with price and availability
→ Source: "custom"
```

### Scenario 4: New Product tanpa SEO

```
Request: GET /products/new-item
No custom SEO for Product(id=99)
→ Use default SEO with auto-generated values
→ Title: "New Item | Products | Stencil CMS"
→ Description: (first 160 chars of product description)
→ Source: "default"
```

---

## RECOMMENDED TEMPLATE VARIABLES

### Available Variables
- `{siteName}` - From default settings
- `{page}` - Page name/title from page data
- `{productName}` - Product name
- `{categoryName}` - Category name
- `{year}` - Current year
- `{price}` - Product price (formatted)

### Template Examples
```
Homepage: "{siteName} - {tagline}"
About: "About Us | {siteName}"
Products: "{productName} | Products | {siteName}"
Categories: "{categoryName} Products | {siteName}"
Blog: "{postTitle} | Blog | {siteName}"
```

---

**Previous:** [17-SETTINGS.md](./17-SETTINGS.md)  
**Back to Index:** [00-INDEX.md](./00-INDEX.md)

**Last Updated:** 2025-11-11  
**Status:** ✅ COMPLETE  
**Reviewed By:** CanvaStack Stencil
