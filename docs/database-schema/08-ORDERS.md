# ORDER MANAGEMENT MODULE
## Database Schema & API Documentation

**Module:** E-Commerce - Order Management (Purchase Order System)  
**Total Fields:** 150+ fields  
**Total Tables:** 7 tables (purchase_orders, order_items, order_quotations, order_negotiations, order_payments, order_shipments, order_status_history)  
**Admin Page:** `src/pages/admin/OrderManagement.tsx`  
**Type Definition:** `src/types/order.ts`, `src/types/customer.ts`

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Business Context](#business-context)
3. [Database Schema](#database-schema)
4. [Relationship Diagram](#relationship-diagram)
5. [Field Specifications](#field-specifications)
6. [Business Rules](#business-rules)
7. [Status Workflow](#status-workflow)
8. [Payment Processing](#payment-processing)
9. [API Endpoints](#api-endpoints)
10. [Admin UI Features](#admin-ui-features)
11. [Sample Data](#sample-data)
12. [Migration Script](#migration-script)
13. [Performance Indexes](#performance-indexes)

---

## OVERVIEW

Modul Order Management adalah jantung dari sistem bisnis broker/makelar PT Custom Etching Xenial (PT CEX). Sistem ini mengelola complete purchase order lifecycle dari customer order submission hingga completion, termasuk vendor sourcing, price negotiation, payment tracking, production monitoring, dan shipping.

### Core Features

1. **Complete Purchase Order Lifecycle**
   - Customer order intake (walk-in, phone, website)
   - Auto-generated order code dengan format kustom
   - Dynamic order form dengan custom fields per tenant
   - Multi-item orders dengan customization per item
   - Design file upload support

2. **Production Type Management**
   - **Vendor Production** (Current focus): Outsource ke vendor eksternal
   - **Internal Production** (Future): Workshop sendiri dengan inventory tracking
   - Flexible switching berdasarkan business needs
   - Production type mempengaruhi pricing dan workflow

3. **Vendor Sourcing & Negotiation**
   - Automated vendor matching berdasarkan specializations
   - Multi-vendor quotation request (parallel negotiations)
   - Price negotiation history dengan timestamps
   - Counter-offer tracking dan approval workflow
   - Email automation untuk vendor communication
   - Deal/No-Deal handling dengan reason logging

4. **Customer Quotation System**
   - Auto markup calculation dari vendor price
   - PPN/Tax handling (configurable per tenant)
   - Multiple quote versions tracking
   - Quote approval/rejection workflow
   - Email quotation ke customer
   - Re-negotiation capability jika customer reject

5. **Payment Processing**
   - **Customer Payments**:
     - DP Minimum 50% → Account Payable status
     - Full Payment 100% → Account Receivable status
     - Multiple payment methods: Cash, Bank Transfer, Payment Gateway
     - Payment proof upload dan verification workflow
     - Automated invoice generation
   - **Vendor Payments**:
     - DP to vendor (< 50% dari customer DP atau custom)
     - Full payment options setelah production complete
     - Payment tracking dan accounting records
     - Vendor invoice management

6. **Production Monitoring**
   - Status tracking: New → Sourcing → Negotiation → Production → QC → Shipping → Completed
   - Detailed status history dengan timestamps dan user tracking
   - Vendor communication log
   - Estimated completion date updates
   - Admin update capabilities dengan notes

7. **Shipping & Delivery**
   - Shipping provider integration
   - Tracking number generation
   - Auto notification ke customer
   - Delivery confirmation
   - POD (Proof of Delivery) upload

8. **Order Completion & Analytics**
   - Customer review request automation
   - Profitability report (customer price - vendor price - costs)
   - Transaction archival untuk historical data
   - Performance metrics per customer, vendor, product

### Business Model Support

Sistem dirancang untuk mendukung model bisnis broker/makelar dengan:
- Customer tidak tahu bahwa production dilakukan oleh vendor (brand protection)
- Markup pricing strategy dengan profit margin tracking
- Flexible payment terms (DP/Full) untuk customer dan vendor
- Complete financial transparency untuk admin/finance team
- Scalable untuk multiple business types di masa depan

---

## BUSINESS CONTEXT

### PT CEX Broker Business Model

Modul Order Management dirancang untuk mengakomodasi complete business workflow PT CEX sebagai perantara:

#### Phase 1: Order Intake → Vendor Sourcing

**1. Customer Order Submission**
- Customer dapat order via:
  - **Walk-in**: Customer datang ke kantor, admin input data
  - **Phone/WhatsApp**: Admin terima order via telepon, input manual
  - **Website**: Customer submit form order langsung (future enhancement)
- Sistem generate **Order Code** otomatis dengan format: `ORD-{YYYY}-{MM}-{NNNN}`
  - Example: `ORD-2025-01-0001`
  - Sequential per month, auto-reset setiap bulan baru
- Data order tersimpan dengan status `new`
- **Notification trigger**: Email/SMS ke Admin dan Manager role
  - Subject: "New Order Received - {order_code}"
  - Content: Summary order details, link to admin panel
- Admin dapat view order details dan mulai processing

**2. Production Type Selection**
- Admin review order details dan memilih production type:
  - **Internal** (Future capability): Production dilakukan di workshop sendiri
    - Memerlukan material inventory check
    - Production scheduling dengan machines/workstations
    - Labor cost calculation
    - Direct cost tracking untuk profitability
  - **Vendor** (Current focus): Production outsource ke vendor
    - Sistem akan masuk ke vendor sourcing workflow
    - Vendor pricing + markup menjadi basis customer quotation
- Status berubah menjadi:
  - `sourcing_vendor` (jika pilih vendor)
  - `awaiting_production_schedule` (jika pilih internal - future)

#### Phase 2: Vendor Negotiation → Customer Quotation

**3. Vendor Sourcing**
- Admin search vendor berdasarkan criteria:
  - **Material specializations** yang match dengan order requirement
    - Example: Order butuh "Kuningan" → filter vendor dengan specialization "etching_kuningan"
  - **Quality tier** (Standard vs Premium) sesuai customer request
  - **Overall rating** >= threshold (default: 3.5/5.0)
  - **Lead time capacity** yang acceptable
  - **Location proximity** (optional untuk minimize shipping cost)
- Sistem suggest vendor berdasarkan:
  - Historical performance (rating, on-time delivery)
  - Past successful deals dengan similar products
  - Competitive pricing track record
- Admin dapat:
  - Select single vendor untuk direct negotiation
  - Select multiple vendors untuk competitive bidding
  - Register vendor baru jika tidak ada yang match

**4. Price Negotiation dengan Vendor**
- Admin create **Negotiation Request** dengan details:
  - Product specifications lengkap dari customer order
  - Quantity, materials, dimensions, quality requirements
  - Expected lead time
  - Design files (if provided by customer)
- Sistem send **Email Quotation Request** ke vendor secara otomatis:
  - Subject: "Quotation Request - {order_code}"
  - Content: Complete order specification
  - Response deadline (configurable, default: 3 business days)
- Vendor respond dengan:
  - **Price per unit** (vendor_price)
  - **Estimated production days** (lead_time_days)
  - **Minimum order quantity** (if applicable)
  - **Additional notes/terms**
- Admin input vendor response ke sistem
- Negotiation dapat berlangsung multiple rounds:
  - **Round 1**: Vendor submit initial quote
  - **Admin counter-offer**: Negotiate lower price or faster lead time
  - **Round 2**: Vendor adjust quote
  - **Final decision**: Deal or No Deal
- Setiap round tercatat di `order_negotiations` table dengan:
  - Timestamp, user_id, offered_price, notes, status
- Jika **Vendor Rejected** (No Deal):
  - Admin log reason: "Harga terlalu tinggi", "Lead time tidak acceptable", "Vendor overbooked"
  - Status order kembali ke `sourcing_vendor`
  - Admin cari vendor alternatif
  - Process repeat sampai ada vendor yang deal
- Jika **Deal**:
  - Final vendor quote tersimpan di `order_quotations` table
  - Status berubah ke `customer_quotation`

**5. Customer Quotation**
- Admin create customer quote berdasarkan vendor price:
  - **Base price**: Vendor price per unit
  - **Markup**: Admin input markup (percentage atau fixed amount)
    - Example: Vendor price Rp 100,000 + Markup 30% = Rp 130,000
    - Or: Vendor price Rp 100,000 + Markup Rp 50,000 = Rp 150,000
  - **PPN/Tax**: Auto calculate atau manual input (default: 11% di Indonesia)
  - **Additional costs**: Shipping estimation, handling fee (optional)
  - **Total price to customer** = (vendor_price + markup) × quantity + PPN + additional_costs
- Sistem auto-calculate **Profit Margin**:
  - Profit amount = customer_price - vendor_price - costs
  - Profit percentage = (profit_amount / customer_price) × 100%
- Admin review dan approve quotation
- Sistem send **Email Quotation** ke customer:
  - Subject: "Quotation for Order {order_code}"
  - Content:
    - Detailed pricing breakdown (tanpa mention vendor atau vendor price)
    - Estimated production time
    - Payment terms: DP 50% minimum OR Full 100%
    - Quotation validity period (default: 7 days)
    - Link untuk customer approval (future: customer portal)
- Status berubah ke `waiting_customer_approval`

#### Phase 3: Payment Processing

**6. Customer Approval**
- Customer review quotation dan dapat:
  - **Approve**: Customer setuju dengan harga dan terms
    - Customer pilih payment option:
      - **DP 50%**: Pay down payment minimum 50% dari total
      - **Full 100%**: Pay full amount upfront
    - Status berubah ke `waiting_payment`
    - Sistem generate **Invoice** untuk customer:
      - Invoice number: `INV-{YYYY}-{MM}-{NNNN}`
      - Invoice details: Items, quantities, prices, tax, total
      - Payment instructions per method:
        - **Cash**: Datang ke kantor dengan bukti order
        - **Bank Transfer**: Bank account details, transfer amount, unique code
        - **Payment Gateway**: Link pembayaran Midtrans/Xendit
      - Due date: Configurable (default: 3 days untuk DP, 7 days untuk Full)
    - Email invoice ke customer
  - **Reject/Request Re-negotiation**:
    - Customer reason: "Harga terlalu tinggi", "Lead time terlalu lama", etc.
    - Admin receive notification
    - Admin dapat:
      - **Re-negotiate dengan vendor** untuk lower price
        - Kembali ke negotiation phase
        - Vendor dapat adjust quote atau maintain
      - **Adjust markup** untuk more competitive price
        - Admin decision berdasarkan profit margin minimum
      - **Cancel order** jika tidak bisa reach agreement
        - Status menjadi `cancelled`
        - Log cancellation reason

**7. Customer Payment Verification**
- Customer melakukan payment sesuai invoice:
  - **Cash**: Customer bayar di kantor, admin input cash receipt
  - **Bank Transfer**: Customer upload bukti transfer via system atau WhatsApp/Email
  - **Payment Gateway**: Auto-verification via webhook dari Midtrans/Xendit
- Admin verify payment di sistem:
  - View payment proof (screenshot transfer, receipt scan)
  - Confirm amount dan date
  - Match dengan invoice amount
  - Mark payment as `verified`
- Sistem create payment record di `order_payments` table:
  - Payment method, amount, payment_date, proof_url
  - Linked to invoice_id dan order_id
  - Verification timestamp dan verified_by user_id
- Payment allocation:
  - Jika **DP 50%**:
    - 50% recorded as received
    - Remaining 50% status `pending`
    - Order status → `in_production`
    - Order accounting_status → `account_payable` (ada hutang customer 50%)
  - Jika **Full 100%**:
    - 100% recorded as received
    - Order status → `in_production`
    - Order accounting_status → `account_receivable` (sudah lunas dari customer)
- **Notification triggers**:
  - Email ke customer: "Payment Confirmed - Production Will Start"
    - Estimated start date: Today + vendor preparation time
    - Estimated completion: Today + vendor lead_time_days
  - Email ke vendor: "Please Start Production - Order {order_code}"
    - Attached: Complete specifications dan design files
    - Expected completion date
    - Quality requirements
  - Internal notification ke Finance team untuk vendor payment processing

#### Phase 4: Vendor Payment & Production

**8. Vendor Payment Processing**
- Finance team process payment ke vendor berdasarkan agreement:
  - Payment terms ditentukan saat negotiation:
    - **DP to Vendor**: Percentage atau nominal
      - Rule: DP vendor MUST BE < DP received from customer
      - Example: Customer DP 50% = Rp 75,000 → Vendor DP max Rp 70,000 (maintain cash flow)
      - Configurable: Admin input DP percentage/amount untuk vendor
    - **Full Payment**: Dilakukan setelah production complete 100% dan QC pass
- Sistem create vendor payment record:
  - Generate vendor invoice: `VINV-{YYYY}-{MM}-{NNNN}`
  - Amount, due date, payment terms
  - Link to original order dan vendor quotation
- Admin/Finance mark vendor payment as:
  - `pending`: Invoice created, belum dibayar
  - `paid`: Payment executed, bukti transfer tersimpan
  - `verified`: Vendor confirm receipt
- Payment proof uploaded: Bank transfer slip, payment gateway transaction ID
- Accounting records updated untuk vendor payable tracking

**9. Production Monitoring**
- Vendor start production after receiving DP (or purchase confirmation)
- Admin monitor production progress via status updates:
  - **Production Status Workflow**:
    1. `design_finalization`: Vendor finalize design dengan customer spec
    2. `material_preparation`: Vendor prepare materials (kuningan, akrilik, etc.)
    3. `etching_process`: Actual etching/engraving process
    4. `finishing`: Polishing, coating, painting
    5. `quality_control`: Internal QC by vendor
    6. `ready_for_pickup`: Production complete, ready untuk diambil/shipped
- Admin dapat update status manually atau receive updates dari vendor via:
  - **Email updates**: Vendor send progress emails dengan photos
  - **WhatsApp**: Vendor send status via WhatsApp
  - **Vendor Portal** (Future): Vendor login dan update status langsung
- Setiap status change tercatat di `order_status_history`:
  - Status name, timestamp, changed_by, notes, attachments
- Jika ada **Production Delay**:
  - Vendor inform admin via communication channel
  - Admin update `estimated_completion_date` di sistem
  - Sistem send notification ke customer (optional, configurable):
    - "Update on Your Order: Estimated completion extended to {new_date}"
    - Reason for delay (optional): "High-quality finishing requires additional time"
- Admin dapat communicate dengan vendor:
  - Log semua communications di `internal_notes` field
  - Upload screenshots/documents sebagai bukti
  - Track promises dan commitments

#### Phase 5: Final Payment & Delivery

**10. Production Complete & QC**
- Vendor inform admin bahwa production complete 100%
- Admin update status → `production_complete`
- Quality Control process:
  - Jika **Vendor production**: Admin/QC team review vendor work
    - Check sesuai spec atau tidak
    - Photo documentation
    - Dapat accept atau request revision
  - Jika **Internal production**: Workshop QC team sign-off
- Jika QC Pass:
  - Status → `quality_check_passed`
  - Proceed to final payment dan shipping
- Jika QC Fail:
  - Status → `revision_required`
  - Admin communicate issue ke vendor
  - Vendor fix issues
  - Re-check QC

**11. Final Payment Collection (Jika DP)**
- Jika customer payment was DP 50%, masih ada remaining 50% yang harus ditagih
- Sistem auto-generate **Final Payment Invoice**:
  - Invoice untuk remaining amount
  - Due date: Before shipping (default) or upon delivery (configurable)
- Email invoice ke customer:
  - Subject: "Your Order is Ready - Final Payment Required"
  - Content:
    - Order summary
    - Production complete confirmation
    - Remaining amount due
    - Payment instructions
    - Shipping will proceed after payment
- Customer bayar remaining amount
- Admin verify final payment sama seperti DP verification
- Status → `fully_paid`
- Order accounting_status → `account_receivable` (fully settled)

**12. Vendor Final Payment**
- Setelah QC pass dan product ready, Finance team process final payment ke vendor
- Jika vendor agreement was Full Payment after completion:
  - Admin mark vendor payment as ready
  - Finance execute transfer
  - Upload payment proof
  - Vendor confirm receipt
- All vendor payments completed
- Vendor relationship maintained untuk future orders

**13. Shipping & Delivery**
- Admin/Logistics team arrange shipping:
  - Select shipping provider (JNE, TIKI, Gojek, etc.)
  - Input shipping details:
    - Courier name
    - Tracking number (resi)
    - Estimated delivery date
    - Shipping cost (if not included in quotation)
  - Package product dengan extra care (per customer notes)
- Status → `shipped`
- Sistem send auto notification ke customer:
  - Email: "Your Order Has Been Shipped"
  - Content:
    - Order summary
    - Tracking number dengan link ke courier tracking page
    - Estimated delivery date
    - Customer service contact jika ada issue
  - SMS/WhatsApp (optional): Short notification dengan tracking number
- Tracking updates:
  - Admin dapat manually update shipping status:
    - `in_transit`: Package dalam perjalanan
    - `out_for_delivery`: Package will be delivered today
    - `delivered`: Customer receive package
  - Future: Auto-sync dengan courier API untuk real-time tracking

**14. Order Completion**
- Customer confirm penerimaan barang:
  - Via customer portal (future)
  - Via WhatsApp/Email ke admin
  - Or auto-confirm after X days (default: 7 days after shipping)
- Admin mark order as `delivered`
- Wait period (default: 3 days) untuk customer inspection
- Jika tidak ada complaint, status → `completed`
- **Post-completion actions**:
  - Sistem send **Review Request Email** ke customer:
    - Subject: "How Was Your Experience?"
    - Link ke review form (rate product dan service)
    - Incentive offer (future): Discount code untuk next order
  - Generate **Profitability Report** untuk order:
    - Customer price total
    - Vendor price total
    - Additional costs (shipping, materials, etc.)
    - Gross profit = Customer price - Vendor price - Costs
    - Profit margin percentage
    - Report accessible di admin panel
  - Archive transaction untuk historical data:
    - All records retained in database
    - Reports dan analytics dapat di-generate kapan saja
  - Update statistics:
    - Customer total_orders += 1, total_spent += order_amount
    - Vendor total_orders += 1, completed_orders += 1
    - Product order count tracking

#### Exception Handling: "Not Deal" Scenarios

Sistem dirancang untuk handle skenario dimana negotiation tidak berhasil:

**Vendor Rejection (Vendor No Deal)**
- Scenario: Vendor tidak setuju dengan terms atau tidak bisa handle order
- Admin actions:
  - Mark negotiation as `rejected`
  - Log rejection reason di notes:
    - "Vendor price too high compared to budget"
    - "Vendor lead time tidak acceptable"
    - "Vendor tidak confident dengan quality requirement"
    - "Vendor overbooked, tidak bisa terima order baru"
  - Status order kembali ke `sourcing_vendor`
  - Admin cari vendor alternatif dari list
  - Repeat negotiation process dengan vendor baru
- System tracking:
  - All rejected negotiations tersimpan di history
  - Data berguna untuk future vendor selection:
    - Vendor yang sering reject dapat di-flag
    - Price ranges per vendor untuk reference
  - Admin dapat compare quotes dari multiple vendors

**Customer Rejection (Customer No Deal)**
- Scenario 1: Customer tidak setuju dengan price quotation
  - Customer reason: "Harga terlalu mahal dibanding market"
  - Admin options:
    1. **Re-negotiate dengan vendor untuk lower price**:
       - Admin contact vendor, request price reduction
       - Explain customer budget constraint (tanpa expose exact figures)
       - Vendor dapat:
         - Agree untuk lower price (update quotation)
         - Maintain price (no further negotiation)
       - Jika vendor agree lower price:
         - Create new quotation version untuk customer
         - Admin dapat adjust markup juga jika needed
         - Send updated quotation ke customer
       - Jika vendor tidak agree:
         - Proceed to option 2 atau 3
    2. **Adjust company markup untuk more competitive price**:
       - Admin decision dengan approval dari management
       - Check minimum acceptable profit margin (configured di settings)
       - Example: Original markup 30% → reduce to 20%
       - Create new customer quotation dengan lower price
       - Send updated quotation
    3. **Source alternative vendor dengan better price**:
       - Kembali ke vendor sourcing
       - Find vendor lain yang bisa offer lower price
       - Repeat negotiation process
    4. **Cancel order**:
       - Jika semua options tidak feasible
       - Customer budget terlalu rendah, tidak sustainable untuk business
       - Status → `cancelled`
       - Cancellation reason: "Customer budget constraint, unable to meet pricing"
- Scenario 2: Customer tidak setuju dengan lead time
  - Customer reason: "Butuh lebih cepat, ada deadline event"
  - Admin options:
    1. **Rush order negotiation dengan vendor**:
       - Check jika vendor accept rush orders
       - Rush order surcharge (vendor_rush_fee)
       - Update quotation dengan rush fee
       - Customer approve higher price untuk faster delivery
    2. **Find vendor dengan faster lead time**:
       - Source alternative vendor
       - Premium vendors biasanya faster (but more expensive)
    3. **Cancel order**:
       - Jika tidak ada vendor yang bisa meet deadline
- All rejection dan cancellation scenarios tercatat di database untuk analytics

**Price Mismatch Resolution**
- Jika ada discrepancy antara vendor final invoice dan agreed quotation:
  - Admin flag the issue
  - Investigate cause:
    - Scope creep: Customer add extra requirements after deal
    - Material cost increase: Vendor material costs went up
    - Miscalculation: Error in original quotation
  - Resolution options:
    1. **Absorb cost**: Company bear the difference (maintain customer satisfaction)
    2. **Pass to customer**: Inform customer ada additional cost, request approval
    3. **Negotiate dengan vendor**: Vendor absorb cost atau split difference
  - Record resolution decision dan impact to profitability

### Scalability Scenarios

**Future: Internal Production Capability**
- Ketika PT CEX develop in-house workshop:
  - Same order schema dapat digunakan
  - `production_type` = `internal`
  - Workflow adjustments:
    - No vendor sourcing/negotiation phase
    - Direct to production scheduling
    - Material inventory check dan procurement
    - Internal cost calculation:
      - Material costs (from inventory)
      - Labor costs (hourly rate × estimated hours)
      - Machine/equipment costs (depreciation atau rental)
      - Overhead allocation (electricity, rent, etc.)
    - Production tracking dengan workstation/machine assignment
    - Internal QC process before final payment collection
  - Pricing advantage: Lower cost compared to vendor (no vendor markup)
  - Control advantage: Direct control over quality dan timeline

**Multi-Business Type Expansion**
- Schema flexible untuk bisnis lain (non-etching):
  - Custom fields configuration via `settings` table per tenant
  - Production type dapat extended: `dropship`, `print_on_demand`, `manufacturing`, etc.
  - Workflow customization via status configuration
  - Integration capability dengan external systems (ERP, marketplace, etc.)

---

## DATABASE SCHEMA

### Table 1: `purchase_orders` (Tenant Schema)

Tabel utama untuk menyimpan purchase order dari customer.

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE purchase_orders (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Order Identification
    order_code VARCHAR(50) NOT NULL UNIQUE,
    order_number INTEGER NOT NULL,
    
    -- Customer Information
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_company VARCHAR(255),
    customer_type VARCHAR(20) DEFAULT 'individual' CHECK (customer_type IN ('individual', 'business')),
    
    -- Vendor Information
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    vendor_name VARCHAR(255),
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Production Details
    production_type VARCHAR(20) DEFAULT 'vendor' CHECK (production_type IN ('internal', 'vendor')),
    production_status VARCHAR(50) DEFAULT 'pending',
    
    -- Order Status
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN (
        'new',
        'sourcing_vendor',
        'vendor_negotiation',
        'customer_quotation',
        'waiting_customer_approval',
        'waiting_payment',
        'payment_received',
        'in_production',
        'design_finalization',
        'material_preparation',
        'etching_process',
        'finishing',
        'quality_control',
        'quality_check_passed',
        'revision_required',
        'production_complete',
        'ready_to_ship',
        'shipped',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'completed',
        'cancelled',
        'refunded',
        'on_hold'
    )),
    
    -- Payment Status
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN (
        'unpaid',
        'awaiting_verification',
        'partially_paid',
        'paid',
        'refunded',
        'cancelled'
    )),
    accounting_status VARCHAR(50) DEFAULT 'pending' CHECK (accounting_status IN (
        'pending',
        'account_payable',
        'account_receivable',
        'fully_settled'
    )),
    
    -- Order Items Summary
    total_items INTEGER DEFAULT 0,
    total_quantity INTEGER DEFAULT 0,
    
    -- Pricing (Customer Side)
    subtotal DECIMAL(15,2) DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 11.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    shipping_cost DECIMAL(15,2) DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    additional_cost DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    
    -- Pricing (Vendor Side - for profitability tracking)
    vendor_subtotal DECIMAL(15,2) DEFAULT 0.00,
    vendor_total DECIMAL(15,2) DEFAULT 0.00,
    vendor_currency VARCHAR(3) DEFAULT 'IDR',
    
    -- Profitability
    markup_amount DECIMAL(15,2) DEFAULT 0.00,
    markup_percentage DECIMAL(5,2) DEFAULT 0.00,
    profit_amount DECIMAL(15,2) DEFAULT 0.00,
    profit_margin DECIMAL(5,2) DEFAULT 0.00,
    
    -- Payment Tracking
    dp_percentage DECIMAL(5,2) DEFAULT 50.00,
    dp_amount DECIMAL(15,2) DEFAULT 0.00,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    remaining_amount DECIMAL(15,2) DEFAULT 0.00,
    
    -- Addresses
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100),
    shipping_province VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(100) DEFAULT 'Indonesia',
    
    billing_address TEXT,
    billing_city VARCHAR(100),
    billing_province VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(100) DEFAULT 'Indonesia',
    billing_same_as_shipping BOOLEAN DEFAULT TRUE,
    
    -- Timeline
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    customer_approval_date TIMESTAMP WITH TIME ZONE,
    payment_received_date TIMESTAMP WITH TIME ZONE,
    production_start_date TIMESTAMP WITH TIME ZONE,
    estimated_completion_date DATE,
    actual_completion_date DATE,
    shipped_date TIMESTAMP WITH TIME ZONE,
    delivered_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    cancelled_date TIMESTAMP WITH TIME ZONE,
    
    -- Design & Files
    design_files JSONB DEFAULT '[]'::jsonb,
    has_design_files BOOLEAN DEFAULT FALSE,
    
    -- Notes & Communication
    customer_notes TEXT,
    internal_notes TEXT,
    admin_notes TEXT,
    cancellation_reason TEXT,
    rejection_reason TEXT,
    
    -- Quality Control
    qc_status VARCHAR(50),
    qc_notes TEXT,
    qc_passed BOOLEAN DEFAULT FALSE,
    qc_checked_at TIMESTAMP WITH TIME ZONE,
    qc_checked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Quotation References
    customer_quotation_id UUID,
    vendor_quotation_id UUID,
    quotation_version INTEGER DEFAULT 1,
    quotation_valid_until DATE,
    
    -- Tags & Classification
    tags JSONB DEFAULT '[]'::jsonb,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_rush_order BOOLEAN DEFAULT FALSE,
    rush_fee DECIMAL(15,2) DEFAULT 0.00,
    
    -- Integration
    external_id VARCHAR(255),
    external_source VARCHAR(100),
    integration_data JSONB,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT purchase_orders_total_positive CHECK (total_amount >= 0),
    CONSTRAINT purchase_orders_vendor_total_positive CHECK (vendor_total IS NULL OR vendor_total >= 0),
    CONSTRAINT purchase_orders_paid_lte_total CHECK (paid_amount <= total_amount)
);

-- Indexes for Performance
CREATE INDEX idx_purchase_orders_order_code ON purchase_orders(order_code);
CREATE INDEX idx_purchase_orders_customer_id ON purchase_orders(customer_id);
CREATE INDEX idx_purchase_orders_vendor_id ON purchase_orders(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_payment_status ON purchase_orders(payment_status);
CREATE INDEX idx_purchase_orders_accounting_status ON purchase_orders(accounting_status);
CREATE INDEX idx_purchase_orders_production_type ON purchase_orders(production_type);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX idx_purchase_orders_estimated_completion ON purchase_orders(estimated_completion_date);
CREATE INDEX idx_purchase_orders_deleted_at ON purchase_orders(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_purchase_orders_tags ON purchase_orders USING GIN (tags);
CREATE INDEX idx_purchase_orders_priority ON purchase_orders(priority) WHERE priority IN ('high', 'urgent');
CREATE INDEX idx_purchase_orders_rush_order ON purchase_orders(is_rush_order) WHERE is_rush_order = TRUE;

-- Full-text Search
CREATE INDEX idx_purchase_orders_search ON purchase_orders USING GIN (
    to_tsvector('indonesian', 
        order_code || ' ' || 
        customer_name || ' ' || 
        COALESCE(customer_email, '') || ' ' || 
        COALESCE(customer_phone, '') || ' ' ||
        COALESCE(customer_notes, '') || ' ' ||
        COALESCE(internal_notes, '')
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_purchase_orders_updated_at
BEFORE UPDATE ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE purchase_orders IS 'Main table for customer purchase orders in broker/vendor model';
COMMENT ON COLUMN purchase_orders.order_code IS 'Format: ORD-YYYY-MM-NNNN';
COMMENT ON COLUMN purchase_orders.production_type IS 'internal: in-house production, vendor: outsource to vendor';
COMMENT ON COLUMN purchase_orders.accounting_status IS 'account_payable: DP paid (50%), account_receivable: Fully paid (100%)';
COMMENT ON COLUMN purchase_orders.dp_percentage IS 'Down payment percentage (default 50%)';
COMMENT ON COLUMN purchase_orders.markup_percentage IS 'Profit markup from vendor price to customer price';
COMMENT ON COLUMN purchase_orders.profit_margin IS 'Calculated: (profit_amount / total_amount) × 100%';
```

### Table 2: `order_items` (Tenant Schema)

Items yang dipesan dalam setiap purchase order.

```sql
CREATE TABLE order_items (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Order Reference
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    
    -- Product Information
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    product_slug VARCHAR(255),
    
    -- Quantity & Pricing
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(15,2) NOT NULL CHECK (unit_price >= 0),
    subtotal DECIMAL(15,2) NOT NULL CHECK (subtotal >= 0),
    
    -- Vendor Pricing (for profitability)
    vendor_unit_price DECIMAL(15,2),
    vendor_subtotal DECIMAL(15,2),
    
    -- Customization Fields (Etching-specific)
    bahan VARCHAR(100),
    kualitas VARCHAR(100) DEFAULT 'standard',
    ketebalan VARCHAR(100),
    ukuran VARCHAR(100),
    warna_background VARCHAR(7),
    warna_text VARCHAR(7),
    
    -- Custom Text Placement
    custom_text TEXT,
    custom_text_placement VARCHAR(50),
    custom_text_position JSONB,
    custom_text_font VARCHAR(100),
    custom_text_size INTEGER,
    
    -- Design Files
    design_file_url TEXT,
    design_file_name VARCHAR(255),
    design_file_size INTEGER,
    design_notes TEXT,
    
    -- Additional Customization (Flexible for any business)
    customization JSONB DEFAULT '{}'::jsonb,
    specifications JSONB DEFAULT '{}'::jsonb,
    
    -- Item Notes
    notes TEXT,
    internal_notes TEXT,
    
    -- Status
    item_status VARCHAR(50) DEFAULT 'pending',
    is_custom BOOLEAN DEFAULT FALSE,
    requires_design_approval BOOLEAN DEFAULT FALSE,
    design_approved BOOLEAN DEFAULT FALSE,
    design_approved_at TIMESTAMP WITH TIME ZONE,
    design_approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT order_items_subtotal_matches CHECK (subtotal = quantity * unit_price)
);

-- Indexes
CREATE INDEX idx_order_items_purchase_order_id ON order_items(purchase_order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_order_items_status ON order_items(item_status);
CREATE INDEX idx_order_items_customization ON order_items USING GIN (customization);
CREATE INDEX idx_order_items_deleted_at ON order_items(deleted_at) WHERE deleted_at IS NULL;

-- Trigger
CREATE TRIGGER update_order_items_updated_at
BEFORE UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE order_items IS 'Individual items within purchase orders with customization details';
COMMENT ON COLUMN order_items.customization IS 'Flexible JSON for any custom requirements per tenant';
COMMENT ON COLUMN order_items.bahan IS 'Material: Akrilik, Kuningan, Tembaga, Stainless Steel, Aluminum';
COMMENT ON COLUMN order_items.kualitas IS 'Quality: standard, premium';
```

### Table 3: `order_quotations` (Tenant Schema)

Quotation/penawaran harga untuk customer dan vendor.

```sql
CREATE TABLE order_quotations (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Order Reference
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    
    -- Quotation Type
    quotation_type VARCHAR(20) NOT NULL CHECK (quotation_type IN ('vendor', 'customer')),
    quotation_number VARCHAR(50) NOT NULL UNIQUE,
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Party Information
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    vendor_name VARCHAR(255),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    
    -- Pricing Details
    base_price DECIMAL(15,2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    
    -- Additional Costs
    material_cost DECIMAL(15,2) DEFAULT 0.00,
    labor_cost DECIMAL(15,2) DEFAULT 0.00,
    overhead_cost DECIMAL(15,2) DEFAULT 0.00,
    shipping_cost DECIMAL(15,2) DEFAULT 0.00,
    rush_fee DECIMAL(15,2) DEFAULT 0.00,
    
    -- Tax & Discounts
    tax_rate DECIMAL(5,2) DEFAULT 11.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    
    -- Total
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    
    -- Markup (for customer quotations)
    markup_type VARCHAR(20) CHECK (markup_type IN ('percentage', 'fixed')),
    markup_value DECIMAL(15,2),
    markup_amount DECIMAL(15,2),
    
    -- Lead Time
    estimated_lead_time_days INTEGER NOT NULL,
    estimated_start_date DATE,
    estimated_completion_date DATE,
    
    -- Terms & Conditions
    payment_terms TEXT,
    payment_method_allowed JSONB DEFAULT '["cash","bank_transfer"]'::jsonb,
    dp_required BOOLEAN DEFAULT TRUE,
    dp_percentage DECIMAL(5,2) DEFAULT 50.00,
    dp_amount DECIMAL(15,2),
    
    -- Validity
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
        'draft',
        'sent',
        'pending_review',
        'approved',
        'rejected',
        'expired',
        'cancelled',
        'superseded'
    )),
    
    -- Approval Tracking
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    terms_conditions TEXT,
    
    -- Attachments
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Previous Version Reference
    previous_version_id UUID REFERENCES order_quotations(id) ON DELETE SET NULL,
    superseded_by_id UUID REFERENCES order_quotations(id) ON DELETE SET NULL,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_order_quotations_purchase_order_id ON order_quotations(purchase_order_id);
CREATE INDEX idx_order_quotations_quotation_number ON order_quotations(quotation_number);
CREATE INDEX idx_order_quotations_vendor_id ON order_quotations(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX idx_order_quotations_customer_id ON order_quotations(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_order_quotations_type ON order_quotations(quotation_type);
CREATE INDEX idx_order_quotations_status ON order_quotations(status);
CREATE INDEX idx_order_quotations_valid_until ON order_quotations(valid_until);
CREATE INDEX idx_order_quotations_version ON order_quotations(purchase_order_id, version);
CREATE INDEX idx_order_quotations_deleted_at ON order_quotations(deleted_at) WHERE deleted_at IS NULL;

-- Trigger
CREATE TRIGGER update_order_quotations_updated_at
BEFORE UPDATE ON order_quotations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE order_quotations IS 'Price quotations for vendors and customers with versioning';
COMMENT ON COLUMN order_quotations.quotation_type IS 'vendor: quotation from vendor, customer: quotation to customer';
COMMENT ON COLUMN order_quotations.quotation_number IS 'Format: VQ-YYYY-MM-NNNN (vendor) or CQ-YYYY-MM-NNNN (customer)';
COMMENT ON COLUMN order_quotations.version IS 'Version number for tracking quote revisions';
COMMENT ON COLUMN order_quotations.markup_amount IS 'Profit markup added to vendor price for customer quotation';
```

### Table 4: `order_negotiations` (Tenant Schema)

History negosiasi harga dengan vendor.

```sql
CREATE TABLE order_negotiations (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Order Reference
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    quotation_id UUID REFERENCES order_quotations(id) ON DELETE SET NULL,
    
    -- Negotiation Details
    negotiation_round INTEGER NOT NULL DEFAULT 1,
    negotiation_type VARCHAR(50) NOT NULL CHECK (negotiation_type IN (
        'initial_request',
        'vendor_response',
        'counter_offer',
        'final_offer',
        'acceptance',
        'rejection'
    )),
    
    -- Pricing Offered
    offered_price DECIMAL(15,2) NOT NULL,
    offered_lead_time_days INTEGER NOT NULL,
    minimum_quantity INTEGER,
    
    -- Previous vs Current
    previous_price DECIMAL(15,2),
    price_difference DECIMAL(15,2),
    price_change_percentage DECIMAL(5,2),
    
    -- Terms
    payment_terms TEXT,
    special_conditions TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'sent',
        'received',
        'accepted',
        'rejected',
        'countered',
        'expired'
    )),
    
    -- Response
    response_deadline TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    response_message TEXT,
    
    -- Rejection/Acceptance
    decision VARCHAR(50) CHECK (decision IN ('accepted', 'rejected', 'countered', 'pending')),
    decision_reason TEXT,
    decided_at TIMESTAMP WITH TIME ZONE,
    decided_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Communication
    sent_via VARCHAR(50) DEFAULT 'email' CHECK (sent_via IN ('email', 'phone', 'whatsapp', 'in_person', 'system')),
    communication_log TEXT,
    
    -- Attachments
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    vendor_notes TEXT,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_order_negotiations_purchase_order_id ON order_negotiations(purchase_order_id);
CREATE INDEX idx_order_negotiations_vendor_id ON order_negotiations(vendor_id);
CREATE INDEX idx_order_negotiations_quotation_id ON order_negotiations(quotation_id) WHERE quotation_id IS NOT NULL;
CREATE INDEX idx_order_negotiations_status ON order_negotiations(status);
CREATE INDEX idx_order_negotiations_decision ON order_negotiations(decision);
CREATE INDEX idx_order_negotiations_round ON order_negotiations(purchase_order_id, negotiation_round);
CREATE INDEX idx_order_negotiations_created_at ON order_negotiations(created_at DESC);

-- Trigger
CREATE TRIGGER update_order_negotiations_updated_at
BEFORE UPDATE ON order_negotiations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE order_negotiations IS 'Complete negotiation history with vendors including all rounds and counter-offers';
COMMENT ON COLUMN order_negotiations.negotiation_round IS 'Round number: 1 = initial, 2+ = counter-offers';
COMMENT ON COLUMN order_negotiations.negotiation_type IS 'Type of communication in this negotiation round';
```

### Table 5: `order_payments` (Tenant Schema)

Payment tracking untuk customer dan vendor payments.

```sql
CREATE TABLE order_payments (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Order Reference
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    
    -- Payment Type
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('customer_payment', 'vendor_payment')),
    payment_for VARCHAR(20) NOT NULL CHECK (payment_for IN ('dp', 'full', 'remaining', 'refund', 'adjustment')),
    
    -- Invoice Reference
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    quotation_id UUID REFERENCES order_quotations(id) ON DELETE SET NULL,
    
    -- Party Information
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    vendor_name VARCHAR(255),
    
    -- Payment Details
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'IDR',
    
    -- Payment Method
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN (
        'cash',
        'bank_transfer',
        'credit_card',
        'debit_card',
        'ewallet',
        'midtrans',
        'xendit',
        'stripe',
        'paypal',
        'other'
    )),
    payment_gateway VARCHAR(100),
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    
    -- Bank Transfer Details
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(100),
    bank_account_holder VARCHAR(255),
    transfer_reference VARCHAR(255),
    
    -- Payment Proof
    proof_of_payment_url VARCHAR(500),
    proof_uploaded_at TIMESTAMP WITH TIME ZONE,
    proof_uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'awaiting_verification',
        'verified',
        'processing',
        'completed',
        'failed',
        'cancelled',
        'refunded'
    )),
    
    -- Timeline
    payment_date TIMESTAMP WITH TIME ZONE,
    due_date DATE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    
    -- Verification
    verification_notes TEXT,
    verification_status VARCHAR(50) DEFAULT 'pending',
    requires_manual_verification BOOLEAN DEFAULT FALSE,
    auto_verified BOOLEAN DEFAULT FALSE,
    
    -- Refund Information
    refund_amount DECIMAL(15,2),
    refund_date TIMESTAMP WITH TIME ZONE,
    refund_reason TEXT,
    refund_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    customer_notes TEXT,
    
    -- Receipt
    receipt_number VARCHAR(50),
    receipt_url VARCHAR(500),
    receipt_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Accounting Integration
    accounting_entry_id VARCHAR(100),
    accounting_synced_at TIMESTAMP WITH TIME ZONE,
    accounting_status VARCHAR(50),
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_order_payments_purchase_order_id ON order_payments(purchase_order_id);
CREATE INDEX idx_order_payments_invoice_number ON order_payments(invoice_number);
CREATE INDEX idx_order_payments_customer_id ON order_payments(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_order_payments_vendor_id ON order_payments(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX idx_order_payments_type ON order_payments(payment_type);
CREATE INDEX idx_order_payments_for ON order_payments(payment_for);
CREATE INDEX idx_order_payments_method ON order_payments(payment_method);
CREATE INDEX idx_order_payments_status ON order_payments(status);
CREATE INDEX idx_order_payments_payment_date ON order_payments(payment_date);
CREATE INDEX idx_order_payments_due_date ON order_payments(due_date);
CREATE INDEX idx_order_payments_gateway_transaction ON order_payments(gateway_transaction_id) WHERE gateway_transaction_id IS NOT NULL;
CREATE INDEX idx_order_payments_deleted_at ON order_payments(deleted_at) WHERE deleted_at IS NULL;

-- Trigger
CREATE TRIGGER update_order_payments_updated_at
BEFORE UPDATE ON order_payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE order_payments IS 'Payment tracking for both customer payments and vendor payments';
COMMENT ON COLUMN order_payments.payment_type IS 'customer_payment: from customer, vendor_payment: to vendor';
COMMENT ON COLUMN order_payments.payment_for IS 'dp: down payment, full: full payment, remaining: balance payment';
COMMENT ON COLUMN order_payments.invoice_number IS 'Format: INV-YYYY-MM-NNNN (customer) or VINV-YYYY-MM-NNNN (vendor)';
COMMENT ON COLUMN order_payments.auto_verified IS 'TRUE if verified via payment gateway webhook automatically';
```

### Table 6: `order_shipments` (Tenant Schema)

Shipping and delivery tracking information.

```sql
CREATE TABLE order_shipments (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Order Reference
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    
    -- Shipment Identification
    shipment_number VARCHAR(50) NOT NULL UNIQUE,
    tracking_number VARCHAR(255),
    
    -- Shipping Provider
    courier_name VARCHAR(100) NOT NULL,
    courier_service VARCHAR(100),
    courier_phone VARCHAR(50),
    
    -- Shipping Details
    shipping_method VARCHAR(50) DEFAULT 'standard' CHECK (shipping_method IN (
        'standard',
        'express',
        'same_day',
        'next_day',
        'pickup',
        'courier'
    )),
    
    -- Package Details
    package_count INTEGER DEFAULT 1 CHECK (package_count > 0),
    weight_kg DECIMAL(10,2),
    dimensions_cm VARCHAR(50),
    special_handling TEXT,
    
    -- Addresses
    pickup_address TEXT,
    pickup_contact_name VARCHAR(255),
    pickup_contact_phone VARCHAR(50),
    pickup_notes TEXT,
    
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100),
    shipping_province VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(100) DEFAULT 'Indonesia',
    shipping_contact_name VARCHAR(255) NOT NULL,
    shipping_contact_phone VARCHAR(50) NOT NULL,
    shipping_notes TEXT,
    
    -- Costs
    shipping_cost DECIMAL(15,2) DEFAULT 0.00,
    insurance_cost DECIMAL(15,2) DEFAULT 0.00,
    additional_fee DECIMAL(15,2) DEFAULT 0.00,
    total_cost DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'IDR',
    paid_by VARCHAR(20) CHECK (paid_by IN ('sender', 'recipient', 'third_party')),
    
    -- Status
    status VARCHAR(50) DEFAULT 'preparing' CHECK (status IN (
        'preparing',
        'ready_to_ship',
        'picked_up',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'failed_delivery',
        'returned',
        'cancelled'
    )),
    
    -- Timeline
    prepared_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    picked_up_at TIMESTAMP WITH TIME ZONE,
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery Confirmation
    delivered_to VARCHAR(255),
    delivery_signature_url VARCHAR(500),
    delivery_photo_url VARCHAR(500),
    delivery_notes TEXT,
    received_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- POD (Proof of Delivery)
    pod_url VARCHAR(500),
    pod_uploaded_at TIMESTAMP WITH TIME ZONE,
    pod_verified BOOLEAN DEFAULT FALSE,
    pod_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Tracking Updates
    last_tracking_update TIMESTAMP WITH TIME ZONE,
    last_tracking_status VARCHAR(255),
    last_tracking_location VARCHAR(255),
    tracking_history JSONB DEFAULT '[]'::jsonb,
    
    -- Issues
    has_issues BOOLEAN DEFAULT FALSE,
    issue_type VARCHAR(100),
    issue_description TEXT,
    issue_resolved BOOLEAN DEFAULT FALSE,
    issue_resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Return/Exchange
    is_return BOOLEAN DEFAULT FALSE,
    return_reason TEXT,
    return_approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    customer_notes TEXT,
    courier_notes TEXT,
    
    -- Integration
    courier_api_response JSONB,
    external_shipment_id VARCHAR(255),
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_order_shipments_purchase_order_id ON order_shipments(purchase_order_id);
CREATE INDEX idx_order_shipments_shipment_number ON order_shipments(shipment_number);
CREATE INDEX idx_order_shipments_tracking_number ON order_shipments(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX idx_order_shipments_courier ON order_shipments(courier_name);
CREATE INDEX idx_order_shipments_status ON order_shipments(status);
CREATE INDEX idx_order_shipments_shipped_at ON order_shipments(shipped_at);
CREATE INDEX idx_order_shipments_estimated_delivery ON order_shipments(estimated_delivery_date);
CREATE INDEX idx_order_shipments_delivered_at ON order_shipments(delivered_at);
CREATE INDEX idx_order_shipments_has_issues ON order_shipments(has_issues) WHERE has_issues = TRUE;
CREATE INDEX idx_order_shipments_tracking_history ON order_shipments USING GIN (tracking_history);
CREATE INDEX idx_order_shipments_deleted_at ON order_shipments(deleted_at) WHERE deleted_at IS NULL;

-- Trigger
CREATE TRIGGER update_order_shipments_updated_at
BEFORE UPDATE ON order_shipments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE order_shipments IS 'Shipping and delivery tracking with courier integration support';
COMMENT ON COLUMN order_shipments.shipment_number IS 'Format: SHIP-YYYY-MM-NNNN';
COMMENT ON COLUMN order_shipments.tracking_number IS 'Courier/logistics tracking number (resi)';
COMMENT ON COLUMN order_shipments.tracking_history IS 'JSON array of tracking status updates with timestamps';
COMMENT ON COLUMN order_shipments.pod_url IS 'Proof of Delivery document/photo URL';
```

### Table 7: `order_status_history` (Tenant Schema)

Audit trail untuk semua perubahan status order.

```sql
CREATE TABLE order_status_history (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Order Reference
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    
    -- Status Change
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    status_type VARCHAR(50) DEFAULT 'order_status' CHECK (status_type IN (
        'order_status',
        'payment_status',
        'production_status',
        'shipping_status',
        'qc_status'
    )),
    
    -- Change Details
    change_reason TEXT,
    change_notes TEXT,
    automatic_change BOOLEAN DEFAULT FALSE,
    triggered_by_event VARCHAR(100),
    
    -- Related Records
    related_payment_id UUID REFERENCES order_payments(id) ON DELETE SET NULL,
    related_shipment_id UUID REFERENCES order_shipments(id) ON DELETE SET NULL,
    related_quotation_id UUID REFERENCES order_quotations(id) ON DELETE SET NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Notification
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    notification_recipients JSONB,
    
    -- Attachments
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamp
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    changed_by_name VARCHAR(255),
    
    -- Duration in Previous Status
    time_in_previous_status_seconds INTEGER,
    
    -- Created timestamp (immutable)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_order_status_history_purchase_order_id ON order_status_history(purchase_order_id);
CREATE INDEX idx_order_status_history_to_status ON order_status_history(to_status);
CREATE INDEX idx_order_status_history_type ON order_status_history(status_type);
CREATE INDEX idx_order_status_history_changed_at ON order_status_history(changed_at DESC);
CREATE INDEX idx_order_status_history_changed_by ON order_status_history(changed_by) WHERE changed_by IS NOT NULL;
CREATE INDEX idx_order_status_history_order_changed ON order_status_history(purchase_order_id, changed_at DESC);
CREATE INDEX idx_order_status_history_automatic ON order_status_history(automatic_change) WHERE automatic_change = TRUE;
CREATE INDEX idx_order_status_history_metadata ON order_status_history USING GIN (metadata);

-- Comments
COMMENT ON TABLE order_status_history IS 'Complete audit trail for all order status changes';
COMMENT ON COLUMN order_status_history.status_type IS 'Type of status being tracked';
COMMENT ON COLUMN order_status_history.automatic_change IS 'TRUE if changed automatically by system (e.g., payment gateway webhook)';
COMMENT ON COLUMN order_status_history.triggered_by_event IS 'System event that triggered the change (e.g., payment_verified, shipment_delivered)';
COMMENT ON COLUMN order_status_history.time_in_previous_status_seconds IS 'Duration order spent in previous status for SLA tracking';
```

---

## RELATIONSHIP DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ORDER MANAGEMENT SYSTEM                             │
│                       Entity Relationship Diagram                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐           ┌──────────────────┐
│    customers     │◄──────────│ purchase_orders  │
└──────────────────┘    1:N    └──────────────────┘
                                       │ 1:N
                                       │
                                       ▼
                              ┌──────────────────┐
                              │   order_items    │
                              └──────────────────┘
                                       
┌──────────────────┐           ┌──────────────────┐
│     vendors      │◄──────────│ purchase_orders  │
└──────────────────┘    1:N    └──────────────────┘
        │                              │
        │                              │ 1:N
        │ 1:N                          ▼
        │                      ┌──────────────────┐
        │                      │order_quotations  │
        │                      └──────────────────┘
        │                              ▲
        │                              │
        │                              │ N:1
        ▼                              │
┌──────────────────┐                   │
│order_negotiations│───────────────────┘
└──────────────────┘

┌──────────────────┐           ┌──────────────────┐
│ purchase_orders  │───────────│  order_payments  │
└──────────────────┘    1:N    └──────────────────┘

┌──────────────────┐           ┌──────────────────┐
│ purchase_orders  │───────────│ order_shipments  │
└──────────────────┘    1:N    └──────────────────┘

┌──────────────────┐           ┌──────────────────┐
│ purchase_orders  │───────────│order_status_     │
└──────────────────┘    1:N    │    history       │
                                └──────────────────┘

┌──────────────────┐
│     products     │
└──────────────────┘
         ▲
         │ N:1
         │
┌──────────────────┐
│   order_items    │
└──────────────────┘

Legend:
  1:N  = One-to-Many relationship
  N:1  = Many-to-One relationship
  ◄─── = Foreign Key reference
```

---

## BUSINESS RULES

### Order Creation & Validation

**1. Order Code Generation**
- Format: `ORD-{YYYY}-{MM}-{NNNN}`
- Auto-increment per month, reset setiap bulan
- Example: `ORD-2025-01-0001`, `ORD-2025-01-0002`, ..., `ORD-2025-02-0001`
- Unique constraint enforced

**2. Customer Information**
- Customer ID must exist in customers table (FK constraint)
- Customer email must be valid email format
- Customer phone must be valid Indonesian phone format (+62 atau 08)
- Customer type: `individual` atau `business`
  - Jika `business`, `customer_company` field required

**3. Minimum Order Value**
- Total amount must be > 0
- Per-tenant configurable minimum order value via settings

**4. Payment Terms**
- DP minimum: 50% dari total_amount (configurable per tenant)
- DP maximum: < 100% (sisanya untuk final payment)
- Full payment: 100% dari total_amount
- Payment allocation:
  - `dp_percentage` × `total_amount` = `dp_amount`
  - `total_amount` - `dp_amount` = `remaining_amount`

**5. Vendor Assignment**
- Vendor ID must exist in vendors table
- Vendor status must be `active`
- Vendor overall_rating must >= minimum threshold (default: 3.0/5.0)
- Vendor specializations must match order requirements
- Rule: Vendor DP payment < Customer DP received (maintain cash flow)

### Pricing & Profitability

**1. Markup Calculation**
- Markup type: `percentage` atau `fixed`
- If percentage: `markup_amount` = `vendor_subtotal` × (`markup_percentage` / 100)
- If fixed: `markup_amount` = fixed value
- Customer subtotal = `vendor_subtotal` + `markup_amount`

**2. Tax Calculation**
- Default tax_rate: 11% (PPN Indonesia)
- Configurable per tenant
- `tax_amount` = `subtotal` × (`tax_rate` / 100)

**3. Total Amount**
- Formula: `total_amount` = `subtotal` + `tax_amount` + `shipping_cost` - `discount_amount` + `additional_cost` + `rush_fee`
- Must always be calculated dari components, tidak boleh arbitrary value

**4. Profit Calculation**
- `profit_amount` = `total_amount` - `vendor_total` - `shipping_cost` - `additional_cost`
- `profit_margin` = (`profit_amount` / `total_amount`) × 100%
- Minimum profit margin enforced via settings (default: 10%)

### Status Transitions

**1. Order Status Workflow**

Valid transitions:
```
new → sourcing_vendor → vendor_negotiation → customer_quotation 
    → waiting_customer_approval → waiting_payment → payment_received 
    → in_production → production_complete → quality_check_passed 
    → ready_to_ship → shipped → delivered → completed

Cancelable from: new, sourcing_vendor, vendor_negotiation, waiting_customer_approval, waiting_payment
On Hold from: Any status except completed, cancelled
```

**2. Payment Status Workflow**

Valid transitions:
```
unpaid → awaiting_verification → partially_paid → paid → completed
unpaid → cancelled
paid → refunded
```

**3. Production Status Workflow**

Valid transitions:
```
pending → design_finalization → material_preparation → etching_process 
    → finishing → quality_control → ready_for_pickup
```

### Quotation Rules

**1. Quotation Validity**
- Default validity: 7 days from creation
- Configurable per tenant
- Expired quotations cannot be approved
- New version must be created untuk re-quote

**2. Quotation Versioning**
- Version auto-increment untuk same order
- Previous version status → `superseded`
- Link to previous_version_id untuk audit trail
- Active quotation: status `sent` atau `pending_review`

**3. Quotation Approval**
- Customer quotation requires customer approval
- Vendor quotation requires admin approval
- Approval timestamp dan user_id tracked
- Rejection must include reason

### Negotiation Rules

**1. Negotiation Rounds**
- Round 1: Initial request dari admin
- Round 2+: Counter-offers
- Max rounds configurable (default: 5 rounds)
- After max rounds, auto-reject atau escalate ke management

**2. Price Changes**
- Each round must have different price atau lead time
- Price difference calculated automatically
- Price change percentage tracked
- Reason required jika price increase

**3. Response Timeline**
- Default response deadline: 3 business days
- Configurable per vendor atau per order priority
- Escalation jika vendor tidak respond by deadline
- Auto-reject after deadline + grace period (configurable)

### Payment Rules

**1. Payment Verification**
- Manual verification required untuk bank transfer dan cash
- Auto-verification untuk payment gateway (webhook)
- Verification must match invoice amount (tolerance: 0.1%)
- Proof of payment required untuk manual verification

**2. Payment Allocation**
- First payment: Allocate to DP (if DP model chosen)
- Subsequent payments: Allocate to remaining amount
- Total paid cannot exceed total amount
- Overpayment triggers refund workflow

**3. Vendor Payment Rules**
- Vendor DP payment only after customer DP received dan verified
- Vendor DP amount < Customer DP amount (rule enforced)
- Vendor final payment after production complete dan QC pass
- Payment proof required untuk all vendor payments

### Shipping Rules

**1. Shipping Eligibility**
- Payment status must be `paid` atau `partially_paid` (if full payment not required)
- Production status must be `ready_for_pickup` atau `production_complete`
- QC status must be `passed` (if QC required)

**2. Tracking Requirements**
- Courier name required
- Tracking number recommended (warning if empty)
- Estimated delivery date required
- Shipping address must be valid

**3. Delivery Confirmation**
- POD (Proof of Delivery) required untuk high-value orders (configurable threshold)
- Signature atau photo recommended
- Auto-complete after X days if no complaint (default: 7 days)

### Quality Control Rules

**1. QC Requirements**
- QC required untuk all orders (configurable per tenant atau per product type)
- QC checklist defined per product category
- Photos required untuk documentation
- QC pass required sebelum shipping

**2. QC Failure**
- If QC fail, status → `revision_required`
- Vendor notified dengan issue details
- Revision timeline negotiated
- Re-QC after revision complete

### Data Integrity

**1. Soft Delete**
- Orders cannot be hard deleted (compliance requirement)
- Soft delete via `deleted_at` timestamp
- Deleted orders excluded from reports by default
- Restore capability via admin panel

**2. Audit Trail**
- All status changes logged in `order_status_history`
- User ID dan timestamp required untuk all changes
- Change reason recommended, required untuk critical changes
- Automatic changes flagged (`automatic_change` = TRUE)

**3. Referential Integrity**
- Customer deletion blocked if active orders exist (RESTRICT)
- Vendor deletion allowed, vendor_id set to NULL (SET NULL)
- Product deletion allowed, product_id set to NULL (SET NULL)
- User deletion allowed, user references set to NULL (SET NULL)

---

## API ENDPOINTS

### Base URL

```
/api/v1/admin/orders
```

### Public Endpoints (Customer-facing)

#### POST /api/v1/orders (Create New Order)

Create order baru dari customer (walk-in, phone, atau website).

**Request:**
```json
{
  "customer": {
    "customer_id": "uuid", 
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "phone": "+62812345678",
    "company": "PT Example",
    "type": "business"
  },
  "items": [
    {
      "product_id": "uuid",
      "quantity": 5,
      "customization": {
        "bahan": "Kuningan",
        "kualitas": "premium",
        "ketebalan": "2mm",
        "ukuran": "30cm x 20cm",
        "warna_background": "#FFFFFF",
        "custom_text": "Best Employee 2025",
        "custom_text_placement": "center"
      },
      "design_file_url": "https://..."
    }
  ],
  "shipping_address": {
    "address": "Jl. Sudirman No. 123",
    "city": "Jakarta Pusat",
    "province": "DKI Jakarta",
    "postal_code": "10110",
    "country": "Indonesia"
  },
  "customer_notes": "Please pack carefully",
  "priority": "normal"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_code": "ORD-2025-01-0001",
    "status": "new",
    "total_amount": 0,
    "currency": "IDR",
    "customer": { ... },
    "items": [ ... ],
    "created_at": "2025-01-15T10:30:00Z"
  },
  "message": "Order created successfully. Our team will contact you shortly."
}
```

---

### Admin Endpoints

#### GET /api/v1/admin/orders (List All Orders)

Retrieve paginated list of orders dengan filtering.

**Query Parameters:**
- `status` - Filter by status (e.g., `new`, `in_production`)
- `payment_status` - Filter by payment status
- `production_type` - Filter by `internal` or `vendor`
- `customer_id` - Filter by customer
- `vendor_id` - Filter by vendor
- `date_from` - Filter orders from date (YYYY-MM-DD)
- `date_to` - Filter orders to date (YYYY-MM-DD)
- `search` - Search order_code, customer name, email, phone
- `priority` - Filter by priority
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sort` - Sort field (default: created_at)
- `order` - Sort order: `asc` or `desc` (default: desc)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "order_code": "ORD-2025-01-0001",
        "customer_name": "Budi Santoso",
        "customer_email": "budi@example.com",
        "status": "in_production",
        "payment_status": "partially_paid",
        "total_amount": 1750000,
        "paid_amount": 875000,
        "remaining_amount": 875000,
        "vendor_name": "PT Vendor ABC",
        "order_date": "2025-01-15",
        "estimated_completion_date": "2025-01-25"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 10,
      "per_page": 20,
      "total_items": 200,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

#### GET /api/v1/admin/orders/:id (Get Order Details)

Retrieve complete order details including items, quotations, payments, shipments.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid",
      "order_code": "ORD-2025-01-0001",
      "status": "in_production",
      "payment_status": "partially_paid",
      "customer": { ... },
      "vendor": { ... },
      "items": [ ... ],
      "quotations": [ ... ],
      "payments": [ ... ],
      "shipments": [ ... ],
      "status_history": [ ... ],
      "pricing": {
        "subtotal": 1750000,
        "tax_rate": 11,
        "tax_amount": 192500,
        "shipping_cost": 50000,
        "total_amount": 1992500,
        "dp_percentage": 50,
        "dp_amount": 996250,
        "paid_amount": 996250,
        "remaining_amount": 996250,
        "vendor_total": 1400000,
        "profit_amount": 542500,
        "profit_margin": 27.23
      },
      "timeline": {
        "order_date": "2025-01-15T10:30:00Z",
        "payment_received_date": "2025-01-15T14:00:00Z",
        "production_start_date": "2025-01-16T08:00:00Z",
        "estimated_completion_date": "2025-01-25",
        "shipped_date": null,
        "delivered_date": null
      }
    }
  }
}
```

#### POST /api/v1/admin/orders/:id/assign-vendor (Assign Vendor)

Assign vendor untuk handle production.

**Request:**
```json
{
  "vendor_id": "uuid",
  "production_type": "vendor",
  "notes": "Vendor selected based on specialization and rating"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "order_id": "uuid",
    "vendor_id": "uuid",
    "vendor_name": "PT Vendor ABC",
    "assigned_at": "2025-01-15T11:00:00Z",
    "status": "vendor_negotiation"
  },
  "message": "Vendor assigned successfully"
}
```

#### POST /api/v1/admin/orders/:id/negotiations (Create Negotiation)

Create negotiation request ke vendor.

**Request:**
```json
{
  "vendor_id": "uuid",
  "offered_price": 280000,
  "offered_lead_time_days": 10,
  "payment_terms": "DP 30%, Full payment after delivery",
  "notes": "Please provide best price for 5 units",
  "send_email": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "negotiation_id": "uuid",
    "negotiation_round": 1,
    "status": "sent",
    "response_deadline": "2025-01-18T23:59:59Z"
  },
  "message": "Negotiation request sent to vendor"
}
```

#### PUT /api/v1/admin/orders/:id/quotations/:quotation_id/approve (Approve Quotation)

Approve quotation dari vendor atau kirim quotation ke customer.

**Request:**
```json
{
  "quotation_type": "vendor",
  "approval_notes": "Price acceptable, proceed with this vendor"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "quotation_id": "uuid",
    "status": "approved",
    "approved_at": "2025-01-16T09:00:00Z",
    "order_status": "customer_quotation"
  },
  "message": "Vendor quotation approved. Customer quotation will be generated."
}
```

#### POST /api/v1/admin/orders/:id/payments/verify (Verify Payment)

Verify customer payment (manual verification untuk bank transfer/cash).

**Request:**
```json
{
  "payment_id": "uuid",
  "verification_status": "verified",
  "verification_notes": "Payment verified, amount matches invoice",
  "verified_by": "uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "payment_id": "uuid",
    "status": "verified",
    "verified_at": "2025-01-16T10:00:00Z",
    "order_payment_status": "partially_paid",
    "order_status": "in_production"
  },
  "message": "Payment verified successfully. Production can start."
}
```

#### PATCH /api/v1/admin/orders/:id/status (Update Order Status)

Update order status manually.

**Request:**
```json
{
  "status": "quality_check_passed",
  "notes": "QC completed, all items meet specifications",
  "notify_customer": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "order_id": "uuid",
    "from_status": "quality_control",
    "to_status": "quality_check_passed",
    "changed_at": "2025-01-24T14:00:00Z",
    "notification_sent": true
  },
  "message": "Order status updated successfully"
}
```

#### POST /api/v1/admin/orders/:id/shipments (Create Shipment)

Create shipment record dan kirim barang.

**Request:**
```json
{
  "courier_name": "JNE",
  "courier_service": "REG",
  "tracking_number": "JNE123456789",
  "shipping_method": "standard",
  "estimated_delivery_date": "2025-01-27",
  "weight_kg": 2.5,
  "shipping_cost": 50000,
  "notify_customer": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "shipment_id": "uuid",
    "shipment_number": "SHIP-2025-01-0001",
    "tracking_number": "JNE123456789",
    "status": "shipped",
    "estimated_delivery_date": "2025-01-27",
    "tracking_url": "https://jne.co.id/track/JNE123456789"
  },
  "message": "Shipment created and customer notified"
}
```

#### GET /api/v1/admin/orders/:id/profitability (Get Profitability Report)

Calculate dan retrieve profitability report untuk completed order.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "order_code": "ORD-2025-01-0001",
    "customer_revenue": {
      "subtotal": 1750000,
      "tax_amount": 192500,
      "total_amount": 1942500
    },
    "vendor_costs": {
      "subtotal": 1400000,
      "total_amount": 1400000
    },
    "additional_costs": {
      "shipping": 50000,
      "packaging": 10000,
      "total": 60000
    },
    "profitability": {
      "gross_profit": 482500,
      "profit_margin_percentage": 24.84,
      "roi_percentage": 34.46
    }
  }
}
```

---

**Previous:** [07-REVIEWS.md](./07-REVIEWS.md)  
**Next:** [09-VENDORS.md](./09-VENDORS.md)
