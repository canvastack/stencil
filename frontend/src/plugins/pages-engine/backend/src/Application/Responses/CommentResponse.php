<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Responses;

use Plugins\PagesEngine\Domain\Entities\ContentComment;

final class CommentResponse
{
    public function __construct(
        public readonly string $uuid,
        public readonly string $contentId,
        public readonly ?string $parentId,
        public readonly ?string $authorId,
        public readonly ?string $authorName,
        public readonly ?string $authorEmail,
        public readonly string $commentText,
        public readonly string $status,
        public readonly ?string $userIp,
        public readonly ?string $userAgent,
        public readonly string $createdAt,
        public readonly string $updatedAt,
        public readonly ?string $deletedAt
    ) {}

    public static function fromEntity(ContentComment $comment): self
    {
        return new self(
            uuid: $comment->getId()->getValue(),
            contentId: $comment->getContentId()->getValue(),
            parentId: $comment->getParentId()?->getValue(),
            authorId: $comment->getUserId()?->getValue(),
            authorName: $comment->getAuthorName(),
            authorEmail: $comment->getAuthorEmail(),
            commentText: $comment->getCommentText(),
            status: $comment->getStatus()->getValue(),
            userIp: $comment->getIpAddress(),
            userAgent: $comment->getUserAgent(),
            createdAt: $comment->getCreatedAt()->format('Y-m-d H:i:s'),
            updatedAt: $comment->getUpdatedAt()->format('Y-m-d H:i:s'),
            deletedAt: $comment->getDeletedAt()?->format('Y-m-d H:i:s')
        );
    }
}
