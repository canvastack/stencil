<?php

namespace App\Infrastructure\Events;

use App\Domain\Shared\Events\DomainEvent;
use App\Domain\Shared\Events\EventDispatcher;
use Illuminate\Contracts\Events\Dispatcher as LaravelDispatcher;

/**
 * Laravel Event Dispatcher Implementation
 * 
 * Adapts Laravel's event system for domain events.
 */
class LaravelEventDispatcher implements EventDispatcher
{
    public function __construct(
        private readonly LaravelDispatcher $dispatcher
    ) {}

    public function dispatch(DomainEvent $event): void
    {
        $this->dispatcher->dispatch($event);
    }

    public function dispatchMany(array $events): void
    {
        foreach ($events as $event) {
            $this->dispatch($event);
        }
    }
}