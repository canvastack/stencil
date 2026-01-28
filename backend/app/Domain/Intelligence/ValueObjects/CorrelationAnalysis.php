<?php

namespace App\Domain\Intelligence\ValueObjects;

/**
 * Correlation Analysis Value Object
 * 
 * Contains comprehensive correlation analysis between different data dimensions
 * including correlation coefficients, significance tests, and insights.
 */
class CorrelationAnalysis
{
    public function __construct(
        private array $correlations,
        private array $strongCorrelations,
        private array $significantPairs,
        private array $insights
    ) {
        $this->validateAnalysis();
    }

    public function getCorrelations(): array
    {
        return $this->correlations;
    }

    public function getStrongCorrelations(): array
    {
        return $this->strongCorrelations;
    }

    public function getSignificantPairs(): array
    {
        return $this->significantPairs;
    }

    public function getInsights(): array
    {
        return $this->insights;
    }

    /**
     * Check if any strong correlations exist
     */
    public function hasStrongCorrelations(): bool
    {
        return count($this->strongCorrelations) > 0;
    }

    /**
     * Get positive correlations
     */
    public function getPositiveCorrelations(): array
    {
        return array_filter($this->strongCorrelations, fn($corr) => $corr['correlation'] > 0);
    }

    /**
     * Get negative correlations
     */
    public function getNegativeCorrelations(): array
    {
        return array_filter($this->strongCorrelations, fn($corr) => $corr['correlation'] < 0);
    }

    /**
     * Get strongest correlation
     */
    public function getStrongestCorrelation(): ?array
    {
        if (empty($this->strongCorrelations)) {
            return null;
        }
        
        $strongest = null;
        $maxStrength = 0;
        
        foreach ($this->strongCorrelations as $correlation) {
            $strength = abs($correlation['correlation']);
            if ($strength > $maxStrength) {
                $maxStrength = $strength;
                $strongest = $correlation;
            }
        }
        
        return $strongest;
    }

    /**
     * Get correlations by strength category
     */
    public function getCorrelationsByStrength(): array
    {
        $categorized = [
            'very_strong' => [],
            'strong' => [],
            'moderate' => [],
            'weak' => []
        ];
        
        foreach ($this->strongCorrelations as $correlation) {
            $strength = $correlation['strength'];
            if (isset($categorized[$strength])) {
                $categorized[$strength][] = $correlation;
            }
        }
        
        return $categorized;
    }

    /**
     * Get correlation matrix for visualization
     */
    public function getCorrelationMatrix(): array
    {
        $matrix = [];
        $dimensions = $this->extractDimensions();
        
        foreach ($dimensions as $dim1) {
            $matrix[$dim1] = [];
            foreach ($dimensions as $dim2) {
                $key = "{$dim1}_vs_{$dim2}";
                $reverseKey = "{$dim2}_vs_{$dim1}";
                
                if ($dim1 === $dim2) {
                    $matrix[$dim1][$dim2] = 1.0;
                } elseif (isset($this->correlations[$key])) {
                    $matrix[$dim1][$dim2] = $this->correlations[$key];
                } elseif (isset($this->correlations[$reverseKey])) {
                    $matrix[$dim1][$dim2] = $this->correlations[$reverseKey];
                } else {
                    $matrix[$dim1][$dim2] = 0.0;
                }
            }
        }
        
        return $matrix;
    }

    /**
     * Get business implications of correlations
     */
    public function getBusinessImplications(): array
    {
        $implications = [];
        
        foreach ($this->strongCorrelations as $correlation) {
            $dim1 = $correlation['dimension1'];
            $dim2 = $correlation['dimension2'];
            $strength = abs($correlation['correlation']);
            $direction = $correlation['direction'];
            
            if ($strength >= 0.8) {
                if ($direction === 'positive') {
                    $implications[] = "Strong positive relationship: Increasing {$dim1} typically leads to higher {$dim2}";
                } else {
                    $implications[] = "Strong negative relationship: Increasing {$dim1} typically leads to lower {$dim2}";
                }
            }
        }
        
        return $implications;
    }

    /**
     * Get predictive opportunities
     */
    public function getPredictiveOpportunities(): array
    {
        $opportunities = [];
        
        foreach ($this->strongCorrelations as $correlation) {
            if (abs($correlation['correlation']) >= 0.7) {
                $opportunities[] = [
                    'predictor' => $correlation['dimension1'],
                    'target' => $correlation['dimension2'],
                    'strength' => $correlation['correlation'],
                    'confidence' => $this->calculatePredictiveConfidence($correlation['correlation']),
                    'use_case' => $this->generatePredictiveUseCase($correlation)
                ];
            }
        }
        
        return $opportunities;
    }

    /**
     * Get correlation summary statistics
     */
    public function getSummaryStatistics(): array
    {
        if (empty($this->correlations)) {
            return [
                'total_pairs' => 0,
                'strong_correlations' => 0,
                'average_correlation' => 0,
                'max_correlation' => 0,
                'min_correlation' => 0
            ];
        }
        
        $values = array_values($this->correlations);
        
        return [
            'total_pairs' => count($this->correlations),
            'strong_correlations' => count($this->strongCorrelations),
            'average_correlation' => array_sum($values) / count($values),
            'max_correlation' => max($values),
            'min_correlation' => min($values),
            'positive_correlations' => count(array_filter($values, fn($v) => $v > 0)),
            'negative_correlations' => count(array_filter($values, fn($v) => $v < 0))
        ];
    }

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return [
            'correlations' => $this->correlations,
            'strong_correlations' => $this->strongCorrelations,
            'significant_pairs' => $this->significantPairs,
            'insights' => $this->insights,
            'positive_correlations' => $this->getPositiveCorrelations(),
            'negative_correlations' => $this->getNegativeCorrelations(),
            'strongest_correlation' => $this->getStrongestCorrelation(),
            'correlations_by_strength' => $this->getCorrelationsByStrength(),
            'correlation_matrix' => $this->getCorrelationMatrix(),
            'business_implications' => $this->getBusinessImplications(),
            'predictive_opportunities' => $this->getPredictiveOpportunities(),
            'summary_statistics' => $this->getSummaryStatistics(),
            'indicators' => [
                'has_strong_correlations' => $this->hasStrongCorrelations(),
                'has_predictive_value' => count($this->getPredictiveOpportunities()) > 0,
                'diverse_relationships' => count($this->getPositiveCorrelations()) > 0 && count($this->getNegativeCorrelations()) > 0
            ]
        ];
    }

    private function validateAnalysis(): void
    {
        if (!is_array($this->correlations)) {
            throw new \InvalidArgumentException('Correlations must be an array');
        }

        if (!is_array($this->strongCorrelations)) {
            throw new \InvalidArgumentException('Strong correlations must be an array');
        }

        if (!is_array($this->significantPairs)) {
            throw new \InvalidArgumentException('Significant pairs must be an array');
        }

        if (!is_array($this->insights)) {
            throw new \InvalidArgumentException('Insights must be an array');
        }

        // Validate correlation values are between -1 and 1
        foreach ($this->correlations as $key => $value) {
            if (!is_numeric($value) || $value < -1 || $value > 1) {
                throw new \InvalidArgumentException("Invalid correlation value for {$key}: {$value}");
            }
        }
    }

    private function extractDimensions(): array
    {
        $dimensions = [];
        
        foreach (array_keys($this->correlations) as $key) {
            $parts = explode('_vs_', $key);
            if (count($parts) === 2) {
                $dimensions[] = $parts[0];
                $dimensions[] = $parts[1];
            }
        }
        
        return array_unique($dimensions);
    }

    private function calculatePredictiveConfidence(float $correlation): float
    {
        // Higher absolute correlation means higher predictive confidence
        return abs($correlation);
    }

    private function generatePredictiveUseCase(array $correlation): string
    {
        $dim1 = $correlation['dimension1'];
        $dim2 = $correlation['dimension2'];
        $direction = $correlation['direction'];
        
        if ($direction === 'positive') {
            return "Use {$dim1} to predict increases in {$dim2}";
        } else {
            return "Use {$dim1} to predict decreases in {$dim2}";
        }
    }
}