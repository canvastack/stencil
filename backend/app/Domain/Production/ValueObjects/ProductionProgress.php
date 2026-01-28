<?php

namespace App\Domain\Production\ValueObjects;

use App\Domain\Shared\ValueObjects\UuidValueObject;
use DateTimeImmutable;

/**
 * Production Progress Value Object
 * 
 * Represents the current state of production progress including
 * overall progress, phase completion, and quality status.
 */
final class ProductionProgress
{
    /**
     * @param array<string> $completedMilestones
     * @param array<ProductionIssue> $activeIssues
     * @param array<string, float> $phaseProgress
     * @param array<string, string> $qualityCheckpointStatus
     */
    public function __construct(
        private UuidValueObject $orderId,
        private float $overallProgress,
        private string $currentPhase,
        private array $completedMilestones,
        private array $activeIssues,
        private DateTimeImmutable $lastUpdated,
        private array $phaseProgress = [],
        private array $qualityCheckpointStatus = [],
        private ?string $notes = null
    ) {}

    public function getOrderId(): UuidValueObject
    {
        return $this->orderId;
    }

    public function getOverallProgress(): float
    {
        return $this->overallProgress;
    }

    public function getCurrentPhase(): string
    {
        return $this->currentPhase;
    }

    public function getCompletedMilestones(): array
    {
        return $this->completedMilestones;
    }

    public function getActiveIssues(): array
    {
        return $this->activeIssues;
    }

    public function getLastUpdated(): DateTimeImmutable
    {
        return $this->lastUpdated;
    }

    public function getPhaseProgress(): array
    {
        return $this->phaseProgress;
    }

    public function getQualityCheckpointStatus(): array
    {
        return $this->qualityCheckpointStatus;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    /**
     * Get progress percentage as integer (0-100)
     */
    public function getProgressPercentage(): int
    {
        return (int) round($this->overallProgress * 100);
    }

    /**
     * Check if production is completed
     */
    public function isCompleted(): bool
    {
        return $this->overallProgress >= 1.0;
    }

    /**
     * Check if production has started
     */
    public function hasStarted(): bool
    {
        return $this->overallProgress > 0.0;
    }

    /**
     * Get progress for specific phase
     */
    public function getPhaseProgressValue(string $phase): float
    {
        return $this->phaseProgress[$phase] ?? 0.0;
    }

    /**
     * Check if phase is completed
     */
    public function isPhaseCompleted(string $phase): bool
    {
        return $this->getPhaseProgressValue($phase) >= 1.0;
    }

    /**
     * Get completed phases
     */
    public function getCompletedPhases(): array
    {
        return array_keys(array_filter(
            $this->phaseProgress,
            fn($progress) => $progress >= 1.0
        ));
    }

    /**
     * Get active (in-progress) phases
     */
    public function getActivePhases(): array
    {
        return array_keys(array_filter(
            $this->phaseProgress,
            fn($progress) => $progress > 0.0 && $progress < 1.0
        ));
    }

    /**
     * Get pending phases
     */
    public function getPendingPhases(): array
    {
        return array_keys(array_filter(
            $this->phaseProgress,
            fn($progress) => $progress === 0.0
        ));
    }

    /**
     * Get quality checkpoint status for specific checkpoint
     */
    public function getQualityCheckpointStatusValue(string $checkpointId): string
    {
        return $this->qualityCheckpointStatus[$checkpointId] ?? 'pending';
    }

    /**
     * Check if quality checkpoint passed
     */
    public function isQualityCheckpointPassed(string $checkpointId): bool
    {
        return $this->getQualityCheckpointStatusValue($checkpointId) === 'passed';
    }

    /**
     * Get passed quality checkpoints
     */
    public function getPassedQualityCheckpoints(): array
    {
        return array_keys(array_filter(
            $this->qualityCheckpointStatus,
            fn($status) => $status === 'passed'
        ));
    }

    /**
     * Get failed quality checkpoints
     */
    public function getFailedQualityCheckpoints(): array
    {
        return array_keys(array_filter(
            $this->qualityCheckpointStatus,
            fn($status) => $status === 'failed'
        ));
    }

    /**
     * Get pending quality checkpoints
     */
    public function getPendingQualityCheckpoints(): array
    {
        return array_keys(array_filter(
            $this->qualityCheckpointStatus,
            fn($status) => $status === 'pending'
        ));
    }

    /**
     * Check if milestone is completed
     */
    public function isMilestoneCompleted(string $milestoneId): bool
    {
        return in_array($milestoneId, $this->completedMilestones);
    }

    /**
     * Get critical issues
     */
    public function getCriticalIssues(): array
    {
        return array_filter(
            $this->activeIssues,
            fn($issue) => $issue->getSeverity() === 'critical'
        );
    }

    /**
     * Check if there are any critical issues
     */
    public function hasCriticalIssues(): bool
    {
        return !empty($this->getCriticalIssues());
    }

    /**
     * Get progress status label
     */
    public function getStatusLabel(): string
    {
        if ($this->isCompleted()) {
            return 'completed';
        }
        
        if ($this->hasCriticalIssues()) {
            return 'critical_issues';
        }
        
        if (!empty($this->activeIssues)) {
            return 'has_issues';
        }
        
        if ($this->hasStarted()) {
            return 'in_progress';
        }
        
        return 'not_started';
    }

    /**
     * Get next milestone to complete
     */
    public function getNextMilestone(array $allMilestones): ?string
    {
        foreach ($allMilestones as $milestone) {
            if (!$this->isMilestoneCompleted($milestone->getId())) {
                return $milestone->getId();
            }
        }
        
        return null;
    }

    /**
     * Calculate estimated completion date based on current progress
     */
    public function estimateCompletionDate(DateTimeImmutable $originalEndDate): DateTimeImmutable
    {
        if ($this->overallProgress <= 0) {
            return $originalEndDate;
        }
        
        $now = new DateTimeImmutable();
        $elapsedTime = $now->diff($this->lastUpdated)->days;
        
        // Estimate remaining time based on current progress rate
        $progressRate = $this->overallProgress / max($elapsedTime, 1);
        $remainingProgress = 1.0 - $this->overallProgress;
        $estimatedRemainingDays = (int) ceil($remainingProgress / max($progressRate, 0.01));
        
        return $now->add(new \DateInterval('P' . $estimatedRemainingDays . 'D'));
    }

    /**
     * Add issue to active issues
     */
    public function addIssue(ProductionIssue $issue): self
    {
        $activeIssues = $this->activeIssues;
        $activeIssues[] = $issue;
        
        return new self(
            orderId: $this->orderId,
            overallProgress: $this->overallProgress,
            currentPhase: $this->currentPhase,
            completedMilestones: $this->completedMilestones,
            activeIssues: $activeIssues,
            lastUpdated: new DateTimeImmutable(),
            phaseProgress: $this->phaseProgress,
            qualityCheckpointStatus: $this->qualityCheckpointStatus,
            notes: $this->notes
        );
    }

    /**
     * Resolve issue by removing from active issues
     */
    public function resolveIssue(string $issueId): self
    {
        $activeIssues = array_filter(
            $this->activeIssues,
            fn($issue) => $issue->getId() !== $issueId
        );
        
        return new self(
            orderId: $this->orderId,
            overallProgress: $this->overallProgress,
            currentPhase: $this->currentPhase,
            completedMilestones: $this->completedMilestones,
            activeIssues: array_values($activeIssues),
            lastUpdated: new DateTimeImmutable(),
            phaseProgress: $this->phaseProgress,
            qualityCheckpointStatus: $this->qualityCheckpointStatus,
            notes: $this->notes
        );
    }

    public function toArray(): array
    {
        return [
            'order_id' => $this->orderId->getValue(),
            'overall_progress' => $this->overallProgress,
            'progress_percentage' => $this->getProgressPercentage(),
            'current_phase' => $this->currentPhase,
            'completed_milestones' => $this->completedMilestones,
            'active_issues' => array_map(fn($issue) => $issue->toArray(), $this->activeIssues),
            'last_updated' => $this->lastUpdated->format('Y-m-d H:i:s'),
            'phase_progress' => $this->phaseProgress,
            'quality_checkpoint_status' => $this->qualityCheckpointStatus,
            'notes' => $this->notes,
            'status_label' => $this->getStatusLabel(),
            'is_completed' => $this->isCompleted(),
            'has_started' => $this->hasStarted(),
            'has_critical_issues' => $this->hasCriticalIssues(),
            'completed_phases' => $this->getCompletedPhases(),
            'active_phases' => $this->getActivePhases(),
            'pending_phases' => $this->getPendingPhases(),
            'passed_quality_checkpoints' => $this->getPassedQualityCheckpoints(),
            'failed_quality_checkpoints' => $this->getFailedQualityCheckpoints(),
            'pending_quality_checkpoints' => $this->getPendingQualityCheckpoints()
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            orderId: new UuidValueObject($data['order_id']),
            overallProgress: $data['overall_progress'],
            currentPhase: $data['current_phase'],
            completedMilestones: $data['completed_milestones'],
            activeIssues: array_map(fn($issue) => ProductionIssue::fromArray($issue), $data['active_issues'] ?? []),
            lastUpdated: new DateTimeImmutable($data['last_updated']),
            phaseProgress: $data['phase_progress'] ?? [],
            qualityCheckpointStatus: $data['quality_checkpoint_status'] ?? [],
            notes: $data['notes'] ?? null
        );
    }
}