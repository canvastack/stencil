<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Content;

use Plugins\PagesEngine\Application\Responses\ContentResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentRepositoryInterface;

final class SearchContentsUseCase
{
    public function __construct(
        private readonly ContentRepositoryInterface $contentRepository
    ) {}

    public function execute(string $query, array $filters): array
    {
        $results = $this->contentRepository->search($query, $filters);
        
        return [
            'data' => array_map(
                fn($content) => ContentResponse::fromEntity($content),
                $results['data'] ?? $results
            ),
            'meta' => $results['meta'] ?? [
                'total' => count($results),
                'page' => 1,
                'per_page' => count($results),
            ],
        ];
    }
}
