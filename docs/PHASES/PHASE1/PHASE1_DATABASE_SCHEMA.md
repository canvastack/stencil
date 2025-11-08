# 🗄️ Phase 1: Complete Database Schema

> **PostgreSQL Multi-Tenant Database Design**  
> **Companion Document to**: PHASE1_COMPLETE_ROADMAP.md

---

## 🔐 **CRITICAL MULTI-TENANCY RULES**

```yaml
MANDATORY CONFIGURATION:
  ✅ Database: PostgreSQL 15+
  ✅ Strategy: Schema per Tenant
  ✅ Landlord Schema: public (default)
  ✅ Tenant Schemas: tenant_[uuid] or tenant_[slug]
  ✅ Primary Keys: UUID (NOT auto-increment integers)
  ✅ Timestamps: ALWAYS include created_at, updated_at
  ✅ Soft Deletes: Use deleted_at where applicable
  ❌ NO tenant_id in tenant schema tables (redundant)
  ❌ NO cross-tenant foreign keys
```

---

## 📊 **LANDLORD DATABASE (Public Schema)**

### **1. Tenants Table**

```php
Schema::create('tenants', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name');                    // Business name
    $table->string('slug')->unique();          // URL-friendly identifier
    $table->string('domain')->unique();        // tenant1.stencil.com
    $table->string('database_name');           // tenant_uuid
    
    // Configuration
    $table->jsonb('settings')->nullable();     // Tenant-specific settings
    $table->jsonb('features')->nullable();     // Enabled features
    $table->jsonb('limits')->nullable();       // Resource limits
    
    // Subscription
    $table->string('plan')->default('starter'); // starter, business, enterprise
    $table->timestamp('trial_ends_at')->nullable();
    $table->timestamp('subscription_ends_at')->nullable();
    
    // Status
    $table->boolean('is_active')->default(true);
    $table->timestamp('suspended_at')->nullable();
    
    $table->timestamps();
    $table->softDeletes();
    
    // Indexes
    $table->index('domain');
    $table->index('slug');
    $table->index(['is_active', 'suspended_at']);
});
```

**Example Data:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "PT Custom Etching Xenial",
  "slug": "pt-cex",
  "domain": "cex.stencil.com",
  "database_name": "tenant_550e8400",
  "plan": "business",
  "is_active": true
}
```

---

### **2. Users Table**

```php
Schema::create('users', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name');
    $table->string('email')->unique();
    $table->timestamp('email_verified_at')->nullable();
    $table->string('password');
    
    // Profile
    $table->string('avatar_url')->nullable();
    $table->string('phone_number')->nullable();
    $table->jsonb('preferences')->nullable();  // UI preferences, notifications, etc.
    
    // Security
    $table->string('two_factor_secret')->nullable();
    $table->text('two_factor_recovery_codes')->nullable();
    $table->timestamp('last_login_at')->nullable();
    $table->ipAddress('last_login_ip')->nullable();
    
    // Status
    $table->boolean('is_active')->default(true);
    $table->timestamp('suspended_at')->nullable();
    
    $table->rememberToken();
    $table->timestamps();
    $table->softDeletes();
    
    // Indexes
    $table->index('email');
    $table->index('is_active');
});
```

---

### **3. Tenant-User Pivot Table**

```php
Schema::create('tenant_user', function (Blueprint $table) {
    $table->uuid('tenant_id');
    $table->uuid('user_id');
    
    // Role in this tenant (NOT using spatie roles here, just pivot metadata)
    $table->string('role_name')->default('member');  // owner, admin, manager, member
    
    // Permissions can be different per tenant
    $table->boolean('is_owner')->default(false);
    $table->jsonb('custom_permissions')->nullable();
    
    // Status
    $table->boolean('is_active')->default(true);
    $table->timestamp('joined_at')->useCurrent();
    $table->timestamp('left_at')->nullable();
    
    $table->timestamps();
    
    // Constraints
    $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
    $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
    $table->primary(['tenant_id', 'user_id']);
    
    // Indexes
    $table->index('tenant_id');
    $table->index('user_id');
    $table->index(['tenant_id', 'is_active']);
});
```

---

### **4. Personal Access Tokens (Laravel Sanctum)**

```php
Schema::create('personal_access_tokens', function (Blueprint $table) {
    $table->id();
    $table->uuidMorphs('tokenable');           // Can be User or other model
    $table->string('name');                     // Device/app name
    $table->string('token', 64)->unique();
    $table->text('abilities')->nullable();
    $table->timestamp('last_used_at')->nullable();
    $table->timestamp('expires_at')->nullable();
    $table->timestamps();
    
    // Indexes
    $table->index(['tokenable_type', 'tokenable_id']);
});
```

---

### **5. Spatie Permission Tables**

**CRITICAL CONFIG:**
```php
// config/permission.php
'teams' => true,
'team_foreign_key' => 'tenant_id',
'column_names' => [
    'model_morph_key' => 'model_uuid',  // Use UUID instead of ID
],
'guards' => ['api'],
```

**Tables Created by Spatie:**
```php
// permissions
Schema::create('permissions', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->uuid('tenant_id')->nullable();  // MUST be nullable for seeding
    $table->string('name');
    $table->string('guard_name');
    $table->timestamps();
    
    $table->unique(['tenant_id', 'name', 'guard_name']);
});

// roles
Schema::create('roles', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->uuid('tenant_id')->nullable();  // MUST be nullable
    $table->string('name');
    $table->string('guard_name');
    $table->timestamps();
    
    $table->unique(['tenant_id', 'name', 'guard_name']);
});

// model_has_permissions
Schema::create('model_has_permissions', function (Blueprint $table) {
    $table->unsignedBigInteger('permission_id');
    $table->string('model_type');
    $table->uuid('model_uuid');              // Changed from model_id
    $table->uuid('tenant_id');
    
    $table->foreign('permission_id')->references('id')->on('permissions')->onDelete('cascade');
    $table->primary(['tenant_id', 'permission_id', 'model_uuid', 'model_type'], 'model_has_permissions_permission_model_type_primary');
});

// model_has_roles
Schema::create('model_has_roles', function (Blueprint $table) {
    $table->unsignedBigInteger('role_id');
    $table->string('model_type');
    $table->uuid('model_uuid');              // Changed from model_id
    $table->uuid('tenant_id');
    
    $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
    $table->primary(['tenant_id', 'role_id', 'model_uuid', 'model_type'], 'model_has_roles_role_model_type_primary');
});

// role_has_permissions
Schema::create('role_has_permissions', function (Blueprint $table) {
    $table->unsignedBigInteger('permission_id');
    $table->unsignedBigInteger('role_id');
    
    $table->foreign('permission_id')->references('id')->on('permissions')->onDelete('cascade');
    $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
    $table->primary(['permission_id', 'role_id'], 'role_has_permissions_permission_id_role_id_primary');
});
```

**Seeding Roles & Permissions:**
```php
// database/seeders/RolePermissionSeeder.php

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

public function run()
{
    // Create for tenant (tenant_id will be set automatically)
    $tenant = Tenant::first();
    
    tenancy()->initialize($tenant);
    
    // Create permissions
    Permission::create(['name' => 'view_dashboard', 'guard_name' => 'api', 'tenant_id' => $tenant->id]);
    Permission::create(['name' => 'manage_products', 'guard_name' => 'api', 'tenant_id' => $tenant->id]);
    Permission::create(['name' => 'manage_orders', 'guard_name' => 'api', 'tenant_id' => $tenant->id]);
    Permission::create(['name' => 'manage_users', 'guard_name' => 'api', 'tenant_id' => $tenant->id]);
    Permission::create(['name' => 'manage_settings', 'guard_name' => 'api', 'tenant_id' => $tenant->id]);
    
    // Create roles
    $admin = Role::create(['name' => 'admin', 'guard_name' => 'api', 'tenant_id' => $tenant->id]);
    $manager = Role::create(['name' => 'manager', 'guard_name' => 'api', 'tenant_id' => $tenant->id]);
    $staff = Role::create(['name' => 'staff', 'guard_name' => 'api', 'tenant_id' => $tenant->id]);
    
    // Assign permissions
    $admin->givePermissionTo(Permission::all());
    $manager->givePermissionTo(['view_dashboard', 'manage_products', 'manage_orders']);
    $staff->givePermissionTo(['view_dashboard', 'manage_orders']);
}
```

---

## 📊 **TENANT DATABASE (Per-Tenant Schema)**

**Schema Naming Convention:**
- `tenant_{uuid}` - e.g., `tenant_550e8400`
- OR `tenant_{slug}` - e.g., `tenant_ptcex`

---

### **1. Products Table**

```php
Schema::create('products', function (Blueprint $table) {
    $table->uuid('id')->primary();
    
    // Basic Info
    $table->string('name');
    $table->string('slug')->unique();
    $table->text('description')->nullable();
    $table->text('short_description')->nullable();
    
    // Pricing (nullable for products without fixed price)
    $table->decimal('base_price', 12, 2)->nullable();
    $table->string('currency', 3)->default('IDR');
    
    // Media
    $table->jsonb('images')->nullable();       // Array of image URLs
    $table->jsonb('gallery')->nullable();      // Additional images
    $table->string('thumbnail_url')->nullable();
    
    // Features & Specifications
    $table->jsonb('features')->nullable();     // Product features
    $table->jsonb('specifications')->nullable(); // Technical specs
    $table->jsonb('custom_fields')->nullable(); // Tenant-specific fields
    
    // Categorization
    $table->uuid('category_id')->nullable();
    $table->jsonb('tags')->nullable();
    
    // SEO
    $table->string('meta_title')->nullable();
    $table->text('meta_description')->nullable();
    $table->jsonb('meta_keywords')->nullable();
    
    // Status
    $table->boolean('is_public')->default(true);
    $table->boolean('is_featured')->default(false);
    $table->integer('sort_order')->default(0);
    
    $table->timestamps();
    $table->softDeletes();
    
    // Indexes
    $table->index('slug');
    $table->index('category_id');
    $table->index(['is_public', 'is_featured']);
    $table->index('sort_order');
});
```

**Example Data:**
```json
{
  "id": "prod-001",
  "name": "Plakat Etching Premium",
  "slug": "plakat-etching-premium",
  "description": "Plakat etching berkualitas tinggi dengan detail presisi",
  "base_price": 150000.00,
  "images": ["/uploads/products/plakat-001.jpg"],
  "specifications": {
    "materials": ["Kuningan", "Stainless Steel", "Akrilik"],
    "sizes": ["10x15cm", "15x20cm", "20x30cm"],
    "thickness": ["3mm", "5mm", "10mm"]
  },
  "is_public": true
}
```

---

### **2. Customers Table**

```php
Schema::create('customers', function (Blueprint $table) {
    $table->uuid('id')->primary();
    
    // Basic Info
    $table->string('name');
    $table->string('email')->unique();
    $table->string('phone_number')->nullable();
    $table->string('company_name')->nullable();
    
    // Address
    $table->text('address')->nullable();
    $table->string('city')->nullable();
    $table->string('province')->nullable();
    $table->string('postal_code')->nullable();
    $table->string('country')->default('Indonesia');
    
    // Business Info
    $table->string('tax_id')->nullable();      // NPWP
    $table->string('business_type')->nullable();
    
    // Custom Fields
    $table->jsonb('custom_fields')->nullable();
    
    // Notes & Tags
    $table->text('notes')->nullable();
    $table->jsonb('tags')->nullable();
    
    // Status
    $table->boolean('is_active')->default(true);
    $table->string('status')->default('active'); // active, inactive, blocked
    
    // Statistics (denormalized for performance)
    $table->integer('total_orders')->default(0);
    $table->decimal('total_spent', 14, 2)->default(0);
    $table->timestamp('last_order_at')->nullable();
    
    $table->timestamps();
    $table->softDeletes();
    
    // Indexes
    $table->index('email');
    $table->index('phone_number');
    $table->index(['is_active', 'status']);
});
```

---

### **3. Vendors Table**

```php
Schema::create('vendors', function (Blueprint $table) {
    $table->uuid('id')->primary();
    
    // Basic Info
    $table->string('name');
    $table->string('company_name')->nullable();
    $table->string('contact_person');
    $table->string('email')->unique();
    $table->string('phone_number');
    
    // Address
    $table->text('address');
    $table->string('city');
    $table->string('province');
    $table->string('postal_code')->nullable();
    
    // Business Info
    $table->string('tax_id')->nullable();      // NPWP
    
    // Specializations (what can they produce?)
    $table->jsonb('specializations');          // ["etching_kuningan", "laser_cutting"]
    $table->jsonb('capabilities')->nullable(); // Detailed capabilities
    
    // Quality & Performance
    $table->string('quality_tier')->default('standard'); // standard, premium
    $table->integer('average_lead_time_days')->nullable();
    $table->decimal('rating', 3, 2)->default(0);
    $table->integer('completed_orders')->default(0);
    
    // Financial
    $table->jsonb('bank_details');             // Bank account info
    $table->string('payment_terms')->nullable(); // Net 30, COD, etc.
    
    // Status
    $table->string('status')->default('active'); // active, inactive, on_hold
    $table->boolean('is_verified')->default(false);
    
    // Notes
    $table->text('notes')->nullable();
    
    $table->timestamps();
    $table->softDeletes();
    
    // Indexes
    $table->index('email');
    $table->index('phone_number');
    $table->index('status');
    $table->index('is_verified');
});
```

**Example Data:**
```json
{
  "id": "vendor-001",
  "name": "CV Etching Indonesia",
  "specializations": ["etching_kuningan", "etching_stainless", "grafir_akrilik"],
  "bank_details": {
    "bank_name": "BCA",
    "account_number": "1234567890",
    "account_name": "CV Etching Indonesia"
  },
  "quality_tier": "premium",
  "status": "active"
}
```

---

### **4. Purchase Orders Table**

```php
Schema::create('purchase_orders', function (Blueprint $table) {
    $table->uuid('id')->primary();
    
    // Order Identity
    $table->string('order_code')->unique();    // PO-2024-001
    
    // Relationships
    $table->uuid('customer_id');
    $table->uuid('vendor_id')->nullable();     // Assigned later
    $table->uuid('created_by_user_id');       // Admin who created
    
    // Order Type
    $table->string('production_type');         // vendor, internal
    
    // Status Workflow
    $table->string('status');                  // See OrderStatus enum
    
    // Order Details
    $table->jsonb('order_details');            // Product specs, quantity, etc.
    $table->text('customer_notes')->nullable();
    $table->text('internal_notes')->nullable();
    
    // Files
    $table->jsonb('customer_files')->nullable(); // Design files from customer
    $table->jsonb('vendor_files')->nullable();   // Production files
    
    // Important Dates
    $table->timestamp('vendor_assigned_at')->nullable();
    $table->timestamp('customer_approved_at')->nullable();
    $table->timestamp('production_started_at')->nullable();
    $table->timestamp('production_completed_at')->nullable();
    $table->timestamp('shipped_at')->nullable();
    $table->timestamp('completed_at')->nullable();
    $table->timestamp('cancelled_at')->nullable();
    
    // Estimated Dates
    $table->date('estimated_completion_date')->nullable();
    $table->date('estimated_delivery_date')->nullable();
    
    $table->timestamps();
    $table->softDeletes();
    
    // Constraints
    $table->foreign('customer_id')->references('id')->on('customers');
    $table->foreign('vendor_id')->references('id')->on('vendors');
    
    // Indexes
    $table->index('order_code');
    $table->index('customer_id');
    $table->index('vendor_id');
    $table->index('status');
    $table->index('production_type');
    $table->index('created_at');
});
```

**OrderStatus Enum Values:**
```
- new
- sourcing_vendor
- vendor_negotiation
- customer_approval
- awaiting_payment
- in_production
- production_complete
- shipped
- completed
- cancelled
```

---

### **5. Order Quotes Table**

```php
Schema::create('order_quotes', function (Blueprint $table) {
    $table->uuid('id')->primary();
    
    $table->uuid('purchase_order_id');
    $table->uuid('vendor_id')->nullable();     // Quote from vendor
    
    // Pricing
    $table->decimal('vendor_price', 12, 2)->nullable();       // Price from vendor
    $table->decimal('markup_amount', 12, 2)->default(0);      // Our markup
    $table->decimal('markup_percentage', 5, 2)->default(0);   // Markup %
    $table->decimal('ppn_amount', 12, 2)->default(0);         // Tax
    $table->decimal('final_price_for_customer', 12, 2);       // Total to customer
    
    // Production
    $table->integer('estimated_production_days')->nullable();
    $table->date('estimated_completion_date')->nullable();
    
    // Status
    $table->string('status')->default('pending'); // pending, approved, rejected
    $table->timestamp('approved_at')->nullable();
    $table->timestamp('rejected_at')->nullable();
    $table->string('rejection_reason')->nullable();
    
    // Notes
    $table->text('vendor_notes')->nullable();
    $table->text('internal_notes')->nullable();
    
    $table->timestamps();
    
    // Constraints
    $table->foreign('purchase_order_id')->references('id')->on('purchase_orders')->onDelete('cascade');
    $table->foreign('vendor_id')->references('id')->on('vendors');
    
    // Indexes
    $table->index('purchase_order_id');
    $table->index('vendor_id');
    $table->index('status');
});
```

---

### **6. Invoices Table**

```php
Schema::create('invoices', function (Blueprint $table) {
    $table->uuid('id')->primary();
    
    $table->uuid('purchase_order_id');
    $table->string('invoice_number')->unique(); // INV-2024-001
    
    // Recipient (vendor or customer)
    $table->string('recipient_type');          // customer, vendor
    $table->uuid('recipient_id');              // customer_id or vendor_id
    
    // Amount
    $table->decimal('amount', 12, 2);
    $table->decimal('paid_amount', 12, 2)->default(0);
    $table->decimal('remaining_amount', 12, 2);
    
    // Payment Type
    $table->string('payment_type');            // down_payment, full_payment, remaining_payment
    
    // Dates
    $table->date('due_date')->nullable();
    $table->date('paid_at')->nullable();
    
    // Status
    $table->string('status')->default('unpaid'); // unpaid, paid, overdue, cancelled
    
    // Notes
    $table->text('notes')->nullable();
    
    $table->timestamps();
    $table->softDeletes();
    
    // Constraints
    $table->foreign('purchase_order_id')->references('id')->on('purchase_orders');
    
    // Indexes
    $table->index('invoice_number');
    $table->index('purchase_order_id');
    $table->index(['recipient_type', 'recipient_id']);
    $table->index('status');
    $table->index('due_date');
});
```

---

### **7. Payments Table**

```php
Schema::create('payments', function (Blueprint $table) {
    $table->uuid('id')->primary();
    
    $table->uuid('invoice_id');
    
    // Amount
    $table->decimal('amount_paid', 12, 2);
    
    // Payment Method
    $table->string('payment_method');          // cash, bank_transfer, payment_gateway
    
    // Payment Gateway Details
    $table->string('gateway_name')->nullable(); // midtrans, xendit, stripe
    $table->string('gateway_transaction_id')->nullable();
    $table->jsonb('gateway_response')->nullable();
    
    // Bank Transfer Details
    $table->string('bank_name')->nullable();
    $table->string('account_number')->nullable();
    $table->string('transfer_receipt_url')->nullable();
    
    // Verification
    $table->boolean('is_verified')->default(false);
    $table->timestamp('verified_at')->nullable();
    $table->uuid('verified_by_user_id')->nullable();
    $table->text('verification_notes')->nullable();
    
    // Dates
    $table->timestamp('payment_date');
    
    // Notes
    $table->text('notes')->nullable();
    
    $table->timestamps();
    
    // Constraints
    $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('cascade');
    
    // Indexes
    $table->index('invoice_id');
    $table->index('payment_method');
    $table->index('is_verified');
    $table->index('payment_date');
});
```

---

### **8. Settings Table**

```php
Schema::create('settings', function (Blueprint $table) {
    $table->uuid('id')->primary();
    
    $table->string('key')->unique();
    $table->jsonb('value');                    // Flexible value storage
    $table->string('type')->default('json');   // json, string, boolean, integer
    $table->text('description')->nullable();
    
    // Grouping
    $table->string('group')->default('general'); // general, email, payment, etc.
    
    // Permissions
    $table->boolean('is_public')->default(false); // Can be accessed by frontend?
    $table->boolean('is_editable')->default(true);
    
    $table->timestamps();
    
    // Indexes
    $table->index('key');
    $table->index('group');
    $table->index(['group', 'is_public']);
});
```

**Example Settings:**
```json
{
  "key": "email_notifications_enabled",
  "value": true,
  "type": "boolean",
  "group": "notifications"
},
{
  "key": "default_currency",
  "value": "IDR",
  "type": "string",
  "group": "general"
},
{
  "key": "payment_gateways",
  "value": {
    "midtrans": {"enabled": true, "server_key": "xxx"},
    "xendit": {"enabled": false}
  },
  "type": "json",
  "group": "payment"
}
```

---

## 📈 **DATABASE INDEXES & PERFORMANCE**

### **Index Strategy**

```sql
-- Foreign keys (automatic performance boost)
CREATE INDEX idx_orders_customer ON purchase_orders(customer_id);
CREATE INDEX idx_orders_vendor ON purchase_orders(vendor_id);

-- Status filtering (very common queries)
CREATE INDEX idx_orders_status ON purchase_orders(status);
CREATE INDEX idx_orders_type ON purchase_orders(production_type);

-- Date-based queries
CREATE INDEX idx_orders_created ON purchase_orders(created_at DESC);
CREATE INDEX idx_invoices_due ON invoices(due_date);

-- Composite indexes for common filter combinations
CREATE INDEX idx_orders_status_created ON purchase_orders(status, created_at DESC);
CREATE INDEX idx_products_public_featured ON products(is_public, is_featured);

-- JSONB indexes for searchable fields
CREATE INDEX idx_products_specs ON products USING GIN (specifications);
CREATE INDEX idx_vendors_specializations ON vendors USING GIN (specializations);
```

---

## 🔄 **MIGRATION EXECUTION ORDER**

### **Landlord Database:**
```bash
# 1. Core tables
php artisan migrate --path=database/migrations/landlord

# 2. Permission tables
php artisan vendor:publish --tag=permission-migrations
php artisan migrate

# 3. Sanctum tables
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate

# 4. Seed initial data
php artisan db:seed --class=TenantSeeder
php artisan db:seed --class=UserSeeder
```

### **Tenant Database:**
```bash
# Run for ALL tenants
php artisan tenants:migrate

# Or for specific tenant
php artisan tenants:migrate --tenants=550e8400-e29b-41d4-a716-446655440000
```

---

**Document continues in PHASE1_API_EXAMPLES.md**

