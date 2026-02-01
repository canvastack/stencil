<?php

namespace App\Application\ExchangeRate\Services;

use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send quota warning notification (orange)
     * 
     * @param string $providerName
     * @param int $remaining
     * @return void
     */
    public function sendQuotaWarning(string $providerName, int $remaining): void
    {
        $message = "API quota running low: {$providerName} has {$remaining} requests left this month";
        
        // Log the notification
        Log::warning('Exchange Rate Quota Warning', [
            'provider' => $providerName,
            'remaining' => $remaining,
            'level' => 'warning',
            'color' => 'orange'
        ]);
        
        // TODO: Implement actual notification dispatch (toast, email, etc.)
        // This will be implemented in the frontend integration phase
    }

    /**
     * Send critical quota warning notification (red)
     * 
     * @param string $providerName
     * @param int $remaining
     * @param string $nextProviderName
     * @param int $nextRemaining
     * @return void
     */
    public function sendCriticalQuotaWarning(
        string $providerName,
        int $remaining,
        string $nextProviderName,
        int $nextRemaining
    ): void {
        $message = "API quota critical: {$providerName} has {$remaining} requests left. " .
                   "Will switch to {$nextProviderName} ({$nextRemaining} remaining)";
        
        // Log the notification
        Log::error('Exchange Rate Quota Critical', [
            'provider' => $providerName,
            'remaining' => $remaining,
            'next_provider' => $nextProviderName,
            'next_remaining' => $nextRemaining,
            'level' => 'critical',
            'color' => 'red'
        ]);
        
        // TODO: Implement actual notification dispatch (toast, email, etc.)
        // This will be implemented in the frontend integration phase
    }

    /**
     * Send provider switched notification (green)
     * 
     * @param string $newProviderName
     * @param int $availableQuota
     * @return void
     */
    public function sendProviderSwitched(string $newProviderName, int $availableQuota): void
    {
        $quotaText = $availableQuota === PHP_INT_MAX ? 'unlimited' : $availableQuota;
        $message = "Switched to {$newProviderName} API ({$quotaText} requests remaining)";
        
        // Log the notification
        Log::info('Exchange Rate Provider Switched', [
            'new_provider' => $newProviderName,
            'available_quota' => $availableQuota,
            'level' => 'success',
            'color' => 'green'
        ]);
        
        // TODO: Implement actual notification dispatch (toast, email, etc.)
        // This will be implemented in the frontend integration phase
    }

    /**
     * Send fallback notification (yellow)
     * 
     * @param float $rate
     * @param \DateTimeInterface $lastUpdated
     * @return void
     */
    public function sendFallbackNotification(float $rate, \DateTimeInterface $lastUpdated): void
    {
        $formattedRate = number_format($rate, 2);
        $formattedDate = $lastUpdated->format('Y-m-d H:i:s');
        $message = "All API quotas exhausted. Using last known rate: 1 USD = Rp {$formattedRate} (updated: {$formattedDate})";
        
        // Log the notification
        Log::warning('Exchange Rate Fallback to Cache', [
            'rate' => $rate,
            'last_updated' => $formattedDate,
            'level' => 'warning',
            'color' => 'yellow'
        ]);
        
        // TODO: Implement actual notification dispatch (toast, email, etc.)
        // This will be implemented in the frontend integration phase
    }
}
