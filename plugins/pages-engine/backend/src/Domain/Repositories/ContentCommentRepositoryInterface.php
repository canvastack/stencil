<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Repositories;

use Plugins\PagesEngine\Domain\Entities\ContentComment;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\CommentStatus;

interface ContentCommentRepositoryInterface
{
    public function findById(Uuid $id): ?ContentComment;

    public function findWithFilters(array $filters): array;

    public function findByContent(Uuid $contentId, array $filters = []): array;

    public function findByUser(Uuid $userId): array;

    public function findByEmail(string $email): array;

    public function findByStatus(CommentStatus $status, Uuid $contentId): array;

    public function findRootComments(Uuid $contentId): array;

    public function findReplies(Uuid $parentId): array;

    public function findPending(int $limit = 50): array;

    public function findApproved(Uuid $contentId): array;

    public function save(ContentComment $comment): void;

    public function delete(Uuid $id): void;

    public function softDelete(Uuid $id): void;

    public function restore(Uuid $id): void;

    public function exists(Uuid $id): bool;

    public function countByUser(Uuid $userId): int;

    public function countApprovedByUser(Uuid $userId): int;

    public function countApprovedByEmail(string $email, Uuid $tenantId): int;

    public function countByStatus(Uuid $tenantId): array;
}
