<?php

namespace App\Domain\Product\Repositories;

use App\Domain\Product\Entities\Product;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Product\ValueObjects\ProductSku;
use App\Domain\Product\Enums\ProductStatus;
use App\Domain\Product\Enums\ProductType;

interface ProductRepositoryInterface
{
    public function findById(UuidValueObject $id): ?Product;

    public function findBySku(UuidValueObject $tenantId, ProductSku $sku): ?Product;

    public function findByTenantId(UuidValueObject $tenantId): array;

    public function findByStatus(UuidValueObject $tenantId, ProductStatus $status): array;

    public function findByType(UuidValueObject $tenantId, ProductType $type): array;

    public function findByCategory(UuidValueObject $tenantId, string $category): array;

    public function findByTag(UuidValueObject $tenantId, string $tag): array;

    public function findLowStock(UuidValueObject $tenantId): array;

    public function findOutOfStock(UuidValueObject $tenantId): array;

    public function findPublished(UuidValueObject $tenantId): array;

    public function save(Product $product): Product;

    public function delete(UuidValueObject $id): bool;

    public function existsBySku(UuidValueObject $tenantId, ProductSku $sku): bool;

    public function countByTenantId(UuidValueObject $tenantId): int;

    public function countByStatus(UuidValueObject $tenantId, ProductStatus $status): int;

    public function searchByName(UuidValueObject $tenantId, string $searchTerm): array;

    public function findByPriceRange(UuidValueObject $tenantId, float $minPrice, float $maxPrice): array;

    public function updateStock(UuidValueObject $productId, int $quantity): bool;
}