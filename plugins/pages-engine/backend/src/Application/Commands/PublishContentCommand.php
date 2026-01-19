<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Commands;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class PublishContentCommand
{
    public function __construct(
        public readonly Uuid $contentId,
        public readonly Uuid $tenantId
    ) {}
}
