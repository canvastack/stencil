<?php

namespace App\Http\Resources\ExchangeRate;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExchangeRateSettingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            // ✅ UUID for public consumption (ZERO TOLERANCE RULE)
            'id' => $this->uuid,
            'uuid' => $this->uuid,
            
            // Mode configuration
            'mode' => $this->mode,
            'is_manual_mode' => $this->isManualMode(),
            'is_auto_mode' => $this->isAutoMode(),
            
            // Rate information
            'manual_rate' => $this->when(
                $this->isManualMode(),
                $this->manual_rate
            ),
            'current_rate' => $this->current_rate,
            'active_rate' => $this->getCurrentRate(),
            
            // Active provider details
            'active_provider' => $this->when(
                $this->isAutoMode() && $this->relationLoaded('activeProvider'),
                function () {
                    return $this->activeProvider ? new ExchangeRateProviderResource($this->activeProvider) : null;
                }
            ),
            
            // Auto-update configuration
            'auto_update_enabled' => $this->auto_update_enabled,
            'auto_update_time' => $this->auto_update_time,
            
            // Metadata
            'last_updated_at' => $this->last_updated_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
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
                'type' => 'exchange_rate_setting',
            ],
        ];
    }
}
