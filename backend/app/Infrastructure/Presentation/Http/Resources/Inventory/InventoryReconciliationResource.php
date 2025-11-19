<?php

namespace App\Infrastructure\Presentation\Http\Resources\Inventory;

use Illuminate\Http\Resources\Json\JsonResource;

class InventoryReconciliationResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'inventoryItemId' => $this->inventory_item_id,
            'inventoryLocationId' => $this->inventory_location_id,
            'expectedQuantity' => (float) $this->expected_quantity,
            'countedQuantity' => (float) $this->counted_quantity,
            'varianceQuantity' => (float) $this->variance_quantity,
            'varianceValue' => (float) $this->variance_value,
            'status' => $this->status,
            'source' => $this->source,
            'initiatedBy' => $this->initiated_by,
            'initiatedAt' => $this->initiated_at ? $this->initiated_at->toIso8601String() : null,
            'resolvedBy' => $this->resolved_by,
            'resolvedAt' => $this->resolved_at ? $this->resolved_at->toIso8601String() : null,
            'metadata' => $this->metadata,
        ];
    }
}
