<?php

namespace App\Domain\Payment\Events;

use App\Infrastructure\Persistence\Eloquent\Models\RefundDispute;
use App\Models\PaymentRefund;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RefundDisputeResolved
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public RefundDispute $dispute,
        public PaymentRefund $refund,
        public User $resolvedBy
    ) {}
}