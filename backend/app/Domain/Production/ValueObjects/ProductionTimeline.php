<?php

namespace App\Domain\Production\ValueObjects;

use DateTimeImmutable;
use DateInterval;

/**
 * Production Timeline Value Object
 * 
 * Represents the timeline for production with phases, critical path,
 * and buffer time calculations.
 */
final class ProductionTimeline
{
    /**
     * @param array<ProductionPhase> $phases
     * @param array<string> $criticalPath
     */
    public function __construct(
        private DateTimeImmutable $startDate,
        private DateTimeImmutable $endDate,
        private array $phases,
        private DateInterval $bufferTime,
        private array $criticalPath
    ) {}

    public function getStartDate(): DateTimeImmutable
    {
        return $this->startDate;
    }

    public function getEndDate(): DateTimeImmutable
    {
        return $this->endDate;
    }

    public function getPhases(): array
    {
        return $this->phases;
    }

    public function getBufferTime(): DateInterval
    {
        return $this->bufferTime;
    }

    public function getCriticalPath(): array
    {
        return $this->criticalPath;
    }

    /**
     * Get total duration in days
     */
    public function getTotalDurationDays(): int
    {
        return $this->startDate->diff($this->endDate)->days;
    }

    /**
     * Get phase by name
     */
    public function getPhase(string $phaseName): ?ProductionPhase
    {
        foreach ($this->phases as $phase) {
            if ($phase->getName() === $phaseName) {
                return $phase;
            }
        }

        return null;
    }

    /**
     * Get phase start date
     */
    public function getPhaseStartDate(string $phaseName): ?DateTimeImmutable
    {
        $phase = $this->getPhase($phaseName);
        return $phase?->getStartDate();
    }

    /**
     * Get current phase based on current date
     */
    public function getCurrentPhase(): ?ProductionPhase
    {
        $now = new DateTimeImmutable();

        foreach ($this->phases as $phase) {
            if ($phase->getStartDate() <= $now && $phase->getEndDate() >= $now) {
                return $phase;
            }
        }

        return null;
    }

    /**
     * Get next phase
     */
    public function getNextPhase(): ?ProductionPhase
    {
        $now = new DateTimeImmutable();

        foreach ($this->phases as $phase) {
            if ($phase->getStartDate() > $now) {
                return $phase;
            }
        }

        return null;
    }

    /**
     * Check if timeline is on track
     */
    public function isOnTrack(): bool
    {
        $currentPhase = $this->getCurrentPhase();
        
        if (!$currentPhase) {
            return true; // No current phase means either not started or completed
        }

        // Check if current phase is progressing as expected
        return $currentPhase->isOnTrack();
    }

    /**
     * Calculate progress percentage
     */
    public function calculateProgress(): float
    {
        $now = new DateTimeImmutable();
        
        if ($now < $this->startDate) {
            return 0.0;
        }
        
        if ($now > $this->endDate) {
            return 1.0;
        }

        $totalDuration = $this->startDate->diff($this->endDate)->days;
        $elapsedDuration = $this->startDate->diff($now)->days;

        return $totalDuration > 0 ? $elapsedDuration / $totalDuration : 0.0;
    }

    /**
     * Get critical path duration
     */
    public function getCriticalPathDuration(): int
    {
        $totalDuration = 0;

        foreach ($this->criticalPath as $phaseName) {
            $phase = $this->getPhase($phaseName);
            if ($phase) {
                $totalDuration += $phase->getDurationDays();
            }
        }

        return $totalDuration;
    }

    /**
     * Check if there are delays in critical path
     */
    public function hasCriticalPathDelays(): bool
    {
        foreach ($this->criticalPath as $phaseName) {
            $phase = $this->getPhase($phaseName);
            if ($phase && $phase->isDelayed()) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get buffer time in days
     */
    public function getBufferTimeDays(): int
    {
        return $this->bufferTime->days;
    }

    public function toArray(): array
    {
        return [
            'start_date' => $this->startDate->format('Y-m-d H:i:s'),
            'end_date' => $this->endDate->format('Y-m-d H:i:s'),
            'phases' => array_map(fn($phase) => $phase->toArray(), $this->phases),
            'buffer_time_days' => $this->bufferTime->days,
            'critical_path' => $this->criticalPath
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            startDate: new DateTimeImmutable($data['start_date']),
            endDate: new DateTimeImmutable($data['end_date']),
            phases: array_map(fn($phase) => ProductionPhase::fromArray($phase), $data['phases']),
            bufferTime: new DateInterval('P' . $data['buffer_time_days'] . 'D'),
            criticalPath: $data['critical_path']
        );
    }
}

/**
 * Production Phase Value Object
 */
final class ProductionPhase
{
    public function __construct(
        private string $name,
        private string $description,
        private DateTimeImmutable $startDate,
        private DateTimeImmutable $endDate,
        private array $dependencies,
        private bool $isCritical,
        private float $progress = 0.0
    ) {}

    public function getName(): string
    {
        return $this->name;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function getStartDate(): DateTimeImmutable
    {
        return $this->startDate;
    }

    public function getEndDate(): DateTimeImmutable
    {
        return $this->endDate;
    }

    public function getDependencies(): array
    {
        return $this->dependencies;
    }

    public function isCritical(): bool
    {
        return $this->isCritical;
    }

    public function getProgress(): float
    {
        return $this->progress;
    }

    public function getDurationDays(): int
    {
        return $this->startDate->diff($this->endDate)->days;
    }

    public function isOnTrack(): bool
    {
        $now = new DateTimeImmutable();
        
        if ($now < $this->startDate) {
            return true; // Not started yet
        }
        
        if ($now > $this->endDate) {
            return $this->progress >= 1.0; // Should be completed
        }

        // Calculate expected progress
        $totalDuration = $this->getDurationDays();
        $elapsedDuration = $this->startDate->diff($now)->days;
        $expectedProgress = $totalDuration > 0 ? $elapsedDuration / $totalDuration : 0.0;

        // Allow 10% tolerance
        return $this->progress >= ($expectedProgress - 0.1);
    }

    public function isDelayed(): bool
    {
        return !$this->isOnTrack();
    }

    public function isCompleted(): bool
    {
        return $this->progress >= 1.0;
    }

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'description' => $this->description,
            'start_date' => $this->startDate->format('Y-m-d H:i:s'),
            'end_date' => $this->endDate->format('Y-m-d H:i:s'),
            'dependencies' => $this->dependencies,
            'is_critical' => $this->isCritical,
            'progress' => $this->progress
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            description: $data['description'],
            startDate: new DateTimeImmutable($data['start_date']),
            endDate: new DateTimeImmutable($data['end_date']),
            dependencies: $data['dependencies'],
            isCritical: $data['is_critical'],
            progress: $data['progress'] ?? 0.0
        );
    }
}