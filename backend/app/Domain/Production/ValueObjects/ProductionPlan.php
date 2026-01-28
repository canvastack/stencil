<?php

namespace App\Domain\Production\ValueObjects;

use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Production\ValueObjects\ProductionRequirements;
use App\Domain\Production\ValueObjects\ResourceAllocation;
use App\Domain\Production\ValueObjects\ProductionTimeline;
use App\Domain\Production\ValueObjects\ProductionMilestone;
use App\Domain\Production\ValueObjects\RiskFactor;
use App\Domain\Production\ValueObjects\ContingencyPlan;
use App\Domain\Production\ValueObjects\QualityCheckpoint;
use DateTimeImmutable;

/**
 * Production Plan Value Object
 * 
 * Represents a comprehensive production plan for an order with all necessary
 * components for successful execution and monitoring.
 */
final class ProductionPlan
{
    /**
     * @param array<ProductionMilestone> $milestones
     * @param array<RiskFactor> $riskFactors
     * @param array<ContingencyPlan> $contingencyPlans
     * @param array<QualityCheckpoint> $qualityCheckpoints
     */
    public function __construct(
        private UuidValueObject $orderId,
        private ProductionRequirements $requirements,
        private ResourceAllocation $resources,
        private ProductionTimeline $timeline,
        private array $milestones,
        private array $riskFactors,
        private array $contingencyPlans,
        private array $qualityCheckpoints,
        private DateTimeImmutable $createdAt
    ) {}

    public function getOrderId(): UuidValueObject
    {
        return $this->orderId;
    }

    public function getRequirements(): ProductionRequirements
    {
        return $this->requirements;
    }

    public function getResources(): ResourceAllocation
    {
        return $this->resources;
    }

    public function getTimeline(): ProductionTimeline
    {
        return $this->timeline;
    }

    /**
     * @return array<ProductionMilestone>
     */
    public function getMilestones(): array
    {
        return $this->milestones;
    }

    /**
     * @return array<RiskFactor>
     */
    public function getRiskFactors(): array
    {
        return $this->riskFactors;
    }

    /**
     * @return array<ContingencyPlan>
     */
    public function getContingencyPlans(): array
    {
        return $this->contingencyPlans;
    }

    /**
     * @return array<QualityCheckpoint>
     */
    public function getQualityCheckpoints(): array
    {
        return $this->qualityCheckpoints;
    }

    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    /**
     * Calculate overall progress percentage
     */
    public function calculateProgress(): float
    {
        if (empty($this->milestones)) {
            return 0.0;
        }

        $completedMilestones = array_filter(
            $this->milestones,
            fn(ProductionMilestone $milestone) => $milestone->isCompleted()
        );

        return count($completedMilestones) / count($this->milestones);
    }

    /**
     * Check if production is behind schedule
     */
    public function isBehindSchedule(): bool
    {
        $now = new DateTimeImmutable();
        
        foreach ($this->milestones as $milestone) {
            if (!$milestone->isCompleted() && $milestone->getDueDate() < $now) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get next milestone due
     */
    public function getNextMilestone(): ?ProductionMilestone
    {
        $incompleteMilestones = array_filter(
            $this->milestones,
            fn(ProductionMilestone $milestone) => !$milestone->isCompleted()
        );

        if (empty($incompleteMilestones)) {
            return null;
        }

        usort($incompleteMilestones, fn($a, $b) => $a->getDueDate() <=> $b->getDueDate());

        return $incompleteMilestones[0];
    }

    /**
     * Get critical path milestones
     * 
     * @return array<ProductionMilestone>
     */
    public function getCriticalPathMilestones(): array
    {
        return array_filter(
            $this->milestones,
            fn(ProductionMilestone $milestone) => $milestone->isCritical()
        );
    }

    /**
     * Convert to array for storage in orders.metadata
     */
    public function toArray(): array
    {
        return [
            'order_id' => $this->orderId->getValue(),
            'requirements' => $this->requirements->toArray(),
            'resources' => $this->resources->toArray(),
            'timeline' => $this->timeline->toArray(),
            'milestones' => array_map(fn($m) => $m->toArray(), $this->milestones),
            'risk_factors' => array_map(fn($r) => $r->toArray(), $this->riskFactors),
            'contingency_plans' => array_map(fn($c) => $c->toArray(), $this->contingencyPlans),
            'quality_checkpoints' => array_map(fn($q) => $q->toArray(), $this->qualityCheckpoints),
            'created_at' => $this->createdAt->format('Y-m-d H:i:s')
        ];
    }

    /**
     * Create from array (from orders.metadata)
     */
    public static function fromArray(array $data): self
    {
        return new self(
            orderId: new UuidValueObject($data['order_id']),
            requirements: ProductionRequirements::fromArray($data['requirements']),
            resources: ResourceAllocation::fromArray($data['resources']),
            timeline: ProductionTimeline::fromArray($data['timeline']),
            milestones: array_map(fn($m) => ProductionMilestone::fromArray($m), $data['milestones']),
            riskFactors: array_map(fn($r) => RiskFactor::fromArray($r), $data['risk_factors']),
            contingencyPlans: array_map(fn($c) => ContingencyPlan::fromArray($c), $data['contingency_plans']),
            qualityCheckpoints: array_map(fn($q) => QualityCheckpoint::fromArray($q), $data['quality_checkpoints']),
            createdAt: new DateTimeImmutable($data['created_at'])
        );
    }
}