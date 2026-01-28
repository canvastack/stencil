<?php

namespace App\Domain\Production\ValueObjects;

use DateTimeImmutable;

/**
 * Progress Report Value Object
 * 
 * Represents a comprehensive progress report with analytics,
 * metrics, and recommendations for production management.
 */
final class ProgressReport
{
    /**
     * @param array<string, mixed> $milestoneStatus
     * @param array<string, mixed> $timelineStatus
     * @param array<string, mixed> $resourceUtilization
     * @param array<string, mixed> $qualityMetrics
     * @param array<array> $riskIndicators
     * @param array<array> $recommendations
     */
    public function __construct(
        private string $planId,
        private float $overallProgress,
        private array $milestoneStatus,
        private array $timelineStatus,
        private array $resourceUtilization,
        private array $qualityMetrics,
        private array $riskIndicators,
        private array $recommendations,
        private DateTimeImmutable $generatedAt
    ) {}

    public function getPlanId(): string
    {
        return $this->planId;
    }

    public function getOverallProgress(): float
    {
        return $this->overallProgress;
    }

    public function getMilestoneStatus(): array
    {
        return $this->milestoneStatus;
    }

    public function getTimelineStatus(): array
    {
        return $this->timelineStatus;
    }

    public function getResourceUtilization(): array
    {
        return $this->resourceUtilization;
    }

    public function getQualityMetrics(): array
    {
        return $this->qualityMetrics;
    }

    public function getRiskIndicators(): array
    {
        return $this->riskIndicators;
    }

    public function getRecommendations(): array
    {
        return $this->recommendations;
    }

    public function getGeneratedAt(): DateTimeImmutable
    {
        return $this->generatedAt;
    }

    /**
     * Get overall health score (0-100)
     */
    public function getHealthScore(): int
    {
        $progressScore = $this->overallProgress * 30; // 30% weight
        
        $timelineScore = match($this->timelineStatus['status']) {
            'ahead' => 30,
            'on_track' => 25,
            'slightly_behind' => 15,
            'behind' => 5,
            default => 15
        };
        
        $qualityScore = $this->qualityMetrics['pass_rate'] * 25; // 25% weight
        
        $riskScore = match(count($this->riskIndicators)) {
            0 => 15,
            1 => 10,
            2 => 5,
            default => 0
        };
        
        return (int) round($progressScore + $timelineScore + $qualityScore + $riskScore);
    }

    /**
     * Get health status label
     */
    public function getHealthStatus(): string
    {
        $score = $this->getHealthScore();
        
        return match(true) {
            $score >= 90 => 'excellent',
            $score >= 80 => 'good',
            $score >= 70 => 'fair',
            $score >= 60 => 'poor',
            default => 'critical'
        };
    }

    /**
     * Check if production is on track
     */
    public function isOnTrack(): bool
    {
        return $this->timelineStatus['is_on_track'] && 
               $this->qualityMetrics['pass_rate'] >= 0.9 &&
               count($this->getCriticalRisks()) === 0;
    }

    /**
     * Get critical risks
     */
    public function getCriticalRisks(): array
    {
        return array_filter(
            $this->riskIndicators,
            fn($risk) => $risk['level'] === 'critical'
        );
    }

    /**
     * Get high priority recommendations
     */
    public function getHighPriorityRecommendations(): array
    {
        return array_filter(
            $this->recommendations,
            fn($rec) => $rec['priority'] === 'high'
        );
    }

    /**
     * Get milestone completion rate
     */
    public function getMilestoneCompletionRate(): float
    {
        $total = $this->milestoneStatus['total'];
        $completed = $this->milestoneStatus['completed'];
        
        return $total > 0 ? $completed / $total : 0.0;
    }

    /**
     * Get estimated completion date
     */
    public function getEstimatedCompletionDate(): ?DateTimeImmutable
    {
        if (!isset($this->timelineStatus['estimated_completion'])) {
            return null;
        }
        
        return new DateTimeImmutable($this->timelineStatus['estimated_completion']);
    }

    /**
     * Get resource efficiency score
     */
    public function getResourceEfficiencyScore(): float
    {
        return $this->resourceUtilization['efficiency_score'] ?? 0.0;
    }

    /**
     * Get quality score
     */
    public function getQualityScore(): float
    {
        return $this->qualityMetrics['quality_score'] ?? 0.0;
    }

    /**
     * Check if there are overdue milestones
     */
    public function hasOverdueMilestones(): bool
    {
        return $this->milestoneStatus['overdue'] > 0;
    }

    /**
     * Check if there are quality issues
     */
    public function hasQualityIssues(): bool
    {
        return $this->qualityMetrics['failed'] > 0;
    }

    /**
     * Get summary statistics
     */
    public function getSummaryStats(): array
    {
        return [
            'overall_progress_percentage' => (int) round($this->overallProgress * 100),
            'health_score' => $this->getHealthScore(),
            'health_status' => $this->getHealthStatus(),
            'milestone_completion_rate' => $this->getMilestoneCompletionRate(),
            'quality_pass_rate' => $this->qualityMetrics['pass_rate'],
            'resource_efficiency' => $this->getResourceEfficiencyScore(),
            'timeline_status' => $this->timelineStatus['status'],
            'critical_risks_count' => count($this->getCriticalRisks()),
            'high_priority_recommendations_count' => count($this->getHighPriorityRecommendations()),
            'is_on_track' => $this->isOnTrack()
        ];
    }

    /**
     * Get key performance indicators
     */
    public function getKPIs(): array
    {
        return [
            'schedule_performance_index' => $this->calculateSchedulePerformanceIndex(),
            'cost_performance_index' => $this->calculateCostPerformanceIndex(),
            'quality_index' => $this->qualityMetrics['quality_score'],
            'resource_utilization_index' => $this->resourceUtilization['overall_utilization'],
            'risk_index' => $this->calculateRiskIndex()
        ];
    }

    /**
     * Calculate schedule performance index
     */
    private function calculateSchedulePerformanceIndex(): float
    {
        $actualProgress = $this->overallProgress;
        $expectedProgress = $this->timelineStatus['expected_progress'] ?? $actualProgress;
        
        return $expectedProgress > 0 ? $actualProgress / $expectedProgress : 1.0;
    }

    /**
     * Calculate cost performance index
     */
    private function calculateCostPerformanceIndex(): float
    {
        // In a real implementation, this would compare actual vs budgeted costs
        // For now, we'll use resource efficiency as a proxy
        return $this->resourceUtilization['efficiency_score'] ?? 1.0;
    }

    /**
     * Calculate risk index
     */
    private function calculateRiskIndex(): float
    {
        $riskCount = count($this->riskIndicators);
        $criticalRiskCount = count($this->getCriticalRisks());
        
        // Lower is better for risk index
        $riskScore = 1.0 - (($criticalRiskCount * 0.3) + ($riskCount * 0.1));
        
        return max(0.0, min(1.0, $riskScore));
    }

    /**
     * Generate executive summary
     */
    public function getExecutiveSummary(): array
    {
        $summary = [
            'overall_status' => $this->getHealthStatus(),
            'progress_percentage' => (int) round($this->overallProgress * 100),
            'timeline_status' => $this->timelineStatus['status'],
            'key_achievements' => [],
            'critical_issues' => [],
            'next_actions' => []
        ];
        
        // Key achievements
        if ($this->milestoneStatus['completed'] > 0) {
            $summary['key_achievements'][] = "{$this->milestoneStatus['completed']} milestones completed";
        }
        
        if ($this->qualityMetrics['passed'] > 0) {
            $summary['key_achievements'][] = "{$this->qualityMetrics['passed']} quality checkpoints passed";
        }
        
        // Critical issues
        foreach ($this->getCriticalRisks() as $risk) {
            $summary['critical_issues'][] = $risk['description'];
        }
        
        if ($this->hasOverdueMilestones()) {
            $summary['critical_issues'][] = "{$this->milestoneStatus['overdue']} overdue milestones";
        }
        
        // Next actions
        foreach ($this->getHighPriorityRecommendations() as $recommendation) {
            $summary['next_actions'][] = $recommendation['action'];
        }
        
        return $summary;
    }

    public function toArray(): array
    {
        return [
            'plan_id' => $this->planId,
            'overall_progress' => $this->overallProgress,
            'milestone_status' => $this->milestoneStatus,
            'timeline_status' => $this->timelineStatus,
            'resource_utilization' => $this->resourceUtilization,
            'quality_metrics' => $this->qualityMetrics,
            'risk_indicators' => $this->riskIndicators,
            'recommendations' => $this->recommendations,
            'generated_at' => $this->generatedAt->format('Y-m-d H:i:s'),
            'health_score' => $this->getHealthScore(),
            'health_status' => $this->getHealthStatus(),
            'is_on_track' => $this->isOnTrack(),
            'summary_stats' => $this->getSummaryStats(),
            'kpis' => $this->getKPIs(),
            'executive_summary' => $this->getExecutiveSummary()
        ];
    }
}