<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Category;

use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Plugins\PagesEngine\Application\Commands\UpdateCategoryCommand;
use Plugins\PagesEngine\Application\Responses\CategoryResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentCategoryRepositoryInterface;
use Plugins\PagesEngine\Domain\Services\CategoryPathCalculator;
use Plugins\PagesEngine\Domain\ValueObjects\CategorySlug;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use InvalidArgumentException;

final class UpdateCategoryUseCase
{
    public function __construct(
        private readonly ContentCategoryRepositoryInterface $categoryRepository,
        private readonly CategoryPathCalculator $pathCalculator
    ) {}

    public function execute(UpdateCategoryCommand $command): CategoryResponse
    {
        $category = $this->categoryRepository->findById($command->categoryId);
        
        if (!$category) {
            throw new InvalidArgumentException("Category not found");
        }

        $tenantUuid = TenantEloquentModel::where('id', $command->tenantId)->value('uuid');
        if (!$category->getTenantId()->equals(new Uuid($tenantUuid))) {
            throw new InvalidArgumentException("Unauthorized access to category");
        }

        if ($command->name !== null) {
            $category->updateName($command->name);
        }

        if ($command->slug !== null) {
            $newSlug = new CategorySlug($command->slug);
            $existingCategory = $this->categoryRepository->findBySlug(
                $newSlug,
                $command->tenantId,
                $category->getContentTypeId()
            );
            
            if ($existingCategory && !$existingCategory->getId()->equals($command->categoryId)) {
                throw new InvalidArgumentException("Category with slug '{$command->slug}' already exists");
            }
            
            $category->updateSlug($newSlug);
        }

        if ($command->description !== null) {
            $category->updateDescription($command->description);
        }

        if ($command->seoTitle !== null) {
            $category->updateSeoTitle($command->seoTitle);
        }

        if ($command->seoDescription !== null) {
            $category->updateSeoDescription($command->seoDescription);
        }

        if ($command->metadata !== null) {
            $category->updateMetadata($command->metadata);
        }

        $this->categoryRepository->save($category);

        return CategoryResponse::fromEntity($category);
    }
}
