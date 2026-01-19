# GETTING STARTED - Plugin Development

**Version:** 1.0  
**Last Updated:** January 16, 2026  

---

## OVERVIEW

Panduan memulai pengembangan plugin baru untuk CanvaStencil Multi-Tenant CMS Platform.

---

## PREREQUISITES

### Required Knowledge
- Laravel 10+ (Hexagonal Architecture)
- PostgreSQL (Multi-schema tenancy)
- Domain-Driven Design (DDD)
- Repository Pattern
- Spatie Laravel Permission

### Development Environment
```bash
PHP >= 8.1
PostgreSQL >= 15
Composer >= 2.5
Node.js >= 18
npm >= 9
```

---

## PLUGIN STRUCTURE

### Standard Directory Layout

```
plugins/
└── your-plugin/
    ├── backend/
    │   ├── src/
    │   │   ├── Domain/
    │   │   │   ├── Entities/           # Domain entities (UUID-based)
    │   │   │   ├── ValueObjects/       # Value objects (Uuid, Slug, etc)
    │   │   │   ├── Repositories/       # Repository interfaces
    │   │   │   ├── Services/           # Domain services
    │   │   │   └── Events/             # Domain events
    │   │   ├── Application/
    │   │   │   ├── UseCases/           # Use case implementations
    │   │   │   ├── Commands/           # Command DTOs
    │   │   │   └── Queries/            # Query DTOs
    │   │   ├── Infrastructure/
    │   │   │   ├── Persistence/
    │   │   │   │   ├── Eloquent/       # Eloquent models (integer ID-based)
    │   │   │   │   └── Repositories/   # Repository implementations (UUID↔ID translation)
    │   │   │   └── Adapters/           # External service adapters
    │   │   ├── Http/
    │   │   │   ├── Controllers/        # API controllers
    │   │   │   ├── Requests/           # Form requests
    │   │   │   └── Resources/          # API resources (UUID exposure only)
    │   │   └── Providers/
    │   │       └── PluginServiceProvider.php
    │   ├── Database/
    │   │   ├── Migrations/
    │   │   └── Seeders/
    │   ├── routes/
    │   │   └── api.php
    │   └── composer.json
    ├── frontend/
    │   ├── src/
    │   │   ├── components/
    │   │   ├── pages/
    │   │   ├── hooks/
    │   │   └── services/
    │   └── package.json
    └── plugin.json                     # Plugin manifest
```

---

## CREATING A NEW PLUGIN

### Step 1: Initialize Plugin Structure

```bash
# Create plugin directory
mkdir -p plugins/your-plugin/backend/src/{Domain,Application,Infrastructure,Http}
mkdir -p plugins/your-plugin/backend/{Database,routes}
mkdir -p plugins/your-plugin/frontend/src

# Navigate to plugin directory
cd plugins/your-plugin
```

### Step 2: Create Plugin Manifest

**plugins/your-plugin/plugin.json**
```json
{
    "name": "your-plugin",
    "title": "Your Plugin Name",
    "description": "Plugin description",
    "version": "1.0.0",
    "author": "Your Name",
    "namespace": "Plugins\\YourPlugin",
    "providers": [
        "Plugins\\YourPlugin\\Providers\\PluginServiceProvider"
    ],
    "migrations": "Database/Migrations",
    "routes": {
        "api": "routes/api.php"
    },
    "dependencies": [],
    "autoload": {
        "psr-4": {
            "Plugins\\YourPlugin\\": "backend/src/"
        }
    }
}
```

### Step 3: Create Plugin Service Provider

**backend/src/Providers/PluginServiceProvider.php**
```php
<?php

namespace Plugins\YourPlugin\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class PluginServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Register repository bindings
        $this->app->bind(
            \Plugins\YourPlugin\Domain\Repositories\YourRepositoryInterface::class,
            \Plugins\YourPlugin\Infrastructure\Persistence\Repositories\YourEloquentRepository::class
        );
    }

    public function boot(): void
    {
        // Load migrations
        $this->loadMigrationsFrom(__DIR__ . '/../../Database/Migrations');
        
        // Load routes
        $this->loadRoutesFrom(__DIR__ . '/../../routes/api.php');
        
        // Publish configuration
        $this->publishes([
            __DIR__ . '/../../config/your-plugin.php' => config_path('your-plugin.php'),
        ], 'your-plugin-config');
        
        // Publish migrations
        $this->publishes([
            __DIR__ . '/../../Database/Migrations' => database_path('migrations'),
        ], 'your-plugin-migrations');
    }
}
```

### Step 4: Register Plugin in Main Application

**config/app.php**
```php
'providers' => [
    // ...
    Plugins\YourPlugin\Providers\PluginServiceProvider::class,
],
```

Or use auto-discovery in **composer.json**:
```json
{
    "extra": {
        "laravel": {
            "providers": [
                "Plugins\\YourPlugin\\Providers\\PluginServiceProvider"
            ]
        }
    }
}
```

---

## DATABASE SETUP

### Step 1: Create Migration

**Database/Migrations/YYYY_MM_DD_HHMMSS_create_your_plugin_tables.php**
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ✅ MANDATORY: Dual identifier columns
        Schema::create('canplug_yourplugin_entities', function (Blueprint $table) {
            $table->id();                                    // Internal database ID
            $table->uuid('uuid')->unique();                  // Public API identifier
            $table->unsignedBigInteger('tenant_id');         // Multi-tenant scoping
            
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // ✅ MANDATORY: Indexes for performance
            $table->index('uuid');
            $table->index('tenant_id');
            $table->index('slug');
            $table->index('created_at');
            
            // ✅ Foreign key to tenants table
            $table->foreign('tenant_id')
                  ->references('id')
                  ->on('tenants')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('canplug_yourplugin_entities');
    }
};
```

### Step 2: Run Migrations

```bash
php artisan migrate
```

---

## DOMAIN LAYER SETUP

### Step 1: Create Value Objects

**Domain/ValueObjects/Uuid.php**
```php
<?php

namespace Plugins\YourPlugin\Domain\ValueObjects;

final class Uuid
{
    private string $value;

    public function __construct(string $value)
    {
        if (!$this->isValid($value)) {
            throw new \InvalidArgumentException("Invalid UUID: {$value}");
        }
        
        $this->value = $value;
    }

    public function getValue(): string
    {
        return $this->value;
    }

    private function isValid(string $value): bool
    {
        return (bool) preg_match(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
            $value
        );
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
```

### Step 2: Create Domain Entity

**Domain/Entities/YourEntity.php**
```php
<?php

namespace Plugins\YourPlugin\Domain\Entities;

use Plugins\YourPlugin\Domain\ValueObjects\Uuid;
use DateTime;

class YourEntity
{
    public function __construct(
        private Uuid $id,
        private ?Uuid $tenantId,        // ✅ UUID for domain logic
        private string $name,
        private string $slug,
        private ?string $description,
        private bool $isActive,
        private array $metadata,
        private DateTime $createdAt,
        private DateTime $updatedAt,
        private ?DateTime $deletedAt = null
    ) {}

    // Getters
    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getTenantId(): ?Uuid
    {
        return $this->tenantId;
    }

    public function getName(): string
    {
        return $this->name;
    }

    // Business logic methods
    public function activate(): void
    {
        $this->isActive = true;
    }

    public function deactivate(): void
    {
        $this->isActive = false;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }
}
```

### Step 3: Create Repository Interface

**Domain/Repositories/YourRepositoryInterface.php**
```php
<?php

namespace Plugins\YourPlugin\Domain\Repositories;

use Plugins\YourPlugin\Domain\Entities\YourEntity;
use Plugins\YourPlugin\Domain\ValueObjects\Uuid;

interface YourRepositoryInterface
{
    public function findById(Uuid $id): ?YourEntity;
    
    public function findByTenant(Uuid $tenantId): array;
    
    public function save(YourEntity $entity): void;
    
    public function delete(Uuid $id): void;
    
    public function exists(Uuid $id): bool;
}
```

---

## INFRASTRUCTURE LAYER SETUP

### Step 1: Create Eloquent Model

**Infrastructure/Persistence/Eloquent/YourEntityEloquentModel.php**
```php
<?php

namespace Plugins\YourPlugin\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class YourEntityEloquentModel extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'canplug_yourplugin_entities';

    protected $fillable = [
        'uuid',
        'tenant_id',        // ✅ Integer for database
        'name',
        'slug',
        'description',
        'is_active',
        'metadata',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
}
```

### Step 2: Create Repository Implementation

**Infrastructure/Persistence/Repositories/YourEloquentRepository.php**
```php
<?php

namespace Plugins\YourPlugin\Infrastructure\Persistence\Repositories;

use Plugins\YourPlugin\Domain\Entities\YourEntity;
use Plugins\YourPlugin\Domain\Repositories\YourRepositoryInterface;
use Plugins\YourPlugin\Domain\ValueObjects\Uuid;
use Plugins\YourPlugin\Infrastructure\Persistence\Eloquent\YourEntityEloquentModel;
use Illuminate\Support\Facades\DB;
use DateTime;

final class YourEloquentRepository implements YourRepositoryInterface
{
    public function __construct(
        private readonly YourEntityEloquentModel $model
    ) {}

    public function findById(Uuid $id): ?YourEntity
    {
        $eloquentModel = $this->model->where('uuid', $id->getValue())->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findByTenant(Uuid $tenantId): array
    {
        // ✅ CRITICAL: Convert UUID to integer ID
        $tenant = DB::table('tenants')
            ->where('uuid', $tenantId->getValue())
            ->first();
        
        if (!$tenant) {
            return [];
        }
        
        $eloquentModels = $this->model
            ->where('tenant_id', $tenant->id)  // Use integer ID
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function save(YourEntity $entity): void
    {
        $eloquentModel = $this->model->where('uuid', $entity->getId()->getValue())->first();
        
        if ($eloquentModel) {
            $eloquentModel->update($this->mapToArray($entity));
        } else {
            $this->model->create($this->mapToArray($entity));
        }
    }

    public function delete(Uuid $id): void
    {
        $this->model->where('uuid', $id->getValue())->delete();
    }

    public function exists(Uuid $id): bool
    {
        return $this->model->where('uuid', $id->getValue())->exists();
    }

    // ============================================
    // PRIVATE MAPPING METHODS (TRANSLATION LAYER)
    // ============================================

    private function mapToEntity(YourEntityEloquentModel $model): YourEntity
    {
        // ✅ Convert integer ID to UUID
        $tenantUuid = null;
        if ($model->tenant_id) {
            $tenant = DB::table('tenants')
                ->where('id', $model->tenant_id)
                ->first();
            $tenantUuid = $tenant ? new Uuid($tenant->uuid) : null;
        }
        
        return new YourEntity(
            id: new Uuid($model->uuid),
            tenantId: $tenantUuid,  // UUID for domain
            name: $model->name,
            slug: $model->slug,
            description: $model->description,
            isActive: $model->is_active,
            metadata: $model->metadata ?? [],
            createdAt: new DateTime($model->created_at->format('Y-m-d H:i:s')),
            updatedAt: new DateTime($model->updated_at->format('Y-m-d H:i:s')),
            deletedAt: $model->deleted_at ? new DateTime($model->deleted_at->format('Y-m-d H:i:s')) : null
        );
    }

    private function mapToArray(YourEntity $entity): array
    {
        // ✅ Convert UUID to integer ID
        $tenantId = null;
        if ($entity->getTenantId()) {
            $tenant = DB::table('tenants')
                ->where('uuid', $entity->getTenantId()->getValue())
                ->first();
            $tenantId = $tenant ? $tenant->id : null;
        }
        
        return [
            'uuid' => $entity->getId()->getValue(),
            'tenant_id' => $tenantId,  // Integer for database
            'name' => $entity->getName(),
            'slug' => $entity->getSlug(),
            'description' => $entity->getDescription(),
            'is_active' => $entity->isActive(),
            'metadata' => $entity->getMetadata(),
        ];
    }
}
```

---

## APPLICATION LAYER SETUP

### Create Use Case

**Application/UseCases/CreateYourEntityUseCase.php**
```php
<?php

namespace Plugins\YourPlugin\Application\UseCases;

use Plugins\YourPlugin\Domain\Entities\YourEntity;
use Plugins\YourPlugin\Domain\Repositories\YourRepositoryInterface;
use Plugins\YourPlugin\Domain\ValueObjects\Uuid;
use Plugins\YourPlugin\Application\Commands\CreateYourEntityCommand;

final class CreateYourEntityUseCase
{
    public function __construct(
        private readonly YourRepositoryInterface $repository
    ) {}

    public function execute(CreateYourEntityCommand $command): YourEntity
    {
        $entity = new YourEntity(
            id: new Uuid(\Illuminate\Support\Str::uuid()->toString()),
            tenantId: $command->tenantId,
            name: $command->name,
            slug: $command->slug,
            description: $command->description,
            isActive: true,
            metadata: $command->metadata ?? [],
            createdAt: new \DateTime(),
            updatedAt: new \DateTime()
        );

        $this->repository->save($entity);

        return $entity;
    }
}
```

---

## NEXT STEPS

1. **Read [Architecture](./02-ARCHITECTURE.md)** - Understand Hexagonal Architecture patterns
2. **Study [Multi-Tenant](./03-MULTI-TENANT.md)** - CRITICAL UUID/ID conversion pattern
3. **Configure [Authorization](./04-AUTHORIZATION.md)** - Setup permissions
4. **Implement [Repository Pattern](./05-REPOSITORY-PATTERN.md)** - Complete repository implementation
5. **Review [Common Pitfalls](./06-COMMON-PITFALLS.md)** - Avoid common mistakes

---

**Next:** [Plugin Architecture](./02-ARCHITECTURE.md)
