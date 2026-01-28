<?php

namespace App\Domain\Security\ValueObjects;

use Carbon\Carbon;

/**
 * Security Anomaly Value Object
 * 
 * Represents a detected security anomaly with type, severity, and metadata.
 */
class SecurityAnomaly
{
    public function __construct(
        private string $type,
        private string $severity,
        private string $description,
        private Carbon $timestamp,
        private ?array $metadata = null
    ) {
        $this->validateSeverity($severity);
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function getSeverity(): string
    {
        return $this->severity;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function getTimestamp(): Carbon
    {
        return $this->timestamp;
    }

    public function getMetadata(): ?array
    {
        return $this->metadata;
    }

    public function isHighRisk(): bool
    {
        return in_array($this->severity, ['high', 'critical']);
    }

    public function toArray(): array
    {
        return [
            'type' => $this->type,
            'severity' => $this->severity,
            'description' => $this->description,
            'timestamp' => $this->timestamp->toISOString(),
            'metadata' => $this->metadata,
            'is_high_risk' => $this->isHighRisk()
        ];
    }

    private function validateSeverity(string $severity): void
    {
        $validSeverities = ['low', 'medium', 'high', 'critical'];
        
        if (!in_array($severity, $validSeverities)) {
            throw new \InvalidArgumentException("Invalid severity: {$severity}. Must be one of: " . implode(', ', $validSeverities));
        }
    }
}