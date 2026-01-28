<?php

namespace App\Domain\Production\ValueObjects;

use App\Domain\Shared\ValueObjects\Money;
use DateTimeImmutable;

/**
 * Material Delivery Value Object
 * 
 * Represents a scheduled material delivery with supplier information,
 * timing, and quality requirements.
 */
final class MaterialDelivery
{
    /**
     * @param array<string, mixed> $specifications
     * @param array<string> $qualityRequirements
     */
    public function __construct(
        private string $materialName,
        private string $materialType,
        private int $quantity,
        private string $unit,
        private ?string $supplierId,
        private string $supplierName,
        private DateTimeImmutable $orderDate,
        private DateTimeImmutable $expectedDeliveryDate,
        private Money $cost,
        private string $priority, // normal, high, critical
        private array $specifications,
        private array $qualityRequirements,
        private bool $isDelivered = false,
        private ?DateTimeImmutable $actualDeliveryDate = null,
        private ?string $deliveryStatus = null
    ) {}

    public function getMaterialName(): string
    {
        return $this->materialName;
    }

    public function getMaterialType(): string
    {
        return $this->materialType;
    }

    public function getQuantity(): int
    {
        return $this->quantity;
    }

    public function getUnit(): string
    {
        return $this->unit;
    }

    public function getSupplierId(): ?string
    {
        return $this->supplierId;
    }

    public function getSupplierName(): string
    {
        return $this->supplierName;
    }

    public function getOrderDate(): DateTimeImmutable
    {
        return $this->orderDate;
    }

    public function getExpectedDeliveryDate(): DateTimeImmutable
    {
        return $this->expectedDeliveryDate;
    }

    public function getCost(): Money
    {
        return $this->cost;
    }

    public function getPriority(): string
    {
        return $this->priority;
    }

    public function getSpecifications(): array
    {
        return $this->specifications;
    }

    public function getQualityRequirements(): array
    {
        return $this->qualityRequirements;
    }

    public function isDelivered(): bool
    {
        return $this->isDelivered;
    }

    public function getActualDeliveryDate(): ?DateTimeImmutable
    {
        return $this->actualDeliveryDate;
    }

    public function getDeliveryStatus(): ?string
    {
        return $this->deliveryStatus;
    }

    /**
     * Check if delivery is overdue
     */
    public function isOverdue(): bool
    {
        if ($this->isDelivered) {
            return false;
        }

        return new DateTimeImmutable() > $this->expectedDeliveryDate;
    }

    /**
     * Check if delivery is critical priority
     */
    public function isCritical(): bool
    {
        return $this->priority === 'critical';
    }

    /**
     * Check if delivery is high priority
     */
    public function isHighPriority(): bool
    {
        return in_array($this->priority, ['high', 'critical']);
    }

    /**
     * Get days until delivery
     */
    public function getDaysUntilDelivery(): int
    {
        if ($this->isDelivered) {
            return 0;
        }

        $now = new DateTimeImmutable();
        $diff = $now->diff($this->expectedDeliveryDate);

        return $diff->invert ? -$diff->days : $diff->days;
    }

    /**
     * Get delivery delay in days (if delivered late)
     */
    public function getDeliveryDelay(): int
    {
        if (!$this->isDelivered || !$this->actualDeliveryDate) {
            return 0;
        }

        $diff = $this->expectedDeliveryDate->diff($this->actualDeliveryDate);
        return $diff->invert ? $diff->days : 0;
    }

    /**
     * Mark as delivered
     */
    public function markDelivered(DateTimeImmutable $actualDeliveryDate, string $status = 'delivered'): self
    {
        return new self(
            materialName: $this->materialName,
            materialType: $this->materialType,
            quantity: $this->quantity,
            unit: $this->unit,
            supplierId: $this->supplierId,
            supplierName: $this->supplierName,
            orderDate: $this->orderDate,
            expectedDeliveryDate: $this->expectedDeliveryDate,
            cost: $this->cost,
            priority: $this->priority,
            specifications: $this->specifications,
            qualityRequirements: $this->qualityRequirements,
            isDelivered: true,
            actualDeliveryDate: $actualDeliveryDate,
            deliveryStatus: $status
        );
    }

    /**
     * Update delivery status
     */
    public function updateStatus(string $status): self
    {
        return new self(
            materialName: $this->materialName,
            materialType: $this->materialType,
            quantity: $this->quantity,
            unit: $this->unit,
            supplierId: $this->supplierId,
            supplierName: $this->supplierName,
            orderDate: $this->orderDate,
            expectedDeliveryDate: $this->expectedDeliveryDate,
            cost: $this->cost,
            priority: $this->priority,
            specifications: $this->specifications,
            qualityRequirements: $this->qualityRequirements,
            isDelivered: $this->isDelivered,
            actualDeliveryDate: $this->actualDeliveryDate,
            deliveryStatus: $status
        );
    }

    /**
     * Get cost per unit
     */
    public function getCostPerUnit(): Money
    {
        if ($this->quantity <= 0) {
            return new Money(0, $this->cost->getCurrency());
        }

        return new Money(
            (int) ($this->cost->getAmount() / $this->quantity),
            $this->cost->getCurrency()
        );
    }

    /**
     * Check if material meets quality requirements
     */
    public function meetsQualityRequirements(array $actualQuality): bool
    {
        foreach ($this->qualityRequirements as $requirement) {
            if (!isset($actualQuality[$requirement])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get delivery urgency level
     */
    public function getUrgencyLevel(): string
    {
        $daysUntil = $this->getDaysUntilDelivery();

        if ($this->isOverdue()) {
            return 'overdue';
        }

        if ($daysUntil <= 1 && $this->isCritical()) {
            return 'urgent';
        }

        if ($daysUntil <= 3 && $this->isHighPriority()) {
            return 'high';
        }

        if ($daysUntil <= 7) {
            return 'medium';
        }

        return 'low';
    }

    public function toArray(): array
    {
        return [
            'material_name' => $this->materialName,
            'material_type' => $this->materialType,
            'quantity' => $this->quantity,
            'unit' => $this->unit,
            'supplier_id' => $this->supplierId,
            'supplier_name' => $this->supplierName,
            'order_date' => $this->orderDate->format('Y-m-d H:i:s'),
            'expected_delivery_date' => $this->expectedDeliveryDate->format('Y-m-d H:i:s'),
            'cost' => [
                'amount' => $this->cost->getAmount(),
                'currency' => $this->cost->getCurrency()
            ],
            'cost_per_unit' => [
                'amount' => $this->getCostPerUnit()->getAmount(),
                'currency' => $this->getCostPerUnit()->getCurrency()
            ],
            'priority' => $this->priority,
            'specifications' => $this->specifications,
            'quality_requirements' => $this->qualityRequirements,
            'is_delivered' => $this->isDelivered,
            'actual_delivery_date' => $this->actualDeliveryDate?->format('Y-m-d H:i:s'),
            'delivery_status' => $this->deliveryStatus,
            'is_overdue' => $this->isOverdue(),
            'days_until_delivery' => $this->getDaysUntilDelivery(),
            'delivery_delay' => $this->getDeliveryDelay(),
            'urgency_level' => $this->getUrgencyLevel()
        ];
    }
}