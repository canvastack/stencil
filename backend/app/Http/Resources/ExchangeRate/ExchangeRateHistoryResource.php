<?php

namespace App\Http\Resources\ExchangeRate;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExchangeRateHistoryResource extends JsonResource
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
            
            // Rate information
            'rate' => (float) $this->rate,
            'source' => $this->source,
            'event_type' => $this->event_type,
            
            // Provider information
            'provider' => $this->when(
                $this->relationLoaded('provider'),
                function () {
                    return $this->provider ? [
                        'id' => $this->provider->uuid,
                        'uuid' => $this->provider->uuid,
                        'name' => $this->provider->name,
                        'code' => $this->provider->code,
                    ] : null;
                }
            ),
            
            // Additional metadata
            'metadata' => $this->metadata,
            
            // Formatted timestamps
            'created_at' => $this->created_at?->toISOString(),
            'created_at_human' => $this->created_at?->diffForHumans(),
            'created_at_formatted' => $this->created_at?->format('Y-m-d H:i:s'),
            'created_at_date' => $this->created_at?->format('Y-m-d'),
            'created_at_time' => $this->created_at?->format('H:i:s'),
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
                'type' => 'exchange_rate_history',
            ],
        ];
    }
}
