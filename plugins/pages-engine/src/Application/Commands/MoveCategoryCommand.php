<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Commands;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class MoveCategoryCommand
{
    public function __construct(
        public readonly Uuid $categoryId,
        public readonly Uuid $tenantId,
        public readonly ?Uuid $newParentId
    ) {}
}
