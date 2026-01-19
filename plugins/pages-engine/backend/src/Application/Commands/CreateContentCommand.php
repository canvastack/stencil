<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Commands;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class CreateContentCommand
{
    public function __construct(
        public readonly Uuid $tenantId,
        public readonly Uuid $contentTypeId,
        public readonly Uuid $authorId,
        public readonly string $title,
        public readonly ?string $slug,
        public readonly array $content,
        public readonly string $contentFormat,
        public readonly ?string $excerpt = null,
        public readonly ?Uuid $featuredImageId = null,
        public readonly ?string $customUrl = null,
        public readonly ?bool $isCommentable = null,
        public readonly ?string $seoTitle = null,
        public readonly ?string $seoDescription = null,
        public readonly array $seoKeywords = [],
        public readonly array $metadata = []
    ) {}
}
