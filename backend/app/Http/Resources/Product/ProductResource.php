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
            'long_description' => $this->long_description,
            'images' => $this->transformImages($this->images),
            'features' => $this->features,
            'category_id' => $this->category_id,
            'subcategory' => $this->subcategory,
            'tags' => $this->tags,
            'material' => $this->material,
            'size' => $this->size,
            'available_sizes' => $this->available_sizes,
            
            // Product type classification
            'type' => $this->type, // Technical type (physical/digital/service)
            'business_type' => $this->business_type, // Business domain type (metal_etching/glass_etching/etc)
            'type_display' => $this->getBusinessTypeLabel(), // Human-readable label
            
            // Pricing information
            'price' => [
                'amount' => $this->price,
                'currency' => $this->currency,
                'unit' => $this->price_unit,
                'formatted' => $this->getFormattedPrice(),
            ],
            
            'min_order' => $this->min_order,
            'specifications' => $this->specifications,
            
            // Product options (previously hardcoded in frontend)
            'quality_levels' => $this->quality_levels ?? ['standard', 'premium'],
            'available_materials' => $this->available_materials ?? [],
            'production_type' => $this->production_type,
            'available_colors' => $this->getAvailableColors(),
            'thickness_options' => $this->specifications['thickness_options'] ?? [],
            
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
            
            // Review summary (aggregated from customer_reviews)
            'reviewSummary' => [
                'averageRating' => round((float) ($this->average_rating ?? 0), 1),
                'totalReviews' => (int) ($this->review_count ?? 0),
                'reviewCount' => (int) ($this->review_count ?? 0), // Alias for backward compatibility
                'ratingDistribution' => null, // TODO: Implement rating distribution
            ],
            
            // Backward compatibility - deprecated, use reviewSummary instead
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
     * Transform images array to include full URLs with CDN support.
     * Returns default placeholder if no images available.
     */
    private function transformImages(?array $images): array
    {
        if (!$images || empty($images)) {
            return [config('app.url') . '/images/product-placeholder.svg'];
        }

        $cdnUrl = config('app.cdn_url');
        $storageUrl = config('app.storage_url', config('app.url') . '/storage');

        return array_map(function ($image) use ($cdnUrl, $storageUrl) {
            // Already a full URL
            if (filter_var($image, FILTER_VALIDATE_URL)) {
                return $image;
            }
            
            // Use CDN if configured
            if ($cdnUrl) {
                return $cdnUrl . '/' . ltrim($image, '/');
            }
            
            // Use storage URL
            return $storageUrl . '/' . ltrim($image, '/');
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
     * Get available colors for the product.
     */
    private function getAvailableColors(): array
    {
        if ($this->specifications && isset($this->specifications['colors'])) {
            return $this->specifications['colors'];
        }
        
        // Default colors for etching business
        return [
            ['name' => 'Natural', 'hex' => null, 'label' => 'Natural'],
            ['name' => 'Black', 'hex' => '#000000', 'label' => 'Hitam'],
            ['name' => 'Silver', 'hex' => '#C0C0C0', 'label' => 'Silver'],
            ['name' => 'Gold', 'hex' => '#FFD700', 'label' => 'Emas'],
        ];
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