# CUSTOMER MANAGEMENT SYSTEM
## Database Schema & API Documentation

**Module:** Customer Relationship Management (CRM)  
**Total Fields:** 95+ fields  
**Total Tables:** 6 tables (customers, customer_addresses, customer_segments, customer_interactions, customer_notes, customer_loyalty)  
**Admin Page:** `src/pages/admin/CustomerManagement.tsx` (Implemented)  
**Type Definition:** `src/types/customer.ts`  
**Status:** ⚠️ **FRONTEND EXISTS - MISSING TENANT CONTEXT** - Audit completed

> **⚠️ TENANT ISOLATION GAP DETECTED**  
> **Documentation Quality**: **GOOD** - 95+ fields, comprehensive CRM system  
> **Frontend Status**: **IMPLEMENTED** - CustomerManagement.tsx exists and working  
> **Critical Gap**: **NO TENANT CONTEXT** - Cannot isolate customers per tenant  
> **Priority**: **MEDIUM** - Working system needs multi-tenant fixes

## 🔒 CORE IMMUTABLE RULES COMPLIANCE

### **Rule 1: Teams Enabled with tenant_id as team_foreign_key**
❌ **FRONTEND LIMITATION** - Documentation claims tenant isolation but **CustomerManagement.tsx lacks tenant context**. Cannot filter customers by tenant.

### **Rule 2: API Guard Implementation**  
❌ **NO BACKEND API** - Claims Laravel Sanctum authentication but **NO backend implementation** for customer endpoints.

### **Rule 3: UUID model_morph_key**
⚠️ **FRONTEND USES MOCK DATA** - UUID generation documented but **NO DATABASE IMPLEMENTATION** to verify consistency.

### **Rule 4: Strict Tenant Data Isolation**
❌ **MAJOR SECURITY GAP** - Without tenant context, **CUSTOMER DATA LEAKAGE** possible across tenants. All customers visible to all tenants.

### **Rule 5: RBAC Integration Requirements**
⚠️ **PERMISSIONS EXIST BUT NO TENANT SCOPE** - Basic RBAC works but **NOT tenant-aware** customer permissions:
- `customers.view` - View customer profiles and basic information
- `customers.create` - Create new customer records
- `customers.edit` - Modify customer information and settings
- `customers.delete` - Delete customer records (soft delete)
- `customers.manage` - Full customer management including segments and analytics

---

## 🚨 TENANT CONTEXT GAP ANALYSIS

### **AUDIT SUMMARY**
**Date**: November 12, 2025  
**Auditor**: CanvaStack Stencil  
**Scope**: Customer management multi-tenant compliance analysis  
**Status**: **GOOD UI - CRITICAL TENANT ISOLATION GAP**

### **✅ POSITIVE FINDINGS**
- **Frontend Implementation**: CustomerManagement.tsx exists and functional
- **UI/UX Quality**: Good customer management interface
- **Type Definitions**: Proper TypeScript types available  
- **RBAC Integration**: Basic permission system working
- **Data Structure**: Well-designed customer fields and relationships

### **❌ CRITICAL GAPS IDENTIFIED**

#### **1. NO TENANT CONTEXT IN FRONTEND**
- **Current**: CustomerManagement.tsx shows all customers globally
- **Required**: Filter customers by current tenant context
- **Risk**: **MAJOR SECURITY VIOLATION** - customers can see other tenants' data
- **Impact**: **DATA LEAKAGE** across tenant boundaries

#### **2. MISSING BACKEND API**
- **Documentation**: Claims comprehensive Laravel API
- **Reality**: **NO backend implementation** for customer endpoints
- **Impact**: Mock data only, cannot persist real customer records

#### **3. NO DATABASE TABLES**
- **Documentation**: 6 tables with 95+ fields for comprehensive CRM
- **Reality**: **NO customer database implementation**
- **Impact**: Cannot store actual customer data permanently

### **📊 COMPLIANCE SCORECARD**

| Component | Documented | Implemented | Status |
|-----------|------------|-------------|---------|
| **Frontend UI** | ✅ | ✅ | **PASSED** |
| **Type Definitions** | ✅ | ✅ | **PASSED** |
| **Basic RBAC** | ✅ | ✅ | **PASSED** |
| **Tenant Context** | ✅ | ❌ | **FAILED** |
| **Backend API** | ✅ | ❌ | **FAILED** |
| **Database Tables** | ✅ | ❌ | **FAILED** |
| **Data Persistence** | ✅ | ❌ | **FAILED** |

**Overall Compliance**: **43%** (3/7 components)  
**Security Risk**: **HIGH** - Tenant data leakage possible

### **🎯 REQUIRED FIXES**

1. **Add tenant context to CustomerManagement.tsx** ⚠️ **CRITICAL**
2. **Build Laravel backend API with tenant isolation** 🔴 **HIGH**
3. **Create customer database tables with tenant_id** 🔴 **HIGH**
4. **Implement tenant-scoped RBAC permissions** ⚠️ **MEDIUM**

---

## TABLE OF CONTENTS

1. [🚨 Tenant Context Gap Analysis](#-tenant-context-gap-analysis)
2. [Overview](#overview)
3. [Business Context](#business-context)
4. [Database Schema](#database-schema)
5. [Relationship Diagram](#relationship-diagram)
6. [Field Specifications](#field-specifications)
7. [Business Rules](#business-rules)
8. [Customer Segmentation](#customer-segmentation)
9. [API Endpoints](#api-endpoints)
10. [Admin UI Features](#admin-ui-features)
11. [Sample Data](#sample-data)
12. [Migration Script](#migration-script)
13. [Performance Indexes](#performance-indexes)
14. [🔧 Multi-Tenant Integration Fixes](#-multi-tenant-integration-fixes)

---

## OVERVIEW

Modul Customer Management adalah sistem **comprehensive CRM** untuk mengelola customer database, tracking customer interactions, segmentation, loyalty programs, dan customer lifetime value analytics. Sistem ini terpisah dari Users (internal staff) - Customers adalah buyers/clients yang melakukan transactions.

### Core Features

1. **Customer Profile Management (Implemented UI)**
   - Individual vs Business customer types
   - Complete contact information (email, phone, address)
   - Map-based location tracking (Google Maps integration)
   - Customer status management (active, inactive, blocked)
   - Customer notes & tags untuk categorization
   - Document attachments (NPWP, business license)

2. **Customer Segmentation**
   - RFM Analysis (Recency, Frequency, Monetary)
   - Auto-segmentation berdasarkan behavior
   - VIP/Premium customer identification
   - Custom segment creation dengan rules
   - Segment-specific marketing campaigns

3. **Multi-Address Support**
   - Primary billing address
   - Multiple shipping addresses
   - Address validation
   - Default address selection
   - Address labels (Home, Office, Warehouse)

4. **Customer Interaction Tracking**
   - Email communications log
   - Phone call history
   - WhatsApp/chat message tracking
   - Meeting/visit records
   - Interaction outcomes (quote sent, deal closed, follow-up required)

5. **Customer Lifetime Value (CLV) Analytics**
   - Total orders count
   - Total revenue generated
   - Average order value
   - Purchase frequency
   - Last purchase date
   - Customer acquisition cost (CAC)
   - Profitability per customer

6. **Loyalty Program Integration**
   - Points accumulation system
   - Tier-based benefits (Bronze, Silver, Gold, Platinum)
   - Reward redemption tracking
   - Referral tracking
   - Birthday/anniversary rewards

7. **Customer Notes & Activity Log**
   - Internal notes (not visible to customer)
   - Priority flags (VIP, requires attention)
   - Follow-up reminders
   - Complaint/issue tracking
   - Resolution history

8. **Credit & Payment Terms**
   - Credit limit assignment
   - Payment terms (Net 30, Net 60)
   - Outstanding balance tracking
   - Payment history
   - Overdue alerts

---

## BUSINESS CONTEXT

### **Integration with Etching Business Cycle**

Customer Management System is specifically designed to support the **custom etching business workflow** with comprehensive customer tracking throughout the entire business lifecycle:

**1. Inquiry Stage Customer Management:**
- **Lead Capture**: Automatic customer creation from inquiry forms, phone calls, email
- **Initial Profiling**: Basic information collection (company, contact details, industry)
- **Lead Scoring**: Qualification based on project size, budget, timeline
- **Source Tracking**: Track how customers found the business (website, referral, advertising)

**2. Quotation Stage Customer Enhancement:**
- **Detailed Profiling**: Complete customer information gathering during quote process
- **Project Requirements**: Store specific etching requirements, materials, quantities
- **Communication History**: Track all quote discussions, revisions, negotiations
- **Decision Timeline**: Monitor quote response times and follow-up schedules

**3. Order Processing Customer Data:**
- **Customer Conversion**: Update status from lead to active customer
- **Order History**: Link all orders to customer profile for repeat business tracking
- **Payment Terms**: Establish credit limits, payment preferences, billing addresses
- **Project Preferences**: Store preferred materials, finishes, delivery methods

**4. Production Stage Customer Communication:**
- **Progress Updates**: Automated notifications about production milestones
- **Quality Approvals**: Customer approval workflows for samples and prototypes
- **Timeline Management**: Keep customers informed about delivery schedules
- **Issue Resolution**: Track and resolve any production concerns or changes

**5. Delivery & Post-Sale Customer Relationship:**
- **Delivery Coordination**: Manage shipping addresses, delivery preferences
- **Satisfaction Tracking**: Post-delivery feedback and quality assessments
- **Repeat Business**: Identify opportunities for additional projects
- **Referral Management**: Track customer referrals and reward programs

### Customer vs User Distinction

**Users (Internal - dari `12-USERS.md`)**:
- Staff, admins, managers yang operate system
- Login credentials & permissions
- Role-based access control
- Examples: Admin, Sales Manager, Warehouse Staff

**Customers (External - module ini)**:
- Buyers/clients yang order products
- Tracked untuk CRM & sales purposes
- No login credentials (optional customer portal di future)
- Examples: PT ABC Corporation, John Doe (individual buyer)

### Customer Types

**1. Individual Customers (B2C)**
- Personal buyers
- Simpler tax requirements
- Smaller order volumes
- Fast decision making

**2. Business Customers (B2B)**
- Company/corporate buyers
- Require tax invoices (faktur pajak)
- Larger order volumes
- Longer sales cycles
- Multiple contact persons
- Credit terms negotiation

### Customer Lifecycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   PROSPECT  │ -> │    LEAD     │ -> │   CUSTOMER  │ -> │  ADVOCATE   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                  │                   │                   │
  First contact    Quotation sent      First purchase      Repeat buyer
  Phone/email      Price negotiation   Payment received    Referrals
  Initial inquiry  Follow-ups          Order fulfilled     Reviews/testimonials
```

**Stage Tracking**:
- `prospect`: Potential customer (inquiry received)
- `lead`: Qualified lead (quotation sent)
- `customer`: Active customer (has placed orders)
- `advocate`: Loyal customer (5+ orders, provides referrals)

### RFM Segmentation

**Recency**: When was the last purchase?
- Recent buyers (< 30 days): High priority for upselling
- Dormant customers (> 180 days): Re-engagement campaigns

**Frequency**: How often do they purchase?
- Frequent buyers (5+ orders): VIP treatment
- One-time buyers: Cross-sell opportunities

**Monetary**: How much have they spent?
- High-value customers (> Rp 50jt): Personal account manager
- Low-value customers: Automated marketing

**Segment Matrix**:
```
High Value + Recent + Frequent = Champions (Best customers)
High Value + Not Recent = At Risk (Need attention)
Low Value + Recent = New Customers (Growth potential)
Low Value + Not Recent = Lost Customers (Win-back campaigns)
```

---

## DATABASE SCHEMA

### 1. Table: `customers` (Tenant Schema)

Tabel utama untuk customer profiles.

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(), -- CORE RULE: model_morph_key
    tenant_id UUID NOT NULL, -- CORE RULE: team_foreign_key
    
    customer_code VARCHAR(50) NOT NULL UNIQUE,
    customer_number INTEGER NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    mobile_phone VARCHAR(50),
    
    customer_type VARCHAR(20) DEFAULT 'individual' CHECK (customer_type IN ('individual', 'business')),
    
    company VARCHAR(255),
    company_legal_name VARCHAR(255),
    tax_id VARCHAR(50),
    business_license VARCHAR(100),
    business_license_file_url TEXT,
    
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    customer_stage VARCHAR(20) DEFAULT 'prospect' CHECK (customer_stage IN ('prospect', 'lead', 'customer', 'advocate')),
    
    primary_contact_name VARCHAR(255),
    primary_contact_email VARCHAR(255),
    primary_contact_phone VARCHAR(50),
    
    website VARCHAR(500),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    annual_revenue DECIMAL(15,2),
    
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_terms VARCHAR(50) DEFAULT 'cash',
    currency VARCHAR(3) DEFAULT 'IDR',
    
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0,
    average_order_value DECIMAL(15,2) DEFAULT 0,
    lifetime_value DECIMAL(15,2) DEFAULT 0,
    
    first_order_date TIMESTAMP,
    last_order_date TIMESTAMP,
    last_contact_date TIMESTAMP,
    
    acquisition_source VARCHAR(100),
    acquisition_cost DECIMAL(12,2),
    referred_by UUID REFERENCES customers(id),
    
    loyalty_points INT DEFAULT 0,
    loyalty_tier VARCHAR(20) DEFAULT 'bronze',
    
    tags VARCHAR(100)[],
    notes TEXT,
    internal_notes TEXT,
    
    is_vip BOOLEAN DEFAULT false,
    is_blacklisted BOOLEAN DEFAULT false,
    blacklist_reason TEXT,
    
    metadata JSONB DEFAULT '{}',
    
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    
    UNIQUE(tenant_id, customer_code),
    UNIQUE(tenant_id, customer_number)
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_code ON customers(customer_code);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_stage ON customers(customer_stage);
CREATE INDEX idx_customers_vip ON customers(is_vip) WHERE is_vip = true;
CREATE INDEX idx_customers_tags ON customers USING GIN(tags);
CREATE INDEX idx_customers_metadata ON customers USING GIN(metadata);
CREATE INDEX idx_customers_last_order ON customers(last_order_date DESC);
CREATE INDEX idx_customers_deleted ON customers(deleted_at) WHERE deleted_at IS NULL;
```

**Fields**: 52 fields

---

### 2. Table: `customer_addresses` (Tenant Schema)

Multiple addresses per customer (billing, shipping, warehouse).

```sql
CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(), -- CORE RULE: model_morph_key
    tenant_id UUID NOT NULL, -- CORE RULE: team_foreign_key
    customer_id UUID NOT NULL,
    
    address_type VARCHAR(20) DEFAULT 'shipping' CHECK (address_type IN ('billing', 'shipping', 'warehouse', 'office')),
    address_label VARCHAR(100),
    
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    
    address_line_1 VARCHAR(500) NOT NULL,
    address_line_2 VARCHAR(500),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Indonesia',
    
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    location_data JSONB,
    
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    delivery_instructions TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX idx_addresses_customer ON customer_addresses(customer_id);
CREATE INDEX idx_addresses_tenant ON customer_addresses(tenant_id);
CREATE INDEX idx_addresses_type ON customer_addresses(address_type);
CREATE INDEX idx_addresses_default ON customer_addresses(customer_id, is_default) WHERE is_default = true;
CREATE INDEX idx_addresses_location ON customer_addresses USING GIST(
    ll_to_earth(latitude, longitude)
);
```

**Fields**: 22 fields

---

### 3. Table: `customer_segments` (Tenant Schema)

Customer segmentation untuk targeted marketing.

```sql
CREATE TABLE customer_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    segment_name VARCHAR(100) NOT NULL,
    segment_code VARCHAR(50) NOT NULL,
    description TEXT,
    
    segment_type VARCHAR(50) DEFAULT 'manual' CHECK (segment_type IN ('manual', 'auto', 'rfm')),
    
    rules JSONB,
    
    customer_count INT DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, segment_code)
);

CREATE INDEX idx_segments_tenant ON customer_segments(tenant_id);
CREATE INDEX idx_segments_type ON customer_segments(segment_type);
CREATE INDEX idx_segments_active ON customer_segments(is_active) WHERE is_active = true;
```

**Fields**: 13 fields

---

### 4. Table: `customer_interactions` (Tenant Schema)

Track all customer touchpoints.

```sql
CREATE TABLE customer_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    interaction_type VARCHAR(50) NOT NULL,
    interaction_channel VARCHAR(50),
    
    subject VARCHAR(255),
    description TEXT,
    outcome VARCHAR(100),
    
    interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INT,
    
    contacted_by UUID REFERENCES users(id),
    
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date TIMESTAMP,
    follow_up_notes TEXT,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interactions_customer ON customer_interactions(customer_id);
CREATE INDEX idx_interactions_tenant ON customer_interactions(tenant_id);
CREATE INDEX idx_interactions_type ON customer_interactions(interaction_type);
CREATE INDEX idx_interactions_date ON customer_interactions(interaction_date DESC);
CREATE INDEX idx_interactions_follow_up ON customer_interactions(follow_up_required, follow_up_date)
    WHERE follow_up_required = true;
```

**Fields**: 16 fields

---

## API ENDPOINTS

### Customer Management APIs

```yaml
# List & Search
GET    /api/v1/customers                    # List all customers
GET    /api/v1/customers/search             # Search customers
GET    /api/v1/customers/{id}               # Get customer details

# CRUD Operations
POST   /api/v1/customers                    # Create customer
PUT    /api/v1/customers/{id}               # Update customer
DELETE /api/v1/customers/{id}               # Delete customer

# Customer Addresses
GET    /api/v1/customers/{id}/addresses     # List addresses
POST   /api/v1/customers/{id}/addresses     # Add address
PUT    /api/v1/customers/{id}/addresses/{addressId}  # Update address
DELETE /api/v1/customers/{id}/addresses/{addressId}  # Delete address

# Customer Analytics
GET    /api/v1/customers/{id}/orders        # Customer order history
GET    /api/v1/customers/{id}/analytics     # CLV, RFM scores
GET    /api/v1/customers/{id}/interactions  # Interaction history

# Segmentation
GET    /api/v1/customer-segments            # List segments
POST   /api/v1/customer-segments            # Create segment
GET    /api/v1/customer-segments/{id}/customers  # Customers in segment
```

**Total API Endpoints**: 25+

---

## MIGRATION SCRIPT

```sql
BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create all tables
-- [See complete SQL schemas above]

-- Create update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_addresses_updated_at BEFORE UPDATE ON customer_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE ON customer_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update customer statistics trigger
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE customers
    SET 
        total_orders = (SELECT COUNT(*) FROM purchase_orders WHERE customer_id = NEW.customer_id),
        total_spent = (SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders WHERE customer_id = NEW.customer_id AND status = 'completed'),
        last_order_date = (SELECT MAX(created_at) FROM purchase_orders WHERE customer_id = NEW.customer_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.customer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_stats_on_order
AFTER INSERT OR UPDATE ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION update_customer_stats();

COMMIT;
```

---

## PERFORMANCE INDEXES

### Composite Indexes

```sql
CREATE INDEX idx_customers_tenant_status 
    ON customers(tenant_id, status) WHERE status = 'active';

CREATE INDEX idx_customers_tenant_stage 
    ON customers(tenant_id, customer_stage);

CREATE INDEX idx_customers_rfm 
    ON customers(tenant_id, last_order_date DESC, total_orders DESC, total_spent DESC);

CREATE INDEX idx_addresses_customer_default 
    ON customer_addresses(customer_id, is_default) WHERE is_default = true;
```

### GIN Indexes for Arrays & JSONB

```sql
CREATE INDEX idx_customers_tags ON customers USING GIN(tags);
CREATE INDEX idx_customers_metadata ON customers USING GIN(metadata);
CREATE INDEX idx_segments_rules ON customer_segments USING GIN(rules);
```

### Full-Text Search

```sql
CREATE INDEX idx_customers_search ON customers 
    USING GIN(to_tsvector('indonesian', 
        COALESCE(name, '') || ' ' || 
        COALESCE(email, '') || ' ' || 
        COALESCE(phone, '') || ' ' || 
        COALESCE(company, '')
    ));
```

---

## SAMPLE DATA

```sql
-- Individual Customer
INSERT INTO customers (
    tenant_id, customer_code, customer_number, name, email, phone,
    customer_type, status, total_orders, total_spent
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'CUST-2025-0001',
    1,
    'Alice Johnson',
    'alice.j@email.com',
    '+62 821 1234 5678',
    'individual',
    'active',
    15,
    25500000
);

-- Business Customer
INSERT INTO customers (
    tenant_id, customer_code, customer_number, name, email, phone,
    customer_type, company, tax_id, status, is_vip
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'CUST-2025-0002',
    2,
    'Tech Corp Indonesia',
    'procurement@techcorp.id',
    '+62 822 2345 6789',
    'business',
    'PT Tech Corp Indonesia',
    '01.234.567.8-901.000',
    'active',
    true
);
```

---

## NOTES

**Implementation Status**: Frontend UI ✅ Implemented | Backend API 🚧 Planned  
**Priority**: High (critical untuk order management)  
**Dependencies**:
- Orders module (`08-ORDERS.md`)
- Users module (`12-USERS.md`)

**Integration Points**:
- `purchase_orders.customer_id` references `customers.id`
- Customer portal login (future enhancement)
- Email marketing integration (MailChimp, SendGrid)

---

**© 2025 Stencil CMS - Customer Management Database Schema**

**Previous:** [19-PLUGINS.md](./19-PLUGINS.md)  
**Next:** [21-SUPPLIERS.md](./21-SUPPLIERS.md)  

**Last Updated:** 2025-11-11  
**Status:** ✅ COMPLETE  
**Reviewed By:** CanvaStack Stencil
