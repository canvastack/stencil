# MIGRATION STRATEGY
## From Current React Frontend to Full-Stack Multi-Tenant Platform

**Version:** 1.0  
**Last Updated:** November 11, 2025  
**Timeline:** 12-16 Weeks (Phased Implementation)  
**Risk Level:** Medium  
**Approach:** API-First Development dengan Hexagonal Architecture

> **⚠️ UPDATED CONTEXT**  
> **Current State**: React 18.3 frontend dengan basic theme engine (Implemented)  
> **Target State**: Full-stack platform dengan Laravel API + Supabase + Multi-tenant + RBAC  
> **Strategy**: Build backend API around existing frontend, progressive enhancement

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Target State Architecture](#target-state-architecture)
4. [Migration Phases](#migration-phases)
5. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
6. [Data Migration](#data-migration)
7. [Risk Management](#risk-management)
8. [Testing Strategy](#testing-strategy)
9. [Rollback Plan](#rollback-plan)
10. [Success Criteria](#success-criteria)

---

## EXECUTIVE SUMMARY

### Migration Overview

Migration dari **single-tenant monolithic architecture** ke **multi-tenant platform** dengan 4 advanced systems:

1. **Multi-Tenant Architecture** - Foundation untuk tenant isolation
2. **RBAC Permission System** - Sophisticated access control
3. **Theme Marketplace System** - Visual customization platform
4. **Plugin Marketplace System** - Extensibility framework

### Timeline & Resources

**Total Duration**: 14 weeks (3.5 months)  
**Team Size**: 
- 2 Backend Developers
- 1 Frontend Developer
- 1 DevOps Engineer
- 1 QA Engineer (part-time)

**Budget Estimate**: $140,000 - $180,000

### Migration Approach

✅ **Phased Implementation**: 6 phases dengan clear milestones  
✅ **Zero Downtime**: Implement dengan minimal disruption  
✅ **Backward Compatibility**: Support existing features selama migration  
✅ **Incremental Rollout**: Deploy progressively dengan feature flags  
✅ **Comprehensive Testing**: Each phase fully tested sebelum next phase

---

## CURRENT STATE ANALYSIS

### Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              CURRENT MONOLITHIC ARCHITECTURE                │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Laravel Application (Single Tenant)                 │  │
│  │                                                      │  │
│  │  • Single database                                   │  │
│  │  • No tenant isolation                               │  │
│  │  • Basic role management (admin, user)               │  │
│  │  • Single hardcoded theme                            │  │
│  │  • No plugin system                                  │  │
│  │  • Monolithic codebase                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                 │  │
│  │                                                      │  │
│  │  • ~60 tables                                        │  │
│  │  • No tenant_id column                               │  │
│  │  • ~660 fields total                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Current Limitations

❌ **No Multi-Tenancy**: Can only serve single customer  
❌ **Limited RBAC**: Only basic admin/user roles  
❌ **No Theme System**: Hardcoded UI, no customization  
❌ **No Plugin System**: All features in core code  
❌ **No Marketplace**: No ecosystem for themes/plugins  
❌ **Scalability Issues**: Can't scale to multiple customers  

### Existing Database Tables (60 tables)

**E-commerce Core:**
- `products`, `categories`, `brands`, `attributes`
- `orders`, `order_items`, `payments`, `shipments`
- `carts`, `cart_items`, `wishlists`
- `customers`, `addresses`

**Content Management:**
- `pages`, `posts`, `media`, `menus`
- `reviews`, `comments`

**Operations:**
- `users`, `settings`, `logs`
- `notifications`, `emails`

**Total Fields**: ~660 fields across 60 tables

---

## TARGET STATE ARCHITECTURE

### Target Architecture

```
┌──────────────────────────────────────────────────────────────┐
│         MULTI-TENANT PLATFORM WITH ADVANCED SYSTEMS          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Multi-Tenant Layer                                │     │
│  │  • Tenant isolation                                │     │
│  │  • Subdomain routing                               │     │
│  │  • Resource quotas                                 │     │
│  └────────────────────┬───────────────────────────────┘     │
│                       │                                      │
│  ┌────────────────────┼───────────────────────────────┐     │
│  │  RBAC System       │   Theme System   │  Plugin    │     │
│  │  • Roles           │   • Marketplace  │  System    │     │
│  │  • Permissions     │   • Customizer   │  • Hooks   │     │
│  │  • Resources       │   • Versions     │  • Filters │     │
│  └────────────────────┴───────────────────┴───────────┘     │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────┐     │
│  │  Laravel Application (Multi-Tenant Aware)          │     │
│  │  • Hexagonal architecture                          │     │
│  │  • Tenant-scoped queries                           │     │
│  │  • Permission-based access                         │     │
│  │  • Dynamic theme loading                           │     │
│  │  • Plugin execution                                │     │
│  └────────────────────────────────────────────────────┘     │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────┐     │
│  │  PostgreSQL Database with RLS                      │     │
│  │  • ~90 tables (+30 new tables)                     │     │
│  │  • tenant_id on all tables                         │     │
│  │  • Row-Level Security enabled                      │     │
│  │  • ~1,200 fields total                             │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

### New Database Tables (+30 tables)

**Multi-Tenant System (7 tables):**
- `tenants`, `tenant_domains`, `tenant_configurations`
- `tenant_features`, `tenant_quotas`, `tenant_subscriptions`
- (1 more)

**RBAC System (7 tables):**
- `roles`, `permissions`, `role_permissions`
- `user_roles`, `user_permissions`, `resource_permissions`
- `permission_groups`

**Theme System (7 tables):**
- `themes`, `theme_installations`, `theme_settings`
- `theme_marketplace_listings`, `theme_purchases`, `theme_licenses`
- `theme_versions`

**Plugin System (8 tables):**
- `plugins`, `plugin_installations`, `plugin_settings`
- `plugin_hooks`, `plugin_events`, `plugin_marketplace_listings`
- `plugin_purchases`, `plugin_api_keys`

**Total New Tables**: 29 tables  
**Total New Fields**: ~540 fields

---

## MIGRATION PHASES

### Phase Overview

| Phase | Duration | Focus | Team Size | Risk |
|-------|----------|-------|-----------|------|
| **Phase 0** | Week 1 | Planning & Setup | 5 | Low |
| **Phase 1** | Week 2-3 | Multi-Tenant Foundation | 5 | High |
| **Phase 2** | Week 4-5 | RBAC Implementation | 4 | Medium |
| **Phase 3** | Week 6-8 | Theme Engine | 4 | Medium |
| **Phase 4** | Week 9-11 | Plugin System | 4 | High |
| **Phase 5** | Week 12-13 | Marketplace Integration | 3 | Low |
| **Phase 6** | Week 14 | Polish & Launch | 5 | Low |

### Dependencies

```
Phase 0 (Planning)
    ↓
Phase 1 (Multi-Tenant) ← CRITICAL PATH
    ↓
Phase 2 (RBAC)
    ↓
    ├─→ Phase 3 (Theme)  ─┐
    │                     ├─→ Phase 5 (Marketplace)
    └─→ Phase 4 (Plugin) ─┘         ↓
                            Phase 6 (Launch)
```

---

## PHASE-BY-PHASE IMPLEMENTATION

### PHASE 0: Planning & Setup (Week 1)

**Goal**: Prepare environment dan detailed planning

#### Tasks

**1. Environment Setup**
```bash
# Create staging environment
- Clone production to staging
- Set up separate database
- Configure CI/CD pipeline
- Set up monitoring (New Relic, Sentry)
```

**2. Database Backup Strategy**
```bash
# Automated backups before each phase
pg_dump stencil_production > backup_phase_0.sql
```

**3. Feature Flag Setup**
```php
// Install Laravel Pennant for feature flags
composer require laravel/pennant

// Define feature flags
Feature::define('multi-tenant', fn () => false);
Feature::define('rbac-system', fn () => false);
Feature::define('theme-engine', fn () => false);
Feature::define('plugin-system', fn () => false);
```

**4. Create Migration Scripts**
```php
// Generate all migration files
php artisan make:migration add_tenant_id_to_all_tables
php artisan make:migration create_multi_tenant_tables
php artisan make:migration create_rbac_tables
php artisan make:migration create_theme_tables
php artisan make:migration create_plugin_tables
```

**5. Documentation**
- Create migration runbook
- Document rollback procedures
- Create communication plan

#### Deliverables
✅ Staging environment ready  
✅ Backup strategy implemented  
✅ Feature flags configured  
✅ Migration scripts prepared  
✅ Team aligned on plan

---

### PHASE 1: Multi-Tenant Foundation (Week 2-3)

**Goal**: Implement complete multi-tenant architecture

**⚠️ CRITICAL**: This is the most important phase. All subsequent phases depend on this.

#### Week 2: Database Migration

**Task 1.1: Add tenant_id to Existing Tables**

```sql
-- Migration script
BEGIN TRANSACTION;

-- Add tenant_id to all existing tables
ALTER TABLE products ADD COLUMN tenant_id UUID;
ALTER TABLE orders ADD COLUMN tenant_id UUID;
ALTER TABLE customers ADD COLUMN tenant_id UUID;
-- ... repeat for all 60 tables

-- Create default tenant for existing data
INSERT INTO tenants (id, name, subdomain, status)
VALUES (gen_random_uuid(), 'Legacy Tenant', 'legacy', 'active')
RETURNING id INTO @default_tenant_id;

-- Assign all existing data to default tenant
UPDATE products SET tenant_id = @default_tenant_id;
UPDATE orders SET tenant_id = @default_tenant_id;
UPDATE customers SET tenant_id = @default_tenant_id;
-- ... repeat for all tables

-- Make tenant_id NOT NULL after data migration
ALTER TABLE products ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE orders ALTER COLUMN tenant_id SET NOT NULL;
-- ... repeat for all tables

-- Add foreign key constraints
ALTER TABLE products ADD CONSTRAINT fk_products_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
-- ... repeat for all tables

-- Create indexes
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
-- ... repeat for all tables

COMMIT;
```

**Task 1.2: Create Multi-Tenant Tables**

```bash
php artisan migrate --path=database/migrations/multi_tenant
```

Creates:
- `tenants`
- `tenant_domains`
- `tenant_configurations`
- `tenant_features`
- `tenant_quotas`
- `tenant_subscriptions`

**Task 1.3: Implement Global Scopes**

```php
// app/Models/Concerns/BelongsToTenant.php
trait BelongsToTenant
{
    protected static function bootBelongsToTenant()
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            if ($tenantId = app(TenantContext::class)->getTenantId()) {
                $builder->where($builder->getModel()->getTable() . '.tenant_id', $tenantId);
            }
        });
        
        static::creating(function ($model) {
            if (!$model->tenant_id) {
                $model->tenant_id = app(TenantContext::class)->getTenantId();
            }
        });
    }
}

// Apply to all models
class Product extends Model
{
    use BelongsToTenant;
}
```

#### Week 3: Application Layer

**Task 1.4: Tenant Context Middleware**

```php
// app/Http/Middleware/IdentifyTenant.php
class IdentifyTenant
{
    public function handle($request, Closure $next)
    {
        // Extract subdomain
        $host = $request->getHost();
        $subdomain = $this->extractSubdomain($host);
        
        // Load tenant
        $tenant = Tenant::where('subdomain', $subdomain)->firstOrFail();
        
        // Set tenant context
        app(TenantContext::class)->setTenant($tenant);
        
        // Set database context for RLS
        DB::statement("SET app.tenant_id = '{$tenant->id}'");
        
        return $next($request);
    }
}
```

**Task 1.5: Row-Level Security (RLS)**

```sql
-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ... repeat for all tables

-- Create policy
CREATE POLICY tenant_isolation_policy ON products
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
    
-- Repeat for all tables
```

**Task 1.6: Tenant Provisioning Service**

```php
class TenantProvisioningService
{
    public function provisionTenant(array $data): Tenant
    {
        return DB::transaction(function () use ($data) {
            // Create tenant
            $tenant = Tenant::create([
                'name' => $data['name'],
                'subdomain' => $data['subdomain'],
                'owner_id' => $data['owner_id'],
            ]);
            
            // Create subdomain
            TenantDomain::create([
                'tenant_id' => $tenant->id,
                'domain' => "{$data['subdomain']}.stencil.app",
                'is_primary' => true,
            ]);
            
            // Set quotas
            TenantQuota::create([
                'tenant_id' => $tenant->id,
                'max_products' => 1000,
                'max_orders' => 10000,
                'max_storage_mb' => 5120,
            ]);
            
            // Trigger event
            event(new TenantProvisioned($tenant));
            
            return $tenant;
        });
    }
}
```

#### Testing Phase 1

```bash
# Run tests
php artisan test --filter MultiTenant

# Test cases:
# ✅ Tenant can only access own data
# ✅ Cross-tenant access blocked
# ✅ Tenant provisioning works
# ✅ RLS enforced at database level
# ✅ Global scopes work correctly
```

#### Deliverables
✅ All tables have tenant_id  
✅ Existing data migrated to default tenant  
✅ Global scopes implemented  
✅ Tenant middleware working  
✅ RLS enabled and tested  
✅ Tenant provisioning service complete

---

### PHASE 2: RBAC Implementation (Week 4-5)

**Goal**: Implement sophisticated permission system

#### Week 4: Database & Core Logic

**Task 2.1: Create RBAC Tables**

```bash
php artisan migrate --path=database/migrations/rbac
```

Creates:
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `user_permissions`
- `resource_permissions`
- `permission_groups`

**Task 2.2: Seed Default Permissions**

```php
// database/seeders/PermissionSeeder.php
class PermissionSeeder extends Seeder
{
    public function run()
    {
        $permissions = [
            // Product permissions
            'products.create',
            'products.read',
            'products.update',
            'products.delete',
            'products.manage',
            
            // Order permissions
            'orders.create',
            'orders.read',
            'orders.update',
            'orders.delete',
            'orders.fulfill',
            
            // User permissions
            'users.create',
            'users.read',
            'users.update',
            'users.delete',
            
            // Theme permissions
            'themes.install',
            'themes.customize',
            'themes.delete',
            
            // Plugin permissions
            'plugins.install',
            'plugins.configure',
            'plugins.delete',
            
            // Settings permissions
            'settings.read',
            'settings.update',
            
            // ... ~500 total permissions
        ];
        
        foreach ($permissions as $permission) {
            Permission::create([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }
    }
}
```

**Task 2.3: Create Default Roles**

```php
class RoleSeeder extends Seeder
{
    public function run()
    {
        // Platform-level roles
        $superAdmin = Role::create([
            'name' => 'Super Admin',
            'slug' => 'super-admin',
            'scope' => 'platform',
        ]);
        $superAdmin->givePermissionTo('*'); // All permissions
        
        // Tenant-level roles
        $tenantOwner = Role::create([
            'name' => 'Owner',
            'slug' => 'owner',
            'scope' => 'tenant',
        ]);
        $tenantOwner->givePermissionTo([
            'products.*',
            'orders.*',
            'users.*',
            'settings.*',
            'themes.*',
            'plugins.*',
        ]);
        
        $admin = Role::create([
            'name' => 'Admin',
            'slug' => 'admin',
            'scope' => 'tenant',
        ]);
        $admin->givePermissionTo([
            'products.*',
            'orders.*',
            'users.read',
            'users.update',
        ]);
        
        $manager = Role::create([
            'name' => 'Manager',
            'slug' => 'manager',
            'scope' => 'tenant',
        ]);
        $manager->givePermissionTo([
            'products.*',
            'orders.read',
            'orders.update',
            'orders.fulfill',
        ]);
        
        $editor = Role::create([
            'name' => 'Editor',
            'slug' => 'editor',
            'scope' => 'tenant',
        ]);
        $editor->givePermissionTo([
            'products.create',
            'products.read',
            'products.update',
        ]);
        
        $viewer = Role::create([
            'name' => 'Viewer',
            'slug' => 'viewer',
            'scope' => 'tenant',
        ]);
        $viewer->givePermissionTo([
            'products.read',
            'orders.read',
        ]);
    }
}
```

#### Week 5: Integration & API

**Task 2.4: RBAC Service**

```php
class RBACService
{
    public function checkPermission(
        User $user, 
        string $permission, 
        Tenant $tenant
    ): bool {
        // Check cache first
        $cacheKey = "permissions:{$user->id}:{$tenant->id}";
        $permissions = Cache::remember($cacheKey, 1800, function () use ($user, $tenant) {
            return $this->getUserPermissions($user, $tenant);
        });
        
        // Check wildcard permissions
        if (in_array('*', $permissions)) {
            return true;
        }
        
        // Check specific permission
        if (in_array($permission, $permissions)) {
            return true;
        }
        
        // Check wildcard match (e.g., products.* matches products.create)
        foreach ($permissions as $userPermission) {
            if (Str::endsWith($userPermission, '.*')) {
                $prefix = Str::beforeLast($userPermission, '.*');
                if (Str::startsWith($permission, $prefix)) {
                    return true;
                }
            }
        }
        
        return false;
    }
}
```

**Task 2.5: Laravel Gate Integration**

```php
// app/Providers/AuthServiceProvider.php
class AuthServiceProvider extends ServiceProvider
{
    public function boot()
    {
        // Dynamic permission gates
        Gate::before(function ($user, $ability) {
            $tenant = app(TenantContext::class)->getTenant();
            
            if (!$tenant) {
                return false;
            }
            
            return app(RBACService::class)->checkPermission($user, $ability, $tenant);
        });
    }
}
```

**Task 2.6: Permission Middleware**

```php
// app/Http/Middleware/CheckPermission.php
class CheckPermission
{
    public function handle($request, Closure $next, string $permission)
    {
        $tenant = app(TenantContext::class)->getTenant();
        
        if (!Gate::allows($permission, $tenant)) {
            abort(403, "Permission denied: {$permission}");
        }
        
        return $next($request);
    }
}

// Usage in routes
Route::middleware(['tenant', 'permission:products.create'])
    ->post('/products', [ProductController::class, 'store']);
```

#### Testing Phase 2

```bash
php artisan test --filter RBAC

# Test cases:
# ✅ Role assignment works
# ✅ Permission inheritance works
# ✅ Wildcard permissions work
# ✅ Tenant-scoped permissions enforced
# ✅ Cache invalidation on role change
```

#### Deliverables
✅ RBAC tables created  
✅ Default roles & permissions seeded  
✅ Permission checking service  
✅ Laravel Gate integration  
✅ Permission middleware  
✅ Admin UI for role management

---

### PHASE 3: Theme Engine (Week 6-8)

**Goal**: Implement complete theme system

#### Week 6: Core Theme Engine

**Task 3.1: Create Theme Tables**

```bash
php artisan migrate --path=database/migrations/themes
```

**Task 3.2: Theme Loader Service**

```php
class ThemeLoader
{
    public function loadTheme(Tenant $tenant): ?Theme
    {
        $installation = ThemeInstallation::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->first();
            
        if (!$installation) {
            return null;
        }
        
        return Cache::remember(
            "theme:{$tenant->id}:{$installation->theme_id}",
            3600,
            fn () => $installation->theme
        );
    }
}
```

**Task 3.3: Theme View Resolver**

```php
class ThemeViewFinder extends FileViewFinder
{
    protected ?Theme $activeTheme = null;
    
    public function find($name)
    {
        if ($this->activeTheme) {
            $themePath = $this->activeTheme->getPath();
            $themeView = "{$themePath}/views/{$name}.blade.php";
            
            if (Storage::exists($themeView)) {
                return storage_path("app/{$themeView}");
            }
        }
        
        return parent::find($name);
    }
}
```

#### Week 7-8: Theme Customizer & Marketplace

**Task 3.4: Theme Customizer UI (React)**

```typescript
// resources/js/components/ThemeCustomizer.tsx
function ThemeCustomizer() {
  const [settings, setSettings] = useState({});
  const [activeTheme, setActiveTheme] = useState(null);
  
  const updateSetting = async (key: string, value: any) => {
    await api.put(`/themes/settings/${key}`, { value });
    setSettings({ ...settings, [key]: value });
  };
  
  return (
    <div className="theme-customizer">
      <ColorPicker
        value={settings.primary_color}
        onChange={(color) => updateSetting('primary_color', color)}
      />
      <FontSelector
        value={settings.heading_font}
        onChange={(font) => updateSetting('heading_font', font)}
      />
      {/* ... more controls */}
    </div>
  );
}
```

**Task 3.5: Theme Marketplace API**

```php
// app/Http/Controllers/ThemeMarketplaceController.php
class ThemeMarketplaceController extends Controller
{
    public function index(Request $request)
    {
        $themes = ThemeMarketplaceListing::query()
            ->where('status', 'approved')
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->when($request->search, fn($q) => $q->where('name', 'ILIKE', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'rating_average', 'desc')
            ->paginate(20);
            
        return response()->json($themes);
    }
    
    public function purchase(Request $request, string $slug)
    {
        $theme = Theme::where('slug', $slug)->firstOrFail();
        $tenant = $request->tenant();
        
        // Process payment & create license
        $purchase = $this->themeMarketplaceService->purchaseTheme(
            $theme,
            $tenant,
            auth()->user(),
            $request->license_type
        );
        
        return response()->json($purchase);
    }
}
```

#### Testing Phase 3

```bash
php artisan test --filter Theme

# Test cases:
# ✅ Theme loading works
# ✅ Theme switching works
# ✅ Settings customization works
# ✅ Marketplace browsing works
# ✅ Theme purchase flow works
```

#### Deliverables
✅ Theme engine working  
✅ Theme customizer UI  
✅ Theme marketplace API  
✅ Default themes created  
✅ Theme documentation

---

### PHASE 4: Plugin System (Week 9-11)

**Goal**: Implement extensible plugin architecture

#### Week 9-10: Core Plugin System

**Task 4.1: Create Plugin Tables**

```bash
php artisan migrate --path=database/migrations/plugins
```

**Task 4.2: Hook & Filter System**

```php
// app/Plugin/HookManager.php
class HookManager
{
    protected array $actions = [];
    protected array $filters = [];
    
    public function addAction(string $hook, callable $callback, int $priority = 10)
    {
        $this->actions[$hook][$priority][] = $callback;
    }
    
    public function doAction(string $hook, ...$args)
    {
        if (!isset($this->actions[$hook])) return;
        
        ksort($this->actions[$hook]);
        
        foreach ($this->actions[$hook] as $callbacks) {
            foreach ($callbacks as $callback) {
                call_user_func_array($callback, $args);
            }
        }
    }
    
    public function addFilter(string $hook, callable $callback, int $priority = 10)
    {
        $this->filters[$hook][$priority][] = $callback;
    }
    
    public function applyFilters(string $hook, $value, ...$args)
    {
        if (!isset($this->filters[$hook])) return $value;
        
        ksort($this->filters[$hook]);
        
        foreach ($this->filters[$hook] as $callbacks) {
            foreach ($callbacks as $callback) {
                $value = call_user_func_array($callback, array_merge([$value], $args));
            }
        }
        
        return $value;
    }
}
```

**Task 4.3: Plugin Loader**

```php
class PluginLoader
{
    public function loadPlugins(Tenant $tenant): void
    {
        $installations = PluginInstallation::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->with('plugin')
            ->get();
            
        foreach ($installations as $installation) {
            $this->bootPlugin($installation->plugin);
        }
    }
    
    protected function bootPlugin(Plugin $plugin): void
    {
        $providerClass = $plugin->main_file;
        
        if (!class_exists($providerClass)) {
            return;
        }
        
        $provider = app()->register($providerClass);
        $provider->boot();
    }
}
```

#### Week 11: Plugin Marketplace

**Task 4.4: Plugin Security Scanner**

```php
class PluginSecurityScanner
{
    public function scan(Plugin $plugin): ScanResult
    {
        $results = [];
        
        // Malware scan
        $results['malware'] = $this->scanMalware($plugin);
        
        // Dependency vulnerabilities
        $results['vulnerabilities'] = $this->checkDependencies($plugin);
        
        // Dangerous function usage
        $results['dangerous_functions'] = $this->scanDangerousFunctions($plugin);
        
        return new ScanResult($results);
    }
}
```

**Task 4.5: Plugin CLI Tool**

```bash
# Create plugin scaffolding tool
php artisan make:command PluginMakeCommand

# Usage:
php artisan plugin:create my-payment-gateway
```

#### Testing Phase 4

```bash
php artisan test --filter Plugin

# Test cases:
# ✅ Plugin loading works
# ✅ Hook system works
# ✅ Filter system works
# ✅ Plugin installation works
# ✅ Security scanning works
```

#### Deliverables
✅ Plugin system working  
✅ Hook & filter system  
✅ Plugin marketplace  
✅ Security scanner  
✅ Plugin CLI tool  
✅ Starter plugins created

---

### PHASE 5: Marketplace Integration (Week 12-13)

**Goal**: Complete marketplace for themes & plugins

#### Week 12: Marketplace UI

**Task 5.1: Marketplace Frontend (React)**

```typescript
// Marketplace browsing
function MarketplaceBrowser() {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('all');
  
  useEffect(() => {
    fetchMarketplaceItems(category).then(setItems);
  }, [category]);
  
  return (
    <div className="marketplace">
      <CategoryFilter value={category} onChange={setCategory} />
      <ItemGrid items={items} />
    </div>
  );
}
```

**Task 5.2: Purchase Flow**

```typescript
function PurchaseFlow({ item }) {
  const handlePurchase = async () => {
    const result = await api.post(`/marketplace/${item.slug}/purchase`, {
      license_type: 'single-site',
      payment_method_id: paymentMethod,
    });
    
    if (result.success) {
      await installItem(result.license_key);
    }
  };
  
  return <PurchaseButton onClick={handlePurchase} />;
}
```

#### Week 13: Payment Integration

**Task 5.3: Stripe Integration**

```php
class MarketplacePurchaseService
{
    public function processPurchase(
        MarketplaceListing $listing,
        User $buyer,
        Tenant $tenant,
        string $licenseType
    ): Purchase {
        // Create Stripe payment intent
        $paymentIntent = $this->stripe->paymentIntents->create([
            'amount' => $listing->price * 100,
            'currency' => 'usd',
            'metadata' => [
                'listing_id' => $listing->id,
                'buyer_id' => $buyer->id,
                'tenant_id' => $tenant->id,
            ],
        ]);
        
        // Create purchase record
        $purchase = Purchase::create([
            'listing_id' => $listing->id,
            'buyer_id' => $buyer->id,
            'tenant_id' => $tenant->id,
            'amount' => $listing->price,
            'payment_intent_id' => $paymentIntent->id,
            'license_key' => $this->generateLicenseKey(),
        ]);
        
        return $purchase;
    }
}
```

#### Testing Phase 5

```bash
php artisan test --filter Marketplace

# Test cases:
# ✅ Marketplace browsing works
# ✅ Purchase flow works
# ✅ License generation works
# ✅ Payment processing works
```

#### Deliverables
✅ Marketplace UI complete  
✅ Purchase flow working  
✅ Payment integration  
✅ License system  
✅ Revenue sharing implemented

---

### PHASE 6: Polish & Launch (Week 14)

**Goal**: Final testing, optimization, and launch

#### Tasks

**6.1: Performance Optimization**
- Database query optimization
- Cache warming
- Asset optimization
- CDN setup

**6.2: Security Audit**
- Penetration testing
- Vulnerability scanning
- Code review

**6.3: Documentation**
- API documentation
- User guides
- Developer documentation
- Video tutorials

**6.4: Monitoring Setup**
- New Relic APM
- Sentry error tracking
- CloudWatch metrics
- Custom dashboards

**6.5: Launch Preparation**
- Final backup
- DNS configuration
- SSL certificates
- Email templates

#### Deliverables
✅ Performance optimized  
✅ Security audited  
✅ Documentation complete  
✅ Monitoring configured  
✅ Ready for production

---

## DATA MIGRATION

### Migration Scripts

#### Script 1: Add tenant_id to All Tables

```sql
-- Generate dynamic SQL for all tables
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT IN ('migrations', 'password_resets', 'failed_jobs')
    LOOP
        -- Add tenant_id column
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS tenant_id UUID', table_name);
        
        -- Create index
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_tenant_id ON %I(tenant_id)', table_name, table_name);
    END LOOP;
END $$;
```

#### Script 2: Migrate Existing Data

```php
// app/Console/Commands/MigrateToMultiTenant.php
class MigrateToMultiTenant extends Command
{
    public function handle()
    {
        DB::transaction(function () {
            // Create default tenant
            $defaultTenant = Tenant::create([
                'name' => 'Legacy Data',
                'subdomain' => 'legacy',
                'status' => 'active',
            ]);
            
            $this->info("Created default tenant: {$defaultTenant->id}");
            
            // Get all tables
            $tables = DB::select("
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public'
            ");
            
            foreach ($tables as $table) {
                $tableName = $table->tablename;
                
                // Skip system tables
                if (in_array($tableName, ['migrations', 'password_resets'])) {
                    continue;
                }
                
                // Update tenant_id
                DB::statement("
                    UPDATE {$tableName} 
                    SET tenant_id = ? 
                    WHERE tenant_id IS NULL
                ", [$defaultTenant->id]);
                
                $this->info("Migrated {$tableName}");
            }
            
            $this->info("Migration complete!");
        });
    }
}
```

#### Script 3: Validation

```php
class ValidateMigration extends Command
{
    public function handle()
    {
        $tables = DB::select("
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        ");
        
        $errors = [];
        
        foreach ($tables as $table) {
            $tableName = $table->tablename;
            
            // Check for NULL tenant_id
            $nullCount = DB::table($tableName)
                ->whereNull('tenant_id')
                ->count();
                
            if ($nullCount > 0) {
                $errors[] = "{$tableName} has {$nullCount} records with NULL tenant_id";
            }
        }
        
        if (empty($errors)) {
            $this->info("✅ Validation passed!");
        } else {
            $this->error("❌ Validation failed:");
            foreach ($errors as $error) {
                $this->error("  - {$error}");
            }
        }
    }
}
```

---

## RISK MANAGEMENT

### High Risk Items

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data loss during migration | Low | Critical | Multiple backups, staged rollout |
| Performance degradation | Medium | High | Load testing, optimization |
| Cross-tenant data leakage | Low | Critical | RLS, extensive testing |
| Plugin security vulnerabilities | Medium | High | Security scanner, code review |
| Theme compatibility issues | Medium | Medium | Backward compatibility layer |

### Mitigation Strategies

**1. Data Loss Prevention**
- Automated backups before each phase
- Point-in-time recovery enabled
- Staging environment testing
- Canary deployments

**2. Performance Monitoring**
- New Relic APM installed
- Custom performance metrics
- Load testing with 10,000 concurrent users
- Query optimization

**3. Security**
- Row-Level Security enforced
- Permission checks at multiple layers
- Security audits after each phase
- Penetration testing

**4. Rollback Plan**
- Database snapshots before each phase
- Feature flags for quick disable
- Documented rollback procedures
- 24/7 on-call team

---

## TESTING STRATEGY

### Test Levels

#### 1. Unit Tests
```bash
php artisan test --filter Unit
# ~500 unit tests
# Coverage target: 80%
```

#### 2. Integration Tests
```bash
php artisan test --filter Integration
# ~200 integration tests
# Test system interactions
```

#### 3. End-to-End Tests
```bash
npm run test:e2e
# Cypress tests
# ~50 critical user flows
```

#### 4. Load Tests
```bash
# Artillery load testing
artillery run load-test.yml
# Target: 10,000 concurrent users
# Response time < 200ms (p95)
```

#### 5. Security Tests
```bash
# OWASP ZAP scanning
zap-cli quick-scan http://staging.stencil.app

# Dependency scanning
composer audit
npm audit
```

### Test Matrix

| Feature | Unit | Integration | E2E | Load | Security |
|---------|------|-------------|-----|------|----------|
| Multi-Tenant | ✅ | ✅ | ✅ | ✅ | ✅ |
| RBAC | ✅ | ✅ | ✅ | ✅ | ✅ |
| Themes | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Plugins | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Marketplace | ✅ | ✅ | ✅ | ⚠️ | ✅ |

---

## ROLLBACK PLAN

### Rollback Scenarios

#### Scenario 1: Critical Bug in Phase 1

```bash
# 1. Stop deployments
php artisan down

# 2. Restore database backup
pg_restore -d stencil_production backup_phase_0.sql

# 3. Revert code
git revert HEAD
git push origin main

# 4. Restart application
php artisan up
```

#### Scenario 2: Performance Issues

```bash
# 1. Disable feature flag
php artisan feature:deactivate multi-tenant

# 2. Clear caches
php artisan cache:clear
php artisan config:clear

# 3. Monitor metrics
# If stable, investigate issue
# If unstable, full rollback
```

#### Scenario 3: Security Vulnerability

```bash
# 1. Immediate mitigation
php artisan down --message="Security maintenance"

# 2. Patch vulnerability
# 3. Security audit
# 4. Gradual rollout with monitoring
```

### Rollback Decision Matrix

| Issue Severity | Response Time | Action |
|----------------|---------------|--------|
| Critical (data loss, security breach) | Immediate | Full rollback |
| High (broken features, performance) | 1 hour | Partial rollback or hotfix |
| Medium (UI bugs, minor issues) | 4 hours | Hotfix in next deployment |
| Low (cosmetic issues) | 24 hours | Include in regular release |

---

## SUCCESS CRITERIA

### Phase Completion Criteria

Each phase must meet these criteria before moving to next phase:

✅ **All tests passing** (unit + integration + E2E)  
✅ **No critical bugs** (P0/P1 issues resolved)  
✅ **Performance targets met** (<200ms p95 response time)  
✅ **Security audit passed**  
✅ **Documentation updated**  
✅ **Team sign-off** (tech lead + product owner)

### Overall Success Metrics

**Technical Metrics:**
- ✅ 10,000+ concurrent tenants supported
- ✅ <10ms permission check latency
- ✅ <2s theme switch time
- ✅ <5s plugin install time
- ✅ 99.9% uptime
- ✅ Zero cross-tenant data leakage

**Business Metrics:**
- ✅ 100+ tenants migrated successfully
- ✅ 10+ themes in marketplace
- ✅ 20+ plugins in marketplace
- ✅ $10K+ monthly marketplace revenue
- ✅ 90%+ customer satisfaction

---

## CONCLUSION

### Timeline Summary

```
Week 1:    Planning & Setup
Week 2-3:  Multi-Tenant Foundation  ⭐ CRITICAL
Week 4-5:  RBAC Implementation
Week 6-8:  Theme Engine
Week 9-11: Plugin System
Week 12-13: Marketplace Integration
Week 14:   Polish & Launch
```

### Investment Summary

**Time**: 14 weeks  
**Team**: 5 people  
**Cost**: $140K - $180K  
**Risk**: Medium-High  
**ROI**: High (enables multi-tenant SaaS model)

### Next Steps

1. **Week -1**: Get stakeholder approval
2. **Week 0**: Assemble team, set up environments
3. **Week 1**: Execute Phase 0 (Planning)
4. **Week 2**: Begin Phase 1 (Multi-Tenant)
5. **Week 14**: Launch! 🚀

**Ready to transform Stencil into an enterprise multi-tenant platform!** ✨