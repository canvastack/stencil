<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Repositories;

use Plugins\PagesEngine\Domain\Entities\ContentRevision;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

interface ContentRevisionRepositoryInterface
{
    public function findById(Uuid $id): ?ContentRevision;

    public function findByContent(Uuid $contentId, int $limit = 50): array;

    public function findByCreator(Uuid $createdBy): array;

    public function findLatest(Uuid $contentId): ?ContentRevision;

    public function save(ContentRevision $revision): void;

    public function delete(Uuid $id): void;

    public function deleteByContent(Uuid $contentId): void;

    public function deleteOldRevisions(Uuid $contentId, int $keepCount = 50): int;

    public function exists(Uuid $id): bool;

    public function countByContent(Uuid $contentId): int;
}
