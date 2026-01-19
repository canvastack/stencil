<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Revision;

use Plugins\PagesEngine\Application\Responses\RevisionResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentRevisionRepositoryInterface;

final class ListRevisionsUseCase
{
    public function __construct(
        private readonly ContentRevisionRepositoryInterface $contentrevisionRepository
    ) {}

    public function execute(array $filters): array
    {
        $contentrevisions = $this->contentrevisionRepository->findWithFilters($filters);
        
        return [
            'data' => array_map(
                fn($contentrevision) => RevisionResponse::fromEntity($contentrevision),
                $contentrevisions['data'] ?? $contentrevisions
            ),
            'meta' => $contentrevisions['meta'] ?? [
                'total' => count($contentrevisions),
                'page' => 1,
                'per_page' => count($contentrevisions),
            ],
        ];
    }
}
