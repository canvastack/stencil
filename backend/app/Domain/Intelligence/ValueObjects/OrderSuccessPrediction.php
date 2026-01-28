<?php

namespace App\Domain\Intelligence\ValueObjects;

use App\Domain\Shared\ValueObjects\UuidValueObject;

/**
 * Order Success Prediction Value Object
 * 
 * Contains ML-based prediction of order success probability with
 * risk factors, recommendations, and confidence metrics.
 */
class OrderSuccessPrediction
{
    public function __construct(
        private UuidValueObject $orderId,
        private float $successProbability,
        private array $riskFactors,
        private array $recommendations,
        private float $confidenceLevel,
        private string $modelVersion
    ) {
        $this->validatePrediction();
    }

    public function getOrderId(): UuidValueObject
    {
        return $this->orderId;
    }

    public function getSuccessProbability(): float
    {
        return $this->successProbability;
    }

    public function getRiskFactors(): array
    {
        return $this->riskFactors;
    }

    public function getRecommendations(): array
    {
        return $this->recommendations;
    }

    public function getConfidenceLevel(): float
    {
        return $this->confidenceLevel;
    }

    public function getModelVersion(): string
    {
        return $this->modelVersion;
    }

    /**
     * Check if order has high success probability
     */
    public function isHighSuccessProbability(): bool
    {
        return $this->successProbability >= 0.8;
    }

    /**
     * Check if prediction is high confidence
     */
    public function isHighConfidence(): bool
    {
        return $this->confidenceLevel >= 0.8;
    }

    /**
     * Get risk level based on success probability
     */
    public function getRiskLevel(): string
    {
        return match(true) {
            $this->successProbability >= 0.9 => 'very_low',
            $this->successProbability >= 0.8 => 'low',
            $this->successProbability >= 0.6 => 'medium',
            $this->successProbability >= 0.4 => 'high',
            default => 'very_high'
        };
    }

    /**
     * Get success category for display
     */
    public function getSuccessCategory(): string
    {
        return match(true) {
            $this->successProbability >= 0.9 => 'Excellent',
            $this->successProbability >= 0.8 => 'Very Good',
            $this->successProbability >= 0.7 => 'Good',
            $this->successProbability >= 0.6 => 'Fair',
            $this->successProbability >= 0.5 => 'Poor',
            default => 'Critical'
        };
    }

    /**
     * Get color indicator for UI
     */
    public function getColorIndicator(): string
    {
        return match($this->getRiskLevel()) {
            'very_low' => 'green',
            'low' => 'light-green',
            'medium' => 'yellow',
            'high' => 'orange',
            'very_high' => 'red',
            default => 'gray'
        };
    }

    /**
     * Get high-priority risk factors
     */
    public function getHighPriorityRiskFactors(): array
    {
        return array_filter($this->riskFactors, fn($risk) => 
            isset($risk['priority']) && $risk['priority'] === 'high'
        );
    }

    /**
     * Get actionable recommendations
     */
    public function getActionableRecommendations(): array
    {
        return array_filter($this->recommendations, fn($rec) => 
            isset($rec['actionable']) && $rec['actionable'] === true
        );
    }

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return [
            'order_id' => $this->orderId->getValue(),
            'success_probability' => $this->successProbability,
            'success_percentage' => round($this->successProbability * 100, 1),
            'success_category' => $this->getSuccessCategory(),
            'risk_level' => $this->getRiskLevel(),
            'color_indicator' => $this->getColorIndicator(),
            'confidence_level' => $this->confidenceLevel,
            'model_version' => $this->modelVersion,
            'risk_factors' => $this->riskFactors,
            'recommendations' => $this->recommendations,
            'high_priority_risks' => $this->getHighPriorityRiskFactors(),
            'actionable_recommendations' => $this->getActionableRecommendations(),
            'indicators' => [
                'high_success_probability' => $this->isHighSuccessProbability(),
                'high_confidence' => $this->isHighConfidence(),
                'needs_attention' => !$this->isHighSuccessProbability(),
                'reliable_prediction' => $this->isHighConfidence()
            ]
        ];
    }

    private function validatePrediction(): void
    {
        if ($this->successProbability < 0 || $this->successProbability > 1) {
            throw new \InvalidArgumentException('Success probability must be between 0 and 1');
        }

        if ($this->confidenceLevel < 0 || $this->confidenceLevel > 1) {
            throw new \InvalidArgumentException('Confidence level must be between 0 and 1');
        }

        if (!is_array($this->riskFactors)) {
            throw new \InvalidArgumentException('Risk factors must be an array');
        }

        if (!is_array($this->recommendations)) {
            throw new \InvalidArgumentException('Recommendations must be an array');
        }

        if (empty(trim($this->modelVersion))) {
            throw new \InvalidArgumentException('Model version cannot be empty');
        }
    }
}