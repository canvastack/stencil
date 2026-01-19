<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Queries;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class ListCommentsQuery
{
    public function __construct(
        public readonly Uuid $tenantId,
        public readonly Uuid $contentId,
        public readonly ?string $status = null,
        public readonly int $page = 1,
        public readonly int $perPage = 50
    ) {}
}
