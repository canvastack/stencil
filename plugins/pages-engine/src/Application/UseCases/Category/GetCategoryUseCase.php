<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Category;

use Plugins\PagesEngine\Application\Responses\CategoryResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentCategoryRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use RuntimeException;

final class GetCategoryUseCase
{
    public function __construct(
        private readonly ContentCategoryRepositoryInterface $categoryRepository
    ) {}

    public function execute(string $uuid, string $tenantId): CategoryResponse
    {
        $category = $this->categoryRepository->findById(new Uuid($uuid));
        
        if (!$category) {
            throw new RuntimeException("Category not found");
        }
        
        if ($category->getTenantId()->getValue() !== $tenantId) {
            throw new RuntimeException("Category not found");
        }

        return CategoryResponse::fromEntity($category);
    }
}
