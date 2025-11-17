<?php

namespace App\Application\Product\UseCases;

use App\Application\Product\Commands\CreateProductCategoryCommand;
use App\Domain\Product\Entities\ProductCategory;
use App\Domain\Product\Enums\ProductMaterial;
use App\Domain\Product\Enums\ProductQuality;
use App\Domain\Product\Repositories\ProductCategoryRepositoryInterface;
use App\Domain\Product\ValueObjects\ProductCategoryName;
use App\Domain\Product\ValueObjects\ProductCategorySlug;
use App\Domain\Shared\ValueObjects\Uuid;
use InvalidArgumentException;

class CreateProductCategoryUseCase
{
    public function __construct(
        private ProductCategoryRepositoryInterface $categoryRepository
    ) {}

    public function execute(CreateProductCategoryCommand $command): ProductCategory
    {
        // Validate tenant exists (should be validated by middleware)
        $tenantId = new Uuid($command->tenantId);
        
        // Create value objects
        $name = new ProductCategoryName($command->name);
        $slug = $command->slug 
            ? new ProductCategorySlug($command->slug)
            : ProductCategorySlug::fromName($command->name);

        // Check if slug already exists
        $existingCategory = $this->categoryRepository->findBySlug($tenantId, $slug->getValue());
        if ($existingCategory !== null) {
            throw new InvalidArgumentException("Category with slug \"{$slug->getValue()}\" already exists in this tenant");
        }

        // Handle parent category
        $parentId = null;
        $level = 0;
        $path = $slug->getValue();
        
        if ($command->parentId) {
            $parentCategory = $this->categoryRepository->findByUuid($command->parentId);
            
            if (!$parentCategory) {
                throw new InvalidArgumentException('Parent category not found');
            }
            
            if (!$parentCategory->getTenantId()->equals($tenantId)) {
                throw new InvalidArgumentException('Parent category belongs to different tenant');
            }
            
            $parentId = $parentCategory->getId();
            $level = $parentCategory->getLevel() + 1;
            $path = $parentCategory->getPath() . '/' . $slug->getValue();
        }

        // Validate materials if provided
        $allowedMaterials = [];
        if (!empty($command->allowedMaterials)) {
            $validMaterials = ['akrilik', 'kuningan', 'tembaga', 'stainless_steel', 'aluminum'];
            foreach ($command->allowedMaterials as $material) {
                if (!in_array($material, $validMaterials)) {
                    throw new InvalidArgumentException("Invalid material: {$material}");
                }
                $allowedMaterials[] = ProductMaterial::from($material);
            }
        }

        // Validate quality levels if provided
        $qualityLevels = [];
        if (!empty($command->qualityLevels)) {
            $validLevels = ['standard', 'tinggi', 'premium'];
            foreach ($command->qualityLevels as $qualityLevel) {
                if (!in_array($qualityLevel, $validLevels)) {
                    throw new InvalidArgumentException("Invalid quality: {$qualityLevel}");
                }
                $qualityLevels[] = ProductQuality::from($qualityLevel);
            }
        }

        // Validate markup percentage
        if ($command->baseMarkupPercentage !== null && ($command->baseMarkupPercentage < 0 || $command->baseMarkupPercentage > 100)) {
            throw new InvalidArgumentException('Markup percentage must be between 0 and 100');
        }

        // Create category entity
        $category = new ProductCategory(
            id: new Uuid($command->id),
            tenantId: $tenantId,
            name: $name,
            slug: $slug,
            description: $command->description,
            parentId: $parentId,
            sortOrder: $command->sortOrder ?? 0,
            level: $level,
            path: $path,
            image: $command->image,
            icon: $command->icon,
            colorScheme: $command->colorScheme,
            isActive: $command->isActive ?? true,
            isFeatured: $command->isFeatured ?? false,
            showInMenu: $command->showInMenu ?? true,
            allowedMaterials: $allowedMaterials,
            qualityLevels: $qualityLevels,
            customizationOptions: $command->customizationOptions ?? [],
            seoTitle: $command->seoTitle,
            seoDescription: $command->seoDescription,
            seoKeywords: $command->seoKeywords ?? [],
            baseMarkupPercentage: $command->baseMarkupPercentage,
            requiresQuote: $command->requiresQuote ?? false
        );

        // Save category
        $savedCategory = $this->categoryRepository->save($category);

        // Update hierarchy for all affected categories
        $this->categoryRepository->updateCategoryHierarchy($savedCategory->getId());

        return $savedCategory;
    }
}