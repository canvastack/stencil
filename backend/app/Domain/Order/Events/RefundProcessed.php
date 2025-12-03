<?php

namespace App\Domain\Order\Events;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RefundProcessed
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Order $order,
        public float $refundAmount,
        public string $refundMethod,
        public ?string $transactionReference = null
    ) {}
}
