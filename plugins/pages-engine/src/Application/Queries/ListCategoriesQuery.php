<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Queries;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class ListCategoriesQuery
{
    public function __construct(
        public readonly Uuid $tenantId,
        public readonly Uuid $contentTypeId,
        public readonly ?Uuid $parentId = null,
        public readonly bool $includeContentCount = false
    ) {}
}
