# 07 - BEST PRACTICES

**Version:** 1.0  
**Last Updated:** January 16, 2026  

---

## OVERVIEW

Comprehensive best practices for plugin development covering code organization, error handling, performance optimization, security, and maintainability.

---

## CODE ORGANIZATION

### Directory Structure Standards

```
plugins/your-plugin/
├── backend/
│   └── src/
│       ├── Domain/              # Pure business logic
│       │   ├── Entities/
│       │   ├── ValueObjects/
│       │   ├── Repositories/    # Interfaces only
│       │   └── Exceptions/
│       ├── Application/         # Use cases
│       │   ├── UseCases/
│       │   ├── Commands/
│       │   └── Queries/
│       ├── Infrastructure/      # Framework-specific
│       │   ├── Persistence/
│       │   │   ├── Eloquent/
│       │   │   └── Repositories/
│       │   ├── Http/
│       │   │   ├── Controllers/
│       │   │   ├── Requests/
│       │   │   ├── Resources/
│       │   │   └── Middleware/
│       │   └── Providers/
│       └── Presentation/        # UI layer
│           └── API/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/
│   └── api.php
├── tests/
│   ├── Unit/
│   ├── Integration/
│   └── Feature/
└── plugin.json
```

### Naming Conventions

#### Backend (PHP)

```php
// ✅ CORRECT Naming

// Entities (singular, PascalCase)
class ContentType { }
class Content { }
class Category { }

// Value Objects (PascalCase, descriptive)
class Uuid { }
class ContentSlug { }
class EditorFormat { }
class CommentStatus { }

// Repository Interfaces (PascalCase + RepositoryInterface suffix)
interface ContentTypeRepositoryInterface { }
interface ContentRepositoryInterface { }

// Repository Implementations (PascalCase + EloquentRepository suffix)
class ContentTypeEloquentRepository { }
class ContentEloquentRepository { }

// Use Cases (PascalCase + UseCase suffix, verb-first)
class CreateContentTypeUseCase { }
class UpdateContentUseCase { }
class DeleteCategoryUseCase { }

// Commands (PascalCase + Command suffix)
class CreateContentTypeCommand { }
class UpdateContentCommand { }

// Controllers (PascalCase + Controller suffix)
class ContentTypeController { }
class ContentController { }

// Requests (PascalCase + Request suffix)
class CreateContentTypeRequest { }
class UpdateContentRequest { }

// Resources (PascalCase + Resource suffix)
class ContentTypeResource { }
class ContentResource { }
```

#### Frontend (TypeScript/React)

```typescript
// ✅ CORRECT Naming

// Components (PascalCase)
ContentTypeList.tsx
ContentTypeForm.tsx
CategoryTree.tsx

// Types/Interfaces (PascalCase, descriptive)
interface ContentType { }
interface Content { }
interface Category { }

// Services (camelCase)
contentTypeService.ts
contentService.ts
categoryService.ts

// Utilities (camelCase)
formatDate.ts
validateSlug.ts
generateUrl.ts

// Constants (UPPER_SNAKE_CASE)
const API_BASE_URL = '...';
const MAX_FILE_SIZE = 5242880;
```

### File Organization Best Practices

1. **One Class Per File**: Each class in its own file
2. **Grouped Imports**: Group by external, framework, and internal
3. **Logical Ordering**: Public methods first, private methods last
4. **Consistent Formatting**: Use PSR-12 for PHP, Prettier for TypeScript

```php
<?php

namespace Plugins\PagesEngine\Application\UseCases;

// External dependencies
use Illuminate\Support\Facades\DB;

// Framework dependencies  
use Illuminate\Support\Str;

// Domain dependencies
use Plugins\PagesEngine\Domain\Entities\ContentType;
use Plugins\PagesEngine\Domain\Repositories\ContentTypeRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

class CreateContentTypeUseCase
{
    // Constructor first
    public function __construct(
        private ContentTypeRepositoryInterface $repository
    ) {}
    
    // Public methods
    public function execute(CreateContentTypeCommand $command): ContentType
    {
        // Implementation
    }
    
    // Private methods last
    private function validateSlug(string $slug): void
    {
        // Implementation
    }
}
```

---

## ERROR HANDLING

### Domain Exceptions

Create specific exceptions for domain errors:

```php
namespace Plugins\PagesEngine\Domain\Exceptions;

class ContentTypeNotFoundException extends \DomainException
{
    public static function withId(string $uuid): self
    {
        return new self("Content type with ID {$uuid} not found");
    }
}

class SlugAlreadyExistsException extends \DomainException
{
    public static function forSlug(string $slug, ?string $tenantId = null): self
    {
        $message = "Slug '{$slug}' already exists";
        if ($tenantId) {
            $message .= " for tenant {$tenantId}";
        }
        return new self($message);
    }
}

class InvalidContentStatusException extends \DomainException
{
    public static function forStatus(string $status): self
    {
        return new self("Invalid content status: {$status}");
    }
}
```

### Use Case Error Handling

```php
class CreateContentTypeUseCase
{
    public function execute(CreateContentTypeCommand $command): ContentType
    {
        try {
            // Validate slug uniqueness
            if ($this->repository->slugExists($command->slug, $command->tenantId)) {
                throw SlugAlreadyExistsException::forSlug(
                    $command->slug,
                    $command->tenantId->getValue()
                );
            }
            
            // Create entity
            $contentType = new ContentType(
                id: new Uuid(Str::uuid()->toString()),
                tenantId: $command->tenantId,
                name: $command->name,
                slug: new ContentTypeSlug($command->slug),
                // ...
            );
            
            // Save
            $this->repository->save($contentType);
            
            return $contentType;
            
        } catch (SlugAlreadyExistsException $e) {
            // Re-throw domain exceptions
            throw $e;
        } catch (\Exception $e) {
            // Log and wrap infrastructure exceptions
            \Log::error('Failed to create content type', [
                'command' => $command,
                'error' => $e->getMessage(),
            ]);
            
            throw new \RuntimeException(
                'Failed to create content type: ' . $e->getMessage(),
                0,
                $e
            );
        }
    }
}
```

### Controller Error Handling

```php
class ContentTypeController extends Controller
{
    public function store(CreateContentTypeRequest $request): JsonResponse
    {
        try {
            $this->authorize('pages:content-types:create');
            
            $command = new CreateContentTypeCommand(
                tenantId: new Uuid(auth()->user()->tenant->uuid),
                name: $request->input('name'),
                slug: $request->input('slug'),
                // ...
            );
            
            $contentType = $this->createContentTypeUseCase->execute($command);
            
            return response()->json([
                'data' => new ContentTypeResource($contentType),
                'message' => 'Content type created successfully',
            ], 201);
            
        } catch (SlugAlreadyExistsException $e) {
            return response()->json([
                'error' => 'Validation Failed',
                'message' => $e->getMessage(),
            ], 422);
            
        } catch (AuthorizationException $e) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => 'You do not have permission to create content types',
            ], 403);
            
        } catch (\Exception $e) {
            \Log::error('Content type creation failed', [
                'request' => $request->all(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'error' => 'Internal Server Error',
                'message' => 'Failed to create content type',
            ], 500);
        }
    }
}
```

### Frontend Error Handling

```typescript
// services/contentTypeService.ts
export const contentTypeService = {
  async create(data: CreateContentTypeData): Promise<ContentType> {
    try {
      const response = await apiClient.post('/api/pages-engine/content-types', data);
      return response.data.data;
    } catch (error) {
      if (error.response?.status === 422) {
        throw new ValidationError(error.response.data.message);
      }
      if (error.response?.status === 403) {
        throw new AuthorizationError('You do not have permission');
      }
      throw new ApiError('Failed to create content type');
    }
  }
};

// components/ContentTypeForm.tsx
const handleSubmit = async (data: FormData) => {
  try {
    setLoading(true);
    const contentType = await contentTypeService.create(data);
    toast.success('Content type created successfully');
    navigate('/content-types');
  } catch (error) {
    if (error instanceof ValidationError) {
      setError(error.message);
    } else if (error instanceof AuthorizationError) {
      toast.error('You do not have permission');
    } else {
      toast.error('An error occurred. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};
```

---

## PERFORMANCE OPTIMIZATION

### Database Query Optimization

#### Use Eager Loading

```php
// ❌ WRONG: N+1 Query Problem
public function index(): JsonResponse
{
    $contents = Content::all();  // 1 query
    
    foreach ($contents as $content) {
        $content->author;  // N queries
        $content->contentType;  // N queries
        $content->categories;  // N queries
    }
    
    return response()->json($contents);
}

// ✅ CORRECT: Eager Loading
public function index(): JsonResponse
{
    $contents = Content::with(['author', 'contentType', 'categories'])->get();  // 4 queries
    
    return response()->json($contents);
}
```

#### Use Select to Limit Columns

```php
// ❌ WRONG: Selecting all columns
$contents = Content::all();

// ✅ CORRECT: Select only needed columns
$contents = Content::select(['uuid', 'title', 'slug', 'status', 'created_at'])->get();
```

#### Use Database Indexes

```php
// Migration: Add indexes for frequently queried columns
Schema::create('canplug_pagen_contents', function (Blueprint $table) {
    $table->id();
    $table->uuid('uuid')->unique();
    $table->unsignedBigInteger('tenant_id');
    $table->string('slug');
    $table->string('status');
    
    // ✅ Add indexes
    $table->index('uuid');
    $table->index('tenant_id');
    $table->index('slug');
    $table->index('status');
    $table->index('created_at');
    $table->index(['tenant_id', 'slug']);  // Composite index
    $table->index(['tenant_id', 'status']);
});
```

### Caching Strategies

#### Cache Frequently Accessed Data

```php
use Illuminate\Support\Facades\Cache;

class ContentTypeEloquentRepository implements ContentTypeRepositoryInterface
{
    public function findByTenant(Uuid $tenantId): array
    {
        $cacheKey = "content_types:tenant:{$tenantId->getValue()}";
        
        return Cache::remember($cacheKey, 3600, function() use ($tenantId) {
            $tenant = DB::table('tenants')
                ->where('uuid', $tenantId->getValue())
                ->first();
            
            if (!$tenant) {
                return [];
            }
            
            $eloquentModels = $this->model
                ->where('tenant_id', $tenant->id)
                ->get();
            
            return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
        });
    }
    
    public function save(ContentType $contentType): void
    {
        $data = $this->mapToArray($contentType);
        
        $this->model->updateOrCreate(
            ['uuid' => $contentType->getId()->getValue()],
            $data
        );
        
        // ✅ Clear cache after save
        $cacheKey = "content_types:tenant:{$contentType->getTenantId()->getValue()}";
        Cache::forget($cacheKey);
    }
}
```

#### Cache Permission Checks

```php
// Already handled by Spatie Permission package
// But ensure cache is cleared when permissions change

use Spatie\Permission\PermissionRegistrar;

class PagesEnginePermissionSeeder extends Seeder
{
    public function run()
    {
        // Create permissions
        
        // ✅ Clear permission cache
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
```

### Frontend Performance

#### Code Splitting

```typescript
// ✅ CORRECT: Lazy load routes
import { lazy } from 'react';

const ContentTypeList = lazy(() => import('./pages/ContentTypeList'));
const ContentTypeForm = lazy(() => import('./pages/ContentTypeForm'));
const ContentList = lazy(() => import('./pages/ContentList'));

export const routes = [
  { path: '/content-types', element: <ContentTypeList /> },
  { path: '/content-types/create', element: <ContentTypeForm /> },
  { path: '/contents', element: <ContentList /> },
];
```

#### Memoization

```typescript
import { useMemo, useCallback } from 'react';

function ContentList({ contents }: Props) {
  // ✅ Memoize expensive computations
  const sortedContents = useMemo(() => {
    return contents.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [contents]);
  
  // ✅ Memoize callbacks
  const handleDelete = useCallback((id: string) => {
    contentService.delete(id);
  }, []);
  
  return (
    <div>
      {sortedContents.map(content => (
        <ContentCard key={content.uuid} content={content} onDelete={handleDelete} />
      ))}
    </div>
  );
}
```

---

## SECURITY BEST PRACTICES

### Input Validation

#### Backend Validation

```php
class CreateContentTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('pages:content-types:create');
    }
    
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'description' => ['nullable', 'string', 'max:1000'],
            'icon' => ['nullable', 'string', 'max:100'],
            'scope' => ['required', 'in:tenant,platform'],
            'is_commentable' => ['boolean'],
            'is_categorizable' => ['boolean'],
            'is_taggable' => ['boolean'],
        ];
    }
    
    public function messages(): array
    {
        return [
            'slug.regex' => 'Slug can only contain lowercase letters, numbers, and hyphens',
            'scope.in' => 'Scope must be either tenant or platform',
        ];
    }
}
```

#### Frontend Validation

```typescript
import { z } from 'zod';

const contentTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  description: z.string().max(1000).optional(),
  scope: z.enum(['tenant', 'platform']),
  isCommentable: z.boolean(),
});

type ContentTypeFormData = z.infer<typeof contentTypeSchema>;

function ContentTypeForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<ContentTypeFormData>({
    resolver: zodResolver(contentTypeSchema),
  });
  
  // Form implementation
}
```

### Authorization Checks

#### Multi-Layer Authorization

```php
// Layer 1: Middleware (routes/api.php)
Route::middleware(['auth:api', 'setPermissionsTeamId'])
    ->prefix('pages-engine')
    ->group(function () {
        Route::apiResource('content-types', ContentTypeController::class);
    });

// Layer 2: Controller
class ContentTypeController extends Controller
{
    public function store(CreateContentTypeRequest $request): JsonResponse
    {
        // Layer 3: Request authorization
        // Handled by CreateContentTypeRequest::authorize()
        
        // Layer 4: Explicit authorization
        $this->authorize('pages:content-types:create');
        
        // Layer 5: Tenant isolation in use case
        $command = new CreateContentTypeCommand(
            tenantId: new Uuid(auth()->user()->tenant->uuid),  // Force current tenant
            // ...
        );
        
        // Execute use case
    }
}
```

### SQL Injection Prevention

```php
// ✅ CORRECT: Always use parameter binding
$tenant = DB::table('tenants')
    ->where('uuid', $tenantId->getValue())  // Parameter binding
    ->first();

// ✅ CORRECT: Use Eloquent ORM
$contents = Content::where('status', $status)->get();

// ❌ WRONG: Raw SQL without binding
$contents = DB::select("SELECT * FROM contents WHERE status = '{$status}'");
```

### XSS Prevention

```php
// ✅ Backend: Always escape output
return response()->json([
    'title' => e($content->getTitle()),  // Escape HTML entities
    'content' => $content->getContent(),  // Store sanitized content
]);
```

```typescript
// ✅ Frontend: React automatically escapes
function ContentCard({ content }: Props) {
  return (
    <div>
      <h3>{content.title}</h3>  {/* Auto-escaped */}
      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.content) }} />
    </div>
  );
}
```

### CSRF Protection

```php
// ✅ Enabled by default for web routes
// API routes use token authentication (no CSRF needed)

// config/sanctum.php (if using Sanctum)
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,127.0.0.1')),
```

---

## TESTING BEST PRACTICES

### Test Coverage

Aim for high test coverage across all layers:

- **Domain Layer**: 90%+ coverage (pure business logic)
- **Application Layer**: 80%+ coverage (use cases)
- **Infrastructure Layer**: 70%+ coverage (repositories, controllers)

### Test Organization

```
tests/
├── Unit/
│   ├── Domain/
│   │   ├── Entities/
│   │   │   └── ContentTypeTest.php
│   │   └── ValueObjects/
│   │       └── UuidTest.php
│   └── Application/
│       └── UseCases/
│           └── CreateContentTypeUseCaseTest.php
├── Integration/
│   └── Repositories/
│       └── ContentTypeEloquentRepositoryTest.php
└── Feature/
    └── Api/
        ├── ContentTypeApiTest.php
        └── ContentApiTest.php
```

### Naming Conventions

```php
// ✅ CORRECT: Descriptive test method names
public function test_create_content_type_with_valid_data_succeeds()
public function test_create_content_type_with_duplicate_slug_throws_exception()
public function test_unauthorized_user_cannot_create_content_type()
public function test_find_by_tenant_returns_only_tenant_content_types()
public function test_uuid_to_integer_id_conversion_works_correctly()
```

---

## DOCUMENTATION STANDARDS

### Code Documentation

```php
/**
 * Create a new content type
 *
 * This use case handles the creation of a new content type within a tenant's scope.
 * It validates the slug uniqueness and applies business rules.
 *
 * @param CreateContentTypeCommand $command The command containing content type data
 * @return ContentType The created content type entity
 * @throws SlugAlreadyExistsException If the slug is already in use
 * @throws \RuntimeException If the creation fails
 */
public function execute(CreateContentTypeCommand $command): ContentType
{
    // Implementation
}
```

### API Documentation

Use OpenAPI/Swagger documentation:

```php
/**
 * @OA\Post(
 *     path="/api/pages-engine/content-types",
 *     summary="Create content type",
 *     tags={"Content Types"},
 *     security={{"bearerAuth":{}}},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"name","slug"},
 *             @OA\Property(property="name", type="string", example="Blog Post"),
 *             @OA\Property(property="slug", type="string", example="blog-post"),
 *         )
 *     ),
 *     @OA\Response(response=201, description="Content type created"),
 *     @OA\Response(response=422, description="Validation error"),
 *     @OA\Response(response=403, description="Forbidden")
 * )
 */
public function store(CreateContentTypeRequest $request): JsonResponse
```

---

## SUMMARY

**Key Best Practices:**

1. **Code Organization**: Follow hexagonal architecture, one class per file
2. **Naming**: Consistent conventions across backend and frontend
3. **Error Handling**: Domain exceptions, proper logging, graceful degradation
4. **Performance**: Eager loading, caching, database indexes, code splitting
5. **Security**: Multi-layer authorization, input validation, SQL injection prevention
6. **Testing**: High coverage, descriptive names, organized structure
7. **Documentation**: Clear docblocks, API documentation

**Golden Rules:**
- ✅ ALWAYS validate input at multiple layers
- ✅ ALWAYS check authorization before operations
- ✅ ALWAYS use UUID→ID conversion in repositories
- ✅ ALWAYS log errors with context
- ✅ ALWAYS write tests for critical paths
- ✅ NEVER expose integer IDs publicly
- ✅ NEVER use raw SQL without parameter binding
- ✅ NEVER commit code with failing tests
