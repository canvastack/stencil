<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Infrastructure\Persistence\Repositories;

use Plugins\PagesEngine\Domain\Entities\ContentComment;
use Plugins\PagesEngine\Domain\Repositories\ContentCommentRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\CommentStatus;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentCommentEloquentModel;
use DateTime;

final class ContentCommentEloquentRepository implements ContentCommentRepositoryInterface
{
    public function __construct(
        private readonly ContentCommentEloquentModel $model
    ) {}

    public function findById(Uuid $id): ?ContentComment
    {
        $eloquentModel = $this->model->where('uuid', $id->getValue())->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findWithFilters(array $filters): array
    {
        $query = $this->model->newQuery();
        
        // Apply tenant filter via content relationship
        if (isset($filters['tenant_id'])) {
            $query->whereHas('content', function($q) use ($filters) {
                $q->where('tenant_id', $filters['tenant_id']);
            });
        }
        
        // Apply status filter
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        // Apply content filter
        if (isset($filters['content_id'])) {
            $query->where('content_id', $filters['content_id']);
        }
        
        // Apply user filter
        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }
        
        // Apply search filter
        if (isset($filters['search']) && $filters['search']) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('author_name', 'ILIKE', "%{$search}%")
                  ->orWhere('author_email', 'ILIKE', "%{$search}%")
                  ->orWhere('comment_text', 'ILIKE', "%{$search}%");
            });
        }
        
        // Apply pagination
        $page = $filters['page'] ?? 1;
        $perPage = $filters['per_page'] ?? 15;
        
        $total = $query->count();
        $eloquentModels = $query
            ->orderBy('created_at', 'desc')
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();
        
        return [
            'data' => $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray(),
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => (int) ceil($total / $perPage),
            ],
        ];
    }

    public function findByContent(Uuid $contentId, array $filters = []): array
    {
        $query = $this->model->where('content_id', $contentId->getValue());
        
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        $eloquentModels = $query->orderBy('created_at', 'desc')->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findByUser(Uuid $userId): array
    {
        $eloquentModels = $this->model
            ->where('user_id', $userId->getValue())
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findByEmail(string $email): array
    {
        $eloquentModels = $this->model
            ->where('author_email', $email)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findByStatus(CommentStatus $status, Uuid $contentId): array
    {
        $eloquentModels = $this->model
            ->where('content_id', $contentId->getValue())
            ->where('status', $status->getValue())
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findRootComments(Uuid $contentId): array
    {
        $eloquentModels = $this->model
            ->where('content_id', $contentId->getValue())
            ->whereNull('parent_id')
            ->where('status', 'approved')
            ->orderBy('created_at', 'asc')
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findReplies(Uuid $parentId): array
    {
        $eloquentModels = $this->model
            ->where('parent_id', $parentId->getValue())
            ->where('status', 'approved')
            ->orderBy('created_at', 'asc')
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findPending(int $limit = 50): array
    {
        $eloquentModels = $this->model
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findApproved(Uuid $contentId): array
    {
        $eloquentModels = $this->model
            ->where('content_id', $contentId->getValue())
            ->where('status', 'approved')
            ->orderBy('created_at', 'asc')
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function save(ContentComment $comment): void
    {
        $eloquentModel = $this->model->where('uuid', $comment->getId()->getValue())->first();
        
        if ($eloquentModel) {
            $eloquentModel->update($this->mapToArray($comment));
        } else {
            $this->model->create($this->mapToArray($comment));
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

    public function countByUser(Uuid $userId): int
    {
        return $this->model->where('user_id', $userId->getValue())->count();
    }

    public function countApprovedByUser(Uuid $userId): int
    {
        return $this->model
            ->where('user_id', $userId->getValue())
            ->where('status', 'approved')
            ->count();
    }

    public function countApprovedByEmail(string $email, Uuid $tenantId): int
    {
        return $this->model
            ->where('author_email', $email)
            ->where('status', 'approved')
            ->whereHas('content', function($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId->getValue());
            })
            ->count();
    }

    private function mapToEntity(ContentCommentEloquentModel $model): ContentComment
    {
        return new ContentComment(
            id: new Uuid($model->uuid),
            contentId: new Uuid($model->content_id),
            commentText: $model->comment_text,
            parentId: $model->parent_id ? new Uuid($model->parent_id) : null,
            userId: $model->user_id ? new Uuid($model->user_id) : null,
            authorName: $model->author_name,
            authorEmail: $model->author_email,
            authorUrl: $model->author_url,
            status: new CommentStatus($model->status),
            ipAddress: $model->ip_address,
            userAgent: $model->user_agent,
            approvedBy: $model->approved_by ? new Uuid($model->approved_by) : null,
            approvedAt: $model->approved_at ? new DateTime($model->approved_at->format('Y-m-d H:i:s')) : null,
            spamScore: $model->spam_score,
            metadata: $model->metadata ?? [],
            createdAt: new DateTime($model->created_at->format('Y-m-d H:i:s')),
            updatedAt: new DateTime($model->updated_at->format('Y-m-d H:i:s')),
            deletedAt: $model->deleted_at ? new DateTime($model->deleted_at->format('Y-m-d H:i:s')) : null
        );
    }

    private function mapToArray(ContentComment $comment): array
    {
        return [
            'uuid' => $comment->getId()->getValue(),
            'content_id' => $comment->getContentId()->getValue(),
            'parent_id' => $comment->getParentId()?->getValue(),
            'user_id' => $comment->getUserId()?->getValue(),
            'author_name' => $comment->getAuthorName(),
            'author_email' => $comment->getAuthorEmail(),
            'author_url' => $comment->getAuthorUrl(),
            'comment_text' => $comment->getCommentText(),
            'status' => $comment->getStatus()->getValue(),
            'ip_address' => $comment->getIpAddress(),
            'user_agent' => $comment->getUserAgent(),
            'approved_by' => $comment->getApprovedBy()?->getValue(),
            'approved_at' => $comment->getApprovedAt()?->format('Y-m-d H:i:s'),
            'spam_score' => $comment->getSpamScore(),
            'metadata' => $comment->getMetadata(),
        ];
    }
}
