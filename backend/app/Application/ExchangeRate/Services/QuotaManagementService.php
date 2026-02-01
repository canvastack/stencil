<?php

namespace App\Application\ExchangeRate\Services;

use App\Domain\ExchangeRate\Repositories\ApiQuotaTrackingRepositoryInterface;
use App\Domain\ExchangeRate\Repositories\ExchangeRateProviderRepositoryInterface;
use App\Models\ApiQuotaTracking;
use App\Models\ExchangeRateProvider;

class QuotaManagementService
{
    public function __construct(
        private ApiQuotaTrackingRepositoryInterface $quotaRepository,
        private ExchangeRateProviderRepositoryInterface $providerRepository
    ) {}

    /**
     * Increment quota usage for a provider
     * 
     * @param int $providerId
     * @param int $count Number of requests to increment (default: 1)
     * @return void
     */
    public function incrementQuota(int $providerId, int $count = 1): void
    {
        $quota = $this->quotaRepository->getForProvider($providerId);
        
        if (!$quota) {
            // Create initial quota tracking if it doesn't exist
            $provider = $this->providerRepository->findById($providerId);
            if (!$provider) {
                throw new \Exception("Provider not found: {$providerId}");
            }
            
            $now = now();
            $quota = new ApiQuotaTracking([
                'provider_id' => $providerId,
                'requests_made' => 0,
                'quota_limit' => $provider->monthly_quota,
                'year' => $now->year,
                'month' => $now->month,
                'last_reset_at' => $now,
            ]);
            
            $quota = $this->quotaRepository->save($quota);
        }
        
        // Check if reset is needed before incrementing
        $this->resetQuotaIfNeeded($providerId);
        
        // Increment usage
        $this->quotaRepository->incrementUsage($providerId);
    }

    /**
     * Reset quota if the month has changed
     * 
     * @param int $providerId
     * @return bool True if reset was performed, false otherwise
     */
    public function resetQuotaIfNeeded(int $providerId): bool
    {
        // Check if there's an old quota record that needs reset
        $oldQuota = ApiQuotaTracking::where('provider_id', $providerId)
            ->where(function ($query) {
                $now = now();
                $query->where('year', '!=', $now->year)
                      ->orWhere('month', '!=', $now->month);
            })
            ->first();
        
        if ($oldQuota && $oldQuota->shouldReset()) {
            $this->quotaRepository->resetQuota($providerId);
            return true;
        }
        
        // If no old quota, check current quota
        $quota = $this->quotaRepository->getForProvider($providerId);
        
        if (!$quota) {
            return false;
        }
        
        if ($quota->shouldReset()) {
            $this->quotaRepository->resetQuota($providerId);
            return true;
        }
        
        return false;
    }

    /**
     * Get quota status for dashboard display
     * 
     * @param int $tenantId
     * @return array Array of provider quota status information
     */
    public function getQuotaStatus(int $tenantId): array
    {
        $providers = $this->providerRepository->getAllForTenant($tenantId);
        $status = [];
        
        foreach ($providers as $provider) {
            $quota = $this->quotaRepository->getForProvider($provider->id);
            
            $requestsUsed = $quota ? $quota->requests_made : 0;
            $remaining = $provider->is_unlimited 
                ? PHP_INT_MAX
                : ($quota ? $quota->remaining_quota : $provider->monthly_quota);
            
            $isExhausted = !$provider->is_unlimited && $remaining <= 0;
            $isAtCritical = !$provider->is_unlimited && $remaining > 0 && $remaining <= $provider->critical_threshold;
            $isAtWarning = !$provider->is_unlimited && $remaining > $provider->critical_threshold && $remaining <= $provider->warning_threshold;
            
            $status[] = [
                'provider_id' => $provider->uuid,
                'provider_name' => $provider->name,
                'monthly_quota' => $provider->monthly_quota,
                'requests_used' => $requestsUsed,
                'remaining_quota' => $remaining,
                'is_unlimited' => $provider->is_unlimited,
                'is_exhausted' => $isExhausted,
                'is_at_warning' => $isAtWarning,
                'is_at_critical' => $isAtCritical,
                'priority' => $provider->priority,
                'next_reset_date' => $this->getNextResetDate(),
            ];
        }
        
        // Sort by priority
        usort($status, fn($a, $b) => ($a['priority'] ?? 999) <=> ($b['priority'] ?? 999));
        
        return $status;
    }

    /**
     * Calculate the next monthly reset date
     * 
     * @return string Next reset date in Y-m-d format
     */
    private function getNextResetDate(): string
    {
        $now = now();
        $nextMonth = $now->copy()->addMonth()->startOfMonth();
        return $nextMonth->format('Y-m-d');
    }
}
