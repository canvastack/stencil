<?php

namespace App\Domain\ExchangeRate\Entities;

use Carbon\Carbon;

class ExchangeRate
{
    private float $rate;
    private Carbon $fetchedAt;
    private string $source;
    private ?string $providerCode;
    private int $maxAgeHours;

    public function __construct(
        float $rate,
        Carbon $fetchedAt,
        string $source = 'api',
        ?string $providerCode = null,
        int $maxAgeHours = 24
    ) {
        $this->validateRate($rate);
        $this->rate = $rate;
        $this->fetchedAt = $fetchedAt;
        $this->source = $source;
        $this->providerCode = $providerCode;
        $this->maxAgeHours = $maxAgeHours;
    }

    private function validateRate(float $rate): void
    {
        if ($rate <= 0) {
            throw new \InvalidArgumentException('Exchange rate must be greater than zero');
        }
    }

    public function getRate(): float
    {
        return $this->rate;
    }

    public function getFetchedAt(): Carbon
    {
        return $this->fetchedAt;
    }

    public function getSource(): string
    {
        return $this->source;
    }

    public function getProviderCode(): ?string
    {
        return $this->providerCode;
    }

    public function isStale(): bool
    {
        $ageInHours = $this->fetchedAt->diffInHours(Carbon::now());
        return $ageInHours > $this->maxAgeHours;
    }

    public function convert(float $amountUsd): float
    {
        if ($amountUsd < 0) {
            throw new \InvalidArgumentException('Amount must be non-negative');
        }
        
        return round($amountUsd * $this->rate, 2);
    }

    public function getAgeInHours(): int
    {
        return $this->fetchedAt->diffInHours(Carbon::now());
    }

    public function toArray(): array
    {
        return [
            'rate' => $this->rate,
            'fetched_at' => $this->fetchedAt->toIso8601String(),
            'source' => $this->source,
            'provider_code' => $this->providerCode,
            'is_stale' => $this->isStale(),
            'age_hours' => $this->getAgeInHours(),
        ];
    }
}
