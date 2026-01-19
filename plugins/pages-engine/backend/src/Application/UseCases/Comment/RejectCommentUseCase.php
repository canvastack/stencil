<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Comment;

use Plugins\PagesEngine\Application\Commands\RejectCommentCommand;
use Plugins\PagesEngine\Application\Responses\CommentResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentCommentRepositoryInterface;
use InvalidArgumentException;

final class RejectCommentUseCase
{
    public function __construct(
        private readonly ContentCommentRepositoryInterface $commentRepository
    ) {}

    public function execute(RejectCommentCommand $command): CommentResponse
    {
        $comment = $this->commentRepository->findById($command->commentId);
        
        if (!$comment) {
            throw new InvalidArgumentException("Comment not found");
        }

        if (!$comment->getTenantId()->equals($command->tenantId)) {
            throw new InvalidArgumentException("Unauthorized access to comment");
        }

        $comment->reject();
        $this->commentRepository->save($comment);

        return CommentResponse::fromEntity($comment);
    }
}
