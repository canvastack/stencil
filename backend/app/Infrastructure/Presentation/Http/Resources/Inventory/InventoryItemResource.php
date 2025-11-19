<?php

namespace App\Infrastructure\Presentation\Http\Resources\Inventory;

use Illuminate\Http\Resources\Json\JsonResource;

class InventoryItemResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'modelUuid' => $this->model_uuid,
            'tenantId' => $this->tenant_id,
            'productId' => $this->product_id,
            'itemCode' => $this->item_code,
            'itemName' => $this->item_name,
            'description' => $this->description,
            'category' => $this->category,
            'subcategory' => $this->subcategory,
            'itemType' => $this->item_type,
            'unitOfMeasure' => $this->unit_of_measure,
            'currentStock' => (float) $this->current_stock,
            'availableStock' => (float) $this->available_stock,
            'reservedStock' => (float) $this->reserved_stock,
            'onOrderStock' => (float) $this->on_order_stock,
            'minimumStockLevel' => (float) $this->minimum_stock_level,
            'reorderPoint' => (float) $this->reorder_point,
            'reorderQuantity' => (float) $this->reorder_quantity,
            'valuationMethod' => $this->valuation_method,
            'isActive' => (bool) $this->is_active,
            'isDiscontinued' => (bool) $this->is_discontinued,
            'alerts' => InventoryAlertResource::collection($this->whenLoaded('alerts')),
            'locations' => InventoryItemLocationResource::collection($this->whenLoaded('locations')),
            'createdAt' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'updatedAt' => $this->updated_at ? $this->updated_at->toIso8601String() : null,
        ];
    }
}
