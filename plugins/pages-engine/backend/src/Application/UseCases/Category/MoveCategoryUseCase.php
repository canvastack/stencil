<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Category;

use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Plugins\PagesEngine\Application\Commands\MoveCategoryCommand;
use Plugins\PagesEngine\Application\Responses\CategoryResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentCategoryRepositoryInterface;
use Plugins\PagesEngine\Domain\Services\CategoryPathCalculator;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use InvalidArgumentException;

final class MoveCategoryUseCase
{
    public function __construct(
        private readonly ContentCategoryRepositoryInterface $categoryRepository,
        private readonly CategoryPathCalculator $pathCalculator
    ) {}

    public function execute(MoveCategoryCommand $command): CategoryResponse
    {
        $category = $this->categoryRepository->findById($command->categoryId);
        
        if (!$category) {
            throw new InvalidArgumentException("Category not found");
        }

        $tenantUuid = TenantEloquentModel::where('id', $command->tenantId)->value('uuid');
        if (!$category->getTenantId()->equals(new Uuid($tenantUuid))) {
            throw new InvalidArgumentException("Unauthorized access to category");
        }

        if ($command->newParentId) {
            $newParent = $this->categoryRepository->findById($command->newParentId);
            
            if (!$newParent) {
                throw new InvalidArgumentException("New parent category not found");
            }

            if ($newParent->getId()->equals($command->categoryId)) {
                throw new InvalidArgumentException("Cannot move category to itself");
            }

            $wouldCreateCircularRef = $this->pathCalculator->detectCircularReference(
                $command->categoryId,
                $command->newParentId,
                fn($id) => $this->categoryRepository->findById($id)
            );
            
            if ($wouldCreateCircularRef) {
                throw new InvalidArgumentException("Cannot move category: would create circular reference");
            }
        }

        $category->updateParent($command->newParentId);

        $this->categoryRepository->save($category);

        return CategoryResponse::fromEntity($category);
    }
}
