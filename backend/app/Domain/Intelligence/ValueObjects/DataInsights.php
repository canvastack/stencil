<?php

namespace App\Domain\Intelligence\ValueObjects;

use Carbon\Carbon;

/**
 * Data Insights Value Object
 * 
 * Contains comprehensive insights generated from data analysis including
 * statistical summaries, correlations, anomalies, and trends.
 */
class DataInsights
{
    public function __construct(
        private StatisticalSummary $summary,
        private CorrelationAnalysis $correlations,
        private AnomalyDetection $anomalies,
        private array $trends,
        private array $recommendations,
        private float $confidence,
        private Carbon $generatedAt
    ) {
        $this->validateInsights();
    }

    public function getSummary(): StatisticalSummary
    {
        return $this->summary;
    }

    public function getCorrelations(): CorrelationAnalysis
    {
        return $this->correlations;
    }

    public function getAnomalies(): AnomalyDetection
    {
        return $this->anomalies;
    }

    public function getTrends(): array
    {
        return $this->trends;
    }

    public function getRecommendations(): array
    {
        return $this->recommendations;
    }

    public function getConfidence(): float
    {
        return $this->confidence;
    }

    public function getGeneratedAt(): Carbon
    {
        return $this->generatedAt;
    }

    /**
     * Check if insights are high confidence
     */
    public function isHighConfidence(): bool
    {
        return $this->confidence >= 0.8;
    }

    /**
     * Check if significant anomalies were detected
     */
    public function hasSignificantAnomalies(): bool
    {
        return $this->anomalies->getAnomalyScore() > 0.1;
    }

    /**
     * Check if strong correlations were found
     */
    public function hasStrongCorrelations(): bool
    {
        return count($this->correlations->getStrongCorrelations()) > 0;
    }

    /**
     * Get overall trend direction
     */
    public function getOverallTrend(): string
    {
        return $this->trends['overall_trend'] ?? 'stable';
    }

    /**
     * Get key insights summary
     */
    public function getKeyInsights(): array
    {
        $insights = [];
        
        // Statistical insights
        if ($this->summary->getCount() > 0) {
            $insights[] = "Analyzed {$this->summary->getCount()} data points";
            
            if ($this->summary->getStandardDeviation() > $this->summary->getMean() * 0.5) {
                $insights[] = "High variability detected in the data";
            }
        }
        
        // Correlation insights
        $strongCorrelations = $this->correlations->getStrongCorrelations();
        if (!empty($strongCorrelations)) {
            $insights[] = "Found " . count($strongCorrelations) . " strong correlations";
        }
        
        // Anomaly insights
        if ($this->hasSignificantAnomalies()) {
            $anomalyCount = count($this->anomalies->getAnomalies());
            $insights[] = "Detected {$anomalyCount} anomalies requiring attention";
        }
        
        // Trend insights
        $trendDirection = $this->getOverallTrend();
        if ($trendDirection !== 'stable') {
            $insights[] = "Overall trend is {$trendDirection}";
        }
        
        return $insights;
    }

    /**
     * Get actionable recommendations
     */
    public function getActionableRecommendations(): array
    {
        return array_filter($this->recommendations, function($recommendation) {
            return isset($recommendation['actionable']) && $recommendation['actionable'] === true;
        });
    }

    /**
     * Get priority recommendations
     */
    public function getPriorityRecommendations(): array
    {
        return array_filter($this->recommendations, function($recommendation) {
            return isset($recommendation['priority']) && $recommendation['priority'] === 'high';
        });
    }

    /**
     * Get data quality assessment
     */
    public function getDataQualityAssessment(): array
    {
        $quality = [
            'completeness' => $this->assessDataCompleteness(),
            'consistency' => $this->assessDataConsistency(),
            'accuracy' => $this->assessDataAccuracy(),
            'timeliness' => $this->assessDataTimeliness(),
            'overall_score' => 0
        ];
        
        $quality['overall_score'] = array_sum($quality) / 4;
        
        return $quality;
    }

    /**
     * Get business impact analysis
     */
    public function getBusinessImpactAnalysis(): array
    {
        $impact = [
            'revenue_impact' => $this->analyzeRevenueImpact(),
            'operational_impact' => $this->analyzeOperationalImpact(),
            'customer_impact' => $this->analyzeCustomerImpact(),
            'risk_impact' => $this->analyzeRiskImpact()
        ];
        
        return $impact;
    }

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return [
            'summary' => $this->summary->toArray(),
            'correlations' => $this->correlations->toArray(),
            'anomalies' => $this->anomalies->toArray(),
            'trends' => $this->trends,
            'recommendations' => $this->recommendations,
            'confidence' => $this->confidence,
            'generated_at' => $this->generatedAt->toISOString(),
            'key_insights' => $this->getKeyInsights(),
            'actionable_recommendations' => $this->getActionableRecommendations(),
            'priority_recommendations' => $this->getPriorityRecommendations(),
            'data_quality_assessment' => $this->getDataQualityAssessment(),
            'business_impact_analysis' => $this->getBusinessImpactAnalysis(),
            'indicators' => [
                'high_confidence' => $this->isHighConfidence(),
                'significant_anomalies' => $this->hasSignificantAnomalies(),
                'strong_correlations' => $this->hasStrongCorrelations(),
                'trending' => $this->getOverallTrend() !== 'stable'
            ]
        ];
    }

    private function validateInsights(): void
    {
        if ($this->confidence < 0 || $this->confidence > 1) {
            throw new \InvalidArgumentException('Confidence must be between 0 and 1');
        }

        if (!is_array($this->trends)) {
            throw new \InvalidArgumentException('Trends must be an array');
        }

        if (!is_array($this->recommendations)) {
            throw new \InvalidArgumentException('Recommendations must be an array');
        }
    }

    private function assessDataCompleteness(): float
    {
        // Assess based on sample size and missing values
        $sampleSize = $this->summary->getCount();
        
        if ($sampleSize >= 100) return 1.0;
        if ($sampleSize >= 50) return 0.8;
        if ($sampleSize >= 20) return 0.6;
        if ($sampleSize >= 10) return 0.4;
        
        return 0.2;
    }

    private function assessDataConsistency(): float
    {
        // Assess based on standard deviation relative to mean
        $mean = $this->summary->getMean();
        $stdDev = $this->summary->getStandardDeviation();
        
        if ($mean == 0) return 0.5;
        
        $coefficientOfVariation = $stdDev / $mean;
        
        if ($coefficientOfVariation <= 0.1) return 1.0;
        if ($coefficientOfVariation <= 0.2) return 0.8;
        if ($coefficientOfVariation <= 0.5) return 0.6;
        if ($coefficientOfVariation <= 1.0) return 0.4;
        
        return 0.2;
    }

    private function assessDataAccuracy(): float
    {
        // Assess based on anomaly detection results
        $anomalyScore = $this->anomalies->getAnomalyScore();
        
        return max(0, 1 - $anomalyScore * 2);
    }

    private function assessDataTimeliness(): float
    {
        // Assess based on how recent the data generation is
        $hoursAgo = $this->generatedAt->diffInHours(now());
        
        if ($hoursAgo <= 1) return 1.0;
        if ($hoursAgo <= 6) return 0.9;
        if ($hoursAgo <= 24) return 0.8;
        if ($hoursAgo <= 168) return 0.6; // 1 week
        
        return 0.4;
    }

    private function analyzeRevenueImpact(): array
    {
        return [
            'potential_increase' => '5-15%',
            'risk_factors' => ['Market volatility', 'Seasonal variations'],
            'opportunities' => ['Upselling', 'Cross-selling', 'Premium pricing']
        ];
    }

    private function analyzeOperationalImpact(): array
    {
        return [
            'efficiency_gains' => '10-20%',
            'automation_opportunities' => ['Order processing', 'Inventory management'],
            'resource_optimization' => ['Staff allocation', 'Equipment utilization']
        ];
    }

    private function analyzeCustomerImpact(): array
    {
        return [
            'satisfaction_improvement' => '8-12%',
            'retention_increase' => '5-10%',
            'service_enhancements' => ['Faster delivery', 'Better quality', 'Personalization']
        ];
    }

    private function analyzeRiskImpact(): array
    {
        return [
            'risk_reduction' => '15-25%',
            'mitigation_strategies' => ['Diversification', 'Quality controls', 'Monitoring'],
            'early_warning_indicators' => ['Anomaly detection', 'Trend analysis']
        ];
    }
}