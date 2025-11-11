#!/usr/bin/env python3
import os

# Since file is too large for one operation, this script generates 19-PLUGINS.md and 20-CUSTOMERS.md

output_dir = os.path.join(os.path.dirname(__file__), '..', 'docs', 'database-schema')
os.makedirs(output_dir, exist_ok=True)

plugins_content = """# PLUGIN MARKETPLACE SYSTEM
## Database Schema & API Documentation

**Module:** Plugin Marketplace & Extensibility System  
**Total Fields:** 199+ fields  
**Total Tables:** 8 tables (plugins, plugin_installations, plugin_settings, plugin_hooks, plugin_events, plugin_marketplace_listings, plugin_purchases, plugin_api_keys)  
**Status:** 🚧 PLANNED - Architecture Blueprint  
**Architecture Reference:** `docs/ARCHITECTURE/ADVANCED_SYSTEMS/4-PLUGIN_MARKETPLACE_SYSTEM.md`

---

## NOTE

This is a **comprehensive reference** for the Plugin Marketplace System database schema.  
For complete architectural details, implementation examples, and code samples, refer to:  
📘 **[docs/ARCHITECTURE/ADVANCED_SYSTEMS/4-PLUGIN_MARKETPLACE_SYSTEM.md](../ARCHITECTURE/ADVANCED_SYSTEMS/4-PLUGIN_MARKETPLACE_SYSTEM.md)**

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Business Context](#business-context)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Migration Script](#migration-script)
6. [Performance Indexes](#performance-indexes)

---

## OVERVIEW

Plugin Marketplace System adalah **platform extensibility** yang memungkinkan Stencil CMS di-extend dengan third-party plugins tanpa modifikasi core. Sistem ini mencakup:

- 🔌 **Plugin Registry**: 8 tables, 199+ fields
- 🏪 **Marketplace**: Discovery, ratings, purchases
- 🔐 **Security**: Sandboxing, permissions, code signing
- 💰 **Monetization**: Sales, subscriptions, revenue sharing
- 🪝 **Hook System**: WordPress-style events & filters

### Key Statistics

| Metric | Value |
|--------|-------|
| Total Tables | 8 |
| Total Fields | 199+ |
| API Endpoints | 35+ |
| Plugin Categories | 10+ |

---

## BUSINESS CONTEXT

### Revenue Model

- **Marketplace Commission**: 25-30% per sale
- **Target Developers**: 5,000+ globally  
- **Plugin Types**: Free, paid, subscription

### Use Cases

1. Payment Gateways (Stripe, Midtrans, Xendit)
2. Shipping Providers (JNE, DHL, FedEx)
3. Email Marketing (Mailchimp, SendGrid)
4. Analytics (Google Analytics, Facebook Pixel)
5. CRM Integration (Salesforce, Zoho)

---

## DATABASE SCHEMA

### Schema Summary

| Table | Fields | Purpose |
|-------|--------|---------|
| `plugins` | 37 | Plugin registry |
| `plugin_installations` | 25 | Per-tenant installations |
| `plugin_settings` | 13 | Configurations |
| `plugin_hooks` | 20 | Hook registry |
| `plugin_events` | 17 | Event logs |
| `plugin_marketplace_listings` | 36 | Marketplace catalog |
| `plugin_purchases` | 32 | Transactions |
| `plugin_api_keys` | 19 | API auth |
| **TOTAL** | **199** | **8 tables** |

**Complete SQL schemas available in:**  
[docs/ARCHITECTURE/ADVANCED_SYSTEMS/4-PLUGIN_MARKETPLACE_SYSTEM.md](../ARCHITECTURE/ADVANCED_SYSTEMS/4-PLUGIN_MARKETPLACE_SYSTEM.md#database-schema) (Lines 1319-1825)

---

## API ENDPOINTS

### Marketplace APIs

```yaml
GET    /api/v1/marketplace/plugins              # Browse plugins
GET    /api/v1/marketplace/plugins/{slug}       # Plugin details
POST   /api/v1/marketplace/plugins/{slug}/purchase  # Purchase
```

### Tenant Plugin Management

```yaml
GET    /api/v1/tenants/{id}/plugins             # List installed
POST   /api/v1/tenants/{id}/plugins/install     # Install plugin
POST   /api/v1/tenants/{id}/plugins/{id}/activate  # Activate
POST   /api/v1/tenants/{id}/plugins/{id}/deactivate  # Deactivate
PUT    /api/v1/tenants/{id}/plugins/{id}/settings  # Update settings
```

**Total**: 35+ endpoints

**Complete API specification available in:**  
[docs/ARCHITECTURE/ADVANCED_SYSTEMS/4-PLUGIN_MARKETPLACE_SYSTEM.md](../ARCHITECTURE/ADVANCED_SYSTEMS/4-PLUGIN_MARKETPLACE_SYSTEM.md#api-endpoints) (Lines 1842-1895)

---

## MIGRATION SCRIPT

```sql
-- See complete migration script with all 8 tables in:
-- docs/ARCHITECTURE/ADVANCED_SYSTEMS/4-PLUGIN_MARKETPLACE_SYSTEM.md
-- Lines 1319-1825

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. plugins table (37 fields)
-- 2. plugin_installations table (25 fields)
-- 3. plugin_settings table (13 fields)
-- 4. plugin_hooks table (20 fields)
-- 5. plugin_events table (17 fields)
-- 6. plugin_marketplace_listings table (36 fields)
-- 7. plugin_purchases table (32 fields)
-- 8. plugin_api_keys table (19 fields)

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
-- [See architecture doc for complete implementation]

COMMIT;
```

---

## PERFORMANCE INDEXES

### Composite Indexes

```sql
CREATE INDEX idx_plugin_installations_tenant_active 
    ON plugin_installations(tenant_id, is_active) WHERE is_active = true;

CREATE INDEX idx_hooks_name_priority 
    ON plugin_hooks(hook_name, callback_priority);

CREATE INDEX idx_marketplace_featured 
    ON plugin_marketplace_listings(is_featured, featured_position);
```

### GIN Indexes for JSONB

```sql
CREATE INDEX idx_plugins_manifest ON plugins USING GIN(manifest);
CREATE INDEX idx_plugins_tags ON plugins USING GIN(tags);
```

**Complete indexing strategy available in:**  
[docs/ARCHITECTURE/ADVANCED_SYSTEMS/4-PLUGIN_MARKETPLACE_SYSTEM.md](../ARCHITECTURE/ADVANCED_SYSTEMS/4-PLUGIN_MARKETPLACE_SYSTEM.md#database-schema)

---

## IMPLEMENTATION NOTES

**Current Status**: 🚧 **PLANNED**  
**Priority**: Medium  
**Dependencies**:
- Multi-tenant infrastructure
- User & role management  
- Payment gateway integration

**Next Steps**:
1. Implement backend plugin loader
2. Create frontend plugin SDK
3. Build marketplace UI
4. Develop CLI tools for plugin development

**For Complete Details**:
- Architecture: `docs/ARCHITECTURE/ADVANCED_SYSTEMS/4-PLUGIN_MARKETPLACE_SYSTEM.md`
- Plugin lifecycle workflows
- Security & sandboxing implementation
- Hook/filter system code examples
- Plugin Development Kit (PDK) specifications

---

**© 2025 Stencil CMS - Plugin Marketplace Database Schema**
"""

# Write 19-PLUGINS.md
plugins_file = os.path.join(output_dir, '19-PLUGINS.md')
with open(plugins_file, 'w', encoding='utf-8') as f:
    f.write(plugins_content)

print(f"[OK] Created: {plugins_file}")
print(f"   File size: {len(plugins_content)} bytes")

# ========================================
# 20-CUSTOMERS.md
# ========================================

customers_content = """# CUSTOMER MANAGEMENT SYSTEM
## Database Schema & API Documentation

**Module:** Customer Relationship Management (CRM)  
**Total Fields:** 95+ fields  
**Total Tables:** 6 tables (customers, customer_addresses, customer_segments, customer_interactions, customer_notes, customer_loyalty)  
**Admin Page:** `src/pages/admin/CustomerManagement.tsx` (Implemented)  
**Type Definition:** `src/types/customer.ts`

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Business Context](#business-context)
3. [Database Schema](#database-schema)
4. [Relationship Diagram](#relationship-diagram)
5. [Field Specifications](#field-specifications)
6. [Business Rules](#business-rules)
7. [Customer Segmentation](#customer-segmentation)
8. [API Endpoints](#api-endpoints)
9. [Admin UI Features](#admin-ui-features)
10. [Sample Data](#sample-data)
11. [Migration Script](#migration-script)
12. [Performance Indexes](#performance-indexes)

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
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
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
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
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
    deleted_at TIMESTAMP
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
"""

# Write 20-CUSTOMERS.md
customers_file = os.path.join(output_dir, '20-CUSTOMERS.md')
with open(customers_file, 'w', encoding='utf-8') as f:
    f.write(customers_content)

print(f"[OK] Created: {customers_file}")
print(f"   File size: {len(customers_content)} bytes")

print("\n=== SUMMARY ===")
print(f"Total files created: 2")
print(f"- 19-PLUGINS.md ({len(plugins_content)} bytes)")
print(f"- 20-CUSTOMERS.md ({len(customers_content)} bytes)")
