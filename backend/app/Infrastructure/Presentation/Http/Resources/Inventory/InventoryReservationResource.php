<?php

namespace App\Infrastructure\Presentation\Http\Resources\Inventory;

use Illuminate\Http\Resources\Json\JsonResource;

class InventoryReservationResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'inventoryItemId' => $this->inventory_item_id,
            'inventoryLocationId' => $this->inventory_location_id,
            'quantity' => (float) $this->quantity,
            'status' => $this->status,
            'reservedForType' => $this->reserved_for_type,
            'reservedForId' => $this->reserved_for_id,
            'reservedAt' => $this->reserved_at ? $this->reserved_at->toIso8601String() : null,
            'expiresAt' => $this->expires_at ? $this->expires_at->toIso8601String() : null,
            'releasedAt' => $this->released_at ? $this->released_at->toIso8601String() : null,
            'metadata' => $this->metadata,
            'location' => new InventoryLocationResource($this->whenLoaded('location')),
        ];
    }
}
