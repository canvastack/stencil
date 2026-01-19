# 05 - REPOSITORY PATTERN IMPLEMENTATION

**Version:** 1.0  
**Last Updated:** January 16, 2026  

---

## OVERVIEW

Deep dive into Repository Pattern implementation with complete UUID↔ID translation layer. This document provides comprehensive examples and patterns for implementing repositories that bridge the gap between domain layer (UUID) and database layer (Integer ID).

---

## REPOSITORY PATTERN FUNDAMENTALS

### Purpose

The Repository Pattern provides an abstraction layer between domain logic and data persistence:

```
┌────────────────────────────────────────────────────────┐
│                    DOMAIN LAYER                        │
│  - Pure business logic                                 │
│  - Framework independent                               │
│  - Works with domain entities and value objects        │
│  - Depends on repository INTERFACE                     │
└────────────────────┬───────────────────────────────────┘
                     │
                     │ Depends on abstraction (interface)
                     │
┌────────────────────┴───────────────────────────────────┐
│            INFRASTRUCTURE LAYER                        │
│  - Concrete repository IMPLEMENTATION                  │
│  - Framework specific (Eloquent)                       │
│  - Handles UUID↔ID translation                         │
│  - Manages database operations                         │
└─────────────────────────────────────────────────────────┘
```

### Benefits

1. **Testability**: Domain layer can be tested without database
2. **Framework Independence**: Easy to switch from Eloquent to Doctrine
3. **Separation of Concerns**: Business logic separated from persistence
4. **Consistent Interface**: Standardized data access patterns
5. **Type Safety**: Strong typing with value objects

---

## REPOSITORY INTERFACE DESIGN

### Interface Location

```
plugins/your-plugin/backend/src/Domain/Repositories/
├── ContentTypeRepositoryInterface.php
├── ContentRepositoryInterface.php
├── CategoryRepositoryInterface.php
└── ContentCommentRepositoryInterface.php
```

### Standard Interface Pattern

```php
<?php

namespace Plugins\PagesEngine\Domain\Repositories;

use Plugins\PagesEngine\Domain\Entities\ContentType;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\ContentTypeSlug;

interface ContentTypeRepositoryInterface
{
    /**
     * Find content type by UUID
     * 
     * @param Uuid $id
     * @return ContentType|null
     */
    public function findById(Uuid $id): ?ContentType;
    
    /**
     * Find all content types for a tenant
     * 
     * @param Uuid $tenantId
     * @return ContentType[]
     */
    public function findByTenant(Uuid $tenantId): array;
    
    /**
     * Save content type (create or update)
     * 
     * @param ContentType $contentType
     * @return void
     */
    public function save(ContentType $contentType): void;
    
    /**
     * Delete content type
     * 
     * @param Uuid $id
     * @return void
     */
    public function delete(Uuid $id): void;
    
    /**
     * Check if slug exists for tenant
     * 
     * @param ContentTypeSlug $slug
     * @param Uuid|null $tenantId
     * @return bool
     */
    public function slugExists(ContentTypeSlug $slug, ?Uuid $tenantId = null): bool;
}
```

### Key Interface Principles

1. **Use Value Objects**: Parameters and return types use domain value objects (Uuid, ContentTypeSlug, etc.)
2. **Return Domain Entities**: Always return domain entities, never Eloquent models
3. **Type Hints**: Strong typing for all parameters and return types
4. **Single Responsibility**: Each method has one clear purpose
5. **Tenant Awareness**: Methods that need tenant context accept Uuid $tenantId

---

## REPOSITORY IMPLEMENTATION

### Implementation Location

```
plugins/your-plugin/backend/src/Infrastructure/Persistence/Repositories/
├── ContentTypeEloquentRepository.php
├── ContentEloquentRepository.php
├── CategoryEloquentRepository.php
└── ContentCommentEloquentRepository.php
```

### Complete Implementation Example

```php
<?php

namespace Plugins\PagesEngine\Infrastructure\Persistence\Repositories;

use Illuminate\Support\Facades\DB;
use Plugins\PagesEngine\Domain\Entities\ContentType;
use Plugins\PagesEngine\Domain\Repositories\ContentTypeRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\ContentTypeSlug;
use Plugins\PagesEngine\Domain\ValueObjects\UrlPattern;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentTypeEloquentModel;
use DateTime;

class ContentTypeEloquentRepository implements ContentTypeRepositoryInterface
{
    public function __construct(
        private ContentTypeEloquentModel $model
    ) {}
    
    // ========================================
    // PATTERN 1: QUERY (UUID → INTEGER ID)
    // ========================================
    
    public function findByTenant(Uuid $tenantId): array
    {
        // Step 1: Convert UUID to integer ID
        $tenant = DB::table('tenants')
            ->where('uuid', $tenantId->getValue())
            ->first();
        
        // Step 2: Handle not found
        if (!$tenant) {
            return [];  // Return empty array for collections
        }
        
        // Step 3: Query using integer ID
        $eloquentModels = $this->model
            ->where('tenant_id', $tenant->id)  // Use integer
            ->where('scope', 'tenant')
            ->get();
        
        // Step 4: Map to domain entities
        return $eloquentModels
            ->map(fn($model) => $this->mapToEntity($model))
            ->toArray();
    }
    
    public function slugExists(ContentTypeSlug $slug, ?Uuid $tenantId = null): bool
    {
        $query = $this->model->where('slug', $slug->getValue());
        
        if ($tenantId) {
            // Convert UUID to integer ID for tenant filter
            $tenant = DB::table('tenants')
                ->where('uuid', $tenantId->getValue())
                ->first();
            
            if ($tenant) {
                $query->where('tenant_id', $tenant->id);
            }
        }
        
        return $query->exists();
    }
    
    // ========================================
    // PATTERN 2: READ (INTEGER ID → UUID)
    // ========================================
    
    private function mapToEntity(ContentTypeEloquentModel $model): ContentType
    {
        // Step 1: Convert integer tenant_id to UUID
        $tenantUuid = null;
        if ($model->tenant_id) {
            $tenant = DB::table('tenants')
                ->where('id', $model->tenant_id)  // Query by integer
                ->first();
            
            if ($tenant) {
                $tenantUuid = new Uuid($tenant->uuid);  // Create UUID value object
            }
        }
        
        // Step 2: Create domain entity with UUID
        return new ContentType(
            id: new Uuid($model->uuid),
            tenantId: $tenantUuid,  // ✅ UUID value object
            name: $model->name,
            slug: new ContentTypeSlug($model->slug),
            defaultUrlPattern: new UrlPattern($model->default_url_pattern),
            scope: $model->scope,
            description: $model->description,
            icon: $model->icon,
            isCommentable: $model->is_commentable,
            isCategorizable: $model->is_categorizable,
            isTaggable: $model->is_taggable,
            isRevisioned: $model->is_revisioned,
            isActive: $model->is_active,
            metadata: $model->metadata ?? [],
            createdAt: new DateTime($model->created_at->format('Y-m-d H:i:s')),
            updatedAt: new DateTime($model->updated_at->format('Y-m-d H:i:s'))
        );
    }
    
    // ========================================
    // PATTERN 3: WRITE (UUID → INTEGER ID)
    // ========================================
    
    public function save(ContentType $contentType): void
    {
        $data = $this->mapToArray($contentType);
        
        $this->model->updateOrCreate(
            ['uuid' => $contentType->getId()->getValue()],
            $data
        );
    }
    
    private function mapToArray(ContentType $contentType): array
    {
        // Step 1: Convert UUID to integer ID
        $tenantId = null;
        if ($contentType->getTenantId()) {
            $tenant = DB::table('tenants')
                ->where('uuid', $contentType->getTenantId()->getValue())
                ->first();
            
            if ($tenant) {
                $tenantId = $tenant->id;  // Use integer for database
            }
        }
        
        // Step 2: Return array with integer ID
        return [
            'uuid' => $contentType->getId()->getValue(),
            'tenant_id' => $tenantId,  // ✅ Integer for database
            'name' => $contentType->getName(),
            'slug' => $contentType->getSlug()->getValue(),
            'default_url_pattern' => $contentType->getDefaultUrlPattern()->getValue(),
            'scope' => $contentType->getScope(),
            'description' => $contentType->getDescription(),
            'icon' => $contentType->getIcon(),
            'is_commentable' => $contentType->isCommentable(),
            'is_categorizable' => $contentType->isCategorizable(),
            'is_taggable' => $contentType->isTaggable(),
            'is_revisioned' => $contentType->isRevisioned(),
            'is_active' => $contentType->isActive(),
            'metadata' => $contentType->getMetadata(),
        ];
    }
}
```

---

## COMMON QUERY PATTERNS

### Pattern A: Simple Tenant Filter

```php
public function findByStatus(ContentStatus $status, Uuid $tenantId): array
{
    // Convert UUID to integer
    $tenant = DB::table('tenants')
        ->where('uuid', $tenantId->getValue())
        ->first();
    
    if (!$tenant) {
        return [];
    }
    
    // Query with integer tenant_id
    $eloquentModels = $this->model
        ->where('tenant_id', $tenant->id)
        ->where('status', $status->getValue())
        ->get();
    
    return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
}
```

### Pattern B: Relationship Query with Tenant

```php
public function findWithFilters(array $filters = []): array
{
    $query = $this->model->newQuery()->with('content');
    
    // Apply tenant filter if provided
    if (isset($filters['tenant_id'])) {
        $tenant = DB::table('tenants')
            ->where('uuid', $filters['tenant_id'])
            ->first();
        
        if ($tenant) {
            $query->where(function($q) use ($tenant) {
                $q->where('tenant_id', $tenant->id)
                  ->orWhereHas('content', function($subQ) use ($tenant) {
                      $subQ->where('tenant_id', $tenant->id);
                  });
            });
        }
    }
    
    // Apply other filters
    if (isset($filters['status'])) {
        $query->where('status', $filters['status']);
    }
    
    $eloquentModels = $query->get();
    
    return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
}
```

### Pattern C: Existence Check with Tenant Scope

```php
public function slugExists(ContentSlug $slug, Uuid $tenantId): bool
{
    $tenant = DB::table('tenants')
        ->where('uuid', $tenantId->getValue())
        ->first();
    
    if (!$tenant) {
        return false;  // Tenant not found = slug doesn't exist
    }
    
    return $this->model
        ->where('slug', $slug->getValue())
        ->where('tenant_id', $tenant->id)
        ->exists();
}
```

### Pattern D: Count with Tenant Scope

```php
public function countByStatus(CommentStatus $status, Uuid $tenantId): array
{
    $tenant = DB::table('tenants')
        ->where('uuid', $tenantId->getValue())
        ->first();
    
    if (!$tenant) {
        return [
            'pending' => 0,
            'approved' => 0,
            'rejected' => 0,
            'spam' => 0,
        ];
    }
    
    $counts = $this->model
        ->where('tenant_id', $tenant->id)
        ->selectRaw('status, count(*) as count')
        ->groupBy('status')
        ->pluck('count', 'status')
        ->toArray();
    
    return [
        'pending' => $counts['pending'] ?? 0,
        'approved' => $counts['approved'] ?? 0,
        'rejected' => $counts['rejected'] ?? 0,
        'spam' => $counts['spam'] ?? 0,
        'total' => array_sum($counts),
    ];
}
```

### Pattern E: Search with Tenant Scope

```php
public function search(string $keyword, Uuid $tenantId, array $filters = []): array
{
    $tenant = DB::table('tenants')
        ->where('uuid', $tenantId->getValue())
        ->first();
    
    if (!$tenant) {
        return [];
    }
    
    $query = $this->model
        ->where('tenant_id', $tenant->id)
        ->where(function($q) use ($keyword) {
            $q->where('title', 'ILIKE', "%{$keyword}%")
              ->orWhere('content', 'ILIKE', "%{$keyword}%")
              ->orWhere('excerpt', 'ILIKE', "%{$keyword}%");
        });
    
    // Apply additional filters
    if (isset($filters['status'])) {
        $query->where('status', $filters['status']);
    }
    
    if (isset($filters['content_type_id'])) {
        $query->where('content_type_id', $filters['content_type_id']);
    }
    
    $eloquentModels = $query->get();
    
    return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
}
```

---

## NULL SAFETY PATTERNS

### Handling Null Tenant ID

```php
// When querying
public function findByTenant(Uuid $tenantId): array
{
    $tenant = DB::table('tenants')
        ->where('uuid', $tenantId->getValue())
        ->first();
    
    if (!$tenant) {
        return [];  // ✅ Return empty array for collections
    }
    
    // Continue with query...
}

// When checking existence
public function exists(Uuid $id, Uuid $tenantId): bool
{
    $tenant = DB::table('tenants')
        ->where('uuid', $tenantId->getValue())
        ->first();
    
    if (!$tenant) {
        return false;  // ✅ Return false for boolean checks
    }
    
    // Continue with query...
}

// When finding single entity
public function findBySlug(ContentSlug $slug, Uuid $tenantId): ?Content
{
    $tenant = DB::table('tenants')
        ->where('uuid', $tenantId->getValue())
        ->first();
    
    if (!$tenant) {
        return null;  // ✅ Return null for single objects
    }
    
    // Continue with query...
}
```

### Handling Missing Tenant in Entity

```php
private function mapToEntity(ContentCommentEloquentModel $model): ContentComment
{
    // Get tenant_id from direct column or relationship
    $tenantIdInt = $model->tenant_id ?? $model->content?->tenant_id ?? null;
    
    if (!$tenantIdInt) {
        throw new \RuntimeException("Comment {$model->uuid} missing tenant_id");
    }
    
    $tenant = DB::table('tenants')
        ->where('id', $tenantIdInt)
        ->first();
    
    if (!$tenant) {
        throw new \RuntimeException("Tenant not found for comment {$model->uuid}");
    }
    
    return new ContentComment(
        id: new Uuid($model->uuid),
        tenantId: new Uuid($tenant->uuid),  // ✅ Always has valid tenant
        // ...
    );
}
```

---

## PERFORMANCE OPTIMIZATION

### Caching Tenant Lookups

For repositories with many methods, cache tenant lookups:

```php
class ContentEloquentRepository implements ContentRepositoryInterface
{
    private array $tenantCache = [];
    
    private function getTenantId(Uuid $tenantUuid): ?int
    {
        $key = $tenantUuid->getValue();
        
        if (!isset($this->tenantCache[$key])) {
            $tenant = DB::table('tenants')
                ->where('uuid', $key)
                ->first();
            
            $this->tenantCache[$key] = $tenant?->id;
        }
        
        return $this->tenantCache[$key];
    }
    
    public function findByTenant(Uuid $tenantId): array
    {
        $tenantIntId = $this->getTenantId($tenantId);
        
        if (!$tenantIntId) {
            return [];
        }
        
        $eloquentModels = $this->model
            ->where('tenant_id', $tenantIntId)
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }
}
```

### Eager Loading Relationships

```php
public function findWithRelations(Uuid $id): ?Content
{
    $eloquentModel = $this->model
        ->with(['contentType', 'categories', 'author'])  // Eager load
        ->where('uuid', $id->getValue())
        ->first();
    
    return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
}
```

---

## ERROR HANDLING

### Standard Error Patterns

```php
public function findById(Uuid $id): ?ContentType
{
    try {
        $eloquentModel = $this->model
            ->where('uuid', $id->getValue())
            ->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    } catch (\Exception $e) {
        \Log::error('Failed to find content type', [
            'uuid' => $id->getValue(),
            'error' => $e->getMessage(),
        ]);
        
        throw new \RuntimeException(
            "Failed to retrieve content type: {$e->getMessage()}",
            0,
            $e
        );
    }
}

public function save(ContentType $contentType): void
{
    try {
        DB::beginTransaction();
        
        $data = $this->mapToArray($contentType);
        
        $this->model->updateOrCreate(
            ['uuid' => $contentType->getId()->getValue()],
            $data
        );
        
        DB::commit();
    } catch (\Exception $e) {
        DB::rollBack();
        
        \Log::error('Failed to save content type', [
            'uuid' => $contentType->getId()->getValue(),
            'error' => $e->getMessage(),
        ]);
        
        throw new \RuntimeException(
            "Failed to save content type: {$e->getMessage()}",
            0,
            $e
        );
    }
}
```

---

## TESTING REPOSITORIES

### Unit Testing (Without Database)

```php
use Tests\TestCase;
use Mockery;

class ContentTypeEloquentRepositoryTest extends TestCase
{
    public function test_find_by_tenant_converts_uuid_to_integer()
    {
        // Mock Eloquent model
        $model = Mockery::mock(ContentTypeEloquentModel::class);
        $model->shouldReceive('where')
            ->with('tenant_id', 1)  // Expect integer
            ->andReturnSelf();
        $model->shouldReceive('where')
            ->with('scope', 'tenant')
            ->andReturnSelf();
        $model->shouldReceive('get')
            ->andReturn(collect([]));
        
        $repository = new ContentTypeEloquentRepository($model);
        
        $result = $repository->findByTenant(new Uuid('test-uuid'));
        
        $this->assertIsArray($result);
    }
}
```

### Integration Testing (With Database)

```php
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ContentTypeEloquentRepositoryIntegrationTest extends TestCase
{
    use RefreshDatabase;
    
    public function test_save_and_retrieve_content_type()
    {
        $tenant = factory(Tenant::class)->create();
        
        $contentType = new ContentType(
            id: new Uuid(Str::uuid()->toString()),
            tenantId: new Uuid($tenant->uuid),
            name: 'Blog Post',
            slug: new ContentTypeSlug('blog-post'),
            // ...
        );
        
        $repository = app(ContentTypeRepositoryInterface::class);
        $repository->save($contentType);
        
        $retrieved = $repository->findById($contentType->getId());
        
        $this->assertNotNull($retrieved);
        $this->assertEquals('Blog Post', $retrieved->getName());
        $this->assertEquals($tenant->uuid, $retrieved->getTenantId()->getValue());
    }
}
```

---

## CHECKLIST: REPOSITORY IMPLEMENTATION

### ✅ Interface Definition
- [ ] Created in `Domain/Repositories/` directory
- [ ] Uses domain value objects for parameters and return types
- [ ] All methods have clear docblocks
- [ ] Follows naming convention: `{Entity}RepositoryInterface`

### ✅ Implementation
- [ ] Created in `Infrastructure/Persistence/Repositories/` directory
- [ ] Implements the domain repository interface
- [ ] Follows naming convention: `{Entity}EloquentRepository`
- [ ] Constructor injects Eloquent model

### ✅ UUID↔ID Translation
- [ ] All query methods convert UUID → Integer ID before WHERE clauses
- [ ] `mapToEntity()` converts Integer ID → UUID for tenant_id
- [ ] `mapToArray()` converts UUID → Integer ID for tenant_id
- [ ] Handles null tenant_id gracefully

### ✅ Null Safety
- [ ] Returns empty array `[]` when tenant not found (collection methods)
- [ ] Returns `null` when tenant not found (single entity methods)
- [ ] Returns `false` when tenant not found (boolean methods)
- [ ] Throws exception if tenant_id missing in entity mapping

### ✅ Error Handling
- [ ] Try-catch blocks for database operations
- [ ] Logging for errors
- [ ] Meaningful error messages
- [ ] Transaction management for write operations

### ✅ Performance
- [ ] Eager loading for relationships when needed
- [ ] Proper indexing on uuid and tenant_id columns
- [ ] Query optimization (avoid N+1 queries)
- [ ] Consider caching for frequently accessed data

### ✅ Testing
- [ ] Unit tests for translation logic
- [ ] Integration tests for database operations
- [ ] Tests verify UUID↔ID conversion
- [ ] Tests verify tenant isolation

---

## SUMMARY

**Repository Pattern Critical Points:**

1. **Repository = Translation Boundary**: Converts between domain (UUID) and database (Integer)
2. **Three Translation Patterns**: Query (UUID→ID), Read (ID→UUID), Write (UUID→ID)
3. **Always Convert Before Query**: Never pass UUID string to integer column
4. **Null Safety**: Handle missing tenant gracefully with appropriate return values
5. **Performance**: Cache tenant lookups, use eager loading, optimize queries
6. **Testing**: Test both translation logic and database operations

**Next Steps:**
- Review [Multi-Tenant Architecture](./03-MULTI-TENANT.md) for UUID/ID pattern details
- Review [Common Pitfalls](./06-COMMON-PITFALLS.md) for error solutions
- Implement repositories following these patterns
- Write comprehensive tests
