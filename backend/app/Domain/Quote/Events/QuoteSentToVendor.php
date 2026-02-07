<?php

declare(strict_types=1);

namespace App\Domain\Quote\Events;

use App\Domain\Quote\Entities\Quote;

/**
 * QuoteSentToVendor Domain Event
 * 
 * Fired when a quote is sent to a vendor.
 * Triggers notification workflows.
 */
class QuoteSentToVendor
{
    public function __construct(
        public readonly Quote $quote
    ) {}
}
