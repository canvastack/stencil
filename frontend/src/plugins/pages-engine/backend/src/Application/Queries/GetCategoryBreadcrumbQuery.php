<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Queries;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class GetCategoryBreadcrumbQuery
{
    public function __construct(
        public readonly Uuid $tenantId,
        public readonly Uuid $categoryId
    ) {}
}
