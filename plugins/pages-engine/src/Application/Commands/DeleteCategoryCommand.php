<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Commands;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class DeleteCategoryCommand
{
    public function __construct(
        public readonly Uuid $categoryId,
        public readonly Uuid $tenantId
    ) {}
}
