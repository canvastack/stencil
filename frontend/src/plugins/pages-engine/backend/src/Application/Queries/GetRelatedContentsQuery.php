<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Queries;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class GetRelatedContentsQuery
{
    public function __construct(
        public readonly Uuid $tenantId,
        public readonly Uuid $contentId,
        public readonly int $limit = 5
    ) {}
}
