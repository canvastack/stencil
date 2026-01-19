<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Infrastructure\Persistence\Repositories;

use Plugins\PagesEngine\Domain\Entities\ContentType;
use Plugins\PagesEngine\Domain\Repositories\ContentTypeRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\ContentTypeSlug;
use Plugins\PagesEngine\Domain\ValueObjects\UrlPattern;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentTypeEloquentModel;
use DateTime;

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

    public function findBySlug(ContentTypeSlug $slug, ?Uuid $tenantId = null): ?ContentType
    {
        $query = $this->model->where('slug', $slug->getValue());
        
        if ($tenantId) {
            // Convert tenant UUID to ID
            $tenant = \Illuminate\Support\Facades\DB::table('tenants')
                ->where('uuid', $tenantId->getValue())
                ->first();
            
            if ($tenant) {
                $query->where('tenant_id', $tenant->id);
            }
        }
        
        $eloquentModel = $query->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findByTenant(Uuid $tenantId): array
    {
        // Convert tenant UUID to ID by querying tenants table
        $tenant = \Illuminate\Support\Facades\DB::table('tenants')
            ->where('uuid', $tenantId->getValue())
            ->first();
        
        if (!$tenant) {
            return [];
        }
        
        $eloquentModels = $this->model
            ->where('tenant_id', $tenant->id)
            ->where('scope', 'tenant')
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findPlatformContentTypes(): array
    {
        $eloquentModels = $this->model
            ->where('scope', 'platform')
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findAll(): array
    {
        $eloquentModels = $this->model->all();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findActive(): array
    {
        $eloquentModels = $this->model
            ->where('is_active', true)
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

    public function delete(Uuid $id): void
    {
        $this->model->where('uuid', $id->getValue())->delete();
    }

    public function exists(Uuid $id): bool
    {
        return $this->model->where('uuid', $id->getValue())->exists();
    }

    public function slugExists(ContentTypeSlug $slug, ?Uuid $tenantId = null, ?Uuid $excludeId = null): bool
    {
        $query = $this->model->where('slug', $slug->getValue());
        
        if ($tenantId) {
            $tenant = \Illuminate\Support\Facades\DB::table('tenants')
                ->where('uuid', $tenantId->getValue())
                ->first();
            
            if ($tenant) {
                $query->where('tenant_id', $tenant->id);
            }
        }
        
        if ($excludeId) {
            $query->where('uuid', '!=', $excludeId->getValue());
        }
        
        return $query->exists();
    }

    private function mapToEntity(ContentTypeEloquentModel $model): ContentType
    {
        $tenantUuid = null;
        if ($model->tenant_id) {
            $tenant = \Illuminate\Support\Facades\DB::table('tenants')
                ->where('id', $model->tenant_id)
                ->first();
            $tenantUuid = $tenant ? new Uuid($tenant->uuid) : null;
        }
        
        return new ContentType(
            id: new Uuid($model->uuid),
            tenantId: $tenantUuid,
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

    private function mapToArray(ContentType $contentType): array
    {
        $tenantId = null;
        if ($contentType->getTenantId()) {
            $tenant = \Illuminate\Support\Facades\DB::table('tenants')
                ->where('uuid', $contentType->getTenantId()->getValue())
                ->first();
            $tenantId = $tenant ? $tenant->id : null;
        }
        
        return [
            'uuid' => $contentType->getId()->getValue(),
            'tenant_id' => $tenantId,
            'name' => $contentType->getName(),
            'slug' => $contentType->getSlug()->getValue(),
            'description' => $contentType->getDescription(),
            'icon' => $contentType->getIcon(),
            'default_url_pattern' => $contentType->getDefaultUrlPattern()->getPattern(),
            'is_commentable' => $contentType->allowsComments(),
            'is_categorizable' => $contentType->allowsCategories(),
            'is_taggable' => $contentType->allowsTags(),
            'is_revisioned' => $contentType->supportsRevisions(),
            'scope' => $contentType->getScope(),
            'is_active' => $contentType->isActive(),
            'metadata' => $contentType->getMetadata(),
        ];
    }
}
