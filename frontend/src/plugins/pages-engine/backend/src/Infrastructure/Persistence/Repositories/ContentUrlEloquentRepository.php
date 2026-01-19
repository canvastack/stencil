<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Infrastructure\Persistence\Repositories;

use Plugins\PagesEngine\Domain\Entities\ContentUrl;
use Plugins\PagesEngine\Domain\Repositories\ContentUrlRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentUrlEloquentModel;
use DateTime;

final class ContentUrlEloquentRepository implements ContentUrlRepositoryInterface
{
    public function __construct(
        private readonly ContentUrlEloquentModel $model
    ) {}

    public function findById(Uuid $id): ?ContentUrl
    {
        $eloquentModel = $this->model->where('uuid', $id->getValue())->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findByOldUrl(string $oldUrl, Uuid $tenantId): ?ContentUrl
    {
        $eloquentModel = $this->model
            ->where('old_url', $oldUrl)
            ->where('tenant_id', $tenantId->getValue())
            ->where('is_active', true)
            ->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findByContent(Uuid $contentId): array
    {
        $eloquentModels = $this->model
            ->where('content_id', $contentId->getValue())
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findByTenant(Uuid $tenantId): array
    {
        $eloquentModels = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findActive(Uuid $tenantId): array
    {
        $eloquentModels = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function save(ContentUrl $contentUrl): void
    {
        $eloquentModel = $this->model->where('uuid', $contentUrl->getId()->getValue())->first();
        
        if ($eloquentModel) {
            $eloquentModel->update($this->mapToArray($contentUrl));
        } else {
            $this->model->create($this->mapToArray($contentUrl));
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

    public function oldUrlExists(string $oldUrl, Uuid $tenantId, ?Uuid $excludeId = null): bool
    {
        $query = $this->model
            ->where('old_url', $oldUrl)
            ->where('tenant_id', $tenantId->getValue())
            ->where('is_active', true);
        
        if ($excludeId) {
            $query->where('uuid', '!=', $excludeId->getValue());
        }
        
        return $query->exists();
    }

    public function incrementHitCount(Uuid $id): void
    {
        $this->model->where('uuid', $id->getValue())->increment('hit_count');
    }

    private function mapToEntity(ContentUrlEloquentModel $model): ContentUrl
    {
        return new ContentUrl(
            id: new Uuid($model->uuid),
            tenantId: new Uuid($model->tenant_id),
            contentId: new Uuid($model->content_id),
            oldUrl: $model->old_url,
            newUrl: $model->new_url,
            redirectType: $model->redirect_type,
            isActive: $model->is_active,
            hitCount: $model->hit_count,
            createdAt: new DateTime($model->created_at->format('Y-m-d H:i:s')),
            updatedAt: new DateTime($model->updated_at->format('Y-m-d H:i:s'))
        );
    }

    private function mapToArray(ContentUrl $contentUrl): array
    {
        return [
            'uuid' => $contentUrl->getId()->getValue(),
            'tenant_id' => $contentUrl->getTenantId()->getValue(),
            'content_id' => $contentUrl->getContentId()->getValue(),
            'old_url' => $contentUrl->getOldUrl(),
            'new_url' => $contentUrl->getNewUrl(),
            'redirect_type' => $contentUrl->getRedirectType(),
            'is_active' => $contentUrl->isActive(),
            'hit_count' => $contentUrl->getHitCount(),
        ];
    }
}
