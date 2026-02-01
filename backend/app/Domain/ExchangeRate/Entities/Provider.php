<?php

namespace App\Domain\ExchangeRate\Entities;

class Provider
{
    private string $code;
    private string $name;
    private string $apiUrl;
    private ?string $apiKey;
    private bool $requiresApiKey;
    private bool $isUnlimited;
    private ?int $monthlyQuota;
    private int $priority;
    private bool $isEnabled;
    private int $warningThreshold;
    private int $criticalThreshold;

    public function __construct(
        string $code,
        string $name,
        string $apiUrl,
        ?string $apiKey = null,
        bool $requiresApiKey = true,
        bool $isUnlimited = false,
        ?int $monthlyQuota = null,
        int $priority = 1,
        bool $isEnabled = true,
        int $warningThreshold = 50,
        int $criticalThreshold = 20
    ) {
        $this->validateProvider($requiresApiKey, $apiKey, $isUnlimited, $monthlyQuota);
        $this->validateThresholds($warningThreshold, $criticalThreshold);
        
        $this->code = $code;
        $this->name = $name;
        $this->apiUrl = $apiUrl;
        $this->apiKey = $apiKey;
        $this->requiresApiKey = $requiresApiKey;
        $this->isUnlimited = $isUnlimited;
        $this->monthlyQuota = $monthlyQuota;
        $this->priority = $priority;
        $this->isEnabled = $isEnabled;
        $this->warningThreshold = $warningThreshold;
        $this->criticalThreshold = $criticalThreshold;
    }

    private function validateProvider(bool $requiresApiKey, ?string $apiKey, bool $isUnlimited, ?int $monthlyQuota): void
    {
        if ($requiresApiKey && empty($apiKey)) {
            throw new \InvalidArgumentException('API key is required for this provider');
        }

        if (!$isUnlimited && ($monthlyQuota === null || $monthlyQuota <= 0)) {
            throw new \InvalidArgumentException('Monthly quota must be set for non-unlimited providers');
        }
    }

    private function validateThresholds(int $warning, int $critical): void
    {
        if ($warning <= $critical) {
            throw new \InvalidArgumentException('Warning threshold must be greater than critical threshold');
        }

        if ($critical < 0 || $warning < 0) {
            throw new \InvalidArgumentException('Thresholds must be non-negative');
        }
    }

    public function getCode(): string
    {
        return $this->code;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getApiUrl(): string
    {
        return $this->apiUrl;
    }

    public function getApiKey(): ?string
    {
        return $this->apiKey;
    }

    public function requiresApiKey(): bool
    {
        return $this->requiresApiKey;
    }

    public function isUnlimited(): bool
    {
        return $this->isUnlimited;
    }

    public function getMonthlyQuota(): ?int
    {
        return $this->monthlyQuota;
    }

    public function getPriority(): int
    {
        return $this->priority;
    }

    public function isEnabled(): bool
    {
        return $this->isEnabled;
    }

    public function getWarningThreshold(): int
    {
        return $this->warningThreshold;
    }

    public function getCriticalThreshold(): int
    {
        return $this->criticalThreshold;
    }

    public function shouldWarn(int $remainingQuota): bool
    {
        if ($this->isUnlimited) {
            return false;
        }

        return $remainingQuota <= $this->warningThreshold && $remainingQuota > $this->criticalThreshold;
    }

    public function isCritical(int $remainingQuota): bool
    {
        if ($this->isUnlimited) {
            return false;
        }

        return $remainingQuota <= $this->criticalThreshold && $remainingQuota > 0;
    }

    public function isExhausted(int $remainingQuota): bool
    {
        if ($this->isUnlimited) {
            return false;
        }

        return $remainingQuota <= 0;
    }

    public function toArray(): array
    {
        return [
            'code' => $this->code,
            'name' => $this->name,
            'api_url' => $this->apiUrl,
            'requires_api_key' => $this->requiresApiKey,
            'is_unlimited' => $this->isUnlimited,
            'monthly_quota' => $this->monthlyQuota,
            'priority' => $this->priority,
            'is_enabled' => $this->isEnabled,
            'warning_threshold' => $this->warningThreshold,
            'critical_threshold' => $this->criticalThreshold,
        ];
    }
}
