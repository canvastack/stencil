<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Entities;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\CategorySlug;
use Plugins\PagesEngine\Domain\ValueObjects\CategoryPath;
use DateTime;
use InvalidArgumentException;

final class ContentCategory
{
    private Uuid $id;
    private Uuid $tenantId;
    private Uuid $contentTypeId;
    private ?Uuid $parentId;
    private string $name;
    private CategorySlug $slug;
    private ?string $description;
    private CategoryPath $path;
    private int $level;
    private ?string $featuredImageId;
    private ?string $seoTitle;
    private ?string $seoDescription;
    private int $sortOrder;
    private int $contentCount;
    private bool $isActive;
    private array $metadata;
    private DateTime $createdAt;
    private DateTime $updatedAt;

    public function __construct(
        Uuid $id,
        Uuid $tenantId,
        Uuid $contentTypeId,
        string $name,
        CategorySlug $slug,
        CategoryPath $path,
        ?Uuid $parentId = null,
        int $level = 0,
        ?string $description = null,
        ?string $featuredImageId = null,
        ?string $seoTitle = null,
        ?string $seoDescription = null,
        int $sortOrder = 0,
        int $contentCount = 0,
        bool $isActive = true,
        array $metadata = [],
        ?DateTime $createdAt = null,
        ?DateTime $updatedAt = null
    ) {
        $this->validateName($name);
        $this->validateLevel($level);

        $this->id = $id;
        $this->tenantId = $tenantId;
        $this->contentTypeId = $contentTypeId;
        $this->parentId = $parentId;
        $this->name = $name;
        $this->slug = $slug;
        $this->description = $description;
        $this->path = $path;
        $this->level = $level;
        $this->featuredImageId = $featuredImageId;
        $this->seoTitle = $seoTitle;
        $this->seoDescription = $seoDescription;
        $this->sortOrder = $sortOrder;
        $this->contentCount = $contentCount;
        $this->isActive = $isActive;
        $this->metadata = $metadata;
        $this->createdAt = $createdAt ?? new DateTime();
        $this->updatedAt = $updatedAt ?? new DateTime();
    }

    private function validateName(string $name): void
    {
        if (empty(trim($name))) {
            throw new InvalidArgumentException('Category name cannot be empty');
        }

        if (strlen($name) > 255) {
            throw new InvalidArgumentException('Category name cannot exceed 255 characters');
        }
    }

    private function validateLevel(int $level): void
    {
        if ($level < 0) {
            throw new InvalidArgumentException('Category level cannot be negative');
        }

        if ($level > 10) {
            throw new InvalidArgumentException('Category level cannot exceed 10');
        }
    }

    public function setParent(?Uuid $parentId, CategoryPath $newPath, int $newLevel): void
    {
        $this->parentId = $parentId;
        $this->path = $newPath;
        $this->level = $newLevel;
        $this->updatedAt = new DateTime();
    }

    public function updatePath(CategoryPath $newPath): void
    {
        $this->path = $newPath;
        $this->updatedAt = new DateTime();
    }

    public function updateName(string $name): void
    {
        $this->validateName($name);
        $this->name = $name;
        $this->updatedAt = new DateTime();
    }

    public function updateSlug(CategorySlug $slug): void
    {
        $this->slug = $slug;
        $this->updatedAt = new DateTime();
    }

    public function updateDescription(?string $description): void
    {
        $this->description = $description;
        $this->updatedAt = new DateTime();
    }



    public function updateSeoTitle(?string $seoTitle): void
    {
        $this->seoTitle = $seoTitle;
        $this->updatedAt = new DateTime();
    }

    public function updateSeoDescription(?string $seoDescription): void
    {
        $this->seoDescription = $seoDescription;
        $this->updatedAt = new DateTime();
    }



    public function updateParent(?Uuid $parentId): void
    {
        $this->parentId = $parentId;
        $this->updatedAt = new DateTime();
    }

    public function setFeaturedImage(?string $imageId): void
    {
        $this->featuredImageId = $imageId;
        $this->updatedAt = new DateTime();
    }

    public function updateSeo(?string $title, ?string $description): void
    {
        $this->seoTitle = $title;
        $this->seoDescription = $description;
        $this->updatedAt = new DateTime();
    }

    public function reorder(int $newOrder): void
    {
        $this->sortOrder = $newOrder;
        $this->updatedAt = new DateTime();
    }

    public function incrementContentCount(): void
    {
        $this->contentCount++;
    }

    public function decrementContentCount(): void
    {
        if ($this->contentCount > 0) {
            $this->contentCount--;
        }
    }

    public function activate(): void
    {
        $this->isActive = true;
        $this->updatedAt = new DateTime();
    }

    public function deactivate(): void
    {
        $this->isActive = false;
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
    public function getParentId(): ?Uuid { return $this->parentId; }
    public function getName(): string { return $this->name; }
    public function getSlug(): CategorySlug { return $this->slug; }
    public function getDescription(): ?string { return $this->description; }
    public function getPath(): CategoryPath { return $this->path; }
    public function getLevel(): int { return $this->level; }
    public function getFeaturedImageId(): ?string { return $this->featuredImageId; }
    public function getSeoTitle(): ?string { return $this->seoTitle; }
    public function getSeoDescription(): ?string { return $this->seoDescription; }
    public function getSortOrder(): int { return $this->sortOrder; }
    public function getContentCount(): int { return $this->contentCount; }
    public function isActive(): bool { return $this->isActive; }
    public function getMetadata(): array { return $this->metadata; }
    public function getCreatedAt(): DateTime { return $this->createdAt; }
    public function getUpdatedAt(): DateTime { return $this->updatedAt; }

    public function isRoot(): bool
    {
        return $this->parentId === null;
    }

    public function hasParent(): bool
    {
        return $this->parentId !== null;
    }
}
