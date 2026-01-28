<?php

namespace App\Domain\Intelligence\Services;

use App\Domain\Intelligence\ValueObjects\DataInsights;
use App\Domain\Intelligence\ValueObjects\StatisticalSummary;
use App\Domain\Intelligence\ValueObjects\CorrelationAnalysis;
use App\Domain\Intelligence\ValueObjects\AnomalyDetection;
use App\Domain\Shared\ValueObjects\UuidValueObject;

/**
 * Data Analysis Service
 * 
 * Provides comprehensive data analysis capabilities including statistical analysis,
 * correlation detection, anomaly identification, and data insights generation.
 */
class DataAnalysisService
{
    /**
     * Generate comprehensive data insights from raw data
     */
    public function generateInsights(array $data, array $context = []): DataInsights
    {
        $summary = $this->generateStatisticalSummary($data);
        $correlations = $this->analyzeCorrelations($data);
        $anomalies = $this->detectAnomalies($data);
        $trends = $this->analyzeTrends($data);
        
        return new DataInsights(
            summary: $summary,
            correlations: $correlations,
            anomalies: $anomalies,
            trends: $trends,
            recommendations: $this->generateRecommendations($summary, $correlations, $anomalies),
            confidence: $this->calculateInsightConfidence($data),
            generatedAt: now()
        );
    }

    /**
     * Generate statistical summary of dataset
     */
    public function generateStatisticalSummary(array $data): StatisticalSummary
    {
        if (empty($data)) {
            return new StatisticalSummary(
                count: 0,
                mean: 0,
                median: 0,
                mode: null,
                standardDeviation: 0,
                variance: 0,
                min: 0,
                max: 0,
                quartiles: [0, 0, 0],
                skewness: 0,
                kurtosis: 0
            );
        }

        // Extract numeric values for analysis
        $numericValues = $this->extractNumericValues($data);
        
        if (empty($numericValues)) {
            return new StatisticalSummary(
                count: count($data),
                mean: 0,
                median: 0,
                mode: null,
                standardDeviation: 0,
                variance: 0,
                min: 0,
                max: 0,
                quartiles: [0, 0, 0],
                skewness: 0,
                kurtosis: 0
            );
        }

        sort($numericValues);
        
        $count = count($numericValues);
        $mean = array_sum($numericValues) / $count;
        $median = $this->calculateMedian($numericValues);
        $mode = $this->calculateMode($numericValues);
        $variance = $this->calculateVariance($numericValues, $mean);
        $standardDeviation = sqrt($variance);
        $quartiles = $this->calculateQuartiles($numericValues);
        $skewness = $this->calculateSkewness($numericValues, $mean, $standardDeviation);
        $kurtosis = $this->calculateKurtosis($numericValues, $mean, $standardDeviation);

        return new StatisticalSummary(
            count: $count,
            mean: $mean,
            median: $median,
            mode: $mode,
            standardDeviation: $standardDeviation,
            variance: $variance,
            min: min($numericValues),
            max: max($numericValues),
            quartiles: $quartiles,
            skewness: $skewness,
            kurtosis: $kurtosis
        );
    }

    /**
     * Analyze correlations between different data dimensions
     */
    public function analyzeCorrelations(array $data): CorrelationAnalysis
    {
        $correlations = [];
        $strongCorrelations = [];
        
        // Extract different dimensions for correlation analysis
        $dimensions = $this->extractDataDimensions($data);
        
        foreach ($dimensions as $dim1Name => $dim1Values) {
            foreach ($dimensions as $dim2Name => $dim2Values) {
                if ($dim1Name !== $dim2Name && count($dim1Values) === count($dim2Values)) {
                    $correlation = $this->calculatePearsonCorrelation($dim1Values, $dim2Values);
                    $correlations["{$dim1Name}_vs_{$dim2Name}"] = $correlation;
                    
                    // Identify strong correlations (|r| > 0.7)
                    if (abs($correlation) > 0.7) {
                        $strongCorrelations[] = [
                            'dimension1' => $dim1Name,
                            'dimension2' => $dim2Name,
                            'correlation' => $correlation,
                            'strength' => $this->getCorrelationStrength($correlation),
                            'direction' => $correlation > 0 ? 'positive' : 'negative'
                        ];
                    }
                }
            }
        }

        return new CorrelationAnalysis(
            correlations: $correlations,
            strongCorrelations: $strongCorrelations,
            significantPairs: $this->identifySignificantPairs($strongCorrelations),
            insights: $this->generateCorrelationInsights($strongCorrelations)
        );
    }

    /**
     * Detect anomalies in the dataset
     */
    public function detectAnomalies(array $data): AnomalyDetection
    {
        $anomalies = [];
        $anomalyScore = 0;
        
        // Extract numeric values for anomaly detection
        $numericValues = $this->extractNumericValues($data);
        
        if (!empty($numericValues)) {
            $mean = array_sum($numericValues) / count($numericValues);
            $stdDev = $this->calculateStandardDeviation($numericValues, $mean);
            
            // Z-score based anomaly detection
            foreach ($numericValues as $index => $value) {
                $zScore = $stdDev > 0 ? abs($value - $mean) / $stdDev : 0;
                
                if ($zScore > 2.5) { // Values more than 2.5 standard deviations away
                    $anomalies[] = [
                        'index' => $index,
                        'value' => $value,
                        'z_score' => $zScore,
                        'severity' => $zScore > 3 ? 'high' : 'medium',
                        'type' => $value > $mean ? 'outlier_high' : 'outlier_low'
                    ];
                }
            }
            
            $anomalyScore = count($anomalies) / count($numericValues);
        }

        // Detect temporal anomalies if timestamps are available
        $temporalAnomalies = $this->detectTemporalAnomalies($data);
        
        return new AnomalyDetection(
            anomalies: $anomalies,
            temporalAnomalies: $temporalAnomalies,
            anomalyScore: $anomalyScore,
            detectionMethod: 'z_score',
            threshold: 2.5,
            recommendations: $this->generateAnomalyRecommendations($anomalies)
        );
    }

    /**
     * Analyze trends in time-series data
     */
    public function analyzeTrends(array $data): array
    {
        $trends = [
            'overall_trend' => 'stable',
            'trend_strength' => 0,
            'seasonal_component' => false,
            'growth_rate' => 0,
            'volatility' => 0,
            'forecast' => []
        ];

        // Extract time-series data
        $timeSeries = $this->extractTimeSeries($data);
        
        if (count($timeSeries) < 3) {
            return $trends;
        }

        // Calculate trend using linear regression
        $trendAnalysis = $this->calculateLinearTrend($timeSeries);
        $trends['overall_trend'] = $trendAnalysis['direction'];
        $trends['trend_strength'] = $trendAnalysis['strength'];
        $trends['growth_rate'] = $trendAnalysis['slope'];

        // Calculate volatility
        $values = array_column($timeSeries, 'value');
        $mean = array_sum($values) / count($values);
        $trends['volatility'] = $this->calculateStandardDeviation($values, $mean) / $mean;

        // Detect seasonality
        $trends['seasonal_component'] = $this->detectSeasonality($timeSeries);

        // Generate simple forecast
        $trends['forecast'] = $this->generateSimpleForecast($timeSeries, 3);

        return $trends;
    }

    /**
     * Segment data based on characteristics
     */
    public function segmentData(array $data, array $criteria): array
    {
        $segments = [];
        
        foreach ($data as $record) {
            $segmentKey = $this->determineSegment($record, $criteria);
            
            if (!isset($segments[$segmentKey])) {
                $segments[$segmentKey] = [];
            }
            
            $segments[$segmentKey][] = $record;
        }
        
        // Analyze each segment
        $segmentAnalysis = [];
        foreach ($segments as $segmentName => $segmentData) {
            $segmentAnalysis[$segmentName] = [
                'count' => count($segmentData),
                'percentage' => count($segmentData) / count($data) * 100,
                'summary' => $this->generateStatisticalSummary($segmentData),
                'characteristics' => $this->identifySegmentCharacteristics($segmentData)
            ];
        }
        
        return $segmentAnalysis;
    }

    /**
     * Calculate cohort analysis for customer behavior
     */
    public function calculateCohortAnalysis(array $customerData, string $cohortBy = 'month'): array
    {
        $cohorts = [];
        
        // Group customers by cohort (e.g., registration month)
        foreach ($customerData as $customer) {
            $cohortPeriod = $this->getCohortPeriod($customer, $cohortBy);
            
            if (!isset($cohorts[$cohortPeriod])) {
                $cohorts[$cohortPeriod] = [];
            }
            
            $cohorts[$cohortPeriod][] = $customer;
        }
        
        // Calculate retention rates for each cohort
        $cohortAnalysis = [];
        foreach ($cohorts as $cohortPeriod => $cohortCustomers) {
            $cohortAnalysis[$cohortPeriod] = $this->calculateCohortMetrics($cohortCustomers);
        }
        
        return $cohortAnalysis;
    }

    /**
     * Extract numeric values from mixed data array
     */
    private function extractNumericValues(array $data): array
    {
        $numericValues = [];
        
        foreach ($data as $record) {
            if (is_numeric($record)) {
                $numericValues[] = (float) $record;
            } elseif (is_array($record)) {
                // Look for common numeric fields
                $numericFields = ['total_amount', 'value', 'price', 'quantity', 'amount'];
                
                foreach ($numericFields as $field) {
                    if (isset($record[$field]) && is_numeric($record[$field])) {
                        $numericValues[] = (float) $record[$field];
                        break;
                    }
                }
            }
        }
        
        return $numericValues;
    }

    /**
     * Extract different data dimensions for correlation analysis
     */
    private function extractDataDimensions(array $data): array
    {
        $dimensions = [];
        
        if (empty($data)) {
            return $dimensions;
        }
        
        // Identify available dimensions from first record
        $sampleRecord = is_array($data[0]) ? $data[0] : [];
        $numericFields = [];
        
        foreach ($sampleRecord as $field => $value) {
            if (is_numeric($value)) {
                $numericFields[] = $field;
            }
        }
        
        // Extract values for each dimension
        foreach ($numericFields as $field) {
            $dimensions[$field] = [];
            
            foreach ($data as $record) {
                if (is_array($record) && isset($record[$field]) && is_numeric($record[$field])) {
                    $dimensions[$field][] = (float) $record[$field];
                }
            }
        }
        
        return array_filter($dimensions, fn($values) => count($values) > 1);
    }

    /**
     * Calculate Pearson correlation coefficient
     */
    private function calculatePearsonCorrelation(array $x, array $y): float
    {
        $n = count($x);
        
        if ($n !== count($y) || $n < 2) {
            return 0;
        }
        
        $sumX = array_sum($x);
        $sumY = array_sum($y);
        $sumXY = 0;
        $sumX2 = 0;
        $sumY2 = 0;
        
        for ($i = 0; $i < $n; $i++) {
            $sumXY += $x[$i] * $y[$i];
            $sumX2 += $x[$i] * $x[$i];
            $sumY2 += $y[$i] * $y[$i];
        }
        
        $numerator = $n * $sumXY - $sumX * $sumY;
        $denominator = sqrt(($n * $sumX2 - $sumX * $sumX) * ($n * $sumY2 - $sumY * $sumY));
        
        return $denominator != 0 ? $numerator / $denominator : 0;
    }

    /**
     * Calculate median value
     */
    private function calculateMedian(array $values): float
    {
        $count = count($values);
        
        if ($count === 0) return 0;
        if ($count === 1) return $values[0];
        
        $middle = floor($count / 2);
        
        if ($count % 2 === 0) {
            return ($values[$middle - 1] + $values[$middle]) / 2;
        } else {
            return $values[$middle];
        }
    }

    /**
     * Calculate mode (most frequent value)
     */
    private function calculateMode(array $values): ?float
    {
        if (empty($values)) return null;
        
        $frequencies = array_count_values($values);
        $maxFrequency = max($frequencies);
        
        // Return the first value with maximum frequency
        foreach ($frequencies as $value => $frequency) {
            if ($frequency === $maxFrequency) {
                return (float) $value;
            }
        }
        
        return null;
    }

    /**
     * Calculate variance
     */
    private function calculateVariance(array $values, float $mean): float
    {
        if (count($values) < 2) return 0;
        
        $sumSquaredDifferences = array_sum(array_map(fn($x) => pow($x - $mean, 2), $values));
        
        return $sumSquaredDifferences / (count($values) - 1);
    }

    /**
     * Calculate quartiles
     */
    private function calculateQuartiles(array $values): array
    {
        $count = count($values);
        
        if ($count < 4) {
            return [0, 0, 0];
        }
        
        $q1Index = floor($count * 0.25);
        $q2Index = floor($count * 0.5);
        $q3Index = floor($count * 0.75);
        
        return [
            $values[$q1Index],
            $values[$q2Index],
            $values[$q3Index]
        ];
    }

    /**
     * Calculate skewness
     */
    private function calculateSkewness(array $values, float $mean, float $stdDev): float
    {
        if ($stdDev == 0 || count($values) < 3) return 0;
        
        $n = count($values);
        $sumCubedDeviations = array_sum(array_map(fn($x) => pow(($x - $mean) / $stdDev, 3), $values));
        
        return ($n / (($n - 1) * ($n - 2))) * $sumCubedDeviations;
    }

    /**
     * Calculate kurtosis
     */
    private function calculateKurtosis(array $values, float $mean, float $stdDev): float
    {
        if ($stdDev == 0 || count($values) < 4) return 0;
        
        $n = count($values);
        $sumFourthPowerDeviations = array_sum(array_map(fn($x) => pow(($x - $mean) / $stdDev, 4), $values));
        
        return (($n * ($n + 1)) / (($n - 1) * ($n - 2) * ($n - 3))) * $sumFourthPowerDeviations - 
               (3 * pow($n - 1, 2)) / (($n - 2) * ($n - 3));
    }

    /**
     * Calculate standard deviation
     */
    private function calculateStandardDeviation(array $values, float $mean): float
    {
        return sqrt($this->calculateVariance($values, $mean));
    }

    /**
     * Helper methods for additional functionality
     */
    private function getCorrelationStrength(float $correlation): string
    {
        $abs = abs($correlation);
        
        return match(true) {
            $abs >= 0.9 => 'very_strong',
            $abs >= 0.7 => 'strong',
            $abs >= 0.5 => 'moderate',
            $abs >= 0.3 => 'weak',
            default => 'very_weak'
        };
    }

    private function identifySignificantPairs(array $correlations): array
    {
        return array_filter($correlations, fn($corr) => abs($corr['correlation']) > 0.8);
    }

    private function generateCorrelationInsights(array $correlations): array
    {
        $insights = [];
        
        foreach ($correlations as $correlation) {
            if (abs($correlation['correlation']) > 0.8) {
                $insights[] = "Strong {$correlation['direction']} correlation between {$correlation['dimension1']} and {$correlation['dimension2']}";
            }
        }
        
        return $insights;
    }

    private function detectTemporalAnomalies(array $data): array
    {
        // Placeholder for temporal anomaly detection
        return [];
    }

    private function generateAnomalyRecommendations(array $anomalies): array
    {
        $recommendations = [];
        
        if (count($anomalies) > 0) {
            $recommendations[] = "Investigate " . count($anomalies) . " detected anomalies";
            
            $highSeverityCount = count(array_filter($anomalies, fn($a) => $a['severity'] === 'high'));
            if ($highSeverityCount > 0) {
                $recommendations[] = "Priority attention needed for {$highSeverityCount} high-severity anomalies";
            }
        }
        
        return $recommendations;
    }

    private function extractTimeSeries(array $data): array
    {
        $timeSeries = [];
        
        foreach ($data as $record) {
            if (is_array($record) && isset($record['created_at'])) {
                $timestamp = strtotime($record['created_at']);
                $value = $record['total_amount'] ?? $record['value'] ?? 0;
                
                $timeSeries[] = [
                    'timestamp' => $timestamp,
                    'value' => (float) $value
                ];
            }
        }
        
        // Sort by timestamp
        usort($timeSeries, fn($a, $b) => $a['timestamp'] <=> $b['timestamp']);
        
        return $timeSeries;
    }

    private function calculateLinearTrend(array $timeSeries): array
    {
        $n = count($timeSeries);
        
        if ($n < 2) {
            return ['direction' => 'stable', 'strength' => 0, 'slope' => 0];
        }
        
        // Simple linear regression
        $sumX = 0;
        $sumY = 0;
        $sumXY = 0;
        $sumX2 = 0;
        
        foreach ($timeSeries as $i => $point) {
            $x = $i; // Use index as x-coordinate
            $y = $point['value'];
            
            $sumX += $x;
            $sumY += $y;
            $sumXY += $x * $y;
            $sumX2 += $x * $x;
        }
        
        $slope = ($n * $sumXY - $sumX * $sumY) / ($n * $sumX2 - $sumX * $sumX);
        
        $direction = match(true) {
            $slope > 0.1 => 'increasing',
            $slope < -0.1 => 'decreasing',
            default => 'stable'
        };
        
        return [
            'direction' => $direction,
            'strength' => abs($slope),
            'slope' => $slope
        ];
    }

    private function detectSeasonality(array $timeSeries): bool
    {
        // Simplified seasonality detection
        return count($timeSeries) > 12; // Placeholder
    }

    private function generateSimpleForecast(array $timeSeries, int $periods): array
    {
        if (count($timeSeries) < 2) {
            return [];
        }
        
        $trend = $this->calculateLinearTrend($timeSeries);
        $lastValue = end($timeSeries)['value'];
        
        $forecast = [];
        for ($i = 1; $i <= $periods; $i++) {
            $forecast[] = $lastValue + ($trend['slope'] * $i);
        }
        
        return $forecast;
    }

    private function generateRecommendations(StatisticalSummary $summary, CorrelationAnalysis $correlations, AnomalyDetection $anomalies): array
    {
        $recommendations = [];
        
        if ($summary->getStandardDeviation() > $summary->getMean() * 0.5) {
            $recommendations[] = "High variability detected - consider investigating data consistency";
        }
        
        if (count($correlations->getStrongCorrelations()) > 0) {
            $recommendations[] = "Strong correlations found - leverage these relationships for predictions";
        }
        
        if ($anomalies->getAnomalyScore() > 0.1) {
            $recommendations[] = "Significant anomalies detected - review data quality and outliers";
        }
        
        return $recommendations;
    }

    private function calculateInsightConfidence(array $data): float
    {
        $sampleSize = count($data);
        
        // Confidence increases with sample size
        return min(1.0, $sampleSize / 100);
    }

    private function determineSegment(array $record, array $criteria): string
    {
        // Placeholder segmentation logic
        return 'default_segment';
    }

    private function identifySegmentCharacteristics(array $segmentData): array
    {
        return ['characteristic' => 'placeholder'];
    }

    private function getCohortPeriod(array $customer, string $cohortBy): string
    {
        $date = $customer['created_at'] ?? date('Y-m-d');
        
        return match($cohortBy) {
            'month' => date('Y-m', strtotime($date)),
            'quarter' => date('Y-Q', strtotime($date)),
            'year' => date('Y', strtotime($date)),
            default => date('Y-m', strtotime($date))
        };
    }

    private function calculateCohortMetrics(array $cohortCustomers): array
    {
        return [
            'size' => count($cohortCustomers),
            'retention_rate' => 0.8, // Placeholder
            'avg_lifetime_value' => 1000 // Placeholder
        ];
    }
}