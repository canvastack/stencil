<?php

namespace App\Infrastructure\ExchangeRate\Repositories;

use App\Domain\ExchangeRate\Repositories\ExchangeRateHistoryRepositoryInterface;
use App\Models\ExchangeRateHistory;

class ExchangeRateHistoryRepository implements ExchangeRateHistoryRepositoryInterface
{
    public function logRateUpdate(
        int $tenantId,
        float $rate,
        ?int $providerId,
        string $source,
        string $eventType,
        ?array $metadata = null
    ): ExchangeRateHistory {
        return ExchangeRateHistory::create([
            'tenant_id' => $tenantId,
            'rate' => $rate,
            'provider_id' => $providerId,
            'source' => $source,
            'event_type' => $eventType,
            'metadata' => $metadata,
        ]);
    }
    
    public function getCachedRate(int $tenantId): ?ExchangeRateHistory
    {
        return ExchangeRateHistory::forTenant($tenantId)
            ->where('source', 'api')
            ->orderBy('created_at', 'desc')
            ->first();
    }
}
