<?php

namespace App\Domain\Vendor\ValueObjects;

/**
 * Vendor Recommendation Value Object
 * 
 * Represents the final recommendation for vendor selection
 */
class VendorRecommendation
{
    public function __construct(
        private ScoredVendor $primaryVendor,
        private array $alternatives,
        private string $reasoning,
        private object $riskAssessment
    ) {}
    
    // Getters
    public function getPrimaryVendor(): ScoredVendor { return $this->primaryVendor; }
    public function getAlternatives(): array { return $this->alternatives; }
    public function getReasoning(): string { return $this->reasoning; }
    public function getRiskAssessment(): object { return $this->riskAssessment; }
    
    /**
     * Get confidence level of recommendation
     */
    public function getConfidenceLevel(): string
    {
        $primaryScore = $this->primaryVendor->getTotalScore();
        $alternativeScores = array_map(fn($alt) => $alt->getTotalScore(), $this->alternatives);
        
        if (empty($alternativeScores)) {
            return $primaryScore >= 90 ? 'high' : 'medium';
        }
        
        $scoreDifference = $primaryScore - max($alternativeScores);
        
        return match(true) {
            $scoreDifference >= 15 => 'very_high',
            $scoreDifference >= 10 => 'high',
            $scoreDifference >= 5 => 'medium',
            default => 'low'
        };
    }
    
    /**
     * Check if recommendation is strong
     */
    public function isStrongRecommendation(): bool
    {
        return in_array($this->getConfidenceLevel(), ['high', 'very_high']);
    }
    
    /**
     * Get recommendation summary
     */
    public function getSummary(): string
    {
        $vendorName = $this->primaryVendor->getVendorName();
        $score = $this->primaryVendor->getTotalScore();
        $confidence = $this->getConfidenceLevel();
        
        return "Recommend {$vendorName} with {$score}% match score. Confidence: {$confidence}.";
    }
    
    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'primary_vendor' => $this->primaryVendor->toArray(),
            'alternatives' => array_map(fn($alt) => $alt->toArray(), $this->alternatives),
            'reasoning' => $this->reasoning,
            'risk_assessment' => (array) $this->riskAssessment,
            'confidence_level' => $this->getConfidenceLevel(),
            'is_strong_recommendation' => $this->isStrongRecommendation(),
            'summary' => $this->getSummary()
        ];
    }
}