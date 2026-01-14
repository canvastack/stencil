<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Comment;

use Plugins\PagesEngine\Application\Commands\ApproveCommentCommand;
use Plugins\PagesEngine\Application\Responses\CommentResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentCommentRepositoryInterface;
use Plugins\PagesEngine\Domain\Repositories\ContentRepositoryInterface;
use Plugins\PagesEngine\Domain\Events\CommentApproved;
use InvalidArgumentException;

final class ApproveCommentUseCase
{
    public function __construct(
        private readonly ContentCommentRepositoryInterface $commentRepository,
        private readonly ContentRepositoryInterface $contentRepository
    ) {}

    public function execute(ApproveCommentCommand $command): CommentResponse
    {
        $comment = $this->commentRepository->findById($command->commentId);
        
        if (!$comment) {
            throw new InvalidArgumentException("Comment not found");
        }

        if (!$comment->getTenantId()->equals($command->tenantId)) {
            throw new InvalidArgumentException("Unauthorized access to comment");
        }

        $comment->approve();
        $this->commentRepository->save($comment);

        $content = $this->contentRepository->findById($comment->getContentId());
        if ($content) {
            $content->incrementCommentCount();
            $this->contentRepository->save($content);
        }

        return CommentResponse::fromEntity($comment);
    }
}
