<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Commands;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class DeleteContentTypeCommand
{
    public function __construct(
        public readonly Uuid $contentTypeId,
        public readonly Uuid $tenantId
    ) {}
}
