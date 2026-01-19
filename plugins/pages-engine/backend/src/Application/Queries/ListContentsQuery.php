<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Queries;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class ListContentsQuery
{
    public function __construct(
        public readonly Uuid $tenantId,
        public readonly ?Uuid $contentTypeId = null,
        public readonly ?Uuid $categoryId = null,
        public readonly ?string $status = null,
        public readonly ?string $search = null,
        public readonly int $page = 1,
        public readonly int $perPage = 20,
        public readonly string $sortBy = 'created_at',
        public readonly string $sortDirection = 'desc'
    ) {}
}
