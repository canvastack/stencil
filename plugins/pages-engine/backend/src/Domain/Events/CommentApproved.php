<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Events;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use DateTime;

final class CommentApproved
{
    private Uuid $commentId;
    private Uuid $contentId;
    private Uuid $approvedBy;
    private DateTime $approvedAt;
    private DateTime $occurredAt;

    public function __construct(
        Uuid $commentId,
        Uuid $contentId,
        Uuid $approvedBy,
        DateTime $approvedAt
    ) {
        $this->commentId = $commentId;
        $this->contentId = $contentId;
        $this->approvedBy = $approvedBy;
        $this->approvedAt = $approvedAt;
        $this->occurredAt = new DateTime();
    }

    public function getCommentId(): Uuid { return $this->commentId; }
    public function getContentId(): Uuid { return $this->contentId; }
    public function getApprovedBy(): Uuid { return $this->approvedBy; }
    public function getApprovedAt(): DateTime { return $this->approvedAt; }
    public function getOccurredAt(): DateTime { return $this->occurredAt; }
}
