<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Entities;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\ContentSlug;
use Plugins\PagesEngine\Domain\ValueObjects\ContentStatus;
use Plugins\PagesEngine\Domain\ValueObjects\EditorFormat;
use DateTime;
use InvalidArgumentException;

final class Content
{
    private Uuid $id;
    private Uuid $tenantId;
    private Uuid $contentTypeId;
    private Uuid $authorId;
    private string $title;
    private ContentSlug $slug;
    private ?string $excerpt;
    private array $content;
    private EditorFormat $contentFormat;
    private ?Uuid $featuredImageId;
    private ContentStatus $status;
    private ?DateTime $publishedAt;
    private ?DateTime $scheduledPublishAt;
    private ?string $customUrl;
    private ?string $seoTitle;
    private ?string $seoDescription;
    private ?array $seoKeywords;
    private ?string $canonicalUrl;
    private int $viewCount;
    private int $commentCount;
    private bool $isFeatured;
    private bool $isPinned;
    private bool $isCommentable;
    private int $sortOrder;
    private array $metadata;
    private DateTime $createdAt;
    private DateTime $updatedAt;
    private ?DateTime $deletedAt;

    public function __construct(
        Uuid $id,
        Uuid $tenantId,
        Uuid $contentTypeId,
        Uuid $authorId,
        string $title,
        ContentSlug $slug,
        array $content,
        ?string $excerpt = null,
        ?EditorFormat $contentFormat = null,
        ?Uuid $featuredImageId = null,
        ?ContentStatus $status = null,
        ?DateTime $publishedAt = null,
        ?DateTime $scheduledPublishAt = null,
        ?string $customUrl = null,
        ?string $seoTitle = null,
        ?string $seoDescription = null,
        ?array $seoKeywords = null,
        ?string $canonicalUrl = null,
        int $viewCount = 0,
        int $commentCount = 0,
        bool $isFeatured = false,
        bool $isPinned = false,
        bool $isCommentable = true,
        int $sortOrder = 0,
        array $metadata = [],
        ?DateTime $createdAt = null,
        ?DateTime $updatedAt = null,
        ?DateTime $deletedAt = null
    ) {
        $this->validateTitle($title);
        $this->validateContent($content);

        $this->id = $id;
        $this->tenantId = $tenantId;
        $this->contentTypeId = $contentTypeId;
        $this->authorId = $authorId;
        $this->title = $title;
        $this->slug = $slug;
        $this->excerpt = $excerpt;
        $this->content = $content;
        $this->contentFormat = $contentFormat ?? new EditorFormat(EditorFormat::WYSIWYG);
        $this->featuredImageId = $featuredImageId;
        $this->status = $status ?? new ContentStatus(ContentStatus::DRAFT);
        $this->publishedAt = $publishedAt;
        $this->scheduledPublishAt = $scheduledPublishAt;
        $this->customUrl = $customUrl;
        $this->seoTitle = $seoTitle;
        $this->seoDescription = $seoDescription;
        $this->seoKeywords = $seoKeywords;
        $this->canonicalUrl = $canonicalUrl;
        $this->viewCount = $viewCount;
        $this->commentCount = $commentCount;
        $this->isFeatured = $isFeatured;
        $this->isPinned = $isPinned;
        $this->isCommentable = $isCommentable;
        $this->sortOrder = $sortOrder;
        $this->metadata = $metadata;
        $this->createdAt = $createdAt ?? new DateTime();
        $this->updatedAt = $updatedAt ?? new DateTime();
        $this->deletedAt = $deletedAt;
    }

    private function validateTitle(string $title): void
    {
        if (empty(trim($title))) {
            throw new InvalidArgumentException('Content title cannot be empty');
        }

        if (strlen($title) > 500) {
            throw new InvalidArgumentException('Content title cannot exceed 500 characters');
        }
    }

    private function validateContent(array $content): void
    {
        if (empty($content)) {
            throw new InvalidArgumentException('Content cannot be empty');
        }
    }

    public function publish(): void
    {
        $this->status = new ContentStatus(ContentStatus::PUBLISHED);
        $this->publishedAt = new DateTime();
        $this->scheduledPublishAt = null;
        $this->updatedAt = new DateTime();
    }

    public function unpublish(): void
    {
        $this->status = new ContentStatus(ContentStatus::DRAFT);
        $this->publishedAt = null;
        $this->updatedAt = new DateTime();
    }

    public function schedule(DateTime $publishAt): void
    {
        if ($publishAt <= new DateTime()) {
            throw new InvalidArgumentException('Scheduled publish date must be in the future');
        }

        $this->status = new ContentStatus(ContentStatus::SCHEDULED);
        $this->scheduledPublishAt = $publishAt;
        $this->publishedAt = null;
        $this->updatedAt = new DateTime();
    }

    public function archive(): void
    {
        $this->status = new ContentStatus(ContentStatus::ARCHIVED);
        $this->updatedAt = new DateTime();
    }

    public function restore(): void
    {
        if ($this->deletedAt === null) {
            throw new InvalidArgumentException('Content is not deleted');
        }

        $this->deletedAt = null;
        $this->updatedAt = new DateTime();
    }

    public function trash(): void
    {
        $this->status = new ContentStatus(ContentStatus::TRASHED);
        $this->deletedAt = new DateTime();
        $this->updatedAt = new DateTime();
    }

    public function updateTitle(string $title): void
    {
        $this->validateTitle($title);
        $this->title = $title;
        $this->updatedAt = new DateTime();
    }

    public function updateSlug(ContentSlug $slug): void
    {
        $this->slug = $slug;
        $this->updatedAt = new DateTime();
    }

    public function updateContent(array $content): void
    {
        $this->validateContent($content);
        $this->content = $content;
        $this->updatedAt = new DateTime();
    }

    public function updateContentFormat(EditorFormat $format): void
    {
        $this->contentFormat = $format;
        $this->updatedAt = new DateTime();
    }

    public function updateExcerpt(?string $excerpt): void
    {
        $this->excerpt = $excerpt;
        $this->updatedAt = new DateTime();
    }

    public function setFeaturedImage(?Uuid $imageId): void
    {
        $this->featuredImageId = $imageId;
        $this->updatedAt = new DateTime();
    }

    public function setCustomUrl(?string $url): void
    {
        $this->customUrl = $url;
        $this->updatedAt = new DateTime();
    }

    public function updateSeo(?string $title, ?string $description, ?array $keywords, ?string $canonicalUrl): void
    {
        $this->seoTitle = $title;
        $this->seoDescription = $description;
        $this->seoKeywords = $keywords;
        $this->canonicalUrl = $canonicalUrl;
        $this->updatedAt = new DateTime();
    }

    public function updateSeoTitle(?string $title): void
    {
        $this->seoTitle = $title;
        $this->updatedAt = new DateTime();
    }

    public function updateSeoDescription(?string $description): void
    {
        $this->seoDescription = $description;
        $this->updatedAt = new DateTime();
    }

    public function updateSeoKeywords(?array $keywords): void
    {
        $this->seoKeywords = $keywords;
        $this->updatedAt = new DateTime();
    }

    public function updateFeaturedImage(?Uuid $imageId): void
    {
        $this->featuredImageId = $imageId;
        $this->updatedAt = new DateTime();
    }

    public function updateCustomUrl(?string $url): void
    {
        $this->customUrl = $url;
        $this->updatedAt = new DateTime();
    }

    public function feature(): void
    {
        $this->isFeatured = true;
        $this->updatedAt = new DateTime();
    }

    public function unfeature(): void
    {
        $this->isFeatured = false;
        $this->updatedAt = new DateTime();
    }

    public function pin(): void
    {
        $this->isPinned = true;
        $this->updatedAt = new DateTime();
    }

    public function unpin(): void
    {
        $this->isPinned = false;
        $this->updatedAt = new DateTime();
    }

    public function enableComments(): void
    {
        $this->isCommentable = true;
        $this->updatedAt = new DateTime();
    }

    public function disableComments(): void
    {
        $this->isCommentable = false;
        $this->updatedAt = new DateTime();
    }

    public function incrementViewCount(): void
    {
        $this->viewCount++;
    }

    public function incrementCommentCount(): void
    {
        $this->commentCount++;
    }

    public function decrementCommentCount(): void
    {
        if ($this->commentCount > 0) {
            $this->commentCount--;
        }
    }

    public function updateSortOrder(int $order): void
    {
        $this->sortOrder = $order;
        $this->updatedAt = new DateTime();
    }

    public function updateMetadata(array $metadata): void
    {
        $this->metadata = $metadata;
        $this->updatedAt = new DateTime();
    }

    public function getId(): Uuid { return $this->id; }
    public function getTenantId(): Uuid { return $this->tenantId; }
    public function getContentTypeId(): Uuid { return $this->contentTypeId; }
    public function getAuthorId(): Uuid { return $this->authorId; }
    public function getTitle(): string { return $this->title; }
    public function getSlug(): ContentSlug { return $this->slug; }
    public function getExcerpt(): ?string { return $this->excerpt; }
    public function getContent(): array { return $this->content; }
    public function getContentFormat(): EditorFormat { return $this->contentFormat; }
    public function getFeaturedImageId(): ?Uuid { return $this->featuredImageId; }
    public function getStatus(): ContentStatus { return $this->status; }
    public function getPublishedAt(): ?DateTime { return $this->publishedAt; }
    public function getScheduledPublishAt(): ?DateTime { return $this->scheduledPublishAt; }
    public function getCustomUrl(): ?string { return $this->customUrl; }
    public function getSeoTitle(): ?string { return $this->seoTitle; }
    public function getSeoDescription(): ?string { return $this->seoDescription; }
    public function getSeoKeywords(): ?array { return $this->seoKeywords; }
    public function getCanonicalUrl(): ?string { return $this->canonicalUrl; }
    public function getViewCount(): int { return $this->viewCount; }
    public function getCommentCount(): int { return $this->commentCount; }
    public function isFeatured(): bool { return $this->isFeatured; }
    public function isPinned(): bool { return $this->isPinned; }
    public function isCommentable(): bool { return $this->isCommentable; }
    public function getSortOrder(): int { return $this->sortOrder; }
    public function getMetadata(): array { return $this->metadata; }
    public function getCreatedAt(): DateTime { return $this->createdAt; }
    public function getUpdatedAt(): DateTime { return $this->updatedAt; }
    public function getDeletedAt(): ?DateTime { return $this->deletedAt; }

    public function isPublished(): bool
    {
        return $this->status->isPublished() && $this->publishedAt !== null && $this->publishedAt <= new DateTime();
    }

    public function isScheduled(): bool
    {
        return $this->status->isScheduled() && $this->scheduledPublishAt !== null && $this->scheduledPublishAt > new DateTime();
    }

    public function isDraft(): bool
    {
        return $this->status->isDraft();
    }

    public function isArchived(): bool
    {
        return $this->status->isArchived();
    }

    public function isTrashed(): bool
    {
        return $this->deletedAt !== null;
    }
}
