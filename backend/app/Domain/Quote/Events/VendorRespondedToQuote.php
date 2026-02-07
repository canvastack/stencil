<?php

declare(strict_types=1);

namespace App\Domain\Quote\Events;

use App\Domain\Quote\Entities\Quote;

/**
 * VendorRespondedToQuote Domain Event
 * 
 * Fired when a vendor responds to a quote (accept, reject, or counter).
 * Triggers admin notifications.
 */
class VendorRespondedToQuote
{
    public function __construct(
        public readonly Quote $quote,
        public readonly string $responseType
    ) {}
}
