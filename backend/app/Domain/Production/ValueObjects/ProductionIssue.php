<?php

namespace App\Domain\Production\ValueObjects;

use App\Domain\Production\Enums\IssueType;
use DateTimeImmutable;

/**
 * Production Issue Value Object
 * 
 * Represents a production issue with severity, impact assessment,
 * and recommended actions for resolution.
 */
final class ProductionIssue
{
    /**
     * @param array<string> $recommendations
     */
    public function __construct(
        private IssueType $type,
        private string $severity,
        private string $description,
        private string $impact,
        private array $recommendations,
        private DateTimeImmutable $detectedAt,
        private ?string $id = null,
        private ?DateTimeImmutable $resolvedAt = null,
        private ?string $resolution = null
    ) {
        $this->id = $id ?? uniqid('issue_', true);
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getType(): IssueType
    {
        return $this->type;
    }

    public function getSeverity(): string
    {
        return $this->severity;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function getImpact(): string
    {
        return $this->impact;
    }

    public function getRecommendations(): array
    {
        return $this->recommendations;
    }

    public function getDetectedAt(): DateTimeImmutable
    {
        return $this->detectedAt;
    }

    public function getResolvedAt(): ?DateTimeImmutable
    {
        return $this->resolvedAt;
    }

    public function getResolution(): ?string
    {
        return $this->resolution;
    }

    /**
     * Check if issue is resolved
     */
    public function isResolved(): bool
    {
        return $this->resolvedAt !== null;
    }

    /**
     * Check if issue is critical
     */
    public function isCritical(): bool
    {
        return $this->severity === 'critical';
    }

    /**
     * Check if issue is high priority
     */
    public function isHighPriority(): bool
    {
        return in_array($this->severity, ['critical', 'high']);
    }

    /**
     * Get age of issue in hours
     */
    public function getAgeInHours(): int
    {
        $endTime = $this->resolvedAt ?? new DateTimeImmutable();
        return $this->detectedAt->diff($endTime)->h + ($this->detectedAt->diff($endTime)->days * 24);
    }

    /**
     * Get age of issue in days
     */
    public function getAgeInDays(): int
    {
        $endTime = $this->resolvedAt ?? new DateTimeImmutable();
        return $this->detectedAt->diff($endTime)->days;
    }

    /**
     * Get priority score for sorting
     */
    public function getPriorityScore(): int
    {
        $severityScore = match($this->severity) {
            'critical' => 4,
            'high' => 3,
            'medium' => 2,
            'low' => 1,
            default => 1
        };
        
        $typeScore = match($this->type) {
            IssueType::TIMELINE_DELAY => 3,
            IssueType::QUALITY_ISSUE => 3,
            IssueType::RESOURCE_CONSTRAINT => 2,
            IssueType::VENDOR_ISSUE => 2,
            default => 1
        };
        
        return $severityScore * $typeScore;
    }

    /**
     * Check if issue requires immediate attention
     */
    public function requiresImmediateAttention(): bool
    {
        return $this->isCritical() || 
               ($this->severity === 'high' && $this->type === IssueType::TIMELINE_DELAY);
    }

    /**
     * Get recommended resolution time in hours
     */
    public function getRecommendedResolutionTimeHours(): int
    {
        return match($this->severity) {
            'critical' => 4,   // 4 hours
            'high' => 24,      // 1 day
            'medium' => 72,    // 3 days
            'low' => 168,      // 1 week
            default => 24
        };
    }

    /**
     * Check if issue is overdue for resolution
     */
    public function isOverdueForResolution(): bool
    {
        if ($this->isResolved()) {
            return false;
        }
        
        $recommendedHours = $this->getRecommendedResolutionTimeHours();
        return $this->getAgeInHours() > $recommendedHours;
    }

    /**
     * Resolve issue with resolution details
     */
    public function resolve(string $resolution): self
    {
        return new self(
            type: $this->type,
            severity: $this->severity,
            description: $this->description,
            impact: $this->impact,
            recommendations: $this->recommendations,
            detectedAt: $this->detectedAt,
            id: $this->id,
            resolvedAt: new DateTimeImmutable(),
            resolution: $resolution
        );
    }

    /**
     * Update severity level
     */
    public function updateSeverity(string $newSeverity): self
    {
        return new self(
            type: $this->type,
            severity: $newSeverity,
            description: $this->description,
            impact: $this->impact,
            recommendations: $this->recommendations,
            detectedAt: $this->detectedAt,
            id: $this->id,
            resolvedAt: $this->resolvedAt,
            resolution: $this->resolution
        );
    }

    /**
     * Add recommendation
     */
    public function addRecommendation(string $recommendation): self
    {
        $recommendations = $this->recommendations;
        $recommendations[] = $recommendation;
        
        return new self(
            type: $this->type,
            severity: $this->severity,
            description: $this->description,
            impact: $this->impact,
            recommendations: $recommendations,
            detectedAt: $this->detectedAt,
            id: $this->id,
            resolvedAt: $this->resolvedAt,
            resolution: $this->resolution
        );
    }

    /**
     * Get issue status
     */
    public function getStatus(): string
    {
        if ($this->isResolved()) {
            return 'resolved';
        }
        
        if ($this->isOverdueForResolution()) {
            return 'overdue';
        }
        
        if ($this->requiresImmediateAttention()) {
            return 'urgent';
        }
        
        return 'active';
    }

    /**
     * Get escalation level
     */
    public function getEscalationLevel(): string
    {
        if ($this->isCritical() && $this->getAgeInHours() > 2) {
            return 'executive';
        }
        
        if ($this->isHighPriority() && $this->getAgeInHours() > 8) {
            return 'management';
        }
        
        if ($this->isOverdueForResolution()) {
            return 'supervisor';
        }
        
        return 'team';
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'severity' => $this->severity,
            'description' => $this->description,
            'impact' => $this->impact,
            'recommendations' => $this->recommendations,
            'detected_at' => $this->detectedAt->format('Y-m-d H:i:s'),
            'resolved_at' => $this->resolvedAt?->format('Y-m-d H:i:s'),
            'resolution' => $this->resolution,
            'is_resolved' => $this->isResolved(),
            'is_critical' => $this->isCritical(),
            'is_high_priority' => $this->isHighPriority(),
            'age_in_hours' => $this->getAgeInHours(),
            'age_in_days' => $this->getAgeInDays(),
            'priority_score' => $this->getPriorityScore(),
            'requires_immediate_attention' => $this->requiresImmediateAttention(),
            'recommended_resolution_time_hours' => $this->getRecommendedResolutionTimeHours(),
            'is_overdue_for_resolution' => $this->isOverdueForResolution(),
            'status' => $this->getStatus(),
            'escalation_level' => $this->getEscalationLevel()
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            type: IssueType::from($data['type']),
            severity: $data['severity'],
            description: $data['description'],
            impact: $data['impact'],
            recommendations: $data['recommendations'],
            detectedAt: new DateTimeImmutable($data['detected_at']),
            id: $data['id'],
            resolvedAt: isset($data['resolved_at']) ? new DateTimeImmutable($data['resolved_at']) : null,
            resolution: $data['resolution'] ?? null
        );
    }
}