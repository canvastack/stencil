<?php

namespace App\Domain\Intelligence\ValueObjects;

/**
 * Anomaly Detection Value Object
 * 
 * Contains results of anomaly detection analysis including identified anomalies,
 * temporal patterns, and recommendations for handling outliers.
 */
class AnomalyDetection
{
    public function __construct(
        private array $anomalies,
        private array $temporalAnomalies,
        private float $anomalyScore,
        private string $detectionMethod,
        private float $threshold,
        private array $recommendations
    ) {
        $this->validateDetection();
    }

    public function getAnomalies(): array
    {
        return $this->anomalies;
    }

    public function getTemporalAnomalies(): array
    {
        return $this->temporalAnomalies;
    }

    public function getAnomalyScore(): float
    {
        return $this->anomalyScore;
    }

    public function getDetectionMethod(): string
    {
        return $this->detectionMethod;
    }

    public function getThreshold(): float
    {
        return $this->threshold;
    }

    public function getRecommendations(): array
    {
        return $this->recommendations;
    }

    /**
     * Check if significant anomalies were detected
     */
    public function hasSignificantAnomalies(): bool
    {
        return $this->anomalyScore > 0.1;
    }

    /**
     * Get high severity anomalies
     */
    public function getHighSeverityAnomalies(): array
    {
        return array_filter($this->anomalies, fn($anomaly) => 
            isset($anomaly['severity']) && $anomaly['severity'] === 'high'
        );
    }

    /**
     * Get medium severity anomalies
     */
    public function getMediumSeverityAnomalies(): array
    {
        return array_filter($this->anomalies, fn($anomaly) => 
            isset($anomaly['severity']) && $anomaly['severity'] === 'medium'
        );
    }

    /**
     * Get outlier high anomalies (values above normal range)
     */
    public function getOutlierHighAnomalies(): array
    {
        return array_filter($this->anomalies, fn($anomaly) => 
            isset($anomaly['type']) && $anomaly['type'] === 'outlier_high'
        );
    }

    /**
     * Get outlier low anomalies (values below normal range)
     */
    public function getOutlierLowAnomalies(): array
    {
        return array_filter($this->anomalies, fn($anomaly) => 
            isset($anomaly['type']) && $anomaly['type'] === 'outlier_low'
        );
    }

    /**
     * Get anomaly statistics
     */
    public function getAnomalyStatistics(): array
    {
        $total = count($this->anomalies);
        $highSeverity = count($this->getHighSeverityAnomalies());
        $mediumSeverity = count($this->getMediumSeverityAnomalies());
        $outlierHigh = count($this->getOutlierHighAnomalies());
        $outlierLow = count($this->getOutlierLowAnomalies());
        
        return [
            'total_anomalies' => $total,
            'high_severity' => $highSeverity,
            'medium_severity' => $mediumSeverity,
            'low_severity' => $total - $highSeverity - $mediumSeverity,
            'outlier_high' => $outlierHigh,
            'outlier_low' => $outlierLow,
            'temporal_anomalies' => count($this->temporalAnomalies),
            'anomaly_rate' => $this->anomalyScore
        ];
    }

    /**
     * Get severity distribution
     */
    public function getSeverityDistribution(): array
    {
        $distribution = ['high' => 0, 'medium' => 0, 'low' => 0];
        
        foreach ($this->anomalies as $anomaly) {
            $severity = $anomaly['severity'] ?? 'low';
            if (isset($distribution[$severity])) {
                $distribution[$severity]++;
            }
        }
        
        return $distribution;
    }

    /**
     * Get anomaly impact assessment
     */
    public function getImpactAssessment(): array
    {
        $highSeverityCount = count($this->getHighSeverityAnomalies());
        $totalCount = count($this->anomalies);
        
        $impactLevel = match(true) {
            $highSeverityCount > 5 => 'critical',
            $highSeverityCount > 2 => 'high',
            $totalCount > 10 => 'medium',
            $totalCount > 0 => 'low',
            default => 'none'
        };
        
        return [
            'impact_level' => $impactLevel,
            'business_risk' => $this->assessBusinessRisk($impactLevel),
            'immediate_action_required' => $impactLevel === 'critical',
            'monitoring_recommended' => $impactLevel !== 'none',
            'investigation_priority' => $this->getInvestigationPriority($impactLevel)
        ];
    }

    /**
     * Get anomaly patterns
     */
    public function getAnomalyPatterns(): array
    {
        $patterns = [
            'clustering' => $this->detectAnomalyClustering(),
            'temporal_patterns' => $this->analyzeTemporalPatterns(),
            'value_patterns' => $this->analyzeValuePatterns(),
            'frequency_patterns' => $this->analyzeFrequencyPatterns()
        ];
        
        return $patterns;
    }

    /**
     * Get actionable insights
     */
    public function getActionableInsights(): array
    {
        $insights = [];
        
        $highSeverityCount = count($this->getHighSeverityAnomalies());
        if ($highSeverityCount > 0) {
            $insights[] = "Immediate attention required for {$highSeverityCount} high-severity anomalies";
        }
        
        $outlierHighCount = count($this->getOutlierHighAnomalies());
        if ($outlierHighCount > 0) {
            $insights[] = "Investigate {$outlierHighCount} unusually high values for potential opportunities";
        }
        
        $outlierLowCount = count($this->getOutlierLowAnomalies());
        if ($outlierLowCount > 0) {
            $insights[] = "Review {$outlierLowCount} unusually low values for potential issues";
        }
        
        if (count($this->temporalAnomalies) > 0) {
            $insights[] = "Temporal anomalies detected - check for seasonal or cyclical factors";
        }
        
        return $insights;
    }

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return [
            'anomalies' => $this->anomalies,
            'temporal_anomalies' => $this->temporalAnomalies,
            'anomaly_score' => $this->anomalyScore,
            'detection_method' => $this->detectionMethod,
            'threshold' => $this->threshold,
            'recommendations' => $this->recommendations,
            'statistics' => $this->getAnomalyStatistics(),
            'severity_distribution' => $this->getSeverityDistribution(),
            'impact_assessment' => $this->getImpactAssessment(),
            'anomaly_patterns' => $this->getAnomalyPatterns(),
            'actionable_insights' => $this->getActionableInsights(),
            'high_severity_anomalies' => $this->getHighSeverityAnomalies(),
            'medium_severity_anomalies' => $this->getMediumSeverityAnomalies(),
            'indicators' => [
                'significant_anomalies' => $this->hasSignificantAnomalies(),
                'critical_issues' => count($this->getHighSeverityAnomalies()) > 0,
                'temporal_issues' => count($this->temporalAnomalies) > 0,
                'requires_investigation' => $this->anomalyScore > 0.05
            ]
        ];
    }

    private function validateDetection(): void
    {
        if ($this->anomalyScore < 0 || $this->anomalyScore > 1) {
            throw new \InvalidArgumentException('Anomaly score must be between 0 and 1');
        }

        if ($this->threshold < 0) {
            throw new \InvalidArgumentException('Threshold cannot be negative');
        }

        if (!is_array($this->anomalies)) {
            throw new \InvalidArgumentException('Anomalies must be an array');
        }

        if (!is_array($this->temporalAnomalies)) {
            throw new \InvalidArgumentException('Temporal anomalies must be an array');
        }

        if (!is_array($this->recommendations)) {
            throw new \InvalidArgumentException('Recommendations must be an array');
        }

        if (empty(trim($this->detectionMethod))) {
            throw new \InvalidArgumentException('Detection method cannot be empty');
        }
    }

    private function assessBusinessRisk(string $impactLevel): string
    {
        return match($impactLevel) {
            'critical' => 'Immediate business impact possible - urgent action required',
            'high' => 'Significant business risk - prompt investigation needed',
            'medium' => 'Moderate business impact - monitor and investigate',
            'low' => 'Minor business impact - routine monitoring sufficient',
            default => 'No significant business risk identified'
        };
    }

    private function getInvestigationPriority(string $impactLevel): string
    {
        return match($impactLevel) {
            'critical' => 'immediate',
            'high' => 'urgent',
            'medium' => 'high',
            'low' => 'normal',
            default => 'low'
        };
    }

    private function detectAnomalyClustering(): array
    {
        // Simplified clustering detection
        return [
            'clusters_detected' => false,
            'cluster_count' => 0,
            'largest_cluster_size' => 0
        ];
    }

    private function analyzeTemporalPatterns(): array
    {
        return [
            'time_based_clustering' => false,
            'recurring_patterns' => false,
            'seasonal_anomalies' => false
        ];
    }

    private function analyzeValuePatterns(): array
    {
        $outlierHigh = count($this->getOutlierHighAnomalies());
        $outlierLow = count($this->getOutlierLowAnomalies());
        
        return [
            'predominantly_high' => $outlierHigh > $outlierLow,
            'predominantly_low' => $outlierLow > $outlierHigh,
            'balanced_distribution' => abs($outlierHigh - $outlierLow) <= 1,
            'extreme_values' => $outlierHigh + $outlierLow
        ];
    }

    private function analyzeFrequencyPatterns(): array
    {
        return [
            'frequent_anomalies' => $this->anomalyScore > 0.2,
            'sporadic_anomalies' => $this->anomalyScore < 0.05,
            'consistent_rate' => true // Placeholder
        ];
    }
}