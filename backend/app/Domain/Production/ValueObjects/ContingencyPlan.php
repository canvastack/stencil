<?php

namespace App\Domain\Production\ValueObjects;

use App\Domain\Shared\ValueObjects\Money;

/**
 * Contingency Plan Value Object
 * 
 * Represents a contingency plan for handling production risks
 * with specific actions and resource requirements.
 */
final class ContingencyPlan
{
    /**
     * @param array<string> $triggerConditions
     * @param array<string> $actions
     * @param array<string> $requiredResources
     */
    public function __construct(
        private string $id,
        private string $name,
        private string $description,
        private array $triggerConditions,
        private array $actions,
        private array $requiredResources,
        private Money $estimatedCost,
        private int $implementationTimeDays,
        private string $priority, // low, medium, high, critical
        private string $responsibleParty,
        private bool $isActivated = false
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

    public function getTriggerConditions(): array
    {
        return $this->triggerConditions;
    }

    public function getActions(): array
    {
        return $this->actions;
    }

    public function getRequiredResources(): array
    {
        return $this->requiredResources;
    }

    public function getEstimatedCost(): Money
    {
        return $this->estimatedCost;
    }

    public function getImplementationTimeDays(): int
    {
        return $this->implementationTimeDays;
    }

    public function getPriority(): string
    {
        return $this->priority;
    }

    public function getResponsibleParty(): string
    {
        return $this->responsibleParty;
    }

    public function isActivated(): bool
    {
        return $this->isActivated;
    }

    /**
     * Check if contingency plan should be triggered
     */
    public function shouldTrigger(array $currentConditions): bool
    {
        if ($this->isActivated) {
            return false; // Already activated
        }

        // Check if any trigger condition is met
        foreach ($this->triggerConditions as $condition) {
            if (in_array($condition, $currentConditions)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get priority score for sorting
     */
    public function getPriorityScore(): int
    {
        return match($this->priority) {
            'critical' => 4,
            'high' => 3,
            'medium' => 2,
            'low' => 1,
            default => 1
        };
    }

    /**
     * Check if plan is high priority
     */
    public function isHighPriority(): bool
    {
        return in_array($this->priority, ['high', 'critical']);
    }

    /**
     * Check if plan is cost-effective (cost < 10% of order value)
     */
    public function isCostEffective(Money $orderValue): bool
    {
        $threshold = $orderValue->multiply(0.1); // 10% of order value
        return $this->estimatedCost->isLessThan($threshold);
    }

    /**
     * Check if plan can be implemented quickly (< 3 days)
     */
    public function canImplementQuickly(): bool
    {
        return $this->implementationTimeDays <= 3;
    }

    /**
     * Activate contingency plan
     */
    public function activate(): self
    {
        return new self(
            id: $this->id,
            name: $this->name,
            description: $this->description,
            triggerConditions: $this->triggerConditions,
            actions: $this->actions,
            requiredResources: $this->requiredResources,
            estimatedCost: $this->estimatedCost,
            implementationTimeDays: $this->implementationTimeDays,
            priority: $this->priority,
            responsibleParty: $this->responsibleParty,
            isActivated: true
        );
    }

    /**
     * Get implementation complexity
     */
    public function getImplementationComplexity(): string
    {
        $resourceCount = count($this->requiredResources);
        $actionCount = count($this->actions);
        
        $complexityScore = $resourceCount + $actionCount + $this->implementationTimeDays;

        return match(true) {
            $complexityScore >= 15 => 'very_high',
            $complexityScore >= 10 => 'high',
            $complexityScore >= 5 => 'medium',
            default => 'low'
        };
    }

    /**
     * Get estimated impact on timeline
     */
    public function getTimelineImpact(): string
    {
        return match(true) {
            $this->implementationTimeDays >= 7 => 'major_delay',
            $this->implementationTimeDays >= 3 => 'minor_delay',
            $this->implementationTimeDays >= 1 => 'minimal_delay',
            default => 'no_delay'
        };
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'trigger_conditions' => $this->triggerConditions,
            'actions' => $this->actions,
            'required_resources' => $this->requiredResources,
            'estimated_cost' => [
                'amount' => $this->estimatedCost->getAmount(),
                'currency' => $this->estimatedCost->getCurrency()
            ],
            'implementation_time_days' => $this->implementationTimeDays,
            'priority' => $this->priority,
            'responsible_party' => $this->responsibleParty,
            'is_activated' => $this->isActivated,
            'priority_score' => $this->getPriorityScore(),
            'implementation_complexity' => $this->getImplementationComplexity(),
            'timeline_impact' => $this->getTimelineImpact()
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            name: $data['name'],
            description: $data['description'],
            triggerConditions: $data['trigger_conditions'],
            actions: $data['actions'],
            requiredResources: $data['required_resources'],
            estimatedCost: new Money($data['estimated_cost']['amount'], $data['estimated_cost']['currency']),
            implementationTimeDays: $data['implementation_time_days'],
            priority: $data['priority'],
            responsibleParty: $data['responsible_party'],
            isActivated: $data['is_activated'] ?? false
        );
    }
}