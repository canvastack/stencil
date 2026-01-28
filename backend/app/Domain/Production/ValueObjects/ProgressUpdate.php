<?php

namespace App\Domain\Production\ValueObjects;

/**
 * Progress Update Value Object
 * 
 * Represents an update to production progress including phase progress,
 * milestone completion, and quality checkpoint updates.
 */
final class ProgressUpdate
{
    /**
     * @param array<string, mixed>|null $qualityCheckpointUpdate
     */
    public function __construct(
        private ?string $phase = null,
        private ?float $phaseProgress = null,
        private ?string $completedMilestone = null,
        private ?array $qualityCheckpointUpdate = null,
        private ?string $notes = null,
        private ?string $updatedBy = null
    ) {}

    public function getPhase(): ?string
    {
        return $this->phase;
    }

    public function getPhaseProgress(): ?float
    {
        return $this->phaseProgress;
    }

    public function getCompletedMilestone(): ?string
    {
        return $this->completedMilestone;
    }

    public function getQualityCheckpointUpdate(): ?array
    {
        return $this->qualityCheckpointUpdate;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function getUpdatedBy(): ?string
    {
        return $this->updatedBy;
    }

    /**
     * Create phase progress update
     */
    public static function forPhase(string $phase, float $progress, ?string $notes = null): self
    {
        return new self(
            phase: $phase,
            phaseProgress: max(0.0, min(1.0, $progress)), // Clamp between 0 and 1
            notes: $notes
        );
    }

    /**
     * Create milestone completion update
     */
    public static function forMilestone(string $milestoneId, ?string $notes = null): self
    {
        return new self(
            completedMilestone: $milestoneId,
            notes: $notes
        );
    }

    /**
     * Create quality checkpoint update
     */
    public static function forQualityCheckpoint(
        string $checkpointId, 
        string $status, 
        ?string $notes = null
    ): self {
        return new self(
            qualityCheckpointUpdate: [
                'checkpoint_id' => $checkpointId,
                'status' => $status,
                'updated_at' => (new \DateTimeImmutable())->format('Y-m-d H:i:s')
            ],
            notes: $notes
        );
    }

    /**
     * Create combined update
     */
    public static function combined(
        ?string $phase = null,
        ?float $phaseProgress = null,
        ?string $completedMilestone = null,
        ?array $qualityCheckpointUpdate = null,
        ?string $notes = null,
        ?string $updatedBy = null
    ): self {
        return new self(
            phase: $phase,
            phaseProgress: $phaseProgress ? max(0.0, min(1.0, $phaseProgress)) : null,
            completedMilestone: $completedMilestone,
            qualityCheckpointUpdate: $qualityCheckpointUpdate,
            notes: $notes,
            updatedBy: $updatedBy
        );
    }

    /**
     * Check if update is valid
     */
    public function isValid(): bool
    {
        // At least one update field must be provided
        return $this->phase !== null || 
               $this->completedMilestone !== null || 
               $this->qualityCheckpointUpdate !== null;
    }

    /**
     * Get update type
     */
    public function getUpdateType(): string
    {
        if ($this->completedMilestone !== null) {
            return 'milestone_completion';
        }
        
        if ($this->qualityCheckpointUpdate !== null) {
            return 'quality_checkpoint';
        }
        
        if ($this->phase !== null) {
            return 'phase_progress';
        }
        
        return 'general';
    }

    public function toArray(): array
    {
        return [
            'phase' => $this->phase,
            'phase_progress' => $this->phaseProgress,
            'completed_milestone' => $this->completedMilestone,
            'quality_checkpoint_update' => $this->qualityCheckpointUpdate,
            'notes' => $this->notes,
            'updated_by' => $this->updatedBy,
            'update_type' => $this->getUpdateType(),
            'is_valid' => $this->isValid()
        ];
    }
}