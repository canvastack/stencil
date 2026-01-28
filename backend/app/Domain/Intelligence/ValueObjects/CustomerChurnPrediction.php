<?php

namespace App\Domain\Intelligence\ValueObjects;

use App\Domain\Shared\ValueObjects\UuidValueObject;
use Carbon\Carbon;

/**
 * Customer Churn Prediction Value Object
 * 
 * Contains AI-generated customer churn predictions with risk assessments
 * and retention recommendations.
 */
class CustomerChurnPrediction
{
    public function __construct(
        private UuidValueObject $tenantId,
        private array $predictions,
        private array $highRiskCustomers,
        private float $averageChurnRate,
        private int $totalCustomers,
        private float $modelAccuracy,
        private Carbon $generatedAt
    ) {
        $this->validatePrediction();
    }

    public function getTenantId(): UuidValueObject
    {
        return $this->tenantId;
    }

    public function getPredictions(): array
    {
        return $this->predictions;
    }

    public function getHighRiskCustomers(): array
    {
        return $this->highRiskCustomers;
    }

    public function getAverageChurnRate(): float
    {
        return $this->averageChurnRate;
    }

    public function getTotalCustomers(): int
    {
        return $this->totalCustomers;
    }

    public function getModelAccuracy(): float
    {
        return $this->modelAccuracy;
    }

    public function getGeneratedAt(): Carbon
    {
        return $this->generatedAt;
    }

    /**
     * Check if model accuracy is reliable
     */
    public function isReliableModel(): bool
    {
        return $this->modelAccuracy >= 0.8;
    }

    /**
     * Get customers by risk level
     */
    public function getCustomersByRiskLevel(): array
    {
        $riskLevels = [
            'very_high' => [],
            'high' => [],
            'medium' => [],
            'low' => [],
            'very_low' => []
        ];

        foreach ($this->predictions as $prediction) {
            $riskLevel = $prediction['risk_level'];
            if (isset($riskLevels[$riskLevel])) {
                $riskLevels[$riskLevel][] = $prediction;
            }
        }

        return $riskLevels;
    }

    /**
     * Get churn statistics
     */
    public function getChurnStatistics(): array
    {
        $riskLevels = $this->getCustomersByRiskLevel();
        
        return [
            'total_customers' => $this->totalCustomers,
            'very_high_risk' => count($riskLevels['very_high']),
            'high_risk' => count($riskLevels['high']),
            'medium_risk' => count($riskLevels['medium']),
            'low_risk' => count($riskLevels['low']),
            'very_low_risk' => count($riskLevels['very_low']),
            'average_churn_rate' => $this->averageChurnRate,
            'predicted_churners' => count($riskLevels['very_high']) + count($riskLevels['high'])
        ];
    }

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return [
            'tenant_id' => $this->tenantId->getValue(),
            'predictions' => $this->predictions,
            'high_risk_customers' => $this->highRiskCustomers,
            'average_churn_rate' => $this->averageChurnRate,
            'total_customers' => $this->totalCustomers,
            'model_accuracy' => $this->modelAccuracy,
            'generated_at' => $this->generatedAt->toISOString(),
            'customers_by_risk_level' => $this->getCustomersByRiskLevel(),
            'churn_statistics' => $this->getChurnStatistics(),
            'indicators' => [
                'reliable_model' => $this->isReliableModel(),
                'high_churn_risk' => $this->averageChurnRate > 0.2,
                'needs_attention' => count($this->highRiskCustomers) > 0
            ]
        ];
    }

    private function validatePrediction(): void
    {
        if ($this->averageChurnRate < 0 || $this->averageChurnRate > 1) {
            throw new \InvalidArgumentException('Average churn rate must be between 0 and 1');
        }

        if ($this->modelAccuracy < 0 || $this->modelAccuracy > 1) {
            throw new \InvalidArgumentException('Model accuracy must be between 0 and 1');
        }

        if ($this->totalCustomers < 0) {
            throw new \InvalidArgumentException('Total customers cannot be negative');
        }

        if (!is_array($this->predictions)) {
            throw new \InvalidArgumentException('Predictions must be an array');
        }

        if (!is_array($this->highRiskCustomers)) {
            throw new \InvalidArgumentException('High risk customers must be an array');
        }
    }
}