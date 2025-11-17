<?php

namespace App\Http\Resources\Product;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'long_description' => $this->long_description,
            'images' => $this->transformImages($this->images),
            'features' => $this->features,
            'category_id' => $this->category_id,
            'subcategory' => $this->subcategory,
            'tags' => $this->tags,
            'material' => $this->material,
            
            // Pricing information
            'price' => [
                'amount' => $this->price,
                'currency' => $this->currency,
                'unit' => $this->price_unit,
                'formatted' => $this->getFormattedPrice(),
            ],
            
            'min_order' => $this->min_order,
            'specifications' => $this->specifications,
            
            // Customization options
            'customizable' => $this->customizable,
            'custom_options' => $this->when(
                $this->customizable && $this->custom_options,
                $this->custom_options
            ),
            
            // Stock information
            'stock' => [
                'in_stock' => $this->in_stock,
                'quantity' => $this->stock_quantity,
                'status' => $this->getStockStatus(),
            ],
            
            'lead_time' => $this->lead_time,
            
            // SEO information - only include if requested
            'seo' => $this->when(
                $request->boolean('include_seo', false),
                [
                    'title' => $this->seo_title,
                    'description' => $this->seo_description,
                    'keywords' => $this->seo_keywords,
                ]
            ),
            
            'status' => $this->status,
            'featured' => $this->featured,
            
            // Relationships - loaded conditionally
            'category' => $this->whenLoaded('category', function () {
                return new ProductCategoryResource($this->category);
            }),
            
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
            
            // Computed properties
            'average_rating' => $this->when(
                isset($this->average_rating),
                $this->average_rating
            ),
            
            'reviews_count' => $this->when(
                isset($this->reviews_count),
                $this->reviews_count
            ),
            
            'orders_count' => $this->when(
                isset($this->orders_count),
                $this->orders_count
            ),
            
            // URLs and links
            'image_urls' => $this->getImageUrls(),
            'public_url' => $this->when(
                $request->boolean('include_urls', false),
                function () {
                    return $this->getPublicUrl();
                }
            ),
            
            // Metadata
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }

    /**
     * Transform images array to include full URLs.
     */
    private function transformImages(?array $images): array
    {
        if (!$images) {
            return [];
        }

        return array_map(function ($image) {
            if (filter_var($image, FILTER_VALIDATE_URL)) {
                return $image;
            }
            return url('storage/' . ltrim($image, '/'));
        }, $images);
    }

    /**
     * Get formatted price with currency symbol.
     */
    private function getFormattedPrice(): string
    {
        $currencySymbols = [
            'IDR' => 'Rp',
            'USD' => '$',
        ];

        $symbol = $currencySymbols[$this->currency] ?? $this->currency;
        $amount = number_format($this->price, 0);

        return "{$symbol} {$amount}";
    }

    /**
     * Get stock status based on quantity.
     */
    private function getStockStatus(): string
    {
        if (!$this->in_stock) {
            return 'out_of_stock';
        }

        if ($this->stock_quantity === null) {
            return 'in_stock'; // Unlimited stock
        }

        if ($this->stock_quantity <= 0) {
            return 'out_of_stock';
        }

        if ($this->stock_quantity <= 10) {
            return 'low_stock';
        }

        return 'in_stock';
    }

    /**
     * Get full image URLs.
     */
    private function getImageUrls(): array
    {
        return $this->transformImages($this->images);
    }

    /**
     * Get the public URL for this product.
     */
    private function getPublicUrl(): string
    {
        $tenant = tenant();
        $baseUrl = $tenant ? $tenant->getPublicUrl() : url('/');
        
        return $baseUrl . '/products/' . $this->slug;
    }

    /**
     * Get additional data that should be included with the resource array.
     */
    public function with(Request $request): array
    {
        return [
            'meta' => [
                'version' => '1.0',
                'type' => 'product',
                'currency' => $this->currency,
            ],
        ];
    }
}