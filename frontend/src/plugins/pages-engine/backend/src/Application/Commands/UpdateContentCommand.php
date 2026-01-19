<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Commands;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class UpdateContentCommand
{
    public function __construct(
        public readonly Uuid $contentId,
        public readonly Uuid $tenantId,
        public readonly ?string $title = null,
        public readonly ?string $slug = null,
        public readonly ?array $content = null,
        public readonly ?string $contentFormat = null,
        public readonly ?string $excerpt = null,
        public readonly ?Uuid $featuredImageId = null,
        public readonly ?string $customUrl = null,
        public readonly ?bool $isCommentable = null,
        public readonly ?string $seoTitle = null,
        public readonly ?string $seoDescription = null,
        public readonly ?array $seoKeywords = null,
        public readonly ?array $metadata = null
    ) {}
}
