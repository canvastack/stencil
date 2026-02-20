# Customer Management Guide - Panduan Manajemen Customer

**Target:** Tenant Administrators  
**Version:** 2.0  
**Last Updated:** February 19, 2026

---

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Customer Types & Account Levels](#customer-types--account-levels)
3. [Multi-Tenant Customer Architecture](#multi-tenant-customer-architecture)
4. [Customer Dashboard](#customer-dashboard)
5. [Managing Customers](#managing-customers)
6. [Customer Authentication System](#customer-authentication-system)
7. [Trust Score System](#trust-score-system)
8. [Customer Segmentation](#customer-segmentation)
9. [Customer Analytics](#customer-analytics)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Overview

### Tentang Customer Management System

Customer Management System di CanvaStencil adalah sistem komprehensif untuk mengelola customer data, authentication, dan interactions dalam environment multi-tenant.

### Key Features

✨ **Multi-Level Account System**
- Guest customers (no registration)
- Registered customers (with login)
- Verified customers (email verified)

🔐 **Secure Authentication**
- Email & password authentication
- Email verification system
- Password reset functionality
- Account security features

📊 **Trust Score System**
- Automated trust calculation
- Based on order history & behavior
- Influences order approval workflow

🏪 **Multi-Tenant Support**
- Complete data isolation per tenant
- Same email across different tenants
- Separate customer records per tenant

### System Architecture

```
┌─ Customer Management Architecture ────────────────┐
│                                                   │
│  Customer Registration                            │
│         ↓                                         │
│  Email Verification                               │
│         ↓                                         │
│  Customer Authentication                          │
│         ↓                                         │
│  Trust Score Calculation                          │
│         ↓                                         │
│  Order Approval Workflow                          │
│         ↓                                         │
│  Customer Analytics                               │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## Customer Types & Account Levels

### 1. Guest Customer

**Characteristics:**
- `account_type`: `guest`
- No authentication required
- No email verification
- Limited functionality

**Database Fields:**
```php
account_type: 'guest'
password_hash: NULL
email_verified_at: NULL
registration_token: NULL
```

**Use Cases:**
- One-time purchases
- Quick checkout
- No account management needed

**Limitations:**
- Cannot login to portal
- Cannot track orders
- Cannot save addresses
- Cannot write reviews
- No order history access


### 2. Registered Customer

**Characteristics:**
- `account_type`: `registered`
- Has password (authenticated)
- Email NOT yet verified
- Partial functionality

**Database Fields:**
```php
account_type: 'registered'
password_hash: 'hashed_password'
email_verified_at: NULL
registration_token: 'verification_token'
```

**Use Cases:**
- Registered but not verified email
- Waiting for email verification
- Limited trust level

**Features Available:**
- ✅ Login to customer portal
- ✅ View order history
- ✅ Track orders
- ✅ Manage addresses
- ✅ Update profile
- ⚠️ May require manual approval for first order

**Limitations:**
- Lower trust score (20-60)
- May have order value limits
- Slower order approval process

### 3. Verified Customer

**Characteristics:**
- `account_type`: `verified`
- Email verified
- Full functionality
- Highest trust level

**Database Fields:**
```php
account_type: 'verified'
password_hash: 'hashed_password'
email_verified_at: '2026-02-19 10:30:00'
registration_token: NULL (cleared after verification)
```

**Use Cases:**
- Regular customers
- High-value orders
- Business accounts
- Frequent purchases

**Features Available:**
- ✅ All registered customer features
- ✅ Instant order approval (most cases)
- ✅ Higher trust score (60-100)
- ✅ Priority customer support
- ✅ Loyalty rewards eligibility
- ✅ No order value limits

### Account Type Comparison

| Feature | Guest | Registered | Verified |
|---------|-------|------------|----------|
| **Authentication** | ❌ | ✅ | ✅ |
| **Email Verified** | ❌ | ❌ | ✅ |
| **Portal Access** | ❌ | ✅ | ✅ |
| **Order History** | ❌ | ✅ | ✅ |
| **Trust Score Range** | 0 | 20-60 | 60-100 |
| **Instant Approval** | ❌ | ⚠️ | ✅ |
| **Order Limits** | ✅ | ⚠️ | ❌ |
| **Priority Support** | ❌ | ❌ | ✅ |
| **Loyalty Rewards** | ❌ | ❌ | ✅ |

### Account Type Transitions

```
Guest Customer
    ↓ (Register)
Registered Customer
    ↓ (Verify Email)
Verified Customer
```

**Transition Rules:**
- Guest → Registered: Customer creates account
- Registered → Verified: Customer verifies email
- Cannot downgrade from Verified to Registered
- Guest customers can be "upgraded" by admin to Registered

---

## Multi-Tenant Customer Architecture

### Data Isolation Principle

**CRITICAL CONCEPT**: Setiap tenant memiliki customer data yang **COMPLETELY ISOLATED**.

### Database Schema

```sql
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    tenant_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    -- ... other fields
    
    UNIQUE KEY customers_tenant_id_email_unique (tenant_id, email),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
```

**Key Points:**
- `tenant_id`: Foreign key to tenants table
- `UNIQUE(tenant_id, email)`: Email unique PER TENANT
- Same email can exist across different tenants
- Cascade delete when tenant is deleted

### BelongsToTenant Trait

Customer model menggunakan `BelongsToTenant` trait untuk automatic tenant scoping:

```php
class Customer extends Authenticatable implements TenantAwareModel
{
    use BelongsToTenant;
    
    // Automatic tenant scoping applied to all queries
}
```

**Automatic Features:**
1. **Global Scope**: All queries automatically filtered by current tenant
2. **Auto-assign tenant_id**: When creating customer, tenant_id auto-filled
3. **Tenant Validation**: Prevents cross-tenant data access

### Cross-Tenant Customer Scenario

**Example**: John Doe shops at 2 different tenants

```
Tenant A (PT CEX):
┌─────────────────────────────────┐
│ Customer ID: 101                │
│ Tenant ID: 1                    │
│ Email: john@example.com         │
│ Orders: 5                       │
│ Total Spent: Rp 2,500,000       │
│ Trust Score: 85                 │
└─────────────────────────────────┘

Tenant B (PT ABC):
┌─────────────────────────────────┐
│ Customer ID: 202                │
│ Tenant ID: 2                    │
│ Email: john@example.com         │ ← Same email!
│ Orders: 3                       │
│ Total Spent: Rp 1,200,000       │
│ Trust Score: 75                 │
└─────────────────────────────────┘
```

**Important Notes:**
- ✅ Same email, different customer records
- ✅ Data completely isolated
- ✅ Trust scores calculated independently
- ✅ Order histories separate
- ✅ No data sharing between tenants

### Tenant Scoping in Action

```php
// As Tenant A admin
Customer::all(); 
// Returns only Tenant A customers

// As Tenant B admin
Customer::all(); 
// Returns only Tenant B customers

// Platform admin (bypass scope)
Customer::withoutGlobalScope('tenant')->get();
// Returns ALL customers from ALL tenants
```

### Security Implications

**✅ SAFE Operations:**
```php
// Find customer by UUID (tenant-scoped)
$customer = Customer::where('uuid', $uuid)->first();

// Get customer orders (tenant-scoped)
$orders = $customer->orders;

// Update customer (tenant-scoped)
$customer->update(['name' => 'New Name']);
```

**❌ DANGEROUS Operations:**
```php
// Bypass tenant scope (admin only!)
$customer = Customer::withoutGlobalScope('tenant')
    ->where('uuid', $uuid)
    ->first();

// This can access customers from OTHER tenants!
```

---

## Customer Dashboard

### Accessing Customer Management

**Navigation**: Admin Panel → Customers → Customer List

### Customer List View

```
┌─ Customer Management ─────────────────────────────┐
│                                                   │
│ [+ Add Customer] [Import] [Export]                │
│                                                   │
│ Filters:                                          │
│ Account Type: [All ▼] Status: [All ▼]            │
│ Search: [Search customers...________] [🔍]       │
│                                                   │
│ Showing 48 customers                              │
│                                                   │
│ ┌─────────────────────────────────────────────┐  │
│ │ John Doe                                    │  │
│ │ john.doe@example.com • ✅ Verified          │  │
│ │ Trust Score: 85 🌟 • 12 orders              │  │
│ │ Total Spent: Rp 5,200,000                   │  │
│ │ Last Order: 5 days ago                      │  │
│ │ [View] [Edit] [Orders] [More ▼]            │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ ┌─────────────────────────────────────────────┐  │
│ │ Jane Smith                                  │  │
│ │ jane.smith@example.com • ⏳ Registered      │  │
│ │ Trust Score: 45 • 3 orders                  │  │
│ │ Total Spent: Rp 1,200,000                   │  │
│ │ Last Order: 15 days ago                     │  │
│ │ [View] [Edit] [Orders] [More ▼]            │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ [1] [2] [3] ... [10] [Next →]                    │
└───────────────────────────────────────────────────┘
```

### Customer Detail View

Click **"View"** untuk melihat detail lengkap:

```
┌─ Customer Details ────────────────────────────────┐
│                                                   │
│ ┌─ Basic Information ─────────────────────────┐  │
│ │ Name: John Doe                              │  │
│ │ Email: john.doe@example.com ✅ Verified     │  │
│ │ Phone: +62 812-3456-7890                    │  │
│ │ Company: PT Example Company                 │  │
│ │ Customer Type: Business                     │  │
│ │ Account Type: Verified                      │  │
│ │ Status: Active                              │  │
│ │ Member Since: January 15, 2026              │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ ┌─ Trust Score ───────────────────────────────┐  │
│ │ Current Score: 85/100 🌟                    │  │
│ │ ████████████████████████████████████░░░░░   │  │
│ │                                             │  │
│ │ Breakdown:                                  │  │
│ │ • Email Verified: +20 points                │  │
│ │ • Successful Orders: +40 points (10 orders) │  │
│ │ • Payment Success: +25 points (100%)        │  │
│ │                                             │  │
│ │ Status: Excellent (Instant Approval)        │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ ┌─ Order Statistics ──────────────────────────┐  │
│ │ Total Orders: 12                            │  │
│ │ Completed: 10 (83%)                         │  │
│ │ Pending: 2 (17%)                            │  │
│ │ Cancelled: 0 (0%)                           │  │
│ │                                             │  │
│ │ Total Spent: Rp 5,200,000                   │  │
│ │ Average Order: Rp 433,333                   │  │
│ │ Last Order: 5 days ago                      │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ ┌─ Authentication Info ───────────────────────┐  │
│ │ Last Login: Today at 2:15 PM                │  │
│ │ Login Count: 45 times                       │  │
│ │ Failed Attempts: 0                          │  │
│ │ Account Locked: No                          │  │
│ │ Email Verified: Yes (Feb 19, 2026)          │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ ┌─ Addresses ─────────────────────────────────┐  │
│ │ 🏠 Home (Default)                           │  │
│ │ Jl. Sudirman No. 123                        │  │
│ │ Jakarta Selatan, DKI Jakarta 12345          │  │
│ │                                             │  │
│ │ 🏢 Office                                   │  │
│ │ Jl. Thamrin No. 456                         │  │
│ │ Jakarta Pusat, DKI Jakarta 10110            │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ [Edit Customer] [View Orders] [Send Email]       │
│ [Reset Password] [Lock Account] [Delete]         │
└───────────────────────────────────────────────────┘
```

### Quick Actions

**Available Actions:**
- **View**: See full customer details
- **Edit**: Update customer information
- **Orders**: View customer's order history
- **Send Email**: Send notification to customer
- **Reset Password**: Generate password reset link
- **Lock Account**: Temporarily disable account
- **Delete**: Permanently remove customer (with confirmation)

---

## Managing Customers

### Adding New Customer

**Navigation**: Customers → Add Customer

```
┌─ Add New Customer ────────────────────────────────┐
│                                                   │
│ Basic Information                                 │
│ ─────────────────────────────────────────────    │
│ First Name *:                                     │
│ [John_________________________]                   │
│                                                   │
│ Last Name *:                                      │
│ [Doe__________________________]                   │
│                                                   │
│ Email *:                                          │
│ [john.doe@example.com_________]                   │
│                                                   │
│ Phone *:                                          │
│ [+62 812-3456-7890____________]                   │
│                                                   │
│ Company (Optional):                               │
│ [PT Example Company___________]                   │
│                                                   │
│ Customer Type:                                    │
│ ○ Individual  ● Business                          │
│                                                   │
│ Account Settings                                  │
│ ─────────────────────────────────────────────    │
│ Account Type:                                     │
│ ○ Guest  ● Registered  ○ Verified                │
│                                                   │
│ Status:                                           │
│ ● Active  ○ Inactive                              │
│                                                   │
│ Password (if Registered/Verified):                │
│ [••••••••••••••••••••••••••••]                   │
│ [Generate Random Password]                        │
│                                                   │
│ [✓] Send welcome email with login credentials     │
│ [✓] Mark email as verified (skip verification)    │
│                                                   │
│ Address Information (Optional)                    │
│ ─────────────────────────────────────────────    │
│ Street Address:                                   │
│ [Jl. Sudirman No. 123_________]                   │
│                                                   │
│ City:                                             │
│ [Jakarta Selatan______________]                   │
│                                                   │
│ Province:                                         │
│ [DKI Jakarta ▼]                                   │
│                                                   │
│ Postal Code:                                      │
│ [12345________________________]                   │
│                                                   │
│ Notes (Internal)                                  │
│ ─────────────────────────────────────────────    │
│ [VIP customer, priority handling__________]       │
│ [_________________________________________]       │
│                                                   │
│ [Create Customer] [Cancel]                        │
└───────────────────────────────────────────────────┘
```

**Important Notes:**
- Email must be unique within your tenant
- If creating Registered/Verified account, password required
- Can skip email verification for admin-created accounts
- Welcome email optional but recommended

### Editing Customer

**Navigation**: Customers → Select Customer → Edit

Similar form to Add Customer, with existing data pre-filled.

**Editable Fields:**
- ✅ Name, email, phone
- ✅ Company information
- ✅ Customer type
- ✅ Account status
- ✅ Addresses
- ✅ Internal notes
- ❌ Cannot change tenant_id (security)
- ❌ Cannot change UUID (immutable)

### Bulk Operations

Select multiple customers untuk bulk actions:

```
┌─ Bulk Actions ────────────────────────────────────┐
│                                                   │
│ 5 customers selected                              │
│                                                   │
│ Actions:                                          │
│ • [Export Selected]                               │
│ • [Send Email to Selected]                        │
│ • [Change Status]                                 │
│ • [Add Tags]                                      │
│ • [Delete Selected]                               │
│                                                   │
│ [Apply] [Cancel Selection]                        │
└───────────────────────────────────────────────────┘
```

### Import Customers

**Navigation**: Customers → Import

```
┌─ Import Customers ────────────────────────────────┐
│                                                   │
│ Upload CSV File                                   │
│ ─────────────────────────────────────────────    │
│ [Choose File] [customers.csv]                     │
│ [Download Template]                               │
│                                                   │
│ CSV Format Requirements:                          │
│ • First row must be headers                       │
│ • Required columns: first_name, last_name, email  │
│ • Optional: phone, company, customer_type         │
│ • Max 1000 rows per import                        │
│                                                   │
│ Import Options:                                   │
│ [✓] Skip duplicates (by email)                    │
│ [✓] Send welcome emails                           │
│ [ ] Mark all as verified                          │
│                                                   │
│ [Upload & Import] [Cancel]                        │
└───────────────────────────────────────────────────┘
```

**CSV Template:**
```csv
first_name,last_name,email,phone,company,customer_type
John,Doe,john@example.com,+62812345678,PT Example,business
Jane,Smith,jane@example.com,+62812345679,,individual
```

### Export Customers

**Navigation**: Customers → Export

```
┌─ Export Customers ────────────────────────────────┐
│                                                   │
│ Export Format:                                    │
│ ● CSV  ○ Excel  ○ PDF                            │
│                                                   │
│ Fields to Include:                                │
│ [✓] Basic Info (name, email, phone)               │
│ [✓] Company Information                           │
│ [✓] Order Statistics                              │
│ [✓] Trust Score                                   │
│ [ ] Addresses                                     │
│ [ ] Internal Notes                                │
│                                                   │
│ Filters:                                          │
│ Account Type: [All ▼]                             │
│ Status: [Active ▼]                                │
│ Date Range: [Last 30 days ▼]                      │
│                                                   │
│ [Export] [Cancel]                                 │
└───────────────────────────────────────────────────┘
```

---

## Customer Authentication System

### Email Verification Flow

```
Customer Registers
    ↓
System sends verification email
    ↓
Customer clicks verification link
    ↓
Email verified, account_type → 'verified'
    ↓
Trust score updated (+20 points)
```

### Admin Actions for Authentication

#### 1. Manual Email Verification

Jika customer tidak menerima email:

```
Customer Details → Authentication Info → [Verify Email Manually]
```

**Confirmation Dialog:**
```
┌─ Verify Email Manually ───────────────────────────┐
│                                                   │
│ ⚠️  Manually verify email for:                    │
│ john.doe@example.com                              │
│                                                   │
│ This will:                                        │
│ • Mark email as verified                          │
│ • Upgrade account to 'verified' status            │
│ • Update trust score (+20 points)                 │
│ • Skip email verification process                 │
│                                                   │
│ Reason (optional):                                │
│ [Customer requested via phone_____________]       │
│                                                   │
│ [Confirm Verification] [Cancel]                   │
└───────────────────────────────────────────────────┘
```

#### 2. Resend Verification Email

```
Customer Details → Authentication Info → [Resend Verification Email]
```

**Success Message:**
```
✅ Verification email sent to john.doe@example.com
   Customer will receive the email within 5 minutes.
```

#### 3. Reset Customer Password

```
Customer Details → Authentication Info → [Reset Password]
```

**Options:**
```
┌─ Reset Password ──────────────────────────────────┐
│                                                   │
│ Choose reset method:                              │
│                                                   │
│ ● Send reset link via email                       │
│   Customer will receive email with reset link     │
│                                                   │
│ ○ Generate temporary password                     │
│   You'll see the password to share with customer  │
│                                                   │
│ [Proceed] [Cancel]                                │
└───────────────────────────────────────────────────┘
```

#### 4. Lock/Unlock Account

**Lock Account:**
```
Customer Details → [Lock Account]

┌─ Lock Account ────────────────────────────────────┐
│                                                   │
│ ⚠️  Lock account for: john.doe@example.com        │
│                                                   │
│ Lock Duration:                                    │
│ ○ 30 minutes                                      │
│ ○ 24 hours                                        │
│ ● Indefinite (manual unlock required)             │
│                                                   │
│ Reason:                                           │
│ [Suspicious activity detected______________]      │
│                                                   │
│ [✓] Send notification email to customer           │
│                                                   │
│ [Lock Account] [Cancel]                           │
└───────────────────────────────────────────────────┘
```

**Unlock Account:**
```
Customer Details → [Unlock Account]

✅ Account unlocked successfully
   Customer can now login normally.
```

### Monitoring Login Activity

```
Customer Details → Authentication Info → [View Login History]

┌─ Login History ───────────────────────────────────┐
│                                                   │
│ Recent login attempts for john.doe@example.com    │
│                                                   │
│ ✅ Feb 19, 2026 at 2:15 PM                        │
│    Chrome on Windows                              │
│    Jakarta, Indonesia (103.xxx.xxx.xxx)           │
│    Status: Successful                             │
│                                                   │
│ ✅ Feb 18, 2026 at 9:30 AM                        │
│    Safari on iPhone                               │
│    Jakarta, Indonesia (103.xxx.xxx.xxx)           │
│    Status: Successful                             │
│                                                   │
│ ❌ Feb 17, 2026 at 11:45 PM                       │
│    Chrome on Windows                              │
│    Unknown Location (45.xxx.xxx.xxx)              │
│    Status: Failed (Wrong password)                │
│    ⚠️  Suspicious - Different location            │
│                                                   │
│ [Export History] [Lock Account]                   │
└───────────────────────────────────────────────────┘
```


---

## Trust Score System

### What is Trust Score?

Trust Score adalah automated scoring system (0-100) yang menilai reliability dan trustworthiness customer berdasarkan:
- Email verification status
- Order history & success rate
- Payment behavior
- Account age

### Trust Score Calculation

```php
Trust Score = Email Verified (20) 
            + Successful Orders (max 40) 
            + Payment Success Rate (max 40)
```

**Breakdown:**

1. **Email Verified: +20 points**
   - Verified email: +20
   - Not verified: 0

2. **Successful Orders: +5 per order (max 40)**
   - 1-8 orders: +5 each
   - 8+ orders: capped at +40

3. **Payment Success Rate: up to 40 points**
   - 100% success: +40
   - 90% success: +36
   - 80% success: +32
   - etc.

### Trust Score Ranges

| Score | Level | Description | Order Approval |
|-------|-------|-------------|----------------|
| **0-20** | Very Low | Guest or new unverified | Manual review required |
| **21-40** | Low | Registered, no orders | Manual review likely |
| **41-60** | Medium | Few orders, mixed history | May require review |
| **61-80** | Good | Regular customer, good history | Usually instant |
| **81-100** | Excellent | Verified, excellent history | Instant approval |

### Trust Score in Action

#### Example 1: New Guest Customer

```
┌─ Trust Score: 0/100 ──────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                                   │
│ Level: Very Low                                   │
│                                                   │
│ Breakdown:                                        │
│ • Email Verified: 0 points (not verified)         │
│ • Successful Orders: 0 points (no orders)         │
│ • Payment Success: 0 points (no payments)         │
│                                                   │
│ Impact:                                           │
│ ⚠️  All orders require manual approval            │
│ ⚠️  May have order value limits                   │
│                                                   │
│ Recommendations:                                  │
│ • Verify email to gain +20 points                 │
│ • Complete first order successfully               │
└───────────────────────────────────────────────────┘
```

#### Example 2: Registered Customer (3 orders)

```
┌─ Trust Score: 45/100 ─────────────────────────────┐
│ ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                                   │
│ Level: Medium                                     │
│                                                   │
│ Breakdown:                                        │
│ • Email Verified: 0 points (not verified)         │
│ • Successful Orders: +15 points (3 orders)        │
│ • Payment Success: +30 points (100% success)      │
│                                                   │
│ Impact:                                           │
│ ⚠️  May require approval for high-value orders    │
│ ✅ Standard orders usually approved               │
│                                                   │
│ To Improve:                                       │
│ • Verify email → +20 points (total: 65)           │
│ • Complete more orders → up to +25 more           │
└───────────────────────────────────────────────────┘
```

#### Example 3: Verified Customer (10+ orders)

```
┌─ Trust Score: 85/100 ─────────────────────────────┐
│ ████████████████████████████████████████░░░░░░░░░ │
│                                                   │
│ Level: Excellent 🌟                               │
│                                                   │
│ Breakdown:                                        │
│ • Email Verified: +20 points ✅                   │
│ • Successful Orders: +40 points (10 orders) ✅    │
│ • Payment Success: +25 points (100% success) ✅   │
│                                                   │
│ Benefits:                                         │
│ ✅ Instant order approval                         │
│ ✅ No order value limits                          │
│ ✅ Priority customer support                      │
│ ✅ Eligible for loyalty rewards                   │
│                                                   │
│ Status: Trusted Customer                          │
└───────────────────────────────────────────────────┘
```

### Admin Actions for Trust Score

#### 1. View Trust Score Details

```
Customer Details → Trust Score Section

Shows:
- Current score
- Score breakdown
- Historical changes
- Impact on order approval
```

#### 2. Manual Trust Score Adjustment (Coming Soon)

```
┌─ Adjust Trust Score ──────────────────────────────┐
│                                                   │
│ Current Score: 45/100                             │
│                                                   │
│ Manual Adjustment:                                │
│ [+10] points                                      │
│                                                   │
│ New Score: 55/100                                 │
│                                                   │
│ Reason (required):                                │
│ [VIP customer, long-term business relationship]   │
│ [_________________________________________]       │
│                                                   │
│ ⚠️  Manual adjustments are logged and auditable   │
│                                                   │
│ [Apply Adjustment] [Cancel]                       │
└───────────────────────────────────────────────────┘
```

### Trust Score Impact on Workflows

#### Order Approval Workflow

```
New Order Created
    ↓
Check Customer Trust Score
    ↓
┌─────────────────────────────────────┐
│ Score 0-60:  Manual Review Required │
│ Score 61-80: Auto-approve (standard)│
│ Score 81-100: Instant Approval      │
└─────────────────────────────────────┘
    ↓
Order Processing
```

#### Quote Approval Workflow

```
Customer Accepts Quote
    ↓
Check Trust Score
    ↓
┌─────────────────────────────────────┐
│ Score < 60:  Pending Admin Review   │
│ Score ≥ 60:  Instant Approval       │
└─────────────────────────────────────┘
    ↓
Payment Instructions Sent
```

---

## Customer Segmentation

### Segmentation Criteria

Segment customers berdasarkan:

1. **Account Type**
   - Guest
   - Registered
   - Verified

2. **Order Frequency**
   - New (0 orders)
   - Occasional (1-3 orders)
   - Regular (4-10 orders)
   - Frequent (10+ orders)

3. **Order Value**
   - Low (< Rp 500K)
   - Medium (Rp 500K - 2M)
   - High (> Rp 2M)

4. **Trust Score**
   - Very Low (0-20)
   - Low (21-40)
   - Medium (41-60)
   - Good (61-80)
   - Excellent (81-100)

5. **Customer Type**
   - Individual
   - Business

### Creating Segments

**Navigation**: Customers → Segments → Create Segment

```
┌─ Create Customer Segment ─────────────────────────┐
│                                                   │
│ Segment Name:                                     │
│ [VIP Customers________________]                   │
│                                                   │
│ Description:                                      │
│ [High-value customers with excellent history]     │
│                                                   │
│ Criteria                                          │
│ ─────────────────────────────────────────────    │
│ Account Type:                                     │
│ [✓] Verified  [ ] Registered  [ ] Guest           │
│                                                   │
│ Trust Score:                                      │
│ Min: [80] Max: [100]                              │
│                                                   │
│ Total Orders:                                     │
│ Min: [10] Max: [___]                              │
│                                                   │
│ Total Spent:                                      │
│ Min: [Rp 5,000,000] Max: [___________]            │
│                                                   │
│ Last Order:                                       │
│ Within: [30 days ▼]                               │
│                                                   │
│ Customer Type:                                    │
│ [✓] Individual  [✓] Business                      │
│                                                   │
│ Preview: 12 customers match these criteria        │
│                                                   │
│ [Create Segment] [Cancel]                         │
└───────────────────────────────────────────────────┘
```

### Using Segments

**Available Actions:**
- **Email Campaign**: Send targeted emails
- **Special Offers**: Create segment-specific promotions
- **Export**: Export segment for analysis
- **Analytics**: View segment performance

### Pre-defined Segments

```
┌─ Customer Segments ───────────────────────────────┐
│                                                   │
│ ┌─ VIP Customers (12) ────────────────────────┐  │
│ │ Verified, Trust Score 80+, 10+ orders       │  │
│ │ [View] [Email] [Export]                     │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ ┌─ At Risk (8) ───────────────────────────────┐  │
│ │ No orders in last 90 days                   │  │
│ │ [View] [Email] [Export]                     │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ ┌─ New Customers (24) ────────────────────────┐  │
│ │ Registered in last 30 days                  │  │
│ │ [View] [Email] [Export]                     │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ ┌─ High Value (15) ───────────────────────────┐  │
│ │ Total spent > Rp 5,000,000                  │  │
│ │ [View] [Email] [Export]                     │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ [+ Create New Segment]                            │
└───────────────────────────────────────────────────┘
```

---

## Customer Analytics

### Analytics Dashboard

**Navigation**: Customers → Analytics

```
┌─ Customer Analytics ──────────────────────────────┐
│                                                   │
│ Overview (Last 30 Days)                           │
│ ─────────────────────────────────────────────    │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ Total       │ │ New         │ │ Active      │ │
│ │ Customers   │ │ Customers   │ │ Customers   │ │
│ │    248      │ │     24      │ │     156     │ │
│ │  +12% ↑     │ │  +8% ↑      │ │  +5% ↑      │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ │
│                                                   │
│ Customer Acquisition                              │
│ ─────────────────────────────────────────────    │
│ [Line Chart: New customers over time]             │
│                                                   │
│ Account Type Distribution                         │
│ ─────────────────────────────────────────────    │
│ [Pie Chart]                                       │
│ • Verified: 45% (112 customers)                   │
│ • Registered: 35% (87 customers)                  │
│ • Guest: 20% (49 customers)                       │
│                                                   │
│ Trust Score Distribution                          │
│ ─────────────────────────────────────────────    │
│ [Bar Chart]                                       │
│ • Excellent (81-100): 28%                         │
│ • Good (61-80): 35%                               │
│ • Medium (41-60): 22%                             │
│ • Low (21-40): 10%                                │
│ • Very Low (0-20): 5%                             │
│                                                   │
│ Top Customers by Spend                            │
│ ─────────────────────────────────────────────    │
│ 1. John Doe - Rp 5,200,000 (12 orders)           │
│ 2. Jane Smith - Rp 4,800,000 (10 orders)         │
│ 3. Bob Johnson - Rp 3,500,000 (8 orders)         │
│ 4. Alice Williams - Rp 2,900,000 (7 orders)      │
│ 5. Charlie Brown - Rp 2,400,000 (6 orders)       │
│                                                   │
│ [Export Report] [Schedule Email]                  │
└───────────────────────────────────────────────────┘
```

### Key Metrics

#### 1. Customer Lifetime Value (CLV)

```
CLV = Average Order Value × Order Frequency × Customer Lifespan
```

**Example:**
```
Average Order Value: Rp 433,333
Order Frequency: 2.4 orders/year
Customer Lifespan: 3 years
CLV = Rp 433,333 × 2.4 × 3 = Rp 3,120,000
```

#### 2. Customer Retention Rate

```
Retention Rate = (Customers at End - New Customers) / Customers at Start × 100%
```

**Example:**
```
Customers at Start (Jan 1): 200
New Customers (Jan): 24
Customers at End (Jan 31): 215
Lost Customers: 200 + 24 - 215 = 9

Retention Rate = (215 - 24) / 200 × 100% = 95.5%
```

#### 3. Customer Acquisition Cost (CAC)

```
CAC = Total Marketing Spend / New Customers Acquired
```

#### 4. Average Order Value (AOV)

```
AOV = Total Revenue / Total Orders
```

### Reports

**Available Reports:**
- Customer Growth Report
- Trust Score Analysis
- Segmentation Report
- Churn Analysis
- CLV Report
- Retention Report

**Export Formats:**
- PDF
- Excel
- CSV

---

## Best Practices

### Customer Onboarding

✅ **DO:**
- Send welcome email immediately after registration
- Provide clear instructions for email verification
- Offer first-order discount to encourage purchase
- Set up automated onboarding email sequence
- Make verification process simple and clear

❌ **DON'T:**
- Require too much information upfront
- Make verification process complicated
- Ignore unverified customers
- Send too many emails too quickly

### Trust Score Management

✅ **DO:**
- Monitor trust scores regularly
- Investigate sudden drops in trust score
- Reward high-trust customers with benefits
- Use trust score for risk management
- Communicate trust score benefits to customers

❌ **DON'T:**
- Manually adjust scores without valid reason
- Ignore low-trust score patterns
- Apply same approval process to all customers
- Penalize customers unfairly

### Customer Communication

✅ **DO:**
- Personalize communications
- Segment customers for targeted messaging
- Respond promptly to inquiries
- Send order updates proactively
- Thank customers for their business

❌ **DON'T:**
- Send generic mass emails
- Spam customers with promotions
- Ignore customer feedback
- Use aggressive sales tactics
- Share customer data inappropriately

### Data Management

✅ **DO:**
- Keep customer data up-to-date
- Regularly clean duplicate records
- Backup customer data regularly
- Comply with data privacy regulations
- Document data handling procedures

❌ **DON'T:**
- Store unnecessary personal data
- Share data across tenants
- Ignore data privacy requests
- Keep outdated information
- Mix test and production data

### Security

✅ **DO:**
- Monitor suspicious login activity
- Lock accounts after failed attempts
- Require strong passwords
- Enable email notifications for security events
- Regularly audit customer access

❌ **DON'T:**
- Share customer passwords
- Disable security features
- Ignore security alerts
- Allow weak passwords
- Skip security audits

---

## Troubleshooting

### Common Issues

#### Issue 1: Customer Can't Login

**Symptoms:**
- "Invalid credentials" error
- Account locked message
- Email not found

**Possible Causes:**
1. Wrong email or password
2. Account locked (too many failed attempts)
3. Account not registered
4. Email not verified (if required)

**Solutions:**
```
1. Verify email exists in system
   → Customers → Search by email

2. Check account status
   → View customer details
   → Check "Account Locked" status

3. Reset password
   → Customer Details → Reset Password
   → Send reset link to customer

4. Unlock account if locked
   → Customer Details → Unlock Account

5. Verify email manually if needed
   → Customer Details → Verify Email Manually
```

#### Issue 2: Verification Email Not Received

**Symptoms:**
- Customer registered but no verification email
- Email verification link expired

**Possible Causes:**
1. Email in spam folder
2. Wrong email address
3. Email service issue
4. Verification link expired (24 hours)

**Solutions:**
```
1. Check email address is correct
   → Customer Details → Verify email field

2. Resend verification email
   → Customer Details → Resend Verification Email

3. Manually verify email
   → Customer Details → Verify Email Manually
   → Add note: "Verified manually due to email issue"

4. Check email logs
   → System → Email Logs
   → Search for customer email
```

#### Issue 3: Duplicate Customer Records

**Symptoms:**
- Same email appears multiple times
- Customer has multiple accounts

**Possible Causes:**
1. Different tenant_id (this is normal!)
2. Data import error
3. Manual entry error

**Solutions:**
```
1. Check tenant_id
   → If different tenant_id: This is NORMAL
   → Same email can exist across tenants

2. If same tenant_id (error):
   → This shouldn't happen (unique constraint)
   → Contact technical support

3. Merge accounts (if needed)
   → Export both customer data
   → Keep primary account
   → Transfer orders to primary
   → Delete duplicate
```

#### Issue 4: Trust Score Not Updating

**Symptoms:**
- Customer completed orders but score unchanged
- Email verified but no +20 points

**Possible Causes:**
1. Cache not cleared
2. Background job not running
3. Calculation error

**Solutions:**
```
1. Refresh customer data
   → Customer Details → [Refresh]

2. Manually recalculate
   → Customer Details → Trust Score → [Recalculate]

3. Check background jobs
   → System → Queue Status
   → Ensure workers running

4. Check calculation logic
   → Review order history
   → Verify email_verified_at timestamp
   → Check payment success rate
```

#### Issue 5: Customer Can't See Orders

**Symptoms:**
- Customer logged in but order history empty
- Orders exist but not visible to customer

**Possible Causes:**
1. Wrong tenant context
2. Customer ID mismatch
3. Orders belong to different customer record

**Solutions:**
```
1. Verify tenant context
   → Check customer is viewing correct tenant store
   → URL should match tenant domain

2. Check order customer_id
   → Orders → View Order
   → Verify customer_id matches

3. Check for multiple customer records
   → Search by email across tenants
   → Verify correct customer record

4. Re-link orders if needed
   → Contact technical support
   → Provide order IDs and customer UUID
```

### Getting Help

**For Technical Issues:**
- 📧 Email: tech-support@canvastencil.com
- 💬 Live Chat: Available in admin panel
- 📚 Documentation: https://docs.canvastencil.com

**For Business Questions:**
- 📧 Email: support@canvastencil.com
- 📞 Phone: +62 21-1234-5678
- ⏰ Hours: Mon-Fri 9 AM - 5 PM WIB

---

## Appendix

### Database Schema Reference

```sql
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    tenant_id BIGINT NOT NULL,
    
    -- Basic Info
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company_name VARCHAR(255),
    company VARCHAR(255),
    
    -- Customer Classification
    customer_type VARCHAR(50), -- 'individual', 'business'
    status VARCHAR(50) DEFAULT 'active',
    
    -- Address
    address TEXT,
    city VARCHAR(255),
    province VARCHAR(255),
    postal_code VARCHAR(20),
    location JSON,
    
    -- Business Info
    tax_id VARCHAR(100),
    business_license VARCHAR(255),
    
    -- Statistics
    total_orders INTEGER DEFAULT 0,
    total_spent BIGINT DEFAULT 0,
    last_order_at TIMESTAMP,
    last_order_date TIMESTAMP,
    
    -- Authentication (Customer Quote Workflow)
    account_type VARCHAR(20) DEFAULT 'guest', -- 'guest', 'registered', 'verified'
    password_hash VARCHAR(255),
    email_verified_at TIMESTAMP,
    registration_token VARCHAR(255),
    last_login_at TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    
    -- Metadata
    tags JSON,
    notes TEXT,
    metadata JSON,
    notification_preferences JSON,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    -- Constraints
    UNIQUE KEY customers_tenant_id_email_unique (tenant_id, email),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
```

### API Endpoints Reference

**Customer Management:**
- `GET /api/admin/customers` - List customers
- `GET /api/admin/customers/{uuid}` - Get customer details
- `POST /api/admin/customers` - Create customer
- `PUT /api/admin/customers/{uuid}` - Update customer
- `DELETE /api/admin/customers/{uuid}` - Delete customer

**Authentication:**
- `POST /api/customer/register` - Customer registration
- `POST /api/customer/login` - Customer login
- `POST /api/customer/verify-email` - Verify email
- `POST /api/customer/forgot-password` - Request password reset
- `POST /api/customer/reset-password` - Reset password

**Customer Portal:**
- `GET /api/customer/profile` - Get profile
- `PUT /api/customer/profile` - Update profile
- `GET /api/customer/orders` - Get order history
- `GET /api/customer/addresses` - Get addresses
- `POST /api/customer/addresses` - Add address

---

**Document Version**: 2.0  
**Last Updated**: February 19, 2026  
**Language**: Bahasa Indonesia (Primary), English (Technical Terms)  
**Target Audience**: Tenant Administrators

*For customer-facing documentation, see: END_USERS/02-CUSTOMER_ACCOUNT_GUIDE.md*
*For developer documentation, see: DEVELOPER/CUSTOMER_API_REFERENCE.md*
