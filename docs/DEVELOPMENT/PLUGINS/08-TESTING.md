# 08 - TESTING STANDARDS

**Version:** 1.0  
**Last Updated:** January 16, 2026  

---

## OVERVIEW

Comprehensive testing guide for plugin development with emphasis on **NO MOCK DATA** policy, multi-tenant isolation, and hexagonal architecture testing patterns.

---

## ZERO TOLERANCE POLICY: NO MOCK DATA

### The Rule

```
❌ ABSOLUTE BAN: Mock data, hardcoded values, fake data generators
✅ ABSOLUTE REQUIREMENT: 100% Real backend API integration, database seeders only
```

### Why This Matters

1. **Production Parity**: Tests must reflect real production scenarios
2. **Integration Validation**: Ensures entire stack works together
3. **Data Consistency**: Real relationships, real constraints, real edge cases
4. **Tenant Isolation**: Validates multi-tenant data separation

### Enforcement

```php
// ❌ BANNED: Mock/fake data in tests
public function test_create_content_type()
{
    $data = [
        'name' => 'Mock Content Type',  // ❌ Hardcoded mock data
        'slug' => 'mock-type',
    ];
    
    $response = $this->postJson('/api/content-types', $data);
    $response->assertStatus(201);
}

// ✅ REQUIRED: Real database seeder data
public function test_create_content_type()
{
    $this->seed([TenantSeeder::class, UserSeeder::class]);
    
    $user = User::first();  // ✅ Real user from seeder
    $this->actingAs($user);
    
    $data = [
        'name' => 'Blog Post',  // ✅ Real business-context data
        'slug' => 'blog-post',
    ];
    
    $response = $this->postJson('/api/content-types', $data);
    $response->assertStatus(201);
}
```

---

## TEST PYRAMID STRUCTURE

```
           ╱╲
          ╱  ╲
         ╱ E2E ╲          Few (5-10% of tests)
        ╱────────╲        Full integration, slowest
       ╱          ╲
      ╱ Integration╲      Moderate (20-30% of tests)
     ╱──────────────╲     Repository/DB, medium speed
    ╱                ╲
   ╱  Unit Tests      ╲   Many (60-70% of tests)
  ╱────────────────────╲  Domain/logic, fastest
```

### Test Distribution

- **Unit Tests (60-70%)**: Domain entities, value objects, pure business logic
- **Integration Tests (20-30%)**: Repositories, database operations, UUID↔ID conversion
- **Feature/E2E Tests (5-10%)**: Full API requests, authentication, authorization

---

## UNIT TESTING

### Domain Layer Testing (No Database Required)

#### Testing Entities

```php
<?php

namespace Tests\Unit\Domain\Entities;

use Tests\TestCase;
use Plugins\PagesEngine\Domain\Entities\ContentType;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\ContentTypeSlug;
use Plugins\PagesEngine\Domain\ValueObjects\UrlPattern;
use DateTime;

class ContentTypeTest extends TestCase
{
    public function test_content_type_can_be_created_with_valid_data()
    {
        $contentType = new ContentType(
            id: new Uuid('550e8400-e29b-41d4-a716-446655440000'),
            tenantId: new Uuid('660e8400-e29b-41d4-a716-446655440001'),
            name: 'Blog Post',
            slug: new ContentTypeSlug('blog-post'),
            defaultUrlPattern: new UrlPattern('/blog/{slug}'),
            scope: 'tenant',
            description: 'Blog post content type',
            icon: 'newspaper',
            isCommentable: true,
            isCategorizable: true,
            isTaggable: true,
            isRevisioned: true,
            isActive: true,
            metadata: ['editor' => 'rich-text'],
            createdAt: new DateTime(),
            updatedAt: new DateTime()
        );
        
        $this->assertInstanceOf(ContentType::class, $contentType);
        $this->assertEquals('Blog Post', $contentType->getName());
        $this->assertEquals('blog-post', $contentType->getSlug()->getValue());
        $this->assertTrue($contentType->isCommentable());
    }
    
    public function test_content_type_can_be_activated()
    {
        $contentType = $this->createContentType(isActive: false);
        
        $this->assertFalse($contentType->isActive());
        
        $contentType->activate();
        
        $this->assertTrue($contentType->isActive());
    }
    
    public function test_content_type_can_be_deactivated()
    {
        $contentType = $this->createContentType(isActive: true);
        
        $this->assertTrue($contentType->isActive());
        
        $contentType->deactivate();
        
        $this->assertFalse($contentType->isActive());
    }
    
    private function createContentType(bool $isActive = true): ContentType
    {
        return new ContentType(
            id: new Uuid('550e8400-e29b-41d4-a716-446655440000'),
            tenantId: new Uuid('660e8400-e29b-41d4-a716-446655440001'),
            name: 'Blog Post',
            slug: new ContentTypeSlug('blog-post'),
            defaultUrlPattern: new UrlPattern('/blog/{slug}'),
            scope: 'tenant',
            description: null,
            icon: null,
            isCommentable: true,
            isCategorizable: true,
            isTaggable: true,
            isRevisioned: true,
            isActive: $isActive,
            metadata: [],
            createdAt: new DateTime(),
            updatedAt: new DateTime()
        );
    }
}
```

#### Testing Value Objects

```php
<?php

namespace Tests\Unit\Domain\ValueObjects;

use Tests\TestCase;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\Exceptions\InvalidUuidException;

class UuidTest extends TestCase
{
    public function test_uuid_can_be_created_with_valid_string()
    {
        $uuid = new Uuid('550e8400-e29b-41d4-a716-446655440000');
        
        $this->assertEquals('550e8400-e29b-41d4-a716-446655440000', $uuid->getValue());
    }
    
    public function test_uuid_throws_exception_for_invalid_format()
    {
        $this->expectException(InvalidUuidException::class);
        
        new Uuid('invalid-uuid');
    }
    
    public function test_uuid_equality_comparison()
    {
        $uuid1 = new Uuid('550e8400-e29b-41d4-a716-446655440000');
        $uuid2 = new Uuid('550e8400-e29b-41d4-a716-446655440000');
        $uuid3 = new Uuid('660e8400-e29b-41d4-a716-446655440001');
        
        $this->assertTrue($uuid1->equals($uuid2));
        $this->assertFalse($uuid1->equals($uuid3));
    }
}
```

```php
<?php

namespace Tests\Unit\Domain\ValueObjects;

use Tests\TestCase;
use Plugins\PagesEngine\Domain\ValueObjects\ContentSlug;
use Plugins\PagesEngine\Domain\Exceptions\InvalidSlugException;

class ContentSlugTest extends TestCase
{
    public function test_slug_can_be_created_with_valid_string()
    {
        $slug = new ContentSlug('my-blog-post');
        
        $this->assertEquals('my-blog-post', $slug->getValue());
    }
    
    /**
     * @dataProvider invalidSlugProvider
     */
    public function test_slug_throws_exception_for_invalid_format(string $invalidSlug)
    {
        $this->expectException(InvalidSlugException::class);
        
        new ContentSlug($invalidSlug);
    }
    
    public function invalidSlugProvider(): array
    {
        return [
            'uppercase' => ['My-Blog-Post'],
            'spaces' => ['my blog post'],
            'special chars' => ['my@blog#post'],
            'underscores' => ['my_blog_post'],
            'empty' => [''],
        ];
    }
}
```

#### Testing Use Cases

```php
<?php

namespace Tests\Unit\Application\UseCases;

use Tests\TestCase;
use Mockery;
use Plugins\PagesEngine\Application\UseCases\CreateContentTypeUseCase;
use Plugins\PagesEngine\Application\Commands\CreateContentTypeCommand;
use Plugins\PagesEngine\Domain\Repositories\ContentTypeRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\Exceptions\SlugAlreadyExistsException;

class CreateContentTypeUseCaseTest extends TestCase
{
    public function test_execute_creates_content_type_successfully()
    {
        $repository = Mockery::mock(ContentTypeRepositoryInterface::class);
        $repository->shouldReceive('slugExists')->andReturn(false);
        $repository->shouldReceive('save')->once();
        
        $useCase = new CreateContentTypeUseCase($repository);
        
        $command = new CreateContentTypeCommand(
            tenantId: new Uuid('550e8400-e29b-41d4-a716-446655440000'),
            name: 'Blog Post',
            slug: 'blog-post',
            defaultUrlPattern: '/blog/{slug}',
            scope: 'tenant',
            description: null,
            icon: null,
            isCommentable: true,
            isCategorizable: true,
            isTaggable: true,
            isRevisioned: true,
            isActive: true,
            metadata: []
        );
        
        $contentType = $useCase->execute($command);
        
        $this->assertEquals('Blog Post', $contentType->getName());
        $this->assertEquals('blog-post', $contentType->getSlug()->getValue());
    }
    
    public function test_execute_throws_exception_when_slug_exists()
    {
        $repository = Mockery::mock(ContentTypeRepositoryInterface::class);
        $repository->shouldReceive('slugExists')->andReturn(true);  // Slug exists
        
        $useCase = new CreateContentTypeUseCase($repository);
        
        $command = new CreateContentTypeCommand(
            tenantId: new Uuid('550e8400-e29b-41d4-a716-446655440000'),
            name: 'Blog Post',
            slug: 'blog-post',
            defaultUrlPattern: '/blog/{slug}',
            scope: 'tenant',
            description: null,
            icon: null,
            isCommentable: true,
            isCategorizable: true,
            isTaggable: true,
            isRevisioned: true,
            isActive: true,
            metadata: []
        );
        
        $this->expectException(SlugAlreadyExistsException::class);
        
        $useCase->execute($command);
    }
}
```

---

## INTEGRATION TESTING

### Repository Testing (With Database)

```php
<?php

namespace Tests\Integration\Repositories;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Plugins\PagesEngine\Infrastructure\Persistence\Repositories\ContentTypeEloquentRepository;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentTypeEloquentModel;
use Plugins\PagesEngine\Domain\Entities\ContentType;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\ContentTypeSlug;
use Plugins\PagesEngine\Domain\ValueObjects\UrlPattern;
use Database\Seeders\TenantSeeder;
use DateTime;

class ContentTypeEloquentRepositoryTest extends TestCase
{
    use RefreshDatabase;
    
    private ContentTypeEloquentRepository $repository;
    private string $tenantUuid;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        // ✅ Seed real data
        $this->seed(TenantSeeder::class);
        
        $tenant = \App\Models\Tenant::first();
        $this->tenantUuid = $tenant->uuid;
        
        $this->repository = new ContentTypeEloquentRepository(
            new ContentTypeEloquentModel()
        );
    }
    
    public function test_save_and_find_by_id_with_uuid_conversion()
    {
        $contentType = new ContentType(
            id: new Uuid(\Illuminate\Support\Str::uuid()->toString()),
            tenantId: new Uuid($this->tenantUuid),
            name: 'Blog Post',
            slug: new ContentTypeSlug('blog-post'),
            defaultUrlPattern: new UrlPattern('/blog/{slug}'),
            scope: 'tenant',
            description: 'Blog post content type',
            icon: 'newspaper',
            isCommentable: true,
            isCategorizable: true,
            isTaggable: true,
            isRevisioned: true,
            isActive: true,
            metadata: ['editor' => 'rich-text'],
            createdAt: new DateTime(),
            updatedAt: new DateTime()
        );
        
        // Save (UUID → Integer ID conversion)
        $this->repository->save($contentType);
        
        // Verify in database
        $this->assertDatabaseHas('canplug_pagen_content_types', [
            'uuid' => $contentType->getId()->getValue(),
            'name' => 'Blog Post',
            'slug' => 'blog-post',
        ]);
        
        // Find by ID (Integer ID → UUID conversion)
        $retrieved = $this->repository->findById($contentType->getId());
        
        $this->assertNotNull($retrieved);
        $this->assertEquals('Blog Post', $retrieved->getName());
        $this->assertEquals('blog-post', $retrieved->getSlug()->getValue());
        $this->assertEquals($this->tenantUuid, $retrieved->getTenantId()->getValue());
    }
    
    public function test_find_by_tenant_returns_only_tenant_content_types()
    {
        // Create second tenant
        $tenant2 = \App\Models\Tenant::factory()->create();
        
        // Create content types for tenant 1
        $ct1 = $this->createContentType($this->tenantUuid, 'Type 1', 'type-1');
        $ct2 = $this->createContentType($this->tenantUuid, 'Type 2', 'type-2');
        
        // Create content type for tenant 2
        $ct3 = $this->createContentType($tenant2->uuid, 'Type 3', 'type-3');
        
        $this->repository->save($ct1);
        $this->repository->save($ct2);
        $this->repository->save($ct3);
        
        // Find by tenant 1 (UUID → Integer ID conversion)
        $results = $this->repository->findByTenant(new Uuid($this->tenantUuid));
        
        $this->assertCount(2, $results);
        $this->assertEquals('Type 1', $results[0]->getName());
        $this->assertEquals('Type 2', $results[1]->getName());
    }
    
    public function test_slug_exists_checks_tenant_scope()
    {
        $tenant2 = \App\Models\Tenant::factory()->create();
        
        // Create content type with slug 'blog-post' for tenant 1
        $ct1 = $this->createContentType($this->tenantUuid, 'Blog Post', 'blog-post');
        $this->repository->save($ct1);
        
        // Slug exists for tenant 1
        $exists = $this->repository->slugExists(
            new ContentTypeSlug('blog-post'),
            new Uuid($this->tenantUuid)
        );
        $this->assertTrue($exists);
        
        // Slug does NOT exist for tenant 2 (different tenant)
        $exists = $this->repository->slugExists(
            new ContentTypeSlug('blog-post'),
            new Uuid($tenant2->uuid)
        );
        $this->assertFalse($exists);
    }
    
    private function createContentType(string $tenantUuid, string $name, string $slug): ContentType
    {
        return new ContentType(
            id: new Uuid(\Illuminate\Support\Str::uuid()->toString()),
            tenantId: new Uuid($tenantUuid),
            name: $name,
            slug: new ContentTypeSlug($slug),
            defaultUrlPattern: new UrlPattern('/content/{slug}'),
            scope: 'tenant',
            description: null,
            icon: null,
            isCommentable: true,
            isCategorizable: true,
            isTaggable: true,
            isRevisioned: true,
            isActive: true,
            metadata: [],
            createdAt: new DateTime(),
            updatedAt: new DateTime()
        );
    }
}
```

---

## FEATURE TESTING (API ENDPOINTS)

### Authentication & Authorization Testing

```php
<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Database\Seeders\TenantSeeder;
use Database\Seeders\UserSeeder;
use Database\Seeders\PagesEnginePermissionSeeder;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;

class ContentTypeApiTest extends TestCase
{
    use RefreshDatabase;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        // ✅ Seed real data (NO MOCK DATA)
        $this->seed([
            TenantSeeder::class,
            UserSeeder::class,
            PagesEnginePermissionSeeder::class,
        ]);
    }
    
    public function test_unauthenticated_user_cannot_access_content_types()
    {
        $response = $this->getJson('/api/pages-engine/content-types');
        
        $response->assertStatus(401);
    }
    
    public function test_user_without_permission_cannot_create_content_type()
    {
        // Get user without pages permissions
        $user = UserEloquentModel::whereDoesntHave('roles', function($q) {
            $q->where('name', 'like', '%pages%');
        })->first();
        
        $this->actingAs($user, 'api');
        
        $response = $this->postJson('/api/pages-engine/content-types', [
            'name' => 'Blog Post',
            'slug' => 'blog-post',
            'default_url_pattern' => '/blog/{slug}',
            'scope' => 'tenant',
        ]);
        
        $response->assertStatus(403);
    }
    
    public function test_authorized_user_can_create_content_type()
    {
        // Get user with pages permissions
        $user = UserEloquentModel::whereHas('roles', function($q) {
            $q->where('name', 'like', '%content-manager%');
        })->first();
        
        $this->actingAs($user, 'api');
        
        $response = $this->postJson('/api/pages-engine/content-types', [
            'name' => 'Blog Post',
            'slug' => 'blog-post',
            'default_url_pattern' => '/blog/{slug}',
            'scope' => 'tenant',
            'is_commentable' => true,
            'is_categorizable' => true,
        ]);
        
        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'uuid',
                'name',
                'slug',
                'default_url_pattern',
                'scope',
                'is_commentable',
                'is_categorizable',
            ],
        ]);
        
        // ✅ Verify UUID is returned (not integer ID)
        $this->assertNotNull($response->json('data.uuid'));
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $response->json('data.uuid')
        );
    }
    
    public function test_user_can_only_see_their_tenant_content_types()
    {
        // Create content types for different tenants
        $tenant1 = \App\Models\Tenant::first();
        $tenant2 = \App\Models\Tenant::factory()->create();
        
        $user1 = UserEloquentModel::where('tenant_id', $tenant1->id)->first();
        $user2 = UserEloquentModel::factory()->create(['tenant_id' => $tenant2->id]);
        
        // Create content types as user1
        $this->actingAs($user1, 'api');
        $this->postJson('/api/pages-engine/content-types', [
            'name' => 'Tenant 1 Type',
            'slug' => 'tenant-1-type',
            'default_url_pattern' => '/content/{slug}',
            'scope' => 'tenant',
        ]);
        
        // Create content types as user2
        $this->actingAs($user2, 'api');
        $this->postJson('/api/pages-engine/content-types', [
            'name' => 'Tenant 2 Type',
            'slug' => 'tenant-2-type',
            'default_url_pattern' => '/content/{slug}',
            'scope' => 'tenant',
        ]);
        
        // User1 should only see their content types
        $this->actingAs($user1, 'api');
        $response = $this->getJson('/api/pages-engine/content-types');
        
        $response->assertStatus(200);
        $data = $response->json('data');
        
        // Should only contain tenant 1's content types
        foreach ($data as $contentType) {
            $this->assertNotEquals('Tenant 2 Type', $contentType['name']);
        }
    }
}
```

### Validation Testing

```php
public function test_create_content_type_validates_required_fields()
{
    $user = UserEloquentModel::first();
    $this->actingAs($user, 'api');
    
    $response = $this->postJson('/api/pages-engine/content-types', []);
    
    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['name', 'slug', 'default_url_pattern', 'scope']);
}

public function test_create_content_type_validates_slug_format()
{
    $user = UserEloquentModel::first();
    $this->actingAs($user, 'api');
    
    $response = $this->postJson('/api/pages-engine/content-types', [
        'name' => 'Blog Post',
        'slug' => 'Invalid Slug!',  // Invalid format
        'default_url_pattern' => '/blog/{slug}',
        'scope' => 'tenant',
    ]);
    
    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['slug']);
}

public function test_create_content_type_prevents_duplicate_slug_in_tenant()
{
    $user = UserEloquentModel::first();
    $this->actingAs($user, 'api');
    
    // Create first content type
    $this->postJson('/api/pages-engine/content-types', [
        'name' => 'Blog Post',
        'slug' => 'blog-post',
        'default_url_pattern' => '/blog/{slug}',
        'scope' => 'tenant',
    ])->assertStatus(201);
    
    // Try to create duplicate slug
    $response = $this->postJson('/api/pages-engine/content-types', [
        'name' => 'Another Blog',
        'slug' => 'blog-post',  // Duplicate
        'default_url_pattern' => '/blog/{slug}',
        'scope' => 'tenant',
    ]);
    
    $response->assertStatus(422);
}
```

---

## MULTI-TENANT TEST ISOLATION

### Ensuring Tenant Isolation

```php
public function test_content_queries_are_isolated_by_tenant()
{
    $tenant1 = \App\Models\Tenant::first();
    $tenant2 = \App\Models\Tenant::factory()->create();
    
    $user1 = UserEloquentModel::where('tenant_id', $tenant1->id)->first();
    $user2 = UserEloquentModel::factory()->create(['tenant_id' => $tenant2->id]);
    
    // Create content for tenant 1
    $this->actingAs($user1, 'api');
    $this->postJson('/api/pages-engine/contents', [
        'title' => 'Tenant 1 Content',
        'content_type_id' => '...',
        // ...
    ]);
    
    // Create content for tenant 2
    $this->actingAs($user2, 'api');
    $this->postJson('/api/pages-engine/contents', [
        'title' => 'Tenant 2 Content',
        'content_type_id' => '...',
        // ...
    ]);
    
    // Verify tenant 1 cannot see tenant 2 content
    $this->actingAs($user1, 'api');
    $response = $this->getJson('/api/pages-engine/contents');
    
    $titles = collect($response->json('data'))->pluck('title');
    $this->assertContains('Tenant 1 Content', $titles);
    $this->assertNotContains('Tenant 2 Content', $titles);  // ✅ Isolated
}
```

---

## TEST DATA MANAGEMENT

### Database Seeders for Testing

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use Illuminate\Support\Str;

class TenantSeeder extends Seeder
{
    public function run()
    {
        // ✅ Create realistic test tenants
        Tenant::create([
            'uuid' => Str::uuid()->toString(),
            'name' => 'Acme Corporation',
            'slug' => 'acme',
            'domain' => 'acme.canvastencil.test',
            'is_active' => true,
        ]);
        
        Tenant::create([
            'uuid' => Str::uuid()->toString(),
            'name' => 'Tech Startup Inc',
            'slug' => 'techstartup',
            'domain' => 'techstartup.canvastencil.test',
            'is_active' => true,
        ]);
    }
}
```

### RefreshDatabase Trait

```php
use Illuminate\Foundation\Testing\RefreshDatabase;

class MyTest extends TestCase
{
    use RefreshDatabase;  // ✅ Fresh database for each test
    
    protected function setUp(): void
    {
        parent::setUp();
        
        // Seed required data
        $this->seed([
            TenantSeeder::class,
            UserSeeder::class,
        ]);
    }
}
```

---

## PERFORMANCE TESTING

### Query Count Assertions

```php
use Illuminate\Support\Facades\DB;

public function test_content_list_does_not_have_n_plus_one_queries()
{
    $user = UserEloquentModel::first();
    $this->actingAs($user, 'api');
    
    DB::enableQueryLog();
    
    $response = $this->getJson('/api/pages-engine/contents');
    
    $queryCount = count(DB::getQueryLog());
    
    // ✅ Should use eager loading (limited queries)
    $this->assertLessThan(10, $queryCount, 'Too many queries - N+1 problem detected');
    
    $response->assertStatus(200);
}
```

---

## SUMMARY

**Testing Checklist:**

### ✅ Unit Tests
- [ ] Domain entities tested
- [ ] Value objects tested
- [ ] Use cases tested with mocked repositories
- [ ] No database dependencies
- [ ] Fast execution (< 100ms each)

### ✅ Integration Tests
- [ ] Repository UUID↔ID conversion tested
- [ ] Database operations tested
- [ ] Tenant isolation verified
- [ ] RefreshDatabase used
- [ ] Real seeders used (NO MOCK DATA)

### ✅ Feature Tests
- [ ] API endpoints tested
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] Validation tested
- [ ] Response structure verified
- [ ] UUIDs exposed (not integer IDs)
- [ ] Tenant isolation verified
- [ ] Real seeders used (NO MOCK DATA)

### ✅ Coverage
- [ ] Domain layer: 90%+
- [ ] Application layer: 80%+
- [ ] Infrastructure layer: 70%+
- [ ] Critical paths: 100%

### ✅ Test Quality
- [ ] Descriptive test names
- [ ] One assertion per test (when possible)
- [ ] No hardcoded/mock data
- [ ] Fast execution
- [ ] Independent tests (no shared state)
- [ ] Clear arrange-act-assert structure

**Golden Rules:**
- ✅ NEVER use mock/fake data
- ✅ ALWAYS use database seeders
- ✅ ALWAYS verify tenant isolation
- ✅ ALWAYS verify UUID exposure (not integer IDs)
- ✅ ALWAYS test UUID↔ID conversion in repositories
- ✅ ALWAYS run full test suite before commits
