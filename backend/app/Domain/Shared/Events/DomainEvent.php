<?php

namespace App\Domain\Shared\Events;

use DateTimeImmutable;

/**
 * Domain Event Interface
 * 
 * Base contract for all domain events in the system.
 * Ensures consistent event structure and metadata.
 * 
 * Database Integration:
 * - Events can be stored for audit trails
 * - Provides consistent event identification
 * - Supports event sourcing patterns
 */
interface DomainEvent
{
    /**
     * Get when the event occurred
     */
    public function getOccurredAt(): DateTimeImmutable;

    /**
     * Get the event name/type
     */
    public function getEventName(): string;

    /**
     * Get the aggregate root ID that this event relates to
     */
    public function getAggregateId(): string;

    /**
     * Get event payload for serialization
     */
    public function getPayload(): array;
}