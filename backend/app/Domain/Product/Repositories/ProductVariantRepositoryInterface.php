<?php

namespace App\Domain\Product\Repositories;

use App\Domain\Product\Entities\ProductVariant;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Product\Enums\ProductMaterial;
use App\Domain\Product\Enums\ProductQuality;

interface ProductVariantRepositoryInterface
{
    /**
     * Find variant by ID
     */
    public function findById(UuidValueObject $id): ?ProductVariant;

    /**
     * Find variant by UUID
     */
    public function findByUuid(string $uuid): ?ProductVariant;

    /**
     * Find variant by SKU within tenant
     */
    public function findBySku(UuidValueObject $tenantId, string $sku): ?ProductVariant;

    /**
     * Find variant by category, material and quality combination
     */
    public function findByCategoryMaterialQuality(
        UuidValueObject $categoryId,
        ProductMaterial $material,
        ProductQuality $quality
    ): ?ProductVariant;

    /**
     * Get all variants for a product
     */
    public function getByProductId(UuidValueObject $productId, bool $activeOnly = true): array;

    /**
     * Get default variant for a product
     */
    public function getDefaultVariant(UuidValueObject $productId): ?ProductVariant;

    /**
     * Get variants by material
     */
    public function getByMaterial(UuidValueObject $tenantId, ProductMaterial $material, bool $activeOnly = true): array;

    /**
     * Get variants by quality
     */
    public function getByQuality(UuidValueObject $tenantId, ProductQuality $quality, bool $activeOnly = true): array;

    /**
     * Get variants by material and quality combination
     */
    public function getByMaterialAndQuality(
        UuidValueObject $tenantId,
        ProductMaterial $material,
        ProductQuality $quality,
        bool $activeOnly = true
    ): array;

    /**
     * Get low stock variants
     */
    public function getLowStockVariants(UuidValueObject $tenantId): array;

    /**
     * Get out of stock variants
     */
    public function getOutOfStockVariants(UuidValueObject $tenantId): array;

    /**
     * Get variants with specific custom field
     */
    public function getByCustomField(UuidValueObject $tenantId, string $fieldName, $fieldValue): array;

    /**
     * Search variants by name or SKU
     */
    public function search(UuidValueObject $tenantId, string $query, int $limit = 20): array;

    /**
     * Save variant
     */
    public function save(ProductVariant $variant): ProductVariant;

    /**
     * Delete variant
     */
    public function delete(UuidValueObject $id): bool;

    /**
     * Check if SKU exists in tenant (excluding given variant ID)
     */
    public function isSkuExists(UuidValueObject $tenantId, string $sku, ?UuidValueObject $excludeId = null): bool;

    /**
     * Update stock for variant
     */
    public function updateStock(UuidValueObject $variantId, int $quantity): bool;

    /**
     * Bulk update stock for multiple variants
     */
    public function bulkUpdateStock(array $updates): bool; // [['variant_id' => uuid, 'quantity' => int]]

    /**
     * Set default variant for product (unset others)
     */
    public function setDefaultVariant(UuidValueObject $productId, UuidValueObject $variantId): bool;

    /**
     * Reorder variants within product
     */
    public function reorderVariants(UuidValueObject $productId, array $variantIds): void;

    /**
     * Get variant pricing summary for product
     */
    public function getVariantPricingSummary(UuidValueObject $productId): array;

    /**
     * Get variants needing vendor price update
     */
    public function getVariantsNeedingPriceUpdate(UuidValueObject $tenantId): array;

    /**
     * Get variants by price range
     */
    public function getByPriceRange(UuidValueObject $tenantId, int $minPrice, int $maxPrice): array;

    /**
     * Get variants with images
     */
    public function getVariantsWithImages(UuidValueObject $tenantId): array;

    /**
     * Get variants by lead time
     */
    public function getByLeadTime(UuidValueObject $tenantId, int $maxLeadTimeDays): array;
}