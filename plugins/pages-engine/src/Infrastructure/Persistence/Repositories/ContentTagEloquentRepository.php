<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Infrastructure\Persistence\Repositories;

use Plugins\PagesEngine\Domain\Entities\ContentTag;
use Plugins\PagesEngine\Domain\Repositories\ContentTagRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\CategorySlug;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentTagEloquentModel;
use Illuminate\Support\Facades\DB;
use DateTime;

final class ContentTagEloquentRepository implements ContentTagRepositoryInterface
{
    public function __construct(
        private readonly ContentTagEloquentModel $model
    ) {}

    public function findById(Uuid $id): ?ContentTag
    {
        $eloquentModel = $this->model->where('uuid', $id->getValue())->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findBySlug(CategorySlug $slug, Uuid $tenantId): ?ContentTag
    {
        $eloquentModel = $this->model
            ->where('slug', $slug->getValue())
            ->where('tenant_id', $tenantId->getValue())
            ->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findByTenant(Uuid $tenantId): array
    {
        $eloquentModels = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->orderBy('name', 'asc')
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findByContent(Uuid $contentId): array
    {
        $eloquentModels = $this->model
            ->whereHas('contents', function($q) use ($contentId) {
                $q->where('canplug_pagen_contents.uuid', $contentId->getValue());
            })
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findPopular(Uuid $tenantId, int $limit = 20): array
    {
        $eloquentModels = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->orderBy('content_count', 'desc')
            ->limit($limit)
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function search(string $query, Uuid $tenantId): array
    {
        $eloquentModels = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('name', 'ILIKE', "%{$query}%")
            ->orderBy('content_count', 'desc')
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function save(ContentTag $tag): void
    {
        $eloquentModel = $this->model->where('uuid', $tag->getId()->getValue())->first();
        
        if ($eloquentModel) {
            $eloquentModel->update($this->mapToArray($tag));
        } else {
            $this->model->create($this->mapToArray($tag));
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

    public function slugExists(CategorySlug $slug, Uuid $tenantId, ?Uuid $excludeId = null): bool
    {
        $query = $this->model
            ->where('slug', $slug->getValue())
            ->where('tenant_id', $tenantId->getValue());
        
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

    public function attachToContent(Uuid $contentId, array $tagIds): void
    {
        $tagUuids = array_map(fn($id) => $id instanceof Uuid ? $id->getValue() : $id, $tagIds);
        
        DB::table('canplug_pagen_tag_pivot')->insert(
            array_map(fn($tagUuid) => [
                'content_id' => $contentId->getValue(),
                'tag_id' => $tagUuid,
                'created_at' => now(),
                'updated_at' => now(),
            ], $tagUuids)
        );
    }

    public function detachFromContent(Uuid $contentId, array $tagIds): void
    {
        $tagUuids = array_map(fn($id) => $id instanceof Uuid ? $id->getValue() : $id, $tagIds);
        
        DB::table('canplug_pagen_tag_pivot')
            ->where('content_id', $contentId->getValue())
            ->whereIn('tag_id', $tagUuids)
            ->delete();
    }

    public function syncWithContent(Uuid $contentId, array $tagIds): void
    {
        $tagUuids = array_map(fn($id) => $id instanceof Uuid ? $id->getValue() : $id, $tagIds);
        
        DB::table('canplug_pagen_tag_pivot')
            ->where('content_id', $contentId->getValue())
            ->delete();
        
        if (!empty($tagUuids)) {
            $this->attachToContent($contentId, $tagUuids);
        }
    }

    private function mapToEntity(ContentTagEloquentModel $model): ContentTag
    {
        return new ContentTag(
            id: new Uuid($model->uuid),
            tenantId: new Uuid($model->tenant_id),
            name: $model->name,
            slug: new CategorySlug($model->slug),
            description: $model->description,
            contentCount: $model->content_count,
            metadata: $model->metadata ?? [],
            createdAt: new DateTime($model->created_at->format('Y-m-d H:i:s')),
            updatedAt: new DateTime($model->updated_at->format('Y-m-d H:i:s'))
        );
    }

    private function mapToArray(ContentTag $tag): array
    {
        return [
            'uuid' => $tag->getId()->getValue(),
            'tenant_id' => $tag->getTenantId()->getValue(),
            'name' => $tag->getName(),
            'slug' => $tag->getSlug()->getValue(),
            'description' => $tag->getDescription(),
            'content_count' => $tag->getContentCount(),
            'metadata' => $tag->getMetadata(),
        ];
    }
}
