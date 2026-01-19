<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Entities;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\ContentTypeSlug;
use Plugins\PagesEngine\Domain\ValueObjects\UrlPattern;
use DateTime;
use InvalidArgumentException;

final class ContentType
{
    private Uuid $id;
    private ?Uuid $tenantId;
    private string $name;
    private ContentTypeSlug $slug;
    private ?string $description;
    private ?string $icon;
    private UrlPattern $defaultUrlPattern;
    private bool $isCommentable;
    private bool $isCategorizable;
    private bool $isTaggable;
    private bool $isRevisioned;
    private string $scope;
    private bool $isActive;
    private array $metadata;
    private DateTime $createdAt;
    private DateTime $updatedAt;

    public function __construct(
        Uuid $id,
        ?Uuid $tenantId,
        string $name,
        ContentTypeSlug $slug,
        UrlPattern $defaultUrlPattern,
        string $scope = 'tenant',
        ?string $description = null,
        ?string $icon = null,
        bool $isCommentable = false,
        bool $isCategorizable = true,
        bool $isTaggable = true,
        bool $isRevisioned = true,
        bool $isActive = true,
        array $metadata = [],
        ?DateTime $createdAt = null,
        ?DateTime $updatedAt = null
    ) {
        $this->validateScope($scope);
        $this->validateTenantScope($scope, $tenantId);
        $this->validateName($name);

        $this->id = $id;
        $this->tenantId = $tenantId;
        $this->name = $name;
        $this->slug = $slug;
        $this->defaultUrlPattern = $defaultUrlPattern;
        $this->scope = $scope;
        $this->description = $description;
        $this->icon = $icon;
        $this->isCommentable = $isCommentable;
        $this->isCategorizable = $isCategorizable;
        $this->isTaggable = $isTaggable;
        $this->isRevisioned = $isRevisioned;
        $this->isActive = $isActive;
        $this->metadata = $metadata;
        $this->createdAt = $createdAt ?? new DateTime();
        $this->updatedAt = $updatedAt ?? new DateTime();
    }

    private function validateScope(string $scope): void
    {
        if (!in_array($scope, ['platform', 'tenant'], true)) {
            throw new InvalidArgumentException("Invalid scope: {$scope}. Must be 'platform' or 'tenant'");
        }
    }

    private function validateTenantScope(string $scope, ?Uuid $tenantId): void
    {
        if ($scope === 'tenant' && $tenantId === null) {
            throw new InvalidArgumentException('Tenant-scoped content type must have tenant_id');
        }

        if ($scope === 'platform' && $tenantId !== null) {
            throw new InvalidArgumentException('Platform-scoped content type must NOT have tenant_id');
        }
    }

    private function validateName(string $name): void
    {
        if (empty(trim($name))) {
            throw new InvalidArgumentException('Content type name cannot be empty');
        }

        if (strlen($name) > 100) {
            throw new InvalidArgumentException('Content type name cannot exceed 100 characters');
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

    public function updateName(string $name): void
    {
        $this->validateName($name);
        $this->name = $name;
        $this->updatedAt = new DateTime();
    }

    public function updateSlug(ContentTypeSlug $slug): void
    {
        $this->slug = $slug;
        $this->updatedAt = new DateTime();
    }

    public function updateUrlPattern(UrlPattern $newPattern): void
    {
        $this->defaultUrlPattern = $newPattern;
        $this->updatedAt = new DateTime();
    }

    public function updateDescription(?string $description): void
    {
        $this->description = $description;
        $this->updatedAt = new DateTime();
    }

    public function updateIcon(?string $icon): void
    {
        $this->icon = $icon;
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

    public function enableCategories(): void
    {
        $this->isCategorizable = true;
        $this->updatedAt = new DateTime();
    }

    public function disableCategories(): void
    {
        $this->isCategorizable = false;
        $this->updatedAt = new DateTime();
    }

    public function enableTags(): void
    {
        $this->isTaggable = true;
        $this->updatedAt = new DateTime();
    }

    public function disableTags(): void
    {
        $this->isTaggable = false;
        $this->updatedAt = new DateTime();
    }

    public function enableRevisions(): void
    {
        $this->isRevisioned = true;
        $this->updatedAt = new DateTime();
    }

    public function disableRevisions(): void
    {
        $this->isRevisioned = false;
        $this->updatedAt = new DateTime();
    }

    public function updateMetadata(array $metadata): void
    {
        $this->metadata = $metadata;
        $this->updatedAt = new DateTime();
    }

    public function addMetadataField(string $key, mixed $value): void
    {
        $this->metadata[$key] = $value;
        $this->updatedAt = new DateTime();
    }

    public function removeMetadataField(string $key): void
    {
        unset($this->metadata[$key]);
        $this->updatedAt = new DateTime();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getTenantId(): ?Uuid
    {
        return $this->tenantId;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getSlug(): ContentTypeSlug
    {
        return $this->slug;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function getIcon(): ?string
    {
        return $this->icon;
    }

    public function getDefaultUrlPattern(): UrlPattern
    {
        return $this->defaultUrlPattern;
    }

    public function isCommentable(): bool
    {
        return $this->isCommentable;
    }

    public function isCategorizable(): bool
    {
        return $this->isCategorizable;
    }

    public function isTaggable(): bool
    {
        return $this->isTaggable;
    }

    public function isRevisioned(): bool
    {
        return $this->isRevisioned;
    }

    public function getScope(): string
    {
        return $this->scope;
    }

    public function isActive(): bool
    {
        return $this->isActive;
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

    public function isPlatformLevel(): bool
    {
        return $this->scope === 'platform';
    }

    public function isTenantLevel(): bool
    {
        return $this->scope === 'tenant';
    }

    public function allowsComments(): bool
    {
        return $this->isCommentable;
    }

    public function allowsCategories(): bool
    {
        return $this->isCategorizable;
    }

    public function allowsTags(): bool
    {
        return $this->isTaggable;
    }

    public function supportsRevisions(): bool
    {
        return $this->isRevisioned;
    }
}
