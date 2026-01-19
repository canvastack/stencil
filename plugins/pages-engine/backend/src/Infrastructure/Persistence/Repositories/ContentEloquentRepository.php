<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Infrastructure\Persistence\Repositories;

use Plugins\PagesEngine\Domain\Entities\Content;
use Plugins\PagesEngine\Domain\Repositories\ContentRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\ContentSlug;
use Plugins\PagesEngine\Domain\ValueObjects\ContentStatus;
use Plugins\PagesEngine\Domain\ValueObjects\EditorFormat;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentEloquentModel;
use DateTime;

final class ContentEloquentRepository implements ContentRepositoryInterface
{
    public function __construct(
        private readonly ContentEloquentModel $model
    ) {}

    public function findById(Uuid $id): ?Content
    {
        $eloquentModel = $this->model->where('uuid', $id->getValue())->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findBySlug(ContentSlug $slug, Uuid $tenantId): ?Content
    {
        $tenant = \Illuminate\Support\Facades\DB::table('tenants')
            ->where('uuid', $tenantId->getValue())
            ->first();
        
        if (!$tenant) {
            return null;
        }
        
        $eloquentModel = $this->model
            ->where('slug', $slug->getValue())
            ->where('tenant_id', $tenant->id)
            ->whereNull('deleted_at')
            ->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findByCustomUrl(string $url, Uuid $tenantId): ?Content
    {
        $tenant = \Illuminate\Support\Facades\DB::table('tenants')
            ->where('uuid', $tenantId->getValue())
            ->first();
        
        if (!$tenant) {
            return null;
        }
        
        $eloquentModel = $this->model
            ->where('custom_url', $url)
            ->where('tenant_id', $tenant->id)
            ->whereNull('deleted_at')
            ->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findByTenant(Uuid $tenantId, array $filters = []): array
    {
        $tenant = \Illuminate\Support\Facades\DB::table('tenants')
            ->where('uuid', $tenantId->getValue())
            ->first();
        
        if (!$tenant) {
            return [];
        }
        
        $query = $this->model->where('tenant_id', $tenant->id);
        
        $this->applyFilters($query, $filters);
        
        $eloquentModels = $query->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findByContentType(Uuid $contentTypeId, array $filters = []): array
    {
        $query = $this->model->where('content_type_id', $contentTypeId->getValue());
        
        $this->applyFilters($query, $filters);
        
        $eloquentModels = $query->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findByCategory(Uuid $categoryId, array $filters = []): array
    {
        $query = $this->model->whereHas('categories', function($q) use ($categoryId) {
            $q->where('canplug_pagen_categories.uuid', $categoryId->getValue());
        });
        
        $this->applyFilters($query, $filters);
        
        $eloquentModels = $query->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findByAuthor(Uuid $authorId, array $filters = []): array
    {
        $query = $this->model->where('author_id', $authorId->getValue());
        
        $this->applyFilters($query, $filters);
        
        $eloquentModels = $query->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findByStatus(ContentStatus $status, Uuid $tenantId): array
    {
        $tenant = \Illuminate\Support\Facades\DB::table('tenants')
            ->where('uuid', $tenantId->getValue())
            ->first();
        
        if (!$tenant) {
            return [];
        }
        
        $eloquentModels = $this->model
            ->where('status', $status->getValue())
            ->where('tenant_id', $tenant->id)
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findPublished(Uuid $tenantId, array $filters = []): array
    {
        $tenant = \Illuminate\Support\Facades\DB::table('tenants')
            ->where('uuid', $tenantId->getValue())
            ->first();
        
        if (!$tenant) {
            return [];
        }
        
        $query = $this->model
            ->where('tenant_id', $tenant->id)
            ->where('status', 'published')
            ->where('published_at', '<=', now());
        
        $this->applyFilters($query, $filters);
        
        $eloquentModels = $query->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findScheduledForPublishing(DateTime $before): array
    {
        $eloquentModels = $this->model
            ->where('status', 'scheduled')
            ->where('scheduled_publish_at', '<=', $before)
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findFeatured(Uuid $tenantId, int $limit = 10): array
    {
        $tenant = \Illuminate\Support\Facades\DB::table('tenants')
            ->where('uuid', $tenantId->getValue())
            ->first();
        
        if (!$tenant) {
            return [];
        }
        
        $eloquentModels = $this->model
            ->where('tenant_id', $tenant->id)
            ->where('is_featured', true)
            ->where('status', 'published')
            ->where('published_at', '<=', now())
            ->orderBy('published_at', 'desc')
            ->limit($limit)
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function search(string $query, Uuid $tenantId, array $filters = []): array
    {
        $tenant = \Illuminate\Support\Facades\DB::table('tenants')
            ->where('uuid', $tenantId->getValue())
            ->first();
        
        if (!$tenant) {
            return [];
        }
        
        $eloquentModels = $this->model
            ->where('tenant_id', $tenant->id)
            ->where(function($q) use ($query) {
                $q->where('title', 'ILIKE', "%{$query}%")
                  ->orWhere('excerpt', 'ILIKE', "%{$query}%");
            })
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function save(Content $content): void
    {
        $eloquentModel = $this->model->where('uuid', $content->getId()->getValue())->first();
        
        if ($eloquentModel) {
            $eloquentModel->update($this->mapToArray($content));
        } else {
            $this->model->create($this->mapToArray($content));
        }
    }

    public function delete(Uuid $id): void
    {
        $this->model->where('uuid', $id->getValue())->delete();
    }

    public function softDelete(Uuid $id): void
    {
        $eloquentModel = $this->model->where('uuid', $id->getValue())->first();
        if ($eloquentModel) {
            $eloquentModel->delete();
        }
    }

    public function restore(Uuid $id): void
    {
        $this->model->where('uuid', $id->getValue())->restore();
    }

    public function exists(Uuid $id): bool
    {
        return $this->model->where('uuid', $id->getValue())->exists();
    }

    public function slugExists(ContentSlug $slug, Uuid $tenantId, ?Uuid $excludeId = null): bool
    {
        $tenant = \Illuminate\Support\Facades\DB::table('tenants')
            ->where('uuid', $tenantId->getValue())
            ->first();
        
        if (!$tenant) {
            return false;
        }
        
        $query = $this->model
            ->where('slug', $slug->getValue())
            ->where('tenant_id', $tenant->id)
            ->whereNull('deleted_at');
        
        if ($excludeId) {
            $query->where('uuid', '!=', $excludeId->getValue());
        }
        
        return $query->exists();
    }

    public function customUrlExists(string $url, Uuid $tenantId, ?Uuid $excludeId = null): bool
    {
        $tenant = \Illuminate\Support\Facades\DB::table('tenants')
            ->where('uuid', $tenantId->getValue())
            ->first();
        
        if (!$tenant) {
            return false;
        }
        
        $query = $this->model
            ->where('custom_url', $url)
            ->where('tenant_id', $tenant->id)
            ->whereNull('deleted_at');
        
        if ($excludeId) {
            $query->where('uuid', '!=', $excludeId->getValue());
        }
        
        return $query->exists();
    }

    public function incrementViewCount(Uuid $id): void
    {
        $this->model->where('uuid', $id->getValue())->increment('view_count');
    }

    public function countByContentType(Uuid $contentTypeId): int
    {
        return $this->model->where('content_type_id', $contentTypeId->getValue())->count();
    }

    private function applyFilters($query, array $filters): void
    {
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        if (isset($filters['limit'])) {
            $query->limit($filters['limit']);
        }
        
        if (isset($filters['offset'])) {
            $query->offset($filters['offset']);
        }
        
        if (isset($filters['order_by'])) {
            $direction = $filters['order_direction'] ?? 'desc';
            $query->orderBy($filters['order_by'], $direction);
        }
    }

    private function mapToEntity(ContentEloquentModel $model): Content
    {
        $tenantUuid = null;
        if ($model->tenant_id) {
            $tenant = \Illuminate\Support\Facades\DB::table('tenants')
                ->where('id', $model->tenant_id)
                ->first();
            $tenantUuid = $tenant ? $tenant->uuid : null;
        }
        
        return new Content(
            id: new Uuid($model->uuid),
            tenantId: $tenantUuid ? new Uuid($tenantUuid) : null,
            contentTypeId: new Uuid($model->content_type_id),
            authorId: new Uuid($model->author_id),
            title: $model->title,
            slug: new ContentSlug($model->slug),
            content: $model->content,
            excerpt: $model->excerpt,
            contentFormat: new EditorFormat($model->content_format),
            featuredImageId: $model->featured_image_id ? new Uuid($model->featured_image_id) : null,
            status: new ContentStatus($model->status),
            publishedAt: $model->published_at ? new DateTime($model->published_at->format('Y-m-d H:i:s')) : null,
            scheduledPublishAt: $model->scheduled_publish_at ? new DateTime($model->scheduled_publish_at->format('Y-m-d H:i:s')) : null,
            customUrl: $model->custom_url,
            seoTitle: $model->seo_title,
            seoDescription: $model->seo_description,
            seoKeywords: $model->seo_keywords,
            canonicalUrl: $model->canonical_url,
            viewCount: $model->view_count,
            commentCount: $model->comment_count,
            isFeatured: $model->is_featured,
            isPinned: $model->is_pinned,
            isCommentable: $model->is_commentable,
            sortOrder: $model->sort_order,
            metadata: $model->metadata ?? [],
            createdAt: new DateTime($model->created_at->format('Y-m-d H:i:s')),
            updatedAt: new DateTime($model->updated_at->format('Y-m-d H:i:s')),
            deletedAt: $model->deleted_at ? new DateTime($model->deleted_at->format('Y-m-d H:i:s')) : null
        );
    }

    private function mapToArray(Content $content): array
    {
        $tenantId = null;
        if ($content->getTenantId()) {
            $tenant = \Illuminate\Support\Facades\DB::table('tenants')
                ->where('uuid', $content->getTenantId()->getValue())
                ->first();
            $tenantId = $tenant ? $tenant->id : null;
        }
        
        return [
            'uuid' => $content->getId()->getValue(),
            'tenant_id' => $tenantId,
            'content_type_id' => $content->getContentTypeId()->getValue(),
            'author_id' => $content->getAuthorId()->getValue(),
            'title' => $content->getTitle(),
            'slug' => $content->getSlug()->getValue(),
            'excerpt' => $content->getExcerpt(),
            'content' => $content->getContent(),
            'content_format' => $content->getContentFormat()->getValue(),
            'featured_image_id' => $content->getFeaturedImageId()?->getValue(),
            'status' => $content->getStatus()->getValue(),
            'published_at' => $content->getPublishedAt()?->format('Y-m-d H:i:s'),
            'scheduled_publish_at' => $content->getScheduledPublishAt()?->format('Y-m-d H:i:s'),
            'custom_url' => $content->getCustomUrl(),
            'seo_title' => $content->getSeoTitle(),
            'seo_description' => $content->getSeoDescription(),
            'seo_keywords' => $content->getSeoKeywords(),
            'canonical_url' => $content->getCanonicalUrl(),
            'view_count' => $content->getViewCount(),
            'comment_count' => $content->getCommentCount(),
            'is_featured' => $content->isFeatured(),
            'is_pinned' => $content->isPinned(),
            'is_commentable' => $content->isCommentable(),
            'sort_order' => $content->getSortOrder(),
            'metadata' => $content->getMetadata(),
        ];
    }
}
