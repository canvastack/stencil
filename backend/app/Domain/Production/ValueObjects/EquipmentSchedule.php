<?php

namespace App\Domain\Production\ValueObjects;

use DateTimeImmutable;

/**
 * Equipment Schedule Value Object
 * 
 * Represents the schedule for equipment usage with availability
 * tracking and conflict detection.
 */
final class EquipmentSchedule
{
    /**
     * @param array<array> $bookings
     */
    public function __construct(
        private array $bookings
    ) {}

    public function getBookings(): array
    {
        return $this->bookings;
    }

    /**
     * Get bookings for specific equipment
     */
    public function getBookingsForEquipment(string $equipmentName): array
    {
        return array_filter(
            $this->bookings,
            fn(array $booking) => $booking['equipment_name'] === $equipmentName
        );
    }

    /**
     * Get bookings for specific phase
     */
    public function getBookingsForPhase(string $phase): array
    {
        return array_filter(
            $this->bookings,
            fn(array $booking) => $booking['phase'] === $phase
        );
    }

    /**
     * Get critical equipment bookings
     */
    public function getCriticalEquipmentBookings(): array
    {
        $criticalEquipment = ['laser_engraver', 'cnc_machine', 'precision_etcher'];
        
        return array_filter(
            $this->bookings,
            fn(array $booking) => in_array($booking['equipment_name'], $criticalEquipment)
        );
    }

    /**
     * Get unavailable equipment bookings
     */
    public function getUnavailableBookings(): array
    {
        return array_filter(
            $this->bookings,
            fn(array $booking) => $booking['availability_status'] !== 'available'
        );
    }

    /**
     * Get equipment utilization summary
     */
    public function getUtilizationSummary(): array
    {
        $utilization = [];
        
        foreach ($this->bookings as $booking) {
            $equipmentName = $booking['equipment_name'];
            
            if (!isset($utilization[$equipmentName])) {
                $utilization[$equipmentName] = [
                    'equipment_name' => $equipmentName,
                    'total_hours' => 0,
                    'total_bookings' => 0,
                    'phases' => [],
                    'availability_issues' => 0
                ];
            }
            
            $utilization[$equipmentName]['total_hours'] += $booking['utilization_hours'];
            $utilization[$equipmentName]['total_bookings']++;
            
            if (!in_array($booking['phase'], $utilization[$equipmentName]['phases'])) {
                $utilization[$equipmentName]['phases'][] = $booking['phase'];
            }
            
            if ($booking['availability_status'] !== 'available') {
                $utilization[$equipmentName]['availability_issues']++;
            }
        }
        
        return array_values($utilization);
    }

    /**
     * Get equipment conflicts (overlapping bookings)
     */
    public function getConflicts(): array
    {
        $conflicts = [];
        $equipmentBookings = [];

        // Group bookings by equipment
        foreach ($this->bookings as $booking) {
            $equipmentName = $booking['equipment_name'];
            if (!isset($equipmentBookings[$equipmentName])) {
                $equipmentBookings[$equipmentName] = [];
            }
            $equipmentBookings[$equipmentName][] = $booking;
        }

        // Check for overlapping bookings
        foreach ($equipmentBookings as $equipmentName => $bookings) {
            for ($i = 0; $i < count($bookings); $i++) {
                for ($j = $i + 1; $j < count($bookings); $j++) {
                    $booking1 = $bookings[$i];
                    $booking2 = $bookings[$j];
                    
                    if ($this->bookingsOverlap($booking1, $booking2)) {
                        $conflicts[] = [
                            'type' => 'equipment_overlap',
                            'equipment_name' => $equipmentName,
                            'booking1' => [
                                'phase' => $booking1['phase'],
                                'start_date' => $booking1['start_date']->format('Y-m-d H:i:s'),
                                'end_date' => $booking1['end_date']->format('Y-m-d H:i:s')
                            ],
                            'booking2' => [
                                'phase' => $booking2['phase'],
                                'start_date' => $booking2['start_date']->format('Y-m-d H:i:s'),
                                'end_date' => $booking2['end_date']->format('Y-m-d H:i:s')
                            ],
                            'message' => "Equipment {$equipmentName} has overlapping bookings"
                        ];
                    }
                }
            }
        }

        return $conflicts;
    }

    /**
     * Check if two bookings overlap
     */
    private function bookingsOverlap(array $booking1, array $booking2): bool
    {
        return $booking1['start_date'] < $booking2['end_date'] && 
               $booking2['start_date'] < $booking1['end_date'];
    }

    /**
     * Get total equipment hours
     */
    public function getTotalHours(): int
    {
        return array_reduce(
            $this->bookings,
            fn(int $total, array $booking) => $total + $booking['utilization_hours'],
            0
        );
    }

    /**
     * Get equipment with highest utilization
     */
    public function getHighestUtilizationEquipment(): ?array
    {
        $utilization = $this->getUtilizationSummary();
        
        if (empty($utilization)) {
            return null;
        }
        
        usort($utilization, fn($a, $b) => $b['total_hours'] <=> $a['total_hours']);
        
        return $utilization[0];
    }

    /**
     * Get bookings requiring operators
     */
    public function getOperatorRequiredBookings(): array
    {
        return array_filter(
            $this->bookings,
            fn(array $booking) => $booking['operator_required'] === true
        );
    }

    /**
     * Get bookings requiring maintenance
     */
    public function getMaintenanceRequiredBookings(): array
    {
        return array_filter(
            $this->bookings,
            fn(array $booking) => $booking['maintenance_required'] === true
        );
    }

    /**
     * Get total equipment cost
     */
    public function getTotalCost(): int
    {
        return array_reduce(
            $this->bookings,
            fn(int $total, array $booking) => 
                $total + ($booking['cost_per_hour']->getAmount() * $booking['utilization_hours']),
            0
        );
    }

    public function toArray(): array
    {
        return [
            'bookings' => array_map(function($booking) {
                return [
                    'equipment_name' => $booking['equipment_name'],
                    'equipment_type' => $booking['equipment_type'],
                    'phase' => $booking['phase'],
                    'start_date' => $booking['start_date']->format('Y-m-d H:i:s'),
                    'end_date' => $booking['end_date']->format('Y-m-d H:i:s'),
                    'utilization_hours' => $booking['utilization_hours'],
                    'operator_required' => $booking['operator_required'],
                    'setup_time_hours' => $booking['setup_time_hours'],
                    'maintenance_required' => $booking['maintenance_required'],
                    'availability_status' => $booking['availability_status'],
                    'cost_per_hour' => [
                        'amount' => $booking['cost_per_hour']->getAmount(),
                        'currency' => $booking['cost_per_hour']->getCurrency()
                    ]
                ];
            }, $this->bookings),
            'total_bookings' => count($this->bookings),
            'total_hours' => $this->getTotalHours(),
            'total_cost' => $this->getTotalCost(),
            'utilization_summary' => $this->getUtilizationSummary(),
            'critical_equipment_bookings' => count($this->getCriticalEquipmentBookings()),
            'unavailable_bookings' => count($this->getUnavailableBookings()),
            'operator_required_bookings' => count($this->getOperatorRequiredBookings()),
            'maintenance_required_bookings' => count($this->getMaintenanceRequiredBookings()),
            'conflicts' => $this->getConflicts()
        ];
    }
}