<?php

namespace App\Domain\ExchangeRate\Repositories;

use App\Models\ApiQuotaTracking;

interface ApiQuotaTrackingRepositoryInterface
{
    public function getForProvider(int $providerId): ?ApiQuotaTracking;
    
    public function incrementUsage(int $providerId): void;
    
    public function resetQuota(int $providerId): void;
    
    public function save(ApiQuotaTracking $quota): ApiQuotaTracking;
}
