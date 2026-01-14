<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Category;

use Plugins\PagesEngine\Application\Commands\CreateCategoryCommand;
use Plugins\PagesEngine\Application\Responses\CategoryResponse;
use Plugins\PagesEngine\Domain\Entities\ContentCategory;
use Plugins\PagesEngine\Domain\Repositories\ContentCategoryRepositoryInterface;
use Plugins\PagesEngine\Domain\Services\CategoryPathCalculator;
use Plugins\PagesEngine\Domain\ValueObjects\CategorySlug;
use Plugins\PagesEngine\Domain\ValueObjects\CategoryPath;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use InvalidArgumentException;

final class CreateCategoryUseCase
{
    public function __construct(
        private readonly ContentCategoryRepositoryInterface $categoryRepository,
        private readonly CategoryPathCalculator $pathCalculator
    ) {}

    public function execute(CreateCategoryCommand $command): CategoryResponse
    {
        $slug = new CategorySlug($command->slug);
        
        $existingCategory = $this->categoryRepository->findBySlugInContentType(
            $command->tenantId,
            $command->contentTypeId,
            $slug
        );
        
        if ($existingCategory) {
            throw new InvalidArgumentException("Category with slug '{$command->slug}' already exists in this content type");
        }

        $level = 0;
        $path = CategoryPath::fromSlug($command->slug);
        
        if ($command->parentId) {
            $parentCategory = $this->categoryRepository->findById($command->parentId);
            if (!$parentCategory) {
                throw new InvalidArgumentException("Parent category not found");
            }
            
            if ($this->pathCalculator->wouldCreateCircularReference($parentCategory, $command->slug)) {
                throw new InvalidArgumentException("Circular category reference detected");
            }
            
            $level = $this->pathCalculator->calculateLevel($parentCategory) + 1;
            $path = $this->pathCalculator->buildPath($parentCategory, $command->slug);
        }

        $category = new ContentCategory(
            id: new Uuid(\Ramsey\Uuid\Uuid::uuid4()->toString()),
            tenantId: $command->tenantId,
            contentTypeId: $command->contentTypeId,
            name: $command->name,
            slug: $slug,
            path: $path,
            parentId: $command->parentId,
            level: $level,
            description: $command->description,
            seoTitle: $command->seoTitle,
            seoDescription: $command->seoDescription,
            metadata: $command->metadata
        );

        $this->categoryRepository->save($category);

        return CategoryResponse::fromEntity($category);
    }
}
