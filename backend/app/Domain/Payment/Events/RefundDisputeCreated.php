<?php

namespace App\Domain\Payment\Events;

use App\Infrastructure\Persistence\Eloquent\Models\RefundDispute;
use App\Models\PaymentRefund;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RefundDisputeCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public RefundDispute $dispute,
        public PaymentRefund $refund
    ) {}
}