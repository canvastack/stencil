<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Responses;

use Plugins\PagesEngine\Domain\Entities\Content;

final class ContentResponse
{
    public function __construct(
        public readonly string $uuid,
        public readonly string $tenantId,
        public readonly string $contentTypeId,
        public readonly string $authorId,
        public readonly string $title,
        public readonly string $slug,
        public readonly ?string $excerpt,
        public readonly array $content,
        public readonly string $contentFormat,
        public readonly ?string $featuredImageId,
        public readonly string $status,
        public readonly ?string $publishedAt,
        public readonly ?string $scheduledPublishAt,
        public readonly ?string $customUrl,
        public readonly ?string $seoTitle,
        public readonly ?string $seoDescription,
        public readonly ?array $seoKeywords,
        public readonly ?string $canonicalUrl,
        public readonly int $viewCount,
        public readonly int $commentCount,
        public readonly bool $isFeatured,
        public readonly bool $isPinned,
        public readonly bool $isCommentable,
        public readonly int $sortOrder,
        public readonly array $metadata,
        public readonly string $createdAt,
        public readonly string $updatedAt,
        public readonly ?string $deletedAt
    ) {}

    public static function fromEntity(Content $content): self
    {
        return new self(
            uuid: $content->getId()->getValue(),
            tenantId: $content->getTenantId()->getValue(),
            contentTypeId: $content->getContentTypeId()->getValue(),
            authorId: $content->getAuthorId()->getValue(),
            title: $content->getTitle(),
            slug: $content->getSlug()->getValue(),
            excerpt: $content->getExcerpt(),
            content: $content->getContent(),
            contentFormat: $content->getContentFormat()->getValue(),
            featuredImageId: $content->getFeaturedImageId()?->getValue(),
            status: $content->getStatus()->getValue(),
            publishedAt: $content->getPublishedAt()?->format('Y-m-d H:i:s'),
            scheduledPublishAt: $content->getScheduledPublishAt()?->format('Y-m-d H:i:s'),
            customUrl: $content->getCustomUrl(),
            seoTitle: $content->getSeoTitle(),
            seoDescription: $content->getSeoDescription(),
            seoKeywords: $content->getSeoKeywords(),
            canonicalUrl: $content->getCanonicalUrl(),
            viewCount: $content->getViewCount(),
            commentCount: $content->getCommentCount(),
            isFeatured: $content->isFeatured(),
            isPinned: $content->isPinned(),
            isCommentable: $content->isCommentable(),
            sortOrder: $content->getSortOrder(),
            metadata: $content->getMetadata(),
            createdAt: $content->getCreatedAt()->format('Y-m-d H:i:s'),
            updatedAt: $content->getUpdatedAt()->format('Y-m-d H:i:s'),
            deletedAt: $content->getDeletedAt()?->format('Y-m-d H:i:s')
        );
    }
}
