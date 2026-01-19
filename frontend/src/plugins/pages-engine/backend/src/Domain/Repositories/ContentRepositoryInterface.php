<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Repositories;

use Plugins\PagesEngine\Domain\Entities\Content;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\ContentSlug;
use Plugins\PagesEngine\Domain\ValueObjects\ContentStatus;
use DateTime;

interface ContentRepositoryInterface
{
    public function findById(Uuid $id): ?Content;

    public function findBySlug(ContentSlug $slug, Uuid $tenantId): ?Content;

    public function findByCustomUrl(string $url, Uuid $tenantId): ?Content;

    public function findByTenant(Uuid $tenantId, array $filters = []): array;

    public function findByContentType(Uuid $contentTypeId, array $filters = []): array;

    public function findByCategory(Uuid $categoryId, array $filters = []): array;

    public function findByAuthor(Uuid $authorId, array $filters = []): array;

    public function findByStatus(ContentStatus $status, Uuid $tenantId): array;

    public function findPublished(Uuid $tenantId, array $filters = []): array;

    public function findScheduledForPublishing(DateTime $before): array;

    public function findFeatured(Uuid $tenantId, int $limit = 10): array;

    public function search(string $query, Uuid $tenantId, array $filters = []): array;

    public function save(Content $content): void;

    public function delete(Uuid $id): void;

    public function softDelete(Uuid $id): void;

    public function restore(Uuid $id): void;

    public function exists(Uuid $id): bool;

    public function slugExists(ContentSlug $slug, Uuid $tenantId, ?Uuid $excludeId = null): bool;

    public function customUrlExists(string $url, Uuid $tenantId, ?Uuid $excludeId = null): bool;

    public function incrementViewCount(Uuid $id): void;

    public function countByContentType(Uuid $contentTypeId): int;
}
