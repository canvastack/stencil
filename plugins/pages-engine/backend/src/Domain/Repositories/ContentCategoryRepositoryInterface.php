<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Repositories;

use Plugins\PagesEngine\Domain\Entities\ContentCategory;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\CategorySlug;

interface ContentCategoryRepositoryInterface
{
    public function findById(Uuid $id): ?ContentCategory;

    public function findBySlug(CategorySlug $slug, int $tenantId, Uuid $contentTypeId): ?ContentCategory;

    public function findByTenant(int $tenantId, ?Uuid $contentTypeId = null): array;

    public function findByContentType(Uuid $contentTypeId): array;

    public function findRootCategories(int $tenantId, Uuid $contentTypeId): array;

    public function findChildren(Uuid $parentId): array;

    public function findByParent(?Uuid $parentId, int $tenantId, Uuid $contentTypeId): array;

    public function findActive(int $tenantId): array;

    public function findTree(int $tenantId, Uuid $contentTypeId): array;

    public function save(ContentCategory $category): void;

    public function delete(Uuid $id): void;

    public function exists(Uuid $id): bool;

    public function slugExists(
        CategorySlug $slug,
        Uuid $tenantId,
        Uuid $contentTypeId,
        ?Uuid $parentId = null,
        ?Uuid $excludeId = null
    ): bool;

    public function incrementContentCount(Uuid $id): void;

    public function decrementContentCount(Uuid $id): void;
}
