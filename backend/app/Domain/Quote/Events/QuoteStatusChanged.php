<?php

declare(strict_types=1);

namespace App\Domain\Quote\Events;

use App\Domain\Quote\Entities\Quote;
use App\Domain\Quote\ValueObjects\QuoteStatus;

/**
 * QuoteStatusChanged Domain Event
 * 
 * Fired when a quote's status changes.
 * Listeners can handle notifications, workflow triggers, etc.
 */
class QuoteStatusChanged
{
    public function __construct(
        public readonly Quote $quote,
        public readonly QuoteStatus $oldStatus,
        public readonly QuoteStatus $newStatus
    ) {}
}
