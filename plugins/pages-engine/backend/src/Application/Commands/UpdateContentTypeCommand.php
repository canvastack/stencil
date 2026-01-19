<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Commands;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class UpdateContentTypeCommand
{
    public function __construct(
        public readonly Uuid $contentTypeId,
        public readonly Uuid $tenantId,
        public readonly ?string $name = null,
        public readonly ?string $slug = null,
        public readonly ?string $defaultUrlPattern = null,
        public readonly ?string $description = null,
        public readonly ?string $icon = null,
        public readonly ?bool $isCommentable = null,
        public readonly ?bool $isCategorizable = null,
        public readonly ?bool $isTaggable = null,
        public readonly ?bool $isRevisioned = null,
        public readonly ?array $metadata = null
    ) {}
}
