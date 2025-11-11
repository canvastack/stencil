# FAQ MANAGEMENT ENGINE MODULE
## Enterprise-Grade Database Schema & API Documentation

**Module:** Content Management - FAQ Engine  
**Total Fields:** 150+  
**Total Tables:** 12  
**Admin Page:** `src/pages/admin/PageFAQ.tsx`  
**Architecture:** Multi-Tenant with Row-Level Security (RLS)  
**Compliance:** GDPR, SOC2 Type II Ready  
**Performance Target:** < 50ms query response, 10,000+ concurrent users  

---

## EXECUTIVE SUMMARY

### Business Value

**Enterprise FAQ Management Engine** menyediakan comprehensive knowledge management system dengan advanced features untuk mendukung complex business requirements:

**🎯 Core Capabilities:**
- **Multi-Tenant Architecture**: Complete data isolation dengan Row-Level Security
- **Advanced Content Management**: Versioning, approval workflows, content scheduling
- **Intelligent Analytics**: User behavior tracking, content performance metrics, AI-powered insights
- **Multi-Language Support**: Translation management dengan workflow approval
- **Enterprise Integration**: CRM integration, helpdesk ticketing, knowledge base sync

**📊 Performance Targets:**
- Support **10,000+ tenants** dengan complete data isolation
- Handle **100,000+ FAQ items** per tenant dengan optimal performance
- Process **1M+ searches/day** dengan < 50ms response time
- **99.9% uptime** dengan comprehensive monitoring dan alerting

**🔒 Security & Compliance:**
- **Row-Level Security (RLS)** untuk complete tenant isolation
- **Comprehensive audit logging** untuk compliance requirements
- **GDPR compliance** dengan data retention policies
- **Role-based access control** dengan 25+ granular permissions

---

## MULTI-TENANT ARCHITECTURE OVERVIEW

### Tenant Isolation Strategy

**Database-Level Isolation dengan PostgreSQL Row-Level Security:**

```sql
-- Enable RLS on all FAQ tables
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_translations ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation_faq_categories ON faq_categories
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_faq_items ON faq_items
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

**Multi-Tenant Data Flow:**
```
┌─────────────────────────────────────────────┐
│           TENANT CONTEXT RESOLUTION         │
│  1. Extract tenant dari subdomain/header    │
│  2. Validate tenant exists & active         │
│  3. Set PostgreSQL session variable         │
│  4. All queries auto-scoped by RLS          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         FAQ ENGINE (Per Tenant)             │
│  • Categories: tenant_id scoped             │
│  • FAQ Items: tenant_id scoped              │
│  • Analytics: tenant_id scoped              │
│  • Translations: tenant_id scoped           │
└─────────────────────────────────────────────┘
```

---

## ENTERPRISE DATABASE SCHEMA

### Table 1: `faq_categories` (Enhanced)

**Multi-tenant FAQ category management dengan advanced features.**

```sql
CREATE TABLE faq_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Basic information
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Display & Organization
    icon_name VARCHAR(100) NULL,
    color_hex VARCHAR(7) NULL DEFAULT '#3B82F6',
    display_order INTEGER DEFAULT 0,
    
    -- Visibility & Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    
    -- SEO & Meta
    slug VARCHAR(255) NOT NULL,
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    meta_keywords TEXT[] DEFAULT '{}',
    
    -- Content Management
    parent_category_id UUID NULL REFERENCES faq_categories(id) ON DELETE SET NULL,
    level INTEGER DEFAULT 0,
    path TEXT NULL, -- Materialized path for hierarchy
    
    -- Access Control
    required_permission VARCHAR(100) NULL,
    visibility_rules JSONB DEFAULT '{}',
    
    -- Analytics
    view_count BIGINT DEFAULT 0,
    search_count BIGINT DEFAULT 0,
    last_accessed_at TIMESTAMP NULL,
    
    -- Audit fields
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    version INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Constraints
    UNIQUE(tenant_id, code),
    UNIQUE(tenant_id, slug),
    CHECK (level >= 0 AND level <= 5),
    CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$')
);

-- Indexes for performance
CREATE INDEX idx_faq_categories_tenant ON faq_categories(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_faq_categories_active ON faq_categories(tenant_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_faq_categories_public ON faq_categories(tenant_id, is_public) WHERE deleted_at IS NULL;
CREATE INDEX idx_faq_categories_featured ON faq_categories(tenant_id, is_featured) WHERE deleted_at IS NULL;
CREATE INDEX idx_faq_categories_order ON faq_categories(tenant_id, display_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_faq_categories_parent ON faq_categories(parent_category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_faq_categories_path ON faq_categories USING GIN(string_to_array(path, '/'));
CREATE INDEX idx_faq_categories_search ON faq_categories USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Row-Level Security
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_faq_categories ON faq_categories
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Triggers
CREATE TRIGGER update_faq_categories_updated_at 
    BEFORE UPDATE ON faq_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER faq_categories_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON faq_categories
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

### Table 2: `faq_items` (Enhanced)

**Enterprise FAQ items dengan versioning, approval workflow, dan advanced analytics.**

```sql
CREATE TABLE faq_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Category relationship
    category_id UUID NOT NULL REFERENCES faq_categories(id) ON DELETE CASCADE,
    
    -- Basic content
    code VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    answer_format VARCHAR(20) DEFAULT 'markdown' CHECK (answer_format IN ('markdown', 'html', 'plain')),
    
    -- Rich content
    attachments JSONB DEFAULT '[]',
    related_links JSONB DEFAULT '[]',
    tags TEXT[] DEFAULT '{}',
    
    -- Display & Organization
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    
    -- Status & Workflow
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived')),
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    
    -- Publishing
    published_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    scheduled_at TIMESTAMP NULL,
    
    -- SEO & Meta
    slug VARCHAR(255) NOT NULL,
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    meta_keywords TEXT[] DEFAULT '{}',
    
    -- Access Control
    required_permission VARCHAR(100) NULL,
    visibility_rules JSONB DEFAULT '{}',
    target_audience TEXT[] DEFAULT '{}',
    
    -- Analytics & Engagement
    view_count BIGINT DEFAULT 0,
    helpful_count BIGINT DEFAULT 0,
    not_helpful_count BIGINT DEFAULT 0,
    share_count BIGINT DEFAULT 0,
    last_viewed_at TIMESTAMP NULL,
    
    -- Content Quality
    readability_score DECIMAL(3,2) NULL,
    content_length INTEGER GENERATED ALWAYS AS (length(question) + length(answer)) STORED,
    reading_time_minutes INTEGER NULL,
    
    -- AI & ML
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_confidence_score DECIMAL(3,2) NULL,
    auto_tags TEXT[] DEFAULT '{}',
    sentiment_score DECIMAL(3,2) NULL,
    
    -- Audit fields
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID NULL REFERENCES users(id),
    version INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Constraints
    UNIQUE(tenant_id, code),
    UNIQUE(tenant_id, category_id, slug),
    CHECK (helpful_count >= 0),
    CHECK (not_helpful_count >= 0),
    CHECK (view_count >= 0)
);

-- Performance indexes
CREATE INDEX idx_faq_items_tenant ON faq_items(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_faq_items_category ON faq_items(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_faq_items_status ON faq_items(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_faq_items_active ON faq_items(tenant_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_faq_items_public ON faq_items(tenant_id, is_public) WHERE deleted_at IS NULL;
CREATE INDEX idx_faq_items_featured ON faq_items(tenant_id, is_featured) WHERE deleted_at IS NULL;
CREATE INDEX idx_faq_items_published ON faq_items(tenant_id, published_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_faq_items_order ON faq_items(tenant_id, category_id, display_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_faq_items_popularity ON faq_items(tenant_id, view_count DESC, helpful_count DESC) WHERE deleted_at IS NULL;

-- Full-text search indexes
CREATE INDEX idx_faq_items_search_content ON faq_items USING GIN(to_tsvector('english', question || ' ' || answer));
CREATE INDEX idx_faq_items_search_tags ON faq_items USING GIN(tags);
CREATE INDEX idx_faq_items_search_auto_tags ON faq_items USING GIN(auto_tags);

-- Row-Level Security
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_faq_items ON faq_items
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Triggers
CREATE TRIGGER update_faq_items_updated_at 
    BEFORE UPDATE ON faq_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER faq_items_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON faq_items
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

### Additional Tables (3-12)

The documentation includes 10 additional enterprise tables:
- `faq_versions` - Content versioning with rollback capability
- `faq_translations` - Multi-language support with workflow
- `faq_analytics` - Comprehensive user behavior tracking
- `faq_feedback` - User feedback and rating system
- `faq_attachments` - File attachments with metadata
- `faq_tags` - Tag management system
- `faq_item_tags` - Many-to-many tag relationships
- `faq_workflows` - Approval workflow management
- `faq_integrations` - External system integrations
- `faq_cache_keys` - Performance optimization cache management

---

## RBAC PERMISSION SYSTEM

### FAQ Management Permissions

**Comprehensive permission matrix dengan 25+ granular permissions:**

- **Category Management**: view, create, edit, delete, reorder
- **FAQ Items Management**: view, view_all, create, edit, edit_all, delete, publish, feature
- **Content Workflow**: approve, reject, assign
- **Versioning**: view, restore, compare
- **Translations**: view, create, edit, approve
- **Analytics & Reports**: view, export, advanced
- **Feedback Management**: view, moderate, respond
- **Tag Management**: view, create, edit, delete
- **Attachments**: view, upload, delete
- **Integrations**: view, manage, sync
- **Cache Management**: view, clear

### Role-Permission Matrix

| Role | Permissions |
|------|-------------|
| **FAQ Admin** | All FAQ permissions |
| **FAQ Manager** | All except integrations.manage, cache.clear |
| **FAQ Editor** | categories.*, items.*, tags.*, attachments.*, versions.view |
| **FAQ Moderator** | items.view_all, feedback.*, workflow.approve/reject |
| **FAQ Translator** | translations.*, items.view, categories.view |
| **FAQ Analyst** | analytics.*, reports.*, items.view, categories.view |
| **FAQ Viewer** | items.view, categories.view, analytics.view |

---

## ENTERPRISE FEATURES

### 1. Content Versioning System
- Automatic version creation on every change
- Rollback capability with approval workflow
- Version comparison and diff viewing

### 2. Multi-Level Caching Strategy
- L1: Application Cache (Redis) - 1 hour TTL
- L2: Database Query Cache - 5 minutes TTL
- L3: CDN Cache - 24 hours TTL
- Smart invalidation and cache warming

### 3. Advanced Search Engine
- Full-text search with PostgreSQL
- AI-powered search suggestions
- Search analytics and optimization

### 4. AI-Powered Content Enhancement
- Auto-tagging with NLP
- Content quality scoring
- Translation assistance
- Sentiment analysis

### 5. Comprehensive Audit System
- Complete audit trail for compliance
- User action tracking
- Data change logging
- Security event monitoring

### 6. Performance Optimization
- Strategic database indexing
- Query optimization
- Materialized views for popular content
- Table partitioning for analytics

---

## COMPREHENSIVE API ENDPOINTS

### Public API Endpoints

#### 1. FAQ Content Retrieval
```http
GET /api/v1/faq
```
- Advanced filtering and pagination
- Multi-language support
- Performance optimization with caching

#### 2. Advanced FAQ Search
```http
GET /api/v1/faq/search
```
- AI-powered search with relevance scoring
- Search suggestions and filters
- Analytics tracking

#### 3. FAQ Item Detail
```http
GET /api/v1/faq/items/{id}
```
- Complete item details with metadata
- Related items and translations
- Analytics tracking

#### 4. FAQ Feedback Submission
```http
POST /api/v1/faq/items/{id}/feedback
```
- User feedback and ratings
- Moderation workflow
- Analytics integration

### Admin API Endpoints

#### 1. FAQ Categories Management
- Complete CRUD operations
- Hierarchy management
- Analytics and performance metrics

#### 2. FAQ Items Management
- Advanced item management with workflow
- Bulk operations and filtering
- Content quality metrics

#### 3. Workflow Management
- Approval workflow for content publishing
- Task assignment and tracking
- Performance metrics

#### 4. Analytics & Reports
- Comprehensive performance analytics
- User engagement metrics
- Content quality insights

#### 5. Translation Management
- Multi-language content management
- Translation workflow and quality control
- Progress tracking

#### 6. Integration Management
- External system integrations (CRM, Helpdesk)
- Sync status and configuration
- Performance monitoring

---

## PERFORMANCE OPTIMIZATION

### Database Optimization
- Strategic composite indexing
- Partial indexes for specific use cases
- Expression indexes for computed values

### Caching Strategy
- Multi-layer Redis caching
- Tag-based cache invalidation
- Smart cache warming strategies

### Query Optimization
- Optimized queries for common operations
- Materialized views for complex aggregations
- Connection pooling and query planning

---

## SECURITY & COMPLIANCE

### Data Protection
- GDPR compliance with data retention policies
- Automated data anonymization
- Comprehensive encryption (at rest and in transit)

### Access Control
- Row-Level Security (RLS) policies
- JWT token authentication
- Rate limiting and request validation
- Complete audit logging

---

## MONITORING & OBSERVABILITY

### Performance Monitoring
- Application metrics (response times, error rates)
- Business metrics (engagement, content performance)
- Infrastructure metrics (database, cache, storage)

### Health Checks
- System health monitoring endpoints
- Database connection monitoring
- Cache performance tracking
- Integration status monitoring

---

## MIGRATION & DEPLOYMENT

### Database Migration Strategy
- Safe migration procedures with rollback capability
- Version tracking and change management
- Performance testing and validation

### Deployment Checklist
- Pre-deployment validation
- Deployment procedures
- Post-deployment verification
- Performance monitoring

---

**Previous:** [04-CONTACT.md](./04-CONTACT.md)  
**Next:** [06-PRODUCTS.md](./06-PRODUCTS.md) *(To Be Continued)*