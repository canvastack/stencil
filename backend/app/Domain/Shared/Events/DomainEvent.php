<?php

namespace App\Domain\Shared\Events;

use Carbon\Carbon;

/**
 * Base Domain Event
 * 
 * Abstract base class for all domain events.
 * Provides common functionality and structure.
 */
abstract class DomainEvent
{
    public readonly Carbon $occurredAt;

    public function __construct()
    {
        $this->occurredAt = now();
    }

    /**
     * Convert the event to array representation
     */
    abstract public function toArray(): array;

    /**
     * Get event name for dispatching
     */
    public function getEventName(): string
    {
        return class_basename(static::class);
    }
}