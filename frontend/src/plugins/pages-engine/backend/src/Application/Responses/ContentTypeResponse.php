<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Responses;

use Plugins\PagesEngine\Domain\Entities\ContentType;

final class ContentTypeResponse
{
    public function __construct(
        public readonly string $uuid,
        public readonly ?string $tenantId,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $description,
        public readonly ?string $icon,
        public readonly string $defaultUrlPattern,
        public readonly bool $isCommentable,
        public readonly bool $isCategorizable,
        public readonly bool $isTaggable,
        public readonly bool $isRevisioned,
        public readonly string $scope,
        public readonly bool $isActive,
        public readonly array $metadata,
        public readonly string $createdAt,
        public readonly string $updatedAt
    ) {}

    public static function fromEntity(ContentType $contentType): self
    {
        return new self(
            uuid: $contentType->getId()->getValue(),
            tenantId: $contentType->getTenantId()?->getValue(),
            name: $contentType->getName(),
            slug: $contentType->getSlug()->getValue(),
            description: $contentType->getDescription(),
            icon: $contentType->getIcon(),
            defaultUrlPattern: $contentType->getDefaultUrlPattern()->getPattern(),
            isCommentable: $contentType->isCommentable(),
            isCategorizable: $contentType->isCategorizable(),
            isTaggable: $contentType->isTaggable(),
            isRevisioned: $contentType->isRevisioned(),
            scope: $contentType->getScope(),
            isActive: $contentType->isActive(),
            metadata: $contentType->getMetadata(),
            createdAt: $contentType->getCreatedAt()->format('Y-m-d H:i:s'),
            updatedAt: $contentType->getUpdatedAt()->format('Y-m-d H:i:s')
        );
    }
}
