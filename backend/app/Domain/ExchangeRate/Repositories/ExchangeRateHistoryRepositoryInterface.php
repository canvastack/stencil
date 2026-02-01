<?php

namespace App\Domain\ExchangeRate\Repositories;

use App\Models\ExchangeRateHistory;

interface ExchangeRateHistoryRepositoryInterface
{
    public function logRateUpdate(
        int $tenantId,
        float $rate,
        ?int $providerId,
        string $source,
        string $eventType,
        ?array $metadata = null
    ): ExchangeRateHistory;
    
    public function getCachedRate(int $tenantId): ?ExchangeRateHistory;
}
