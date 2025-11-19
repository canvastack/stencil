<?php

namespace App\Infrastructure\Presentation\Http\Resources\Inventory;

use Illuminate\Http\Resources\Json\JsonResource;

class InventoryLocationResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'modelUuid' => $this->model_uuid,
            'tenantId' => $this->tenant_id,
            'locationCode' => $this->location_code,
            'locationName' => $this->location_name,
            'description' => $this->description,
            'parentLocationId' => $this->parent_location_id,
            'locationLevel' => $this->location_level,
            'locationType' => $this->location_type,
            'isActive' => (bool) $this->is_active,
            'isPrimary' => (bool) $this->is_primary,
            'address' => [
                'line1' => $this->address_line_1,
                'line2' => $this->address_line_2,
                'city' => $this->city,
                'stateProvince' => $this->state_province,
                'postalCode' => $this->postal_code,
                'country' => $this->country,
            ],
            'capacity' => [
                'total' => $this->total_capacity !== null ? (float) $this->total_capacity : null,
                'used' => $this->used_capacity !== null ? (float) $this->used_capacity : null,
                'unit' => $this->capacity_unit,
            ],
            'environment' => [
                'temperatureControlled' => (bool) $this->temperature_controlled,
                'temperatureMin' => $this->temperature_min !== null ? (float) $this->temperature_min : null,
                'temperatureMax' => $this->temperature_max !== null ? (float) $this->temperature_max : null,
                'humidityControlled' => (bool) $this->humidity_controlled,
                'humidityMax' => $this->humidity_max !== null ? (float) $this->humidity_max : null,
            ],
            'securityLevel' => $this->security_level,
            'operationalHours' => $this->operational_hours,
            'contactInformation' => $this->contact_information,
            'createdAt' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'updatedAt' => $this->updated_at ? $this->updated_at->toIso8601String() : null,
        ];
    }
}
