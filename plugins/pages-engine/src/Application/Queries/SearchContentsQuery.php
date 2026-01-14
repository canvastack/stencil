<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Queries;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class SearchContentsQuery
{
    public function __construct(
        public readonly Uuid $tenantId,
        public readonly string $searchTerm,
        public readonly ?Uuid $contentTypeId = null,
        public readonly int $page = 1,
        public readonly int $perPage = 20
    ) {}
}
