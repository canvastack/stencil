# HOMEPAGE/BERANDA MODULE
## Enterprise Content Management & Page Builder System

**Module:** Enterprise Homepage Management & Content Platform  
**Total Fields:** 240+ fields  
**Total Tables:** 23 tables (pages, page_sections_hero, page_sections_hero_images, page_sections_social_proof, page_sections_social_proof_stats, page_sections_process, page_sections_process_steps, page_sections_why_choose_us, page_sections_why_choose_us_features, page_sections_achievements, page_sections_achievement_items, page_sections_services, page_sections_service_items, page_sections_testimonials, page_sections_testimonial_items, page_sections_cta, homepage_templates, homepage_validation_results, homepage_security_scans, homepage_analytics, homepage_import_export, homepage_version_history, homepage_ab_tests)  
**Admin Pages:** `src/pages/admin/PageHome.tsx` (Implemented), `src/pages/admin/HomepageTemplates.tsx`, `src/pages/admin/HomepageAnalytics.tsx`, `src/pages/admin/HomepageImportExport.tsx`, `src/pages/admin/HomepageValidation.tsx`, `src/pages/admin/HomepageSecurity.tsx`, `src/pages/admin/HomepageVersionControl.tsx`, `src/pages/admin/HomepageABTesting.tsx` (Planned)  
**Type Definition:** `src/types/homepage.ts`  
**Status:** ⚠️ **BASIC IMPLEMENTATION - MISSING TENANT ISOLATION** - Audit completed  
**Architecture Reference:** `docs/ARCHITECTURE/ADVANCED_SYSTEMS/1-MULTI_TENANT_ARCHITECTURE.md`, `docs/ARCHITECTURE/ADVANCED_SYSTEMS/2-RBAC_PERMISSION_SYSTEM.md`

> **⚠️ IMPLEMENTATION GAP DETECTED**  
> **Documentation Quality**: **COMPREHENSIVE** - 240+ fields, 23 tables planned  
> **Implementation Status**: **BASIC ONLY** - PageHome.tsx exists but lacks tenant context  
> **Database Status**: **NO MULTI-TENANT TABLES** - Missing tenant_id isolation  
> **Priority**: **MEDIUM** - Content system works but not multi-tenant ready

---

## CORE IMMUTABLE RULES COMPLIANCE

### **Rule 1: Teams Enabled with tenant_id as team_foreign_key**
❌ **PARTIALLY IMPLEMENTED** - Current `page_content` table in existing schema **MISSING tenant_id**. Single-tenant homepage only.

### **Rule 2: API Guard Implementation**
❌ **MISSING BACKEND API** - No Laravel backend for homepage management. Frontend uses static content management only.

### **Rule 3: UUID model_morph_key**
✅ **EXISTING SCHEMA COMPLIANT** - Current implementation uses proper UUID generation with `gen_random_uuid()`.

### **Rule 4: Strict Tenant Data Isolation**
❌ **NO TENANT ISOLATION** - Current database schema allows cross-tenant content access. **Data leakage risk** for homepage content.

### **Rule 5: RBAC Integration Requirements**
⚠️ **BASIC RBAC EXISTS** - Permission system works but **NOT tenant-scoped** for homepage management:
- `homepage.view` - View homepage content and configurations
- `homepage.create` - Create new homepage sections and templates
- `homepage.edit` - Modify homepage content and settings
- `homepage.delete` - Delete homepage sections and templates
- `homepage.manage` - Full homepage lifecycle management
- `homepage.admin` - Access advanced homepage management features
- `homepage.template` - Manage homepage templates and presets
- `homepage.import` - Import homepage configurations from external sources
- `homepage.export` - Export homepage configurations for backup or migration
- `homepage.analytics` - Access homepage analytics and performance data

---

## 🚨 IMPLEMENTATION GAP AUDIT

### **AUDIT SUMMARY**
**Date**: November 12, 2025  
**Auditor**: CanvaStack Stencil  
**Scope**: Homepage system implementation vs multi-tenant requirements  
**Status**: **FUNCTIONAL BUT NOT MULTI-TENANT READY**

### **📊 IMPLEMENTATION STATUS**

#### **✅ WHAT'S WORKING**
- **Frontend UI**: `PageHome.tsx` exists with content editing
- **Database Schema**: Basic `page_content` table implemented
- **UUID Generation**: Proper `gen_random_uuid()` usage
- **Content Management**: Static homepage editing works

#### **❌ CRITICAL GAPS**
- **No Tenant Isolation**: `page_content` table missing `tenant_id`
- **No Backend API**: Laravel routes/controllers missing
- **Single Tenant Only**: Cannot support multiple tenants
- **RBAC Not Tenant-Scoped**: Permissions not per-tenant

### **📈 COMPLIANCE SCORECARD**

| Component | Documented | Implemented | Status |
|-----------|------------|-------------|---------|
| **Basic Content Management** | ✅ | ✅ | **PASSED** |
| **Database Schema** | ✅ | ⚠️ Partial | **NEEDS WORK** |
| **Tenant Isolation** | ✅ | ❌ | **FAILED** |
| **Advanced Features** | ✅ | ❌ | **FAILED** |
| **Backend API** | ✅ | ❌ | **FAILED** |

**Overall Compliance**: **60%** (Good foundation, needs multi-tenant fixes)

### **🔧 REQUIRED FIXES**
1. **Add tenant_id to page_content table** ⚠️ **MEDIUM**
2. **Build Laravel backend API** 🔴 **HIGH** 
3. **Add tenant context to frontend** ⚠️ **MEDIUM**
4. **Implement advanced features (23 tables)** 🟡 **LOW**

---

## TABLE OF CONTENTS

1. [🚨 Implementation Gap Audit](#-implementation-gap-audit)
2. [Overview](#overview)
3. [Business Context](#business-context)
4. [Database Schema](#database-schema)
   - [Core Homepage Tables](#core-homepage-tables)
   - [Advanced Homepage Tables](#advanced-homepage-tables)
4. [Advanced Homepage Features](#advanced-homepage-features)
5. [Homepage Templates System](#homepage-templates-system)
6. [Content Validation Framework](#content-validation-framework)
7. [Homepage Security & Compliance](#homepage-security--compliance)
8. [Homepage Analytics & Monitoring](#homepage-analytics--monitoring)
9. [Import/Export Management](#importexport-management)
10. [Version Control System](#version-control-system)
11. [A/B Testing System](#ab-testing-system)
12. [Relationship Diagram](#relationship-diagram)
13. [Field Specifications](#field-specifications)
14. [Business Rules](#business-rules)
15. [Homepage Categories](#homepage-categories)
16. [RBAC Integration](#rbac-integration)
17. [Admin UI Features](#admin-ui-features)
18. [API Endpoints](#api-endpoints)
19. [Sample Data](#sample-data)
20. [Migration Script](#migration-script)
21. [Performance Indexes](#performance-indexes)

---

## OVERVIEW

Enterprise Homepage Management System adalah **comprehensive content platform** yang memungkinkan setiap tenant untuk mengelola, mengoptimalkan, dan menganalisis homepage mereka dengan **enterprise-grade architecture** yang mencakup templates management, content validation, security compliance, analytics monitoring, dan version control untuk mendukung complex business workflows.

### Core Features

1. **Enterprise Homepage Management (Enhanced)**
   - 8 dynamic sections dengan advanced customization
   - Multi-language content support dengan localization
   - SEO optimization dengan meta management
   - Mobile-responsive design dengan device preview
   - Content scheduling dengan publication workflow
   - Real-time preview dengan live editing

2. **Advanced Content Sections**
   - **Hero Section**: Banner carousel dengan typing animation, CTA buttons, dan advanced settings
   - **Social Proof**: Dynamic statistics dengan icon management dan color theming
   - **Process**: Step-by-step workflow dengan visual indicators
   - **Why Choose Us**: Feature highlights dengan customizable themes
   - **Achievements**: Certification dan awards dengan visual presentation
   - **Services**: Service catalog dengan detailed descriptions
   - **Testimonials**: Customer reviews dengan rating system dan featured content
   - **CTA Sections**: Primary dan secondary call-to-action dengan conversion tracking

3. **Homepage Templates System (NEW)**
   - Pre-built templates untuk different business types
   - Industry-specific templates (etching, manufacturing, services)
   - Template versioning dengan rollback capability
   - Custom template creation dengan visual builder
   - Template marketplace dengan sharing functionality
   - Template validation dengan quality assurance

4. **Content Validation Framework (NEW)**
   - Real-time content validation dengan quality scoring
   - SEO compliance checking dengan recommendations
   - Accessibility validation (WCAG 2.1 compliance)
   - Performance optimization suggestions
   - Content quality metrics dengan improvement suggestions
   - Automated content auditing dengan scheduled reports

5. **Homepage Security & Compliance (NEW)**
   - Content security scanning dengan malware detection
   - GDPR compliance monitoring untuk data collection
   - Security headers validation
   - SSL certificate monitoring
   - Content integrity verification
   - Compliance reporting dengan audit trails

6. **Homepage Analytics & Monitoring (NEW)**
   - Page performance metrics dengan Core Web Vitals
   - User engagement tracking dengan heatmaps
   - Conversion rate optimization dengan funnel analysis
   - A/B testing framework dengan statistical significance
   - Content effectiveness scoring
   - Business intelligence dengan ROI calculations

7. **Import/Export Management (NEW)**
   - Homepage configuration backup dengan automated scheduling
   - Cross-tenant content migration dengan validation
   - Template sharing dengan marketplace integration
   - Bulk content operations dengan progress tracking
   - Data synchronization dengan external systems
   - Migration tools dengan rollback capability

8. **Version Control System (NEW)**
   - Git-like versioning untuk homepage changes
   - Content history dengan diff visualization
   - Collaborative editing dengan conflict resolution
   - Approval workflows dengan multi-level review
   - Rollback functionality dengan impact analysis
   - Change tracking dengan audit logs

9. **A/B Testing System (NEW)**
   - Multi-variant testing dengan statistical analysis
   - Conversion optimization dengan automated winner selection
   - Audience segmentation dengan targeting rules
   - Performance comparison dengan detailed metrics
   - Test scheduling dengan automated lifecycle management
   - Results reporting dengan actionable insights

### Key Statistics

| Metric | Value |
|--------|-------|
| Total Tables | 23 (Enhanced from 17) |
| Total Fields | 240+ (Enhanced from 80+) |
| API Endpoints | 85+ (Enhanced from 20+) |
| Content Sections | 8 dynamic sections |
| Template Categories | 15+ industry-specific templates |
| Validation Rules | 50+ content quality checks |
| Analytics Metrics | 25+ performance indicators |
| Security Scans | 20+ compliance checks |

---

## BUSINESS CONTEXT

### **Integration with Etching Business Cycle**

Homepage Management System is specifically designed to support the **custom etching business workflow** dengan homepage yang dapat disesuaikan untuk setiap stage dalam business cycle:

**1. Customer Acquisition Stage:**
- **Hero Section**: Showcase etching capabilities dengan high-quality imagery
- **Social Proof**: Display customer testimonials dan project statistics
- **Process Section**: Explain etching workflow dari consultation hingga delivery
- **Services Section**: Detail layanan etching (laser, chemical, mechanical)

**2. Trust Building Stage:**
- **Achievements Section**: Display certifications (ISO 9001, quality awards)
- **Why Choose Us**: Highlight competitive advantages (precision, quality, experience)
- **Testimonials**: Customer success stories dengan before/after images
- **CTA Sections**: Strategic placement untuk lead generation

**3. Conversion Optimization:**
- **A/B Testing**: Test different hero messages, CTA buttons, layouts
- **Analytics**: Track conversion rates, bounce rates, engagement metrics
- **Performance Monitoring**: Ensure fast loading untuk better user experience
- **SEO Optimization**: Improve search visibility untuk etching-related keywords

### Multi-Tenant Homepage Strategy

**Tenant-Specific Customization:**
- Each tenant dapat customize homepage sesuai brand identity
- Industry-specific templates (etching, manufacturing, services)
- Localization support untuk different markets
- Custom domain integration dengan SSL certificates

**Shared Resources:**
- Template marketplace untuk cross-tenant sharing
- Best practices documentation
- Performance benchmarking across tenants
- Security updates dan compliance monitoring

### Revenue Impact

**Direct Revenue Generation:**
- **Lead Generation**: Optimized CTAs untuk inquiry conversion
- **SEO Performance**: Better search rankings = more organic traffic
- **Conversion Rate**: A/B testing untuk improved conversion rates
- **Customer Trust**: Professional homepage = higher closing rates

**Operational Efficiency:**
- **Content Management**: Streamlined homepage updates
- **Performance Monitoring**: Automated alerts untuk issues
- **Compliance**: Automated security dan accessibility checks
- **Analytics**: Data-driven decisions untuk homepage optimization

---

## DATABASE SCHEMA

### Core Homepage Tables

#### Table 1: `pages` (Enhanced)

Main page registry dengan multi-tenant support dan enterprise features.

```sql
CREATE TABLE pages (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Page identification
    slug VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    page_type VARCHAR(50) NOT NULL CHECK (page_type IN ('home', 'about', 'contact', 'faq', 'custom')),
    
    -- Publishing workflow
    publish_status VARCHAR(50) DEFAULT 'draft' CHECK (publish_status IN ('draft', 'review', 'scheduled', 'published', 'archived')),
    published_at TIMESTAMP NULL,
    scheduled_at TIMESTAMP NULL,
    
    -- SEO & Meta
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    meta_keywords TEXT NULL,
    og_image_url VARCHAR(500) NULL,
    canonical_url VARCHAR(500) NULL,
    
    -- Content management
    template_id UUID NULL,
    version_number INT DEFAULT 1,
    is_template BOOLEAN DEFAULT FALSE,
    
    -- Performance & Analytics
    page_views BIGINT DEFAULT 0,
    bounce_rate DECIMAL(5,2) NULL,
    avg_time_on_page INT NULL,
    conversion_rate DECIMAL(5,2) NULL,
    
    -- Localization
    language_code VARCHAR(10) DEFAULT 'en',
    is_default_language BOOLEAN DEFAULT TRUE,
    parent_page_id UUID NULL,
    
    -- Security & Compliance
    security_scan_status VARCHAR(50) DEFAULT 'pending',
    security_scan_score INT NULL,
    last_security_scan TIMESTAMP NULL,
    
    -- Audit fields
    created_by UUID NOT NULL,
    updated_by UUID NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Constraints
    UNIQUE(tenant_id, slug),
    UNIQUE(tenant_id, title, language_code)
);

CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_page_type ON pages(page_type);
CREATE INDEX idx_pages_publish_status ON pages(publish_status);

ALTER TABLE pages ADD CONSTRAINT fk_pages_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE pages ADD CONSTRAINT fk_pages_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 1. Hero Section

```sql
CREATE TABLE page_sections_hero (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    typing_texts JSONB NOT NULL,
    subtitle TEXT NULL,
    primary_button_text VARCHAR(100) NULL,
    primary_button_link VARCHAR(255) NULL,
    secondary_button_text VARCHAR(100) NULL,
    secondary_button_link VARCHAR(255) NULL,
    carousel_autoplay_interval INT DEFAULT 5000,
    carousel_show_pause_button BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_hero_page_id ON page_sections_hero(page_id);

ALTER TABLE page_sections_hero ADD CONSTRAINT fk_page_sections_hero_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_hero_updated_at BEFORE UPDATE ON page_sections_hero
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN page_sections_hero.carousel_autoplay_interval IS 'Milliseconds';

CREATE TABLE page_sections_hero_images (
    id BIGSERIAL PRIMARY KEY,
    hero_section_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0,
    alt_text VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_hero_images_hero_section_id ON page_sections_hero_images(hero_section_id);
CREATE INDEX idx_page_sections_hero_images_display_order ON page_sections_hero_images(display_order);

ALTER TABLE page_sections_hero_images ADD CONSTRAINT fk_page_sections_hero_images_hero_section_id 
    FOREIGN KEY (hero_section_id) REFERENCES page_sections_hero(id) ON DELETE CASCADE;
```

**Fields:**
- `typing_texts` - Array teks animasi typing (JSON)
- `subtitle` - Subtitle hero
- `primary_button_text/link` - Tombol CTA utama
- `secondary_button_text/link` - Tombol CTA sekunder
- `carousel_autoplay_interval` - Interval autoplay carousel (ms)
- `carousel_show_pause_button` - Tampilkan tombol pause
- `image_url` - URL gambar carousel
- `alt_text` - Teks alternatif untuk SEO

### 2. Social Proof Section

```sql
CREATE TABLE page_sections_social_proof (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    display_order INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_social_proof_page_id ON page_sections_social_proof(page_id);

ALTER TABLE page_sections_social_proof ADD CONSTRAINT fk_page_sections_social_proof_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_social_proof_updated_at BEFORE UPDATE ON page_sections_social_proof
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE page_sections_social_proof_stats (
    id BIGSERIAL PRIMARY KEY,
    social_proof_section_id BIGINT NOT NULL,
    icon_name VARCHAR(100) NOT NULL,
    stat_value VARCHAR(50) NOT NULL,
    stat_label VARCHAR(100) NOT NULL,
    color_class VARCHAR(100) DEFAULT 'text-blue-500',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_social_proof_stats_section_id ON page_sections_social_proof_stats(social_proof_section_id);
CREATE INDEX idx_page_sections_social_proof_stats_display_order ON page_sections_social_proof_stats(display_order);

ALTER TABLE page_sections_social_proof_stats ADD CONSTRAINT fk_page_sections_social_proof_stats_section_id 
    FOREIGN KEY (social_proof_section_id) REFERENCES page_sections_social_proof(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_social_proof_stats_updated_at BEFORE UPDATE ON page_sections_social_proof_stats
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN page_sections_social_proof_stats.icon_name IS 'Lucide icon name';
COMMENT ON COLUMN page_sections_social_proof_stats.stat_value IS 'e.g., 2000+, 99%';
COMMENT ON COLUMN page_sections_social_proof_stats.color_class IS 'Tailwind class';
```

**Fields:**
- `icon_name` - Nama icon dari Lucide Icons
- `stat_value` - Nilai statistik (contoh: "2000+", "99%")
- `stat_label` - Label statistik (contoh: "Happy Clients")
- `color_class` - Tailwind CSS class untuk warna

### 3. Process Section

```sql
CREATE TABLE page_sections_process (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    display_order INT DEFAULT 2,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_process_page_id ON page_sections_process(page_id);

ALTER TABLE page_sections_process ADD CONSTRAINT fk_page_sections_process_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_process_updated_at BEFORE UPDATE ON page_sections_process
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE page_sections_process_steps (
    id BIGSERIAL PRIMARY KEY,
    process_section_id BIGINT NOT NULL,
    step_number INT NOT NULL,
    icon_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_process_steps_section_id ON page_sections_process_steps(process_section_id);
CREATE INDEX idx_page_sections_process_steps_step_number ON page_sections_process_steps(step_number);

ALTER TABLE page_sections_process_steps ADD CONSTRAINT fk_page_sections_process_steps_section_id 
    FOREIGN KEY (process_section_id) REFERENCES page_sections_process(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_process_steps_updated_at BEFORE UPDATE ON page_sections_process_steps
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**
- `step_number` - Nomor urut langkah (1, 2, 3, ...)
- `icon_name` - Icon untuk setiap langkah
- `title` - Judul langkah
- `description` - Deskripsi detail langkah

### 4. Why Choose Us Section

```sql
CREATE TABLE page_sections_why_choose_us (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    display_order INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_why_choose_us_page_id ON page_sections_why_choose_us(page_id);

ALTER TABLE page_sections_why_choose_us ADD CONSTRAINT fk_page_sections_why_choose_us_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_why_choose_us_updated_at BEFORE UPDATE ON page_sections_why_choose_us
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE page_sections_why_choose_us_features (
    id BIGSERIAL PRIMARY KEY,
    why_choose_us_section_id BIGINT NOT NULL,
    feature_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    color_theme VARCHAR(100) DEFAULT 'blue',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_why_choose_us_features_section_id ON page_sections_why_choose_us_features(why_choose_us_section_id);
CREATE INDEX idx_page_sections_why_choose_us_features_feature_number ON page_sections_why_choose_us_features(feature_number);

ALTER TABLE page_sections_why_choose_us_features ADD CONSTRAINT fk_page_sections_why_choose_us_features_section_id 
    FOREIGN KEY (why_choose_us_section_id) REFERENCES page_sections_why_choose_us(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_why_choose_us_features_updated_at BEFORE UPDATE ON page_sections_why_choose_us_features
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN page_sections_why_choose_us_features.color_theme IS 'Color theme name';
```

**Fields:**
- `feature_number` - Nomor fitur (1, 2, 3, 4)
- `color_theme` - Tema warna (blue, green, orange, purple, etc.)

### 5. Achievements Section

```sql
CREATE TABLE page_sections_achievements (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    title VARCHAR(255) NULL,
    display_order INT DEFAULT 4,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_achievements_page_id ON page_sections_achievements(page_id);

ALTER TABLE page_sections_achievements ADD CONSTRAINT fk_page_sections_achievements_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_achievements_updated_at BEFORE UPDATE ON page_sections_achievements
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE page_sections_achievement_items (
    id BIGSERIAL PRIMARY KEY,
    achievements_section_id BIGINT NOT NULL,
    achievement_number INT NOT NULL,
    icon_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    color_theme VARCHAR(100) DEFAULT 'blue',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_achievement_items_section_id ON page_sections_achievement_items(achievements_section_id);
CREATE INDEX idx_page_sections_achievement_items_achievement_number ON page_sections_achievement_items(achievement_number);

ALTER TABLE page_sections_achievement_items ADD CONSTRAINT fk_page_sections_achievement_items_section_id 
    FOREIGN KEY (achievements_section_id) REFERENCES page_sections_achievements(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_achievement_items_updated_at BEFORE UPDATE ON page_sections_achievement_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 6. Services Section

```sql
CREATE TABLE page_sections_services (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    display_order INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_services_page_id ON page_sections_services(page_id);

ALTER TABLE page_sections_services ADD CONSTRAINT fk_page_sections_services_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_services_updated_at BEFORE UPDATE ON page_sections_services
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE page_sections_service_items (
    id BIGSERIAL PRIMARY KEY,
    services_section_id BIGINT NOT NULL,
    service_number INT NOT NULL,
    icon_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_service_items_section_id ON page_sections_service_items(services_section_id);
CREATE INDEX idx_page_sections_service_items_service_number ON page_sections_service_items(service_number);

ALTER TABLE page_sections_service_items ADD CONSTRAINT fk_page_sections_service_items_section_id 
    FOREIGN KEY (services_section_id) REFERENCES page_sections_services(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_service_items_updated_at BEFORE UPDATE ON page_sections_service_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 7. Testimonials Section

```sql
CREATE TABLE page_sections_testimonials (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    display_order INT DEFAULT 6,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_testimonials_page_id ON page_sections_testimonials(page_id);

ALTER TABLE page_sections_testimonials ADD CONSTRAINT fk_page_sections_testimonials_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_testimonials_updated_at BEFORE UPDATE ON page_sections_testimonials
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE page_sections_testimonial_items (
    id BIGSERIAL PRIMARY KEY,
    testimonials_section_id BIGINT NOT NULL,
    testimonial_number INT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_role VARCHAR(255) NULL,
    customer_company VARCHAR(255) NULL,
    rating SMALLINT DEFAULT 5,
    image_url VARCHAR(500) NULL,
    testimonial_content TEXT NOT NULL,
    display_order INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_testimonial_items_section_id ON page_sections_testimonial_items(testimonials_section_id);
CREATE INDEX idx_page_sections_testimonial_items_testimonial_number ON page_sections_testimonial_items(testimonial_number);
CREATE INDEX idx_page_sections_testimonial_items_rating ON page_sections_testimonial_items(rating);

ALTER TABLE page_sections_testimonial_items ADD CONSTRAINT fk_page_sections_testimonial_items_section_id 
    FOREIGN KEY (testimonials_section_id) REFERENCES page_sections_testimonials(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_testimonial_items_updated_at BEFORE UPDATE ON page_sections_testimonial_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN page_sections_testimonial_items.rating IS '1-5 stars';
```

**Fields:**
- `customer_name` - Nama pelanggan
- `customer_role` - Jabatan pelanggan
- `customer_company` - Nama perusahaan pelanggan
- `rating` - Rating bintang (1-5)
- `image_url` - Foto pelanggan
- `testimonial_content` - Isi testimoni
- `is_featured` - Testimoni unggulan

### 8. CTA Sections

```sql
CREATE TABLE page_sections_cta (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    cta_type VARCHAR(50) NOT NULL CHECK (cta_type IN ('primary', 'secondary')),
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    button_text VARCHAR(100) NULL,
    button_link VARCHAR(255) NULL,
    secondary_button_text VARCHAR(100) NULL,
    secondary_button_link VARCHAR(255) NULL,
    display_order INT DEFAULT 7,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_cta_page_id ON page_sections_cta(page_id);
CREATE INDEX idx_page_sections_cta_cta_type ON page_sections_cta(cta_type);

ALTER TABLE page_sections_cta ADD CONSTRAINT fk_page_sections_cta_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_cta_updated_at BEFORE UPDATE ON page_sections_cta
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN page_sections_cta.secondary_button_text IS 'For primary CTA only';
COMMENT ON COLUMN page_sections_cta.secondary_button_link IS 'For primary CTA only';
```

**Fields:**
- `cta_type` - Tipe CTA: `primary` atau `secondary`
- `secondary_button_text/link` - Tombol kedua (hanya untuk primary CTA)

---

### Advanced Homepage Tables

#### Table 18: `homepage_templates`

Pre-built homepage templates untuk different business types dan industries.

```sql
CREATE TABLE homepage_templates (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NULL, -- NULL for global templates
    
    -- Template identification
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100) NULL,
    
    -- Template metadata
    version VARCHAR(20) DEFAULT '1.0.0',
    author_name VARCHAR(255) NULL,
    author_email VARCHAR(255) NULL,
    license_type VARCHAR(50) DEFAULT 'free',
    price DECIMAL(10,2) DEFAULT 0.00,
    
    -- Template configuration
    template_data JSONB NOT NULL,
    preview_image_url VARCHAR(500) NULL,
    demo_url VARCHAR(500) NULL,
    
    -- Features & compatibility
    supported_sections JSONB DEFAULT '[]',
    required_plugins JSONB DEFAULT '[]',
    min_platform_version VARCHAR(20) NULL,
    
    -- Usage statistics
    download_count INT DEFAULT 0,
    install_count INT DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INT DEFAULT 0,
    
    -- Status & visibility
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    
    -- SEO & Discovery
    tags JSONB DEFAULT '[]',
    keywords TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    UNIQUE(slug)
);

CREATE INDEX idx_homepage_templates_tenant ON homepage_templates(tenant_id);
CREATE INDEX idx_homepage_templates_category ON homepage_templates(category);
CREATE INDEX idx_homepage_templates_status ON homepage_templates(status);
CREATE INDEX idx_homepage_templates_featured ON homepage_templates(is_featured);
CREATE INDEX idx_homepage_templates_premium ON homepage_templates(is_premium);
CREATE INDEX idx_homepage_templates_rating ON homepage_templates(rating_average);
CREATE INDEX idx_homepage_templates_downloads ON homepage_templates(download_count);

ALTER TABLE homepage_templates ADD CONSTRAINT fk_homepage_templates_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE;
```

#### Table 19: `homepage_validation_results`

Real-time validation results untuk homepage content quality dan compliance.

```sql
CREATE TABLE homepage_validation_results (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    page_id UUID NOT NULL,
    
    -- Validation metadata
    validation_type VARCHAR(100) NOT NULL,
    validator_version VARCHAR(20) NOT NULL,
    validation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Validation results
    overall_score INT NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    status VARCHAR(50) NOT NULL CHECK (status IN ('passed', 'warning', 'failed', 'error')),
    
    -- Detailed results
    issues_found JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    performance_metrics JSONB DEFAULT '{}',
    
    -- SEO validation
    seo_score INT NULL CHECK (seo_score >= 0 AND seo_score <= 100),
    seo_issues JSONB DEFAULT '[]',
    
    -- Accessibility validation
    accessibility_score INT NULL CHECK (accessibility_score >= 0 AND accessibility_score <= 100),
    wcag_level VARCHAR(10) NULL CHECK (wcag_level IN ('A', 'AA', 'AAA')),
    accessibility_issues JSONB DEFAULT '[]',
    
    -- Performance validation
    performance_score INT NULL CHECK (performance_score >= 0 AND performance_score <= 100),
    core_web_vitals JSONB DEFAULT '{}',
    performance_issues JSONB DEFAULT '[]',
    
    -- Content quality
    content_score INT NULL CHECK (content_score >= 0 AND content_score <= 100),
    content_issues JSONB DEFAULT '[]',
    
    -- Validation context
    validation_context JSONB DEFAULT '{}',
    auto_fix_applied BOOLEAN DEFAULT FALSE,
    auto_fix_results JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_homepage_validation_tenant ON homepage_validation_results(tenant_id);
CREATE INDEX idx_homepage_validation_page ON homepage_validation_results(page_id);
CREATE INDEX idx_homepage_validation_type ON homepage_validation_results(validation_type);
CREATE INDEX idx_homepage_validation_status ON homepage_validation_results(status);
CREATE INDEX idx_homepage_validation_score ON homepage_validation_results(overall_score);
CREATE INDEX idx_homepage_validation_timestamp ON homepage_validation_results(validation_timestamp);

ALTER TABLE homepage_validation_results ADD CONSTRAINT fk_homepage_validation_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE;
ALTER TABLE homepage_validation_results ADD CONSTRAINT fk_homepage_validation_page 
    FOREIGN KEY (page_id) REFERENCES pages(uuid) ON DELETE CASCADE;
```

#### Table 20: `homepage_security_scans`

Security scanning results untuk homepage content dan compliance monitoring.

```sql
CREATE TABLE homepage_security_scans (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    page_id UUID NOT NULL,
    
    -- Scan metadata
    scan_type VARCHAR(100) NOT NULL,
    scanner_version VARCHAR(20) NOT NULL,
    scan_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scan_duration_ms INT NULL,
    
    -- Security results
    security_score INT NOT NULL CHECK (security_score >= 0 AND security_score <= 100),
    threat_level VARCHAR(50) NOT NULL CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('clean', 'warning', 'threat', 'error')),
    
    -- Threat detection
    threats_found JSONB DEFAULT '[]',
    malware_detected BOOLEAN DEFAULT FALSE,
    suspicious_code BOOLEAN DEFAULT FALSE,
    
    -- Compliance checks
    gdpr_compliant BOOLEAN NULL,
    accessibility_compliant BOOLEAN NULL,
    seo_compliant BOOLEAN NULL,
    
    -- Security headers
    security_headers JSONB DEFAULT '{}',
    ssl_certificate JSONB DEFAULT '{}',
    
    -- Content security
    content_security_policy JSONB DEFAULT '{}',
    xss_protection BOOLEAN NULL,
    clickjacking_protection BOOLEAN NULL,
    
    -- Privacy & Data Protection
    privacy_policy_present BOOLEAN NULL,
    cookie_consent_present BOOLEAN NULL,
    data_collection_compliant BOOLEAN NULL,
    
    -- Recommendations
    security_recommendations JSONB DEFAULT '[]',
    compliance_recommendations JSONB DEFAULT '[]',
    
    -- Remediation
    auto_fix_available BOOLEAN DEFAULT FALSE,
    auto_fix_applied BOOLEAN DEFAULT FALSE,
    manual_review_required BOOLEAN DEFAULT FALSE,
    
    -- Scan context
    scan_context JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_homepage_security_tenant ON homepage_security_scans(tenant_id);
CREATE INDEX idx_homepage_security_page ON homepage_security_scans(page_id);
CREATE INDEX idx_homepage_security_type ON homepage_security_scans(scan_type);
CREATE INDEX idx_homepage_security_score ON homepage_security_scans(security_score);
CREATE INDEX idx_homepage_security_threat ON homepage_security_scans(threat_level);
CREATE INDEX idx_homepage_security_timestamp ON homepage_security_scans(scan_timestamp);

ALTER TABLE homepage_security_scans ADD CONSTRAINT fk_homepage_security_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE;
ALTER TABLE homepage_security_scans ADD CONSTRAINT fk_homepage_security_page 
    FOREIGN KEY (page_id) REFERENCES pages(uuid) ON DELETE CASCADE;
```

#### Table 21: `homepage_analytics`

Comprehensive analytics dan performance monitoring untuk homepage.

```sql
CREATE TABLE homepage_analytics (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    page_id UUID NOT NULL,
    
    -- Analytics metadata
    analytics_date DATE NOT NULL,
    analytics_hour SMALLINT NULL CHECK (analytics_hour >= 0 AND analytics_hour <= 23),
    data_source VARCHAR(100) NOT NULL,
    
    -- Traffic metrics
    page_views BIGINT DEFAULT 0,
    unique_visitors BIGINT DEFAULT 0,
    returning_visitors BIGINT DEFAULT 0,
    bounce_rate DECIMAL(5,2) NULL,
    
    -- Engagement metrics
    avg_time_on_page INT NULL, -- seconds
    scroll_depth_avg DECIMAL(5,2) NULL, -- percentage
    click_through_rate DECIMAL(5,2) NULL,
    
    -- Conversion metrics
    conversions INT DEFAULT 0,
    conversion_rate DECIMAL(5,2) NULL,
    goal_completions JSONB DEFAULT '{}',
    
    -- Performance metrics
    page_load_time_avg INT NULL, -- milliseconds
    first_contentful_paint_avg INT NULL,
    largest_contentful_paint_avg INT NULL,
    cumulative_layout_shift_avg DECIMAL(4,3) NULL,
    
    -- Core Web Vitals
    core_web_vitals_score INT NULL CHECK (core_web_vitals_score >= 0 AND core_web_vitals_score <= 100),
    lcp_score INT NULL, -- Largest Contentful Paint
    fid_score INT NULL, -- First Input Delay
    cls_score INT NULL, -- Cumulative Layout Shift
    
    -- User behavior
    top_exit_sections JSONB DEFAULT '[]',
    most_clicked_elements JSONB DEFAULT '[]',
    heatmap_data JSONB DEFAULT '{}',
    
    -- Device & Browser
    device_breakdown JSONB DEFAULT '{}',
    browser_breakdown JSONB DEFAULT '{}',
    os_breakdown JSONB DEFAULT '{}',
    
    -- Geographic data
    country_breakdown JSONB DEFAULT '{}',
    city_breakdown JSONB DEFAULT '{}',
    
    -- Traffic sources
    traffic_sources JSONB DEFAULT '{}',
    referrer_breakdown JSONB DEFAULT '{}',
    search_keywords JSONB DEFAULT '[]',
    
    -- A/B Testing
    ab_test_id UUID NULL,
    variant_name VARCHAR(100) NULL,
    
    -- Business metrics
    lead_generation INT DEFAULT 0,
    contact_form_submissions INT DEFAULT 0,
    phone_calls INT DEFAULT 0,
    email_clicks INT DEFAULT 0,
    
    -- ROI calculations
    estimated_revenue DECIMAL(12,2) NULL,
    cost_per_visitor DECIMAL(8,2) NULL,
    return_on_investment DECIMAL(8,2) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, page_id, analytics_date, analytics_hour, data_source)
);

CREATE INDEX idx_homepage_analytics_tenant ON homepage_analytics(tenant_id);
CREATE INDEX idx_homepage_analytics_page ON homepage_analytics(page_id);
CREATE INDEX idx_homepage_analytics_date ON homepage_analytics(analytics_date);
CREATE INDEX idx_homepage_analytics_source ON homepage_analytics(data_source);
CREATE INDEX idx_homepage_analytics_views ON homepage_analytics(page_views);
CREATE INDEX idx_homepage_analytics_conversions ON homepage_analytics(conversion_rate);
CREATE INDEX idx_homepage_analytics_performance ON homepage_analytics(core_web_vitals_score);

ALTER TABLE homepage_analytics ADD CONSTRAINT fk_homepage_analytics_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE;
ALTER TABLE homepage_analytics ADD CONSTRAINT fk_homepage_analytics_page 
    FOREIGN KEY (page_id) REFERENCES pages(uuid) ON DELETE CASCADE;
```

#### Table 22: `homepage_import_export`

Import/export operations untuk homepage configurations dan content migration.

```sql
CREATE TABLE homepage_import_export (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Operation metadata
    operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN ('import', 'export', 'backup', 'restore', 'migration')),
    operation_status VARCHAR(50) DEFAULT 'pending' CHECK (operation_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- Source & destination
    source_type VARCHAR(100) NULL,
    source_identifier VARCHAR(500) NULL,
    destination_type VARCHAR(100) NULL,
    destination_identifier VARCHAR(500) NULL,
    
    -- File information
    file_name VARCHAR(255) NULL,
    file_path VARCHAR(500) NULL,
    file_size BIGINT NULL,
    file_format VARCHAR(50) NULL,
    file_hash VARCHAR(128) NULL,
    
    -- Operation details
    pages_processed INT DEFAULT 0,
    sections_processed INT DEFAULT 0,
    templates_processed INT DEFAULT 0,
    
    -- Progress tracking
    total_items INT NULL,
    processed_items INT DEFAULT 0,
    failed_items INT DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Results
    operation_results JSONB DEFAULT '{}',
    error_log JSONB DEFAULT '[]',
    warnings JSONB DEFAULT '[]',
    
    -- Validation
    validation_results JSONB DEFAULT '{}',
    data_integrity_check BOOLEAN DEFAULT FALSE,
    
    -- Scheduling
    scheduled_at TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    -- Configuration
    import_options JSONB DEFAULT '{}',
    export_options JSONB DEFAULT '{}',
    
    -- Backup specific
    backup_type VARCHAR(50) NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
    retention_days INT NULL,
    
    -- Migration specific
    source_tenant_id UUID NULL,
    migration_mapping JSONB DEFAULT '{}',
    
    -- User context
    initiated_by UUID NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_homepage_import_export_tenant ON homepage_import_export(tenant_id);
CREATE INDEX idx_homepage_import_export_type ON homepage_import_export(operation_type);
CREATE INDEX idx_homepage_import_export_status ON homepage_import_export(operation_status);
CREATE INDEX idx_homepage_import_export_scheduled ON homepage_import_export(scheduled_at);
CREATE INDEX idx_homepage_import_export_user ON homepage_import_export(initiated_by);

ALTER TABLE homepage_import_export ADD CONSTRAINT fk_homepage_import_export_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE;
ALTER TABLE homepage_import_export ADD CONSTRAINT fk_homepage_import_export_user 
    FOREIGN KEY (initiated_by) REFERENCES users(uuid) ON DELETE SET NULL;
```

#### Table 23: `homepage_version_history`

Git-like version control untuk homepage changes dengan collaborative features.

```sql
CREATE TABLE homepage_version_history (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    page_id UUID NOT NULL,
    
    -- Version metadata
    version_number VARCHAR(50) NOT NULL,
    version_type VARCHAR(50) DEFAULT 'minor' CHECK (version_type IN ('major', 'minor', 'patch', 'hotfix')),
    commit_hash VARCHAR(64) NOT NULL UNIQUE,
    
    -- Change information
    change_summary VARCHAR(500) NOT NULL,
    change_description TEXT NULL,
    change_type VARCHAR(100) NOT NULL,
    
    -- Content snapshot
    page_content JSONB NOT NULL,
    sections_content JSONB NOT NULL,
    
    -- Diff information
    changes_made JSONB DEFAULT '[]',
    files_changed JSONB DEFAULT '[]',
    lines_added INT DEFAULT 0,
    lines_removed INT DEFAULT 0,
    
    -- Approval workflow
    approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
    approved_by UUID NULL,
    approved_at TIMESTAMP NULL,
    approval_notes TEXT NULL,
    
    -- Deployment
    deployment_status VARCHAR(50) DEFAULT 'draft' CHECK (deployment_status IN ('draft', 'staged', 'deployed', 'rolled_back')),
    deployed_at TIMESTAMP NULL,
    rollback_reason TEXT NULL,
    
    -- Collaboration
    branch_name VARCHAR(100) DEFAULT 'main',
    parent_version_id UUID NULL,
    merge_conflicts JSONB DEFAULT '[]',
    
    -- Tags & Labels
    tags JSONB DEFAULT '[]',
    labels JSONB DEFAULT '[]',
    
    -- Performance impact
    performance_impact VARCHAR(50) NULL CHECK (performance_impact IN ('positive', 'neutral', 'negative')),
    performance_notes TEXT NULL,
    
    -- Backup & Recovery
    backup_created BOOLEAN DEFAULT FALSE,
    backup_location VARCHAR(500) NULL,
    recovery_point BOOLEAN DEFAULT FALSE,
    
    -- User context
    created_by UUID NOT NULL,
    updated_by UUID NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, page_id, version_number)
);

CREATE INDEX idx_homepage_version_tenant ON homepage_version_history(tenant_id);
CREATE INDEX idx_homepage_version_page ON homepage_version_history(page_id);
CREATE INDEX idx_homepage_version_number ON homepage_version_history(version_number);
CREATE INDEX idx_homepage_version_hash ON homepage_version_history(commit_hash);
CREATE INDEX idx_homepage_version_status ON homepage_version_history(approval_status);
CREATE INDEX idx_homepage_version_deployment ON homepage_version_history(deployment_status);
CREATE INDEX idx_homepage_version_branch ON homepage_version_history(branch_name);
CREATE INDEX idx_homepage_version_created ON homepage_version_history(created_at);

ALTER TABLE homepage_version_history ADD CONSTRAINT fk_homepage_version_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE;
ALTER TABLE homepage_version_history ADD CONSTRAINT fk_homepage_version_page 
    FOREIGN KEY (page_id) REFERENCES pages(uuid) ON DELETE CASCADE;
ALTER TABLE homepage_version_history ADD CONSTRAINT fk_homepage_version_parent 
    FOREIGN KEY (parent_version_id) REFERENCES homepage_version_history(uuid) ON DELETE SET NULL;
ALTER TABLE homepage_version_history ADD CONSTRAINT fk_homepage_version_creator 
    FOREIGN KEY (created_by) REFERENCES users(uuid) ON DELETE SET NULL;
ALTER TABLE homepage_version_history ADD CONSTRAINT fk_homepage_version_approver 
    FOREIGN KEY (approved_by) REFERENCES users(uuid) ON DELETE SET NULL;
```

#### Table 24: `homepage_ab_tests`

A/B testing system untuk homepage optimization dan conversion improvement.

```sql
CREATE TABLE homepage_ab_tests (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    page_id UUID NOT NULL,
    
    -- Test metadata
    test_name VARCHAR(255) NOT NULL,
    test_description TEXT NULL,
    test_hypothesis TEXT NULL,
    
    -- Test configuration
    test_type VARCHAR(50) DEFAULT 'ab' CHECK (test_type IN ('ab', 'multivariate', 'split_url')),
    test_status VARCHAR(50) DEFAULT 'draft' CHECK (test_status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),
    
    -- Variants
    control_variant JSONB NOT NULL,
    test_variants JSONB NOT NULL,
    traffic_allocation JSONB NOT NULL,
    
    -- Targeting
    audience_targeting JSONB DEFAULT '{}',
    device_targeting JSONB DEFAULT '{}',
    geographic_targeting JSONB DEFAULT '{}',
    
    -- Goals & Metrics
    primary_goal VARCHAR(100) NOT NULL,
    secondary_goals JSONB DEFAULT '[]',
    success_metrics JSONB NOT NULL,
    
    -- Test duration
    start_date TIMESTAMP NULL,
    end_date TIMESTAMP NULL,
    min_sample_size INT NULL,
    confidence_level DECIMAL(4,2) DEFAULT 95.00,
    
    -- Results
    total_visitors BIGINT DEFAULT 0,
    total_conversions BIGINT DEFAULT 0,
    variant_results JSONB DEFAULT '{}',
    
    -- Statistical analysis
    statistical_significance BOOLEAN DEFAULT FALSE,
    confidence_interval JSONB DEFAULT '{}',
    p_value DECIMAL(10,8) NULL,
    
    -- Winner determination
    winning_variant VARCHAR(100) NULL,
    winner_declared_at TIMESTAMP NULL,
    improvement_percentage DECIMAL(8,2) NULL,
    
    -- Implementation
    auto_implement_winner BOOLEAN DEFAULT FALSE,
    implemented_at TIMESTAMP NULL,
    implementation_notes TEXT NULL,
    
    -- Quality assurance
    quality_score INT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
    data_quality_issues JSONB DEFAULT '[]',
    
    -- Collaboration
    test_owner UUID NOT NULL,
    stakeholders JSONB DEFAULT '[]',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, page_id, test_name)
);

CREATE INDEX idx_homepage_ab_tests_tenant ON homepage_ab_tests(tenant_id);
CREATE INDEX idx_homepage_ab_tests_page ON homepage_ab_tests(page_id);
CREATE INDEX idx_homepage_ab_tests_status ON homepage_ab_tests(test_status);
CREATE INDEX idx_homepage_ab_tests_dates ON homepage_ab_tests(start_date, end_date);
CREATE INDEX idx_homepage_ab_tests_owner ON homepage_ab_tests(test_owner);

ALTER TABLE homepage_ab_tests ADD CONSTRAINT fk_homepage_ab_tests_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE;
ALTER TABLE homepage_ab_tests ADD CONSTRAINT fk_homepage_ab_tests_page 
    FOREIGN KEY (page_id) REFERENCES pages(uuid) ON DELETE CASCADE;
ALTER TABLE homepage_ab_tests ADD CONSTRAINT fk_homepage_ab_tests_owner 
    FOREIGN KEY (test_owner) REFERENCES users(uuid) ON DELETE SET NULL;
```

---

## API ENDPOINTS

### Public Endpoints

#### Get Homepage Content

```http
GET /api/v1/pages/home
```

**Response:**
```json
{
  "success": true,
  "data": {
    "page": {
      "id": 1,
      "slug": "home",
      "title": "Home Page",
      "publishStatus": "published",
      "publishedAt": "2025-01-01T00:00:00Z"
    },
    "sections": {
      "hero": {
        "typingTexts": ["Welcome", "Discover", "Experience"],
        "subtitle": "Your trusted partner in quality products",
        "carouselImages": [
          {
            "id": 1,
            "imageUrl": "/images/hero/slide1.jpg",
            "altText": "Hero slide 1",
            "displayOrder": 1
          },
          {
            "id": 2,
            "imageUrl": "/images/hero/slide2.jpg",
            "altText": "Hero slide 2",
            "displayOrder": 2
          }
        ],
        "carouselSettings": {
          "autoplayInterval": 5000,
          "showPauseButton": true
        },
        "buttons": {
          "primary": {
            "text": "Get Started",
            "link": "/products"
          },
          "secondary": {
            "text": "Learn More",
            "link": "/about"
          }
        }
      },
      "socialProof": {
        "enabled": true,
        "title": "Trusted by Thousands",
        "subtitle": "Our achievements speak for themselves",
        "stats": [
          {
            "id": 1,
            "iconName": "Users",
            "value": "2000+",
            "label": "Happy Clients",
            "colorClass": "text-blue-500"
          },
          {
            "id": 2,
            "iconName": "Award",
            "value": "15+",
            "label": "Years Experience",
            "colorClass": "text-green-500"
          }
        ]
      },
      "process": {
        "enabled": true,
        "title": "Our Process",
        "subtitle": "Simple and effective workflow",
        "steps": [
          {
            "id": 1,
            "stepNumber": 1,
            "iconName": "FileText",
            "title": "Consultation",
            "description": "We discuss your needs and requirements"
          },
          {
            "id": 2,
            "stepNumber": 2,
            "iconName": "Zap",
            "title": "Design",
            "description": "Create custom design based on your needs"
          }
        ]
      },
      "whyChooseUs": {
        "enabled": true,
        "title": "Why Choose Us",
        "subtitle": "What makes us different from others",
        "features": [
          {
            "id": 1,
            "featureNumber": 1,
            "title": "Quality Assured",
            "description": "Premium quality in every product",
            "colorTheme": "blue"
          }
        ]
      },
      "achievements": {
        "enabled": true,
        "title": "Our Achievements",
        "items": [
          {
            "id": 1,
            "achievementNumber": 1,
            "iconName": "Award",
            "title": "ISO 9001:2015 Certified",
            "description": "International quality management standard",
            "colorTheme": "gold"
          }
        ]
      },
      "services": {
        "enabled": true,
        "title": "Our Services",
        "subtitle": "Comprehensive solutions for your needs",
        "items": [
          {
            "id": 1,
            "serviceNumber": 1,
            "iconName": "Package",
            "title": "Laser Etching",
            "description": "Precision laser etching service"
          }
        ]
      },
      "testimonials": {
        "enabled": true,
        "title": "Client Testimonials",
        "subtitle": "What our clients say about us",
        "items": [
          {
            "id": 1,
            "testimonialNumber": 1,
            "customerName": "John Doe",
            "customerRole": "CEO",
            "customerCompany": "Tech Corp Indonesia",
            "rating": 5,
            "imageUrl": "/images/testimonials/john.jpg",
            "testimonialContent": "Excellent service and quality products!",
            "isFeatured": true
          }
        ]
      },
      "cta": {
        "primary": {
          "title": "Ready to Get Started?",
          "subtitle": "Contact us today for a free consultation",
          "buttonText": "Contact Us",
          "buttonLink": "/contact",
          "secondaryButtonText": "View Portfolio",
          "secondaryButtonLink": "/products"
        },
        "secondary": {
          "title": "Need Help?",
          "subtitle": "Our team is here to assist you",
          "buttonText": "Chat with Us",
          "buttonLink": "/chat"
        }
      }
    },
    "seo": {
      "title": "Home - Stencil CMS",
      "metaDescription": "Welcome to Stencil CMS - Your trusted partner",
      "metaKeywords": ["cms", "etching", "laser", "quality"],
      "imageUrl": "/images/og-home.jpg",
      "metaTags": {
        "og:type": "website",
        "og:locale": "id_ID"
      }
    }
  }
}
```

---

### Admin Endpoints

#### Update Hero Section

```http
POST /api/v1/admin/pages/home/hero
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "typingTexts": ["Welcome to Our Site", "Quality Products", "Fast Service"],
  "subtitle": "Your trusted partner in business",
  "buttons": {
    "primary": {
      "text": "Get Started",
      "link": "/products"
    },
    "secondary": {
      "text": "Learn More",
      "link": "/about"
    }
  },
  "carouselSettings": {
    "autoplayInterval": 5000,
    "showPauseButton": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hero section updated successfully",
  "data": {
    "id": 1,
    "typingTexts": ["Welcome to Our Site", "Quality Products", "Fast Service"],
    "subtitle": "Your trusted partner in business"
  }
}
```

#### Add Carousel Image

```http
POST /api/v1/admin/pages/home/hero/images
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "imageUrl": "/uploads/hero/new-image.jpg",
  "altText": "New hero image",
  "displayOrder": 3
}
```

#### Update Carousel Image

```http
PUT /api/v1/admin/pages/home/hero/images/{id}
Authorization: Bearer {token}
```

#### Delete Carousel Image

```http
DELETE /api/v1/admin/pages/home/hero/images/{id}
Authorization: Bearer {token}
```

#### Update Social Proof Section

```http
POST /api/v1/admin/pages/home/social-proof
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "enabled": true,
  "title": "Trusted by Thousands",
  "subtitle": "Our numbers speak for themselves",
  "stats": [
    {
      "iconName": "Users",
      "value": "2000+",
      "label": "Happy Clients",
      "colorClass": "text-blue-500"
    },
    {
      "iconName": "Award",
      "value": "15+",
      "label": "Years Experience",
      "colorClass": "text-green-500"
    },
    {
      "iconName": "ThumbsUp",
      "value": "99%",
      "label": "Satisfaction Rate",
      "colorClass": "text-orange-500"
    }
  ]
}
```

#### Update Process Section

```http
POST /api/v1/admin/pages/home/process
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "How We Work",
  "subtitle": "Our simple and effective process",
  "steps": [
    {
      "stepNumber": 1,
      "iconName": "FileText",
      "title": "Consultation",
      "description": "We discuss your requirements"
    },
    {
      "stepNumber": 2,
      "iconName": "Pencil",
      "title": "Design",
      "description": "Create custom design"
    },
    {
      "stepNumber": 3,
      "iconName": "Zap",
      "title": "Production",
      "description": "High-quality manufacturing"
    },
    {
      "stepNumber": 4,
      "iconName": "CheckCircle",
      "title": "Delivery",
      "description": "Fast and secure delivery"
    }
  ]
}
```

#### Update Why Choose Us Section

```http
POST /api/v1/admin/pages/home/why-choose-us
Authorization: Bearer {token}
```

#### Update Achievements Section

```http
POST /api/v1/admin/pages/home/achievements
Authorization: Bearer {token}
```

#### Update Services Section

```http
POST /api/v1/admin/pages/home/services
Authorization: Bearer {token}
```

#### Update Testimonials Section

```http
POST /api/v1/admin/pages/home/testimonials
Authorization: Bearer {token}
```

#### Update CTA Sections

```http
POST /api/v1/admin/pages/home/cta
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "primary": {
    "title": "Ready to Start Your Project?",
    "subtitle": "Contact us for a free consultation",
    "buttonText": "Contact Us Now",
    "buttonLink": "/contact",
    "secondaryButtonText": "View Our Work",
    "secondaryButtonLink": "/portfolio"
  },
  "secondary": {
    "title": "Have Questions?",
    "subtitle": "Our support team is ready to help",
    "buttonText": "Chat with Us",
    "buttonLink": "/support"
  }
}
```

---

## ADVANCED HOMEPAGE FEATURES

### Homepage Templates System

Enterprise-grade template management untuk rapid homepage deployment dan customization.

#### **Template Categories**

1. **Business Type Templates**
   - **Manufacturing**: Industrial design dengan process showcase
   - **Etching Services**: Specialized untuk custom etching businesses
   - **Professional Services**: Clean, corporate design
   - **E-commerce**: Product-focused dengan conversion optimization
   - **Portfolio**: Creative showcase dengan visual emphasis

2. **Industry-Specific Templates**
   - **Custom Etching**: PT CEX optimized template
   - **Metal Fabrication**: Industrial manufacturing focus
   - **Glass Etching**: Artistic and precision showcase
   - **Awards & Trophies**: Achievement-focused design
   - **Corporate Gifts**: B2B service presentation

#### **Template Features**

- **Visual Builder**: Drag-and-drop template customization
- **Version Control**: Template versioning dengan rollback
- **Preview System**: Real-time preview dengan device modes
- **Export/Import**: Template sharing across tenants
- **Marketplace Integration**: Community template sharing

### Content Validation Framework

Real-time content quality assurance dan compliance monitoring.

#### **Validation Types**

1. **SEO Validation**
   - Meta title optimization (50-60 characters)
   - Meta description quality (150-160 characters)
   - Header structure (H1, H2, H3 hierarchy)
   - Image alt text presence
   - Internal linking structure
   - Schema markup validation

2. **Accessibility Validation (WCAG 2.1)**
   - Color contrast ratios (AA/AAA compliance)
   - Keyboard navigation support
   - Screen reader compatibility
   - Focus indicators
   - Alternative text for images
   - Semantic HTML structure

3. **Performance Validation**
   - Core Web Vitals monitoring
   - Image optimization checks
   - CSS/JS minification
   - Lazy loading implementation
   - CDN usage optimization
   - Mobile performance scoring

4. **Content Quality**
   - Readability scoring (Flesch-Kincaid)
   - Grammar and spelling checks
   - Content length optimization
   - Call-to-action effectiveness
   - Brand consistency validation
   - Duplicate content detection

#### **Auto-Fix Capabilities**

- **Image Optimization**: Automatic compression dan format conversion
- **Meta Tag Generation**: AI-powered meta descriptions
- **Alt Text Generation**: AI-generated image descriptions
- **Schema Markup**: Automatic structured data injection
- **Performance Optimization**: CSS/JS minification

### Homepage Security & Compliance

Comprehensive security monitoring dan regulatory compliance.

#### **Security Scanning**

1. **Content Security**
   - Malware detection dalam uploaded content
   - XSS vulnerability scanning
   - SQL injection prevention
   - CSRF protection validation
   - Content Security Policy enforcement

2. **Privacy Compliance**
   - **GDPR Compliance**: Cookie consent, data collection audit
   - **CCPA Compliance**: California privacy law adherence
   - **SOC2 Type II**: Security controls validation
   - **ISO 27001**: Information security management

3. **Technical Security**
   - SSL certificate monitoring
   - Security headers validation
   - Clickjacking protection
   - Mixed content detection
   - Vulnerability scanning

#### **Compliance Reporting**

- **Automated Audits**: Scheduled compliance checks
- **Compliance Dashboard**: Real-time compliance status
- **Audit Trails**: Complete change history
- **Certification Support**: Documentation untuk compliance audits

### Homepage Analytics & Monitoring

Advanced analytics dan business intelligence untuk homepage optimization.

#### **Performance Metrics**

1. **Core Web Vitals**
   - **Largest Contentful Paint (LCP)**: Loading performance
   - **First Input Delay (FID)**: Interactivity measurement
   - **Cumulative Layout Shift (CLS)**: Visual stability

2. **User Engagement**
   - **Bounce Rate**: Single-page session percentage
   - **Time on Page**: Average session duration
   - **Scroll Depth**: Content consumption measurement
   - **Click-through Rates**: CTA effectiveness

3. **Conversion Analytics**
   - **Goal Completions**: Conversion funnel analysis
   - **Lead Generation**: Contact form submissions
   - **Revenue Attribution**: Sales tracking
   - **ROI Calculations**: Marketing effectiveness

#### **Business Intelligence**

- **Heatmap Analysis**: User interaction visualization
- **A/B Test Results**: Statistical significance testing
- **Cohort Analysis**: User behavior segmentation
- **Predictive Analytics**: Conversion probability scoring

### Import/Export Management

Enterprise data management untuk homepage configurations.

#### **Import Capabilities**

1. **Supported Formats**
   - **JSON**: Complete homepage configuration
   - **CSV**: Bulk content import (testimonials, stats)
   - **XML**: Structured data import
   - **WordPress**: Migration dari WordPress sites
   - **Webflow**: Design import dari Webflow

2. **Import Features**
   - **Data Validation**: Pre-import quality checks
   - **Conflict Resolution**: Duplicate content handling
   - **Progress Tracking**: Real-time import status
   - **Rollback Support**: Import reversal capability

#### **Export Capabilities**

1. **Export Options**
   - **Full Backup**: Complete homepage configuration
   - **Selective Export**: Specific sections only
   - **Template Export**: Reusable template creation
   - **Analytics Export**: Performance data export

2. **Scheduling**
   - **Automated Backups**: Daily/weekly/monthly schedules
   - **Retention Policies**: Automatic cleanup
   - **Cloud Storage**: AWS S3, Google Cloud integration

### Version Control System

Git-like version control untuk collaborative homepage management.

#### **Version Management**

1. **Branching Strategy**
   - **Main Branch**: Production homepage
   - **Development Branch**: Staging environment
   - **Feature Branches**: Specific feature development
   - **Hotfix Branches**: Emergency fixes

2. **Collaboration Features**
   - **Merge Requests**: Code review workflow
   - **Conflict Resolution**: Automated merge conflict handling
   - **Approval Workflows**: Multi-level content approval
   - **Change Tracking**: Detailed diff visualization

#### **Deployment Pipeline**

- **Staging Environment**: Pre-production testing
- **Blue-Green Deployment**: Zero-downtime updates
- **Rollback Capability**: Instant version reversal
- **Deployment Hooks**: Automated testing integration

### A/B Testing System

Statistical testing framework untuk conversion optimization.

#### **Test Types**

1. **A/B Tests**: Two-variant comparison
2. **Multivariate Tests**: Multiple element testing
3. **Split URL Tests**: Different page versions

#### **Statistical Analysis**

- **Confidence Intervals**: Statistical significance calculation
- **Sample Size Calculation**: Minimum visitor requirements
- **Winner Declaration**: Automated result determination
- **Performance Impact**: Conversion improvement measurement

---

## HOMEPAGE TEMPLATES SYSTEM

### Template Categories

#### **1. Etching Business Templates**

**PT CEX Optimized Template**
```json
{
  "templateId": "etching-professional-v1",
  "name": "Professional Etching Services",
  "category": "etching",
  "sections": {
    "hero": {
      "typingTexts": [
        "Precision Etching Services",
        "Custom Metal Engraving",
        "Quality Craftsmanship"
      ],
      "subtitle": "Transform your ideas into precision-etched reality",
      "primaryCTA": "Get Quote",
      "secondaryCTA": "View Portfolio"
    },
    "socialProof": {
      "stats": [
        {"icon": "Award", "value": "15+", "label": "Years Experience"},
        {"icon": "Users", "value": "2000+", "label": "Satisfied Clients"},
        {"icon": "CheckCircle", "value": "99%", "label": "Quality Rate"},
        {"icon": "Clock", "value": "24h", "label": "Fast Turnaround"}
      ]
    },
    "process": {
      "title": "Our Etching Process",
      "steps": [
        {
          "number": 1,
          "icon": "FileText",
          "title": "Consultation",
          "description": "Discuss your etching requirements and specifications"
        },
        {
          "number": 2,
          "icon": "Pencil",
          "title": "Design",
          "description": "Create precise design mockups and technical drawings"
        },
        {
          "number": 3,
          "icon": "Zap",
          "title": "Etching",
          "description": "Execute precision etching using advanced techniques"
        },
        {
          "number": 4,
          "icon": "Package",
          "title": "Delivery",
          "description": "Quality check and secure packaging for delivery"
        }
      ]
    }
  }
}
```

#### **2. Manufacturing Templates**

**Industrial Manufacturing Template**
- Heavy machinery imagery
- Process workflow emphasis
- Quality certifications showcase
- B2B focused messaging

#### **3. Professional Services Templates**

**Corporate Services Template**
- Clean, professional design
- Service portfolio emphasis
- Team showcase section
- Client testimonials focus

### Template Management API

#### **Browse Templates**

```http
GET /api/v1/admin/homepage/templates
Authorization: Bearer {token}
```

**Query Parameters:**
- `category`: Filter by template category
- `featured`: Show only featured templates
- `price`: Filter by price range (free, premium)
- `rating`: Minimum rating filter

#### **Install Template**

```http
POST /api/v1/admin/homepage/templates/{templateId}/install
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "customizations": {
    "colors": {
      "primary": "#1e40af",
      "secondary": "#059669"
    },
    "fonts": {
      "heading": "Inter",
      "body": "Open Sans"
    },
    "content": {
      "companyName": "PT Custom Etching Xenial",
      "tagline": "Precision Etching Excellence"
    }
  },
  "preserveExisting": false
}
```

---

## CONTENT VALIDATION FRAMEWORK

### Validation Rules Engine

#### **SEO Validation Rules**

```javascript
const seoValidationRules = {
  metaTitle: {
    required: true,
    minLength: 30,
    maxLength: 60,
    uniquePerPage: true,
    keywordDensity: { min: 1, max: 3 }
  },
  metaDescription: {
    required: true,
    minLength: 120,
    maxLength: 160,
    callToActionRequired: true
  },
  headingStructure: {
    h1Count: { min: 1, max: 1 },
    h2Count: { min: 2, max: 6 },
    hierarchyValid: true
  },
  imageOptimization: {
    altTextRequired: true,
    maxFileSize: "1MB",
    recommendedFormats: ["webp", "jpg", "png"]
  }
}
```

#### **Accessibility Validation Rules**

```javascript
const accessibilityRules = {
  colorContrast: {
    normalText: { ratio: 4.5, level: "AA" },
    largeText: { ratio: 3.0, level: "AA" },
    graphicalObjects: { ratio: 3.0, level: "AA" }
  },
  keyboardNavigation: {
    focusIndicators: true,
    tabOrder: "logical",
    skipLinks: true
  },
  screenReader: {
    semanticHTML: true,
    ariaLabels: true,
    headingStructure: true
  }
}
```

### Validation API Endpoints

#### **Run Validation**

```http
POST /api/v1/admin/homepage/validate
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "pageId": "uuid",
  "validationTypes": ["seo", "accessibility", "performance", "content"],
  "autoFix": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "validationId": "uuid",
    "overallScore": 87,
    "status": "warning",
    "results": {
      "seo": {
        "score": 92,
        "issues": [
          {
            "type": "warning",
            "rule": "meta_description_length",
            "message": "Meta description is 165 characters (recommended: 150-160)",
            "element": "meta[name='description']",
            "autoFixAvailable": true
          }
        ]
      },
      "accessibility": {
        "score": 85,
        "wcagLevel": "AA",
        "issues": [
          {
            "type": "error",
            "rule": "color_contrast",
            "message": "Text color contrast ratio is 3.2:1 (minimum: 4.5:1)",
            "element": ".hero-subtitle",
            "autoFixAvailable": true,
            "suggestedFix": "Change text color to #2563eb"
          }
        ]
      }
    }
  }
}
```

---

## HOMEPAGE SECURITY & COMPLIANCE

### Security Scanning Engine

#### **Content Security Scanning**

```javascript
const securityScans = {
  malwareDetection: {
    scanTypes: ["virus", "trojan", "malware", "suspicious_code"],
    engines: ["clamav", "virustotal", "custom"],
    quarantineThreshold: "medium"
  },
  vulnerabilityScanning: {
    xssProtection: true,
    sqlInjectionPrevention: true,
    csrfProtection: true,
    clickjackingPrevention: true
  },
  contentIntegrity: {
    hashVerification: true,
    digitalSignatures: true,
    tamperDetection: true
  }
}
```

#### **Privacy Compliance Monitoring**

```javascript
const complianceRules = {
  gdpr: {
    cookieConsent: {
      required: true,
      categories: ["necessary", "analytics", "marketing"],
      granularControl: true
    },
    dataCollection: {
      lawfulBasis: "required",
      purposeLimitation: true,
      dataMinimization: true,
      transparencyRequired: true
    }
  },
  ccpa: {
    privacyNotice: true,
    optOutRights: true,
    dataCategories: "disclosed",
    thirdPartySharing: "disclosed"
  }
}
```

### Security API Endpoints

#### **Run Security Scan**

```http
POST /api/v1/admin/homepage/security/scan
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "pageId": "uuid",
  "scanTypes": ["malware", "vulnerability", "compliance"],
  "deepScan": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scanId": "uuid",
    "securityScore": 94,
    "threatLevel": "low",
    "status": "clean",
    "results": {
      "malware": {
        "detected": false,
        "scannedFiles": 45,
        "cleanFiles": 45,
        "quarantinedFiles": 0
      },
      "compliance": {
        "gdprCompliant": true,
        "ccpaCompliant": true,
        "cookieConsentPresent": true,
        "privacyPolicyPresent": true
      }
    }
  }
}
```

---

## HOMEPAGE ANALYTICS & MONITORING

### Analytics Data Collection

#### **Performance Metrics Collection**

```javascript
const performanceMetrics = {
  coreWebVitals: {
    lcp: { threshold: 2500, unit: "ms" }, // Largest Contentful Paint
    fid: { threshold: 100, unit: "ms" },  // First Input Delay
    cls: { threshold: 0.1, unit: "score" } // Cumulative Layout Shift
  },
  customMetrics: {
    timeToInteractive: { threshold: 3000, unit: "ms" },
    firstContentfulPaint: { threshold: 1500, unit: "ms" },
    speedIndex: { threshold: 3000, unit: "ms" }
  }
}
```

#### **User Behavior Tracking**

```javascript
const behaviorTracking = {
  engagement: {
    scrollDepth: { intervals: [25, 50, 75, 100] },
    timeOnPage: { buckets: ["0-30s", "30s-1m", "1m-3m", "3m+"] },
    clickTracking: { elements: ["cta", "navigation", "social"] }
  },
  conversion: {
    goals: ["contact_form", "phone_call", "email_click", "quote_request"],
    funnels: ["awareness", "interest", "consideration", "conversion"]
  }
}
```

### Analytics API Endpoints

#### **Get Analytics Dashboard**

```http
GET /api/v1/admin/homepage/analytics/dashboard
Authorization: Bearer {token}
```

**Query Parameters:**
- `dateRange`: Date range for analytics (7d, 30d, 90d, 1y)
- `metrics`: Specific metrics to include
- `segment`: User segment filter

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "pageViews": 15420,
      "uniqueVisitors": 8930,
      "bounceRate": 34.2,
      "avgTimeOnPage": 142,
      "conversionRate": 3.8
    },
    "coreWebVitals": {
      "lcp": { "value": 2.1, "score": 92, "status": "good" },
      "fid": { "value": 85, "score": 95, "status": "good" },
      "cls": { "value": 0.08, "score": 88, "status": "good" }
    },
    "conversions": {
      "total": 339,
      "byGoal": {
        "contact_form": 156,
        "phone_call": 89,
        "email_click": 67,
        "quote_request": 27
      }
    },
    "businessMetrics": {
      "estimatedRevenue": 45600.00,
      "costPerVisitor": 2.35,
      "returnOnInvestment": 285.4
    }
  }
}
```

---

## VALIDATION RULES

### Hero Section
```
typingTexts: required|array|min:1|max:10
typingTexts.*: required|string|max:100
subtitle: nullable|string|max:500
primary_button_text: nullable|string|max:50
primary_button_link: nullable|string|max:255
carousel_autoplay_interval: integer|min:1000|max:30000
```

### Social Proof Stats
```
icon_name: required|string|max:100
stat_value: required|string|max:50
stat_label: required|string|max:100
color_class: nullable|string|max:100
```

### Process Steps
```
step_number: required|integer|min:1
icon_name: required|string|max:100
title: required|string|max:255
description: nullable|string|max:1000
```

### Testimonials
```
customer_name: required|string|max:255
rating: required|integer|min:1|max:5
testimonial_content: required|string|min:10|max:1000
image_url: nullable|url|max:500
```

---

## BUSINESS RULES

1. **Hero carousel** harus memiliki minimal 1 gambar
2. **Typing texts** maksimal 10 item untuk performa optimal
3. **Rating testimonial** hanya 1-5 bintang
4. **Display order** dimulai dari 0, digunakan untuk sorting
5. **Section enable/disable** mempengaruhi tampilan di frontend
6. **CTA sections** ada 2 tipe: primary (di tengah) dan secondary (di akhir)
7. **Multi-tenant isolation** - All homepage content strictly scoped to tenant
8. **Version control** - All changes tracked dengan approval workflow
9. **Security compliance** - Regular security scans dan compliance monitoring
10. **Performance optimization** - Core Web Vitals monitoring dan optimization

---

## RBAC INTEGRATION

### Permission-Based Access Control

Homepage management menggunakan **granular permission system** yang terintegrasi dengan multi-tenant RBAC architecture.

#### **Standard Permissions**

| Permission | Description | Scope | Required Role |
|------------|-------------|-------|---------------|
| `homepage.view` | View homepage content dan configurations | Tenant | Viewer+ |
| `homepage.create` | Create new homepage sections dan templates | Tenant | Editor+ |
| `homepage.edit` | Modify homepage content dan settings | Tenant | Editor+ |
| `homepage.delete` | Delete homepage sections dan templates | Tenant | Manager+ |
| `homepage.manage` | Full homepage lifecycle management | Tenant | Admin+ |
| `homepage.admin` | Access advanced homepage management features | Tenant | Admin+ |
| `homepage.template` | Manage homepage templates dan presets | Tenant | Manager+ |
| `homepage.import` | Import homepage configurations | Tenant | Manager+ |
| `homepage.export` | Export homepage configurations | Tenant | Editor+ |
| `homepage.analytics` | Access homepage analytics dan performance data | Tenant | Manager+ |

#### **Role-Based Access Examples**

**Business Owner Role:**
```json
{
  "permissions": [
    "homepage.view", "homepage.create", "homepage.edit", "homepage.delete",
    "homepage.manage", "homepage.admin", "homepage.template", 
    "homepage.import", "homepage.export", "homepage.analytics"
  ]
}
```

**Manager Role:**
```json
{
  "permissions": [
    "homepage.view", "homepage.create", "homepage.edit", "homepage.delete",
    "homepage.template", "homepage.import", "homepage.analytics"
  ]
}
```

**Editor Role:**
```json
{
  "permissions": [
    "homepage.view", "homepage.create", "homepage.edit", "homepage.export"
  ]
}
```

**Viewer Role:**
```json
{
  "permissions": ["homepage.view"]
}
```

### Permission Checking Implementation

#### **Frontend Permission Hooks**

```typescript
// React permission hooks
const { can, cannot } = usePermissions();

// Component-level permission checking
const HomepageEditor = () => {
  if (cannot('homepage.edit')) {
    return <AccessDenied />;
  }
  
  return (
    <div>
      {can('homepage.template') && <TemplateSelector />}
      {can('homepage.analytics') && <AnalyticsWidget />}
      {can('homepage.admin') && <AdvancedSettings />}
    </div>
  );
};
```

#### **API Permission Middleware**

```php
// Laravel middleware untuk homepage endpoints
Route::middleware(['auth:sanctum', 'tenant.context', 'permission:homepage.edit'])
    ->post('/api/v1/admin/homepage/sections', [HomepageController::class, 'updateSection']);

Route::middleware(['auth:sanctum', 'tenant.context', 'permission:homepage.analytics'])
    ->get('/api/v1/admin/homepage/analytics', [HomepageAnalyticsController::class, 'dashboard']);
```

---

## ADMIN UI FEATURES

### Homepage Management Dashboard

Comprehensive admin interface untuk homepage management dengan enterprise-grade features.

#### **Dashboard Overview**

**Main Dashboard Features:**
- **Homepage Health Score**: Overall homepage performance dan quality score
- **Real-time Analytics**: Live visitor count, conversion rates, performance metrics
- **Quick Actions**: One-click access to common homepage management tasks
- **Recent Changes**: Version history dengan diff visualization
- **Security Status**: Security scan results dan compliance status
- **Performance Alerts**: Core Web Vitals alerts dan optimization suggestions

#### **Section Management Interface**

**Visual Section Editor:**
```typescript
interface SectionEditorProps {
  section: HomepageSection;
  permissions: Permission[];
  onSave: (data: SectionData) => void;
  onPreview: () => void;
}

const SectionEditor = ({ section, permissions }: SectionEditorProps) => {
  return (
    <div className="section-editor">
      <SectionToolbar 
        canEdit={permissions.includes('homepage.edit')}
        canDelete={permissions.includes('homepage.delete')}
      />
      <SectionContent 
        editable={permissions.includes('homepage.edit')}
        section={section}
      />
      <SectionPreview 
        realTime={true}
        deviceModes={['desktop', 'tablet', 'mobile']}
      />
    </div>
  );
};
```

### Advanced Admin Features

#### **1. Homepage Templates Manager**

**Template Management Interface:**
- **Template Gallery**: Visual template browser dengan preview
- **Template Editor**: Drag-and-drop template customization
- **Template Marketplace**: Browse dan install community templates
- **Custom Template Creator**: Build templates dari scratch
- **Template Version Control**: Manage template versions dan rollbacks

**Template Installation Wizard:**
```typescript
const TemplateInstallWizard = () => {
  const steps = [
    'Select Template',
    'Customize Content', 
    'Configure Settings',
    'Preview & Confirm',
    'Install & Deploy'
  ];
  
  return <WizardInterface steps={steps} />;
};
```

#### **2. Content Validation Center**

**Validation Dashboard:**
- **Real-time Validation**: Live content quality monitoring
- **Validation History**: Track validation results over time
- **Auto-fix Suggestions**: AI-powered content improvements
- **Compliance Monitoring**: GDPR, accessibility, SEO compliance
- **Performance Optimization**: Core Web Vitals improvement suggestions

**Validation Interface:**
```typescript
const ValidationCenter = () => {
  return (
    <div className="validation-center">
      <ValidationOverview />
      <ValidationResults />
      <AutoFixSuggestions />
      <ComplianceStatus />
      <PerformanceMetrics />
    </div>
  );
};
```

#### **3. Homepage Security Center**

**Security Management Interface:**
- **Security Dashboard**: Real-time threat monitoring
- **Scan Results**: Detailed security scan reports
- **Compliance Status**: GDPR, SOC2, ISO 27001 compliance
- **Threat Alerts**: Real-time security notifications
- **Remediation Tools**: Automated security fix suggestions

#### **4. Analytics Dashboard**

**Advanced Analytics Interface:**
- **Performance Metrics**: Core Web Vitals, page speed, user engagement
- **Conversion Analytics**: Goal tracking, funnel analysis, ROI calculations
- **User Behavior**: Heatmaps, scroll depth, click tracking
- **A/B Test Results**: Statistical analysis, winner determination
- **Business Intelligence**: Revenue attribution, cost analysis

**Analytics Widgets:**
```typescript
const AnalyticsDashboard = () => {
  return (
    <DashboardGrid>
      <PerformanceWidget />
      <ConversionWidget />
      <UserBehaviorWidget />
      <ABTestWidget />
      <BusinessMetricsWidget />
    </DashboardGrid>
  );
};
```

#### **5. Import/Export Manager**

**Data Management Interface:**
- **Import Wizard**: Step-by-step import process dengan validation
- **Export Options**: Selective atau full homepage export
- **Backup Management**: Automated backup scheduling
- **Migration Tools**: Cross-tenant content migration
- **Progress Tracking**: Real-time import/export progress

#### **6. Version Control Interface**

**Git-like Version Management:**
- **Version History**: Complete change history dengan diff visualization
- **Branch Management**: Feature branches, merge requests
- **Approval Workflows**: Multi-level content approval
- **Rollback Interface**: One-click version rollback
- **Collaboration Tools**: Team collaboration features

**Version Control UI:**
```typescript
const VersionControlInterface = () => {
  return (
    <div className="version-control">
      <BranchSelector />
      <CommitHistory />
      <DiffViewer />
      <MergeRequestPanel />
      <ApprovalWorkflow />
    </div>
  );
};
```

#### **7. Configuration Editor**

**Advanced Settings Interface:**
- **Monaco Editor Integration**: Code editing dengan syntax highlighting
- **IntelliSense Support**: Auto-completion untuk configuration options
- **Schema Validation**: Real-time configuration validation
- **Environment Management**: Development, staging, production configs
- **Backup & Restore**: Configuration backup dan restore

### Mobile-Responsive Admin Interface

**Responsive Design Features:**
- **Mobile-First Design**: Optimized untuk mobile admin access
- **Touch-Friendly Interface**: Large touch targets, swipe gestures
- **Offline Capability**: Basic functionality available offline
- **Progressive Web App**: Installable admin interface
- **Push Notifications**: Real-time alerts untuk admin users

---

## EXPANDED API ENDPOINTS

### Core Homepage API (Enhanced)

#### **Homepage Management**

```http
# Get homepage with full configuration
GET /api/v1/admin/homepage
GET /api/v1/admin/homepage/{pageId}
POST /api/v1/admin/homepage
PUT /api/v1/admin/homepage/{pageId}
DELETE /api/v1/admin/homepage/{pageId}
PATCH /api/v1/admin/homepage/{pageId}/status
```

#### **Section Management (All Sections)**

```http
# Hero Section
GET /api/v1/admin/homepage/sections/hero
POST /api/v1/admin/homepage/sections/hero
PUT /api/v1/admin/homepage/sections/hero
DELETE /api/v1/admin/homepage/sections/hero

# Hero Images
GET /api/v1/admin/homepage/sections/hero/images
POST /api/v1/admin/homepage/sections/hero/images
PUT /api/v1/admin/homepage/sections/hero/images/{imageId}
DELETE /api/v1/admin/homepage/sections/hero/images/{imageId}

# Social Proof Section
GET /api/v1/admin/homepage/sections/social-proof
POST /api/v1/admin/homepage/sections/social-proof
PUT /api/v1/admin/homepage/sections/social-proof
DELETE /api/v1/admin/homepage/sections/social-proof

# Process Section
GET /api/v1/admin/homepage/sections/process
POST /api/v1/admin/homepage/sections/process
PUT /api/v1/admin/homepage/sections/process
DELETE /api/v1/admin/homepage/sections/process

# Why Choose Us Section
GET /api/v1/admin/homepage/sections/why-choose-us
POST /api/v1/admin/homepage/sections/why-choose-us
PUT /api/v1/admin/homepage/sections/why-choose-us
DELETE /api/v1/admin/homepage/sections/why-choose-us

# Achievements Section
GET /api/v1/admin/homepage/sections/achievements
POST /api/v1/admin/homepage/sections/achievements
PUT /api/v1/admin/homepage/sections/achievements
DELETE /api/v1/admin/homepage/sections/achievements

# Services Section
GET /api/v1/admin/homepage/sections/services
POST /api/v1/admin/homepage/sections/services
PUT /api/v1/admin/homepage/sections/services
DELETE /api/v1/admin/homepage/sections/services

# Testimonials Section
GET /api/v1/admin/homepage/sections/testimonials
POST /api/v1/admin/homepage/sections/testimonials
PUT /api/v1/admin/homepage/sections/testimonials
DELETE /api/v1/admin/homepage/sections/testimonials

# CTA Sections
GET /api/v1/admin/homepage/sections/cta
POST /api/v1/admin/homepage/sections/cta
PUT /api/v1/admin/homepage/sections/cta
DELETE /api/v1/admin/homepage/sections/cta
```

### Advanced Homepage API (NEW)

#### **Template Management API**

```http
# Browse Templates
GET /api/v1/admin/homepage/templates
GET /api/v1/admin/homepage/templates/{templateId}
GET /api/v1/admin/homepage/templates/categories
GET /api/v1/admin/homepage/templates/featured

# Template Operations
POST /api/v1/admin/homepage/templates/{templateId}/install
POST /api/v1/admin/homepage/templates/{templateId}/preview
POST /api/v1/admin/homepage/templates
PUT /api/v1/admin/homepage/templates/{templateId}
DELETE /api/v1/admin/homepage/templates/{templateId}

# Template Marketplace
GET /api/v1/admin/homepage/templates/marketplace
POST /api/v1/admin/homepage/templates/marketplace/purchase
GET /api/v1/admin/homepage/templates/marketplace/search
```

#### **Validation API**

```http
# Content Validation
POST /api/v1/admin/homepage/validate
GET /api/v1/admin/homepage/validate/{validationId}
GET /api/v1/admin/homepage/validate/history
POST /api/v1/admin/homepage/validate/auto-fix

# Validation Rules
GET /api/v1/admin/homepage/validation/rules
POST /api/v1/admin/homepage/validation/rules
PUT /api/v1/admin/homepage/validation/rules/{ruleId}
DELETE /api/v1/admin/homepage/validation/rules/{ruleId}
```

#### **Security API**

```http
# Security Scanning
POST /api/v1/admin/homepage/security/scan
GET /api/v1/admin/homepage/security/scan/{scanId}
GET /api/v1/admin/homepage/security/scan/history
GET /api/v1/admin/homepage/security/threats

# Compliance Monitoring
GET /api/v1/admin/homepage/security/compliance
GET /api/v1/admin/homepage/security/compliance/gdpr
GET /api/v1/admin/homepage/security/compliance/ccpa
POST /api/v1/admin/homepage/security/compliance/report
```

#### **Analytics API**

```http
# Analytics Dashboard
GET /api/v1/admin/homepage/analytics/dashboard
GET /api/v1/admin/homepage/analytics/performance
GET /api/v1/admin/homepage/analytics/conversions
GET /api/v1/admin/homepage/analytics/user-behavior

# Core Web Vitals
GET /api/v1/admin/homepage/analytics/core-web-vitals
GET /api/v1/admin/homepage/analytics/performance-history
POST /api/v1/admin/homepage/analytics/performance/optimize

# Business Intelligence
GET /api/v1/admin/homepage/analytics/business-metrics
GET /api/v1/admin/homepage/analytics/roi
GET /api/v1/admin/homepage/analytics/revenue-attribution
```

#### **Import/Export API**

```http
# Import Operations
POST /api/v1/admin/homepage/import
GET /api/v1/admin/homepage/import/{importId}/status
GET /api/v1/admin/homepage/import/history
POST /api/v1/admin/homepage/import/validate

# Export Operations
POST /api/v1/admin/homepage/export
GET /api/v1/admin/homepage/export/{exportId}/download
GET /api/v1/admin/homepage/export/history
DELETE /api/v1/admin/homepage/export/{exportId}

# Backup Management
GET /api/v1/admin/homepage/backups
POST /api/v1/admin/homepage/backups
GET /api/v1/admin/homepage/backups/{backupId}
POST /api/v1/admin/homepage/backups/{backupId}/restore
DELETE /api/v1/admin/homepage/backups/{backupId}
```

#### **Version Control API**

```http
# Version Management
GET /api/v1/admin/homepage/versions
GET /api/v1/admin/homepage/versions/{versionId}
POST /api/v1/admin/homepage/versions
DELETE /api/v1/admin/homepage/versions/{versionId}

# Version Operations
POST /api/v1/admin/homepage/versions/{versionId}/rollback
GET /api/v1/admin/homepage/versions/{versionId}/diff
POST /api/v1/admin/homepage/versions/{versionId}/approve
POST /api/v1/admin/homepage/versions/{versionId}/deploy

# Branch Management
GET /api/v1/admin/homepage/branches
POST /api/v1/admin/homepage/branches
GET /api/v1/admin/homepage/branches/{branchName}
POST /api/v1/admin/homepage/branches/{branchName}/merge
DELETE /api/v1/admin/homepage/branches/{branchName}
```

#### **A/B Testing API**

```http
# A/B Test Management
GET /api/v1/admin/homepage/ab-tests
POST /api/v1/admin/homepage/ab-tests
GET /api/v1/admin/homepage/ab-tests/{testId}
PUT /api/v1/admin/homepage/ab-tests/{testId}
DELETE /api/v1/admin/homepage/ab-tests/{testId}

# Test Operations
POST /api/v1/admin/homepage/ab-tests/{testId}/start
POST /api/v1/admin/homepage/ab-tests/{testId}/pause
POST /api/v1/admin/homepage/ab-tests/{testId}/stop
GET /api/v1/admin/homepage/ab-tests/{testId}/results
POST /api/v1/admin/homepage/ab-tests/{testId}/declare-winner
```

### Public API (Enhanced)

#### **Public Homepage Content**

```http
# Public Homepage Access
GET /api/v1/pages/home
GET /api/v1/pages/home/sections
GET /api/v1/pages/home/sections/{sectionType}

# SEO & Meta Data
GET /api/v1/pages/home/seo
GET /api/v1/pages/home/sitemap
GET /api/v1/pages/home/schema

# Performance Optimization
GET /api/v1/pages/home/optimized
GET /api/v1/pages/home/critical-css
GET /api/v1/pages/home/preload-resources
```

---

## BUSINESS CYCLE INTEGRATION

### Etching Business Workflow Integration

Homepage system terintegrasi dengan **custom etching business cycle** untuk mendukung complete customer journey.

#### **Customer Acquisition Integration**

**Homepage Sections → Business Stages:**

1. **Hero Section → Brand Awareness**
   - Showcase etching capabilities dengan high-quality imagery
   - Typing animation highlighting key services: "Precision Etching", "Custom Engraving", "Quality Craftsmanship"
   - Primary CTA: "Get Quote" → Direct ke order form
   - Secondary CTA: "View Portfolio" → Showcase previous work

2. **Social Proof → Trust Building**
   - Display customer testimonials dari satisfied etching clients
   - Statistics: "2000+ Projects Completed", "15+ Years Experience", "99% Quality Rate"
   - Industry certifications: ISO 9001, quality awards
   - Customer logos dari major clients

3. **Process Section → Service Understanding**
   - 4-step etching process: Consultation → Design → Etching → Delivery
   - Each step dengan detailed description dan expected timeline
   - Visual indicators untuk process complexity
   - Integration dengan order management system

#### **Lead Generation Integration**

**CTA Optimization untuk Etching Business:**

```json
{
  "primaryCTA": {
    "text": "Get Free Quote",
    "action": "redirect_to_quote_form",
    "tracking": "homepage_hero_quote",
    "leadSource": "homepage_primary_cta"
  },
  "secondaryCTA": {
    "text": "View Our Work",
    "action": "redirect_to_portfolio",
    "tracking": "homepage_hero_portfolio",
    "leadSource": "homepage_secondary_cta"
  },
  "contactCTA": {
    "text": "Call Now: +62-21-1234-5678",
    "action": "track_phone_call",
    "tracking": "homepage_phone_call",
    "leadSource": "homepage_phone_cta"
  }
}
```

#### **Conversion Tracking Integration**

**Business Metrics Tracking:**

```javascript
const etchingBusinessMetrics = {
  leadGeneration: {
    quoteRequests: "track_quote_form_submissions",
    phoneInquiries: "track_phone_calls",
    emailInquiries: "track_email_clicks",
    portfolioViews: "track_portfolio_engagement"
  },
  conversionFunnel: {
    awareness: "homepage_visits",
    interest: "section_engagement",
    consideration: "quote_requests",
    conversion: "order_placement"
  },
  businessValue: {
    averageOrderValue: "calculate_from_orders",
    customerLifetimeValue: "calculate_clv",
    costPerLead: "marketing_spend / leads",
    conversionRate: "orders / quote_requests"
  }
}
```

### Multi-Tenant Business Customization

#### **Industry-Specific Homepage Variants**

**PT CEX Etching Template:**
- **Hero Focus**: Precision etching capabilities
- **Services**: Laser etching, chemical etching, mechanical engraving
- **Portfolio**: Metal plaques, glass awards, corporate gifts
- **Process**: Consultation → Design → Production → Quality Check → Delivery

**Manufacturing Template:**
- **Hero Focus**: Industrial manufacturing capabilities
- **Services**: Custom fabrication, precision machining, assembly
- **Portfolio**: Industrial components, machinery parts
- **Process**: Requirements → Engineering → Production → Testing → Delivery

#### **Revenue Impact Tracking**

**Homepage Performance → Business Results:**

```json
{
  "revenueAttribution": {
    "homepageVisits": 15420,
    "quoteRequests": 339,
    "conversionRate": 2.2,
    "averageOrderValue": 2500000,
    "attributedRevenue": 847500000,
    "costPerVisitor": 2350,
    "returnOnInvestment": 285.4
  },
  "businessImpact": {
    "newCustomers": 156,
    "repeatCustomers": 89,
    "customerRetentionRate": 78.5,
    "averageProjectValue": 3200000,
    "totalBusinessValue": 1085600000
  }
}
```

---

**Previous:** [01-STANDARDS.md](./01-STANDARDS.md)  
**Next:** [03-ABOUT.md](./03-ABOUT.md)
