<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Events;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use DateTime;

final class ContentUrlChanged
{
    private Uuid $contentId;
    private Uuid $tenantId;
    private string $oldUrl;
    private string $newUrl;
    private int $redirectType;
    private DateTime $occurredAt;

    public function __construct(
        Uuid $contentId,
        Uuid $tenantId,
        string $oldUrl,
        string $newUrl,
        int $redirectType = 301
    ) {
        $this->contentId = $contentId;
        $this->tenantId = $tenantId;
        $this->oldUrl = $oldUrl;
        $this->newUrl = $newUrl;
        $this->redirectType = $redirectType;
        $this->occurredAt = new DateTime();
    }

    public function getContentId(): Uuid { return $this->contentId; }
    public function getTenantId(): Uuid { return $this->tenantId; }
    public function getOldUrl(): string { return $this->oldUrl; }
    public function getNewUrl(): string { return $this->newUrl; }
    public function getRedirectType(): int { return $this->redirectType; }
    public function getOccurredAt(): DateTime { return $this->occurredAt; }
}
