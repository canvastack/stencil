<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Repositories;

use Plugins\PagesEngine\Domain\Entities\ContentTag;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\CategorySlug;

interface ContentTagRepositoryInterface
{
    public function findById(Uuid $id): ?ContentTag;

    public function findBySlug(CategorySlug $slug, Uuid $tenantId): ?ContentTag;

    public function findByTenant(Uuid $tenantId): array;

    public function findByContent(Uuid $contentId): array;

    public function findPopular(Uuid $tenantId, int $limit = 20): array;

    public function search(string $query, Uuid $tenantId): array;

    public function save(ContentTag $tag): void;

    public function delete(Uuid $id): void;

    public function exists(Uuid $id): bool;

    public function slugExists(CategorySlug $slug, Uuid $tenantId, ?Uuid $excludeId = null): bool;

    public function incrementContentCount(Uuid $id): void;

    public function decrementContentCount(Uuid $id): void;

    public function attachToContent(Uuid $contentId, array $tagIds): void;

    public function detachFromContent(Uuid $contentId, array $tagIds): void;

    public function syncWithContent(Uuid $contentId, array $tagIds): void;
}
