<?php

namespace App\Domain\ExchangeRate\ValueObjects;

use Carbon\Carbon;

class QuotaTracker
{
    private int $requestsMade;
    private int $quotaLimit;
    private int $year;
    private int $month;
    private ?Carbon $lastResetAt;

    public function __construct(
        int $requestsMade,
        int $quotaLimit,
        int $year,
        int $month,
        ?Carbon $lastResetAt = null
    ) {
        $this->validateQuota($requestsMade, $quotaLimit);
        $this->validatePeriod($year, $month);
        
        $this->requestsMade = $requestsMade;
        $this->quotaLimit = $quotaLimit;
        $this->year = $year;
        $this->month = $month;
        $this->lastResetAt = $lastResetAt;
    }

    private function validateQuota(int $requestsMade, int $quotaLimit): void
    {
        if ($requestsMade < 0) {
            throw new \InvalidArgumentException('Requests made cannot be negative');
        }

        if ($quotaLimit <= 0) {
            throw new \InvalidArgumentException('Quota limit must be greater than zero');
        }
    }

    private function validatePeriod(int $year, int $month): void
    {
        if ($year < 2020 || $year > 2100) {
            throw new \InvalidArgumentException('Invalid year');
        }

        if ($month < 1 || $month > 12) {
            throw new \InvalidArgumentException('Month must be between 1 and 12');
        }
    }

    public function getRemainingQuota(): int
    {
        return max(0, $this->quotaLimit - $this->requestsMade);
    }

    public function getUsagePercentage(): float
    {
        if ($this->quotaLimit === 0) {
            return 0.0;
        }

        return round(($this->requestsMade / $this->quotaLimit) * 100, 2);
    }

    public function shouldReset(): bool
    {
        $now = Carbon::now();
        return $now->year !== $this->year || $now->month !== $this->month;
    }

    public function incrementUsage(int $count = 1): self
    {
        if ($count < 0) {
            throw new \InvalidArgumentException('Increment count must be non-negative');
        }

        return new self(
            $this->requestsMade + $count,
            $this->quotaLimit,
            $this->year,
            $this->month,
            $this->lastResetAt
        );
    }

    public function reset(): self
    {
        $now = Carbon::now();
        
        return new self(
            0,
            $this->quotaLimit,
            $now->year,
            $now->month,
            $now
        );
    }

    public function getRequestsMade(): int
    {
        return $this->requestsMade;
    }

    public function getQuotaLimit(): int
    {
        return $this->quotaLimit;
    }

    public function getYear(): int
    {
        return $this->year;
    }

    public function getMonth(): int
    {
        return $this->month;
    }

    public function getLastResetAt(): ?Carbon
    {
        return $this->lastResetAt;
    }

    public function isExhausted(): bool
    {
        return $this->getRemainingQuota() <= 0;
    }

    public function canMakeRequest(): bool
    {
        return !$this->isExhausted();
    }

    public function toArray(): array
    {
        return [
            'requests_made' => $this->requestsMade,
            'quota_limit' => $this->quotaLimit,
            'remaining_quota' => $this->getRemainingQuota(),
            'usage_percentage' => $this->getUsagePercentage(),
            'year' => $this->year,
            'month' => $this->month,
            'last_reset_at' => $this->lastResetAt?->toIso8601String(),
            'should_reset' => $this->shouldReset(),
            'is_exhausted' => $this->isExhausted(),
        ];
    }
}
