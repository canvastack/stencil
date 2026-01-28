<?php

namespace App\Domain\Shared\ValueObjects;

use DateTime;
use DateTimeImmutable;
use InvalidArgumentException;

/**
 * Timeline Value Object
 * 
 * Manages order timelines, milestones, and deadline tracking.
 * Supports PT CEX business requirements for production scheduling.
 * 
 * Database Integration:
 * - Works with TIMESTAMP fields in orders table
 * - Supports milestone tracking in JSON metadata
 * - Handles delivery estimates and SLA monitoring
 */
class Timeline
{
    private DateTimeImmutable $startDate;
    private DateTimeImmutable $endDate;
    private array $milestones;
    private ?DateTimeImmutable $actualCompletionDate;

    /**
     * @param DateTimeImmutable $startDate When the timeline begins
     * @param DateTimeImmutable $endDate When the timeline should end
     * @param array $milestones Array of milestone data
     * @param DateTimeImmutable|null $actualCompletionDate When actually completed
     */
    public function __construct(
        DateTimeImmutable $startDate,
        DateTimeImmutable $endDate,
        array $milestones = [],
        ?DateTimeImmutable $actualCompletionDate = null
    ) {
        $this->guardAgainstInvalidDateRange($startDate, $endDate);
        $this->guardAgainstInvalidMilestones($milestones);
        
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->milestones = $milestones;
        $this->actualCompletionDate = $actualCompletionDate;
    }

    /**
     * Create timeline for order production
     */
    public static function forOrderProduction(
        DateTimeImmutable $orderDate,
        int $estimatedDaysToComplete,
        array $productionMilestones = []
    ): self {
        $endDate = $orderDate->modify("+{$estimatedDaysToComplete} days");
        
        // Default PT CEX production milestones
        $defaultMilestones = [
            [
                'name' => 'Design Review',
                'target_date' => $orderDate->modify('+1 day')->format('Y-m-d H:i:s'),
                'status' => 'pending',
                'description' => 'Review customer specifications and create design'
            ],
            [
                'name' => 'Material Preparation',
                'target_date' => $orderDate->modify('+2 days')->format('Y-m-d H:i:s'),
                'status' => 'pending',
                'description' => 'Prepare materials for etching process'
            ],
            [
                'name' => 'Production Start',
                'target_date' => $orderDate->modify('+3 days')->format('Y-m-d H:i:s'),
                'status' => 'pending',
                'description' => 'Begin etching production process'
            ],
            [
                'name' => 'Quality Control',
                'target_date' => $endDate->modify('-2 days')->format('Y-m-d H:i:s'),
                'status' => 'pending',
                'description' => 'Quality inspection and approval'
            ],
            [
                'name' => 'Packaging & Shipping',
                'target_date' => $endDate->modify('-1 day')->format('Y-m-d H:i:s'),
                'status' => 'pending',
                'description' => 'Final packaging and shipping preparation'
            ]
        ];

        $milestones = !empty($productionMilestones) ? $productionMilestones : $defaultMilestones;
        
        return new self($orderDate, $endDate, $milestones);
    }

    /**
     * Create timeline for vendor negotiation
     */
    public static function forVendorNegotiation(
        DateTimeImmutable $startDate,
        int $negotiationDays = 5
    ): self {
        $endDate = $startDate->modify("+{$negotiationDays} days");
        
        $milestones = [
            [
                'name' => 'Quote Request Sent',
                'target_date' => $startDate->format('Y-m-d H:i:s'),
                'status' => 'completed',
                'description' => 'Initial quote request sent to vendor'
            ],
            [
                'name' => 'Vendor Response Due',
                'target_date' => $startDate->modify('+2 days')->format('Y-m-d H:i:s'),
                'status' => 'pending',
                'description' => 'Vendor should provide initial quote'
            ],
            [
                'name' => 'Negotiation Deadline',
                'target_date' => $endDate->format('Y-m-d H:i:s'),
                'status' => 'pending',
                'description' => 'Final deadline for price negotiation'
            ]
        ];
        
        return new self($startDate, $endDate, $milestones);
    }

    /**
     * Get start date (alias for getCreatedAt for compatibility)
     */
    public function getStartDate(): DateTimeImmutable
    {
        return $this->startDate;
    }

    /**
     * Get created at (alias for getStartDate)
     */
    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->startDate;
    }

    /**
     * Get end date (alias for getUpdatedAt for compatibility)
     */
    public function getEndDate(): DateTimeImmutable
    {
        return $this->endDate;
    }

    /**
     * Get updated at (alias for getEndDate)
     */
    public function getUpdatedAt(): DateTimeImmutable
    {
        return $this->endDate;
    }

    /**
     * Get all milestones
     */
    public function getMilestones(): array
    {
        return $this->milestones;
    }

    /**
     * Get actual completion date
     */
    public function getActualCompletionDate(): ?DateTimeImmutable
    {
        return $this->actualCompletionDate;
    }

    /**
     * Get duration in days
     */
    public function getDurationInDays(): int
    {
        return $this->startDate->diff($this->endDate)->days;
    }

    /**
     * Get remaining days until deadline
     */
    public function getRemainingDays(): int
    {
        $now = new DateTimeImmutable();
        
        if ($now > $this->endDate) {
            return 0; // Overdue
        }
        
        $diff = $now->diff($this->endDate);
        return $diff->days;
    }

    /**
     * Check if timeline is overdue
     */
    public function isOverdue(): bool
    {
        $now = new DateTimeImmutable();
        return $now > $this->endDate && $this->actualCompletionDate === null;
    }

    /**
     * Check if timeline is completed
     */
    public function isCompleted(): bool
    {
        return $this->actualCompletionDate !== null;
    }

    /**
     * Check if timeline is on track
     */
    public function isOnTrack(): bool
    {
        if ($this->isCompleted()) {
            return $this->actualCompletionDate <= $this->endDate;
        }
        
        // Check if current progress aligns with timeline
        $completedMilestones = $this->getCompletedMilestonesCount();
        $totalMilestones = count($this->milestones);
        
        if ($totalMilestones === 0) {
            return !$this->isOverdue();
        }
        
        $expectedProgress = $this->getExpectedProgressPercentage();
        $actualProgress = ($completedMilestones / $totalMilestones) * 100;
        
        // Allow 10% tolerance
        return $actualProgress >= ($expectedProgress - 10);
    }

    /**
     * Mark milestone as completed
     */
    public function completeMilestone(string $milestoneName, ?DateTimeImmutable $completedAt = null): Timeline
    {
        $completedAt = $completedAt ?? new DateTimeImmutable();
        $updatedMilestones = [];
        
        foreach ($this->milestones as $milestone) {
            if ($milestone['name'] === $milestoneName) {
                $milestone['status'] = 'completed';
                $milestone['completed_at'] = $completedAt->format('Y-m-d H:i:s');
            }
            $updatedMilestones[] = $milestone;
        }
        
        return new Timeline(
            $this->startDate,
            $this->endDate,
            $updatedMilestones,
            $this->actualCompletionDate
        );
    }

    /**
     * Mark timeline as completed
     */
    public function markCompleted(?DateTimeImmutable $completedAt = null): Timeline
    {
        $completedAt = $completedAt ?? new DateTimeImmutable();
        
        return new Timeline(
            $this->startDate,
            $this->endDate,
            $this->milestones,
            $completedAt
        );
    }

    /**
     * Get progress percentage
     */
    public function getProgressPercentage(): float
    {
        if (empty($this->milestones)) {
            return $this->isCompleted() ? 100.0 : 0.0;
        }
        
        $completedCount = $this->getCompletedMilestonesCount();
        return ($completedCount / count($this->milestones)) * 100;
    }

    /**
     * Get next pending milestone
     */
    public function getNextMilestone(): ?array
    {
        foreach ($this->milestones as $milestone) {
            if ($milestone['status'] === 'pending') {
                return $milestone;
            }
        }
        
        return null;
    }

    /**
     * Convert to array for database storage
     */
    public function toArray(): array
    {
        return [
            'start_date' => $this->startDate->format('Y-m-d H:i:s'),
            'end_date' => $this->endDate->format('Y-m-d H:i:s'),
            'milestones' => $this->milestones,
            'actual_completion_date' => $this->actualCompletionDate?->format('Y-m-d H:i:s'),
            'duration_days' => $this->getDurationInDays(),
            'progress_percentage' => $this->getProgressPercentage(),
            'is_overdue' => $this->isOverdue(),
            'is_completed' => $this->isCompleted(),
            'is_on_track' => $this->isOnTrack(),
        ];
    }

    /**
     * Create from database array
     */
    public static function fromArray(array $data): self
    {
        $startDate = new DateTimeImmutable($data['start_date']);
        $endDate = new DateTimeImmutable($data['end_date']);
        $milestones = $data['milestones'] ?? [];
        $actualCompletionDate = isset($data['actual_completion_date']) 
            ? new DateTimeImmutable($data['actual_completion_date'])
            : null;
        
        return new self($startDate, $endDate, $milestones, $actualCompletionDate);
    }

    /**
     * Reconstitute timeline from repository data
     */
    public static function reconstitute(
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
        array $milestones = []
    ): self {
        return new self($createdAt, $updatedAt, $milestones);
    }

    private function getCompletedMilestonesCount(): int
    {
        return count(array_filter($this->milestones, fn($m) => $m['status'] === 'completed'));
    }

    private function getExpectedProgressPercentage(): float
    {
        $now = new DateTimeImmutable();
        $totalDuration = $this->startDate->diff($this->endDate)->days;
        
        if ($totalDuration === 0) {
            return 100.0;
        }
        
        $elapsedDays = $this->startDate->diff($now)->days;
        return min(100.0, ($elapsedDays / $totalDuration) * 100);
    }

    private function guardAgainstInvalidDateRange(DateTimeImmutable $startDate, DateTimeImmutable $endDate): void
    {
        if ($startDate >= $endDate) {
            throw new InvalidArgumentException('Start date must be before end date');
        }
    }

    private function guardAgainstInvalidMilestones(array $milestones): void
    {
        foreach ($milestones as $milestone) {
            if (!is_array($milestone)) {
                throw new InvalidArgumentException('Each milestone must be an array');
            }
            
            if (!isset($milestone['name']) || !isset($milestone['target_date']) || !isset($milestone['status'])) {
                throw new InvalidArgumentException('Milestone must have name, target_date, and status');
            }
            
            if (!in_array($milestone['status'], ['pending', 'completed', 'skipped'])) {
                throw new InvalidArgumentException('Milestone status must be pending, completed, or skipped');
            }
        }
    }
}