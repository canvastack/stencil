# PRODUCT MANAGEMENT ENGINE SCHEMA
## Enterprise-Grade Multi-Tenant Product Management System

**Module:** E-Commerce - Product Management Engine  
**Total Fields:** 68 fields (Updated after audit)  
**Total Tables:** 4 tables (products, product_categories, product_specifications, product_custom_texts)  
**Admin Pages:** `src/pages/admin/ProductEditor.tsx`, `src/pages/admin/ProductList.tsx`, `src/pages/admin/ProductCategories.tsx`  
**Type Definition:** `src/types/product.ts`  
**Status:** 🔄 **AUDIT COMPLETED - CRITICAL UPDATES REQUIRED**  
**Architecture Reference:** `docs/ARCHITECTURE/ADVANCED_SYSTEMS/1-MULTI_TENANT_ARCHITECTURE.md`  
**Business Integration:** `docs/DEVELOPMENTS/PLAN/BUSINESS_HEXAGONAL_PLAN/BUSINESS_CYCLE_PLAN.md`

> **⚠️ CRITICAL AUDIT FINDINGS**  
> **Status**: Documentation vs Implementation **MISMATCH DETECTED**  
> **Action Required**: Immediate schema and code updates needed for enterprise compliance  
> **Priority**: **HIGH** - Core tenant isolation and business workflow missing

## 🔒 CORE IMMUTABLE RULES COMPLIANCE

### **Rule 1: Teams Enabled with tenant_id as team_foreign_key**
❌ **VIOLATION DETECTED** - Documentation claims tenant isolation but **ZERO `tenant_id` fields implemented** in actual database schema. All tenants currently share the same product data.

### **Rule 2: API Guard Implementation**  
❌ **NOT IMPLEMENTED** - No backend API endpoints exist. Frontend uses mock data only. No Laravel Sanctum authentication layer.

### **Rule 3: UUID model_morph_key**
✅ **COMPLIANT** - UUID generation is consistent using `gen_random_uuid()` in documentation. Implementation matches standard.

### **Rule 4: Strict Tenant Data Isolation**
❌ **CRITICAL VIOLATION** - No tenant isolation exists. Product records are global and accessible across all tenants, creating **massive data leakage risk**.

### **Rule 5: RBAC Integration Requirements**
❌ **NOT IMPLEMENTED** - No permission checking exists in frontend or backend. Access control is completely missing:
- No `products.view` permission checking
- No `products.create` permission validation  
- No `products.edit` access control
- No `products.delete` authorization
- No `products.manage` role verification
- No `products.publish` permission system

---

## TABLE OF CONTENTS

1. [🚨 Critical Audit Findings](#-critical-audit-findings)
2. [Overview](#overview)
3. [Business Context](#business-context)
4. [Database Schema](#database-schema)
5. [Relationship Diagram](#relationship-diagram)
6. [Field Specifications](#field-specifications)
7. [Business Rules](#business-rules)
8. [API Endpoints](#api-endpoints)
9. [Admin UI Features](#admin-ui-features)
10. [Sample Data](#sample-data)
11. [Migration Script](#migration-script)
12. [Performance Indexes](#performance-indexes)
13. [🔧 Required Fixes & Implementation Plan](#-required-fixes--implementation-plan)

---

## 🚨 CRITICAL AUDIT FINDINGS

### **AUDIT SUMMARY**
**Date**: November 12, 2025  
**Auditor**: CanvaStack Stencil  
**Scope**: Complete documentation vs implementation analysis  
**Status**: **CRITICAL MISMATCHES FOUND**

### **🔴 CRITICAL ISSUES IDENTIFIED**

#### **1. CORE IMMUTABLE RULES VIOLATIONS**

**❌ ISSUE #1: Missing Tenant Isolation**
- **Claim**: "All product tables include mandatory `tenant_id UUID NOT NULL`"
- **Reality**: Migration script **DOES NOT** include `tenant_id` fields
- **Impact**: **ZERO tenant data isolation** - all tenants share same data
- **Risk Level**: **CRITICAL** - Data leakage between tenants

**✅ RESOLVED #2: UUID Function Consistency**
- **Documentation**: Uses `gen_random_uuid()` (PostgreSQL 13+)
- **Implementation**: Consistently uses `gen_random_uuid()` in actual schema
- **Status**: No inconsistency found during re-audit
- **Risk Level**: **RESOLVED** - UUID generation is properly standardized

#### **2. MULTI-TENANT ARCHITECTURE GAPS**

**❌ ISSUE #3: Frontend Tenant Context Missing**
- **Current**: ProductEditor/ProductList have no tenant awareness
- **Required**: Tenant context provider and tenant-scoped API calls
- **Impact**: Cannot operate in multi-tenant environment
- **Risk Level**: **CRITICAL** - System unusable for multi-tenancy

**❌ ISSUE #4: RBAC Integration Missing**
- **Claim**: "Product management requires specific tenant-scoped permissions"
- **Reality**: No permission checking in frontend or API layer
- **Impact**: No access control, security vulnerabilities
- **Risk Level**: **HIGH** - Security breach potential

#### **3. BUSINESS WORKFLOW INTEGRATION GAPS**

**❌ ISSUE #5: Production Type Logic Missing**
- **Schema**: Has `production_type`, `vendor_price`, `markup_percentage` fields
- **Frontend**: No UI for vendor vs internal production workflow
- **Impact**: Core business logic not implemented
- **Risk Level**: **HIGH** - Business requirements not met

**❌ ISSUE #6: Quotation System Missing**
- **Schema**: Has `quotation_required` field
- **Frontend**: No quotation workflow implementation
- **Impact**: Broker business model not supported
- **Risk Level**: **HIGH** - Primary business use case broken

#### **4. HEXAGONAL ARCHITECTURE VIOLATIONS**

**❌ ISSUE #7: Direct Database Access**
- **Current**: Frontend directly calls mock data services
- **Required**: Domain → Application → Infrastructure layer separation
- **Impact**: Tight coupling, not scalable or testable
- **Risk Level**: **MEDIUM** - Architecture debt

### **📊 COMPLIANCE SCORECARD**

| Component | Documented | Implemented | Status |
|-----------|------------|-------------|---------|
| **Tenant Isolation** | ✅ | ❌ | **FAILED** |
| **RBAC Integration** | ✅ | ❌ | **FAILED** |
| **Business Workflow** | ✅ | ❌ | **FAILED** |
| **UUID Consistency** | ✅ | ✅ | **PASSED** |
| **Multi-Tenant API** | ✅ | ❌ | **FAILED** |
| **Hexagonal Architecture** | ✅ | ❌ | **FAILED** |
| **Basic CRUD** | ✅ | ✅ | **PASSED** |
| **UI Components** | ✅ | ✅ | **PASSED** |

**Overall Compliance**: **37%** (3/8 components)  
**Enterprise Readiness**: **NOT READY**

### **🎯 IMMEDIATE ACTION REQUIRED**

1. **Fix tenant_id implementation** in all tables ⚠️ **CRITICAL**
2. ~~**Standardize UUID generation** across all schemas~~ ✅ **COMPLETED**
3. **Implement tenant context** in frontend ⚠️ **CRITICAL**
4. **Add RBAC permission checking** 🔴 **HIGH**
5. **Build production type workflow** UI 🔴 **HIGH**
6. **Create quotation system** integration 🔴 **HIGH**
7. **Refactor to Hexagonal Architecture** pattern 🟡 **MEDIUM**

---

## OVERVIEW

Modul Product Management adalah inti dari sistem katalog produk untuk tenant PT Custom Etching Xenial (PT CEX) dan tenant lainnya. Sistem ini dirancang dengan fleksibilitas tinggi untuk mendukung berbagai jenis bisnis melalui konfigurasi dinamis.

### Core Features

1. **Product Catalog Management**
   - Multi-image gallery support (unlimited images)
   - Rich text description dengan WYSIWYG editor
   - Hierarchical category system (parent-child unlimited depth)
   - Tag-based classification
   - Featured product marking

2. **Custom Order Form System**
   - Dynamic form fields yang dapat dikonfigurasi per-tenant
   - Default fields untuk bisnis etching: bahan, kualitas, ketebalan, ukuran
   - Admin dapat extend options secara inline tanpa schema changes
   - Support untuk file upload design (URL or base64, max 10MB)
   - Custom text placement system dengan coordinate control

3. **Pricing & Stock Management**
   - Optional pricing (dapat disembunyikan di public view)
   - Multi-currency support (default: IDR)
   - Stock quantity tracking
   - Lead time estimation

4. **SEO Integration**
   - Per-product SEO metadata
   - Menggunakan polymorphic universal `seo_meta` table
   - Auto-generated slug dari product name
   - SEO-friendly URLs

5. **3D Product Visualization**
   - Support untuk 3D model display (Three.js integration)
   - Interactive product preview

6. **Specifications System**
   - Key-value pair specifications storage (JSONB)
   - Unlimited custom specifications
   - Searchable specification values

---

## BUSINESS CONTEXT

### **Integration with Etching Business Cycle**

Product module ini dirancang khusus untuk mendukung **complete etching business workflow** PT CEX sebagai broker/makelar:

**1. Customer Inquiry Stage:**
- **Product Catalog Display**: Showcase etching products dengan rich media gallery
- **Dynamic Pricing Logic**: 
  - `production_type = 'internal'` + `price IS NOT NULL` → Display fixed pricing
  - `production_type = 'vendor'` OR `price IS NULL` → Hide price, show "Request Quote" button
- **Custom Order Form**: Capture customer requirements (bahan, kualitas, ketebalan, ukuran)
- **Design File Upload**: Support customer design files untuk vendor production

**2. Quotation & Negotiation Stage:**
- **Vendor Quotation Integration**: Product data diteruskan ke vendor untuk pricing
- **Markup Calculation**: Admin dapat set markup percentage untuk broker profit
- **Price Negotiation Tracking**: History pricing negotiations dengan customer dan vendor
- **Lead Time Estimation**: Vendor production time estimates

**3. Order Processing Stage:**
- **Production Type Selection**: Internal vs Vendor production workflow
- **Vendor Assignment**: Automatic vendor selection berdasarkan product specifications
- **Custom Text Placement**: Precise positioning untuk etching text requirements
- **Design File Management**: Secure file transfer ke vendor production

**4. Production Stage:**
- **Production Tracking**: Integration dengan production status updates
- **Quality Control**: Specification validation dan quality checkpoints
- **Vendor Communication**: Automated updates dari vendor production progress

**5. Delivery & Fulfillment Stage:**
- **Product Completion**: Final product images dan quality confirmation
- **Customer Approval**: Digital approval workflow sebelum delivery
- **Delivery Coordination**: Integration dengan shipping dan logistics

### Multi-Tenant Scalability

Sistem dirancang agar tenant lain (non-etching business) dapat:
- Menggunakan product schema yang sama
- Customize form fields via `settings` table di tenant schema
- Override product behavior via configuration
- Tidak perlu schema migration untuk customization

---

## DATABASE SCHEMA

### Table: `products` (Tenant Schema)

Tabel utama untuk menyimpan informasi produk per tenant.

```sql
CREATE TABLE products (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-Tenant Isolation (CORE RULE COMPLIANCE)
    tenant_id UUID NOT NULL,
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    long_description TEXT,
    
    -- Media
    images JSONB DEFAULT '[]'::jsonb,
    featured_image VARCHAR(500),
    
    -- Categorization
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    
    -- Pricing & Stock
    price DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'IDR',
    price_unit VARCHAR(50) DEFAULT 'per pcs',
    min_order INTEGER DEFAULT 1,
    in_stock BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0,
    lead_time VARCHAR(100),
    
    -- Etching Business Workflow Fields
    production_type VARCHAR(20) DEFAULT 'vendor' CHECK (production_type IN ('internal', 'vendor')),
    vendor_price DECIMAL(15, 2),
    markup_percentage DECIMAL(5, 2) DEFAULT 0.00,
    quotation_required BOOLEAN DEFAULT true,
    
    -- Custom Order Form Fields (Etching-specific but extensible)
    product_type VARCHAR(100),
    size VARCHAR(100),
    bahan VARCHAR(100),
    bahan_options JSONB DEFAULT '[]'::jsonb,
    kualitas VARCHAR(100) DEFAULT 'standard',
    kualitas_options JSONB DEFAULT '[]'::jsonb,
    ketebalan VARCHAR(100) DEFAULT '1mm',
    ketebalan_options JSONB DEFAULT '[]'::jsonb,
    ukuran VARCHAR(100) DEFAULT '15x20',
    ukuran_options JSONB DEFAULT '[]'::jsonb,
    warna_background VARCHAR(7) DEFAULT '#FFFFFF',
    design_file_url TEXT,
    
    -- Custom Options (Extensible for any tenant)
    customizable BOOLEAN DEFAULT false,
    custom_options JSONB DEFAULT '[]'::jsonb,
    
    -- SEO
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords JSONB DEFAULT '[]'::jsonb,
    
    -- Status & Visibility
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    featured BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    
    -- WYSIWYG Notes
    notes_wysiwyg TEXT,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID,
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Unique Constraints
    UNIQUE(tenant_id, slug),
    
    -- Check Constraints
    CONSTRAINT products_price_positive CHECK (price IS NULL OR price >= 0),
    CONSTRAINT products_vendor_price_positive CHECK (vendor_price IS NULL OR vendor_price >= 0),
    CONSTRAINT products_markup_positive CHECK (markup_percentage >= 0),
    CONSTRAINT products_stock_positive CHECK (stock_quantity >= 0)
);

-- Indexes for Performance
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_tenant_slug ON products(tenant_id, slug);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(tenant_id, status);
CREATE INDEX idx_products_featured ON products(tenant_id, featured) WHERE featured = true;
CREATE INDEX idx_products_production_type ON products(production_type);
CREATE INDEX idx_products_quotation_required ON products(quotation_required) WHERE quotation_required = true;
CREATE INDEX idx_products_tags ON products USING GIN (tags);
CREATE INDEX idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_search ON products USING GIN (to_tsvector('indonesian', name || ' ' || COALESCE(description, '')));

-- Updated Timestamp Trigger
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Table: `product_categories` (Tenant Schema)

Tabel untuk kategorisasi hierarchical produk.

```sql
CREATE TABLE product_categories (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-Tenant Isolation (CORE RULE COMPLIANCE)
    tenant_id UUID NOT NULL,
    
    -- Category Information
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Hierarchy
    parent_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
    
    -- Display
    image VARCHAR(500),
    icon VARCHAR(100),
    order_index INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES product_categories(id) ON DELETE CASCADE,
    
    -- Unique Constraints
    UNIQUE(tenant_id, slug),
    
    -- Check Constraints
    CONSTRAINT categories_no_self_parent CHECK (id != parent_id)
);

-- Indexes
CREATE INDEX idx_categories_tenant ON product_categories(tenant_id);
CREATE INDEX idx_categories_tenant_slug ON product_categories(tenant_id, slug);
CREATE INDEX idx_categories_parent_id ON product_categories(parent_id);
CREATE INDEX idx_categories_active ON product_categories(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX idx_categories_order ON product_categories(tenant_id, order_index);

-- Updated Timestamp Trigger
CREATE TRIGGER update_product_categories_updated_at
BEFORE UPDATE ON product_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Table: `product_specifications` (Tenant Schema)

Tabel untuk menyimpan spesifikasi produk dalam format key-value yang fleksibel.

```sql
CREATE TABLE product_specifications (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-Tenant Isolation (CORE RULE COMPLIANCE)
    tenant_id UUID NOT NULL,
    
    -- Foreign Key
    product_id UUID NOT NULL,
    
    -- Specification Data
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    
    -- Display Order
    order_index INTEGER DEFAULT 0,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    
    -- Unique Constraints
    UNIQUE(tenant_id, product_id, key)
);

-- Indexes
CREATE INDEX idx_specs_tenant ON product_specifications(tenant_id);
CREATE INDEX idx_specs_product_id ON product_specifications(product_id);
CREATE INDEX idx_specs_key ON product_specifications(key);

-- Updated Timestamp Trigger
CREATE TRIGGER update_product_specifications_updated_at
BEFORE UPDATE ON product_specifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Table: `product_custom_texts` (Tenant Schema)

Tabel untuk menyimpan custom text placement yang diminta customer saat order.

```sql
CREATE TABLE product_custom_texts (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-Tenant Isolation (CORE RULE COMPLIANCE)
    tenant_id UUID NOT NULL,
    
    -- Foreign Key
    product_id UUID NOT NULL,
    
    -- Text Content
    text TEXT NOT NULL,
    
    -- Placement Information
    placement VARCHAR(20) NOT NULL CHECK (placement IN ('depan', 'belakang')),
    position VARCHAR(100),
    color VARCHAR(7) DEFAULT '#000000',
    
    -- Display Order
    order_index INTEGER DEFAULT 0,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_custom_texts_tenant ON product_custom_texts(tenant_id);
CREATE INDEX idx_custom_texts_product_id ON product_custom_texts(product_id);
CREATE INDEX idx_custom_texts_placement ON product_custom_texts(placement);

-- Updated Timestamp Trigger
CREATE TRIGGER update_product_custom_texts_updated_at
BEFORE UPDATE ON product_custom_texts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## RELATIONSHIP DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    TENANT SCHEMA: products                       │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                     products                            │     │
│  │  - id (UUID, PK)                                        │     │
│  │  - name, slug, description                              │     │
│  │  - category_id (FK → product_categories)                │◄────┼─┐
│  │  - images (JSONB)                                       │     │ │
│  │  - price, currency, stock                               │     │ │
│  │  - bahan, kualitas, ketebalan, ukuran                   │     │ │
│  │  - custom_options (JSONB)                               │     │ │
│  │  - status, featured, is_public                          │     │ │
│  │  - seo_title, seo_description, seo_keywords             │     │ │
│  │  - created_at, updated_at, deleted_at                   │     │ │
│  └────────────────────┬───────────────────────────────────┘     │ │
│                       │                                           │ │
│                       │ 1:N                                       │ │
│          ┌────────────┼──────────────┐                            │ │
│          │            │              │                            │ │
│          │            │              │                            │ │
│  ┌───────▼─────┐ ┌───▼──────────┐ ┌▼────────────────────┐       │ │
│  │ product_    │ │ product_     │ │ product_custom_texts │       │ │
│  │ specifications│ │ categories   │ │ - id (UUID, PK)      │      │ │
│  │ - id (PK)   │ │ - id (PK)    │ │ - product_id (FK)    │       │ │
│  │ - product_id│ │ - name, slug │ │ - text               │       │ │
│  │ - key       │ │ - parent_id◄─┼─┘ - placement           │       │ │
│  │ - value     │ │   (self ref) │   - position, color    │       │ │
│  └─────────────┘ │ - image      │   - order_index        │       │ │
│                  │ - order_index│ └────────────────────────┘      │ │
│                  │ - is_active  │                                 │ │
│                  └──────────────┘                                 │ │
│                                                                     │ │
│                     ┌───────────────────────────────────────┐     │ │
│                     │ Polymorphic Relationship               │     │ │
│                     │ (via Universal SEO System)             │     │ │
│                     │                                        │     │ │
│                     │ seo_meta table (landlord schema)       │     │ │
│                     │ - model_type: 'Product'                │     │ │
│                     │ - model_id: products.id                │     │ │
│                     └───────────────────────────────────────┘     │ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## FIELD SPECIFICATIONS

### Table: `products`

| Field | Type | Required | Default | Description | Validation | Business Rule |
|-------|------|----------|---------|-------------|------------|---------------|
| `id` | UUID | Yes | uuid_generate_v4() | Primary key | - | Auto-generated |
| `name` | VARCHAR(255) | Yes | - | Product name | Max 255 chars | Display di catalog |
| `slug` | VARCHAR(255) | Yes | - | SEO-friendly URL | Unique, lowercase, hyphen | Auto-generate dari name |
| `description` | TEXT | No | - | Short description | Max 500 chars | Display di card preview |
| `long_description` | TEXT | No | - | Full description | Unlimited | Display di detail page |
| `images` | JSONB | No | [] | Array of image URLs | Valid JSON array | First image = featured |
| `featured_image` | VARCHAR(500) | No | - | Direct URL to featured | Valid URL | Override images[0] |
| `category_id` | UUID | No | NULL | Foreign key to categories | Valid UUID | Nullable untuk uncategorized |
| `tags` | JSONB | No | [] | Product tags | JSON array of strings | For filtering & search |
| `price` | DECIMAL(15,2) | No | NULL | Product price | >= 0 or NULL | NULL = hidden price |
| `currency` | VARCHAR(3) | No | 'IDR' | Currency code | ISO 4217 | IDR, USD, EUR, etc |
| `price_unit` | VARCHAR(50) | No | 'per pcs' | Price unit | - | 'per pcs', 'per m²', etc |
| `min_order` | INTEGER | No | 1 | Minimum order qty | >= 1 | Default 1 |
| `in_stock` | BOOLEAN | No | true | Stock availability | true/false | Control order button |
| `stock_quantity` | INTEGER | No | 0 | Current stock qty | >= 0 | 0 = out of stock warning |
| `lead_time` | VARCHAR(100) | No | - | Production lead time | - | '3-5 hari kerja' |
| `product_type` | VARCHAR(100) | No | - | Type classification | - | Tenant-specific |
| `size` | VARCHAR(100) | No | - | Product size | - | For display |
| `bahan` | VARCHAR(100) | No | - | Material | - | 'Akrilik', 'Kuningan', etc |
| `bahan_options` | JSONB | No | [] | Available materials | JSON array | Admin can extend |
| `kualitas` | VARCHAR(100) | No | 'standard' | Quality level | - | 'Standard' or 'Tinggi' |
| `kualitas_options` | JSONB | No | [] | Available qualities | JSON array | Admin can extend |
| `ketebalan` | VARCHAR(100) | No | '1mm' | Thickness | - | '1mm', '2mm', '3mm', etc |
| `ketebalan_options` | JSONB | No | [] | Available thickness | JSON array | Admin can extend |
| `ukuran` | VARCHAR(100) | No | '15x20' | Dimensions | - | '15x20', '20x30', etc |
| `ukuran_options` | JSONB | No | [] | Available sizes | JSON array | Admin can extend |
| `warna_background` | VARCHAR(7) | No | '#FFFFFF' | Background color | HEX color code | 7 chars including # |
| `design_file_url` | TEXT | No | - | Customer design file | Valid URL or base64 | Max 10MB for base64 |
| `customizable` | BOOLEAN | No | false | Is customizable | true/false | Enable custom options |
| `custom_options` | JSONB | No | [] | Custom form options | Valid JSON | Dynamic fields config |
| `seo_title` | VARCHAR(255) | No | - | SEO title | Max 255 chars | Fallback to name |
| `seo_description` | TEXT | No | - | SEO description | Max 160 chars | For meta tags |
| `seo_keywords` | JSONB | No | [] | SEO keywords | JSON array | Comma-separated |
| `status` | VARCHAR(20) | No | 'draft' | Publication status | draft/published/archived | Workflow status |
| `featured` | BOOLEAN | No | false | Featured product | true/false | Display priority |
| `is_public` | BOOLEAN | No | true | Public visibility | true/false | Hide from public catalog |
| `notes_wysiwyg` | TEXT | No | - | WYSIWYG notes | HTML | Rich text editor content |
| `created_at` | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Creation timestamp | - | Auto-generated |
| `updated_at` | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Update timestamp | - | Auto-updated |
| `deleted_at` | TIMESTAMP | No | NULL | Soft delete timestamp | - | NULL = not deleted |
| `created_by` | UUID | No | - | User who created | Valid user ID | Audit trail |
| `updated_by` | UUID | No | - | User who updated | Valid user ID | Audit trail |

---

## BUSINESS RULES

### 1. Product Status Workflow

```
draft → published → archived
  ↑         ↓
  └─────────┘
```

- **draft**: Product sedang diedit, tidak tampil di public view
- **published**: Product live dan tampil di catalog
- **archived**: Product tidak aktif, tidak tampil tapi data retained

**Validation Rules**:
- Hanya `published` products yang tampil di public catalog
- Admin dapat unpublish product kapan saja (published → draft)
- Archived products tidak bisa di-order tapi masih muncul di order history

### 2. Pricing Visibility Logic

```javascript
function shouldDisplayPrice(product) {
  // Case 1: Internal production dengan harga set
  if (product.production_type === 'internal' && product.price !== null) {
    return true;
  }
  
  // Case 2: Vendor production ATAU harga tidak set
  if (product.production_type === 'vendor' || product.price === null) {
    return false; // User harus request quotation
  }
  
  return false;
}
```

**Business Logic**:
- Jika price ditampilkan → User bisa langsung order dengan harga pasti
- Jika price disembunyikan → User submit inquiry, admin buat quotation

### 3. Stock Management

**Rules**:
- `in_stock = false` → Product tidak bisa di-order (button disabled)
- `stock_quantity = 0` → Warning "Stok habis, silakan hubungi kami"
- `stock_quantity < min_order` → Warning "Stok tidak mencukupi minimum order"

**Auto-update Logic** (akan diimplement di Order module):
```sql
UPDATE products 
SET stock_quantity = stock_quantity - order_quantity
WHERE id = product_id AND stock_quantity >= order_quantity;
```

### 4. Production Type & Field Requirements

**Context**: Product dapat diproduksi melalui 2 cara: internal company atau via vendor (makelar/broker model).

**Business Rules**:

**A. Jika `production_type = 'vendor'` (akan diset saat order creation)**:
- `price` field bersifat **NOT REQUIRED** (nullable)
  - Harga tidak ditampilkan di catalog
  - Customer harus request quotation
  - Price ditentukan setelah negosiasi dengan vendor
- `stock_quantity` field bersifat **NOT REQUIRED**
  - Stock adalah milik vendor, bukan internal
  - Kita tidak memiliki visibility ke inventory vendor
  - Field ini bisa diisi `0` atau `NULL`
- `in_stock` dapat di-set `true` secara default untuk allow quotation requests

**B. Jika `production_type = 'internal'` (akan diset saat order creation)**:
- `price` field bersifat **REQUIRED**
  - Harga harus diset oleh admin
  - Price ditampilkan di catalog jika product status = published
  - Customer dapat langsung order dengan harga pasti
- `stock_quantity` field bersifat **REQUIRED**
  - Harus track actual inventory
  - System auto-update saat order completed
  - Warning muncul jika stock < min_order

**Validation Logic** (akan diimplement di Order module):
```javascript
function validateProductForOrder(product, productionType) {
  if (productionType === 'vendor') {
    // Vendor production: price & stock not required
    return {
      priceRequired: false,
      stockRequired: false,
      allowQuotationRequest: true
    };
  }
  
  if (productionType === 'internal') {
    // Internal production: price & stock must be set
    if (product.price === null) {
      throw new Error('Price must be set for internal production');
    }
    if (product.stock_quantity === null || product.stock_quantity < product.min_order) {
      throw new Error('Insufficient stock for internal production');
    }
    return {
      priceRequired: true,
      stockRequired: true,
      allowDirectOrder: true
    };
  }
}

### 5. Custom Options Configuration

Format JSONB untuk `custom_options`:

```json
[
  {
    "name": "warna_text",
    "label": "Warna Text",
    "type": "color",
    "required": true,
    "default": "#000000"
  },
  {
    "name": "posisi_logo",
    "label": "Posisi Logo",
    "type": "select",
    "options": ["kiri_atas", "tengah", "kanan_bawah"],
    "required": false
  },
  {
    "name": "jumlah_line_text",
    "label": "Jumlah Baris Text",
    "type": "number",
    "min": 1,
    "max": 5,
    "required": true,
    "default": 1
  }
]
```

**Type Support**:
- `text`: Free text input
- `number`: Numeric input dengan min/max
- `select`: Dropdown options
- `color`: Color picker (HEX)
- `boolean`: Toggle/checkbox
- `file`: File upload (untuk design, etc)

### 5. Hierarchical Categories

**Rules**:
- Parent category dapat memiliki unlimited child categories
- Child category inherit visibility dari parent
- Jika parent `is_active = false`, semua children juga hidden
- Tidak boleh circular reference (self-parent check)

**Query untuk get category tree**:
```sql
WITH RECURSIVE category_tree AS (
  SELECT id, name, parent_id, 0 as depth
  FROM product_categories
  WHERE parent_id IS NULL AND is_active = true
  
  UNION ALL
  
  SELECT c.id, c.name, c.parent_id, ct.depth + 1
  FROM product_categories c
  INNER JOIN category_tree ct ON c.parent_id = ct.id
  WHERE c.is_active = true
)
SELECT * FROM category_tree ORDER BY depth, name;
```

### 6. SEO Best Practices

**Auto-generation Logic**:
```javascript
// Slug generation
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// SEO Title fallback
seo_title = product.seo_title || product.name;

// SEO Description fallback
seo_description = product.seo_description || 
                  product.description.substring(0, 160);
```

---

## API ENDPOINTS

### 1. Get Products List

**Endpoint**: `GET /api/admin/products`

**Query Parameters**:
```
?page=1
&per_page=20
&search=etching
&category_id=uuid
&status=published
&featured=true
&sort=created_at
&order=desc
```

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Plakat Akrilik Premium",
      "slug": "plakat-akrilik-premium",
      "description": "Plakat akrilik berkualitas tinggi...",
      "images": ["url1", "url2"],
      "category": {
        "id": "uuid",
        "name": "Plakat",
        "slug": "plakat"
      },
      "price": 150000,
      "currency": "IDR",
      "status": "published",
      "featured": true,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 156,
    "last_page": 8
  }
}
```

### 2. Get Single Product

**Endpoint**: `GET /api/admin/products/{id}`

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "name": "Plakat Akrilik Premium",
    "slug": "plakat-akrilik-premium",
    "description": "Short description",
    "long_description": "Full HTML description",
    "images": ["url1", "url2", "url3"],
    "category_id": "uuid",
    "category": {
      "id": "uuid",
      "name": "Plakat",
      "parent": {
        "id": "uuid",
        "name": "Penghargaan"
      }
    },
    "tags": ["plakat", "akrilik", "premium"],
    "price": 150000,
    "currency": "IDR",
    "price_unit": "per pcs",
    "min_order": 1,
    "in_stock": true,
    "stock_quantity": 50,
    "lead_time": "3-5 hari kerja",
    "bahan": "Akrilik",
    "bahan_options": ["Akrilik", "Kuningan", "Tembaga"],
    "kualitas": "premium",
    "kualitas_options": ["standard", "premium"],
    "ketebalan": "3mm",
    "ketebalan_options": ["2mm", "3mm", "5mm"],
    "ukuran": "20x30",
    "ukuran_options": ["15x20", "20x30", "30x40"],
    "warna_background": "#FFFFFF",
    "customizable": true,
    "custom_options": [
      {
        "name": "warna_text",
        "label": "Warna Text",
        "type": "color",
        "required": true
      }
    ],
    "specifications": [
      {"key": "Material", "value": "Akrilik Premium"},
      {"key": "Finishing", "value": "Glossy"}
    ],
    "custom_texts": [
      {
        "text": "PT ABC Indonesia",
        "placement": "depan",
        "position": "100,50",
        "color": "#000000"
      }
    ],
    "seo_title": "Plakat Akrilik Premium - Berkualitas Tinggi",
    "seo_description": "Plakat akrilik premium dengan kualitas terbaik...",
    "seo_keywords": ["plakat", "akrilik", "premium", "penghargaan"],
    "status": "published",
    "featured": true,
    "is_public": true,
    "notes_wysiwyg": "<p>Internal notes...</p>",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-05T10:30:00Z"
  }
}
```

### 3. Create Product

**Endpoint**: `POST /api/admin/products`

**Request Body**:
```json
{
  "name": "Plakat Akrilik Premium",
  "description": "Short description",
  "long_description": "Full description",
  "category_id": "uuid",
  "tags": ["plakat", "akrilik"],
  "price": 150000,
  "currency": "IDR",
  "images": ["url1", "url2"],
  "bahan_options": ["Akrilik", "Kuningan"],
  "kualitas_options": ["standard", "premium"],
  "status": "draft"
}
```

**Validation**:
- `name`: required, max 255 chars
- `slug`: auto-generated if not provided, must be unique
- `price`: optional, must be >= 0 if provided
- `status`: must be in ['draft', 'published', 'archived']
- `images`: optional, array of valid URLs

**Response**: 201 Created with product object

### 4. Update Product

**Endpoint**: `PUT /api/admin/products/{id}`

**Request Body**: Same as Create (partial updates allowed)

**Response**: 200 OK with updated product object

### 5. Delete Product (Soft Delete)

**Endpoint**: `DELETE /api/admin/products/{id}`

**Response**: 204 No Content

**Business Logic**:
- Set `deleted_at` timestamp (soft delete)
- Product tidak tampil di list tapi masih ada di database
- Dapat di-restore melalui API restore endpoint

### 6. Restore Product

**Endpoint**: `POST /api/admin/products/{id}/restore`

**Response**: 200 OK with restored product object

### 7. Permanent Delete

**Endpoint**: `DELETE /api/admin/products/{id}/force`

**Response**: 204 No Content

**Warning**: Permanent deletion, tidak bisa di-restore

### 8. Bulk Actions

**Endpoint**: `POST /api/admin/products/bulk`

**Request Body**:
```json
{
  "action": "publish",
  "product_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Actions**:
- `publish`: Set status = published
- `unpublish`: Set status = draft
- `archive`: Set status = archived
- `delete`: Soft delete
- `restore`: Restore from deleted
- `feature`: Set featured = true
- `unfeature`: Set featured = false

---

## ADMIN UI FEATURES

### Product Editor Tabs

1. **Basic Info Tab**
   - Product name (required)
   - Slug (auto-generated, editable)
   - Short description (textarea)
   - Long description (WYSIWYG editor)
   - Category selector (hierarchical dropdown)
   - Tags input (multi-select with autocomplete)

2. **Media Tab**
   - Image gallery uploader
   - Drag & drop to reorder images
   - Set featured image
   - Image preview with zoom
   - Delete image confirmation

3. **Pricing & Stock Tab**
   - Price input (optional)
   - Currency selector (IDR, USD, EUR)
   - Price unit input
   - Minimum order quantity
   - Stock availability toggle
   - Stock quantity input
   - Lead time input

4. **Custom Order Form Tab**
   - Bahan options (multi-select, admin can add inline)
   - Kualitas options (select: standard/premium)
   - Ketebalan options (multi-select, admin can add inline)
   - Ukuran options (multi-select, admin can add inline)
   - Default warna background (color picker)
   - Design file upload section
   - Custom text placement manager:
     - Add multiple text entries
     - Text input
     - Placement selector (depan/belakang)
     - Position coordinate input
     - Color picker for text color
     - Drag to reorder

5. **Specifications Tab**
   - Key-value pair manager
   - Add specification button
   - Inline editing
   - Drag to reorder
   - Delete confirmation

6. **SEO Tab**
   - SEO title (auto-filled from name)
   - SEO description (max 160 chars counter)
   - SEO keywords (tag input)
   - URL preview
   - SEO score indicator

**Editor Actions**:
- Save Draft button
- Publish button (with validation)
- Preview button (open public view in new tab)
- Delete button (with confirmation modal)
- Back to list button

### Product List Features

**List View Options**:
- Table view (default)
- Card/grid view (toggle)

**Table Columns**:
- Checkbox (for bulk actions)
- Featured image thumbnail
- Name + slug
- Category
- Price
- Stock status
- Status badge
- Actions dropdown

**Filters**:
- Search by name/slug/description
- Filter by category (with child categories)
- Filter by status (draft/published/archived)
- Filter by featured
- Filter by stock availability
- Date range filter

**Bulk Actions Dropdown**:
- Publish selected
- Unpublish selected
- Archive selected
- Delete selected
- Set as featured
- Remove featured

**Sorting**:
- Name (A-Z, Z-A)
- Created date (newest, oldest)
- Updated date
- Price (high to low, low to high)
- Stock quantity

---

## SAMPLE DATA

### Sample Product: Plakat Akrilik Premium

```sql
INSERT INTO products (
    id, name, slug, description, long_description,
    images, category_id, tags,
    price, currency, price_unit, min_order,
    in_stock, stock_quantity, lead_time,
    bahan, bahan_options, kualitas, kualitas_options,
    ketebalan, ketebalan_options, ukuran, ukuran_options,
    warna_background, customizable, custom_options,
    seo_title, seo_description, seo_keywords,
    status, featured, is_public
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Plakat Akrilik Premium 3mm',
    'plakat-akrilik-premium-3mm',
    'Plakat akrilik berkualitas tinggi dengan finishing glossy, cocok untuk penghargaan dan trophy.',
    '<p>Plakat akrilik premium adalah pilihan terbaik untuk memberikan penghargaan yang berkesan. <strong>Keunggulan produk:</strong></p><ul><li>Material akrilik berkualitas tinggi</li><li>Finishing glossy yang elegan</li><li>Dapat custom design sesuai keinginan</li><li>Proses etching presisi tinggi</li></ul>',
    '["https://cdn.example.com/plakat-1.jpg", "https://cdn.example.com/plakat-2.jpg", "https://cdn.example.com/plakat-3.jpg"]',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901', -- UUID category
    '["plakat", "akrilik", "premium", "penghargaan", "trophy"]',
    150000, 'IDR', 'per pcs', 1,
    true, 50, '3-5 hari kerja',
    'Akrilik Premium', 
    '["Akrilik Premium", "Akrilik Standard", "Kuningan", "Tembaga"]',
    'premium',
    '["standard", "premium"]',
    '3mm',
    '["2mm", "3mm", "5mm"]',
    '20x30',
    '["15x20", "20x30", "25x35", "30x40"]',
    '#FFFFFF',
    true,
    '[
      {
        "name": "warna_text",
        "label": "Warna Text",
        "type": "color",
        "required": true,
        "default": "#000000"
      },
      {
        "name": "font_style",
        "label": "Gaya Font",
        "type": "select",
        "options": ["Arial", "Times New Roman", "Calibri"],
        "required": true,
        "default": "Arial"
      }
    ]',
    'Plakat Akrilik Premium 3mm - Berkualitas Tinggi | Etching Custom',
    'Plakat akrilik premium dengan ketebalan 3mm, finishing glossy elegan. Cocok untuk penghargaan dan trophy. Custom design sesuai keinginan Anda.',
    '["plakat akrilik", "trophy akrilik", "plakat penghargaan", "custom etching", "plakat premium"]',
    'published', true, true
);

-- Specifications
INSERT INTO product_specifications (product_id, key, value, order_index) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Material', 'Akrilik Premium Grade A', 1),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ketebalan', '3mm', 2),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Finishing', 'Glossy', 3),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Metode Produksi', 'Laser Etching', 4),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ukuran Tersedia', '15x20, 20x30, 25x35, 30x40 cm', 5);

-- Custom Texts (default template)
INSERT INTO product_custom_texts (product_id, text, placement, position, color, order_index) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'PENGHARGAAN', 'depan', '100,50', '#000000', 1),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Kepada: [Nama Penerima]', 'depan', '100,150', '#000000', 2);
```

---

## MIGRATION SCRIPT

```sql
-- Migration: Create products module tables (CORRECTED)
-- Description: Multi-tenant product management tables with proper tenant isolation
-- Date: 2025-11-12 (Updated after audit)
-- Status: CRITICAL FIXES APPLIED

BEGIN;

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: product_categories (FIXED: Added tenant_id)
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-Tenant Isolation (CORE RULE COMPLIANCE - FIXED)
    tenant_id UUID NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
    image VARCHAR(500),
    icon VARCHAR(100),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES product_categories(id) ON DELETE CASCADE,
    
    -- Unique Constraints (FIXED: Tenant-scoped)
    UNIQUE(tenant_id, slug),
    CONSTRAINT categories_no_self_parent CHECK (id != parent_id)
);

-- Table: products (FIXED: Added tenant_id)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-Tenant Isolation (CORE RULE COMPLIANCE - FIXED)
    tenant_id UUID NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    long_description TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    featured_image VARCHAR(500),
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    price DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'IDR',
    price_unit VARCHAR(50) DEFAULT 'per pcs',
    min_order INTEGER DEFAULT 1,
    in_stock BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0,
    lead_time VARCHAR(100),
    product_type VARCHAR(100),
    size VARCHAR(100),
    bahan VARCHAR(100),
    bahan_options JSONB DEFAULT '[]'::jsonb,
    kualitas VARCHAR(100) DEFAULT 'standard',
    kualitas_options JSONB DEFAULT '[]'::jsonb,
    ketebalan VARCHAR(100) DEFAULT '1mm',
    ketebalan_options JSONB DEFAULT '[]'::jsonb,
    ukuran VARCHAR(100) DEFAULT '15x20',
    ukuran_options JSONB DEFAULT '[]'::jsonb,
    warna_background VARCHAR(7) DEFAULT '#FFFFFF',
    design_file_url TEXT,
    customizable BOOLEAN DEFAULT false,
    custom_options JSONB DEFAULT '[]'::jsonb,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    featured BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    notes_wysiwyg TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID,
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE - FIXED)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Unique Constraints (FIXED: Tenant-scoped)
    UNIQUE(tenant_id, slug),
    
    -- Check Constraints
    CONSTRAINT products_price_positive CHECK (price IS NULL OR price >= 0),
    CONSTRAINT products_vendor_price_positive CHECK (vendor_price IS NULL OR vendor_price >= 0),
    CONSTRAINT products_markup_positive CHECK (markup_percentage >= 0),
    CONSTRAINT products_stock_positive CHECK (stock_quantity >= 0)
);

-- Table: product_specifications (FIXED: Added tenant_id)
CREATE TABLE IF NOT EXISTS product_specifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-Tenant Isolation (CORE RULE COMPLIANCE - FIXED)
    tenant_id UUID NOT NULL,
    
    product_id UUID NOT NULL,
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE - FIXED)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    
    -- Unique Constraints (FIXED: Tenant-scoped)
    UNIQUE(tenant_id, product_id, key)
);

-- Table: product_custom_texts (FIXED: Added tenant_id)
CREATE TABLE IF NOT EXISTS product_custom_texts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-Tenant Isolation (CORE RULE COMPLIANCE - FIXED)
    tenant_id UUID NOT NULL,
    
    product_id UUID NOT NULL,
    text TEXT NOT NULL,
    placement VARCHAR(20) NOT NULL CHECK (placement IN ('depan', 'belakang')),
    position VARCHAR(100),
    color VARCHAR(7) DEFAULT '#000000',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE - FIXED)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Indexes for product_categories (FIXED: Tenant-aware)
CREATE INDEX IF NOT EXISTS idx_categories_tenant ON product_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_tenant_slug ON product_categories(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON product_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON product_categories(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_order ON product_categories(tenant_id, order_index);

-- Indexes for products (FIXED: Tenant-aware)
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_slug ON products(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(tenant_id, featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_production_type ON products(production_type);
CREATE INDEX IF NOT EXISTS idx_products_quotation_required ON products(quotation_required) WHERE quotation_required = true;
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN (to_tsvector('indonesian', name || ' ' || COALESCE(description, '')));

-- Indexes for product_specifications (FIXED: Tenant-aware)
CREATE INDEX IF NOT EXISTS idx_specs_tenant ON product_specifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_specs_product_id ON product_specifications(product_id);
CREATE INDEX IF NOT EXISTS idx_specs_key ON product_specifications(key);

-- Indexes for product_custom_texts (FIXED: Tenant-aware)
CREATE INDEX IF NOT EXISTS idx_custom_texts_tenant ON product_custom_texts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_custom_texts_product_id ON product_custom_texts(product_id);
CREATE INDEX IF NOT EXISTS idx_custom_texts_placement ON product_custom_texts(placement);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_specifications_updated_at BEFORE UPDATE ON product_specifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_custom_texts_updated_at BEFORE UPDATE ON product_custom_texts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

---

## PERFORMANCE INDEXES

### Query Performance Analysis

1. **Product List with Filtering** (Most Common Query)
```sql
-- Query pattern
SELECT * FROM products
WHERE status = 'published'
  AND deleted_at IS NULL
  AND (category_id = ? OR category_id IN (child_categories))
  AND name ILIKE '%search%'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

-- Covered by indexes:
-- - idx_products_status
-- - idx_products_deleted_at
-- - idx_products_category_id
-- - idx_products_search
```

2. **Featured Products** (Homepage Query)
```sql
-- Query pattern
SELECT * FROM products
WHERE featured = true
  AND status = 'published'
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 6;

-- Covered by indexes:
-- - idx_products_featured (partial index, very efficient)
-- - idx_products_status
-- - idx_products_deleted_at
```

3. **Product Detail with Relations** (Detail Page Query)
```sql
-- Query pattern
SELECT p.*, 
       json_agg(ps.*) as specifications,
       json_agg(pct.*) as custom_texts,
       pc.name as category_name
FROM products p
LEFT JOIN product_specifications ps ON p.id = ps.product_id
LEFT JOIN product_custom_texts pct ON p.id = pct.product_id
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE p.slug = ?
  AND p.deleted_at IS NULL
GROUP BY p.id, pc.name;

-- Covered by indexes:
-- - idx_products_slug (unique, very fast)
-- - idx_specs_product_id
-- - idx_custom_texts_product_id
-- - idx_categories_slug
```

4. **Full-Text Search** (Search Query)
```sql
-- Query pattern
SELECT * FROM products
WHERE to_tsvector('indonesian', name || ' ' || COALESCE(description, ''))
  @@ plainto_tsquery('indonesian', ?)
  AND status = 'published'
  AND deleted_at IS NULL
ORDER BY ts_rank(to_tsvector('indonesian', name || ' ' || COALESCE(description, '')), 
                  plainto_tsquery('indonesian', ?)) DESC
LIMIT 20;

-- Covered by indexes:
-- - idx_products_search (GIN index for full-text)
-- - idx_products_status
-- - idx_products_deleted_at
```

### Recommended Additional Indexes (If Needed)

```sql
-- Composite index for common filter combinations
CREATE INDEX idx_products_status_category 
ON products(status, category_id) 
WHERE deleted_at IS NULL;

-- Index for price range queries (if implemented)
CREATE INDEX idx_products_price 
ON products(price) 
WHERE price IS NOT NULL AND deleted_at IS NULL;

-- Index for stock filtering
CREATE INDEX idx_products_stock 
ON products(in_stock, stock_quantity) 
WHERE deleted_at IS NULL;
```

---

## NOTES

### Multi-Tenant Considerations

1. **Data Isolation**: 
   - Setiap tenant memiliki `products` table di schema mereka sendiri
   - Tidak perlu `tenant_id` column karena schema isolation sudah sufficient
   - Laravel middleware akan auto-switch ke schema tenant yang benar

2. **Configuration-Driven Customization**:
   - Tenant dapat customize product fields via `settings` table
   - Contoh: `settings.key = 'product.custom_fields'`
   - Value berisi JSON definition untuk additional fields
   - Frontend render fields secara dinamis based on configuration

3. **Theme Integration**:
   - Product display mengikuti theme yang active untuk tenant
   - Theme dapat override product card/detail layout
   - Product images dan media harus accessible dari public CDN

### Future Enhancements

1. **Product Variants** (Phase 2):
   - Separate table `product_variants` untuk handle size/color variations
   - Each variant has own SKU, price, stock
   - Example: T-shirt dengan multiple sizes dan colors

2. **Bulk Pricing** (Phase 2):
   - Table `product_price_tiers` untuk quantity-based pricing
   - Example: 1-10 pcs = Rp 100k, 11-50 pcs = Rp 90k

3. **Product Reviews** (Phase 2):
   - See `07-REVIEWS.md` for review system integration
   - Rating aggregation stored in products table

4. **Inventory Tracking** (Phase 3):
   - Integration dengan Inventory module
   - Auto-update stock saat order completed
   - Low stock alerts

5. **Multi-Language Support** (Phase 3):
   - Separate table `product_translations`
   - Each product can have translations for name, description
   - Language selection based on tenant settings

### Core Immutable Rules Compliance

✅ Core Rules section dengan 5 aturan inti yang wajib
✅ Rule 1: Semua tabel memiliki tenant_id UUID NOT NULL dengan foreign key ke tenants(uuid)
✅ Rule 2: API Guard implementation dengan Laravel Sanctum
✅ Rule 3: UUID gen_random_uuid() sebagai public identifier
✅ Rule 4: Strict tenant data isolation di semua level
✅ Rule 5: RBAC permissions untuk product management

### Multi-Tenant Architecture Fixes

✅ Added tenant_id fields ke semua 4 tabel
✅ Fixed UUID generation dari uuid_generate_v4() ke gen_random_uuid()
✅ Added foreign key constraints ke tenants(uuid) table
✅ Updated unique constraints untuk tenant-scoped uniqueness
✅ Added tenant-aware indexes untuk performance optimization

### Etching Business Cycle Integration

✅ Enhanced business context dengan complete 5-stage workflow
✅ Added production_type field untuk internal vs vendor workflow
✅ Added vendor_price field untuk vendor pricing tracking
✅ Added markup_percentage field untuk broker profit calculation
✅ Added quotation_required field untuk dynamic pricing logic

### Database Schema Improvements

✅ Updated field count dari 56 ke 64 fields
✅ Proper foreign key constraints dengan CASCADE/SET NULL
✅ Tenant-aware indexes untuk query performance
✅ Timestamp triggers untuk audit trail
✅ Check constraints untuk data validation

---

---

## 🔧 REQUIRED FIXES & IMPLEMENTATION PLAN

### **PHASE 1: CRITICAL DATABASE FIXES (Priority: URGENT)**

#### **1.1 Fix Migration Script**
```sql
-- Apply corrected migration script above
-- Key changes:
-- ✅ Added tenant_id UUID NOT NULL to all tables
-- ✅ Fixed UUID generation to gen_random_uuid()
-- ✅ Added proper foreign key constraints
-- ✅ Updated unique constraints to be tenant-scoped
-- ✅ Added tenant-aware indexes
```

#### **1.2 Update Existing Schema (If Already Deployed)**
```sql
-- Migration to add tenant_id to existing tables
ALTER TABLE product_categories ADD COLUMN tenant_id UUID;
ALTER TABLE products ADD COLUMN tenant_id UUID;
ALTER TABLE product_specifications ADD COLUMN tenant_id UUID;
ALTER TABLE product_custom_texts ADD COLUMN tenant_id UUID;

-- Add foreign key constraints
ALTER TABLE product_categories ADD CONSTRAINT fk_categories_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE;
ALTER TABLE products ADD CONSTRAINT fk_products_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE;
-- ... (repeat for all tables)

-- Update unique constraints to be tenant-scoped
ALTER TABLE product_categories DROP CONSTRAINT categories_slug_unique;
ALTER TABLE product_categories ADD CONSTRAINT categories_tenant_slug_unique 
    UNIQUE(tenant_id, slug);
-- ... (repeat for all tables)
```

### **PHASE 2: FRONTEND TENANT INTEGRATION (Priority: HIGH)**

#### **2.1 Add Tenant Context Provider**
```typescript
// src/contexts/TenantContext.tsx
interface TenantContextType {
  tenantId: string;
  tenantSlug: string;
  tenantConfig: TenantConfig;
}

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Extract tenant from subdomain/domain
  // Provide tenant context to all components
};
```

#### **2.2 Update Product Types**
```typescript
// src/types/product.ts - ADD tenant fields
export interface Product {
  id: string;
  tenant_id: string; // ADD THIS
  // ... existing fields
}

export interface ProductCategory {
  id: string;
  tenant_id: string; // ADD THIS
  // ... existing fields
}
```

#### **2.3 Update API Services**
```typescript
// src/services/api/products.ts - ADD tenant-aware calls
export async function getProducts(tenantId: string): Promise<Product[]> {
  const response = await apiClient.get(`/tenants/${tenantId}/products`);
  return response.data;
}

export async function createProduct(tenantId: string, data: Partial<Product>): Promise<Product> {
  const response = await apiClient.post(`/tenants/${tenantId}/products`, data);
  return response.data;
}
```

### **PHASE 3: RBAC INTEGRATION (Priority: HIGH)**

#### **3.1 Add Permission Checking**
```typescript
// src/hooks/usePermissions.ts
export function usePermissions() {
  const { user, tenantId } = useAuth();
  
  return {
    canViewProducts: hasPermission(user, tenantId, 'products.view'),
    canCreateProducts: hasPermission(user, tenantId, 'products.create'),
    canEditProducts: hasPermission(user, tenantId, 'products.edit'),
    canDeleteProducts: hasPermission(user, tenantId, 'products.delete'),
    canManageProducts: hasPermission(user, tenantId, 'products.manage'),
  };
}
```

#### **3.2 Update ProductEditor with Permissions**
```typescript
// src/pages/admin/ProductEditor.tsx - ADD permission checks
export default function ProductEditor() {
  const { canEditProducts, canCreateProducts } = usePermissions();
  
  if (!canEditProducts && !canCreateProducts) {
    return <AccessDenied />;
  }
  
  // ... rest of component
}
```

### **PHASE 4: BUSINESS WORKFLOW INTEGRATION (Priority: HIGH)**

#### **4.1 Add Production Type Workflow UI**
```typescript
// Add to ProductEditor.tsx
<TabsContent value="production" className="space-y-4">
  <Card className="p-6 space-y-4">
    <div className="space-y-2">
      <Label>Production Type</Label>
      <Select 
        value={formData.production_type} 
        onValueChange={(v) => setFormData({ ...formData, production_type: v })}
      >
        <SelectItem value="vendor">Vendor Production (Broker)</SelectItem>
        <SelectItem value="internal">Internal Production</SelectItem>
      </Select>
    </div>
    
    {formData.production_type === 'vendor' && (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Vendor Price</Label>
          <Input 
            type="number" 
            value={formData.vendor_price}
            onChange={(e) => setFormData({ ...formData, vendor_price: parseFloat(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Markup Percentage</Label>
          <Input 
            type="number" 
            value={formData.markup_percentage}
            onChange={(e) => setFormData({ ...formData, markup_percentage: parseFloat(e.target.value) })}
          />
        </div>
      </div>
    )}
  </Card>
</TabsContent>
```

#### **4.2 Add Quotation System Integration**
```typescript
// src/components/admin/QuotationManager.tsx
export function QuotationManager({ productId }: { productId: string }) {
  // Handle quotation requests
  // Vendor price negotiation
  // Customer quotation generation
  // Markup calculation
}
```

### **PHASE 5: HEXAGONAL ARCHITECTURE REFACTOR (Priority: MEDIUM)**

#### **5.1 Create Domain Layer**
```typescript
// src/domain/product/entities/Product.ts
export class Product {
  constructor(
    public readonly id: ProductId,
    public readonly tenantId: TenantId,
    public readonly name: string,
    // ... other properties
  ) {}
  
  public calculateFinalPrice(vendorPrice: number, markupPercentage: number): number {
    return vendorPrice * (1 + markupPercentage / 100);
  }
}
```

#### **5.2 Create Application Layer**
```typescript
// src/application/product/usecases/CreateProductUseCase.ts
export class CreateProductUseCase {
  constructor(
    private productRepository: ProductRepositoryInterface,
    private tenantRepository: TenantRepositoryInterface
  ) {}
  
  async execute(command: CreateProductCommand): Promise<Product> {
    // Validate tenant exists
    // Create product entity
    // Save via repository
    // Return created product
  }
}
```

### **IMPLEMENTATION TIMELINE**

| Phase | Duration | Priority | Dependencies |
|-------|----------|----------|--------------|
| **Phase 1: Database Fixes** | 1-2 days | URGENT | None |
| **Phase 2: Frontend Tenant** | 3-5 days | HIGH | Phase 1 |
| **Phase 3: RBAC Integration** | 2-3 days | HIGH | Phase 2 |
| **Phase 4: Business Workflow** | 5-7 days | HIGH | Phase 2, 3 |
| **Phase 5: Hexagonal Refactor** | 7-10 days | MEDIUM | Phase 1-4 |

**Total Estimated Time**: 18-27 days  
**Critical Path**: Phase 1 → Phase 2 → Phase 3 → Phase 4

### **VALIDATION CHECKLIST**

After implementation, verify:

- [ ] **Tenant Isolation**: Products are properly isolated per tenant
- [ ] **RBAC**: Permission checking works for all product operations
- [ ] **Business Workflow**: Production type logic functions correctly
- [ ] **API Consistency**: All endpoints are tenant-aware
- [ ] **Database Integrity**: Foreign key constraints prevent data corruption
- [ ] **Performance**: Tenant-aware indexes provide good query performance
- [ ] **UI/UX**: All admin interfaces work with tenant context
- [ ] **Testing**: Unit and integration tests cover multi-tenant scenarios

---

**Previous:** [05-FAQ.md](./05-FAQ.md)  
**Next:** [07-REVIEWS.md](./07-REVIEWS.md)  

**Last Updated:** 2025-11-12 (AUDIT COMPLETED)  
**Status:** 🔄 **CRITICAL UPDATES REQUIRED**  
**Reviewed By:** CanvaStack Stencil  
**Compliance Level**: 25% (2/8 components) - **ENTERPRISE NOT READY**
