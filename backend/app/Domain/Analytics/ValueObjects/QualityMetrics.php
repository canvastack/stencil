<?php

namespace App\Domain\Analytics\ValueObjects;

/**
 * Quality Metrics Value Object
 * 
 * Represents comprehensive quality analytics.
 */
final class QualityMetrics
{
    public function __construct(
        private float $qualityScore,
        private float $defectRate,
        private float $reworkRate,
        private float $customerSatisfactionScore,
        private array $qualityTrends,
        private array $improvementOpportunities
    ) {}

    public function getQualityScore(): float { return $this->qualityScore; }
    public function getDefectRate(): float { return $this->defectRate; }
    public function getReworkRate(): float { return $this->reworkRate; }
    public function getCustomerSatisfactionScore(): float { return $this->customerSatisfactionScore; }
    public function getQualityTrends(): array { return $this->qualityTrends; }
    public function getImprovementOpportunities(): array { return $this->improvementOpportunities; }

    public function toArray(): array
    {
        return [
            'quality_score' => $this->qualityScore,
            'defect_rate' => $this->defectRate,
            'rework_rate' => $this->reworkRate,
            'customer_satisfaction_score' => $this->customerSatisfactionScore,
            'quality_trends' => $this->qualityTrends,
            'improvement_opportunities' => $this->improvementOpportunities
        ];
    }
}