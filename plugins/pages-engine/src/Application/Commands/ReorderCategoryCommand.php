<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Commands;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class ReorderCategoryCommand
{
    public function __construct(
        public readonly Uuid $tenantId,
        public readonly array $categoryOrders
    ) {}
}
