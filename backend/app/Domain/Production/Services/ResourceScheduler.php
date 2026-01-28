<?php

namespace App\Domain\Production\Services;

use App\Domain\Production\ValueObjects\ResourceAllocation;
use App\Domain\Production\ValueObjects\ProductionTimeline;
use App\Domain\Production\ValueObjects\ResourceSchedule;
use App\Domain\Production\ValueObjects\MaterialSchedule;
use App\Domain\Production\ValueObjects\EquipmentSchedule;
use App\Domain\Production\ValueObjects\LaborSchedule;
use App\Domain\Production\ValueObjects\MaterialDelivery;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Domain\Shared\ValueObjects\Money;
use DateTimeImmutable;
use DateInterval;

/**
 * Resource Scheduler Service
 * 
 * Handles scheduling of all production resources including materials,
 * equipment, labor, and facilities with optimal timing and availability.
 * 
 * Integrates with existing database tables:
 * - vendors table for supplier lead times and availability
 * - orders table for production requirements
 */
class ResourceScheduler
{
    public function __construct(
        private VendorRepositoryInterface $vendorRepository
    ) {}

    /**
     * Schedule all resources for production
     */
    public function scheduleResources(
        ResourceAllocation $resources,
        ProductionTimeline $timeline
    ): ResourceSchedule {
        
        $schedule = new ResourceSchedule();
        
        // Schedule materials delivery with vendor lead times
        $materialSchedule = $this->scheduleMaterialDelivery($resources->getMaterials(), $timeline);
        $schedule->addMaterialSchedule($materialSchedule);
        
        // Schedule equipment allocation with availability checks
        $equipmentSchedule = $this->scheduleEquipmentAllocation($resources->getEquipment(), $timeline);
        $schedule->addEquipmentSchedule($equipmentSchedule);
        
        // Schedule labor assignments with skill matching
        $laborSchedule = $this->scheduleLaborAssignments($resources->getLabor(), $timeline);
        $schedule->addLaborSchedule($laborSchedule);
        
        // Validate schedule conflicts
        $this->validateScheduleConflicts($schedule);
        
        return $schedule;
    }

    /**
     * Schedule material delivery based on vendor lead times
     */
    private function scheduleMaterialDelivery(array $materials, ProductionTimeline $timeline): MaterialSchedule
    {
        $deliverySchedule = [];
        
        foreach ($materials as $materialName => $material) {
            // Get supplier information from vendors table
            $supplierId = $material['supplier_id'] ?? null;
            $supplier = $supplierId ? $this->vendorRepository->findById($supplierId) : null;
            
            // Use vendors.lead_time for supplier lead time (in days)
            $leadTimeDays = $supplier ? $supplier->getLeadTime() : 7; // Default 7 days
            $leadTime = new DateInterval('P' . $leadTimeDays . 'D');
            
            // Determine when material is needed based on production phase
            $requiredPhase = $material['required_phase'] ?? 'preparation';
            $requiredDate = $timeline->getPhaseStartDate($requiredPhase) ?? $timeline->getStartDate();
            
            // Calculate order date (required date minus lead time)
            $orderDate = $requiredDate->sub($leadTime);
            
            // Ensure order date is not in the past
            $now = new DateTimeImmutable();
            if ($orderDate < $now) {
                $orderDate = $now;
                // Recalculate delivery date
                $expectedDeliveryDate = $orderDate->add($leadTime);
            } else {
                $expectedDeliveryDate = $requiredDate;
            }
            
            $deliverySchedule[] = new MaterialDelivery(
                materialName: $materialName,
                materialType: $material['type'] ?? 'raw_material',
                quantity: $material['quantity'] ?? 1,
                unit: $material['unit'] ?? 'pcs',
                supplierId: $supplierId,
                supplierName: $supplier?->getName() ?? 'Unknown Supplier',
                orderDate: $orderDate,
                expectedDeliveryDate: $expectedDeliveryDate,
                cost: new Money($material['cost']['amount'] ?? 0, $material['cost']['currency'] ?? 'IDR'),
                priority: $material['priority'] ?? 'normal',
                specifications: $material['specifications'] ?? [],
                qualityRequirements: $material['quality_requirements'] ?? []
            );
        }
        
        // Sort by order date
        usort($deliverySchedule, fn($a, $b) => $a->getOrderDate() <=> $b->getOrderDate());
        
        return new MaterialSchedule($deliverySchedule);
    }

    /**
     * Schedule equipment allocation with availability checks
     */
    private function scheduleEquipmentAllocation(array $equipment, ProductionTimeline $timeline): EquipmentSchedule
    {
        $equipmentSchedule = [];
        
        foreach ($equipment as $equipmentName => $equipmentItem) {
            $phases = $this->determineEquipmentPhases($equipmentName, $equipmentItem, $timeline);
            
            foreach ($phases as $phase) {
                $startDate = $timeline->getPhaseStartDate($phase['phase_name']) ?? $timeline->getStartDate();
                $duration = new DateInterval('P' . ($phase['duration_days'] ?? 1) . 'D');
                $endDate = $startDate->add($duration);
                
                $equipmentSchedule[] = [
                    'equipment_name' => $equipmentName,
                    'equipment_type' => $equipmentItem['type'] ?? 'general',
                    'phase' => $phase['phase_name'],
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'utilization_hours' => $phase['hours'] ?? 8,
                    'operator_required' => $equipmentItem['operator_required'] ?? false,
                    'setup_time_hours' => $equipmentItem['setup_time_hours'] ?? 1,
                    'maintenance_required' => $equipmentItem['maintenance_required'] ?? false,
                    'availability_status' => $this->checkEquipmentAvailability($equipmentName, $startDate, $endDate),
                    'cost_per_hour' => new Money($equipmentItem['cost_per_hour']['amount'] ?? 0, $equipmentItem['cost_per_hour']['currency'] ?? 'IDR')
                ];
            }
        }
        
        return new EquipmentSchedule($equipmentSchedule);
    }

    /**
     * Schedule labor assignments with skill matching
     */
    private function scheduleLaborAssignments(array $labor, ProductionTimeline $timeline): LaborSchedule
    {
        $laborSchedule = [];
        
        foreach ($labor as $role => $laborItem) {
            $phases = $this->determineLaborPhases($role, $laborItem, $timeline);
            
            foreach ($phases as $phase) {
                $startDate = $timeline->getPhaseStartDate($phase['phase_name']) ?? $timeline->getStartDate();
                $duration = new DateInterval('P' . ($phase['duration_days'] ?? 1) . 'D');
                $endDate = $startDate->add($duration);
                
                $laborSchedule[] = [
                    'role' => $role,
                    'skill_level' => $laborItem['skill_level'] ?? 'intermediate',
                    'required_skills' => $laborItem['required_skills'] ?? [],
                    'phase' => $phase['phase_name'],
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'hours_per_day' => $phase['hours_per_day'] ?? 8,
                    'total_hours' => $phase['total_hours'] ?? 8,
                    'number_of_workers' => $laborItem['number_of_workers'] ?? 1,
                    'hourly_rate' => new Money($laborItem['hourly_rate']['amount'] ?? 0, $laborItem['hourly_rate']['currency'] ?? 'IDR'),
                    'overtime_allowed' => $laborItem['overtime_allowed'] ?? false,
                    'availability_status' => $this->checkLaborAvailability($role, $startDate, $endDate)
                ];
            }
        }
        
        return new LaborSchedule($laborSchedule);
    }

    /**
     * Determine which phases require specific equipment
     */
    private function determineEquipmentPhases(string $equipmentName, array $equipmentItem, ProductionTimeline $timeline): array
    {
        // Default phase mapping based on equipment type
        $phaseMapping = [
            'laser_engraver' => [
                ['phase_name' => 'engraving', 'duration_days' => 2, 'hours' => 16]
            ],
            'cnc_machine' => [
                ['phase_name' => 'machining', 'duration_days' => 3, 'hours' => 24]
            ],
            'precision_etcher' => [
                ['phase_name' => 'etching', 'duration_days' => 1, 'hours' => 8]
            ],
            'polishing_equipment' => [
                ['phase_name' => 'finishing', 'duration_days' => 1, 'hours' => 4]
            ]
        ];
        
        $equipmentType = $equipmentItem['type'] ?? $equipmentName;
        
        return $phaseMapping[$equipmentType] ?? [
            ['phase_name' => 'production', 'duration_days' => 1, 'hours' => 8]
        ];
    }

    /**
     * Determine which phases require specific labor roles
     */
    private function determineLaborPhases(string $role, array $laborItem, ProductionTimeline $timeline): array
    {
        // Default phase mapping based on labor role
        $phaseMapping = [
            'design_engineer' => [
                ['phase_name' => 'design', 'duration_days' => 2, 'hours_per_day' => 8, 'total_hours' => 16]
            ],
            'production_operator' => [
                ['phase_name' => 'production', 'duration_days' => 3, 'hours_per_day' => 8, 'total_hours' => 24]
            ],
            'quality_inspector' => [
                ['phase_name' => 'quality_control', 'duration_days' => 1, 'hours_per_day' => 4, 'total_hours' => 4]
            ],
            'finishing_specialist' => [
                ['phase_name' => 'finishing', 'duration_days' => 1, 'hours_per_day' => 6, 'total_hours' => 6]
            ]
        ];
        
        return $phaseMapping[$role] ?? [
            ['phase_name' => 'production', 'duration_days' => 1, 'hours_per_day' => 8, 'total_hours' => 8]
        ];
    }

    /**
     * Check equipment availability for given time period
     */
    private function checkEquipmentAvailability(string $equipmentName, DateTimeImmutable $startDate, DateTimeImmutable $endDate): string
    {
        // In a real implementation, this would check against equipment booking system
        // For now, we'll simulate availability based on equipment type
        
        $criticalEquipment = ['laser_engraver', 'cnc_machine', 'precision_etcher'];
        
        if (in_array($equipmentName, $criticalEquipment)) {
            // Critical equipment has 70% availability
            return rand(1, 10) <= 7 ? 'available' : 'busy';
        }
        
        // General equipment has 90% availability
        return rand(1, 10) <= 9 ? 'available' : 'busy';
    }

    /**
     * Check labor availability for given time period
     */
    private function checkLaborAvailability(string $role, DateTimeImmutable $startDate, DateTimeImmutable $endDate): string
    {
        // In a real implementation, this would check against staff scheduling system
        // For now, we'll simulate availability based on role specialization
        
        $specializedRoles = ['design_engineer', 'quality_inspector', 'finishing_specialist'];
        
        if (in_array($role, $specializedRoles)) {
            // Specialized roles have 60% availability
            return rand(1, 10) <= 6 ? 'available' : 'busy';
        }
        
        // General roles have 80% availability
        return rand(1, 10) <= 8 ? 'available' : 'busy';
    }

    /**
     * Validate schedule for conflicts and constraints
     */
    private function validateScheduleConflicts(ResourceSchedule $schedule): void
    {
        // Check for material delivery conflicts
        $this->validateMaterialDeliveryConflicts($schedule->getMaterialSchedule());
        
        // Check for equipment booking conflicts
        $this->validateEquipmentConflicts($schedule->getEquipmentSchedule());
        
        // Check for labor assignment conflicts
        $this->validateLaborConflicts($schedule->getLaborSchedule());
    }

    /**
     * Validate material delivery conflicts
     */
    private function validateMaterialDeliveryConflicts(MaterialSchedule $materialSchedule): void
    {
        $deliveries = $materialSchedule->getDeliveries();
        
        // Group by supplier to check for delivery capacity
        $supplierDeliveries = [];
        foreach ($deliveries as $delivery) {
            $supplierId = $delivery->getSupplierId();
            if ($supplierId) {
                $supplierDeliveries[$supplierId][] = $delivery;
            }
        }
        
        // Check if any supplier has too many deliveries on the same day
        foreach ($supplierDeliveries as $supplierId => $supplierDeliveryList) {
            $deliveryDates = [];
            foreach ($supplierDeliveryList as $delivery) {
                $dateKey = $delivery->getExpectedDeliveryDate()->format('Y-m-d');
                $deliveryDates[$dateKey] = ($deliveryDates[$dateKey] ?? 0) + 1;
            }
            
            foreach ($deliveryDates as $date => $count) {
                if ($count > 3) { // Max 3 deliveries per supplier per day
                    // In a real implementation, this would trigger rescheduling
                    error_log("Warning: Supplier {$supplierId} has {$count} deliveries on {$date}");
                }
            }
        }
    }

    /**
     * Validate equipment booking conflicts
     */
    private function validateEquipmentConflicts(EquipmentSchedule $equipmentSchedule): void
    {
        $bookings = $equipmentSchedule->getBookings();
        
        // Group by equipment name to check for overlapping bookings
        $equipmentBookings = [];
        foreach ($bookings as $booking) {
            $equipmentName = $booking['equipment_name'];
            $equipmentBookings[$equipmentName][] = $booking;
        }
        
        // Check for overlapping time periods
        foreach ($equipmentBookings as $equipmentName => $bookingList) {
            for ($i = 0; $i < count($bookingList); $i++) {
                for ($j = $i + 1; $j < count($bookingList); $j++) {
                    $booking1 = $bookingList[$i];
                    $booking2 = $bookingList[$j];
                    
                    if ($this->timePeriodsOverlap(
                        $booking1['start_date'], $booking1['end_date'],
                        $booking2['start_date'], $booking2['end_date']
                    )) {
                        error_log("Warning: Equipment {$equipmentName} has overlapping bookings");
                    }
                }
            }
        }
    }

    /**
     * Validate labor assignment conflicts
     */
    private function validateLaborConflicts(LaborSchedule $laborSchedule): void
    {
        $assignments = $laborSchedule->getAssignments();
        
        // Group by role to check for over-allocation
        $roleAssignments = [];
        foreach ($assignments as $assignment) {
            $role = $assignment['role'];
            $roleAssignments[$role][] = $assignment;
        }
        
        // Check for overlapping assignments that exceed available workers
        foreach ($roleAssignments as $role => $assignmentList) {
            // In a real implementation, this would check against actual staff availability
            $maxConcurrentWorkers = 2; // Assume max 2 workers per role
            
            // Check for time period overlaps
            for ($i = 0; $i < count($assignmentList); $i++) {
                $concurrentCount = 1;
                $assignment1 = $assignmentList[$i];
                
                for ($j = $i + 1; $j < count($assignmentList); $j++) {
                    $assignment2 = $assignmentList[$j];
                    
                    if ($this->timePeriodsOverlap(
                        $assignment1['start_date'], $assignment1['end_date'],
                        $assignment2['start_date'], $assignment2['end_date']
                    )) {
                        $concurrentCount++;
                    }
                }
                
                if ($concurrentCount > $maxConcurrentWorkers) {
                    error_log("Warning: Role {$role} has {$concurrentCount} concurrent assignments (max: {$maxConcurrentWorkers})");
                }
            }
        }
    }

    /**
     * Check if two time periods overlap
     */
    private function timePeriodsOverlap(
        DateTimeImmutable $start1, DateTimeImmutable $end1,
        DateTimeImmutable $start2, DateTimeImmutable $end2
    ): bool {
        return $start1 < $end2 && $start2 < $end1;
    }
}