<?php

namespace App\Domain\Order\Entities;

use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Order\ValueObjects\OrderNumber;
use App\Domain\Order\ValueObjects\OrderTotal;
use App\Domain\Order\Enums\OrderStatus;
use DateTime;

class Order
{
    private UuidValueObject $id;
    private UuidValueObject $tenantId;
    private UuidValueObject $customerId;
    private ?UuidValueObject $vendorId;
    private OrderNumber $orderNumber;
    private OrderStatus $status;
    private OrderTotal $total;
    private array $items;
    private ?array $shippingAddress;
    private ?array $billingAddress;
    private ?string $notes;
    private DateTime $createdAt;
    private DateTime $updatedAt;

    public function __construct(
        UuidValueObject $id,
        UuidValueObject $tenantId,
        UuidValueObject $customerId,
        OrderNumber $orderNumber,
        OrderTotal $total,
        OrderStatus $status = OrderStatus::PENDING,
        array $items = [],
        ?UuidValueObject $vendorId = null,
        ?array $shippingAddress = null,
        ?array $billingAddress = null,
        ?string $notes = null,
        ?DateTime $createdAt = null,
        ?DateTime $updatedAt = null
    ) {
        $this->id = $id;
        $this->tenantId = $tenantId;
        $this->customerId = $customerId;
        $this->vendorId = $vendorId;
        $this->orderNumber = $orderNumber;
        $this->status = $status;
        $this->total = $total;
        $this->items = $items;
        $this->shippingAddress = $shippingAddress;
        $this->billingAddress = $billingAddress;
        $this->notes = $notes;
        $this->createdAt = $createdAt ?? new DateTime();
        $this->updatedAt = $updatedAt ?? new DateTime();
    }

    public function getId(): UuidValueObject
    {
        return $this->id;
    }

    public function getTenantId(): UuidValueObject
    {
        return $this->tenantId;
    }

    public function getCustomerId(): UuidValueObject
    {
        return $this->customerId;
    }

    public function getVendorId(): ?UuidValueObject
    {
        return $this->vendorId;
    }

    public function setVendorId(?UuidValueObject $vendorId): self
    {
        $this->vendorId = $vendorId;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function getOrderNumber(): OrderNumber
    {
        return $this->orderNumber;
    }

    public function getStatus(): OrderStatus
    {
        return $this->status;
    }

    public function getTotal(): OrderTotal
    {
        return $this->total;
    }

    public function getItems(): array
    {
        return $this->items;
    }

    public function updateStatus(OrderStatus $status): self
    {
        $this->status = $status;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function isPending(): bool
    {
        return $this->status === OrderStatus::PENDING;
    }

    public function isCompleted(): bool
    {
        return $this->status === OrderStatus::COMPLETED;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id->getValue(),
            'tenant_id' => $this->tenantId->getValue(),
            'customer_id' => $this->customerId->getValue(),
            'vendor_id' => $this->vendorId?->getValue(),
            'order_number' => $this->orderNumber->getValue(),
            'status' => $this->status->value,
            'total_amount' => $this->total->getAmount(),
            'currency' => $this->total->getCurrency(),
            'items' => $this->items,
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'updated_at' => $this->updatedAt->format('Y-m-d H:i:s'),
        ];
    }
}