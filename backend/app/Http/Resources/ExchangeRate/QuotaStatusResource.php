<?php

namespace App\Http\Resources\ExchangeRate;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuotaStatusResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $remainingQuota = $this->remaining_quota;
        $provider = $this->relationLoaded('provider') ? $this->provider : null;
        
        // Calculate next reset date (first day of next month)
        $nextResetDate = Carbon::create($this->year, $this->month, 1)
            ->addMonth()
            ->startOfMonth();
        
        // Determine warning/critical status
        $warningThreshold = $provider?->warning_threshold ?? 50;
        $criticalThreshold = $provider?->critical_threshold ?? 20;
        
        $isAtWarning = $remainingQuota <= $warningThreshold && $remainingQuota > $criticalThreshold;
        $isAtCritical = $remainingQuota <= $criticalThreshold && $remainingQuota > 0;
        $isExhausted = $remainingQuota <= 0;
        
        // Determine status level for UI
        $statusLevel = 'normal';
        if ($isExhausted) {
            $statusLevel = 'exhausted';
        } elseif ($isAtCritical) {
            $statusLevel = 'critical';
        } elseif ($isAtWarning) {
            $statusLevel = 'warning';
        }
        
        // Determine color indicator
        $colorIndicator = 'green';
        if ($isExhausted) {
            $colorIndicator = 'gray';
        } elseif ($isAtCritical) {
            $colorIndicator = 'red';
        } elseif ($isAtWarning) {
            $colorIndicator = 'orange';
        }
        
        return [
            // ✅ UUID for public consumption (ZERO TOLERANCE RULE)
            'id' => $this->uuid,
            'uuid' => $this->uuid,
            
            // Provider information
            'provider' => $this->when(
                $provider !== null,
                function () use ($provider) {
                    return [
                        'id' => $provider->uuid,
                        'uuid' => $provider->uuid,
                        'name' => $provider->name,
                        'code' => $provider->code,
                        'is_unlimited' => $provider->is_unlimited,
                    ];
                }
            ),
            
            // Quota metrics
            'quota_limit' => $this->quota_limit,
            'requests_made' => $this->requests_made,
            'remaining_quota' => $remainingQuota,
            'usage_percentage' => $this->usage_percentage,
            
            // Status indicators
            'status' => [
                'level' => $statusLevel,
                'color' => $colorIndicator,
                'is_exhausted' => $isExhausted,
                'is_at_warning' => $isAtWarning,
                'is_at_critical' => $isAtCritical,
                'is_healthy' => !$isExhausted && !$isAtCritical && !$isAtWarning,
            ],
            
            // Threshold information
            'thresholds' => [
                'warning' => $warningThreshold,
                'critical' => $criticalThreshold,
            ],
            
            // Period information
            'period' => [
                'year' => $this->year,
                'month' => $this->month,
                'month_name' => Carbon::create($this->year, $this->month, 1)->format('F Y'),
            ],
            
            // Reset information
            'reset' => [
                'last_reset_at' => $this->last_reset_at?->toISOString(),
                'next_reset_date' => $nextResetDate->toISOString(),
                'next_reset_date_formatted' => $nextResetDate->format('Y-m-d'),
                'next_reset_date_human' => $nextResetDate->diffForHumans(),
                'days_until_reset' => now()->diffInDays($nextResetDate, false),
            ],
            
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
                'type' => 'quota_status',
            ],
        ];
    }
}
