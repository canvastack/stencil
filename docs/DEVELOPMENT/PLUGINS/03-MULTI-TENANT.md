# MULTI-TENANT ARCHITECTURE - UUID/ID CONVERSION PATTERN

**Version:** 1.0  
**Last Updated:** January 16, 2026  
**Priority:** 🚨 **CRITICAL** - Paling sering menyebabkan error

---

## OVERVIEW

Dokumentasi ini menjelaskan **masalah paling kritis** dalam pengembangan plugin: **UUID vs Integer ID mismatch**. Masalah ini menyebabkan error PostgreSQL type mismatch yang sering terjadi dan WAJIB dipahami dengan benar.

---

## THE PROBLEM: UUID vs INTEGER ID MISMATCH

### Database Design Reality

```sql
-- Tenants table structure
CREATE TABLE tenants (
    id BIGSERIAL PRIMARY KEY,           -- Integer for foreign keys
    uuid UUID NOT NULL UNIQUE,          -- UUID for public API
    name VARCHAR(255),
    -- ...
);

-- Plugin tables structure
CREATE TABLE canplug_pagen_content_types (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE,
    tenant_id BIGINT,                   -- ⚠️ INTEGER foreign key
    -- ...
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)  -- References INTEGER id
);
```

### Domain Layer Reality

```php
// Domain entity uses UUID value objects
namespace Plugins\PagesEngine\Domain\Entities;

class ContentType {
    public function __construct(
        private Uuid $id,           // UUID for entity identification
        private ?Uuid $tenantId,    // ⚠️ UUID for tenant reference
        private string $name,
        // ...
    ) {}
    
    public function getTenantId(): ?Uuid {
        return $this->tenantId;  // Returns UUID value object
    }
}
```

### The Conflict

```php
// ❌ WRONG: This causes PostgreSQL error
$query->where('tenant_id', $tenantId->getValue());
// Error: SQLSTATE[22P02]: Invalid text representation: 
// ERROR: sintaks masukan tidak valid untuk tipe bigint: "aacc605f-cc2e-466a-8c89-37e411fd9b39"

// Why? Because:
// - Database column tenant_id is BIGINT (integer)
// - $tenantId->getValue() returns UUID string
// - PostgreSQL cannot implicitly convert UUID string to integer
```

---

## THE SOLUTION: UUID↔ID TRANSLATION LAYER

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────┐
│                   DOMAIN LAYER                          │
│  Uses UUID value objects for all entity references      │
│  Example: tenantId: Uuid("aacc605f-cc2e...")            │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Repository acts as TRANSLATION LAYER
                     │
┌────────────────────┴────────────────────────────────────┐
│              INFRASTRUCTURE LAYER                       │
│  Uses INTEGER IDs for database foreign keys             │
│  Example: tenant_id: 1                                  │
└─────────────────────────────────────────────────────────┘
```

### Translation Patterns

#### Pattern 1: Query (UUID → Integer ID)

```php
// When querying database with tenant UUID
public function findByTenant(Uuid $tenantId): array
{
    // Step 1: Convert UUID to integer ID
    $tenant = DB::table('tenants')
        ->where('uuid', $tenantId->getValue())
        ->first();
    
    if (!$tenant) {
        return [];  // Tenant not found
    }
    
    // Step 2: Query using integer ID
    $query = $this->model->where('tenant_id', $tenant->id);
    
    $eloquentModels = $query->get();
    
    // Step 3: Map to domain entities (will convert back to UUID)
    return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
}
```

#### Pattern 2: Read (Integer ID → UUID)

```php
// When reading from database to domain entity
private function mapToEntity(ContentTypeEloquentModel $model): ContentType
{
    // Step 1: Convert integer tenant_id to UUID
    $tenantUuid = null;
    if ($model->tenant_id) {
        $tenant = DB::table('tenants')
            ->where('id', $model->tenant_id)
            ->first();
        $tenantUuid = $tenant ? new Uuid($tenant->uuid) : null;
    }
    
    // Step 2: Create domain entity with UUID
    return new ContentType(
        id: new Uuid($model->uuid),
        tenantId: $tenantUuid,  // ✅ UUID value object
        name: $model->name,
        // ...
    );
}
```

#### Pattern 3: Write (UUID → Integer ID)

```php
// When saving domain entity to database
private function mapToArray(ContentType $contentType): array
{
    // Step 1: Convert UUID to integer ID
    $tenantId = null;
    if ($contentType->getTenantId()) {
        $tenant = DB::table('tenants')
            ->where('uuid', $contentType->getTenantId()->getValue())
            ->first();
        $tenantId = $tenant ? $tenant->id : null;
    }
    
    // Step 2: Return array with integer ID
    return [
        'uuid' => $contentType->getId()->getValue(),
        'tenant_id' => $tenantId,  // ✅ Integer for database
        'name' => $contentType->getName(),
        // ...
    ];
}
```

---

## COMPLETE REPOSITORY EXAMPLE

### Repository Interface (Domain Layer)

```php
namespace Plugins\PagesEngine\Domain\Repositories;

use Plugins\PagesEngine\Domain\Entities\ContentType;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

interface ContentTypeRepositoryInterface
{
    public function findById(Uuid $id): ?ContentType;
    
    public function findByTenant(Uuid $tenantId): array;
    
    public function save(ContentType $contentType): void;
    
    public function slugExists(ContentTypeSlug $slug, ?Uuid $tenantId = null): bool;
}
```

### Repository Implementation (Infrastructure Layer)

```php
namespace Plugins\PagesEngine\Infrastructure\Persistence\Repositories;

use Plugins\PagesEngine\Domain\Entities\ContentType;
use Plugins\PagesEngine\Domain\Repositories\ContentTypeRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentTypeEloquentModel;
use Illuminate\Support\Facades\DB;

final class ContentTypeEloquentRepository implements ContentTypeRepositoryInterface
{
    public function __construct(
        private readonly ContentTypeEloquentModel $model
    ) {}
    
    public function findById(Uuid $id): ?ContentType
    {
        $eloquentModel = $this->model->where('uuid', $id->getValue())->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }
    
    public function findByTenant(Uuid $tenantId): array
    {
        // ✅ CORRECT: Convert UUID to integer ID
        $tenant = DB::table('tenants')
            ->where('uuid', $tenantId->getValue())
            ->first();
        
        if (!$tenant) {
            return [];
        }
        
        $eloquentModels = $this->model
            ->where('tenant_id', $tenant->id)  // Use integer ID
            ->where('scope', 'tenant')
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }
    
    public function save(ContentType $contentType): void
    {
        $eloquentModel = $this->model->where('uuid', $contentType->getId()->getValue())->first();
        
        if ($eloquentModel) {
            $eloquentModel->update($this->mapToArray($contentType));
        } else {
            $this->model->create($this->mapToArray($contentType));
        }
    }
    
    public function slugExists(ContentTypeSlug $slug, ?Uuid $tenantId = null): bool
    {
        $query = $this->model->where('slug', $slug->getValue());
        
        if ($tenantId) {
            // ✅ CORRECT: Convert UUID to integer ID
            $tenant = DB::table('tenants')
                ->where('uuid', $tenantId->getValue())
                ->first();
            
            if ($tenant) {
                $query->where('tenant_id', $tenant->id);
            }
        }
        
        return $query->exists();
    }
    
    // ============================================
    // PRIVATE MAPPING METHODS (TRANSLATION LAYER)
    // ============================================
    
    private function mapToEntity(ContentTypeEloquentModel $model): ContentType
    {
        // Convert integer ID to UUID
        $tenantUuid = null;
        if ($model->tenant_id) {
            $tenant = DB::table('tenants')
                ->where('id', $model->tenant_id)
                ->first();
            $tenantUuid = $tenant ? new Uuid($tenant->uuid) : null;
        }
        
        return new ContentType(
            id: new Uuid($model->uuid),
            tenantId: $tenantUuid,  // ✅ UUID for domain
            name: $model->name,
            slug: new ContentTypeSlug($model->slug),
            // ...
        );
    }
    
    private function mapToArray(ContentType $contentType): array
    {
        // Convert UUID to integer ID
        $tenantId = null;
        if ($contentType->getTenantId()) {
            $tenant = DB::table('tenants')
                ->where('uuid', $contentType->getTenantId()->getValue())
                ->first();
            $tenantId = $tenant ? $tenant->id : null;
        }
        
        return [
            'uuid' => $contentType->getId()->getValue(),
            'tenant_id' => $tenantId,  // ✅ Integer for database
            'name' => $contentType->getName(),
            'slug' => $contentType->getSlug()->getValue(),
            // ...
        ];
    }
}
```

---

## COMMON QUERY PATTERNS

### Pattern: WHERE clause with tenant filter

```php
// ❌ WRONG
public function findByStatus(ContentStatus $status, Uuid $tenantId): array
{
    $eloquentModels = $this->model
        ->where('status', $status->getValue())
        ->where('tenant_id', $tenantId->getValue())  // ❌ UUID string
        ->get();
    
    return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
}

// ✅ CORRECT
public function findByStatus(ContentStatus $status, Uuid $tenantId): array
{
    // Convert UUID to integer ID
    $tenant = DB::table('tenants')
        ->where('uuid', $tenantId->getValue())
        ->first();
    
    if (!$tenant) {
        return [];
    }
    
    $eloquentModels = $this->model
        ->where('status', $status->getValue())
        ->where('tenant_id', $tenant->id)  // ✅ Integer ID
        ->get();
    
    return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
}
```

### Pattern: Existence check with tenant scope

```php
// ❌ WRONG
public function slugExists(ContentSlug $slug, Uuid $tenantId): bool
{
    return $this->model
        ->where('slug', $slug->getValue())
        ->where('tenant_id', $tenantId->getValue())  // ❌ UUID string
        ->exists();
}

// ✅ CORRECT
public function slugExists(ContentSlug $slug, Uuid $tenantId): bool
{
    // Convert UUID to integer ID
    $tenant = DB::table('tenants')
        ->where('uuid', $tenantId->getValue())
        ->first();
    
    if (!$tenant) {
        return false;  // Tenant doesn't exist
    }
    
    return $this->model
        ->where('slug', $slug->getValue())
        ->where('tenant_id', $tenant->id)  // ✅ Integer ID
        ->exists();
}
```

### Pattern: Relationship query with tenant

```php
// ❌ WRONG
public function countApprovedByEmail(string $email, Uuid $tenantId): int
{
    return $this->model
        ->where('author_email', $email)
        ->where('status', 'approved')
        ->whereHas('content', function($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId->getValue());  // ❌ UUID
        })
        ->count();
}

// ✅ CORRECT
public function countApprovedByEmail(string $email, Uuid $tenantId): int
{
    // Convert UUID to integer ID
    $tenant = DB::table('tenants')
        ->where('uuid', $tenantId->getValue())
        ->first();
    
    if (!$tenant) {
        return 0;
    }
    
    return $this->model
        ->where('author_email', $email)
        ->where('status', 'approved')
        ->whereHas('content', function($q) use ($tenant) {
            $q->where('tenant_id', $tenant->id);  // ✅ Integer ID
        })
        ->count();
}
```

---

## WHY THIS PATTERN EXISTS

### Business Logic Purity (Domain Layer)

```php
// Domain layer uses UUID for several reasons:
// 1. Business logic doesn't care about database implementation details
// 2. UUID is globally unique (supports distributed systems)
// 3. No sequential ID exposure (security)
// 4. Framework-agnostic (can switch from Laravel to Symfony)
```

### Performance Optimization (Database Layer)

```php
// Database uses integer IDs for several reasons:
// 1. Integer indexes are faster than UUID indexes
// 2. Integer foreign keys use less storage (8 bytes vs 16 bytes)
// 3. Better join performance on large datasets
// 4. Backward compatibility with existing system
```

### Security & Privacy (Public API)

```php
// Public API exposes only UUID:
// 1. Prevents enumeration attacks (cannot guess next ID)
// 2. Hides total record count
// 3. No information leakage through sequential IDs
// 4. Supports microservices with global identifiers
```

---

## ALTERNATIVE CONSIDERED & REJECTED

### Option 1: Use UUID columns in database

```sql
-- ❌ REJECTED: Use UUID for tenant_id
CREATE TABLE canplug_pagen_content_types (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE,
    tenant_id UUID,  -- Would match domain layer
    -- ...
);
```

**Why Rejected:**
- ❌ Requires schema migration across ALL tenant-related tables
- ❌ Breaks backward compatibility with existing system
- ❌ Integer foreign keys perform better for large datasets
- ❌ Larger storage footprint (UUID = 16 bytes, BIGINT = 8 bytes)

### Option 2: Use Integer IDs in domain layer

```php
// ❌ REJECTED: Use integer in domain
class ContentType {
    public function __construct(
        private Uuid $id,
        private ?int $tenantId,  // Would match database
        // ...
    ) {}
}
```

**Why Rejected:**
- ❌ Domain layer coupled to database implementation
- ❌ Cannot switch database vendors easily
- ❌ Exposes internal database details to business logic
- ❌ Violates Hexagonal Architecture principles
- ❌ Security risk (sequential ID exposure)

---

## PERFORMANCE CONSIDERATIONS

### Query Performance

```php
// Concern: Extra query to get tenant integer ID
$tenant = DB::table('tenants')
    ->where('uuid', $tenantId->getValue())
    ->first();

// Solution 1: Cache tenant UUID→ID mapping
Cache::remember("tenant_id_{$tenantId->getValue()}", 3600, function() use ($tenantId) {
    return DB::table('tenants')
        ->where('uuid', $tenantId->getValue())
        ->value('id');
});

// Solution 2: Use eager loading when possible
$contents = Content::with('tenant')->get();
```

### Index Optimization

```sql
-- Ensure UUID column is indexed
CREATE INDEX idx_tenants_uuid ON tenants(uuid);
CREATE INDEX idx_content_types_tenant_id ON canplug_pagen_content_types(tenant_id);

-- PostgreSQL can use these indexes efficiently
EXPLAIN SELECT * FROM canplug_pagen_content_types WHERE tenant_id = 1;
-- Index Scan using idx_content_types_tenant_id
```

---

## ERROR MESSAGES & TROUBLESHOOTING

### Error 1: Invalid text representation for bigint

```
SQLSTATE[22P02]: Invalid text representation: 7 
ERROR: sintaks masukan tidak valid untuk tipe bigint: "aacc605f-cc2e-466a-8c89-37e411fd9b39"
```

**Cause:**
```php
// UUID string passed to integer column
$query->where('tenant_id', $tenantId->getValue());  // ❌ UUID string
```

**Solution:**
```php
// Convert UUID to integer ID first
$tenant = DB::table('tenants')->where('uuid', $tenantId->getValue())->first();
$query->where('tenant_id', $tenant->id);  // ✅ Integer
```

### Error 2: Tenant not found (null)

```php
$tenant = DB::table('tenants')
    ->where('uuid', $tenantId->getValue())
    ->first();

// $tenant is null - UUID doesn't exist in database
```

**Solutions:**
```php
// Option 1: Return empty result
if (!$tenant) {
    return [];
}

// Option 2: Throw domain exception
if (!$tenant) {
    throw new TenantNotFoundException("Tenant {$tenantId->getValue()} not found");
}

// Option 3: Return default value
if (!$tenant) {
    return false;  // For existence checks
}
```

---

## CHECKLIST: Repository UUID/ID Conversion

Use this checklist when implementing repositories:

### Query Methods (UUID → Integer ID)
- [ ] All methods accepting `Uuid $tenantId` parameter
- [ ] Convert UUID to integer ID before WHERE clauses
- [ ] Handle tenant not found scenario
- [ ] Use integer ID in all database queries
- [ ] Return empty/default value if tenant not found

### Read Methods (Integer ID → UUID)
- [ ] mapToEntity() method converts integer to UUID
- [ ] Query tenants table by integer ID
- [ ] Create Uuid value object from UUID string
- [ ] Handle null tenant_id gracefully
- [ ] All domain entities use UUID value objects

### Write Methods (UUID → Integer ID)
- [ ] mapToArray() method converts UUID to integer
- [ ] Query tenants table by UUID string
- [ ] Extract integer ID from result
- [ ] Use integer ID in database insert/update
- [ ] Handle null tenant ID (platform-level entities)

### Relationship Queries
- [ ] whereHas() callbacks use integer ID
- [ ] Join conditions use integer ID
- [ ] Subqueries use integer ID
- [ ] All tenant filters convert UUID first

---

## SUMMARY

### Key Takeaways

1. **Database uses INTEGER foreign keys** for performance and storage efficiency
2. **Domain layer uses UUID value objects** for business logic purity and security
3. **Repository is the TRANSLATION LAYER** between domain and database
4. **ALWAYS convert UUID → Integer ID** before database queries
5. **ALWAYS convert Integer ID → UUID** when reading to domain
6. **Handle tenant not found** scenarios appropriately
7. **This pattern is NON-NEGOTIABLE** - PostgreSQL will not implicitly convert types

### Pattern Template

```php
// 1. Query Pattern
$tenant = DB::table('tenants')->where('uuid', $uuid)->first();
$query->where('tenant_id', $tenant->id);

// 2. Read Pattern
$tenant = DB::table('tenants')->where('id', $model->tenant_id)->first();
$tenantUuid = new Uuid($tenant->uuid);

// 3. Write Pattern
$tenant = DB::table('tenants')->where('uuid', $entity->getTenantId()->getValue())->first();
$data['tenant_id'] = $tenant->id;
```

---

**Next:** [Authorization & Permissions](./04-AUTHORIZATION.md)
