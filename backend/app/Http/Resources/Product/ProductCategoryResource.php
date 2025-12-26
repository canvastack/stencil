<?php

namespace App\Http\Resources\Product;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductCategoryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            // ✅ FIX: Use UUID for public consumption (ZERO TOLERANCE RULE)
            'id' => $this->uuid,
            'uuid' => $this->uuid,
            
            // Internal ID only for authenticated admins with products.manage permission
            '_internal_id' => $this->when(
                $request->user()?->can('products.manage'),
                $this->id
            ),
            
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'parent_id' => $this->parent_id,
            'image' => $this->image,
            'order' => $this->order,
            'is_active' => $this->is_active,
            
            // Relationships - loaded conditionally
            'parent' => $this->whenLoaded('parent', function () {
                return new ProductCategoryResource($this->parent);
            }),
            
            'children' => ProductCategoryResource::collection($this->whenLoaded('children')),
            
            'products' => ProductResource::collection($this->whenLoaded('products')),
            
            // Computed properties - loaded conditionally
            'products_count' => $this->when(
                isset($this->products_count),
                $this->products_count
            ),
            
            'has_children' => $this->when(
                isset($this->children_count),
                $this->children_count > 0
            ),
            
            'breadcrumb' => $this->when(
                $this->relationLoaded('parent') || isset($this->breadcrumb),
                function () {
                    return $this->getBreadcrumb();
                }
            ),
            
            // Metadata
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // URLs for images and links
            'image_url' => $this->when($this->image, function () {
                return $this->getImageUrl();
            }),
            
            'public_url' => $this->when(
                $request->boolean('include_urls', false),
                function () {
                    return $this->getPublicUrl();
                }
            ),
        ];
    }

    /**
     * Get the breadcrumb trail for this category.
     */
    private function getBreadcrumb(): array
    {
        $breadcrumb = [];
        $current = $this->resource;
        
        while ($current) {
            array_unshift($breadcrumb, [
                'id' => $current->uuid, // ✅ Use UUID instead of integer ID
                'name' => $current->name,
                'slug' => $current->slug,
            ]);
            $current = $current->parent;
        }
        
        return $breadcrumb;
    }

    /**
     * Get the full image URL.
     */
    private function getImageUrl(): ?string
    {
        if (!$this->image) {
            return null;
        }

        // If it's already a full URL, return as is
        if (filter_var($this->image, FILTER_VALIDATE_URL)) {
            return $this->image;
        }

        // Otherwise, construct the full URL
        return url('storage/' . ltrim($this->image, '/'));
    }

    /**
     * Get the public URL for this category.
     */
    private function getPublicUrl(): string
    {
        $tenant = tenant();
        $baseUrl = $tenant ? $tenant->getPublicUrl() : url('/');
        
        return $baseUrl . '/categories/' . $this->slug;
    }

    /**
     * Get additional data that should be included with the resource array.
     */
    public function with(Request $request): array
    {
        return [
            'meta' => [
                'version' => '1.0',
                'type' => 'product_category',
            ],
        ];
    }
}