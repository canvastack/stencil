<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Category;

use Plugins\PagesEngine\Application\Responses\CategoryResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentCategoryRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class GetCategoryTreeUseCase
{
    public function __construct(
        private readonly ContentCategoryRepositoryInterface $categoryRepository
    ) {}

    public function execute(string $tenantId, ?string $contentTypeUuid = null): array
    {
        if (!$contentTypeUuid) {
            return [];
        }
        
        $tree = $this->categoryRepository->findTree(
            new Uuid($tenantId),
            new Uuid($contentTypeUuid)
        );
        
        return array_map(
            fn($category) => CategoryResponse::fromEntity($category),
            $tree
        );
    }
}
