# GENERAL SETTINGS MODULE
## Database Schema & API Documentation

**Module:** Enterprise Settings Management & Configuration Platform  
**Total Fields:** 185+ fields  
**Total Tables:** 12 tables (site_settings, email_settings, payment_settings, analytics_settings, integration_settings, backup_settings, settings_templates, settings_validation_results, settings_security_scans, settings_analytics, settings_import_export, settings_version_history)  
**Admin Pages:** `src/pages/admin/Settings.tsx` (Implemented), `src/pages/admin/SettingsTemplates.tsx`, `src/pages/admin/SettingsAnalytics.tsx`, `src/pages/admin/SettingsImportExport.tsx`, `src/pages/admin/SettingsValidation.tsx`, `src/pages/admin/SettingsSecurity.tsx`, `src/pages/admin/SettingsVersionControl.tsx` (Planned)  
**Type Definition:** `src/types/settings.ts`  
**Status:** 🚧 PLANNED - Enterprise Architecture Blueprint (Enhanced from 6 to 12 tables)  
**Architecture Reference:** `docs/ARCHITECTURE/ADVANCED_SYSTEMS/1-MULTI_TENANT_ARCHITECTURE.md`, `docs/ARCHITECTURE/ADVANCED_SYSTEMS/2-RBAC_PERMISSION_SYSTEM.md`

---

## CORE IMMUTABLE RULES COMPLIANCE

### **Rule 1: Teams Enabled with tenant_id as team_foreign_key**
✅ **ENFORCED** - All settings tables include mandatory `tenant_id UUID NOT NULL` with foreign key constraints to `tenants(uuid)` table. Each tenant has isolated settings configuration.

### **Rule 2: API Guard Implementation**
✅ **ENFORCED** - All API endpoints include tenant-scoped access control. Settings can only be accessed and modified by authenticated users within the same tenant context.

### **Rule 3: UUID model_morph_key**
✅ **ENFORCED** - All settings tables use `uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid()` as the public identifier for external API references.

### **Rule 4: Strict Tenant Data Isolation**
✅ **ENFORCED** - No global settings with NULL tenant_id. Every configuration record is strictly scoped to a specific tenant. Cross-tenant data access is impossible at the database level.

### **Rule 5: RBAC Integration Requirements**
✅ **ENFORCED** - Settings management requires specific tenant-scoped permissions with standardized naming:
- `settings.view` - View tenant settings and configurations
- `settings.create` - Create new settings templates and configurations
- `settings.edit` - Modify tenant settings and configurations
- `settings.delete` - Delete settings templates and configurations
- `settings.manage` - Full settings lifecycle management
- `settings.admin` - Access advanced settings (payment, integrations, security)
- `settings.backup` - Manage backup configurations and restore operations
- `settings.template` - Manage settings templates and presets
- `settings.import` - Import settings configurations from external sources
- `settings.export` - Export settings configurations for backup or migration

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Business Context](#business-context)
3. [Database Schema](#database-schema)
   - [Core Settings Tables](#core-settings-tables)
   - [Advanced Settings Tables](#advanced-settings-tables)
4. [Advanced Settings Features](#advanced-settings-features)
5. [Settings Templates System](#settings-templates-system)
6. [Configuration Validation Framework](#configuration-validation-framework)
7. [Settings Security & Compliance](#settings-security--compliance)
8. [Settings Analytics & Monitoring](#settings-analytics--monitoring)
9. [Import/Export Management](#importexport-management)
10. [Version Control System](#version-control-system)
11. [Relationship Diagram](#relationship-diagram)
12. [Field Specifications](#field-specifications)
13. [Business Rules](#business-rules)
14. [Settings Categories](#settings-categories)
15. [RBAC Integration](#rbac-integration)
16. [Admin UI Features](#admin-ui-features)
17. [API Endpoints](#api-endpoints)
18. [Sample Data](#sample-data)
19. [Migration Script](#migration-script)
20. [Performance Indexes](#performance-indexes)

---

## OVERVIEW

Enterprise Settings Management System adalah **comprehensive configuration platform** yang memungkinkan setiap tenant untuk mengkonfigurasi, mengelola, dan mengoptimalkan berbagai aspek platform secara advanced dan scalable. Sistem ini dirancang dengan **enterprise-grade architecture** yang mencakup templates management, validation framework, security compliance, analytics monitoring, dan version control untuk mendukung complex business workflows.

### Core Features

1. **Enterprise Settings Management (Enhanced)**
   - Site name & URL configuration with validation
   - Contact information management with verification
   - Maintenance mode with custom messaging
   - Timezone & locale configuration with auto-detection
   - Site metadata with SEO optimization
   - Multi-language support configuration

2. **Advanced Email Service Configuration**
   - Multiple provider support (SMTP, SendGrid, Mailgun, AWS SES)
   - Email template management with WYSIWYG editor
   - From address & name configuration with domain verification
   - Test email functionality with delivery tracking
   - Email queue settings with priority management
   - Bounce handling and reputation monitoring

3. **Comprehensive Notification System**
   - Email notification toggle with granular controls
   - Multi-channel notifications (email, SMS, push, webhook)
   - Business cycle-specific notifications (etching workflow)
   - Low stock alerts with predictive analytics
   - System update notifications with maintenance scheduling
   - Contact form notification routing with auto-assignment

4. **Advanced Security Settings**
   - SSL/HTTPS configuration with certificate management
   - Two-factor authentication (2FA) with multiple methods
   - Session timeout configuration with idle detection
   - IP whitelist/blacklist management with geo-blocking
   - Force password change policy with complexity rules
   - Login attempt limits with progressive delays
   - Security audit logging and compliance monitoring

5. **Enhanced Analytics & Tracking**
   - Google Analytics 4 integration with enhanced e-commerce
   - Facebook Pixel configuration with conversion tracking
   - Custom tracking scripts with performance monitoring
   - Event tracking configuration with funnel analysis
   - Conversion tracking with attribution modeling
   - Real-time analytics dashboard with insights

6. **Professional Payment Gateway Integration**
   - Multi-provider support (Midtrans, Xendit, Stripe, PayPal)
   - Production/Sandbox mode toggle with environment validation
   - Multi-currency configuration with exchange rate management
   - Accepted payment methods with regional optimization
   - Payment callback URLs with webhook validation
   - Payment analytics and reconciliation tools

7. **Advanced Third-Party Integrations**
   - WhatsApp Business integration with chatbot support
   - Social media links configuration with auto-posting
   - Cloud storage configuration (S3, Cloudinary, GCS, Azure)
   - CDN settings with performance optimization
   - API rate limiting with usage analytics
   - CRM/ERP integration (Salesforce, HubSpot, Odoo)

8. **Enterprise Backup & Recovery**
   - Automated backup schedule with multiple frequencies
   - Backup retention policy with lifecycle management
   - Manual backup trigger with progress tracking
   - Backup download with encryption
   - Restore functionality with point-in-time recovery
   - Disaster recovery planning and testing

9. **Settings Templates System (New)**
   - Pre-configured settings templates for different business types
   - Industry-specific templates (etching, manufacturing, e-commerce)
   - Template versioning and update management
   - Custom template creation and sharing
   - Template validation and compatibility checking

10. **Configuration Validation Framework (New)**
    - Real-time settings validation with error reporting
    - Dependency checking between settings
    - Performance impact analysis
    - Security compliance validation
    - Best practices recommendations

11. **Settings Security & Compliance (New)**
    - Security scanning of configuration changes
    - Compliance monitoring (GDPR, SOC2, ISO 27001)
    - Vulnerability assessment and remediation
    - Access control and audit logging
    - Data encryption and key management

12. **Settings Analytics & Monitoring (New)**
    - Usage analytics and optimization recommendations
    - Performance monitoring and alerting
    - Configuration change tracking and impact analysis
    - Business intelligence and reporting
    - Predictive analytics for capacity planning

13. **Import/Export Management (New)**
    - Settings export for backup and migration
    - Import from external systems and platforms
    - Bulk configuration management
    - Configuration synchronization across environments
    - Migration tools and compatibility checking

14. **Version Control System (New)**
    - Settings change versioning with Git-like functionality
    - Rollback capability with impact assessment
    - Change approval workflows
    - Collaborative configuration management
    - Audit trail and compliance reporting

---

## BUSINESS CONTEXT

### **Etching Business Integration**

**Stencil CMS** settings module is specifically designed for **custom etching businesses** with comprehensive configuration management that supports the complete business cycle from inquiry to delivery.

### **Business Cycle Integration**

**Settings support for etching business workflow:**

1. **Inquiry Stage Settings**:
   - Contact form configuration for customer inquiries
   - WhatsApp Business integration for instant communication
   - Email templates for inquiry acknowledgment
   - Analytics tracking for lead sources

2. **Quotation Stage Settings**:
   - Payment gateway configuration for quotation deposits
   - Email service setup for quotation delivery
   - Currency and pricing settings
   - Document templates and branding

3. **Order Processing Settings**:
   - Production notification preferences
   - Inventory integration settings
   - Order status email configurations
   - Customer communication templates

4. **Production Stage Settings**:
   - Backup configurations for production data
   - File storage settings for design files
   - Quality control notification settings
   - Progress tracking configurations

5. **Delivery Stage Settings**:
   - Shipping integration settings
   - Delivery notification preferences
   - Customer satisfaction survey settings
   - Post-delivery follow-up configurations

### Settings Architecture Strategy

**Stencil CMS** menggunakan **hierarchical settings approach**:

1. **Platform Level (Global Defaults)**:
   - Default settings untuk all new tenants
   - System-level configurations
   - Shared infrastructure settings
   - Cannot be overridden by tenants

2. **Tenant Level (Customizable)**:
   - Tenant can override platform defaults
   - Custom business configurations
   - Integration-specific settings
   - Backup & security preferences

3. **Business-Specific Configurations**:
   - Etching industry-specific settings
   - Custom material and pricing configurations
   - Production workflow settings
   - Quality control parameters

### Configuration Scopes

**Scope Hierarchy:**
```
Platform Defaults (Lowest Priority)
  ↓
Tenant Defaults
  ↓
Business-Specific Settings
  ↓
User-Specific Overrides (Highest Priority)
```

### Use Cases

**UC-1: Etching Business Setup**
```
New etching business tenant signs up →
Platform creates tenant with etching-specific default settings →
Business owner customizes company name, contact details →
Configures WhatsApp Business for customer communication →
Sets up payment gateway for quotation deposits →
Configures email templates for business cycle stages →
Settings saved & business is ready to accept inquiries
```

**UC-2: Customer Inquiry Configuration**
```
Etching business admin navigates to Contact Settings →
Configures inquiry form fields (material, size, quantity) →
Sets up auto-response email templates →
Integrates WhatsApp Business for instant quotes →
Configures analytics to track inquiry sources →
Settings saved & inquiry system activated
```

**UC-3: Production Workflow Settings**
```
Business admin configures production notifications →
Sets up file storage for customer design files →
Configures backup schedule for production data →
Sets quality control notification preferences →
Integrates with inventory system for material tracking →
Production workflow settings activated
```

**UC-4: Payment Gateway Integration**
```
Tenant admin navigates to Integrations →
Selects Midtrans as payment provider →
Enters server key & client key →
Toggles production mode →
System validates credentials →
Settings saved & payment gateway activated
```

**UC-5: Email Service Configuration**
```
Tenant admin configures SMTP settings →
Enters host, port, credentials →
Clicks "Test Email" button →
System sends test email →
If successful, saves configuration →
All outgoing emails use new settings
```

**UC-6: Maintenance Mode Activation**
```
Admin detects critical issue →
Toggles maintenance mode ON →
Platform displays maintenance page to visitors →
Admin performs fixes →
Toggles maintenance mode OFF →
Site returns to normal operation
```

**UC-7: Business Cycle Email Templates**
```
Etching business admin configures email templates →
Sets up inquiry acknowledgment template →
Configures quotation delivery template →
Sets order confirmation email template →
Configures production status update template →
Sets delivery notification template →
All business cycle communications automated
```

---

## DATABASE SCHEMA

### Table: `site_settings`

Stores general site configuration per tenant.

```sql
CREATE TABLE site_settings (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    
    site_name VARCHAR(255) NOT NULL,
    site_url VARCHAR(500) NOT NULL,
    site_description TEXT NULL,
    
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NULL,
    contact_address TEXT NULL,
    
    logo_url VARCHAR(500) NULL,
    favicon_url VARCHAR(500) NULL,
    
    is_maintenance_mode BOOLEAN DEFAULT FALSE,
    maintenance_message TEXT NULL,
    
    timezone VARCHAR(100) DEFAULT 'Asia/Jakarta',
    
    social_links JSONB NULL,
    
    metadata JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT unique_site_settings_per_tenant UNIQUE (tenant_id)
);

CREATE INDEX idx_site_settings_tenant_id ON site_settings(tenant_id);
CREATE INDEX idx_site_settings_is_maintenance ON site_settings(is_maintenance_mode);

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON site_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**JSONB `social_links` Structure:**
```json
{
  "facebook": "https://facebook.com/company",
  "instagram": "https://instagram.com/company",
  "twitter": "https://twitter.com/company",
  "linkedin": "https://linkedin.com/company/company",
  "youtube": "https://youtube.com/c/company",
  "whatsapp": "+6281234567890"
}
```

---

### Table: `email_settings`

Stores email service configuration per tenant.

```sql
CREATE TABLE email_settings (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    
    provider VARCHAR(50) NOT NULL DEFAULT 'smtp',
    
    is_enabled BOOLEAN DEFAULT TRUE,
    
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255) NOT NULL,
    reply_to_email VARCHAR(255) NULL,
    
    smtp_config JSONB NULL,
    sendgrid_config JSONB NULL,
    mailgun_config JSONB NULL,
    
    notification_preferences JSONB NULL,
    
    daily_limit INT DEFAULT 1000,
    
    metadata JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT unique_email_settings_per_tenant UNIQUE (tenant_id),
    CONSTRAINT check_provider CHECK (provider IN ('smtp', 'sendgrid', 'mailgun'))
);

CREATE INDEX idx_email_settings_tenant_id ON email_settings(tenant_id);
CREATE INDEX idx_email_settings_provider ON email_settings(provider);

CREATE TRIGGER update_email_settings_updated_at
BEFORE UPDATE ON email_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**JSONB `smtp_config` Structure:**
```json
{
  "host": "smtp.gmail.com",
  "port": 587,
  "encryption": "tls",
  "username": "user@example.com",
  "password": "encrypted_password",
  "timeout": 30
}
```

**JSONB `notification_preferences` Structure:**
```json
{
  "new_orders": true,
  "new_reviews": true,
  "contact_submissions": true,
  "low_stock_alerts": true,
  "system_updates": false,
  "weekly_reports": true
}
```

---

### Table: `payment_settings`

Stores payment gateway configuration per tenant.

```sql
CREATE TABLE payment_settings (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    
    provider VARCHAR(50) NOT NULL DEFAULT 'midtrans',
    
    is_enabled BOOLEAN DEFAULT TRUE,
    is_production BOOLEAN DEFAULT FALSE,
    
    currency VARCHAR(10) DEFAULT 'IDR',
    
    accepted_methods JSONB NOT NULL DEFAULT '{"cash":true,"credit_card":true,"e_wallet":true,"bank_transfer":true,"qris":true}',
    
    midtrans_config JSONB NULL,
    xendit_config JSONB NULL,
    stripe_config JSONB NULL,
    
    callback_url VARCHAR(500) NULL,
    return_url VARCHAR(500) NULL,
    
    metadata JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT unique_payment_settings_per_tenant UNIQUE (tenant_id),
    CONSTRAINT check_provider CHECK (provider IN ('midtrans', 'xendit', 'stripe'))
);

CREATE INDEX idx_payment_settings_tenant_id ON payment_settings(tenant_id);
CREATE INDEX idx_payment_settings_provider ON payment_settings(provider);
CREATE INDEX idx_payment_settings_is_enabled ON payment_settings(is_enabled);

CREATE TRIGGER update_payment_settings_updated_at
BEFORE UPDATE ON payment_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**JSONB `midtrans_config` Structure:**
```json
{
  "server_key": "encrypted_server_key",
  "client_key": "Mid-client-xxxxxxxxxxxx",
  "merchant_id": "MERCHANT123",
  "sandbox_mode": false,
  "enabled_payments": ["credit_card", "gopay", "shopeepay", "qris"]
}
```

---

### Table: `analytics_settings`

Stores analytics and tracking configuration per tenant.

```sql
CREATE TABLE analytics_settings (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    
    google_analytics_id VARCHAR(50) NULL,
    google_tag_manager_id VARCHAR(50) NULL,
    facebook_pixel_id VARCHAR(50) NULL,
    
    custom_scripts JSONB NULL,
    
    is_tracking_enabled BOOLEAN DEFAULT TRUE,
    
    tracked_events JSONB NULL,
    
    metadata JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT unique_analytics_settings_per_tenant UNIQUE (tenant_id)
);

CREATE INDEX idx_analytics_settings_tenant_id ON analytics_settings(tenant_id);

CREATE TRIGGER update_analytics_settings_updated_at
BEFORE UPDATE ON analytics_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**JSONB `custom_scripts` Structure:**
```json
{
  "header": "<script>/* Custom header script */</script>",
  "body": "<script>/* Custom body script */</script>",
  "footer": "<!-- Custom footer HTML -->"
}
```

---

### Table: `integration_settings`

Stores third-party integration configuration per tenant.

```sql
CREATE TABLE integration_settings (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    
    whatsapp_business_number VARCHAR(50) NULL,
    whatsapp_default_message TEXT NULL,
    
    storage_provider VARCHAR(50) DEFAULT 'local',
    storage_config JSONB NULL,
    
    cdn_enabled BOOLEAN DEFAULT FALSE,
    cdn_url VARCHAR(500) NULL,
    
    api_rate_limit INT DEFAULT 1000,
    
    webhook_urls JSONB NULL,
    
    metadata JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT unique_integration_settings_per_tenant UNIQUE (tenant_id),
    CONSTRAINT check_storage_provider CHECK (storage_provider IN ('local', 's3', 'cloudinary', 'google_cloud'))
);

CREATE INDEX idx_integration_settings_tenant_id ON integration_settings(tenant_id);

CREATE TRIGGER update_integration_settings_updated_at
BEFORE UPDATE ON integration_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**JSONB `storage_config` Structure (S3 Example):**
```json
{
  "bucket": "my-tenant-bucket",
  "region": "ap-southeast-1",
  "access_key_id": "encrypted_access_key",
  "secret_access_key": "encrypted_secret",
  "endpoint": "https://s3.ap-southeast-1.amazonaws.com"
}
```

---

### Table: `backup_settings`

Stores backup configuration and history per tenant.

```sql
CREATE TABLE backup_settings (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    
    is_enabled BOOLEAN DEFAULT TRUE,
    
    schedule VARCHAR(50) DEFAULT 'daily',
    backup_time TIME DEFAULT '02:00:00',
    
    retention_days INT DEFAULT 30,
    retention_weekly INT DEFAULT 4,
    retention_monthly INT DEFAULT 12,
    
    backup_storage VARCHAR(50) DEFAULT 'local',
    storage_path VARCHAR(500) NULL,
    
    include_database BOOLEAN DEFAULT TRUE,
    include_media BOOLEAN DEFAULT TRUE,
    
    last_backup_at TIMESTAMP NULL,
    last_backup_status VARCHAR(50) NULL,
    last_backup_size BIGINT NULL,
    
    metadata JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT unique_backup_settings_per_tenant UNIQUE (tenant_id),
    CONSTRAINT check_schedule CHECK (schedule IN ('hourly', 'daily', 'weekly', 'monthly')),
    CONSTRAINT check_storage CHECK (backup_storage IN ('local', 's3', 'google_cloud', 'azure'))
);

CREATE INDEX idx_backup_settings_tenant_id ON backup_settings(tenant_id);
CREATE INDEX idx_backup_settings_is_enabled ON backup_settings(is_enabled);
CREATE INDEX idx_backup_settings_last_backup_at ON backup_settings(last_backup_at);

CREATE TRIGGER update_backup_settings_updated_at
BEFORE UPDATE ON backup_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## ADVANCED SETTINGS TABLES

### Table: `settings_templates`

Stores pre-configured settings templates for different business types and use cases.

```sql
CREATE TABLE settings_templates (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    -- Template identification
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NOT NULL, -- 'business_type', 'industry', 'custom'
    subcategory VARCHAR(100) NULL, -- 'etching', 'manufacturing', 'e-commerce'
    
    -- Template scope
    is_global BOOLEAN DEFAULT FALSE, -- Global templates vs tenant-specific
    tenant_id UUID NULL, -- NULL for global templates
    
    -- Template configuration
    template_data JSONB NOT NULL, -- Complete settings configuration
    required_fields JSONB NULL, -- Fields that must be customized
    optional_fields JSONB NULL, -- Fields that can be customized
    
    -- Validation and compatibility
    validation_rules JSONB NULL, -- Validation rules for template
    compatibility_requirements JSONB NULL, -- System requirements
    
    -- Template metadata
    version VARCHAR(20) DEFAULT '1.0.0',
    author_id BIGINT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Usage statistics
    usage_count INT DEFAULT 0,
    last_used_at TIMESTAMP NULL,
    
    -- Template settings
    preview_image_url VARCHAR(500) NULL,
    documentation_url VARCHAR(500) NULL,
    tags JSONB NULL, -- Array of tags for categorization
    
    metadata JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT check_category CHECK (category IN ('business_type', 'industry', 'custom', 'system'))
);

CREATE INDEX idx_settings_templates_tenant_id ON settings_templates(tenant_id);
CREATE INDEX idx_settings_templates_category ON settings_templates(category);
CREATE INDEX idx_settings_templates_subcategory ON settings_templates(subcategory);
CREATE INDEX idx_settings_templates_is_active ON settings_templates(is_active);
CREATE INDEX idx_settings_templates_is_global ON settings_templates(is_global);
CREATE INDEX idx_settings_templates_usage_count ON settings_templates(usage_count);

CREATE TRIGGER update_settings_templates_updated_at
BEFORE UPDATE ON settings_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### Table: `settings_validation_results`

Stores validation results for settings configurations and changes.

```sql
CREATE TABLE settings_validation_results (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    
    -- Validation context
    validation_type VARCHAR(50) NOT NULL, -- 'configuration', 'template', 'import', 'change'
    settings_table VARCHAR(100) NOT NULL, -- Which settings table was validated
    settings_id BIGINT NULL, -- Reference to specific settings record
    template_id BIGINT NULL, -- Reference to template if applicable
    
    -- Validation execution
    validation_started_at TIMESTAMP NOT NULL,
    validation_completed_at TIMESTAMP NULL,
    validation_duration_ms INT NULL,
    
    -- Validation results
    status VARCHAR(50) NOT NULL, -- 'passed', 'failed', 'warning', 'in_progress'
    overall_score DECIMAL(5,2) NULL, -- Overall validation score (0-100)
    
    -- Detailed results
    validation_rules_checked INT DEFAULT 0,
    validation_rules_passed INT DEFAULT 0,
    validation_rules_failed INT DEFAULT 0,
    validation_rules_warnings INT DEFAULT 0,
    
    -- Issues and recommendations
    critical_issues JSONB NULL, -- Array of critical validation failures
    warnings JSONB NULL, -- Array of warnings
    recommendations JSONB NULL, -- Array of improvement recommendations
    
    -- Performance impact
    performance_impact VARCHAR(50) NULL, -- 'low', 'medium', 'high'
    security_impact VARCHAR(50) NULL, -- 'low', 'medium', 'high', 'critical'
    
    -- Validation details
    validation_config JSONB NULL, -- Configuration used for validation
    validation_results JSONB NULL, -- Detailed validation results
    
    -- Auto-fix suggestions
    auto_fix_available BOOLEAN DEFAULT FALSE,
    auto_fix_suggestions JSONB NULL,
    
    metadata JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES settings_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT check_validation_type CHECK (validation_type IN ('configuration', 'template', 'import', 'change', 'scheduled')),
    CONSTRAINT check_status CHECK (status IN ('passed', 'failed', 'warning', 'in_progress', 'cancelled')),
    CONSTRAINT check_performance_impact CHECK (performance_impact IN ('low', 'medium', 'high')),
    CONSTRAINT check_security_impact CHECK (security_impact IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX idx_settings_validation_tenant_id ON settings_validation_results(tenant_id);
CREATE INDEX idx_settings_validation_status ON settings_validation_results(status);
CREATE INDEX idx_settings_validation_type ON settings_validation_results(validation_type);
CREATE INDEX idx_settings_validation_table ON settings_validation_results(settings_table);
CREATE INDEX idx_settings_validation_created_at ON settings_validation_results(created_at);
CREATE INDEX idx_settings_validation_score ON settings_validation_results(overall_score);
```

---

### Table: `settings_security_scans`

Stores security scan results for settings configurations and compliance monitoring.

```sql
CREATE TABLE settings_security_scans (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    
    -- Scan context
    scan_type VARCHAR(50) NOT NULL, -- 'security', 'compliance', 'vulnerability', 'audit'
    scan_scope VARCHAR(50) NOT NULL, -- 'all_settings', 'specific_table', 'configuration_change'
    settings_table VARCHAR(100) NULL, -- Specific table if scoped
    
    -- Scan execution
    scan_started_at TIMESTAMP NOT NULL,
    scan_completed_at TIMESTAMP NULL,
    scan_duration_ms INT NULL,
    scan_engine_version VARCHAR(50) NULL,
    
    -- Scan results
    status VARCHAR(50) NOT NULL, -- 'completed', 'failed', 'in_progress', 'cancelled'
    security_score DECIMAL(5,2) NULL, -- Overall security score (0-100)
    compliance_score DECIMAL(5,2) NULL, -- Compliance score (0-100)
    
    -- Findings summary
    total_findings INT DEFAULT 0,
    critical_findings INT DEFAULT 0,
    high_findings INT DEFAULT 0,
    medium_findings INT DEFAULT 0,
    low_findings INT DEFAULT 0,
    info_findings INT DEFAULT 0,
    
    -- Security findings
    vulnerabilities JSONB NULL, -- Array of security vulnerabilities
    misconfigurations JSONB NULL, -- Array of security misconfigurations
    compliance_violations JSONB NULL, -- Array of compliance violations
    
    -- Compliance frameworks
    gdpr_compliance_status VARCHAR(50) NULL, -- 'compliant', 'non_compliant', 'partial'
    soc2_compliance_status VARCHAR(50) NULL,
    iso27001_compliance_status VARCHAR(50) NULL,
    
    -- Risk assessment
    risk_level VARCHAR(50) NULL, -- 'low', 'medium', 'high', 'critical'
    risk_factors JSONB NULL, -- Array of identified risk factors
    
    -- Remediation
    remediation_required BOOLEAN DEFAULT FALSE,
    remediation_suggestions JSONB NULL, -- Array of remediation steps
    auto_remediation_available BOOLEAN DEFAULT FALSE,
    
    -- Scan configuration
    scan_rules JSONB NULL, -- Rules used for scanning
    scan_parameters JSONB NULL, -- Scan parameters and configuration
    
    -- Quarantine actions
    quarantine_actions JSONB NULL, -- Actions taken for quarantine
    quarantine_status VARCHAR(50) NULL, -- 'none', 'partial', 'full'
    
    metadata JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT check_scan_type CHECK (scan_type IN ('security', 'compliance', 'vulnerability', 'audit', 'scheduled')),
    CONSTRAINT check_scan_scope CHECK (scan_scope IN ('all_settings', 'specific_table', 'configuration_change', 'template')),
    CONSTRAINT check_status CHECK (status IN ('completed', 'failed', 'in_progress', 'cancelled')),
    CONSTRAINT check_risk_level CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT check_compliance_status CHECK (gdpr_compliance_status IN ('compliant', 'non_compliant', 'partial', 'unknown'))
);

CREATE INDEX idx_settings_security_tenant_id ON settings_security_scans(tenant_id);
CREATE INDEX idx_settings_security_status ON settings_security_scans(status);
CREATE INDEX idx_settings_security_type ON settings_security_scans(scan_type);
CREATE INDEX idx_settings_security_risk_level ON settings_security_scans(risk_level);
CREATE INDEX idx_settings_security_created_at ON settings_security_scans(created_at);
CREATE INDEX idx_settings_security_score ON settings_security_scans(security_score);
CREATE INDEX idx_settings_security_compliance ON settings_security_scans(compliance_score);
```

---

### Table: `settings_analytics`

Stores analytics data for settings usage, performance, and optimization insights.

```sql
CREATE TABLE settings_analytics (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    
    -- Analytics context
    analytics_type VARCHAR(50) NOT NULL, -- 'usage', 'performance', 'optimization', 'business_intelligence'
    settings_table VARCHAR(100) NOT NULL, -- Which settings table
    settings_category VARCHAR(100) NULL, -- Category of settings
    
    -- Time period
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    period_type VARCHAR(50) NOT NULL, -- 'hourly', 'daily', 'weekly', 'monthly'
    
    -- Usage metrics
    configuration_changes INT DEFAULT 0,
    validation_runs INT DEFAULT 0,
    security_scans INT DEFAULT 0,
    template_applications INT DEFAULT 0,
    
    -- Performance metrics
    avg_response_time_ms DECIMAL(10,2) NULL,
    max_response_time_ms DECIMAL(10,2) NULL,
    min_response_time_ms DECIMAL(10,2) NULL,
    total_requests INT DEFAULT 0,
    failed_requests INT DEFAULT 0,
    
    -- Configuration metrics
    active_configurations INT DEFAULT 0,
    deprecated_configurations INT DEFAULT 0,
    custom_configurations INT DEFAULT 0,
    template_based_configurations INT DEFAULT 0,
    
    -- Optimization metrics
    optimization_score DECIMAL(5,2) NULL, -- Overall optimization score (0-100)
    performance_score DECIMAL(5,2) NULL, -- Performance score (0-100)
    security_score DECIMAL(5,2) NULL, -- Security score (0-100)
    compliance_score DECIMAL(5,2) NULL, -- Compliance score (0-100)
    
    -- Business intelligence
    cost_impact DECIMAL(15,2) NULL, -- Estimated cost impact
    efficiency_gain DECIMAL(5,2) NULL, -- Efficiency improvement percentage
    user_satisfaction_score DECIMAL(5,2) NULL, -- User satisfaction (0-100)
    
    -- Detailed analytics
    usage_patterns JSONB NULL, -- Detailed usage patterns
    performance_trends JSONB NULL, -- Performance trend data
    optimization_opportunities JSONB NULL, -- Optimization recommendations
    
    -- Predictive analytics
    predicted_usage JSONB NULL, -- Usage predictions
    capacity_recommendations JSONB NULL, -- Capacity planning recommendations
    trend_analysis JSONB NULL, -- Trend analysis results
    
    -- Alerts and notifications
    alerts_generated INT DEFAULT 0,
    critical_alerts INT DEFAULT 0,
    warning_alerts INT DEFAULT 0,
    
    -- Comparison data
    previous_period_comparison JSONB NULL, -- Comparison with previous period
    benchmark_comparison JSONB NULL, -- Comparison with benchmarks
    
    metadata JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT check_analytics_type CHECK (analytics_type IN ('usage', 'performance', 'optimization', 'business_intelligence', 'predictive')),
    CONSTRAINT check_period_type CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    CONSTRAINT check_period_order CHECK (period_end >= period_start)
);

CREATE INDEX idx_settings_analytics_tenant_id ON settings_analytics(tenant_id);
CREATE INDEX idx_settings_analytics_type ON settings_analytics(analytics_type);
CREATE INDEX idx_settings_analytics_table ON settings_analytics(settings_table);
CREATE INDEX idx_settings_analytics_period ON settings_analytics(period_start, period_end);
CREATE INDEX idx_settings_analytics_created_at ON settings_analytics(created_at);
CREATE INDEX idx_settings_analytics_optimization_score ON settings_analytics(optimization_score);

CREATE TRIGGER update_settings_analytics_updated_at
BEFORE UPDATE ON settings_analytics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### Table: `settings_import_export`

Manages settings import/export operations for backup, migration, and synchronization.

```sql
CREATE TABLE settings_import_export (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    
    -- Operation details
    operation_type VARCHAR(50) NOT NULL, -- 'import', 'export', 'sync'
    operation_scope VARCHAR(50) NOT NULL, -- 'all_settings', 'specific_tables', 'template'
    operation_purpose VARCHAR(50) NOT NULL, -- 'backup', 'migration', 'sync', 'restore'
    
    -- Operation execution
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NULL,
    duration_ms INT NULL,
    
    -- Operation status
    status VARCHAR(50) NOT NULL, -- 'in_progress', 'completed', 'failed', 'cancelled'
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Data details
    tables_included JSONB NULL, -- Array of tables included in operation
    records_processed INT DEFAULT 0,
    records_successful INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    records_skipped INT DEFAULT 0,
    
    -- File details
    file_name VARCHAR(500) NULL,
    file_size BIGINT NULL,
    file_format VARCHAR(50) NULL, -- 'json', 'yaml', 'xml', 'csv'
    file_path VARCHAR(1000) NULL,
    file_checksum VARCHAR(128) NULL,
    
    -- Source/destination
    source_system VARCHAR(100) NULL, -- Source system for imports
    destination_system VARCHAR(100) NULL, -- Destination system for exports
    source_version VARCHAR(50) NULL,
    destination_version VARCHAR(50) NULL,
    
    -- Validation and compatibility
    validation_performed BOOLEAN DEFAULT FALSE,
    validation_passed BOOLEAN NULL,
    validation_issues JSONB NULL,
    compatibility_check_passed BOOLEAN NULL,
    compatibility_issues JSONB NULL,
    
    -- Transformation and mapping
    data_transformations JSONB NULL, -- Applied data transformations
    field_mappings JSONB NULL, -- Field mapping configurations
    custom_rules JSONB NULL, -- Custom import/export rules
    
    -- Backup and rollback
    backup_created BOOLEAN DEFAULT FALSE,
    backup_location VARCHAR(1000) NULL,
    rollback_available BOOLEAN DEFAULT FALSE,
    rollback_data JSONB NULL,
    
    -- Error handling
    error_count INT DEFAULT 0,
    errors JSONB NULL, -- Array of errors encountered
    warnings JSONB NULL, -- Array of warnings
    
    -- Configuration
    operation_config JSONB NULL, -- Operation configuration
    user_preferences JSONB NULL, -- User preferences for operation
    
    metadata JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NOT NULL,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    CONSTRAINT check_operation_type CHECK (operation_type IN ('import', 'export', 'sync', 'backup', 'restore')),
    CONSTRAINT check_operation_scope CHECK (operation_scope IN ('all_settings', 'specific_tables', 'template', 'partial')),
    CONSTRAINT check_operation_purpose CHECK (operation_purpose IN ('backup', 'migration', 'sync', 'restore', 'clone')),
    CONSTRAINT check_status CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled', 'pending')),
    CONSTRAINT check_file_format CHECK (file_format IN ('json', 'yaml', 'xml', 'csv', 'sql'))
);

CREATE INDEX idx_settings_import_export_tenant_id ON settings_import_export(tenant_id);
CREATE INDEX idx_settings_import_export_type ON settings_import_export(operation_type);
CREATE INDEX idx_settings_import_export_status ON settings_import_export(status);
CREATE INDEX idx_settings_import_export_created_at ON settings_import_export(created_at);
CREATE INDEX idx_settings_import_export_purpose ON settings_import_export(operation_purpose);

CREATE TRIGGER update_settings_import_export_updated_at
BEFORE UPDATE ON settings_import_export
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### Table: `settings_version_history`

Stores version history for settings changes with Git-like functionality.

```sql
CREATE TABLE settings_version_history (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    
    -- Version details
    version_number VARCHAR(50) NOT NULL, -- Semantic version or auto-increment
    version_type VARCHAR(50) NOT NULL, -- 'major', 'minor', 'patch', 'hotfix'
    
    -- Change details
    settings_table VARCHAR(100) NOT NULL,
    settings_record_id BIGINT NOT NULL,
    change_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'restore'
    
    -- Version data
    previous_data JSONB NULL, -- Previous version of the data
    current_data JSONB NOT NULL, -- Current version of the data
    change_diff JSONB NULL, -- Detailed diff of changes
    
    -- Change metadata
    change_summary TEXT NULL, -- Human-readable summary of changes
    change_reason VARCHAR(500) NULL, -- Reason for the change
    change_category VARCHAR(100) NULL, -- Category of change
    
    -- Impact assessment
    impact_level VARCHAR(50) NULL, -- 'low', 'medium', 'high', 'critical'
    affected_systems JSONB NULL, -- Systems affected by this change
    rollback_complexity VARCHAR(50) NULL, -- 'simple', 'moderate', 'complex'
    
    -- Approval workflow
    requires_approval BOOLEAN DEFAULT FALSE,
    approval_status VARCHAR(50) NULL, -- 'pending', 'approved', 'rejected'
    approved_by BIGINT NULL,
    approved_at TIMESTAMP NULL,
    approval_notes TEXT NULL,
    
    -- Rollback information
    is_rollback BOOLEAN DEFAULT FALSE,
    rollback_from_version VARCHAR(50) NULL,
    rollback_reason TEXT NULL,
    can_rollback BOOLEAN DEFAULT TRUE,
    
    -- Deployment information
    deployment_status VARCHAR(50) NULL, -- 'pending', 'deployed', 'failed'
    deployed_at TIMESTAMP NULL,
    deployment_notes TEXT NULL,
    
    -- Validation and testing
    validation_status VARCHAR(50) NULL, -- 'passed', 'failed', 'skipped'
    validation_results JSONB NULL,
    test_results JSONB NULL,
    
    -- Collaboration
    branch_name VARCHAR(100) NULL, -- Git-like branch concept
    merge_request_id BIGINT NULL, -- Reference to merge request
    collaborators JSONB NULL, -- Array of collaborator user IDs
    
    -- Tags and labels
    tags JSONB NULL, -- Array of tags for categorization
    labels JSONB NULL, -- Array of labels for organization
    
    -- Performance impact
    performance_impact JSONB NULL, -- Performance impact analysis
    resource_usage_change JSONB NULL, -- Resource usage changes
    
    metadata JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NOT NULL,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT check_version_type CHECK (version_type IN ('major', 'minor', 'patch', 'hotfix', 'emergency')),
    CONSTRAINT check_change_type CHECK (change_type IN ('create', 'update', 'delete', 'restore', 'merge')),
    CONSTRAINT check_impact_level CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT check_approval_status CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    CONSTRAINT check_deployment_status CHECK (deployment_status IN ('pending', 'deployed', 'failed', 'cancelled')),
    CONSTRAINT check_validation_status CHECK (validation_status IN ('passed', 'failed', 'skipped', 'in_progress'))
);

CREATE INDEX idx_settings_version_tenant_id ON settings_version_history(tenant_id);
CREATE INDEX idx_settings_version_table ON settings_version_history(settings_table);
CREATE INDEX idx_settings_version_record_id ON settings_version_history(settings_record_id);
CREATE INDEX idx_settings_version_number ON settings_version_history(version_number);
CREATE INDEX idx_settings_version_created_at ON settings_version_history(created_at);
CREATE INDEX idx_settings_version_change_type ON settings_version_history(change_type);
CREATE INDEX idx_settings_version_approval_status ON settings_version_history(approval_status);
CREATE INDEX idx_settings_version_deployment_status ON settings_version_history(deployment_status);
```

---

## ADVANCED SETTINGS FEATURES

### Settings Templates System

**Pre-configured settings templates** untuk different business types dan use cases, memungkinkan rapid deployment dan standardization.

**Key Features:**
- **Industry-Specific Templates**: Etching business, manufacturing, e-commerce, service-based
- **Template Versioning**: Semantic versioning dengan update management
- **Custom Template Creation**: Tenants dapat create dan share custom templates
- **Template Validation**: Automatic validation dan compatibility checking
- **Usage Analytics**: Track template usage dan effectiveness

**Business Value:**
- **Faster Onboarding**: New tenants dapat setup dalam minutes dengan pre-configured templates
- **Best Practices**: Templates include industry best practices dan optimizations
- **Consistency**: Standardized configurations across similar businesses
- **Reduced Errors**: Pre-validated templates reduce configuration mistakes

---

### Configuration Validation Framework

**Real-time validation system** yang ensures settings configurations are optimal, secure, dan compliant.

**Validation Types:**
- **Syntax Validation**: Correct format dan data types
- **Business Logic Validation**: Rules compliance dan dependencies
- **Security Validation**: Security best practices dan vulnerability checks
- **Performance Validation**: Performance impact analysis
- **Compliance Validation**: Regulatory compliance (GDPR, SOC2, ISO 27001)

**Validation Features:**
- **Real-time Feedback**: Instant validation results during configuration
- **Auto-fix Suggestions**: Automatic remediation recommendations
- **Validation Scoring**: Overall configuration quality score (0-100)
- **Impact Analysis**: Performance dan security impact assessment
- **Dependency Checking**: Cross-settings dependency validation

---

### Settings Security & Compliance

**Comprehensive security framework** untuk settings configurations dengan compliance monitoring.

**Security Features:**
- **Security Scanning**: Automated security vulnerability detection
- **Compliance Monitoring**: GDPR, SOC2, ISO 27001 compliance tracking
- **Risk Assessment**: Risk level analysis dengan mitigation recommendations
- **Quarantine System**: Automatic isolation of risky configurations
- **Audit Logging**: Complete audit trail untuk compliance reporting

**Compliance Frameworks:**
- **GDPR**: Data protection dan privacy compliance
- **SOC2 Type II**: Security controls dan operational effectiveness
- **ISO 27001**: Information security management standards
- **Custom Frameworks**: Industry-specific compliance requirements

---

### Settings Analytics & Monitoring

**Advanced analytics platform** untuk settings usage, performance, dan optimization insights.

**Analytics Types:**
- **Usage Analytics**: Configuration usage patterns dan trends
- **Performance Analytics**: Response times, throughput, dan resource usage
- **Optimization Analytics**: Improvement opportunities dan recommendations
- **Business Intelligence**: Cost impact, efficiency gains, ROI analysis
- **Predictive Analytics**: Usage predictions dan capacity planning

**Monitoring Features:**
- **Real-time Dashboards**: Live performance dan usage metrics
- **Alerting System**: Proactive alerts untuk issues dan anomalies
- **Trend Analysis**: Historical trends dan pattern recognition
- **Benchmark Comparison**: Performance comparison dengan industry benchmarks
- **Custom Reports**: Tailored reports untuk different stakeholders

---

### Import/Export Management

**Comprehensive data management system** untuk settings backup, migration, dan synchronization.

**Import/Export Features:**
- **Multiple Formats**: JSON, YAML, XML, CSV, SQL support
- **Bulk Operations**: Mass configuration management
- **Data Transformation**: Automatic data format conversion
- **Validation & Compatibility**: Pre-import validation dan compatibility checking
- **Rollback Support**: Safe rollback capabilities dengan backup creation

**Use Cases:**
- **Backup & Restore**: Regular backups dengan point-in-time recovery
- **Environment Migration**: Dev → Staging → Production migrations
- **Tenant Cloning**: Duplicate successful configurations
- **System Integration**: Import from external systems (CRM, ERP)
- **Disaster Recovery**: Quick recovery dari catastrophic failures

---

### Version Control System

**Git-like version control** untuk settings changes dengan collaborative management.

**Version Control Features:**
- **Change Tracking**: Complete history of all configuration changes
- **Branching & Merging**: Git-like branching untuk experimental changes
- **Rollback Capability**: Safe rollback ke previous versions
- **Approval Workflows**: Change approval process untuk critical settings
- **Collaborative Editing**: Multi-user collaboration dengan conflict resolution

**Workflow Features:**
- **Change Approval**: Mandatory approval untuk high-impact changes
- **Impact Assessment**: Automatic impact analysis untuk proposed changes
- **Testing Integration**: Automated testing of configuration changes
- **Deployment Pipeline**: Staged deployment dengan validation gates
- **Audit Trail**: Complete audit trail untuk compliance dan debugging

---

## RELATIONSHIP DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                 ENTERPRISE SETTINGS SYSTEM                      │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │    tenants       │
                    │                  │
                    │ PK: uuid         │
                    │     name         │
                    │     domain       │
                    └─────────┬────────┘
                              │ FK: tenant_id
                              │ (One-to-one/One-to-many relationships)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  site_settings  │  │ email_settings  │  │payment_settings │
│                 │  │                 │  │                 │
│ PK: id          │  │ PK: id          │  │ PK: id          │
│ FK: tenant_id   │  │ FK: tenant_id   │  │ FK: tenant_id   │
│     site_name   │  │     provider    │  │     provider    │
│     site_url    │  │     from_email  │  │     currency    │
│     social_links│  │     smtp_config │  │     config_data │
│     (JSONB)     │  │     (JSONB)     │  │     (JSONB)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│analytics_settings│ │integration_     │  │ backup_settings │
│                 │  │ settings        │  │                 │
│ PK: id          │  │                 │  │ PK: id          │
│ FK: tenant_id   │  │ PK: id          │  │ FK: tenant_id   │
│     ga_id       │  │ FK: tenant_id   │  │     schedule    │
│     pixel_id    │  │     whatsapp_no │  │     retention   │
│     scripts     │  │     storage_cfg │  │     last_backup │
│     (JSONB)     │  │     (JSONB)     │  │     status      │
└─────────────────┘  └─────────────────┘  └─────────────────┘

        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│settings_        │  │settings_        │  │settings_        │
│ templates       │  │ validation_     │  │ security_scans  │
│                 │  │ results         │  │                 │
│ PK: id          │  │                 │  │ PK: id          │
│ FK: tenant_id   │  │ PK: id          │  │ FK: tenant_id   │
│     name        │  │ FK: tenant_id   │  │     scan_type   │
│     category    │  │     status      │  │     status      │
│     template_   │  │     score       │  │     security_   │
│     data (JSONB)│  │     issues      │  │     score       │
│     tags (JSONB)│  │     (JSONB)     │  │     findings    │
└─────────────────┘  └─────────────────┘  │     (JSONB)     │
        │                     │           └─────────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│settings_        │  │settings_import_ │  │settings_version_│
│ analytics       │  │ export          │  │ history         │
│                 │  │                 │  │                 │
│ PK: id          │  │ PK: id          │  │ PK: id          │
│ FK: tenant_id   │  │ FK: tenant_id   │  │ FK: tenant_id   │
│     type        │  │     operation_  │  │     version_no  │
│     period      │  │     type        │  │     change_type │
│     metrics     │  │     status      │  │     previous_   │
│     scores      │  │     file_info   │  │     data (JSONB)│
│     trends      │  │     progress    │  │     current_    │
│     (JSONB)     │  │     (JSONB)     │  │     data (JSONB)│
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Key Relationships:**

**Core Settings (One-to-One with tenants):**
1. **tenants** → **site_settings** (1:1)
2. **tenants** → **email_settings** (1:1)
3. **tenants** → **payment_settings** (1:1)
4. **tenants** → **analytics_settings** (1:1)
5. **tenants** → **integration_settings** (1:1)
6. **tenants** → **backup_settings** (1:1)

**Advanced Settings (One-to-Many with tenants):**
7. **tenants** → **settings_templates** (1:N) - Custom templates per tenant
8. **tenants** → **settings_validation_results** (1:N) - Multiple validation runs
9. **tenants** → **settings_security_scans** (1:N) - Multiple security scans
10. **tenants** → **settings_analytics** (1:N) - Multiple analytics periods
11. **tenants** → **settings_import_export** (1:N) - Multiple operations
12. **tenants** → **settings_version_history** (1:N) - Multiple versions

**Cross-Table Relationships:**
- **settings_templates** → **settings_validation_results** (Template validation)
- **settings_validation_results** → **settings_security_scans** (Validation triggers security scans)
- **settings_version_history** → All settings tables (Version tracking)
- **settings_import_export** → All settings tables (Import/export operations)

---

## FIELD SPECIFICATIONS

### Table: `site_settings`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | BIGSERIAL | Yes | Auto | Primary key |
| `uuid` | UUID | Yes | Auto-generated | Public identifier |
| `tenant_id` | UUID | Yes | FK to tenants, Unique | Tenant reference |
| `site_name` | VARCHAR(255) | Yes | Min 3, Max 255 | Site/company name |
| `site_url` | VARCHAR(500) | Yes | Valid URL | Primary site URL |
| `site_description` | TEXT | No | Max 1000 chars | SEO description |
| `contact_email` | VARCHAR(255) | Yes | Valid email | Main contact email |
| `contact_phone` | VARCHAR(50) | No | Phone format | Contact number |
| `contact_address` | TEXT | No | - | Physical address |
| `logo_url` | VARCHAR(500) | No | Valid URL | Logo image URL |
| `favicon_url` | VARCHAR(500) | No | Valid URL | Favicon URL |
| `is_maintenance_mode` | BOOLEAN | Yes | Default FALSE | Maintenance status |
| `maintenance_message` | TEXT | No | - | Custom maintenance message |
| `timezone` | VARCHAR(100) | Yes | IANA timezone | Site timezone |
| `social_links` | JSONB | No | Valid JSON | Social media URLs |
| `metadata` | JSONB | No | Valid JSON | Additional data |

### Table: `email_settings`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | BIGSERIAL | Yes | Auto | Primary key |
| `uuid` | UUID | Yes | Auto-generated | Public identifier |
| `tenant_id` | UUID | Yes | FK to tenants, Unique | Tenant reference |
| `provider` | VARCHAR(50) | Yes | smtp/sendgrid/mailgun | Email service provider |
| `is_enabled` | BOOLEAN | Yes | Default TRUE | Email service enabled |
| `from_email` | VARCHAR(255) | Yes | Valid email | Sender email address |
| `from_name` | VARCHAR(255) | Yes | Min 2 chars | Sender display name |
| `reply_to_email` | VARCHAR(255) | No | Valid email | Reply-to address |
| `smtp_config` | JSONB | No | Valid JSON | SMTP credentials |
| `sendgrid_config` | JSONB | No | Valid JSON | SendGrid API config |
| `mailgun_config` | JSONB | No | Valid JSON | Mailgun API config |
| `notification_preferences` | JSONB | No | Valid JSON | Notification toggles |
| `daily_limit` | INT | Yes | > 0 | Daily email limit |

### Table: `payment_settings`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | BIGSERIAL | Yes | Auto | Primary key |
| `uuid` | UUID | Yes | Auto-generated | Public identifier |
| `tenant_id` | UUID | Yes | FK to tenants, Unique | Tenant reference |
| `provider` | VARCHAR(50) | Yes | midtrans/xendit/stripe | Payment gateway provider |
| `is_enabled` | BOOLEAN | Yes | Default TRUE | Payment enabled |
| `is_production` | BOOLEAN | Yes | Default FALSE | Production mode |
| `currency` | VARCHAR(10) | Yes | ISO currency code | Default currency |
| `accepted_methods` | JSONB | Yes | Valid JSON object | Enabled payment methods |
| `midtrans_config` | JSONB | No | Valid JSON | Midtrans credentials |
| `xendit_config` | JSONB | No | Valid JSON | Xendit credentials |
| `stripe_config` | JSONB | No | Valid JSON | Stripe credentials |
| `callback_url` | VARCHAR(500) | No | Valid URL | Payment callback URL |
| `return_url` | VARCHAR(500) | No | Valid URL | Payment return URL |

### Table: `analytics_settings`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | BIGSERIAL | Yes | Auto | Primary key |
| `uuid` | UUID | Yes | Auto-generated | Public identifier |
| `tenant_id` | UUID | Yes | FK to tenants, Unique | Tenant reference |
| `google_analytics_id` | VARCHAR(50) | No | GA4 format (G-XXX) | GA4 Measurement ID |
| `google_tag_manager_id` | VARCHAR(50) | No | GTM format (GTM-XXX) | GTM Container ID |
| `facebook_pixel_id` | VARCHAR(50) | No | Numeric string | FB Pixel ID |
| `custom_scripts` | JSONB | No | Valid JSON | Custom tracking scripts |
| `is_tracking_enabled` | BOOLEAN | Yes | Default TRUE | Tracking enabled |
| `tracked_events` | JSONB | No | Valid JSON | Event configuration |

### Table: `integration_settings`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | BIGSERIAL | Yes | Auto | Primary key |
| `uuid` | UUID | Yes | Auto-generated | Public identifier |
| `tenant_id` | UUID | Yes | FK to tenants, Unique | Tenant reference |
| `whatsapp_business_number` | VARCHAR(50) | No | Phone format | WhatsApp number |
| `whatsapp_default_message` | TEXT | No | - | Default WA message |
| `storage_provider` | VARCHAR(50) | Yes | local/s3/cloudinary/gcs | File storage provider |
| `storage_config` | JSONB | No | Valid JSON | Storage credentials |
| `cdn_enabled` | BOOLEAN | Yes | Default FALSE | CDN enabled |
| `cdn_url` | VARCHAR(500) | No | Valid URL | CDN base URL |
| `api_rate_limit` | INT | Yes | > 0 | API rate limit/hour |
| `webhook_urls` | JSONB | No | Valid JSON | Webhook endpoints |

### Table: `backup_settings`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | BIGSERIAL | Yes | Auto | Primary key |
| `uuid` | UUID | Yes | Auto-generated | Public identifier |
| `tenant_id` | UUID | Yes | FK to tenants, Unique | Tenant reference |
| `is_enabled` | BOOLEAN | Yes | Default TRUE | Auto-backup enabled |
| `schedule` | VARCHAR(50) | Yes | hourly/daily/weekly/monthly | Backup frequency |
| `backup_time` | TIME | Yes | Valid time | Scheduled backup time |
| `retention_days` | INT | Yes | > 0 | Daily backup retention |
| `retention_weekly` | INT | Yes | > 0 | Weekly backup retention |
| `retention_monthly` | INT | Yes | > 0 | Monthly backup retention |
| `backup_storage` | VARCHAR(50) | Yes | local/s3/gcs/azure | Backup storage location |
| `storage_path` | VARCHAR(500) | No | Valid path | Storage path/bucket |
| `include_database` | BOOLEAN | Yes | Default TRUE | Backup database |
| `include_media` | BOOLEAN | Yes | Default TRUE | Backup media files |
| `last_backup_at` | TIMESTAMP | No | - | Last backup timestamp |
| `last_backup_status` | VARCHAR(50) | No | success/failed/in_progress | Last backup status |
| `last_backup_size` | BIGINT | No | >= 0 | Last backup size (bytes) |

---

## BUSINESS RULES

### BR-1: Site Settings Validation

```typescript
const siteSettingsRules = {
  // Rule 1: Site URL must be unique across tenants
  validateUniqueSiteUrl: async (siteUrl: string, tenantId: string) => {
    const existing = await db.query(`
      SELECT COUNT(*) FROM site_settings 
      WHERE site_url = $1 AND tenant_id != $2
    `, [siteUrl, tenantId]);
    
    if (existing.count > 0) {
      throw new Error('Site URL already in use');
    }
  },
  
  // Rule 2: Maintenance mode displays custom message
  getMaintenancePage: (settings: SiteSettings) => {
    if (!settings.is_maintenance_mode) return null;
    
    return {
      message: settings.maintenance_message || 'Site is under maintenance',
      estimatedDuration: 'Will be back soon',
      contactEmail: settings.contact_email
    };
  },
  
  // Rule 3: Logo & favicon must be valid image URLs
  validateImageUrls: (logoUrl?: string, faviconUrl?: string) => {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'];
    
    if (logoUrl && !imageExtensions.some(ext => logoUrl.endsWith(ext))) {
      throw new Error('Invalid logo file format');
    }
    
    if (faviconUrl && !['.ico', '.png'].some(ext => faviconUrl.endsWith(ext))) {
      throw new Error('Favicon must be .ico or .png');
    }
  }
};
```

### BR-2: Email Settings Validation

```typescript
const emailSettingsRules = {
  // Rule 1: Test email connection before saving
  testEmailConnection: async (config: EmailSettings) => {
    try {
      if (config.provider === 'smtp') {
        await testSMTPConnection(config.smtp_config);
      } else if (config.provider === 'sendgrid') {
        await testSendGridAPI(config.sendgrid_config.apiKey);
      } else if (config.provider === 'mailgun') {
        await testMailgunAPI(config.mailgun_config);
      }
      return true;
    } catch (error) {
      throw new Error(`Email connection test failed: ${error.message}`);
    }
  },
  
  // Rule 2: Daily email limit enforcement
  checkDailyLimit: async (tenantId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const sent = await getEmailsSentToday(tenantId, today);
    const settings = await getEmailSettings(tenantId);
    
    if (sent >= settings.daily_limit) {
      throw new Error(`Daily email limit (${settings.daily_limit}) reached`);
    }
  },
  
  // Rule 3: From email must be verified
  requireVerifiedFromEmail: async (email: string) => {
    const verified = await checkEmailVerification(email);
    if (!verified) {
      throw new Error('From email must be verified before use');
    }
  }
};
```

### BR-3: Payment Settings Validation

```typescript
const paymentSettingsRules = {
  // Rule 1: Validate credentials before saving
  validatePaymentCredentials: async (provider: string, config: any) => {
    try {
      if (provider === 'midtrans') {
        await midtrans.validateServerKey(config.server_key);
      } else if (provider === 'xendit') {
        await xendit.validateSecretKey(config.secret_key);
      } else if (provider === 'stripe') {
        await stripe.validateSecretKey(config.secret_key);
      }
      return true;
    } catch (error) {
      throw new Error('Invalid payment gateway credentials');
    }
  },
  
  // Rule 2: Production mode requires verified business
  enforceProductionRequirements: (settings: PaymentSettings) => {
    if (settings.is_production && !settings.business_verified) {
      throw new Error('Business verification required for production mode');
    }
  },
  
  // Rule 3: Currency must match payment provider support
  validateCurrencySupport: (provider: string, currency: string) => {
    const supported = {
      midtrans: ['IDR'],
      xendit: ['IDR', 'PHP', 'MYR'],
      stripe: ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'PHP']
    };
    
    if (!supported[provider]?.includes(currency)) {
      throw new Error(`${provider} does not support ${currency}`);
    }
  }
};
```

### BR-4: Analytics Settings

```typescript
const analyticsRules = {
  // Rule 1: Validate tracking ID formats
  validateTrackingIds: (settings: AnalyticsSettings) => {
    if (settings.google_analytics_id && 
        !/^G-[A-Z0-9]{10}$/.test(settings.google_analytics_id)) {
      throw new Error('Invalid Google Analytics 4 Measurement ID format');
    }
    
    if (settings.google_tag_manager_id && 
        !/^GTM-[A-Z0-9]{7}$/.test(settings.google_tag_manager_id)) {
      throw new Error('Invalid Google Tag Manager ID format');
    }
    
    if (settings.facebook_pixel_id && 
        !/^\d{15,16}$/.test(settings.facebook_pixel_id)) {
      throw new Error('Invalid Facebook Pixel ID format');
    }
  },
  
  // Rule 2: Sanitize custom scripts to prevent XSS
  sanitizeCustomScripts: (scripts: any) => {
    const dangerous = /<script[^>]*>.*?<\/script>/gi;
    
    // Allow only specific safe script patterns
    // This is simplified - real implementation needs thorough sanitization
    return {
      header: sanitizeHTML(scripts.header),
      body: sanitizeHTML(scripts.body),
      footer: sanitizeHTML(scripts.footer)
    };
  }
};
```

### BR-5: Backup Settings

```typescript
const backupRules = {
  // Rule 1: Minimum retention periods
  validateRetention: (settings: BackupSettings) => {
    if (settings.retention_days < 7) {
      throw new Error('Daily retention must be at least 7 days');
    }
    if (settings.retention_weekly < 4) {
      throw new Error('Weekly retention must be at least 4 weeks');
    }
    if (settings.retention_monthly < 3) {
      throw new Error('Monthly retention must be at least 3 months');
    }
  },
  
  // Rule 2: Verify storage accessibility before enabling
  verifyBackupStorage: async (settings: BackupSettings) => {
    try {
      if (settings.backup_storage === 's3') {
        await testS3Access(settings.storage_config);
      } else if (settings.backup_storage === 'google_cloud') {
        await testGCSAccess(settings.storage_config);
      }
      return true;
    } catch (error) {
      throw new Error('Cannot access backup storage');
    }
  },
  
  // Rule 3: Estimate backup size before execution
  estimateBackupSize: async (tenantId: string) => {
    const dbSize = await getDatabaseSize(tenantId);
    const mediaSize = await getMediaStorageSize(tenantId);
    return { dbSize, mediaSize, total: dbSize + mediaSize };
  }
};
```

---

## SETTINGS CATEGORIES

### 1. General Settings
- Site name, URL, description
- Contact information
- Logo & favicon
- Maintenance mode
- Timezone configuration

### 2. Notification Settings
- Email notifications toggle
- New orders notification
- New reviews notification
- Contact form submissions
- Low stock alerts
- System updates

### 3. Security Settings
- SSL/HTTPS status
- Two-factor authentication
- Session timeout
- IP whitelist/blacklist
- Password policies

### 4. Email Service
- Provider selection (SMTP/SendGrid/Mailgun)
- Sender configuration
- Credentials management
- Daily sending limits

### 5. Payment Gateway
- Provider selection (Midtrans/Xendit/Stripe)
- Production/Sandbox mode
- Currency configuration
- Accepted payment methods
- API credentials

### 6. Analytics & Tracking
- Google Analytics 4
- Google Tag Manager
- Facebook Pixel
- Custom tracking scripts

### 7. Integrations
- WhatsApp Business
- Storage providers (S3/Cloudinary/GCS)
- CDN configuration
- Webhooks

### 8. Backup & Recovery
- Automated backup schedule
- Retention policies
- Storage location
- Manual backup/restore

---

## RBAC INTEGRATION

### **Permission-Based Settings Access**

**Settings module integrates with RBAC system** to ensure secure, role-based access to different configuration categories.

### **Required Permissions**

| Permission | Description | Settings Access |
|------------|-------------|-----------------|
| `settings.view` | View tenant settings and configurations | Site info, contact details, basic configurations |
| `settings.create` | Create new settings templates and configurations | Template creation, custom configurations |
| `settings.edit` | Modify tenant settings and configurations | Site name, contact info, social links, basic settings |
| `settings.delete` | Delete settings templates and configurations | Template deletion, configuration removal |
| `settings.manage` | Full settings lifecycle management | Complete settings management and administration |
| `settings.admin` | Access advanced settings | Payment, integrations, analytics, security |
| `settings.backup` | Manage backup configurations and restore operations | Backup configuration, restore, disaster recovery |
| `settings.template` | Manage settings templates and presets | Template management, sharing, versioning |
| `settings.import` | Import settings configurations from external sources | Configuration import, migration, synchronization |
| `settings.export` | Export settings configurations for backup or migration | Configuration export, backup creation |

### **Role-Based Access Examples**

**Business Owner (All Permissions)**:
```typescript
const businessOwnerPermissions = [
  'settings.view', 'settings.create', 'settings.edit', 'settings.delete',
  'settings.manage', 'settings.admin', 'settings.backup', 'settings.template',
  'settings.import', 'settings.export'
];
```

**Manager (Limited Admin)**:
```typescript
const managerPermissions = [
  'settings.view', 'settings.edit', 'settings.template',
  'settings.import', 'settings.export'
];
```

**Staff (View Only)**:
```typescript
const staffPermissions = ['settings.view'];
```

**Developer (Template Management)**:
```typescript
const developerPermissions = [
  'settings.view', 'settings.create', 'settings.edit',
  'settings.template', 'settings.import', 'settings.export'
];
```

### **Permission Enforcement in API**

```typescript
// Example: Payment settings endpoint
app.put('/api/tenant/settings/payment', 
  authenticateUser,
  requirePermission('settings.payment'),
  async (req, res) => {
    const { tenantId } = req.user;
    const updates = req.body;
    
    // Validate payment credentials
    await validatePaymentCredentials(updates.provider, updates.config);
    
    // Update settings
    const result = await updatePaymentSettings(tenantId, updates);
    res.json(result);
  }
);
```

### **Settings Audit Trail**

**All settings changes are logged** for compliance and security:

```sql
CREATE TABLE settings_audit_log (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id BIGINT NOT NULL,
    settings_table VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
    old_values JSONB NULL,
    new_values JSONB NOT NULL,
    ip_address INET NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_settings_audit_tenant_id ON settings_audit_log(tenant_id);
CREATE INDEX idx_settings_audit_user_id ON settings_audit_log(user_id);
CREATE INDEX idx_settings_audit_created_at ON settings_audit_log(created_at);
```

---

## ADMIN UI FEATURES

### **Settings Management Dashboard**

**Centralized settings management interface** dengan comprehensive overview dan quick access ke all configuration categories.

**Dashboard Features:**
- **Settings Overview**: Visual summary of all configuration categories
- **Health Status**: Real-time status indicators untuk each settings category
- **Quick Actions**: One-click access ke common settings operations
- **Recent Changes**: Timeline of recent configuration changes
- **Validation Status**: Overall configuration health score dan issues
- **Performance Metrics**: Settings performance impact dan optimization recommendations

**Dashboard Components:**
```typescript
interface SettingsDashboard {
  overview: {
    totalSettings: number;
    activeConfigurations: number;
    validationScore: number;
    securityScore: number;
    lastUpdated: Date;
  };
  categories: SettingsCategory[];
  recentChanges: SettingsChange[];
  healthChecks: HealthCheck[];
  quickActions: QuickAction[];
}
```

---

### **Settings Templates Manager**

**Template management interface** untuk creating, managing, dan applying settings templates.

**Template Manager Features:**
- **Template Library**: Browse available templates by category dan industry
- **Template Creator**: Visual template creation dengan drag-and-drop interface
- **Template Editor**: Advanced template editing dengan JSON schema validation
- **Template Preview**: Live preview of template configurations
- **Template Versioning**: Version management dengan rollback capabilities
- **Template Sharing**: Share templates across tenants atau make public

**Template Categories:**
- **Business Type Templates**: E-commerce, Service, Manufacturing, Etching
- **Industry Templates**: Retail, Healthcare, Education, Technology
- **Custom Templates**: Tenant-specific custom templates
- **System Templates**: Platform-provided default templates

---

### **Configuration Validation Center**

**Real-time validation interface** untuk monitoring dan managing configuration health.

**Validation Center Features:**
- **Validation Dashboard**: Real-time validation status untuk all configurations
- **Issue Tracker**: Detailed tracking of validation issues dan resolutions
- **Auto-fix Suggestions**: Automated remediation recommendations
- **Validation Rules Manager**: Custom validation rules creation dan management
- **Performance Impact Analysis**: Configuration performance impact assessment
- **Compliance Checker**: Regulatory compliance validation (GDPR, SOC2, ISO 27001)

**Validation Interface:**
```typescript
interface ValidationCenter {
  validationSummary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warningChecks: number;
    overallScore: number;
  };
  issues: ValidationIssue[];
  recommendations: AutoFixSuggestion[];
  complianceStatus: ComplianceStatus;
}
```

---

### **Settings Security Center**

**Security monitoring interface** untuk settings configurations dengan threat detection.

**Security Center Features:**
- **Security Dashboard**: Real-time security status dan threat monitoring
- **Vulnerability Scanner**: Automated security vulnerability detection
- **Compliance Monitor**: Regulatory compliance tracking dan reporting
- **Risk Assessment**: Configuration risk analysis dengan mitigation recommendations
- **Quarantine Manager**: Manage quarantined configurations dan remediation
- **Audit Log Viewer**: Comprehensive audit trail dengan filtering dan search

**Security Monitoring:**
- **Real-time Alerts**: Instant notifications untuk security issues
- **Threat Intelligence**: Integration dengan security threat databases
- **Automated Remediation**: Automatic fixing of common security issues
- **Security Scoring**: Overall security score dengan detailed breakdown
- **Compliance Reporting**: Automated compliance reports untuk audits

---

### **Settings Analytics Dashboard**

**Advanced analytics interface** untuk settings usage, performance, dan optimization insights.

**Analytics Dashboard Features:**
- **Usage Analytics**: Configuration usage patterns dan trends
- **Performance Monitoring**: Real-time performance metrics dan optimization
- **Business Intelligence**: Cost impact analysis dan ROI calculations
- **Predictive Analytics**: Usage predictions dan capacity planning
- **Custom Reports**: Tailored reports untuk different stakeholders
- **Data Visualization**: Interactive charts, graphs, dan heatmaps

**Analytics Widgets:**
- **Usage Heatmap**: Visual representation of settings usage patterns
- **Performance Trends**: Historical performance trends dengan forecasting
- **Cost Analysis**: Configuration cost impact dan optimization opportunities
- **User Behavior**: User interaction patterns dengan settings
- **System Health**: Overall system health metrics dan alerts

---

### **Import/Export Manager**

**Data management interface** untuk settings backup, migration, dan synchronization.

**Import/Export Features:**
- **Export Wizard**: Step-by-step export process dengan customization options
- **Import Wizard**: Guided import process dengan validation dan preview
- **Bulk Operations**: Mass configuration management dengan progress tracking
- **Format Converter**: Automatic conversion between different data formats
- **Migration Tools**: Environment migration dengan compatibility checking
- **Backup Manager**: Automated backup scheduling dan management

**Supported Operations:**
- **Full Export**: Complete settings export untuk backup atau migration
- **Selective Export**: Export specific settings categories atau configurations
- **Template Export**: Export configurations as reusable templates
- **Incremental Import**: Import only changed configurations
- **Merge Import**: Merge imported configurations dengan existing settings

---

### **Version Control Interface**

**Git-like version control interface** untuk settings changes dengan collaborative management.

**Version Control Features:**
- **Change History**: Complete timeline of all configuration changes
- **Version Comparison**: Side-by-side comparison of different versions
- **Branch Management**: Create dan manage configuration branches
- **Merge Interface**: Visual merge interface dengan conflict resolution
- **Rollback Manager**: Safe rollback ke previous versions dengan impact analysis
- **Collaboration Tools**: Multi-user collaboration dengan real-time updates

**Workflow Management:**
- **Change Approval**: Approval workflow untuk critical configuration changes
- **Impact Assessment**: Automatic impact analysis untuk proposed changes
- **Testing Integration**: Automated testing of configuration changes
- **Deployment Pipeline**: Staged deployment dengan validation gates
- **Audit Trail**: Complete audit trail untuk compliance dan debugging

---

### **Settings Configuration Editor**

**Advanced configuration editor** dengan Monaco Editor integration untuk complex settings.

**Editor Features:**
- **Monaco Editor**: Full-featured code editor dengan syntax highlighting
- **IntelliSense**: Auto-completion dan intelligent suggestions
- **Schema Validation**: Real-time JSON schema validation
- **Error Detection**: Syntax error detection dengan inline error messages
- **Format Support**: JSON, YAML, XML, dan custom format support
- **Live Preview**: Real-time preview of configuration changes

**Advanced Editing:**
- **Multi-tab Interface**: Edit multiple configurations simultaneously
- **Split View**: Side-by-side editing dan comparison
- **Search & Replace**: Advanced search dan replace functionality
- **Code Folding**: Collapse/expand configuration sections
- **Minimap**: Code minimap untuk easy navigation
- **Themes**: Multiple editor themes untuk user preference

---

### **Settings Marketplace (Future)**

**Marketplace interface** untuk sharing dan discovering settings templates dan configurations.

**Marketplace Features:**
- **Template Marketplace**: Browse dan download community-created templates
- **Template Rating**: Rate dan review templates
- **Template Categories**: Organized categories untuk easy discovery
- **Template Search**: Advanced search dengan filters dan tags
- **Template Publishing**: Publish custom templates untuk community
- **Template Analytics**: Usage analytics untuk published templates

---

## API ENDPOINTS

### **Core Settings API**

### Site Settings

```yaml
# Get site settings
GET /api/tenant/settings/site
Response: SiteSettings

# Update site settings
PUT /api/tenant/settings/site
Body: {
  site_name: string
  site_url: string
  contact_email: string
  is_maintenance_mode: boolean
  social_links: object
}

# Toggle maintenance mode
POST /api/tenant/settings/site/maintenance-mode
Body: { enabled: boolean, message: string }
```

### Email Settings

```yaml
# Get email settings
GET /api/tenant/settings/email
Response: EmailSettings

# Update email settings
PUT /api/tenant/settings/email
Body: {
  provider: string
  from_email: string
  from_name: string
  smtp_config: object
  notification_preferences: object
}

# Test email configuration
POST /api/tenant/settings/email/test
Body: { test_email: string }
Response: { success: boolean, message: string }
```

### Payment Settings

```yaml
# Get payment settings
GET /api/tenant/settings/payment
Response: PaymentSettings

# Update payment settings
PUT /api/tenant/settings/payment
Body: {
  provider: string
  currency: string
  is_production: boolean
  midtrans_config: object
  accepted_methods: object
}

# Test payment gateway
POST /api/tenant/settings/payment/test
Body: { amount: number }
Response: { success: boolean, transaction_id: string }
```

### Analytics Settings

```yaml
# Get analytics settings
GET /api/tenant/settings/analytics
Response: AnalyticsSettings

# Update analytics settings
PUT /api/tenant/settings/analytics
Body: {
  google_analytics_id: string
  facebook_pixel_id: string
  custom_scripts: object
}
```

### Integration Settings

```yaml
# Get integration settings
GET /api/tenant/settings/integrations
Response: IntegrationSettings

# Update integration settings
PUT /api/tenant/settings/integrations
Body: {
  whatsapp_business_number: string
  storage_provider: string
  storage_config: object
  cdn_enabled: boolean
}

# Test storage connection
POST /api/tenant/settings/integrations/test-storage
Response: { success: boolean, accessible: boolean }
```

### Backup Settings

```yaml
# Get backup settings
GET /api/tenant/settings/backup
Response: BackupSettings

# Update backup settings
PUT /api/tenant/settings/backup
Body: {
  is_enabled: boolean
  schedule: string
  retention_days: number
  backup_storage: string
}

# Trigger manual backup
POST /api/tenant/settings/backup/create
Response: { backup_id: string, status: string }

# List available backups
GET /api/tenant/settings/backup/list
Response: Backup[]

# Download backup
GET /api/tenant/settings/backup/{backup_id}/download
Response: File (binary)

# Restore from backup
POST /api/tenant/settings/backup/{backup_id}/restore
Body: { confirm: boolean }
```

### Batch Operations

```yaml
# Get all settings
GET /api/tenant/settings/all
Response: {
  site: SiteSettings
  email: EmailSettings
  payment: PaymentSettings
  analytics: AnalyticsSettings
  integrations: IntegrationSettings
  backup: BackupSettings
}

# Export settings
GET /api/tenant/settings/export
Query: ?format=json
Response: JSON file

# Import settings
POST /api/tenant/settings/import
Body: FormData (file: settings.json)
Response: { imported: number, failed: number }
```

---

### **Advanced Settings API**

### Settings Templates

```yaml
# Get all templates
GET /api/tenant/settings/templates
Query: ?category=business_type&subcategory=etching
Response: SettingsTemplate[]

# Get template by ID
GET /api/tenant/settings/templates/{template_id}
Response: SettingsTemplate

# Create new template
POST /api/tenant/settings/templates
Body: {
  name: string
  description: string
  category: string
  subcategory: string
  template_data: object
  tags: string[]
}
Response: SettingsTemplate

# Update template
PUT /api/tenant/settings/templates/{template_id}
Body: SettingsTemplate
Response: SettingsTemplate

# Delete template
DELETE /api/tenant/settings/templates/{template_id}
Response: { success: boolean }

# Apply template
POST /api/tenant/settings/templates/{template_id}/apply
Body: { 
  override_existing: boolean
  selected_sections: string[]
}
Response: { applied_settings: string[], conflicts: string[] }

# Get template usage analytics
GET /api/tenant/settings/templates/{template_id}/analytics
Response: {
  usage_count: number
  last_used_at: Date
  success_rate: number
  user_feedback: object[]
}
```

### Settings Validation

```yaml
# Validate all settings
POST /api/tenant/settings/validate
Body: { 
  scope: 'all_settings' | 'specific_table'
  settings_table?: string
}
Response: ValidationResult

# Get validation results
GET /api/tenant/settings/validation-results
Query: ?status=failed&limit=50
Response: ValidationResult[]

# Get validation result by ID
GET /api/tenant/settings/validation-results/{result_id}
Response: ValidationResult

# Apply auto-fix suggestions
POST /api/tenant/settings/validation-results/{result_id}/auto-fix
Body: { 
  apply_suggestions: string[]
  create_backup: boolean
}
Response: { fixed_issues: string[], remaining_issues: string[] }

# Get validation rules
GET /api/tenant/settings/validation-rules
Response: ValidationRule[]

# Create custom validation rule
POST /api/tenant/settings/validation-rules
Body: {
  name: string
  description: string
  rule_type: string
  rule_config: object
  severity: 'low' | 'medium' | 'high' | 'critical'
}
Response: ValidationRule
```

### Settings Security

```yaml
# Run security scan
POST /api/tenant/settings/security/scan
Body: {
  scan_type: 'security' | 'compliance' | 'vulnerability'
  scan_scope: 'all_settings' | 'specific_table'
  settings_table?: string
}
Response: SecurityScanResult

# Get security scan results
GET /api/tenant/settings/security/scans
Query: ?status=completed&risk_level=high
Response: SecurityScanResult[]

# Get security scan by ID
GET /api/tenant/settings/security/scans/{scan_id}
Response: SecurityScanResult

# Apply security remediation
POST /api/tenant/settings/security/scans/{scan_id}/remediate
Body: {
  remediation_actions: string[]
  auto_remediate: boolean
}
Response: { remediated_issues: string[], pending_issues: string[] }

# Get compliance status
GET /api/tenant/settings/security/compliance
Response: {
  gdpr_status: ComplianceStatus
  soc2_status: ComplianceStatus
  iso27001_status: ComplianceStatus
  overall_score: number
}

# Quarantine settings
POST /api/tenant/settings/security/quarantine
Body: {
  settings_table: string
  settings_id: number
  quarantine_reason: string
}
Response: { quarantined: boolean, quarantine_id: string }
```

### Settings Analytics

```yaml
# Get analytics dashboard
GET /api/tenant/settings/analytics/dashboard
Query: ?period=last_30_days
Response: {
  usage_metrics: object
  performance_metrics: object
  optimization_score: number
  trends: object[]
}

# Get usage analytics
GET /api/tenant/settings/analytics/usage
Query: ?settings_table=site_settings&period_type=daily
Response: AnalyticsData[]

# Get performance analytics
GET /api/tenant/settings/analytics/performance
Query: ?period_start=2025-11-01&period_end=2025-11-30
Response: {
  avg_response_time: number
  total_requests: number
  failed_requests: number
  performance_trends: object[]
}

# Get optimization recommendations
GET /api/tenant/settings/analytics/optimization
Response: {
  recommendations: OptimizationRecommendation[]
  potential_savings: object
  implementation_complexity: object
}

# Get business intelligence
GET /api/tenant/settings/analytics/business-intelligence
Response: {
  cost_impact: number
  efficiency_gains: number
  user_satisfaction: number
  roi_analysis: object
}

# Create custom report
POST /api/tenant/settings/analytics/reports
Body: {
  report_name: string
  report_type: string
  filters: object
  metrics: string[]
  schedule?: object
}
Response: CustomReport
```

### Import/Export Management

```yaml
# Create export operation
POST /api/tenant/settings/import-export/export
Body: {
  operation_scope: 'all_settings' | 'specific_tables'
  tables_included?: string[]
  file_format: 'json' | 'yaml' | 'xml' | 'csv'
  operation_purpose: 'backup' | 'migration' | 'sync'
}
Response: { operation_id: string, status: string }

# Create import operation
POST /api/tenant/settings/import-export/import
Body: FormData {
  file: File
  operation_scope: string
  validation_mode: 'strict' | 'lenient'
  conflict_resolution: 'overwrite' | 'merge' | 'skip'
}
Response: { operation_id: string, status: string }

# Get import/export operations
GET /api/tenant/settings/import-export/operations
Query: ?operation_type=export&status=completed
Response: ImportExportOperation[]

# Get operation status
GET /api/tenant/settings/import-export/operations/{operation_id}
Response: ImportExportOperation

# Download export file
GET /api/tenant/settings/import-export/operations/{operation_id}/download
Response: File (binary)

# Cancel operation
POST /api/tenant/settings/import-export/operations/{operation_id}/cancel
Response: { cancelled: boolean }

# Get operation logs
GET /api/tenant/settings/import-export/operations/{operation_id}/logs
Response: { logs: string[], errors: string[], warnings: string[] }
```

### Version Control

```yaml
# Get version history
GET /api/tenant/settings/versions
Query: ?settings_table=site_settings&limit=50
Response: VersionHistory[]

# Get version by ID
GET /api/tenant/settings/versions/{version_id}
Response: VersionHistory

# Create version checkpoint
POST /api/tenant/settings/versions/checkpoint
Body: {
  settings_table: string
  settings_record_id: number
  change_summary: string
  change_reason: string
}
Response: VersionHistory

# Compare versions
GET /api/tenant/settings/versions/compare
Query: ?version1={id}&version2={id}
Response: {
  differences: object[]
  change_summary: string
  impact_analysis: object
}

# Rollback to version
POST /api/tenant/settings/versions/{version_id}/rollback
Body: {
  rollback_reason: string
  create_backup: boolean
  notify_users: boolean
}
Response: { rollback_successful: boolean, new_version_id: string }

# Get rollback impact
GET /api/tenant/settings/versions/{version_id}/rollback-impact
Response: {
  affected_systems: string[]
  risk_level: string
  rollback_complexity: string
  estimated_downtime: number
}

# Approve version change
POST /api/tenant/settings/versions/{version_id}/approve
Body: {
  approval_notes: string
  approved_by: number
}
Response: { approved: boolean, deployment_scheduled: boolean }

# Get approval workflow
GET /api/tenant/settings/versions/{version_id}/approval-workflow
Response: {
  requires_approval: boolean
  approval_status: string
  approvers: User[]
  approval_history: object[]
}
```

### Settings Dashboard

```yaml
# Get dashboard overview
GET /api/tenant/settings/dashboard
Response: {
  overview: {
    total_settings: number
    active_configurations: number
    validation_score: number
    security_score: number
    last_updated: Date
  }
  categories: SettingsCategory[]
  recent_changes: SettingsChange[]
  health_checks: HealthCheck[]
  alerts: Alert[]
}

# Get health status
GET /api/tenant/settings/health
Response: {
  overall_health: 'healthy' | 'warning' | 'critical'
  category_health: object
  issues: HealthIssue[]
  recommendations: string[]
}

# Get recent activity
GET /api/tenant/settings/activity
Query: ?limit=20&activity_type=configuration_change
Response: Activity[]

# Get system alerts
GET /api/tenant/settings/alerts
Query: ?severity=high&status=active
Response: Alert[]

# Acknowledge alert
POST /api/tenant/settings/alerts/{alert_id}/acknowledge
Body: { acknowledged_by: number, notes: string }
Response: { acknowledged: boolean }
```

---

## ADMIN UI FEATURES

### 1. Settings Page (Implemented)

**Location:** `src/pages/admin/Settings.tsx`

**Tabs:**
- ✅ General - Site information, maintenance mode
- ✅ Notifications - Email notification preferences
- ✅ Security - SSL, 2FA, IP restrictions
- ✅ Integrations - Analytics, email service, payment gateway, WhatsApp
- ✅ Backup - Automated backup configuration

**Features:**
- ✅ Tabbed interface for organized settings
- ✅ Real-time form validation
- ✅ Save button with loading state
- ✅ Toast notifications for success/error
- ✅ Grouped settings by category
- ⏳ Test buttons for integrations (planned)
- ⏳ Settings version history (planned)

---

## SAMPLE DATA

### Sample Site Settings

```sql
INSERT INTO site_settings (tenant_id, site_name, site_url, contact_email, is_maintenance_mode, timezone, social_links) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'PT Custom Etching Xenial', 'https://ptcex.com', 'contact@ptcex.com', FALSE, 'Asia/Jakarta',
'{"facebook":"https://facebook.com/ptcex","instagram":"https://instagram.com/ptcex","whatsapp":"+6281234567890"}');
```

### Sample Email Settings

```sql
INSERT INTO email_settings (tenant_id, provider, from_email, from_name, smtp_config, notification_preferences) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'smtp', 'noreply@ptcex.com', 'PT CEX', 
'{"host":"smtp.gmail.com","port":587,"encryption":"tls","username":"noreply@ptcex.com","password":"encrypted"}',
'{"new_orders":true,"new_reviews":true,"contact_submissions":true,"low_stock_alerts":true,"system_updates":false}');
```

### Sample Payment Settings

```sql
INSERT INTO payment_settings (tenant_id, provider, currency, is_production, accepted_methods, midtrans_config) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'midtrans', 'IDR', FALSE,
'{"cash":true,"credit_card":true,"e_wallet":true,"bank_transfer":true,"qris":true}',
'{"server_key":"encrypted_key","client_key":"Mid-client-xxxx","sandbox_mode":true}');
```

### Sample Backup Settings

```sql
INSERT INTO backup_settings (tenant_id, is_enabled, schedule, retention_days, backup_storage, last_backup_at, last_backup_status) VALUES
('550e8400-e29b-41d4-a716-446655440000', TRUE, 'daily', 30, 'local', '2025-11-11 02:00:00', 'success');
```

---

## MIGRATION SCRIPT

```sql
-- Migration: Create settings tables
-- Version: 1.0
-- Date: 2025-11-11

BEGIN;

-- Create site_settings table
CREATE TABLE site_settings (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    site_name VARCHAR(255) NOT NULL,
    site_url VARCHAR(500) NOT NULL,
    site_description TEXT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NULL,
    contact_address TEXT NULL,
    logo_url VARCHAR(500) NULL,
    favicon_url VARCHAR(500) NULL,
    is_maintenance_mode BOOLEAN DEFAULT FALSE,
    maintenance_message TEXT NULL,
    timezone VARCHAR(100) DEFAULT 'Asia/Jakarta',
    social_links JSONB NULL,
    metadata JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_site_settings_per_tenant UNIQUE (tenant_id)
);

CREATE INDEX idx_site_settings_tenant_id ON site_settings(tenant_id);
CREATE INDEX idx_site_settings_is_maintenance ON site_settings(is_maintenance_mode);

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON site_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create email_settings table
CREATE TABLE email_settings (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'smtp',
    is_enabled BOOLEAN DEFAULT TRUE,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255) NOT NULL,
    reply_to_email VARCHAR(255) NULL,
    smtp_config JSONB NULL,
    sendgrid_config JSONB NULL,
    mailgun_config JSONB NULL,
    notification_preferences JSONB NULL,
    daily_limit INT DEFAULT 1000,
    metadata JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_email_settings_per_tenant UNIQUE (tenant_id),
    CONSTRAINT check_provider CHECK (provider IN ('smtp', 'sendgrid', 'mailgun'))
);

CREATE INDEX idx_email_settings_tenant_id ON email_settings(tenant_id);
CREATE INDEX idx_email_settings_provider ON email_settings(provider);

CREATE TRIGGER update_email_settings_updated_at
BEFORE UPDATE ON email_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create payment_settings table
CREATE TABLE payment_settings (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'midtrans',
    is_enabled BOOLEAN DEFAULT TRUE,
    is_production BOOLEAN DEFAULT FALSE,
    currency VARCHAR(10) DEFAULT 'IDR',
    accepted_methods JSONB NOT NULL DEFAULT '{"cash":true,"credit_card":true,"e_wallet":true,"bank_transfer":true,"qris":true}',
    midtrans_config JSONB NULL,
    xendit_config JSONB NULL,
    stripe_config JSONB NULL,
    callback_url VARCHAR(500) NULL,
    return_url VARCHAR(500) NULL,
    metadata JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_payment_settings_per_tenant UNIQUE (tenant_id),
    CONSTRAINT check_provider CHECK (provider IN ('midtrans', 'xendit', 'stripe'))
);

CREATE INDEX idx_payment_settings_tenant_id ON payment_settings(tenant_id);
CREATE INDEX idx_payment_settings_provider ON payment_settings(provider);
CREATE INDEX idx_payment_settings_is_enabled ON payment_settings(is_enabled);

CREATE TRIGGER update_payment_settings_updated_at
BEFORE UPDATE ON payment_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create analytics_settings table
CREATE TABLE analytics_settings (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    google_analytics_id VARCHAR(50) NULL,
    google_tag_manager_id VARCHAR(50) NULL,
    facebook_pixel_id VARCHAR(50) NULL,
    custom_scripts JSONB NULL,
    is_tracking_enabled BOOLEAN DEFAULT TRUE,
    tracked_events JSONB NULL,
    metadata JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_analytics_settings_per_tenant UNIQUE (tenant_id)
);

CREATE INDEX idx_analytics_settings_tenant_id ON analytics_settings(tenant_id);

CREATE TRIGGER update_analytics_settings_updated_at
BEFORE UPDATE ON analytics_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create integration_settings table
CREATE TABLE integration_settings (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    whatsapp_business_number VARCHAR(50) NULL,
    whatsapp_default_message TEXT NULL,
    storage_provider VARCHAR(50) DEFAULT 'local',
    storage_config JSONB NULL,
    cdn_enabled BOOLEAN DEFAULT FALSE,
    cdn_url VARCHAR(500) NULL,
    api_rate_limit INT DEFAULT 1000,
    webhook_urls JSONB NULL,
    metadata JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_integration_settings_per_tenant UNIQUE (tenant_id),
    CONSTRAINT check_storage_provider CHECK (storage_provider IN ('local', 's3', 'cloudinary', 'google_cloud'))
);

CREATE INDEX idx_integration_settings_tenant_id ON integration_settings(tenant_id);

CREATE TRIGGER update_integration_settings_updated_at
BEFORE UPDATE ON integration_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create backup_settings table
CREATE TABLE backup_settings (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    schedule VARCHAR(50) DEFAULT 'daily',
    backup_time TIME DEFAULT '02:00:00',
    retention_days INT DEFAULT 30,
    retention_weekly INT DEFAULT 4,
    retention_monthly INT DEFAULT 12,
    backup_storage VARCHAR(50) DEFAULT 'local',
    storage_path VARCHAR(500) NULL,
    include_database BOOLEAN DEFAULT TRUE,
    include_media BOOLEAN DEFAULT TRUE,
    last_backup_at TIMESTAMP NULL,
    last_backup_status VARCHAR(50) NULL,
    last_backup_size BIGINT NULL,
    metadata JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_backup_settings_per_tenant UNIQUE (tenant_id),
    CONSTRAINT check_schedule CHECK (schedule IN ('hourly', 'daily', 'weekly', 'monthly')),
    CONSTRAINT check_storage CHECK (backup_storage IN ('local', 's3', 'google_cloud', 'azure'))
);

CREATE INDEX idx_backup_settings_tenant_id ON backup_settings(tenant_id);
CREATE INDEX idx_backup_settings_is_enabled ON backup_settings(is_enabled);
CREATE INDEX idx_backup_settings_last_backup_at ON backup_settings(last_backup_at);

CREATE TRIGGER update_backup_settings_updated_at
BEFORE UPDATE ON backup_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

---

## PERFORMANCE INDEXES

### Index Strategy

```sql
-- Site settings indexes
CREATE INDEX idx_site_settings_tenant_id ON site_settings(tenant_id);
CREATE INDEX idx_site_settings_is_maintenance ON site_settings(is_maintenance_mode);

-- Email settings indexes
CREATE INDEX idx_email_settings_tenant_id ON email_settings(tenant_id);
CREATE INDEX idx_email_settings_provider ON email_settings(provider);

-- Payment settings indexes
CREATE INDEX idx_payment_settings_tenant_id ON payment_settings(tenant_id);
CREATE INDEX idx_payment_settings_provider ON payment_settings(provider);
CREATE INDEX idx_payment_settings_is_enabled ON payment_settings(is_enabled);

-- Analytics settings indexes
CREATE INDEX idx_analytics_settings_tenant_id ON analytics_settings(tenant_id);

-- Integration settings indexes
CREATE INDEX idx_integration_settings_tenant_id ON integration_settings(tenant_id);

-- Backup settings indexes
CREATE INDEX idx_backup_settings_tenant_id ON backup_settings(tenant_id);
CREATE INDEX idx_backup_settings_is_enabled ON backup_settings(is_enabled);
CREATE INDEX idx_backup_settings_last_backup_at ON backup_settings(last_backup_at);
```

### Query Performance Benchmarks

**Expected Performance (1,000 tenants):**

| Query Type | Expected Time | Index Used |
|------------|---------------|------------|
| Get all settings for tenant | < 10ms | idx_*_tenant_id (all tables) |
| Get site settings | < 5ms | idx_site_settings_tenant_id |
| Check maintenance mode | < 3ms | idx_site_settings_is_maintenance |
| Get payment settings | < 5ms | idx_payment_settings_tenant_id |
| Get backup history | < 15ms | idx_backup_settings_tenant_id |

### Optimization Techniques

**1. Settings Caching:**
```typescript
// Cache settings in Redis for 5 minutes
const cacheKey = `settings:${tenantId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const settings = await db.getAllSettings(tenantId);
await redis.setex(cacheKey, 300, JSON.stringify(settings));
return settings;
```

**2. Lazy Loading Settings:**
```typescript
// Load only required settings category
const paymentSettings = await getPaymentSettings(tenantId);
// Don't load email, analytics, etc. if not needed
```

**3. Settings Change Detection:**
```typescript
// Invalidate cache on settings update
await db.updateSiteSettings(tenantId, updates);
await redis.del(`settings:${tenantId}`);
await redis.del(`settings:${tenantId}:site`);
```

---

**Previous:** [16-LANGUAGE.md](./16-LANGUAGE.md)  
**Next:** [18-SEO.md](./18-SEO.md)

**Last Updated:** 2025-11-11  
**Status:** ✅ COMPLETE  
**Reviewed By:** System Architect
