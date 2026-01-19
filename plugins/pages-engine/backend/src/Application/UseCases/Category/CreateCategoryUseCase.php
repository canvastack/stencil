<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Category;

use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
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
        
        $existingCategory = $this->categoryRepository->findBySlug(
            $slug,
            $command->tenantId,
            $command->contentTypeId
        );
        
        if ($existingCategory) {
            throw new InvalidArgumentException("Category with slug '{$command->slug}' already exists in this content type");
        }

        $parentCategory = null;
        if ($command->parentId) {
            $parentCategory = $this->categoryRepository->findById($command->parentId);
            if (!$parentCategory) {
                throw new InvalidArgumentException("Parent category not found");
            }
        }
        
        $level = $this->pathCalculator->calculateLevel($parentCategory);
        $path = new CategoryPath('/' . $command->slug);

        $tenantUuid = TenantEloquentModel::where('id', $command->tenantId)->value('uuid');
        
        $category = new ContentCategory(
            id: new Uuid(\Ramsey\Uuid\Uuid::uuid4()->toString()),
            tenantId: new Uuid($tenantUuid),
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
