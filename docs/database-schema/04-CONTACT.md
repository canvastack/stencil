# CONTACT MANAGEMENT ENGINE
## Enterprise-Grade Contact & Communication System

**Version:** 2.0 Enterprise  
**Last Updated:** November 12, 2025  
**Module:** Multi-Tenant Contact Management & Lead Generation  
**Total Fields:** 150+  
**Total Tables:** 11  
**Admin Page:** `src/pages/admin/PageContact.tsx`  
**Architecture:** Hexagonal with Multi-Tenant Support  
**Compliance:** GDPR, SOC2, Enterprise Audit Ready

---

## EXECUTIVE SUMMARY

**Contact Management Engine** adalah sistem enterprise-grade untuk mengelola komunikasi customer, lead generation, dan customer relationship management dalam arsitektur multi-tenant. Sistem ini dirancang untuk mendukung complex business requirements dengan scalability tinggi dan compliance standards.

### **Business Value**
- 💰 **Lead Conversion**: Advanced lead scoring & nurturing workflows
- 💰 **Customer Insights**: Comprehensive analytics & behavioral tracking  
- 💰 **Marketing Integration**: CRM, email marketing, dan automation tools
- 💰 **Compliance**: GDPR-ready dengan audit trails & data retention policies

### **Enterprise Features**
1. **Multi-Tenant Contact Management** - Isolated contact databases per tenant
2. **Advanced Form Builder** - Dynamic forms dengan conditional logic & validation
3. **Lead Scoring & Nurturing** - Automated lead qualification & follow-up workflows
4. **Multi-Channel Communication** - Email, SMS, WhatsApp, social media integration
5. **Analytics & Reporting** - Comprehensive contact analytics & conversion tracking
6. **CRM Integration** - Seamless integration dengan popular CRM systems
7. **Compliance & Security** - GDPR compliance, data encryption, audit logging
8. **Multi-Language Support** - Internationalization untuk global reach
9. **Advanced Notifications** - Real-time alerts & automated responses
10. **API-First Architecture** - RESTful APIs untuk third-party integrations

### **Core Capabilities**
- **Dynamic Contact Forms** dengan advanced validation & conditional fields
- **Contact Database** dengan comprehensive customer profiles & interaction history
- **Lead Management** dengan scoring, qualification, dan nurturing workflows
- **Communication Hub** untuk multi-channel customer interactions
- **Analytics Dashboard** dengan conversion tracking & performance metrics
- **Integration Platform** untuk CRM, marketing tools, dan business systems

---

## MULTI-TENANT DATABASE SCHEMA

### **Schema Overview**

**Multi-Tenant Architecture:** All tables include `tenant_id` untuk complete data isolation  
**Row-Level Security:** PostgreSQL RLS policies enforce tenant boundaries  
**Audit Compliance:** Complete audit trails untuk enterprise compliance  
**Performance:** Strategic indexing untuk optimal query performance  

### **Table 1: Contact Pages (Multi-Tenant)**

```sql
CREATE TABLE contact_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Page identification
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    
    -- Hero section
    hero_title VARCHAR(255) NOT NULL DEFAULT 'Contact Us',
    hero_subtitle TEXT NULL,
    hero_background_image TEXT NULL,
    hero_background_color VARCHAR(20) DEFAULT '#0f172a',
    
    -- Page settings
    is_enabled BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    
    -- SEO & Meta
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    meta_keywords TEXT[] DEFAULT '{}',
    og_image TEXT NULL,
    
    -- Customization
    custom_css TEXT NULL,
    custom_js TEXT NULL,
    
    -- Multi-language support
    language_code VARCHAR(10) DEFAULT 'en',
    translations JSONB DEFAULT '{}',
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Indexes for performance
CREATE INDEX idx_contact_pages_tenant ON contact_pages(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_pages_page ON contact_pages(page_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_pages_language ON contact_pages(language_code);
CREATE INDEX idx_contact_pages_enabled ON contact_pages(is_enabled, is_public) WHERE deleted_at IS NULL;

-- Unique constraint
ALTER TABLE contact_pages ADD CONSTRAINT unique_contact_pages_tenant_page 
    UNIQUE (tenant_id, page_id, language_code);

-- Row-Level Security
ALTER TABLE contact_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_contact_pages ON contact_pages
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Audit trigger
CREATE TRIGGER update_contact_pages_updated_at 
    BEFORE UPDATE ON contact_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER audit_contact_pages_changes
    AFTER INSERT OR UPDATE OR DELETE ON contact_pages
    FOR EACH ROW EXECUTE FUNCTION audit_table_changes();
```

### **Table 2: Contact Information (Multi-Tenant)**

```sql
CREATE TABLE contact_information (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Page reference
    contact_page_id UUID NOT NULL REFERENCES contact_pages(id) ON DELETE CASCADE,
    
    -- Information details
    info_type VARCHAR(50) NOT NULL CHECK (info_type IN (
        'address', 'phone', 'email', 'hours', 'social', 'website', 'fax', 'custom'
    )),
    
    icon_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    
    -- Contact details (structured data)
    contact_data JSONB DEFAULT '{}', -- Store structured contact info
    
    -- Display settings
    display_order INTEGER DEFAULT 0,
    is_enabled BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Styling
    icon_color VARCHAR(20) NULL,
    background_color VARCHAR(20) NULL,
    text_color VARCHAR(20) NULL,
    
    -- Multi-language support
    language_code VARCHAR(10) DEFAULT 'en',
    translations JSONB DEFAULT '{}',
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Indexes for performance
CREATE INDEX idx_contact_information_tenant ON contact_information(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_information_page ON contact_information(contact_page_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_information_type ON contact_information(info_type);
CREATE INDEX idx_contact_information_order ON contact_information(display_order);
CREATE INDEX idx_contact_information_enabled ON contact_information(is_enabled) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_information_language ON contact_information(language_code);

-- Row-Level Security
ALTER TABLE contact_information ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_contact_information ON contact_information
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Audit triggers
CREATE TRIGGER update_contact_information_updated_at 
    BEFORE UPDATE ON contact_information
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER audit_contact_information_changes
    AFTER INSERT OR UPDATE OR DELETE ON contact_information
    FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

-- Comments
COMMENT ON COLUMN contact_information.info_type IS 'Type of contact information: address, phone, email, hours, social, website, fax, custom';
COMMENT ON COLUMN contact_information.contact_data IS 'Structured contact data: {"phone": "+1234567890", "extension": "123", "department": "Sales"}';
COMMENT ON COLUMN contact_information.translations IS 'Multi-language translations: {"es": {"title": "Dirección", "content": "..."}}';
```

**Enhanced Contact Data Structure:**
```json
{
  "address": {
    "street": "123 Business Ave",
    "city": "Jakarta",
    "state": "DKI Jakarta",
    "postal_code": "12345",
    "country": "Indonesia",
    "coordinates": {
      "lat": -6.2088,
      "lng": 106.8456
    }
  },
  "phone": {
    "number": "+62-21-1234567",
    "extension": "123",
    "department": "Sales",
    "available_hours": "9:00-17:00",
    "timezone": "Asia/Jakarta"
  },
  "email": {
    "address": "contact@company.com",
    "department": "General Inquiry",
    "auto_reply": true,
    "response_time": "24 hours"
  },
  "social": {
    "platform": "whatsapp",
    "handle": "+6281234567890",
    "url": "https://wa.me/6281234567890"
  }
}
```

### **Table 3: Contact Forms (Advanced Form Builder)**

```sql
CREATE TABLE contact_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Page reference
    contact_page_id UUID NOT NULL REFERENCES contact_pages(id) ON DELETE CASCADE,
    
    -- Form identification
    form_name VARCHAR(255) NOT NULL,
    form_slug VARCHAR(255) NOT NULL,
    
    -- Form settings
    title VARCHAR(255) NOT NULL DEFAULT 'Contact Us',
    subtitle TEXT NULL,
    description TEXT NULL,
    
    -- Messages
    success_message TEXT NOT NULL DEFAULT 'Thank you! We will contact you soon.',
    error_message TEXT DEFAULT 'Sorry, there was an error sending your message.',
    
    -- Form behavior
    is_enabled BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    requires_auth BOOLEAN DEFAULT FALSE,
    
    -- Submission settings
    max_submissions_per_day INTEGER DEFAULT 10,
    max_submissions_per_ip INTEGER DEFAULT 3,
    enable_captcha BOOLEAN DEFAULT TRUE,
    
    -- Notifications
    notification_emails TEXT[] DEFAULT '{}',
    auto_reply_enabled BOOLEAN DEFAULT TRUE,
    auto_reply_template TEXT NULL,
    
    -- Lead scoring
    lead_score_base INTEGER DEFAULT 10,
    lead_scoring_rules JSONB DEFAULT '{}',
    
    -- Integration settings
    crm_integration JSONB DEFAULT '{}',
    webhook_url TEXT NULL,
    webhook_events TEXT[] DEFAULT '{}',
    
    -- Analytics
    conversion_tracking BOOLEAN DEFAULT TRUE,
    google_analytics_event VARCHAR(255) NULL,
    facebook_pixel_event VARCHAR(255) NULL,
    
    -- Multi-language support
    language_code VARCHAR(10) DEFAULT 'en',
    translations JSONB DEFAULT '{}',
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Indexes
CREATE INDEX idx_contact_forms_tenant ON contact_forms(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_forms_page ON contact_forms(contact_page_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_forms_slug ON contact_forms(tenant_id, form_slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_forms_enabled ON contact_forms(is_enabled, is_public) WHERE deleted_at IS NULL;

-- Unique constraint
ALTER TABLE contact_forms ADD CONSTRAINT unique_contact_forms_tenant_slug 
    UNIQUE (tenant_id, form_slug);

-- Row-Level Security
ALTER TABLE contact_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_contact_forms ON contact_forms
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### **Table 4: Contact Form Fields (Dynamic Field Builder)**

```sql
CREATE TABLE contact_form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Form reference
    form_id UUID NOT NULL REFERENCES contact_forms(id) ON DELETE CASCADE,
    
    -- Field identification
    field_name VARCHAR(100) NOT NULL,
    field_key VARCHAR(100) NOT NULL, -- For API/database storage
    
    -- Field type and validation
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN (
        'text', 'email', 'tel', 'number', 'url', 'date', 'time', 'datetime',
        'textarea', 'select', 'multiselect', 'checkbox', 'radio', 'file',
        'hidden', 'divider', 'html', 'rating', 'slider', 'color'
    )),
    
    -- Display settings
    field_label VARCHAR(255) NOT NULL,
    placeholder VARCHAR(255) NULL,
    help_text TEXT NULL,
    description TEXT NULL,
    
    -- Validation rules
    is_required BOOLEAN DEFAULT FALSE,
    validation_rules JSONB DEFAULT '{}',
    
    -- Field options (for select, radio, checkbox)
    field_options JSONB DEFAULT '{}',
    
    -- Conditional logic
    conditional_logic JSONB DEFAULT '{}',
    
    -- Display settings
    display_order INTEGER DEFAULT 0,
    is_enabled BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE,
    
    -- Styling
    css_classes VARCHAR(255) NULL,
    custom_css TEXT NULL,
    
    -- Advanced features
    default_value TEXT NULL,
    auto_populate_from VARCHAR(100) NULL, -- user_profile, session, etc.
    
    -- Multi-language support
    language_code VARCHAR(10) DEFAULT 'en',
    translations JSONB DEFAULT '{}',
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Indexes
CREATE INDEX idx_contact_form_fields_tenant ON contact_form_fields(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_form_fields_form ON contact_form_fields(form_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_form_fields_order ON contact_form_fields(display_order);
CREATE INDEX idx_contact_form_fields_type ON contact_form_fields(field_type);
CREATE INDEX idx_contact_form_fields_enabled ON contact_form_fields(is_enabled, is_visible) WHERE deleted_at IS NULL;

-- Unique constraint
ALTER TABLE contact_form_fields ADD CONSTRAINT unique_contact_form_fields_form_key 
    UNIQUE (form_id, field_key);

-- Row-Level Security
ALTER TABLE contact_form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_contact_form_fields ON contact_form_fields
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

**Advanced Validation Rules:**
```json
{
  "minLength": 3,
  "maxLength": 100,
  "pattern": "^[a-zA-Z\\s]+$",
  "customValidation": "phone_number",
  "fileTypes": ["pdf", "jpg", "png", "doc", "docx"],
  "maxFileSize": 5242880,
  "minValue": 0,
  "maxValue": 100,
  "dateRange": {
    "min": "2024-01-01",
    "max": "2025-12-31"
  }
}
```

**Conditional Logic:**
```json
{
  "conditions": [
    {
      "field": "inquiry_type",
      "operator": "equals",
      "value": "quote_request"
    }
  ],
  "action": "show",
  "logic": "AND"
}
```

### **Table 5: Contact Submissions (Lead Management)**

```sql
CREATE TABLE contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Form reference
    form_id UUID NOT NULL REFERENCES contact_forms(id) ON DELETE CASCADE,
    
    -- Submission identification
    submission_code VARCHAR(50) NOT NULL, -- Human-readable code
    
    -- Submission data
    form_data JSONB NOT NULL DEFAULT '{}',
    
    -- Contact information (extracted from form_data)
    contact_name VARCHAR(255) NULL,
    contact_email VARCHAR(255) NULL,
    contact_phone VARCHAR(50) NULL,
    contact_company VARCHAR(255) NULL,
    
    -- Lead information
    lead_source VARCHAR(100) DEFAULT 'contact_form',
    lead_score INTEGER DEFAULT 0,
    lead_status VARCHAR(50) DEFAULT 'new' CHECK (lead_status IN (
        'new', 'contacted', 'qualified', 'proposal', 'negotiation', 
        'won', 'lost', 'nurturing', 'archived'
    )),
    
    -- Submission metadata
    submitter_ip INET NULL,
    submitter_user_agent TEXT NULL,
    submitter_location JSONB DEFAULT '{}', -- GeoIP data
    referrer_url TEXT NULL,
    utm_parameters JSONB DEFAULT '{}',
    
    -- Processing status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'processed', 'failed', 'spam'
    )),
    
    -- Response tracking
    first_response_at TIMESTAMP NULL,
    last_response_at TIMESTAMP NULL,
    response_count INTEGER DEFAULT 0,
    
    -- Assignment
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMP NULL,
    
    -- Follow-up
    next_follow_up_at TIMESTAMP NULL,
    follow_up_notes TEXT NULL,
    
    -- Integration
    crm_sync_status VARCHAR(50) DEFAULT 'pending',
    crm_record_id VARCHAR(255) NULL,
    external_integrations JSONB DEFAULT '{}',
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Indexes for performance
CREATE INDEX idx_contact_submissions_tenant ON contact_submissions(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_submissions_form ON contact_submissions(form_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_lead_status ON contact_submissions(lead_status);
CREATE INDEX idx_contact_submissions_email ON contact_submissions(contact_email) WHERE contact_email IS NOT NULL;
CREATE INDEX idx_contact_submissions_phone ON contact_submissions(contact_phone) WHERE contact_phone IS NOT NULL;
CREATE INDEX idx_contact_submissions_assigned ON contact_submissions(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_contact_submissions_created ON contact_submissions(created_at);
CREATE INDEX idx_contact_submissions_follow_up ON contact_submissions(next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;

-- Full-text search
CREATE INDEX idx_contact_submissions_search ON contact_submissions 
    USING gin(to_tsvector('english', contact_name || ' ' || contact_email || ' ' || contact_company));

-- Row-Level Security
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_contact_submissions ON contact_submissions
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### **Table 6: Contact Responses (Communication History)**

```sql
CREATE TABLE contact_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Submission reference
    submission_id UUID NOT NULL REFERENCES contact_submissions(id) ON DELETE CASCADE,
    
    -- Response details
    response_type VARCHAR(50) NOT NULL CHECK (response_type IN (
        'email', 'phone', 'sms', 'whatsapp', 'meeting', 'note', 'system'
    )),
    
    subject VARCHAR(255) NULL,
    message TEXT NOT NULL,
    
    -- Communication direction
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    
    -- Response metadata
    response_channel VARCHAR(100) NULL, -- email_template_id, phone_number, etc.
    response_data JSONB DEFAULT '{}',
    
    -- Status tracking
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    
    -- Email specific
    email_message_id VARCHAR(255) NULL,
    email_thread_id VARCHAR(255) NULL,
    
    -- Attachments
    attachments JSONB DEFAULT '{}',
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Indexes
CREATE INDEX idx_contact_responses_tenant ON contact_responses(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_responses_submission ON contact_responses(submission_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_responses_type ON contact_responses(response_type);
CREATE INDEX idx_contact_responses_direction ON contact_responses(direction);
CREATE INDEX idx_contact_responses_created ON contact_responses(created_at);
CREATE INDEX idx_contact_responses_unread ON contact_responses(is_read) WHERE is_read = FALSE;

-- Row-Level Security
ALTER TABLE contact_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_contact_responses ON contact_responses
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### **Table 7: Contact Analytics (Performance Tracking)**

```sql
CREATE TABLE contact_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Analytics period
    date_period DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    
    -- Form performance
    form_id UUID REFERENCES contact_forms(id),
    
    -- Metrics
    total_views INTEGER DEFAULT 0,
    total_submissions INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    
    -- Lead metrics
    new_leads INTEGER DEFAULT 0,
    qualified_leads INTEGER DEFAULT 0,
    converted_leads INTEGER DEFAULT 0,
    
    -- Response metrics
    avg_response_time INTERVAL NULL,
    total_responses INTEGER DEFAULT 0,
    
    -- Source tracking
    traffic_sources JSONB DEFAULT '{}',
    utm_campaigns JSONB DEFAULT '{}',
    
    -- Device/Browser analytics
    device_breakdown JSONB DEFAULT '{}',
    browser_breakdown JSONB DEFAULT '{}',
    
    -- Geographic data
    country_breakdown JSONB DEFAULT '{}',
    city_breakdown JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_contact_analytics_tenant ON contact_analytics(tenant_id);
CREATE INDEX idx_contact_analytics_period ON contact_analytics(date_period, period_type);
CREATE INDEX idx_contact_analytics_form ON contact_analytics(form_id) WHERE form_id IS NOT NULL;

-- Unique constraint
ALTER TABLE contact_analytics ADD CONSTRAINT unique_contact_analytics_period 
    UNIQUE (tenant_id, date_period, period_type, form_id);

-- Row-Level Security
ALTER TABLE contact_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_contact_analytics ON contact_analytics
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### **Table 8: Contact Templates (Email/SMS Templates)**

```sql
CREATE TABLE contact_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Template identification
    template_name VARCHAR(255) NOT NULL,
    template_slug VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN (
        'auto_reply', 'follow_up', 'welcome', 'nurturing', 'notification', 'custom'
    )),
    
    -- Template content
    subject VARCHAR(255) NULL,
    content TEXT NOT NULL,
    content_html TEXT NULL,
    
    -- Template settings
    is_enabled BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Trigger conditions
    trigger_conditions JSONB DEFAULT '{}',
    
    -- Personalization
    merge_fields JSONB DEFAULT '{}',
    
    -- Multi-language support
    language_code VARCHAR(10) DEFAULT 'en',
    translations JSONB DEFAULT '{}',
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Indexes
CREATE INDEX idx_contact_templates_tenant ON contact_templates(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_templates_type ON contact_templates(template_type);
CREATE INDEX idx_contact_templates_slug ON contact_templates(tenant_id, template_slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_templates_enabled ON contact_templates(is_enabled) WHERE deleted_at IS NULL;

-- Unique constraint
ALTER TABLE contact_templates ADD CONSTRAINT unique_contact_templates_tenant_slug 
    UNIQUE (tenant_id, template_slug);

-- Row-Level Security
ALTER TABLE contact_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_contact_templates ON contact_templates
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### **Table 9: Contact Integrations (CRM & Marketing Tools)**

```sql
CREATE TABLE contact_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Integration details
    integration_name VARCHAR(255) NOT NULL,
    integration_type VARCHAR(100) NOT NULL CHECK (integration_type IN (
        'crm', 'email_marketing', 'sms', 'webhook', 'analytics', 'social', 'custom'
    )),
    
    provider VARCHAR(100) NOT NULL, -- salesforce, hubspot, mailchimp, etc.
    
    -- Configuration
    config JSONB NOT NULL DEFAULT '{}',
    credentials JSONB DEFAULT '{}', -- Encrypted
    
    -- Settings
    is_enabled BOOLEAN DEFAULT TRUE,
    sync_direction VARCHAR(20) DEFAULT 'bidirectional' CHECK (sync_direction IN (
        'inbound', 'outbound', 'bidirectional'
    )),
    
    -- Sync settings
    auto_sync BOOLEAN DEFAULT TRUE,
    sync_frequency INTEGER DEFAULT 3600, -- seconds
    last_sync_at TIMESTAMP NULL,
    next_sync_at TIMESTAMP NULL,
    
    -- Error handling
    error_count INTEGER DEFAULT 0,
    last_error TEXT NULL,
    last_error_at TIMESTAMP NULL,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Indexes
CREATE INDEX idx_contact_integrations_tenant ON contact_integrations(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_integrations_type ON contact_integrations(integration_type);
CREATE INDEX idx_contact_integrations_provider ON contact_integrations(provider);
CREATE INDEX idx_contact_integrations_enabled ON contact_integrations(is_enabled) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_integrations_sync ON contact_integrations(next_sync_at) WHERE next_sync_at IS NOT NULL;

-- Row-Level Security
ALTER TABLE contact_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_contact_integrations ON contact_integrations
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### **Table 10: Contact Workflows (Automation Rules)**

```sql
CREATE TABLE contact_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Workflow identification
    workflow_name VARCHAR(255) NOT NULL,
    workflow_slug VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Trigger settings
    trigger_event VARCHAR(100) NOT NULL CHECK (trigger_event IN (
        'form_submission', 'lead_status_change', 'response_received', 
        'time_based', 'score_threshold', 'custom'
    )),
    
    trigger_conditions JSONB DEFAULT '{}',
    
    -- Workflow actions
    actions JSONB NOT NULL DEFAULT '[]',
    
    -- Settings
    is_enabled BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Execution settings
    max_executions INTEGER NULL, -- Limit per contact
    execution_delay INTEGER DEFAULT 0, -- seconds
    
    -- Statistics
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Indexes
CREATE INDEX idx_contact_workflows_tenant ON contact_workflows(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_workflows_slug ON contact_workflows(tenant_id, workflow_slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_workflows_trigger ON contact_workflows(trigger_event);
CREATE INDEX idx_contact_workflows_enabled ON contact_workflows(is_enabled, is_active) WHERE deleted_at IS NULL;

-- Unique constraint
ALTER TABLE contact_workflows ADD CONSTRAINT unique_contact_workflows_tenant_slug 
    UNIQUE (tenant_id, workflow_slug);

-- Row-Level Security
ALTER TABLE contact_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_contact_workflows ON contact_workflows
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### **Table 11: Contact Permissions (RBAC Integration)**

```sql
CREATE TABLE contact_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Permission details
    permission_code VARCHAR(100) NOT NULL,
    permission_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Permission scope
    resource_type VARCHAR(100) NOT NULL CHECK (resource_type IN (
        'contact_page', 'contact_form', 'submission', 'response', 
        'template', 'workflow', 'integration', 'analytics'
    )),
    
    -- Actions
    actions TEXT[] NOT NULL DEFAULT '{}', -- create, read, update, delete, manage
    
    -- Conditions
    conditions JSONB DEFAULT '{}',
    
    -- Settings
    is_system BOOLEAN DEFAULT FALSE,
    is_enabled BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Indexes
CREATE INDEX idx_contact_permissions_tenant ON contact_permissions(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contact_permissions_code ON contact_permissions(permission_code);
CREATE INDEX idx_contact_permissions_resource ON contact_permissions(resource_type);
CREATE INDEX idx_contact_permissions_enabled ON contact_permissions(is_enabled) WHERE deleted_at IS NULL;

-- Unique constraint
ALTER TABLE contact_permissions ADD CONSTRAINT unique_contact_permissions_tenant_code 
    UNIQUE (tenant_id, permission_code);

-- Row-Level Security
ALTER TABLE contact_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_contact_permissions ON contact_permissions
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

---

## **RBAC PERMISSION MATRIX**

### **Contact Management Permissions**

| Permission Code | Resource | Actions | Description |
|----------------|----------|---------|-------------|
| `contact.pages.view` | contact_page | read | View contact pages |
| `contact.pages.create` | contact_page | create | Create new contact pages |
| `contact.pages.edit` | contact_page | update | Edit contact page content |
| `contact.pages.delete` | contact_page | delete | Delete contact pages |
| `contact.pages.manage` | contact_page | * | Full contact page management |
| `contact.forms.view` | contact_form | read | View contact forms |
| `contact.forms.create` | contact_form | create | Create new forms |
| `contact.forms.edit` | contact_form | update | Edit form settings & fields |
| `contact.forms.delete` | contact_form | delete | Delete forms |
| `contact.forms.manage` | contact_form | * | Full form management |
| `contact.submissions.view` | submission | read | View form submissions |
| `contact.submissions.assign` | submission | update | Assign submissions to users |
| `contact.submissions.respond` | submission | create | Respond to submissions |
| `contact.submissions.export` | submission | read | Export submission data |
| `contact.submissions.delete` | submission | delete | Delete submissions |
| `contact.responses.view` | response | read | View communication history |
| `contact.responses.create` | response | create | Create responses |
| `contact.responses.edit` | response | update | Edit responses |
| `contact.templates.view` | template | read | View email/SMS templates |
| `contact.templates.create` | template | create | Create templates |
| `contact.templates.edit` | template | update | Edit templates |
| `contact.templates.delete` | template | delete | Delete templates |
| `contact.workflows.view` | workflow | read | View automation workflows |
| `contact.workflows.create` | workflow | create | Create workflows |
| `contact.workflows.edit` | workflow | update | Edit workflows |
| `contact.workflows.execute` | workflow | update | Execute workflows |
| `contact.integrations.view` | integration | read | View integrations |
| `contact.integrations.create` | integration | create | Create integrations |
| `contact.integrations.edit` | integration | update | Edit integration settings |
| `contact.integrations.sync` | integration | update | Trigger sync operations |
| `contact.analytics.view` | analytics | read | View contact analytics |
| `contact.analytics.export` | analytics | read | Export analytics data |

### **Role-Based Access Examples**

**Super Admin:**
- All contact permissions (`contact.*`)

**Tenant Owner:**
- All tenant-scoped contact permissions
- Can manage integrations and workflows

**Contact Manager:**
- `contact.submissions.view`, `contact.submissions.assign`, `contact.submissions.respond`
- `contact.responses.*`, `contact.templates.*`
- `contact.analytics.view`

**Sales Representative:**
- `contact.submissions.view` (assigned only)
- `contact.responses.view`, `contact.responses.create`
- `contact.templates.view`

**Marketing Manager:**
- `contact.forms.*`, `contact.templates.*`
- `contact.workflows.*`, `contact.analytics.*`
- `contact.integrations.view`

**Customer Support:**
- `contact.submissions.view`, `contact.submissions.respond`
- `contact.responses.*`
- `contact.templates.view`

---

## **ENTERPRISE API ENDPOINTS**

### **Public Contact API**

#### **Get Contact Page Content**
```http
GET /api/v1/contact/{tenant_slug}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "page": {
      "id": "uuid",
      "heroTitle": "Contact Us",
      "heroSubtitle": "Get in touch with our team",
      "metaTitle": "Contact - Company Name",
      "metaDescription": "Contact us for inquiries..."
    },
    "contactInfo": [
      {
        "id": "uuid",
        "type": "address",
        "title": "Our Office",
        "content": "123 Business Street",
        "contactData": {
          "street": "123 Business Street",
          "city": "Jakarta",
          "coordinates": {"lat": -6.2088, "lng": 106.8456}
        }
      }
    ],
    "forms": [
      {
        "id": "uuid",
        "slug": "general-inquiry",
        "title": "General Inquiry",
        "fields": [
          {
            "key": "name",
            "type": "text",
            "label": "Full Name",
            "required": true,
            "validationRules": {"minLength": 2, "maxLength": 100}
          }
        ]
      }
    ]
  }
}
```

#### **Submit Contact Form**
```http
POST /api/v1/contact/{tenant_slug}/forms/{form_slug}/submit
Content-Type: application/json
```

**Request:**
```json
{
  "formData": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "message": "I'm interested in your services..."
  },
  "metadata": {
    "source": "website",
    "utmCampaign": "google_ads",
    "referrer": "https://google.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you! We'll get back to you soon.",
  "data": {
    "submissionId": "uuid",
    "submissionCode": "CONT-2024-001",
    "leadScore": 75
  }
}
```

### **Admin Contact Management API**

#### **Contact Pages Management**
```http
GET    /api/v1/admin/contact/pages
POST   /api/v1/admin/contact/pages
GET    /api/v1/admin/contact/pages/{id}
PUT    /api/v1/admin/contact/pages/{id}
DELETE /api/v1/admin/contact/pages/{id}
```

#### **Contact Forms Management**
```http
GET    /api/v1/admin/contact/forms
POST   /api/v1/admin/contact/forms
GET    /api/v1/admin/contact/forms/{id}
PUT    /api/v1/admin/contact/forms/{id}
DELETE /api/v1/admin/contact/forms/{id}

# Form Fields
GET    /api/v1/admin/contact/forms/{id}/fields
POST   /api/v1/admin/contact/forms/{id}/fields
PUT    /api/v1/admin/contact/forms/{id}/fields/{field_id}
DELETE /api/v1/admin/contact/forms/{id}/fields/{field_id}
```

#### **Submissions Management**
```http
GET /api/v1/admin/contact/submissions
```

**Query Parameters:**
- `status` - Filter by status (new, contacted, qualified, etc.)
- `leadStatus` - Filter by lead status
- `assignedTo` - Filter by assigned user
- `dateFrom` / `dateTo` - Date range filter
- `search` - Full-text search
- `page` / `perPage` - Pagination
- `sortBy` / `sortOrder` - Sorting

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "submissionCode": "CONT-2024-001",
      "contactName": "John Doe",
      "contactEmail": "john@example.com",
      "leadScore": 75,
      "leadStatus": "qualified",
      "assignedTo": {
        "id": "uuid",
        "name": "Sales Rep"
      },
      "formData": {...},
      "createdAt": "2024-01-15T10:30:00Z",
      "nextFollowUpAt": "2024-01-16T14:00:00Z"
    }
  ],
  "meta": {
    "pagination": {...},
    "filters": {...},
    "summary": {
      "totalSubmissions": 150,
      "newLeads": 25,
      "qualifiedLeads": 45,
      "convertedLeads": 12
    }
  }
}
```

#### **Submission Actions**
```http
PUT /api/v1/admin/contact/submissions/{id}/assign
PUT /api/v1/admin/contact/submissions/{id}/status
POST /api/v1/admin/contact/submissions/{id}/responses
GET /api/v1/admin/contact/submissions/{id}/responses
```

#### **Templates Management**
```http
GET    /api/v1/admin/contact/templates
POST   /api/v1/admin/contact/templates
GET    /api/v1/admin/contact/templates/{id}
PUT    /api/v1/admin/contact/templates/{id}
DELETE /api/v1/admin/contact/templates/{id}
```

#### **Workflows Management**
```http
GET    /api/v1/admin/contact/workflows
POST   /api/v1/admin/contact/workflows
GET    /api/v1/admin/contact/workflows/{id}
PUT    /api/v1/admin/contact/workflows/{id}
DELETE /api/v1/admin/contact/workflows/{id}
POST   /api/v1/admin/contact/workflows/{id}/execute
```

#### **Analytics & Reporting**
```http
GET /api/v1/admin/contact/analytics/overview
GET /api/v1/admin/contact/analytics/forms
GET /api/v1/admin/contact/analytics/leads
GET /api/v1/admin/contact/analytics/conversions
```

**Analytics Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalSubmissions": 1250,
      "conversionRate": 12.5,
      "avgResponseTime": "2h 15m",
      "leadScore": {
        "average": 65,
        "distribution": {
          "0-25": 15,
          "26-50": 35,
          "51-75": 30,
          "76-100": 20
        }
      }
    },
    "trends": {
      "submissions": [...],
      "conversions": [...],
      "responseTime": [...]
    },
    "sources": {
      "organic": 45,
      "paid_ads": 30,
      "social": 15,
      "direct": 10
    }
  }
}
```

#### **Integrations Management**
```http
GET    /api/v1/admin/contact/integrations
POST   /api/v1/admin/contact/integrations
GET    /api/v1/admin/contact/integrations/{id}
PUT    /api/v1/admin/contact/integrations/{id}
DELETE /api/v1/admin/contact/integrations/{id}
POST   /api/v1/admin/contact/integrations/{id}/sync
GET    /api/v1/admin/contact/integrations/{id}/logs
```

---

## **ADVANCED FEATURES**

### **Lead Scoring Algorithm**

**Base Score Calculation:**
```json
{
  "baseScore": 10,
  "factors": {
    "contactInfo": {
      "hasPhone": 15,
      "hasCompany": 20,
      "hasWebsite": 10
    },
    "engagement": {
      "messageLength": {
        "short": 5,
        "medium": 10,
        "long": 15
      },
      "urgency": {
        "low": 0,
        "medium": 10,
        "high": 25
      }
    },
    "source": {
      "organic": 10,
      "paid_ads": 15,
      "referral": 20,
      "direct": 5
    },
    "timing": {
      "businessHours": 10,
      "weekend": -5
    }
  }
}
```

### **Workflow Automation Examples**

**Auto-Reply Workflow:**
```json
{
  "trigger": "form_submission",
  "conditions": {
    "formSlug": "general-inquiry"
  },
  "actions": [
    {
      "type": "send_email",
      "template": "auto_reply_general",
      "delay": 0
    },
    {
      "type": "assign_to_user",
      "userId": "sales_team_lead",
      "delay": 300
    },
    {
      "type": "create_crm_lead",
      "integration": "salesforce",
      "delay": 600
    }
  ]
}
```

**Lead Nurturing Workflow:**
```json
{
  "trigger": "lead_status_change",
  "conditions": {
    "leadStatus": "qualified",
    "leadScore": {"min": 70}
  },
  "actions": [
    {
      "type": "send_email",
      "template": "nurturing_sequence_1",
      "delay": 86400
    },
    {
      "type": "schedule_follow_up",
      "delay": 259200,
      "assignTo": "account_manager"
    }
  ]
}
```

### **Integration Examples**

**Salesforce CRM Integration:**
```json
{
  "provider": "salesforce",
  "config": {
    "instanceUrl": "https://company.salesforce.com",
    "apiVersion": "v58.0",
    "leadMapping": {
      "contact_name": "FirstName + LastName",
      "contact_email": "Email",
      "contact_phone": "Phone",
      "contact_company": "Company",
      "lead_source": "LeadSource",
      "lead_score": "Lead_Score__c"
    },
    "syncSettings": {
      "createLeads": true,
      "updateExisting": true,
      "syncDirection": "outbound"
    }
  }
}
```

**Mailchimp Integration:**
```json
{
  "provider": "mailchimp",
  "config": {
    "listId": "abc123",
    "audienceMapping": {
      "contact_email": "email_address",
      "contact_name": "merge_fields.FNAME",
      "contact_company": "merge_fields.COMPANY"
    },
    "tags": ["website_lead", "contact_form"],
    "doubleOptIn": false
  }
}
```

---

## **PERFORMANCE OPTIMIZATION**

### **Caching Strategy**

**Multi-Level Caching:**
1. **Application Cache** (Redis): Form configurations, templates
2. **Database Query Cache**: Frequently accessed submissions
3. **CDN Cache**: Static contact page content
4. **Browser Cache**: Form assets and scripts

**Cache Keys:**
```
contact:tenant:{tenant_id}:page:{page_id}
contact:tenant:{tenant_id}:form:{form_slug}
contact:submissions:user:{user_id}:page:{page}
contact:analytics:{tenant_id}:{date}:{type}
```

### **Database Optimization**

**Strategic Indexing:**
- Composite indexes on (tenant_id, status, created_at)
- Full-text search indexes on contact information
- Partial indexes for active/enabled records only
- GIN indexes for JSONB columns

**Query Optimization:**
- Use prepared statements for frequent queries
- Implement query result pagination
- Use database views for complex analytics queries
- Implement read replicas for reporting queries

### **API Performance**

**Response Time Targets:**
- Contact page load: < 200ms
- Form submission: < 500ms
- Admin dashboard: < 1s
- Analytics queries: < 2s

**Optimization Techniques:**
- API response compression (gzip)
- Efficient JSON serialization
- Background job processing for heavy operations
- Rate limiting to prevent abuse

---

## **SECURITY & COMPLIANCE**

### **Data Protection**

**GDPR Compliance:**
- Right to access: Export all contact data
- Right to rectification: Update contact information
- Right to erasure: Soft delete with data retention policies
- Right to portability: Export data in standard formats
- Consent management: Track and manage consent preferences

**Data Encryption:**
- Encryption at rest: Database-level encryption
- Encryption in transit: TLS 1.3 for all API communications
- PII encryption: Sensitive fields encrypted with AES-256
- Key management: Secure key rotation policies

### **Security Measures**

**Input Validation:**
- Server-side validation for all form inputs
- XSS protection with content sanitization
- SQL injection prevention with parameterized queries
- File upload security with type and size validation

**Access Control:**
- Multi-factor authentication for admin access
- Role-based permissions with principle of least privilege
- API rate limiting and throttling
- IP whitelisting for sensitive operations

**Audit Logging:**
- Complete audit trail for all data modifications
- User action logging with timestamps and IP addresses
- Failed login attempt monitoring
- Compliance reporting capabilities

---

## **BUSINESS RULES & VALIDATION**

### **Form Submission Rules**

1. **Rate Limiting**: Maximum 3 submissions per IP per hour
2. **Duplicate Detection**: Prevent duplicate submissions within 24 hours
3. **Spam Protection**: CAPTCHA verification and content filtering
4. **Data Validation**: Server-side validation for all form fields
5. **File Upload Limits**: Maximum 5MB per file, specific file types only

### **Lead Management Rules**

1. **Auto-Assignment**: Round-robin assignment to available sales reps
2. **Lead Scoring**: Automatic scoring based on predefined criteria
3. **Follow-up Scheduling**: Automatic follow-up reminders based on lead status
4. **Escalation Rules**: Escalate unresponded leads after 24 hours
5. **Data Retention**: Archive leads after 2 years of inactivity

### **Integration Rules**

1. **Sync Frequency**: Maximum sync every 15 minutes to prevent API limits
2. **Error Handling**: Retry failed syncs with exponential backoff
3. **Data Mapping**: Validate field mappings before sync operations
4. **Conflict Resolution**: Last-modified-wins for data conflicts
5. **Webhook Security**: Verify webhook signatures for security

---

**Previous:** [03-ABOUT.md](./03-ABOUT.md)  
**Next:** [05-FAQ.md](./05-FAQ.md)
