<?php

namespace App\Infrastructure\ExchangeRate\Repositories;

use App\Domain\ExchangeRate\Repositories\ExchangeRateSettingRepositoryInterface;
use App\Models\ExchangeRateSetting;

class ExchangeRateSettingRepository implements ExchangeRateSettingRepositoryInterface
{
    public function getForTenant(int $tenantId): ?ExchangeRateSetting
    {
        return ExchangeRateSetting::forTenant($tenantId)->first();
    }
    
    public function save(ExchangeRateSetting $setting): ExchangeRateSetting
    {
        $setting->save();
        return $setting->fresh();
    }
    
    public function updateCurrentRate(int $tenantId, float $rate): void
    {
        ExchangeRateSetting::forTenant($tenantId)->update([
            'current_rate' => $rate,
            'last_updated_at' => now(),
        ]);
    }
    
    public function updateActiveProvider(int $tenantId, int $providerId): void
    {
        ExchangeRateSetting::forTenant($tenantId)->update([
            'active_provider_id' => $providerId,
        ]);
    }
    
    public function updateManualRate(int $tenantId, float $rate): void
    {
        ExchangeRateSetting::forTenant($tenantId)->update([
            'manual_rate' => $rate,
            'last_updated_at' => now(),
        ]);
    }
}
