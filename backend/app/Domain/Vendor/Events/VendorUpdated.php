<?php

namespace App\Domain\Vendor\Events;

use App\Domain\Shared\Events\DomainEvent;
use App\Domain\Vendor\Entities\Vendor;
use DateTimeImmutable;

/**
 * Vendor Updated Event
 * 
 * Domain event fired when vendor information is updated.
 * Used for triggering side effects like notifications, audit logging, etc.
 */
class VendorUpdated implements DomainEvent
{
    private DateTimeImmutable $occurredAt;

    public function __construct(
        private Vendor $vendor
    ) {
        $this->occurredAt = new DateTimeImmutable();
    }

    public function getVendor(): Vendor
    {
        return $this->vendor;
    }

    public function getOccurredAt(): DateTimeImmutable
    {
        return $this->occurredAt;
    }

    public function getEventName(): string
    {
        return 'vendor.updated';
    }

    public function getAggregateId(): string
    {
        return $this->vendor->getId()->getValue();
    }

    public function getTenantId(): string
    {
        return $this->vendor->getTenantId()->getValue();
    }

    public function getPayload(): array
    {
        return [
            'vendor_id' => $this->vendor->getId()->getValue(),
            'vendor_name' => $this->vendor->getName(),
            'vendor_email' => $this->vendor->getEmail(),
            'vendor_company' => $this->vendor->getCompany(),
            'capabilities' => $this->vendor->getCapabilities(),
            'tenant_id' => $this->getTenantId(),
        ];
    }

    public function toArray(): array
    {
        return [
            'event_name' => $this->getEventName(),
            'aggregate_id' => $this->getAggregateId(),
            'tenant_id' => $this->getTenantId(),
            'occurred_at' => $this->occurredAt->format('Y-m-d H:i:s'),
            'payload' => $this->getPayload(),
        ];
    }
}