<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Comment;

use Plugins\PagesEngine\Application\Commands\SubmitCommentCommand;
use Plugins\PagesEngine\Application\Responses\CommentResponse;
use Plugins\PagesEngine\Domain\Entities\ContentComment;
use Plugins\PagesEngine\Domain\Repositories\ContentRepositoryInterface;
use Plugins\PagesEngine\Domain\Repositories\ContentCommentRepositoryInterface;
use Plugins\PagesEngine\Domain\Services\CommentModerationService;
use Plugins\PagesEngine\Domain\ValueObjects\CommentStatus;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\Events\CommentPosted;
use InvalidArgumentException;

final class SubmitCommentUseCase
{
    public function __construct(
        private readonly ContentRepositoryInterface $contentRepository,
        private readonly ContentCommentRepositoryInterface $commentRepository,
        private readonly CommentModerationService $moderationService
    ) {}

    public function execute(SubmitCommentCommand $command): CommentResponse
    {
        $content = $this->contentRepository->findById($command->contentId);
        if (!$content) {
            throw new InvalidArgumentException("Content not found");
        }
        
        if (!$content->isCommentable()) {
            throw new InvalidArgumentException("Comments are disabled for this content");
        }

        if ($command->parentId) {
            $parentComment = $this->commentRepository->findById($command->parentId);
            if (!$parentComment) {
                throw new InvalidArgumentException("Parent comment not found");
            }
        }

        $comment = new ContentComment(
            id: new Uuid(\Ramsey\Uuid\Uuid::uuid4()->toString()),
            tenantId: $command->tenantId,
            contentId: $command->contentId,
            parentId: $command->parentId,
            authorId: $command->authorId,
            authorName: $command->authorName,
            authorEmail: $command->authorEmail,
            commentText: $command->commentText,
            status: new CommentStatus(CommentStatus::PENDING),
            userIp: $command->userIp,
            userAgent: $command->userAgent
        );

        if ($this->moderationService->isSpam($comment)) {
            $comment->markAsSpam();
        } else {
            $approvedCount = $this->commentRepository->countApprovedByEmail($command->authorEmail, $command->tenantId);
            
            if ($this->moderationService->shouldAutoApprove($comment, $command->authorId, $approvedCount)) {
                $comment->approve();
            }
        }

        $this->commentRepository->save($comment);

        return CommentResponse::fromEntity($comment);
    }
}
