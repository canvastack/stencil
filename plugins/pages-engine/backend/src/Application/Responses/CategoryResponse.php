<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Responses;

use Plugins\PagesEngine\Domain\Entities\ContentCategory;

final class CategoryResponse
{
    public function __construct(
        public readonly string $uuid,
        public readonly string $tenantId,
        public readonly string $contentTypeId,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $parentId,
        public readonly int $level,
        public readonly string $path,
        public readonly ?string $description,
        public readonly int $sortOrder,
        public readonly ?string $seoTitle,
        public readonly ?string $seoDescription,
        public readonly int $contentCount,
        public readonly array $metadata,
        public readonly string $createdAt,
        public readonly string $updatedAt
    ) {}

    public static function fromEntity(ContentCategory $category): self
    {
        return new self(
            uuid: $category->getId()->getValue(),
            tenantId: $category->getTenantId()->getValue(),
            contentTypeId: $category->getContentTypeId()->getValue(),
            name: $category->getName(),
            slug: $category->getSlug()->getValue(),
            parentId: $category->getParentId()?->getValue(),
            level: $category->getLevel(),
            path: $category->getPath()->getValue(),
            description: $category->getDescription(),
            sortOrder: $category->getSortOrder(),
            seoTitle: $category->getSeoTitle(),
            seoDescription: $category->getSeoDescription(),
            contentCount: $category->getContentCount(),
            metadata: $category->getMetadata(),
            createdAt: $category->getCreatedAt()->format('Y-m-d H:i:s'),
            updatedAt: $category->getUpdatedAt()->format('Y-m-d H:i:s')
        );
    }
}
