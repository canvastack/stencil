<?php

namespace App\Domain\Vendor\ValueObjects;

/**
 * Vendor Score Value Object
 * 
 * Represents the comprehensive scoring of a vendor for a specific order
 */
class VendorScore
{
    public function __construct(
        private float $totalScore,
        private array $breakdown,
        private array $strengths,
        private array $weaknesses,
        private array $recommendations
    ) {}
    
    // Getters
    public function getTotalScore(): float { return $this->totalScore; }
    public function getBreakdown(): array { return $this->breakdown; }
    public function getStrengths(): array { return $this->strengths; }
    public function getWeaknesses(): array { return $this->weaknesses; }
    public function getRecommendations(): array { return $this->recommendations; }
    
    /**
     * Get score grade (A, B, C, D, F)
     */
    public function getGrade(): string
    {
        return match(true) {
            $this->totalScore >= 90 => 'A',
            $this->totalScore >= 80 => 'B',
            $this->totalScore >= 70 => 'C',
            $this->totalScore >= 60 => 'D',
            default => 'F'
        };
    }
    
    /**
     * Check if vendor meets minimum threshold
     */
    public function meetsThreshold(float $threshold = 70.0): bool
    {
        return $this->totalScore >= $threshold;
    }
    
    /**
     * Get performance category
     */
    public function getPerformanceCategory(): string
    {
        return match(true) {
            $this->totalScore >= 90 => 'excellent',
            $this->totalScore >= 80 => 'very_good',
            $this->totalScore >= 70 => 'good',
            $this->totalScore >= 60 => 'acceptable',
            default => 'poor'
        };
    }
    
    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'total_score' => round($this->totalScore, 2),
            'grade' => $this->getGrade(),
            'performance_category' => $this->getPerformanceCategory(),
            'meets_threshold' => $this->meetsThreshold(),
            'breakdown' => $this->breakdown,
            'strengths' => $this->strengths,
            'weaknesses' => $this->weaknesses,
            'recommendations' => $this->recommendations
        ];
    }
}