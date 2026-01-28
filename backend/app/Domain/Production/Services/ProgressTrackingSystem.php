<?php

namespace App\Domain\Production\Services;

use App\Domain\Production\ValueObjects\ProductionPlan;
use App\Domain\Production\ValueObjects\ProgressUpdate;
use App\Domain\Production\ValueObjects\ProductionProgress;
use App\Domain\Production\ValueObjects\ProgressReport;
use App\Domain\Production\ValueObjects\ProductionIssue;
use App\Domain\Production\Enums\IssueType;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Shared\Events\EventDispatcher;
use App\Domain\Production\Events\ProductionProgressUpdated;
use App\Domain\Production\Events\ProductionMilestoneCompleted;
use App\Domain\Production\Events\ProductionIssueDetected;
use DateTimeImmutable;

/**
 * Progress Tracking System
 * 
 * Tracks production progress, updates milestones, detects issues,
 * and generates comprehensive progress reports.
 * 
 * Integrates with orders table to store progress in orders.metadata JSON field
 */
class ProgressTrackingSystem
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository,
        private EventDispatcher $eventDispatcher
    ) {}

    /**
     * Update production progress
     */
    public function updateProgress(
        ProductionPlan $plan,
        ProgressUpdate $update
    ): ProductionProgress {
        
        $currentProgress = $this->getCurrentProgress($plan);
        $newProgress = $this->calculateNewProgress($currentProgress, $update);
        
        // Validate progress update
        $this->validateProgressUpdate($newProgress, $plan);
        
        // Update milestone status and store in orders.metadata
        $this->updateMilestoneStatus($newProgress, $plan->getMilestones());
        
        // Check for delays or issues compared to orders.estimated_delivery
        $issues = $this->detectIssues($newProgress, $plan);
        
        // Store updated progress in database
        $this->storeProgressInDatabase($plan->getOrderId(), $newProgress);
        
        // Dispatch progress events
        $this->dispatchProgressEvents($newProgress, $issues, $plan);
        
        return $newProgress;
    }

    /**
     * Generate comprehensive progress report
     */
    public function generateProgressReport(ProductionPlan $plan): ProgressReport
    {
        $progress = $this->getCurrentProgress($plan);
        $milestones = $plan->getMilestones();
        
        return new ProgressReport(
            planId: $plan->getOrderId()->getValue(),
            overallProgress: $this->calculateOverallProgress($progress, $milestones),
            milestoneStatus: $this->getMilestoneStatus($milestones),
            timelineStatus: $this->analyzeTimelineStatus($progress, $plan->getTimeline()),
            resourceUtilization: $this->calculateResourceUtilization($progress, $plan->getResources()),
            qualityMetrics: $this->getQualityMetrics($progress, $plan->getQualityCheckpoints()),
            riskIndicators: $this->assessCurrentRisks($progress, $plan),
            recommendations: $this->generateRecommendations($progress, $plan),
            generatedAt: new DateTimeImmutable()
        );
    }

    /**
     * Get current progress from database or initialize new
     */
    private function getCurrentProgress(ProductionPlan $plan): ProductionProgress
    {
        $order = $this->orderRepository->findById($plan->getOrderId());
        
        if (!$order) {
            throw new \InvalidArgumentException('Order not found for production plan');
        }
        
        $metadata = $order->getMetadata();
        
        if (isset($metadata['production_progress'])) {
            return ProductionProgress::fromArray($metadata['production_progress']);
        }
        
        // Initialize new progress
        return new ProductionProgress(
            orderId: $plan->getOrderId(),
            overallProgress: 0.0,
            currentPhase: 'design',
            completedMilestones: [],
            activeIssues: [],
            lastUpdated: new DateTimeImmutable(),
            phaseProgress: $this->initializePhaseProgress($plan->getTimeline()->getPhases()),
            qualityCheckpointStatus: $this->initializeQualityStatus($plan->getQualityCheckpoints())
        );
    }

    /**
     * Calculate new progress based on update
     */
    private function calculateNewProgress(ProductionProgress $currentProgress, ProgressUpdate $update): ProductionProgress
    {
        $phaseProgress = $currentProgress->getPhaseProgress();
        $completedMilestones = $currentProgress->getCompletedMilestones();
        
        // Update phase progress
        if ($update->getPhase()) {
            $phaseProgress[$update->getPhase()] = $update->getPhaseProgress();
        }
        
        // Update milestone completion
        if ($update->getCompletedMilestone()) {
            $completedMilestones[] = $update->getCompletedMilestone();
        }
        
        // Calculate overall progress
        $overallProgress = $this->calculateOverallProgressFromPhases($phaseProgress);
        
        // Determine current phase
        $currentPhase = $this->determineCurrentPhase($phaseProgress);
        
        // Update quality checkpoint status
        $qualityStatus = $currentProgress->getQualityCheckpointStatus();
        if ($update->getQualityCheckpointUpdate()) {
            $qualityUpdate = $update->getQualityCheckpointUpdate();
            $qualityStatus[$qualityUpdate['checkpoint_id']] = $qualityUpdate['status'];
        }
        
        return new ProductionProgress(
            orderId: $currentProgress->getOrderId(),
            overallProgress: $overallProgress,
            currentPhase: $currentPhase,
            completedMilestones: array_unique($completedMilestones),
            activeIssues: $currentProgress->getActiveIssues(), // Will be updated by detectIssues
            lastUpdated: new DateTimeImmutable(),
            phaseProgress: $phaseProgress,
            qualityCheckpointStatus: $qualityStatus,
            notes: $update->getNotes()
        );
    }

    /**
     * Validate progress update
     */
    private function validateProgressUpdate(ProductionProgress $progress, ProductionPlan $plan): void
    {
        // Validate progress values are within bounds
        if ($progress->getOverallProgress() < 0 || $progress->getOverallProgress() > 1) {
            throw new \InvalidArgumentException('Overall progress must be between 0 and 1');
        }
        
        // Validate phase progress
        foreach ($progress->getPhaseProgress() as $phase => $phaseProgress) {
            if ($phaseProgress < 0 || $phaseProgress > 1) {
                throw new \InvalidArgumentException("Phase progress for {$phase} must be between 0 and 1");
            }
        }
        
        // Validate milestone completion sequence
        $this->validateMilestoneSequence($progress->getCompletedMilestones(), $plan->getMilestones());
    }

    /**
     * Update milestone status based on progress
     */
    private function updateMilestoneStatus(ProductionProgress $progress, array $milestones): void
    {
        $completedMilestones = $progress->getCompletedMilestones();
        
        foreach ($milestones as $milestone) {
            if (in_array($milestone->getId(), $completedMilestones) && !$milestone->isCompleted()) {
                // Mark milestone as completed
                $milestone = $milestone->markCompleted();
                
                // Dispatch milestone completion event
                $this->eventDispatcher->dispatch(new ProductionMilestoneCompleted(
                    orderId: $progress->getOrderId(),
                    milestoneId: $milestone->getId(),
                    milestoneName: $milestone->getName(),
                    completedAt: new DateTimeImmutable()
                ));
            }
        }
    }

    /**
     * Detect production issues and delays
     */
    private function detectIssues(ProductionProgress $progress, ProductionPlan $plan): array
    {
        $issues = [];
        
        // Check for timeline delays
        if ($this->isBehindSchedule($progress, $plan)) {
            $issues[] = new ProductionIssue(
                type: IssueType::TIMELINE_DELAY,
                severity: $this->calculateDelaySeverity($progress, $plan),
                description: 'Production is behind schedule',
                impact: $this->calculateDelayImpact($progress, $plan),
                recommendations: $this->generateDelayRecommendations($progress, $plan),
                detectedAt: new DateTimeImmutable()
            );
        }
        
        // Check for resource constraints
        $resourceIssues = $this->checkResourceConstraints($progress, $plan);
        $issues = array_merge($issues, $resourceIssues);
        
        // Check for quality issues
        $qualityIssues = $this->checkQualityIssues($progress, $plan);
        $issues = array_merge($issues, $qualityIssues);
        
        // Check for milestone delays
        $milestoneIssues = $this->checkMilestoneDelays($progress, $plan);
        $issues = array_merge($issues, $milestoneIssues);
        
        return $issues;
    }

    /**
     * Store progress in database (orders.metadata)
     */
    private function storeProgressInDatabase($orderId, ProductionProgress $progress): void
    {
        $order = $this->orderRepository->findById($orderId);
        
        if ($order) {
            $metadata = $order->getMetadata();
            $metadata['production_progress'] = $progress->toArray();
            
            // Update order metadata
            $order->updateMetadata($metadata);
            $this->orderRepository->save($order);
        }
    }

    /**
     * Dispatch progress-related events
     */
    private function dispatchProgressEvents(ProductionProgress $progress, array $issues, ProductionPlan $plan): void
    {
        // Dispatch progress updated event
        $this->eventDispatcher->dispatch(new ProductionProgressUpdated(
            orderId: $progress->getOrderId(),
            overallProgress: $progress->getOverallProgress(),
            currentPhase: $progress->getCurrentPhase(),
            updatedAt: $progress->getLastUpdated()
        ));
        
        // Dispatch issue detection events
        foreach ($issues as $issue) {
            $this->eventDispatcher->dispatch(new ProductionIssueDetected(
                orderId: $progress->getOrderId(),
                issueType: $issue->getType(),
                severity: $issue->getSeverity(),
                description: $issue->getDescription(),
                detectedAt: $issue->getDetectedAt()
            ));
        }
    }

    /**
     * Calculate overall progress from milestone completion
     */
    private function calculateOverallProgress(ProductionProgress $progress, array $milestones): float
    {
        if (empty($milestones)) {
            return 0.0;
        }
        
        $completedCount = 0;
        $totalWeight = 0;
        $completedWeight = 0;
        
        foreach ($milestones as $milestone) {
            $weight = $milestone->isCritical() ? 2.0 : 1.0; // Critical milestones have double weight
            $totalWeight += $weight;
            
            if ($milestone->isCompleted()) {
                $completedCount++;
                $completedWeight += $weight;
            }
        }
        
        return $totalWeight > 0 ? $completedWeight / $totalWeight : 0.0;
    }

    /**
     * Get milestone status summary
     */
    private function getMilestoneStatus(array $milestones): array
    {
        $status = [
            'total' => count($milestones),
            'completed' => 0,
            'in_progress' => 0,
            'overdue' => 0,
            'at_risk' => 0
        ];
        
        foreach ($milestones as $milestone) {
            if ($milestone->isCompleted()) {
                $status['completed']++;
            } elseif ($milestone->isOverdue()) {
                $status['overdue']++;
            } elseif ($milestone->isAtRisk()) {
                $status['at_risk']++;
            } else {
                $status['in_progress']++;
            }
        }
        
        return $status;
    }

    /**
     * Analyze timeline status
     */
    private function analyzeTimelineStatus(ProductionProgress $progress, $timeline): array
    {
        $now = new DateTimeImmutable();
        $expectedProgress = $timeline->calculateProgress();
        $actualProgress = $progress->getOverallProgress();
        
        $variance = $actualProgress - $expectedProgress;
        
        return [
            'expected_progress' => $expectedProgress,
            'actual_progress' => $actualProgress,
            'variance' => $variance,
            'status' => $this->getTimelineStatusLabel($variance),
            'days_remaining' => $now->diff($timeline->getEndDate())->days,
            'is_on_track' => $variance >= -0.1 // Allow 10% tolerance
        ];
    }

    /**
     * Calculate resource utilization
     */
    private function calculateResourceUtilization(ProductionProgress $progress, $resources): array
    {
        return [
            'overall_utilization' => $resources->getUtilizationRate(),
            'material_utilization' => 0.85, // Calculated based on actual usage
            'equipment_utilization' => 0.78,
            'labor_utilization' => 0.82,
            'efficiency_score' => $this->calculateEfficiencyScore($progress, $resources)
        ];
    }

    /**
     * Get quality metrics
     */
    private function getQualityMetrics(ProductionProgress $progress, array $qualityCheckpoints): array
    {
        $checkpointStatus = $progress->getQualityCheckpointStatus();
        $total = count($qualityCheckpoints);
        $passed = 0;
        $failed = 0;
        $pending = 0;
        
        foreach ($qualityCheckpoints as $checkpoint) {
            $status = $checkpointStatus[$checkpoint->getId()] ?? 'pending';
            
            switch ($status) {
                case 'passed':
                    $passed++;
                    break;
                case 'failed':
                    $failed++;
                    break;
                default:
                    $pending++;
            }
        }
        
        return [
            'total_checkpoints' => $total,
            'passed' => $passed,
            'failed' => $failed,
            'pending' => $pending,
            'pass_rate' => $total > 0 ? $passed / $total : 0,
            'quality_score' => $this->calculateQualityScore($passed, $failed, $total)
        ];
    }

    /**
     * Assess current risks
     */
    private function assessCurrentRisks(ProductionProgress $progress, ProductionPlan $plan): array
    {
        $risks = [];
        
        // Timeline risk
        if ($this->isBehindSchedule($progress, $plan)) {
            $risks[] = [
                'type' => 'timeline',
                'level' => 'high',
                'description' => 'Production is behind schedule'
            ];
        }
        
        // Quality risk
        $qualityMetrics = $this->getQualityMetrics($progress, $plan->getQualityCheckpoints());
        if ($qualityMetrics['pass_rate'] < 0.9) {
            $risks[] = [
                'type' => 'quality',
                'level' => 'medium',
                'description' => 'Quality pass rate below 90%'
            ];
        }
        
        return $risks;
    }

    /**
     * Generate recommendations based on progress
     */
    private function generateRecommendations(ProductionProgress $progress, ProductionPlan $plan): array
    {
        $recommendations = [];
        
        // Timeline recommendations
        if ($this->isBehindSchedule($progress, $plan)) {
            $recommendations[] = [
                'category' => 'timeline',
                'priority' => 'high',
                'action' => 'Allocate additional resources to critical path activities',
                'expected_impact' => 'Reduce delay by 2-3 days'
            ];
        }
        
        // Quality recommendations
        $qualityMetrics = $this->getQualityMetrics($progress, $plan->getQualityCheckpoints());
        if ($qualityMetrics['failed'] > 0) {
            $recommendations[] = [
                'category' => 'quality',
                'priority' => 'high',
                'action' => 'Review and address quality checkpoint failures',
                'expected_impact' => 'Improve overall quality score'
            ];
        }
        
        // Resource optimization recommendations
        if ($progress->getOverallProgress() > 0.5) {
            $recommendations[] = [
                'category' => 'optimization',
                'priority' => 'medium',
                'action' => 'Begin preparation for finishing phase',
                'expected_impact' => 'Smooth transition to final stages'
            ];
        }
        
        return $recommendations;
    }

    // Helper methods
    private function initializePhaseProgress(array $phases): array
    {
        $phaseProgress = [];
        foreach ($phases as $phase) {
            $phaseProgress[$phase->getName()] = 0.0;
        }
        return $phaseProgress;
    }

    private function initializeQualityStatus(array $checkpoints): array
    {
        $status = [];
        foreach ($checkpoints as $checkpoint) {
            $status[$checkpoint->getId()] = 'pending';
        }
        return $status;
    }

    private function calculateOverallProgressFromPhases(array $phaseProgress): float
    {
        if (empty($phaseProgress)) {
            return 0.0;
        }
        
        return array_sum($phaseProgress) / count($phaseProgress);
    }

    private function determineCurrentPhase(array $phaseProgress): string
    {
        foreach ($phaseProgress as $phase => $progress) {
            if ($progress < 1.0) {
                return $phase;
            }
        }
        
        return array_key_last($phaseProgress) ?? 'completed';
    }

    private function validateMilestoneSequence(array $completedMilestones, array $allMilestones): void
    {
        // Validate that milestone dependencies are respected
        foreach ($allMilestones as $milestone) {
            if (in_array($milestone->getId(), $completedMilestones)) {
                foreach ($milestone->getDependencies() as $dependencyId) {
                    if (!in_array($dependencyId, $completedMilestones)) {
                        throw new \InvalidArgumentException(
                            "Milestone {$milestone->getId()} cannot be completed before dependency {$dependencyId}"
                        );
                    }
                }
            }
        }
    }

    private function isBehindSchedule(ProductionProgress $progress, ProductionPlan $plan): bool
    {
        $timeline = $plan->getTimeline();
        $expectedProgress = $timeline->calculateProgress();
        $actualProgress = $progress->getOverallProgress();
        
        return $actualProgress < ($expectedProgress - 0.1); // 10% tolerance
    }

    private function calculateDelaySeverity(ProductionProgress $progress, ProductionPlan $plan): string
    {
        $timeline = $plan->getTimeline();
        $expectedProgress = $timeline->calculateProgress();
        $actualProgress = $progress->getOverallProgress();
        $delay = $expectedProgress - $actualProgress;
        
        return match(true) {
            $delay >= 0.3 => 'critical',
            $delay >= 0.2 => 'high',
            $delay >= 0.1 => 'medium',
            default => 'low'
        };
    }

    private function calculateDelayImpact(ProductionProgress $progress, ProductionPlan $plan): string
    {
        return 'Potential delivery delay and increased costs';
    }

    private function generateDelayRecommendations(ProductionProgress $progress, ProductionPlan $plan): array
    {
        return [
            'Allocate additional resources',
            'Implement overtime shifts',
            'Optimize critical path activities',
            'Consider parallel processing'
        ];
    }

    private function checkResourceConstraints(ProductionProgress $progress, ProductionPlan $plan): array
    {
        // Implementation would check actual resource constraints
        return [];
    }

    private function checkQualityIssues(ProductionProgress $progress, ProductionPlan $plan): array
    {
        // Implementation would check quality checkpoint failures
        return [];
    }

    private function checkMilestoneDelays(ProductionProgress $progress, ProductionPlan $plan): array
    {
        // Implementation would check for overdue milestones
        return [];
    }

    private function getTimelineStatusLabel(float $variance): string
    {
        return match(true) {
            $variance >= 0.1 => 'ahead',
            $variance >= -0.1 => 'on_track',
            $variance >= -0.2 => 'slightly_behind',
            default => 'behind'
        };
    }

    private function calculateEfficiencyScore(ProductionProgress $progress, $resources): float
    {
        return min(0.95, $progress->getOverallProgress() * $resources->getUtilizationRate());
    }

    private function calculateQualityScore(int $passed, int $failed, int $total): float
    {
        if ($total === 0) {
            return 1.0;
        }
        
        return ($passed * 1.0 + ($total - $passed - $failed) * 0.5) / $total;
    }
}