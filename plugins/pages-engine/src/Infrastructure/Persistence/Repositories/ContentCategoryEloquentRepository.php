<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Infrastructure\Persistence\Repositories;

use Plugins\PagesEngine\Domain\Entities\ContentCategory;
use Plugins\PagesEngine\Domain\Repositories\ContentCategoryRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\CategorySlug;
use Plugins\PagesEngine\Domain\ValueObjects\CategoryPath;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentCategoryEloquentModel;
use DateTime;

final class ContentCategoryEloquentRepository implements ContentCategoryRepositoryInterface
{
    public function __construct(
        private readonly ContentCategoryEloquentModel $model
    ) {}

    public function findById(Uuid $id): ?ContentCategory
    {
        $eloquentModel = $this->model->where('uuid', $id->getValue())->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findBySlug(CategorySlug $slug, Uuid $tenantId, Uuid $contentTypeId): ?ContentCategory
    {
        $eloquentModel = $this->model
            ->where('slug', $slug->getValue())
            ->where('tenant_id', $tenantId->getValue())
            ->where('content_type_id', $contentTypeId->getValue())
            ->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findByTenant(Uuid $tenantId, ?Uuid $contentTypeId = null): array
    {
        $query = $this->model->where('tenant_id', $tenantId->getValue());
        
        if ($contentTypeId) {
            $query->where('content_type_id', $contentTypeId->getValue());
        }
        
        $eloquentModels = $query->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findByContentType(Uuid $contentTypeId): array
    {
        $eloquentModels = $this->model
            ->where('content_type_id', $contentTypeId->getValue())
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findRootCategories(Uuid $tenantId, Uuid $contentTypeId): array
    {
        $eloquentModels = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('content_type_id', $contentTypeId->getValue())
            ->whereNull('parent_id')
            ->orderBy('sort_order', 'asc')
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findChildren(Uuid $parentId): array
    {
        $eloquentModels = $this->model
            ->where('parent_id', $parentId->getValue())
            ->orderBy('sort_order', 'asc')
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findByParent(?Uuid $parentId, Uuid $tenantId, Uuid $contentTypeId): array
    {
        $query = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('content_type_id', $contentTypeId->getValue());
        
        if ($parentId) {
            $query->where('parent_id', $parentId->getValue());
        } else {
            $query->whereNull('parent_id');
        }
        
        $eloquentModels = $query->orderBy('sort_order', 'asc')->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findActive(Uuid $tenantId): array
    {
        $eloquentModels = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('is_active', true)
            ->orderBy('sort_order', 'asc')
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findTree(Uuid $tenantId, Uuid $contentTypeId): array
    {
        $eloquentModels = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('content_type_id', $contentTypeId->getValue())
            ->orderBy('path', 'asc')
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function save(ContentCategory $category): void
    {
        $eloquentModel = $this->model->where('uuid', $category->getId()->getValue())->first();
        
        if ($eloquentModel) {
            $eloquentModel->update($this->mapToArray($category));
        } else {
            $this->model->create($this->mapToArray($category));
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

    public function slugExists(
        CategorySlug $slug,
        Uuid $tenantId,
        Uuid $contentTypeId,
        ?Uuid $parentId = null,
        ?Uuid $excludeId = null
    ): bool {
        $query = $this->model
            ->where('slug', $slug->getValue())
            ->where('tenant_id', $tenantId->getValue())
            ->where('content_type_id', $contentTypeId->getValue());
        
        if ($parentId) {
            $query->where('parent_id', $parentId->getValue());
        } else {
            $query->whereNull('parent_id');
        }
        
        if ($excludeId) {
            $query->where('uuid', '!=', $excludeId->getValue());
        }
        
        return $query->exists();
    }

    public function incrementContentCount(Uuid $id): void
    {
        $this->model->where('uuid', $id->getValue())->increment('content_count');
    }

    public function decrementContentCount(Uuid $id): void
    {
        $this->model->where('uuid', $id->getValue())->decrement('content_count');
    }

    private function mapToEntity(ContentCategoryEloquentModel $model): ContentCategory
    {
        return new ContentCategory(
            id: new Uuid($model->uuid),
            tenantId: new Uuid($model->tenant_id),
            contentTypeId: new Uuid($model->content_type_id),
            name: $model->name,
            slug: new CategorySlug($model->slug),
            path: new CategoryPath($model->path ?? '/'),
            parentId: $model->parent_id ? new Uuid($model->parent_id) : null,
            level: $model->level,
            description: $model->description,
            featuredImageId: $model->featured_image_id,
            seoTitle: $model->seo_title,
            seoDescription: $model->seo_description,
            sortOrder: $model->sort_order,
            contentCount: $model->content_count,
            isActive: $model->is_active,
            metadata: $model->metadata ?? [],
            createdAt: new DateTime($model->created_at->format('Y-m-d H:i:s')),
            updatedAt: new DateTime($model->updated_at->format('Y-m-d H:i:s'))
        );
    }

    private function mapToArray(ContentCategory $category): array
    {
        return [
            'uuid' => $category->getId()->getValue(),
            'tenant_id' => $category->getTenantId()->getValue(),
            'content_type_id' => $category->getContentTypeId()->getValue(),
            'parent_id' => $category->getParentId()?->getValue(),
            'name' => $category->getName(),
            'slug' => $category->getSlug()->getValue(),
            'description' => $category->getDescription(),
            'path' => $category->getPath()->getValue(),
            'level' => $category->getLevel(),
            'featured_image_id' => $category->getFeaturedImageId(),
            'seo_title' => $category->getSeoTitle(),
            'seo_description' => $category->getSeoDescription(),
            'sort_order' => $category->getSortOrder(),
            'content_count' => $category->getContentCount(),
            'is_active' => $category->isActive(),
            'metadata' => $category->getMetadata(),
        ];
    }
}
