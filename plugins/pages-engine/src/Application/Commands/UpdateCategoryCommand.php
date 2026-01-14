<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Commands;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class UpdateCategoryCommand
{
    public function __construct(
        public readonly Uuid $categoryId,
        public readonly Uuid $tenantId,
        public readonly ?string $name = null,
        public readonly ?string $slug = null,
        public readonly ?string $description = null,
        public readonly ?string $seoTitle = null,
        public readonly ?string $seoDescription = null,
        public readonly ?array $metadata = null
    ) {}
}
