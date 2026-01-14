<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Comment;

use Plugins\PagesEngine\Application\Responses\CommentResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentCommentRepositoryInterface;

final class ListCommentsUseCase
{
    public function __construct(
        private readonly ContentCommentRepositoryInterface $contentcommentRepository
    ) {}

    public function execute(array $filters): array
    {
        $contentcomments = $this->contentcommentRepository->findWithFilters($filters);
        
        return [
            'data' => array_map(
                fn($contentcomment) => CommentResponse::fromEntity($contentcomment),
                $contentcomments['data'] ?? $contentcomments
            ),
            'meta' => $contentcomments['meta'] ?? [
                'total' => count($contentcomments),
                'page' => 1,
                'per_page' => count($contentcomments),
            ],
        ];
    }
}
