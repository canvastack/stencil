<?php

namespace App\Domain\Production\ValueObjects;

use App\Domain\Shared\ValueObjects\Money;

/**
 * Resource Allocation Value Object
 * 
 * Represents the allocation of resources (materials, equipment, labor, facilities)
 * for production execution.
 */
final class ResourceAllocation
{
    /**
     * @param array<string, mixed> $materials
     * @param array<string, mixed> $equipment
     * @param array<string, mixed> $labor
     * @param array<string, mixed> $facilities
     * @param array<string, mixed> $tooling
     */
    public function __construct(
        private array $materials,
        private array $equipment,
        private array $labor,
        private array $facilities,
        private array $tooling,
        private Money $totalCost,
        private float $utilizationRate
    ) {}

    public function getMaterials(): array
    {
        return $this->materials;
    }

    public function getEquipment(): array
    {
        return $this->equipment;
    }

    public function getLabor(): array
    {
        return $this->labor;
    }

    public function getFacilities(): array
    {
        return $this->facilities;
    }

    public function getTooling(): array
    {
        return $this->tooling;
    }

    public function getTotalCost(): Money
    {
        return $this->totalCost;
    }

    public function getUtilizationRate(): float
    {
        return $this->utilizationRate;
    }

    /**
     * Check if resource allocation is optimal (>80% utilization)
     */
    public function isOptimal(): bool
    {
        return $this->utilizationRate >= 0.8;
    }

    /**
     * Get material cost breakdown
     */
    public function getMaterialCost(): Money
    {
        $totalAmount = 0;
        $currency = 'IDR';

        foreach ($this->materials as $material) {
            if (isset($material['cost'])) {
                $totalAmount += $material['cost']['amount'];
                $currency = $material['cost']['currency'];
            }
        }

        return new Money($totalAmount, $currency);
    }

    /**
     * Get labor cost breakdown
     */
    public function getLaborCost(): Money
    {
        $totalAmount = 0;
        $currency = 'IDR';

        foreach ($this->labor as $laborItem) {
            if (isset($laborItem['cost'])) {
                $totalAmount += $laborItem['cost']['amount'];
                $currency = $laborItem['cost']['currency'];
            }
        }

        return new Money($totalAmount, $currency);
    }

    /**
     * Get equipment cost breakdown
     */
    public function getEquipmentCost(): Money
    {
        $totalAmount = 0;
        $currency = 'IDR';

        foreach ($this->equipment as $equipmentItem) {
            if (isset($equipmentItem['cost'])) {
                $totalAmount += $equipmentItem['cost']['amount'];
                $currency = $equipmentItem['cost']['currency'];
            }
        }

        return new Money($totalAmount, $currency);
    }

    /**
     * Check if critical resources are available
     */
    public function hasCriticalResourcesAvailable(): bool
    {
        // Check if all critical equipment is available
        foreach ($this->equipment as $equipmentItem) {
            if (isset($equipmentItem['critical']) && $equipmentItem['critical'] && 
                (!isset($equipmentItem['available']) || !$equipmentItem['available'])) {
                return false;
            }
        }

        // Check if critical materials are available
        foreach ($this->materials as $material) {
            if (isset($material['critical']) && $material['critical'] && 
                (!isset($material['available']) || !$material['available'])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get resource constraints
     */
    public function getConstraints(): array
    {
        $constraints = [];

        // Equipment constraints
        foreach ($this->equipment as $name => $equipmentItem) {
            if (isset($equipmentItem['constraint'])) {
                $constraints[] = [
                    'type' => 'equipment',
                    'resource' => $name,
                    'constraint' => $equipmentItem['constraint']
                ];
            }
        }

        // Labor constraints
        foreach ($this->labor as $role => $laborItem) {
            if (isset($laborItem['constraint'])) {
                $constraints[] = [
                    'type' => 'labor',
                    'resource' => $role,
                    'constraint' => $laborItem['constraint']
                ];
            }
        }

        return $constraints;
    }

    public function toArray(): array
    {
        return [
            'materials' => $this->materials,
            'equipment' => $this->equipment,
            'labor' => $this->labor,
            'facilities' => $this->facilities,
            'tooling' => $this->tooling,
            'total_cost' => [
                'amount' => $this->totalCost->getAmount(),
                'currency' => $this->totalCost->getCurrency()
            ],
            'utilization_rate' => $this->utilizationRate
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            materials: $data['materials'],
            equipment: $data['equipment'],
            labor: $data['labor'],
            facilities: $data['facilities'],
            tooling: $data['tooling'],
            totalCost: new Money($data['total_cost']['amount'], $data['total_cost']['currency']),
            utilizationRate: $data['utilization_rate']
        );
    }
}