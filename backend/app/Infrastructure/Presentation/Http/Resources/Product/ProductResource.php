<?php

namespace App\Infrastructure\Presentation\Http\Resources\Product;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'tenantId' => $this->tenant_id,
            
            'name' => $this->name,
            'sku' => $this->sku,
            'slug' => $this->slug,
            'description' => $this->description,
            'longDescription' => $this->long_description,
            
            'category' => [
                'id' => $this->category_id,
                'name' => $this->category->name ?? null,
                'slug' => $this->category->slug ?? null,
            ],
            'subcategory' => $this->subcategory,
            
            'pricing' => [
                'price' => $this->price,
                'currency' => $this->currency,
                'priceUnit' => $this->price_unit,
                'vendorPrice' => $this->vendor_price,
                'markupPercentage' => $this->markup_percentage,
                'profitMargin' => $this->getProfitMargin(),
                'minPrice' => $this->min_price,
                'maxPrice' => $this->max_price,
            ],
            
            'status' => $this->status,
            'type' => $this->type,
            'productionType' => $this->production_type,
            
            'inventory' => [
                'stockQuantity' => $this->stock_quantity,
                'lowStockThreshold' => $this->low_stock_threshold,
                'trackInventory' => $this->track_inventory,
                'inStock' => $this->hasStock(),
                'isLowStock' => $this->isLowStock(),
            ],
            
            'ordering' => [
                'minOrderQuantity' => $this->min_order_quantity,
                'maxOrderQuantity' => $this->max_order_quantity,
                'leadTime' => $this->lead_time,
            ],
            
            'media' => [
                'images' => $this->images ?? [],
                'primaryImage' => $this->images[0] ?? null,
            ],
            
            'taxonomy' => [
                'tags' => $this->tags ?? [],
                'categories' => $this->categories ?? [],
            ],
            
            'specifications' => [
                'features' => $this->features ?? [],
                'specifications' => $this->specifications ?? [],
                'dimensions' => $this->dimensions ?? [],
                'metadata' => $this->metadata ?? [],
            ],
            
            'materials' => [
                'material' => $this->material,
                'availableMaterials' => $this->available_materials ?? [],
                'qualityLevels' => $this->quality_levels ?? [],
            ],
            
            'customization' => [
                'customizable' => $this->customizable,
                'customOptions' => $this->custom_options ?? [],
                'requiresQuote' => $this->requires_quote,
            ],
            
            'marketing' => [
                'featured' => $this->featured,
                'viewCount' => $this->view_count,
                'averageRating' => $this->average_rating,
                'reviewCount' => $this->review_count,
            ],
            
            'seo' => [
                'seoTitle' => $this->seo_title,
                'seoDescription' => $this->seo_description,
                'seoKeywords' => $this->seo_keywords ?? [],
            ],
            
            'timestamps' => [
                'publishedAt' => $this->published_at?->toIso8601String(),
                'lastViewedAt' => $this->last_viewed_at?->toIso8601String(),
                'createdAt' => $this->created_at?->toIso8601String(),
                'updatedAt' => $this->updated_at?->toIso8601String(),
            ],
        ];
    }
}
