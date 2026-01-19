<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Commands;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class CreateCategoryCommand
{
    public function __construct(
        public readonly int $tenantId,
        public readonly Uuid $contentTypeId,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?Uuid $parentId = null,
        public readonly ?string $description = null,
        public readonly ?string $seoTitle = null,
        public readonly ?string $seoDescription = null,
        public readonly array $metadata = []
    ) {}
}
