<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Category;

use Plugins\PagesEngine\Application\Commands\DeleteCategoryCommand;
use Plugins\PagesEngine\Domain\Repositories\ContentCategoryRepositoryInterface;
use InvalidArgumentException;

final class DeleteCategoryUseCase
{
    public function __construct(
        private readonly ContentCategoryRepositoryInterface $categoryRepository
    ) {}

    public function execute(DeleteCategoryCommand $command): void
    {
        $category = $this->categoryRepository->findById($command->categoryId);
        
        if (!$category) {
            throw new InvalidArgumentException("Category not found");
        }

        if (!$category->getTenantId()->equals($command->tenantId)) {
            throw new InvalidArgumentException("Unauthorized access to category");
        }

        $childCategories = $this->categoryRepository->findChildren($command->categoryId);
        
        if (!empty($childCategories)) {
            foreach ($childCategories as $child) {
                $child->updateParent($category->getParentId());
                $this->categoryRepository->save($child);
            }
        }

        $this->categoryRepository->delete($command->categoryId);
    }
}
