<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Events;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use DateTime;

final class CommentPosted
{
    private Uuid $commentId;
    private Uuid $contentId;
    private ?Uuid $userId;
    private ?string $authorName;
    private ?string $authorEmail;
    private string $commentText;
    private DateTime $occurredAt;

    public function __construct(
        Uuid $commentId,
        Uuid $contentId,
        ?Uuid $userId,
        ?string $authorName,
        ?string $authorEmail,
        string $commentText
    ) {
        $this->commentId = $commentId;
        $this->contentId = $contentId;
        $this->userId = $userId;
        $this->authorName = $authorName;
        $this->authorEmail = $authorEmail;
        $this->commentText = $commentText;
        $this->occurredAt = new DateTime();
    }

    public function getCommentId(): Uuid { return $this->commentId; }
    public function getContentId(): Uuid { return $this->contentId; }
    public function getUserId(): ?Uuid { return $this->userId; }
    public function getAuthorName(): ?string { return $this->authorName; }
    public function getAuthorEmail(): ?string { return $this->authorEmail; }
    public function getCommentText(): string { return $this->commentText; }
    public function getOccurredAt(): DateTime { return $this->occurredAt; }
}
