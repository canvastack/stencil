<?php

namespace App\Domain\Customer\Events;

use App\Domain\Shared\Events\DomainEvent;
use App\Domain\Customer\Entities\Customer;
use DateTimeImmutable;

/**
 * Customer Created Event
 * 
 * Domain event fired when a new customer is created.
 * Used for triggering side effects like notifications, audit logging, etc.
 */
class CustomerCreated implements DomainEvent
{
    private DateTimeImmutable $occurredAt;

    public function __construct(
        private Customer $customer
    ) {
        $this->occurredAt = new DateTimeImmutable();
    }

    public function getCustomer(): Customer
    {
        return $this->customer;
    }

    public function getOccurredAt(): DateTimeImmutable
    {
        return $this->occurredAt;
    }

    public function getEventName(): string
    {
        return 'customer.created';
    }

    public function getAggregateId(): string
    {
        return $this->customer->getId()->getValue();
    }

    public function getTenantId(): string
    {
        return $this->customer->getTenantId()->getValue();
    }

    public function getPayload(): array
    {
        return [
            'customer_id' => $this->customer->getId()->getValue(),
            'customer_name' => $this->customer->getName(),
            'customer_email' => $this->customer->getEmail(),
            'customer_company' => $this->customer->getCompany(),
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