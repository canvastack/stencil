<?php

namespace App\Domain\Order\Entities;

use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Shared\ValueObjects\Address;
use App\Domain\Shared\ValueObjects\Timeline;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Enums\PaymentStatus;
use App\Domain\Order\Events\OrderCreated;
use App\Domain\Order\Events\VendorAssigned;
use App\Domain\Order\Events\PaymentReceived;
use App\Domain\Order\Events\OrderStatusChanged;
use DateTimeImmutable;
use InvalidArgumentException;

/**
 * Purchase Order Entity
 * 
 * Core domain entity representing a customer purchase order.
 * Encapsulates business rules and maintains data consistency.
 * 
 * Database Integration:
 * - Maps to orders table
 * - Uses existing field names and structures
 * - Maintains UUID for public identification
 */
class PurchaseOrder
{
    private array $domainEvents = [];

    private function __construct(
        private UuidValueObject $id,
        private UuidValueObject $tenantId,
        private UuidValueObject $customerId,
        private ?UuidValueObject $vendorId,
        private string $orderNumber,
        private OrderStatus $status,
        private PaymentStatus $paymentStatus,
        private Money $totalAmount,
        private Money $downPaymentAmount,
        private Money $totalPaidAmount,
        private array $items,
        private Address $shippingAddress,
        private Address $billingAddress,
        private DateTimeImmutable $requiredDeliveryDate,
        private ?string $customerNotes,
        private array $specifications,
        private Timeline $timeline,
        private array $metadata,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt
    ) {}

    /**
     * Create new purchase order
     */
    public static function create(
        UuidValueObject $tenantId,
        UuidValueObject $customerId,
        string $orderNumber,
        array $items,
        Money $totalAmount,
        Address $deliveryAddress,
        Address $billingAddress,
        DateTimeImmutable $requiredDeliveryDate,
        ?string $customerNotes = null,
        array $specifications = [],
        Timeline $timeline = null,
        array $metadata = []
    ): self {
        $id = UuidValueObject::generate();
        $now = new DateTimeImmutable();
        
        // Calculate down payment (50% minimum for PT CEX)
        $downPaymentAmount = $totalAmount->percentage(50);
        
        // Create default timeline if not provided
        if ($timeline === null) {
            $estimatedDays = self::calculateEstimatedDays($items);
            $timeline = Timeline::forOrderProduction($now, $estimatedDays);
        }

        $order = new self(
            id: $id,
            tenantId: $tenantId,
            customerId: $customerId,
            vendorId: null,
            orderNumber: $orderNumber,
            status: OrderStatus::PENDING,
            paymentStatus: PaymentStatus::UNPAID,
            totalAmount: $totalAmount,
            downPaymentAmount: $downPaymentAmount,
            totalPaidAmount: Money::zero(),
            items: $items,
            shippingAddress: $deliveryAddress,
            billingAddress: $billingAddress,
            requiredDeliveryDate: $requiredDeliveryDate,
            customerNotes: $customerNotes,
            specifications: $specifications,
            timeline: $timeline,
            metadata: $metadata,
            createdAt: $now,
            updatedAt: $now
        );

        $order->addDomainEvent(new OrderCreated($order));
        
        return $order;
    }

    /**
     * Reconstitute order from persistence data
     */
    public static function reconstitute(
        UuidValueObject $id,
        UuidValueObject $tenantId,
        UuidValueObject $customerId,
        ?UuidValueObject $vendorId,
        string $orderNumber,
        OrderStatus $status,
        PaymentStatus $paymentStatus,
        Money $totalAmount,
        Money $downPaymentAmount,
        Money $totalPaidAmount,
        array $items,
        Address $shippingAddress,
        Address $billingAddress,
        DateTimeImmutable $requiredDeliveryDate,
        ?string $customerNotes,
        array $specifications,
        Timeline $timeline,
        array $metadata,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt
    ): self {
        $order = new self(
            id: $id,
            tenantId: $tenantId,
            customerId: $customerId,
            vendorId: $vendorId,
            orderNumber: $orderNumber,
            status: $status,
            paymentStatus: $paymentStatus,
            totalAmount: $totalAmount,
            downPaymentAmount: $downPaymentAmount,
            totalPaidAmount: $totalPaidAmount,
            items: $items,
            shippingAddress: $shippingAddress,
            billingAddress: $billingAddress,
            requiredDeliveryDate: $requiredDeliveryDate,
            customerNotes: $customerNotes,
            specifications: $specifications,
            timeline: $timeline,
            metadata: $metadata,
            createdAt: $createdAt,
            updatedAt: $updatedAt
        );

        // Don't add domain events for reconstituted entities
        return $order;
    }

    /**
     * Assign vendor to order
     */
    public function assignVendor(UuidValueObject $vendorId, array $vendorQuote): void
    {
        $this->guardAgainstInvalidStatusForVendorAssignment();
        
        $this->vendorId = $vendorId;
        $this->status = OrderStatus::VENDOR_NEGOTIATION;
        $this->updatedAt = new DateTimeImmutable();
        
        // Update metadata with vendor quote
        $this->metadata['vendor_quote'] = $vendorQuote;
        
        $this->addDomainEvent(new VendorAssigned($this, $vendorId, $vendorQuote));
    }

    /**
     * Record payment for order
     */
    public function recordPayment(Money $amount, string $method, string $reference, string $type = 'customer_payment'): void
    {
        $this->guardAgainstInvalidPaymentAmount($amount);
        
        $previousPaidAmount = $this->totalPaidAmount;
        $this->totalPaidAmount = $this->totalPaidAmount->add($amount);
        
        // Update payment status based on amount paid
        $this->updatePaymentStatus();
        
        // Update order status if payment is complete
        if ($this->paymentStatus === PaymentStatus::PAID && $this->status === OrderStatus::AWAITING_PAYMENT) {
            $this->changeStatus(OrderStatus::FULL_PAYMENT);
        } elseif ($this->paymentStatus === PaymentStatus::PAID && $this->status === OrderStatus::PARTIAL_PAYMENT) {
            $this->changeStatus(OrderStatus::FULL_PAYMENT);
        } elseif ($this->paymentStatus === PaymentStatus::PARTIALLY_PAID && $this->status === OrderStatus::AWAITING_PAYMENT) {
            $this->changeStatus(OrderStatus::PARTIAL_PAYMENT);
        }
        
        $this->updatedAt = new DateTimeImmutable();
        
        $this->addDomainEvent(new PaymentReceived($this, $amount, $method, $reference));
    }

    /**
     * Change order status
     */
    public function changeStatus(OrderStatus $newStatus, ?string $reason = null): void
    {
        $this->guardAgainstInvalidStatusTransition($newStatus);
        
        $previousStatus = $this->status;
        $this->status = $newStatus;
        $this->updatedAt = new DateTimeImmutable();
        
        // Update timeline based on status
        $this->updateTimelineForStatus($newStatus);
        
        $this->addDomainEvent(new OrderStatusChanged(
            $this->id, 
            $this->tenantId, 
            $previousStatus->value, 
            $newStatus->value, 
            null, 
            $reason
        ));
    }

    /**
     * Check if order can assign vendor
     */
    public function canAssignVendor(): bool
    {
        return $this->status->allowsVendorAssignment();
    }

    /**
     * Check if order can receive payment
     */
    public function canReceivePayment(): bool
    {
        return $this->status->allowsPayment() && $this->paymentStatus->allowsAdditionalPayment();
    }

    /**
     * Get remaining payment amount
     */
    public function getRemainingAmount(): Money
    {
        return $this->totalAmount->subtract($this->totalPaidAmount);
    }

    /**
     * Check if order is overdue
     */
    public function isOverdue(): bool
    {
        $now = new DateTimeImmutable();
        return $now > $this->requiredDeliveryDate && !$this->status->isTerminal();
    }

    /**
     * Get order progress percentage
     */
    public function getProgressPercentage(): float
    {
        return $this->timeline->getProgressPercentage();
    }

    // Getters
    public function getId(): UuidValueObject { return $this->id; }
    public function getTenantId(): UuidValueObject { return $this->tenantId; }
    public function getCustomerId(): UuidValueObject { return $this->customerId; }
    public function getVendorId(): ?UuidValueObject { return $this->vendorId; }
    public function getOrderNumber(): string { return $this->orderNumber; }
    public function getStatus(): OrderStatus { return $this->status; }
    public function getPaymentStatus(): PaymentStatus { return $this->paymentStatus; }
    public function getTotalAmount(): Money { return $this->totalAmount; }
    public function getTotal(): Money { return $this->totalAmount; } // Alias for backward compatibility
    public function getDownPaymentAmount(): Money { return $this->downPaymentAmount; }
    public function getTotalPaidAmount(): Money { return $this->totalPaidAmount; }
    public function getItems(): array { return $this->items; }
    public function getShippingAddress(): Address { return $this->shippingAddress; }
    public function getBillingAddress(): Address { return $this->billingAddress; }
    public function getRequiredDeliveryDate(): DateTimeImmutable { return $this->requiredDeliveryDate; }
    public function getCustomerNotes(): ?string { return $this->customerNotes; }
    public function getSpecifications(): array { return $this->specifications; }
    public function getTimeline(): Timeline { return $this->timeline; }
    public function getMetadata(): array { return $this->metadata; }
    public function getCreatedAt(): DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): DateTimeImmutable { return $this->updatedAt; }

    /**
     * Get domain events
     */
    public function getDomainEvents(): array
    {
        return $this->domainEvents;
    }

    /**
     * Clear domain events
     */
    public function clearDomainEvents(): void
    {
        $this->domainEvents = [];
    }

    /**
     * Add domain event
     */
    private function addDomainEvent($event): void
    {
        $this->domainEvents[] = $event;
    }

    /**
     * Update payment status based on paid amount
     */
    private function updatePaymentStatus(): void
    {
        if ($this->totalPaidAmount->isZero()) {
            $this->paymentStatus = PaymentStatus::UNPAID;
        } elseif ($this->totalPaidAmount->equals($this->totalAmount)) {
            $this->paymentStatus = PaymentStatus::PAID;
        } else {
            $this->paymentStatus = PaymentStatus::PARTIALLY_PAID;
        }
    }

    /**
     * Update timeline for status change
     */
    private function updateTimelineForStatus(OrderStatus $status): void
    {
        $milestoneName = match ($status) {
            OrderStatus::IN_PRODUCTION => 'Production Start',
            OrderStatus::QUALITY_CONTROL => 'Quality Control',
            OrderStatus::SHIPPING => 'Packaging & Shipping',
            OrderStatus::COMPLETED => 'Delivery Complete',
            default => null,
        };

        if ($milestoneName) {
            $this->timeline = $this->timeline->completeMilestone($milestoneName);
        }

        if ($status === OrderStatus::COMPLETED) {
            $this->timeline = $this->timeline->markCompleted();
        }
    }

    /**
     * Calculate estimated production days
     */
    private static function calculateEstimatedDays(array $items): int
    {
        $baseDays = 7;
        $complexityDays = 0;

        foreach ($items as $item) {
            if (!empty($item['customization'])) {
                $complexityDays += 2;
            }
            
            $quantity = $item['quantity'] ?? 1;
            if ($quantity > 10) {
                $complexityDays += ceil($quantity / 10);
            }
        }

        return min(max($baseDays + $complexityDays, 5), 30);
    }

    /**
     * Guard against invalid vendor assignment
     */
    private function guardAgainstInvalidStatusForVendorAssignment(): void
    {
        if (!$this->canAssignVendor()) {
            throw new InvalidArgumentException(
                "Cannot assign vendor to order in status: {$this->status->value}"
            );
        }
    }

    /**
     * Guard against invalid payment amount
     */
    private function guardAgainstInvalidPaymentAmount(Money $amount): void
    {
        if ($amount->isZero() || !$amount->isPositive()) {
            throw new InvalidArgumentException('Payment amount must be positive');
        }

        $remainingAmount = $this->getRemainingAmount();
        if ($amount->isGreaterThan($remainingAmount)) {
            throw new InvalidArgumentException(
                "Payment amount ({$amount->format()}) exceeds remaining balance ({$remainingAmount->format()})"
            );
        }
    }

    /**
     * Guard against invalid status transition
     */
    private function guardAgainstInvalidStatusTransition(OrderStatus $newStatus): void
    {
        if (!$this->status->canTransitionTo($newStatus)) {
            throw new InvalidArgumentException(
                "Cannot transition from {$this->status->value} to {$newStatus->value}"
            );
        }
    }
}