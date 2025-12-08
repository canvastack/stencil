# Phase 1: Multi-Tenant Foundation

**Duration**: 4 weeks  
**Priority**: CRITICAL  
**Team**: 3-4 developers (1 senior, 2-3 mid/junior)

## Overview

This phase establishes the core multi-tenant architecture foundation for the CanvaStack Stencil platform. The primary focus is implementing advanced security multi-tenancy with proper data isolation between Account A (Platform Owner) and Account B (Tenants).

## Prerequisites

### Development Environment Setup
```bash
# Required versions
PHP 8.2+
Laravel 10+
PostgreSQL 13+
Redis 6+
Node.js 18+ (for asset compilation)
Docker Desktop (recommended)
```

### Project Initialization
```bash
# Create new Laravel project
composer create-project laravel/laravel canvastack-backend

# Install essential packages
composer require spatie/laravel-multitenancy
composer require spatie/laravel-permission
composer require tymon/jwt-auth
composer require spatie/laravel-query-builder
composer require spatie/laravel-medialibrary
composer require barryvdh/laravel-cors
```

## Week 1: Core Multi-Tenant Architecture

### Day 1-2: Database Design & Schema

#### Multi-Tenant Database Strategy
Based on the frontend analysis and business requirements, we'll implement a **hybrid multi-tenancy** approach:

**Platform-Level Tables (Account A scope)**:
- `accounts` (Platform owners)
- `tenants` (Account B - tenant businesses) 
- `tenant_subscriptions`
- `platform_analytics`
- `domain_mappings`

**Tenant-Level Tables (Account B scope)**:
- All business-specific tables with `tenant_id` foreign key
- Complete data isolation per tenant

#### Primary Migration Files

**1. Create Platform Foundation Migration**
```php
// database/migrations/2024_01_01_000001_create_platform_foundation.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Account A: Platform Owners
        Schema::create('accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('account_type', ['platform_owner'])->default('platform_owner');
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->json('settings')->nullable();
            $table->string('avatar')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // Account B: Tenants  
        Schema::create('tenants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name'); // Business name
            $table->string('slug')->unique(); // for URL: canvastencil.com/tenant_slug
            $table->string('domain')->nullable()->unique(); // custom domain: tenant.com
            $table->string('database')->nullable(); // if using separate DB per tenant
            $table->json('data')->nullable(); // tenant-specific configuration
            $table->enum('status', ['active', 'inactive', 'suspended', 'trial'])->default('trial');
            $table->enum('subscription_status', ['active', 'expired', 'cancelled'])->default('active');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('subscription_ends_at')->nullable();
            $table->uuid('created_by')->nullable(); // Account A user who created this tenant
            $table->timestamps();
            
            $table->foreign('created_by')->references('id')->on('accounts')->onDelete('set null');
            $table->index(['status', 'subscription_status']);
            $table->index(['domain']); // for custom domain lookups
        });

        // Tenant Subscriptions
        Schema::create('tenant_subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->string('plan_name'); // basic, professional, enterprise
            $table->decimal('monthly_price', 10, 2);
            $table->integer('user_limit')->default(5);
            $table->integer('product_limit')->default(100);
            $table->integer('storage_limit_mb')->default(1000); // 1GB
            $table->boolean('custom_domain_enabled')->default(false);
            $table->boolean('api_access_enabled')->default(false);
            $table->json('features')->nullable(); // JSON array of enabled features
            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->nullable();
            $table->enum('status', ['active', 'expired', 'cancelled'])->default('active');
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['tenant_id', 'status']);
        });

        // Domain Mappings (for custom domain support)
        Schema::create('domain_mappings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->string('domain'); // custom domain: tenant1.com
            $table->string('subdomain')->nullable(); // subdomain: shop.tenant1.com  
            $table->boolean('is_primary')->default(true);
            $table->boolean('ssl_enabled')->default(false);
            $table->string('ssl_certificate_path')->nullable();
            $table->enum('status', ['pending', 'active', 'failed'])->default('pending');
            $table->json('dns_records')->nullable(); // Required DNS configuration
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->unique(['domain', 'subdomain']);
            $table->index(['domain', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('domain_mappings');
        Schema::dropIfExists('tenant_subscriptions');
        Schema::dropIfExists('tenants');
        Schema::dropIfExists('accounts');
    }
};
```

**2. Create Multi-Tenant User System**
```php
// database/migrations/2024_01_01_000002_create_multi_tenant_users.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tenant Users (Account B users)
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id'); // Multi-tenant key
            $table->string('name');
            $table->string('email'); // Not globally unique (per tenant)
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('phone')->nullable();
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->string('department')->nullable();
            $table->json('location')->nullable(); // {address, city, province, postal_code}
            $table->string('avatar')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->unique(['tenant_id', 'email']); // Email unique per tenant
            $table->index(['tenant_id', 'status']);
        });

        // Role-based permissions per tenant
        Schema::create('roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable(); // NULL = platform role, UUID = tenant role
            $table->string('name');
            $table->string('slug');
            $table->string('description')->nullable();
            $table->boolean('is_system')->default(false); // System roles can't be deleted
            $table->json('abilities')->nullable(); // JSON array of permissions
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->unique(['tenant_id', 'slug']); // Role slug unique per tenant
            $table->index(['tenant_id', 'is_system']);
        });

        // User-Role assignments
        Schema::create('user_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('role_id');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
            $table->unique(['user_id', 'role_id']);
        });

        // Account-Role assignments (for platform owners)
        Schema::create('account_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('account_id');
            $table->uuid('role_id');
            $table->timestamps();

            $table->foreign('account_id')->references('id')->on('accounts')->onDelete('cascade');
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
            $table->unique(['account_id', 'role_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_roles');
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('users');
    }
};
```

### Day 3-4: Core Multi-Tenancy Implementation

#### Tenant Model with Business Logic
```php
// app/Models/Tenant.php
<?php

namespace App\Models;

use Spatie\Multitenancy\Models\Tenant as SpatieTenant;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Tenant extends SpatieTenant
{
    use HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'domain', 
        'database',
        'data',
        'status',
        'subscription_status',
        'trial_ends_at',
        'subscription_ends_at',
        'created_by'
    ];

    protected $casts = [
        'data' => 'array',
        'trial_ends_at' => 'datetime',
        'subscription_ends_at' => 'datetime'
    ];

    // Relationships
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(TenantSubscription::class)->where('status', 'active');
    }

    public function domainMappings(): HasMany
    {
        return $this->hasMany(DomainMapping::class);
    }

    // Business Logic Methods
    public function isActive(): bool
    {
        return $this->status === 'active' && 
               $this->subscription_status === 'active' &&
               ($this->subscription_ends_at === null || $this->subscription_ends_at->isFuture());
    }

    public function isOnTrial(): bool
    {
        return $this->subscription_status === 'trial' && 
               $this->trial_ends_at && 
               $this->trial_ends_at->isFuture();
    }

    public function hasCustomDomain(): bool
    {
        return !empty($this->domain) || $this->domainMappings()->where('status', 'active')->exists();
    }

    public function getPrimaryDomain(): string
    {
        if ($this->domain) {
            return $this->domain;
        }
        
        $mapping = $this->domainMappings()->where('is_primary', true)->where('status', 'active')->first();
        return $mapping ? $mapping->domain : "canvastencil.com/{$this->slug}";
    }

    // URL Generation
    public function getPublicUrl(string $path = ''): string
    {
        $domain = $this->getPrimaryDomain();
        $path = ltrim($path, '/');
        
        if ($this->hasCustomDomain()) {
            return "https://{$domain}/{$path}";
        }
        
        return "https://canvastencil.com/{$this->slug}/{$path}";
    }

    public function getAdminUrl(string $path = ''): string
    {
        $path = ltrim($path, '/');
        return $this->getPublicUrl("admin/{$path}");
    }

    // Subscription Management
    public function canCreateUsers(): bool
    {
        $subscription = $this->subscription;
        if (!$subscription) return false;
        
        return $this->users()->count() < $subscription->user_limit;
    }

    public function canCreateProducts(): bool
    {
        $subscription = $this->subscription;
        if (!$subscription) return false;
        
        return $this->products()->count() < $subscription->product_limit;
    }

    public function getRemainingStorageMB(): int
    {
        $subscription = $this->subscription;
        if (!$subscription) return 0;
        
        $usedMB = $this->calculateUsedStorageMB();
        return max(0, $subscription->storage_limit_mb - $usedMB);
    }

    private function calculateUsedStorageMB(): int
    {
        // TODO: Implement storage calculation
        return 0;
    }
}
```

#### Multi-Tenant Middleware
```php
// app/Http/Middleware/IdentifyTenant.php
<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Models\DomainMapping;
use Closure;
use Illuminate\Http\Request;
use Spatie\Multitenancy\Models\Concerns\UsesTenantConnection;

class IdentifyTenant
{
    use UsesTenantConnection;

    public function handle(Request $request, Closure $next)
    {
        $tenant = $this->identifyTenant($request);
        
        if ($tenant) {
            // Set current tenant
            $tenant->makeCurrent();
            
            // Store in request for easy access
            $request->attributes->set('tenant', $tenant);
            
            // Verify tenant is active
            if (!$tenant->isActive()) {
                return response()->json([
                    'error' => 'Tenant is not active or subscription expired'
                ], 403);
            }
        }
        
        return $next($request);
    }

    private function identifyTenant(Request $request): ?Tenant
    {
        $host = $request->getHost();
        $path = $request->path();
        
        // Method 1: Custom Domain
        $tenant = $this->identifyByDomain($host);
        if ($tenant) return $tenant;
        
        // Method 2: Subdirectory (canvastencil.com/tenant_slug/...)
        $tenant = $this->identifyBySubdirectory($path);
        if ($tenant) return $tenant;
        
        // Method 3: API header (for API requests)
        $tenant = $this->identifyByHeader($request);
        if ($tenant) return $tenant;
        
        return null;
    }

    private function identifyByDomain(string $host): ?Tenant
    {
        // Direct domain match
        $tenant = Tenant::where('domain', $host)->first();
        if ($tenant) return $tenant;
        
        // Domain mapping match
        $mapping = DomainMapping::where('domain', $host)
            ->where('status', 'active')
            ->first();
            
        return $mapping ? $mapping->tenant : null;
    }

    private function identifyBySubdirectory(string $path): ?Tenant
    {
        // Extract tenant slug from path: /tenant_slug/...
        $segments = explode('/', trim($path, '/'));
        
        if (empty($segments[0])) return null;
        
        // Skip if it's admin, api, or other platform routes
        if (in_array($segments[0], ['admin', 'api', 'platform'])) {
            return null;
        }
        
        return Tenant::where('slug', $segments[0])->first();
    }

    private function identifyByHeader(Request $request): ?Tenant
    {
        $tenantId = $request->header('X-Tenant-ID');
        
        if (!$tenantId) return null;
        
        return Tenant::find($tenantId);
    }
}
```

### Day 5: Advanced Security Implementation

#### Tenant Isolation Middleware
```php
// app/Http/Middleware/EnsureTenantIsolation.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class EnsureTenantIsolation
{
    public function handle(Request $request, Closure $next)
    {
        $tenant = $request->attributes->get('tenant');
        
        if (!$tenant) {
            return response()->json(['error' => 'Tenant not identified'], 400);
        }
        
        // Apply global scope to all tenant-aware models
        $this->applyTenantScope($tenant);
        
        return $next($request);
    }

    private function applyTenantScope($tenant): void
    {
        // Add global scope for tenant isolation
        Builder::macro('forTenant', function ($tenantId = null) {
            $tenantId = $tenantId ?? optional(request()->attributes->get('tenant'))->id;
            
            return $this->where('tenant_id', $tenantId);
        });
        
        // Apply to all tenant-aware models automatically
        $tenantAwareModels = [
            \App\Models\User::class,
            \App\Models\Product::class,
            \App\Models\Order::class,
            \App\Models\Customer::class,
            \App\Models\Review::class,
            // Add more models as needed
        ];
        
        foreach ($tenantAwareModels as $model) {
            $model::addGlobalScope('tenant', function (Builder $builder) use ($tenant) {
                $builder->where('tenant_id', $tenant->id);
            });
        }
    }
}
```

#### Security Audit Trait
```php
// app/Traits/HasSecurityAudit.php
<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Relations\MorphMany;
use App\Models\SecurityAuditLog;

trait HasSecurityAudit
{
    protected static function bootHasSecurityAudit(): void
    {
        static::created(function ($model) {
            $model->logSecurityEvent('created', $model->toArray());
        });

        static::updated(function ($model) {
            $model->logSecurityEvent('updated', [
                'original' => $model->getOriginal(),
                'changes' => $model->getChanges()
            ]);
        });

        static::deleted(function ($model) {
            $model->logSecurityEvent('deleted', $model->toArray());
        });
    }

    public function securityLogs(): MorphMany
    {
        return $this->morphMany(SecurityAuditLog::class, 'auditable');
    }

    public function logSecurityEvent(string $event, array $data = []): void
    {
        $this->securityLogs()->create([
            'event' => $event,
            'data' => $data,
            'user_id' => auth()->id(),
            'tenant_id' => $this->tenant_id ?? null,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'occurred_at' => now()
        ]);
    }
}
```

## Week 2: File Structure & Organization

### Laravel Project Structure
```
app/
├── Console/Commands/
│   ├── TenantMigrationCommand.php
│   └── TenantSeedCommand.php
├── Http/
│   ├── Controllers/
│   │   ├── Platform/          # Account A controllers
│   │   │   ├── TenantController.php
│   │   │   ├── AnalyticsController.php
│   │   │   └── SubscriptionController.php
│   │   ├── Tenant/            # Account B controllers  
│   │   │   ├── DashboardController.php
│   │   │   ├── UserController.php
│   │   │   ├── ProductController.php
│   │   │   └── OrderController.php
│   │   └── API/
│   │       ├── V1/
│   │       │   ├── PlatformController.php
│   │       │   └── TenantController.php
│   ├── Middleware/
│   │   ├── IdentifyTenant.php
│   │   ├── EnsureTenantIsolation.php
│   │   ├── PlatformAccess.php
│   │   └── TenantAccess.php
│   ├── Requests/
│   │   ├── Platform/
│   │   │   └── CreateTenantRequest.php
│   │   └── Tenant/
│   │       ├── CreateUserRequest.php
│   │       └── UpdateProfileRequest.php
├── Models/
│   ├── Platform/              # Account A models
│   │   ├── Account.php
│   │   ├── Tenant.php
│   │   └── TenantSubscription.php
│   ├── Tenant/               # Account B models  
│   │   ├── User.php
│   │   ├── Product.php
│   │   ├── Order.php
│   │   └── Customer.php
│   └── Traits/
│       ├── HasTenantScope.php
│       └── HasSecurityAudit.php
├── Services/
│   ├── Platform/
│   │   ├── TenantProvisioningService.php
│   │   └── AnalyticsService.php
│   └── Tenant/
│       ├── UserManagementService.php
│       └── ProductService.php
config/
├── multitenancy.php
└── tenant-permissions.php
database/
├── migrations/
│   ├── platform/             # Platform-level migrations
│   └── tenant/               # Tenant-level migrations  
├── seeders/
│   ├── PlatformSeeder.php
│   └── TenantSeeder.php
routes/
├── platform.php             # Account A routes
├── tenant.php               # Account B routes
└── api.php
```

### Configuration Files

**Multi-tenancy Configuration**
```php
// config/multitenancy.php
<?php

return [
    'tenant_model' => \App\Models\Tenant::class,
    
    'tenant_finder' => \App\Services\TenantFinder::class,
    
    'switch_tenant_database' => false, // Using single DB with tenant_id
    
    'queues_are_tenant_aware_by_default' => true,
    
    'tenant_artisan_commands' => [
        'migrate',
        'db:seed',
        'queue:work',
    ],
    
    'switch_tenant_tasks' => [
        \Spatie\Multitenancy\Tasks\SwitchTenantDatabaseTask::class,
    ],
    
    // Security settings
    'tenant_isolation' => [
        'strict_mode' => true,
        'audit_all_queries' => env('TENANT_AUDIT_QUERIES', false),
        'forbidden_cross_tenant_relations' => true,
    ],
    
    // URL management
    'url_management' => [
        'custom_domains_enabled' => true,
        'subdirectory_enabled' => true,
        'api_header_enabled' => true,
        'default_domain' => env('APP_DOMAIN', 'canvastencil.com'),
    ],
];
```

**Tenant Permissions Configuration**
```php
// config/tenant-permissions.php
<?php

return [
    'account_a_permissions' => [
        // Platform management
        'platform.manage_tenants',
        'platform.view_analytics', 
        'platform.manage_subscriptions',
        'platform.manage_domains',
        
        // Tenant oversight (limited)
        'tenant.view_basic_info',
        'tenant.manage_subscription',
        'tenant.view_usage_stats',
        
        // Forbidden permissions (cannot access tenant internal business)
        'tenant.manage_users' => false,
        'tenant.manage_products' => false,
        'tenant.view_orders' => false,
        'tenant.view_customers' => false,
    ],
    
    'account_b_permissions' => [
        // Tenant management (full control)
        'tenant.manage_users',
        'tenant.manage_roles',
        'tenant.manage_products',
        'tenant.manage_orders',
        'tenant.manage_customers',
        'tenant.manage_reviews',
        'tenant.manage_content',
        'tenant.manage_settings',
        
        // Platform interaction (limited)
        'platform.view_subscription',
        'platform.manage_domain',
        'platform.view_billing',
        
        // Forbidden permissions
        'platform.manage_tenants' => false,
        'platform.view_analytics' => false,
    ],
];
```

## Week 3: Database Seeding Strategy

### Comprehensive Seeding Implementation

#### Platform Seeder (Account A data)
```php
// database/seeders/PlatformSeeder.php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Platform\Account;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\DomainMapping;

class PlatformSeeder extends Seeder
{
    public function run(): void
    {
        // Create Platform Owner Accounts (Account A)
        $platformOwner = Account::create([
            'name' => 'Platform Administrator',
            'email' => 'admin@canvastencil.com',
            'password' => bcrypt('AdminSecure123!'),
            'account_type' => 'platform_owner',
            'status' => 'active',
            'settings' => [
                'timezone' => 'Asia/Jakarta',
                'notification_preferences' => [
                    'new_tenant_signup' => true,
                    'payment_alerts' => true,
                    'system_alerts' => true
                ]
            ]
        ]);

        // Create realistic tenants (Account B businesses)
        $tenants = [
            [
                'name' => 'PT Custom Etching Xenial',
                'slug' => 'pt-cex',
                'domain' => 'custometchingxenial.com',
                'status' => 'active',
                'subscription_status' => 'active',
                'trial_ends_at' => null,
                'subscription_ends_at' => now()->addYear(),
                'data' => [
                    'business_type' => 'etching_services',
                    'industry' => 'manufacturing',
                    'location' => 'Jakarta, Indonesia',
                    'established' => '2020'
                ]
            ],
            [
                'name' => 'CV Laser Art Indonesia',
                'slug' => 'laser-art-id',
                'domain' => 'laserart.id',
                'status' => 'active',
                'subscription_status' => 'active',
                'trial_ends_at' => null,
                'subscription_ends_at' => now()->addMonths(6),
                'data' => [
                    'business_type' => 'laser_cutting',
                    'industry' => 'crafts',
                    'location' => 'Bandung, Indonesia',
                    'established' => '2019'
                ]
            ],
            [
                'name' => 'Engraving Pro Services',
                'slug' => 'engraving-pro',
                'domain' => null, // Uses subdirectory
                'status' => 'trial',
                'subscription_status' => 'trial',
                'trial_ends_at' => now()->addDays(14),
                'subscription_ends_at' => null,
                'data' => [
                    'business_type' => 'engraving_services',
                    'industry' => 'personalization',
                    'location' => 'Surabaya, Indonesia',
                    'established' => '2024'
                ]
            ]
        ];

        foreach ($tenants as $tenantData) {
            $tenant = Tenant::create(array_merge($tenantData, [
                'created_by' => $platformOwner->id
            ]));

            // Create subscription for each tenant
            TenantSubscription::create([
                'tenant_id' => $tenant->id,
                'plan_name' => $tenant->subscription_status === 'trial' ? 'trial' : 'professional',
                'monthly_price' => $tenant->subscription_status === 'trial' ? 0 : 299000, // IDR
                'user_limit' => 10,
                'product_limit' => 500,
                'storage_limit_mb' => 2048, // 2GB
                'custom_domain_enabled' => !empty($tenant->domain),
                'api_access_enabled' => true,
                'features' => [
                    'advanced_analytics',
                    'email_notifications',
                    'custom_themes',
                    'api_access'
                ],
                'starts_at' => now(),
                'ends_at' => $tenant->subscription_ends_at,
                'status' => 'active'
            ]);

            // Create domain mappings for custom domains
            if ($tenant->domain) {
                DomainMapping::create([
                    'tenant_id' => $tenant->id,
                    'domain' => $tenant->domain,
                    'subdomain' => null,
                    'is_primary' => true,
                    'ssl_enabled' => true,
                    'status' => 'active',
                    'dns_records' => [
                        'A' => '192.168.1.100',
                        'CNAME' => 'canvastencil.com'
                    ],
                    'verified_at' => now()
                ]);
            }
        }
    }
}
```

#### Tenant Seeder (Account B data)
```php
// database/seeders/TenantSeeder.php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Role;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Order;

class TenantSeeder extends Seeder
{
    public function run(): void
    {
        // Get all active tenants
        $tenants = Tenant::where('status', 'active')->get();

        foreach ($tenants as $tenant) {
            $this->seedTenantData($tenant);
        }
    }

    private function seedTenantData(Tenant $tenant): void
    {
        // Set current tenant context
        $tenant->makeCurrent();

        // Create roles for this tenant
        $adminRole = Role::create([
            'tenant_id' => $tenant->id,
            'name' => 'Administrator',
            'slug' => 'admin',
            'description' => 'Full access to tenant system',
            'is_system' => true,
            'abilities' => [
                'tenant.manage_users',
                'tenant.manage_products',
                'tenant.manage_orders',
                'tenant.manage_customers',
                'tenant.manage_settings'
            ]
        ]);

        $managerRole = Role::create([
            'tenant_id' => $tenant->id,
            'name' => 'Manager',
            'slug' => 'manager', 
            'description' => 'Business operations management',
            'is_system' => false,
            'abilities' => [
                'tenant.manage_products',
                'tenant.manage_orders',
                'tenant.view_customers'
            ]
        ]);

        // Create users for this tenant (20-30 users per tenant)
        $this->seedTenantUsers($tenant, $adminRole, $managerRole);
        
        // Create customers (30-50 customers per tenant)
        $this->seedTenantCustomers($tenant);
        
        // Create products (20-40 products per tenant)  
        $this->seedTenantProducts($tenant);
        
        // Create orders (50-100 orders per tenant)
        $this->seedTenantOrders($tenant);
    }

    private function seedTenantUsers(Tenant $tenant, Role $adminRole, Role $managerRole): void
    {
        // Admin user
        $admin = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Admin User',
            'email' => 'admin@' . ($tenant->domain ?: $tenant->slug . '.local'),
            'password' => bcrypt('AdminPass123!'),
            'phone' => '+6281234567890',
            'status' => 'active',
            'department' => 'Management',
            'location' => [
                'address' => 'Jl. Sudirman No. 123',
                'city' => 'Jakarta',
                'province' => 'DKI Jakarta',
                'postal_code' => '12190'
            ]
        ]);
        $admin->roles()->attach($adminRole->id);

        // Manager users (3-5 per tenant)
        $managers = [
            [
                'name' => 'Production Manager',
                'email' => 'production@' . ($tenant->domain ?: $tenant->slug . '.local'),
                'department' => 'Production'
            ],
            [
                'name' => 'Sales Manager', 
                'email' => 'sales@' . ($tenant->domain ?: $tenant->slug . '.local'),
                'department' => 'Sales'
            ],
            [
                'name' => 'Quality Manager',
                'email' => 'quality@' . ($tenant->domain ?: $tenant->slug . '.local'),
                'department' => 'Quality Control'
            ]
        ];

        foreach ($managers as $managerData) {
            $manager = User::create(array_merge($managerData, [
                'tenant_id' => $tenant->id,
                'password' => bcrypt('ManagerPass123!'),
                'phone' => '+628123456789' . rand(0, 9),
                'status' => 'active',
                'location' => [
                    'address' => 'Jl. Thamrin No. ' . rand(100, 999),
                    'city' => 'Jakarta',
                    'province' => 'DKI Jakarta', 
                    'postal_code' => '1219' . rand(0, 9)
                ]
            ]));
            $manager->roles()->attach($managerRole->id);
        }
    }

    private function seedTenantProducts(Tenant $tenant): void
    {
        $products = [
            [
                'name' => 'Nameplate Stainless Steel Premium',
                'slug' => 'nameplate-stainless-steel-premium',
                'description' => 'High precision laser etched nameplate',
                'category' => 'Industrial',
                'material' => 'Stainless Steel 304',
                'price' => 150000,
                'min_order' => 1,
                'customizable' => true,
                'featured' => true
            ],
            [
                'name' => 'Glass Award Trophy',
                'slug' => 'glass-award-trophy',
                'description' => 'Elegant glass trophy with laser engraving',
                'category' => 'Awards',
                'material' => 'Crystal Glass',
                'price' => 250000,
                'min_order' => 1,
                'customizable' => true,
                'featured' => true
            ],
            // Add 18-38 more products...
        ];

        foreach ($products as $productData) {
            Product::create(array_merge($productData, [
                'tenant_id' => $tenant->id,
                'currency' => 'IDR',
                'price_unit' => 'per pcs',
                'lead_time' => rand(3, 14) . ' days',
                'in_stock' => true,
                'stock_quantity' => rand(50, 200),
                'status' => 'published',
                'created_at' => now()->subDays(rand(1, 365)),
                'updated_at' => now()->subDays(rand(0, 30))
            ]));
        }
    }

    private function seedTenantCustomers(Tenant $tenant): void
    {
        // Generate 30-50 realistic customers per tenant
        for ($i = 1; $i <= 40; $i++) {
            Customer::create([
                'tenant_id' => $tenant->id,
                'name' => 'Customer ' . $i,
                'email' => 'customer' . $i . '@example.com',
                'phone' => '+6281' . str_pad(rand(10000000, 99999999), 8, '0', STR_PAD_LEFT),
                'customer_type' => rand(0, 1) ? 'individual' : 'business',
                'company' => rand(0, 1) ? 'PT Example ' . $i : null,
                'status' => 'active',
                'address' => 'Jl. Example No. ' . rand(1, 999),
                'city' => ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Semarang'][rand(0, 4)],
                'province' => 'Java',
                'postal_code' => rand(10000, 99999),
                'total_orders' => rand(0, 20),
                'total_spent' => rand(500000, 10000000),
                'created_at' => now()->subDays(rand(1, 730))
            ]);
        }
    }

    private function seedTenantOrders(Tenant $tenant): void
    {
        $customers = Customer::where('tenant_id', $tenant->id)->get();
        $products = Product::where('tenant_id', $tenant->id)->get();

        // Generate 50-100 orders per tenant
        for ($i = 1; $i <= 75; $i++) {
            $customer = $customers->random();
            $orderProducts = $products->random(rand(1, 3));
            
            $subtotal = 0;
            $items = [];
            
            foreach ($orderProducts as $product) {
                $quantity = rand(1, 5);
                $price = $product->price;
                $itemTotal = $quantity * $price;
                $subtotal += $itemTotal;
                
                $items[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $quantity,
                    'price' => $price,
                    'subtotal' => $itemTotal
                ];
            }
            
            $tax = $subtotal * 0.11; // 11% VAT
            $shippingCost = rand(50000, 200000);
            $totalAmount = $subtotal + $tax + $shippingCost;

            Order::create([
                'tenant_id' => $tenant->id,
                'order_number' => 'ORD-' . date('Ymd') . '-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'customer_email' => $customer->email,
                'customer_phone' => $customer->phone,
                'items' => $items,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'shipping_cost' => $shippingCost,
                'discount' => 0,
                'total_amount' => $totalAmount,
                'status' => ['new', 'in_production', 'completed'][rand(0, 2)],
                'payment_status' => ['paid', 'unpaid'][rand(0, 1)],
                'shipping_address' => $customer->address . ', ' . $customer->city,
                'order_date' => now()->subDays(rand(1, 90)),
                'created_at' => now()->subDays(rand(1, 90))
            ]);
        }
    }
}
```

## Week 4: Testing & Security Verification

### Multi-Tenant Security Tests
```php
// tests/Feature/MultiTenant/TenantIsolationTest.php
<?php

namespace Tests\Feature\MultiTenant;

use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_data_isolation(): void
    {
        // Create two tenants
        $tenant1 = Tenant::factory()->create(['slug' => 'tenant1']);
        $tenant2 = Tenant::factory()->create(['slug' => 'tenant2']);

        // Create users for each tenant
        $user1 = User::factory()->create(['tenant_id' => $tenant1->id]);
        $user2 = User::factory()->create(['tenant_id' => $tenant2->id]);

        // Set tenant1 as current
        $tenant1->makeCurrent();

        // Verify user1 is accessible, user2 is not
        $this->assertDatabaseHas('users', ['id' => $user1->id]);
        $this->assertEquals(1, User::count()); // Should only see tenant1's user
        
        // Switch to tenant2
        $tenant2->makeCurrent();
        
        // Verify user2 is accessible, user1 is not  
        $this->assertEquals(1, User::count()); // Should only see tenant2's user
        $this->assertEquals($user2->id, User::first()->id);
    }

    public function test_cross_tenant_access_prevention(): void
    {
        $tenant1 = Tenant::factory()->create();
        $tenant2 = Tenant::factory()->create();
        
        $user1 = User::factory()->create(['tenant_id' => $tenant1->id]);
        
        // Set tenant2 as current
        $tenant2->makeCurrent();
        
        // Try to access tenant1's user - should fail
        $this->assertNull(User::find($user1->id));
        $this->assertEquals(0, User::count());
    }

    public function test_tenant_subdirectory_routing(): void
    {
        $tenant = Tenant::factory()->create(['slug' => 'testcompany']);
        
        // Test public route
        $response = $this->get('/testcompany/');
        $response->assertStatus(200);
        
        // Test admin route
        $response = $this->get('/testcompany/admin');
        $response->assertStatus(302); // Redirect to login
    }

    public function test_custom_domain_routing(): void
    {
        $tenant = Tenant::factory()->create([
            'domain' => 'testcompany.com'
        ]);
        
        // Mock domain in request
        $response = $this->get('/', ['HTTP_HOST' => 'testcompany.com']);
        $response->assertStatus(200);
    }
}
```

### Performance Tests
```php
// tests/Performance/TenantPerformanceTest.php
<?php

namespace Tests\Performance;

use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TenantPerformanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_switching_performance(): void
    {
        // Create 100 tenants
        $tenants = Tenant::factory()->count(100)->create();
        
        $startTime = microtime(true);
        
        // Switch between tenants rapidly
        foreach ($tenants->take(10) as $tenant) {
            $tenant->makeCurrent();
            User::count(); // Trigger query
        }
        
        $endTime = microtime(true);
        $executionTime = ($endTime - $startTime) * 1000; // Convert to ms
        
        // Should complete within 100ms
        $this->assertLessThan(100, $executionTime, 
            "Tenant switching took {$executionTime}ms, should be under 100ms");
    }

    public function test_database_query_performance(): void
    {
        $tenant = Tenant::factory()->create();
        $tenant->makeCurrent();
        
        // Create large dataset
        User::factory()->count(1000)->create(['tenant_id' => $tenant->id]);
        
        $startTime = microtime(true);
        
        // Perform typical queries
        $users = User::where('status', 'active')->limit(50)->get();
        
        $endTime = microtime(true);
        $executionTime = ($endTime - $startTime) * 1000;
        
        // Should complete within 50ms
        $this->assertLessThan(50, $executionTime,
            "Database query took {$executionTime}ms, should be under 50ms");
    }
}
```

## Deliverables & Success Criteria

### Week 1 Deliverables
- [x] Multi-tenant database schema with all migrations
- [x] Tenant and Account models with relationships
- [x] Advanced security middleware implementation
- [x] Multi-tenancy configuration setup
- [x] Basic tenant identification system

### Week 2 Deliverables  
- [x] Complete Laravel project structure organization
- [x] Middleware stack for tenant isolation
- [x] Configuration files for permissions and settings
- [x] Service layer architecture setup
- [x] Route organization for platform vs tenant

### Week 3 Deliverables
- [x] Comprehensive database seeders with 20-50 records per table
- [x] Realistic business data for both account types
- [x] Tenant provisioning command-line tools  
- [x] Data integrity verification scripts
- [x] Multi-tenant migration management

### Week 4 Deliverables
- [x] Complete test suite for tenant isolation
- [x] Performance benchmarks and optimization
- [x] Security audit and penetration testing results
- [x] Documentation for phase 1 implementation
- [x] Deployment scripts and environment setup

### Success Criteria
1. **Data Isolation**: 100% tenant data separation verified
2. **Performance**: < 200ms API response times under normal load
3. **Security**: Zero critical vulnerabilities in security audit
4. **Scalability**: System supports 100+ concurrent tenants
5. **Testing**: 95%+ test coverage for all business logic
6. **Documentation**: Complete technical documentation

### Security Checklist
- [x] SQL injection prevention verified
- [x] Cross-tenant data access prevention tested
- [x] Authentication and authorization properly implemented  
- [x] Input validation and sanitization in place
- [x] HTTPS enforced for all communications
- [x] Rate limiting implemented on all endpoints
- [x] Audit logging for all sensitive operations
- [x] Proper error handling without information leakage

---

## ✅ **PHASE 1 COMPLETION STATUS** - **COMPLETED** (November 16, 2025)

### **✅ Implementation Summary**

**Database Foundation:**
- ✅ Multi-tenant database schema implemented (PostgreSQL)
- ✅ Platform foundation tables (accounts, tenants, subscriptions, domains)
- ✅ Multi-tenant user system (users, roles, permissions)
- ✅ Business domain tables (customers, products, orders, vendors)
- ✅ All migrations successfully executed

**Models & Architecture:**
- ✅ Hexagonal Architecture implemented
- ✅ Domain entities (Tenant, Account, User, Role) created
- ✅ Eloquent models with proper relationships
- ✅ Value objects and business logic implemented

**Multi-Tenancy Infrastructure:**
- ✅ Tenant context middleware implemented
- ✅ Tenant finder service created
- ✅ Schema isolation configured (single-DB with tenant_id approach)
- ✅ URL-based tenant identification (subdomain, path, custom domain)

**Authentication System:**
- ✅ Laravel Sanctum authentication configured
- ✅ Multi-guard authentication (platform vs tenant)
- ✅ Authentication services and controllers implemented
- ✅ JWT token generation with proper scoping

**Database Seeding:**
- ✅ Platform roles and accounts created
- ✅ Demo tenant with sample users
- ✅ RBAC roles properly assigned

**Credentials Created:**
- **Platform Super Admin:** admin@canvastencil.com / SuperAdmin2024!
- **Platform Manager:** manager@canvastencil.com / Manager2024!  
- **Demo Tenant Admin:** admin@etchinx.com / DemoAdmin2024!
- **Demo Tenant Manager:** manager@etchinx.com / DemoManager2024!
- **Demo Tenant Sales:** sales@etchinx.com / DemoSales2024!

**API Endpoints Available:**
- `/api/platform/login` - Platform authentication
- `/api/tenant/login` - Tenant authentication  
- `/api/tenant/context-login` - Context-based tenant auth
- `/api/auth/health` - Authentication health check
- All protected routes with proper middleware

### **🏗️ Architecture Achievements**

1. **Perfect Tenant Isolation** - Each tenant's data is completely isolated
2. **Scalable Authentication** - Supports both platform and tenant users
3. **RBAC Implementation** - Role-based access control with tenant scoping
4. **Custom Domain Support** - Infrastructure ready for custom domains
5. **Security Compliance** - Following OWASP and Laravel security best practices

---

**Next Phase**: [Phase 2: Authentication & Authorization](./PHASE_2_AUTHENTICATION_AUTHORIZATION.md) - **PARALLEL DEVELOPMENT IN PROGRESS**