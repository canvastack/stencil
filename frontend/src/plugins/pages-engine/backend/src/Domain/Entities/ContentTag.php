<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Entities;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\CategorySlug;
use DateTime;
use InvalidArgumentException;

final class ContentTag
{
    private Uuid $id;
    private Uuid $tenantId;
    private string $name;
    private CategorySlug $slug;
    private ?string $description;
    private int $contentCount;
    private array $metadata;
    private DateTime $createdAt;
    private DateTime $updatedAt;

    public function __construct(
        Uuid $id,
        Uuid $tenantId,
        string $name,
        CategorySlug $slug,
        ?string $description = null,
        int $contentCount = 0,
        array $metadata = [],
        ?DateTime $createdAt = null,
        ?DateTime $updatedAt = null
    ) {
        $this->validateName($name);

        $this->id = $id;
        $this->tenantId = $tenantId;
        $this->name = $name;
        $this->slug = $slug;
        $this->description = $description;
        $this->contentCount = $contentCount;
        $this->metadata = $metadata;
        $this->createdAt = $createdAt ?? new DateTime();
        $this->updatedAt = $updatedAt ?? new DateTime();
    }

    private function validateName(string $name): void
    {
        if (empty(trim($name))) {
            throw new InvalidArgumentException('Tag name cannot be empty');
        }

        if (strlen($name) > 100) {
            throw new InvalidArgumentException('Tag name cannot exceed 100 characters');
        }
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

    public function updateMetadata(array $metadata): void
    {
        $this->metadata = $metadata;
        $this->updatedAt = new DateTime();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getTenantId(): Uuid
    {
        return $this->tenantId;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getSlug(): CategorySlug
    {
        return $this->slug;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function getContentCount(): int
    {
        return $this->contentCount;
    }

    public function getMetadata(): array
    {
        return $this->metadata;
    }

    public function getCreatedAt(): DateTime
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): DateTime
    {
        return $this->updatedAt;
    }
}
