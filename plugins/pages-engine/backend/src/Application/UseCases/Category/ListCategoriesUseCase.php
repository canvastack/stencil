<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Category;

use Plugins\PagesEngine\Application\Responses\CategoryResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentCategoryRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class ListCategoriesUseCase
{
    public function __construct(
        private readonly ContentCategoryRepositoryInterface $categoryRepository
    ) {}

    public function execute(array $filters): array
    {
        $tenantId = $filters['tenant_id'];
        $contentTypeId = isset($filters['content_type_uuid']) && $filters['content_type_uuid']
            ? new Uuid($filters['content_type_uuid'])
            : null;
        
        $categories = $this->categoryRepository->findByTenant($tenantId, $contentTypeId);
        
        return [
            'data' => array_map(
                fn($category) => CategoryResponse::fromEntity($category),
                is_array($categories) ? $categories : []
            ),
            'meta' => [
                'total' => count($categories),
                'page' => $filters['page'] ?? 1,
                'per_page' => $filters['per_page'] ?? 50,
            ],
        ];
    }
}
