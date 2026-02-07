<?php

declare(strict_types=1);

namespace App\Domain\Quote\Events;

use App\Domain\Quote\Entities\Quote;

/**
 * QuoteCreated Domain Event
 * 
 * Fired when a new quote is created.
 * Listeners can handle notifications, logging, analytics, etc.
 */
class QuoteCreated
{
    public function __construct(
        public readonly Quote $quote
    ) {}
}
