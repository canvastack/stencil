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
            'uuid' => $this->uuid,
            'name' => $this->name,
            'sku' => $this->sku,
            
            // Material and quality
            'material' => $this->material,
            'quality' => $this->quality,
            'thickness' => $this->thickness,
            'color' => $this->color,
            'color_hex' => $this->color_hex,
            
            // Pricing
            'price' => $this->selling_price ?? $this->base_price,
            'base_price' => $this->base_price,
            'selling_price' => $this->selling_price,
            'retail_price' => $this->retail_price,
            'cost_price' => $this->cost_price,
            'price_adjustment' => $this->price_adjustment,
            
            // Physical attributes
            'dimensions' => $this->dimensions,
            'weight' => $this->weight,
            'length' => $this->length,
            'width' => $this->width,
            
            // Stock
            'stock' => $this->stock_quantity,
            'stock_quantity' => $this->stock_quantity,
            'low_stock_threshold' => $this->low_stock_threshold,
            'track_inventory' => $this->track_inventory,
            
            // Status
            'is_active' => $this->is_active,
            'is_default' => $this->is_default,
            'status' => $this->is_active ? 'active' : 'inactive',
            'sort_order' => $this->sort_order,
            
            // Manufacturing
            'lead_time_days' => $this->lead_time_days,
            'lead_time_note' => $this->lead_time_note,
            
            // Media and specifications
            'images' => $this->images,
            'etching_specifications' => $this->etching_specifications,
            'custom_fields' => $this->custom_fields,
            'special_notes' => $this->special_notes,
            
            // Timestamps
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }


}