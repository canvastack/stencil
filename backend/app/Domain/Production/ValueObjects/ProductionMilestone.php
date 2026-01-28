<?php

namespace App\Domain\Production\ValueObjects;

use DateTimeImmutable;

/**
 * Production Milestone Value Object
 * 
 * Represents a key milestone in the production process with completion
 * tracking and critical path indicators.
 */
final class ProductionMilestone
{
    public function __construct(
        private string $id,
        private string $name,
        private string $description,
        private DateTimeImmutable $dueDate,
        private bool $isCritical,
        private bool $isCompleted,
        private ?DateTimeImmutable $completedAt,
        private array $deliverables,
        private array $dependencies,
        private string $assignedTo,
        private float $progress = 0.0
    ) {}

    public function getId(): string
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function getDueDate(): DateTimeImmutable
    {
        return $this->dueDate;
    }

    public function isCritical(): bool
    {
        return $this->isCritical;
    }

    public function isCompleted(): bool
    {
        return $this->isCompleted;
    }

    public function getCompletedAt(): ?DateTimeImmutable
    {
        return $this->completedAt;
    }

    public function getDeliverables(): array
    {
        return $this->deliverables;
    }

    public function getDependencies(): array
    {
        return $this->dependencies;
    }

    public function getAssignedTo(): string
    {
        return $this->assignedTo;
    }

    public function getProgress(): float
    {
        return $this->progress;
    }

    /**
     * Check if milestone is overdue
     */
    public function isOverdue(): bool
    {
        if ($this->isCompleted) {
            return false;
        }

        return new DateTimeImmutable() > $this->dueDate;
    }

    /**
     * Check if milestone is at risk (due within 2 days and not completed)
     */
    public function isAtRisk(): bool
    {
        if ($this->isCompleted) {
            return false;
        }

        $now = new DateTimeImmutable();
        $riskThreshold = $now->modify('+2 days');

        return $this->dueDate <= $riskThreshold;
    }

    /**
     * Get days until due date
     */
    public function getDaysUntilDue(): int
    {
        if ($this->isCompleted) {
            return 0;
        }

        $now = new DateTimeImmutable();
        $diff = $now->diff($this->dueDate);

        return $diff->invert ? -$diff->days : $diff->days;
    }

    /**
     * Get completion delay in days (if completed late)
     */
    public function getCompletionDelay(): int
    {
        if (!$this->isCompleted || !$this->completedAt) {
            return 0;
        }

        $diff = $this->dueDate->diff($this->completedAt);
        return $diff->invert ? $diff->days : 0;
    }

    /**
     * Mark milestone as completed
     */
    public function markCompleted(): self
    {
        return new self(
            id: $this->id,
            name: $this->name,
            description: $this->description,
            dueDate: $this->dueDate,
            isCritical: $this->isCritical,
            isCompleted: true,
            completedAt: new DateTimeImmutable(),
            deliverables: $this->deliverables,
            dependencies: $this->dependencies,
            assignedTo: $this->assignedTo,
            progress: 1.0
        );
    }

    /**
     * Update progress
     */
    public function updateProgress(float $progress): self
    {
        $progress = max(0.0, min(1.0, $progress)); // Clamp between 0 and 1
        $isCompleted = $progress >= 1.0;

        return new self(
            id: $this->id,
            name: $this->name,
            description: $this->description,
            dueDate: $this->dueDate,
            isCritical: $this->isCritical,
            isCompleted: $isCompleted,
            completedAt: $isCompleted ? new DateTimeImmutable() : $this->completedAt,
            deliverables: $this->deliverables,
            dependencies: $this->dependencies,
            assignedTo: $this->assignedTo,
            progress: $progress
        );
    }

    /**
     * Check if all dependencies are completed
     */
    public function areDependenciesCompleted(array $allMilestones): bool
    {
        foreach ($this->dependencies as $dependencyId) {
            $dependency = array_filter(
                $allMilestones,
                fn(ProductionMilestone $m) => $m->getId() === $dependencyId
            );

            if (empty($dependency) || !reset($dependency)->isCompleted()) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get milestone status
     */
    public function getStatus(): string
    {
        if ($this->isCompleted) {
            return $this->getCompletionDelay() > 0 ? 'completed_late' : 'completed_on_time';
        }

        if ($this->isOverdue()) {
            return 'overdue';
        }

        if ($this->isAtRisk()) {
            return 'at_risk';
        }

        if ($this->progress > 0) {
            return 'in_progress';
        }

        return 'not_started';
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'due_date' => $this->dueDate->format('Y-m-d H:i:s'),
            'is_critical' => $this->isCritical,
            'is_completed' => $this->isCompleted,
            'completed_at' => $this->completedAt?->format('Y-m-d H:i:s'),
            'deliverables' => $this->deliverables,
            'dependencies' => $this->dependencies,
            'assigned_to' => $this->assignedTo,
            'progress' => $this->progress,
            'status' => $this->getStatus(),
            'days_until_due' => $this->getDaysUntilDue()
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            name: $data['name'],
            description: $data['description'],
            dueDate: new DateTimeImmutable($data['due_date']),
            isCritical: $data['is_critical'],
            isCompleted: $data['is_completed'],
            completedAt: isset($data['completed_at']) ? new DateTimeImmutable($data['completed_at']) : null,
            deliverables: $data['deliverables'],
            dependencies: $data['dependencies'],
            assignedTo: $data['assigned_to'],
            progress: $data['progress'] ?? 0.0
        );
    }
}