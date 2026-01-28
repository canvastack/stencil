<?php

namespace App\Domain\Shared\Events;

use Illuminate\Contracts\Events\Dispatcher as LaravelEventDispatcher;

class EventDispatcher
{
    public function __construct(
        private LaravelEventDispatcher $dispatcher
    ) {}

    public function dispatch(object $event): void
    {
        $this->dispatcher->dispatch($event);
    }
}