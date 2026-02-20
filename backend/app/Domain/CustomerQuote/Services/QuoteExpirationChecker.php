<?php

declare(strict_types=1);

namespace App\Domain\CustomerQuote\Services;

use App\Domain\CustomerQuote\Entities\CustomerQuote;
use DateTimeImmutable;

/**
 * QuoteExpirationChecker Domain Service
 * 
 * Stateless domain service for checking quote expiration status.
 */
class QuoteExpirationChecker
{
    /**
     * Check if quote is expired
     */
    public function isExpired(CustomerQuote|\Carbon\Carbon $quote): bool
    {
        if ($quote instanceof CustomerQuote) {
            return $quote->getValidUntil() < new DateTimeImmutable();
        }
        
        // Handle Carbon date directly (for Eloquent models)
        return $quote->isPast();
    }

    /**
     * Check if quote is expiring soon
     */
    public function isExpiringSoon(CustomerQuote $quote, int $hoursThreshold = 24): bool
    {
        if ($this->isExpired($quote)) {
            return false; // Already expired
        }

        $now = new DateTimeImmutable();
        $validUntil = $quote->getValidUntil();
        $hoursRemaining = ($validUntil->getTimestamp() - $now->getTimestamp()) / 3600;

        return $hoursRemaining <= $hoursThreshold;
    }

    /**
     * Get hours until expiration
     */
    public function getHoursUntilExpiration(CustomerQuote $quote): float
    {
        $now = new DateTimeImmutable();
        $validUntil = $quote->getValidUntil();
        
        $secondsRemaining = $validUntil->getTimestamp() - $now->getTimestamp();
        
        return $secondsRemaining / 3600;
    }

    /**
     * Get days until expiration
     */
    public function getDaysUntilExpiration(CustomerQuote $quote): float
    {
        return $this->getHoursUntilExpiration($quote) / 24;
    }

    /**
     * Get expiration status
     */
    public function getExpirationStatus(CustomerQuote $quote): string
    {
        if ($this->isExpired($quote)) {
            return 'expired';
        }

        $hoursRemaining = $this->getHoursUntilExpiration($quote);

        return match(true) {
            $hoursRemaining <= 1 => 'expiring_very_soon',
            $hoursRemaining <= 24 => 'expiring_soon',
            $hoursRemaining <= 72 => 'expiring_this_week',
            default => 'valid',
        };
    }

    /**
     * Get expiration status description
     */
    public function getExpirationStatusDescription(CustomerQuote $quote): string
    {
        $status = $this->getExpirationStatus($quote);

        return match($status) {
            'expired' => 'Quote has expired',
            'expiring_very_soon' => 'Quote expires in less than 1 hour',
            'expiring_soon' => 'Quote expires within 24 hours',
            'expiring_this_week' => 'Quote expires within 3 days',
            'valid' => 'Quote is valid',
        };
    }

    /**
     * Check if quote can be extended
     */
    public function canBeExtended(CustomerQuote $quote): bool
    {
        // Business rule: Can extend if not yet accepted or rejected
        return !in_array($quote->getStatus(), ['accepted', 'rejected']);
    }

    /**
     * Calculate new expiration date
     */
    public function calculateNewExpirationDate(
        CustomerQuote $quote,
        int $extensionDays = 7
    ): DateTimeImmutable {
        $currentValidUntil = $quote->getValidUntil();
        
        // If already expired, extend from now
        if ($this->isExpired($quote)) {
            return (new DateTimeImmutable())->modify("+{$extensionDays} days");
        }
        
        // Otherwise extend from current expiration
        return $currentValidUntil->modify("+{$extensionDays} days");
    }

    /**
     * Get expiration details
     */
    public function getExpirationDetails(CustomerQuote $quote): array
    {
        $now = new DateTimeImmutable();
        $validUntil = $quote->getValidUntil();
        $isExpired = $this->isExpired($quote);

        if ($isExpired) {
            $hoursAgo = ($now->getTimestamp() - $validUntil->getTimestamp()) / 3600;
            $daysAgo = $hoursAgo / 24;

            return [
                'is_expired' => true,
                'status' => 'expired',
                'valid_until' => $validUntil->format('Y-m-d H:i:s'),
                'expired_at' => $validUntil->format('Y-m-d H:i:s'),
                'hours_ago' => round($hoursAgo, 1),
                'days_ago' => round($daysAgo, 1),
                'can_be_extended' => $this->canBeExtended($quote),
                'description' => $this->getExpirationStatusDescription($quote),
            ];
        }

        $hoursRemaining = $this->getHoursUntilExpiration($quote);
        $daysRemaining = $hoursRemaining / 24;

        return [
            'is_expired' => false,
            'status' => $this->getExpirationStatus($quote),
            'valid_until' => $validUntil->format('Y-m-d H:i:s'),
            'hours_remaining' => round($hoursRemaining, 1),
            'days_remaining' => round($daysRemaining, 1),
            'is_expiring_soon' => $this->isExpiringSoon($quote),
            'can_be_extended' => $this->canBeExtended($quote),
            'description' => $this->getExpirationStatusDescription($quote),
        ];
    }

    /**
     * Get quotes that need expiration notification
     */
    public function needsExpirationNotification(
        CustomerQuote $quote,
        array $notificationThresholds = [24, 48, 72] // hours
    ): ?int {
        if ($this->isExpired($quote)) {
            return null;
        }

        $hoursRemaining = $this->getHoursUntilExpiration($quote);

        foreach ($notificationThresholds as $threshold) {
            // Check if we're within the threshold window
            if ($hoursRemaining <= $threshold && $hoursRemaining > ($threshold - 1)) {
                return $threshold;
            }
        }

        return null;
    }

    /**
     * Batch check expiration for multiple quotes
     */
    public function batchCheckExpiration(array $quotes): array
    {
        $results = [
            'expired' => [],
            'expiring_soon' => [],
            'valid' => [],
        ];

        foreach ($quotes as $quote) {
            if (!$quote instanceof CustomerQuote) {
                continue;
            }

            if ($this->isExpired($quote)) {
                $results['expired'][] = $quote;
            } elseif ($this->isExpiringSoon($quote)) {
                $results['expiring_soon'][] = $quote;
            } else {
                $results['valid'][] = $quote;
            }
        }

        return [
            'expired' => $results['expired'],
            'expiring_soon' => $results['expiring_soon'],
            'valid' => $results['valid'],
            'counts' => [
                'expired' => count($results['expired']),
                'expiring_soon' => count($results['expiring_soon']),
                'valid' => count($results['valid']),
                'total' => count($quotes),
            ],
        ];
    }

    /**
     * Get recommended action based on expiration status
     */
    public function getRecommendedAction(CustomerQuote $quote): string
    {
        $status = $this->getExpirationStatus($quote);

        return match($status) {
            'expired' => 'extend_or_create_new',
            'expiring_very_soon' => 'urgent_customer_followup',
            'expiring_soon' => 'send_reminder',
            'expiring_this_week' => 'monitor',
            'valid' => 'no_action_needed',
        };
    }

    /**
     * Calculate optimal validity period
     */
    public function calculateOptimalValidityPeriod(
        string $quoteComplexity = 'standard',
        bool $requiresNegotiation = false
    ): int {
        // Base validity in days
        $baseDays = match($quoteComplexity) {
            'simple' => 7,
            'standard' => 14,
            'complex' => 21,
            'very_complex' => 30,
            default => 14,
        };

        // Add extra days if negotiation is expected
        if ($requiresNegotiation) {
            $baseDays += 7;
        }

        return $baseDays;
    }
}
