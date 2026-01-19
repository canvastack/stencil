<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Queries;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class GetCommentThreadQuery
{
    public function __construct(
        public readonly Uuid $tenantId,
        public readonly Uuid $commentId,
        public readonly int $maxDepth = 5
    ) {}
}
