<?php

namespace App\Domain\Production\ValueObjects;

use DateTimeImmutable;

/**
 * Material Schedule Value Object
 * 
 * Represents the schedule for material deliveries with supplier
 * coordination and timing optimization.
 */
final class MaterialSchedule
{
    /**
     * @param array<MaterialDelivery> $deliveries
     */
    public function __construct(
        private array $deliveries
    ) {}

    /**
     * @return array<MaterialDelivery>
     */
    public function getDeliveries(): array
    {
        return $this->deliveries;
    }

    /**
     * Get deliveries for a specific date
     */
    public function getDeliveriesForDate(DateTimeImmutable $date): array
    {
        return array_filter(
            $this->deliveries,
            fn(MaterialDelivery $delivery) => $delivery->getExpectedDeliveryDate()->format('Y-m-d') === $date->format('Y-m-d')
        );
    }

    /**
     * Get deliveries by supplier
     */
    public function getDeliveriesBySupplier(string $supplierId): array
    {
        return array_filter(
            $this->deliveries,
            fn(MaterialDelivery $delivery) => $delivery->getSupplierId() === $supplierId
        );
    }

    /**
     * Get critical deliveries (high priority)
     */
    public function getCriticalDeliveries(): array
    {
        return array_filter(
            $this->deliveries,
            fn(MaterialDelivery $delivery) => $delivery->getPriority() === 'critical'
        );
    }

    /**
     * Get overdue deliveries
     */
    public function getOverdueDeliveries(): array
    {
        $now = new DateTimeImmutable();
        
        return array_filter(
            $this->deliveries,
            fn(MaterialDelivery $delivery) => $delivery->getExpectedDeliveryDate() < $now && !$delivery->isDelivered()
        );
    }

    /**
     * Get upcoming deliveries (next 7 days)
     */
    public function getUpcomingDeliveries(): array
    {
        $now = new DateTimeImmutable();
        $nextWeek = $now->modify('+7 days');
        
        return array_filter(
            $this->deliveries,
            fn(MaterialDelivery $delivery) => 
                $delivery->getExpectedDeliveryDate() >= $now && 
                $delivery->getExpectedDeliveryDate() <= $nextWeek &&
                !$delivery->isDelivered()
        );
    }

    /**
     * Get total material cost
     */
    public function getTotalCost(): int
    {
        return array_reduce(
            $this->deliveries,
            fn(int $total, MaterialDelivery $delivery) => $total + $delivery->getCost()->getAmount(),
            0
        );
    }

    /**
     * Get delivery conflicts (same supplier, same day, too many deliveries)
     */
    public function getConflicts(): array
    {
        $conflicts = [];
        $supplierDeliveries = [];

        // Group by supplier and date
        foreach ($this->deliveries as $delivery) {
            $supplierId = $delivery->getSupplierId();
            $date = $delivery->getExpectedDeliveryDate()->format('Y-m-d');
            
            if (!isset($supplierDeliveries[$supplierId])) {
                $supplierDeliveries[$supplierId] = [];
            }
            
            if (!isset($supplierDeliveries[$supplierId][$date])) {
                $supplierDeliveries[$supplierId][$date] = [];
            }
            
            $supplierDeliveries[$supplierId][$date][] = $delivery;
        }

        // Check for conflicts (more than 3 deliveries per supplier per day)
        foreach ($supplierDeliveries as $supplierId => $dateDeliveries) {
            foreach ($dateDeliveries as $date => $deliveries) {
                if (count($deliveries) > 3) {
                    $conflicts[] = [
                        'type' => 'supplier_overload',
                        'supplier_id' => $supplierId,
                        'date' => $date,
                        'delivery_count' => count($deliveries),
                        'message' => "Supplier {$supplierId} has " . count($deliveries) . " deliveries on {$date}"
                    ];
                }
            }
        }

        return $conflicts;
    }

    /**
     * Get earliest delivery date
     */
    public function getEarliestDeliveryDate(): ?DateTimeImmutable
    {
        if (empty($this->deliveries)) {
            return null;
        }

        $dates = array_map(
            fn(MaterialDelivery $delivery) => $delivery->getExpectedDeliveryDate(),
            $this->deliveries
        );

        return min($dates);
    }

    /**
     * Get latest delivery date
     */
    public function getLatestDeliveryDate(): ?DateTimeImmutable
    {
        if (empty($this->deliveries)) {
            return null;
        }

        $dates = array_map(
            fn(MaterialDelivery $delivery) => $delivery->getExpectedDeliveryDate(),
            $this->deliveries
        );

        return max($dates);
    }

    public function toArray(): array
    {
        return [
            'deliveries' => array_map(fn($delivery) => $delivery->toArray(), $this->deliveries),
            'total_deliveries' => count($this->deliveries),
            'total_cost' => $this->getTotalCost(),
            'earliest_delivery' => $this->getEarliestDeliveryDate()?->format('Y-m-d H:i:s'),
            'latest_delivery' => $this->getLatestDeliveryDate()?->format('Y-m-d H:i:s'),
            'critical_deliveries' => count($this->getCriticalDeliveries()),
            'overdue_deliveries' => count($this->getOverdueDeliveries()),
            'upcoming_deliveries' => count($this->getUpcomingDeliveries()),
            'conflicts' => $this->getConflicts()
        ];
    }
}