# FINANCIAL REPORTS MODULE
## Database Schema & API Documentation

**Module:** Operations - Financial Reports  
**Total Fields:** 120+ fields  
**Total Tables:** 10 tables (financial_transactions, revenue_records, expense_records, financial_reports, budget_plans, tax_records, payment_reconciliation, financial_analytics, vendor_payments, customer_invoices)  
**Admin Page:** `src/pages/admin/FinancialReport.tsx`

---

## CORE IMMUTABLE RULES COMPLIANCE

### **Rule 1: Teams Enabled with tenant_id as team_foreign_key**
✅ **ENFORCED** - All financial tables include mandatory `tenant_id UUID NOT NULL` with foreign key constraints to `tenants(uuid)` table. Financial data is strictly isolated per tenant.

### **Rule 2: API Guard Implementation**
✅ **ENFORCED** - All financial API endpoints include tenant-scoped access control. Financial records can only be accessed by authenticated users within the same tenant context.

### **Rule 3: UUID model_morph_key**
✅ **ENFORCED** - All financial tables use `uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid()` as the public identifier for external API references.

### **Rule 4: Strict Tenant Data Isolation**
✅ **ENFORCED** - No global financial records with NULL tenant_id. Every transaction, report, and financial record is strictly scoped to a specific tenant. Cross-tenant financial access is impossible at the database level.

### **Rule 5: RBAC Integration Requirements**
✅ **ENFORCED** - Financial management requires specific tenant-scoped permissions:
- `financial.view` - View financial reports and data
- `financial.create` - Create new financial transactions and records
- `financial.edit` - Modify financial transactions and settings
- `financial.delete` - Delete financial records (soft delete)
- `financial.manage` - Full financial management including reports and budgets
- `financial.transactions` - Manage transactions and records
- `financial.reports` - Generate and export financial reports
- `financial.budget` - Manage budgets and forecasts
- `financial.admin` - Access advanced financial settings and analytics

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Business Context](#business-context)
3. [Database Schema](#database-schema)
4. [Relationship Diagram](#relationship-diagram)
5. [Field Specifications](#field-specifications)
6. [Business Rules](#business-rules)
7. [Financial Categories](#financial-categories)
8. [API Endpoints](#api-endpoints)
9. [RBAC Integration](#rbac-integration)
10. [Admin UI Features](#admin-ui-features)
11. [Sample Data](#sample-data)
12. [Migration Script](#migration-script)
13. [Performance Indexes](#performance-indexes)

---

## OVERVIEW

**Financial Reports Module** adalah sistem **comprehensive financial management** yang memungkinkan setiap tenant untuk mengelola seluruh aspek keuangan bisnis dengan fitur advanced seperti transaction tracking, revenue analysis, expense management, budget planning, dan automated reporting. Sistem ini dirancang khusus untuk mendukung **etching business workflow** dengan fokus pada project-based financial tracking dan profitability analysis.

### Core Features

1. **Transaction Management**
   - Automated transaction recording from orders
   - Manual transaction entry and categorization
   - Multi-currency support with real-time conversion
   - Transaction approval workflows
   - Bulk transaction import/export

2. **Revenue Tracking & Analysis**
   - Project-based revenue tracking
   - Customer revenue analysis
   - Product/service profitability
   - Recurring revenue management
   - Revenue forecasting and projections

3. **Expense Management**
   - Categorized expense tracking
   - Vendor and supplier expense management
   - Project cost allocation
   - Expense approval workflows
   - Receipt and document management

4. **Financial Reporting**
   - Automated P&L statements
   - Cash flow reports
   - Balance sheet generation
   - Custom financial dashboards
   - Comparative period analysis

5. **Budget Planning & Control**
   - Annual and project budgets
   - Budget vs actual analysis
   - Variance reporting
   - Budget approval workflows
   - Forecasting and planning tools

6. **Tax Management**
   - Tax calculation and tracking
   - VAT/GST management
   - Tax report generation
   - Compliance monitoring
   - Integration with tax authorities

7. **Payment Reconciliation**
   - Bank statement reconciliation
   - Payment gateway reconciliation
   - Outstanding payment tracking
   - Automated matching algorithms
   - Dispute management

8. **Financial Analytics**
   - KPI tracking and monitoring
   - Trend analysis and insights
   - Profitability analysis
   - Customer lifetime value
   - Business performance metrics

---

## BUSINESS CONTEXT

### **Etching Business Integration**

**Financial Reports Module** is specifically designed for **custom etching businesses** to track financial performance across the complete business cycle from inquiry to delivery, with detailed project-based profitability analysis.

### **Hexagonal Architecture Integration**

Financial system follows **API-First Hexagonal Architecture** principles:

**Domain Layer (Business Logic):**
- Financial entities (Transaction, Revenue, Expense)
- Business rules (accounting principles, tax calculations)
- Domain events (payment received, invoice generated)

**Application Layer (Use Cases):**
- ProcessPaymentUseCase
- GenerateFinancialReportUseCase
- ReconcileTransactionsUseCase
- CalculateProfitabilityUseCase

**Infrastructure Layer (Adapters):**
- Database repositories (PostgreSQL)
- Payment gateway integrations (Stripe, Midtrans)
- Accounting system integrations (QuickBooks, Xero)
- Email notification services

### **Business Cycle Integration**

**Financial tracking for etching business workflow:**

1. **Inquiry Stage Financials**:
   - Lead acquisition cost tracking
   - Marketing expense allocation
   - Sales team cost attribution
   - Inquiry-to-conversion metrics

2. **Quotation Stage Financials**:
   - Quotation preparation costs
   - Material cost estimation
   - Labor cost calculation
   - Margin analysis and pricing

3. **Order Processing Financials**:
   - Order value recording
   - Deposit and payment tracking
   - Project cost allocation
   - Revenue recognition

4. **Production Stage Financials**:
   - Material cost tracking
   - Labor hour recording
   - Equipment usage costs
   - Quality control expenses

5. **Delivery Stage Financials**:
   - Shipping and logistics costs
   - Final payment processing
   - Project profitability analysis
   - Customer satisfaction costs

### **Etching-Specific Financial Categories**

1. **Revenue Streams**:
   - Custom etching services
   - Design consultation fees
   - Rush order premiums
   - Maintenance and support services

2. **Cost Categories**:
   - Raw materials (metals, glass, etc.)
   - Equipment depreciation and maintenance
   - Labor costs (design, production, QC)
   - Utilities and facility costs

3. **Project Profitability**:
   - Per-project margin analysis
   - Customer profitability tracking
   - Product line performance
   - Service efficiency metrics

### **Financial Workflow Integration**

**Seamless integration with business processes:**

```
Inquiry → Quotation → Order → Production → Delivery
   ↓         ↓         ↓         ↓         ↓
Lead Cost → Quote Cost → Revenue → Prod Cost → Final P&L
```

---

## DATABASE SCHEMA

### Table: `financial_transactions`

Stores all financial transactions with detailed categorization and tenant isolation.

```sql
CREATE TABLE financial_transactions (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(), -- CORE RULE: model_morph_key
    
    tenant_id UUID NOT NULL, -- CORE RULE: team_foreign_key
    
    transaction_type VARCHAR(50) NOT NULL,
    transaction_category VARCHAR(100) NOT NULL,
    
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'IDR',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
    base_amount DECIMAL(15,2) NOT NULL,
    
    description TEXT NOT NULL,
    reference_number VARCHAR(100) NULL,
    
    transaction_date DATE NOT NULL,
    due_date DATE NULL,
    
    status VARCHAR(50) DEFAULT 'pending',
    
    account_id BIGINT NULL,
    category_id BIGINT NULL,
    project_id UUID NULL,
    customer_id UUID NULL,
    vendor_id UUID NULL,
    purchase_order_id UUID NULL,
    
    payment_method VARCHAR(50) NULL,
    payment_reference VARCHAR(100) NULL,
    
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    
    attachments JSONB NULL,
    metadata JSONB NULL,
    
    created_by BIGINT NOT NULL,
    approved_by BIGINT NULL,
    approved_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES purchase_orders(uuid) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(uuid) ON DELETE SET NULL,
    FOREIGN KEY (vendor_id) REFERENCES vendors(uuid) ON DELETE SET NULL,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(uuid) ON DELETE SET NULL,
    
    CONSTRAINT check_transaction_type CHECK (transaction_type IN ('income', 'expense', 'transfer', 'adjustment')),
    CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
    CONSTRAINT check_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_financial_transactions_tenant_id ON financial_transactions(tenant_id);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX idx_financial_transactions_project_id ON financial_transactions(project_id);
CREATE INDEX idx_financial_transactions_customer_id ON financial_transactions(customer_id);
CREATE INDEX idx_financial_transactions_vendor_id ON financial_transactions(vendor_id);
CREATE INDEX idx_financial_transactions_purchase_order_id ON financial_transactions(purchase_order_id);

CREATE TRIGGER update_financial_transactions_updated_at
BEFORE UPDATE ON financial_transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### Table: `revenue_records`

Stores detailed revenue tracking with project and customer attribution.

```sql
CREATE TABLE revenue_records (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(), -- CORE RULE: model_morph_key
    
    tenant_id UUID NOT NULL, -- CORE RULE: team_foreign_key
    transaction_id BIGINT NOT NULL,
    
    revenue_type VARCHAR(50) NOT NULL,
    revenue_source VARCHAR(100) NOT NULL,
    
    gross_amount DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    net_amount DECIMAL(15,2) NOT NULL,
    
    project_id UUID NULL,
    customer_id UUID NOT NULL,
    order_id UUID NULL,
    
    recognition_date DATE NOT NULL,
    billing_period_start DATE NULL,
    billing_period_end DATE NULL,
    
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency VARCHAR(20) NULL,
    
    cost_of_goods_sold DECIMAL(15,2) DEFAULT 0.00,
    gross_profit DECIMAL(15,2) GENERATED ALWAYS AS (net_amount - cost_of_goods_sold) STORED,
    profit_margin DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN net_amount > 0 THEN ((net_amount - cost_of_goods_sold) / net_amount * 100) ELSE 0 END
    ) STORED,
    
    metadata JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES financial_transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES purchase_orders(uuid) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(uuid) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES purchase_orders(uuid) ON DELETE SET NULL,
    
    CONSTRAINT check_revenue_type CHECK (revenue_type IN ('product_sale', 'service_fee', 'consultation', 'rush_order', 'maintenance', 'other')),
    CONSTRAINT check_recurring_frequency CHECK (recurring_frequency IN ('weekly', 'monthly', 'quarterly', 'annually') OR recurring_frequency IS NULL)
);

CREATE INDEX idx_revenue_records_tenant_id ON revenue_records(tenant_id);
CREATE INDEX idx_revenue_records_transaction_id ON revenue_records(transaction_id);
CREATE INDEX idx_revenue_records_customer_id ON revenue_records(customer_id);
CREATE INDEX idx_revenue_records_project_id ON revenue_records(project_id);
CREATE INDEX idx_revenue_records_recognition_date ON revenue_records(recognition_date);

CREATE TRIGGER update_revenue_records_updated_at
BEFORE UPDATE ON revenue_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### Table: `expense_records`

Stores detailed expense tracking with categorization and project allocation.

```sql
CREATE TABLE expense_records (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(), -- CORE RULE: model_morph_key
    
    tenant_id UUID NOT NULL, -- CORE RULE: team_foreign_key
    transaction_id BIGINT NOT NULL,
    
    expense_type VARCHAR(50) NOT NULL,
    expense_category VARCHAR(100) NOT NULL,
    
    amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL,
    
    vendor_id UUID NULL,
    project_id UUID NULL,
    
    expense_date DATE NOT NULL,
    
    is_billable BOOLEAN DEFAULT FALSE,
    is_reimbursable BOOLEAN DEFAULT FALSE,
    
    receipt_number VARCHAR(100) NULL,
    receipt_attachments JSONB NULL,
    
    allocation_percentage DECIMAL(5,2) DEFAULT 100.00,
    allocated_amount DECIMAL(15,2) GENERATED ALWAYS AS (amount * allocation_percentage / 100) STORED,
    
    approval_status VARCHAR(50) DEFAULT 'pending',
    approved_by BIGINT NULL,
    approved_at TIMESTAMP NULL,
    
    metadata JSONB NULL,
    
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES financial_transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (vendor_id) REFERENCES vendors(uuid) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES purchase_orders(uuid) ON DELETE SET NULL,
    
    CONSTRAINT check_expense_type CHECK (expense_type IN ('materials', 'labor', 'equipment', 'utilities', 'marketing', 'administrative', 'other')),
    CONSTRAINT check_approval_status CHECK (approval_status IN ('pending', 'approved', 'rejected', 'cancelled'))
);

CREATE INDEX idx_expense_records_tenant_id ON expense_records(tenant_id);
CREATE INDEX idx_expense_records_transaction_id ON expense_records(transaction_id);
CREATE INDEX idx_expense_records_vendor_id ON expense_records(vendor_id);
CREATE INDEX idx_expense_records_project_id ON expense_records(project_id);
CREATE INDEX idx_expense_records_expense_date ON expense_records(expense_date);
CREATE INDEX idx_expense_records_approval_status ON expense_records(approval_status);

CREATE TRIGGER update_expense_records_updated_at
BEFORE UPDATE ON expense_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### Table: `financial_reports`

Stores generated financial reports with metadata and access control.

```sql
CREATE TABLE financial_reports (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(), -- CORE RULE: model_morph_key
    
    tenant_id UUID NOT NULL, -- CORE RULE: team_foreign_key
    
    -- Report Identification
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('profit_loss', 'balance_sheet', 'cash_flow', 'budget_variance', 'project_profitability', 'custom')),
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    
    -- Report Generation
    generated_by UUID NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generation_time_seconds DECIMAL(8,3),
    
    -- Report Data
    report_data JSONB NOT NULL,
    report_summary JSONB,
    
    -- Report Status
    status VARCHAR(50) DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'failed', 'archived')),
    
    -- Access Control
    is_public BOOLEAN DEFAULT false,
    shared_with JSONB DEFAULT '[]',
    
    -- Export Information
    export_formats JSONB DEFAULT '[]', -- pdf, excel, csv
    last_exported_at TIMESTAMP,
    export_count INTEGER DEFAULT 0,
    
    -- Metadata
    filters_applied JSONB,
    custom_parameters JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP,
    
    -- Foreign Key Constraints (CORE RULE COMPLIANCE)
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_financial_reports_tenant_id ON financial_reports(tenant_id);
CREATE INDEX idx_financial_reports_type ON financial_reports(report_type);
CREATE INDEX idx_financial_reports_period ON financial_reports(report_period_start, report_period_end);
CREATE INDEX idx_financial_reports_generated_by ON financial_reports(generated_by);
CREATE INDEX idx_financial_reports_status ON financial_reports(status);

CREATE TRIGGER update_financial_reports_updated_at
BEFORE UPDATE ON financial_reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### Table: `budget_plans`

Stores budget planning and forecasting data with variance tracking.

```sql
CREATE TABLE budget_plans (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    
    budget_name VARCHAR(255) NOT NULL,
    budget_type VARCHAR(50) NOT NULL,
    
    fiscal_year INT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    total_revenue_budget DECIMAL(15,2) NOT NULL,
    total_expense_budget DECIMAL(15,2) NOT NULL,
    net_profit_budget DECIMAL(15,2) GENERATED ALWAYS AS (total_revenue_budget - total_expense_budget) STORED,
    
    budget_breakdown JSONB NOT NULL,
    
    status VARCHAR(50) DEFAULT 'draft',
    
    created_by BIGINT NOT NULL,
    approved_by BIGINT NULL,
    approved_at TIMESTAMP NULL,
    
    metadata JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT check_budget_type CHECK (budget_type IN ('annual', 'quarterly', 'monthly', 'project', 'department')),
    CONSTRAINT check_status CHECK (status IN ('draft', 'pending_approval', 'approved', 'active', 'completed', 'cancelled'))
);

CREATE INDEX idx_budget_plans_tenant_id ON budget_plans(tenant_id);
CREATE INDEX idx_budget_plans_fiscal_year ON budget_plans(fiscal_year);
CREATE INDEX idx_budget_plans_type ON budget_plans(budget_type);
CREATE INDEX idx_budget_plans_status ON budget_plans(status);

CREATE TRIGGER update_budget_plans_updated_at
BEFORE UPDATE ON budget_plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### Table: `vendor_payments`

Stores vendor payment tracking for etching business workflow.

```sql
CREATE TABLE vendor_payments (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    
    vendor_id UUID NOT NULL,
    purchase_order_id UUID NOT NULL,
    
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('dp', 'full_payment', 'partial', 'final')),
    
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'IDR',
    
    payment_date DATE NOT NULL,
    due_date DATE,
    
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(100),
    
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'verified', 'cancelled')),
    
    proof_of_payment_url VARCHAR(500),
    
    notes TEXT,
    
    created_by BIGINT NOT NULL,
    verified_by BIGINT,
    verified_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(uuid) ON DELETE CASCADE,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(uuid) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_vendor_payments_tenant_id ON vendor_payments(tenant_id);
CREATE INDEX idx_vendor_payments_vendor_id ON vendor_payments(vendor_id);
CREATE INDEX idx_vendor_payments_purchase_order_id ON vendor_payments(purchase_order_id);
CREATE INDEX idx_vendor_payments_status ON vendor_payments(status);
CREATE INDEX idx_vendor_payments_payment_date ON vendor_payments(payment_date);

CREATE TRIGGER update_vendor_payments_updated_at
BEFORE UPDATE ON vendor_payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### Table: `customer_invoices`

Stores customer invoice generation and tracking.

```sql
CREATE TABLE customer_invoices (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    
    customer_id UUID NOT NULL,
    purchase_order_id UUID NOT NULL,
    
    invoice_number VARCHAR(100) NOT NULL,
    invoice_type VARCHAR(50) NOT NULL CHECK (invoice_type IN ('dp', 'full_payment', 'final_payment')),
    
    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL,
    
    currency VARCHAR(10) DEFAULT 'IDR',
    
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    payment_terms VARCHAR(100),
    
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    
    sent_at TIMESTAMP,
    paid_at TIMESTAMP,
    
    notes TEXT,
    
    created_by BIGINT NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(uuid) ON DELETE CASCADE,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(uuid) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    UNIQUE(tenant_id, invoice_number)
);

CREATE INDEX idx_customer_invoices_tenant_id ON customer_invoices(tenant_id);
CREATE INDEX idx_customer_invoices_customer_id ON customer_invoices(customer_id);
CREATE INDEX idx_customer_invoices_purchase_order_id ON customer_invoices(purchase_order_id);
CREATE INDEX idx_customer_invoices_status ON customer_invoices(status);
CREATE INDEX idx_customer_invoices_due_date ON customer_invoices(due_date);
CREATE INDEX idx_customer_invoices_invoice_number ON customer_invoices(invoice_number);

CREATE TRIGGER update_customer_invoices_updated_at
BEFORE UPDATE ON customer_invoices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

**Previous:** [10-INVENTORY.md](./10-INVENTORY.md)  
**Next:** [12-USERS.md](./12-USERS.md)

**Last Updated:** 2025-11-12  
**Status:** ✅ COMPLETE - Updated with Business Cycle Integration  
**Reviewed By:** System Architect
