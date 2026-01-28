<?php

namespace App\Domain\Intelligence\ValueObjects;

use Carbon\Carbon;

/**
 * Pattern Analysis Value Object
 * 
 * Contains comprehensive analysis of patterns identified in customer
 * behavior, order history, and business data.
 */
class PatternAnalysis
{
    public function __construct(
        private array $patterns,
        private float $strength,
        private float $confidence,
        private int $sampleSize,
        private Carbon $analysisDate
    ) {
        $this->validateAnalysis();
    }

    public function getPatterns(): array
    {
        return $this->patterns;
    }

    public function getStrength(): float
    {
        return $this->strength;
    }

    public function getConfidence(): float
    {
        return $this->confidence;
    }

    public function getSampleSize(): int
    {
        return $this->sampleSize;
    }

    public function getAnalysisDate(): Carbon
    {
        return $this->analysisDate;
    }

    /**
     * Check if patterns are strong
     */
    public function hasStrongPatterns(): bool
    {
        return $this->strength >= 0.7;
    }

    /**
     * Check if analysis is high confidence
     */
    public function isHighConfidence(): bool
    {
        return $this->confidence >= 0.8;
    }

    /**
     * Check if sample size is adequate
     */
    public function hasAdequateSampleSize(): bool
    {
        return $this->sampleSize >= 20;
    }

    /**
     * Get seasonal patterns
     */
    public function getSeasonalPatterns(): array
    {
        return $this->patterns['seasonal_patterns'] ?? [];
    }

    /**
     * Get frequency patterns
     */
    public function getFrequencyPatterns(): array
    {
        return $this->patterns['frequency_patterns'] ?? [];
    }

    /**
     * Get value patterns
     */
    public function getValuePatterns(): array
    {
        return $this->patterns['value_patterns'] ?? [];
    }

    /**
     * Get material patterns
     */
    public function getMaterialPatterns(): array
    {
        return $this->patterns['material_patterns'] ?? [];
    }

    /**
     * Get vendor patterns
     */
    public function getVendorPatterns(): array
    {
        return $this->patterns['vendor_patterns'] ?? [];
    }

    /**
     * Get complexity patterns
     */
    public function getComplexityPatterns(): array
    {
        return $this->patterns['complexity_patterns'] ?? [];
    }

    /**
     * Get pattern strength by category
     */
    public function getPatternStrengthByCategory(): array
    {
        $strengths = [];
        
        foreach ($this->patterns as $category => $pattern) {
            if (is_array($pattern) && isset($pattern['strength'])) {
                $strengths[$category] = $pattern['strength'];
            } else {
                $strengths[$category] = 0.5; // Default strength
            }
        }
        
        return $strengths;
    }

    /**
     * Get strongest pattern category
     */
    public function getStrongestPatternCategory(): ?string
    {
        $strengths = $this->getPatternStrengthByCategory();
        
        if (empty($strengths)) {
            return null;
        }
        
        return array_key_first(array_slice($strengths, 0, 1, true));
    }

    /**
     * Get pattern insights summary
     */
    public function getInsightsSummary(): array
    {
        $insights = [];
        
        // Seasonal insights
        $seasonal = $this->getSeasonalPatterns();
        if (!empty($seasonal['peak_season'])) {
            $insights[] = "Peak ordering season: {$seasonal['peak_season']}";
        }
        
        // Frequency insights
        $frequency = $this->getFrequencyPatterns();
        if (isset($frequency['pattern'])) {
            $insights[] = "Ordering pattern: {$frequency['pattern']}";
        }
        
        // Material insights
        $material = $this->getMaterialPatterns();
        if (isset($material['preferred_materials'])) {
            $materials = implode(', ', array_slice($material['preferred_materials'], 0, 2));
            $insights[] = "Preferred materials: {$materials}";
        }
        
        // Vendor insights
        $vendor = $this->getVendorPatterns();
        if (isset($vendor['loyalty_level'])) {
            $insights[] = "Vendor loyalty: {$vendor['loyalty_level']}";
        }
        
        return $insights;
    }

    /**
     * Get reliability score
     */
    public function getReliabilityScore(): float
    {
        $factors = [
            'confidence' => $this->confidence,
            'strength' => $this->strength,
            'sample_size' => min(1.0, $this->sampleSize / 50), // Normalize to 1.0
            'pattern_consistency' => $this->calculatePatternConsistency()
        ];
        
        $weights = [
            'confidence' => 0.3,
            'strength' => 0.3,
            'sample_size' => 0.2,
            'pattern_consistency' => 0.2
        ];
        
        $score = 0;
        foreach ($factors as $factor => $value) {
            $score += $value * $weights[$factor];
        }
        
        return min(1.0, max(0.0, $score));
    }

    /**
     * Get analysis quality rating
     */
    public function getQualityRating(): string
    {
        $reliability = $this->getReliabilityScore();
        
        return match(true) {
            $reliability >= 0.9 => 'excellent',
            $reliability >= 0.8 => 'very_good',
            $reliability >= 0.7 => 'good',
            $reliability >= 0.6 => 'fair',
            default => 'poor'
        };
    }

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return [
            'patterns' => $this->patterns,
            'strength' => $this->strength,
            'confidence' => $this->confidence,
            'sample_size' => $this->sampleSize,
            'analysis_date' => $this->analysisDate->toISOString(),
            'reliability_score' => $this->getReliabilityScore(),
            'quality_rating' => $this->getQualityRating(),
            'strongest_pattern_category' => $this->getStrongestPatternCategory(),
            'pattern_strengths' => $this->getPatternStrengthByCategory(),
            'insights_summary' => $this->getInsightsSummary(),
            'indicators' => [
                'strong_patterns' => $this->hasStrongPatterns(),
                'high_confidence' => $this->isHighConfidence(),
                'adequate_sample_size' => $this->hasAdequateSampleSize(),
                'reliable_analysis' => $this->getReliabilityScore() >= 0.7
            ]
        ];
    }

    private function validateAnalysis(): void
    {
        if ($this->strength < 0 || $this->strength > 1) {
            throw new \InvalidArgumentException('Strength must be between 0 and 1');
        }

        if ($this->confidence < 0 || $this->confidence > 1) {
            throw new \InvalidArgumentException('Confidence must be between 0 and 1');
        }

        if ($this->sampleSize < 0) {
            throw new \InvalidArgumentException('Sample size cannot be negative');
        }

        if (!is_array($this->patterns)) {
            throw new \InvalidArgumentException('Patterns must be an array');
        }
    }

    private function calculatePatternConsistency(): float
    {
        $strengths = $this->getPatternStrengthByCategory();
        
        if (empty($strengths)) {
            return 0;
        }
        
        $mean = array_sum($strengths) / count($strengths);
        $variance = array_sum(array_map(fn($x) => pow($x - $mean, 2), $strengths)) / count($strengths);
        
        // Lower variance indicates higher consistency
        return max(0, 1 - sqrt($variance));
    }
}