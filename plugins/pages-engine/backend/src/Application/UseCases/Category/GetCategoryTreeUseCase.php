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

    public function execute(int $tenantId, ?string $contentTypeUuid = null): array
    {
        if ($contentTypeUuid) {
            $tree = $this->categoryRepository->findTree(
                $tenantId,
                new Uuid($contentTypeUuid)
            );
        } else {
            $tree = $this->categoryRepository->findByTenant($tenantId);
        }
        
        return array_map(
            fn($category) => CategoryResponse::fromEntity($category),
            $tree
        );
    }
}
