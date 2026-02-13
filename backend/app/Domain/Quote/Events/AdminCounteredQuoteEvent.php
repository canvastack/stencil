<?php

declare(strict_types=1);

namespace App\Domain\Quote\Events;

use App\Domain\Quote\Entities\Quote;

/**
 * AdminCounteredQuoteEvent Domain Event
 * 
 * Fired when admin counters a vendor's counter offer.
 * Listeners can handle notifications, logging, analytics, etc.
 */
class AdminCounteredQuoteEvent
{
    public function __construct(
        public readonly Quote $quote
    ) {}
}
