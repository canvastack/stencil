<?php

namespace App\Infrastructure\Presentation\Http\Resources\Product;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            
            // Flat fields for frontend compatibility
            'parent_id' => $this->parent_id,
            'image' => $this->image,
            'color' => $this->color_scheme,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'is_featured' => $this->is_featured,
            'product_count' => $this->when($this->relationLoaded('products'), function () {
                return $this->products->count();
            }),
            
            'hierarchy' => [
                'parentUuid' => $this->parent?->uuid,
                'level' => $this->level,
                'path' => $this->path,
                'fullPath' => $this->getFullPath(),
                'breadcrumb' => $this->getBreadcrumb(),
                'hasChildren' => $this->hasChildren(),
            ],
            
            'sortOrder' => $this->sort_order,
            
            'media' => [
                'image' => $this->image,
                'icon' => $this->icon,
                'colorScheme' => $this->color_scheme,
            ],
            
            'visibility' => [
                'isActive' => $this->is_active,
                'isFeatured' => $this->is_featured,
                'showInMenu' => $this->show_in_menu,
            ],
            
            'configuration' => [
                'allowedMaterials' => $this->allowed_materials ?? [],
                'qualityLevels' => $this->quality_levels ?? [],
                'customizationOptions' => $this->customization_options ?? [],
                'baseMarkupPercentage' => $this->base_markup_percentage,
                'requiresQuote' => $this->requires_quote,
            ],
            
            'seo' => [
                'seoTitle' => $this->seo_title,
                'seoDescription' => $this->seo_description,
                'seoKeywords' => $this->seo_keywords ?? [],
            ],
            
            'stats' => [
                'productCount' => $this->products()->count(),
                'hasProducts' => $this->hasProducts(),
            ],
            
            'timestamps' => [
                'createdAt' => $this->created_at?->toIso8601String(),
                'updatedAt' => $this->updated_at?->toIso8601String(),
            ],
            
            'relationships' => [
                'parent' => $this->when($this->parent, fn() => [
                    'uuid' => $this->parent->uuid,
                    'name' => $this->parent->name,
                    'slug' => $this->parent->slug,
                ]),
                'children' => $this->when($this->relationLoaded('children'), fn() => 
                    ProductCategoryResource::collection($this->children)
                ),
            ],
        ];
    }
}
