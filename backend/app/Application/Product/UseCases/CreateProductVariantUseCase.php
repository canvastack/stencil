<?php

namespace App\Application\Product\UseCases;

use App\Application\Product\Commands\CreateProductVariantCommand;
use App\Domain\Product\Entities\ProductVariant;
use App\Domain\Product\Repositories\ProductCategoryRepositoryInterface;
use App\Domain\Product\Repositories\ProductVariantRepositoryInterface;
use App\Domain\Product\ValueObjects\ProductPrice;
use App\Domain\Product\ValueObjects\ProductSku;
use App\Domain\Product\Enums\ProductMaterial;
use App\Domain\Product\Enums\ProductQuality;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use InvalidArgumentException;

class CreateProductVariantUseCase
{
    public function __construct(
        private ProductCategoryRepositoryInterface $categoryRepository,
        private ProductVariantRepositoryInterface $variantRepository
    ) {}

    public function execute(CreateProductVariantCommand $command): ProductVariant
    {
        // Validate tenant exists (should be validated by middleware)
        $tenantId = new Uuid($command->tenantId);
        $categoryId = new Uuid($command->categoryId);

        // Validate category exists and belongs to tenant
        $category = $this->categoryRepository->findById($categoryId);
        if (!$category) {
            throw new InvalidArgumentException('Category not found');
        }

        if (!$category->getTenantId()->equals($tenantId)) {
            throw new InvalidArgumentException('Category belongs to different tenant');
        }

        // Validate and convert material
        $material = ProductMaterial::tryFrom($command->material);
        if (!$material) {
            throw new InvalidArgumentException("Invalid material: {$command->material}");
        }

        // Validate and convert quality
        $quality = ProductQuality::tryFrom($command->quality);
        if (!$quality) {
            throw new InvalidArgumentException("Invalid quality: {$command->quality}");
        }

        // Check if variant already exists for this category/material/quality combination
        $existingVariant = $this->variantRepository->findByCategoryMaterialQuality(
            new UuidValueObject($categoryId->getValue()),
            $material,
            $quality
        );
        if ($existingVariant) {
            throw new InvalidArgumentException('Variant with this material and quality already exists for this category');
        }

        // Validate custom SKU if provided
        if ($command->customSku) {
            if ($this->variantRepository->isSkuExists(new UuidValueObject($tenantId->getValue()), $command->customSku)) {
                throw new InvalidArgumentException("SKU '{$command->customSku}' already exists");
            }
        }

        // Validate dimensions
        if ($command->length !== null && $command->length < 0) {
            throw new InvalidArgumentException('Length must be positive');
        }
        if ($command->width !== null && $command->width < 0) {
            throw new InvalidArgumentException('Width must be positive');
        }
        if ($command->height !== null && $command->height < 0) {
            throw new InvalidArgumentException('Height must be positive');
        }

        // Validate weight
        if ($command->weight !== null && $command->weight < 0) {
            throw new InvalidArgumentException('Weight must be positive');
        }

        // Validate stock quantity
        if ($command->stockQuantity !== null && $command->stockQuantity < 0) {
            throw new InvalidArgumentException('Stock quantity must be non-negative');
        }

        // Validate pricing
        if ($command->basePrice !== null && $command->basePrice < 0) {
            throw new InvalidArgumentException('Base price must be non-negative');
        }
        if ($command->sellingPrice !== null && $command->sellingPrice < 0) {
            throw new InvalidArgumentException('Selling price must be non-negative');
        }
        if ($command->retailPrice !== null && $command->retailPrice < 0) {
            throw new InvalidArgumentException('Retail price must be non-negative');
        }

        // Create ProductVariant entity
        $variant = new ProductVariant(
            id: new Uuid($command->id),
            tenantId: $tenantId,
            categoryId: $categoryId,
            material: $material,
            quality: $quality
        );

        // Set additional properties
        if ($command->name) {
            $variant->updateName(new \App\Domain\Product\ValueObjects\ProductName($command->name));
        }

        if ($command->basePrice || $command->sellingPrice || $command->retailPrice) {
            $variant->updatePricing(
                $command->basePrice ?? 0,
                $command->sellingPrice ?? $command->basePrice ?? 0,
                $command->retailPrice ?? $command->sellingPrice ?? $command->basePrice ?? 0
            );
        }

        if ($command->stockQuantity !== null) {
            $variant->updateStock($command->stockQuantity);
        }

        if ($command->lowStockThreshold) {
            $variant->setLowStockThreshold($command->lowStockThreshold);
        }

        if ($command->length || $command->width || $command->thickness) {
            $variant->setDimensions(
                $command->length ?? 0,
                $command->width ?? 0,
                $command->thickness
            );
        }

        if ($command->weight) {
            $variant->setWeight($command->weight);
        }

        if ($command->customSku) {
            $variant->setCustomSku($command->customSku);
        }

        if ($command->etchingSpecifications) {
            $variant->setEtchingSpecifications($command->etchingSpecifications);
        }

        if ($command->isActive !== null) {
            if ($command->isActive) {
                $variant->activate();
            } else {
                $variant->deactivate();
            }
        }

        // Save variant
        $savedVariant = $this->variantRepository->save($variant);

        return $savedVariant;
    }
}