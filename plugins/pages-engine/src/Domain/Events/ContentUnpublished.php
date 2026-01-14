<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Events;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use DateTime;

final class ContentUnpublished
{
    private Uuid $contentId;
    private Uuid $tenantId;
    private string $title;
    private DateTime $occurredAt;

    public function __construct(
        Uuid $contentId,
        Uuid $tenantId,
        string $title
    ) {
        $this->contentId = $contentId;
        $this->tenantId = $tenantId;
        $this->title = $title;
        $this->occurredAt = new DateTime();
    }

    public function getContentId(): Uuid { return $this->contentId; }
    public function getTenantId(): Uuid { return $this->tenantId; }
    public function getTitle(): string { return $this->title; }
    public function getOccurredAt(): DateTime { return $this->occurredAt; }
}
