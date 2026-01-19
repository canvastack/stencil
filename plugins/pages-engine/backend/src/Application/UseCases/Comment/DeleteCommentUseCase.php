<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Comment;

use Plugins\PagesEngine\Domain\Repositories\ContentCommentRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use RuntimeException;

final class DeleteCommentUseCase
{
    public function __construct(
        private readonly ContentCommentRepositoryInterface $contentcommentRepository
    ) {}

    public function execute(string $uuid, string $tenantId): void
    {
        $contentcomment = $this->contentcommentRepository->findByUuid(new Uuid($uuid), $tenantId);
        
        if (!$contentcomment) {
            throw new RuntimeException("ContentComment not found");
        }

        $this->contentcommentRepository->delete($contentcomment->getId());
    }
}
