<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Infrastructure\Persistence\Repositories;

use Plugins\PagesEngine\Domain\Entities\ContentRevision;
use Plugins\PagesEngine\Domain\Repositories\ContentRevisionRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\EditorFormat;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentRevisionEloquentModel;
use DateTime;

final class ContentRevisionEloquentRepository implements ContentRevisionRepositoryInterface
{
    public function __construct(
        private readonly ContentRevisionEloquentModel $model
    ) {}

    public function findById(Uuid $id): ?ContentRevision
    {
        $eloquentModel = $this->model->where('uuid', $id->getValue())->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findByContent(Uuid $contentId, int $limit = 50): array
    {
        $eloquentModels = $this->model
            ->where('content_id', $contentId->getValue())
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findByCreator(Uuid $createdBy): array
    {
        $eloquentModels = $this->model
            ->where('created_by', $createdBy->getValue())
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findLatest(Uuid $contentId): ?ContentRevision
    {
        $eloquentModel = $this->model
            ->where('content_id', $contentId->getValue())
            ->orderBy('created_at', 'desc')
            ->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function save(ContentRevision $revision): void
    {
        $eloquentModel = $this->model->where('uuid', $revision->getId()->getValue())->first();
        
        if ($eloquentModel) {
            $eloquentModel->update($this->mapToArray($revision));
        } else {
            $this->model->create($this->mapToArray($revision));
        }
    }

    public function delete(Uuid $id): void
    {
        $this->model->where('uuid', $id->getValue())->delete();
    }

    public function deleteByContent(Uuid $contentId): void
    {
        $this->model->where('content_id', $contentId->getValue())->delete();
    }

    public function deleteOldRevisions(Uuid $contentId, int $keepCount = 50): int
    {
        $revisionsToKeep = $this->model
            ->where('content_id', $contentId->getValue())
            ->orderBy('created_at', 'desc')
            ->limit($keepCount)
            ->pluck('uuid')
            ->toArray();
        
        return $this->model
            ->where('content_id', $contentId->getValue())
            ->whereNotIn('uuid', $revisionsToKeep)
            ->delete();
    }

    public function exists(Uuid $id): bool
    {
        return $this->model->where('uuid', $id->getValue())->exists();
    }

    public function countByContent(Uuid $contentId): int
    {
        return $this->model->where('content_id', $contentId->getValue())->count();
    }

    private function mapToEntity(ContentRevisionEloquentModel $model): ContentRevision
    {
        return new ContentRevision(
            id: new Uuid($model->uuid),
            contentId: new Uuid($model->content_id),
            title: $model->title,
            content: $model->content,
            contentFormat: new EditorFormat($model->content_format),
            createdBy: new Uuid($model->created_by),
            excerpt: $model->excerpt,
            changeSummary: $model->change_summary,
            metadata: $model->metadata ?? [],
            createdAt: new DateTime($model->created_at->format('Y-m-d H:i:s'))
        );
    }

    private function mapToArray(ContentRevision $revision): array
    {
        return [
            'uuid' => $revision->getId()->getValue(),
            'content_id' => $revision->getContentId()->getValue(),
            'title' => $revision->getTitle(),
            'excerpt' => $revision->getExcerpt(),
            'content' => $revision->getContent(),
            'content_format' => $revision->getContentFormat()->getValue(),
            'created_by' => $revision->getCreatedBy()->getValue(),
            'change_summary' => $revision->getChangeSummary(),
            'metadata' => $revision->getMetadata(),
            'created_at' => $revision->getCreatedAt()->format('Y-m-d H:i:s'),
        ];
    }
}
