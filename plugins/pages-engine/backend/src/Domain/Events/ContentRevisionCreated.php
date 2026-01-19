<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Events;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use DateTime;

final class ContentRevisionCreated
{
    private Uuid $revisionId;
    private Uuid $contentId;
    private Uuid $createdBy;
    private ?string $changeSummary;
    private DateTime $occurredAt;

    public function __construct(
        Uuid $revisionId,
        Uuid $contentId,
        Uuid $createdBy,
        ?string $changeSummary = null
    ) {
        $this->revisionId = $revisionId;
        $this->contentId = $contentId;
        $this->createdBy = $createdBy;
        $this->changeSummary = $changeSummary;
        $this->occurredAt = new DateTime();
    }

    public function getRevisionId(): Uuid { return $this->revisionId; }
    public function getContentId(): Uuid { return $this->contentId; }
    public function getCreatedBy(): Uuid { return $this->createdBy; }
    public function getChangeSummary(): ?string { return $this->changeSummary; }
    public function getOccurredAt(): DateTime { return $this->occurredAt; }
}
