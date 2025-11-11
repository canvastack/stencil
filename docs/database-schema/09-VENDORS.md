# VENDOR MANAGEMENT MODULE
## Database Schema & API Documentation

**Module:** Operations - Vendor Management  
**Total Fields:** 85+ fields  
**Total Tables:** 5 tables (vendors, vendor_specializations, vendor_contacts, vendor_ratings, vendor_negotiations)  
**Admin Page:** `src/pages/admin/VendorManagement.tsx`  
**Type Definition:** `src/types/vendor.ts`

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Business Context](#business-context)
3. [Database Schema](#database-schema)
4. [Relationship Diagram](#relationship-diagram)
5. [Field Specifications](#field-specifications)
6. [Business Rules](#business-rules)
7. [API Endpoints](#api-endpoints)
8. [Admin UI Features](#admin-ui-features)
9. [Sample Data](#sample-data)
10. [Migration Script](#migration-script)
11. [Performance Indexes](#performance-indexes)
12. [Integration Notes](#integration-notes)

---

## OVERVIEW

Modul Vendor Management adalah komponen krusial dalam alur bisnis makelar/broker PT Custom Etching Xenial (PT CEX). Sistem ini mengelola seluruh lifecycle vendor dari registrasi hingga evaluasi performa, termasuk negosiasi harga, komunikasi, dan tracking pembayaran.

### Core Features

1. **Vendor Profile Management**
   - Complete vendor information (company, contact, legal docs)
   - Bank account details untuk payment processing
   - Multiple contact persons per vendor
   - Document storage (NPWP, SIUP, contracts)

2. **Specialization & Capability Tracking**
   - Material specializations (Akrilik, Kuningan, Tembaga, Stainless Steel, Aluminum)
   - Quality tier classification (Standard, Premium)
   - Production capacity tracking per specialization
   - Lead time estimation per material type
   - Price range indicators

3. **Vendor Rating & Performance**
   - Multi-criteria rating system (quality, timeliness, communication, pricing)
   - Historical performance metrics
   - Automated scoring based on completed orders
   - Admin manual adjustment capability
   - Rating trends over time

4. **Negotiation Management**
   - Price negotiation history per order
   - Counter-offer tracking with timestamps
   - Deal acceptance/rejection workflow
   - Negotiation timeline dan detailed notes
   - Attachment support untuk quotation documents

5. **Payment Tracking**
   - DP (Down Payment) dan full payment records
   - Payment status monitoring (pending, paid, verified)
   - Invoice generation untuk vendor payments
   - Payment proof upload dan verification
   - Payment history untuk financial reporting

---

## BUSINESS CONTEXT

### PT CEX Broker Business Model

Vendor Management module dirancang untuk mendukung alur bisnis makelar PT CEX:

1. **Vendor Sourcing Workflow**:
   - Customer order masuk → Admin cari vendor yang sesuai
   - Filter vendor berdasarkan:
     - Specializations (material types)
     - Rating overall >= threshold (default: 3.5/5.0)
     - Quality tier (standard vs premium)
     - Lead time capacity
   - Sistem suggest vendor berdasarkan historical performance
   - Admin dapat register vendor baru jika tidak ada yang match criteria

2. **Negotiation & Quotation**:
   - Admin request quotation dari vendor (via email otomatis atau manual communication)
   - Vendor submit price quote dan estimated production days
   - System record full negotiation history dengan timestamps
   - Admin dapat accept/reject/counter-offer
   - Multiple negotiation rounds supported
   - Final deal price recorded untuk:
     - Reference pricing di future orders
     - Historical tracking dan vendor comparison
     - Profitability calculation (customer price - vendor price)

3. **Vendor Payment Flow**:
   - System track 2 payment scenarios:
     - **DP Payment**: Partial payment (percentage atau nominal) sebelum production start
     - **Full Payment**: Complete payment setelah production complete 100%
   - Admin input DP percentage/nominal based on negotiation terms
   - Payment proof upload (receipt, bank transfer slip)
   - Finance team verification workflow
   - Payment history export untuk accounting integration

4. **Vendor Performance Evaluation**:
   - Auto-rating setelah order completed berdasarkan criteria:
     - **Quality Score** (1-5): Product quality sesuai spesifikasi
     - **Timeliness Score** (1-5): On-time delivery performance
     - **Communication Score** (1-5): Responsiveness dan clarity
     - **Pricing Score** (1-5): Competitiveness vs market rate
   - Overall rating = weighted average of 4 criteria
   - Low-performing vendors (rating < 3.0) dapat di-flag untuk review
   - Historical performance data influence vendor selection algorithm
   - Vendor blacklist capability untuk cases ekstrim

### Multi-Tenant Scalability

Sistem dirancang agar tenant lain dengan model bisnis serupa dapat:
- Menggunakan vendor schema yang sama tanpa modifikasi
- Customize rating criteria weights via `settings` table
- Define specialization mappings unique per tenant (via JSONB config)
- Isolate vendor data completely per tenant schema (data privacy)
- Share vendor profile across tenants (future enhancement jika diperlukan)

---

## DATABASE SCHEMA

### Table: `vendors` (Tenant Schema)

Tabel utama untuk menyimpan informasi vendor dan supplier.

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE vendors (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Company Information
    company_name VARCHAR(255) NOT NULL,
    legal_entity_name VARCHAR(255),
    brand_name VARCHAR(255),
    slug VARCHAR(255) NOT NULL UNIQUE,
    
    -- Contact Information
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    mobile_phone VARCHAR(50),
    fax VARCHAR(50),
    website VARCHAR(500),
    
    -- Address
    address TEXT NOT NULL,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Indonesia',
    
    -- Legal Documents
    npwp VARCHAR(50),
    siup_number VARCHAR(100),
    business_type VARCHAR(100),
    tax_document_url VARCHAR(500),
    business_license_url VARCHAR(500),
    
    -- Classification
    quality_tier VARCHAR(20) DEFAULT 'standard' CHECK (quality_tier IN ('standard', 'premium')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_hold', 'blacklisted')),
    
    -- Capacity & Capability
    average_lead_time_days INTEGER DEFAULT 7,
    production_capacity_monthly INTEGER,
    minimum_order_value DECIMAL(15,2),
    accepts_rush_orders BOOLEAN DEFAULT false,
    rush_order_surcharge_percent DECIMAL(5,2),
    
    -- Banking Information
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(100),
    bank_account_holder VARCHAR(255),
    bank_branch VARCHAR(255),
    swift_code VARCHAR(20),
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    
    -- Statistics (auto-updated)
    total_orders INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    cancelled_orders INTEGER DEFAULT 0,
    total_transaction_value DECIMAL(15,2) DEFAULT 0.00,
    
    -- Rating (auto-calculated)
    overall_rating DECIMAL(3,2) DEFAULT 0.00,
    quality_rating DECIMAL(3,2) DEFAULT 0.00,
    timeliness_rating DECIMAL(3,2) DEFAULT 0.00,
    communication_rating DECIMAL(3,2) DEFAULT 0.00,
    pricing_rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings_count INTEGER DEFAULT 0,
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    created_by UUID,
    updated_by UUID
);

-- Indexes
CREATE INDEX idx_vendors_slug ON vendors(slug);
CREATE INDEX idx_vendors_status ON vendors(status) WHERE status = 'active';
CREATE INDEX idx_vendors_quality_tier ON vendors(quality_tier);
CREATE INDEX idx_vendors_rating ON vendors(overall_rating DESC);
CREATE INDEX idx_vendors_email ON vendors(email);
CREATE INDEX idx_vendors_phone ON vendors(phone);
CREATE INDEX idx_vendors_city ON vendors(city);
CREATE INDEX idx_vendors_deleted ON vendors(deleted_at) WHERE deleted_at IS NULL;

-- Full-text search
CREATE INDEX idx_vendors_search ON vendors USING GIN (
    to_tsvector('indonesian', 
        company_name || ' ' || 
        COALESCE(brand_name, '') || ' ' || 
        COALESCE(notes, '')
    )
);
```

---

### Table: `vendor_specializations` (Tenant Schema)

Tabel untuk menyimpan specializations dan capabilities vendor per material/service type.

```sql
CREATE TABLE vendor_specializations (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Key
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    
    -- Specialization Details
    material_type VARCHAR(100) NOT NULL,
    quality_tier VARCHAR(20) DEFAULT 'standard' CHECK (quality_tier IN ('standard', 'premium')),
    
    -- Capacity & Pricing
    production_capacity_per_month INTEGER,
    min_order_quantity INTEGER DEFAULT 1,
    price_per_unit_min DECIMAL(15,2),
    price_per_unit_max DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'IDR',
    
    -- Lead Time
    lead_time_days_min INTEGER DEFAULT 7,
    lead_time_days_max INTEGER DEFAULT 14,
    
    -- Additional Info
    notes TEXT,
    certifications JSONB DEFAULT '[]'::jsonb,
    sample_images JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Performance Metrics (auto-calculated)
    total_orders_for_material INTEGER DEFAULT 0,
    success_rate_percent DECIMAL(5,2) DEFAULT 100.00,
    average_quality_rating DECIMAL(3,2) DEFAULT 0.00,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT spec_vendor_material_unique UNIQUE (vendor_id, material_type),
    CONSTRAINT spec_price_range_valid CHECK (price_per_unit_max >= price_per_unit_min),
    CONSTRAINT spec_lead_time_valid CHECK (lead_time_days_max >= lead_time_days_min)
);

-- Indexes
CREATE INDEX idx_vendor_spec_vendor ON vendor_specializations(vendor_id);
CREATE INDEX idx_vendor_spec_material ON vendor_specializations(material_type);
CREATE INDEX idx_vendor_spec_active ON vendor_specializations(is_active) WHERE is_active = true;
CREATE INDEX idx_vendor_spec_quality ON vendor_specializations(quality_tier);
CREATE INDEX idx_vendor_spec_rating ON vendor_specializations(average_quality_rating DESC);
```

**Material Types (Etching Business):**
- `akrilik` - Acrylic material
- `kuningan` - Brass material
- `tembaga` - Copper material
- `stainless_steel` - Stainless steel material
- `aluminum` - Aluminum material
- `kaca` - Glass material
- `kayu` - Wood material
- `custom` - Custom materials

---

### Table: `vendor_contacts` (Tenant Schema)

Tabel untuk menyimpan multiple contact persons per vendor.

```sql
CREATE TABLE vendor_contacts (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Key
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    
    -- Contact Information
    full_name VARCHAR(255) NOT NULL,
    position VARCHAR(100),
    department VARCHAR(100),
    
    -- Communication Channels
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile_phone VARCHAR(50),
    whatsapp VARCHAR(50),
    telegram VARCHAR(50),
    
    -- Contact Preferences
    is_primary BOOLEAN DEFAULT false,
    preferred_contact_method VARCHAR(20) DEFAULT 'email' CHECK (
        preferred_contact_method IN ('email', 'phone', 'whatsapp', 'telegram')
    ),
    available_hours VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
    
    -- Notes
    notes TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_vendor_contacts_vendor ON vendor_contacts(vendor_id);
CREATE INDEX idx_vendor_contacts_primary ON vendor_contacts(is_primary) WHERE is_primary = true;
CREATE INDEX idx_vendor_contacts_active ON vendor_contacts(is_active) WHERE is_active = true;
CREATE INDEX idx_vendor_contacts_email ON vendor_contacts(email);
CREATE INDEX idx_vendor_contacts_phone ON vendor_contacts(phone);
```

---

### Table: `vendor_ratings` (Tenant Schema)

Tabel untuk menyimpan rating dan review vendor per completed order.

```sql
CREATE TABLE vendor_ratings (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Keys
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    
    -- Rating Criteria (1-5 scale)
    quality_score DECIMAL(2,1) NOT NULL CHECK (quality_score >= 1 AND quality_score <= 5),
    timeliness_score DECIMAL(2,1) NOT NULL CHECK (timeliness_score >= 1 AND timeliness_score <= 5),
    communication_score DECIMAL(2,1) NOT NULL CHECK (communication_score >= 1 AND communication_score <= 5),
    pricing_score DECIMAL(2,1) NOT NULL CHECK (pricing_score >= 1 AND pricing_score <= 5),
    
    -- Calculated Overall Rating
    overall_rating DECIMAL(3,2) GENERATED ALWAYS AS (
        (quality_score * 0.35 + 
         timeliness_score * 0.30 + 
         communication_score * 0.20 + 
         pricing_score * 0.15)
    ) STORED,
    
    -- Detailed Feedback
    review_title VARCHAR(255),
    review_text TEXT,
    pros TEXT,
    cons TEXT,
    
    -- Order Details Snapshot
    material_type VARCHAR(100),
    order_value DECIMAL(15,2),
    delivery_days_actual INTEGER,
    delivery_days_promised INTEGER,
    
    -- Media
    review_images JSONB DEFAULT '[]'::jsonb,
    
    -- Visibility
    is_public BOOLEAN DEFAULT false,
    
    -- Admin Actions
    admin_response TEXT,
    admin_response_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    rated_by UUID NOT NULL REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT rating_order_unique UNIQUE (order_id)
);

-- Indexes
CREATE INDEX idx_vendor_ratings_vendor ON vendor_ratings(vendor_id);
CREATE INDEX idx_vendor_ratings_order ON vendor_ratings(order_id);
CREATE INDEX idx_vendor_ratings_overall ON vendor_ratings(overall_rating DESC);
CREATE INDEX idx_vendor_ratings_created ON vendor_ratings(created_at DESC);
CREATE INDEX idx_vendor_ratings_public ON vendor_ratings(is_public) WHERE is_public = true;
```

---

### Table: `vendor_negotiations` (Tenant Schema)

Tabel untuk tracking negotiation process antara admin dan vendor untuk setiap order.

```sql
CREATE TABLE vendor_negotiations (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Keys
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    
    -- Negotiation Details
    negotiation_round INTEGER DEFAULT 1,
    negotiation_status VARCHAR(20) DEFAULT 'pending' CHECK (
        negotiation_status IN ('pending', 'in_progress', 'accepted', 'rejected', 'cancelled')
    ),
    
    -- Pricing Information
    initial_quote_amount DECIMAL(15,2),
    counter_offer_amount DECIMAL(15,2),
    final_agreed_amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'IDR',
    
    -- Production Details
    estimated_production_days INTEGER,
    rush_order_requested BOOLEAN DEFAULT false,
    rush_surcharge_percent DECIMAL(5,2),
    
    -- Material & Specifications
    material_type VARCHAR(100),
    quality_tier VARCHAR(20) CHECK (quality_tier IN ('standard', 'premium')),
    quantity INTEGER,
    unit VARCHAR(50) DEFAULT 'pcs',
    specifications JSONB DEFAULT '{}'::jsonb,
    
    -- Communication
    vendor_response TEXT,
    admin_notes TEXT,
    rejection_reason TEXT,
    
    -- Attachments
    quotation_document_url VARCHAR(500),
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Timeline
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    vendor_responded_at TIMESTAMP WITH TIME ZONE,
    deal_closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Email Tracking
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    email_opened BOOLEAN DEFAULT false,
    email_opened_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_vendor_neg_vendor ON vendor_negotiations(vendor_id);
CREATE INDEX idx_vendor_neg_order ON vendor_negotiations(order_id);
CREATE INDEX idx_vendor_neg_status ON vendor_negotiations(negotiation_status);
CREATE INDEX idx_vendor_neg_round ON vendor_negotiations(negotiation_round);
CREATE INDEX idx_vendor_neg_created ON vendor_negotiations(created_at DESC);

-- Composite index for finding active negotiations
CREATE INDEX idx_vendor_neg_active ON vendor_negotiations(vendor_id, negotiation_status) 
    WHERE negotiation_status IN ('pending', 'in_progress');
```

---

### Table: `vendor_payments` (Tenant Schema)

Tabel untuk tracking pembayaran ke vendor (DP dan full payment).

```sql
CREATE TABLE vendor_payments (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Keys
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    
    -- Payment Details
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('dp', 'full', 'partial', 'refund')),
    payment_number VARCHAR(100) NOT NULL UNIQUE,
    
    -- Amounts
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'IDR',
    
    -- DP Specific (if payment_type = 'dp')
    dp_percentage DECIMAL(5,2),
    total_order_amount DECIMAL(15,2),
    remaining_amount DECIMAL(15,2),
    
    -- Payment Method
    payment_method VARCHAR(50) NOT NULL CHECK (
        payment_method IN ('bank_transfer', 'cash', 'check', 'payment_gateway', 'other')
    ),
    bank_name VARCHAR(255),
    account_number VARCHAR(100),
    transaction_reference VARCHAR(255),
    
    -- Payment Proof
    proof_of_payment_url VARCHAR(500),
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Status & Verification
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'processing', 'verified', 'failed', 'cancelled')
    ),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),
    verification_notes TEXT,
    
    -- Schedule
    scheduled_payment_date DATE,
    actual_payment_date DATE,
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_vendor_payments_vendor ON vendor_payments(vendor_id);
CREATE INDEX idx_vendor_payments_order ON vendor_payments(order_id);
CREATE INDEX idx_vendor_payments_invoice ON vendor_payments(invoice_id);
CREATE INDEX idx_vendor_payments_number ON vendor_payments(payment_number);
CREATE INDEX idx_vendor_payments_status ON vendor_payments(payment_status);
CREATE INDEX idx_vendor_payments_type ON vendor_payments(payment_type);
CREATE INDEX idx_vendor_payments_date ON vendor_payments(actual_payment_date DESC);
CREATE INDEX idx_vendor_payments_created ON vendor_payments(created_at DESC);
```

---

## RELATIONSHIP DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     VENDOR MANAGEMENT ECOSYSTEM                             │
│                          (Tenant Schema)                                    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                           vendors (Main Table)                      │    │
│  │  - id (UUID, PK)                                                    │    │
│  │  - company_name, legal_entity_name, brand_name                      │    │
│  │  - email, phone, mobile_phone, website                              │    │
│  │  - address, city, province, country                                 │    │
│  │  - npwp, siup_number, business_type                                 │    │
│  │  - quality_tier (standard/premium)                                  │    │
│  │  - status (active/inactive/on_hold/blacklisted)                     │    │
│  │  - average_lead_time_days, production_capacity                      │    │
│  │  - bank_name, bank_account_number                                   │    │
│  │  - overall_rating, quality/timeliness/communication/pricing_rating  │    │
│  │  - total_orders, completed_orders, total_transaction_value          │    │
│  └────────┬─────────────┬─────────────┬─────────────┬──────────────────┘    │
│           │             │             │             │                       │
│           │ 1:N         │ 1:N         │ 1:N         │ 1:N                   │
│           │             │             │             │                       │
│  ┌────────▼──────┐ ┌───▼───────┐ ┌────▼──────┐ ┌────▼─────┐                 │
│  │ vendor_       │ │ vendor_   │ │ vendor_   │ │ vendor_  │                 │
│  │ specializa-   │ │ contacts  │ │ ratings   │ │ negotia- │                 │
│  │ tions         │ │           │ │           │ │ tions    │                 │
│  │               │ │           │ │           │ │          │                 │
│  │ - vendor_id   │ │ - vendor_ │ │ - vendor_ │ │ - vendor_│                 │
│  │   (FK)        │ │   id(FK)  │ │   id (FK) │ │   id(FK) │                 │
│  │ - material_   │ │ - full_   │ │ - order_id│ │ - order_ │                 │
│  │   type        │ │   name    │ │   (FK)    │ │   id(FK) │                 │
│  │ - quality_    │ │ - position│ │ - quality_│ │ - nego_  │                 │
│  │   tier        │ │ - email   │ │   score   │ │   round  │                 │
│  │ - price_range │ │ - phone   │ │ - timeli- │ │ - initial│                 │
│  │ - lead_time   │ │ - is_     │ │   ness    │ │   _quote │                 │
│  │ - capacity    │ │   primary │ │ - communi-│ │ - counter│                 │
│  │ - certifica-  │ │           │ │   cation  │ │   _offer │                 │
│  │   tions       │ │           │ │ - pricing │ │ - final_ │                 │
│  │               │ │           │ │ - overall │ │   agreed │                 │
│  │               │ │           │ │ - review_ │ │ - status │                 │
│  │               │ │           │ │   text    │ │ - specs  │                 │
│  └───────────────┘ └───────────┘ └───────────┘ └──────────┘                 │
│                                                      │                      │
│                                                      │ 1:N                  │
│                                                      │                      │
│                                              ┌───────▼──────┐               │
│                                              │ vendor_      │               │
│                                              │ payments     │               │
│                                              │              │               │
│                                              │ - vendor_id  │               │
│                                              │   (FK)       │               │
│                                              │ - order_id   │               │
│                                              │   (FK)       │               │
│                                              │ - payment_   │               │
│                                              │   type       │               │
│                                              │ - amount     │               │
│                                              │ - dp_%       │               │
│                                              │ - status     │               │
│                                              │ - proof_url  │               │
│                                              │ - verified_at│               │
│                                              └──────────────┘               │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐      │
│  │                   EXTERNAL RELATIONSHIPS                          │      │
│  │                                                                   │      │
│  │         vendor_ratings.order_id → purchase_orders.id              │      │
│  │         vendor_negotiations.order_id → purchase_orders.id         │      │
│  │         vendor_payments.order_id → purchase_orders.id             │      │
│  │         vendor_payments.invoice_id → invoices.id                  │      │
│  │                                                                   │      │
│  └───────────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## FIELD SPECIFICATIONS

### Table: `vendors`

| Field | Type | Required | Default | Description | Validation | Business Rule |
|-------|------|----------|---------|-------------|------------|---------------|
| `id` | UUID | Yes | uuid_generate_v4() | Primary key | - | Auto-generated |
| `company_name` | VARCHAR(255) | Yes | - | Company legal name | Max 255 chars | Display name di vendor list |
| `legal_entity_name` | VARCHAR(255) | No | - | Full legal entity name | Max 255 chars | Untuk kontrak dan legal documents |
| `brand_name` | VARCHAR(255) | No | - | Marketing/brand name | Max 255 chars | Display name alternative |
| `slug` | VARCHAR(255) | Yes | - | URL-friendly identifier | Unique, lowercase, hyphen | Auto-generate dari company_name |
| `email` | VARCHAR(255) | Yes | - | Primary email | Valid email format | Main contact email |
| `phone` | VARCHAR(50) | Yes | - | Primary phone | Valid phone format | Main contact phone |
| `mobile_phone` | VARCHAR(50) | No | - | Mobile phone | Valid phone format | Alternative contact |
| `fax` | VARCHAR(50) | No | - | Fax number | Valid phone format | Legacy contact method |
| `website` | VARCHAR(500) | No | - | Company website | Valid URL | For reference |
| `address` | TEXT | Yes | - | Full address | Required | Physical location |
| `city` | VARCHAR(100) | No | - | City name | - | For filtering vendors by location |
| `province` | VARCHAR(100) | No | - | Province/state | - | For regional filtering |
| `postal_code` | VARCHAR(20) | No | - | Postal code | - | For shipping |
| `country` | VARCHAR(100) | No | 'Indonesia' | Country name | - | Default Indonesia |
| `npwp` | VARCHAR(50) | No | - | Tax ID number | - | Indonesian tax registration |
| `siup_number` | VARCHAR(100) | No | - | Business license number | - | Legal requirement |
| `business_type` | VARCHAR(100) | No | - | Type of business | - | Manufacturer, Distributor, etc |
| `tax_document_url` | VARCHAR(500) | No | - | URL to tax document | Valid URL | NPWP scan/PDF |
| `business_license_url` | VARCHAR(500) | No | - | URL to license | Valid URL | SIUP scan/PDF |
| `quality_tier` | VARCHAR(20) | No | 'standard' | Quality classification | standard/premium | Filter for quotation |
| `status` | VARCHAR(20) | No | 'active' | Operational status | active/inactive/on_hold/blacklisted | Workflow control |
| `average_lead_time_days` | INTEGER | No | 7 | Average production days | >= 0 | Default estimate |
| `production_capacity_monthly` | INTEGER | No | - | Monthly capacity units | >= 0 | For capacity planning |
| `minimum_order_value` | DECIMAL(15,2) | No | - | Min order amount | >= 0 | MOQ in currency |
| `accepts_rush_orders` | BOOLEAN | No | false | Can handle rush | true/false | Capability flag |
| `rush_order_surcharge_percent` | DECIMAL(5,2) | No | - | Rush surcharge % | 0-100 | Additional cost |
| `bank_name` | VARCHAR(255) | No | - | Bank name | - | For payments |
| `bank_account_number` | VARCHAR(100) | No | - | Account number | - | For payments |
| `bank_account_holder` | VARCHAR(255) | No | - | Account holder name | - | Must match legal name |
| `bank_branch` | VARCHAR(255) | No | - | Bank branch | - | For verification |
| `swift_code` | VARCHAR(20) | No | - | SWIFT/BIC code | - | International transfers |
| `notes` | TEXT | No | - | Public notes | - | Visible to users |
| `internal_notes` | TEXT | No | - | Admin-only notes | - | Internal use only |
| `total_orders` | INTEGER | No | 0 | Total orders count | >= 0 | Auto-incremented |
| `completed_orders` | INTEGER | No | 0 | Completed orders | >= 0 | Auto-incremented |
| `cancelled_orders` | INTEGER | No | 0 | Cancelled orders | >= 0 | Auto-incremented |
| `total_transaction_value` | DECIMAL(15,2) | No | 0.00 | Lifetime transaction value | >= 0 | Auto-summed |
| `overall_rating` | DECIMAL(3,2) | No | 0.00 | Average overall rating | 0-5 | Auto-calculated |
| `quality_rating` | DECIMAL(3,2) | No | 0.00 | Avg quality score | 0-5 | Auto-calculated |
| `timeliness_rating` | DECIMAL(3,2) | No | 0.00 | Avg timeliness score | 0-5 | Auto-calculated |
| `communication_rating` | DECIMAL(3,2) | No | 0.00 | Avg communication score | 0-5 | Auto-calculated |
| `pricing_rating` | DECIMAL(3,2) | No | 0.00 | Avg pricing score | 0-5 | Auto-calculated |
| `total_ratings_count` | INTEGER | No | 0 | Number of ratings | >= 0 | Auto-incremented |
| `is_verified` | BOOLEAN | No | false | Verification status | true/false | Admin verification |
| `verified_at` | TIMESTAMP | No | - | Verification time | - | Audit trail |
| `verified_by` | UUID | No | - | User who verified | Valid user ID | Audit trail |
| `created_at` | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Creation timestamp | - | Auto-generated |
| `updated_at` | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Update timestamp | - | Auto-updated |
| `deleted_at` | TIMESTAMP | No | NULL | Soft delete timestamp | - | NULL = active |
| `created_by` | UUID | No | - | Creator user ID | Valid user ID | Audit trail |
| `updated_by` | UUID | No | - | Last updater ID | Valid user ID | Audit trail |

---

### Table: `vendor_specializations`

| Field | Type | Required | Default | Description | Validation | Business Rule |
|-------|------|----------|---------|-------------|------------|---------------|
| `id` | UUID | Yes | uuid_generate_v4() | Primary key | - | Auto-generated |
| `vendor_id` | UUID | Yes | - | Foreign key to vendors | Valid vendor ID | CASCADE on delete |
| `material_type` | VARCHAR(100) | Yes | - | Material specialty | - | akrilik, kuningan, etc |
| `quality_tier` | VARCHAR(20) | No | 'standard' | Quality level | standard/premium | Match vendor tier |
| `production_capacity_per_month` | INTEGER | No | - | Monthly capacity | >= 0 | Per material |
| `min_order_quantity` | INTEGER | No | 1 | MOQ for material | >= 1 | Minimum units |
| `price_per_unit_min` | DECIMAL(15,2) | No | - | Price range min | >= 0 | Reference pricing |
| `price_per_unit_max` | DECIMAL(15,2) | No | - | Price range max | >= min | Reference pricing |
| `currency` | VARCHAR(3) | No | 'IDR' | Currency code | ISO 4217 | IDR default |
| `lead_time_days_min` | INTEGER | No | 7 | Min lead time | >= 0 | Best case |
| `lead_time_days_max` | INTEGER | No | 14 | Max lead time | >= min | Worst case |
| `notes` | TEXT | No | - | Specialization notes | - | Details |
| `certifications` | JSONB | No | [] | Quality certifications | Valid JSON array | ISO, etc |
| `sample_images` | JSONB | No | [] | Product samples | Valid JSON array | Portfolio |
| `is_active` | BOOLEAN | No | true | Availability | true/false | Can quote |
| `total_orders_for_material` | INTEGER | No | 0 | Orders count | >= 0 | Auto-incremented |
| `success_rate_percent` | DECIMAL(5,2) | No | 100.00 | Success rate | 0-100 | Auto-calculated |
| `average_quality_rating` | DECIMAL(3,2) | No | 0.00 | Avg quality | 0-5 | Auto-calculated |
| `created_at` | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Creation time | - | Auto-generated |
| `updated_at` | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Update time | - | Auto-updated |

---

### Table: `vendor_contacts`

| Field | Type | Required | Default | Description | Validation | Business Rule |
|-------|------|----------|---------|-------------|------------|---------------|
| `id` | UUID | Yes | uuid_generate_v4() | Primary key | - | Auto-generated |
| `vendor_id` | UUID | Yes | - | Foreign key to vendors | Valid vendor ID | CASCADE on delete |
| `full_name` | VARCHAR(255) | Yes | - | Contact person name | Max 255 chars | Display name |
| `position` | VARCHAR(100) | No | - | Job title | - | e.g., Sales Manager |
| `department` | VARCHAR(100) | No | - | Department | - | e.g., Sales, Production |
| `email` | VARCHAR(255) | No | - | Email address | Valid email | Contact channel |
| `phone` | VARCHAR(50) | No | - | Phone number | Valid phone | Contact channel |
| `mobile_phone` | VARCHAR(50) | No | - | Mobile number | Valid phone | Preferred |
| `whatsapp` | VARCHAR(50) | No | - | WhatsApp number | Valid phone | Instant messaging |
| `telegram` | VARCHAR(50) | No | - | Telegram handle | - | Alternative messaging |
| `is_primary` | BOOLEAN | No | false | Primary contact | true/false | One per vendor |
| `preferred_contact_method` | VARCHAR(20) | No | 'email' | Preferred channel | email/phone/whatsapp/telegram | Communication preference |
| `available_hours` | VARCHAR(100) | No | - | Availability | - | e.g., "09:00-17:00 WIB" |
| `timezone` | VARCHAR(50) | No | 'Asia/Jakarta' | Timezone | Valid TZ | For scheduling |
| `notes` | TEXT | No | - | Contact notes | - | Additional info |
| `is_active` | BOOLEAN | No | true | Active status | true/false | Can contact |
| `created_at` | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Creation time | - | Auto-generated |
| `updated_at` | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Update time | - | Auto-updated |
| `deleted_at` | TIMESTAMP | No | NULL | Soft delete | - | NULL = active |

---

### Table: `vendor_ratings`

| Field | Type | Required | Default | Description | Validation | Business Rule |
|-------|------|----------|---------|-------------|------------|---------------|
| `id` | UUID | Yes | uuid_generate_v4() | Primary key | - | Auto-generated |
| `vendor_id` | UUID | Yes | - | Foreign key to vendors | Valid vendor ID | CASCADE on delete |
| `order_id` | UUID | Yes | - | Foreign key to orders | Valid order ID | CASCADE on delete, UNIQUE |
| `quality_score` | DECIMAL(2,1) | Yes | - | Product quality | 1.0-5.0 | 35% weight |
| `timeliness_score` | DECIMAL(2,1) | Yes | - | Delivery timeliness | 1.0-5.0 | 30% weight |
| `communication_score` | DECIMAL(2,1) | Yes | - | Communication quality | 1.0-5.0 | 20% weight |
| `pricing_score` | DECIMAL(2,1) | Yes | - | Price competitiveness | 1.0-5.0 | 15% weight |
| `overall_rating` | DECIMAL(3,2) | - | - | Calculated overall | 1.00-5.00 | Auto-computed (weighted avg) |
| `review_title` | VARCHAR(255) | No | - | Review headline | Max 255 chars | Summary |
| `review_text` | TEXT | No | - | Detailed review | - | Full feedback |
| `pros` | TEXT | No | - | Positive aspects | - | What went well |
| `cons` | TEXT | No | - | Negative aspects | - | Areas for improvement |
| `material_type` | VARCHAR(100) | No | - | Material ordered | - | Context snapshot |
| `order_value` | DECIMAL(15,2) | No | - | Order amount | >= 0 | Context snapshot |
| `delivery_days_actual` | INTEGER | No | - | Actual delivery days | >= 0 | Performance metric |
| `delivery_days_promised` | INTEGER | No | - | Promised days | >= 0 | Comparison baseline |
| `review_images` | JSONB | No | [] | Evidence images | Valid JSON array | Quality proof |
| `is_public` | BOOLEAN | No | false | Public visibility | true/false | Display on vendor profile |
| `admin_response` | TEXT | No | - | Vendor response | - | Dispute resolution |
| `admin_response_at` | TIMESTAMP | No | - | Response time | - | Audit trail |
| `created_at` | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Rating time | - | Auto-generated |
| `updated_at` | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Update time | - | Auto-updated |
| `rated_by` | UUID | Yes | - | Rater user ID | Valid user ID | Audit trail |

---

### Table: `vendor_negotiations`

| Field | Type | Required | Default | Description | Validation | Business Rule |
|-------|------|----------|---------|-------------|------------|---------------|
| `id` | UUID | Yes | uuid_generate_v4() | Primary key | - | Auto-generated |
| `vendor_id` | UUID | Yes | - | Foreign key to vendors | Valid vendor ID | CASCADE on delete |
| `order_id` | UUID | Yes | - | Foreign key to orders | Valid order ID | CASCADE on delete |
| `negotiation_round` | INTEGER | No | 1 | Negotiation iteration | >= 1 | Increment for counter-offers |
| `negotiation_status` | VARCHAR(20) | No | 'pending' | Status | pending/in_progress/accepted/rejected/cancelled | Workflow state |
| `initial_quote_amount` | DECIMAL(15,2) | No | - | Vendor initial quote | >= 0 | First offer |
| `counter_offer_amount` | DECIMAL(15,2) | No | - | Admin counter | >= 0 | Negotiation price |
| `final_agreed_amount` | DECIMAL(15,2) | No | - | Final deal price | >= 0 | Accepted amount |
| `currency` | VARCHAR(3) | No | 'IDR' | Currency code | ISO 4217 | IDR default |
| `estimated_production_days` | INTEGER | No | - | Production time | >= 0 | Vendor estimate |
| `rush_order_requested` | BOOLEAN | No | false | Rush flag | true/false | Expedited handling |
| `rush_surcharge_percent` | DECIMAL(5,2) | No | - | Rush fee | 0-100 | Additional cost % |
| `material_type` | VARCHAR(100) | No | - | Material | - | Order specification |
| `quality_tier` | VARCHAR(20) | No | - | Quality | standard/premium | Order specification |
| `quantity` | INTEGER | No | - | Order quantity | >= 0 | Number of units |
| `unit` | VARCHAR(50) | No | 'pcs' | Unit of measure | - | pcs, m², kg, etc |
| `specifications` | JSONB | No | {} | Technical specs | Valid JSON | Order details |
| `vendor_response` | TEXT | No | - | Vendor message | - | Communication log |
| `admin_notes` | TEXT | No | - | Internal notes | - | Admin reference |
| `rejection_reason` | TEXT | No | - | Why rejected | - | If status=rejected |
| `quotation_document_url` | VARCHAR(500) | No | - | Quote PDF URL | Valid URL | Formal quotation |
| `attachments` | JSONB | No | [] | Supporting docs | Valid JSON array | Additional files |
| `requested_at` | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Request time | - | Start of negotiation |
| `vendor_responded_at` | TIMESTAMP | No | - | Vendor response time | - | SLA tracking |
| `deal_closed_at` | TIMESTAMP | No | - | Deal closure time | - | End of negotiation |
| `email_sent` | BOOLEAN | No | false | Email sent flag | true/false | Communication tracking |
| `email_sent_at` | TIMESTAMP | No | - | Email send time | - | Audit trail |
| `email_opened` | BOOLEAN | No | false | Email opened flag | true/false | Vendor engagement |
| `email_opened_at` | TIMESTAMP | No | - | Email open time | - | Engagement metric |
| `created_at` | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Creation time | - | Auto-generated |
| `updated_at` | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Update time | - | Auto-updated |
| `created_by` | UUID | No | - | Creator user ID | Valid user ID | Audit trail |
| `updated_by` | UUID | No | - | Updater user ID | Valid user ID | Audit trail |

---

### Table: `vendor_payments`

| Field | Type | Required | Default | Description | Validation | Business Rule |
|-------|------|----------|---------|-------------|------------|---------------|
| `id` | UUID | Yes | uuid_generate_v4() | Primary key | - | Auto-generated |
| `vendor_id` | UUID | Yes | - | Foreign key to vendors | Valid vendor ID | RESTRICT on delete |
| `order_id` | UUID | Yes | - | Foreign key to orders | Valid order ID | RESTRICT on delete |
| `invoice_id` | UUID | No | - | Foreign key to invoices | Valid invoice ID | SET NULL on delete |
| `payment_type` | VARCHAR(20) | Yes | - | Payment category | dp/full/partial/refund | Transaction type |
| `payment_number` | VARCHAR(100) | Yes | - | Payment ID | Unique | Transaction reference |
| `amount` | DECIMAL(15,2) | Yes | - | Payment amount | > 0 | Transaction value |
| `currency` | VARCHAR(3) | No | 'IDR' | Currency code | ISO 4217 | IDR default |
| `dp_percentage` | DECIMAL(5,2) | No | - | DP percentage | 0-100 | If payment_type='dp' |
| `total_order_amount` | DECIMAL(15,2) | No | - | Total order value | >= 0 | Context |
| `remaining_amount` | DECIMAL(15,2) | No | - | Remaining balance | >= 0 | Outstanding amount |
| `payment_method` | VARCHAR(50) | Yes | - | Payment channel | bank_transfer/cash/check/payment_gateway/other | How paid |
| `bank_name` | VARCHAR(255) | No | - | Bank name | - | If bank_transfer |
| `account_number` | VARCHAR(100) | No | - | Account number | - | Destination account |
| `transaction_reference` | VARCHAR(255) | No | - | Bank ref number | - | Proof reference |
| `proof_of_payment_url` | VARCHAR(500) | No | - | Receipt URL | Valid URL | Evidence |
| `attachments` | JSONB | No | [] | Additional docs | Valid JSON array | Supporting files |
| `payment_status` | VARCHAR(20) | No | 'pending' | Status | pending/processing/verified/failed/cancelled | Workflow state |
| `verified_at` | TIMESTAMP | No | - | Verification time | - | Approval timestamp |
| `verified_by` | UUID | No | - | Verifier user ID | Valid user ID | Who approved |
| `verification_notes` | TEXT | No | - | Verification notes | - | Approval comments |
| `scheduled_payment_date` | DATE | No | - | Planned date | - | For scheduling |
| `actual_payment_date` | DATE | No | - | Actual date | - | When paid |
| `notes` | TEXT | No | - | Public notes | - | Transaction memo |
| `internal_notes` | TEXT | No | - | Admin notes | - | Internal reference |
| `created_at` | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Creation time | - | Auto-generated |
| `updated_at` | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Update time | - | Auto-updated |
| `created_by` | UUID | No | - | Creator user ID | Valid user ID | Audit trail |
| `updated_by` | UUID | No | - | Updater user ID | Valid user ID | Audit trail |

---

## BUSINESS RULES

### Vendor Registration & Verification

1. **Minimum Required Fields**:
   - `company_name`, `email`, `phone`, `address` are MANDATORY
   - At least 1 contact person must be added
   - At least 1 specialization must be defined
   - Bank account details REQUIRED before first payment

2. **Vendor Status Workflow**:
   ```
   new → active → on_hold → active
   active → blacklisted (permanent)
   inactive (temporary suspension)
   ```

3. **Verification Rules**:
   - `is_verified = true` requires `npwp` AND `siup_number`
   - Only verified vendors can receive payments
   - Unverified vendors can negotiate but cannot close deals

---

### Vendor Sourcing & Matching

1. **Vendor Selection Criteria**:
   ```sql
   WHERE status = 'active'
     AND is_verified = true
     AND EXISTS (
       SELECT 1 FROM vendor_specializations vs
       WHERE vs.vendor_id = v.id
         AND vs.material_type = :requested_material
         AND vs.is_active = true
         AND vs.average_quality_rating >= :min_rating
     )
   ORDER BY overall_rating DESC, average_lead_time_days ASC
   ```

2. **Multi-Vendor Quotation**:
   - Admin dapat request quote ke max 5 vendors simultaneously
   - System auto-rank vendors berdasarkan historical performance
   - Vendor dengan rating < 3.0 akan diberi warning flag

---

### Negotiation Workflow

1. **Negotiation Rounds**:
   - Round 1: Initial quote dari vendor
   - Round 2+: Counter-offers (max 5 rounds recommended)
   - Auto-escalation ke manager jika round > 3
   - Auto-rejection jika no response dalam 48 hours

2. **Price Validation**:
   ```
   final_agreed_amount MUST be:
   - >= vendor_specializations.price_per_unit_min * quantity
   - <= vendor_specializations.price_per_unit_max * quantity * 1.2
   ```

3. **Deal Acceptance**:
   - Status: `pending` → `in_progress` → `accepted`
   - `final_agreed_amount` REQUIRED before status='accepted'
   - `estimated_production_days` REQUIRED
   - Auto-create invoice record upon acceptance
   - Notification sent to vendor AND customer

---

### Vendor Rating System

1. **Rating Calculation**:
   ```
   overall_rating = (quality_score × 0.35) + 
                    (timeliness_score × 0.30) + 
                    (communication_score × 0.20) + 
                    (pricing_score × 0.15)
   ```

2. **Rating Aggregation**:
   - Vendor overall_rating = AVG(all vendor_ratings.overall_rating)
   - Vendor quality_rating = AVG(vendor_ratings.quality_score)
   - Updated via database trigger after each new rating

3. **Rating Visibility**:
   - Only admin can create ratings
   - Rating auto-created after order status = 'completed'
   - `is_public = true` displays on vendor profile (with admin approval)

---

### Vendor Payment Rules

1. **DP Payment Constraints**:
   ```
   IF customer_payment_type = 'dp' AND customer_dp_percent = 50%:
     vendor_dp_amount < (customer_dp_received * 0.50)
   ELSE:
     vendor_dp_amount <= customer_total_received
   ```

2. **Payment Verification**:
   - All payments MUST be verified by finance role
   - `proof_of_payment_url` REQUIRED for verification
   - Payment status: `pending` → `processing` → `verified`
   - Auto-update vendor `total_transaction_value` after verification

3. **Payment Scheduling**:
   - DP payment: After customer DP verified
   - Full payment: After production complete 100%
   - `scheduled_payment_date` auto-set based on payment terms

---

## API ENDPOINTS

### Public Endpoints

```yaml
# Public vendor directory (for future vendor portal)
GET /api/v1/vendors
  Query Params:
    - city: string (filter by city)
    - province: string (filter by province)
    - material_type: string (filter by specialization)
    - min_rating: float (minimum overall_rating)
    - limit: integer (default: 20, max: 100)
    - offset: integer (pagination)
  Response:
    {
      "success": true,
      "data": [
        {
          "id": "uuid",
          "company_name": "PT Vendor ABC",
          "city": "Jakarta",
          "overall_rating": 4.5,
          "total_orders": 150,
          "specializations": ["akrilik", "kuningan"],
          "is_verified": true
        }
      ],
      "meta": {
        "total": 45,
        "limit": 20,
        "offset": 0
      }
    }

GET /api/v1/vendors/{id}
  Response:
    {
      "success": true,
      "data": {
        "id": "uuid",
        "company_name": "PT Vendor ABC",
        "brand_name": "ABC Etching",
        "email": "sales@abc.com",
        "phone": "+62 21 1234567",
        "website": "https://abc.com",
        "address": "Jl. Example No. 123, Jakarta",
        "city": "Jakarta",
        "province": "DKI Jakarta",
        "overall_rating": 4.5,
        "total_orders": 150,
        "specializations": [...],
        "contacts": [...],
        "public_ratings": [...]
      }
    }
```

---

### Admin Endpoints

```yaml
# Vendor Management
POST /api/v1/admin/vendors
  Headers:
    Authorization: Bearer {token}
  Body:
    {
      "company_name": "PT Vendor XYZ",
      "legal_entity_name": "PT Vendor XYZ Sejahtera",
      "email": "sales@xyz.com",
      "phone": "+62 21 9876543",
      "address": "Jl. Vendor No. 456, Jakarta",
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "quality_tier": "premium",
      "npwp": "01.234.567.8-901.000",
      "siup_number": "SIUP/001/2023",
      "bank_name": "Bank Mandiri",
      "bank_account_number": "1234567890",
      "bank_account_holder": "PT Vendor XYZ"
    }
  Response:
    {
      "success": true,
      "data": {
        "id": "uuid",
        "company_name": "PT Vendor XYZ",
        "slug": "pt-vendor-xyz",
        "status": "active",
        "is_verified": false
      },
      "message": "Vendor created successfully"
    }

PUT /api/v1/admin/vendors/{id}
  Headers:
    Authorization: Bearer {token}
  Body: (same as POST, partial updates allowed)
  Response: (same as POST)

DELETE /api/v1/admin/vendors/{id}
  Headers:
    Authorization: Bearer {token}
  Response:
    {
      "success": true,
      "message": "Vendor deleted successfully"
    }

PATCH /api/v1/admin/vendors/{id}/verify
  Headers:
    Authorization: Bearer {token}
  Body:
    {
      "is_verified": true
    }
  Response:
    {
      "success": true,
      "data": {
        "id": "uuid",
        "is_verified": true,
        "verified_at": "2025-11-10T10:30:00Z",
        "verified_by": "admin-uuid"
      }
    }

# Vendor Specializations
POST /api/v1/admin/vendors/{vendor_id}/specializations
  Body:
    {
      "material_type": "akrilik",
      "quality_tier": "premium",
      "production_capacity_per_month": 1000,
      "price_per_unit_min": 50000,
      "price_per_unit_max": 150000,
      "lead_time_days_min": 5,
      "lead_time_days_max": 10
    }

GET /api/v1/admin/vendors/{vendor_id}/specializations

PUT /api/v1/admin/vendors/{vendor_id}/specializations/{id}

DELETE /api/v1/admin/vendors/{vendor_id}/specializations/{id}

# Vendor Contacts
POST /api/v1/admin/vendors/{vendor_id}/contacts
  Body:
    {
      "full_name": "John Doe",
      "position": "Sales Manager",
      "email": "john@vendor.com",
      "phone": "+62 812 3456789",
      "is_primary": true,
      "preferred_contact_method": "whatsapp"
    }

GET /api/v1/admin/vendors/{vendor_id}/contacts

PUT /api/v1/admin/vendors/{vendor_id}/contacts/{id}

DELETE /api/v1/admin/vendors/{vendor_id}/contacts/{id}

# Vendor Negotiations
POST /api/v1/admin/vendors/{vendor_id}/negotiations
  Body:
    {
      "order_id": "order-uuid",
      "material_type": "kuningan",
      "quality_tier": "standard",
      "quantity": 100,
      "specifications": {
        "thickness": "2mm",
        "size": "15x20cm"
      }
    }
  Response:
    {
      "success": true,
      "data": {
        "id": "negotiation-uuid",
        "negotiation_round": 1,
        "negotiation_status": "pending",
        "email_sent": true,
        "email_sent_at": "2025-11-10T10:30:00Z"
      },
      "message": "Quotation request sent to vendor"
    }

PUT /api/v1/admin/negotiations/{id}/respond
  Body:
    {
      "vendor_response": "We can do this for IDR 75,000 per unit",
      "initial_quote_amount": 7500000,
      "estimated_production_days": 7
    }

PUT /api/v1/admin/negotiations/{id}/counter-offer
  Body:
    {
      "counter_offer_amount": 7000000,
      "admin_notes": "Customer budget is limited"
    }

PUT /api/v1/admin/negotiations/{id}/accept
  Body:
    {
      "final_agreed_amount": 7250000,
      "estimated_production_days": 7
    }

PUT /api/v1/admin/negotiations/{id}/reject
  Body:
    {
      "rejection_reason": "Price too high"
    }

# Vendor Ratings
POST /api/v1/admin/vendors/{vendor_id}/ratings
  Body:
    {
      "order_id": "order-uuid",
      "quality_score": 4.5,
      "timeliness_score": 4.0,
      "communication_score": 4.8,
      "pricing_score": 4.2,
      "review_text": "Excellent quality, on-time delivery",
      "is_public": true
    }

GET /api/v1/admin/vendors/{vendor_id}/ratings
  Query: page, limit, min_rating

PUT /api/v1/admin/ratings/{id}

DELETE /api/v1/admin/ratings/{id}

# Vendor Payments
POST /api/v1/admin/vendors/{vendor_id}/payments
  Body:
    {
      "order_id": "order-uuid",
      "payment_type": "dp",
      "amount": 3500000,
      "dp_percentage": 50,
      "total_order_amount": 7000000,
      "payment_method": "bank_transfer",
      "bank_name": "Bank Mandiri",
      "transaction_reference": "TRX20251110001",
      "scheduled_payment_date": "2025-11-15"
    }

PUT /api/v1/admin/payments/{id}/verify
  Body:
    {
      "payment_status": "verified",
      "actual_payment_date": "2025-11-15",
      "proof_of_payment_url": "https://storage.example.com/receipts/xxx.pdf",
      "verification_notes": "Payment confirmed"
    }

GET /api/v1/admin/vendors/{vendor_id}/payments
  Query: payment_type, payment_status, from_date, to_date

# Vendor Search & Filter
GET /api/v1/admin/vendors/search
  Query:
    - q: string (search company_name, email, phone)
    - status: string (active/inactive/on_hold/blacklisted)
    - quality_tier: string (standard/premium)
    - min_rating: float
    - material_type: string
    - city: string
    - is_verified: boolean
  Response:
    {
      "success": true,
      "data": [...],
      "meta": {
        "total": 15,
        "page": 1,
        "per_page": 20
      }
    }

# Vendor Performance Report
GET /api/v1/admin/vendors/{id}/performance
  Query:
    - from_date: date
    - to_date: date
  Response:
    {
      "success": true,
      "data": {
        "vendor_id": "uuid",
        "period": {
          "from": "2025-01-01",
          "to": "2025-11-10"
        },
        "metrics": {
          "total_orders": 45,
          "completed_orders": 42,
          "cancelled_orders": 2,
          "success_rate": 93.33,
          "total_value": 350000000,
          "average_order_value": 7777777.78,
          "average_lead_time_days": 8.5,
          "on_time_delivery_rate": 91.67,
          "ratings": {
            "overall": 4.5,
            "quality": 4.6,
            "timeliness": 4.3,
            "communication": 4.7,
            "pricing": 4.4,
            "total_reviews": 40
          }
        },
        "by_material": [
          {
            "material_type": "akrilik",
            "orders": 20,
            "total_value": 150000000,
            "avg_rating": 4.6
          },
          {
            "material_type": "kuningan",
            "orders": 15,
            "total_value": 120000000,
            "avg_rating": 4.3
          }
        ]
      }
    }
```

---

## ADMIN UI FEATURES

### Vendor Management Dashboard

1. **Vendor List View**:
   - Sortable data table dengan columns: Code, Name, Contact, Category, Status, Rating, Total Orders
   - Advanced filters: status, quality_tier, city, material_type, min_rating
   - Bulk actions: Activate, Deactivate, Export
   - Quick search: company_name, email, phone

2. **Vendor Detail View**:
   - Tabs interface:
     - **Info Tab**: Company details, contact info, banking
     - **Specializations Tab**: Material capabilities dengan pricing ranges
     - **Contacts Tab**: Multiple contact persons management
     - **Performance Tab**: Ratings, order history, charts
     - **Negotiations Tab**: Active dan historical negotiations
     - **Payments Tab**: Payment history dan pending payments
     - **Documents Tab**: NPWP, SIUP, contracts

3. **Add/Edit Vendor Form**:
   - Multi-step wizard:
     - Step 1: Company Information
     - Step 2: Contact Details
     - Step 3: Specializations
     - Step 4: Banking Information
     - Step 5: Verification Documents
   - Real-time validation
   - Auto-generate vendor code
   - Google Maps integration untuk location picking

4. **Vendor Stats Cards**:
   - Total Vendors
   - Active Vendors
   - Average Rating
   - Total Transaction Value
   - Pending Verifications

---

### Negotiation Management UI

1. **Negotiation Dashboard**:
   - Kanban board view: Pending → In Progress → Accepted/Rejected
   - Timeline view untuk multi-round negotiations
   - Quick actions: Accept, Counter-offer, Reject
   - Email preview sebelum send

2. **Negotiation Detail Modal**:
   - Order details snapshot
   - Vendor information
   - Negotiation history log
   - Price comparison chart
   - Response time tracking
   - Email communication history

---

### Vendor Rating UI

1. **Rating Form**:
   - Star rating inputs (1-5) untuk 4 criteria
   - Overall rating auto-calculated dengan visual indicator
   - Rich text editor untuk review
   - Image upload untuk quality proof
   - Public visibility toggle

2. **Vendor Performance Dashboard**:
   - Rating trends chart (line graph)
   - Criteria breakdown (radar chart)
   - Orders by material (bar chart)
   - On-time delivery percentage (gauge)
   - Success rate tracking

---

## SAMPLE DATA

### Sample Vendor Records

```json
{
  "vendors": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "company_name": "PT Etching Prima Indonesia",
      "legal_entity_name": "PT Etching Prima Indonesia Sejahtera",
      "brand_name": "Prima Etching",
      "slug": "pt-etching-prima-indonesia",
      "email": "sales@primaetching.co.id",
      "phone": "+62 21 5551234",
      "mobile_phone": "+62 812 3456 7890",
      "website": "https://primaetching.co.id",
      "address": "Jl. Industri Raya No. 45, Kawasan Industri MM2100",
      "city": "Bekasi",
      "province": "Jawa Barat",
      "postal_code": "17520",
      "country": "Indonesia",
      "npwp": "01.234.567.8-901.000",
      "siup_number": "SIUP/001/2023/BEKASI",
      "business_type": "Manufacturer",
      "quality_tier": "premium",
      "status": "active",
      "average_lead_time_days": 7,
      "production_capacity_monthly": 5000,
      "minimum_order_value": 1000000,
      "accepts_rush_orders": true,
      "rush_order_surcharge_percent": 25.00,
      "bank_name": "Bank Mandiri",
      "bank_account_number": "1370012345678",
      "bank_account_holder": "PT Etching Prima Indonesia",
      "bank_branch": "KCP MM2100 Bekasi",
      "swift_code": "BMRIIDJA",
      "notes": "Vendor utama untuk akrilik dan kuningan premium quality",
      "internal_notes": "Payment terms: NET 30, always on-time delivery",
      "total_orders": 156,
      "completed_orders": 152,
      "cancelled_orders": 2,
      "total_transaction_value": 875000000.00,
      "overall_rating": 4.65,
      "quality_rating": 4.70,
      "timeliness_rating": 4.60,
      "communication_rating": 4.75,
      "pricing_rating": 4.55,
      "total_ratings_count": 148,
      "is_verified": true,
      "verified_at": "2024-01-15T10:30:00Z",
      "verified_by": "admin-uuid-1",
      "created_at": "2023-12-01T08:00:00Z",
      "updated_at": "2025-11-10T15:45:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "company_name": "CV Logam Jaya Abadi",
      "slug": "cv-logam-jaya-abadi",
      "email": "order@logamjaya.com",
      "phone": "+62 21 9876543",
      "address": "Jl. Raya Industri No. 123, Cibitung",
      "city": "Bekasi",
      "province": "Jawa Barat",
      "country": "Indonesia",
      "quality_tier": "standard",
      "status": "active",
      "average_lead_time_days": 10,
      "overall_rating": 4.20,
      "total_orders": 89,
      "completed_orders": 85,
      "is_verified": true,
      "created_at": "2024-03-10T09:00:00Z"
    }
  ]
}
```

### Sample Specializations

```json
{
  "vendor_specializations": [
    {
      "id": "spec-uuid-1",
      "vendor_id": "550e8400-e29b-41d4-a716-446655440001",
      "material_type": "akrilik",
      "quality_tier": "premium",
      "production_capacity_per_month": 2000,
      "min_order_quantity": 10,
      "price_per_unit_min": 75000.00,
      "price_per_unit_max": 250000.00,
      "currency": "IDR",
      "lead_time_days_min": 5,
      "lead_time_days_max": 10,
      "notes": "Spesialis akrilik crystal clear dan mirror finish",
      "certifications": ["ISO 9001:2015", "SNI Akrilik"],
      "sample_images": [
        "https://storage.example.com/samples/akrilik-premium-1.jpg",
        "https://storage.example.com/samples/akrilik-premium-2.jpg"
      ],
      "is_active": true,
      "total_orders_for_material": 95,
      "success_rate_percent": 98.95,
      "average_quality_rating": 4.75
    },
    {
      "id": "spec-uuid-2",
      "vendor_id": "550e8400-e29b-41d4-a716-446655440001",
      "material_type": "kuningan",
      "quality_tier": "premium",
      "production_capacity_per_month": 1500,
      "min_order_quantity": 50,
      "price_per_unit_min": 50000.00,
      "price_per_unit_max": 150000.00,
      "currency": "IDR",
      "lead_time_days_min": 7,
      "lead_time_days_max": 14,
      "notes": "Kuningan natural dan gold plated",
      "is_active": true,
      "total_orders_for_material": 61,
      "success_rate_percent": 96.72,
      "average_quality_rating": 4.60
    }
  ]
}
```

### Sample Negotiation

```json
{
  "vendor_negotiations": [
    {
      "id": "nego-uuid-1",
      "vendor_id": "550e8400-e29b-41d4-a716-446655440001",
      "order_id": "order-uuid-123",
      "negotiation_round": 2,
      "negotiation_status": "accepted",
      "initial_quote_amount": 8500000.00,
      "counter_offer_amount": 8000000.00,
      "final_agreed_amount": 8250000.00,
      "currency": "IDR",
      "estimated_production_days": 10,
      "rush_order_requested": false,
      "material_type": "akrilik",
      "quality_tier": "premium",
      "quantity": 100,
      "unit": "pcs",
      "specifications": {
        "thickness": "3mm",
        "size": "20x30cm",
        "finish": "mirror",
        "engraving_type": "laser"
      },
      "vendor_response": "We can offer IDR 85,000 per unit for 100pcs with 10 days lead time",
      "admin_notes": "Customer budget is IDR 8,000,000 total. Negotiated down to IDR 8,250,000.",
      "quotation_document_url": "https://storage.example.com/quotes/Q-2025-001.pdf",
      "requested_at": "2025-11-01T09:00:00Z",
      "vendor_responded_at": "2025-11-01T14:30:00Z",
      "deal_closed_at": "2025-11-02T10:15:00Z",
      "email_sent": true,
      "email_sent_at": "2025-11-01T09:05:00Z",
      "email_opened": true,
      "email_opened_at": "2025-11-01T10:20:00Z"
    }
  ]
}
```

### Sample Rating

```json
{
  "vendor_ratings": [
    {
      "id": "rating-uuid-1",
      "vendor_id": "550e8400-e29b-41d4-a716-446655440001",
      "order_id": "order-uuid-123",
      "quality_score": 4.5,
      "timeliness_score": 5.0,
      "communication_score": 4.5,
      "pricing_score": 4.0,
      "review_title": "Excellent quality, on-time delivery",
      "review_text": "PT Etching Prima delivered outstanding quality akrilik etching. The mirror finish was perfect, engraving was precise. Delivery was actually 2 days earlier than promised. Highly recommended!",
      "pros": "Premium quality, fast delivery, responsive communication",
      "cons": "Slightly higher price point, but worth it for the quality",
      "material_type": "akrilik",
      "order_value": 8250000.00,
      "delivery_days_actual": 8,
      "delivery_days_promised": 10,
      "review_images": [
        "https://storage.example.com/reviews/finished-product-1.jpg",
        "https://storage.example.com/reviews/detail-closeup.jpg"
      ],
      "is_public": true,
      "created_at": "2025-11-15T16:00:00Z",
      "rated_by": "admin-uuid-1"
    }
  ]
}
```

### Sample Payment

```json
{
  "vendor_payments": [
    {
      "id": "payment-uuid-1",
      "vendor_id": "550e8400-e29b-41d4-a716-446655440001",
      "order_id": "order-uuid-123",
      "invoice_id": "inv-uuid-vendor-123",
      "payment_type": "dp",
      "payment_number": "VEN-PAY-2025-11-001",
      "amount": 4000000.00,
      "currency": "IDR",
      "dp_percentage": 48.48,
      "total_order_amount": 8250000.00,
      "remaining_amount": 4250000.00,
      "payment_method": "bank_transfer",
      "bank_name": "Bank Mandiri",
      "account_number": "1370012345678",
      "transaction_reference": "TRX202511050001234567",
      "proof_of_payment_url": "https://storage.example.com/receipts/vendor-pay-001.pdf",
      "payment_status": "verified",
      "verified_at": "2025-11-05T14:30:00Z",
      "verified_by": "finance-uuid-1",
      "verification_notes": "Payment verified, receipt matches bank statement",
      "scheduled_payment_date": "2025-11-05",
      "actual_payment_date": "2025-11-05",
      "notes": "DP 50% dari customer payment sebesar IDR 8,250,000",
      "internal_notes": "Customer paid DP 50% = IDR 8.25M, we paid vendor 48.48% = IDR 4M",
      "created_at": "2025-11-04T10:00:00Z",
      "created_by": "admin-uuid-1"
    }
  ]
}
```

---

## MIGRATION SCRIPT

### Laravel Migration Example

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            $table->string('company_name');
            $table->string('legal_entity_name')->nullable();
            $table->string('brand_name')->nullable();
            $table->string('slug')->unique();
            
            $table->string('email');
            $table->string('phone', 50);
            $table->string('mobile_phone', 50)->nullable();
            $table->string('fax', 50)->nullable();
            $table->string('website', 500)->nullable();
            
            $table->text('address');
            $table->string('city', 100)->nullable();
            $table->string('province', 100)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('country', 100)->default('Indonesia');
            
            $table->string('npwp', 50)->nullable();
            $table->string('siup_number', 100)->nullable();
            $table->string('business_type', 100)->nullable();
            $table->string('tax_document_url', 500)->nullable();
            $table->string('business_license_url', 500)->nullable();
            
            $table->enum('quality_tier', ['standard', 'premium'])->default('standard');
            $table->enum('status', ['active', 'inactive', 'on_hold', 'blacklisted'])->default('active');
            
            $table->integer('average_lead_time_days')->default(7);
            $table->integer('production_capacity_monthly')->nullable();
            $table->decimal('minimum_order_value', 15, 2)->nullable();
            $table->boolean('accepts_rush_orders')->default(false);
            $table->decimal('rush_order_surcharge_percent', 5, 2)->nullable();
            
            $table->string('bank_name')->nullable();
            $table->string('bank_account_number', 100)->nullable();
            $table->string('bank_account_holder')->nullable();
            $table->string('bank_branch')->nullable();
            $table->string('swift_code', 20)->nullable();
            
            $table->text('notes')->nullable();
            $table->text('internal_notes')->nullable();
            
            $table->integer('total_orders')->default(0);
            $table->integer('completed_orders')->default(0);
            $table->integer('cancelled_orders')->default(0);
            $table->decimal('total_transaction_value', 15, 2)->default(0);
            
            $table->decimal('overall_rating', 3, 2)->default(0);
            $table->decimal('quality_rating', 3, 2)->default(0);
            $table->decimal('timeliness_rating', 3, 2)->default(0);
            $table->decimal('communication_rating', 3, 2)->default(0);
            $table->decimal('pricing_rating', 3, 2)->default(0);
            $table->integer('total_ratings_count')->default(0);
            
            $table->boolean('is_verified')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->uuid('verified_by')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            
            $table->index('slug');
            $table->index('status');
            $table->index('quality_tier');
            $table->index(['overall_rating' => 'desc']);
            $table->index('email');
            $table->index('phone');
            $table->index('city');
            $table->index('deleted_at');
        });

        Schema::create('vendor_specializations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('vendor_id');
            
            $table->string('material_type', 100);
            $table->enum('quality_tier', ['standard', 'premium'])->default('standard');
            
            $table->integer('production_capacity_per_month')->nullable();
            $table->integer('min_order_quantity')->default(1);
            $table->decimal('price_per_unit_min', 15, 2)->nullable();
            $table->decimal('price_per_unit_max', 15, 2)->nullable();
            $table->string('currency', 3)->default('IDR');
            
            $table->integer('lead_time_days_min')->default(7);
            $table->integer('lead_time_days_max')->default(14);
            
            $table->text('notes')->nullable();
            $table->json('certifications')->nullable();
            $table->json('sample_images')->nullable();
            
            $table->boolean('is_active')->default(true);
            
            $table->integer('total_orders_for_material')->default(0);
            $table->decimal('success_rate_percent', 5, 2)->default(100);
            $table->decimal('average_quality_rating', 3, 2)->default(0);
            
            $table->timestamps();
            
            $table->foreign('vendor_id')->references('id')->on('vendors')->onDelete('cascade');
            $table->unique(['vendor_id', 'material_type']);
            
            $table->index('vendor_id');
            $table->index('material_type');
            $table->index('is_active');
            $table->index('quality_tier');
            $table->index(['average_quality_rating' => 'desc']);
        });

        Schema::create('vendor_contacts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('vendor_id');
            
            $table->string('full_name');
            $table->string('position', 100)->nullable();
            $table->string('department', 100)->nullable();
            
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('mobile_phone', 50)->nullable();
            $table->string('whatsapp', 50)->nullable();
            $table->string('telegram', 50)->nullable();
            
            $table->boolean('is_primary')->default(false);
            $table->enum('preferred_contact_method', ['email', 'phone', 'whatsapp', 'telegram'])->default('email');
            $table->string('available_hours', 100)->nullable();
            $table->string('timezone', 50)->default('Asia/Jakarta');
            
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('vendor_id')->references('id')->on('vendors')->onDelete('cascade');
            
            $table->index('vendor_id');
            $table->index('is_primary');
            $table->index('is_active');
        });

        Schema::create('vendor_ratings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('vendor_id');
            $table->uuid('order_id');
            
            $table->decimal('quality_score', 2, 1);
            $table->decimal('timeliness_score', 2, 1);
            $table->decimal('communication_score', 2, 1);
            $table->decimal('pricing_score', 2, 1);
            
            $table->decimal('overall_rating', 3, 2)->storedAs(
                '(quality_score * 0.35 + timeliness_score * 0.30 + communication_score * 0.20 + pricing_score * 0.15)'
            );
            
            $table->string('review_title')->nullable();
            $table->text('review_text')->nullable();
            $table->text('pros')->nullable();
            $table->text('cons')->nullable();
            
            $table->string('material_type', 100)->nullable();
            $table->decimal('order_value', 15, 2)->nullable();
            $table->integer('delivery_days_actual')->nullable();
            $table->integer('delivery_days_promised')->nullable();
            
            $table->json('review_images')->nullable();
            $table->boolean('is_public')->default(false);
            
            $table->text('admin_response')->nullable();
            $table->timestamp('admin_response_at')->nullable();
            
            $table->timestamps();
            $table->uuid('rated_by');
            
            $table->foreign('vendor_id')->references('id')->on('vendors')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('purchase_orders')->onDelete('cascade');
            $table->unique('order_id');
            
            $table->index('vendor_id');
            $table->index(['overall_rating' => 'desc']);
            $table->index(['created_at' => 'desc']);
        });

        Schema::create('vendor_negotiations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('vendor_id');
            $table->uuid('order_id');
            
            $table->integer('negotiation_round')->default(1);
            $table->enum('negotiation_status', ['pending', 'in_progress', 'accepted', 'rejected', 'cancelled'])->default('pending');
            
            $table->decimal('initial_quote_amount', 15, 2)->nullable();
            $table->decimal('counter_offer_amount', 15, 2)->nullable();
            $table->decimal('final_agreed_amount', 15, 2)->nullable();
            $table->string('currency', 3)->default('IDR');
            
            $table->integer('estimated_production_days')->nullable();
            $table->boolean('rush_order_requested')->default(false);
            $table->decimal('rush_surcharge_percent', 5, 2)->nullable();
            
            $table->string('material_type', 100)->nullable();
            $table->enum('quality_tier', ['standard', 'premium'])->nullable();
            $table->integer('quantity')->nullable();
            $table->string('unit', 50)->default('pcs');
            $table->json('specifications')->nullable();
            
            $table->text('vendor_response')->nullable();
            $table->text('admin_notes')->nullable();
            $table->text('rejection_reason')->nullable();
            
            $table->string('quotation_document_url', 500)->nullable();
            $table->json('attachments')->nullable();
            
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('vendor_responded_at')->nullable();
            $table->timestamp('deal_closed_at')->nullable();
            
            $table->boolean('email_sent')->default(false);
            $table->timestamp('email_sent_at')->nullable();
            $table->boolean('email_opened')->default(false);
            $table->timestamp('email_opened_at')->nullable();
            
            $table->timestamps();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            
            $table->foreign('vendor_id')->references('id')->on('vendors')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('purchase_orders')->onDelete('cascade');
            
            $table->index('vendor_id');
            $table->index('order_id');
            $table->index('negotiation_status');
            $table->index(['created_at' => 'desc']);
        });

        Schema::create('vendor_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('vendor_id');
            $table->uuid('order_id');
            $table->uuid('invoice_id')->nullable();
            
            $table->enum('payment_type', ['dp', 'full', 'partial', 'refund']);
            $table->string('payment_number', 100)->unique();
            
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('IDR');
            
            $table->decimal('dp_percentage', 5, 2)->nullable();
            $table->decimal('total_order_amount', 15, 2)->nullable();
            $table->decimal('remaining_amount', 15, 2)->nullable();
            
            $table->enum('payment_method', ['bank_transfer', 'cash', 'check', 'payment_gateway', 'other']);
            $table->string('bank_name')->nullable();
            $table->string('account_number', 100)->nullable();
            $table->string('transaction_reference')->nullable();
            
            $table->string('proof_of_payment_url', 500)->nullable();
            $table->json('attachments')->nullable();
            
            $table->enum('payment_status', ['pending', 'processing', 'verified', 'failed', 'cancelled'])->default('pending');
            $table->timestamp('verified_at')->nullable();
            $table->uuid('verified_by')->nullable();
            $table->text('verification_notes')->nullable();
            
            $table->date('scheduled_payment_date')->nullable();
            $table->date('actual_payment_date')->nullable();
            
            $table->text('notes')->nullable();
            $table->text('internal_notes')->nullable();
            
            $table->timestamps();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            
            $table->foreign('vendor_id')->references('id')->on('vendors')->onDelete('restrict');
            $table->foreign('order_id')->references('id')->on('purchase_orders')->onDelete('restrict');
            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('set null');
            
            $table->index('vendor_id');
            $table->index('order_id');
            $table->index('payment_status');
            $table->index(['created_at' => 'desc']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_payments');
        Schema::dropIfExists('vendor_negotiations');
        Schema::dropIfExists('vendor_ratings');
        Schema::dropIfExists('vendor_contacts');
        Schema::dropIfExists('vendor_specializations');
        Schema::dropIfExists('vendors');
    }
};
```

---

## PERFORMANCE INDEXES

### Composite Indexes untuk Query Optimization

```sql
-- Vendor search dengan multiple filters
CREATE INDEX idx_vendors_search_filter ON vendors(status, quality_tier, city, overall_rating DESC)
WHERE deleted_at IS NULL;

-- Active vendor specializations lookup
CREATE INDEX idx_vendor_spec_active_lookup ON vendor_specializations(vendor_id, material_type, is_active)
WHERE is_active = true;

-- Negotiation tracking untuk order
CREATE INDEX idx_negotiations_order_status ON vendor_negotiations(order_id, negotiation_status, negotiation_round);

-- Payment tracking untuk vendor
CREATE INDEX idx_vendor_payments_tracking ON vendor_payments(vendor_id, order_id, payment_status, payment_type);

-- Rating calculation optimization
CREATE INDEX idx_ratings_aggregation ON vendor_ratings(vendor_id, overall_rating, created_at DESC)
WHERE is_public = true;
```

### Full-Text Search Index

```sql
-- Advanced vendor search
CREATE INDEX idx_vendors_fulltext ON vendors
USING GIN (
    to_tsvector('indonesian', 
        company_name || ' ' || 
        COALESCE(legal_entity_name, '') || ' ' ||
        COALESCE(brand_name, '') || ' ' ||
        COALESCE(notes, '') || ' ' ||
        COALESCE(city, '') || ' ' ||
        COALESCE(province, '')
    )
);
```

---

## INTEGRATION NOTES

### Integration dengan Purchase Order Module

```yaml
Trigger Points:
  1. Order Created (status = 'new'):
     Action: Admin dapat mulai vendor sourcing
     Query: GET /api/v1/admin/vendors/search?material_type={order.material}
     
  2. Vendor Selected:
     Action: Create negotiation record
     API: POST /api/v1/admin/vendors/{vendor_id}/negotiations
     Side Effect: Auto-send email ke vendor contact
     
  3. Negotiation Accepted:
     Action: Update order.assigned_vendor_id, order.status = 'vendor_confirmed'
     Side Effect: Create invoice record untuk vendor payment
     
  4. Order Completed:
     Action: Auto-create vendor rating record
     API: POST /api/v1/admin/vendors/{vendor_id}/ratings
     Side Effect: Update vendor overall_rating dan statistics
```

### Integration dengan Payment Module

```yaml
Payment Flow:
  Customer Payment → Vendor Payment Trigger:
    1. Customer DP Received:
       - Trigger: customer_payments.payment_status = 'verified'
       - Action: Admin schedule vendor DP payment
       - Constraint: vendor_dp_amount < (customer_dp * 0.50)
       
    2. Customer Full Payment:
       - Trigger: customer_payments.payment_status = 'verified' AND payment_type = 'full'
       - Action: Admin schedule vendor full payment
       
    3. Vendor Payment Verified:
       - Update: vendors.total_transaction_value += payment.amount
       - Update: orders.vendor_payment_status = 'paid'
```

### Integration dengan Financial/Accounting Module

```yaml
Accounting Integration:
  Chart of Accounts:
    - Debit: Cost of Goods Sold (COGS)
    - Credit: Accounts Payable - Vendors
    
  Journal Entries:
    On Vendor Payment Verified:
      DR: Accounts Payable - Vendors   {amount}
      CR: Cash/Bank                    {amount}
      
  Reports:
    - Vendor Transaction Summary (by period)
    - Vendor Outstanding Payments
    - Vendor Performance ROI (customer_price - vendor_price)
    - Payment Aging Report
```

### Integration dengan Email/Notification System

```yaml
Email Templates Required:
  1. vendor_quotation_request.blade.php
     Trigger: negotiation created
     Recipients: vendor primary contact
     Attachments: Order specifications PDF
     
  2. vendor_quotation_accepted.blade.php
     Trigger: negotiation accepted
     Recipients: vendor primary contact
     Attachments: Purchase order PDF
     
  3. vendor_payment_notification.blade.php
     Trigger: payment scheduled
     Recipients: vendor accounting contact
     Attachments: Remittance advice
     
  4. vendor_rating_notification.blade.php (Optional)
     Trigger: rating created
     Recipients: vendor management contact
```

### Database Triggers untuk Auto-Calculations

```sql
-- Update vendor statistics on order completion
CREATE OR REPLACE FUNCTION update_vendor_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE vendors
    SET total_orders = total_orders + 1,
        completed_orders = CASE 
            WHEN NEW.status = 'completed' THEN completed_orders + 1 
            ELSE completed_orders 
        END,
        cancelled_orders = CASE 
            WHEN NEW.status = 'cancelled' THEN cancelled_orders + 1 
            ELSE cancelled_orders 
        END
    WHERE id = NEW.assigned_vendor_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vendor_stats
AFTER INSERT OR UPDATE ON purchase_orders
FOR EACH ROW
WHEN (NEW.assigned_vendor_id IS NOT NULL)
EXECUTE FUNCTION update_vendor_stats();

-- Update vendor ratings on new rating
CREATE OR REPLACE FUNCTION update_vendor_ratings()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE vendors v
    SET overall_rating = (
            SELECT AVG(overall_rating) 
            FROM vendor_ratings 
            WHERE vendor_id = NEW.vendor_id
        ),
        quality_rating = (
            SELECT AVG(quality_score) 
            FROM vendor_ratings 
            WHERE vendor_id = NEW.vendor_id
        ),
        timeliness_rating = (
            SELECT AVG(timeliness_score) 
            FROM vendor_ratings 
            WHERE vendor_id = NEW.vendor_id
        ),
        communication_rating = (
            SELECT AVG(communication_score) 
            FROM vendor_ratings 
            WHERE vendor_id = NEW.vendor_id
        ),
        pricing_rating = (
            SELECT AVG(pricing_score) 
            FROM vendor_ratings 
            WHERE vendor_id = NEW.vendor_id
        ),
        total_ratings_count = (
            SELECT COUNT(*) 
            FROM vendor_ratings 
            WHERE vendor_id = NEW.vendor_id
        )
    WHERE v.id = NEW.vendor_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vendor_ratings
AFTER INSERT OR UPDATE OR DELETE ON vendor_ratings
FOR EACH ROW
EXECUTE FUNCTION update_vendor_ratings();
```

---

## NOTES FOR DEVELOPERS

### Security Considerations

1. **Data Isolation**:
   - All vendor data MUST be scoped to tenant schema
   - No cross-tenant vendor access allowed
   - Vendor emails should be validated against spam/disposable domains

2. **Payment Security**:
   - Bank account details encrypted at rest
   - Payment proof URLs expire after 90 days
   - All payment operations audit logged

3. **API Rate Limiting**:
   - Vendor search: 100 requests/minute
   - Negotiation creation: 10 requests/minute
   - Payment verification: 20 requests/minute

### Testing Checklist

- [ ] Vendor CRUD operations
- [ ] Vendor verification workflow
- [ ] Specialization management
- [ ] Contact person management
- [ ] Negotiation multi-round flow
- [ ] Rating calculation accuracy
- [ ] Payment DP constraint validation
- [ ] Email automation triggers
- [ ] Statistics auto-calculation
- [ ] Performance with 10,000+ vendors
- [ ] Concurrent negotiation handling

---

**© 2025 Stencil CMS - Vendor Management Module Documentation**  
**Version:** 1.0  
**Last Updated:** November 10, 2025  
**Status:** ✅ Complete - Ready for Development
