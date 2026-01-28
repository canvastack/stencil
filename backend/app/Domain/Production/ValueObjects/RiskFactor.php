<?php

namespace App\Domain\Production\ValueObjects;

/**
 * Risk Factor Value Object
 * 
 * Represents a potential risk in production with impact assessment
 * and mitigation strategies.
 */
final class RiskFactor
{
    public function __construct(
        private string $id,
        private string $type,
        private string $description,
        private string $severity, // low, medium, high, critical
        private float $probability, // 0.0 to 1.0
        private string $impact,
        private array $mitigationStrategies,
        private string $category,
        private bool $isActive = true
    ) {}

    public function getId(): string
    {
        return $this->id;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function getSeverity(): string
    {
        return $this->severity;
    }

    public function getProbability(): float
    {
        return $this->probability;
    }

    public function getImpact(): string
    {
        return $this->impact;
    }

    public function getMitigationStrategies(): array
    {
        return $this->mitigationStrategies;
    }

    public function getCategory(): string
    {
        return $this->category;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    /**
     * Calculate risk score (severity * probability)
     */
    public function getRiskScore(): float
    {
        $severityScore = match($this->severity) {
            'low' => 1.0,
            'medium' => 2.0,
            'high' => 3.0,
            'critical' => 4.0,
            default => 1.0
        };

        return $severityScore * $this->probability;
    }

    /**
     * Get risk level based on score
     */
    public function getRiskLevel(): string
    {
        $score = $this->getRiskScore();

        return match(true) {
            $score >= 3.0 => 'critical',
            $score >= 2.0 => 'high',
            $score >= 1.0 => 'medium',
            default => 'low'
        };
    }

    /**
     * Check if risk requires immediate attention
     */
    public function requiresImmediateAttention(): bool
    {
        return $this->getRiskLevel() === 'critical' || 
               ($this->severity === 'high' && $this->probability >= 0.7);
    }

    /**
     * Check if risk is timeline-related
     */
    public function isTimelineRisk(): bool
    {
        return in_array($this->category, ['timeline', 'schedule', 'delivery']);
    }

    /**
     * Check if risk is quality-related
     */
    public function isQualityRisk(): bool
    {
        return in_array($this->category, ['quality', 'defect', 'specification']);
    }

    /**
     * Check if risk is resource-related
     */
    public function isResourceRisk(): bool
    {
        return in_array($this->category, ['resource', 'material', 'equipment', 'labor']);
    }

    /**
     * Check if risk is vendor-related
     */
    public function isVendorRisk(): bool
    {
        return in_array($this->category, ['vendor', 'supplier', 'external']);
    }

    /**
     * Get recommended mitigation strategy
     */
    public function getRecommendedMitigation(): ?string
    {
        if (empty($this->mitigationStrategies)) {
            return null;
        }

        // Return the first strategy as recommended
        return $this->mitigationStrategies[0];
    }

    /**
     * Deactivate risk (mark as resolved)
     */
    public function deactivate(): self
    {
        return new self(
            id: $this->id,
            type: $this->type,
            description: $this->description,
            severity: $this->severity,
            probability: $this->probability,
            impact: $this->impact,
            mitigationStrategies: $this->mitigationStrategies,
            category: $this->category,
            isActive: false
        );
    }

    /**
     * Update probability based on new information
     */
    public function updateProbability(float $newProbability): self
    {
        return new self(
            id: $this->id,
            type: $this->type,
            description: $this->description,
            severity: $this->severity,
            probability: max(0.0, min(1.0, $newProbability)),
            impact: $this->impact,
            mitigationStrategies: $this->mitigationStrategies,
            category: $this->category,
            isActive: $this->isActive
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'description' => $this->description,
            'severity' => $this->severity,
            'probability' => $this->probability,
            'impact' => $this->impact,
            'mitigation_strategies' => $this->mitigationStrategies,
            'category' => $this->category,
            'is_active' => $this->isActive,
            'risk_score' => $this->getRiskScore(),
            'risk_level' => $this->getRiskLevel(),
            'requires_immediate_attention' => $this->requiresImmediateAttention()
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            type: $data['type'],
            description: $data['description'],
            severity: $data['severity'],
            probability: $data['probability'],
            impact: $data['impact'],
            mitigationStrategies: $data['mitigation_strategies'],
            category: $data['category'],
            isActive: $data['is_active'] ?? true
        );
    }
}