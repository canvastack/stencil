<?php

namespace App\Domain\Production\ValueObjects;

use DateTimeImmutable;

/**
 * Quality Checkpoint Value Object
 * 
 * Represents a quality control checkpoint in the production process
 * with specific criteria and validation requirements.
 */
final class QualityCheckpoint
{
    /**
     * @param array<string> $criteria
     * @param array<string> $validationMethods
     * @param array<string> $requiredDocumentation
     */
    public function __construct(
        private string $id,
        private string $name,
        private string $description,
        private string $phase,
        private array $criteria,
        private array $validationMethods,
        private array $requiredDocumentation,
        private string $responsibleParty,
        private bool $isMandatory,
        private bool $isCompleted = false,
        private ?DateTimeImmutable $completedAt = null,
        private ?string $result = null,
        private ?string $notes = null
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

    public function getPhase(): string
    {
        return $this->phase;
    }

    public function getCriteria(): array
    {
        return $this->criteria;
    }

    public function getValidationMethods(): array
    {
        return $this->validationMethods;
    }

    public function getRequiredDocumentation(): array
    {
        return $this->requiredDocumentation;
    }

    public function getResponsibleParty(): string
    {
        return $this->responsibleParty;
    }

    public function isMandatory(): bool
    {
        return $this->isMandatory;
    }

    public function isCompleted(): bool
    {
        return $this->isCompleted;
    }

    public function getCompletedAt(): ?DateTimeImmutable
    {
        return $this->completedAt;
    }

    public function getResult(): ?string
    {
        return $this->result;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    /**
     * Check if checkpoint passed quality standards
     */
    public function isPassed(): bool
    {
        return $this->isCompleted && $this->result === 'passed';
    }

    /**
     * Check if checkpoint failed quality standards
     */
    public function isFailed(): bool
    {
        return $this->isCompleted && $this->result === 'failed';
    }

    /**
     * Check if checkpoint requires rework
     */
    public function requiresRework(): bool
    {
        return $this->isCompleted && in_array($this->result, ['failed', 'conditional']);
    }

    /**
     * Get checkpoint status
     */
    public function getStatus(): string
    {
        if (!$this->isCompleted) {
            return 'pending';
        }

        return match($this->result) {
            'passed' => 'passed',
            'failed' => 'failed',
            'conditional' => 'conditional',
            'waived' => 'waived',
            default => 'unknown'
        };
    }

    /**
     * Complete checkpoint with result
     */
    public function complete(string $result, ?string $notes = null): self
    {
        return new self(
            id: $this->id,
            name: $this->name,
            description: $this->description,
            phase: $this->phase,
            criteria: $this->criteria,
            validationMethods: $this->validationMethods,
            requiredDocumentation: $this->requiredDocumentation,
            responsibleParty: $this->responsibleParty,
            isMandatory: $this->isMandatory,
            isCompleted: true,
            completedAt: new DateTimeImmutable(),
            result: $result,
            notes: $notes
        );
    }

    /**
     * Check if checkpoint is critical for production
     */
    public function isCritical(): bool
    {
        return $this->isMandatory && in_array($this->phase, ['design_review', 'final_inspection']);
    }

    /**
     * Check if checkpoint blocks production
     */
    public function blocksProduction(): bool
    {
        return $this->isMandatory && (!$this->isCompleted || $this->result === 'failed');
    }

    /**
     * Get validation complexity
     */
    public function getValidationComplexity(): string
    {
        $complexityScore = count($this->criteria) + count($this->validationMethods) + count($this->requiredDocumentation);

        return match(true) {
            $complexityScore >= 10 => 'very_high',
            $complexityScore >= 7 => 'high',
            $complexityScore >= 4 => 'medium',
            default => 'low'
        };
    }

    /**
     * Get estimated validation time in hours
     */
    public function getEstimatedValidationHours(): int
    {
        $baseHours = 1;
        $criteriaHours = count($this->criteria) * 0.5;
        $methodHours = count($this->validationMethods) * 1;
        $documentationHours = count($this->requiredDocumentation) * 0.5;

        return (int) ceil($baseHours + $criteriaHours + $methodHours + $documentationHours);
    }

    /**
     * Check if checkpoint requires external validation
     */
    public function requiresExternalValidation(): bool
    {
        return in_array('external_audit', $this->validationMethods) ||
               in_array('third_party_inspection', $this->validationMethods) ||
               in_array('customer_approval', $this->validationMethods);
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'phase' => $this->phase,
            'criteria' => $this->criteria,
            'validation_methods' => $this->validationMethods,
            'required_documentation' => $this->requiredDocumentation,
            'responsible_party' => $this->responsibleParty,
            'is_mandatory' => $this->isMandatory,
            'is_completed' => $this->isCompleted,
            'completed_at' => $this->completedAt?->format('Y-m-d H:i:s'),
            'result' => $this->result,
            'notes' => $this->notes,
            'status' => $this->getStatus(),
            'is_critical' => $this->isCritical(),
            'blocks_production' => $this->blocksProduction(),
            'validation_complexity' => $this->getValidationComplexity(),
            'estimated_validation_hours' => $this->getEstimatedValidationHours(),
            'requires_external_validation' => $this->requiresExternalValidation()
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            name: $data['name'],
            description: $data['description'],
            phase: $data['phase'],
            criteria: $data['criteria'],
            validationMethods: $data['validation_methods'],
            requiredDocumentation: $data['required_documentation'],
            responsibleParty: $data['responsible_party'],
            isMandatory: $data['is_mandatory'],
            isCompleted: $data['is_completed'] ?? false,
            completedAt: isset($data['completed_at']) ? new DateTimeImmutable($data['completed_at']) : null,
            result: $data['result'] ?? null,
            notes: $data['notes'] ?? null
        );
    }
}