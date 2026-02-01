<?php

namespace App\Application\ExchangeRate\Services;

use App\Models\ExchangeRateSetting;
use App\Models\ExchangeRateHistory;
use Illuminate\Support\Facades\Log;

/**
 * Exchange Rate Application Service
 * 
 * Provides exchange rate functionality for order processing.
 * Fetches current exchange rate based on tenant settings.
 */
class ExchangeRateApplicationService
{
    /**
     * Get current exchange rate for a tenant
     * 
     * @param string $tenantIdOrUuid Tenant ID (integer) or UUID (string)
     * @return float|null Exchange rate or null if unavailable
     * @throws \Exception if rate is unavailable and required
     */
    public function getCurrentRate(string $tenantIdOrUuid): ?float
    {
        // Resolve tenant UUID to integer ID if needed
        $tenantId = $this->resolveTenantId($tenantIdOrUuid);
        
        if ($tenantId === null) {
            Log::warning('Tenant not found', ['tenant_identifier' => $tenantIdOrUuid]);
            return null;
        }
        
        // Get tenant's exchange rate settings
        $settings = ExchangeRateSetting::where('tenant_id', $tenantId)->first();
        
        if (!$settings) {
            Log::warning('Exchange rate settings not found for tenant', ['tenant_id' => $tenantId]);
            return null;
        }

        // If manual mode, return manual rate
        if ($settings->mode === 'manual') {
            return $settings->manual_rate ? (float) $settings->manual_rate : null;
        }

        // If auto mode, get the most recent rate from history
        $latestRate = ExchangeRateHistory::where('tenant_id', $tenantId)
            ->where('source', 'api')
            ->orderBy('created_at', 'desc')
            ->first();

        if ($latestRate) {
            return (float) $latestRate->rate;
        }

        // Fallback to manual rate if no API rate available
        if ($settings->manual_rate) {
            Log::info('Using manual rate as fallback for auto mode', [
                'tenant_id' => $tenantId,
                'rate' => $settings->manual_rate
            ]);
            return (float) $settings->manual_rate;
        }

        return null;
    }

    /**
     * Get current exchange rate or throw exception
     * 
     * @param string $tenantIdOrUuid Tenant ID (integer) or UUID (string)
     * @return float
     * @throws \Exception if rate is unavailable
     */
    public function getCurrentRateOrFail(string $tenantIdOrUuid): float
    {
        $rate = $this->getCurrentRate($tenantIdOrUuid);
        
        if ($rate === null) {
            throw new \Exception('Exchange rate is not available. Please configure exchange rate settings.');
        }

        return $rate;
    }

    /**
     * Convert USD amount to IDR
     * 
     * @param int $amountInCents Amount in USD cents
     * @param float $exchangeRate Exchange rate
     * @return int Amount in IDR cents
     */
    public function convertUsdToIdr(int $amountInCents, float $exchangeRate): int
    {
        return (int) round($amountInCents * $exchangeRate);
    }

    /**
     * Convert IDR amount to USD
     * 
     * @param int $amountInCents Amount in IDR cents
     * @param float $exchangeRate Exchange rate
     * @return int Amount in USD cents
     */
    public function convertIdrToUsd(int $amountInCents, float $exchangeRate): int
    {
        if ($exchangeRate <= 0) {
            throw new \InvalidArgumentException('Exchange rate must be positive');
        }
        
        return (int) round($amountInCents / $exchangeRate);
    }

    /**
     * Check if exchange rate is stale (older than 7 days)
     * 
     * @param string $tenantIdOrUuid Tenant ID (integer) or UUID (string)
     * @return bool
     */
    public function isRateStale(string $tenantIdOrUuid): bool
    {
        // Resolve tenant UUID to integer ID if needed
        $tenantId = $this->resolveTenantId($tenantIdOrUuid);
        
        if ($tenantId === null) {
            return true;
        }
        
        $latestRate = ExchangeRateHistory::where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$latestRate) {
            return true;
        }

        $daysSinceUpdate = now()->diffInDays($latestRate->created_at);
        return $daysSinceUpdate > 7;
    }
    
    /**
     * Resolve tenant identifier to integer ID
     * 
     * Accepts either integer ID or UUID string and returns integer ID.
     * This ensures compatibility with both internal (integer) and external (UUID) APIs.
     * 
     * @param string $tenantIdOrUuid Tenant ID (integer) or UUID (string)
     * @return int|null Integer tenant ID or null if not found
     */
    private function resolveTenantId(string $tenantIdOrUuid): ?int
    {
        // If it's already a numeric ID, return it
        if (is_numeric($tenantIdOrUuid)) {
            return (int) $tenantIdOrUuid;
        }
        
        // If it's a UUID, resolve to integer ID
        if ($this->isUuid($tenantIdOrUuid)) {
            $tenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::where('uuid', $tenantIdOrUuid)->first();
            return $tenant ? $tenant->id : null;
        }
        
        // Invalid format
        return null;
    }
    
    /**
     * Check if string is a valid UUID
     * 
     * @param string $value
     * @return bool
     */
    private function isUuid(string $value): bool
    {
        return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $value) === 1;
    }
}
