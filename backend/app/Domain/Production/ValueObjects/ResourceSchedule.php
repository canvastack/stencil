<?php

namespace App\Domain\Production\ValueObjects;

/**
 * Resource Schedule Value Object
 * 
 * Aggregates all resource schedules (materials, equipment, labor)
 * for comprehensive production planning.
 */
final class ResourceSchedule
{
    private ?MaterialSchedule $materialSchedule = null;
    private ?EquipmentSchedule $equipmentSchedule = null;
    private ?LaborSchedule $laborSchedule = null;

    public function addMaterialSchedule(MaterialSchedule $materialSchedule): void
    {
        $this->materialSchedule = $materialSchedule;
    }

    public function addEquipmentSchedule(EquipmentSchedule $equipmentSchedule): void
    {
        $this->equipmentSchedule = $equipmentSchedule;
    }

    public function addLaborSchedule(LaborSchedule $laborSchedule): void
    {
        $this->laborSchedule = $laborSchedule;
    }

    public function getMaterialSchedule(): ?MaterialSchedule
    {
        return $this->materialSchedule;
    }

    public function getEquipmentSchedule(): ?EquipmentSchedule
    {
        return $this->equipmentSchedule;
    }

    public function getLaborSchedule(): ?LaborSchedule
    {
        return $this->laborSchedule;
    }

    /**
     * Check if all schedules are complete
     */
    public function isComplete(): bool
    {
        return $this->materialSchedule !== null &&
               $this->equipmentSchedule !== null &&
               $this->laborSchedule !== null;
    }

    /**
     * Get all schedule conflicts
     */
    public function getConflicts(): array
    {
        $conflicts = [];

        if ($this->materialSchedule) {
            $conflicts = array_merge($conflicts, $this->materialSchedule->getConflicts());
        }

        if ($this->equipmentSchedule) {
            $conflicts = array_merge($conflicts, $this->equipmentSchedule->getConflicts());
        }

        if ($this->laborSchedule) {
            $conflicts = array_merge($conflicts, $this->laborSchedule->getConflicts());
        }

        return $conflicts;
    }

    /**
     * Check if schedule has any conflicts
     */
    public function hasConflicts(): bool
    {
        return !empty($this->getConflicts());
    }

    public function toArray(): array
    {
        return [
            'material_schedule' => $this->materialSchedule?->toArray(),
            'equipment_schedule' => $this->equipmentSchedule?->toArray(),
            'labor_schedule' => $this->laborSchedule?->toArray(),
            'is_complete' => $this->isComplete(),
            'has_conflicts' => $this->hasConflicts(),
            'conflicts' => $this->getConflicts()
        ];
    }
}