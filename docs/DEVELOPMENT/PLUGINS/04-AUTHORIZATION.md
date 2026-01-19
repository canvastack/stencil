# AUTHORIZATION & PERMISSIONS - Multi-Tenant RBAC

**Version:** 1.0  
**Last Updated:** January 16, 2026  
**Priority:** 🔴 **HIGH** - Required untuk semua plugin functionality

---

## OVERVIEW

Dokumentasi ini menjelaskan konfigurasi **Spatie Laravel Permission** untuk multi-tenant RBAC (Role-Based Access Control) dalam plugin development. Kesalahan konfigurasi akan menyebabkan authorization failures.

---

## SPATIE PERMISSION CONFIGURATION

### Global Configuration (config/permission.php)

```php
return [
    'models' => [
        'permission' => Spatie\Permission\Models\Permission::class,
        'role' => Spatie\Permission\Models\Role::class,
    ],
    
    'table_names' => [
        'roles' => 'roles',
        'permissions' => 'permissions',
        'model_has_permissions' => 'model_has_permissions',
        'model_has_roles' => 'model_has_roles',  // ⚠️ CRITICAL TABLE
        'role_has_permissions' => 'role_has_permissions',
    ],
    
    'column_names' => [
        'role_pivot_key' => null,
        'permission_pivot_key' => null,
        'model_morph_key' => 'model_id',
        'team_foreign_key' => 'tenant_id',  // ✅ Multi-tenant scoping
    ],
    
    'teams' => true,  // ✅ MUST be enabled
    
    'guard_name' => 'api',  // ⚠️ CRITICAL for API authentication
];
```

---

## USER MODEL CONFIGURATION

### The Problem: Model Mismatch Error

```
Authorization failed: User does not have permission 'pages:content-types:create'

// Even though:
// - Permission exists in database
// - User has role assigned
// - Role has permission assigned
```

**Root Cause:** `model_has_roles` table has wrong `model_type` value.

### Database State Example

```sql
-- ❌ WRONG: model_type points to wrong model
SELECT * FROM model_has_roles WHERE model_id = 1;
┌──────────┬────────────┬───────────┬────────────────────────────────────┐
│ role_id  │ model_type │ model_id  │ tenant_id                          │
├──────────┼────────────┼───────────┼────────────────────────────────────┤
│ 1        │ App\Models\User       │ 1 │ aacc605f-cc2e-466a-8c89-37e411fd... │
└──────────┴────────────┴───────────┴────────────────────────────────────┘

// But authentication uses different model:
// App\Infrastructure\Persistence\Eloquent\UserEloquentModel

// Spatie checks: model_type === get_class($user)
// Result: App\Models\User !== App\Infrastructure\Persistence\Eloquent\UserEloquentModel
// Conclusion: No roles found, authorization fails
```

### Solution: Configure Correct Model

#### config/auth.php

```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],
    'api' => [
        'driver' => 'sanctum',
        'provider' => 'users',  // ⚠️ MUST point to correct provider
    ],
],

'providers' => [
    'users' => [
        'driver' => 'eloquent',
        'model' => App\Infrastructure\Persistence\Eloquent\UserEloquentModel::class,  // ✅ Correct model
    ],
],
```

#### User Model Implementation

```php
namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;  // ✅ REQUIRED

class UserEloquentModel extends Authenticatable
{
    use HasApiTokens, Notifiable, HasFactory, HasRoles;  // ✅ HasRoles trait
    
    protected $table = 'users';
    protected $guard_name = 'api';  // ✅ CRITICAL: Must match config
    
    protected $fillable = [
        'uuid',
        'tenant_id',
        'name',
        'email',
        'password',
        // ...
    ];
    
    // ✅ REQUIRED: Multi-tenant team scoping
    public function getPermissionTeamId()
    {
        return $this->tenant_id;  // Integer tenant_id
    }
    
    // Relationship to tenant
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(TenantEloquentModel::class, 'tenant_id');
    }
}
```

### Fix Existing Data

```php
// Migration or seeder to fix model_type
DB::table('model_has_roles')
    ->where('model_type', 'App\\Models\\User')
    ->update([
        'model_type' => 'App\\Infrastructure\\Persistence\\Eloquent\\UserEloquentModel'
    ]);

DB::table('model_has_permissions')
    ->where('model_type', 'App\\Models\\User')
    ->update([
        'model_type' => 'App\\Infrastructure\\Persistence\\Eloquent\\UserEloquentModel'
    ]);
```

---

## PERMISSION SEEDING

### Plugin Permission Seeder Structure

```php
namespace Plugins\PagesEngine\Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\DB;

class PagesEnginePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // ✅ ALWAYS reset cache before seeding
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
        
        $guardName = 'api';  // ✅ Must match config
        
        // Define permissions
        $permissions = [
            // Content Types Management
            'pages:content-types:view',
            'pages:content-types:create',
            'pages:content-types:update',
            'pages:content-types:delete',
            
            // Categories Management
            'pages:categories:view',
            'pages:categories:create',
            'pages:categories:update',
            'pages:categories:delete',
            
            // Content Management
            'pages:content:view',
            'pages:content:create',
            'pages:content:update',
            'pages:content:delete',
            'pages:content:publish',
            
            // Comments Management
            'pages:comments:view',
            'pages:comments:moderate',
            'pages:comments:delete',
        ];
        
        // Create permissions
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                [
                    'name' => $permission,
                    'guard_name' => $guardName,
                ],
                [
                    'name' => $permission,
                    'guard_name' => $guardName,
                ]
            );
        }
        
        // Create default role for tenant admin
        $this->createDefaultRoles($permissions, $guardName);
    }
    
    private function createDefaultRoles(array $permissions, string $guardName): void
    {
        // Get all tenants
        $tenants = DB::table('tenants')->get();
        
        foreach ($tenants as $tenant) {
            // Create tenant-specific admin role
            $role = Role::firstOrCreate(
                [
                    'name' => 'tenant-admin',
                    'guard_name' => $guardName,
                    'tenant_id' => $tenant->id,  // ✅ Tenant scoping
                ],
                [
                    'name' => 'tenant-admin',
                    'guard_name' => $guardName,
                    'tenant_id' => $tenant->id,
                ]
            );
            
            // Assign all permissions to role
            $role->syncPermissions($permissions);
            
            // Assign role to tenant admin user
            $adminUser = DB::table('users')
                ->where('tenant_id', $tenant->id)
                ->where('email', 'like', '%admin%')
                ->first();
            
            if ($adminUser) {
                $user = \App\Infrastructure\Persistence\Eloquent\UserEloquentModel::find($adminUser->id);
                
                if ($user && !$user->hasRole('tenant-admin', $guardName)) {
                    // ✅ Set team context before assigning role
                    $user->setPermissionsTeamId($tenant->id);
                    $user->assignRole($role);
                }
            }
        }
    }
}
```

### Register Seeder in Plugin Service Provider

```php
namespace Plugins\PagesEngine\Providers;

use Illuminate\Support\ServiceProvider;
use Plugins\PagesEngine\Database\Seeders\PagesEnginePermissionSeeder;

class PluginServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Load migrations
        $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
        
        // Register seeders
        $this->publishes([
            __DIR__ . '/../Database/Seeders/PagesEnginePermissionSeeder.php' => database_path('seeders/PagesEnginePermissionSeeder.php'),
        ], 'pages-engine-seeders');
        
        // Auto-run seeder in development
        if ($this->app->environment('local')) {
            $this->app->afterResolving('migrator', function () {
                $this->app->make('seeder')->call(PagesEnginePermissionSeeder::class);
            });
        }
    }
}
```

---

## MIDDLEWARE CONFIGURATION

### Tenant Context Middleware

```php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SetPermissionsTeamId
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();
        
        if ($user && $user->tenant_id) {
            // ✅ Set tenant context for permission checks
            setPermissionsTeamId($user->tenant_id);
        }
        
        return $next($request);
    }
}
```

### Register Middleware

```php
// app/Http/Kernel.php
protected $middlewareGroups = [
    'api' => [
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
        \App\Http\Middleware\SetPermissionsTeamId::class,  // ✅ Add this
    ],
];
```

---

## CONTROLLER AUTHORIZATION

### Using authorize() Helper

```php
namespace Plugins\PagesEngine\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContentTypeController extends Controller
{
    public function index(): JsonResponse
    {
        // ✅ Check permission
        $this->authorize('pages:content-types:view');
        
        $contentTypes = $this->listUseCase->execute(
            tenantId: new Uuid(auth()->user()->tenant->uuid)
        );
        
        return response()->json([
            'success' => true,
            'data' => ContentTypeResource::collection($contentTypes),
        ]);
    }
    
    public function store(CreateContentTypeRequest $request): JsonResponse
    {
        // ✅ Check permission
        $this->authorize('pages:content-types:create');
        
        $command = new CreateContentTypeCommand(
            tenantId: new Uuid(auth()->user()->tenant->uuid),
            name: $request->input('name'),
            slug: $request->input('slug'),
            // ...
        );
        
        $contentType = $this->createUseCase->execute($command);
        
        return response()->json([
            'success' => true,
            'data' => new ContentTypeResource($contentType),
            'message' => 'Content type created successfully',
        ], 201);
    }
    
    public function destroy(string $uuid): JsonResponse
    {
        // ✅ Check permission
        $this->authorize('pages:content-types:delete');
        
        $this->deleteUseCase->execute($uuid, auth()->user()->tenant->uuid);
        
        return response()->json([
            'success' => true,
            'message' => 'Content type deleted successfully',
        ]);
    }
}
```

### Using Gate Checks

```php
use Illuminate\Support\Facades\Gate;

// In controller
if (Gate::denies('pages:content-types:create')) {
    abort(403, 'Unauthorized action');
}

// In blade/component
@can('pages:content-types:create')
    <button>Create Content Type</button>
@endcan
```

---

## PERMISSION NAMING CONVENTION

### Format: `plugin:resource:action`

```
pages:content-types:view
pages:content-types:create
pages:content-types:update
pages:content-types:delete

pages:categories:view
pages:categories:create
pages:categories:update
pages:categories:delete

pages:content:view
pages:content:create
pages:content:update
pages:content:delete
pages:content:publish
```

### Granular Permissions

```php
// Separate view permissions
'pages:content:view-own'      // View only own content
'pages:content:view-all'      // View all tenant content

// Separate update permissions
'pages:content:update-own'    // Update only own content
'pages:content:update-all'    // Update all tenant content

// Workflow permissions
'pages:content:submit'        // Submit for review
'pages:content:approve'       // Approve content
'pages:content:reject'        // Reject content
'pages:content:publish'       // Publish approved content
```

---

## TESTING AUTHORIZATION

### Feature Test Example

```php
namespace Tests\Feature\Plugins\PagesEngine;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ContentTypeAuthorizationTest extends TestCase
{
    use RefreshDatabase;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        // Reset permission cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }
    
    /** @test */
    public function unauthorized_user_cannot_create_content_type(): void
    {
        $user = UserEloquentModel::factory()->create();
        Sanctum::actingAs($user, ['*']);
        
        $response = $this->postJson('/api/cms/admin/content-types', [
            'name' => 'Blog Post',
            'slug' => 'blog-post',
        ]);
        
        $response->assertStatus(403);
    }
    
    /** @test */
    public function authorized_user_can_create_content_type(): void
    {
        $user = UserEloquentModel::factory()->create();
        
        // Create permission
        $permission = Permission::create([
            'name' => 'pages:content-types:create',
            'guard_name' => 'api',
        ]);
        
        // Create role
        $role = Role::create([
            'name' => 'content-manager',
            'guard_name' => 'api',
            'tenant_id' => $user->tenant_id,
        ]);
        
        $role->givePermissionTo($permission);
        
        // Assign role to user
        $user->setPermissionsTeamId($user->tenant_id);
        $user->assignRole($role);
        
        Sanctum::actingAs($user, ['*']);
        
        $response = $this->postJson('/api/cms/admin/content-types', [
            'name' => 'Blog Post',
            'slug' => 'blog-post',
            'default_url_pattern' => '/blog/{slug}',
        ]);
        
        $response->assertStatus(201);
    }
    
    /** @test */
    public function user_cannot_access_other_tenant_resources(): void
    {
        $tenant1 = Tenant::factory()->create();
        $tenant2 = Tenant::factory()->create();
        
        $user1 = UserEloquentModel::factory()->create(['tenant_id' => $tenant1->id]);
        $user2 = UserEloquentModel::factory()->create(['tenant_id' => $tenant2->id]);
        
        // Create content type for tenant1
        $contentType = ContentType::factory()->create(['tenant_id' => $tenant1->id]);
        
        // User2 tries to access tenant1's content type
        Sanctum::actingAs($user2, ['*']);
        
        $response = $this->getJson("/api/cms/admin/content-types/{$contentType->uuid}");
        
        $response->assertStatus(404);  // Should not find it
    }
}
```

---

## TROUBLESHOOTING

### Issue 1: Permission check always fails

**Symptoms:**
```
Authorization failed: User does not have permission 'pages:content-types:create'
```

**Checklist:**
- [ ] User has `HasRoles` trait
- [ ] User model has `protected $guard_name = 'api'`
- [ ] User model has `getPermissionTeamId()` method
- [ ] `config/auth.php` points to correct user model
- [ ] `model_has_roles.model_type` matches authenticated user class
- [ ] Permission exists with `guard_name = 'api'`
- [ ] Role has permission assigned
- [ ] User has role assigned
- [ ] `setPermissionsTeamId()` called in middleware
- [ ] Permission cache cleared after seeding

### Issue 2: Cross-tenant permission leak

**Symptoms:**
```
User from Tenant A can access Tenant B's resources
```

**Solution:**
```php
// Ensure tenant_id is set on role
$role = Role::create([
    'name' => 'admin',
    'guard_name' => 'api',
    'tenant_id' => $tenant->id,  // ✅ MUST be set
]);

// Ensure team context is set
$user->setPermissionsTeamId($user->tenant_id);
setPermissionsTeamId($user->tenant_id);  // Global helper
```

### Issue 3: Permission cache not clearing

**Symptoms:**
```
New permissions not recognized after seeding
```

**Solution:**
```php
// In seeder
app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

// Artisan command
php artisan permission:cache-reset

// In test
$this->beforeApplicationDestroyed(function () {
    app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
});
```

---

## SUMMARY

### Critical Checklist

#### User Model Configuration
- [ ] Use `HasRoles` trait
- [ ] Set `protected $guard_name = 'api'`
- [ ] Implement `getPermissionTeamId()` returning `tenant_id`
- [ ] Configure in `config/auth.php` providers

#### Permission Configuration
- [ ] Set `teams => true` in config
- [ ] Set `team_foreign_key => 'tenant_id'`
- [ ] Use `guard_name => 'api'` for all permissions/roles
- [ ] Create permissions in seeder

#### Role Assignment
- [ ] Create tenant-scoped roles (`tenant_id` set)
- [ ] Assign permissions to roles
- [ ] Set team context: `setPermissionsTeamId($tenant_id)`
- [ ] Assign roles to users

#### Middleware
- [ ] Register `SetPermissionsTeamId` middleware
- [ ] Call `setPermissionsTeamId()` on each request

#### Controller Authorization
- [ ] Use `$this->authorize('permission')` in controllers
- [ ] Check permissions before operations
- [ ] Return 403 for unauthorized actions

---

**Next:** [Repository Pattern Implementation](./05-REPOSITORY-PATTERN.md)
