# COMMON PITFALLS & SOLUTIONS

**Version:** 1.0  
**Last Updated:** January 16, 2026  

---

## OVERVIEW

Dokumentasi masalah umum yang sering terjadi dalam pengembangan plugin dan solusinya berdasarkan pembelajaran dari implementasi Pages Engine Plugin (Sessions 1-6).

---

## 1. UUID vs INTEGER ID TYPE MISMATCH

### Error Message
```
SQLSTATE[22P02]: Invalid text representation: 7 
ERROR: sintaks masukan tidak valid untuk tipe bigint: "aacc605f-cc2e-466a-8c89-37e411fd9b39"
```

### Problem
```php
// ❌ WRONG: Querying integer column with UUID string
$query->where('tenant_id', $tenantId->getValue());
// $tenantId->getValue() returns UUID string
// But tenant_id column is BIGINT (integer)
```

### Solution
```php
// ✅ CORRECT: Convert UUID to integer ID first
$tenant = DB::table('tenants')
    ->where('uuid', $tenantId->getValue())
    ->first();

if ($tenant) {
    $query->where('tenant_id', $tenant->id);  // Use integer
}
```

### Prevention
- Always convert UUID → integer ID before database queries
- Use repository translation layer consistently
- Review [Multi-Tenant Architecture](./03-MULTI-TENANT.md) document

---

## 2. AUTHORIZATION MODEL MISMATCH

### Error Message
```
Authorization failed: User does not have permission 'pages:content-types:create'
```

### Problem
```sql
-- model_has_roles table has wrong model_type
SELECT * FROM model_has_roles WHERE model_id = 1;

model_type: App\Models\User
-- But authentication uses: App\Infrastructure\Persistence\Eloquent\UserEloquentModel
-- Spatie checks: model_type === get_class($user)
-- Result: MISMATCH → No roles found
```

### Solution

#### Step 1: Configure Correct Model
```php
// config/auth.php
'providers' => [
    'users' => [
        'driver' => 'eloquent',
        'model' => App\Infrastructure\Persistence\Eloquent\UserEloquentModel::class,
    ],
],
```

#### Step 2: Add Required Traits
```php
use Spatie\Permission\Traits\HasRoles;

class UserEloquentModel extends Authenticatable
{
    use HasRoles;  // ✅ REQUIRED
    
    protected $guard_name = 'api';  // ✅ REQUIRED
    
    public function getPermissionTeamId()
    {
        return $this->tenant_id;  // ✅ REQUIRED
    }
}
```

#### Step 3: Fix Existing Data
```php
DB::table('model_has_roles')
    ->where('model_type', 'App\\Models\\User')
    ->update(['model_type' => 'App\\Infrastructure\\Persistence\\Eloquent\\UserEloquentModel']);

DB::table('model_has_permissions')
    ->where('model_type', 'App\\Models\\User')
    ->update(['model_type' => 'App\\Infrastructure\\Persistence\\Eloquent\\UserEloquentModel']);
```

### Prevention
- Always check `config/auth.php` configuration
- Ensure User model has `HasRoles` trait
- Verify `model_type` in database matches authenticated user class
- Review [Authorization](./04-AUTHORIZATION.md) document

---

## 3. CONTROLLER COMMAND PARAMETER ORDER MISMATCH

### Error Message
```
TypeError: CreateContentTypeCommand::__construct(): Argument #X must be of type string, Uuid given
```

### Problem
```php
// ❌ WRONG: Parameters in wrong order
$command = new CreateContentTypeCommand(
    new Uuid(auth()->user()->tenant->uuid),  // tenantId (should be first)
    $request->input('name'),                 // name (should be second)
    $request->input('slug'),                 // slug (should be third)
    $request->input('scope', 'tenant'),      // scope (should be fourth)
    // ...
);

// But constructor signature is:
public function __construct(
    public readonly string $name,            // First parameter
    public readonly string $slug,            // Second parameter
    public readonly Uuid $tenantId,          // Third parameter
    public readonly string $scope,           // Fourth parameter
    // ...
) {}
```

### Solution
```php
// ✅ CORRECT: Match constructor signature order
$command = new CreateContentTypeCommand(
    tenantId: new Uuid(auth()->user()->tenant->uuid),  // Named argument
    name: $request->input('name'),
    slug: $request->input('slug'),
    scope: $request->input('scope', 'tenant'),
    defaultUrlPattern: $request->input('default_url_pattern'),
    description: $request->input('description'),
    icon: $request->input('icon'),
    isCommentable: $request->boolean('is_commentable', false),
    isCategorizable: $request->boolean('is_categorizable', true),
    isTaggable: $request->boolean('is_taggable', true),
    isRevisioned: $request->boolean('is_revisioned', true),
    metadata: $request->input('metadata', [])
);
```

### Prevention
- Always use named arguments in PHP 8+
- IDE will show parameter hints
- Run tests after controller changes

---

## 4. COLLECTION vs ARRAY TYPE ERRORS

### Error Message
```
Argument #1 ($items) must be of type array, Illuminate\Support\Collection given
```

### Problem
```php
// ❌ WRONG: Returning Collection instead of array
public function findByTenant(Uuid $tenantId): array
{
    $eloquentModels = $this->model->where('tenant_id', $tenant->id)->get();
    
    return $eloquentModels->map(fn($model) => $this->mapToEntity($model));
    // Returns Collection, not array
}
```

### Solution
```php
// ✅ CORRECT: Convert Collection to array
public function findByTenant(Uuid $tenantId): array
{
    $eloquentModels = $this->model->where('tenant_id', $tenant->id)->get();
    
    return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    // Explicitly convert to array
}
```

### Prevention
- Always call `->toArray()` on Collections when returning array type
- Use strict type declarations
- Enable PHPStan/Psalm static analysis

---

## 5. MISSING TENANT CONTEXT IN MIDDLEWARE

### Error Message
```
Authorization failed: Permission check outside tenant context
```

### Problem
```php
// Middleware not setting tenant context
// User has permissions but Spatie can't check them without team_id
```

### Solution
```php
// app/Http/Middleware/SetPermissionsTeamId.php
public function handle(Request $request, Closure $next)
{
    $user = Auth::user();
    
    if ($user && $user->tenant_id) {
        // ✅ Set tenant context for Spatie
        setPermissionsTeamId($user->tenant_id);
    }
    
    return $next($request);
}

// Register in Kernel.php
protected $middlewareGroups = [
    'api' => [
        // ...
        \App\Http\Middleware\SetPermissionsTeamId::class,
    ],
];
```

### Prevention
- Always register middleware in Kernel.php
- Test authorization with different tenant users
- Review [Authorization](./04-AUTHORIZATION.md) document

---

## 6. PERMISSION CACHE NOT CLEARED

### Error Message
```
New permissions not recognized after seeding
Roles still have old permissions
```

### Problem
```php
// Spatie caches permissions for 24 hours
// New permissions in seeder not visible
```

### Solution
```php
// In seeder
public function run(): void
{
    // ✅ Clear cache BEFORE seeding
    app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    
    // Create permissions...
}

// Artisan command
php artisan permission:cache-reset

// In tests
protected function setUp(): void
{
    parent::setUp();
    
    app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
}
```

### Prevention
- Always clear cache in seeders
- Clear cache in test setup
- Clear cache after permission changes

---

## 7. FORGETTING NULL TENANT_ID CHECKS

### Error Message
```
Trying to get property 'id' of null
```

### Problem
```php
// ❌ WRONG: Not checking if tenant exists
public function findByTenant(Uuid $tenantId): array
{
    $tenant = DB::table('tenants')->where('uuid', $tenantId->getValue())->first();
    
    return $this->model->where('tenant_id', $tenant->id)->get();
    // If tenant not found, $tenant is null, trying to access $tenant->id causes error
}
```

### Solution
```php
// ✅ CORRECT: Check null before accessing properties
public function findByTenant(Uuid $tenantId): array
{
    $tenant = DB::table('tenants')->where('uuid', $tenantId->getValue())->first();
    
    if (!$tenant) {
        return [];  // Return empty array if tenant not found
    }
    
    return $this->model
        ->where('tenant_id', $tenant->id)
        ->get()
        ->map(fn($model) => $this->mapToEntity($model))
        ->toArray();
}
```

### Prevention
- Always check null after database queries
- Use null coalescing operator: `$tenant->id ?? null`
- Enable strict types and static analysis

---

## 8. INCORRECT FOREIGN KEY RELATIONSHIPS

### Error Message
```
SQLSTATE[23503]: Foreign key violation
```

### Problem
```sql
-- ❌ WRONG: Foreign key pointing to UUID column
FOREIGN KEY (tenant_id) REFERENCES tenants(uuid)

-- tenant_id is BIGINT, but referencing UUID column
```

### Solution
```sql
-- ✅ CORRECT: Foreign key pointing to integer ID column
FOREIGN KEY (tenant_id) REFERENCES tenants(id)
```

### Prevention
- Always reference integer `id` column in foreign keys
- Use `references('id')` not `references('uuid')`
- Review migrations carefully

---

## 9. EXPOSING INTEGER IDs IN API RESPONSES

### Error Message
```
Security Audit: Integer IDs exposed in API
```

### Problem
```php
// ❌ WRONG: Returning integer ID in API response
class ProductResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,  // Integer ID exposed
            'uuid' => $this->uuid,
            'name' => $this->name,
        ];
    }
}
```

### Solution
```php
// ✅ CORRECT: Only expose UUID
class ProductResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'uuid' => $this->uuid,  // Only UUID exposed
            'name' => $this->name,
            // 'id' field completely removed
        ];
    }
}
```

### Prevention
- Never include `id` field in API resources
- Only use `uuid` for public identification
- Code review checklist for UUID-only exposure

---

## 10. MISSING INDEXES ON UUID COLUMNS

### Error Message
```
Slow query warning: Sequential scan on UUID column
```

### Problem
```sql
-- Missing index on UUID column
SELECT * FROM content_types WHERE uuid = 'xxx-xxx-xxx';
-- Sequential scan → Slow performance
```

### Solution
```php
// In migration
Schema::create('content_types', function (Blueprint $table) {
    $table->id();
    $table->uuid('uuid')->unique();
    $table->unsignedBigInteger('tenant_id');
    
    // ✅ MANDATORY indexes
    $table->index('uuid');        // For UUID lookups
    $table->index('tenant_id');   // For tenant filtering
    $table->index('created_at');  // For sorting/pagination
});
```

### Prevention
- Always index UUID columns
- Always index tenant_id columns
- Always index frequently queried columns

---

## 11. INCORRECT DATETIME HANDLING

### Error Message
```
DateTime::__construct(): Failed to parse time string
```

### Problem
```php
// ❌ WRONG: Direct string assignment
$entity = new ContentType(
    createdAt: $model->created_at,  // This is a Carbon instance
    // Constructor expects DateTime
);
```

### Solution
```php
// ✅ CORRECT: Convert to DateTime
$entity = new ContentType(
    createdAt: new DateTime($model->created_at->format('Y-m-d H:i:s')),
    updatedAt: new DateTime($model->updated_at->format('Y-m-d H:i:s')),
    deletedAt: $model->deleted_at ? new DateTime($model->deleted_at->format('Y-m-d H:i:s')) : null
);
```

### Prevention
- Always convert Carbon to DateTime for domain entities
- Use proper format strings
- Handle null datetime values

---

## 12. NOT HANDLING TENANT SCOPE IN FILTERS

### Error Message
```
User can see other tenant's data
```

### Problem
```php
// ❌ WRONG: Filter doesn't check tenant
public function findWithFilters(array $filters): array
{
    $query = $this->model->newQuery();
    
    if (isset($filters['status'])) {
        $query->where('status', $filters['status']);
    }
    
    return $query->get()->toArray();
    // Missing tenant filtering → Cross-tenant data leak
}
```

### Solution
```php
// ✅ CORRECT: Always scope by tenant
public function findWithFilters(array $filters): array
{
    $query = $this->model->newQuery();
    
    // ✅ MANDATORY: Tenant scoping
    if (isset($filters['tenant_id'])) {
        $tenant = DB::table('tenants')
            ->where('uuid', $filters['tenant_id'])
            ->first();
        
        if ($tenant) {
            $query->where('tenant_id', $tenant->id);
        }
    }
    
    if (isset($filters['status'])) {
        $query->where('status', $filters['status']);
    }
    
    return $query->get()
        ->map(fn($model) => $this->mapToEntity($model))
        ->toArray();
}
```

### Prevention
- Always include tenant filtering in queries
- Use global scopes for tenant isolation
- Test cross-tenant data access

---

## TROUBLESHOOTING CHECKLIST

When encountering errors, check:

### UUID/ID Issues
- [ ] Converting UUID → integer ID before queries?
- [ ] Converting integer ID → UUID when reading?
- [ ] Handling null tenant scenarios?
- [ ] Using integer ID for foreign keys?

### Authorization Issues
- [ ] User model has `HasRoles` trait?
- [ ] `$guard_name = 'api'` set on user model?
- [ ] `getPermissionTeamId()` method implemented?
- [ ] `model_type` in database matches authenticated model?
- [ ] Middleware setting `setPermissionsTeamId()`?
- [ ] Permission cache cleared?

### Type Issues
- [ ] Converting Collections to arrays?
- [ ] Using correct parameter order?
- [ ] DateTime conversion from Carbon?
- [ ] Proper null handling?

### Security Issues
- [ ] Only exposing UUIDs in API?
- [ ] Tenant scoping in all queries?
- [ ] Permission checks in controllers?
- [ ] Cross-tenant access prevented?

---

## SUMMARY

### Most Critical Issues

1. **UUID/ID Type Mismatch** (90% of initial errors)
   - Always convert UUID → integer ID before database queries

2. **Authorization Model Mismatch** (Major blocker)
   - Ensure `model_type` matches authenticated user class

3. **Missing Tenant Context** (Security risk)
   - Always call `setPermissionsTeamId()` in middleware

4. **Collection/Array Type Confusion** (Easy to overlook)
   - Always call `->toArray()` on Collections

5. **Permission Cache Not Cleared** (Confusing errors)
   - Clear cache in seeders and tests

---

**Next:** [Best Practices](./07-BEST-PRACTICES.md)
