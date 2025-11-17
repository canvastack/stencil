<?php

namespace App\Http\Resources\Product;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
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
            'sku' => $this->sku,
            'material' => $this->material,
            'quality' => $this->quality,
            
            // Pricing information
            'price' => [
                'base_price' => $this->base_price,
                'final_price' => $this->final_price,
                'currency' => $this->currency,
                'formatted_base_price' => $this->getFormattedPrice($this->base_price),
                'formatted_final_price' => $this->getFormattedPrice($this->final_price),
                'price_modifier' => $this->price_modifier,
            ],
            
            // Physical attributes
            'attributes' => [
                'dimensions' => $this->dimensions,
                'weight' => $this->weight,
                'thickness' => $this->thickness,
                'color' => $this->color,
                'finish' => $this->finish,
            ],
            
            // Stock information
            'stock' => [
                'in_stock' => $this->in_stock,
                'quantity' => $this->stock_quantity,
                'reserved_quantity' => $this->reserved_quantity,
                'available_quantity' => $this->available_quantity,
                'status' => $this->getStockStatus(),
            ],
            
            // Manufacturing details
            'manufacturing' => [
                'lead_time_days' => $this->lead_time_days,
                'minimum_order_quantity' => $this->minimum_order_quantity,
                'is_custom_etching_available' => $this->is_custom_etching_available,
                'etching_area_max' => $this->etching_area_max,
                'complexity_rating' => $this->complexity_rating,
            ],
            
            // Features and capabilities
            'features' => [
                'supports_engraving' => $this->supports_engraving,
                'supports_cutting' => $this->supports_cutting,
                'weather_resistant' => $this->weather_resistant,
            ],
            
            'notes' => $this->notes,
            'status' => $this->status,
            'featured' => $this->featured,
            'sort_order' => $this->sort_order,
            
            // Relationships
            'product' => $this->whenLoaded('product', function () {
                return new ProductResource($this->product);
            }),
            
            // Computed properties
            'is_available' => $this->isAvailable(),
            'is_low_stock' => $this->isLowStock(),
            'stock_level_percentage' => $this->getStockLevelPercentage(),
            
            // Material and quality details
            'material_details' => $this->when(
                $this->material,
                function () {
                    return $this->getMaterialDetails();
                }
            ),
            
            'quality_details' => $this->when(
                $this->quality,
                function () {
                    return $this->getQualityDetails();
                }
            ),
            
            // Metadata
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }

    /**
     * Get formatted price with currency symbol.
     */
    private function getFormattedPrice(float $price): string
    {
        $currencySymbols = [
            'IDR' => 'Rp',
            'USD' => '$',
        ];

        $symbol = $currencySymbols[$this->currency] ?? $this->currency;
        $amount = number_format($price, 0);

        return "{$symbol} {$amount}";
    }

    /**
     * Get stock status based on quantity.
     */
    private function getStockStatus(): string
    {
        if (!$this->in_stock || $this->available_quantity <= 0) {
            return 'out_of_stock';
        }

        if ($this->available_quantity <= ($this->minimum_order_quantity ?? 10)) {
            return 'low_stock';
        }

        return 'in_stock';
    }

    /**
     * Check if variant is available for ordering.
     */
    private function isAvailable(): bool
    {
        return $this->status === 'active' && 
               $this->in_stock && 
               $this->available_quantity > 0;
    }

    /**
     * Check if variant has low stock.
     */
    private function isLowStock(): bool
    {
        return $this->available_quantity <= ($this->minimum_order_quantity ?? 10);
    }

    /**
     * Get stock level percentage.
     */
    private function getStockLevelPercentage(): ?int
    {
        if ($this->stock_quantity === null || $this->stock_quantity === 0) {
            return null;
        }

        return intval(($this->available_quantity / $this->stock_quantity) * 100);
    }

    /**
     * Get material details.
     */
    private function getMaterialDetails(): array
    {
        $materials = [
            'Akrilik' => [
                'name' => 'Acrylic',
                'description' => 'Clear, lightweight thermoplastic',
                'properties' => ['Transparent', 'UV resistant', 'Easy to cut'],
                'applications' => ['Signage', 'Display cases', 'Awards'],
            ],
            'Kuningan' => [
                'name' => 'Brass',
                'description' => 'Copper-zinc alloy with golden appearance',
                'properties' => ['Corrosion resistant', 'Malleable', 'Antimicrobial'],
                'applications' => ['Plaques', 'Decorative items', 'Hardware'],
            ],
            'Tembaga' => [
                'name' => 'Copper',
                'description' => 'Pure copper metal',
                'properties' => ['Excellent conductivity', 'Antimicrobial', 'Malleable'],
                'applications' => ['Electrical components', 'Roofing', 'Artistic items'],
            ],
            'Stainless Steel' => [
                'name' => 'Stainless Steel',
                'description' => 'Corrosion-resistant steel alloy',
                'properties' => ['Rust resistant', 'Strong', 'Easy to clean'],
                'applications' => ['Industrial parts', 'Kitchen items', 'Medical devices'],
            ],
            'Aluminum' => [
                'name' => 'Aluminum',
                'description' => 'Lightweight, corrosion-resistant metal',
                'properties' => ['Lightweight', 'Corrosion resistant', 'Recyclable'],
                'applications' => ['Automotive parts', 'Aerospace', 'Construction'],
            ],
        ];

        return $materials[$this->material] ?? [
            'name' => $this->material,
            'description' => 'Material information not available',
            'properties' => [],
            'applications' => [],
        ];
    }

    /**
     * Get quality details.
     */
    private function getQualityDetails(): array
    {
        $qualities = [
            'standard' => [
                'name' => 'Standard Quality',
                'description' => 'Good quality suitable for general applications',
                'features' => ['Cost-effective', 'Reliable', 'Standard finish'],
            ],
            'premium' => [
                'name' => 'Premium Quality',
                'description' => 'High-quality materials with superior finish',
                'features' => ['Superior finish', 'Enhanced durability', 'Better precision'],
            ],
            'professional' => [
                'name' => 'Professional Grade',
                'description' => 'Top-tier quality for professional applications',
                'features' => ['Precision crafted', 'Premium materials', 'Guaranteed performance'],
            ],
        ];

        return $qualities[$this->quality] ?? [
            'name' => ucfirst($this->quality),
            'description' => 'Quality information not available',
            'features' => [],
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
                'type' => 'product_variant',
                'currency' => $this->currency,
            ],
        ];
    }
}