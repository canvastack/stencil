<?php

namespace App\Infrastructure\Presentation\Http\Resources\Inventory;

use Illuminate\Http\Resources\Json\JsonResource;

class InventoryItemLocationResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'inventoryItemId' => $this->inventory_item_id,
            'inventoryLocationId' => $this->inventory_location_id,
            'stockOnHand' => (float) $this->stock_on_hand,
            'stockReserved' => (float) $this->stock_reserved,
            'stockAvailable' => (float) $this->stock_available,
            'stockDamaged' => (float) $this->stock_damaged,
            'stockInTransit' => (float) $this->stock_in_transit,
            'lastCountedAt' => $this->last_counted_at ? $this->last_counted_at->toIso8601String() : null,
            'lastReconciledAt' => $this->last_reconciled_at ? $this->last_reconciled_at->toIso8601String() : null,
            'location' => new InventoryLocationResource($this->whenLoaded('location')),
        ];
    }
}
