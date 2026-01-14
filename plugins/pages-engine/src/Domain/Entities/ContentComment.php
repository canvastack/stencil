<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Entities;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\CommentStatus;
use DateTime;
use InvalidArgumentException;

final class ContentComment
{
    private Uuid $id;
    private Uuid $contentId;
    private ?Uuid $parentId;
    private ?Uuid $userId;
    private ?string $authorName;
    private ?string $authorEmail;
    private ?string $authorUrl;
    private string $commentText;
    private CommentStatus $status;
    private ?string $ipAddress;
    private ?string $userAgent;
    private ?Uuid $approvedBy;
    private ?DateTime $approvedAt;
    private int $spamScore;
    private array $metadata;
    private DateTime $createdAt;
    private DateTime $updatedAt;
    private ?DateTime $deletedAt;

    public function __construct(
        Uuid $id,
        Uuid $contentId,
        string $commentText,
        ?Uuid $parentId = null,
        ?Uuid $userId = null,
        ?string $authorName = null,
        ?string $authorEmail = null,
        ?string $authorUrl = null,
        ?CommentStatus $status = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?Uuid $approvedBy = null,
        ?DateTime $approvedAt = null,
        int $spamScore = 0,
        array $metadata = [],
        ?DateTime $createdAt = null,
        ?DateTime $updatedAt = null,
        ?DateTime $deletedAt = null
    ) {
        $this->validateCommentText($commentText);
        $this->validateAuthorInfo($userId, $authorName, $authorEmail);

        $this->id = $id;
        $this->contentId = $contentId;
        $this->parentId = $parentId;
        $this->userId = $userId;
        $this->authorName = $authorName;
        $this->authorEmail = $authorEmail;
        $this->authorUrl = $authorUrl;
        $this->commentText = $commentText;
        $this->status = $status ?? new CommentStatus(CommentStatus::PENDING);
        $this->ipAddress = $ipAddress;
        $this->userAgent = $userAgent;
        $this->approvedBy = $approvedBy;
        $this->approvedAt = $approvedAt;
        $this->spamScore = $spamScore;
        $this->metadata = $metadata;
        $this->createdAt = $createdAt ?? new DateTime();
        $this->updatedAt = $updatedAt ?? new DateTime();
        $this->deletedAt = $deletedAt;
    }

    private function validateCommentText(string $text): void
    {
        if (empty(trim($text))) {
            throw new InvalidArgumentException('Comment text cannot be empty');
        }
    }

    private function validateAuthorInfo(?Uuid $userId, ?string $authorName, ?string $authorEmail): void
    {
        if ($userId === null && $authorName === null && $authorEmail === null) {
            throw new InvalidArgumentException('Comment must have either user_id or author name/email');
        }
    }

    public function approve(Uuid $approvedBy): void
    {
        $this->status = new CommentStatus(CommentStatus::APPROVED);
        $this->approvedBy = $approvedBy;
        $this->approvedAt = new DateTime();
        $this->updatedAt = new DateTime();
    }

    public function markAsSpam(): void
    {
        $this->status = new CommentStatus(CommentStatus::SPAM);
        $this->updatedAt = new DateTime();
    }

    public function trash(): void
    {
        $this->status = new CommentStatus(CommentStatus::TRASH);
        $this->deletedAt = new DateTime();
        $this->updatedAt = new DateTime();
    }

    public function restore(): void
    {
        if ($this->deletedAt === null) {
            throw new InvalidArgumentException('Comment is not deleted');
        }

        $this->status = new CommentStatus(CommentStatus::PENDING);
        $this->deletedAt = null;
        $this->updatedAt = new DateTime();
    }

    public function updateText(string $text): void
    {
        $this->validateCommentText($text);
        $this->commentText = $text;
        $this->updatedAt = new DateTime();
    }

    public function incrementSpamScore(int $points = 1): void
    {
        $this->spamScore += $points;
    }

    public function updateMetadata(array $metadata): void
    {
        $this->metadata = $metadata;
        $this->updatedAt = new DateTime();
    }

    public function getId(): Uuid { return $this->id; }
    public function getContentId(): Uuid { return $this->contentId; }
    public function getParentId(): ?Uuid { return $this->parentId; }
    public function getUserId(): ?Uuid { return $this->userId; }
    public function getAuthorName(): ?string { return $this->authorName; }
    public function getAuthorEmail(): ?string { return $this->authorEmail; }
    public function getAuthorUrl(): ?string { return $this->authorUrl; }
    public function getCommentText(): string { return $this->commentText; }
    public function getStatus(): CommentStatus { return $this->status; }
    public function getIpAddress(): ?string { return $this->ipAddress; }
    public function getUserAgent(): ?string { return $this->userAgent; }
    public function getApprovedBy(): ?Uuid { return $this->approvedBy; }
    public function getApprovedAt(): ?DateTime { return $this->approvedAt; }
    public function getSpamScore(): int { return $this->spamScore; }
    public function getMetadata(): array { return $this->metadata; }
    public function getCreatedAt(): DateTime { return $this->createdAt; }
    public function getUpdatedAt(): DateTime { return $this->updatedAt; }
    public function getDeletedAt(): ?DateTime { return $this->deletedAt; }

    public function isApproved(): bool { return $this->status->isApproved(); }
    public function isPending(): bool { return $this->status->isPending(); }
    public function isSpam(): bool { return $this->status->isSpam(); }
    public function isTrashed(): bool { return $this->deletedAt !== null; }
    public function isReply(): bool { return $this->parentId !== null; }
    public function isFromUser(): bool { return $this->userId !== null; }
    public function isFromGuest(): bool { return $this->userId === null; }
}
