<?php

namespace App\Domain\Order\Events;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QuoteApproved
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Order $order,
        public float $approvedPrice,
        public ?string $approvalNotes = null
    ) {}
}
