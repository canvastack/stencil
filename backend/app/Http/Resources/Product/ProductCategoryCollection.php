<?php

namespace App\Http\Resources\Product;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class ProductCategoryCollection extends ResourceCollection
{
    /**
     * The resource that this resource collects.
     */
    public $collects = ProductCategoryResource::class;

    /**
     * Transform the resource collection into an array.
     *
     * @return array<int|string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'meta' => [
                'total' => $this->collection->count(),
                'hierarchical' => $this->isHierarchical(),
                'max_depth' => $this->getMaxDepth(),
            ],
        ];
    }

    /**
     * Check if the collection contains hierarchical data.
     */
    private function isHierarchical(): bool
    {
        return $this->collection->contains(function ($category) {
            return isset($category->resource->children) && 
                   $category->resource->children->count() > 0;
        });
    }

    /**
     * Get the maximum depth of the category hierarchy.
     */
    private function getMaxDepth(): int
    {
        $maxDepth = 0;
        
        foreach ($this->collection as $category) {
            $depth = $this->calculateDepth($category->resource, 0);
            $maxDepth = max($maxDepth, $depth);
        }
        
        return $maxDepth;
    }

    /**
     * Calculate the depth of a category recursively.
     */
    private function calculateDepth($category, $currentDepth): int
    {
        $maxChildDepth = $currentDepth;
        
        if (isset($category->children)) {
            foreach ($category->children as $child) {
                $childDepth = $this->calculateDepth($child, $currentDepth + 1);
                $maxChildDepth = max($maxChildDepth, $childDepth);
            }
        }
        
        return $maxChildDepth;
    }

    /**
     * Get additional data that should be included with the resource array.
     */
    public function with(Request $request): array
    {
        return [
            'meta' => [
                'version' => '1.0',
                'resource_type' => 'product_category_collection',
                'timestamp' => now()->toISOString(),
            ],
        ];
    }
}