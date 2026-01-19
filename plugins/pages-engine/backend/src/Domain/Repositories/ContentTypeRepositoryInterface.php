<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Repositories;

use Plugins\PagesEngine\Domain\Entities\ContentType;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\ContentTypeSlug;

interface ContentTypeRepositoryInterface
{
    public function findById(Uuid $id): ?ContentType;

    public function findBySlug(ContentTypeSlug $slug, ?Uuid $tenantId = null): ?ContentType;

    public function findByTenant(Uuid $tenantId): array;

    public function findPlatformContentTypes(): array;

    public function findAll(): array;

    public function findActive(): array;

    public function save(ContentType $contentType): void;

    public function delete(Uuid $id): void;

    public function exists(Uuid $id): bool;

    public function slugExists(ContentTypeSlug $slug, ?Uuid $tenantId = null, ?Uuid $excludeId = null): bool;
}
