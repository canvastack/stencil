<?php

namespace App\Domain\Shared\Events;

/**
 * Event Dispatcher Interface
 * 
 * Contract for dispatching domain events.
 * Implementation will be in Infrastructure layer.
 */
interface EventDispatcher
{
    /**
     * Dispatch a domain event
     */
    public function dispatch(DomainEvent $event): void;

    /**
     * Dispatch multiple domain events
     */
    public function dispatchMany(array $events): void;
}