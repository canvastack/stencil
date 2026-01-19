<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Content;

use Plugins\PagesEngine\Application\Responses\ContentResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class ListContentsUseCase
{
    public function __construct(
        private readonly ContentRepositoryInterface $contentRepository
    ) {}

    public function execute(array $filters): array
    {
        $tenantId = new Uuid($filters['tenant_id']);
        
        $contents = isset($filters['content_type_uuid']) && $filters['content_type_uuid']
            ? $this->contentRepository->findByContentType(new Uuid($filters['content_type_uuid']), $filters)
            : $this->contentRepository->findByTenant($tenantId, $filters);
        
        return [
            'data' => array_map(
                fn($content) => ContentResponse::fromEntity($content),
                is_array($contents) ? $contents : []
            ),
            'meta' => [
                'total' => count($contents),
                'page' => $filters['page'] ?? 1,
                'per_page' => $filters['per_page'] ?? 15,
            ],
        ];
    }
}
