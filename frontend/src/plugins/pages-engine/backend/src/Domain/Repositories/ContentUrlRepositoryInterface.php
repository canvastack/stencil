<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Repositories;

use Plugins\PagesEngine\Domain\Entities\ContentUrl;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

interface ContentUrlRepositoryInterface
{
    public function findById(Uuid $id): ?ContentUrl;

    public function findByOldUrl(string $oldUrl, Uuid $tenantId): ?ContentUrl;

    public function findByContent(Uuid $contentId): array;

    public function findByTenant(Uuid $tenantId): array;

    public function findActive(Uuid $tenantId): array;

    public function save(ContentUrl $contentUrl): void;

    public function delete(Uuid $id): void;

    public function exists(Uuid $id): bool;

    public function oldUrlExists(string $oldUrl, Uuid $tenantId, ?Uuid $excludeId = null): bool;

    public function incrementHitCount(Uuid $id): void;
}
