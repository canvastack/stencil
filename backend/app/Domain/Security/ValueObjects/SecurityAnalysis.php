<?php

namespace App\Domain\Security\ValueObjects;

use Carbon\Carbon;

/**
 * Security Analysis Value Object
 * 
 * Contains the complete security analysis results for a user including
 * detected anomalies, risk score, and recommendations.
 */
class SecurityAnalysis
{
    public function __construct(
        private string $userId,
        private array $anomalies,
        private float $riskScore,
        private array $recommendations,
        private Carbon $analysisDate,
        private int $analysisPeriod
    ) {}

    public function getUserId(): string
    {
        return $this->userId;
    }

    public function getAnomalies(): array
    {
        return $this->anomalies;
    }

    public function getRiskScore(): float
    {
        return $this->riskScore;
    }

    public function getRiskLevel(): string
    {
        if ($this->riskScore >= 0.8) {
            return 'critical';
        } elseif ($this->riskScore >= 0.6) {
            return 'high';
        } elseif ($this->riskScore >= 0.3) {
            return 'medium';
        } elseif ($this->riskScore > 0) {
            return 'low';
        }
        
        return 'none';
    }

    public function getRecommendations(): array
    {
        return $this->recommendations;
    }

    public function getAnalysisDate(): Carbon
    {
        return $this->analysisDate;
    }

    public function getAnalysisPeriod(): int
    {
        return $this->analysisPeriod;
    }

    public function hasHighRiskAnomalies(): bool
    {
        foreach ($this->anomalies as $anomaly) {
            if (in_array($anomaly->getSeverity(), ['high', 'critical'])) {
                return true;
            }
        }
        return false;
    }

    public function getAnomaliesBySeverity(string $severity): array
    {
        return array_filter($this->anomalies, fn($anomaly) => $anomaly->getSeverity() === $severity);
    }

    public function getAnomaliesByType(string $type): array
    {
        return array_filter($this->anomalies, fn($anomaly) => $anomaly->getType() === $type);
    }

    public function toArray(): array
    {
        return [
            'user_id' => $this->userId,
            'risk_score' => $this->riskScore,
            'risk_level' => $this->getRiskLevel(),
            'anomalies' => array_map(fn($anomaly) => $anomaly->toArray(), $this->anomalies),
            'recommendations' => array_map(fn($rec) => $rec->toArray(), $this->recommendations),
            'analysis_date' => $this->analysisDate->toISOString(),
            'analysis_period_days' => $this->analysisPeriod,
            'summary' => [
                'total_anomalies' => count($this->anomalies),
                'high_risk_anomalies' => count($this->getAnomaliesBySeverity('high')) + count($this->getAnomaliesBySeverity('critical')),
                'has_high_risk' => $this->hasHighRiskAnomalies(),
                'anomaly_types' => array_unique(array_map(fn($anomaly) => $anomaly->getType(), $this->anomalies))
            ]
        ];
    }
}