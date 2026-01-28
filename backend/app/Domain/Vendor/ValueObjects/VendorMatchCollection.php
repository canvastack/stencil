<?php

namespace App\Domain\Vendor\ValueObjects;

/**
 * Vendor Match Collection
 * 
 * Collection of scored vendors for an order with analysis methods
 */
class VendorMatchCollection
{
    /**
     * @param ScoredVendor[] $scoredVendors
     * @param OrderRequirements $requirements
     */
    public function __construct(
        private array $scoredVendors,
        private OrderRequirements $requirements
    ) {}
    
    /**
     * Get all vendors
     */
    public function getVendors(): array
    {
        return $this->scoredVendors;
    }
    
    /**
     * Get top vendor
     */
    public function getTopVendor(): ?ScoredVendor
    {
        return $this->scoredVendors[0] ?? null;
    }
    
    /**
     * Get alternative vendors (excluding top vendor)
     */
    public function getAlternatives(int $count = 3): array
    {
        return array_slice($this->scoredVendors, 1, $count);
    }
    
    /**
     * Get recommended vendors (score >= 80)
     */
    public function getRecommendedVendors(): array
    {
        return array_filter($this->scoredVendors, fn($sv) => $sv->isRecommended());
    }
    
    /**
     * Get vendors by score range
     */
    public function getVendorsByScoreRange(float $minScore, float $maxScore): array
    {
        return array_filter(
            $this->scoredVendors,
            fn($sv) => $sv->getTotalScore() >= $minScore && $sv->getTotalScore() <= $maxScore
        );
    }
    
    /**
     * Get average score
     */
    public function getAverageScore(): float
    {
        if (empty($this->scoredVendors)) {
            return 0.0;
        }
        
        $totalScore = array_sum(array_map(fn($sv) => $sv->getTotalScore(), $this->scoredVendors));
        return $totalScore / count($this->scoredVendors);
    }
    
    /**
     * Get score distribution
     */
    public function getScoreDistribution(): array
    {
        $distribution = [
            'excellent' => 0,    // 90-100
            'very_good' => 0,    // 80-89
            'good' => 0,         // 70-79
            'acceptable' => 0,   // 60-69
            'poor' => 0          // <60
        ];
        
        foreach ($this->scoredVendors as $scoredVendor) {
            $score = $scoredVendor->getTotalScore();
            
            if ($score >= 90) {
                $distribution['excellent']++;
            } elseif ($score >= 80) {
                $distribution['very_good']++;
            } elseif ($score >= 70) {
                $distribution['good']++;
            } elseif ($score >= 60) {
                $distribution['acceptable']++;
            } else {
                $distribution['poor']++;
            }
        }
        
        return $distribution;
    }
    
    /**
     * Check if has qualified vendors
     */
    public function hasQualifiedVendors(): bool
    {
        return !empty($this->getRecommendedVendors());
    }
    
    /**
     * Get match quality assessment
     */
    public function getMatchQuality(): string
    {
        $recommendedCount = count($this->getRecommendedVendors());
        $totalCount = count($this->scoredVendors);
        
        if ($totalCount === 0) {
            return 'no_matches';
        }
        
        $recommendedRatio = $recommendedCount / $totalCount;
        
        return match(true) {
            $recommendedRatio >= 0.8 => 'excellent_matches',
            $recommendedRatio >= 0.6 => 'good_matches',
            $recommendedRatio >= 0.4 => 'fair_matches',
            $recommendedRatio >= 0.2 => 'limited_matches',
            default => 'poor_matches'
        };
    }
    
    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'vendors' => array_map(fn($sv) => $sv->toArray(), $this->scoredVendors),
            'requirements' => $this->requirements->toArray(),
            'summary' => [
                'total_vendors' => count($this->scoredVendors),
                'recommended_vendors' => count($this->getRecommendedVendors()),
                'average_score' => round($this->getAverageScore(), 2),
                'match_quality' => $this->getMatchQuality(),
                'has_qualified_vendors' => $this->hasQualifiedVendors(),
                'score_distribution' => $this->getScoreDistribution()
            ]
        ];
    }
}