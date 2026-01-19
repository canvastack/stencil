<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Entities;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use DateTime;
use InvalidArgumentException;

final class ContentUrl
{
    public const REDIRECT_301 = 301;
    public const REDIRECT_302 = 302;

    private Uuid $id;
    private Uuid $tenantId;
    private Uuid $contentId;
    private string $oldUrl;
    private string $newUrl;
    private int $redirectType;
    private bool $isActive;
    private int $hitCount;
    private DateTime $createdAt;
    private DateTime $updatedAt;

    public function __construct(
        Uuid $id,
        Uuid $tenantId,
        Uuid $contentId,
        string $oldUrl,
        string $newUrl,
        int $redirectType = self::REDIRECT_301,
        bool $isActive = true,
        int $hitCount = 0,
        ?DateTime $createdAt = null,
        ?DateTime $updatedAt = null
    ) {
        $this->validateUrl($oldUrl);
        $this->validateUrl($newUrl);
        $this->validateRedirectType($redirectType);
        $this->validateUrlsNotSame($oldUrl, $newUrl);

        $this->id = $id;
        $this->tenantId = $tenantId;
        $this->contentId = $contentId;
        $this->oldUrl = $oldUrl;
        $this->newUrl = $newUrl;
        $this->redirectType = $redirectType;
        $this->isActive = $isActive;
        $this->hitCount = $hitCount;
        $this->createdAt = $createdAt ?? new DateTime();
        $this->updatedAt = $updatedAt ?? new DateTime();
    }

    private function validateUrl(string $url): void
    {
        if (empty(trim($url))) {
            throw new InvalidArgumentException('URL cannot be empty');
        }

        if (strlen($url) > 500) {
            throw new InvalidArgumentException('URL cannot exceed 500 characters');
        }
    }

    private function validateRedirectType(int $type): void
    {
        if (!in_array($type, [self::REDIRECT_301, self::REDIRECT_302], true)) {
            throw new InvalidArgumentException('Redirect type must be 301 or 302');
        }
    }

    private function validateUrlsNotSame(string $oldUrl, string $newUrl): void
    {
        if ($oldUrl === $newUrl) {
            throw new InvalidArgumentException('Old URL and new URL cannot be the same');
        }
    }

    public function updateNewUrl(string $newUrl): void
    {
        $this->validateUrl($newUrl);
        $this->validateUrlsNotSame($this->oldUrl, $newUrl);
        $this->newUrl = $newUrl;
        $this->updatedAt = new DateTime();
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

    public function incrementHitCount(): void
    {
        $this->hitCount++;
    }

    public function getId(): Uuid { return $this->id; }
    public function getTenantId(): Uuid { return $this->tenantId; }
    public function getContentId(): Uuid { return $this->contentId; }
    public function getOldUrl(): string { return $this->oldUrl; }
    public function getNewUrl(): string { return $this->newUrl; }
    public function getRedirectType(): int { return $this->redirectType; }
    public function isActive(): bool { return $this->isActive; }
    public function getHitCount(): int { return $this->hitCount; }
    public function getCreatedAt(): DateTime { return $this->createdAt; }
    public function getUpdatedAt(): DateTime { return $this->updatedAt; }

    public function isPermanent(): bool
    {
        return $this->redirectType === self::REDIRECT_301;
    }

    public function isTemporary(): bool
    {
        return $this->redirectType === self::REDIRECT_302;
    }
}
