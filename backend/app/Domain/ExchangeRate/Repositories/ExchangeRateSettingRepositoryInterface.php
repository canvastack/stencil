<?php

namespace App\Domain\ExchangeRate\Repositories;

use App\Models\ExchangeRateSetting;

interface ExchangeRateSettingRepositoryInterface
{
    public function getForTenant(int $tenantId): ?ExchangeRateSetting;
    
    public function save(ExchangeRateSetting $setting): ExchangeRateSetting;
    
    public function updateCurrentRate(int $tenantId, float $rate): void;
    
    public function updateActiveProvider(int $tenantId, int $providerId): void;
    
    public function updateManualRate(int $tenantId, float $rate): void;
}
