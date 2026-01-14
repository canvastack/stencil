<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Commands;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class RevertContentRevisionCommand
{
    public function __construct(
        public readonly Uuid $contentId,
        public readonly Uuid $revisionId,
        public readonly Uuid $tenantId
    ) {}
}
