<?php

namespace App\Domain\Intelligence\ValueObjects;

/**
 * Statistical Summary Value Object
 * 
 * Contains comprehensive statistical analysis of a dataset including
 * central tendencies, dispersion measures, and distribution characteristics.
 */
class StatisticalSummary
{
    public function __construct(
        private int $count,
        private float $mean,
        private float $median,
        private ?float $mode,
        private float $standardDeviation,
        private float $variance,
        private float $min,
        private float $max,
        private array $quartiles,
        private float $skewness,
        private float $kurtosis
    ) {
        $this->validateSummary();
    }

    public function getCount(): int
    {
        return $this->count;
    }

    public function getMean(): float
    {
        return $this->mean;
    }

    public function getMedian(): float
    {
        return $this->median;
    }

    public function getMode(): ?float
    {
        return $this->mode;
    }

    public function getStandardDeviation(): float
    {
        return $this->standardDeviation;
    }

    public function getVariance(): float
    {
        return $this->variance;
    }

    public function getMin(): float
    {
        return $this->min;
    }

    public function getMax(): float
    {
        return $this->max;
    }

    public function getQuartiles(): array
    {
        return $this->quartiles;
    }

    public function getSkewness(): float
    {
        return $this->skewness;
    }

    public function getKurtosis(): float
    {
        return $this->kurtosis;
    }

    /**
     * Get range (max - min)
     */
    public function getRange(): float
    {
        return $this->max - $this->min;
    }

    /**
     * Get coefficient of variation (std dev / mean)
     */
    public function getCoefficientOfVariation(): float
    {
        return $this->mean != 0 ? $this->standardDeviation / abs($this->mean) : 0;
    }

    /**
     * Get interquartile range (Q3 - Q1)
     */
    public function getInterquartileRange(): float
    {
        if (count($this->quartiles) >= 3) {
            return $this->quartiles[2] - $this->quartiles[0]; // Q3 - Q1
        }
        return 0;
    }

    /**
     * Check if distribution is approximately normal
     */
    public function isApproximatelyNormal(): bool
    {
        // Check if skewness and kurtosis are within reasonable bounds for normal distribution
        return abs($this->skewness) < 1 && abs($this->kurtosis) < 3;
    }

    /**
     * Get distribution shape description
     */
    public function getDistributionShape(): string
    {
        if (abs($this->skewness) < 0.5) {
            return 'approximately_symmetric';
        } elseif ($this->skewness > 0.5) {
            return 'right_skewed';
        } else {
            return 'left_skewed';
        }
    }

    /**
     * Get variability level
     */
    public function getVariabilityLevel(): string
    {
        $cv = $this->getCoefficientOfVariation();
        
        return match(true) {
            $cv < 0.1 => 'very_low',
            $cv < 0.2 => 'low',
            $cv < 0.5 => 'moderate',
            $cv < 1.0 => 'high',
            default => 'very_high'
        };
    }

    /**
     * Get outlier bounds using IQR method
     */
    public function getOutlierBounds(): array
    {
        if (count($this->quartiles) < 3) {
            return ['lower' => $this->min, 'upper' => $this->max];
        }
        
        $iqr = $this->getInterquartileRange();
        $q1 = $this->quartiles[0];
        $q3 = $this->quartiles[2];
        
        return [
            'lower' => $q1 - (1.5 * $iqr),
            'upper' => $q3 + (1.5 * $iqr)
        ];
    }

    /**
     * Get data quality indicators
     */
    public function getDataQualityIndicators(): array
    {
        return [
            'sample_size_adequate' => $this->count >= 30,
            'low_variability' => $this->getCoefficientOfVariation() < 0.3,
            'normal_distribution' => $this->isApproximatelyNormal(),
            'no_extreme_outliers' => abs($this->skewness) < 2,
            'sufficient_spread' => $this->getRange() > 0
        ];
    }

    /**
     * Get summary insights
     */
    public function getInsights(): array
    {
        $insights = [];
        
        if ($this->count < 30) {
            $insights[] = "Small sample size may limit statistical reliability";
        }
        
        $cv = $this->getCoefficientOfVariation();
        if ($cv > 0.5) {
            $insights[] = "High variability detected - data shows significant spread";
        } elseif ($cv < 0.1) {
            $insights[] = "Low variability - data points are closely clustered";
        }
        
        if (abs($this->skewness) > 1) {
            $shape = $this->getDistributionShape();
            $insights[] = "Distribution is {$shape} - consider data transformation";
        }
        
        if ($this->mode !== null && abs($this->mode - $this->mean) > $this->standardDeviation) {
            $insights[] = "Mode differs significantly from mean - multimodal distribution possible";
        }
        
        return $insights;
    }

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return [
            'count' => $this->count,
            'mean' => $this->mean,
            'median' => $this->median,
            'mode' => $this->mode,
            'standard_deviation' => $this->standardDeviation,
            'variance' => $this->variance,
            'min' => $this->min,
            'max' => $this->max,
            'range' => $this->getRange(),
            'quartiles' => [
                'q1' => $this->quartiles[0] ?? null,
                'q2' => $this->quartiles[1] ?? null,
                'q3' => $this->quartiles[2] ?? null
            ],
            'interquartile_range' => $this->getInterquartileRange(),
            'skewness' => $this->skewness,
            'kurtosis' => $this->kurtosis,
            'coefficient_of_variation' => $this->getCoefficientOfVariation(),
            'distribution_shape' => $this->getDistributionShape(),
            'variability_level' => $this->getVariabilityLevel(),
            'outlier_bounds' => $this->getOutlierBounds(),
            'data_quality_indicators' => $this->getDataQualityIndicators(),
            'insights' => $this->getInsights(),
            'indicators' => [
                'approximately_normal' => $this->isApproximatelyNormal(),
                'adequate_sample_size' => $this->count >= 30,
                'low_variability' => $this->getCoefficientOfVariation() < 0.3,
                'symmetric_distribution' => abs($this->skewness) < 0.5
            ]
        ];
    }

    private function validateSummary(): void
    {
        if ($this->count < 0) {
            throw new \InvalidArgumentException('Count cannot be negative');
        }

        if ($this->standardDeviation < 0) {
            throw new \InvalidArgumentException('Standard deviation cannot be negative');
        }

        if ($this->variance < 0) {
            throw new \InvalidArgumentException('Variance cannot be negative');
        }

        if ($this->max < $this->min) {
            throw new \InvalidArgumentException('Maximum cannot be less than minimum');
        }

        if (!is_array($this->quartiles)) {
            throw new \InvalidArgumentException('Quartiles must be an array');
        }
    }
}