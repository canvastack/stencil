<?php

namespace App\Domain\Product\Repositories;

use App\Domain\Product\Entities\ProductCategory;
use App\Domain\Shared\ValueObjects\Uuid;

interface ProductCategoryRepositoryInterface
{
    /**
     * Find category by ID
     */
    public function findById(Uuid $id): ?ProductCategory;

    /**
     * Find category by UUID
     */
    public function findByUuid(string $uuid): ?ProductCategory;

    /**
     * Find category by slug within tenant
     */
    public function findBySlug(Uuid $tenantId, string $slug): ?ProductCategory;

    /**
     * Get all root categories (level 0) for tenant
     */
    public function getRootCategories(Uuid $tenantId, bool $activeOnly = true): array;

    /**
     * Get all categories for tenant with hierarchy
     */
    public function getAllCategories(Uuid $tenantId, bool $activeOnly = true): array;

    /**
     * Get categories by parent ID
     */
    public function getChildCategories(Uuid $parentId, bool $activeOnly = true): array;

    /**
     * Get featured categories for tenant
     */
    public function getFeaturedCategories(Uuid $tenantId, int $limit = 10): array;

    /**
     * Get category path from root to category
     */
    public function getCategoryPath(Uuid $categoryId): array;

    /**
     * Get all descendant categories (children, grandchildren, etc.)
     */
    public function getDescendantCategories(Uuid $categoryId, bool $activeOnly = true): array;

    /**
     * Check if category has products
     */
    public function hasProducts(Uuid $categoryId): bool;

    /**
     * Check if category has child categories
     */
    public function hasChildCategories(Uuid $categoryId): bool;

    /**
     * Save category
     */
    public function save(ProductCategory $category): ProductCategory;

    /**
     * Delete category
     */
    public function delete(Uuid $id): bool;

    /**
     * Check if slug exists in tenant (excluding given category ID)
     */
    public function isSlugExists(Uuid $tenantId, string $slug, ?Uuid $excludeId = null): bool;

    /**
     * Get categories with products count
     */
    public function getCategoriesWithProductCount(Uuid $tenantId, bool $activeOnly = true): array;

    /**
     * Update category hierarchy (level, path) for category and descendants
     */
    public function updateCategoryHierarchy(Uuid $categoryId): void;

    /**
     * Reorder categories within same parent
     */
    public function reorderCategories(array $categoryIds): void;

    /**
     * Search categories by name
     */
    public function searchByName(Uuid $tenantId, string $query, int $limit = 20): array;

    /**
     * Get categories by material
     */
    public function getCategoriesByMaterial(Uuid $tenantId, string $material): array;
}