<?php

namespace App\Domain\Order\Events;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderSlaEscalated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Order $order,
        public string $status,
        public ?string $level,
        public ?string $channel,
        public string $triggeredAt
    ) {}
}
