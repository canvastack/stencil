# 🚀 Phase 1: Foundation - Complete Implementation Roadmap

> **Single Source of Truth untuk Backend Development**  
> **Version**: 1.0.0  
> **Last Updated**: November 7, 2025  
> **Status**: 🟢 Ready for Implementation

---

## 📋 **TABLE OF CONTENTS**

1. [Executive Summary](#executive-summary)
2. [Critical Prerequisites](#critical-prerequisites)
3. [Month 1: Infrastructure & Architecture Setup](#month-1-infrastructure--architecture-setup)
4. [Month 2: Core Business Logic](#month-2-core-business-logic)
5. [Month 3: Admin Panel Integration](#month-3-admin-panel-integration)
6. [Complete File Structure](#complete-file-structure)
7. [OpenAPI Structure](#openapi-structure)
8. [Database Schema](#database-schema)
9. [Testing Strategy](#testing-strategy)
10. [Progress Tracking](#progress-tracking)

---

## 🎯 **EXECUTIVE SUMMARY**

### Goals
- Setup Laravel 10 backend dengan Hexagonal Architecture
- Implement PostgreSQL multi-tenancy (schema per tenant)
- Create RESTful API untuk frontend React yang sudah ada
- Build core business logic untuk Purchase Order workflow
- Integrate dengan existing frontend design system

### Success Criteria
- ✅ Backend API berfungsi penuh untuk existing frontend pages
- ✅ Multi-tenant isolation 100% secure (tested)
- ✅ All Use Cases have 100% test coverage
- ✅ OpenAPI documentation complete & up-to-date
- ✅ CI/CD pipeline working
- ✅ Development & staging environments ready

---

## ⚠️ **CRITICAL PREREQUISITES**

### Non-Negotiable Rules

#### 1. **spatie/laravel-permission Configuration**
```yaml
MANDATORY SETTINGS:
  ✅ teams: true
  ✅ team_foreign_key: 'tenant_id'
  ✅ guard_name: 'api'
  ✅ model_morph_key: 'model_uuid'
  ✅ Roles & Permissions: STRICTLY tenant-scoped
  ❌ NO global roles (NULL tenant_id forbidden)
```

#### 2. **Frontend Design Pattern Compliance**
```yaml
REQUIREMENTS:
  ✅ Follow existing shadcn-ui patterns in src/components/ui/
  ✅ Support Dark/Light mode (theme switching)
  ✅ Fully responsive design
  ✅ Use Tailwind CSS (NO inline styles)
  ✅ TypeScript strict mode
  ❌ NO emojis in code (only in .md docs)
```

#### 3. **Hexagonal Architecture Enforcement**
```yaml
MANDATORY SEPARATION:
  ✅ Domain layer: Pure PHP (no Laravel imports)
  ✅ Repository pattern: Interfaces in Domain, Impl in Infrastructure
  ✅ Use Cases: Pure orchestration logic
  ❌ NO Eloquent in Domain layer
  ❌ NO framework coupling in business logic
```

---

## 📅 **MONTH 1: INFRASTRUCTURE & ARCHITECTURE SETUP**

### **Week 1-2: Project Initialization & Multi-Tenancy**

#### ✅ **Checklist: Laravel Project Setup**

- [ ] **1.1 Laravel Installation**
  ```bash
  composer create-project laravel/laravel backend "10.*"
  cd backend
  ```

- [ ] **1.2 Install Core Dependencies**
  ```bash
  # Multi-tenancy
  composer require stancl/tenancy
  
  # Permissions (CRITICAL: Use correct config!)
  composer require spatie/laravel-permission
  
  # API
  composer require laravel/sanctum
  
  # Development
  composer require --dev laravel/telescope
  composer require --dev barryvdh/laravel-ide-helper
  ```

- [ ] **1.3 PostgreSQL Configuration**
  ```env
  # .env
  DB_CONNECTION=pgsql
  DB_HOST=127.0.0.1
  DB_PORT=5432
  DB_DATABASE=stencil_landlord
  DB_USERNAME=postgres
  DB_PASSWORD=yourpassword
  
  # Redis
  REDIS_HOST=127.0.0.1
  REDIS_PASSWORD=null
  REDIS_PORT=6379
  CACHE_DRIVER=redis
  QUEUE_CONNECTION=redis
  SESSION_DRIVER=redis
  ```

- [ ] **1.4 Configure spatie/laravel-permission**
  ```bash
  php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
  ```
  
  **Edit**: `config/permission.php`
  ```php
  'teams' => true,
  'team_foreign_key' => 'tenant_id',
  'column_names' => [
      'model_morph_key' => 'model_uuid',
  ],
  'guards' => ['api'],
  ```

- [ ] **1.5 Configure Laravel Sanctum**
  ```bash
  php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
  ```
  
  **Edit**: `config/sanctum.php`
  ```php
  'guard' => ['api'],
  'expiration' => 525600, // 1 year for mobile
  'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,127.0.0.1')),
  ```

#### ✅ **Checklist: Multi-Tenancy Configuration**

- [ ] **2.1 Configure Tenancy**
  ```bash
  php artisan tenancy:install
  ```

- [ ] **2.2 Create Tenant Model**
  - File: `app/Models/Tenant.php`
  - Extends: `TenantModel`
  - Add custom attributes: `name`, `domain`, `database_name`

- [ ] **2.3 Configure Tenant Routes**
  ```php
  // routes/tenant.php
  Route::middleware(['api', 'auth:sanctum', 'tenant'])->group(function () {
      // All tenant-specific routes here
  });
  ```

- [ ] **2.4 Create TenantMiddleware**
  - Resolve tenant from subdomain or header
  - Initialize tenancy context
  - Switch database connection

---

### **Week 3-4: Hexagonal Architecture Structure**

#### ✅ **Checklist: Domain Layer Setup**

- [ ] **3.1 Create Shared Value Objects**
  - `app/Domain/Shared/ValueObject/Money.php`
  - `app/Domain/Shared/ValueObject/Email.php`
  - `app/Domain/Shared/ValueObject/PhoneNumber.php`
  - `app/Domain/Shared/Exception/DomainException.php`

- [ ] **3.2 Create Order Domain**
  - `app/Domain/Order/Entity/PurchaseOrder.php`
  - `app/Domain/Order/Enum/OrderStatus.php`
  - `app/Domain/Order/Enum/ProductionType.php`
  - `app/Domain/Order/Repository/PurchaseOrderRepositoryInterface.php`
  - `app/Domain/Order/Service/PriceCalculatorService.php`
  - `app/Domain/Order/Service/OrderCodeGeneratorService.php`

- [ ] **3.3 Create Product Domain**
  - `app/Domain/Product/Entity/Product.php`
  - `app/Domain/Product/Repository/ProductRepositoryInterface.php`

- [ ] **3.4 Create Customer Domain**
  - `app/Domain/Customer/Entity/Customer.php`
  - `app/Domain/Customer/Repository/CustomerRepositoryInterface.php`

- [ ] **3.5 Create Vendor Domain**
  - `app/Domain/Vendor/Entity/Vendor.php`
  - `app/Domain/Vendor/Repository/VendorRepositoryInterface.php`

#### ✅ **Checklist: Application Layer Setup**

- [ ] **4.1 Order Use Cases**
  - `CreatePurchaseOrderUseCase.php`
  - `AssignVendorToOrderUseCase.php`
  - `NegotiateWithVendorUseCase.php`
  - `CreateCustomerQuotationUseCase.php`

- [ ] **4.2 Product Use Cases**
  - `CreateProductUseCase.php`
  - `UpdateProductUseCase.php`
  - `DeleteProductUseCase.php`

- [ ] **4.3 Command & Query DTOs**
  - Create Command classes (write operations)
  - Create Query classes (read operations)

#### ✅ **Checklist: Infrastructure Layer Setup**

- [ ] **5.1 Create Eloquent Models**
  - `PurchaseOrderModel.php`
  - `ProductModel.php`
  - `CustomerModel.php`
  - `VendorModel.php`

- [ ] **5.2 Implement Repositories**
  - `EloquentPurchaseOrderRepository.php`
  - `EloquentProductRepository.php`
  - `EloquentCustomerRepository.php`
  - `EloquentVendorRepository.php`

- [ ] **5.3 Setup Service Provider Bindings**
  ```php
  // app/Providers/AppServiceProvider.php
  $this->app->bind(
      \App\Domain\Order\Repository\PurchaseOrderRepositoryInterface::class,
      \App\Infrastructure\Persistence\Eloquent\Repository\EloquentPurchaseOrderRepository::class
  );
  ```

---

## 📊 **MONTH 2: CORE BUSINESS LOGIC**

### **Week 1-2: Database Schema & Migrations**

#### ✅ **Checklist: Landlord Database**

- [ ] **6.1 Create Tenants Table**
  ```php
  Schema::create('tenants', function (Blueprint $table) {
      $table->uuid('id')->primary();
      $table->string('name');
      $table->string('domain')->unique();
      $table->string('database_name');
      $table->jsonb('settings')->nullable();
      $table->boolean('is_active')->default(true);
      $table->timestamps();
  });
  ```

- [ ] **6.2 Create Users Table**
  ```php
  Schema::create('users', function (Blueprint $table) {
      $table->uuid('id')->primary();
      $table->string('name');
      $table->string('email')->unique();
      $table->timestamp('email_verified_at')->nullable();
      $table->string('password');
      $table->rememberToken();
      $table->timestamps();
  });
  ```

- [ ] **6.3 Create Tenant-User Pivot**
  ```php
  Schema::create('tenant_user', function (Blueprint $table) {
      $table->uuid('tenant_id');
      $table->uuid('user_id');
      $table->string('role')->default('member');
      $table->timestamps();
      
      $table->foreign('tenant_id')->references('id')->on('tenants');
      $table->foreign('user_id')->references('id')->on('users');
      $table->primary(['tenant_id', 'user_id']);
  });
  ```

- [ ] **6.4 Run Landlord Migrations**
  ```bash
  php artisan migrate
  php artisan vendor:publish --tag="permission-migrations"
  php artisan migrate
  ```

#### ✅ **Checklist: Tenant Database Schema**

- [ ] **7.1 Products Table**
  ```php
  Schema::create('products', function (Blueprint $table) {
      $table->uuid('id')->primary();
      $table->string('name');
      $table->string('slug')->unique();
      $table->text('description')->nullable();
      $table->jsonb('features')->nullable();
      $table->jsonb('images')->nullable();
      $table->decimal('base_price', 12, 2)->nullable();
      $table->boolean('is_public')->default(true);
      $table->timestamps();
      $table->softDeletes();
  });
  ```

- [ ] **7.2 Purchase Orders Table**
  ```php
  Schema::create('purchase_orders', function (Blueprint $table) {
      $table->uuid('id')->primary();
      $table->string('order_code')->unique();
      $table->uuid('customer_id');
      $table->uuid('vendor_id')->nullable();
      $table->string('status'); // enum
      $table->string('production_type'); // enum
      $table->jsonb('order_details');
      $table->text('customer_notes')->nullable();
      $table->text('internal_notes')->nullable();
      $table->timestamps();
      
      $table->foreign('customer_id')->references('id')->on('customers');
      $table->foreign('vendor_id')->references('id')->on('vendors');
  });
  ```

- [ ] **7.3 Run Tenant Migrations**
  ```bash
  php artisan tenants:migrate
  ```

---

### **Week 3-4: Core Use Cases Implementation**

#### ✅ **Checklist: Order Management Use Cases**

- [ ] **8.1 CreatePurchaseOrderUseCase**
  - Validate customer data
  - Generate unique order code
  - Create PurchaseOrder entity
  - Save via repository
  - Dispatch OrderCreated event

- [ ] **8.2 AssignVendorToOrderUseCase**
  - Validate vendor exists
  - Check order status
  - Assign vendor
  - Update order status to 'vendor_negotiation'

- [ ] **8.3 Create Tests**
  - Unit tests untuk setiap Use Case
  - Feature tests untuk API endpoints
  - Tenant isolation tests

---

## 🎨 **MONTH 3: ADMIN PANEL INTEGRATION**

### **Week 1-2: API Development**

#### ✅ **Checklist: Product Management API**

- [ ] **9.1 ProductController**
  - `GET /api/v1/admin/products` - List products
  - `POST /api/v1/admin/products` - Create product
  - `GET /api/v1/admin/products/{id}` - Get product
  - `PUT /api/v1/admin/products/{id}` - Update product
  - `DELETE /api/v1/admin/products/{id}` - Delete product

- [ ] **9.2 API Resources**
  - Create ProductResource
  - Create ProductCollection

- [ ] **9.3 Form Requests**
  - CreateProductRequest (validation rules)
  - UpdateProductRequest (validation rules)

#### ✅ **Checklist: Order Management API**

- [ ] **10.1 OrderController**
  - `GET /api/v1/admin/orders` - List orders
  - `POST /api/v1/admin/orders` - Create order
  - `GET /api/v1/admin/orders/{id}` - Get order details
  - `PUT /api/v1/admin/orders/{id}/status` - Update status
  - `POST /api/v1/admin/orders/{id}/assign-vendor` - Assign vendor

---

### **Week 3-4: Frontend Integration**

#### ✅ **Checklist: API Service Layer**

- [ ] **11.1 Create API Client**
  ```typescript
  // src/lib/api/client.ts
  import axios from 'axios';
  
  export const apiClient = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      headers: {
          'Content-Type': 'application/json',
      },
  });
  ```

- [ ] **11.2 Product API Service**
  ```typescript
  // src/lib/api/products.ts
  export const productApi = {
      getAll: () => apiClient.get('/api/v1/admin/products'),
      create: (data) => apiClient.post('/api/v1/admin/products', data),
      // ... etc
  };
  ```

- [ ] **11.3 Integrate with React Query**
  ```typescript
  const { data, isLoading } = useQuery(['products'], productApi.getAll);
  ```

---

## 📂 **COMPLETE FILE STRUCTURE**

See next section for detailed structure...

---

**Document continues in PHASE1_STRUCTURE.md**

