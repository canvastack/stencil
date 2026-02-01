<?php

namespace App\Http\Resources\ExchangeRate;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExchangeRateProviderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $currentQuota = $this->getCurrentQuota();
        $remainingQuota = $this->getRemainingQuota();
        
        return [
            // ✅ UUID for public consumption (ZERO TOLERANCE RULE)
            'id' => $this->uuid,
            'uuid' => $this->uuid,
            
            // Provider information
            'name' => $this->name,
            'code' => $this->code,
            'api_url' => $this->api_url,
            
            // API key status (never expose the actual key)
            'requires_api_key' => $this->requires_api_key,
            'has_api_key' => $this->api_key !== null,
            
            // Quota configuration
            'is_unlimited' => $this->is_unlimited,
            'monthly_quota' => $this->monthly_quota,
            
            // Quota status
            'quota_status' => [
                'remaining' => $remainingQuota,
                'used' => $currentQuota?->requests_made ?? 0,
                'limit' => $this->monthly_quota,
                'usage_percentage' => $currentQuota?->usage_percentage ?? 0,
                'is_exhausted' => $remainingQuota !== null && $remainingQuota <= 0,
                'is_at_warning' => $remainingQuota !== null && $remainingQuota <= $this->warning_threshold && $remainingQuota > $this->critical_threshold,
                'is_at_critical' => $remainingQuota !== null && $remainingQuota <= $this->critical_threshold && $remainingQuota > 0,
            ],
            
            // Provider configuration
            'priority' => $this->priority,
            'is_enabled' => $this->is_enabled,
            'warning_threshold' => $this->warning_threshold,
            'critical_threshold' => $this->critical_threshold,
            
            // Current quota tracking details (if loaded)
            'current_quota_tracking' => $this->when(
                $currentQuota !== null,
                function () use ($currentQuota) {
                    return new QuotaStatusResource($currentQuota);
                }
            ),
            
            // Metadata
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
                'type' => 'exchange_rate_provider',
            ],
        ];
    }
}
