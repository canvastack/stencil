<?php

namespace App\Domain\Payment\Events;

use App\Models\PaymentRefund;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RefundFailed
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public PaymentRefund $refund,
        public string $errorCode,
        public string $errorMessage,
        public array $gatewayResponse = [],
        public ?string $failureReason = null
    ) {
        $this->failureReason = $failureReason ?? $errorMessage;
    }
}