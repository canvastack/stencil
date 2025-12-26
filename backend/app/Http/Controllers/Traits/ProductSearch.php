<?php

namespace App\Http\Controllers\Traits;

/**
 * ProductSearch Trait
 * 
 * Phase 1.5: Unified search logic for Product controllers
 * Ensures admin search and public search return consistent results
 * 
 * This trait applies the same search logic across:
 * - Public Product API (App\Http\Controllers\Api\V1\Public\ProductController)
 * - Tenant Product API (App\Infrastructure\Presentation\Http\Controllers\Tenant\ProductController)
 * 
 * Search Fields:
 * - name (text)
 * - description (text)
 * - long_description (text)
 * - sku (text)
 * - tags (JSON array)
 * 
 * @see roadmaps/AUDIT/FINDING/PRODUCT/MATCHING_BACKEND_FRONTEND_DATA/02-ROADMAP.md Phase 1.5
 */
trait ProductSearch
{
    /**
     * Apply unified search logic to a query builder
     * 
     * Searches across multiple fields with case-insensitive ILIKE matching:
     * - Product name
     * - Short description
     * - Long description
     * - SKU
     * - Tags (JSON contains)
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query The query builder instance
     * @param string $search The search term
     * @return void
     */
    protected function applyProductSearch($query, string $search): void
    {
        $query->where(function ($q) use ($search) {
            $q->where('name', 'ILIKE', "%{$search}%")
              ->orWhere('description', 'ILIKE', "%{$search}%")
              ->orWhere('long_description', 'ILIKE', "%{$search}%")
              ->orWhere('sku', 'ILIKE', "%{$search}%")
              ->orWhereJsonContains('tags', $search);
        });
    }

    /**
     * Validate search request parameters
     * 
     * Returns standardized validation rules for product search
     * 
     * @return array Validation rules
     */
    protected function getProductSearchValidationRules(): array
    {
        return [
            'search' => 'string|nullable|max:255',
            'query' => 'string|nullable|max:255', // Alternative parameter name
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
            'limit' => 'integer|min:1|max:100', // Alternative parameter name
        ];
    }
}
