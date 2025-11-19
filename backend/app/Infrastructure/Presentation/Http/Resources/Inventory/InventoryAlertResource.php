<?php

namespace App\Infrastructure\Presentation\Http\Resources\Inventory;

use Illuminate\Http\Resources\Json\JsonResource;

class InventoryAlertResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'inventoryItemId' => $this->inventory_item_id,
            'inventoryLocationId' => $this->inventory_location_id,
            'alertType' => $this->alert_type,
            'severity' => $this->severity,
            'message' => $this->message,
            'triggeredQuantity' => $this->triggered_quantity !== null ? (float) $this->triggered_quantity : null,
            'thresholdQuantity' => $this->threshold_quantity !== null ? (float) $this->threshold_quantity : null,
            'resolved' => (bool) $this->resolved,
            'resolvedAt' => $this->resolved_at ? $this->resolved_at->toIso8601String() : null,
            'metadata' => $this->metadata,
            'createdAt' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'updatedAt' => $this->updated_at ? $this->updated_at->toIso8601String() : null,
        ];
    }
}
