<?php

namespace App\Domain\Payment\Events;

use App\Models\PaymentRefund;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RefundRejected
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public PaymentRefund $refund,
        public int $rejectedBy,
        public string $reason
    ) {}
}