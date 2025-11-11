# SYSTEM INTEGRATION GUIDE
## How All Advanced Systems Work Together

**Version:** 1.0  
**Last Updated:** November 11, 2025  
**Complexity:** High  
**Scope:** Complete System Integration Architecture  
**Status:** 🚧 **Integration Blueprint** (API-First Architecture)

> **⚠️ IMPLEMENTATION NOTE**  
> This document describes **planned system integration patterns**.  
> **Current**: Frontend-only dengan mock data  
> **Planned**: Full-stack integration via REST/GraphQL APIs  
> **Architecture**: API-First dengan clear separation Frontend ↔ Backend

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Integration Architecture](#integration-architecture)
4. [Common Workflows](#common-workflows)
5. [Data Flow Patterns](#data-flow-patterns)
6. [Event-Driven Integration](#event-driven-integration)
7. [Performance Optimization](#performance-optimization)
8. [Security Considerations](#security-considerations)
9. [Testing Strategy](#testing-strategy)
10. [Troubleshooting](#troubleshooting)

---

## EXECUTIVE SUMMARY

### What This Document Covers

Dokumen ini menjelaskan **complete integration strategy** untuk 4 advanced systems:

1. **Theme Marketplace System** - Visual identity & customization
2. **Plugin Marketplace System** - Extensibility & feature additions
3. **Multi-Tenant Architecture** - Data isolation & resource management
4. **RBAC Permission System** - Access control & authorization

### Integration Goals

✅ **Seamless Interaction**: Systems work together tanpa conflicts  
✅ **Data Consistency**: Shared data tetap konsisten across systems  
✅ **Performance**: Optimized untuk 10,000+ concurrent tenants  
✅ **Security**: Defense-in-depth approach dengan multiple layers  
✅ **Maintainability**: Clear boundaries dan well-defined interfaces

---

## SYSTEM OVERVIEW

### System Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    STENCIL CMS PLATFORM                         │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │  MULTI-TENANT    │◄───────►│      RBAC        │            │
│  │  ARCHITECTURE    │         │   PERMISSIONS    │            │
│  └────────┬─────────┘         └────────┬─────────┘            │
│           │                            │                       │
│           │  Tenant Context            │ Permission Check     │
│           │                            │                       │
│  ┌────────▼─────────┐         ┌────────▼─────────┐            │
│  │  THEME ENGINE    │◄───────►│ PLUGIN SYSTEM    │            │
│  │  & MARKETPLACE   │         │ & MARKETPLACE    │            │
│  └──────────────────┘         └──────────────────┘            │
│           │                            │                       │
│           └────────────┬───────────────┘                       │
│                        │                                       │
│                  ┌─────▼──────┐                               │
│                  │   EVENTS   │                               │
│                  │  DISPATCHER │                               │
│                  └────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### Key Integration Points

| Integration | Direction | Purpose |
|-------------|-----------|---------|
| Multi-Tenant ↔ RBAC | Bidirectional | Tenant-scoped permissions |
| Multi-Tenant ↔ Theme | Multi-Tenant owns | Tenant-specific themes |
| Multi-Tenant ↔ Plugin | Multi-Tenant owns | Tenant-specific plugins |
| RBAC ↔ Theme | RBAC controls | Permission-based theme access |
| RBAC ↔ Plugin | RBAC controls | Permission-based plugin operations |
| Theme ↔ Plugin | Plugin extends | Plugins add theme features |

---

## INTEGRATION ARCHITECTURE

### API-First Layered Architecture with Integration Points

**🚧 PLANNED Integration Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│           FRONTEND LAYER (React SPA)                        │
│  • React 18.3 + TypeScript + Vite                          │
│  • Tenant-aware routing                                    │
│  • Theme-based UI components (ThemeManager)                │
│  • Permission-based UI visibility                          │
│  • State management (Zustand/TanStack Query)               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP/HTTPS Requests (REST/GraphQL)
                     │ Headers: Authorization, X-Tenant-ID
                     │
┌────────────────────▼────────────────────────────────────────┐
│           API GATEWAY / BACKEND LAYER (Laravel)             │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │  API Middleware Stack                            │      │
│  │  • Tenant Identification (subdomain/header)      │      │
│  │  │  Authentication (Sanctum)                      │      │
│  │  │  RBAC Authorization                            │      │
│  │  └─ Rate Limiting & CORS                          │      │
│  └──────────────────┬───────────────────────────────┘      │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────────┐      │
│  │  APPLICATION LAYER (Use Cases)                   │      │
│  │                                                   │      │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────┐      │      │
│  │  │  Tenant  │  │   Theme   │  │  Plugin  │      │      │
│  │  │ Service  │  │  Service  │  │ Service  │      │      │
│  │  └────┬─────┘  └─────┬─────┘  └────┬─────┘      │      │
│  │       │               │              │            │      │
│  │       └───────────────┼──────────────┘            │      │
│  │                       │                           │      │
│  │       ┌───────────────▼──────────────┐            │      │
│  │       │  RBAC Permission Service      │            │      │
│  │       │  • Check user permissions     │            │      │
│  │       │  • Enforce tenant scope       │            │      │
│  │       └───────────────────────────────┘            │      │
│  └────────────────────────────────────────────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Uses Domain Ports
                     │
┌────────────────────▼────────────────────────────────────────┐
│           DOMAIN LAYER (Business Logic)                     │
│  • Tenant-agnostic business logic                          │
│  • Domain entities & value objects                         │
│  • Domain events                                           │
│  • Business rules & validations                            │
│  • Hook & Filter system                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Implemented by Infrastructure Adapters
                     │
┌────────────────────▼────────────────────────────────────────┐
│           INFRASTRUCTURE LAYER                              │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Supabase    │  │   Theme      │  │   Plugin     │     │
│  │  Tenant      │  │   Storage    │  │   Registry   │     │
│  │  Repository  │  │  (Supabase)  │  │   Storage    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│              ┌─────────────▼────────────┐                  │
│              │  Supabase/PostgreSQL     │                  │
│              │  • Row-Level Security    │                  │
│              │  • Tenant isolation      │                  │
│              │  • Realtime subscriptions│                  │
│              └──────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### **Key Integration Points:**

| Layer | Component | Responsibility | Status |
|-------|-----------|----------------|--------|
| **Frontend** | React App | UI rendering, client routing | ✅ Implemented |
| **Frontend** | ThemeManager | Load & apply themes | ✅ Partial |
| **Frontend** | API Client | HTTP requests dengan auth headers | 🚧 Planned |
| **API** | Tenant Middleware | Identify & validate tenant | 🚧 Planned |
| **API** | Auth Middleware | Sanctum token verification | 🚧 Planned |
| **API** | RBAC Middleware | Permission checking | 🚧 Planned |
| **API** | Theme Service | Theme registry & metadata | 🚧 Planned |
| **API** | Plugin Service | Plugin orchestration | 🚧 Planned |
| **Database** | Supabase RLS | Row-level tenant isolation | 🚧 Planned |

### Shared Context Pattern

**Tenant Context** adalah shared state yang mengalir melalui semua systems:

```php
class TenantContext
{
    protected ?Tenant $tenant = null;
    protected ?User $user = null;
    protected ?Theme $activeTheme = null;
    protected array $activePlugins = [];
    protected array $userPermissions = [];
    
    public function setTenant(Tenant $tenant): void
    {
        $this->tenant = $tenant;
        
        // Load tenant-specific data
        $this->loadActiveTheme();
        $this->loadActivePlugins();
        $this->loadUserPermissions();
    }
    
    public function canAccessTheme(string $themeSlug): bool
    {
        // Check RBAC permission
        return $this->hasPermission("themes.{$themeSlug}.access");
    }
    
    public function canInstallPlugin(string $pluginSlug): bool
    {
        // Check RBAC permission
        if (!$this->hasPermission('plugins.install')) {
            return false;
        }
        
        // Check tenant quota
        if ($this->tenant->hasReachedPluginLimit()) {
            return false;
        }
        
        return true;
    }
}
```

---

## COMMON WORKFLOWS

### Workflow 1: New Tenant Onboarding

```
┌─────────────────────────────────────────────────────────────────┐
│  NEW TENANT REGISTRATION & SETUP                               │
└─────────────────────────────────────────────────────────────────┘

1. USER REGISTRATION
   ↓
2. MULTI-TENANT: Create Tenant
   • Generate tenant_id (UUID)
   • Create subdomain (e.g., acme.stencil.app)
   • Set initial quotas
   • Create tenant database context
   ↓
3. RBAC: Create Initial Roles & Permissions
   • Create "Owner" role for user
   • Assign full permissions
   • Create default roles (Admin, Editor, Viewer)
   ↓
4. THEME: Install Default Theme
   • Select onboarding theme (e.g., "starter")
   • Create theme_installation record
   • Copy theme files to tenant storage
   • Initialize default theme settings
   • Activate theme
   ↓
5. PLUGIN: Install Essential Plugins
   • Auto-install required plugins (e.g., payment gateway)
   • Create plugin_installations records
   • Run plugin migrations
   • Activate plugins
   ↓
6. PROVISIONING COMPLETE
   • Send welcome email
   • Redirect to dashboard
   • Show onboarding wizard
```

**Implementation:**

```php
class TenantOnboardingService
{
    public function onboardNewTenant(User $owner, array $data): Tenant
    {
        return DB::transaction(function () use ($owner, $data) {
            // 1. Create tenant
            $tenant = $this->multiTenantService->createTenant([
                'name' => $data['company_name'],
                'subdomain' => $data['subdomain'],
                'owner_id' => $owner->id,
            ]);
            
            // 2. Set up RBAC
            $this->rbacService->setupTenantRoles($tenant, $owner);
            
            // 3. Install default theme
            $theme = $this->themeService->installDefaultTheme($tenant);
            
            // 4. Install essential plugins
            $this->pluginService->installEssentialPlugins($tenant, [
                'payment-gateway-base',
                'shipping-calculator',
            ]);
            
            // 5. Trigger event
            event(new TenantProvisioned($tenant));
            
            return $tenant;
        });
    }
}
```

### Workflow 2: Theme Customization with Permission Check

```
┌─────────────────────────────────────────────────────────────────┐
│  THEME CUSTOMIZATION WORKFLOW                                  │
└─────────────────────────────────────────────────────────────────┘

1. USER: Open Theme Customizer
   ↓
2. MULTI-TENANT: Resolve Tenant Context
   • Identify tenant from subdomain/domain
   • Load tenant data
   ↓
3. RBAC: Check Permission
   • Verify user has "themes.customize" permission
   • If no permission → 403 Forbidden
   ↓
4. THEME: Load Active Theme
   • Get tenant's active theme
   • Load theme manifest & settings schema
   • Load current settings
   ↓
5. USER: Modify Settings (e.g., change primary color)
   ↓
6. RBAC: Validate Permission (again)
   • Check "themes.customize" permission
   ↓
7. THEME: Validate & Save Setting
   • Validate against schema
   • Save to theme_settings table (tenant-scoped)
   • Clear theme cache for tenant
   ↓
8. PLUGIN: Trigger Hook
   • do_action('theme.setting_updated', $tenant, $key, $value)
   • Plugins can react (e.g., regenerate CSS)
   ↓
9. RESPONSE: Return Success
   • Send updated preview
```

**Implementation:**

```php
class ThemeCustomizationController
{
    public function updateSetting(Request $request, string $settingKey)
    {
        // 1. Get tenant context
        $tenant = $request->tenant(); // From middleware
        
        // 2. Check permission
        if (!auth()->user()->can('themes.customize', $tenant)) {
            abort(403, 'No permission to customize theme');
        }
        
        // 3. Load active theme
        $theme = $this->themeService->getActiveTheme($tenant);
        
        // 4. Validate & save
        $validated = $request->validate([
            'value' => 'required',
        ]);
        
        $this->themeService->updateSetting(
            $tenant,
            $theme,
            $settingKey,
            $validated['value']
        );
        
        // 5. Trigger hook
        do_action('theme.setting_updated', $tenant, $settingKey, $validated['value']);
        
        // 6. Clear cache
        Cache::tags(['theme', "tenant:{$tenant->id}"])->flush();
        
        return response()->json(['success' => true]);
    }
}
```

### Workflow 3: Plugin Installation with Multi-System Integration

```
┌─────────────────────────────────────────────────────────────────┐
│  PLUGIN INSTALLATION WORKFLOW                                  │
└─────────────────────────────────────────────────────────────────┘

1. USER: Click "Install Plugin"
   ↓
2. MULTI-TENANT: Get Tenant Context
   ↓
3. RBAC: Check Permissions
   • Check "plugins.install" permission
   • Check tenant quota (max_plugins)
   ↓
4. PLUGIN: Validate Dependencies
   • Check Stencil version compatibility
   • Check required plugins installed
   • Check conflicts
   ↓
5. MULTI-TENANT: Check Resource Quotas
   • storage_used + plugin_size < storage_quota
   ↓
6. PLUGIN: Download & Extract
   • Download from marketplace
   • Verify signature
   • Extract to tenant storage
   ↓
7. PLUGIN: Run Security Scan
   • Malware scan
   • Vulnerability check
   ↓
8. PLUGIN: Run Migrations
   • Execute plugin database migrations
   • Create plugin tables (tenant-scoped)
   ↓
9. PLUGIN: Register Hooks & Filters
   • Register in plugin_hooks table
   ↓
10. RBAC: Create Plugin-Specific Permissions (if any)
    • Add to permissions table
    ↓
11. THEME: Allow Plugin to Modify Theme (if applicable)
    • Plugin can add theme components
    • Plugin can register theme hooks
    ↓
12. PLUGIN: Activate Plugin
    • Call plugin's activate() method
    • Update plugin_installations.is_active = true
    ↓
13. EVENT: Broadcast PluginInstalled Event
    ↓
14. RESPONSE: Success
```

**Implementation:**

```php
class PluginInstallationService
{
    public function installPlugin(
        Tenant $tenant,
        User $user,
        string $pluginSlug,
        ?string $licenseKey = null
    ): PluginInstallation {
        // 1. Check RBAC permission
        if (!$user->can('plugins.install', $tenant)) {
            throw new UnauthorizedException('No permission to install plugins');
        }
        
        // 2. Get plugin
        $plugin = Plugin::where('slug', $pluginSlug)->firstOrFail();
        
        // 3. Check tenant quota
        if ($tenant->hasReachedPluginLimit()) {
            throw new QuotaExceededException('Plugin installation limit reached');
        }
        
        return DB::transaction(function () use ($tenant, $user, $plugin, $licenseKey) {
            // 4. Validate dependencies
            $this->validateDependencies($plugin, $tenant);
            
            // 5. Download & verify
            $pluginPath = $this->downloadAndVerify($plugin, $licenseKey);
            
            // 6. Security scan
            $this->securityScanner->scan($plugin);
            
            // 7. Run migrations
            $this->runMigrations($plugin, $tenant);
            
            // 8. Create installation record
            $installation = PluginInstallation::create([
                'tenant_id' => $tenant->id,
                'plugin_id' => $plugin->id,
                'installed_version' => $plugin->version,
                'installed_by' => $user->id,
                'license_key' => $licenseKey,
                'is_active' => false,
            ]);
            
            // 9. Register hooks
            $this->registerHooks($plugin, $installation);
            
            // 10. Create plugin permissions (if needed)
            if ($permissions = $plugin->getRequiredPermissions()) {
                $this->rbacService->createPluginPermissions($plugin, $permissions);
            }
            
            // 11. Activate
            $this->activatePlugin($installation);
            
            // 12. Trigger event
            event(new PluginInstalled($tenant, $installation));
            
            return $installation;
        });
    }
}
```

### Workflow 4: Permission-Based Feature Access

```
┌─────────────────────────────────────────────────────────────────┐
│  CROSS-SYSTEM PERMISSION CHECK                                │
└─────────────────────────────────────────────────────────────────┘

SCENARIO: User tries to access analytics plugin dashboard

1. REQUEST: GET /analytics/dashboard
   ↓
2. MULTI-TENANT: Identify Tenant
   • Extract from subdomain: analytics.acme.stencil.app
   • Load tenant: Acme Corp
   ↓
3. MULTI-TENANT: Inject Tenant Context
   • Set tenant_id in global scope
   ↓
4. PLUGIN: Check Plugin Installed & Active
   • Query plugin_installations
   • WHERE tenant_id = acme AND plugin_slug = 'analytics'
   • AND is_active = true
   ↓
5. RBAC: Check User Permission
   • Get user roles for tenant
   • Check permission: "plugins.analytics.access"
   • If no permission → 403 Forbidden
   ↓
6. PLUGIN: Load Analytics Dashboard
   • Execute plugin code
   • Fetch analytics data (tenant-scoped)
   ↓
7. THEME: Apply Active Theme
   • Render with tenant's active theme
   • Apply theme customizations
   ↓
8. RESPONSE: Rendered Dashboard
```

---

## DATA FLOW PATTERNS

### Pattern 1: Tenant-Scoped Data Access

**All database queries must be tenant-scoped:**

```php
// BAD: No tenant scope
$products = Product::all();

// GOOD: Tenant-scoped
$products = Product::where('tenant_id', $tenant->id)->get();

// BEST: Global scope (automatic)
// In Product model:
protected static function booted()
{
    static::addGlobalScope('tenant', function (Builder $builder) {
        if ($tenantId = app(TenantContext::class)->getTenantId()) {
            $builder->where('tenant_id', $tenantId);
        }
    });
}

// Now this automatically scopes to tenant:
$products = Product::all();
```

### Pattern 2: Permission Check Before Action

**Always check permissions before executing actions:**

```php
// Standard pattern
public function updateProduct(Request $request, Product $product)
{
    // 1. Tenant check (automatic via global scope)
    // 2. Permission check
    $this->authorize('update', $product);
    
    // 3. Execute action
    $product->update($request->validated());
    
    // 4. Trigger hook (for plugins)
    do_action('product.updated', $product);
    
    return response()->json($product);
}
```

### Pattern 3: Event-Driven Communication

**Systems communicate via events:**

```php
// Multi-Tenant triggers event
event(new TenantCreated($tenant));

// RBAC listens and creates default roles
Event::listen(TenantCreated::class, function ($event) {
    $this->rbacService->createDefaultRoles($event->tenant);
});

// Theme listens and installs default theme
Event::listen(TenantCreated::class, function ($event) {
    $this->themeService->installDefaultTheme($event->tenant);
});

// Plugin listens and installs essential plugins
Event::listen(TenantCreated::class, function ($event) {
    $this->pluginService->installEssentialPlugins($event->tenant);
});
```

---

## EVENT-DRIVEN INTEGRATION

### System Events

#### Multi-Tenant Events

```php
// Tenant lifecycle
event(new TenantCreated($tenant));
event(new TenantUpdated($tenant));
event(new TenantSuspended($tenant));
event(new TenantDeleted($tenant));

// Domain management
event(new CustomDomainAdded($tenant, $domain));
event(new CustomDomainVerified($tenant, $domain));
```

#### RBAC Events

```php
// Role events
event(new RoleCreated($role));
event(new RoleAssigned($user, $role, $tenant));
event(new RoleRevoked($user, $role, $tenant));

// Permission events
event(new PermissionGranted($user, $permission, $resource));
event(new PermissionDenied($user, $permission, $resource));
```

#### Theme Events

```php
// Theme lifecycle
event(new ThemeInstalled($tenant, $theme));
event(new ThemeActivated($tenant, $theme));
event(new ThemeDeactivated($tenant, $theme));

// Customization
event(new ThemeSettingUpdated($tenant, $key, $value));
event(new ThemeCustomized($tenant, $theme, $settings));
```

#### Plugin Events

```php
// Plugin lifecycle
event(new PluginInstalled($tenant, $plugin));
event(new PluginActivated($tenant, $plugin));
event(new PluginDeactivated($tenant, $plugin));
event(new PluginUninstalled($tenant, $plugin));

// Plugin execution
event(new PluginExecuted($plugin, $hook, $duration));
event(new PluginError($plugin, $exception));
```

### Event Listeners

```php
// In EventServiceProvider
protected $listen = [
    TenantCreated::class => [
        CreateDefaultRoles::class,
        InstallDefaultTheme::class,
        InstallEssentialPlugins::class,
        SendWelcomeEmail::class,
    ],
    
    ThemeActivated::class => [
        ClearThemeCache::class,
        RegenerateAssets::class,
        NotifyPlugins::class,
    ],
    
    PluginInstalled::class => [
        RegisterPluginHooks::class,
        CreatePluginPermissions::class,
        NotifyTheme::class,
    ],
];
```

---

## PERFORMANCE OPTIMIZATION

### Caching Strategy

#### Multi-Level Caching

```php
class CacheManager
{
    // L1: Tenant context cache (1 hour)
    public function getTenantContext(string $tenantId): array
    {
        return Cache::remember("tenant:{$tenantId}:context", 3600, function () use ($tenantId) {
            return [
                'tenant' => Tenant::find($tenantId),
                'active_theme' => $this->getActiveTheme($tenantId),
                'active_plugins' => $this->getActivePlugins($tenantId),
                'quotas' => $this->getQuotas($tenantId),
            ];
        });
    }
    
    // L2: Theme cache (6 hours)
    public function getTheme(string $themeSlug): Theme
    {
        return Cache::remember("theme:{$themeSlug}", 21600, function () use ($themeSlug) {
            return Theme::where('slug', $themeSlug)->first();
        });
    }
    
    // L3: Permission cache (30 minutes)
    public function getUserPermissions(string $userId, string $tenantId): array
    {
        return Cache::remember("permissions:{$userId}:{$tenantId}", 1800, function () use ($userId, $tenantId) {
            return $this->rbacService->getUserPermissions($userId, $tenantId);
        });
    }
    
    // L4: Plugin data cache (varies)
    public function getPluginData(string $pluginSlug, string $key): mixed
    {
        return Cache::get("plugin:{$pluginSlug}:{$key}");
    }
}
```

#### Cache Invalidation

```php
// Clear tenant-specific cache on updates
Event::listen(TenantUpdated::class, function ($event) {
    Cache::tags(["tenant:{$event->tenant->id}"])->flush();
});

// Clear theme cache on customization
Event::listen(ThemeSettingUpdated::class, function ($event) {
    Cache::tags(['theme', "tenant:{$event->tenant->id}"])->flush();
});

// Clear permission cache on role assignment
Event::listen(RoleAssigned::class, function ($event) {
    Cache::forget("permissions:{$event->user->id}:{$event->tenant->id}");
});
```

### Database Optimization

#### Indexing Strategy

```sql
-- Multi-tenant indexes
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);

-- Composite indexes for common queries
CREATE INDEX idx_plugin_installations_tenant_active 
    ON plugin_installations(tenant_id, is_active) 
    WHERE is_active = true;

CREATE INDEX idx_theme_settings_tenant_theme 
    ON theme_settings(tenant_id, theme_installation_id);

-- JSONB indexes for plugin/theme manifests
CREATE INDEX idx_plugins_manifest ON plugins USING GIN(manifest);
CREATE INDEX idx_themes_customizer_schema ON themes USING GIN(customizer_schema);
```

#### Query Optimization

```php
// Eager load relationships to avoid N+1
$tenant = Tenant::with([
    'activeTheme.settings',
    'activePlugins.settings',
    'users.roles.permissions',
])->find($tenantId);

// Use select() to limit columns
$products = Product::select(['id', 'name', 'price', 'stock'])
    ->where('tenant_id', $tenantId)
    ->get();
```

---

## SECURITY CONSIDERATIONS

### Defense in Depth

#### Layer 1: Application-Level Isolation

```php
// Global scope ensures tenant isolation
class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model)
    {
        if ($tenantId = app(TenantContext::class)->getTenantId()) {
            $builder->where('tenant_id', $tenantId);
        }
    }
}
```

#### Layer 2: Database-Level Isolation (RLS)

```sql
-- Row-Level Security in PostgreSQL
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON products
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

#### Layer 3: Permission Checks

```php
// Always check permissions
if (!auth()->user()->can('products.create', $tenant)) {
    abort(403);
}
```

#### Layer 4: Plugin Sandboxing

```php
// Limit plugin resource usage
$this->pluginSandbox->execute($plugin, function () {
    // Plugin code runs with limits
}, [
    'max_execution_time' => 30,
    'max_memory' => 128 * 1024 * 1024,
    'max_api_calls' => 100,
]);
```

### Audit Logging

```php
// Log all sensitive operations
AuditLog::create([
    'tenant_id' => $tenant->id,
    'user_id' => auth()->id(),
    'action' => 'plugin.installed',
    'resource_type' => 'Plugin',
    'resource_id' => $plugin->id,
    'ip_address' => request()->ip(),
    'user_agent' => request()->userAgent(),
    'metadata' => [
        'plugin_slug' => $plugin->slug,
        'version' => $plugin->version,
    ],
]);
```

---

## TESTING STRATEGY

### Integration Tests

```php
class SystemIntegrationTest extends TestCase
{
    /** @test */
    public function tenant_onboarding_integrates_all_systems()
    {
        // Arrange
        $user = User::factory()->create();
        
        // Act
        $tenant = $this->tenantOnboardingService->onboardNewTenant($user, [
            'company_name' => 'Acme Corp',
            'subdomain' => 'acme',
        ]);
        
        // Assert: Multi-Tenant
        $this->assertDatabaseHas('tenants', [
            'id' => $tenant->id,
            'subdomain' => 'acme',
        ]);
        
        // Assert: RBAC
        $this->assertTrue($user->hasRole('Owner', $tenant));
        
        // Assert: Theme
        $this->assertNotNull($tenant->activeTheme);
        $this->assertEquals('starter', $tenant->activeTheme->slug);
        
        // Assert: Plugin
        $this->assertTrue($tenant->hasPlugin('payment-gateway-base'));
    }
    
    /** @test */
    public function plugin_installation_respects_permissions()
    {
        // Arrange
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create();
        $user->assignRole('Viewer', $tenant); // No install permission
        
        // Act & Assert
        $this->expectException(UnauthorizedException::class);
        
        $this->pluginService->installPlugin(
            $tenant,
            $user,
            'analytics-plugin'
        );
    }
}
```

---

## TROUBLESHOOTING

### Common Issues

#### Issue 1: Theme Not Loading After Plugin Installation

**Symptoms:**
- Theme broken after plugin activation
- CSS/JS conflicts

**Diagnosis:**
```bash
# Check plugin hooks affecting theme
SELECT * FROM plugin_hooks 
WHERE hook_name LIKE 'theme.%';

# Check plugin errors
SELECT * FROM plugin_events 
WHERE is_error = true 
ORDER BY created_at DESC 
LIMIT 10;
```

**Solution:**
```php
// Deactivate conflicting plugin
$this->pluginService->deactivatePlugin($tenant, $plugin);

// Clear cache
Cache::tags(['theme', 'plugin'])->flush();
```

#### Issue 2: Permission Denied Unexpectedly

**Symptoms:**
- User can't access feature they should have access to
- 403 errors

**Diagnosis:**
```php
// Debug permission check
$user = User::find($userId);
$tenant = Tenant::find($tenantId);

dd([
    'user_roles' => $user->getRoles($tenant),
    'role_permissions' => $user->getPermissions($tenant),
    'can_access' => $user->can('feature.access', $tenant),
]);
```

**Solution:**
```php
// Refresh permission cache
Cache::forget("permissions:{$userId}:{$tenantId}");

// Or reassign role
$user->assignRole('Admin', $tenant);
```

---

## CONCLUSION

**Integration Success Criteria:**

✅ All 4 systems work seamlessly together  
✅ Tenant isolation maintained across all systems  
✅ Permissions enforced consistently  
✅ Performance targets met (<200ms response time)  
✅ Zero data leakage between tenants  

**Next Steps:**
- Implement integration tests
- Set up monitoring & alerts
- Document API integration patterns
- Train development team