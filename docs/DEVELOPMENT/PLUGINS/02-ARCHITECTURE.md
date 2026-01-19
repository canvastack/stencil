# PLUGIN ARCHITECTURE - Hexagonal Architecture Implementation

**Version:** 1.0  
**Last Updated:** January 16, 2026  

---

## OVERVIEW

Dokumentasi arsitektur Hexagonal (Ports & Adapters) untuk pengembangan plugin CanvaStencil. Arsitektur ini memastikan separation of concerns, testability, dan scalability.

---

## HEXAGONAL ARCHITECTURE LAYERS

### Visual Representation

```
┌──────────────────────────────────────────────────────────────┐
│                       PRESENTATION LAYER                     │
│  ┌────────────────────┐        ┌─────────────────────┐       │
│  │  HTTP Controllers  │        │  API Resources      │       │
│  │  (Entry Points)    │        │  (Response Format)  │       │
│  └────────────────────┘        └─────────────────────┘       │
└────────────────────┬──────────────────────┬──────────────────┘
                     │                      │
                     │   PRIMARY ADAPTERS   │
                     │                      │
┌────────────────────┴──────────────────────┴──────────────────┐
│                   APPLICATION LAYER                          │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              USE CASES                              │     │
│  │  • CreateContentTypeUseCase                         │     │
│  │  • UpdateContentTypeUseCase                         │     │
│  │  • DeleteContentTypeUseCase                         │     │
│  │  • ListContentTypesUseCase                          │     │
│  └─────────────────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────────────────┐     │
│  │         COMMANDS & QUERIES (DTOs)                   │     │
│  │  • CreateContentTypeCommand                         │     │
│  │  • UpdateContentTypeCommand                         │     │
│  └─────────────────────────────────────────────────────┘     │
└────────────────────┬──────────────────────┬──────────────────┘
                     │                      │
                     │  DOMAIN INTERFACES   |
                     │                      │
┌────────────────────┴──────────────────────┴───────────────────┐
│                          DOMAIN LAYER                         │
│  ┌──────────────────┐    ┌────────────────────────────┐       │
│  │   ENTITIES       │    │   VALUE OBJECTS            │       │
│  │ • ContentType    │    │ • Uuid                     │       │
│  │ • Category       │    │ • ContentTypeSlug          │       │
│  │ • Content        │    │ • UrlPattern               │       │
│  └──────────────────┘    └────────────────────────────┘       │
│  ┌──────────────────────────────────────────────────────┐     │
│  │        REPOSITORY INTERFACES (PORTS)                 │     │
│  │  • ContentTypeRepositoryInterface                    │     │
│  │  • CategoryRepositoryInterface                       │     │
│  │  • ContentRepositoryInterface                        │     │
│  └──────────────────────────────────────────────────────┘     │
│  ┌──────────────────────────────────────────────────────┐     │
│  │             DOMAIN SERVICES                          │     │
│  │  • SlugGenerator                                     │     │
│  │  • UrlPatternValidator                               │     │
│  └──────────────────────────────────────────────────────┘     │
└────────────────────┬──────────────────────┬───────────────────┘
                     │                      │
                     │   SECONDARY PORTS    |
                     |   (Implementation)   |
                     │                      │
┌────────────────────┴──────────────────────┴───────────────────┐
│                 INFRASTRUCTURE LAYER                          │
│  ┌──────────────────────┐     ┌─────────────────────────┐     │
│  │  PERSISTENCE         │     │  EXTERNAL SERVICES      │     │
│  │ • Eloquent Models    │     │ • Email Adapter         │     │
│  │ • Repositories       │     │ • Storage Adapter       │     │
│  │ • UUID↔ID Translation│     │ • Cache Adapter         │     │
│  └──────────────────────┘     └─────────────────────────┘     │
└───────────────────────────────────────────────────────────────┘
```

---

## LAYER RESPONSIBILITIES

### 1. Domain Layer (Core Business Logic)

**Location:** `plugins/your-plugin/backend/src/Domain/`

**Responsibilities:**
- Pure business logic tanpa framework dependencies
- Domain entities dengan business rules
- Value objects untuk type safety
- Repository interfaces (ports)
- Domain services untuk complex logic
- Domain events untuk business events

**Rules:**
- ❌ NO Laravel dependencies (no Eloquent, no facades)
- ❌ NO database queries
- ❌ NO HTTP requests
- ❌ NO framework-specific code
- ✅ Pure PHP objects only
- ✅ Framework-agnostic business logic
- ✅ 100% unit testable

**Example Structure:**
```
Domain/
├── Entities/
│   ├── ContentType.php          # Domain entity
│   ├── Category.php
│   └── Content.php
├── ValueObjects/
│   ├── Uuid.php                 # UUID value object
│   ├── ContentTypeSlug.php      # Slug with validation
│   ├── UrlPattern.php           # URL pattern with rules
│   └── ContentStatus.php        # Status enum
├── Repositories/
│   ├── ContentTypeRepositoryInterface.php  # Port
│   ├── CategoryRepositoryInterface.php
│   └── ContentRepositoryInterface.php
├── Services/
│   ├── SlugGenerator.php        # Domain service
│   └── UrlPatternValidator.php
└── Events/
    ├── ContentTypeCreated.php   # Domain event
    └── ContentPublished.php
```

**Example Entity:**
```php
namespace Plugins\PagesEngine\Domain\Entities;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\ContentTypeSlug;

class ContentType
{
    public function __construct(
        private Uuid $id,
        private ?Uuid $tenantId,
        private string $name,
        private ContentTypeSlug $slug,
        private string $scope,
        private bool $isActive
    ) {}
    
    // Business logic methods
    public function activate(): void
    {
        if (!$this->canBeActivated()) {
            throw new \DomainException('Content type cannot be activated');
        }
        
        $this->isActive = true;
    }
    
    public function deactivate(): void
    {
        $this->isActive = false;
    }
    
    private function canBeActivated(): bool
    {
        // Business rules for activation
        return $this->slug !== null && $this->name !== '';
    }
    
    // Getters only (immutable after creation)
    public function getId(): Uuid { return $this->id; }
    public function getTenantId(): ?Uuid { return $this->tenantId; }
    public function getName(): string { return $this->name; }
    public function isActive(): bool { return $this->isActive; }
}
```

---

### 2. Application Layer (Use Cases & Orchestration)

**Location:** `plugins/your-plugin/backend/src/Application/`

**Responsibilities:**
- Use case implementations
- Application workflows
- Transaction management
- Command/Query DTOs
- Input validation
- Business logic orchestration

**Rules:**
- ✅ Can use Domain layer
- ✅ Can use Repository interfaces
- ❌ NO direct database access
- ❌ NO Eloquent models
- ❌ NO HTTP concerns
- ✅ Framework-agnostic when possible

**Example Structure:**
```
Application/
├── UseCases/
│   ├── CreateContentTypeUseCase.php
│   ├── UpdateContentTypeUseCase.php
│   ├── DeleteContentTypeUseCase.php
│   └── ListContentTypesUseCase.php
├── Commands/
│   ├── CreateContentTypeCommand.php    # Write operation DTO
│   └── UpdateContentTypeCommand.php
└── Queries/
    └── ListContentTypesQuery.php       # Read operation DTO
```

**Example Use Case:**
```php
namespace Plugins\PagesEngine\Application\UseCases;

use Plugins\PagesEngine\Domain\Entities\ContentType;
use Plugins\PagesEngine\Domain\Repositories\ContentTypeRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\ContentTypeSlug;
use Plugins\PagesEngine\Application\Commands\CreateContentTypeCommand;

final class CreateContentTypeUseCase
{
    public function __construct(
        private readonly ContentTypeRepositoryInterface $repository
    ) {}
    
    public function execute(CreateContentTypeCommand $command): ContentType
    {
        // Validate business rules
        if ($this->repository->slugExists(
            new ContentTypeSlug($command->slug),
            $command->tenantId
        )) {
            throw new \DomainException('Slug already exists for this tenant');
        }
        
        // Create domain entity
        $contentType = new ContentType(
            id: new Uuid(\Illuminate\Support\Str::uuid()->toString()),
            tenantId: $command->tenantId,
            name: $command->name,
            slug: new ContentTypeSlug($command->slug),
            scope: $command->scope,
            isActive: true
        );
        
        // Save via repository
        $this->repository->save($contentType);
        
        // Return created entity
        return $contentType;
    }
}
```

**Example Command:**
```php
namespace Plugins\PagesEngine\Application\Commands;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final readonly class CreateContentTypeCommand
{
    public function __construct(
        public Uuid $tenantId,
        public string $name,
        public string $slug,
        public string $defaultUrlPattern,
        public string $scope,
        public ?string $description,
        public ?string $icon,
        public bool $isCommentable,
        public bool $isCategorizable,
        public bool $isTaggable,
        public bool $isRevisioned,
        public array $metadata
    ) {}
}
```

---

### 3. Infrastructure Layer (Technical Implementation)

**Location:** `plugins/your-plugin/backend/src/Infrastructure/`

**Responsibilities:**
- Repository implementations
- Eloquent models
- Database queries
- External service adapters
- UUID ↔ Integer ID translation
- Cache implementations
- File storage

**Rules:**
- ✅ Can use Laravel framework
- ✅ Implements Domain interfaces
- ✅ Handles UUID/ID conversion
- ✅ Database-specific code here
- ❌ NO business logic
- ❌ Only infrastructure concerns

**Example Structure:**
```
Infrastructure/
├── Persistence/
│   ├── Eloquent/
│   │   ├── ContentTypeEloquentModel.php      # Eloquent model
│   │   ├── CategoryEloquentModel.php
│   │   └── ContentEloquentModel.php
│   └── Repositories/
│       ├── ContentTypeEloquentRepository.php  # Implementation
│       ├── CategoryEloquentRepository.php
│       └── ContentEloquentRepository.php
└── Adapters/
    ├── EmailAdapter.php
    └── StorageAdapter.php
```

**Example Repository Implementation:**
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
    
    public function save(ContentType $contentType): void
    {
        $eloquentModel = $this->model
            ->where('uuid', $contentType->getId()->getValue())
            ->first();
        
        if ($eloquentModel) {
            $eloquentModel->update($this->mapToArray($contentType));
        } else {
            $this->model->create($this->mapToArray($contentType));
        }
    }
    
    // ============================================
    // UUID ↔ ID TRANSLATION LAYER (CRITICAL)
    // ============================================
    
    private function mapToEntity(ContentTypeEloquentModel $model): ContentType
    {
        // Convert integer tenant_id to UUID
        $tenantUuid = null;
        if ($model->tenant_id) {
            $tenant = DB::table('tenants')
                ->where('id', $model->tenant_id)
                ->first();
            $tenantUuid = $tenant ? new Uuid($tenant->uuid) : null;
        }
        
        return new ContentType(
            id: new Uuid($model->uuid),
            tenantId: $tenantUuid,  // UUID for domain
            name: $model->name,
            // ...
        );
    }
    
    private function mapToArray(ContentType $contentType): array
    {
        // Convert UUID to integer tenant_id
        $tenantId = null;
        if ($contentType->getTenantId()) {
            $tenant = DB::table('tenants')
                ->where('uuid', $contentType->getTenantId()->getValue())
                ->first();
            $tenantId = $tenant ? $tenant->id : null;
        }
        
        return [
            'uuid' => $contentType->getId()->getValue(),
            'tenant_id' => $tenantId,  // Integer for database
            'name' => $contentType->getName(),
            // ...
        ];
    }
}
```

---

### 4. Presentation Layer (HTTP/API)

**Location:** `plugins/your-plugin/backend/src/Http/`

**Responsibilities:**
- HTTP request handling
- Input validation
- Response formatting
- Authentication/Authorization
- API resource transformation

**Rules:**
- ✅ Calls Application layer use cases
- ✅ Validates HTTP input
- ✅ Returns HTTP responses
- ❌ NO business logic
- ❌ NO direct repository calls
- ✅ Only UUID exposure in API

**Example Structure:**
```
Http/
├── Controllers/
│   └── Admin/
│       ├── ContentTypeController.php
│       ├── CategoryController.php
│       └── ContentController.php
├── Requests/
│   ├── CreateContentTypeRequest.php    # Validation rules
│   └── UpdateContentTypeRequest.php
└── Resources/
    ├── ContentTypeResource.php         # API response format
    ├── CategoryResource.php
    └── ContentResource.php
```

**Example Controller:**
```php
namespace Plugins\PagesEngine\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Plugins\PagesEngine\Application\UseCases\CreateContentTypeUseCase;
use Plugins\PagesEngine\Application\Commands\CreateContentTypeCommand;
use Plugins\PagesEngine\Http\Requests\CreateContentTypeRequest;
use Plugins\PagesEngine\Http\Resources\ContentTypeResource;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

class ContentTypeController extends Controller
{
    public function __construct(
        private readonly CreateContentTypeUseCase $createUseCase
    ) {}
    
    public function store(CreateContentTypeRequest $request): JsonResponse
    {
        // Check authorization
        $this->authorize('pages:content-types:create');
        
        // Create command from validated input
        $command = new CreateContentTypeCommand(
            tenantId: new Uuid(auth()->user()->tenant->uuid),
            name: $request->input('name'),
            slug: $request->input('slug'),
            defaultUrlPattern: $request->input('default_url_pattern'),
            scope: $request->input('scope', 'tenant'),
            description: $request->input('description'),
            icon: $request->input('icon'),
            isCommentable: $request->boolean('is_commentable', false),
            isCategorizable: $request->boolean('is_categorizable', true),
            isTaggable: $request->boolean('is_taggable', true),
            isRevisioned: $request->boolean('is_revisioned', true),
            metadata: $request->input('metadata', [])
        );
        
        // Execute use case
        $contentType = $this->createUseCase->execute($command);
        
        // Return formatted response
        return response()->json([
            'success' => true,
            'data' => new ContentTypeResource($contentType),
            'message' => 'Content type created successfully',
        ], 201);
    }
}
```

**Example API Resource:**
```php
namespace Plugins\PagesEngine\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ContentTypeResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'uuid' => $this->id->getValue(),  // ✅ Only UUID exposed
            'tenant_id' => $this->tenantId?->getValue(),  // ✅ UUID
            'name' => $this->name,
            'slug' => $this->slug->getValue(),
            'is_active' => $this->isActive(),
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'updated_at' => $this->updatedAt->format('Y-m-d H:i:s'),
            // ❌ NO 'id' field (integer) exposed
        ];
    }
}
```

---

## DEPENDENCY FLOW

### Correct Dependency Direction

```
Presentation → Application → Domain ← Infrastructure
```

**Rules:**
- ✅ Outer layers depend on inner layers
- ✅ Domain layer has ZERO dependencies
- ✅ Infrastructure implements Domain interfaces
- ❌ Domain NEVER depends on Infrastructure
- ❌ Application NEVER depends on Presentation

### Dependency Injection

```php
// Service Provider binds interfaces to implementations
namespace Plugins\PagesEngine\Providers;

class PluginServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Bind repository interface to implementation
        $this->app->bind(
            ContentTypeRepositoryInterface::class,
            ContentTypeEloquentRepository::class
        );
        
        // Bind use cases (automatic constructor injection)
        $this->app->bind(CreateContentTypeUseCase::class);
    }
}
```

---

## BENEFITS OF HEXAGONAL ARCHITECTURE

### 1. Testability
```php
// Unit test Domain entity (no database needed)
class ContentTypeTest extends TestCase
{
    public function test_can_activate_content_type(): void
    {
        $contentType = new ContentType(/* ... */);
        
        $contentType->activate();
        
        $this->assertTrue($contentType->isActive());
    }
}

// Integration test Use Case (mock repository)
class CreateContentTypeUseCaseTest extends TestCase
{
    public function test_creates_content_type(): void
    {
        $mockRepo = $this->createMock(ContentTypeRepositoryInterface::class);
        $useCase = new CreateContentTypeUseCase($mockRepo);
        
        $mockRepo->expects($this->once())->method('save');
        
        $useCase->execute(new CreateContentTypeCommand(/* ... */));
    }
}
```

### 2. Framework Independence
```php
// Domain logic works without Laravel
// Can be ported to Symfony, Slim, or any framework
// Business logic remains unchanged
```

### 3. Easy Adapter Replacement
```php
// Can switch from Eloquent to Doctrine
$this->app->bind(
    ContentTypeRepositoryInterface::class,
    ContentTypeDoctrineRepository::class  // Different implementation
);

// Domain and Application layers unchanged
```

### 4. Clear Separation of Concerns
```
- Domain: WHAT (business rules)
- Application: HOW (workflows)
- Infrastructure: WITH WHAT (tools)
- Presentation: SHOW (UI/API)
```

---

## COMMON ANTI-PATTERNS

### ❌ Anti-Pattern 1: Business Logic in Controller
```php
// ❌ WRONG
class ContentTypeController extends Controller
{
    public function store(Request $request)
    {
        // Business logic in controller
        if (ContentType::where('slug', $request->slug)->exists()) {
            return response()->json(['error' => 'Slug exists'], 400);
        }
        
        $contentType = ContentType::create($request->all());
        
        return response()->json($contentType, 201);
    }
}
```

### ✅ Correct Pattern: Use Case with Domain Logic
```php
// ✅ CORRECT
class ContentTypeController extends Controller
{
    public function store(CreateContentTypeRequest $request)
    {
        $this->authorize('pages:content-types:create');
        
        // Delegate to use case
        $command = new CreateContentTypeCommand(/* ... */);
        $contentType = $this->createUseCase->execute($command);
        
        return response()->json(new ContentTypeResource($contentType), 201);
    }
}
```

### ❌ Anti-Pattern 2: Direct Database Queries in Domain
```php
// ❌ WRONG
class ContentType
{
    public function hasContent(): bool
    {
        // Database query in domain entity
        return DB::table('contents')
            ->where('content_type_id', $this->id)
            ->exists();
    }
}
```

### ✅ Correct Pattern: Use Repository
```php
// ✅ CORRECT
class ContentType
{
    // Pure domain logic only
    public function canBeDeleted(): bool
    {
        return $this->isActive === false;
    }
}

// Check in Use Case
class DeleteContentTypeUseCase
{
    public function execute(string $uuid, string $tenantUuid): void
    {
        $contentType = $this->repository->findById(new Uuid($uuid));
        
        // Use separate repository for content count
        $contentCount = $this->contentRepository->countByContentType($contentType->getId());
        
        if ($contentCount > 0) {
            throw new \DomainException('Cannot delete content type with existing content');
        }
        
        $this->repository->delete($contentType->getId());
    }
}
```

---

## SUMMARY

### Layer Checklist

#### Domain Layer
- [ ] Pure PHP objects
- [ ] No framework dependencies
- [ ] Business rules only
- [ ] Repository interfaces defined
- [ ] Value objects for type safety

#### Application Layer
- [ ] Use cases implement workflows
- [ ] Commands/Queries as DTOs
- [ ] Calls Domain repositories
- [ ] Transaction boundaries
- [ ] No HTTP concerns

#### Infrastructure Layer
- [ ] Implements Domain interfaces
- [ ] Eloquent models here
- [ ] UUID ↔ ID translation
- [ ] Database queries
- [ ] External service adapters

#### Presentation Layer
- [ ] HTTP controllers
- [ ] Input validation
- [ ] Authorization checks
- [ ] API resources (UUID only)
- [ ] Calls Application use cases

---

**Next:** [Multi-Tenant Architecture](./03-MULTI-TENANT.md)
