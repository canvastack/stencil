<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Commands;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class CreateContentTypeCommand
{
    public function __construct(
        public readonly ?Uuid $tenantId,
        public readonly string $name,
        public readonly string $slug,
        public readonly string $defaultUrlPattern,
        public readonly string $scope,
        public readonly ?string $description = null,
        public readonly ?string $icon = null,
        public readonly bool $isCommentable = false,
        public readonly bool $isCategorizable = true,
        public readonly bool $isTaggable = true,
        public readonly bool $isRevisioned = true,
        public readonly array $metadata = []
    ) {}
}
