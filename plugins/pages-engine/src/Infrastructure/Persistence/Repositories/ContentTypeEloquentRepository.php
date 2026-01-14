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
            $query->where('tenant_id', $tenantId->getValue());
        }
        
        $eloquentModel = $query->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findByTenant(Uuid $tenantId): array
    {
        $eloquentModels = $this->model
            ->where('tenant_id', $tenantId->getValue())
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
            $query->where('tenant_id', $tenantId->getValue());
        }
        
        if ($excludeId) {
            $query->where('uuid', '!=', $excludeId->getValue());
        }
        
        return $query->exists();
    }

    private function mapToEntity(ContentTypeEloquentModel $model): ContentType
    {
        return new ContentType(
            id: new Uuid($model->uuid),
            tenantId: $model->tenant_id ? new Uuid($model->tenant_id) : null,
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
        return [
            'uuid' => $contentType->getId()->getValue(),
            'tenant_id' => $contentType->getTenantId()?->getValue(),
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
