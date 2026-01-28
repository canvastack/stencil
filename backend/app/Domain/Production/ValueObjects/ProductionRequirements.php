<?php

namespace App\Domain\Production\ValueObjects;

use App\Domain\Shared\ValueObjects\Money;

/**
 * Production Requirements Value Object
 * 
 * Represents the requirements for production based on order specifications
 * and customer needs.
 */
final class ProductionRequirements
{
    /**
     * @param array<string, mixed> $specifications
     * @param array<string, int> $materialRequirements
     * @param array<string> $equipmentNeeded
     * @param array<string> $skillsRequired
     */
    public function __construct(
        private string $productType,
        private array $specifications,
        private int $quantity,
        private string $complexityLevel,
        private array $materialRequirements,
        private array $equipmentNeeded,
        private array $skillsRequired,
        private Money $estimatedCost,
        private int $estimatedHours,
        private string $qualityStandard
    ) {}

    public function getProductType(): string
    {
        return $this->productType;
    }

    public function getSpecifications(): array
    {
        return $this->specifications;
    }

    public function getQuantity(): int
    {
        return $this->quantity;
    }

    public function getComplexityLevel(): string
    {
        return $this->complexityLevel;
    }

    public function getMaterialRequirements(): array
    {
        return $this->materialRequirements;
    }

    public function getEquipmentNeeded(): array
    {
        return $this->equipmentNeeded;
    }

    public function getSkillsRequired(): array
    {
        return $this->skillsRequired;
    }

    public function getEstimatedCost(): Money
    {
        return $this->estimatedCost;
    }

    public function getEstimatedHours(): int
    {
        return $this->estimatedHours;
    }

    public function getQualityStandard(): string
    {
        return $this->qualityStandard;
    }

    /**
     * Check if requirements are high complexity
     */
    public function isHighComplexity(): bool
    {
        return in_array($this->complexityLevel, ['high', 'very_high']);
    }

    /**
     * Check if special equipment is required
     */
    public function requiresSpecialEquipment(): bool
    {
        $specialEquipment = ['laser_engraver', 'cnc_machine', 'precision_etcher'];
        
        return !empty(array_intersect($this->equipmentNeeded, $specialEquipment));
    }

    /**
     * Check if specialized skills are required
     */
    public function requiresSpecializedSkills(): bool
    {
        $specializedSkills = ['precision_etching', 'artistic_design', 'technical_drawing'];
        
        return !empty(array_intersect($this->skillsRequired, $specializedSkills));
    }

    /**
     * Get estimated production time in days
     */
    public function getEstimatedProductionDays(): int
    {
        // Base calculation: 8 hours per day
        $baseDays = ceil($this->estimatedHours / 8);
        
        // Add complexity multiplier
        $complexityMultiplier = match($this->complexityLevel) {
            'low' => 1.0,
            'medium' => 1.2,
            'high' => 1.5,
            'very_high' => 2.0,
            default => 1.0
        };
        
        return (int) ceil($baseDays * $complexityMultiplier);
    }

    public function toArray(): array
    {
        return [
            'product_type' => $this->productType,
            'specifications' => $this->specifications,
            'quantity' => $this->quantity,
            'complexity_level' => $this->complexityLevel,
            'material_requirements' => $this->materialRequirements,
            'equipment_needed' => $this->equipmentNeeded,
            'skills_required' => $this->skillsRequired,
            'estimated_cost' => [
                'amount' => $this->estimatedCost->getAmount(),
                'currency' => $this->estimatedCost->getCurrency()
            ],
            'estimated_hours' => $this->estimatedHours,
            'quality_standard' => $this->qualityStandard
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            productType: $data['product_type'],
            specifications: $data['specifications'],
            quantity: $data['quantity'],
            complexityLevel: $data['complexity_level'],
            materialRequirements: $data['material_requirements'],
            equipmentNeeded: $data['equipment_needed'],
            skillsRequired: $data['skills_required'],
            estimatedCost: new Money($data['estimated_cost']['amount'], $data['estimated_cost']['currency']),
            estimatedHours: $data['estimated_hours'],
            qualityStandard: $data['quality_standard']
        );
    }
}