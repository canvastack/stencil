# 🏢 MULTI-TENANCY ARCHITECTURE: SaaS vs PaaS
## CanvaStack Stencil - Comprehensive Multi-Tenancy Strategy

**Version**: 2.0.0-alpha  
**Analysis Date**: November 16, 2025  
**Decision Status**: ✅ **SaaS Model with PaaS Capabilities**  
**Architecture**: Schema-per-Tenant + Shared Infrastructure  

---

## 📋 Executive Summary

CanvaStack Stencil implements a **hybrid SaaS model** with **schema-per-tenant architecture** using PostgreSQL. This approach provides complete data isolation while maintaining centralized infrastructure management. The platform supports both SaaS operations and future PaaS capabilities for enterprise clients.

### 🎯 Key Architectural Decisions

| Aspect | Chosen Approach | Alternative | Reasoning |
|--------|-----------------|-------------|-----------|
| **Data Isolation** | Schema-per-Tenant | Row-Level Security | Complete isolation, easier compliance |
| **Infrastructure** | Centralized SaaS | Distributed PaaS | Lower operational overhead |
| **Database** | PostgreSQL | MySQL/MongoDB | Advanced multi-tenancy features |
| **Authentication** | Centralized | Federated | Simpler user management |
| **Billing** | Usage-based SaaS | License-based | Scalable revenue model |

---

## 🏗️ SaaS Model Architecture (Primary)

### **Centralized Multi-Tenant SaaS**

```
┌─────────────────────────────────────────────────┐
│                   SaaS LAYER                    │
│  ┌─────────────────────────────────────────────┐ │
│  │         Global Management Console           │ │
│  │   • Tenant Provisioning                    │ │
│  │   • Global User Management                 │ │
│  │   • Billing & Subscriptions                │ │
│  │   • System Monitoring                      │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────┐
│                APPLICATION LAYER                │
│   ┌─────────────────────────────────────────┐   │
│   │            Laravel API                  │   │
│   │    Multi-Tenant Middleware             │   │
│   │    Tenant Context Resolution           │   │
│   │    Shared Business Logic               │   │
│   └─────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────┐
│                 DATA LAYER                      │
│   ┌─────────────┐  ┌─────────────────────────┐  │
│   │  LANDLORD   │  │      TENANT SCHEMAS     │  │
│   │   DATABASE  │  │                         │  │
│   │             │  │  ┌─────────────────────┐ │  │
│   │• tenants    │  │  │   tenant_abc_123    │ │  │
│   │• users      │  │  │   • products        │ │  │
│   │• billing    │  │  │   • orders          │ │  │
│   │• themes     │  │  │   • customers       │ │  │
│   │             │  │  └─────────────────────┘ │  │
│   │             │  │  ┌─────────────────────┐ │  │
│   │             │  │  │   tenant_def_456    │ │  │
│   │             │  │  │   • products        │ │  │
│   │             │  │  │   • orders          │ │  │
│   │             │  │  │   • customers       │ │  │
│   │             │  │  └─────────────────────┘ │  │
│   └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### **SaaS Benefits**

#### ✅ **Operational Advantages**
- **Centralized Management**: Single infrastructure to maintain
- **Cost Efficiency**: Shared resources reduce per-tenant costs
- **Automated Updates**: Push updates to all tenants simultaneously
- **Unified Monitoring**: Single dashboard for all tenant metrics
- **Backup Management**: Centralized backup and disaster recovery

#### ✅ **Business Advantages**
- **Faster Time-to-Market**: New tenants provision in minutes
- **Scalable Revenue**: Usage-based billing model
- **Lower Support Overhead**: Standardized environments
- **Predictable Costs**: Shared infrastructure costs

#### ✅ **Technical Advantages**
- **Resource Optimization**: Efficient resource utilization
- **Performance Monitoring**: Centralized APM and logging
- **Security Management**: Unified security policies
- **Version Control**: Single codebase deployment

---

## 🏠 PaaS Model Capabilities (Future)

### **Self-Hosted PaaS Option**

```
┌─────────────────────────────────────────────────┐
│              ENTERPRISE CLIENT INFRASTRUCTURE    │
│                                                 │
│  ┌─────────────────────────────────────────────┐ │
│  │              Client Environment             │ │
│  │   ┌─────────────────────────────────────┐   │ │
│  │   │        Stencil Instance             │   │ │
│  │   │   • Custom Branding                 │   │ │
│  │   │   • Client-Specific Features       │   │ │
│  │   │   • Local Data Storage              │   │ │
│  │   │   • Custom Integrations             │   │ │
│  │   └─────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│  ┌─────────────────────────────────────────────┐ │
│  │           Client Database                   │ │
│  │   • Full Control                           │ │
│  │   • Custom Schema Modifications            │ │
│  │   • Compliance Requirements                │ │
│  │   • Local Regulations                      │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────┐
│               LICENSE SERVER                    │
│   • License Validation                         │
│   • Feature Activation                         │
│   • Usage Tracking                             │
│   • Support Portal                             │
└─────────────────────────────────────────────────┘
```

### **PaaS Use Cases**
- **Enterprise Clients**: Large organizations with compliance requirements
- **Regulatory Compliance**: Industries requiring data residency
- **Custom Integrations**: Heavy customization needs
- **High Security**: Government or financial institutions

---

## 🆚 WordPress vs Stencil Comparison

### **WordPress Multi-Site vs Stencil Multi-Tenant**

| Feature | WordPress Multi-Site | Stencil Multi-Tenant | Advantage |
|---------|---------------------|----------------------|-----------|
| **Data Isolation** | Shared tables + prefixes | Separate schemas | **Stencil** |
| **Performance** | Shared resources | Isolated resources | **Stencil** |
| **Scalability** | Limited | Horizontal scaling | **Stencil** |
| **Security** | Basic separation | Complete isolation | **Stencil** |
| **Customization** | Plugin conflicts | Clean separation | **Stencil** |
| **Theme System** | Limited themes | Dynamic engine | **Stencil** |
| **API-First** | REST retrofit | Native API | **Stencil** |
| **Modern Stack** | PHP legacy | React + Laravel | **Stencil** |

### **WordPress Limitations Addressed**

#### **Database Architecture**
```sql
-- WordPress approach (problematic)
wp_posts (shared table)
- ID
- post_author  
- post_content
- blog_id (site identifier) -- Single point of failure

-- Stencil approach (secure)
tenant_abc_123.posts (isolated schema)
- id
- author_id
- content
-- Complete tenant isolation, no cross-contamination possible
```

#### **Theme System Comparison**
```php
// WordPress (limited)
function.php // Single theme file, hard to customize per site

// Stencil (advanced)
class ThemeEngine {
    public function loadTenantTheme(Tenant $tenant) {
        return $this->themeRepository
            ->findByTenant($tenant)
            ->loadComponents();
    }
}
```

---

## 🔐 Data Isolation Strategies

### **1. Schema-per-Tenant (Chosen)**

#### **Implementation Architecture**
```php
// Laravel Multi-Tenancy Implementation
class TenantMiddleware {
    public function handle($request, $next) {
        $tenantId = $request->header('X-Tenant-ID');
        $tenant = Tenant::find($tenantId);
        
        if (!$tenant) {
            return response()->json(['error' => 'Invalid tenant'], 403);
        }
        
        // Switch database connection
        $this->switchToTenantDatabase($tenant);
        
        return $next($request);
    }
    
    private function switchToTenantDatabase(Tenant $tenant) {
        Config::set('database.connections.tenant', [
            'driver' => 'pgsql',
            'host' => env('DB_HOST'),
            'database' => $tenant->database_name,
            'username' => env('DB_USERNAME'),
            'password' => env('DB_PASSWORD'),
            'schema' => $tenant->schema_name,
        ]);
        
        DB::purge('tenant');
        DB::setDefaultConnection('tenant');
    }
}
```

#### **Benefits**
- ✅ **Complete Isolation**: Zero chance of data leakage
- ✅ **Performance**: Dedicated resources per tenant
- ✅ **Backup Strategy**: Individual tenant backup/restore
- ✅ **Compliance**: Easier to meet regulatory requirements
- ✅ **Scaling**: Independent database scaling

#### **PostgreSQL Schema Structure**
```sql
-- Landlord database (central management)
CREATE DATABASE stencil_landlord;
CREATE SCHEMA public;

-- Tables in landlord database
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    database_name VARCHAR(100) NOT NULL,
    schema_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status tenant_status DEFAULT 'active'
);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tenant_users (
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    role VARCHAR(50) NOT NULL,
    permissions JSONB,
    PRIMARY KEY (tenant_id, user_id)
);

-- Tenant-specific database
CREATE DATABASE stencil_tenant_abc123;
CREATE SCHEMA tenant_data;

-- All business tables in tenant schema
CREATE TABLE products (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- Note: No tenant_id needed - schema isolation
);
```

### **2. Row-Level Security (Backup Strategy)**

#### **PostgreSQL RLS Implementation**
```sql
-- Enable RLS for additional security layer
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create tenant-scoped policies
CREATE POLICY products_tenant_policy ON products
    FOR ALL 
    TO web_user
    USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- Set tenant context
SET app.tenant_id = 'abc123-def456-ghi789';
```

#### **Use Cases for RLS**
- **Additional Security**: Defense-in-depth strategy
- **Shared Resources**: Global data with tenant access controls
- **Migration Safety**: During schema migration processes
- **Audit Logging**: Cross-tenant audit trail

---

## 👥 Role & Permission Architecture

### **Hierarchical Role System**

```
┌─────────────────────────────────────────────────┐
│                 PLATFORM LEVEL                  │
│   ┌─────────────────────────────────────────┐   │
│   │  Super Admin (CanvaStack)               │   │
│   │  • Full platform access                │   │
│   │  • Tenant management                   │   │
│   │  • Global settings                     │   │
│   │  • Billing oversight                   │   │
│   └─────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────┐
│                  TENANT LEVEL                   │
│   ┌─────────────────────────────────────────┐   │
│   │  Tenant Admin                          │   │
│   │  • Full tenant access                  │   │
│   │  • User management                     │   │
│   │  • Settings configuration              │   │
│   │  • Theme customization                 │   │
│   └─────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────┐   │
│   │  Manager                               │   │
│   │  • Business operations                 │   │
│   │  • Order management                    │   │
│   │  • Customer management                 │   │
│   │  • Reporting access                    │   │
│   └─────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────┐   │
│   │  Staff                                 │   │
│   │  • Limited access                      │   │
│   │  • Order processing                    │   │
│   │  • Customer support                    │   │
│   │  • Read-only reporting                 │   │
│   └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### **Permission Matrix Implementation**

```php
// Laravel Spatie Permission Integration
class RoleSeeder extends Seeder {
    public function run() {
        // Platform-level permissions
        Permission::create(['name' => 'manage_tenants']);
        Permission::create(['name' => 'view_global_analytics']);
        Permission::create(['name' => 'manage_billing']);
        
        // Tenant-level permissions
        Permission::create(['name' => 'manage_tenant_users']);
        Permission::create(['name' => 'configure_tenant_settings']);
        Permission::create(['name' => 'customize_theme']);
        Permission::create(['name' => 'manage_products']);
        Permission::create(['name' => 'process_orders']);
        Permission::create(['name' => 'view_analytics']);
        
        // Create roles with permissions
        $superAdmin = Role::create(['name' => 'super_admin']);
        $superAdmin->givePermissionTo([
            'manage_tenants', 
            'view_global_analytics', 
            'manage_billing'
        ]);
        
        $tenantAdmin = Role::create(['name' => 'tenant_admin']);
        $tenantAdmin->givePermissionTo([
            'manage_tenant_users',
            'configure_tenant_settings',
            'customize_theme',
            'manage_products',
            'process_orders',
            'view_analytics'
        ]);
    }
}
```

### **Context-Aware Authorization**

```php
class TenantUserController extends Controller {
    public function update(Request $request, User $user) {
        // Automatic tenant scoping
        $this->authorize('update', $user);
        
        // User can only be updated if in same tenant
        if ($user->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Access denied');
        }
        
        // Update logic here
    }
}

class UserPolicy {
    public function update(User $authUser, User $targetUser) {
        return $authUser->hasPermissionTo('manage_tenant_users') 
            && $authUser->tenant_id === $targetUser->tenant_id;
    }
}
```

---

## 💰 Pricing Models

### **SaaS Pricing Strategy**

#### **Tiered Subscription Model**

| Tier | Price/Month | Features | Ideal For |
|------|-------------|----------|-----------|
| **Starter** | $29 | • 100 products<br>• 500 orders/month<br>• 2 users<br>• Email support | Small businesses |
| **Professional** | $99 | • 1,000 products<br>• 5,000 orders/month<br>• 10 users<br>• Phone support<br>• Custom themes | Growing businesses |
| **Enterprise** | $299 | • Unlimited products<br>• Unlimited orders<br>• 50 users<br>• Priority support<br>• Custom integrations | Large organizations |
| **White Label** | Custom | • Full customization<br>• Self-hosted option<br>• SLA guarantees<br>• Dedicated support | Enterprise clients |

#### **Usage-Based Components**
```php
class BillingService {
    public function calculateMonthlyBill(Tenant $tenant) {
        $basePlan = $tenant->subscription_plan;
        $overageCharges = 0;
        
        // Calculate overage charges
        $orders = $tenant->orders()->currentMonth()->count();
        if ($orders > $basePlan->order_limit) {
            $overage = $orders - $basePlan->order_limit;
            $overageCharges += $overage * $basePlan->order_overage_rate;
        }
        
        $users = $tenant->users()->active()->count();
        if ($users > $basePlan->user_limit) {
            $overage = $users - $basePlan->user_limit;
            $overageCharges += $overage * $basePlan->user_overage_rate;
        }
        
        return $basePlan->base_price + $overageCharges;
    }
}
```

### **PaaS Pricing Model**

#### **License-Based Pricing**
- **Initial License Fee**: $10,000 - $50,000
- **Annual Maintenance**: 20% of license fee
- **Support Tiers**: Bronze ($5K), Silver ($10K), Gold ($20K)
- **Custom Development**: $150-300/hour

#### **Revenue Sharing Model**
- **SaaS Revenue**: 100% to CanvaStack
- **PaaS License**: 100% to CanvaStack
- **Marketplace Commission**: 70% Partner, 30% CanvaStack
- **Theme/Plugin Sales**: 80% Developer, 20% CanvaStack

---

## 🔧 Implementation Roadmap

### **Phase 1: SaaS Foundation (Months 1-3)**

#### **Month 1: Core Multi-Tenancy**
```php
// Week 1: Tenant Model & Middleware
class Tenant extends Model {
    protected $connection = 'landlord';
    protected $fillable = ['name', 'subdomain', 'database_name'];
}

// Week 2: Database Switching
class TenantServiceProvider extends ServiceProvider {
    public function boot() {
        $this->configureTenantMiddleware();
        $this->setupDatabaseConnections();
    }
}

// Week 3: Authentication Integration
class TenantAuthController extends Controller {
    public function login(Request $request) {
        $tenant = $this->resolveTenant($request);
        $user = $this->authenticateUser($request, $tenant);
        return $this->issueToken($user, $tenant);
    }
}

// Week 4: Testing & Validation
class TenantMiddlewareTest extends TestCase {
    public function test_tenant_isolation() {
        // Comprehensive tenant isolation tests
    }
}
```

#### **Month 2: User Management & Roles**
- Centralized user authentication
- Tenant-scoped role management
- Permission system implementation
- User invitation & onboarding

#### **Month 3: Billing Integration**
- Stripe/Paddle integration
- Usage tracking
- Plan management
- Subscription lifecycle

### **Phase 2: Advanced Features (Months 4-6)**

#### **Theme Engine Multi-Tenancy**
- Tenant-specific theme storage
- Theme marketplace integration
- Custom CSS compilation per tenant
- Theme versioning & rollback

#### **Plugin System Architecture**
- Tenant-scoped plugin installation
- Plugin permission system
- Marketplace integration
- Sandboxed execution environment

#### **Performance Optimization**
- Tenant-specific caching
- Database query optimization
- CDN integration for tenant assets
- Load balancing strategies

### **Phase 3: Enterprise Features (Months 7-12)**

#### **PaaS Capabilities**
- Self-hosted deployment scripts
- License server implementation
- Enterprise SSO integration
- Custom branding system

#### **Advanced Analytics**
- Tenant usage analytics
- Performance monitoring per tenant
- Business intelligence dashboards
- Predictive scaling

---

## 🛡️ Security & Compliance

### **Data Protection Measures**

#### **Encryption Strategy**
```php
class TenantEncryption {
    public function encryptTenantData($data, Tenant $tenant) {
        $key = $this->deriveTenantKey($tenant->id);
        return encrypt($data, $key);
    }
    
    private function deriveTenantKey($tenantId) {
        return hash_pbkdf2('sha256', 
            config('app.key'), 
            $tenantId, 
            10000, 
            32, 
            true
        );
    }
}
```

#### **Audit Logging**
```php
class TenantAuditLogger {
    public function logActivity($action, $entity, $changes) {
        AuditLog::create([
            'tenant_id' => app('current-tenant')->id,
            'user_id' => auth()->id(),
            'action' => $action,
            'entity_type' => get_class($entity),
            'entity_id' => $entity->id,
            'changes' => json_encode($changes),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
```

### **Compliance Framework**

#### **GDPR Compliance**
- Right to be forgotten implementation
- Data portability features
- Consent management system
- Cross-border data transfer controls

#### **SOC 2 Type II**
- Security control implementation
- Availability monitoring
- Processing integrity validation
- Confidentiality measures
- Privacy protection protocols

---

## 📊 Monitoring & Analytics

### **Tenant-Specific Metrics**

#### **Performance Monitoring**
```php
class TenantMetrics {
    public function collectMetrics(Tenant $tenant) {
        return [
            'response_time' => $this->getAverageResponseTime($tenant),
            'database_queries' => $this->getQueryCount($tenant),
            'active_users' => $this->getActiveUserCount($tenant),
            'storage_usage' => $this->getStorageUsage($tenant),
            'api_calls' => $this->getApiCallCount($tenant),
        ];
    }
}
```

#### **Business Analytics**
```php
class TenantAnalytics {
    public function generateReport(Tenant $tenant, $period) {
        return [
            'orders' => [
                'total' => Order::tenant($tenant)->period($period)->count(),
                'revenue' => Order::tenant($tenant)->period($period)->sum('total'),
                'average_value' => Order::tenant($tenant)->period($period)->avg('total'),
            ],
            'customers' => [
                'total' => Customer::tenant($tenant)->count(),
                'new' => Customer::tenant($tenant)->period($period)->count(),
                'retention' => $this->calculateRetention($tenant, $period),
            ],
            'products' => [
                'total' => Product::tenant($tenant)->count(),
                'bestsellers' => $this->getBestsellers($tenant, $period),
            ],
        ];
    }
}
```

---

## 🎯 Success Metrics & KPIs

### **Technical KPIs**
- **Tenant Isolation**: 100% (zero cross-tenant data access)
- **Provisioning Time**: < 30 seconds per new tenant
- **Response Time**: < 200ms average per tenant
- **Uptime**: 99.9% SLA compliance
- **Data Recovery**: < 4 hour RTO, < 1 hour RPO

### **Business KPIs**
- **Customer Acquisition Cost**: < $100 per tenant
- **Monthly Recurring Revenue**: Target $100K by month 12
- **Churn Rate**: < 5% monthly
- **Customer Lifetime Value**: > $2,400
- **Support Ticket Volume**: < 0.1 tickets per active user per month

---

## 🏁 Final Recommendations

### **Immediate Implementation**
1. ✅ **Schema-per-Tenant**: Start with PostgreSQL schema isolation
2. ✅ **Laravel Multitenancy**: Use `spatie/laravel-multitenancy` package
3. ✅ **Centralized Auth**: Implement unified user authentication
4. ✅ **Billing Integration**: Set up Stripe for subscription management

### **Future Enhancements**
1. 📋 **PaaS Option**: Develop self-hosted deployment for enterprise
2. 📋 **Advanced Analytics**: Implement predictive analytics
3. 📋 **Global Scaling**: Multi-region deployment capabilities
4. 📋 **AI Integration**: Intelligent tenant optimization

### **Risk Mitigation**
1. **Security**: Regular penetration testing for tenant isolation
2. **Performance**: Continuous monitoring and optimization
3. **Compliance**: Ongoing GDPR and SOC 2 maintenance
4. **Disaster Recovery**: Regular backup testing and failover drills

---

**Document Status**: ✅ Complete  
**Last Review**: November 16, 2025  
**Next Review**: February 16, 2025