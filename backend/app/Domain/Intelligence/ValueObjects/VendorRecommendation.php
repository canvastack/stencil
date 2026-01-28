<?php

namespace App\Domain\Intelligence\ValueObjects;

use App\Domain\Shared\ValueObjects\UuidValueObject;

/**
 * Vendor Recommendation Value Object
 * 
 * Represents an AI-generated vendor recommendation with performance metrics,
 * compatibility scores, and business impact analysis.
 */
class VendorRecommendation
{
    public function __construct(
        private UuidValueObject $vendorId,
        private string $vendorName,
        private string $reason,
        private float $confidence,
        private int $expectedLeadTime,
        private float $qualityScore,
        private float $priceCompetitiveness,
        private bool $pastCollaboration,
        private float $capacityAvailability
    ) {
        $this->validateRecommendation();
    }

    public function getVendorId(): UuidValueObject
    {
        return $this->vendorId;
    }

    public function getVendorName(): string
    {
        return $this->vendorName;
    }

    public function getReason(): string
    {
        return $this->reason;
    }

    public function getConfidence(): float
    {
        return $this->confidence;
    }

    public function getExpectedLeadTime(): int
    {
        return $this->expectedLeadTime;
    }

    public function getQualityScore(): float
    {
        return $this->qualityScore;
    }

    public function getPriceCompetitiveness(): float
    {
        return $this->priceCompetitiveness;
    }

    public function hasPastCollaboration(): bool
    {
        return $this->pastCollaboration;
    }

    public function getCapacityAvailability(): float
    {
        return $this->capacityAvailability;
    }

    /**
     * Check if this is a high-confidence recommendation
     */
    public function isHighConfidence(): bool
    {
        return $this->confidence >= 0.8;
    }

    /**
     * Check if vendor has high quality score
     */
    public function isHighQuality(): bool
    {
        return $this->qualityScore >= 4.0;
    }

    /**
     * Check if vendor is price competitive
     */
    public function isPriceCompetitive(): bool
    {
        return $this->priceCompetitiveness >= 0.7;
    }

    /**
     * Check if vendor has good capacity availability
     */
    public function hasGoodCapacity(): bool
    {
        return $this->capacityAvailability >= 0.7;
    }

    /**
     * Check if lead time is acceptable (≤ 14 days)
     */
    public function hasAcceptableLeadTime(): bool
    {
        return $this->expectedLeadTime <= 14;
    }

    /**
     * Get overall vendor score based on multiple factors
     */
    public function getOverallScore(): float
    {
        $weights = [
            'confidence' => 0.3,
            'quality' => 0.25,
            'price' => 0.2,
            'capacity' => 0.15,
            'lead_time' => 0.1
        ];

        $leadTimeScore = max(0, 1 - ($this->expectedLeadTime / 30)); // Normalize lead time
        
        return ($this->confidence * $weights['confidence']) +
               ($this->qualityScore / 5 * $weights['quality']) +
               ($this->priceCompetitiveness * $weights['price']) +
               ($this->capacityAvailability * $weights['capacity']) +
               ($leadTimeScore * $weights['lead_time']);
    }

    /**
     * Get vendor rating category
     */
    public function getVendorRating(): string
    {
        $score = $this->getOverallScore();
        
        return match(true) {
            $score >= 0.9 => 'excellent',
            $score >= 0.8 => 'very_good',
            $score >= 0.7 => 'good',
            $score >= 0.6 => 'fair',
            default => 'poor'
        };
    }

    /**
     * Get risk assessment
     */
    public function getRiskAssessment(): array
    {
        $risks = [];
        
        if (!$this->hasAcceptableLeadTime()) {
            $risks[] = 'Long lead time may impact delivery schedules';
        }
        
        if (!$this->hasGoodCapacity()) {
            $risks[] = 'Limited capacity availability may cause delays';
        }
        
        if (!$this->isPriceCompetitive()) {
            $risks[] = 'Higher pricing may impact project margins';
        }
        
        if (!$this->isHighQuality()) {
            $risks[] = 'Quality concerns may require additional oversight';
        }
        
        return [
            'risk_level' => $this->calculateRiskLevel(),
            'risk_factors' => $risks,
            'mitigation_suggestions' => $this->getMitigationSuggestions($risks)
        ];
    }

    /**
     * Get vendor strengths
     */
    public function getVendorStrengths(): array
    {
        $strengths = [];
        
        if ($this->hasPastCollaboration()) {
            $strengths[] = 'Proven track record with past successful collaborations';
        }
        
        if ($this->isHighQuality()) {
            $strengths[] = 'High quality rating ensures reliable deliverables';
        }
        
        if ($this->isPriceCompetitive()) {
            $strengths[] = 'Competitive pricing supports project profitability';
        }
        
        if ($this->hasGoodCapacity()) {
            $strengths[] = 'Good capacity availability ensures timely delivery';
        }
        
        if ($this->hasAcceptableLeadTime()) {
            $strengths[] = 'Short lead time supports tight project schedules';
        }
        
        return $strengths;
    }

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return [
            'vendor_id' => $this->vendorId->getValue(),
            'vendor_name' => $this->vendorName,
            'reason' => $this->reason,
            'confidence' => $this->confidence,
            'expected_lead_time' => $this->expectedLeadTime,
            'quality_score' => $this->qualityScore,
            'price_competitiveness' => $this->priceCompetitiveness,
            'past_collaboration' => $this->pastCollaboration,
            'capacity_availability' => $this->capacityAvailability,
            'overall_score' => $this->getOverallScore(),
            'vendor_rating' => $this->getVendorRating(),
            'risk_assessment' => $this->getRiskAssessment(),
            'vendor_strengths' => $this->getVendorStrengths(),
            'indicators' => [
                'high_confidence' => $this->isHighConfidence(),
                'high_quality' => $this->isHighQuality(),
                'price_competitive' => $this->isPriceCompetitive(),
                'good_capacity' => $this->hasGoodCapacity(),
                'acceptable_lead_time' => $this->hasAcceptableLeadTime()
            ]
        ];
    }

    private function validateRecommendation(): void
    {
        if ($this->confidence < 0 || $this->confidence > 1) {
            throw new \InvalidArgumentException('Confidence must be between 0 and 1');
        }

        if ($this->qualityScore < 0 || $this->qualityScore > 5) {
            throw new \InvalidArgumentException('Quality score must be between 0 and 5');
        }

        if ($this->priceCompetitiveness < 0 || $this->priceCompetitiveness > 1) {
            throw new \InvalidArgumentException('Price competitiveness must be between 0 and 1');
        }

        if ($this->capacityAvailability < 0 || $this->capacityAvailability > 1) {
            throw new \InvalidArgumentException('Capacity availability must be between 0 and 1');
        }

        if ($this->expectedLeadTime < 0) {
            throw new \InvalidArgumentException('Expected lead time cannot be negative');
        }

        if (empty(trim($this->vendorName))) {
            throw new \InvalidArgumentException('Vendor name cannot be empty');
        }

        if (empty(trim($this->reason))) {
            throw new \InvalidArgumentException('Reason cannot be empty');
        }
    }

    private function calculateRiskLevel(): string
    {
        $riskFactors = 0;
        
        if (!$this->hasAcceptableLeadTime()) $riskFactors++;
        if (!$this->hasGoodCapacity()) $riskFactors++;
        if (!$this->isPriceCompetitive()) $riskFactors++;
        if (!$this->isHighQuality()) $riskFactors++;
        
        return match($riskFactors) {
            0 => 'low',
            1 => 'low',
            2 => 'medium',
            3 => 'high',
            default => 'very_high'
        };
    }

    private function getMitigationSuggestions(array $risks): array
    {
        $suggestions = [];
        
        if (!$this->hasAcceptableLeadTime()) {
            $suggestions[] = 'Plan orders well in advance to accommodate longer lead times';
        }
        
        if (!$this->hasGoodCapacity()) {
            $suggestions[] = 'Confirm capacity availability before placing large orders';
        }
        
        if (!$this->isPriceCompetitive()) {
            $suggestions[] = 'Negotiate volume discounts or explore alternative pricing models';
        }
        
        if (!$this->isHighQuality()) {
            $suggestions[] = 'Implement additional quality checkpoints and inspections';
        }
        
        return $suggestions;
    }
}