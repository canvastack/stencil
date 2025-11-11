# MULTI-TENANT ARCHITECTURE
## Enterprise-Grade Multi-Tenancy with Hexagonal Architecture

**Version:** 1.0  
**Last Updated:** November 11, 2025  
**Complexity:** High  
**Impact:** Critical - Foundation for all systems  
**Status:** 🚧 **Architecture Blueprint** (Backend Implementation Planned)

> **⚠️ IMPLEMENTATION NOTE**  
> This document describes the **planned backend multi-tenant architecture**.  
> **Current**: React SPA (single-tenant) with mock data  
> **Planned**: Laravel API + Supabase/PostgreSQL with RLS + Frontend tenant context  
> **Architecture**: API-First with clear Frontend-Backend separation

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Multi-Tenancy Strategy Analysis](#multi-tenancy-strategy-analysis)
3. [Recommended Architecture](#recommended-architecture)
4. [Hexagonal Architecture Integration](#hexagonal-architecture-integration)
5. [Database Schema](#database-schema)
6. [Tenant Isolation Mechanisms](#tenant-isolation-mechanisms)
7. [Tenant Lifecycle Management](#tenant-lifecycle-management)
8. [API Endpoints](#api-endpoints)
9. [Performance Optimization](#performance-optimization)
10. [Security](#security)
11. [Scaling Strategies](#scaling-strategies)
12. [Monitoring & Observability](#monitoring--observability)
13. [Disaster Recovery](#disaster-recovery)
14. [Code Examples](#code-examples)
15. [Migration Path](#migration-path)

---

## EXECUTIVE SUMMARY

### What is Multi-Tenancy?

Multi-tenancy adalah architectural pattern dimana **single instance aplikasi** melayani **multiple customers (tenants)** dengan complete data isolation, tenant-specific configurations, dan resource sharing efficiency.

### Business Value

**Cost Efficiency:**
- 💰 **70% reduction** in infrastructure costs vs dedicated instances
- 💰 **Single codebase** untuk maintain (vs N codebases)
- 💰 **Shared resources** (database, cache, storage)
- 💰 **Automated scaling** untuk all tenants

**Operational Benefits:**
- ⚡ **Instant provisioning**: New tenant dalam < 10 detik
- ⚡ **Centralized updates**: Deploy sekali untuk semua tenants
- ⚡ **Unified monitoring**: Single dashboard untuk semua metrics
- ⚡ **Data aggregation**: Cross-tenant analytics untuk business insights

**Scalability:**
- 📈 Support **10,000+ tenants** pada single instance
- 📈 Horizontal scaling untuk capacity growth
- 📈 Auto-scaling berdasarkan load
- 📈 Regional deployment untuk global reach

### Technical Goals

1. **Complete Data Isolation**: Zero risk cross-tenant data leakage
2. **Performance**: < 10ms overhead untuk tenant identification
3. **Flexibility**: Tenant-specific features & configurations
4. **Maintainability**: Clean architecture dengan clear boundaries
5. **Observability**: Per-tenant metrics dan logging

---

## MULTI-TENANCY STRATEGY ANALYSIS

### Strategy 1: Single Database + tenant_id (RECOMMENDED ✅)

**Architecture:**
```
┌─────────────────────────────────────────┐
│        Application Instance             │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   Tenant Context Middleware      │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   Single Shared Database         │  │
│  │                                  │  │
│  │   products (tenant_id, ...)      │  │
│  │   orders (tenant_id, ...)        │  │
│  │   users (tenant_id, ...)         │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**How It Works:**
- Every table has `tenant_id` column (UUID, FK to tenants table)
- Middleware automatically injects `WHERE tenant_id = $current_tenant` to ALL queries
- Application-level isolation via query scope
- Single connection pool shared across all tenants

**Pros:**
- ✅ **Cost Effective**: Single database instance
- ✅ **Easy Maintenance**: One schema untuk update
- ✅ **Fast Provisioning**: Create tenant = Insert 1 row
- ✅ **Resource Sharing**: Efficient use of memory/CPU
- ✅ **Backup Simplicity**: Single backup untuk all tenants
- ✅ **Cross-Tenant Analytics**: Easy to aggregate data

**Cons:**
- ⚠️ **Noisy Neighbor**: Satu tenant dengan heavy load bisa affect others
- ⚠️ **Compliance Risk**: All data in same database (regulatory concerns)
- ⚠️ **Schema Changes**: Affect all tenants simultaneously
- ⚠️ **Security**: Requires perfect query filtering (risk of bugs)

**When to Use:**
- ✅ Small to medium-sized tenants (< 10GB data per tenant)
- ✅ Similar resource usage patterns
- ✅ Cost is primary concern
- ✅ B2B SaaS with standard compliance requirements

**Performance Characteristics:**
- **Query Overhead**: 5-10ms untuk tenant filtering
- **Indexing**: Composite indexes (tenant_id, primary_key)
- **Connection Pool**: Shared (100-200 connections típico)
- **Scale Limit**: 10,000 tenants per instance

---

### Strategy 2: Database per Tenant

**Architecture:**
```
┌─────────────────────────────────────────┐
│        Application Instance             │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   Tenant Router Middleware       │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ├─ DB: tenant_abc                   │  │
│  │   └─ products, orders, users     │  │
│  │                                   │  │
│  ├─ DB: tenant_xyz                   │  │
│  │   └─ products, orders, users     │  │
│  │                                   │  │
│  └─ DB: tenant_123                   │  │
│      └─ products, orders, users      │  │
└─────────────────────────────────────────┘
```

**How It Works:**
- Each tenant has dedicated database
- Application dynamically switches database connection based on tenant context
- Complete physical isolation
- Independent scaling per tenant

**Pros:**
- ✅ **Complete Isolation**: No risk of data leakage
- ✅ **Independent Scaling**: Scale individual tenants
- ✅ **Custom Schemas**: Per-tenant schema modifications
- ✅ **Compliance**: Easier regulatory compliance (data residency)
- ✅ **Performance**: No noisy neighbor problem
- ✅ **Backup Flexibility**: Per-tenant backup schedules

**Cons:**
- ❌ **High Cost**: N databases = N × database costs
- ❌ **Complex Maintenance**: Update schema on N databases
- ❌ **Slow Provisioning**: Create database takes 30-60 seconds
- ❌ **Connection Overhead**: N × connection pools
- ❌ **Hard to Aggregate**: Cross-tenant analytics complex
- ❌ **Resource Waste**: Small tenants waste database resources

**When to Use:**
- ✅ Large enterprise tenants (> 100GB data per tenant)
- ✅ Strict compliance requirements (HIPAA, SOC2 Type II)
- ✅ Tenants need custom schemas
- ✅ High-value customers willing to pay premium

**Performance Characteristics:**
- **Query Overhead**: 20-50ms untuk database switching
- **Connection Pool**: Per database (50-100 connections each)
- **Scale Limit**: 100-500 tenants per instance (connection limit)

---

### Strategy 3: Schema per Tenant

**Architecture:**
```
┌─────────────────────────────────────────┐
│        Application Instance             │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │     Single Database              │  │
│  │                                  │  │
│  │  Schema: tenant_abc              │  │
│  │  └─ products, orders, users      │  │
│  │                                  │  │
│  │  Schema: tenant_xyz              │  │
│  │  └─ products, orders, users      │  │
│  │                                  │  │
│  │  Schema: tenant_123              │  │
│  │  └─ products, orders, users      │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**How It Works:**
- Single database with multiple schemas
- Each tenant has dedicated schema (namespace)
- PostgreSQL SET search_path untuk switch schema

**Pros:**
- ✅ **Logical Isolation**: Better than tenant_id approach
- ✅ **Moderate Cost**: Single database instance
- ✅ **Schema Flexibility**: Per-tenant schema modifications possible
- ✅ **Better Performance**: No tenant_id filtering overhead

**Cons:**
- ⚠️ **PostgreSQL Specific**: Not all databases support schemas well
- ⚠️ **Complex Migration**: Schema changes need to run on N schemas
- ⚠️ **Connection Overhead**: Need to SET search_path on each query
- ⚠️ **Limited Scale**: PostgreSQL limit ~1000 schemas
- ⚠️ **Backup Complexity**: Harder than single database

**When to Use:**
- ⚠️ **Medium-sized tenants** (10-100GB data per tenant)
- ⚠️ PostgreSQL required
- ⚠️ Need balance between isolation & cost

**Performance Characteristics:**
- **Query Overhead**: 10-20ms untuk schema switching
- **Scale Limit**: 500-1,000 tenants per instance

---

### COMPARISON MATRIX

| Criteria | Single DB + tenant_id | Schema per Tenant | DB per Tenant |
|----------|----------------------|-------------------|---------------|
| **Cost** | ⭐⭐⭐⭐⭐ (Lowest) | ⭐⭐⭐ (Medium) | ⭐ (Highest) |
| **Data Isolation** | ⭐⭐ (Application) | ⭐⭐⭐⭐ (Logical) | ⭐⭐⭐⭐⭐ (Physical) |
| **Performance** | ⭐⭐⭐⭐ (Good) | ⭐⭐⭐ (OK) | ⭐⭐⭐⭐⭐ (Excellent) |
| **Scalability** | ⭐⭐⭐⭐⭐ (10K+) | ⭐⭐⭐ (500-1K) | ⭐⭐ (100-500) |
| **Maintenance** | ⭐⭐⭐⭐⭐ (Easy) | ⭐⭐ (Complex) | ⭐ (Very Complex) |
| **Provisioning** | ⭐⭐⭐⭐⭐ (< 1s) | ⭐⭐⭐ (5-10s) | ⭐ (30-60s) |
| **Compliance** | ⭐⭐ (Limited) | ⭐⭐⭐ (Good) | ⭐⭐⭐⭐⭐ (Excellent) |
| **Analytics** | ⭐⭐⭐⭐⭐ (Easy) | ⭐⭐⭐ (OK) | ⭐ (Complex) |

---

## RECOMMENDED ARCHITECTURE

### Decision: **Single Database + tenant_id with Supabase Row-Level Security (RLS)** ✅

**Rationale:**

1. **Target Market**: B2B SaaS dengan SME customers
   - Majority tenants will be small-medium businesses
   - Data size < 10GB per tenant típico
   - Similar resource usage patterns

2. **Cost Optimization**:
   - Supporting 10,000 tenants on **single Supabase/PostgreSQL instance**
   - Supabase Free tier untuk development, Pro tier ~$25/month untuk production
   - vs 10,000 × dedicated databases (~$2M/month)
   - **99% cost savings**

3. **Operational Simplicity**:
   - Single migration untuk schema changes
   - Single backup untuk all tenants
   - Easier to monitor & debug
   - **Supabase dashboard** untuk database management

4. **Scalability**:
   - Can support 10,000+ tenants per instance
   - Horizontal scaling via Supabase read replicas
   - Shard by tenant_id if needed (future)

5. **Security dengan Supabase RLS**:
   - **Database-level security**: Row-Level Security policies enforced di PostgreSQL
   - **Double protection**: Application-level (Laravel middleware) + Database-level (RLS)
   - **Zero-trust**: Bahkan jika application bug, RLS mencegah cross-tenant access
   - **Audit logging**: Supabase built-in audit logs

**Mitigation for Cons:**

| Risk | Mitigation |
|------|------------|
| Noisy Neighbor | Resource quotas, rate limiting, query timeouts, Supabase connection pooling |
| Security (Data Leakage) | **Supabase Row-Level Security (RLS)** + Laravel middleware + audit logging + automated testing |
| Schema Changes | Blue-green deployments, feature flags, rollback capability, Supabase migrations |
| Compliance | Encryption at rest/transit, audit logs, SOC2 Type II certification, Supabase compliance |

### **Supabase RLS Benefits**

**Why Supabase + RLS is Ideal for This Architecture:**

✅ **Database-Level Isolation**: RLS policies ensure queries automatically filtered by tenant_id  
✅ **Developer Experience**: Supabase Studio untuk easy RLS policy management  
✅ **Real-time Capabilities**: Supabase Realtime untuk live updates (future feature)  
✅ **Storage Integration**: Supabase Storage untuk tenant-scoped file uploads  
✅ **Authentication Integration**: Can integrate Supabase Auth dengan Laravel Sanctum  
✅ **Cost Effective**: Free tier generous, Pro tier affordable  
✅ **PostgreSQL Native**: Full PostgreSQL 15+ features (JSONB, triggers, functions)

---

## HEXAGONAL ARCHITECTURE INTEGRATION

### Architecture Overview

Hexagonal Architecture (Ports & Adapters) dengan **API-First approach** ensures clean separation between frontend (React), backend API (Laravel), dan infrastructure (Supabase), making multi-tenancy transparent to domain layer.

```
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER (React SPA)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React Components + Pages                                │   │
│  │  - Tenant-aware routing                                  │   │
│  │  - Client-side theme loading                             │   │
│  │  - State management (Zustand/TanStack Query)             │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐   │
│  │  Tenant Context Provider (React)                         │   │
│  │  - Resolve tenant dari subdomain/domain                  │   │
│  │  - Store tenant ID dalam context                         │   │
│  │  - Provide tenant info ke seluruh components             │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐   │
│  │  API Client Layer (axios/fetch)                          │   │
│  │  - Attach tenant_id ke request headers                   │   │
│  │  - Handle authentication tokens (Sanctum)                │   │
│  │  - Automatic retry & error handling                      │   │
│  └────────────────────┬─────────────────────────────────────┘   │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        │ HTTP/HTTPS (REST/GraphQL)
                        │ Headers: Authorization, X-Tenant-ID
                        │
┌───────────────────────▼──────────────────────────────────────────┐
│              BACKEND API LAYER (Laravel - PLANNED)               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Routes (REST/GraphQL)                               │   │
│  │  - GET /api/products                                     │   │
│  │  - POST /api/orders                                      │   │
│  │  - GraphQL endpoint (optional)                           │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐   │
│  │  Tenant Identification Middleware                        │   │
│  │  - Extract tenant dari header/subdomain                  │   │
│  │  - Validate tenant exists & active                       │   │
│  │  - Set tenant context untuk request lifecycle            │   │
│  │  - Set Supabase RLS context                              │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐   │
│  │  Authentication Middleware (Sanctum)                     │   │
│  │  - Verify auth token                                     │   │
│  │  - Load user & permissions                               │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐   │
│  │  APPLICATION LAYER - Use Cases (tenant-aware)            │   │
│  │                                                           │   │
│  │  CreateProductUseCase(tenantContext, data)               │   │
│  │  GetOrdersUseCase(tenantContext, filters)                │   │
│  │  ProcessPaymentUseCase(tenantContext, payment)           │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │ Uses Ports                               │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  DOMAIN LAYER (tenant-agnostic business logic)           │   │
│  │                                                           │   │
│  │  Product, Order, Payment entities                        │   │
│  │  Business rules, validations, domain events              │   │
│  │  Pure business logic tanpa awareness of tenants          │   │
│  └────────────────────┬─────────────────────────────────────┘   │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────────────┐
│              INFRASTRUCTURE LAYER (PLANNED)                       │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Tenant-Scoped Repositories (Adapters)                   │    │
│  │                                                           │    │
│  │  SupabaseProductRepository implements ProductPort        │    │
│  │  SupabaseOrderRepository implements OrderPort            │    │
│  │                                                           │    │
│  │  - Queries automatically scoped by tenant_id             │    │
│  │  - Supabase RLS policies enforced                        │    │
│  └────────────────────┬─────────────────────────────────────┘    │
│                       │                                           │
│                       ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  DATABASE (Supabase/PostgreSQL)                          │    │
│  │                                                           │    │
│  │  RLS Policies:                                           │    │
│  │  CREATE POLICY tenant_isolation ON products              │    │
│  │    USING (tenant_id = current_setting('app.tenant_id'))  │    │
│  │                                                           │    │
│  │  Tables:                                                 │    │
│  │  - products (id, tenant_id, name, ...)                   │    │
│  │  - orders (id, tenant_id, customer_id, ...)              │    │
│  │  - payments (id, tenant_id, amount, ...)                 │    │
│  └──────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### 1. **Frontend Layer** (React SPA)
- **Tenant Resolution**: Detect tenant dari subdomain/domain di client
- **Client-Side Context**: Manage tenant context dalam React Context/Zustand
- **API Communication**: Attach tenant_id ke semua API requests
- **Theme Loading**: Load tenant-specific theme dari API
- **Routing**: Client-side routing dengan tenant awareness

**React Tenant Context Provider:**
```typescript
// FILE: src/contexts/TenantContext.tsx (IMPLEMENTED)
import { createContext, useContext, useEffect, useState } from 'react';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  settings?: Record<string, any>;
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  error: Error | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Extract subdomain from current URL
    const hostname = window.location.hostname;
    const subdomain = extractSubdomain(hostname);
    
    // Fetch tenant data from API (when implemented)
    // For now, use mock data
    setTenant({
      id: '1',
      name: 'Demo Tenant',
      subdomain: subdomain || 'demo',
    });
    setLoading(false);
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, loading, error }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}

function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}
```

**API Client dengan Tenant Header:**
```typescript
// FILE: src/lib/api-client.ts (PLANNED)
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk attach tenant_id
apiClient.interceptors.request.use((config) => {
  const hostname = window.location.hostname;
  const subdomain = extractSubdomain(hostname);
  
  if (subdomain) {
    config.headers['X-Tenant-Subdomain'] = subdomain;
  }
  
  // Attach auth token if exists
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
});

export default apiClient;
```

#### 2. **Backend API Layer** (Laravel - PLANNED)
- **Tenant Identification**: Extract tenant dari header/subdomain
- **Authentication**: Verify Sanctum token
- **Context Injection**: Set tenant context untuk request
- **Response Formatting**: Return JSON responses

**Laravel Tenant Identification Middleware:**
```php
// FILE: app/Http/Middleware/IdentifyTenant.php (PLANNED)
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Tenant;
use App\Services\TenantContext;

class IdentifyTenant
{
    public function handle(Request $request, Closure $next)
    {
        // Strategy 1: Header (dari frontend)
        $subdomain = $request->header('X-Tenant-Subdomain');
        
        // Strategy 2: Subdomain dari request host
        if (!$subdomain) {
            $host = $request->getHost();
            $subdomain = $this->extractSubdomain($host);
        }
        
        if (!$subdomain) {
            return response()->json(['error' => 'Tenant not found'], 404);
        }
        
        // Load tenant
        $tenant = Tenant::where('subdomain', $subdomain)->first();
        
        if (!$tenant) {
            return response()->json(['error' => 'Tenant not found'], 404);
        }
        
        // Check tenant status
        if ($tenant->status !== 'active') {
            return response()->json(['error' => 'Tenant suspended'], 403);
        }
        
        // Set tenant context for this request
        app(TenantContext::class)->setTenant($tenant);
        
        // Set Supabase RLS context
        \DB::statement("SELECT set_config('app.tenant_id', ?, false)", [$tenant->id]);
        
        $response = $next($request);
        
        // Clear context after request
        app(TenantContext::class)->clear();
        
        return $response;
    }
    
    private function extractSubdomain(string $host): ?string
    {
        // Extract subdomain (tenant1.stencil.app -> tenant1)
        $parts = explode('.', $host);
        if (count($parts) >= 3) {
            return $parts[0];
        }
        
        // Custom domain support (customdomain.com)
        $tenant = Tenant::whereHas('domains', function($query) use ($host) {
            $query->where('domain', $host);
        })->first();
        
        return $tenant?->subdomain;
    }
}
```

#### 3. **Application Layer** (Use Cases - PLANNED)
- **Tenant-Aware**: Receives TenantContext sebagai parameter
- **Business Operations**: Coordinate between domain & infrastructure
- **Authorization**: Check permissions dalam tenant context

```php
class CreateProductUseCase
{
    public function __construct(
        private ProductRepository $productRepository,
        private EventDispatcher $eventDispatcher
    ) {}
    
    public function execute(CreateProductRequest $request): Product
    {
        // Get current tenant context
        $tenant = TenantContext::current();
        
        // Create product (domain logic)
        $product = Product::create([
            'tenant_id' => $tenant->id,
            'name' => $request->name,
            'price' => $request->price,
            // ... other fields
        ]);
        
        // Validate business rules (domain layer)
        $product->validate();
        
        // Save via repository (infrastructure layer)
        $this->productRepository->save($product);
        
        // Dispatch events
        $this->eventDispatcher->dispatch(
            new ProductCreated($product, $tenant)
        );
        
        return $product;
    }
}
```

#### 4. **Domain Layer** (Business Logic)
- **Tenant-Agnostic**: NO tenant logic di entities
- **Pure Business Logic**: Validation, calculations, rules
- **Domain Events**: Trigger events untuk side effects

```php
class Product extends Entity
{
    private string $name;
    private Money $price;
    private int $stock;
    
    // NO tenant_id property in domain entity
    // Tenant is handled by infrastructure layer
    
    public function validate(): void
    {
        if (empty($this->name)) {
            throw new InvalidProductException('Name required');
        }
        
        if ($this->price->isNegative()) {
            throw new InvalidProductException('Price must be positive');
        }
        
        // Pure business logic, no tenant awareness
    }
    
    public function decreaseStock(int $quantity): void
    {
        if ($this->stock < $quantity) {
            throw new InsufficientStockException();
        }
        
        $this->stock -= $quantity;
        
        $this->recordEvent(new StockDecreased($this, $quantity));
    }
}
```

#### 5. **Infrastructure Layer** (Repositories, External Services)
- **Tenant Filtering**: Automatic WHERE tenant_id injection
- **Database Queries**: Eloquent Global Scopes
- **External APIs**: Tenant-specific credentials

```php
// Global Scope untuk automatic tenant filtering
class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if ($tenant = TenantContext::current()) {
            $builder->where($model->getTable() . '.tenant_id', $tenant->id);
        }
    }
}

// Base Model dengan tenant scope
abstract class TenantModel extends Model
{
    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
        
        // Auto-set tenant_id on create
        static::creating(function (Model $model) {
            if ($tenant = TenantContext::current()) {
                $model->tenant_id = $tenant->id;
            }
        });
    }
}

// Product Model
class ProductModel extends TenantModel
{
    protected $table = 'products';
    protected $fillable = ['tenant_id', 'name', 'price', 'stock'];
    
    // Queries automatically filtered by tenant_id
    // ProductModel::all() → SELECT * FROM products WHERE tenant_id = ?
}
```

### Benefits of Hexagonal + Multi-Tenant

1. **Separation of Concerns**: Tenant logic isolated from business logic
2. **Testability**: Domain layer can be tested without tenant complexity
3. **Flexibility**: Change tenant strategy tanpa impact domain layer
4. **Maintainability**: Clear boundaries between layers
5. **Scalability**: Easy to add caching, sharding later

---

## DATABASE SCHEMA

### Table 1: `tenants`

Core tenant registry table.

```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NULL,
    
    -- Contact
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    
    -- Subdomain
    subdomain VARCHAR(100) NOT NULL UNIQUE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending', 'trial', 'cancelled')),
    
    -- Subscription
    plan_id UUID NULL REFERENCES subscription_plans(id) ON DELETE SET NULL,
    trial_ends_at TIMESTAMP NULL,
    subscription_ends_at TIMESTAMP NULL,
    
    -- Storage & Limits
    storage_used_bytes BIGINT DEFAULT 0,
    storage_limit_bytes BIGINT DEFAULT 10737418240,
    
    api_calls_this_month INT DEFAULT 0,
    api_rate_limit INT DEFAULT 10000,
    
    -- Settings (JSONB for flexibility)
    settings JSONB DEFAULT '{}',
    
    -- Billing
    billing_email VARCHAR(255) NULL,
    billing_address JSONB NULL,
    payment_method JSONB NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Indexes
CREATE INDEX idx_tenants_uuid ON tenants(uuid);
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_slug ON tenants(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_status ON tenants(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_plan ON tenants(plan_id);
CREATE INDEX idx_tenants_created ON tenants(created_at DESC);
CREATE INDEX idx_tenants_deleted ON tenants(deleted_at);
CREATE INDEX idx_tenants_settings ON tenants USING GIN(settings);
CREATE INDEX idx_tenants_metadata ON tenants USING GIN(metadata);
```

### Table 2: `tenant_domains`

Custom domain mapping untuk white-label tenants.

```sql
CREATE TABLE tenant_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    domain VARCHAR(255) NOT NULL UNIQUE,
    
    is_primary BOOLEAN DEFAULT FALSE,
    
    -- SSL Configuration
    ssl_enabled BOOLEAN DEFAULT FALSE,
    ssl_provider VARCHAR(50) NULL,
    ssl_expires_at TIMESTAMP NULL,
    ssl_auto_renew BOOLEAN DEFAULT TRUE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verifying', 'active', 'failed', 'disabled')),
    
    -- DNS Verification
    verification_token VARCHAR(255) NULL,
    verification_method VARCHAR(50) DEFAULT 'dns_txt',
    verified_at TIMESTAMP NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_tenant_domains_tenant ON tenant_domains(tenant_id);
CREATE INDEX idx_tenant_domains_domain ON tenant_domains(domain) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenant_domains_primary ON tenant_domains(tenant_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_tenant_domains_status ON tenant_domains(status);
CREATE UNIQUE INDEX idx_tenant_domains_primary_unique ON tenant_domains(tenant_id) WHERE is_primary = TRUE AND deleted_at IS NULL;
```

### Table 3: `tenant_configurations`

Tenant-specific feature flags and settings.

```sql
CREATE TABLE tenant_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Configuration key-value
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,
    
    -- Type hints
    config_type VARCHAR(50) DEFAULT 'string' CHECK (config_type IN ('string', 'number', 'boolean', 'object', 'array')),
    
    -- Metadata
    description TEXT NULL,
    is_sensitive BOOLEAN DEFAULT FALSE,
    is_readonly BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, config_key)
);

CREATE INDEX idx_tenant_configs_tenant ON tenant_configurations(tenant_id);
CREATE INDEX idx_tenant_configs_key ON tenant_configurations(config_key);
CREATE INDEX idx_tenant_configs_value ON tenant_configurations USING GIN(config_value);
```

### Table 4: `tenant_features`

Feature flags untuk enable/disable features per tenant.

```sql
CREATE TABLE tenant_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    
    is_enabled BOOLEAN DEFAULT TRUE,
    
    -- Usage tracking
    usage_count BIGINT DEFAULT 0,
    last_used_at TIMESTAMP NULL,
    
    -- Limits
    usage_limit BIGINT NULL,
    
    -- Trial
    trial_until TIMESTAMP NULL,
    
    -- Configuration for this feature
    configuration JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, feature_id)
);

CREATE INDEX idx_tenant_features_tenant ON tenant_features(tenant_id);
CREATE INDEX idx_tenant_features_feature ON tenant_features(feature_id);
CREATE INDEX idx_tenant_features_enabled ON tenant_features(tenant_id, is_enabled) WHERE is_enabled = TRUE;
```

### Table 5: `features`

Global feature catalog.

```sql
CREATE TABLE features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    category VARCHAR(100) NULL,
    
    is_premium BOOLEAN DEFAULT FALSE,
    is_beta BOOLEAN DEFAULT FALSE,
    
    -- Availability
    available_in_plans JSONB DEFAULT '[]',
    
    -- Configuration schema (JSON Schema)
    config_schema JSONB NULL,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_features_code ON features(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_features_premium ON features(is_premium);
CREATE INDEX idx_features_category ON features(category);
```

### Table 6: `tenant_quotas`

Resource quotas and limits per tenant.

```sql
CREATE TABLE tenant_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    resource_type VARCHAR(100) NOT NULL,
    
    -- Limits
    quota_limit BIGINT NOT NULL,
    quota_used BIGINT DEFAULT 0,
    
    -- Period (for rate limiting)
    period_type VARCHAR(50) NULL CHECK (period_type IN ('hour', 'day', 'month', 'total')),
    period_start TIMESTAMP NULL,
    period_end TIMESTAMP NULL,
    
    -- Alerts
    alert_threshold_percent SMALLINT DEFAULT 80,
    alert_sent_at TIMESTAMP NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, resource_type, period_type)
);

CREATE INDEX idx_tenant_quotas_tenant ON tenant_quotas(tenant_id);
CREATE INDEX idx_tenant_quotas_resource ON tenant_quotas(resource_type);
CREATE INDEX idx_tenant_quotas_usage ON tenant_quotas(quota_used, quota_limit) WHERE quota_used >= quota_limit * 0.8;
```

### Table 7: `tenant_subscriptions`

Subscription and billing history.

```sql
CREATE TABLE tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    
    -- Subscription details
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'trialing')),
    
    -- Billing
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    billing_cycle VARCHAR(50) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
    
    -- Dates
    trial_ends_at TIMESTAMP NULL,
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancelled_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    
    -- Payment
    payment_provider VARCHAR(50) NULL,
    payment_provider_subscription_id VARCHAR(255) NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenant_subs_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX idx_tenant_subs_plan ON tenant_subscriptions(plan_id);
CREATE INDEX idx_tenant_subs_status ON tenant_subscriptions(status);
CREATE INDEX idx_tenant_subs_period_end ON tenant_subscriptions(current_period_end);
```

---

## TENANT ISOLATION MECHANISMS

### 1. Application-Level Isolation (Global Scopes)

**Laravel Eloquent Global Scopes** automatically inject tenant filtering.

```php
// Boot method di base TenantModel
protected static function booted(): void
{
    // Automatic WHERE tenant_id filter
    static::addGlobalScope('tenant', function (Builder $builder) {
        if ($tenant = TenantContext::current()) {
            $builder->where($builder->getQuery()->from . '.tenant_id', $tenant->id);
        }
    });
    
    // Auto-set tenant_id on insert
    static::creating(function (Model $model) {
        if (!isset($model->tenant_id) && ($tenant = TenantContext::current())) {
            $model->tenant_id = $tenant->id;
        }
    });
    
    // Prevent tenant_id update
    static::updating(function (Model $model) {
        if ($model->isDirty('tenant_id')) {
            throw new TenantIdImmutableException('Cannot change tenant_id');
        }
    });
}
```

**Usage:**
```php
// All queries automatically scoped to current tenant
$products = Product::all();
// → SELECT * FROM products WHERE tenant_id = 'current-tenant-uuid'

$product = Product::find($id);
// → SELECT * FROM products WHERE id = ? AND tenant_id = 'current-tenant-uuid'

Product::create(['name' => 'Test']);
// → INSERT INTO products (name, tenant_id) VALUES ('Test', 'current-tenant-uuid')
```

### 2. Database-Level Isolation (PostgreSQL Row-Level Security)

**Row-Level Security (RLS)** provides database-enforced isolation as additional security layer.

```sql
-- Enable RLS on all tenant tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation_policy ON products
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_policy ON orders
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_policy ON users
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

**Application Code:**
```php
// Set tenant context at database connection level
DB::statement("SET app.current_tenant_id = ?", [$tenant->id]);

// Even if application bug bypasses global scope, 
// database will still enforce tenant isolation
```

**Benefits:**
- Defense in depth (application + database)
- Protection against SQL injection
- Compliance requirement (SOC2, ISO 27001)

### 3. Cache Isolation

**Redis Key Prefixing** untuk tenant-specific caching.

```php
class TenantCacheManager
{
    public function get(string $key, mixed $default = null): mixed
    {
        $tenantKey = $this->getTenantKey($key);
        return Cache::get($tenantKey, $default);
    }
    
    public function put(string $key, mixed $value, int $ttl = 3600): bool
    {
        $tenantKey = $this->getTenantKey($key);
        return Cache::put($tenantKey, $value, $ttl);
    }
    
    private function getTenantKey(string $key): string
    {
        $tenant = TenantContext::current();
        return "tenant:{$tenant->uuid}:{$key}";
    }
}

// Usage
$cache->put('products:list', $products, 300);
// → Redis key: "tenant:abc123:products:list"
```

### 4. File Storage Isolation

**S3 Folder Structure** untuk tenant-specific files.

```php
class TenantStorageManager
{
    public function store(UploadedFile $file, string $path): string
    {
        $tenant = TenantContext::current();
        
        $fullPath = "tenants/{$tenant->uuid}/{$path}";
        
        $filePath = Storage::disk('s3')->put($fullPath, $file);
        
        return $filePath;
    }
    
    public function get(string $path): ?string
    {
        $tenant = TenantContext::current();
        
        $fullPath = "tenants/{$tenant->uuid}/{$path}";
        
        return Storage::disk('s3')->get($fullPath);
    }
}

// Usage
$storage->store($uploadedFile, 'products/image.jpg');
// → S3: s3://bucket/tenants/abc123/products/image.jpg
```

### 5. Queue Job Isolation

**Tenant Context Propagation** dalam background jobs.

```php
class ProcessOrderJob implements ShouldQueue
{
    use Dispatchable, Queueable;
    
    public function __construct(
        private string $orderId,
        private string $tenantId
    ) {}
    
    public function handle(): void
    {
        // Restore tenant context in worker
        $tenant = Tenant::find($this->tenantId);
        TenantContext::set($tenant);
        
        // Process order (automatically scoped to tenant)
        $order = Order::find($this->orderId);
        $order->process();
        
        // Clear context
        TenantContext::clear();
    }
}

// Dispatch with tenant context
ProcessOrderJob::dispatch($order->id, TenantContext::current()->id);
```

---

## TENANT LIFECYCLE MANAGEMENT

### Tenant Provisioning Workflow

```
┌─────────────────────────────────────────────────────────┐
│  1. REGISTRATION                                        │
│     → User fills signup form                            │
│     → Email verification                                │
│     → Subdomain availability check                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  2. TENANT CREATION                                     │
│     → INSERT INTO tenants (...)                         │
│     → Generate UUID, subdomain                          │
│     → Set status = 'trial'                              │
│     → Create default admin user                         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  3. INITIAL CONFIGURATION                               │
│     → Create default roles & permissions                │
│     → Install default theme                             │
│     → Install essential plugins                         │
│     → Seed sample data (optional)                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  4. DNS/DOMAIN SETUP (if custom domain)                 │
│     → Generate verification token                       │
│     → Wait for DNS verification                         │
│     → Provision SSL certificate (Let's Encrypt)         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  5. ACTIVATION                                          │
│     → Update status = 'active'                          │
│     → Send welcome email                                │
│     → Trigger onboarding flow                           │
│     → Start trial countdown (14 days)                   │
└─────────────────────────────────────────────────────────┘
```

### Provisioning Code

```php
class TenantProvisioningService
{
    public function provision(TenantRegistration $registration): Tenant
    {
        DB::beginTransaction();
        
        try {
            // 1. Create tenant
            $tenant = Tenant::create([
                'name' => $registration->businessName,
                'email' => $registration->email,
                'subdomain' => $registration->subdomain,
                'status' => 'trial',
                'trial_ends_at' => now()->addDays(14),
                'plan_id' => $this->getFreePlan()->id,
            ]);
            
            // 2. Create admin user
            $admin = User::create([
                'tenant_id' => $tenant->id,
                'name' => $registration->ownerName,
                'email' => $registration->email,
                'password' => Hash::make($registration->password),
            ]);
            
            // 3. Assign admin role
            $adminRole = Role::where('code', 'tenant_owner')->first();
            $admin->roles()->attach($adminRole);
            
            // 4. Install default theme
            $this->themeInstaller->installDefault($tenant);
            
            // 5. Install essential plugins
            $this->pluginInstaller->installEssentials($tenant);
            
            // 6. Create default settings
            $this->createDefaultSettings($tenant);
            
            // 7. Setup quotas
            $this->setupDefaultQuotas($tenant);
            
            // 8. Trigger welcome workflow
            event(new TenantProvisioned($tenant, $admin));
            
            DB::commit();
            
            return $tenant;
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw new TenantProvisioningException(
                "Failed to provision tenant: " . $e->getMessage()
            );
        }
    }
}
```

---

**[Continued in next part due to length...]**

**This document continues with:**
- API Endpoints (25+ endpoints)
- Performance Optimization
- Security Best Practices
- Scaling Strategies
- Monitoring & Observability
- Disaster Recovery
- Code Examples
- Migration Path

**Note:** Dokumentasi ini sangat panjang (50+ halaman). Apakah Anda ingin saya lanjutkan dengan bagian berikutnya, atau Anda ingin saya create file-file lainnya terlebih dahulu (RBAC, Theme, Plugin) lalu kembali melengkapi yang ini?
