<?php

namespace App\Infrastructure\ExchangeRate\Repositories;

use App\Domain\ExchangeRate\Repositories\ApiQuotaTrackingRepositoryInterface;
use App\Models\ApiQuotaTracking;
use App\Models\ExchangeRateProvider;

class ApiQuotaTrackingRepository implements ApiQuotaTrackingRepositoryInterface
{
    public function getForProvider(int $providerId): ?ApiQuotaTracking
    {
        $now = now();
        
        // Get or create quota tracking for current month
        return ApiQuotaTracking::firstOrCreate(
            [
                'provider_id' => $providerId,
                'year' => $now->year,
                'month' => $now->month,
            ],
            [
                'requests_made' => 0,
                'quota_limit' => $this->getProviderQuotaLimit($providerId),
                'last_reset_at' => $now,
            ]
        );
    }
    
    public function incrementUsage(int $providerId): void
    {
        $quota = $this->getForProvider($providerId);
        
        if ($quota) {
            $quota->incrementUsage();
        }
    }
    
    public function resetQuota(int $providerId): void
    {
        $now = now();
        $provider = ExchangeRateProvider::find($providerId);
        
        if (!$provider) {
            return;
        }
        
        ApiQuotaTracking::updateOrCreate(
            [
                'provider_id' => $providerId,
                'year' => $now->year,
                'month' => $now->month,
            ],
            [
                'requests_made' => 0,
                'quota_limit' => $provider->monthly_quota,
                'last_reset_at' => $now,
            ]
        );
    }
    
    public function save(ApiQuotaTracking $quota): ApiQuotaTracking
    {
        $quota->save();
        return $quota->fresh();
    }
    
    private function getProviderQuotaLimit(int $providerId): int
    {
        $provider = ExchangeRateProvider::find($providerId);
        return $provider ? $provider->monthly_quota : 0;
    }
}
