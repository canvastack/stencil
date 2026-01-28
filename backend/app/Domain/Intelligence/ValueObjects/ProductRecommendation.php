<?php

namespace App\Domain\Intelligence\ValueObjects;

use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\Money;

/**
 * Product Recommendation Value Object
 * 
 * Represents an AI-generated product recommendation with confidence score,
 * reasoning, and expected business impact.
 */
class ProductRecommendation
{
    public function __construct(
        private UuidValueObject $productId,
        private string $productName,
        private string $reason,
        private float $confidence,
        private Money $expectedOrderValue,
        private float $seasonalRelevance,
        private bool $materialMatch,
        private bool $complexityMatch
    ) {
        $this->validateRecommendation();
    }

    public function getProductId(): UuidValueObject
    {
        return $this->productId;
    }

    public function getProductName(): string
    {
        return $this->productName;
    }

    public function getReason(): string
    {
        return $this->reason;
    }

    public function getConfidence(): float
    {
        return $this->confidence;
    }

    public function getExpectedOrderValue(): Money
    {
        return $this->expectedOrderValue;
    }

    public function getSeasonalRelevance(): float
    {
        return $this->seasonalRelevance;
    }

    public function isMaterialMatch(): bool
    {
        return $this->materialMatch;
    }

    public function isComplexityMatch(): bool
    {
        return $this->complexityMatch;
    }

    /**
     * Check if this is a high-confidence recommendation
     */
    public function isHighConfidence(): bool
    {
        return $this->confidence >= 0.8;
    }

    /**
     * Check if this is seasonally relevant
     */
    public function isSeasonallyRelevant(): bool
    {
        return $this->seasonalRelevance >= 0.7;
    }

    /**
     * Get recommendation strength based on multiple factors
     */
    public function getRecommendationStrength(): string
    {
        $score = $this->confidence;
        
        // Boost score for matches
        if ($this->materialMatch) $score += 0.1;
        if ($this->complexityMatch) $score += 0.1;
        if ($this->seasonalRelevance > 0.7) $score += 0.1;
        
        return match(true) {
            $score >= 0.9 => 'excellent',
            $score >= 0.8 => 'very_good',
            $score >= 0.7 => 'good',
            $score >= 0.6 => 'fair',
            default => 'poor'
        };
    }

    /**
     * Get match indicators
     */
    public function getMatchIndicators(): array
    {
        return [
            'material_match' => $this->materialMatch,
            'complexity_match' => $this->complexityMatch,
            'seasonal_relevance' => $this->seasonalRelevance,
            'high_confidence' => $this->isHighConfidence(),
            'seasonally_relevant' => $this->isSeasonallyRelevant()
        ];
    }

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return [
            'product_id' => $this->productId->getValue(),
            'product_name' => $this->productName,
            'reason' => $this->reason,
            'confidence' => $this->confidence,
            'expected_order_value' => [
                'amount' => $this->expectedOrderValue->getAmount(),
                'currency' => $this->expectedOrderValue->getCurrency(),
                'formatted' => $this->expectedOrderValue->format()
            ],
            'seasonal_relevance' => $this->seasonalRelevance,
            'material_match' => $this->materialMatch,
            'complexity_match' => $this->complexityMatch,
            'recommendation_strength' => $this->getRecommendationStrength(),
            'match_indicators' => $this->getMatchIndicators(),
            'is_high_confidence' => $this->isHighConfidence(),
            'is_seasonally_relevant' => $this->isSeasonallyRelevant()
        ];
    }

    private function validateRecommendation(): void
    {
        if ($this->confidence < 0 || $this->confidence > 1) {
            throw new \InvalidArgumentException('Confidence must be between 0 and 1');
        }

        if ($this->seasonalRelevance < 0 || $this->seasonalRelevance > 1) {
            throw new \InvalidArgumentException('Seasonal relevance must be between 0 and 1');
        }

        if (empty(trim($this->productName))) {
            throw new \InvalidArgumentException('Product name cannot be empty');
        }

        if (empty(trim($this->reason))) {
            throw new \InvalidArgumentException('Reason cannot be empty');
        }
    }
}